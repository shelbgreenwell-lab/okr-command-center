/* "Ask" — answers executive questions about the OKR data.
   Two modes:
   1. Built-in analyst (default, no setup): intent + entity matching over the live data.
   2. Claude (optional): if the viewer adds their own Anthropic API key in Settings,
      open-ended questions go to Claude with a compact snapshot of the data. */

const STOP = new Set('too very a an the is are was were be of to in on for and or with what whats which who whos how hows why our we us me my i do does did any anything there this that it its at by from about show tell give list all can should could would where'.split(' '));

const SYNONYMS = {
  revenue: ['bookings', 'retention', 'revenue', 'pipeline'],
  growth: ['bookings', 'pipeline', 'revenue', 'active users', 'referral'],
  sales: ['pipeline', 'win', 'cycle', 'bookings'],
  money: ['margin', 'bookings', 'revenue'], profit: ['margin', 'profitability'], profitability: ['margin', 'p&l', 'profitability'],
  margin: ['margin', 'p&l'], finance: ['margin', 'forecast', 'p&l'],
  acquisition: ['acquisition', 'payback', 'referral'], cac: ['acquisition cost'], ltv: ['lifetime value'],
  crash: ['crash'], crashes: ['crash'], app: ['app', 'crash', 'rating'], rating: ['rating'], reliability: ['crash', 'start time', 'bugs'],
  activation: ['first-week', 'onboarding'], engagement: ['weekly-to-monthly', 'active'], data: ['metrics', 'discrepanc', 'certified'],
  customers: ['churn', 'promoter', 'time-to-value', 'success', 'support', 'retention'], customer: ['churn', 'promoter', 'success', 'support'],
  churn: ['churn', 'at-risk', 'retention'], loyalty: ['churn', 'promoter', 'retention'], nps: ['promoter'],
  people: ['attrition', 'leadership', 'leaders'], talent: ['attrition', 'leadership', 'internally'],
  hiring: ['internally', 'leadership'], retention: ['retention', 'churn'], attrition: ['attrition'],
  tech: ['roadmap', 'bugs'], technology: ['roadmap', 'bugs'], engineering: ['roadmap', 'bugs'], product: ['roadmap', 'bugs'],
  bugs: ['bugs'], quality: ['bugs', 'promoter'], roadmap: ['roadmap'], shipping: ['roadmap'],
  operations: ['processes', 'tools', 'friction'], process: ['processes'], tools: ['tools', 'software'],
  rhythm: ['check-ins', 'decisions', 'cadence'], decisions: ['decisions'],
};

