/* Executive views: weekly review & commitments, initiatives & resources,
   dependencies, quarter history, and the board one-pager. Shared drawer pieces too. */

/* ---------------- Since you last looked ---------------- */
const VISIT_KEY = 'okr-last-visit-v4';
let sinceSnap = null;
function loadSince() {
  try { const s = localStorage.getItem(VISIT_KEY); if (s) { sinceSnap = JSON.parse(s); return; } } catch (e) {}
  sinceSnap = Engine.lastWeekSnapshot(state);
}
function saveVisit() { try { localStorage.setItem(VISIT_KEY, JSON.stringify(Engine.snapshot(state))); } catch (e) {} }
function sinceBanner() {
  if (!sinceSnap) return '';
  const d = Engine.diff(state, sinceSnap);
  const when = sinceSnap.firstVisit ? 'last week' : 'you last looked';
  if (d.empty) return '';
  const li = [];
  d.worse.forEach((x) => li.push(`<li><span class="st-${x.to}-t sm">${STATUS_ICON[x.to]}</span> <a href="#" data-action="kr" data-id="${x.k.id}">${esc(x.k.title)}</a> slipped from ${STATUS_LABEL[x.from].toLowerCase()} to <b>${STATUS_LABEL[x.to].toLowerCase()}</b></li>`));
  d.better.forEach((x) => li.push(`<li><span class="st-${x.to}-t sm">${STATUS_ICON[x.to]}</span> <a href="#" data-action="kr" data-id="${x.k.id}">${esc(x.k.title)}</a> improved to <b>${STATUS_LABEL[x.to].toLowerCase()}</b></li>`));
  d.newRisks.forEach((r) => li.push(`<li>⚑ New blocker: ${esc(r.title)} <span class="muted">(${esc(r.severity)})</span></li>`));
  d.newDecisions.forEach((x) => li.push(`<li>✓ Decided: ${esc(x.title)}</li>`));
  d.newlyDone.forEach((c) => li.push(`<li>✓ Commitment done: ${esc(c.text)} <span class="muted">(${esc(U.person(state, c.owner).name)})</span></li>`));
  return `<section class="card since"><div class="card-h"><h2>Since ${when}${sinceSnap.firstVisit ? '' : ' · ' + U.date(sinceSnap.at.slice(0, 10))}</h2><button class="btn sm ghost" data-action="dismiss-since">Mark as seen</button></div><ul class="plain compact">${li.slice(0, 8).join('')}</ul></section>`;
}

/* ---------------- Drawer pieces ---------------- */
function leadsHtml(k) {
  if (!k.leads || !k.leads.length) return '';
  return `<h3>Leading indicators</h3><div class="leads">${k.leads.map((l) => {
    const dir = l.value > l.prev ? 'up' : l.value < l.prev ? 'down' : 'flat';
    const good = dir === 'flat' ? null : dir === l.good;
    const fmt = (v) => l.unit === '$M' ? '$' + v + 'M' : l.unit === '$K' ? '$' + v + 'K' : v + (l.unit || '');
    return `<div class="lead"><div class="small">${esc(l.name)}</div><div><b>${fmt(l.value)}</b> <span class="lead-d ${good === null ? '' : good ? 'good' : 'bad'}">${dir === 'up' ? '▲' : dir === 'down' ? '▼' : '■'} ${good === null ? 'flat' : good ? 'improving' : 'worsening'}</span><span class="muted tiny"> from ${fmt(l.prev)}</span></div></div>`;
  }).join('')}</div>`;
}
function depsHtml(k) {
  const mine = Engine.depsFor(state, k.id), theirs = Engine.dependents(state, k.id);
  if (!mine.length && !theirs.length) return '';
  const row = (d, dir) => `<li><span class="dep-badge dep-${d.label.replace(' ', '-')}">${esc(d.label)}</span> ${dir === 'in'
    ? `Needs from <b>${esc(d.up ? d.onKr + ' · ' + U.person(state, d.up.owner).name : U.team(state, d.fromTeam).name)}</b>: ${esc(d.need)}`
    : `<a href="#" data-action="kr" data-id="${d.kr}">${d.kr}</a> needs: ${esc(d.need)}`} <span class="muted tiny">due ${U.date(d.due)}</span></li>`;
  return `<h3>Dependencies</h3><ul class="plain compact">${mine.map((d) => row(d, 'in')).join('')}${theirs.map((d) => row(d, 'out')).join('')}</ul>`;
}
function initsHtml(k) {
  const list = (state.initiatives || []).filter((i) => i.krs.includes(k.id));
  return `<h3>Funded work</h3>${list.length ? `<ul class="plain compact">${list.map((i) => `<li>${pill(i.status)} <b>${esc(i.title)}</b> <span class="muted small">· ${i.fte} FTE · ${fmtK(i.budget)} budget · ${esc(U.person(state, i.owner).name)}</span></li>`).join('')}</ul>` : '<p class="muted small">No initiative is linked to this key result.</p>'}`;
}

