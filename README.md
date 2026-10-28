# Wealth 360

A wealth-servicing desk for relationship managers, run from Claude over the bank's own Salesforce.

Two agents do the servicing work. Salesforce holds the rules. A named person makes every decision.

This repository is a plugin marketplace with one plugin, `wealth-360`, for Claude Cowork and
Claude Code.

---

## What it is

Wealth 360 works the cases that fill a wealth servicing team's day: a change of address, a
withdrawal, an unallocated credit, a bereavement, a complaint. It has three parts.

- **The desk.** A page in your own claude.ai account. It shows your queue, the cases that need you,
  the agents' progress with the evidence they cited, the rulebook and the day's summary. You decide
  cases on it.
- **Two agents.** The **Case agent** is the maker. It works a case end to end through the journey's
  steps and cites evidence for each one. The **Review agent** checks the case independently, in a
  fresh context, and never sees the Case agent's reasoning. Both run on their own, signed in to
  Salesforce as a dedicated agent identity through a headless runner, and write as that identity.
- **You, the checker.** Every outcome that needs a person comes to you with the exception, the
  evidence and a proposed action. You approve, amend, reject or ask for more.

Salesforce (Financial Services Cloud) holds the journeys, the rules, the records and the audit
trail. The plugin reaches it through one connector, as you: your seat reads and decides. The agents
reach the same server through their own sign-in, as the agent identity: their seat works cases and
never decides.

---

## Install

### Claude Cowork

1. Open the plugins panel and add a marketplace from GitHub: `cowork-offering/wealth-360`.
2. Install **Wealth 360** from that marketplace.
3. Add the connector below, then start a new conversation.

### Claude Code

```
/plugin marketplace add cowork-offering/wealth-360
/plugin install wealth-360@wealth-360
```

Or in one step on Claude Code 2.1.275 or later:

```
/plugin install wealth-360 --marketplace cowork-offering/wealth-360
```

---

## The one connector

Wealth 360 needs exactly one connector. Each person adds it to their own claude.ai account.

| Setting | Value |
|---|---|
| Where | claude.ai › Settings › Connectors › Add custom connector |
| Name | `Wealth 360` (exactly this, with the space) |
| URL | the bank's Wealth 360 MCP server. BankingGPT sandbox: `https://api.salesforce.com/platform/mcp/v1/d/accenture-d8--bankinggpt/sandbox/custom/Wealth360` |
| Advanced settings › OAuth Client ID | the consumer key of the bank's External Client App. BankingGPT sandbox (app `Claude_Ai_Integration_via_MCP`): `3MVG95bilXG9ExQFPfVafsYh_y5a5uSppydv6GCC.unT36dURnDmX35CZam_x3uOs5vSwQuLTDYNSTV_2iL_Y` |
| Client credential field | leave empty. The app uses PKCE |

Then select **Connect** and sign in to Salesforce as yourself. Salesforce sees you, not a shared
account.

**The name matters.** The desk page and the agents call the connector by the name `Wealth 360`. A
connector with any other name is invisible to them, and the desk plays its replay instead.

Wealth 360 does not need the separate Customer 360 connector.

---

## The second connector: Wealth 360 Checks (optional)

A second connector runs the outside checks from chat, as you: sanctions screening, the payee's bank
account, an address and an identity check. It signs in with the same Salesforce login and the same
External Client App as `Wealth 360`, so there is nothing new to register.

| Setting | Value |
|---|---|
| Where | claude.ai › Settings › Connectors › Add custom connector |
| Name | `Wealth 360 Checks` (exactly this) |
| URL | `https://wealth-360-checks.vercel.app/api/mcp` |
| Advanced settings › OAuth Client ID | the same consumer key as `Wealth 360`. BankingGPT sandbox (app `Claude_Ai_Integration_via_MCP`): `3MVG95bilXG9ExQFPfVafsYh_y5a5uSppydv6GCC.unT36dURnDmX35CZam_x3uOs5vSwQuLTDYNSTV_2iL_Y` |
| Client credential field | leave empty. The app uses PKCE |

