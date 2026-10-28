---
name: bereavement
description: Guided workflow for the Wealth 360 Bereavement journey ("Bereavement notification"). A family member tells the bank a customer has died. Reads the case and the journey rules, has the Case agent work the steps with cited evidence (read the notification and the death certificate, identify accounts and holdings, mark accounts deceased and stop regular payments, check documents, draft the document request letter in the bereavement tone, propose a one-to-one with the beneficiary), hands the case to the Review agent for an independent check, raises it to the relationship manager, and carries the person's decision (approve the letter and book the meeting at a chosen slot) through stage_decision, the plan shown verbatim, the named person's confirmation, confirm_decision and a re-read. Always level 3. Use for "bereavement", "has died", "passed away", "estate of", "probate", "meet the beneficiary" or the bereavement case on the desk.
---

# Bereavement

Someone has died, and a family member has told the bank. This journey has two jobs: handle the
estate correctly, and treat the family well. The one-to-one with the beneficiary is where the next
generation meets the bank for the first time; it is proposed by the agent and booked only by a
person.

**Journey:** `Bereavement` · level **L3 always** · team **Bereavement Services** · SLA **acknowledge in 2 working days**.
Read the live rules with `W360Rulebook` (`{"inputs":[{"journey":"Bereavement"}]}`).

| Rules | Documents required |
|---|---|
| Bereavement cases are always level 3. Grant of probate and executor identity are mandatory. Tone of voice: bereavement policy. Regular payments stop when the death is recorded. | Death certificate. Grant of probate. Executor proof of identity. |

Calling convention for every tool: send `{"inputs":[{...}]}`, parse
`content[0].outputValues.resultJson`, quote any failure verbatim.

---

## 1. Read the case

`W360CaseDetail` with the `caseId`. Two lines, gently worded: who has died and when, who told the
bank and their relationship (executor, beneficiary), the accounts and their values, documents
received against required (`documents.requiredCount`, `receivedCount`, `missing`), and where the
case stands. Mention any drafted letter (`instructions[]`, Communication, Awaiting review) and any
proposed meeting (`meetings[]`, Proposed, with `W360_Proposed_Slots__c`).

## 2. Work the steps (Case agent)

Dispatch the Case agent (`subagent_type: "wealth-360:case-agent"`) with the case id and
`Bereavement` only, while Case agent steps before `review` are open:

| Step key | What it establishes | Tool |
|---|---|---|
| `read_notification` | who has died, who is telling the bank, their role | `W360CaseContext`; verbatim quote of the notification (required) |
| `read_certificate` | name, date of death, registration district | the certificate on the case |
| `set_journey` | journey and level (always L3) | `W360Rulebook` |
| `identify_accounts` | every account and holding, with values | `W360ClientSnapshot` |
| `mark_deceased` | accounts marked deceased, regular payments stopped | `submit_step` |
| `check_documents` | received against required | `W360CaseContext` |
| `draft_document_request` | the letter to the executor asking for what is missing, in the bereavement tone | `draft_communication` (held Awaiting review) |
| `propose_meeting` | a one-to-one with the beneficiary: agenda and free slots on the RM's calendar | `propose_meeting` (stays Proposed) |

**The letter.** Plain, warm, short. Say sorry once. Say what has been done to protect the
accounts. Name exactly which documents are still needed and how to send them. Say there is no
deadline. Offer the relationship manager's time. No product language, no advice.

**The meeting.** Agenda one item per line, for example: how the beneficiary is and how they would
like to be contacted; what the deceased held, in total; the estate process, timings and what
happens next; their own questions, and whether financial guidance would help. Offer several slots.

## 3. Independent check (Review agent)

Dispatch the Review agent (`subagent_type: "wealth-360:review-agent"`) fresh, with the case id and
`Bereavement` only. It checks the level, the deceased marking and payment stop, documents against
required, and the letter's tone against the policy rule, and records `record_review`.

## 4. Raise to the relationship manager

The case reaches the person as `Needs RM`, with an exception reason such as "Grant of probate and
executor's proof of identity missing (1 of 3 documents received)." and a proposed action such as
"Approve the letter to the executor and book the one-to-one with the beneficiary." Show the
draft letter in full and the offered slots.

| Person's decision | `outcome` | `choice` | What confirm does |
|---|---|---|---|
| Send the letter as drafted and book the meeting | `approve` | the chosen slot, ISO date-time | letter Released, meeting Confirmed at that slot, case to Fulfilment |
| Send with changes | `amend` | the slot | as approve, with the change in the note |
| Do not send; decline the meeting | `reject` | none | letter Cancelled, meeting Declined |
| Look again first | `investigate` | none | case back to Working; letter held |

If the person approves without choosing a slot, the org warns that the meeting keeps its first
offered time. Show that warning.

## 5. The decision path (person only)

1. `stage_decision` with `caseId`, `outcome`, `note`, `choice` (the slot), stable `idempotencyKey`.
2. Show `summary`, every step and every warning **verbatim**.
3. The named person confirms in words. No yes, no confirm.
4. `confirm_decision` with `stagingId`, `planHash`, `decisionToken` verbatim, `humanSeconds` if known.
5. Report `terminalState` and the step states, re-read `W360CaseDetail`, and say what Salesforce
   now holds: the letter's state, the meeting's status and time, the case's stage.

## Fences

- Never pass the estate on, close an account or pay anyone without the mandatory documents and a
  person's decision.
- The letter is released in Salesforce on confirm; posting or emailing it is another system's job.
  Say "released for sending", not "sent".
- Write about the deceased and the family with care, in every reply, not only in the letter.
