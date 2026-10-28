---
name: complaint
description: Guided workflow for the Wealth 360 Complaint journey. A customer complains. Reads the case and the journey rules, has the Case agent work the steps with cited evidence (read the complaint, classify it, retrieve case history and duplicates, check the cause), hands the case to the Review agent for an independent check against the response rules, has the Case agent draft the response for review, raises the draft to the relationship manager, and carries the person's decision (approve the response for sending, amend, or reject) through stage_decision, the plan shown verbatim, the named person's confirmation, confirm_decision and a re-read. Use for "complaint", "the client is unhappy", "draft a response", "review the complaint response" or the complaint case on the desk.
---

# Complaint

A customer has complained. The response has to be right, fair and on time, and a person approves
it before it goes.

**Journey:** `Complaint` · default level **L2** · team **Complaints** · SLA **final response within 8 weeks**.
Read the live rules with `W360Rulebook` (`{"inputs":[{"journey":"Complaint"}]}`).

| Rules | Raise to L3 when |
|---|---|
| Final response within 8 weeks of receipt. Apology, cause, fix and referral rights in every response. Redress inside policy limits. No advice in a complaint response. | Vulnerability. Regulator involvement. |

Calling convention for every tool: send `{"inputs":[{...}]}`, parse
`content[0].outputValues.resultJson`, quote any failure verbatim.

---

## 1. Read the case

`W360CaseDetail` with the `caseId`. Two lines: the customer, the complaint in their words (quote
it), the date received and the response deadline, any related or duplicate case, the level and
where it stands. Mention a drafted response (`instructions[]`, Communication, Awaiting review).

## 2. Work the steps (Case agent)

Dispatch the Case agent (`subagent_type: "wealth-360:case-agent"`) with the case id and `Complaint`
only, while Case agent steps are open:

| Step key | What it establishes | Tool |
|---|---|---|
| `read_complaint` | the complaint, verbatim, with its source (required) | `W360CaseContext` |
| `classify` | the type of complaint and the deadline; vulnerability or regulator involvement raises to L3 | `W360Rulebook` |
| `retrieve_history` | the case history and any duplicates | `W360CaseContext` |
| `check_cause` | what actually went wrong, from the records (for example a holding feed that did not update) | `W360ClientSnapshot` |

## 3. Independent check (Review agent)

Dispatch the Review agent (`subagent_type: "wealth-360:review-agent"`) fresh, with the case id and
`Complaint` only. It checks the cause against the records, the deadline, and that the response
will carry apology, cause, fix and referral rights with no advice, and records `record_review`.

## 4. Draft the response and raise it

The Case agent drafts the response with `draft_communication` (`stepKey: "draft_response"`,
`communicationType: "Complaint response"`, never auto-sent; on approve it is sent on the Wealth
Servicing letterhead): an apology, the cause in plain words, what has been fixed, any redress inside policy, and the
customer's referral rights. No advice. It is held as Awaiting review, and the case reaches the
person as `Ready for review` with a proposed action such as "Review the drafted response and
approve it for sending." Show the draft in full.

| Person's decision | `outcome` | What confirm does |
|---|---|---|
| Approve the response as drafted | `approve` | response Released, case to Fulfilment |
| Approve with changes | `amend` | as approve, with the change in the note; ask the Case agent for a revised draft first if the change is more than a line |
| Do not send | `reject` | response Cancelled |
| Look again first | `investigate` | case back to Working; response held |

## 5. The decision path (person only)

1. `stage_decision` with `caseId`, `outcome`, `note`, stable `idempotencyKey`.
2. Show `summary`, every step and every warning **verbatim**.
3. The named person confirms in words. No yes, no confirm.
4. `confirm_decision` with `stagingId`, `planHash`, `decisionToken` verbatim, `humanSeconds` if known.
5. Report `terminalState` and the step states, re-read `W360CaseDetail`, and say the response's
   state as Salesforce holds it.

## Fences

- Never admit liability or offer redress beyond what the person approved.
- Never give advice in a complaint response.
- The response is released in Salesforce on confirm; sending it is another system's job. Say
  "released for sending", not "sent".