Then select **Connect** and sign in to Salesforce as yourself. The server accepts only a Salesforce
token for the bank's org, checks it with Salesforce on every new token, and records you on every row
of its check ledger. There is no anonymous access.

| Ask | Tool | Provider |
|---|---|---|
| "Run a sanctions check on the payee." | `screen_party` | UK Sanctions List (FCDO), refreshed with each deploy; the list date is in every result |
| "Verify the payee account." | `verify_payee` | Plaid sandbox: an open-banking account-holder check, not Pay.UK Confirmation of Payee |
| "Validate this address." | `validate_address` | Ideal Postcodes (test postcode `ID1 1QD`) |
| "Start an ID check." | `verify_identity` | Didit sandbox: a hosted document and liveness session for the client |
| "What checks have I run?" | `ledger` | your own rows only |

Every result is reported with its evidence quote, its source and its ledger id, and labelled
sandbox. The payee, address and identity providers are sandboxes on fictional personas: do not send
real client details. A check is evidence for the person, never a decision, and a screening hit
always goes to a person. Claude Code and Cowork use the connector from your claude.ai account.

---

## First run

Start a conversation and say:

> Open my Wealth 360 desk.

The first time, the plugin publishes the desk into your own claude.ai account and gives you the
link. After that it opens the same desk. Colleagues in your organization can open it from the
page's Share control.

**Why your own copy.** The desk reads live data through your own connector. A page that uses a
connector opens with live data only inside the claude.ai organization it was published in. A link
from someone else's organization will not work for you. So the plugin publishes the desk into your
account, and it runs as you.

**Live or replay.** With your `Wealth 360` connector connected, the desk is live: Salesforce data,
real decisions. Without it, or if the name differs, the desk plays a replay of the five-case
morning on synthetic data and writes nothing.

Other things to ask:

- "What needs me?"
- "Walk me through the money in case."
- "Approve the bereavement letter and book Sophie for Thursday at 10."
- "How did today go?"
- "Run a sanctions check on the payee." (needs the `Wealth 360 Checks` connector)

---

## The five journeys

| Journey | What happens | Where the person comes in |
|---|---|---|
| **Change of details** | The Case agent reads the request and the proof of address and compares them with the record. | When the name or date does not match, or bank details changed recently, the case is raised to you with a proposed next step. |
| **Money out** | The agents check the source account, the payee and KYC, and the Case agent prepares the release. | The release waits for a person to authorise it. Agents cannot release money. |
| **Money in** | The Case agent scores candidate accounts for an unallocated credit. The money stays in suspense. | Below the match threshold or above the review limit, you decide: allocate to a named account, or open an investigation. |
| **Bereavement** | The Case agent marks the accounts, stops regular payments, checks documents, drafts a letter to the executor and proposes a one-to-one with the beneficiary. | Always level 3. You approve the letter and book the meeting. It is often the family's first conversation with the bank. |
| **Complaint** | The Case agent finds the cause and drafts the response: apology, cause, fix, referral rights. | You review the draft and approve it for sending. |

Each journey's steps, rules, levels, teams and service levels live in Salesforce custom metadata.
The plugin reads them live; it does not carry its own copy.

---

## Governance

- **Agents prepare. People decide.** The Case agent completes steps, drafts letters, proposes
  meetings and prepares payments. It cannot approve, release, allocate or book, and the only thing
  it may send is a fenced request for missing documents (see Email in and out).
- **Independent review.** The Review agent reads the case in a fresh context. Salesforce withholds
  the Case agent's reasoning from it. A failed check sends the case back as rework.
- **Stage, confirm, verify.** Every decision is staged first. The plan and its warnings are shown
  to you word for word. Nothing happens until you confirm by name. The decision then runs behind a
  single-use token, bound to the plan and to you, and each write is checked by reading it back.
- **Salesforce enforces it.** Agent tools run only as the agent identity. The decision tools refuse
  the agent identity outright. Steps out of sequence, steps without required evidence and attempts
  to lower a level are refused.
