# OKR Command Center

**An OKR operating system for executive operations teams, in any industry** — not just a place to store goals, but the weekly rhythm that keeps them honest: alignment, check-ins, risks, decisions, an auto-written exec brief, and an assistant an executive can simply ask.

**[Open the live demo →](https://shelbgreenwell-lab.github.io/okr-command-center/)** · no login, works on desktop and phone

> The demo runs on a fictional company (Meridian Group, 1,400 people) six weeks into Q4. All names and numbers are invented.

---

## The problem it solves

Most OKR programs fail the same way: goals are set in a kickoff, live in a slide deck, and get revisited when the quarter is already lost. Executives end up asking the same questions every week — *What's off track? Why? What's blocked? What do you need from me?* — and someone spends hours assembling the answer.

This tool treats OKRs as an **operating system**, not a document:

| An executive wants to know… | Where it's answered |
|---|---|
| Where do we stand, honestly? | **Executive overview** — progress vs. *expected pace*, not just % complete |
| What deserves my time this week? | **Needs your attention** — ranked by pace, confidence, blockers and stale data |
| What's waiting on me? | **Decisions waiting** — every exec ask has a decider and ages visibly |
| How does team work connect to company goals? | **OKRs & alignment** — team objectives ladder to company objectives |
| What changed and why? | **Weekly check-ins** — number, 1–10 confidence, note, blocker |
| What do we do about it? | **Suggested actions** — each slipping key result gets concrete next steps based on *why* it's behind, one click to add to a recovery plan |
| What do I read before the WBR? | **Weekly exec brief** — written automatically, with a time-boxed agenda |
| Can I just ask? | **Ask** — plain-English questions answered from live data |

## Design decisions

- **Pace beats percent.** 40% complete is great in week 4 and alarming in week 11. Every bar carries a tick showing where the work *should* be today.
- **Confidence is a leading indicator.** Status takes the worse of math and owner confidence — someone who says "I won't make it" is believed before the numbers catch up.
- **Blockers are tied to outcomes.** Every risk names the key result it threatens, an owner, a mitigation, and whether an executive decision is the unblock.
- **Decisions are tracked like work.** Pending decisions age on the dashboard until made, then move to a decision log.
- **Silence is a signal.** No check-in for 8+ days marks a key result *stale*.
- **Diagnosis drives the fix.** Suggestions come from the specific signal: a stuck decision gets a push to decide, an out-of-reach target gets a resources/scope/reset call, a confidence drop gets a conversation, silence gets a request for an update.
- **The meeting writes its own agenda.** The brief proposes a 45-minute weekly business review spent on off-track items and pending decisions — not status.

The exact rules are in the app under **How it works**, so anyone can audit why something is flagged.

## The Ask assistant

- **Built-in analyst (default):** answers the questions executives actually ask — *what needs my attention, which decisions are waiting on me, why is X off track, will we hit Y, what changed since last week, who hasn't checked in, how is Operations doing* — scoped to any person, team, objective or topic. Runs in the browser, no account needed; every answer links to the key results it used.
- **Claude (optional):** add your own Anthropic API key in *Settings* and open-ended questions go to Claude with a snapshot of the live OKR data. The key stays in your browser.

## Try it in two minutes

1. Open the demo and read the **Executive overview**.
2. In **Ask**, try *"Why is integration build time off track?"* or *"Which decisions are waiting on me?"*
3. Click **Mark decided** on a decision, then check the badge and decision log.
4. Go to **Weekly check-in**, change a number and confidence, submit — every view updates.
5. Open **Settings** and move the app date forward to watch pace and staleness change.

Edits save in your browser. *Settings → Reset to demo data* restores the original.

## Tech

Plain HTML, CSS and JavaScript — no framework, no build step, no server. Hosted free on GitHub Pages.

```
index.html        app shell
css/styles.css    design system (light + dark mode, responsive)
js/engine.js      OKR math: progress, pace, status, forecast, attention ranking
js/suggest.js     mitigation suggestions for slipping key results
js/ask.js         question answering (built-in analyst + optional Claude)
js/app.js         views, charts, forms
js/data.js        fictional demo company
```

Run locally by opening `index.html` in a browser.

---

Built by Shelby to show how I approach executive operations: design the operating rhythm, then build the system that sustains it.
