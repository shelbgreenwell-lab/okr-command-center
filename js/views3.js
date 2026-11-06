/* Operating cadence (meetings, pre-reads, decision speed), metric definitions,
   and decision records (request a decision / record a decision). */

/* Shared memo renderer: UPPERCASE lines become headings, "• " lines become bullets. */
function memoHtml(txt) {
  return txt.split('\n').map((l) => {
    const head = l.split(' (')[0];
    if (head.length > 3 && /^[A-Z]/.test(head) && !/[a-z]/.test(head)) return `<h3>${esc(l)}</h3>`;
    if (l.startsWith('HEADLINE:')) return `<p class="headline">${esc(l.replace('HEADLINE: ', ''))}</p>`;
    if (l.startsWith('VALUE AT RISK:')) return `<p class="small"><b>Value at risk:</b> ${esc(l.replace('VALUE AT RISK: ', ''))}</p>`;
    if (l.startsWith('•')) return `<li>${esc(l.slice(2))}</li>`;
    if (l.startsWith('   ↳') || l.startsWith('   ')) return `<div class="sub">${esc(l.trim())}</div>`;
    return l ? `<p>${esc(l)}</p>` : '';
  }).join('').replace(/(<li>.*?<\/li>)+/g, (m) => `<ul>${m}</ul>`);
}

const FREQ_LABEL = { weekly: 'Weekly', monthly: 'Monthly', quarterly: 'Quarterly', semiannual: 'Twice a year' };
const DAY_NAME = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const mins = (m) => m >= 480 ? (m / 480).toFixed(0) + ' day' + (m >= 960 ? 's' : '') : m >= 60 ? (m / 60).toFixed(m % 60 ? 1 : 0) + ' hr' : m + ' min';

/* ---------------- Operating cadence ---------------- */
function viewCadence() {
  const V = Engine.decisionVelocity(state);
  const upcoming = Engine.meetingsBetween(state, state.meta.asOf, 42);
  const weeks = {};
  upcoming.forEach((x) => { const d = Engine.d(x.date); const mon = new Date(d); mon.setDate(d.getDate() - ((d.getDay() + 6) % 7)); const k = mon.toISOString().slice(0, 10); (weeks[k] = weeks[k] || []).push(x); });
  const strip = Object.entries(weeks).map(([wk, list]) => `<div class="wk"><div class="wk-h">Week of ${U.date(wk)}</div>${list.map((x) => `<button class="mtg mtg-${x.m.freq}" data-action="preread" data-id="${x.m.id}"><b>${esc(x.m.name)}</b><span>${U.date(x.date, { weekday: 'short', month: 'short', day: 'numeric' })}</span></button>`).join('')}</div>`).join('');
  const perMonth = (m) => ({ weekly: 4.33, monthly: 1, quarterly: 1 / 3, semiannual: 1 / 6 }[m.freq] || 0) * m.minutes / 60;
  const hours = (state.cadence || []).reduce((a, m) => a + perMonth(m), 0);
  const cards = (state.cadence || []).map((m) => `<div class="card mcard">
    <div class="card-h"><div><h2>${esc(m.name)}</h2><div class="muted small">${FREQ_LABEL[m.freq]}${m.weekday != null && m.freq !== 'quarterly' ? ' · ' + DAY_NAME[m.weekday] + (m.freq === 'monthly' ? ' (first of the month)' : '') : ''} · ${mins(m.minutes)} · run by ${personLk(m.owner)}</div></div>
      <button class="btn sm" data-action="preread" data-id="${m.id}">Open pre-read</button></div>
    <dl class="mdl"><dt>Purpose</dt><dd>${esc(m.purpose)}</dd><dt>Who attends</dt><dd>${esc(m.attendees)}</dd><dt>Decision rights</dt><dd>${esc(m.rights)}</dd><dt>Leaves with</dt><dd>${esc(m.output)}</dd>
    <dt>Next</dt><dd><b>${U.date(Engine.nextMeeting(state, m), { weekday: 'long', month: 'long', day: 'numeric' })}</b></dd></dl></div>`).join('');
  return `
  <header class="page-h"><div><h1>Operating cadence</h1><p class="muted">The leadership team's meetings as one system: each has a purpose, decision rights and a pre-read that writes itself from live data, so meetings are spent deciding rather than catching up.</p></div>
  <button class="btn primary" data-action="request-decision">+ Request a decision</button></header>
  <section class="kpis small4">
    <div class="kpi"><div class="kpi-label">Median time to decide</div><div class="kpi-val">${V.median != null ? V.median + 'd' : '—'}</div><div class="kpi-sub">from request to decision</div></div>
    <div class="kpi"><div class="kpi-label">Decided within 7 days</div><div class="kpi-val">${V.within7 != null ? U.pct(V.within7) : '—'}</div><div class="kpi-sub">of ${V.made} decisions this quarter</div></div>
    <div class="kpi link" data-action="nav" data-to="risks"><div class="kpi-label">Waiting now</div><div class="kpi-val">${V.waiting.length}</div><div class="kpi-sub">${V.overdue.length ? `<b class="bad">${V.overdue.length} past their needed-by date</b>` : `oldest ${V.oldest} days`}</div></div>
    <div class="kpi"><div class="kpi-label">Exec time in recurring meetings</div><div class="kpi-val">${hours.toFixed(0)} hrs</div><div class="kpi-sub">per person per month</div></div>
  </section>
  <section class="card"><div class="card-h"><h2>Next six weeks</h2><span class="muted small">Click a meeting for its pre-read</span></div><div class="wkstrip">${strip}</div></section>
  <section class="grid2">${cards}</section>`;
}

