---
name: wealth-360-desk
description: Use when someone asks to open the Wealth 360 desk ("open my Wealth 360 desk", "open the desk", "show me my cases", "what needs me", "what's on my desk"). The open is PER VIEWER and runs in the viewer's OWN claude.ai account. The desk page reads live data only through the viewer's own "Wealth 360" connector, and a page that declares that connector opens live only inside the organization it was published in, so a shared link from another organization does not work. Resolve the desk THIS viewer can open (this session's publish, else the newest desk titled "Wealth 360" they own or are shared, else the canonical URL in assets/desk.json if it reads for them) and otherwise publish the bundled template into their own account with assets/capabilities.json whole. At most one listing call and one read before any publish. When the connector is missing, misnamed or not signed in, the page plays its built-in replay of the five-case morning instead. Also answers "what needs me" from W360Queue in two lines.
---

# Wealth 360 desk

**The desk is a page in the viewer's own account.** It shows the servicing queue, the cases that
need the person, the live agent progress, the audit trail with cited evidence, the rulebook and the
day's summary. It reads Salesforce through the viewer's own `Wealth 360` connector and makes
decisions through the same staged path as chat.

**You never write UI.** The page is a finished build at `<pluginRoot>/assets/wealth-360-template.html`.
Your job is to resolve or publish it, then talk.

---

## Why every viewer gets their own copy

The desk page declares one runtime capability: the viewer's `Wealth 360` connector, with six tools
(`assets/capabilities.json`). A page that declares a capability is organization-internal: it can be
shared inside the claude.ai organization it was published in, and nowhere else with its live
grant. People who install this plugin sit in their own organizations. So **no single URL serves
every viewer**, and the canonical URL in `assets/desk.json` is the publisher's own copy, kept only
as a last fallback.

The answer is simple and cheap: publish the bundled template into the viewer's own account. The
page then calls Salesforce as that viewer, through that viewer's own sign-in.

---

## THE OPEN: resolve the desk for THIS viewer

Resolve in this order and STOP at the first that answers.

1. **This session's own publish.** If this session already published a desk, use that URL. Do not
   list or read anything.

2. **The newest desk this viewer owns or is shared.** Artifact tool, `action: "list"`,
   `scope: "all"`. Keep rows titled exactly `Wealth 360` (not `Wealth 360 Blueprint` or any other
   title that merely starts with it). Take the most recently updated one and **verify it with
   `action: "read"`** before handing it over. A row in a listing is not proof the page opens.

3. **The canonical URL in `<pluginRoot>/assets/desk.json`**, only if `action: "read"` succeeds for
   it. For a viewer outside the publisher's organization it will not read; never hand it over
   unread.

4. **Nothing resolved: publish the desk into this viewer's own account.** Artifact tool, publish:

   - `file_path`: `<pluginRoot>/assets/wealth-360-template.html` (copy it to the scratchpad first if
     the host needs a writable path; do not edit it);
   - `title`: exactly `Wealth 360` (step 2 matches on it);
   - `icon`: `briefcase`, on this first publish only;
   - `capabilities`: the contents of `<pluginRoot>/assets/capabilities.json`, **whole**. Omitting it
     publishes a desk that can only replay;
   - `description`: "Wealth 360 servicing desk, live through your Wealth 360 connector."

   Use the URL it returns for the rest of the session. Tell the viewer in one line that colleagues
   in the same organization can open this same desk from the page's Share control, so they do not
   each need to publish one.

**Hand over exactly one URL, in one line.** Do not offer a choice of desks and do not list the ones
you rejected. Never type a desk URL from memory or carry one forward from an older conversation.

**A redeploy** (the person asks to refresh or republish the desk, or a new plugin version ships a
new template) publishes the template to the same URL with the capabilities whole and **no** `icon`,
so the tab keeps the icon the viewer knows.

---

## Live or replay

The page decides for itself, and says which on screen.

- **Live**: the viewer's `Wealth 360` connector answered. The queue, case drawers, rulebook and
  summary come from Salesforce, and decisions go through `stage_decision` and `confirm_decision`
  as the signed-in person. The page re-reads every few seconds and keeps the last good figures,
  marked stale, if the connector drops.
- **Replay**: no connector by that exact name, not signed in, or no grant. The page plays the
  scripted five-case morning on synthetic data, with its own demo controls. Nothing is written
  anywhere.

If the page shows replay and the viewer expected live, check in this order: a custom connector
named exactly `Wealth 360` exists under claude.ai Settings > Connectors; it is connected and signed
in to Salesforce; the page was published with `assets/capabilities.json` (a page published without
it can only replay); the viewer allowed the page to use the connector when claude.ai asked.

---

## "What needs me"

Answer from `W360Queue` with `{"inputs":[{}]}` (every W360 case the signed-in person can see; pass
`ownerId` only to narrow to one book). Parse `content[0].outputValues.resultJson`.

Say it in one or two lines from `needsYou`, `inProgress`, `closedToday` and the `rows` where
`needsYou` is true, by desk state:

> Five cases need you. Three are exceptions: a change of details with a name mismatch, a £48,250
> credit below the match threshold, and a bereavement with two documents missing. A £25,000
> withdrawal is prepared and waiting for authorisation, and a complaint response is ready for
> review.

Name each case by its subject and case number. For any one of them, the matching journey skill
takes over: `change-of-details`, `money-out`, `money-in`, `bereavement`, `complaint`.

If the queue read fails, say so in half a sentence, quote the org's message, and point the viewer
at the connector checks above. Never describe a queue you did not read.

---

## Fences

- Never put a passcode, token, OAuth value or any other credential into the page, into the
  description or into the reply that hands over the URL.
- Never edit the template to "fix" data. The page reads live or replays; there is no baked book.
- Never redraw the desk in chat: no tables, cards or charts standing in for the page.
