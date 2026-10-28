# Wealth 360 runbook: the Salesforce side

This plugin is the Claude side. The Salesforce side is a separate SFDX project (everything
prefixed `W360`) deployed to the bank's org. Its `README.md` and `DEPLOY-PLAN.md` are the
authority for components, deploy order, rollback and the org-automation risk table. This page is
the short version an administrator needs to stand it up and keep it demo-ready.

## 1. What runs in Salesforce

| Part | What |
|---|---|
| MCP server | `Wealth360` McpServerDefinition, label "Wealth 360", 15 tools, one Apex invocable each. Separate from Customer 360, which is not changed |
| Records | Case record type `W360_Wealth_Servicing` with 22 W360 fields; `W360_Agent_Activity__c` (one row per agent step or human decision, with the cited evidence); `W360_Incoming_Payment__c`; `W360_Fulfilment_Instruction__c`; two W360 fields on Activity for proposed meetings |
| Rules | `W360_Journey__mdt` (five journeys) and `W360_Journey_Step__mdt` (their steps): level, team, SLA, documents, rules, raise-to-L3 conditions, step order, actor, evidence required |
| Decisions | Credit 360's staging object and plan classes, reused unchanged: a staged plan, a plan hash, a single-use token bound to the person, verification by re-query |
| Fence | `W360WriteGuard`: agent tools only as the agent identity; the decision path refuses the agent identity; agents never lower a level or write decision fields |

## 2. Deploy

Follow `DEPLOY-PLAN.md` in the Salesforce project: one metadata deploy (core plus the Lightning
layer) with the W360 test classes, then permission sets, then the MCP server, then the seed.
Rollback is the cleanup script, then the destructive manifest.

## 3. Permission sets and licences

| Who | Needs |
|---|---|
| Relationship manager (the person who decides) | `W360_Relationship_Manager` (holds the `W360_Approve_Release` custom permission). Read access to the Credit 360 staging object's related nCino records, since the staging read selects a Product Package lookup |
| Agent identity | `W360_Agent` (holds `W360_Agent_Actor`; no approve, no release, no staging access, decision fields read-only). If it is an Integration User, it also needs the Salesforce API Integration permission set licence and FSC access |
| The user who runs the seed | **A Financial Services Cloud Standard licence.** The seed writes FSC records and rolls back in full without it. Assign the permission set licence `FinServ_FinancialServicesCloudStandardPsl` and the permission set `FinancialServicesCloudStandard` to that user first |

The relationship manager who uses the live desk also needs FSC access to read accounts, holdings,
life events and KYC. On a sandbox with a single spare FSC Standard licence, give it to the person
who will sign in to the desk.

Never assign `W360_Agent` and `W360_Relationship_Manager` to the same user. A user holding both is
treated as the agent and refused on the decision path.

## 4. Activate the MCP server and the connector

1. Setup › MCP Servers: activate **Wealth 360**.
2. An External Client App serves the connector: per-user OAuth with PKCE for people. In the
   BankingGPT sandbox this is `Claude_Ai_Integration_via_MCP`; its consumer key is the OAuth Client
   ID each person enters in claude.ai (see the repository README).
3. Each person adds the custom connector `Wealth 360` in claude.ai and signs in as themselves.

## 5. Running the agents under their own identity

The agents write as a dedicated agent identity; people read and decide in their own seats.

| Seat | Signs in as | Can |
|---|---|---|
| The person's connector (`Wealth 360` in claude.ai) | the relationship manager, OAuth with PKCE | read, open the desk, stage and confirm decisions |
| The agent runner | the agent identity (the user holding `W360_Agent`), OAuth 2.0 JWT bearer | the Case agent's and the Review agent's reads and writes; never the decision tools |

**The agent runner** is a small headless process on a server the bank controls:

1. It signs in with the JWT bearer flow: a short-lived assertion signed with the runner's private
   key, subject = the agent identity's username, against a dedicated External Client App that holds
   the matching certificate. No browser and no stored password.
