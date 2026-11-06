/* Detail panels for every item in the app. Anything clickable opens here, and the
   panel keeps a back stack so you can follow links (blocker → key result → owner → …). */

let drawerStack = [];

/* A link that opens a detail panel. */
function lk(kind, id, text, cls = '') {
  return `<a href="#" class="lk ${cls}" data-action="detail" data-kind="${kind}" data-id="${esc(id)}">${text}</a>`;
}
const personLk = (id) => lk('person', id, esc(U.person(state, id).name));
const teamLk = (id) => lk('team', id, esc(U.team(state, id).name));
const krLk = (id, text) => { const k = state.krs.find((x) => x.id === id); return k ? lk('kr', id, text || esc(k.title)) : esc(id || '—'); };

function detailLabel(kind, id) {
  const f = {
    kr: () => (state.krs.find((x) => x.id === id) || {}).title,
    risk: () => (state.risks.find((x) => x.id === id) || {}).title,
    commitment: () => (state.commitments.find((x) => x.id === id) || {}).text,
    initiative: () => (state.initiatives.find((x) => x.id === id) || {}).title,
    dep: () => (state.deps.find((x) => x.id === id) || {}).need,
    decision: () => (state.decisions.find((x) => x.id === id) || {}).title,
    person: () => U.person(state, id).name,
    team: () => U.team(state, id).name,
    objective: () => (U.obj(state, id) || {}).title,
  }[kind];
  const t = f ? f() : '';
  return t && t.length > 34 ? t.slice(0, 32) + '…' : t;
}

function detailExists(kind, id) {
  const coll = { kr: state.krs, risk: state.risks, commitment: state.commitments, initiative: state.initiatives, dep: state.deps, decision: state.decisions, person: state.people, team: state.teams, objective: state.objectives }[kind];
  return !!(coll || []).find((x) => x.id === id);
}

function openDetail(kind, id, push = true) {
  if (!detailExists(kind, id)) return;
  if (!document.body.classList.contains('drawer-open')) drawerStack = [];
  const top = drawerStack[drawerStack.length - 1];
  if (push && !(top && top.kind === kind && top.id === id)) drawerStack.push({ kind, id });
  if (kind === 'kr') { renderKr(id); }
  else {
    $('#drawer').innerHTML = DETAIL[kind](id);
    document.body.classList.add('drawer-open');
    bindCharts($('#drawer'));
  }
  addBackButton();
}
function addBackButton() {
  if (drawerStack.length < 2) return;
  const prev = drawerStack[drawerStack.length - 2];
  const h = $('#drawer .drawer-h');
  if (h) h.insertAdjacentHTML('beforebegin', `<button class="back-btn" data-action="drawer-back">← ${esc(detailLabel(prev.kind, prev.id) || 'Back')}</button>`);
}
function drawerBack() {
  drawerStack.pop();
  const prev = drawerStack[drawerStack.length - 1];
  if (prev) openDetail(prev.kind, prev.id, false); else closeDrawer();
}
function refreshDrawer() {
  if (!document.body.classList.contains('drawer-open') || !drawerStack.length) return;
  const top = drawerStack[drawerStack.length - 1];
  if (detailExists(top.kind, top.id)) openDetail(top.kind, top.id, false);
  else { drawerStack.pop(); refreshDrawer(); if (!drawerStack.length) closeDrawer(); }
}