- **Two identities, two seats.** Your connector signs in as you, so Salesforce applies your sharing
  and permissions and records you as the decider. The agents sign in as a dedicated agent identity
  (a Salesforce integration user holding the `W360_Agent` permission set), so every step, draft and
  check they write is recorded against that identity, never against a person. The agent identity
  has no decision permission, and the person's seat cannot make agent writes.

---

## What is live and what is replay

| Part | Status |
|---|---|
| Wealth 360 MCP server, 16 tools, in the BankingGPT sandbox | Live |
| Desk: queue, case detail, rulebook, summary, staged decisions | Live with the connector; replay without it |
| Five seeded storyboard cases plus five demo-suite cases on synthetic data (GBP) | Live in the sandbox |
| Deterministic checks: payee, incoming match, KYC status | Live, on Salesforce records |
| Agent runner, real time | Live. A Salesforce platform event wakes the runner about 1 to 2 seconds after a W360 case needs agent work (new case, customer reply, sent back to `Working`). The listener waits 10 seconds of quiet per case, then works it. A sweep every 2 minutes is the safety net |
| Case agent and Review agent writes | Live, written as the dedicated agent identity by the agent runner (OAuth 2.0 JWT bearer, no browser). Each agent gets only its own tools; the decision tools are never available to it. Setup is an environment step, see RUNBOOK.md |
| Outside checks: sanctions screening, payee account-holder check, address validation, identity verification | Live against sandboxes through an aggregation server the runner connects (UK sanctions list, Plaid sandbox, Ideal Postcodes, Didit sandbox). Without it, the agents say which checks they could not run |
| Outside checks from chat (`Wealth 360 Checks` connector) | Live on Vercel since 28 October: the same checks as a hosted server with Salesforce sign-in, for the person's own seat. See "The second connector" |
| Email intake | Live in the sandbox: an Apex Email Service turns a client's email into a W360 case or files a reply on its case (rules below). Proven with simulated emails; the first real inbound email is still to be tested |
| Branded email out | Live when a person releases it through the desk. Agent auto-send of document requests is live and fenced (allowlisted domains only): proven on 28 October, case 00001369 |
| Log a request (`log_request`, skill `log-request`, desk button) | Live: a person logs a phone, branch, letter or email request as a case and the agents start on it within seconds. People only |
| The agents inside your own session | Read-only in effect. If you dispatch them from your seat, Salesforce refuses their writes ("agent tools run only as the agent identity"); they report the steps and checks they would record and you see the work |
| Booking calendars, moving money, posting letters | Outside this connector. Confirming a decision releases the instruction or confirms the meeting in Salesforce; delivery is another system's job |

Everything in the sandbox is synthetic. No real customer data is used.

---

## Running the agents: the admin app

The agent runner reads one control record in Salesforce every minute. Admins holding the
`W360_Agent_Admin` permission set steer it from the **Wealth 360 Admin** app:

- **Agent control.** Pause or resume the agents, Run now, the sweep interval, working hours
  (Europe/London), one switch per journey, the most cases per run and the most model spend per day,
  with the status: last run, next run, running now, spend today.
- **Runs.** The run log: one row per run (trigger, status, cases, steps, hand-offs, errors, cost,
  duration) and one row per case worked, with the agent's own report.
- **Rulebook.** The journeys and their steps, read only.
- **Audit.** Every agent step and person decision across cases, filterable by actor, journey,
  outcome and date.

- **Client email.** The switch for agent auto-send of document requests (off until the bank
  turns it on).

Relationship managers see one read-only line on each case page: "Agents last ran 14:02, next 14:04"
or "Agents paused". The `wealth-360-admin` skill explains these steps in chat; the connector has no
tools for them, so changes are made in the app.

When an aggregation server for outside checks (screening, confirmation of payee, identity, address)
is connected, both agents use its read and check tools and cite their results. Without it they work
from the Salesforce checks and say which outside checks they could not run.

---

## Email in and out

**In.** The bank's intake address is a Salesforce Email Service. Each email is routed in this order:

1. **A reply.** The subject carries the case reference `[W360-<case number>]`, or the footer carries
   the thread token `W360REF-...`. The email and its attachments are filed on that case. A case in
   `Waiting on customer` goes back to `Working` and the agents restart within seconds. A case that is
   with a person keeps its state; the reply waits on the case for them.
2. **A known client.** The sender's address matches exactly one client email: a new W360 case for
   that client.
3. **Several matches or an unknown sender.** A case for a person (level 3), never worked by agents.
4. **Authenticity.** The sender counts as authenticated when DKIM passes for the sender's domain,
   or SPF and DKIM both pass. A forwarded email keeps DKIM, so forwarding a short address to the
   intake works. Otherwise the case is raised to level 3 with the reason.
5. **Journey.** Keyword rules set the journey when exactly one rule fires; otherwise the Case agent
   classifies the case as its first step.

No EmailMessage records are created; the email is stored as a file on the case.

**Out.** Every bank email goes out on the Wealth Servicing letterhead (document request, address
change confirmation, bereavement, payment confirmation, complaint response, decision letter,
general), with the case reference in the subject and the thread token in the footer, so the reply
finds its case. Reply-To is the intake address (or a configured short address that forwards to it).

- **A person's release.** Confirming a decision on the desk sends the released email.
- **Agent auto-send, document requests only.** When the bank switches it on in the admin app, the
  Case agent's request for missing documents goes out without a person, fenced in Salesforce: a
  Document request only, by email only, to exactly one address that is the client's email on record
  and on the bank's allowlisted domains, at most three per case per day, and the only link it may
  carry is an identity verification session. Anything else waits for a person. After a document
  request the case waits on the customer; the reply restarts it.

---

## Logging a request

A request that did not arrive by email (a call, a branch visit, a letter) becomes a case from chat
or from the desk:

- In chat: "log a request for James Okafor: he called, he has moved to 2 Barons Court Road, London
  ID1 1QD". The `log-request` skill calls `log_request` as you.
- On the desk: **Log request** on Cases opens a short form: client, channel, request.

The case is the same one the email intake makes, owned by you, and the agents start on it within
seconds. If the name matches no one or several clients, nothing is created and you pick from the
list. Only people can log requests: Salesforce refuses the agent identity.

## Demo cases

Five cases, each worked end to end by the runner without a person stepping in, as the live proof:

| Case | Journey | Outside checks used | Ends at |
|---|---|---|---|
| Eleanor Whitfield, money out | Money out | payee check, KYC, confirmation of payee, sanctions | Awaiting authorisation, level 2 |
| £18,500 from James Okafor | Money in | incoming match 93%, sanctions, confirmation of payee | With the checker, proposed: allocate to the ISA |
| Priya Raman, change of address | Change of details | address validation, identity verification session | With the person, level 3, address held, identity link proposed |
| £22,000 to Henry Lockwood | Money in | incoming match 93%, sanctions possible match | With the person, level 3, funds in suspense, referred to sanctions review |
| An email from James Okafor | classified as Money out by the Case agent | confirmation of payee, sanctions | Awaiting authorisation, level 2 |

The five storyboard cases (one per journey) are seeded too. All data is synthetic.

---

## Versioning

The plugin follows semantic versioning. The version is in
`wealth-360/.claude-plugin/plugin.json` and in `.claude-plugin/marketplace.json`, and both change
together. This is `0.2.0`. See `CHANGELOG.md`.

Cowork does not always refresh a marketplace it has already added. If an update does not appear,
remove the marketplace and add it again, then reinstall the plugin.

---

## Repository layout

```
.claude-plugin/marketplace.json     the marketplace: one plugin, wealth-360
CHANGELOG.md                        what changed in each version
wealth-360/
  .claude-plugin/plugin.json        the plugin manifest and its one connector
  .mcp.json                         intentionally empty: the connector is user-level
  agents/                           wealth-360 (orchestrator), case-agent, review-agent
  skills/                           wealth-360-desk, five journeys, daily-summary, wealth-360-admin, outside-checks, log-request
  assets/                           the desk template, desk.json, capabilities.json
  README.md, RUNBOOK.md             plugin notes and the Salesforce side
```

Built by Fabian Goetzens.