/* ---------------- Weekly review ---------------- */
function viewReview() {
  const C = Engine.commitments(state);
  const last = C.lastReview;
  const fromLast = C.all.filter((c) => c.review === last);
  const statusBtns = (c) => `<div class="seg sm">${['open', 'done', 'dropped'].map((s) => `<button class="${c.status === s ? 'on' : ''}" data-action="commit-status" data-id="${c.id}" data-v="${s}">${s[0].toUpperCase() + s.slice(1)}</button>`).join('')}</div>`;
  const crow = (c) => `<div class="crow ${c.status}">
    <div><div class="crow-t">${c.overdue ? '<span class="tag bad">Overdue</span> ' : ''}${esc(c.text)}</div>
    <div class="muted small">${esc(U.person(state, c.owner).name)} · due ${U.date(c.due)}${c.kr ? ` · <a href="#" data-action="kr" data-id="${c.kr}">${c.kr}</a>` : ''}${c.source === 'plan' ? ' · from recovery plan' : ''}</div></div>${statusBtns(c)}</div>`;
  const others = C.all.filter((c) => c.review !== last && c.status === 'open').sort((a, b) => a.due.localeCompare(b.due));
  const owners = C.byOwner.filter((o) => o.rate !== null).sort((a, b) => a.rate - b.rate).map((o) => `<tr><td>${avatar(state, o.owner, 'sm')} ${esc(U.person(state, o.owner).name)}</td><td class="num">${o.done}</td><td class="num">${o.overdue ? `<b class="bad">${o.overdue}</b>` : 0}</td><td class="num">${o.dropped}</td><td class="num"><b>${U.pct(o.rate)}</b></td></tr>`).join('');
  const P = Engine.portfolio(state);
  const agenda = briefText().split('\n');
  const ai = agenda.findIndex((l) => l.startsWith('PROPOSED WEEKLY'));
  const agendaHtml = agenda.slice(ai + 1).filter((l) => l.startsWith('•')).map((l) => `<li>${esc(l.slice(2))}</li>`).join('');
  return `
  <header class="page-h"><div><h1>Weekly review</h1><p class="muted">Close the loop on last week's commitments before making new ones. Overdue items stay visible until they're done or explicitly dropped.</p></div></header>
  <section class="kpis small4">
    <div class="kpi"><div class="kpi-label">Follow-through rate</div><div class="kpi-val">${U.pct(C.rate)}</div><div class="kpi-sub">of commitments due were done</div></div>
    <div class="kpi"><div class="kpi-label">Overdue</div><div class="kpi-val">${C.overdue.length}</div><div class="kpi-sub">open past due date</div></div>
    <div class="kpi"><div class="kpi-label">Open</div><div class="kpi-val">${C.open.length}</div><div class="kpi-sub">including recovery plans</div></div>
    <div class="kpi"><div class="kpi-label">Decisions waiting</div><div class="kpi-val">${P.decisions.length}</div><div class="kpi-sub"><a href="#/risks">review →</a></div></div>
  </section>
  <section class="grid2 wide-left">
    <div>
      <div class="card"><div class="card-h"><h2>Commitments from the ${last ? U.date(last) : 'last'} review</h2></div>${fromLast.map(crow).join('') || '<p class="muted">None recorded.</p>'}</div>
      <div class="card"><div class="card-h"><h2>Other open commitments</h2></div>${others.map(crow).join('') || '<p class="muted">None.</p>'}</div>
    </div>
    <div>
      <div class="card"><div class="card-h"><h2>Today's agenda</h2><a href="#/brief" class="small">Full brief →</a></div><ul class="agenda">${agendaHtml}</ul></div>
      <div class="card"><div class="card-h"><h2>Capture a commitment</h2></div>
        <form data-form="commit" class="stack">
          <label>What will be done<input name="text" required placeholder="e.g. Bring two staffing options to Friday's staff meeting"/></label>
          <div class="two"><label>Owner<select name="owner">${state.people.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></label>
          <label>Due<input type="date" name="due" value="${addDays(state.meta.asOf, 7)}" required/></label></div>
          <label>Key result<select name="kr"><option value="">— None —</option>${state.krs.map((k) => `<option value="${k.id}">${k.id} · ${esc(k.title)}</option>`).join('')}</select></label>
          <button class="btn primary" type="submit">Add commitment</button>
        </form></div>
      <div class="card"><div class="card-h"><h2>Follow-through by owner</h2></div>
        <div class="table-wrap"><table class="simple"><thead><tr><th>Owner</th><th>Done</th><th>Overdue</th><th>Dropped</th><th>Rate</th></tr></thead><tbody>${owners}</tbody></table></div>
        <p class="muted tiny">Rate = done ÷ (done + overdue + dropped). Open items not yet due don't count.</p></div>
    </div>
  </section>`;
}