const head = (kicker, title, extra = '') => `<div class="drawer-h"><div><div class="muted small">${kicker}</div><h2>${title}</h2>${extra}</div><button class="icon-btn" data-action="close-drawer" aria-label="Close">✕</button></div>`;
const facts = (pairs) => `<dl class="facts">${pairs.filter(Boolean).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>`;
const listOrNone = (items, none) => items.length ? `<ul class="plain compact">${items.join('')}</ul>` : `<p class="muted small">${none}</p>`;
const krItem = (k) => { const h = Engine.kr(state, k); return `<li>${pill(h.status)} ${krLk(k.id)} <span class="muted small">· ${U.fmt(k, h.value)} of ${U.fmt(k, k.target)}${h.exposure ? ' · <span class="money">' + fmtK(h.exposure) + ' at risk</span>' : ''}</span></li>`; };
const riskItem = (r) => `<li><span class="sev sev-${r.severity}">${r.severity}</span> ${lk('risk', r.id, esc(r.title))} <span class="muted small">(${r.status})</span></li>`;
const commitItem = (c) => { const od = c.status === 'open' && c.due < state.meta.asOf; return `<li>${od ? '<span class="tag bad">Overdue</span> ' : c.status === 'done' ? '✓ ' : ''}${lk('commitment', c.id, esc(c.text))} <span class="muted small">· ${esc(U.person(state, c.owner).name)} · due ${U.date(c.due)}</span></li>`; };
const initItem = (i) => `<li>${pill(i.status)} ${lk('initiative', i.id, esc(i.title))} <span class="muted small">· ${i.fte} FTE · ${i.budget ? fmtK(i.budget) : 'no budget'}</span></li>`;
const depItem = (d) => { const x = Engine.dep(state, d); return `<li><span class="dep-badge dep-${x.label.replace(' ', '-')}">${esc(x.label)}</span> ${lk('dep', d.id, esc(d.need))} <span class="muted small">· due ${U.date(d.due)}</span></li>`; };
const decItem = (d) => `<li><span class="muted small">${U.date(d.date)}</span> ${lk('decision', d.id, esc(d.title))}</li>`;

