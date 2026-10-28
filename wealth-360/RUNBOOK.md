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

People sign in as themselves, so in a relationship manager's seat the Case agent's and the Review
agent's writes are refused ("agent tools run only as the agent identity"). That is the separation
of duties working. To let the agents write, run them where the connector is signed in as the agent
identity (the user holding `W360_Agent`), for example a separate seat or runtime that signs in to
the same MCP server as that user (the deploy plan names JWT bearer for it). The person's own seat
keeps the decision tools; the agent's seat never gets them.

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
