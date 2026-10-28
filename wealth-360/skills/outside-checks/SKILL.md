---
name: outside-checks
description: Run an outside check from the person's own seat through the "Wealth 360 Checks" connector (a second claude.ai custom connector, signed in with the same Salesforce login as "Wealth 360") and report the result cited and labelled as a sandbox check. Four checks. Sanctions screening against the UK Sanctions List (screen_party), payee account-holder verification through Plaid sandbox (verify_payee, an open-banking check, not Pay.UK Confirmation of Payee), UK address validation through Ideal Postcodes (validate_address) and an identity verification session through Didit sandbox (verify_identity). Plus the person's own check history (ledger). Use for "run a sanctions check on the payee", "screen the remitter", "verify the payee account", "check the payee's bank details", "validate this address", "is this postcode right", "start an ID check", "send the client an identity check", "what checks have I run". Reads the inputs from the case through the "Wealth 360" connector when a case is in play. A check is evidence, never a decision: it does not move a case, and a screening hit always goes to a person.
---

# Outside checks (Wealth 360 Checks)

The outside half of a servicing check, run as the signed-in person. The Salesforce checks
(`W360PayeeCheck`, `W360KycStatus`, `W360IncomingMatch`) are the internal half; they stay where
they are. This skill adds the provider checks and reports them with their evidence.

## The connector

A claude.ai custom connector named exactly **`Wealth 360 Checks`** (URL
`https://wealth-360-checks.vercel.app/api/mcp`, signed in with Salesforce; setup in the README).
The host may namespace its tools (`mcp__claude_ai_Wealth_360_Checks__screen_party`, or a connector
id prefix in Cowork), so match on the tool name suffix and never hardcode a prefix. Under the agent
runner the same tools come from the server `aggregation`; they are the same tools with the same
answers.

If no tool ending in `screen_party`, `verify_payee`, `validate_address` or `verify_identity` is
available, say so in one line: "The Wealth 360 Checks connector is not connected, so I cannot run
that check." Point to the README section "The second connector". Never answer a check from memory,
from the Salesforce checks alone, or by reasoning about the name.

## The tools

Every tool takes `caseId` (pass the W360 case id when there is one) and returns the envelope
`{ ok, result, error: { code, message, resumable }, ledger_id }`. The answer is in
`structuredContent` (the same JSON is in the text content).

| Ask | Tool | Inputs | Outcome field |
|---|---|---|---|
| "run a sanctions check on the payee", "screen the remitter" | `screen_party` | `name`, optional `dob` (YYYY-MM-DD or YYYY), `country` | `result.result`: `clear`, `possible_match`, `match`; `result.matches[]` |
| "verify the payee account", "check the payee's bank details" | `verify_payee` | `account_holder_name`, `sort_code` (6 digits), `account_number` (8 digits) | `result.match_result`: `match`, `partial_match`, `no_match`, `match_not_possible`; `numbers_match`, `name_match`, `matched_name` |
| "validate this address" | `validate_address` | `postcode`, `line1` | `result.address_match`: `match`, `close`, `no_match`, `postcode_not_found`; `matched_address` |
| "start an ID check" | `verify_identity` | `full_name` (the name on record); later `session_id` to read the decision | `result.status`: `pending` with `verification_url`; then `result.result`: `verified`, `needs_review`, `failed`, `pending` |
| "what checks have I run" | `ledger` | optional `caseId`, `limit` | `result.entries[]`, only the signed-in person's own rows |

## Getting the inputs

1. **From the message.** Use what the person gave you, exactly as given.
2. **From the case.** When the person names a case or one is open on the desk, read it through the
   `Wealth 360` connector (`W360CaseDetail` for the person's view, `W360ClientSnapshot` for the
   client, nominated accounts and address on record). The payee or remitter details are in the case
   description and the instruction; the new address is in the request. Say which fields you took
   from where.
3. **Still missing.** Ask for exactly the missing field in one question. Never guess a sort code,
   an account number, a date of birth or a postcode.

Fictional sandbox personas only. Do not send a real person's details to these providers.

## Reporting a result

Lead with the outcome in one line, then the evidence, then the label. Use this shape:

> **Sanctions screening (sandbox service): clear.** No designation on the UK Sanctions List scored
> 0.86 or more for "Timothy Norton". Top score 0. List dated 2026-10-16.
> Source: UK Sanctions List (FCDO) dated 2026-10-16, OGL v3; wealth-experience fuzzy matcher.
> Ledger: `<ledger_id>`.

Rules:
- **Cite.** Quote `result.evidence.quote` word for word, give `result.evidence.source` as the
  source and the `ledger_id`. These three lines are what a step or a review would carry as evidence.
- **Label it sandbox.** Every result carries "(sandbox)" in its first line. Payee, address and
  identity results come from provider sandboxes on fictional personas (`result.mode` is `sandbox`
  or `live` against a sandbox key). Screening runs on the public UK Sanctions List, inside the
  sandbox service: say the list date.
- **Do not recompute.** The outcome is computed by the server or the provider. Never round, rescore,
  override or soften it. A `partial_match` is not a match; say what the bank holds
  (`matched_name`).
- **Screening hits go to a person.** A `possible_match` or `match` is never cleared in chat. Quote
  the list entry (id, name, matched alias, regime, listed date, score) and say a person must review
  it. A common name will often produce a possible match on an alias; that is expected.
- **Payee check wording.** Call it an open-banking account-holder check. It is not Pay.UK
  Confirmation of Payee, even though the result carries a familiar `copResult` label.
- **Identity.** `pending` means a session was created for the customer to complete; it is not a
  pass. Give the `verification_url` only to the person, and only to send to the client through the
  bank's document request (the Case agent's `draft_communication`), never in chat to anyone else.
  To read the outcome later, call `verify_identity` again with `session_id`.
- **Failures.** `ok: false` is not a pass. Quote `error.code` and `error.message`. `NOT_CONFIGURED`
  means the provider key is missing on the server: no check was run. A 401 from the connector means
  the person must reconnect it (Settings > Connectors > Wealth 360 Checks > Connect).

## What this does not do

- It does not write to Salesforce. In the person's seat `submit_step` and `record_review` belong to
  the agents. When the person wants the result on the case, say that the Case agent records it as
  step evidence when it works the case, or that the person can note it in the decision note when
  they decide.
- It does not decide. A clear screening or a payee match is evidence for the person, who still
  decides through the staged path.