const DETAIL = {
  /* ---- Blocker / risk ---- */
  risk(id) {
    const r = state.risks.find((x) => x.id === id);
    const k = state.krs.find((x) => x.id === r.kr);
    const age = Engine.daysBetween(r.raised, state.meta.asOf);
    const made = state.decisions.filter((d) => d.kr === r.kr && r.decided && d.date >= r.raised);
    const commits = (state.commitments || []).filter((c) => c.kr === r.kr && c.status !== 'dropped');
    const deps = Engine.dependents(state, r.kr);
    const pending = r.decision && !r.decided && r.status !== 'closed';
    return head(`Blocker · raised ${U.date(r.raised)} · ${age} days old`, esc(r.title),
      `<div class="row"><span class="sev sev-${r.severity}">${r.severity}</span><span class="small">Owner ${personLk(r.owner)}</span></div>`) + `
    <div class="drawer-b">
      ${facts([['Threatens', k ? krLk(k.id) + ` <span class="muted small">(${STATUS_LABEL[Engine.kr(state, k).status].toLowerCase()})</span>` : '—'], ['Impact', esc(r.impact || '—')], ['Mitigation', esc(r.mitigation || '—')],
        ['Status', `<select data-action="risk-status" data-id="${r.id}">${['open', 'mitigating', 'closed'].map((s) => `<option ${s === r.status ? 'selected' : ''}>${s}</option>`).join('')}</select>`]])}
      ${pending ? `<h3>Decision needed</h3>${decisionCard({ ...r, age })}` : ''}
      ${r.decision && r.decided ? `<h3>Decision</h3>${listOrNone(made.map(decItem), 'Decided.')}` : ''}
      <div class="row gap"><button class="btn" data-action="edit-risk" data-id="${r.id}">Edit blocker</button><button class="btn" data-action="ask" data-q="What is blocking ${esc(k ? k.title.toLowerCase() : '')}?">Ask about this</button></div>
      ${deps.length ? `<h3>Who else this affects</h3>${listOrNone(deps.map((d) => `<li>${krLk(d.kr)} <span class="muted small">needs: ${esc(d.need)}</span></li>`), '')}` : ''}
      <h3>Related commitments</h3>${listOrNone(commits.map(commitItem), 'None on this key result.')}
    </div>`;
  },

  /* ---- Commitment ---- */
  commitment(id) {
    const c = state.commitments.find((x) => x.id === id);
    const od = c.status === 'open' && c.due < state.meta.asOf;
    const others = state.commitments.filter((x) => x.owner === c.owner && x.id !== c.id && x.status === 'open');
    return head(`Commitment · ${c.source === 'plan' ? 'from a recovery plan' : c.review ? 'from the ' + U.date(c.review) + ' review' : 'added'}`, esc(c.text),
      `<div class="row">${od ? '<span class="tag bad">Overdue</span>' : `<span class="tag ${c.status === 'done' ? 'good' : ''}">${c.status}</span>`}<span class="small">Owner ${personLk(c.owner)} · due ${U.date(c.due)}</span></div>`) + `
    <div class="drawer-b">
      ${facts([['Key result', c.kr ? krLk(c.kr) : '—'], ['Due', U.date(c.due, { weekday: 'long', month: 'long', day: 'numeric' }) + (od ? ` <span class="bad small">(${Engine.daysBetween(c.due, state.meta.asOf)} days late)</span>` : '')],
        ['Status', `<div class="seg sm">${['open', 'done', 'dropped'].map((s) => `<button class="${c.status === s ? 'on' : ''}" data-action="commit-status" data-id="${c.id}" data-v="${s}">${s[0].toUpperCase() + s.slice(1)}</button>`).join('')}</div>`]])}
      <div class="row gap"><button class="btn" data-action="edit-commitment" data-id="${c.id}">Edit</button></div>
      <h3>${esc(U.person(state, c.owner).name.split(' ')[0])}'s other open commitments</h3>${listOrNone(others.map(commitItem), 'None.')}
    </div>`;
  },

  /* ---- Initiative ---- */
  initiative(id) {
    const i = state.initiatives.find((x) => x.id === id);
    const krs = i.krs.map((kid) => state.krs.find((k) => k.id === kid)).filter(Boolean);
    const risks = state.risks.filter((r) => r.status !== 'closed' && i.krs.includes(r.kr));
    const burn = i.budget ? i.spent / i.budget : 0;
    return head(`Initiative · ${teamLk(i.team)}`, esc(i.title), `<div class="row">${pill(i.status)}<span class="small">Owner ${personLk(i.owner)}</span></div>`) + `
    <div class="drawer-b">
      <div class="stats"><div><span class="muted tiny">People</span><b>${i.fte} FTE</b></div><div><span class="muted tiny">Budget</span><b>${i.budget ? fmtK(i.budget) : '—'}</b></div><div><span class="muted tiny">Spent</span><b>${i.budget ? fmtK(i.spent) : '—'}</b><span class="muted tiny">${i.budget ? U.pct(burn) + ' of budget' : ''}</span></div></div>
      ${!krs.length ? '<div class="callout">This work isn\'t tied to any key result. Either link it to a goal or ask whether it should continue.</div>' : ''}
      <h3>Drives</h3>${listOrNone(krs.map(krItem), 'No key results.')}
      <h3>Open blockers on that work</h3>${listOrNone(risks.map(riskItem), 'None.')}
      <div class="row gap"><button class="btn" data-action="edit-initiative" data-id="${i.id}">Edit initiative</button></div>
    </div>`;
  },

  /* ---- Dependency ---- */
  dep(id) {
    const d = state.deps.find((x) => x.id === id);
    const x = Engine.dep(state, d);
    const k = state.krs.find((y) => y.id === d.kr);
    return head(`Dependency · ${esc(U.workTeam(state, k).name)} waiting on ${teamLk(d.fromTeam)}`, esc(d.need),
      `<div class="row"><span class="dep-badge dep-${x.label.replace(' ', '-')}">${esc(x.label)}</span><span class="small">due ${U.date(d.due)}</span></div>`) + `
    <div class="drawer-b">
      ${facts([['Needed for', krLk(d.kr)], ['From', teamLk(d.fromTeam)], ['Relies on', d.onKr ? krLk(d.onKr) + ` <span class="muted small">(${STATUS_LABEL[x.upH.status].toLowerCase()})</span>` : '—'],
        ['Why flagged', x.late ? 'Past its due date' : x.risk ? 'The work it relies on is behind' : d.delivered ? 'Delivered' : 'On time']])}
      ${x.up ? `<h3>Blockers on the upstream work</h3>${listOrNone(state.risks.filter((r) => r.kr === d.onKr && r.status !== 'closed').map(riskItem), 'None logged.')}` : ''}
      <div class="row gap"><button class="btn" data-action="dep-delivered" data-id="${d.id}">${d.delivered ? 'Mark not delivered' : 'Mark delivered'}</button><button class="btn ghost" data-action="edit-dep" data-id="${d.id}">Edit</button></div>
    </div>`;
  },

  /* ---- Decision (from the log) ---- */
  decision(id) {
    const d = state.decisions.find((x) => x.id === id);
    const days = d.requested ? Engine.daysBetween(d.requested, d.date) : null;
    const src = state.risks.find((r) => r.kr === d.kr && r.decided && (r.decision === d.title || (r.options || []).includes(d.title)));
    return head(`Decision · ${U.date(d.date, { month: 'long', day: 'numeric' })}`, esc(d.title)) + `
    <div class="drawer-b">
      ${facts([['Decided by', personLk(d.owner)], days != null && ['Time to decide', `${days} days${days > 7 ? ' <span class="bad small">(over the 7-day target)</span>' : ''}`], ['Key result', d.kr ? krLk(d.kr) : '—'],
        ['Why', esc(d.rationale || 'No rationale recorded.')], src && ['Came from', lk('risk', src.id, esc(src.title))],
        src && src.options && ['Options considered', `<ol class="opts">${src.options.map((o) => `<li class="${o === d.title ? 'rec' : ''}">${esc(o)}</li>`).join('')}</ol>`]])}
    </div>`;
  },

  /* ---- Person ---- */
  person(id) {
    const p = U.person(state, id);
    const krs = state.krs.filter((k) => k.owner === id);
    const objs = state.objectives.filter((o) => o.owner === id);
    const C = Engine.commitments(state); const mine = C.byOwner.find((o) => o.owner === id);
    const open = state.commitments.filter((c) => c.owner === id && c.status === 'open');
    const risks = state.risks.filter((r) => r.owner === id && r.status !== 'closed');
    const toDecide = Engine.pendingDecisions(state).filter((d) => d.decisionOwner === id);
    const inits = state.initiatives.filter((i) => i.owner === id);
    return head(`${esc(p.title)} · ${teamLk(p.team)}`, esc(p.name)) + `
    <div class="drawer-b">
      <div class="stats"><div><span class="muted tiny">Key results</span><b>${krs.length}</b></div><div><span class="muted tiny">Follow-through</span><b>${mine && mine.rate != null ? U.pct(mine.rate) : '—'}</b></div><div><span class="muted tiny">Decisions waiting on them</span><b>${toDecide.length}</b></div></div>
      ${toDecide.length ? `<h3>Decisions waiting on ${esc(p.name.split(' ')[0])}</h3>${listOrNone(toDecide.map((d) => `<li>${lk('risk', d.id, esc(d.decision))} <span class="muted small">· ${d.age}d waiting</span></li>`), '')}` : ''}
      ${objs.length ? `<h3>Objectives owned</h3>${listOrNone(objs.map((o) => `<li>${pill(Engine.objective(state, o).status)} ${lk('objective', o.id, esc(o.title))}</li>`), '')}` : ''}
      <h3>Key results owned</h3>${listOrNone(krs.map(krItem), 'None.')}
      <h3>Open commitments</h3>${listOrNone(open.map(commitItem), 'None.')}
      <h3>Blockers they own</h3>${listOrNone(risks.map(riskItem), 'None.')}
      ${inits.length ? `<h3>Initiatives they lead</h3>${listOrNone(inits.map(initItem), '')}` : ''}
    </div>`;
  },

  /* ---- Team ---- */
  team(id) {
    const t = U.team(state, id);
    const s = Engine.team(state, id);
    const people = state.people.filter((p) => p.team === id);
    const inits = state.initiatives.filter((i) => i.team === id);
    const asked = (state.deps || []).filter((d) => d.fromTeam === id && !d.delivered);
    const H = state.history && state.history.teams[id];
    return head('Team', esc(t.name), H ? `<div class="small muted">Past scores ${H.map((v) => v.toFixed(2)).join(' → ')} · ${Engine.calibration(H).label.toLowerCase()}</div>` : '') + `
    <div class="drawer-b">
      <div class="stats"><div><span class="muted tiny">Progress</span><b>${U.pct(s.progress)}</b><span class="muted tiny">vs ${U.pct(Engine.elapsed(state))} expected</span></div><div><span class="muted tiny">Health</span><b>${s.counts.on}● ${s.counts.risk}▲ ${s.counts.off}■</b></div><div><span class="muted tiny">Others waiting on them</span><b>${asked.length}</b></div></div>
      <h3>Objectives</h3>${listOrNone(s.objs.map((o) => `<li>${pill(Engine.objective(state, o).status)} ${lk('objective', o.id, esc(o.title))}</li>`), 'None.')}
      <h3>Key results</h3>${listOrNone(s.krs.map(krItem), 'None.')}
      <h3>Asks from other teams</h3>${listOrNone(asked.map(depItem), 'None.')}
      <h3>Initiatives</h3>${listOrNone(inits.map(initItem), 'None.')}
      <h3>People</h3>${listOrNone(people.map((p) => `<li>${personLk(p.id)} <span class="muted small">· ${esc(p.title)}</span></li>`), 'None listed.')}
    </div>`;
  },

  /* ---- Objective ---- */
  objective(id) {
    const o = U.obj(state, id);
    const s = Engine.objective(state, o);
    const parent = o.parent ? U.obj(state, o.parent) : null;
    const inits = state.initiatives.filter((i) => i.krs.some((k) => s.krs.some((x) => x.id === k)));
    return head(`Objective ${o.id} · ${teamLk(o.team)}${parent ? ' · supports ' + lk('objective', parent.id, parent.id) : ''}`, esc(o.title),
      `<div class="row">${pill(s.status)}<span class="small">Owner ${personLk(o.owner)} · ${U.pct(s.progress)} complete</span></div>`) + `
    <div class="drawer-b">
      ${o.why ? `<p class="small">${esc(o.why)}</p>` : ''}
      <h3>Key results</h3>${listOrNone(s.krs.map(krItem), 'None yet.')}
      ${s.children.length ? `<h3>Team objectives that support it</h3>${listOrNone(s.children.map((c) => `<li>${pill(Engine.objective(state, c).status)} ${lk('objective', c.id, esc(c.title))} <span class="muted small">· ${esc(U.team(state, c.team).name)}</span></li>`), '')}` : ''}
      <h3>Funded work</h3>${listOrNone(inits.map(initItem), 'No initiatives linked.')}
      <div class="row gap"><button class="btn" data-action="goto-obj" data-id="${o.id}">Show in alignment map</button><button class="btn ghost" data-action="edit-obj" data-id="${o.id}">Edit</button><button class="btn ghost" data-action="new-kr" data-id="${o.id}">+ Key result</button></div>
    </div>`;
  },
};

