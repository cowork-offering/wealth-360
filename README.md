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
  meetings and prepares payments. It cannot approve, release, allocate, send or book.
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
| Wealth 360 MCP server, 15 tools, in the BankingGPT sandbox | Live |
| Desk: queue, case detail, rulebook, summary, staged decisions | Live with the connector; replay without it |
| Five seeded cases on synthetic data (GBP) | Live in the sandbox |
| Deterministic checks: payee, incoming match, KYC status | Live, on Salesforce records |
| Case agent and Review agent writes | Written as the dedicated agent identity by the agent runner: a headless process that signs in with the OAuth 2.0 JWT bearer flow, is woken by a Salesforce platform event when a case needs agent work (with a 15-minute sweep as the safety net), picks the cases whose next step is an agent's, and runs the Case agent and then, separately, the Review agent up to the hand-off to a person. Each agent gets only its own tools; the decision tools are never available to it. Setup is an environment step, see RUNBOOK.md |
| The agents inside your own session | Read-only in effect. If you dispatch them from your seat, Salesforce refuses their writes ("agent tools run only as the agent identity"); they report the steps and checks they would record and you see the work |
| Sending letters and email, booking calendars, moving money, live confirmation of payee, sanctions and ID checks | Outside this connector. Confirming a decision releases the instruction or confirms the meeting in Salesforce; delivery is another system's job |

Everything in the sandbox is synthetic. No real customer data is used.

---

## Versioning

The plugin follows semantic versioning. The version is in
`wealth-360/.claude-plugin/plugin.json` and in `.claude-plugin/marketplace.json`, and both change
together. This is `0.1.0`, the first release.

Cowork does not always refresh a marketplace it has already added. If an update does not appear,
remove the marketplace and add it again, then reinstall the plugin.

---

## Repository layout

```
.claude-plugin/marketplace.json     the marketplace: one plugin, wealth-360
wealth-360/
  .claude-plugin/plugin.json        the plugin manifest and its one connector
  .mcp.json                         intentionally empty: the connector is user-level
  agents/                           wealth-360 (orchestrator), case-agent, review-agent
  skills/                           wealth-360-desk, five journeys, daily-summary
  assets/                           the desk template, desk.json, capabilities.json
  README.md, RUNBOOK.md             plugin notes and the Salesforce side
```

Built by Fabian Goetzens.