/* ---------------- Pre-reads ---------------- */
function prereadText(kind) {
  const P = Engine.portfolio(state);
  const L = [];
  const co = state.meta.company;
  const asOf = U.date(state.meta.asOf, { month: 'long', day: 'numeric', year: 'numeric' });
  if (kind === 'wbr') return briefText();
  if (kind === 'staff') {
    L.push(`${co} — Weekly exec staff pre-read`, `Prepared ${asOf}`, '');
    L.push(`HEADLINE: ${P.decisions.length} decisions waiting; oldest ${P.decisions[0] ? P.decisions[0].age : 0} days. ${P.openRisks.filter((r) => r.severity === 'high').length} high-severity blockers open.`, '');
    P.decisions.forEach((d, i) => {
      L.push(`DECISION ${i + 1}: ${d.decision.toUpperCase()}`);
      if (d.context) L.push(d.context);
      (d.options || []).forEach((o) => L.push(`• Option: ${o}${o === d.recommendation ? '  ← recommended' : ''}`));
      L.push(`• Decider: ${U.person(state, d.decisionOwner).name}${d.consulted ? ' · Consulted: ' + d.consulted.map((id) => U.person(state, id).name).join(', ') : ''}`);
      L.push(`• Waiting ${d.age} days${d.neededBy ? ' · needed by ' + U.date(d.neededBy) : ''} · unblocks ${d.kr}`);
      L.push('');
    });
    const fresh = state.risks.filter((r) => r.status !== 'closed' && Engine.daysBetween(r.raised, state.meta.asOf) <= 7);
    if (fresh.length) { L.push('NEW BLOCKERS THIS WEEK'); fresh.forEach((r) => L.push(`• ${r.title} (${r.severity}) — ${r.impact}`)); }
    return L.join('\n');
  }
  if (kind === 'mbr') {
    const I = Engine.integrity(state), R = Engine.resources(state);
    L.push(`${co} — Monthly business review pre-read`, `Prepared ${asOf}`, '');
    L.push(`HEADLINE: ${I.counts.trusted} of ${state.krs.length} numbers trusted; ${I.counts.discrepancy} where sources disagree. ${fmtK(P.exposure)} of value at risk.`, '');
    L.push('1. CERTIFY THE NUMBERS');
    I.rows.filter((r) => r.mh.status === 'discrepancy').forEach((r) => L.push(`• ${r.kr.title}: ${r.mh.metric.sources.map((x) => x.system + ' ' + U.fmt(r.kr, x.value)).join(' vs ')} (${Math.round(r.mh.spread)}% apart). ${r.mh.metric.note}`));
    I.rows.filter((r) => r.mh.status === 'unverified').forEach((r) => L.push(`• ${r.kr.title}: last verified ${r.mh.age} days ago (${r.mh.metric.source}).`));
    I.rows.filter((r) => r.mh.status === 'undefined').forEach((r) => L.push(`• ${r.kr.title}: no agreed definition.`));
    L.push('', '2. VALUE AT RISK');
    P.all.filter((x) => x.h.exposure).sort((a, b) => b.h.exposure - a.h.exposure).slice(0, 5).forEach((x) => L.push(`• ${fmtK(x.h.exposure)} — ${x.kr.title} (${STATUS_LABEL[x.h.status].toLowerCase()})`));
    L.push('', '3. LEADING INDICATORS MOVING THE WRONG WAY');
    state.krs.forEach((k) => (k.leads || []).forEach((l) => { if (l.value !== l.prev && (l.value > l.prev) !== (l.good === 'up')) L.push(`• ${l.name}: ${l.prev} → ${l.value} (${k.title})`); }));
    L.push('', '4. RESOURCING');
    R.rows.forEach((r) => L.push(`• ${r.obj.title}: ${r.fte.toFixed(1)} FTE, ${fmtK(r.budget)} — ${STATUS_LABEL[Engine.objective(state, r.obj).status].toLowerCase()}`));
    L.push(`• Not tied to any objective: ${R.unaligned.fte} FTE, ${fmtK(R.unaligned.budget)} (${R.unaligned.inits.map((i) => i.title).join(', ')})`);
    L.push('', '5. DECISIONS FOR THIS MEETING');
    L.push('• Which source is right for each number above');
    L.push('• Whether to move people from unaligned work to at-risk objectives');
    return L.join('\n');
  }
  if (kind === 'qbr') {
    const H = state.history || { company: [], teams: {}, quarters: [] };
    L.push(`${co} — Quarterly business review pre-read`, `Prepared ${asOf} · ${Engine.quarter(state).label}`, '');
    L.push(`HEADLINE: Projected company score ${Engine.projectedScore(state, state.krs).toFixed(2)} vs ${H.company.length ? H.company[H.company.length - 1].toFixed(2) : '—'} last quarter.`, '');
    L.push('PROJECTED SCORES BY OBJECTIVE');
    state.objectives.filter((o) => !o.parent).forEach((o) => { const s = Engine.objective(state, o); const ks = [...s.krs, ...state.krs.filter((k) => s.children.some((c) => c.id === k.obj))]; L.push(`• ${o.title}: ${Engine.projectedScore(state, ks).toFixed(2)}`); });
    L.push('', 'GOAL-SETTING CALIBRATION');
    state.teams.filter((t) => t.id !== 'co').forEach((t) => { const c = Engine.calibration(H.teams[t.id] || []); L.push(`• ${t.name}: ${(H.teams[t.id] || []).map((v) => v.toFixed(2)).join(' → ')} — ${c.label.toLowerCase()}`); });
    L.push('', 'CARRY FORWARD OR RETIRE (projected below 0.7)');
    P.all.filter((x) => x.h.projected < 0.7).forEach((x) => L.push(`• ${x.kr.title} — projected ${Math.min(1, x.h.projected).toFixed(2)}; ${x.h.reasons.join(', ') || 'behind pace'}`));
    L.push('', 'DECISIONS MADE THIS QUARTER');
    state.decisions.forEach((d) => L.push(`• ${U.date(d.date)}: ${d.title}`));
    L.push('', 'QUESTIONS FOR NEXT QUARTER');
    L.push('• Which objectives continue, and which are done or no longer the priority?');
    L.push('• Where should targets be raised (consistently 0.9+) or resourced better (below 0.5)?');
    L.push('• What work that isn\'t tied to a goal should stop?');
    return L.join('\n');
  }
  // offsite
  const H = state.history || { company: [], quarters: [] };
  const R = Engine.resources(state);
  const deps = (state.deps || []).map((d) => Engine.dep(state, d)).filter((d) => !d.delivered);
  const byTeam = {}; deps.forEach((d) => { byTeam[d.fromTeam] = (byTeam[d.fromTeam] || 0) + 1; });
  const bottleneck = Object.entries(byTeam).sort((a, b) => b[1] - a[1])[0];
  const C = Engine.commitments(state), V = Engine.decisionVelocity(state), I = Engine.integrity(state);
  L.push(`${co} — Leadership offsite pre-read`, `Prepared ${asOf}`, '');
  L.push(`HEADLINE: Company scores ${H.company.map((v) => v.toFixed(2)).join(' → ')}; this quarter projects to ${Engine.projectedScore(state, state.krs).toFixed(2)}.`, '');
  L.push('HOW THE OPERATING SYSTEM IS WORKING');
  L.push(`• Decisions: median ${V.median ?? '—'} days to decide; ${V.waiting.length} waiting now.`);
  L.push(`• Commitments: ${U.pct(C.rate)} follow-through; ${C.overdue.length} overdue.`);
  L.push(`• Numbers: ${I.counts.trusted} of ${state.krs.length} trusted; ${I.counts.discrepancy} with sources that disagree.`);
  L.push(`• Check-ins: ${P.all.length - P.stale.length} of ${P.all.length} key results current.`);
  L.push('', 'STRUCTURAL ISSUES');
  if (bottleneck) L.push(`• ${U.team(state, bottleneck[0]).name} is the most depended-on team (${bottleneck[1]} open asks) — capacity or sequencing problem?`);
  L.push(`• ${U.pct(R.unaligned.fte / R.totalFte)} of initiative headcount is on work tied to no objective.`);
  L.push('', 'QUESTIONS TO ANSWER');
  L.push('• What are the three priorities for next year, and what are we explicitly not doing?');
  L.push('• Which meetings in our cadence should we stop, merge or change?');
  L.push('• What would make decisions faster without making them worse?');
  return L.join('\n');
}
function openPreread(id) {
  const m = state.cadence.find((x) => x.id === id);
  const txt = prereadText(m.preread);
  $('#modal').innerHTML = `<div class="modal-card wide"><div class="modal-h"><div><h2>${esc(m.name)} — pre-read</h2><div class="muted small">${U.date(Engine.nextMeeting(state, m), { weekday: 'long', month: 'long', day: 'numeric' })} · generated from live data</div></div><button class="icon-btn" data-action="close-modal" aria-label="Close">✕</button></div>
    <div class="modal-b memo inmodal">${memoHtml(txt)}</div>
    <div class="modal-f"><span></span><div class="row"><button class="btn" data-action="copy-preread" data-id="${id}">Copy text</button><button class="btn primary" data-action="close-modal">Done</button></div></div></div>`;
  document.body.classList.add('modal-open');
}