2. It is event-driven. A small trigger on Case publishes a platform event, after commit, when a
   W360 case needs agent work: a new case, a customer reply, or a case sent back to `Working`. It
   never publishes for the agent identity's own writes, so the agents cannot wake themselves. The
   runner subscribes to that event through the Salesforce Pub/Sub API (outbound only), waits a few
   seconds per case for related changes to settle, and works the case. It keeps its place in the
   event stream, so a restart misses nothing. A sweep every 15 minutes is the safety net.
3. It picks the W360 cases whose next journey step belongs to an agent. Cases with a person
   (`Needs RM`, `Awaiting authorisation`, `Ready for review`) or waiting on the customer are left
   alone.
4. It runs the Case agent, and then, as a separate process, the Review agent, with this plugin's
   `agents/case-agent.md` and `agents/review-agent.md` as their instructions. The Review agent's
   prompt carries the case id and the journey key only, and it may read the case only as the Review
   agent.
5. Each process gets only its role's Wealth 360 tools. `stage_decision` and `confirm_decision` are
   never given to either; Salesforce refuses them for the agent identity in any case.
6. It stops at the hand-off to the person and re-reads the case after every agent run. Salesforce
   refuses out-of-sequence steps, and a run that changes nothing is not repeated, so a repeated
   signal or an overlapping sweep is safe.

**Salesforce setup for the runner** (an administrator does this):

1. A dedicated External Client App for the runner, separate from the people's connector app: JWT
   bearer flow with the runner's certificate; scopes `api`, `refresh_token` and `mcp_api`; "Issue
   JWT-based access tokens" on (the hosted MCP server accepts only JWT-format access tokens);
   permitted users "Admin approved users are pre-authorized".
2. Pre-authorise the `W360_Agent` permission set on that app, so only the agent identity can use it.
3. Deploy the signal: the platform event, the Case trigger and its test, and Read on the event in
   `W360_Agent` so the agent identity can subscribe.
4. Give the runner the app's consumer key. The private key never leaves the runner's host.

The person's own connector is unchanged. In a relationship manager's seat the agents' writes are
still refused ("agent tools run only as the agent identity"); that is the separation of duties
working.

## 6. Seed, reset and verify

- **Seed**: `sf apex run -f scripts/seed.apex -o <org alias>`, as a user with the FSC Standard
  licence and `W360_Relationship_Manager`. It creates the five cases, their agent activity, the
  incoming payment, instructions, the proposed meeting and the customer records, all synthetic and
  in GBP, all marked W360. It refuses to run twice.
- **Reset**: `scripts/cleanup.apex` removes every W360 data record. Run it with `DRY_RUN = true`
  first and check it finds exactly the seeded rows, then with `DRY_RUN = false`. Seed again for a
  fresh morning.
- **Verify**: the queries in `scripts/verify-seed.soql.md`. Then, signed in as the relationship
  manager, ask the desk "what needs me": five cases, three raised as exceptions (change of details,
  money in, bereavement), money out awaiting authorisation, the complaint response ready for
  review.

## 7. Org behaviour to know

- Some orgs mirror Case, Account, Contact, Event and financial account changes to other systems
  through their own triggers. Check what the target org does with W360 records before seeding.
  Demo data is synthetic.
- The seed and the tools create no EmailMessage records, so complaint-risk email flows are not
  woken.
- A proposed meeting on a case account can wake a meeting-preparation flow in FSC orgs; the cleanup
  script removes what it creates.

## 8. Release the plugin

1. Bump `version` in `wealth-360/.claude-plugin/plugin.json` and in the marketplace entry, together.
2. If the desk changed, replace `assets/wealth-360-template.html` with the published build, and
   keep `assets/capabilities.json` in step with the tools the page calls.
3. `claude plugin validate .` at the repository root and `claude plugin validate wealth-360`.
4. If the canonical desk moved, update `canonicalArtifactUrl` in `assets/desk.json`.
