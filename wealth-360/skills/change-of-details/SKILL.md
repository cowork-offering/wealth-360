---
name: change-of-details
description: Guided workflow for the Wealth 360 Change of details journey (Change_Of_Details, "Change of address"). A customer asks to change their address or personal details. Reads the case and the journey rules, has the Case agent work the steps with cited evidence (read the request, identify the customer, read the evidence, compare it with the record), hands the case to the Review agent for an independent check, raises it to the relationship manager with a proposed action when a rule is broken (name mismatch, evidence over three months old, a bank detail change in the last 90 days), and carries the person's decision through stage_decision, the plan shown verbatim, the named person's confirmation, confirm_decision and a re-read. Use for "change of address", "she has moved", "update his details", "proof of address" or the change of details case on the desk.
---

# Change of details

A customer has moved, or their details have changed. The bank changes the record only on evidence
that matches it. When the evidence does not match, a person decides.

**Journey:** `Change_Of_Details` · default level **L1** · team **Customer Servicing** · SLA **2 working days**.
Always read the live rules with `W360Rulebook` (`{"inputs":[{"journey":"Change_Of_Details"}]}`);
what follows is the shape, the org's metadata is the authority.

| Rules | Raise to L3 when | Documents required |
|---|---|---|
| Name on the evidence must match the record. Evidence dated within the last 3 months. Address exists on the postcode file. No tampering found. A bank detail change in the last 90 days raises the case to L3. | Name mismatch. Evidence over 3 months old. Bank change in the last 90 days. | Proof of address, last 3 months. Photo ID in the current name. |

Calling convention for every tool: send `{"inputs":[{...}]}`, parse
`content[0].outputValues.resultJson`, quote any failure verbatim.

---

## 1. Read the case

`W360CaseDetail` with the `caseId`. Say it in two lines: the customer, what they asked for (quote
`W360_Request_Text__c` and its channel), the level and the reason, and where it stands
(`W360_Stage__c`, `W360_Status__c`, `nextStep`). List the steps from `steps[]` with done or open.

## 2. Work the steps (Case agent)

If any Case agent step before `review` is open, dispatch the Case agent
(`subagent_type: "wealth-360:case-agent"`) with the case id and `Change_Of_Details` only. The
steps, in order:

| Step key | What it establishes | Evidence |
|---|---|---|
| `read_request` | the request and the new details | verbatim quote of the request, with its source (required) |
| `identify_customer` | the person account behind the case | the record it matched |
| `set_journey` | the journey and the autonomy level | the rule that set the level |
| `read_evidence` | the evidence: name, address, issue date, issuer | verbatim quote from the document (required) |
| `compare_record` | evidence against the record: name, date, postcode, recent bank change | each comparison, with the field on the record |

A mismatch on any raise-to-L3 rule means `raiseLevelTo: "L3"`, `outcome: "Exception"`, an
`exceptionReason` that names the exact difference (for example "Name on the bill is Ms S
Williams-Hart, record is Sarah Williams. Bill issued 2 July 2026, older than 3 months.") and a
`proposedAction` such as "Request new evidence. The address stays unchanged until it is verified."

## 3. Independent check (Review agent)

Dispatch the Review agent (`subagent_type: "wealth-360:review-agent"`) in a fresh call with the
case id and `Change_Of_Details` only. Never include the Case agent's report. It checks every rule
above from the evidence and records `record_review`.

## 4. Raise to the relationship manager

The case reaches the person as `Needs RM` with the exception reason and the proposed action. Put
them in front of the person with the evidence quotes behind them, and the choices:

| Person's decision | `outcome` | What confirm does |
|---|---|---|
| Ask for new evidence; keep the address unchanged | `reject` (note: request new evidence) | records the decision; any drafted evidence request is cancelled, so ask for a fresh draft if one is wanted |
| Accept the evidence as it stands | `approve` | records the decision, releases any prepared instruction or drafted letter, moves the case to Fulfilment |
| Approve with a change | `amend` | as approve, with the person's change in the note |
| Look again before deciding | `investigate` | case back to Working at Execution; instructions held |

## 5. The decision path (person only)

1. `stage_decision` with `caseId`, `outcome`, `note` in the person's words, and a stable
   `idempotencyKey` (for example `W360-COD-<caseNumber>-<yyyymmdd>-01`).
2. Show the org's `summary`, every step in `steps[]` and every string in `warnings[]`, **verbatim**.
3. Ask the named person to confirm. No explicit yes in words, no confirm.
4. `confirm_decision` with `stagingId`, `planHash`, `decisionToken` verbatim from the stage, and
   `humanSeconds` if known.
5. Report `terminalState` and each step's state, then re-read with `W360CaseDetail` and say what
   the case now holds: decision, desk state, stage, and each instruction's state.

## Fences

- Never update an address on evidence that failed a rule without a person's decision.
- Never call a name a "match" because it is close. Close is a mismatch the person weighs.
- Sending the evidence request and updating the record (`request_evidence`, `update_or_hold`) run
  on other systems after the decision; this connector does not send mail. Say so rather than
  claiming it was sent.