/* ---------------- Decision records ---------------- */
function decisionCard(d) {
  return `<div class="dcard">
    <div class="dcard-h"><div><div class="dcard-t">${lk('risk', d.id, esc(d.decision), 'plain-lk')}</div>
      <div class="muted small">Decider <b>${personLk(d.decisionOwner)}</b>${d.consulted && d.consulted.length ? ` · consulted ${d.consulted.map((id) => personLk(id)).join(', ')}` : ''} · raised by ${personLk(d.owner)}</div></div>
      <div class="dcard-age ${d.neededBy && d.neededBy < state.meta.asOf ? 'bad' : ''}">${d.age}d waiting${d.neededBy ? `<div class="tiny">needed by ${U.date(d.neededBy)}</div>` : ''}</div></div>
    ${d.context ? `<p class="small">${esc(d.context)}</p>` : ''}
    ${d.options && d.options.length ? `<ol class="opts">${d.options.map((o) => `<li class="${o === d.recommendation ? 'rec' : ''}">${esc(o)}${o === d.recommendation ? ' <span class="tag good">Recommended</span>' : ''}</li>`).join('')}</ol>` : `<p class="small"><b>Proposed:</b> ${esc(d.mitigation)}</p>`}
    <div class="row gap0"><button class="btn sm primary" data-action="decide" data-id="${d.id}">Record decision</button><a href="#" class="small" data-action="kr" data-id="${d.kr}">Unblocks ${d.kr} →</a></div>
  </div>`;
}

