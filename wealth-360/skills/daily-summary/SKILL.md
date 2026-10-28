---
name: daily-summary
description: The Wealth 360 daily summary. Reads W360Summary (since today 00:00 by default, or a time the person names) and says the day in a few plain lines - cases progressed and closed, agent tasks completed by each agent, exceptions raised, decisions people made and the minutes they spent, items still waiting, errors and rework, and model tokens. Use for "how did today go", "daily summary", "what did the agents do today", "what is still waiting", "end of day" or "summary since <time>".
---

# Daily summary

The day in numbers, said in words. Read only; nothing is written.

## Read

`W360Summary` with `{"inputs":[{}]}` for today since 00:00, every W360 case the signed-in person can
see. Pass `since` (ISO date-time) for another start, and `ownerId` only to narrow to one book.
Parse `content[0].outputValues.resultJson`. Fields:

| Field | Say it as |
|---|---|
| `since` | the start of the window |
| `casesProgressed`, `casesClosed` | cases moved on, cases closed |
| `agentTasksCompleted`, `agentTasksByAgent` | agent steps done, split by Case agent and Review agent |
| `exceptions` | cases raised to a person |
| `humanDecisions`, `decisions[]` | decisions people made, each with case, decision, by whom and when |
| `humanMinutes`, `agentMinutes` | the people's measured time, and the agents' |
| `itemsWaiting`, `waiting[]` | what is still waiting, with case and desk state |
| `errors`, `rework` | errors, and cases sent back by the Review agent |
| `tokens` | model tokens used |

## Say it

Four or five lines, most useful first: what still needs a person, what was decided and by whom,
what the agents did, and the people's time. For example:

> Since 7:00: five cases progressed, none closed. The agents completed 37 steps (Case agent 31,
> Review agent 6) and raised three exceptions. You made two decisions in 4 minutes. Three items
> still wait: the money out authorisation, the complaint response and the change of details. No
> errors, no rework.

A field that reads zero is said as zero. A window with nothing in it is said plainly: "Nothing has
moved since 7:00." Never fill a failed read with estimates; quote the org's message and point at
the `wealth-360-desk` connector checks.

If the person is on the desk page, its Summary view shows the same numbers from the same tool.
