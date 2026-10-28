---
name: money-in
description: Guided workflow for the Wealth 360 Money in journey (Money_In, "Allocate incoming funds"). An unallocated credit arrives and sits in suspense. Reads the case and the journey rules, has the Case agent parse the credit and score candidate accounts with W360IncomingMatch, hands the case to the Review agent for an independent check, raises it to the relationship manager when no match reaches the threshold or the amount is over the review limit, and carries the person's decision (allocate to a named account, or open an investigation) through stage_decision, the plan shown verbatim, the named person's confirmation, confirm_decision and a re-read. Agents cannot allocate money out of suspense. Use for "unallocated credit", "money in", "who does this payment belong to", "allocate the £48,250" or the money in case on the desk.
---

# Money in

A credit has arrived that the bank cannot place. It sits in suspense until it is matched. A strong
match on a small amount can be allocated by the rules; anything else needs a person.

**Journey:** `Money_In` · default level **L2** · team **Cash Operations** · SLA **same day**.
Read the live rules with `W360Rulebook` (`{"inputs":[{"journey":"Money_In"}]}`). The match
threshold and the review limit come from metadata; on the sandbox they are 90% and £25,000.

| Rules | Raise to L3 when | Documents required |
|---|---|---|
| Allocation needs a match at or above 90% or a person. Credits over £25,000 need a person. Agents cannot allocate money out of suspense. | Match below 90%. Credit over £25,000. | Remittance advice. |

Calling convention for every tool: send `{"inputs":[{...}]}`, parse
`content[0].outputValues.resultJson`, quote any failure verbatim.

---

## 1. Read the case

`W360CaseDetail` with the `caseId`. Two lines: the amount, the remitting bank and the reference
(from `incomingPayments[]`), the suspense account, the best match score against the threshold, the
level and why. List `steps[]` with done or open.

## 2. Work the steps (Case agent)

Dispatch the Case agent (`subagent_type: "wealth-360:case-agent"`) with the case id and `Money_In`
only, while Case agent steps before `review` are open:

| Step key | What it establishes | Tool | Evidence |
|---|---|---|---|
| `parse_credit` | amount, remitter bank, reference, value date | `W360CaseContext` | the raw advice, verbatim (required) |
| `set_journey` | journey and level | `W360Rulebook` | the rule |
| `search_matches` | accounts by reference, amount, owner and payment history | `W360CaseContext`, `W360ClientSnapshot` | what was searched |
| `score_candidates` | each candidate's score against the threshold | `W360IncomingMatch` with `paymentId` | the tool's scores and reasons, as returned |

Scores come from `W360IncomingMatch`, which computes them in code. **Never estimate a score.** A
best match below the threshold, or an amount over the review limit, means `raiseLevelTo: "L3"`.

## 3. Independent check (Review agent)

Dispatch the Review agent (`subagent_type: "wealth-360:review-agent"`) fresh, with the case id and
`Money_In` only. It re-scores with `W360IncomingMatch` itself, confirms the funds are held in
suspense, and records `record_review`.

## 4. Raise to the relationship manager

The case reaches the person as `Needs RM`, with an exception reason such as "Best match 68%, 90%
needed. £48,250.00 is above the £25,000 review limit. No remitter name from the bank." and a
proposed action such as "Open an investigation and ask Lloyds for the remitter. Funds stay in
suspense." Show the candidates with their scores and reasons.

| Person's decision | `outcome` | `choice` | What confirm does |
|---|---|---|---|
| Ask the remitting bank; keep funds in suspense | `approve` (note: open an investigation, request the remitter) | none | payment set to Remittance requested; case to Fulfilment |
| Allocate to a named account | `approve` | the financial account id | payment set to Allocation approved, to that account; the org warns that funds leave suspense on confirm at L3 |
| Return to sender | `reject` | none | payment set to Return requested |
| Look again first | `investigate` | none | case back to Working; payment unchanged |

## 5. The decision path (person only)

1. `stage_decision` with `caseId`, `outcome`, `note`, `choice` when allocating, stable
   `idempotencyKey`.
2. Show `summary`, every step and every warning **verbatim**, including "Manual allocation at
   level 3: funds leave suspense to the chosen account on confirm." when the org returns it.
3. The named person confirms in words. No yes, no confirm.
4. `confirm_decision` with `stagingId`, `planHash`, `decisionToken` verbatim, `humanSeconds` if known.
5. Report `terminalState` and the step states, re-read `W360CaseDetail`, and say the payment's
   state as Salesforce holds it.

## Fences

- An agent never allocates, returns or moves money out of suspense.
- Allocation to an account the person did not name is never staged.
- The request to the remitting bank is sent from another system; this connector records the
  decision, it does not send mail.
