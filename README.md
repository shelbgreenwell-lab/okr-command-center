# OKR Command Center

**An OKR operating system for executive operations teams, in any industry** — not just a place to store goals, but the weekly rhythm that keeps them honest: alignment, check-ins, risks, decisions, an auto-written exec brief, and an assistant an executive can simply ask.

**[Open the live demo →](https://shelbgreenwell-lab.github.io/okr-command-center/)** · no login, works on desktop and phone

> Two fictional demo companies, switchable from the top bar: a **B2B software company** (bookings, retention, pipeline) and a **consumer app** (active users, retention, acquisition cost, lifetime value). Both are six weeks into Q4; all names and numbers are invented.

---

## The problem it solves

Most OKR programs fail the same way: goals are set in a kickoff, live in a slide deck, and get revisited when the quarter is already lost. Executives end up asking the same questions every week — *What's off track? Why? What's blocked? What do you need from me?* — and someone spends hours assembling the answer.

This tool treats OKRs as an **operating system**, not a document:

| An executive wants to know… | Where it's answered |
|---|---|
| What needs me this week? | **Overview** — the few goals that need an executive, value at risk, decisions waiting, follow-through |
| How does team work connect to company goals? | **OKRs & alignment** — team objectives ladder to company objectives; every item opens a detail panel |
| What changed and why? | **Weekly check-in** — number, 1–10 confidence, note, blocker |
| Did people do what they said they'd do? | **Weekly review** — last week's commitments, overdue items, follow-through by owner, the agenda and the auto-written brief |
| What's waiting on me? | **Decisions & blockers** — decision records (context, options, recommendation, decider, needed-by) and the blocker log |
| Is our meeting rhythm working? | **Operating cadence** — weekly staff, weekly review, monthly review, QBR and offsite, each with decision rights and a pre-read that writes itself |
| Can I trust these numbers? | **Metric definitions** — definition, source, owner and last-verified date for every number; flagged when systems disagree |
| Is the work set up to succeed? | **Resources** — people and budget by objective, goals with no funded work, work tied to no goal, and who is waiting on whom |
| Is anything green actually red? | **Looks green, but…** — on-track goals the evidence contradicts (worsening leading indicators, late upstream work, overdue commitments, stalls, disputed numbers) |
| What should we stop? Did it pay off? | **Payoff check** — each project's promise vs effort used and goal movement; stop or re-scope candidates with the effort still to spend |
| What goes in the board pack? | **Board one-pager** — the quarter on one printable page |
| Can I just ask? | **Ask** — plain-English questions answered from live data, showing how each question was read. Covers the questions research shows executives struggle with: priorities, cross-team reliance, decision speed, data trust, hidden risk, resource allocation, what to stop, payoff, forecasts and what-ifs, meeting value, capacity and what to tell the board |

New visitors get a **2-minute guided tour** (six stops) from the overview or the sidebar.

## Design decisions

- **Pace beats percent.** 40% complete is great in week 4 and alarming in week 11. Every bar carries a tick showing where the work *should* be today.
- **Confidence is a leading indicator.** Status takes the worse of math and owner confidence — someone who says "I won't make it" is believed before the numbers catch up.
- **Blockers are tied to outcomes.** Every risk names the key result it threatens, an owner, a mitigation, and whether an executive decision is the unblock.
- **Decisions are tracked like work.** Pending decisions age on the dashboard until made, then move to a decision log.
- **Silence is a signal.** No check-in for 8+ days marks a key result *stale*.
- **Diagnosis drives the fix.** Suggestions come from the specific signal: a stuck decision gets a push to decide, an out-of-reach target gets a resources/scope/reset call, a confidence drop gets a conversation, silence gets a request for an update.
- **Green is a claim, not a fact.** On-track goals are checked against the evidence around them, because bad news is softened on its way up.
- **Funded work has to earn its keep.** Every project states what it promised and is judged on whether its goal is moving, so stopping work is a routine decision rather than a political one.
- **Dollars, not just percentages.** Value at risk = value at stake × the share of target projected to be missed.
- **Commitments are tracked like work.** A silent miss teaches a team that commitments are optional; overdue items stay visible until done or explicitly dropped.
- **Resources should follow priorities.** Seeing 9% of people on work tied to no goal while two objectives are at risk is the conversation this view exists to start.
- **Leading indicators sit next to lagging ones**, so you can see inputs move before outcomes do.
- **The overview opens with what changed since you last looked.**
- **A number nobody can define is a number nobody should act on.** Reconciling disagreeing sources comes before any other suggested action.
- **Meetings are a system, not a calendar.** Each one has a job, decision rights and an output, and its pre-read writes itself.
- **Decisions are records, not outcomes.** What was decided, the options considered, who decided and why — so "why did we do that?" has an answer.
- **The meeting writes its own agenda.** The brief proposes a 45-minute weekly business review spent on off-track items and pending decisions — not status.

The exact rules are in the app under **How it works**, so anyone can audit why something is flagged.

## The Ask assistant

- **Built-in analyst (default):** answers the questions executives actually ask — *what needs my attention, which decisions are waiting on me, why is X off track, will we hit Y, what changed since last week, who hasn't checked in, how is Operations doing* — scoped to any person, team, objective or topic. Runs in the browser, no account needed; every answer links to the key results it used.
- **Claude (optional):** add your own Anthropic API key in *Settings* and open-ended questions go to Claude with a snapshot of the live OKR data. The key stays in your browser.

## Try it in two minutes

1. Open the demo and take the **2-minute tour**, or read the **Overview**. Switch demo companies from the top bar.
2. In **Ask**, try *"Why is critical bug resolution off track?"* or *"Which decisions are waiting on me?"*
3. In **Decisions & blockers**, click **Record decision**, pick an option and say why — it moves to the decision log with the time it took.
4. Open **Operating cadence** and click a meeting to see its pre-read; open **Metric definitions** and resolve a number where sources disagree.
5. Open **Weekly review** and close out an overdue commitment, then check **Board one-pager**.
6. Go to **Weekly check-in**, change a number and confidence, submit — every view updates.
7. Open **Settings** and move the app date forward to watch pace and staleness change.

Edits save in your browser. *Settings → Reset to demo data* restores the original.

## Tech

Plain HTML, CSS and JavaScript — no framework, no build step, no server. Hosted free on GitHub Pages.

```
index.html        app shell
css/styles.css    design system (light + dark mode, responsive)
js/engine.js      OKR math: progress, pace, status, forecast, attention ranking
js/suggest.js     mitigation suggestions for slipping key results
js/views2.js      weekly review, initiatives, dependencies, history, board one-pager
js/ask.js         question answering (built-in analyst + optional Claude)
js/app.js         views, charts, forms
js/data.js        demo company 1 (B2B software) + shared demo structure
js/data_consumer.js  demo company 2 (consumer app)
js/views3.js      operating cadence, pre-reads, decision records, metric definitions
```

Run locally by opening `index.html` in a browser.

---

Built by Shelby to show how I approach executive operations: design the operating rhythm, then build the system that sustains it.