function recordDecision(id) {
  const r = state.risks.find((x) => x.id === id);
  const opts = (r.options && r.options.length ? r.options : [r.mitigation || r.decision]).map((o) => [o, o]);
  modal('Record decision: ' + r.decision, [
    { name: 'choice', label: 'What was decided', type: 'select', options: [...opts, ['__other', 'Something else (describe below)']], value: r.recommendation || opts[0][0] },
    { name: 'other', label: 'If something else', hint: 'Leave blank if you chose an option above.' },
    { name: 'rationale', label: 'Why', type: 'textarea', hint: 'One or two sentences. This is what people will read when they ask why later.' },
    { name: 'decider', label: 'Decided by', type: 'select', options: peopleOpts(), value: r.decisionOwner },
  ], (d) => {
    const title = d.choice === '__other' ? (d.other || r.decision) : d.choice;
    r.decided = true; r.status = 'mitigating';
    state.decisions.push({ id: U.uid('D'), requested: r.raised, date: state.meta.asOf, title, owner: d.decider, status: 'made', kr: r.kr, rationale: d.rationale || '' });
    commit(`Decision logged after ${Engine.daysBetween(r.raised, state.meta.asOf)} days`);
  }, { submit: 'Log decision' });
}

function requestDecision() {
  modal('Request a decision', [
    { name: 'decision', label: 'Decision needed', required: true, hint: 'Phrase it as the call to make, e.g. "Approve two contractors for 10 weeks".' },
    { name: 'context', label: 'Context', type: 'textarea', hint: 'What is happening and why it needs a decision now.' },
    { name: 'options', label: 'Options (one per line)', type: 'textarea' },
    { name: 'recommendation', label: 'Recommendation', hint: 'Copy the option you recommend.' },
    { name: 'decisionOwner', label: 'Decider', type: 'select', options: peopleOpts(), half: true },
    { name: 'neededBy', label: 'Needed by', type: 'date', value: addDays(state.meta.asOf, 7), half: true },
    { name: 'kr', label: 'Key result it unblocks', type: 'select', options: krOpts() },
    { name: 'owner', label: 'Requested by', type: 'select', options: peopleOpts() },
  ], (d) => {
    const options = (d.options || '').split('\n').map((x) => x.trim()).filter(Boolean);
    state.risks.push({ id: U.uid('R'), kind: 'decision', kr: d.kr, owner: d.owner, severity: 'medium', status: 'open', raised: state.meta.asOf,
      title: 'Decision needed: ' + d.decision, impact: d.context || 'Waiting on an executive decision.', mitigation: d.recommendation || 'See options.',
      decision: d.decision, decisionOwner: d.decisionOwner, context: d.context, options, recommendation: d.recommendation, neededBy: d.neededBy, consulted: [] });
    commit('Decision requested');
  }, { submit: 'Request decision' });
}

