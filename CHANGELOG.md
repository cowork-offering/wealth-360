# Changelog

All notable changes to the Wealth 360 plugin. The version is in
`wealth-360/.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`.

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