const INTENTS = [
  { id: 'hidden', re: /green.*(red|really)|really (on track|green)|hidden (risk|problem)|watermelon|look(s)? (fine|good|green) but|false (green|positive)|actually (red|behind|off)/ },
  { id: 'priorities', re: /priorit(y|ies)|what matters most|know what .*(matters|important)|strategy (is )?(clear|understood)/ },
  { id: 'stop', re: /stop doing|should we stop|what to stop|stop funding|\bkill\b|zombie|wasting|cut (back|projects|work)|deprioriti|re-?scope/ },
  { id: 'payoff', re: /pay(ing)? off|payoff|deliver(ed)? (what|on|the)|promised|\broi\b|return on|benefits?\b|was it worth|did .* work\b/ },
  { id: 'whatif', re: /what if|if .* (slip|slips|miss|misses|fail|fails|delay)|scenario|what happens if/ },
  { id: 'capacity', re: /capacity|stretched|overload|too much|bandwidth|spread (too )?thin|enough people|burn ?out/ },
  { id: 'board', re: /\bboard\b|investors?|tell the (ceo|board)/ },
  { id: 'metrics', re: /trust (the|our|these) (numbers|data|metrics)|numbers can we trust|which numbers|metric definition|definition of|defined|source of truth|data quality|discrepanc|reconcil|sources disagree|how (is|are) .* measured/ },
  { id: 'cadence', re: /meeting|cadence|calendar|pre.?read|qbr|offsite|business review|staff meeting|coming up/ },
  { id: 'velocity', re: /how (fast|quickly|long).*(decid|decision)|decision (speed|velocity)|time to decide|slow to decide|decisions (are )?(slow|fast)/ },
  { id: 'since', re: /since (i|my) last|what'?s new|catch me up|did i miss/ },
  { id: 'money', re: /\$|dollar|value (is )?at risk|how much .*(at risk|at stake)|exposure|cost us|at stake|how much (money|revenue|is)|financial impact/ },
  { id: 'commitments', re: /commit|follow.?through|overdue|promised|said (they|he|she) would|action items?|accountab/ },
  { id: 'deps', re: /depend|upstream|downstream|waiting on (another|other|which) team|who is waiting|cross.?team|handoff|rely on|count on|reliab|each other|silo/ },
  { id: 'resources', re: /initiative|project|budget|headcount|\bfte\b|resourc|staff(ed|ing)|funding|funded|spend|where (are )?(our )?people|money where|where .*(money|budget)|allocat/ },
  { id: 'history', re: /history|last quarter|previous quarter|past quarters|sandbag|calibrat|too (safe|easy|ambitious)|track record|good at setting/ },
  { id: 'mitigate', re: /suggest|mitigat|what should (we|i) do|how (do|can) we (fix|recover|get)|recover|back on track|options|next steps?|action plan|what can we do/ },
  { id: 'attention', re: /attention|focus on|worry about|top (3|three|things)|what should i|most important|keep me up/ },
  { id: 'decisions', re: /decision|decide|approv|need from me|waiting on me|my call|sign.?off|unblock|what do you need/ },
  { id: 'status', re: /off.?track|at.?risk|behind|\bred\b|slipping|failing|trouble|worr|concern|lagging|miss/ },
  { id: 'stale', re: /stale|ha(s|ve)n'?t (updated|checked|submitted)|not (updated|checked)|who.*check.?in|no (update|check)|missing (update|check)|overdue|silent|went dark/ },
  { id: 'blockers', re: /block|stuck|risk|impediment|issue|problem|bottleneck|holding .* up|in the way/ },
  { id: 'movers', re: /chang|moved|since last|last week|week over week|improv|worse|drop|momentum|trend|fell|declin/ },
  { id: 'forecast', re: /forecast|land|end of (the )?quarter|will we|on pace|projection|project|hit (the|our)|make it/ },
  { id: 'wins', re: /\bwins?\b|good news|ahead|going well|celebrat|bright spot|what'?s working/ },
  { id: 'why', re: /\bwhy\b|explain|what'?s going on|what happened|dig into|deep dive|tell me about|status of/ },
  { id: 'summary', re: /summar|overall|how are we|how'?s|health|brief|state of|overview|big picture|top 3|priorit|focus/ },
];

const Ask = {
  get suggestions() {
    return (typeof state !== 'undefined' && state && state.meta.suggestions) || ['What needs my attention this week?', 'Which decisions are waiting on me?', 'What changed since last week?', 'Which numbers can we trust?'];
  },

  hasClaude() { try { return !!localStorage.getItem('okr-claude-key'); } catch (e) { return false; } },

  async answer(state, q) {
    if (Ask.hasClaude()) {
      try { return await Ask.claude(state, q); }
      catch (e) {
        const local = Ask.local(state, q);
        local.note = 'Claude was unreachable (' + (e.message || 'error') + '), so this came from the built-in analyst.';
        return local;
      }
    }
    return Ask.local(state, q);
  },

  /* ---------- Built-in analyst ---------- */
  local(state, raw) {
    const q = raw.toLowerCase();
    const intents = INTENTS.filter((i) => i.re.test(q)).map((i) => i.id);
    const scope = Ask.scope(state, q);
    const P = Engine.portfolio(state);
    let krs = scope.krs || P.all.map((x) => x.kr);
    const H = (k) => Engine.kr(state, k);
    const items = (list) => list.map((k) => k.id);
    const label = scope.label;
    const INTENT_LABEL = { hidden: 'goals that look green but may not be', priorities: 'company priorities', stop: 'what to stop', payoff: 'whether funded work paid off', whatif: 'a what-if', capacity: 'capacity', board: 'a board summary', attention: 'what needs attention', decisions: 'decisions waiting', status: 'what is behind', stale: 'missing check-ins', blockers: 'blockers', movers: 'what changed', forecast: 'a forecast', wins: 'what is going well', why: 'an explanation', summary: 'a summary', mitigate: 'how to recover', money: 'value at risk', commitments: 'commitments', deps: 'dependencies', resources: 'people and budget', history: 'goal-setting history', metrics: 'which numbers to trust', cadence: 'upcoming meetings', velocity: 'decision speed', since: 'what changed recently' };
    const GLOBAL = ['priorities', 'stop', 'payoff', 'capacity', 'board', 'hidden'];
    const about = GLOBAL.includes(intents[0]) && !scope.person && !scope.team ? 'the whole company' : scope.person ? scope.person.name : scope.team ? scope.team.name : scope.krs ? (scope.krs.length === 1 ? scope.krs[0].title : scope.krs.length + ' related key results') : 'the whole company';
    const reading = (intents.length ? intents.slice(0, 2).map((i) => INTENT_LABEL[i]).join(' + ') : 'a status update') + ' · about ' + about;
    const out = (text, ids = [], follow = []) => ({ text, items: ids, followups: follow, source: 'local', reading });

    if (intents[0] === 'hidden') {
      let list = P.hidden;
      if (scope.person) list = list.filter((x) => x.kr.owner === scope.person.id);
      else if (scope.team) list = list.filter((x) => scope.krs.includes(x.kr));
      if (!list.length) return out('Nothing marked on track shows warning signs right now: no worsening leading indicators, late upstream work, overdue commitments, stalls or disputed numbers behind a green status.');
      return out(`**${list.length} goal${list.length > 1 ? 's are' : ' is'} marked on track, but the evidence around ${list.length > 1 ? 'them' : 'it'} says otherwise:**\n${list.map((x) => `- **${x.kr.title}** (${U.person(state, x.kr.owner).name}) — ${x.h.hidden.join('; ')}`).join('\n')}\n\nThese are the ones to pressure-test now, before they turn red in a few weeks.`, items(list.map((x) => x.kr)), ['What should we stop doing?']);
    }

    if (intents[0] === 'priorities') {
      const tops = state.objectives.filter((o) => !o.parent);
      const lines = tops.map((o) => { const s = Engine.objective(state, o); return `- **${o.title}** — ${STATUS_LABEL[s.status].toLowerCase()}, ${s.krs.length} key results, ${s.children.length} team objective${s.children.length === 1 ? '' : 's'} supporting it (${s.children.map((c) => U.team(state, c.team).name).join(', ')})`; });
      const orphan = state.objectives.filter((o) => o.parent === null && o.team !== 'co');
      return out(`**The company has ${tops.length} priorities this quarter:**\n${lines.join('\n')}\n\nEvery team objective is linked to one of them${orphan.length ? `, except ${orphan.length}` : ''}. What this can't tell you is whether people actually *know* them — research on strategy execution finds many managers can't name their company's top priorities. A two-question pulse each quarter ("name our top three priorities", "which one does your work serve?") is the way to find out.`, [], ['Which green goals might actually be red?']);
    }

    if (intents[0] === 'stop') {
      const PA = Engine.payoffAll(state);
      if (!PA.stop.length) return out('Nothing stands out to stop: every funded project is tied to a goal and none has used much of its effort without moving it.');
      return out(`**${PA.stop.length} funded project${PA.stop.length > 1 ? 's are' : ' is'} worth stopping or re-scoping**, with about ${fmtK(PA.atStake)} of effort still to spend:\n${PA.stop.map(({ i, p }) => `- **${i.title}** — ${p.action.toLowerCase()}. ${p.why}`).join('\n')}\n\nOpen Resources to see what each one promised and who owns it.`, [...new Set(PA.stop.flatMap(({ i }) => i.krs))], ['Did our initiatives deliver what they promised?']);
    }

    if (intents[0] === 'payoff') {
      const PA = Engine.payoffAll(state);
      const by = (v) => PA.rows.filter((r) => r.p.verdict === v);
      const line = (v, label) => by(v).length ? `- **${label} (${by(v).length}):** ${by(v).map((r) => r.i.title).join(', ')}` : '';
      return out(`**Of ${PA.rows.length} funded projects:**\n${[line('paying', 'Paying off'), line('watch', 'Not yet — their goal is at risk'), line('early', 'Too early to tell'), line('stalled', 'Stalled — effort used, goal not moving'), line('nogoal', 'Tied to no goal')].filter(Boolean).join('\n')}\n\nEach is judged on effort used (budget plus people time) against movement on the main goal it was funded for.`, [], ['What should we stop doing?']);
    }

    if (intents[0] === 'whatif') {
      let k = scope.krs && scope.krs[0];
      if (!k) {
        const ws = q.replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length >= 6 && !STOP.has(w));
        const r = state.risks.find((x) => ws.some((w) => (x.title + ' ' + (x.decision || '')).toLowerCase().includes(w)));
        if (r) { k = state.krs.find((x) => x.id === r.kr); scope.label = r.decision || r.title; }
      }
      if (!k) return out('Name the goal, deal or decision you want to test — for example "What if the Tessera deal slips?" or "What if the contractor budget isn\'t approved?"');
      const h = H(k);
      const flat = Math.min(1, h.progress);
      const exp2 = Math.round((k.stake || 0) * (1 - flat));
      const o = U.obj(state, k.obj); const top = o.parent ? U.obj(state, o.parent) : o; const s = Engine.objective(state, top);
      const ks = [...s.krs, ...state.krs.filter((x) => s.children.some((c) => c.id === x.obj))];
      const before = Engine.projectedScore(state, ks);
      const after = ks.reduce((a, x) => a + (x.id === k.id ? flat : Math.min(1, H(x).projected)), 0) / ks.length;
      return out(`**If "${scope.label && scope.label !== k.title ? scope.label : k.title}" slips and "${k.title}" makes no more progress this quarter:**\n- It ends at **${U.fmt(k, h.value)}** instead of about ${U.fmt(k, h.projectedValue)} (target ${U.fmt(k, k.target)}).\n- Value at risk on it rises from ${fmtK(h.exposure)} to **${fmtK(exp2)}** (+${fmtK(exp2 - h.exposure)}).\n- "${top.title}" projected score falls from ${before.toFixed(2)} to **${after.toFixed(2)}**.\n\nThis is a worst case for this one goal; everything else is held at its current forecast.`, items([k]), ['Which decisions are waiting on me?']);
    }

    if (intents[0] === 'capacity') {
      const load = {}; state.krs.forEach((k) => { const h = H(k); const o = load[k.owner] = load[k.owner] || { n: 0, behind: 0 }; o.n++; if (h.status !== 'on') o.behind++; });
      const heavy = Object.entries(load).filter(([, o]) => o.behind >= 2 || o.n >= 4).sort((a, b) => b[1].behind - a[1].behind);
      const C = Engine.commitments(state); const od = {}; C.overdue.forEach((c) => { od[c.owner] = (od[c.owner] || 0) + 1; });
      const deps = (state.deps || []).filter((d) => !d.delivered); const byT = {}; deps.forEach((d) => { byT[d.fromTeam] = (byT[d.fromTeam] || 0) + 1; });
      const bott = Object.entries(byT).sort((a, b) => b[1] - a[1])[0];
      const inits = {}; (state.initiatives || []).forEach((i) => { inits[i.owner] = (inits[i.owner] || 0) + 1; });
      const multi = Object.entries(inits).filter(([, n]) => n >= 2);
      const L = [];
      heavy.forEach(([id, o]) => L.push(`- **${U.person(state, id).name}** owns ${o.n} key results, ${o.behind} behind${od[id] ? `, and has ${od[id]} overdue commitment${od[id] > 1 ? 's' : ''}` : ''}.`));
      if (bott) L.push(`- **${U.team(state, bott[0]).name}** is the most depended-on team, with ${bott[1]} open asks from other teams.`);
      multi.forEach(([id, n]) => { if (!heavy.some(([h]) => h === id)) L.push(`- ${U.person(state, id).name} leads ${n} funded projects at once.`); });
      return out(`**Where capacity looks stretched:**\n${L.join('\n') || '- Nothing obvious: no owner has several goals behind and no team is a bottleneck.'}\n\nThe app sees ownership and asks, not hours worked — treat this as where to start the conversation.`, [], ['What should we stop doing?']);
    }

    if (intents[0] === 'board') {
      const Hs = state.history || { company: [] };
      const top2 = P.all.filter((x) => x.h.exposure).sort((a, b) => b.h.exposure - a.h.exposure).slice(0, 2);
      const PA = Engine.payoffAll(state);
      return out(`**For the board, in four points:**\n- **Where we are:** ${P.counts.on} of ${P.all.length} key results on track; ${P.counts.off} off track and ${P.counts.risk} at risk. Projected quarter score ${Engine.projectedScore(state, state.krs).toFixed(2)} vs ${Hs.company.length ? Hs.company[Hs.company.length - 1].toFixed(2) : '—'} last quarter.\n- **What's at stake:** ${fmtK(P.exposure)} of value at risk, mostly in "${top2.map((x) => x.kr.title).join('" and "')}".\n- **What we're doing:** ${state.decisions.length} decisions made this quarter; ${P.decisions.length} waiting; ${PA.stop.length} funded projects under review to stop or re-scope.\n- **What we're watching:** ${P.hidden.length} goals marked on track but showing warning signs${P.decisions[0] ? `, and the oldest open decision (${P.decisions[0].decision.toLowerCase()}, ${P.decisions[0].age} days)` : ''}.\n\nThe Board one-pager has the printable version.`, items(top2.map((x) => x.kr)), ['What if the Tessera deal slips to next quarter?']);
    }

    if (intents[0] === 'metrics' || (intents.includes('metrics') && !scope.krs)) {
      const I = Engine.integrity(state);
      let rows = I.rows; if (scope.krs) rows = rows.filter((r) => scope.krs.includes(r.kr));
      const bad = rows.filter((r) => r.mh.status !== 'trusted');
      const desc = (r) => r.mh.status === 'discrepancy' ? `${r.mh.metric.sources.map((x) => x.system + ' says ' + U.fmt(r.kr, x.value)).join(', ')} (${Math.round(r.mh.spread)}% apart). ${r.mh.metric.note}` : r.mh.status === 'unverified' ? `last verified ${r.mh.age} days ago in ${r.mh.metric.source}` : 'no agreed definition';
      return out(`**${rows.length - bad.length} of ${rows.length} numbers${label ? ' in ' + label : ''} are trusted** — defined, recently verified, and every source agrees.${bad.length ? '\n\nTreat these with care:\n' + bad.sort((a, b) => (a.mh.status === 'discrepancy' ? -1 : 1)).map((r) => `- **${r.kr.title}** — ${r.mh.label.toLowerCase()}: ${desc(r)}`).join('\n') : ''}`, items(bad.map((r) => r.kr)), ['What meetings are coming up?']);
    }

    if (intents[0] === 'velocity' || (intents.includes('velocity') && !intents.includes('decisions'))) {
      const V = Engine.decisionVelocity(state);
      return out(`**Decisions take a median of ${V.median ?? '—'} days** from request to decision; ${V.within7 != null ? U.pct(V.within7) : '—'} were made within 7 days this quarter. ${V.waiting.length} are waiting now, the oldest for ${V.oldest} days${V.overdue.length ? `, and ${V.overdue.length} are past their needed-by date` : ''}.`, items(V.waiting.map((d) => state.krs.find((k) => k.id === d.kr)).filter(Boolean)), ['Which decisions are waiting on me?']);
    }

    if (intents[0] === 'cadence' && /worth|value|productive|waste|effective|useful/.test(q)) {
      const V = Engine.decisionVelocity(state); const C = Engine.commitments(state);
      const perMonth = (m) => ({ weekly: 4.33, monthly: 1, quarterly: 1 / 3, semiannual: 1 / 6 }[m.freq] || 0) * m.minutes / 60;
      const hours = (state.cadence || []).reduce((a, m) => a + perMonth(m), 0);
      return out(`**Each executive spends about ${hours.toFixed(0)} hours a month in recurring leadership meetings.** Whether that's worth it shows up in what they produce:\n- **Decisions:** ${state.decisions.length} made this quarter, median ${V.median ?? '—'} days from request to decision; ${V.waiting.length} still waiting, the oldest ${V.oldest} days.\n- **Follow-through:** ${U.pct(C.rate)} of commitments that came due were done; ${C.overdue.length} are overdue.\n- **Design:** every meeting has a stated purpose, decision rights and a pre-read that writes itself, so time goes to deciding rather than status.\n\nIf decisions keep waiting while the meetings run, the weekly exec staff isn't doing its job — that's the one to fix first.`, [], ['How fast do we make decisions?']);
    }
    if (intents[0] === 'cadence') {
      const up = Engine.meetingsBetween(state, state.meta.asOf, 21);
      return out(`**Next three weeks:**\n${up.map((x) => `- **${U.date(x.date, { weekday: 'short', month: 'short', day: 'numeric' })}** — ${x.m.name}: ${x.m.purpose}`).join('\n')}\n\nEvery meeting's pre-read is generated on the Operating cadence page.`, [], ['Which decisions are waiting on me?']);
    }

    if (intents[0] === 'since') {
      const snap = typeof sinceSnap !== 'undefined' && sinceSnap ? sinceSnap : Engine.lastWeekSnapshot(state);
      const d = Engine.diff(state, snap);
      if (d.empty) return out('Nothing material has changed since ' + (snap.firstVisit ? 'last week' : 'you last looked') + '.');
      const L = [];
      d.worse.forEach((x) => L.push(`- **${x.k.title}** slipped to ${STATUS_LABEL[x.to].toLowerCase()}`));
      d.better.forEach((x) => L.push(`- ${x.k.title} improved to ${STATUS_LABEL[x.to].toLowerCase()}`));
      d.newRisks.forEach((r) => L.push(`- New blocker: ${r.title}`));
      d.newDecisions.forEach((x) => L.push(`- Decided: ${x.title}`));
      d.newlyDone.forEach((c) => L.push(`- Done: ${c.text} (${U.person(state, c.owner).name})`));
      return out(`**Since ${snap.firstVisit ? 'last week' : 'you last looked'}:**\n${L.join('\n')}`, items([...d.worse, ...d.better].map((x) => x.k)), ['What needs my attention this week?']);
    }

    if (intents[0] === 'money' || (intents.includes('money') && !scope.krs)) {
      const list = krs.map((k) => ({ k, h: H(k) })).filter((x) => x.h.exposure > 0).sort((a, b) => b.h.exposure - a.h.exposure);
      const total = list.reduce((a, x) => a + x.h.exposure, 0);
      if (!list.length) return out(`No value is at risk${label ? ' in ' + label : ''} — nothing there is behind.`);
      return out(`**${fmtK(total)} of value is at risk${label ? ' in ' + label : ''}** across ${list.length} key result${list.length > 1 ? 's' : ''}. Largest first:\n${list.slice(0, 5).map((x) => `- **${fmtK(x.h.exposure)}** — ${x.k.title} (${STATUS_LABEL[x.h.status].toLowerCase()}). ${x.k.stakeNote || ''}`).join('\n')}\n\nValue at risk = value at stake × the share of target we're projected to miss at today's pace.`, items(list.slice(0, 5).map((x) => x.k)), ['How do we get bookings back on track?']);
    }

    if (intents.includes('commitments')) {
      const C = Engine.commitments(state);
      let od = C.overdue; if (scope.person) od = od.filter((c) => c.owner === scope.person.id);
      if (scope.krs && !scope.person) od = od.filter((c) => scope.krs.some((k) => k.id === c.kr));
      const worst = C.byOwner.filter((o) => o.rate !== null && o.overdue).sort((a, b) => a.rate - b.rate)[0];
      let t = `**Follow-through is ${U.pct(C.rate)}**: of the commitments that have come due, that share was done. ${od.length ? `**${od.length} overdue${label ? ' for ' + label : ''}:**` : 'Nothing is overdue' + (label ? ' for ' + label : '') + '.'}\n`;
      t += od.map((c) => `- ${c.text} — ${U.person(state, c.owner).name}, due ${U.date(c.due)}${c.kr ? ' (' + c.kr + ')' : ''}`).join('\n');
      if (worst && !scope.person) t += `\n\nLowest follow-through: ${U.person(state, worst.owner).name} at ${U.pct(worst.rate)}.`;
      return out(t, [...new Set(od.map((c) => c.kr).filter(Boolean))], ['Which decisions are waiting on me?']);
    }

    if (intents.includes('deps')) {
      let ds = (state.deps || []).map((d) => Engine.dep(state, d)).filter((d) => !d.delivered);
      if (scope.krs) ds = ds.filter((d) => scope.krs.some((k) => k.id === d.kr || k.id === d.onKr));
      if (scope.team) ds = ds.filter((d) => d.fromTeam === scope.team.id || U.workTeam(state, state.krs.find((k) => k.id === d.kr)).name === scope.team.name);
      const risky = ds.filter((d) => d.risk);
      if (!ds.length) return out('No open cross-team dependencies' + (label ? ' for ' + label : '') + '.');
      const byTeam = {}; ds.forEach((d) => { byTeam[d.fromTeam] = (byTeam[d.fromTeam] || 0) + 1; });
      const top = Object.entries(byTeam).sort((a, b) => b[1] - a[1])[0];
      return out(`**${ds.length} open dependencies, ${risky.length} late or at risk.** Most asks are waiting on ${U.team(state, top[0]).name} (${top[1]}).\n${risky.map((d) => `- ${U.workTeam(state, state.krs.find((k) => k.id === d.kr)).name} needs "${d.need}" from ${U.team(state, d.fromTeam).name} — ${d.label}${d.up ? ', because ' + d.up.title.toLowerCase() + ' is ' + STATUS_LABEL[d.upH.status].toLowerCase() : ''}`).join('\n')}`, [...new Set(risky.flatMap((d) => [d.kr, d.onKr]).filter(Boolean))], ['Why is critical bug resolution off track?']);
    }

    if (intents.includes('resources')) {
      const R = Engine.resources(state);
      const lines = R.rows.map((r) => { const st = Engine.objective(state, r.obj).status; return `- **${r.obj.title}** — ${r.fte.toFixed(1)} FTE (${U.pct(r.fte / R.totalFte)}), ${fmtK(r.budget)}; ${STATUS_LABEL[st].toLowerCase()}`; });
      lines.push(`- **Not tied to any objective** — ${R.unaligned.fte} FTE (${U.pct(R.unaligned.fte / R.totalFte)}), ${fmtK(R.unaligned.budget)}: ${R.unaligned.inits.map((i) => i.title.toLowerCase()).join(', ')}`);
      const unc = R.uncovered.filter((k) => H(k).status !== 'on');
      return out(`**${R.totalFte.toFixed(1)} people and ${fmtK(R.totalBudget)} are on initiatives this quarter:**\n${lines.join('\n')}${unc.length ? `\n\n${unc.length} slipping key result${unc.length > 1 ? 's have' : ' has'} no funded work behind ${unc.length > 1 ? 'them' : 'it'}: ${unc.map((k) => k.title.toLowerCase()).join('; ')}.` : ''}`, items(unc), []);
    }

    if (intents.includes('history')) {
      const Hs = state.history; if (!Hs) return out('No quarter history is recorded yet.');
      const rows = state.teams.filter((t) => t.id !== 'co').map((t) => ({ t, cal: Engine.calibration(Hs.teams[t.id] || []), sc: Hs.teams[t.id] || [] }));
      const co = Engine.calibration(Hs.company);
      return out(`**Company scores: ${Hs.company.map((v, i) => Hs.quarters[i] + ' ' + v.toFixed(2)).join(', ')}** — ${co.label.toLowerCase()}. This quarter projects to ${Engine.projectedScore(state, state.krs).toFixed(2)}.\n${rows.map((r) => `- ${r.t.name}: ${r.sc.map((v) => v.toFixed(2)).join(' → ')} — **${r.cal.label.toLowerCase()}**`).join('\n')}`, [], ['Where are our people and budget going?']);
    }

    if (intents.includes('mitigate')) {
      const targets = (scope.krs || P.attention.slice(0, 3).map((x) => x.kr)).filter((k) => Suggest.forKr(state, k).length).slice(0, 3);
      if (!targets.length) return out(`Nothing${label ? ' in ' + label : ''} needs a recovery plan right now — it's all on track.`);
      const txt = targets.map((k) => `**${k.title}** (${STATUS_LABEL[H(k).status].toLowerCase()}, ${U.person(state, k.owner).name}):\n` + Suggest.forKr(state, k).map((sg) => `- **${sg.title}.** ${sg.detail}`).join('\n')).join('\n\n');
      return out(txt + '\n\nOpen any key result to add these to its recovery plan.', items(targets), ['Which decisions are waiting on me?']);
    }

    if (intents[0] === 'attention' && !scope.krs) {
      return out(Ask.brief(state), items(P.attention.slice(0, 5).map((x) => x.kr)), ['Which decisions are waiting on me?', 'What changed since last week?', 'Who hasn\'t checked in?']);
    }

    // Decisions waiting
    if (intents[0] === 'decisions' || (intents.includes('decisions') && !scope.krs)) {
      let ds = P.decisions;
      if (scope.person) ds = ds.filter((d) => d.decisionOwner === scope.person.id || d.owner === scope.person.id);
      if (!ds.length) return out('No decisions are waiting' + (scope.person ? ' on ' + scope.person.name : '') + '. Nothing is blocked on an executive call right now.');
      const lines = ds.map((d) => `- **${d.decision}** — asked by ${U.person(state, d.owner).name}, waiting ${d.age} days. Unblocks ${d.kr}: ${state.krs.find((k) => k.id === d.kr).title.toLowerCase()}. Ask: ${d.mitigation}`);
      return out(`**${ds.length} decision${ds.length > 1 ? 's are' : ' is'} waiting${scope.person ? ' on ' + scope.person.name : ''}.** Oldest first:\n${lines.join('\n')}\n\nClearing the first one moves the most at-risk work.`, ds.map((d) => d.kr), ['What is blocking customer success?', 'What needs my attention this week?']);
    }

    // Stale check-ins
    if (intents.includes('stale')) {
      const st = krs.filter((k) => H(k).stale);
      if (!st.length) return out(`Everyone${label ? ' in ' + label : ''} has checked in within the last ${STALE_DAYS} days.`);
      const lines = st.map((k) => `- **${U.person(state, k.owner).name}** — ${k.title} (last update ${H(k).daysSince} days ago)`);
      return out(`**${st.length} key result${st.length > 1 ? 's have' : ' has'} gone quiet**${label ? ' in ' + label : ''}:\n${lines.join('\n')}\n\nStale data hides problems; a nudge before the weekly review keeps the picture honest.`, items(st));
    }

    // Movers
    if (intents.includes('movers')) {
      const m = krs.map((k) => ({ k, h: H(k) })).filter((x) => !x.h.stale);
      const up = m.filter((x) => x.h.delta > 0.02).sort((a, b) => b.h.delta - a.h.delta).slice(0, 4);
      const conf = m.filter((x) => x.h.confDelta < 0).sort((a, b) => a.h.confDelta - b.h.confDelta).slice(0, 4);
      let t = `**Since last week${label ? ' in ' + label : ''}:**\n`;
      if (up.length) t += '\nMoved the most toward target:\n' + up.map((x) => { const pv = Engine.prevCheckin(x.k); return `- ${x.k.title}: ${pv ? U.fmt(x.k, pv.value) + ' → ' : ''}${U.fmt(x.k, x.h.value)} (target ${U.fmt(x.k, x.k.target)})`; }).join('\n');
      if (conf.length) t += '\n\nConfidence dropped:\n' + conf.map((x) => `- ${x.k.title}: ${x.h.confidence + -x.h.confDelta} → ${x.h.confidence}/10 (${U.person(state, x.k.owner).name})`).join('\n');
      if (!up.length && !conf.length) t += 'Little movement this week.';
      return out(t, items([...conf, ...up].map((x) => x.k)), ['Why did confidence drop?', 'What needs my attention this week?']);
    }

    // Forecast
    if (intents.includes('forecast')) {
      const list = krs.map((k) => ({ k, h: H(k) }));
      if (list.length <= 3 && scope.krs) {
        const t = list.map(({ k, h }) => {
          const verdict = h.projected >= 1 ? 'on course to hit target' : h.projected >= 0.8 ? 'likely to land close but short' : 'not on course to hit target';
          return `**${k.title}**: at the current rate it lands around **${U.fmt(k, h.projectedValue)}** vs a target of ${U.fmt(k, k.target)} — ${verdict}. Owner confidence is ${h.confidence}/10.${h.reasons.length ? ' Watch: ' + h.reasons.join(', ') + '.' : ''}`;
        }).join('\n\n');
        return out(t + '\n\nThe forecast blends the pace so far with the last two weeks, discounted by the owner\'s confidence.', items(krs));
      }
      const hit = list.filter((x) => x.h.projected >= 1), miss = list.filter((x) => x.h.projected < 0.8).sort((a, b) => a.h.projected - b.h.projected);
      return out(`At the current pace, **${hit.length} of ${list.length}** key results${label ? ' in ' + label : ''} would hit target by quarter end and **${miss.length}** would land below 80% of target:\n${miss.map((x) => `- ${x.k.title}: projected ${U.fmt(x.k, x.h.projectedValue)} vs ${U.fmt(x.k, x.k.target)}`).join('\n')}`, items(miss.map((x) => x.k)));
    }

    // Wins
    if (intents.includes('wins') && !intents.includes('status')) {
      const w = krs.map((k) => ({ k, h: H(k) })).filter((x) => x.h.status === 'on' && x.h.gap > 0).sort((a, b) => b.h.gap - a.h.gap).slice(0, 5);
      if (!w.length) return out('Nothing is running ahead of pace' + (label ? ' in ' + label : '') + ' right now.');
      return out(`**Running ahead of plan${label ? ' in ' + label : ''}:**\n${w.map((x) => `- ${x.k.title} — ${U.pct(x.h.progress)} done vs ${U.pct(x.h.expected)} expected (${U.person(state, x.k.owner).name})`).join('\n')}`, items(w.map((x) => x.k)));
    }

    // Blockers
    if (intents.includes('blockers') && !intents.includes('status') || (intents.includes('blockers') && /block|stuck/.test(q))) {
      let rs = state.risks.filter((r) => r.status !== 'closed');
      if (scope.krs) {
        // include blockers on the work these key results depend on
        const ids = new Set(scope.krs.map((k) => k.id));
        (state.deps || []).forEach((d) => { if (ids.has(d.kr) && d.onKr && !d.delivered) ids.add(d.onKr); });
        rs = rs.filter((r) => ids.has(r.kr));
      }
      const sev = { high: 0, medium: 1, low: 2 };
      rs.sort((a, b) => sev[a.severity] - sev[b.severity]);
      if (!rs.length) return out(`No open blockers${label ? (label === 'this area' ? ' in this area' : ' on ' + label) : ''}.`);
      const lines = rs.slice(0, 6).map((r) => `- **${r.title}** (${r.severity}) — ${r.impact} Owner: ${U.person(state, r.owner).name}.${r.decision && !r.decided ? ' Needs decision: ' + r.decision + '.' : ''}${scope.krs && !scope.krs.some((k) => k.id === r.kr) ? ' (upstream: ' + r.kr + ')' : ''}`);
      const theme = Ask.theme(rs);
      return out(`**${rs.length} open blocker${rs.length > 1 ? 's' : ''}${label ? (label === 'this area' ? ' in this area' : ' on ' + label) : ''}.**${theme ? ' ' + theme : ''}\n${lines.join('\n')}`, [...new Set(rs.map((r) => r.kr))], ['Which decisions are waiting on me?']);
    }

    // Why / tell me about a specific thing
    if (scope.krs && (scope.krs.length === 1 && (intents.includes('why') || intents.length === 0) || (intents.includes('why') && scope.krs.length <= 2))) {
      return out(scope.krs.map((k) => Ask.explain(state, k)).join('\n\n'), items(scope.krs), ['Which decisions are waiting on me?']);
    }

    // Status filter (off track / at risk / behind)
    if (intents.includes('status')) {
      const wantOff = /off.?track|\bred\b|failing/.test(q) && !/at.?risk/.test(q);
      const list = krs.map((k) => ({ k, h: H(k) })).filter((x) => wantOff ? x.h.status === 'off' : x.h.status !== 'on').sort((a, b) => b.h.attention - a.h.attention);
      if (!list.length) return out(`Nothing${label ? ' in ' + label : ''} is ${wantOff ? 'off track' : 'off track or at risk'}. ${krs.length} key results are on pace.`);
      const lines = list.map((x) => `- ${STATUS_ICON[x.h.status]} **${x.k.title}** — ${STATUS_LABEL[x.h.status].toLowerCase()}: ${x.h.reasons.join(', ') || 'behind pace'}. ${U.person(state, x.k.owner).name}.`);
      return out(`**${list.length} of ${krs.length}** key results${label ? ' in ' + label : ''} are ${wantOff ? 'off track' : 'off track or at risk'}:\n${lines.join('\n')}`, items(list.map((x) => x.k)), ['What is blocking them?', 'Which decisions are waiting on me?']);
    }

    // Scoped summary (person, team, objective, topic)
    if (scope.krs) return out(Ask.summarize(state, scope.krs, label, scope), items(scope.krs.filter((k) => H(k).status !== 'on')), ['What is blocking them?', 'What changed since last week?']);

    // Nothing recognised: say so rather than guess.
    if (!intents.length && !scope.krs && !scope.person && !scope.team) {
      return { text: 'I\'m not sure what you\'re asking. I can answer questions about goals, blockers, decisions, commitments, dependencies, resources, data quality and meetings. Try one of these, or name a team, person or goal:', items: [], followups: Ask.suggestions.slice(0, 6), source: 'local', reading: 'not recognised' };
    }
    // Default: attention brief
    return out(Ask.brief(state), items(P.attention.slice(0, 5).map((x) => x.kr)), ['Which decisions are waiting on me?', 'What changed since last week?', 'Who hasn\'t checked in?']);
  },

  brief(state) {
    const P = Engine.portfolio(state);
    const top = P.attention.slice(0, 3);
    const pace = P.progress - P.expected;
    let t = `**Week ${Engine.week(state)} of ${Engine.totalWeeks(state)}: ${P.counts.off + P.counts.risk} of ${P.all.length} key results need attention** (${P.counts.off} off track, ${P.counts.risk} at risk) with ${fmtK(P.exposure)} of value at risk.${P.hidden.length ? ` ${P.hidden.length} more are marked on track but show warning signs.` : ''}\n\nWhere to focus:\n`;
    t += top.map((x, i) => `- **${i + 1}. ${x.kr.title}** (${U.workTeam(state, x.kr).name}) — ${x.h.reasons.join(', ')}.`).join('\n');
    if (P.decisions.length) t += `\n\n**${P.decisions.length} decision${P.decisions.length > 1 ? 's' : ''} waiting on executives**, oldest at ${P.decisions[0].age} days: ${P.decisions[0].decision.toLowerCase()}.`;
    if (P.stale.length) t += `\n\n${P.stale.length} key result${P.stale.length > 1 ? 's have' : ' has'} no check-in in over ${STALE_DAYS} days.`;
    return t;
  },

  summarize(state, krs, label, scope) {
    const hs = krs.map((k) => ({ k, h: Engine.kr(state, k) }));
    const c = { on: 0, risk: 0, off: 0 }; hs.forEach((x) => c[x.h.status]++);
    const prog = hs.reduce((a, x) => a + Math.min(1, x.h.progress), 0) / hs.length;
    const who = scope.person ? `${scope.person.name} (${scope.person.title}) owns ${krs.length} key result${krs.length > 1 ? 's' : ''}` : `**${label === 'this area' ? 'In this area' : label}**: ${krs.length} key result${krs.length > 1 ? 's' : ''}`;
    let t = `${who}, ${U.pct(prog)} complete vs ${U.pct(Engine.elapsed(state))} expected. ${c.on} on track, ${c.risk} at risk, ${c.off} off track.\n`;
    t += hs.sort((a, b) => b.h.attention - a.h.attention).map((x) => `- ${STATUS_ICON[x.h.status]} ${x.k.title}: ${U.fmt(x.k, x.h.value)} (target ${U.fmt(x.k, x.k.target)}) — ${STATUS_LABEL[x.h.status].toLowerCase()}${x.h.reasons.length ? ' (' + x.h.reasons.join(', ') + ')' : ''}`).join('\n');
    return t;
  },

  explain(state, k) {
    const h = Engine.kr(state, k);
    const o = U.obj(state, k.obj);
    const last = Engine.lastCheckin(k);
    let t = `**${k.title}** is **${STATUS_LABEL[h.status].toLowerCase()}**. It sits at ${U.fmt(k, h.value)} against a target of ${U.fmt(k, k.target)} (started at ${U.fmt(k, k.start)}): ${U.pct(h.progress)} of the way there with ${U.pct(h.expected)} of the quarter gone.`;
    if (h.reasons.length) t += ` Signals: ${h.reasons.join(', ')}.`;
    if (h.exposure) t += ` About **${fmtK(h.exposure)}** of value is at risk (${(k.stakeNote || 'value at stake × projected shortfall').replace(/\.$/, '')}).`;
    if (last && last.note) t += `\n\n${U.person(state, k.owner).name}'s latest update (${U.date(last.date)}): "${last.note}"`;
    if (h.openRisks.length) t += '\n\nOpen blockers:\n' + h.openRisks.map((r) => `- ${r.title} — ${r.mitigation}${r.decision && !r.decided ? ' **Needs decision: ' + r.decision + '.**' : ''}`).join('\n');
    if (k.leads && k.leads.length) t += '\n\nLeading indicators: ' + k.leads.map((l) => `${l.name.toLowerCase()} ${l.value > l.prev ? 'up' : l.value < l.prev ? 'down' : 'flat'} (${l.prev} → ${l.value}, ${l.value === l.prev ? 'no change' : (l.value > l.prev) === (l.good === 'up') ? 'good' : 'bad'})`).join('; ') + '.';
    if (h.upstream.length) t += '\n\nWaiting on: ' + h.upstream.map((d) => `"${d.need}" from ${U.team(state, d.fromTeam).name} (${d.label})`).join('; ') + '.';
    const sgs = Suggest.forKr(state, k);
    if (sgs.length) t += '\n\nSuggested actions:\n' + sgs.slice(0, 3).map((sg) => `- **${sg.title}.** ${sg.detail}`).join('\n');
    t += `\n\nAt the current rate it lands near ${U.fmt(k, h.projectedValue)}. Supports "${o.title}".`;
    return t;
  },

  theme(rs) {
    const txt = rs.map((r) => (r.title + ' ' + r.impact).toLowerCase()).join(' ');
    if ((txt.match(/capacity|pulled|double-booked|overtime/g) || []).length >= 2) return 'The common thread is **people capacity** being pulled in two directions.';
    return '';
  },

  /* Figure out what the question is about: a person, team, objective, KR, or topic. */
  scope(state, q) {
    const kid = q.match(/\bkr\s?-?(\d+)\b/);
    if (kid) { const k = state.krs.find((x) => x.id === 'KR' + kid[1]); if (k) return { krs: [k], label: k.title }; }
    const oid = q.match(/\bo\s?-?(\d+[ab]?)\b/);
    if (oid) { const o = state.objectives.find((x) => x.id.toLowerCase() === 'o' + oid[1]); if (o) return { krs: state.krs.filter((k) => k.obj === o.id), label: o.title }; }

    for (const p of state.people) {
      const [first, ...rest] = p.name.toLowerCase().split(' ');
      const last = rest.join(' ');
      const roleHit = p.title.toLowerCase().match(/chief (\w+) officer/);
      const acr = roleHit ? 'c' + roleHit[1][0] + 'o' : null;
      if (new RegExp('\\b(' + first + '|' + last + (acr ? '|' + acr : '') + ')\\b').test(q)) {
        const krs = state.krs.filter((k) => k.owner === p.id);
        return { krs: krs.length ? krs : null, label: p.name, person: p };
      }
    }
    for (const t of state.teams) {
      if (t.id === 'co') continue;
      const n = t.name.toLowerCase();
      const alias = { 'customer success': /customer success|\bcs team\b/, operations: /\boperations\b|\bops\b/, 'product & engineering': /\bproduct (and|&) engineering\b|\bengineering team\b|\btech team\b/, people: /\bpeople team\b|\bhr\b|people function/, finance: /\bfinance\b|\bfp&a\b/, sales: /\bsales team\b|\bsales org\b|\bsales\b(?! cycle)/ }[n];
      if (alias ? alias.test(q) : q.includes(n)) {
        const objs = state.objectives.filter((o) => o.team === t.id);
        // include company-level KRs owned by that team's leaders too
        const krs = state.krs.filter((k) => objs.some((o) => o.id === k.obj) || U.person(state, k.owner).team === t.id);
        return { krs, label: t.name, team: t };
      }
    }
    // Match a named blocker, deal or decision (e.g. "Tessera")
    const words = q.replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length >= 5 && !STOP.has(w));
    for (const r of state.risks) {
      const hay = (r.title + ' ' + (r.decision || '')).toLowerCase();
      const toks = [...r.title.split(/\s+/).slice(1), ...(r.decision || '').split(/\s+/).slice(1)];
      const hit = words.find((w) => hay.includes(w) && toks.some((x) => /^[A-Z][a-z]/.test(x) && x.toLowerCase().replace(/[^a-z0-9]/g, '').startsWith(w)));
      if (hit) { const k = state.krs.find((x) => x.id === r.kr); if (k) return { krs: [k], label: r.decision || r.title }; }
    }
    // Topic match against KR titles
    let tokens = q.replace(/[^a-z0-9&\- ]/g, ' ').split(/\s+/).flatMap((w) => w.includes('-') ? [w, ...w.split('-')] : [w]).filter((w) => w && !STOP.has(w) && w.length > 2);
    const expanded = new Set(tokens);
    tokens.forEach((w) => (SYNONYMS[w] || []).forEach((s) => expanded.add(s)));
    const generic = new Set(['week', 'track', 'risk', 'needs', 'attention', 'quarter', 'target', 'hit', 'changed', 'since', 'last', 'blocking', 'blocked', 'decisions', 'waiting', 'off', 'behind', 'doing', 'going', 'status', 'okrs', 'okr', 'results', 'key', 'objectives', 'checked', 'check', 'hasn', 'update', 'drop', 'confidence', 'wins', 'win', 'customer', 'customers', 'attention', 'user', 'users', 'number', 'numbers', 'trust', 'trusted', 'meetings', 'meeting', 'coming', 'value', 'much', 'money', 'overdue', 'commitment', 'commitments', 'committed', 'another', 'team', 'teams', 'other', 'people', 'budget', 'going', 'targets', 'safe', 'ambitious', 'initiatives', 'dependencies', 'following', 'follow', 'through', 'since', 'looked', 'stake', 'worth', 'cost', 'working', 'doing', 'how', 'are']);
    const scored = state.krs.map((k) => {
      const hay = (k.title + ' ' + U.obj(state, k.obj).title).toLowerCase();
      let s = 0;
      expanded.forEach((w) => { const stem = w.replace(/(es|s)$/, ''); if (!generic.has(w) && stem.length > 2 && hay.includes(stem)) s += tokens.includes(w) ? 2 : 1; });
      return { k, s };
    }).filter((x) => x.s > 0).sort((a, b) => b.s - a.s);
    if (scored.length) {
      const best = scored[0].s;
      const krs = scored.filter((x) => x.s >= Math.max(1, Math.floor(best * 0.4))).map((x) => x.k);
      if (krs.length) return { krs, label: krs.length === 1 ? krs[0].title : 'this area' };
    }
    return {};
  },

  /* ---------- Claude ---------- */
  snapshot(state) {
    const P = Engine.portfolio(state);
    return {
      company: state.meta.company, asOf: state.meta.asOf,
      quarter: Engine.quarter(state).label, week: Engine.week(state) + ' of ' + Engine.totalWeeks(state),
      overall: { progress: U.pct(P.progress), expected: U.pct(P.expected), ...P.counts },
      objectives: state.objectives.map((o) => ({ id: o.id, title: o.title, team: U.team(state, o.team).name, owner: U.person(state, o.owner).name, supports: o.parent, why: o.why })),
      keyResults: state.krs.map((k) => {
        const h = Engine.kr(state, k); const last = Engine.lastCheckin(k);
        return { id: k.id, objective: k.obj, title: k.title, owner: U.person(state, k.owner).name, start: U.fmt(k, k.start), target: U.fmt(k, k.target), current: U.fmt(k, h.value),
          progress: U.pct(h.progress), expected: U.pct(h.expected), status: STATUS_LABEL[h.status], confidence: h.confidence, confidenceChange: h.confDelta,
          daysSinceCheckin: h.daysSince, projectedEndValue: U.fmt(k, h.projectedValue), latestNote: last ? last.note : '',
          valueAtStakeK: k.stake || 0, valueAtRiskK: h.exposure, leadingIndicators: k.leads || [],
          suggestedActions: Suggest.forKr(state, k).map((sg) => sg.title + ': ' + sg.detail), recoveryPlan: (k.actions || []).map((x) => x.title + (x.done ? ' (done)' : '')),
          history: k.checkins.map((c) => c.date + ': ' + U.fmt(k, c.value) + ' conf ' + c.confidence) };
      }),
      risks: state.risks.map((r) => ({ id: r.id, kr: r.kr, title: r.title, severity: r.severity, status: r.status, owner: U.person(state, r.owner).name, raised: r.raised, impact: r.impact, mitigation: r.mitigation, decisionNeeded: r.decided ? null : r.decision || null, decisionOwner: r.decisionOwner ? U.person(state, r.decisionOwner).name : null })),
      decisionLog: state.decisions,
      valueAtRiskTotalK: Engine.portfolio(state).exposure,
      commitments: Engine.commitments(state).all.map((c) => ({ text: c.text, owner: U.person(state, c.owner).name, due: c.due, kr: c.kr, status: c.overdue ? 'overdue' : c.status })),
      initiatives: (state.initiatives || []).map((i) => ({ title: i.title, krs: i.krs, owner: U.person(state, i.owner).name, fte: i.fte, budgetK: i.budget, status: i.status })),
      dependencies: (state.deps || []).map((d) => { const x = Engine.dep(state, d); return { kr: d.kr, needsFrom: U.team(state, d.fromTeam).name, need: d.need, due: d.due, reliesOn: d.onKr, state: x.label }; }),
      history: state.history,
      people: state.people.map((p) => p.name + ' — ' + p.title),
    };
  },

  async claude(state, q) {
    const key = localStorage.getItem('okr-claude-key');
    const model = localStorage.getItem('okr-claude-model') || 'claude-sonnet-5-5';
    const system = `You are the chief of staff to the executive team at ${state.meta.company}. You answer questions about the company's OKRs using only the JSON snapshot provided. Lead with the direct answer in one sentence, then give at most 5 short bullets of supporting evidence with key result ids in parentheses (e.g. KR13). Name owners. When something is off track, say what would unblock it and who needs to act. When asked for mitigation ideas, start from suggestedActions and add specific, practical options grounded in the notes and blockers. Never invent numbers that are not in the data. Use plain text with **bold** and "- " bullets only. Keep it under 180 words.`;
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model, max_tokens: 700, system, messages: [{ role: 'user', content: 'OKR snapshot:\n' + JSON.stringify(Ask.snapshot(state)) + '\n\nQuestion: ' + q }] }),
    });
    if (!res.ok) { let m = res.status; try { m = (await res.json()).error.message; } catch (e) {} throw new Error(m); }
    const data = await res.json();
    const text = data.content.filter((c) => c.type === 'text').map((c) => c.text).join('\n');
    const ids = [...new Set((text.match(/\bKR\d+\b/g) || []))].filter((id) => state.krs.some((k) => k.id === id));
    return { text, items: ids, followups: [], source: 'claude' };
  },
};