/* ---------------- Metric definitions ---------------- */
const MH_BADGE = { trusted: ['good', '✓ Trusted'], discrepancy: ['bad', '⚠ Sources disagree'], unverified: ['warn', 'Not verified recently'], undefined: ['warn', 'No definition'] };
function mhBadge(mh) { const [c, l] = MH_BADGE[mh.status]; return `<span class="tag ${c}">${l}</span>`; }

function viewMetrics() {
  const I = Engine.integrity(state);
  const order = { discrepancy: 0, undefined: 1, unverified: 2, trusted: 3 };
  const rows = I.rows.slice().sort((a, b) => order[a.mh.status] - order[b.mh.status]).map(({ kr, mh }) => {
    const m = mh.metric;
    const srcs = m ? m.sources.map((s) => `<div>${esc(s.system)}: <b>${U.fmt(kr, s.value)}</b></div>`).join('') : '—';
    return `<tr class="mh-${mh.status}"><td><a href="#" data-action="kr" data-id="${kr.id}"><b>${esc(kr.title)}</b></a><div class="muted tiny">${kr.id} · ${personLk(kr.owner)}</div></td>
      <td class="small">${m ? esc(m.definition) : '<span class="muted">Not defined</span>'}${m && m.note && mh.status === 'discrepancy' ? `<div class="bad tiny">${esc(m.note)}</div>` : ''}</td>
      <td class="small">${m ? esc(m.source) + `<div class="muted tiny">${esc(m.refresh)}</div>` : '—'}</td>
      <td class="small">${srcs}${mh.status === 'discrepancy' ? `<div class="tiny bad">${Math.round(mh.spread)}% apart (tolerance ${m.tolerance}%)</div>` : ''}</td>
      <td class="small">${m ? U.date(m.lastVerified) + `<div class="muted tiny">${mh.age}d ago</div>` : '—'}</td>
      <td>${mhBadge(mh)}<div class="row gap0 mt4">${mh.status === 'discrepancy' ? `<button class="btn sm" data-action="resolve-metric" data-id="${kr.id}">Resolve</button>` : ''}${mh.status === 'unverified' ? `<button class="btn sm" data-action="verify-metric" data-id="${kr.id}">Mark verified</button>` : ''}<button class="btn sm ghost" data-action="edit-metric" data-id="${kr.id}">${m ? 'Edit' : 'Define'}</button></div></td></tr>`;
  }).join('');
  return `
  <header class="page-h"><div><h1>Metric definitions</h1><p class="muted">One source of truth for every number on the scorecard: how it is calculated, where it comes from, who owns it, and when someone last checked it. When two systems report different values, it is flagged before anyone acts on it.</p></div></header>
  <section class="kpis small4">
    <div class="kpi"><div class="kpi-label">Trusted</div><div class="kpi-val">${I.counts.trusted}<small class="muted"> / ${state.krs.length}</small></div><div class="kpi-sub">defined, verified, sources agree</div></div>
    <div class="kpi"><div class="kpi-label">Sources disagree</div><div class="kpi-val">${I.counts.discrepancy}</div><div class="kpi-sub">reconcile before acting</div></div>
    <div class="kpi"><div class="kpi-label">Not verified recently</div><div class="kpi-val">${I.counts.unverified}</div><div class="kpi-sub">past the check window</div></div>
    <div class="kpi"><div class="kpi-label">No definition</div><div class="kpi-val">${I.counts.undefined}</div><div class="kpi-sub">anyone could report it differently</div></div>
  </section>
  <div class="card flush"><div class="table-wrap"><table class="risks metrics"><thead><tr><th>Key result</th><th>Definition</th><th>Source</th><th>Reported values</th><th>Last verified</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div></div>
  <p class="muted tiny">Check windows: daily metrics every 7 days, weekly every 14, monthly every 45. Certification happens in the monthly business review.</p>`;
}

