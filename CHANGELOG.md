# Changelog

All notable changes to the Wealth 360 plugin. The version is in
`wealth-360/.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`.

## 0.6.0 (2026-10-29)

Wealth 360 is a proof of concept, not a demo: in live mode every action either works against
Salesforce or is shown greyed out as "Soon". Nothing pretends.

### Fixes
- Decisions from the live desk failed with "The plan came back incomplete". Salesforce returns the
  single-use decision token in its own output field; the desk now reads it. This affected Approve,
  Authorise and Investigate alike.
- Investigate is now "Send back to agents" ("Hold and send back" in Authorise), with a note for the
  agents. Anything prepared is held and the case goes back to the agents, who act on the note.
- The drafted letter scrolls inline in its own box instead of a "Read the full letter" toggle.

### Client lookup
- New read tool `W360ClientSearch` (17 tools): person clients by name or email, with open W360 cases,
  only clients the signed-in person can see.
- Clients view in live mode: search as you type, the clients on your desk, and the selected client
  from Salesforce (KYC and screening, accounts, top holdings, open cases, household and payees), with
  a loading skeleton. Replay keeps the scripted households.

### The FAB in live mode
- New case opens a form with the client lookup; the case is linked to the client and the agents start
  at once. From a case or a client it is pre-filled.
- Open in Salesforce opens the real record or list in your org.
- Analyse a document, Request documents, Book a meeting, Log a call, Add a note, Reassign and Create
  follow-ups are greyed out with "Soon" until they are released.
- The Log request button on the desk is gone; New case in the FAB replaces it.

### Layout
- The live status sits in the bottom left corner; cards are a little more compact; lanes and panels
  fade gently at the edge while they scroll.

## 0.5.0 (2026-10-29)

### A calmer, structured desk (live mode)
- The desk is one board that fits the screen, no page scrolling. Two lenses: **Needs me** (Authorise,
  Decide, Review, then Agents working and Waiting on client, kept quieter) and **All cases** (one lane
  per journey, a dot for whose move it is, count and total per lane). Each lane scrolls on its own.
- Every card says why it is in its lane ("All checks passed. Only a person can release money.",
  "Rule: Recent bank change.", "A screening hit can only be cleared by a person."). Colour is kept
  for real risk only: red for a sanctions match, amber for an unverified payee or a recent bank change.
- **Agents working** shows cases the agents are on now: which agent, its latest step, and progress.
  A new email, call or logged request appears there the moment it arrives. A live line under the
  header says what the agents are doing.
- The slide-out is rebuilt in five tabs that each fit without scrolling: Overview (the proposal, the
  decision itself: accounts to allocate to, the letter and meeting slots, the plan to confirm, key
  facts), Checks (each check with result, source and the evidence on demand), Client (KYC and
  screening, accounts, other open cases), Documents and Activity (the request, progress and the
  steps). Actions sit at the bottom: Authorise £X, Hold and investigate, Approve and send, Accept
  proposal, Investigate. Every decision is still staged, shown as a plan and confirmed.
- Authorise and Review cases can now be decided from the slide-out, not only Needs RM cases.
- Replay mode (no connector) is unchanged.
- Desks published before 0.5.0 keep the old layout until republished ("republish my Wealth 360 desk").

### Case headline
- New case field `W360_Headline__c`: one plain line for the desk card. The Case agent sets it with
  `submit_step` (`headline`) whenever the situation a person would see changes. W360Queue returns it
  with the level reason. The desk falls back to the subject when a case has none.

## 0.4.0 (2026-10-28)

### Log a request from chat or the desk
- New person-only tool `log_request` on the Wealth 360 MCP server (16 tools). A relationship manager
  logs a request taken by phone, in a branch, by letter or by email as a new W360 case. It is the same
  case the email intake makes, so the platform event wakes the agents within seconds.
- The client is resolved by account id, contact id or name. When a name matches no one or several
  people, nothing is created and the candidates come back to pick from. The same request for the same
  client by the same person on the same day returns the first case.
