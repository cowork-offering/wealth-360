---
name: money-out
description: Guided workflow for the Wealth 360 Money out journey (Money_Out, "Withdrawal or encashment"). A customer asks to withdraw or encash to a nominated account. Reads the case and the journey rules, has the Case agent work the steps with cited evidence (read the request, identify the customer, check the source account, check the payee with W360PayeeCheck, check KYC with W360KycStatus), hands the case to the Review agent for an independent check, has the Case agent prepare the release for authorisation, and carries the person's authorisation through stage_decision, the plan shown verbatim, the named person's confirmation, confirm_decision and a re-read. Agents can never release money. Use for "withdrawal", "encashment", "pay out", "send £25,000 to", "authorise the release" or the money out case on the desk.
---

# Money out

A customer wants money paid out to an account they nominate. Agents check everything and prepare
the release. **A person authorises every payment.** That is a rule in the org's metadata and in its
code.

**Journey:** `Money_Out` · default level **L2** · team **Payments Operations** · SLA **5 working days**.
Read the live rules with `W360Rulebook` (`{"inputs":[{"journey":"Money_Out"}]}`).

| Rules | Raise to L3 when |
|---|---|
| The source account must be open and the amount within available cash. A new nominated account needs a confirmation-of-payee match. KYC current, screening clear, no bank change in the last 90 days. Agents cannot release money; a person authorises every payment. | Vulnerability. Unverified payee. Recent bank change. |

Calling convention for every tool: send `{"inputs":[{...}]}`, parse
`content[0].outputValues.resultJson`, quote any failure verbatim.

---

## 1. Read the case

`W360CaseDetail` with the `caseId`. Two lines: the customer, the amount, the source account and
the payee (masked as the org returns them), the level and why, where it stands. List `steps[]` with
done or open, and any instruction in `instructions[]` with its status.

## 2. Work the steps (Case agent)

Dispatch the Case agent (`subagent_type: "wealth-360:case-agent"`) with the case id and `Money_Out`
only, while Case agent steps before `review` are open:

| Step key | What it establishes | Tool | Evidence |
|---|---|---|---|
| `read_request` | the amount, the source account, the payee | `W360CaseContext` | verbatim quote of the request (required) |
| `identify_customer` | the person account | `W360CaseContext` | the matched record |
| `set_journey` | journey and level | `W360Rulebook` | the rule |
| `check_account` | source account open, owned, funded, currency | `W360PayeeCheck` | the check's own result |
| `check_payee` | payee name against the customer, number format, payee age | `W360PayeeCheck` | the check's own result (required); add the aggregation server's (in a claude.ai seat, the `Wealth 360 Checks` connector's) `verify_payee`, an open-banking account-holder check in sandbox, when it is connected; without it, record what the internal checks found and say which checks were not run |
| `check_kyc` | KYC current, screening clear | `W360KycStatus` | the verdict and any gaps |

An unverified payee, a recent bank change or a vulnerability flag means `raiseLevelTo: "L3"` with
the rule named.

## 3. Independent check (Review agent)

Dispatch the Review agent (`subagent_type: "wealth-360:review-agent"`) fresh, with the case id and
`Money_Out` only. It re-runs `W360PayeeCheck` and `W360KycStatus` itself and records
`record_review`.

## 4. Prepare the release and raise it

After a passed review, the Case agent may `draft_communication` the withdrawal confirmation
(`draft_confirmation`, `communicationType: "Payment confirmation"`, `items` as "Label | value":
amount, from, to, sent on; it always waits for a person and is sent on the Wealth Servicing
letterhead when the person approves the release) and must complete `prepare_release` with
`submit_step`: `instructionType:
"Payment out"`, `amount`, `currencyIsoCode`, `sourceAccountId`, `destinationBankAccountId`, the
payee fields and `payeeCheckResult`, with `deskState: "Awaiting authorisation"` and a
`proposedAction` such as "Release prepared. Authorise £25,000 to Monzo ··8812." The instruction is
created as `Awaiting authorisation`. Nothing has moved.

## 5. The authorisation (person only)

| Person's decision | `outcome` | What confirm does |
|---|---|---|
| Authorise the release | `approve` | instruction set to Released, case to Fulfilment, decision logged |
| Do not pay | `reject` | instruction Cancelled, case Rejected |
| Hold and look again | `investigate` | instruction Held, case back to Working |

1. `stage_decision` with `caseId`, `outcome`, `note`, stable `idempotencyKey`.
2. Show `summary`, every step and every warning **verbatim**.
3. The named person confirms in words. No yes, no confirm.
4. `confirm_decision` with `stagingId`, `planHash`, `decisionToken` verbatim, `humanSeconds` if known.
5. Report `terminalState` and the step states, re-read `W360CaseDetail`, and say the instruction's
   state as Salesforce holds it.

**Say exactly what happened.** On this POC the instruction's status becomes `Released` in
Salesforce. Moving the money is the payments platform's job (`release_recorded` and the core
banking `pay_out` sit outside this connector). Never say the money has been paid.

## Fences

- An agent never authorises, releases or marks a payment paid. Salesforce refuses it.
- Never round, re-mask or reconstruct an account number. Use what the org returns.
- A payee check that was not run is "not checked", never "passed".

**A missing or expired document.** If the withdrawal cannot go ahead because a document is missing
or expired (for example an expired ID on the KYC record), the Case agent sends a `Document request`
to the client's email on record instead of preparing the release. It goes out at once (see the Case
agent's "Document requests"), the case waits on the customer, and the reply restarts it.