function metricHtml(k) {
  const mh = Engine.metricHealth(state, k);
  const m = mh.metric;
  return `<h3>How it's measured</h3><div class="mbox mh-${mh.status}">${mhBadge(mh)}
    ${m ? `<p class="small">${esc(m.definition)}</p><div class="muted tiny">Source: ${esc(m.source)} · refreshed ${esc(m.refresh)} · last verified ${U.date(m.lastVerified)}</div>
    ${mh.status === 'discrepancy' ? `<div class="small bad mt4">${m.sources.map((s) => esc(s.system) + ': ' + U.fmt(k, s.value)).join(' · ')} — ${Math.round(mh.spread)}% apart. ${esc(m.note)}</div>` : ''}`
    : '<p class="small muted">No agreed definition yet.</p>'}
    <div class="row gap0 mt4">${mh.status === 'discrepancy' ? `<button class="btn sm" data-action="resolve-metric" data-id="${k.id}">Resolve</button>` : ''}${mh.status === 'unverified' ? `<button class="btn sm" data-action="verify-metric" data-id="${k.id}">Mark verified</button>` : ''}<button class="btn sm ghost" data-action="edit-metric" data-id="${k.id}">${m ? 'Edit definition' : 'Define'}</button></div></div>`;
}

function editMetric(krId) {
  const k = state.krs.find((x) => x.id === krId);
  let m = (state.metrics || []).find((x) => x.kr === krId);
  modal((m ? 'Edit definition · ' : 'Define · ') + k.title, [
    { name: 'definition', label: 'Definition (how it is calculated)', type: 'textarea', value: m?.definition, required: true },
    { name: 'source', label: 'Source system', value: m?.source, half: true, required: true },
    { name: 'refresh', label: 'Refreshed', type: 'select', options: [['daily', 'Daily'], ['weekly', 'Weekly'], ['monthly', 'Monthly']], value: m?.refresh || 'weekly', half: true },
    { name: 'owner', label: 'Metric owner', type: 'select', options: peopleOpts(), value: m?.owner || k.owner },
  ], (d) => {
    if (m) Object.assign(m, d, { lastVerified: state.meta.asOf });
    else { state.metrics = state.metrics || []; state.metrics.push({ id: 'M-' + krId, kr: krId, name: k.title, ...d, lastVerified: state.meta.asOf, sources: [{ system: d.source, value: Engine.kr(state, k).value }], tolerance: 2, note: '' }); }
    commit('Definition saved');
  });
}
function resolveMetric(krId) {
  const k = state.krs.find((x) => x.id === krId);
  const m = state.metrics.find((x) => x.kr === krId);
  modal('Resolve · ' + k.title, [
    { name: 'winner', label: 'Which source is right?', type: 'select', options: m.sources.map((s, i) => [i, `${s.system}: ${U.fmt(k, s.value)}`]) },
    { name: 'note', label: 'What changes', type: 'textarea', hint: 'e.g. "Finance BI is the official count; Product dashboard updated to exclude sessions under 10 seconds."' },
  ], (d) => {
    const w = m.sources[+d.winner];
    m.sources = [{ system: w.system, value: w.value }];
    m.source = w.system; m.lastVerified = state.meta.asOf; m.note = d.note || '';
    state.decisions.push({ id: U.uid('D'), requested: state.meta.asOf, date: state.meta.asOf, title: `Certified ${w.system} as the source for "${k.title}"`, owner: m.owner, status: 'made', kr: krId, rationale: d.note || '' });
    commit('Metric certified');
  }, { submit: 'Certify' });
}
