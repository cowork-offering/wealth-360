---
name: wealth-360-admin
description: Wealth 360 agent administration for holders of the W360_Agent_Admin permission set. Explains how to pause or resume the Case and Review agents, ask for a run now, and see the last runs, all of which are done in the Wealth 360 Admin app in Salesforce. Use for "pause the agents", "resume the agents", "stop the agents", "run the agents now", "when did the agents last run", "show the last runs", "agent run log", "agent spend today" or "who can change the agent schedule".
---

# Wealth 360 admin

The agents run headless under the agent runner. What they may do, and when, is set in Salesforce on
one control record (`W360_Agent_Control__c`) that the runner reads every minute. Admins change it in
the **Wealth 360 Admin** app. This skill tells the person where and how; it changes nothing itself.

## Who can do this

Only holders of the `W360_Agent_Admin` permission set. It grants the Wealth 360 Admin app, its tabs
and edit on the control record. Anyone else does not see the app, and Salesforce refuses a change.
If the person does not have it, say so plainly and point them to their Salesforce administrator.
Never suggest a workaround.

## There are no chat tools for this

The Wealth 360 connector has no tools for the agent control or the run log. Do not call any tool to
pause, resume, run or read runs, and do not claim a change was made. Send the person to the app with
the steps below. Relationship managers also see a one-line status on every case page ("Agents last
ran 14:02, next 14:04" or "Agents paused"), read only.

## Pause or resume the agents

1. In Salesforce, open the App Launcher and choose **Wealth 360 Admin**.
2. Open the **Agent control** tab.
3. Select **Pause agents** (or **Resume agents**).

The runner sees it on its next tick, within a minute. A paused runner does no work and records the
skip in the run log. A run already in progress finishes; the pause applies from the next tick.

## Run the agents now

On the **Agent control** tab, select **Run now**. It is refused while the agents are paused. The
runner starts the run on its next tick, within a minute, and logs it with the trigger `Run now`. Run
now is not held by working hours, but the journey switches, the case limit and the daily spend cap
still apply.

## See the last runs

- The **Agent control** tab shows the status (on or paused, last run, next run, running now, spend
  today against the cap) and the recent runs.
- The **Runs** tab is the full run log: one row per run with trigger, status, cases worked, steps
  written, hand-offs, errors, cost and duration, and on each run the cases it worked with the agent,
  the outcome and the agent's own report.
- The **Audit** tab lists every agent step and person decision across cases, filterable by actor,
  journey, outcome and date. The **Rulebook** tab shows the journeys and their steps, read only.

## Other settings on the same tab

Sweep interval in minutes, working hours only (Europe/London) with start and end, one switch per
journey (money in, money out, change of details, bereavement, complaint), the most cases per run and
the most model spend per day in US dollars. Select **Save** after a change.