/* ---------------- Initiatives & resources ---------------- */
function viewInitiatives() {
  const R = Engine.resources(state);
  const maxF = Math.max(...R.rows.map((r) => r.fte), R.unaligned.fte, 1);
  const rowBar = (label, fte, budget, cls, sub) => `<div class="rrow"><div class="rrow-name">${label}${sub ? `<div class="muted tiny">${sub}</div>` : ''}</div>
    <div class="rbar-wrap" data-tip="${esc(`${fte.toFixed(1)} FTE (${U.pct(fte / R.totalFte)}) · ${fmtK(budget)} budget (${U.pct(budget / R.totalBudget)})`)}"><div class="rbar ${cls}" style="width:${(fte / maxF) * 100}%"></div></div>
    <div class="rrow-v"><b>${fte.toFixed(1)}</b> FTE<div class="muted tiny">${fmtK(budget)}</div></div></div>`;
  const bars = R.rows.map((r) => { const s = Engine.objective(state, r.obj); return rowBar(`<span class="oid">${r.obj.id}</span> ${esc(r.obj.title)}`, r.fte, r.budget, 'pbar-' + s.status, STATUS_LABEL[s.status]); }).join('')
    + rowBar('Not linked to any objective', R.unaligned.fte, R.unaligned.budget, 'rbar-none', `${R.unaligned.inits.length} initiatives`);
  const rows = (state.initiatives || []).map((i) => {
    const krs = i.krs.map((id) => { const k = state.krs.find((x) => x.id === id); return k ? `<a href="#" data-action="kr" data-id="${id}" data-tip="${esc(k.title)}">${id}</a>` : id; }).join(', ');
    const burn = i.budget ? i.spent / i.budget : 0;
    return `<tr class="${i.krs.length ? '' : 'unaligned'}"><td><b>${esc(i.title)}</b><div class="muted tiny">${esc(U.team(state, i.team).name)}</div></td>
      <td>${krs || '<span class="tag warn">No key result</span>'}</td><td>${avatar(state, i.owner, 'sm')} <span class="small">${esc(U.person(state, i.owner).name)}</span></td>
      <td class="num">${i.fte}</td><td class="num">${i.budget ? fmtK(i.budget) : '—'}<div class="muted tiny">${i.budget ? U.pct(burn) + ' spent' : '—'}</div></td><td>${pill(i.status)}</td></tr>`;
  }).join('');
  const unc = R.uncovered.map((k) => { const h = Engine.kr(state, k); return `<li>${pill(h.status)} <a href="#" data-action="kr" data-id="${k.id}">${esc(k.title)}</a> <span class="muted small">· ${esc(U.person(state, k.owner).name)}</span></li>`; }).join('');
  const offFunded = R.rows.map((r) => ({ r, s: Engine.objective(state, r.obj) })).filter((x) => x.s.status !== 'on');
  return `
  <header class="page-h"><div><h1>Initiatives & resources</h1><p class="muted">The funded work behind the numbers. Shows where people and money go, which key results have no plan behind them, and which work isn't tied to any goal.</p></div>
  <button class="btn primary" data-action="new-init">+ Initiative</button></header>
  <section class="kpis small4">
    <div class="kpi"><div class="kpi-label">People on initiatives</div><div class="kpi-val">${R.totalFte.toFixed(1)}</div><div class="kpi-sub">FTE</div></div>
    <div class="kpi"><div class="kpi-label">Initiative budget</div><div class="kpi-val">${fmtK(R.totalBudget)}</div><div class="kpi-sub">this quarter</div></div>
    <div class="kpi"><div class="kpi-label">Not tied to a goal</div><div class="kpi-val">${U.pct(R.unaligned.fte / R.totalFte)}</div><div class="kpi-sub">of people · ${fmtK(R.unaligned.budget)} budget</div></div>
    <div class="kpi"><div class="kpi-label">Key results with no plan</div><div class="kpi-val">${R.uncovered.length}</div><div class="kpi-sub">of ${state.krs.length}</div></div>
  </section>
  <section class="grid2">
    <div class="card"><div class="card-h"><h2>People by company objective</h2><span class="muted small">Bar = FTE; color = objective health</span></div>${bars}
      ${offFunded.length ? `<p class="small callout-plain">${offFunded.map((x) => `<b>${x.r.obj.id}</b> is ${STATUS_LABEL[x.s.status].toLowerCase()} with ${x.r.fte.toFixed(1)} FTE`).join('; ')}. ${R.unaligned.fte ? `Meanwhile ${R.unaligned.fte} FTE sit on work tied to no objective.` : ''}</p>` : ''}</div>
    <div class="card"><div class="card-h"><h2>Key results with no funded work</h2></div><ul class="plain compact">${unc || '<li class="muted">Every key result has an initiative.</li>'}</ul></div>
  </section>
  <div class="card flush"><div class="table-wrap"><table class="risks"><thead><tr><th>Initiative</th><th>Drives</th><th>Owner</th><th>FTE</th><th>Budget</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}

/* ---------------- Dependencies ---------------- */
function viewDeps() {
  const deps = (state.deps || []).map((d) => Engine.dep(state, d));
  const teams = state.teams;
  const byProvider = {};
  deps.forEach((d) => { (byProvider[d.fromTeam] = byProvider[d.fromTeam] || []).push(d); });
  const groups = Object.entries(byProvider).sort((a, b) => b[1].filter((d) => d.risk).length - a[1].filter((d) => d.risk).length).map(([tid, list]) => {
    const atRisk = list.filter((d) => d.risk).length;
    return `<div class="card"><div class="card-h"><h2>Waiting on ${esc(U.team(state, tid).name)}</h2><span class="small ${atRisk ? 'bad' : 'muted'}">${atRisk ? atRisk + ' at risk or late' : 'all on time'}</span></div>
      <ul class="plain">${list.map((d) => { const k = state.krs.find((x) => x.id === d.kr); const team = U.workTeam(state, k).name; return `<li><span class="dep-badge dep-${d.label.replace(' ', '-')}">${esc(d.label)}</span>
        <b>${esc(team)}</b> needs <i>${esc(d.need)}</i> by ${U.date(d.due)}
        <div class="muted small">For <a href="#" data-action="kr" data-id="${k.id}">${esc(k.title)}</a>${d.up ? ` · depends on <a href="#" data-action="kr" data-id="${d.up.id}">${esc(d.up.title)}</a> (${STATUS_LABEL[d.upH.status].toLowerCase()})` : ''}</div></li>`; }).join('')}</ul></div>`;
  }).join('');
  // team x team matrix: rows = team that needs, cols = team providing
  const used = teams.filter((t) => deps.some((d) => d.fromTeam === t.id || U.workTeam(state, state.krs.find((k) => k.id === d.kr)).name === t.name));
  const cell = (need, give) => { const list = deps.filter((d) => d.fromTeam === give.id && U.workTeam(state, state.krs.find((k) => k.id === d.kr)).name === need.name && !d.delivered); if (!list.length) return '<td class="mx-empty">·</td>'; const r = list.filter((d) => d.risk).length; return `<td class="mx ${r ? 'mx-risk' : ''}" data-tip="${esc(list.map((d) => d.need).join(' · '))}">${list.length}${r ? `<small> (${r}⚠)</small>` : ''}</td>`; };
  const matrix = `<table class="simple matrix"><thead><tr><th>Needs ↓ / from →</th>${used.map((t) => `<th>${esc(t.name)}</th>`).join('')}</tr></thead><tbody>${used.map((n) => `<tr><th>${esc(n.name)}</th>${used.map((g) => cell(n, g)).join('')}</tr>`).join('')}</tbody></table>`;
  const late = deps.filter((d) => d.late).length, risk = deps.filter((d) => d.risk && !d.late).length;
  return `
  <header class="page-h"><div><h1>Dependencies</h1><p class="muted">Who is waiting on whom. A dependency is flagged when it is past due or when the work it relies on is itself behind — so one team's slip shows up before it lands on another.</p></div>
  <button class="btn primary" data-action="new-dep">+ Dependency</button></header>
  <section class="kpis small4">
    <div class="kpi"><div class="kpi-label">Open dependencies</div><div class="kpi-val">${deps.filter((d) => !d.delivered).length}</div></div>
    <div class="kpi"><div class="kpi-label">Late</div><div class="kpi-val">${late}</div></div>
    <div class="kpi"><div class="kpi-label">At risk</div><div class="kpi-val">${risk}</div><div class="kpi-sub">upstream work is behind</div></div>
    <div class="kpi"><div class="kpi-label">Most depended-on</div><div class="kpi-val sm">${esc(U.team(state, Object.entries(byProvider).sort((a, b) => b[1].length - a[1].length)[0][0]).name)}</div></div>
  </section>
  <section class="card"><div class="card-h"><h2>Dependency map</h2><span class="muted small">Count of open asks · ⚠ = late or at risk</span></div><div class="table-wrap">${matrix}</div></section>
  <section class="grid2">${groups}</section>`;
}

/* ---------------- Quarter history ---------------- */
function viewHistory() {
  const H = state.history || { quarters: [], company: [], teams: {} };
  const curQ = Engine.quarter(state).label;
  const projCo = Engine.projectedScore(state, state.krs);
  const teamProj = (tid) => Engine.projectedScore(state, Engine.team(state, tid).krs);
  const cell = (v, proj) => v == null ? '<td class="muted">—</td>' : `<td class="score ${v >= 0.9 ? 'sc-hi' : v >= 0.6 ? 'sc-ok' : v >= 0.5 ? 'sc-mid' : 'sc-lo'} ${proj ? 'proj' : ''}">${v.toFixed(2)}</td>`;
  const rows = state.teams.filter((t) => t.id !== 'co').map((t) => {
    const past = H.teams[t.id] || [];
    const cal = Engine.calibration(past);
    return `<tr><th>${esc(t.name)}</th>${H.quarters.map((q, i) => cell(past[i])).join('')}${cell(teamProj(t.id), true)}<td><span class="tag ${cal.tone}">${cal.label}</span></td></tr>`;
  }).join('');
  const series = [...H.company.map((v, i) => [i, v]), [H.quarters.length, projCo]];
  chartFormatters.history = { x: (i) => (H.quarters[i] || curQ + ' (projected)'), y: (v) => v.toFixed(2) };
  const chart = lineChart({ id: 'history', series: [{ name: 'Company score', cls: 's1', pts: series, dot: true }], xMax: H.quarters.length, xLabel: (i) => (H.quarters[i] || curQ + '*'), yFmt: (v) => v.toFixed(2), height: 200 });
  const coCal = Engine.calibration(H.company);
  return `
  <header class="page-h"><div><h1>Quarter history</h1><p class="muted">How well we set goals, not just whether we hit them. Scores are 0.0–1.0 averaged across each team's key results. Around 0.7 means the targets stretched people; consistently above 0.9 means they probably didn't.</p></div></header>
  <section class="grid2">
    <div class="card"><div class="card-h"><h2>Company score by quarter</h2><span class="tag ${coCal.tone}">${coCal.label}</span></div>${chart}<p class="muted tiny">* ${esc(curQ)} is projected from the current pace.</p></div>
    <div class="card prose"><h2>Reading the calibration</h2>
      <ul><li><span class="tag good">Healthy stretch</span> averages 0.6–0.9: ambitious targets, mostly delivered.</li>
      <li><span class="tag warn">Targets may be too safe</span> 0.9+ every quarter: the team is likely sandbagging. Ask for a bigger number.</li>
      <li><span class="tag warn">Slightly over-ambitious</span> 0.5–0.6: fine for one quarter, a problem if it persists.</li>
      <li><span class="tag bad">Over-committing or under-resourced</span> below 0.5: targets and capacity don't match. Check <a href="#/initiatives">resources</a>.</li></ul></div>
  </section>
  <div class="card flush"><div class="table-wrap"><table class="simple hist"><thead><tr><th>Team</th>${H.quarters.map((q) => `<th>${esc(q)}</th>`).join('')}<th>${esc(curQ)} <span class="muted tiny">projected</span></th><th>Pattern (past quarters)</th></tr></thead>
  <tbody>${rows}<tr class="total"><th>Company</th>${H.company.map((v) => cell(v)).join('')}${cell(projCo, true)}<td><span class="tag ${coCal.tone}">${coCal.label}</span></td></tr></tbody></table></div></div>`;
}

/* ---------------- Board one-pager ---------------- */
function viewBoard() {
  const P = Engine.portfolio(state);
  const q = Engine.quarter(state);
  const R = Engine.resources(state);
  const H = state.history || { company: [] };
  const projCo = Engine.projectedScore(state, state.krs);
  const objRows = state.objectives.filter((o) => !o.parent).map((o) => {
    const s = Engine.objective(state, o);
    const exp = s.krs.reduce((a, k) => a + Engine.kr(state, k).exposure, 0) + s.children.reduce((a, c) => a + state.krs.filter((k) => k.obj === c.id).reduce((b, k) => b + Engine.kr(state, k).exposure, 0), 0);
    const r = R.rows.find((x) => x.obj.id === o.id);
    return `<tr><td><b>${esc(o.title)}</b><div class="muted tiny">${esc(U.person(state, o.owner).name)}</div></td><td>${pill(s.status)}</td><td class="num">${U.pct(s.progress)}</td><td class="num">${Engine.projectedScore(state, [...s.krs, ...state.krs.filter((k) => s.children.some((c) => c.id === k.obj))]).toFixed(2)}</td><td class="num">${exp ? fmtK(exp) : '—'}</td><td class="num">${r ? U.pct(r.fte / R.totalFte) : '—'}</td></tr>`;
  }).join('');
  const topExp = P.all.filter((x) => x.h.exposure > 0).sort((a, b) => b.h.exposure - a.h.exposure).slice(0, 3);
  const risks = state.risks.filter((r) => r.status !== 'closed').map((r) => ({ r, k: state.krs.find((x) => x.id === r.kr) })).map((x) => ({ ...x, exp: Engine.kr(state, x.k).exposure }))
    .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.r.severity] - { high: 0, medium: 1, low: 2 }[b.r.severity]) || b.exp - a.exp).slice(0, 2);
  const decisions = state.decisions.slice().sort((a, b) => a.date.localeCompare(b.date));
  const pace = P.progress - P.expected;
  const headline = [
    `${U.pct(P.progress)} of quarterly goals complete at week ${Engine.week(state)} of ${Engine.totalWeeks(state)} (${pace >= -0.05 ? 'on pace' : 'behind pace'}); ${P.counts.on} of ${P.all.length} key results on track.`,
    `${fmtK(P.exposure)} of value at risk, concentrated in ${topExp.map((x) => x.kr.title).slice(0, 2).join(' and ')}.`,
    `Projected quarter score ${projCo.toFixed(2)} vs ${H.company.length ? H.company[H.company.length - 1].toFixed(2) : '—'} last quarter.`,
  ];
  return `
  <header class="page-h noprint-row"><div><h1>Board one-pager</h1><p class="muted">The quarter on one page, formatted for a board pack. Generated from the same live data.</p></div>
  <div class="row"><button class="btn" data-action="print">Print / PDF</button></div></header>
  <article class="card board">
    <div class="board-h"><div><div class="muted small">${esc(state.meta.company)} · Board update</div><h2>${esc(q.label)} OKR review</h2></div><div class="muted small">As of ${U.date(state.meta.asOf, { month: 'long', day: 'numeric', year: 'numeric' })}</div></div>
    <h3>Headline</h3><ul>${headline.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>
    <h3>Company objectives</h3>
    <table class="simple"><thead><tr><th>Objective</th><th>Status</th><th>Progress</th><th>Proj. score</th><th>Value at risk</th><th>% of people</th></tr></thead><tbody>${objRows}</tbody></table>
    <div class="board-cols">
      <div><h3>Largest value at risk</h3><ul>${topExp.map((x) => `<li><b>${fmtK(x.h.exposure)}</b> — ${esc(x.kr.title)} <span class="muted">(${STATUS_LABEL[x.h.status].toLowerCase()})</span></li>`).join('')}</ul></div>
      <div><h3>Top risks</h3><ul>${risks.map((x) => `<li><b>${esc(x.r.title)}.</b> ${esc(x.r.impact)} <span class="muted">Response: ${esc(x.r.mitigation)}</span></li>`).join('')}</ul></div>
    </div>
    <div class="board-cols">
      <div><h3>Decisions made this quarter</h3><ul>${decisions.map((d) => `<li><span class="muted">${U.date(d.date)}</span> ${esc(d.title)}</li>`).join('') || '<li class="muted">None yet.</li>'}</ul></div>
      <div><h3>Execution health</h3><ul>
        <li>Commitment follow-through: <b>${U.pct(P.commitments.rate)}</b> (${P.commitments.overdue.length} overdue)</li>
        <li>Exec decisions waiting: <b>${P.decisions.length}</b>${P.decisions.length ? `, oldest ${P.decisions[0].age} days` : ''}</li>
        <li>People on work tied to no objective: <b>${U.pct(R.unaligned.fte / R.totalFte)}</b></li>
        <li>Key results with a current check-in: <b>${P.all.length - P.stale.length} of ${P.all.length}</b></li></ul></div>
    </div>
  </article>`;
}
