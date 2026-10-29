---
name: outside-checks
description: Run an outside check from the person's seat through the "Wealth 360 Checks" connector (same Salesforce login as "Wealth 360") and report it cited and labelled sandbox. Sanctions screening (screen_party, UK Sanctions List), payee account check (verify_payee, Plaid sandbox, not Pay.UK Confirmation of Payee), UK address validation (validate_address, Ideal Postcodes), identity session (verify_identity, Didit sandbox), and the person's check history (ledger). With a case in play, records the result on the case and the client KYC profile with record_check. Use for "run a sanctions check on the payee", "verify the payee account", "validate this address", "start an ID check", "did the client finish the ID check", "what checks have I run". A check is evidence, never a decision: a screening hit always goes to a person.
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

- With a case in play, record the result: call `record_check` on the "Wealth 360" connector with the
  case id, `checkType` (`screening`, `identity_started` when a session is created, `identity` for a
  decision, `address`, `payee`), the provider outcome, the evidence quote, source, `ledger_id`, and for
  identity the `session_id` and `verification_url`. Screening and identity land on the client's KYC
  profile, every check on the case timeline, and a final identity decision on a case waiting on the
  client sends it back to the agents. Without a case, the result stays in the chat and the ledger.
  Open identity sessions also come back by themselves: the agent runner polls Didit every 3 minutes.
- It does not decide. A clear screening or a payee match is evidence for the person, who still
  decides through the staged path.