- Journey: the person's choice, else the intake keyword rules (now also third person: "he has moved",
  "update his address"), else the Case agent classifies it first.
- People only. The agent identity has no access to the Apex class and is refused by the write guard;
  the runner never gives the agents `log_request`. Agents never create their own work.
- New `log-request` skill ("log a request for James Okafor", "James called, he has moved...").
- Desk page: a "Log request" button on Cases opens a short form (client, channel, request). Desks
  published before 0.4.0 must be republished once to get the button ("republish my Wealth 360 desk").

### Fixes found in live testing
- An email the Case agent drafts with no recipient now goes to the client's email on record, the
  address the auto-send fence checks. Before, a blank recipient was refused and held for a person.
  The agent's case context now shows `clientEmailOnRecord`.

### Proven live (BankingGPT sandbox, 28 October)
- Logged by phone, case 00001369: the Case agent read and classified it, ran Ideal Postcodes and
  Didit, and auto-sent the document request to the client's allowlisted address in 61 seconds. The
  case moved to Waiting on customer. This also proves that the agent identity's Integration licence
  can send email.

## 0.3.0 (2026-10-28)

### Wealth 360 Checks connector
- A second, optional claude.ai custom connector, `Wealth 360 Checks`
  (`https://wealth-360-checks.vercel.app/api/mcp`). It runs the outside checks from the person's own
  seat: sanctions screening on the UK Sanctions List, the Plaid sandbox account-holder check on a
  payee, Ideal Postcodes address validation and a Didit sandbox identity session, plus the person's
  own check ledger.
- Sign-in is Salesforce, with the same External Client App and OAuth Client ID as `Wealth 360`. The
  server checks every token with Salesforce, accepts only the bank's org, and records the signed-in
  person on every ledger row. No anonymous access.
- Setup steps in the README, section "The second connector", and in `plugin.json`.

### Skills and agents
- New `outside-checks` skill: "run a sanctions check on the payee", "verify the payee account",
  "validate this address", "start an ID check". Takes the inputs from the case, quotes the evidence,
  source and ledger id, and labels every result sandbox. A screening hit always goes to a person.
- The orchestrator knows the second connector. The Case agent and the Review agent use it when they
  run in a person's seat, as they use the runner's aggregation server, and label sandbox results.

## 0.2.0 (2026-10-28)

Brings the plugin in line with what runs in the BankingGPT sandbox.

### Agent runner
- Real-time triggering: a Salesforce platform event signals a W360 case that needs agent work about
  1 to 2 seconds after the change commits. The listener waits 10 seconds of quiet per case, then
  works it. A sweep every 2 minutes is the safety net (it was 15 minutes).
- The Case agent classifies a case that arrived without a journey as its first step.
- The Case agent never hands a case to a person before the independent review has run.

### Admin
- New `wealth-360-admin` skill, pointing admins to the Wealth 360 Admin app: Agent control, Runs,
  Rulebook and Audit, and the Client email switch.

### Outside checks
- Both agents use an aggregation server when it is connected: sanctions screening (UK list),
  confirmation of payee, address validation and identity verification (sandboxes). The Review agent
  re-runs the checks itself and stops on a screening hit.

### Email
- Email intake: replies are filed on their case by case reference or thread token, and reopen a case
  only from `Waiting on customer`. New emails from a known client become cases; unknown or ambiguous
  senders go to a person. DKIM for the sender's domain counts as authenticated, so a forwarded
  email works.
- Branded email on the Wealth Servicing letterhead. A person's release on the desk sends it.
- Agent auto-send for document requests only, fenced in Salesforce: email only, one recipient, the
  client's email on record, an allowlisted domain, at most three per case per day, and only an
  identity verification link. Off until the bank switches it on.

### Docs
- README: what is live, email in and out, demo cases. RUNBOOK: email safety settings, the real-time
  trigger, sender domain authentication.

## 0.1.0

First release: the desk, the Case and Review agents, five journeys, the daily summary.
