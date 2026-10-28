# Wealth 360 plugin

A wealth-servicing desk for relationship managers over the Salesforce-hosted Wealth 360 MCP
server. Install it from the `cowork-offering/wealth-360` marketplace:

```
/plugin install wealth-360 --marketplace cowork-offering/wealth-360
```

The repository README covers install, the connector and the journeys in full. This page covers
how the plugin itself is put together. The Salesforce side is in `RUNBOOK.md`.

## One connector, by exact name

| Connector | What it is | Tools |
|---|---|---|
| `Wealth 360` | Custom connector to the bank's Wealth 360 MCP server. OAuth Client ID = the bank's External Client App consumer key; client credential field empty; PKCE; each person signs in as themselves | 16 |

`.mcp.json` is intentionally empty. The connector is user-level so each person signs in as
themselves and no endpoint or auth flow ships inside the plugin.

## How the desk opens

**One desk per viewer's own account.** The desk page declares a runtime capability (the viewer's
`Wealth 360` connector), and such a page opens with live data only inside the claude.ai
organization it was published in. People who install this plugin are in their own organizations,
so the `wealth-360-desk` skill publishes the bundled template into each viewer's own account,
unless it finds one they already have.

It resolves in order and stops at the first that answers: the URL this session published; the most
recently updated artifact titled exactly `Wealth 360` that the viewer owns or is shared (one list,
one read); the `canonicalArtifactUrl` in `assets/desk.json`, only if it reads for this viewer;
otherwise a publish of `assets/wealth-360-template.html` with `assets/capabilities.json` passed
whole, title `Wealth 360`, icon `briefcase` on the first publish only.

The page then reads live through the viewer's connector. Without it, it plays its built-in replay.

## Agents

| Agent | Role | Wealth 360 tools |
|---|---|---|
| `wealth-360` | orchestrator in the person's session | all reads; `stage_decision` and `confirm_decision` only on the named person's word; never the four agent writes |
| `case-agent` | maker | `W360CaseContext`, `W360Rulebook`, `W360ClientSnapshot`, `W360KycStatus`, `W360PayeeCheck`, `W360IncomingMatch`, `submit_step`, `draft_communication`, `propose_meeting` |
| `review-agent` | independent check, fresh context | `W360CaseContext` (as `Review agent`), `W360Rulebook`, `W360ClientSnapshot`, `W360KycStatus`, `W360PayeeCheck`, `W360IncomingMatch`, `record_review`. Never `W360CaseDetail`, `W360Queue` or `W360Summary`, which carry the maker's reasoning or conclusions |

**Where the agents write.** The Case agent and the Review agent write as a dedicated agent identity,
run by the agent runner outside the person's session (RUNBOOK.md, section 5). The same agent files
are the runner's instructions. Dispatched from a person's own seat, the agents can read but their
writes are refused; the person's seat reads and decides.

Each agent file states its tool list as a contract and also lists the forbidden tools in
`disallowedTools` under the Claude Code connector naming (`mcp__claude_ai_Wealth_360__<tool>`).
Hosts that prefix connector tools differently rely on the contract and on Salesforce, which
enforces the split in code either way.

## Skills

| Skill | Trigger phrases |
|---|---|
| `wealth-360-desk` | "open my Wealth 360 desk", "what needs me" |
| `change-of-details` | "change of address", "proof of address" |
| `money-out` | "withdrawal", "encashment", "authorise the release" |
| `money-in` | "unallocated credit", "allocate the payment" |
| `bereavement` | "has died", "estate of", "meet the beneficiary" |
| `complaint` | "complaint", "review the response" |
| `daily-summary` | "how did today go", "daily summary" |
| `log-request` | "log a request for James Okafor", "James called, he has moved to ...", "open a case for ..." (people only; the agents start on the new case at once) |
| `wealth-360-admin` | "pause the agents", "run the agents now", "show the last runs" (holders of `W360_Agent_Admin`; points to the Wealth 360 Admin app, no chat tools) |

Every journey skill follows the same shape: read the case, the Case agent works the steps with
cited evidence, the Review agent checks in a fresh context, the case is raised to the person with a
proposed action, and the person's decision runs stage, plan shown verbatim, named confirmation,
confirm behind the token, re-read to verify.

## Calling convention

Every tool takes `{"inputs":[{...}]}` (`{"inputs":[{}]}` when nothing is required) and answers with
a Flow envelope; the result is the JSON string at `content[0].outputValues.resultJson`.

## Assets

| File | What |
|---|---|
| `assets/wealth-360-template.html` | the desk page, as published (contact details in its replay data are fictional) |
| `assets/capabilities.json` | the page's grant: `Wealth 360` with `W360Queue`, `W360Summary`, `W360CaseDetail`, `W360Rulebook`, `stage_decision`, `confirm_decision`. Passed whole on every publish |
| `assets/desk.json` | the canonical desk URL (a fallback only), the fixed title and icon, and the resolution order |
