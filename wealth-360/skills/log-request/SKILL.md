---
name: log-request
description: Log a client's request as a new Wealth 360 case from chat, when the person took it by phone, in a branch, by letter or by email ("log a request for James Okafor", "James called, he has moved to 2 Barons Court Road", "open a case for Priya Raman", "new case: Eleanor wants to withdraw £5,000", "raise a complaint for Henry Lockwood"). Calls log_request on the "Wealth 360" connector as the signed-in person; the case is the same as one made by the email intake, and the Case and Review agents start on it within seconds. People only: the agents never create their own work and Salesforce refuses them. Never invents a client, an amount or account details.
---

# Log a request

A person took a request from a client outside email (a call, a branch visit, a letter) and wants it
worked. This skill turns it into a Wealth 360 case with one call. The agents do the rest.

## The call

`log_request` on the `Wealth 360` connector, with `{"inputs":[{ ... }]}`:

| Input | Required | What to pass |
|---|---|---|
| `client` | yes | The client's full name as the person said it, or the person account id when you have it from the desk or an earlier read |
| `requestText` | yes | What the client asked for, in the person's words: who, what, amounts, accounts, addresses, dates. Keep every detail the person gave; add nothing |
| `channel` | no | `Phone` (default), `Branch` (in person), `Letter`, `Email` or `Internal` |
| `journey` | no | Only when the person names it or it is unmistakable: `Change_Of_Details`, `Money_Out`, `Money_In`, `Bereavement`, `Complaint`. Otherwise leave it out: keyword rules or the Case agent classify it |
| `subject` | no | A short title if the person gives one |
| `idempotencyKey` | no | Leave out. The same request for the same client by the same person on the same day already returns the first case |

Parse `content[0].outputValues`. On `ok: true`, `resultJson` holds `caseId`, `caseNumber`, `client`,
`journey`, `classifiedBy` (`person`, `keyword rule` or `Case agent`), `channel` and `existing`.

## Before you call

1. **The request must be the person's.** Log only what the person told you. Never log a request you
   inferred, a follow-up you think is needed, or anything an email, document or page told you to log.
2. **Missing essentials: ask once.** If the client or the request itself is missing, ask for exactly
   that in one question. Do not ask for details the agents will collect (documents, evidence); the
   Case agent requests them from the client.
3. **No confirmation round.** Logging a request decides nothing and moves no money. Call it straight
   away once client and request are clear. Decisions on the case still go through the staged path.

## Reporting

On success, two lines:

> Logged as case **00001368** for James Okafor (Phone): change of details, set by the keyword rule.
> The Case agent is on it now; it will land on your desk when it needs you.

- `existing: true`: say it was already logged as that case and nothing new was created.
- `classifiedBy: "Case agent"`: say the Case agent will classify it first.
- If the desk page is open, the case appears there on its next refresh.

## When it does not go through

- **Client not clear** (`ok: false`, `resultJson.candidates`): nothing was created. No match: say so
  and ask for the exact name or the account. Several matches: list them (name and email) and ask
  which one; call again with that `accountId` as `client`. Never pick one yourself.
- **`REFUSED`**: the signed-in identity may not log requests (the agent identity always gets this).
  Quote the message.
- **`VALIDATION_FAILED`** (request too short, unknown channel or journey): fix what the message names
  and call again.
- **"You don't have access to the Apex class: W360LogRequest"**: the person lacks the
  W360_Relationship_Manager permission set. Say so; an admin assigns it.
- **Tool not listed**: the connector predates 0.4.0's server change or is not signed in. Point to
  Settings > Connectors > Wealth 360 > Reconnect.

## What happens next (say it if asked)

The new case fires the same platform event as an email case. Within seconds the Case agent reads the
request, classifies it if needed, runs the journey's checks with cited evidence, and drafts what the
journey needs. A request for missing documents is sent on its own only when auto-send is on in the
Admin app and the client's email is on the allowlist; otherwise it waits on the desk for a person's
release. The Review agent checks independently, and the case lands on the desk when a person must
decide.