/* ---------------- Edit forms for the new detail types ---------------- */
function editRisk(id) {
  const r = state.risks.find((x) => x.id === id);
  modal('Edit blocker', [
    { name: 'title', label: 'What is in the way?', value: r.title, required: true },
    { name: 'kr', label: 'Key result it threatens', type: 'select', options: krOpts(), value: r.kr },
    { name: 'severity', label: 'Severity', type: 'select', options: [['high', 'High'], ['medium', 'Medium'], ['low', 'Low']], value: r.severity, half: true },
    { name: 'owner', label: 'Owner', type: 'select', options: peopleOpts(), value: r.owner, half: true },
    { name: 'impact', label: 'Impact if unresolved', type: 'textarea', value: r.impact },
    { name: 'mitigation', label: 'Mitigation', type: 'textarea', value: r.mitigation },
  ], (d) => { Object.assign(r, d); commit('Blocker updated'); }, { danger: 'Delete', onDanger: () => { state.risks = state.risks.filter((x) => x.id !== id); closeModal(); commit('Blocker deleted'); } });
}
function editCommitment(id) {
  const c = state.commitments.find((x) => x.id === id);
  modal('Edit commitment', [
    { name: 'text', label: 'What will be done', value: c.text, required: true },
    { name: 'owner', label: 'Owner', type: 'select', options: peopleOpts(), value: c.owner, half: true },
    { name: 'due', label: 'Due', type: 'date', value: c.due, half: true },
    { name: 'kr', label: 'Key result', type: 'select', options: [['', '— None —'], ...krOpts()], value: c.kr || '' },
  ], (d) => { Object.assign(c, d, { kr: d.kr || null }); commit('Commitment updated'); }, { danger: 'Delete', onDanger: () => { state.commitments = state.commitments.filter((x) => x.id !== id); closeModal(); commit('Commitment deleted'); } });
}
function editInitiative(id) {
  const i = state.initiatives.find((x) => x.id === id);
  modal('Edit initiative', [
    { name: 'title', label: 'Initiative', value: i.title, required: true },
    { name: 'krs', label: 'Key results it drives (IDs, comma-separated)', value: i.krs.join(', '), hint: 'e.g. KR4, KR2 — leave blank if it isn\'t tied to a goal.' },
    { name: 'owner', label: 'Owner', type: 'select', options: peopleOpts(), value: i.owner, half: true },
    { name: 'status', label: 'Status', type: 'select', options: [['on', 'On track'], ['risk', 'At risk'], ['off', 'Off track']], value: i.status, half: true },
    { name: 'fte', label: 'People (FTE)', type: 'number', value: i.fte, half: true },
    { name: 'budget', label: 'Budget ($K)', type: 'number', value: i.budget, half: true },
    { name: 'spent', label: 'Spent ($K)', type: 'number', value: i.spent, half: true },
  ], (d) => {
    Object.assign(i, d, { fte: +d.fte || 0, budget: +d.budget || 0, spent: +d.spent || 0, krs: d.krs.split(',').map((x) => x.trim().toUpperCase()).filter((x) => state.krs.some((k) => k.id === x)) });
    commit('Initiative updated');
  }, { danger: 'Delete', onDanger: () => { state.initiatives = state.initiatives.filter((x) => x.id !== id); closeModal(); commit('Initiative deleted'); } });
}
function editDep(id) {
  const d0 = state.deps.find((x) => x.id === id);
  modal('Edit dependency', [
    { name: 'need', label: 'What is needed', value: d0.need, required: true },
    { name: 'kr', label: 'Key result that needs it', type: 'select', options: krOpts(), value: d0.kr },
    { name: 'fromTeam', label: 'From team', type: 'select', options: state.teams.map((t) => [t.id, t.name]), value: d0.fromTeam, half: true },
    { name: 'due', label: 'Needed by', type: 'date', value: d0.due, half: true },
    { name: 'onKr', label: 'Their key result it relies on', type: 'select', options: [['', '— None —'], ...krOpts()], value: d0.onKr || '' },
  ], (d) => { Object.assign(d0, d, { onKr: d.onKr || null }); commit('Dependency updated'); }, { danger: 'Delete', onDanger: () => { state.deps = state.deps.filter((x) => x.id !== id); closeModal(); commit('Dependency deleted'); } });
}
