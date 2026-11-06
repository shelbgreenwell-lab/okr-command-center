/* App shell: state, routing, views, charts, forms. No framework, no build step. */

const STORE_KEY = 'okr-system-v4';
let state;
let askThread = [];

/* ---------------- State ---------------- */
function load() {
  try { const s = localStorage.getItem(STORE_KEY); if (s) return JSON.parse(s); } catch (e) {}
  return buildDemo();
}
function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {} }
function commit(msg) { save(); render(); if (msg) toast(msg); }

/* ---------------- Small UI pieces ---------------- */
const $ = (s, el = document) => el.querySelector(s);
const esc = U.esc;

function pill(status) {
  return `<span class="pill pill-${status}"><span class="pill-icon" aria-hidden="true">${STATUS_ICON[status]}</span>${STATUS_LABEL[status]}</span>`;
}
function avatar(state, id, size = '') {
  const p = U.person(state, id);
  return `<span class="avatar ${size}" data-tip="${esc(p.name)} · ${esc(p.title)}">${esc(U.initials(p.name))}</span>`;
}
function progressBar(progress, expected, status, tip) {
  const w = Math.min(100, progress * 100);
  return `<div class="pbar" data-tip="${esc(tip || `${U.pct(progress)} complete · ${U.pct(expected)} expected by now`)}">
    <div class="pbar-fill pbar-${status}" style="width:${w}%"></div>
    <div class="pbar-expected" style="left:${Math.min(100, expected * 100)}%"></div>
  </div>`;
}
function confChip(h) {
  const d = h.confDelta;
  const arrow = d > 0 ? `<span class="delta up">+${d}</span>` : d < 0 ? `<span class="delta down">${d}</span>` : '';
  return `<span class="conf" data-tip="Owner confidence of hitting target (1-10)">${h.confidence}<small>/10</small>${arrow}</span>`;
}
function sparkline(kr) {
  const vals = [kr.start, ...kr.checkins.map((c) => c.value)];
  const ps = vals.map((v) => Math.min(1, Engine.progressOf(kr, v)));
  const W = 72, H = 22, n = ps.length;
  const pts = ps.map((p, i) => `${(i / Math.max(1, n - 1)) * (W - 4) + 2},${H - 2 - p * (H - 4)}`).join(' ');
  const last = pts.split(' ').pop().split(',');
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="var(--series-1)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${last[0]}" cy="${last[1]}" r="2.5" fill="var(--series-1)"/></svg>`;
}
function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2600);
}

/* ---------------- Charts ---------------- */
/* Line chart with crosshair tooltip. series: [{name, cls, dash, pts:[[x,y]]}] */
function lineChart({ series, xMax, xLabel, yFmt, yMin = 0, yMax = 1, height = 220, id }) {
  const W = 640, H = height, L = 44, R = 16, T = 14, B = 28;
  const x = (v) => L + (v / xMax) * (W - L - R);
  const y = (v) => T + (1 - (v - yMin) / (yMax - yMin)) * (H - T - B);
  const ticks = 4;
  let grid = '';
  for (let i = 0; i <= ticks; i++) {
    const v = yMin + (i / ticks) * (yMax - yMin);
    grid += `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="axis" x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${yFmt(v)}</text>`;
  }
  let xt = '';
  const step = xMax > 8 ? 2 : 1;
  for (let i = 0; i <= xMax; i += step) xt += `<text class="axis" x="${x(i)}" y="${H - 8}" text-anchor="middle">${xLabel(i)}</text>`;
  const lines = series.map((s) => {
    const d = s.pts.map((p, i) => `${i ? 'L' : 'M'}${x(p[0])},${y(p[1])}`).join('');
    const lp = s.pts[s.pts.length - 1];
    return `<path d="${d}" class="line ${s.cls}" ${s.dash ? 'stroke-dasharray="5 5"' : ''}/>` +
      (s.dot ? `<circle cx="${x(lp[0])}" cy="${y(lp[1])}" r="4.5" class="dot ${s.cls}"/>` : '');
  }).join('');
  const data = esc(JSON.stringify({ series: series.map((s) => ({ name: s.name, pts: s.pts, cls: s.cls })), xMax, L, R, W }));
  const legend = series.length > 1 ? `<div class="legend">${series.map((s) => `<span><i class="sw ${s.cls} ${s.dash ? 'dash' : ''}"></i>${esc(s.name)}</span>`).join('')}</div>` : '';
  return `${legend}<div class="chart" data-chart="${data}" data-xlabel="${id || ''}">
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${esc(series.map((s) => s.name).join(' vs '))}">${grid}${xt}${lines}
    <line class="xhair" x1="0" x2="0" y1="${T}" y2="${H - B}" style="display:none"/></svg></div>`;
}

function bindCharts(root) {
  root.querySelectorAll('.chart').forEach((el) => {
    const cfg = JSON.parse(el.dataset.chart);
    const svg = el.querySelector('svg'), xh = el.querySelector('.xhair');
    const fmt = chartFormatters[el.dataset.xlabel] || chartFormatters.default;
    el.addEventListener('mousemove', (ev) => {
      const r = svg.getBoundingClientRect();
      const px = ((ev.clientX - r.left) / r.width) * cfg.W;
      const xv = Math.round(((px - cfg.L) / (cfg.W - cfg.L - cfg.R)) * cfg.xMax);
      if (xv < 0 || xv > cfg.xMax) return;
      const xpos = cfg.L + (xv / cfg.xMax) * (cfg.W - cfg.L - cfg.R);
      xh.setAttribute('x1', xpos); xh.setAttribute('x2', xpos); xh.style.display = '';
      const rows = cfg.series.map((s) => { const p = s.pts.find((q) => q[0] === xv); return p ? `<div><i class="sw ${s.cls}"></i>${esc(s.name)} <b>${fmt.y(p[1])}</b></div>` : ''; }).join('');
      showTip(`<div class="tip-h">${fmt.x(xv)}</div>${rows}`, ev.clientX, ev.clientY);
    });
    el.addEventListener('mouseleave', () => { xh.style.display = 'none'; hideTip(); });
  });
}
const chartFormatters = {
  default: { x: (v) => 'Week ' + v, y: (v) => U.pct(v) },
};

/* Tooltip */
let tipEl;
function showTip(html, x, y) {
  if (!tipEl) { tipEl = document.createElement('div'); tipEl.className = 'tooltip'; document.body.appendChild(tipEl); }
  tipEl.innerHTML = html; tipEl.style.display = 'block';
  const r = tipEl.getBoundingClientRect();
  tipEl.style.left = Math.min(window.innerWidth - r.width - 8, x + 14) + 'px';
  tipEl.style.top = Math.max(8, y - r.height - 10) + 'px';
}
function hideTip() { if (tipEl) tipEl.style.display = 'none'; }
document.addEventListener('mouseover', (e) => { const t = e.target.closest('[data-tip]'); if (t) { const r = t.getBoundingClientRect(); showTip(esc(t.dataset.tip), r.left + r.width / 2 - 14, r.top); } });
document.addEventListener('mouseout', (e) => { if (e.target.closest('[data-tip]')) hideTip(); });

/* ---------------- Views ---------------- */
const VIEWS = {
  overview: { label: 'Executive overview', icon: '◧', render: viewOverview, group: 'Run the quarter' },
  okrs: { label: 'OKRs & alignment', icon: '⌥', render: viewOkrs },
  checkin: { label: 'Weekly check-in', icon: '✓', render: viewCheckin },
  review: { label: 'Weekly review', icon: '↻', render: viewReview },
  risks: { label: 'Risks & decisions', icon: '⚑', render: viewRisks },
  initiatives: { label: 'Initiatives & resources', icon: '▤', render: viewInitiatives, group: 'Plan & resource' },
  deps: { label: 'Dependencies', icon: '⇄', render: viewDeps },
  history: { label: 'Quarter history', icon: '◷', render: viewHistory },
  brief: { label: 'Weekly exec brief', icon: '☰', render: viewBrief, group: 'Report' },
  board: { label: 'Board one-pager', icon: '▣', render: viewBoard },
  ask: { label: 'Ask', icon: '✦', render: viewAsk },
  method: { label: 'How it works', icon: 'ⓘ', render: viewMethod, group: ' ' },
};

function route() { const h = location.hash.replace(/^#\/?/, '').split('?')[0]; return VIEWS[h] ? h : 'overview'; }

function render() {
  const r = route();
  const q = Engine.quarter(state);
  const overdueN = Engine.commitments(state).overdue.length;
  $('#nav').innerHTML = Object.entries(VIEWS).map(([k, v]) =>
    `${v.group ? `<div class="nav-group">${v.group}</div>` : ''}<a href="#/${k}" class="${k === r ? 'active' : ''}"><span class="nav-icon" aria-hidden="true">${v.icon}</span>${v.label}${k === 'risks' && Engine.pendingDecisions(state).length ? `<span class="badge">${Engine.pendingDecisions(state).length}</span>` : ''}${k === 'review' && overdueN ? `<span class="badge">${overdueN}</span>` : ''}</a>`).join('');
  $('#company').textContent = state.meta.company;
  $('#qpill').innerHTML = `${esc(q.label)} · Week ${Engine.week(state)} of ${Engine.totalWeeks(state)}`;
  $('#asof').textContent = 'Data as of ' + U.date(state.meta.asOf, { month: 'short', day: 'numeric', year: 'numeric' });
  const main = $('#main');
  main.innerHTML = VIEWS[r].render();
  bindCharts(main);
  if (r === 'ask') { const box = $('#thread'); if (box) box.scrollTop = box.scrollHeight; }
  document.title = VIEWS[r].label + ' · OKR Command Center';
}

function askBar(placeholder) {
  return `<form class="askbar" data-form="ask">
    <span class="askbar-icon" aria-hidden="true">✦</span>
    <input name="q" autocomplete="off" placeholder="${esc(placeholder || 'Ask anything — e.g. “What needs my attention this week?”')}" aria-label="Ask a question about the OKRs"/>
    <button class="btn primary" type="submit">Ask</button>
  </form>
  <div class="chips">${Ask.suggestions.slice(0, 4).map((s) => `<button class="chip" data-action="ask" data-q="${esc(s)}">${esc(s)}</button>`).join('')}</div>`;
}

function viewOverview() {
  const P = Engine.portfolio(state);
  const gap = P.progress - P.expected;
  const kpi = (label, val, sub, cls = '', action = '') =>
    `<div class="kpi ${cls}" ${action}><div class="kpi-label">${label}</div><div class="kpi-val">${val}</div><div class="kpi-sub">${sub}</div></div>`;

  const attention = P.attention.slice(0, 5).map((x) => `
    <button class="attn" data-action="kr" data-id="${x.kr.id}">
      <div class="attn-top">${pill(x.h.status)}<span class="muted small">${x.h.exposure ? `<b class="money">${fmtK(x.h.exposure)} at risk</b> · ` : ''}${esc(U.krTeam(state, x.kr).name)}</span></div>
      <div class="attn-title">${esc(x.kr.title)}</div>
      <div class="attn-why">${esc(x.h.reasons.join(' · ') || 'Behind pace')}</div>
      ${(() => { const sg = Suggest.forKr(state, x.kr)[0]; return sg ? `<div class="attn-next"><span aria-hidden="true">→</span> ${esc(sg.title)}</div>` : ''; })()}
      <div class="attn-foot">${avatar(state, x.kr.owner, 'sm')}<span>${esc(U.person(state, x.kr.owner).name)}</span><span class="muted">${U.fmt(x.kr, x.h.value)} → ${U.fmt(x.kr, x.kr.target)}</span></div>
    </button>`).join('');

  const decisions = P.decisions.map((d) => `
    <div class="decision">
      <div><div class="decision-title">${esc(d.decision)}</div>
      <div class="muted small">Waiting ${d.age} days · decider ${esc(U.person(state, d.decisionOwner).name)} · unblocks <a href="#" data-action="kr" data-id="${d.kr}">${esc(d.kr)}</a></div></div>
      <button class="btn sm" data-action="decide" data-id="${d.id}">Mark decided</button>
    </div>`).join('') || '<p class="muted">No decisions waiting. Nice.</p>';
  const recentDec = state.decisions.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3)
    .map((d) => `<li><span class="muted small">${U.date(d.date)}</span> ${esc(d.title)}</li>`).join('');

  const trend = Engine.trend(state, state.krs);
  const wk = Engine.totalWeeks(state);
  const chart = lineChart({
    series: [
      { name: 'Actual progress', cls: 's1', pts: trend, dot: true },
      { name: 'Expected pace', cls: 'sref', dash: true, pts: [[0, 0], [wk, 1]] },
    ], xMax: wk, xLabel: (i) => 'W' + i, yFmt: (v) => U.pct(v), height: 230,
  });

  const teams = state.teams.filter((t) => t.id !== 'co').map((t) => ({ t, s: Engine.team(state, t.id) }));
  const teamBars = teams.map(({ t, s }) => {
    const st = s.counts.off ? 'off' : s.counts.risk ? 'risk' : 'on';
    return `<div class="trow"><div class="trow-name">${esc(t.name)}</div>
      ${progressBar(s.progress, P.expected, st, `${t.name}: ${U.pct(s.progress)} complete · ${s.counts.on} on track, ${s.counts.risk} at risk, ${s.counts.off} off track`)}
      <div class="trow-val">${U.pct(s.progress)}</div></div>`;
  }).join('');

  const companyObjs = state.objectives.filter((o) => !o.parent).map((o) => {
    const s = Engine.objective(state, o);
    const kids = s.children.map((c) => { const cs = Engine.objective(state, c); return `<span class="kid"><i class="dotst st-${cs.status}"></i>${esc(U.team(state, c.team).name)}</span>`; }).join('');
    return `<a class="objcard" href="#/okrs" data-action="goto-obj" data-id="${o.id}">
      <div class="objcard-top"><span class="oid">${o.id}</span>${pill(s.status)}</div>
      <div class="objcard-title">${esc(o.title)}</div>
      ${progressBar(s.progress, s.expected, s.status)}
      <div class="objcard-meta"><span>${U.pct(s.progress)} complete</span><span>${s.counts.on}● ${s.counts.risk}▲ ${s.counts.off}■</span></div>
      <div class="kids">Aligned: ${kids}</div>
    </a>`;
  }).join('');

  return `
  <header class="page-h"><div><h1>Good morning. Here's where the quarter stands.</h1>
  <p class="muted">${esc(state.meta.company)} · ${esc(state.meta.tagline)}</p></div></header>
  ${askBar()}
  ${sinceBanner()}
  <section class="kpis k4">
    ${kpi('Quarter progress', U.pct(P.progress), `vs ${U.pct(P.expected)} expected · <b class="${gap >= -0.05 ? 'good' : 'bad'}">${gap >= 0 ? '+' : ''}${Math.round(gap * 100)} pts</b>`)}
    ${kpi('Value at risk', fmtK(P.exposure), `across ${P.all.filter((x) => x.h.exposure > 0).length} slipping key results`, 'link', 'data-action="nav" data-to="board"')}
    ${kpi('On track', `<span class="st-on-t">●</span> ${P.counts.on}`, `of ${P.all.length} key results`)}
    ${kpi('At risk', `<span class="st-risk-t">▲</span> ${P.counts.risk}`, 'need a plan')}
    ${kpi('Off track', `<span class="st-off-t">■</span> ${P.counts.off}`, 'need intervention')}
    ${kpi('Decisions waiting', P.decisions.length, P.decisions.length ? `oldest ${P.decisions[0].age} days` : 'none', 'link', 'data-action="nav" data-to="risks"')}
    ${kpi('Overdue commitments', P.commitments.overdue.length, `follow-through ${U.pct(P.commitments.rate)}`, 'link', 'data-action="nav" data-to="review"')}
    ${kpi('Stale check-ins', P.stale.length, `no update in ${STALE_DAYS}+ days`, 'link', 'data-action="nav" data-to="checkin"')}
  </section>
  <section class="grid2">
    <div class="card"><div class="card-h"><h2>Needs your attention</h2><span class="muted small">Ranked by stakes, pace, confidence and blockers</span></div><div class="attn-list">${attention}</div></div>
    <div class="card"><div class="card-h"><h2>Decisions waiting on executives</h2><a href="#/risks" class="small">All risks →</a></div>${decisions}
      ${recentDec ? `<div class="recent-dec"><h3 style="margin-top:0">Recently decided</h3><ul class="plain">${recentDec}</ul></div>` : ''}</div>
  </section>
  <section class="grid2">
    <div class="card"><div class="card-h"><h2>Progress vs. expected pace</h2><span class="muted small">All key results, averaged</span></div>${chart}</div>
    <div class="card"><div class="card-h"><h2>Progress by team</h2><span class="muted small">Tick = where we should be today</span></div><div class="tbars">${teamBars}</div>
    <div class="legend"><span><i class="sw st-on"></i>On track</span><span><i class="sw st-risk"></i>At risk</span><span><i class="sw st-off"></i>Off track</span><span><i class="sw tick"></i>Expected today</span></div></div>
  </section>
  <section><div class="sec-h"><h2>Company objectives</h2><a href="#/okrs" class="small">Full alignment map →</a></div><div class="objgrid">${companyObjs}</div></section>`;
}

/* ---- OKRs ---- */
let okrFilter = { team: '', status: '', owner: '', q: '' };
function viewOkrs() {
  const f = okrFilter;
  const matchKr = (k) => {
    const h = Engine.kr(state, k);
    if (f.status && h.status !== f.status && !(f.status === 'stale' && h.stale)) return false;
    if (f.owner && k.owner !== f.owner) return false;
    if (f.q && !(k.title + ' ' + U.obj(state, k.obj).title).toLowerCase().includes(f.q.toLowerCase())) return false;
    return true;
  };
  const krRow = (k) => {
    const h = Engine.kr(state, k);
    const last = Engine.lastCheckin(k);
    return `<button class="krrow" data-action="kr" data-id="${k.id}">
      <div class="kr-main"><div class="kr-title"><span class="kid-id">${k.id}</span>${esc(k.title)}</div>
        <div class="kr-sub">${avatar(state, k.owner, 'sm')}<span>${esc(U.person(state, k.owner).name)}</span>${h.stale ? '<span class="tag warn">Stale</span>' : ''}${h.openRisks.length ? `<span class="tag">⚑ ${h.openRisks.length}</span>` : ''}${(() => { const n = (state.commitments || []).filter((c) => c.kr === k.id && c.status === 'open').length; return n ? `<span class="tag good">${n} open action${n > 1 ? 's' : ''}</span>` : ''; })()}${h.exposure ? `<span class="money small">${fmtK(h.exposure)} at risk</span>` : ''}</div></div>
      <div class="kr-prog">${progressBar(h.progress, h.expected, h.status)}<div class="kr-vals"><b>${U.fmt(k, h.value)}</b> <span class="muted">of ${U.fmt(k, k.target)}</span></div></div>
      <div class="kr-conf">${confChip(h)}</div>
      <div class="kr-spark">${sparkline(k)}</div>
      <div class="kr-status">${pill(h.status)}<div class="muted tiny">${last ? 'Updated ' + U.date(last.date) : 'No check-ins'}</div></div>
    </button>`;
  };
  const objBlock = (o, depth) => {
    const s = Engine.objective(state, o);
    const krs = s.krs.filter(matchKr);
    const kids = s.children.filter((c) => !f.team || c.team === f.team || c.id === o.id).map((c) => objBlock(c, depth + 1)).join('');
    const teamOk = !f.team || o.team === f.team;
    if (!teamOk && !kids) return '';
    if (teamOk && !krs.length && !kids && (f.status || f.owner || f.q)) return '';
    return `<div class="obj depth${depth}" id="obj-${o.id}">
      ${teamOk ? `<div class="obj-h">
        <div class="obj-hl"><span class="oid">${o.id}</span><span class="obj-team">${esc(U.team(state, o.team).name)}</span>${o.parent ? `<span class="muted tiny">supports ${o.parent}</span>` : ''}</div>
        <div class="obj-title">${esc(o.title)}</div>
        <div class="obj-why muted">${esc(o.why || '')}</div>
        <div class="obj-meta">${avatar(state, o.owner, 'sm')}<span>${esc(U.person(state, o.owner).name)}</span>
          <div class="obj-prog">${progressBar(s.progress, s.expected, s.status)}</div><span>${U.pct(s.progress)}</span>${pill(s.status)}
          <span class="obj-actions"><button class="btn sm ghost" data-action="new-kr" data-id="${o.id}">+ Key result</button><button class="btn sm ghost" data-action="edit-obj" data-id="${o.id}">Edit</button></span></div>
      </div>
      <div class="krs">${krs.map(krRow).join('') || '<div class="muted small pad">No key results match the filters.</div>'}</div>` : ''}
      ${kids ? `<div class="children">${kids}</div>` : ''}
    </div>`;
  };
  const sel = (name, opts, val) => `<select data-filter="${name}">${opts.map(([v, l]) => `<option value="${v}" ${v === val ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
  const tree = state.objectives.filter((o) => !o.parent).map((o) => objBlock(o, 0)).join('');
  return `
  <header class="page-h"><div><h1>OKRs & alignment</h1><p class="muted">Company objectives with the team objectives that ladder up to them. Click any key result for history, blockers and check-ins.</p></div>
  <button class="btn primary" data-action="new-obj">+ Objective</button></header>
  <div class="filters">
    <input type="search" placeholder="Search key results" value="${esc(f.q)}" data-filter="q"/>
    ${sel('team', [['', 'All teams'], ...state.teams.filter((t) => t.id !== 'co').map((t) => [t.id, t.name])], f.team)}
    ${sel('status', [['', 'Any status'], ['on', 'On track'], ['risk', 'At risk'], ['off', 'Off track'], ['stale', 'Stale']], f.status)}
    ${sel('owner', [['', 'Any owner'], ...state.people.map((p) => [p.id, p.name])], f.owner)}
    ${(f.team || f.status || f.owner || f.q) ? '<button class="btn sm ghost" data-action="clear-filters">Clear</button>' : ''}
  </div>
  <div class="tree">${tree || '<p class="muted">Nothing matches.</p>'}</div>`;
}

/* ---- Check-in ---- */
let checkinPerson = 'lc';
function viewCheckin() {
  const P = Engine.portfolio(state);
  const mine = state.krs.filter((k) => k.owner === checkinPerson);
  const p = U.person(state, checkinPerson);
  const owners = state.people.filter((x) => state.krs.some((k) => k.owner === x.id));
  const form = mine.map((k) => {
    const h = Engine.kr(state, k);
    const last = Engine.lastCheckin(k);
    return `<fieldset class="ci">
      <legend><span class="kid-id">${k.id}</span>${esc(k.title)} ${pill(h.status)}</legend>
      <div class="ci-ctx muted small">Last: <b>${U.fmt(k, h.value)}</b> on ${last ? U.date(last.date) : '—'} · target ${U.fmt(k, k.target)} · confidence ${h.confidence}/10</div>
      <div class="ci-grid">
        <label>New value<input type="number" step="any" name="v-${k.id}" value="${h.value}" required/></label>
        <label>Confidence <output id="o-${k.id}">${h.confidence}</output>/10<input type="range" min="1" max="10" name="c-${k.id}" value="${h.confidence}" oninput="document.getElementById('o-${k.id}').textContent=this.value"/></label>
        <label class="wide">What moved, and what's next?<textarea name="n-${k.id}" rows="2" placeholder="One or two sentences for the exec brief"></textarea></label>
        <label class="wide">Blocker (optional)<input name="b-${k.id}" placeholder="Anything you need someone else to unblock"/></label>
      </div>
    </fieldset>`;
  }).join('');

  const feed = state.krs.flatMap((k) => k.checkins.map((c) => ({ k, c }))).sort((a, b) => b.c.date.localeCompare(a.c.date)).slice(0, 14)
    .map(({ k, c }) => `<li><div class="feed-h">${avatar(state, c.by || k.owner, 'sm')}<b>${esc(U.person(state, c.by || k.owner).name)}</b><span class="muted small">${U.date(c.date)}</span></div>
      <div class="small"><a href="#" data-action="kr" data-id="${k.id}">${esc(k.title)}</a> → <b>${U.fmt(k, c.value)}</b> · confidence ${c.confidence}/10</div>
      ${c.note ? `<div class="muted small">${esc(c.note)}</div>` : ''}</li>`).join('');

  const stale = P.stale.map((x) => `<li>${avatar(state, x.kr.owner, 'sm')} <b>${esc(U.person(state, x.kr.owner).name)}</b> — ${esc(x.kr.title)} <span class="tag warn">${x.h.daysSince} days</span></li>`).join('');

  return `
  <header class="page-h"><div><h1>Weekly check-in</h1><p class="muted">Five minutes a week per owner: update the number, rate your confidence, flag what's in the way. This is what keeps every view in the system current.</p></div></header>
  <section class="grid2 wide-left">
    <div class="card">
      <div class="card-h"><h2>Check in as</h2>
      <select data-action="checkin-person">${owners.map((o) => `<option value="${o.id}" ${o.id === checkinPerson ? 'selected' : ''}>${esc(o.name)}</option>`).join('')}</select></div>
      <p class="muted small">${esc(p.title)} · ${mine.length} key result${mine.length === 1 ? '' : 's'}</p>
      <form data-form="checkin">${form}<div class="form-foot"><button class="btn primary" type="submit">Submit check-in</button></div></form>
    </div>
    <div>
      <div class="card"><div class="card-h"><h2>Missing check-ins</h2></div>${stale ? `<ul class="plain">${stale}</ul>` : '<p class="muted">Everyone is current.</p>'}</div>
      <div class="card"><div class="card-h"><h2>Recent updates</h2></div><ul class="feed">${feed}</ul></div>
    </div>
  </section>`;
}

/* ---- Risks ---- */
let riskFilter = 'open';
function viewRisks() {
  const sev = { high: 0, medium: 1, low: 2 };
  const list = state.risks.filter((r) => riskFilter === 'all' || (riskFilter === 'open' ? r.status !== 'closed' : r.status === riskFilter))
    .sort((a, b) => (a.status === 'closed') - (b.status === 'closed') || sev[a.severity] - sev[b.severity]);
  const rows = list.map((r) => {
    const k = state.krs.find((x) => x.id === r.kr);
    const age = Engine.daysBetween(r.raised, state.meta.asOf);
    return `<tr class="${r.status === 'closed' ? 'closed' : ''}">
      <td><span class="sev sev-${r.severity}">${r.severity}</span></td>
      <td><div class="risk-title">${esc(r.title)}</div><div class="muted small">${esc(r.impact)}</div>
        <div class="small"><b>Mitigation:</b> ${esc(r.mitigation)}</div>
        ${r.decision ? `<div class="small decision-inline ${r.decided ? 'done' : ''}">${r.decided ? '✓ Decided' : '⚑ Decision needed'}: ${esc(r.decision)} <span class="muted">(${esc(U.person(state, r.decisionOwner).name)})</span></div>` : ''}</td>
      <td>${k ? `<a href="#" data-action="kr" data-id="${k.id}">${k.id}</a><div class="muted tiny">${esc(k.title)}</div>` : '—'}</td>
      <td>${avatar(state, r.owner, 'sm')} <span class="small">${esc(U.person(state, r.owner).name)}</span></td>
      <td class="num">${age}d</td>
      <td><select data-action="risk-status" data-id="${r.id}">${['open', 'mitigating', 'closed'].map((s) => `<option ${s === r.status ? 'selected' : ''}>${s}</option>`).join('')}</select>
        ${r.decision && !r.decided && r.status !== 'closed' ? `<button class="btn sm" data-action="decide" data-id="${r.id}">Mark decided</button>` : ''}</td>
    </tr>`;
  }).join('');
  const open = state.risks.filter((r) => r.status !== 'closed');
  const decisions = state.decisions.slice().sort((a, b) => b.date.localeCompare(a.date)).map((d) => `<li><span class="muted small">${U.date(d.date)}</span> <b>${esc(d.title)}</b> <span class="muted small">— ${esc(U.person(state, d.owner).name)}${d.kr ? ' · ' + d.kr : ''}</span></li>`).join('');
  return `
  <header class="page-h"><div><h1>Risks, blockers & decisions</h1><p class="muted">Every blocker is tied to the key result it threatens, has an owner and a mitigation, and says plainly when an executive decision is the unblock.</p></div>
  <button class="btn primary" data-action="new-risk">+ Log a blocker</button></header>
  <section class="kpis small4">
    <div class="kpi"><div class="kpi-label">Open</div><div class="kpi-val">${open.length}</div></div>
    <div class="kpi"><div class="kpi-label">High severity</div><div class="kpi-val">${open.filter((r) => r.severity === 'high').length}</div></div>
    <div class="kpi"><div class="kpi-label">Decisions waiting</div><div class="kpi-val">${Engine.pendingDecisions(state).length}</div></div>
    <div class="kpi"><div class="kpi-label">Avg age (open)</div><div class="kpi-val">${open.length ? Math.round(open.reduce((a, r) => a + Engine.daysBetween(r.raised, state.meta.asOf), 0) / open.length) : 0}d</div></div>
  </section>
  <div class="filters"><div class="seg">${['open', 'mitigating', 'closed', 'all'].map((s) => `<button class="${s === riskFilter ? 'on' : ''}" data-action="risk-filter" data-v="${s}">${s[0].toUpperCase() + s.slice(1)}</button>`).join('')}</div></div>
  <div class="card flush"><div class="table-wrap"><table class="risks"><thead><tr><th>Severity</th><th>Blocker</th><th>Threatens</th><th>Owner</th><th>Age</th><th>Status</th></tr></thead><tbody>${rows || '<tr><td colspan="6" class="muted">Nothing here.</td></tr>'}</tbody></table></div></div>
  <section class="card"><div class="card-h"><h2>Decision log</h2></div><ul class="plain">${decisions || '<li class="muted">No decisions logged yet.</li>'}</ul></section>`;
}

/* ---- Brief ---- */
function briefText() {
  const P = Engine.portfolio(state);
  const q = Engine.quarter(state);
  const L = [];
  L.push(`${state.meta.company} — Weekly OKR Brief`);
  L.push(`${q.label}, week ${Engine.week(state)} of ${Engine.totalWeeks(state)} · as of ${U.date(state.meta.asOf, { month: 'long', day: 'numeric', year: 'numeric' })}`);
  L.push('');
  L.push(`HEADLINE: ${U.pct(P.progress)} complete vs ${U.pct(P.expected)} expected. ${P.counts.on} on track, ${P.counts.risk} at risk, ${P.counts.off} off track.`);
  L.push(`VALUE AT RISK: ${fmtK(P.exposure)} across ${P.all.filter((x) => x.h.exposure > 0).length} key results. Commitment follow-through: ${U.pct(P.commitments.rate)} (${P.commitments.overdue.length} overdue).`);
  L.push('');
  L.push('SCORECARD');
  state.objectives.filter((o) => !o.parent).forEach((o) => {
    const s = Engine.objective(state, o);
    L.push(`${o.id} ${o.title} — ${U.pct(s.progress)} · ${STATUS_LABEL[s.status]}`);
    s.children.forEach((c) => { const cs = Engine.objective(state, c); L.push(`   ↳ ${U.team(state, c.team).name}: ${c.title} — ${U.pct(cs.progress)} · ${STATUS_LABEL[cs.status]}`); });
  });
  L.push('');
  const wins = P.all.filter((x) => x.h.status === 'on' && x.h.gap > 0.05).sort((a, b) => b.h.gap - a.h.gap).slice(0, 3);
  L.push('WHAT\'S WORKING');
  wins.forEach((x) => L.push(`• ${x.kr.title}: ${U.fmt(x.kr, x.h.value)} (${Math.round(x.h.gap * 100)} pts ahead of pace) — ${U.person(state, x.kr.owner).name}`));
  L.push('');
  L.push('WHERE WE\'RE SLIPPING');
  P.attention.filter((x) => x.h.status !== 'on').slice(0, 5).forEach((x) => {
    const last = Engine.lastCheckin(x.kr);
    L.push(`• ${x.kr.title} [${STATUS_LABEL[x.h.status]}]: ${U.fmt(x.kr, x.h.value)} of ${U.fmt(x.kr, x.kr.target)}; ${x.h.reasons.join(', ')}.${x.h.exposure ? ' ' + fmtK(x.h.exposure) + ' at risk.' : ''} ${last && last.note ? 'Owner: "' + last.note + '"' : ''}${(() => { const sg = Suggest.forKr(state, x.kr)[0]; return sg ? ' Suggested next step: ' + sg.title + '.' : ''; })()}`);
  });
  L.push('');
  L.push('DECISIONS NEEDED');
  if (!P.decisions.length) L.push('• None.');
  P.decisions.forEach((d) => L.push(`• ${d.decision} — decider: ${U.person(state, d.decisionOwner).name}, waiting ${d.age} days. Proposed: ${d.mitigation}`));
  L.push('');
  if (P.commitments.overdue.length) {
    L.push('OVERDUE COMMITMENTS');
    P.commitments.overdue.forEach((c) => L.push(`• ${c.text} — ${U.person(state, c.owner).name}, due ${U.date(c.due)}`));
    L.push('');
  }
  if (P.stale.length) {
    L.push('MISSING CHECK-INS');
    P.stale.forEach((x) => L.push(`• ${U.person(state, x.kr.owner).name}: ${x.kr.title} (${x.h.daysSince} days)`));
    L.push('');
  }
  L.push('PROPOSED WEEKLY BUSINESS REVIEW AGENDA (45 min)');
  L.push('• 5 min — Scorecard read-out (no discussion of green items)');
  if (P.commitments.overdue.length) L.push(`• 5 min — Close out ${P.commitments.overdue.length} overdue commitment${P.commitments.overdue.length > 1 ? 's' : ''} from last week`);
  P.attention.filter((x) => x.h.status === 'off').slice(0, 2).forEach((x) => L.push(`• 10 min — Deep dive: ${x.kr.title} (${U.person(state, x.kr.owner).name})`));
  if (P.decisions.length) L.push(`• 15 min — Decide: ${P.decisions.slice(0, 3).map((d) => d.decision.toLowerCase()).join('; ')}`);
  L.push('• 5 min — Confirm owners and dates for every action');
  return L.join('\n');
}
function viewBrief() {
  const txt = briefText();
  const html = txt.split('\n').map((l) => {
    const head = l.split(' (')[0];
    if (head.length > 3 && /^[A-Z]/.test(head) && !/[a-z]/.test(head)) return `<h3>${esc(l)}</h3>`;
    if (l.startsWith('VALUE AT RISK:')) return `<p class="small"><b>Value at risk:</b> ${esc(l.replace('VALUE AT RISK: ', ''))}</p>`;
    if (l.startsWith('HEADLINE:')) return `<p class="headline">${esc(l.replace('HEADLINE: ', ''))}</p>`;
    if (l.startsWith('•')) return `<li>${esc(l.slice(2))}</li>`;
    if (l.startsWith('   ↳')) return `<div class="sub">${esc(l.trim())}</div>`;
    return l ? `<p>${esc(l)}</p>` : '';
  }).join('').replace(/(<li>.*?<\/li>)+/g, (m) => `<ul>${m}</ul>`);
  return `
  <header class="page-h"><div><h1>Weekly exec brief</h1><p class="muted">Written automatically from this week's check-ins. Send it before the weekly business review so the meeting is spent on decisions, not status.</p></div>
  <div class="row"><button class="btn" data-action="copy-brief">Copy text</button><button class="btn" data-action="print">Print / PDF</button></div></header>
  <article class="card memo">${html}</article>`;
}

/* ---- Ask ---- */
function viewAsk() {
  const msgs = askThread.map((m) => m.role === 'user'
    ? `<div class="msg user"><div class="bubble">${esc(m.text)}</div></div>`
    : `<div class="msg bot"><div class="bubble">${m.pending ? '<span class="typing"><i></i><i></i><i></i></span>' : U.md(m.text)}
        ${m.items && m.items.length ? `<div class="refs">${m.items.slice(0, 6).map((id) => { const k = state.krs.find((x) => x.id === id); return k ? `<button class="ref" data-action="kr" data-id="${id}">${pill(Engine.kr(state, k).status)} ${esc(k.title)}</button>` : ''; }).join('')}</div>` : ''}
        ${m.note ? `<div class="muted tiny">${esc(m.note)}</div>` : ''}
        ${m.followups && m.followups.length ? `<div class="chips">${m.followups.map((s) => `<button class="chip" data-action="ask" data-q="${esc(s)}">${esc(s)}</button>`).join('')}</div>` : ''}
        ${!m.pending ? `<div class="src tiny muted">${m.source === 'claude' ? 'Answered by Claude from live OKR data' : 'Answered by the built-in analyst from live OKR data'}</div>` : ''}
      </div></div>`).join('');
  const mode = Ask.hasClaude() ? '<span class="tag good">Claude connected</span>' : '<span class="tag">Built-in analyst</span> <a href="#" data-action="settings" class="small">Connect Claude for open-ended questions</a>';
  return `
  <header class="page-h"><div><h1>Ask</h1><p class="muted">Ask the question instead of digging for the answer. Every answer is computed from the same live data as the dashboards.</p></div><div>${mode}</div></header>
  <div class="card askcard">
    <div id="thread" class="thread">${msgs || `<div class="empty"><div class="empty-icon">✦</div><p>Try one of these:</p><div class="chips center">${Ask.suggestions.map((s) => `<button class="chip" data-action="ask" data-q="${esc(s)}">${esc(s)}</button>`).join('')}</div></div>`}</div>
    <form class="askbar" data-form="ask"><span class="askbar-icon">✦</span><input name="q" autocomplete="off" placeholder="Ask about any objective, team, owner or blocker…" aria-label="Ask a question"/><button class="btn primary" type="submit">Ask</button></form>
  </div>`;
}

async function runAsk(q) {
  if (!q || !q.trim()) return;
  askThread.push({ role: 'user', text: q.trim() });
  const pending = { role: 'bot', pending: true };
  askThread.push(pending);
  if (route() !== 'ask') location.hash = '#/ask'; else render();
  const ans = await Ask.answer(state, q.trim());
  Object.assign(pending, ans, { pending: false });
  render();
}

/* ---- Method ---- */
function viewMethod() {
  return `
  <header class="page-h"><div><h1>How it works</h1><p class="muted">The rules behind every color and ranking, so anyone can audit why something is flagged.</p></div></header>
  <section class="grid2">
    <div class="card prose">
      <h2>The operating rhythm</h2>
      <ol>
        <li><b>Quarter start:</b> company objectives set by the exec team; each team writes 1–2 objectives that ladder up to one of them. Every key result has one owner, a start value and a target.</li>
        <li><b>Every week:</b> owners check in — the current number, a 1–10 confidence score, a one-line note, and any blocker.</li>
        <li><b>Before the weekly business review:</b> the brief writes itself from check-ins. The meeting covers off-track items and pending decisions only.</li>
        <li><b>Decisions:</b> any blocker that needs an executive call is logged with a decider and ages visibly until it is made.</li>
        <li><b>Quarter end:</b> each key result is scored 0.0–1.0. A 0.7 on an ambitious target is a good result.</li>
      </ol>
      <h2>What "on track" means</h2>
      <p><b>Progress</b> = (current − start) ÷ (target − start). Works for metrics that should go up or down.</p>
      <p><b>Expected</b> = share of the quarter elapsed. Today that is ${U.pct(Engine.elapsed(state))}.</p>
      <ul>
        <li>${pill('on')} within 10 points of expected and confidence 6+</li>
        <li>${pill('risk')} 10–25 points behind, <i>or</i> owner confidence 4–5</li>
        <li>${pill('off')} more than 25 points behind, <i>or</i> confidence 3 or lower</li>
      </ul>
      <p>The worse of pace and confidence wins: an owner who says "I'm not going to make it" is believed before the math catches up. A key result is <b>stale</b> after ${STALE_DAYS} days without a check-in.</p>
      <h2>"Needs your attention" ranking</h2>
      <p>Status severity, plus weight for stale data, a confidence drop of 2+ points in a week, and open high-severity blockers. The ranking is designed to show an executive the three things worth their time, not everything that is imperfect.</p>
    </div>
    <div class="card prose">
      <h2>Value at risk</h2>
      <p>Each key result carries a rough value at stake — what fully hitting it is worth, and how that was sized. Value at risk = value at stake × the share of the target we are projected to miss at today's pace, counted only for key results that are at risk or off track. It turns "25 points behind" into a number an executive can weigh, and it feeds the attention ranking.</p>
      <h2>Commitments & follow-through</h2>
      <p>Every weekly review produces commitments with an owner and a date. They stay visible until done or explicitly dropped. Follow-through rate = done ÷ (done + overdue + dropped). Recovery-plan actions count as commitments too.</p>
      <h2>Initiatives, dependencies, history</h2>
      <p><b>Initiatives</b> are the funded work behind key results, with people and budget, so you can see whether resources follow priorities and spot work tied to no goal. <b>Dependencies</b> are flagged when late or when the work they rely on is itself behind. <b>Quarter history</b> shows final scores by team and labels the pattern: consistently 0.9+ suggests targets are too safe; below 0.5 suggests over-commitment or under-resourcing.</p>
      <h2>Leading indicators & since you last looked</h2>
      <p>Key results are mostly lagging. Leading indicators on each key result show whether the inputs are moving the right way before the outcome does. The overview opens with what changed since your last visit (on a first visit, since last week).</p>
      <h2>Suggested actions</h2>
      <p>Every key result that is at risk, off track or stale gets up to four suggested next steps, chosen from what is actually wrong. For example: a pending decision gets a push to decide, a target out of reach gets a resources/scope/reset call, a confidence drop gets a quick conversation, missing updates get a request for a fresh check-in. Add any suggestion to the key result's recovery plan with one click; it gets the owner and a one-week due date.</p>
      <h2>Ask</h2>
      <p>The built-in analyst recognises the questions executives actually ask — what needs attention, what's blocked, what changed, who hasn't updated, will we hit the target, why is X off track — and scopes them to any person, team, objective or topic. It runs entirely in the browser, needs no account, and every answer links back to the key results it used.</p>
      <p>For open-ended questions, connect Claude in <a href="#" data-action="settings">Settings</a> with your own Anthropic API key. The key stays in this browser and the full OKR snapshot is sent with each question.</p>
      <h2>Your data</h2>
      <p>No logins and no server. Edits save to this browser. Export to JSON to move data between machines, or reset to the demo at any time. The demo company, people and numbers are fictional.</p>
      <h2>Built with</h2>
      <p>Plain HTML, CSS and JavaScript — no framework and no build step — so it can be hosted for free on GitHub Pages and read end to end in an afternoon.</p>
    </div>
  </section>`;
}

/* ---------------- Suggestions & recovery plan ---------------- */
function suggestionsHtml(k) {
  const list = Suggest.forKr(state, k);
  if (!list.length) return '';
  return `<div class="suggest"><div class="suggest-h"><h3>Suggested actions</h3><span class="muted tiny">Based on pace, confidence, blockers and check-ins</span></div>
    ${list.map((sg, i) => `<div class="sg"><div><div class="sg-title">${esc(sg.title)}</div><div class="small muted">${esc(sg.detail)}</div></div>
      <button class="btn sm" data-action="adopt" data-id="${k.id}" data-i="${i}">+ Add to plan</button></div>`).join('')}
    ${Ask.hasClaude() ? `<button class="btn sm ghost" data-action="ask" data-q="Suggest mitigation actions for ${esc(k.id)}">✦ Ask Claude for more ideas</button>` : ''}</div>`;
}
function planHtml(k) {
  const acts = (state.commitments || []).filter((c) => c.kr === k.id && c.status !== 'dropped');
  if (!acts.length) return '';
  return `<h3>Actions & commitments</h3><ul class="plain plan">${acts.map((a) => { const overdue = a.status === 'open' && a.due < state.meta.asOf; return `<li class="${a.status === 'done' ? 'done' : ''}">
    <label><input type="checkbox" data-action="toggle-action" data-id="${a.id}" data-kr="${k.id}" ${a.status === 'done' ? 'checked' : ''}/> <span>${esc(a.text)}</span>${overdue ? ' <span class="tag bad">Overdue</span>' : ''}</label>
    <div class="muted tiny">${esc(U.person(state, a.owner).name)} · due ${U.date(a.due)}${a.status === 'done' ? ' · done' : ''}${a.source === 'plan' ? ' · recovery plan' : a.review ? ' · from ' + U.date(a.review) + ' review' : ''}</div></li>`; }).join('')}</ul>`;
}
function addDays(iso, n) { const d = Engine.d(iso); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }

/* ---------------- Drawer (KR detail) ---------------- */
function openKr(id) {
  const k = state.krs.find((x) => x.id === id); if (!k) return;
  const h = Engine.kr(state, k);
  const o = U.obj(state, k.obj);
  const q = Engine.quarter(state);
  const wk = Engine.totalWeeks(state);
  const weekOf = (d) => Math.max(0, Engine.daysBetween(q.start, d) / 7);
  const actual = [[0, k.start], ...k.checkins.map((c) => [Math.round(weekOf(c.date) * 10) / 10, c.value])];
  const lo = Math.min(k.start, k.target, ...k.checkins.map((c) => c.value));
  const hi = Math.max(k.start, k.target, ...k.checkins.map((c) => c.value));
  const pad = (hi - lo) * 0.08 || 1;
  chartFormatters['kr-' + k.id] = { x: (v) => 'Week ' + v, y: (v) => U.fmt(k, v) };
  const chart = lineChart({
    id: 'kr-' + k.id,
    series: [{ name: 'Actual', cls: 's1', pts: actual, dot: true }, { name: 'Plan to target', cls: 'sref', dash: true, pts: [[0, k.start], [wk, k.target]] }],
    xMax: wk, xLabel: (i) => 'W' + i, yFmt: (v) => U.fmt(k, v), yMin: lo - pad, yMax: hi + pad, height: 200,
  });
  const hist = k.checkins.slice().reverse().map((c) => `<li><div class="feed-h"><b>${U.fmt(k, c.value)}</b><span class="muted small">${U.date(c.date)} · confidence ${c.confidence}/10 · ${esc(U.person(state, c.by || k.owner).name)}</span></div>${c.note ? `<div class="small">${esc(c.note)}</div>` : ''}</li>`).join('');
  const risks = state.risks.filter((r) => r.kr === k.id).map((r) => `<li><span class="sev sev-${r.severity}">${r.severity}</span> <b>${esc(r.title)}</b> <span class="muted small">(${r.status})</span><div class="small muted">${esc(r.mitigation)}</div></li>`).join('');
  $('#drawer').innerHTML = `
    <div class="drawer-h"><div><div class="muted small"><span class="oid">${o.id}</span> ${esc(o.title)}</div><h2>${esc(k.title)}</h2>
      <div class="row">${pill(h.status)}${avatar(state, k.owner, 'sm')}<span class="small">${esc(U.person(state, k.owner).name)} · ${esc(U.person(state, k.owner).title)}</span></div></div>
      <button class="icon-btn" data-action="close-drawer" aria-label="Close">✕</button></div>
    <div class="drawer-b">
      <div class="stats">
        <div><span class="muted tiny">Current</span><b>${U.fmt(k, h.value)}</b></div>
        <div><span class="muted tiny">Target</span><b>${U.fmt(k, k.target)}</b></div>
        <div><span class="muted tiny">Progress</span><b>${U.pct(h.progress)}</b><span class="muted tiny">vs ${U.pct(h.expected)} expected</span></div>
        <div><span class="muted tiny">Confidence</span><b>${h.confidence}/10</b></div>
        <div><span class="muted tiny">Projected end</span><b>${U.fmt(k, h.projectedValue)}</b></div>
        <div data-tip="${esc(k.stakeNote || 'Set the value at stake in Edit')}"><span class="muted tiny">Value at risk</span><b class="${h.exposure ? 'money' : ''}">${h.exposure ? fmtK(h.exposure) : '—'}</b><span class="muted tiny">of ${fmtK(k.stake || 0)} at stake</span></div>
      </div>
      ${h.reasons.length ? `<div class="callout">Why it's flagged: ${esc(h.reasons.join(' · '))}</div>` : ''}
      ${chart}
      <div class="row gap"><button class="btn primary" data-action="quick-checkin" data-id="${k.id}">Check in</button><button class="btn" data-action="new-risk" data-kr="${k.id}">Log blocker</button><button class="btn" data-action="ask" data-q="Why is ${esc(k.id)} ${h.status === 'on' ? 'on track' : 'behind'}?">Ask about this</button><button class="btn ghost" data-action="edit-kr" data-id="${k.id}">Edit</button></div>
      ${suggestionsHtml(k)}
      ${planHtml(k)}
      ${leadsHtml(k)}
      ${depsHtml(k)}
      ${initsHtml(k)}
      <h3>Blockers</h3>${risks ? `<ul class="plain">${risks}</ul>` : '<p class="muted small">None logged.</p>'}
      <h3>Check-in history</h3><ul class="feed">${hist || '<li class="muted">No check-ins yet.</li>'}</ul>
    </div>`;
  document.body.classList.add('drawer-open');
  bindCharts($('#drawer'));
}
function closeDrawer() { document.body.classList.remove('drawer-open'); }

/* ---------------- Modal forms ---------------- */
function modal(title, fields, onSubmit, opts = {}) {
  const f = fields.map((fl) => {
    const v = fl.value ?? '';
    let input;
    if (fl.type === 'select') input = `<select name="${fl.name}">${fl.options.map(([ov, ol]) => `<option value="${esc(ov)}" ${String(ov) === String(v) ? 'selected' : ''}>${esc(ol)}</option>`).join('')}</select>`;
    else if (fl.type === 'textarea') input = `<textarea name="${fl.name}" rows="3">${esc(v)}</textarea>`;
    else input = `<input name="${fl.name}" type="${fl.type || 'text'}" step="any" value="${esc(v)}" ${fl.required ? 'required' : ''}/>`;
    return `<label class="${fl.half ? 'half' : ''}">${esc(fl.label)}${input}${fl.hint ? `<span class="hint">${esc(fl.hint)}</span>` : ''}</label>`;
  }).join('');
  $('#modal').innerHTML = `<form class="modal-card" data-form="modal"><div class="modal-h"><h2>${esc(title)}</h2><button type="button" class="icon-btn" data-action="close-modal" aria-label="Close">✕</button></div>
    <div class="modal-b">${opts.intro || ''}<div class="fields">${f}</div></div>
    <div class="modal-f">${opts.danger ? `<button type="button" class="btn danger" data-action="modal-danger">${esc(opts.danger)}</button>` : '<span></span>'}<div class="row"><button type="button" class="btn ghost" data-action="close-modal">Cancel</button><button class="btn primary" type="submit">${esc(opts.submit || 'Save')}</button></div></div></form>`;
  document.body.classList.add('modal-open');
  modal.onSubmit = onSubmit; modal.onDanger = opts.onDanger;
  const first = $('#modal input, #modal textarea'); if (first) first.focus();
}
function closeModal() { document.body.classList.remove('modal-open'); }

const peopleOpts = () => state.people.map((p) => [p.id, p.name + ' — ' + p.title]);
const krOpts = () => state.krs.map((k) => [k.id, k.id + ' · ' + k.title]);

function editObjective(id) {
  const o = id ? U.obj(state, id) : null;
  modal(o ? 'Edit objective' : 'New objective', [
    { name: 'title', label: 'Objective', value: o?.title, required: true, hint: 'Qualitative and inspiring: what are we trying to achieve?' },
    { name: 'why', label: 'Why it matters', type: 'textarea', value: o?.why },
    { name: 'team', label: 'Team', type: 'select', options: state.teams.map((t) => [t.id, t.name]), value: o?.team || 'co', half: true },
    { name: 'owner', label: 'Owner', type: 'select', options: peopleOpts(), value: o?.owner || 'ml', half: true },
    { name: 'parent', label: 'Supports company objective', type: 'select', options: [['', '— None (company-level) —'], ...state.objectives.filter((x) => !x.parent && x.id !== id).map((x) => [x.id, x.id + ' · ' + x.title])], value: o?.parent || '' },
  ], (d) => {
    if (o) Object.assign(o, d, { parent: d.parent || null });
    else {
      const n = state.objectives.length + 1;
      state.objectives.push({ id: 'O' + n + (d.parent ? 'x' : ''), ...d, parent: d.parent || null });
    }
    commit(o ? 'Objective updated' : 'Objective added');
  }, o ? { danger: 'Delete objective', onDanger: () => {
    if (!confirmInline('Delete this objective and its key results?')) return;
    state.krs = state.krs.filter((k) => k.obj !== o.id);
    state.objectives = state.objectives.filter((x) => x.id !== o.id).map((x) => x.parent === o.id ? { ...x, parent: null } : x);
    closeModal(); commit('Objective deleted');
  } } : {});
}
function confirmInline(msg) { return window.confirm ? window.confirm(msg) : true; }

function editKr(id, objId) {
  const k = id ? state.krs.find((x) => x.id === id) : null;
  modal(k ? 'Edit key result' : 'New key result', [
    { name: 'title', label: 'Key result', value: k?.title, required: true, hint: 'Measurable outcome, not a task. "Cut integration build time", not "Hire contractors".' },
    { name: 'obj', label: 'Objective', type: 'select', options: state.objectives.map((o) => [o.id, o.id + ' · ' + o.title]), value: k?.obj || objId },
    { name: 'owner', label: 'Owner', type: 'select', options: peopleOpts(), value: k?.owner || 'lc' },
    { name: 'start', label: 'Start value', type: 'number', value: k?.start ?? 0, half: true, required: true },
    { name: 'target', label: 'Target', type: 'number', value: k?.target ?? 100, half: true, required: true },
    { name: 'unit', label: 'Unit', type: 'select', options: [['%', 'Percent (%)'], ['$M', 'Dollars ($M)'], [' days', 'Days'], ['', 'Number'], [' / 5', 'Score out of 5']], value: k?.unit ?? '%', half: true },
    { name: 'dp', label: 'Decimals', type: 'select', options: [[0, '0'], [1, '1'], [2, '2']], value: k?.dp ?? 0, half: true },
    { name: 'stake', label: 'Value at stake ($K)', type: 'number', value: k?.stake ?? 0, half: true, hint: 'What fully hitting this is worth.' },
    { name: 'stakeNote', label: 'How it was sized', value: k?.stakeNote ?? '', half: true },
  ], (d) => {
    d.start = +d.start; d.target = +d.target; d.dp = +d.dp; d.stake = +d.stake || 0; d.dir = d.target >= d.start ? 'up' : 'down';
    if (k) Object.assign(k, d);
    else state.krs.push({ id: 'KR' + (Math.max(...state.krs.map((x) => +x.id.replace(/\D/g, '') || 0)) + 1), ...d, current: d.start, checkins: [] });
    commit(k ? 'Key result updated' : 'Key result added');
    if (k) openKr(k.id);
  }, k ? { danger: 'Delete', onDanger: () => {
    if (!confirmInline('Delete this key result?')) return;
    state.krs = state.krs.filter((x) => x.id !== k.id); closeModal(); closeDrawer(); commit('Key result deleted');
  } } : {});
}

function quickCheckin(id) {
  const k = state.krs.find((x) => x.id === id); const h = Engine.kr(state, k);
  modal('Check in · ' + k.title, [
    { name: 'value', label: `New value (target ${U.fmt(k, k.target)})`, type: 'number', value: h.value, required: true, half: true },
    { name: 'confidence', label: 'Confidence (1-10)', type: 'number', value: h.confidence, required: true, half: true },
    { name: 'note', label: 'What moved, and what\'s next?', type: 'textarea' },
    { name: 'blocker', label: 'Blocker (optional)' },
  ], (d) => {
    addCheckin(k, +d.value, Math.max(1, Math.min(10, +d.confidence)), d.note, d.blocker);
    commit('Check-in saved'); openKr(k.id);
  }, { submit: 'Submit check-in' });
}

function addCheckin(k, value, confidence, note, blocker) {
  const date = state.meta.asOf;
  const last = Engine.lastCheckin(k);
  const entry = { date, value, confidence, note: note || '', by: k.owner };
  if (last && last.date === date) Object.assign(last, entry); else k.checkins.push(entry);
  k.current = value;
  if (blocker && blocker.trim()) state.risks.push({ id: U.uid('R'), kr: k.id, owner: k.owner, severity: 'medium', status: 'open', raised: date, title: blocker.trim(), impact: 'Raised in weekly check-in.', mitigation: 'To be defined.' });
}

function newRisk(krId) {
  modal('Log a blocker', [
    { name: 'title', label: 'What is in the way?', required: true },
    { name: 'kr', label: 'Key result it threatens', type: 'select', options: krOpts(), value: krId || state.krs[0].id },
    { name: 'severity', label: 'Severity', type: 'select', options: [['high', 'High'], ['medium', 'Medium'], ['low', 'Low']], value: 'medium', half: true },
    { name: 'owner', label: 'Owner', type: 'select', options: peopleOpts(), value: krId ? state.krs.find((k) => k.id === krId).owner : 'lc', half: true },
    { name: 'impact', label: 'Impact if unresolved', type: 'textarea' },
    { name: 'mitigation', label: 'Mitigation / proposed fix', type: 'textarea' },
    { name: 'decision', label: 'Executive decision needed (optional)', hint: 'Leave blank if the owner can resolve it.' },
    { name: 'decisionOwner', label: 'Who decides?', type: 'select', options: peopleOpts(), value: 'ml' },
  ], (d) => {
    const r = { id: U.uid('R'), status: 'open', raised: state.meta.asOf, ...d };
    if (!r.decision) { delete r.decision; delete r.decisionOwner; }
    state.risks.push(r); commit('Blocker logged');
  }, { submit: 'Log blocker' });
}

function newInitiative() {
  modal('New initiative', [
    { name: 'title', label: 'Initiative', required: true, hint: 'The funded work: a project, program or team effort.' },
    { name: 'kr', label: 'Key result it drives', type: 'select', options: [['', '— None (not tied to a goal) —'], ...krOpts()] },
    { name: 'team', label: 'Team', type: 'select', options: state.teams.map((t) => [t.id, t.name]), half: true },
    { name: 'owner', label: 'Owner', type: 'select', options: peopleOpts(), half: true },
    { name: 'fte', label: 'People (FTE)', type: 'number', value: 1, half: true },
    { name: 'budget', label: 'Budget ($K)', type: 'number', value: 0, half: true },
  ], (d) => {
    state.initiatives.push({ id: U.uid('I'), title: d.title, krs: d.kr ? [d.kr] : [], owner: d.owner, team: d.team, fte: +d.fte || 0, budget: +d.budget || 0, spent: 0, status: 'on' });
    commit('Initiative added');
  });
}
function newDependency() {
  modal('New dependency', [
    { name: 'kr', label: 'Key result that needs something', type: 'select', options: krOpts() },
    { name: 'need', label: 'What is needed', required: true },
    { name: 'fromTeam', label: 'From team', type: 'select', options: state.teams.map((t) => [t.id, t.name]), half: true },
    { name: 'due', label: 'Needed by', type: 'date', value: addDays(state.meta.asOf, 14), half: true },
    { name: 'onKr', label: 'Their key result it relies on (optional)', type: 'select', options: [['', '— None —'], ...krOpts()] },
  ], (d) => { state.deps.push({ id: U.uid('X'), ...d, onKr: d.onKr || null }); commit('Dependency added'); });
}

function settings() {
  let key = ''; try { key = localStorage.getItem('okr-claude-key') || ''; } catch (e) {}
  let model = 'claude-sonnet-5-5'; try { model = localStorage.getItem('okr-claude-model') || model; } catch (e) {}
  modal('Settings', [
    { name: 'company', label: 'Company name', value: state.meta.company, half: true },
    { name: 'asOf', label: 'App date', type: 'date', value: state.meta.asOf, half: true, hint: 'Move time forward to see pace and staleness change.' },
    { name: 'key', label: 'Anthropic API key (optional)', type: 'password', value: key, hint: 'Enables Claude in Ask. Stored only in this browser; sent only to api.anthropic.com.' },
    { name: 'model', label: 'Claude model', value: model },
  ], (d) => {
    state.meta.company = d.company || state.meta.company;
    if (d.asOf) state.meta.asOf = d.asOf;
    try { d.key ? localStorage.setItem('okr-claude-key', d.key.trim()) : localStorage.removeItem('okr-claude-key'); localStorage.setItem('okr-claude-model', d.model || 'claude-sonnet-5-5'); } catch (e) {}
    commit('Settings saved');
  }, {
    intro: `<div class="row gap wrap mb"><button type="button" class="btn sm" data-action="export">Export JSON</button><label class="btn sm">Import JSON<input type="file" accept=".json,application/json" data-action="import" hidden/></label><button type="button" class="btn sm" data-action="reset">Reset to demo data</button></div>`,
  });
}

/* ---------------- Events ---------------- */
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-action]'); if (!a) return;
  const act = a.dataset.action, id = a.dataset.id;
  if (['checkin-person', 'risk-status', 'import', 'toggle-action'].includes(act)) return; // change handlers
  e.preventDefault();
  switch (act) {
    case 'kr': closeModal(); openKr(id); break;
    case 'close-drawer': closeDrawer(); break;
    case 'close-modal': closeModal(); break;
    case 'modal-danger': modal.onDanger && modal.onDanger(); break;
    case 'nav': location.hash = '#/' + a.dataset.to; break;
    case 'goto-obj': location.hash = '#/okrs'; setTimeout(() => { const el = document.getElementById('obj-' + id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50); break;
    case 'ask': closeDrawer(); runAsk(a.dataset.q); break;
    case 'adopt': {
      const k = state.krs.find((x) => x.id === id);
      const sg = Suggest.forKr(state, k)[+a.dataset.i];
      if (!sg) break;
      state.commitments = state.commitments || [];
      state.commitments.push({ id: U.uid('C'), text: sg.title, kind: sg.kind, owner: k.owner, due: addDays(state.meta.asOf, 7), kr: k.id, status: 'open', source: 'plan', review: null });
      commit('Added to recovery plan'); openKr(k.id); break;
    }
    case 'commit-status': { const c = state.commitments.find((x) => x.id === id); c.status = a.dataset.v; commit(a.dataset.v === 'done' ? 'Marked done' : a.dataset.v === 'dropped' ? 'Dropped — kept on record' : 'Reopened'); break; }
    case 'dismiss-since': saveVisit(); sinceSnap = null; render(); break;
    case 'new-init': newInitiative(); break;
    case 'new-dep': newDependency(); break;
    case 'decide': {
      const r = state.risks.find((x) => x.id === id);
      r.decided = true; r.status = 'mitigating';
      state.decisions.push({ id: U.uid('D'), date: state.meta.asOf, title: r.decision, owner: r.decisionOwner, status: 'made', kr: r.kr });
      commit('Decision logged'); break;
    }
    case 'new-obj': editObjective(); break;
    case 'edit-obj': editObjective(id); break;
    case 'new-kr': editKr(null, id); break;
    case 'edit-kr': editKr(id); break;
    case 'quick-checkin': quickCheckin(id); break;
    case 'new-risk': newRisk(a.dataset.kr); break;
    case 'risk-filter': riskFilter = a.dataset.v; render(); break;
    case 'clear-filters': okrFilter = { team: '', status: '', owner: '', q: '' }; render(); break;
    case 'settings': settings(); break;
    case 'copy-brief': navigator.clipboard?.writeText(briefText()).then(() => toast('Brief copied'), () => toast('Copy not available here')); break;
    case 'print': window.print(); break;
    case 'export': {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob); const l = document.createElement('a');
      l.href = url; l.download = 'okr-data.json'; l.click(); URL.revokeObjectURL(url); break;
    }
    case 'reset': state = buildDemo(); askThread = []; try { localStorage.removeItem(VISIT_KEY); } catch (e) {} loadSince(); closeModal(); commit('Demo data restored'); break;
    case 'menu': document.body.classList.toggle('nav-open'); break;
  }
});
document.addEventListener('change', (e) => {
  const t = e.target;
  if (t.dataset.action === 'toggle-action') { const c = state.commitments.find((x) => x.id === t.dataset.id); c.status = t.checked ? 'done' : 'open'; commit(t.checked ? 'Marked done' : 'Reopened'); openKr(t.dataset.kr); return; }
  if (t.dataset.action === 'checkin-person') { checkinPerson = t.value; render(); }
  if (t.dataset.action === 'risk-status') { const r = state.risks.find((x) => x.id === t.dataset.id); r.status = t.value; commit('Status updated'); }
  if (t.dataset.filter && t.tagName === 'SELECT') { okrFilter[t.dataset.filter] = t.value; render(); }
  if (t.dataset.action === 'import' && t.files[0]) {
    t.files[0].text().then((txt) => {
      try { const s = JSON.parse(txt); if (!s.krs || !s.objectives) throw new Error(); state = s; closeModal(); commit('Data imported'); }
      catch (err) { toast('That file is not an OKR export'); }
    });
  }
});
document.addEventListener('input', (e) => {
  const t = e.target;
  if (t.dataset.filter === 'q') {
    okrFilter.q = t.value; const pos = t.selectionStart; render();
    const n = $('[data-filter="q"]'); if (n) { n.focus(); n.setSelectionRange(pos, pos); }
  }
});
document.addEventListener('submit', (e) => {
  const f = e.target; e.preventDefault();
  const d = Object.fromEntries(new FormData(f).entries());
  if (f.dataset.form === 'ask') { runAsk(d.q); return; }
  if (f.dataset.form === 'modal') { closeModal(); modal.onSubmit && modal.onSubmit(d); return; }
  if (f.dataset.form === 'commit') {
    state.commitments.push({ id: U.uid('C'), text: d.text, owner: d.owner, due: d.due, kr: d.kr || null, status: 'open', review: state.meta.asOf });
    commit('Commitment added'); return;
  }
  if (f.dataset.form === 'checkin') {
    state.krs.filter((k) => k.owner === checkinPerson).forEach((k) => addCheckin(k, +d['v-' + k.id], +d['c-' + k.id], d['n-' + k.id], d['b-' + k.id]));
    commit('Check-in submitted for ' + U.person(state, checkinPerson).name);
  }
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeModal(); closeDrawer(); } });
window.addEventListener('hashchange', () => { document.body.classList.remove('nav-open'); closeDrawer(); render(); window.scrollTo(0, 0); });

/* ---------------- Boot ---------------- */
state = load();
loadSince();
render();
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && !sinceSnap) saveVisit(); });
