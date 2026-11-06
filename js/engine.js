/* OKR engine: pure functions that turn raw OKR data into health signals.
   Rules are documented in the "How it works" page so they can be audited. */

const DAY = 86400000;
const STALE_DAYS = 8;          // no check-in for > 8 days = stale
const ON_TRACK_GAP = -0.10;    // within 10 pts of expected pace = on track
const AT_RISK_GAP = -0.25;     // 10-25 pts behind = at risk; more = off track

const Engine = {
  d(s) { return new Date(s + 'T12:00:00'); },
  daysBetween(a, b) { return Math.round((Engine.d(b) - Engine.d(a)) / DAY); },

  quarter(state) { return state.quarters.find((q) => q.id === state.meta.quarter) || state.quarters[0]; },

  /* Fraction of the quarter elapsed as of the app date. */
  elapsed(state) {
    const q = Engine.quarter(state);
    const total = Engine.daysBetween(q.start, q.end) + 1;
    const done = Engine.daysBetween(q.start, state.meta.asOf);
    return Math.max(0, Math.min(1, done / total));
  },
  week(state) {
    const q = Engine.quarter(state);
    return Math.floor(Engine.daysBetween(q.start, state.meta.asOf) / 7) + 1;
  },
  totalWeeks(state) {
    const q = Engine.quarter(state);
    return Math.round((Engine.daysBetween(q.start, q.end) + 1) / 7);
  },

  progressOf(kr, value) {
    const span = kr.target - kr.start;
    if (span === 0) return 1;
    return Math.max(0, Math.min(1.25, (value - kr.start) / span));
  },

  lastCheckin(kr) { return kr.checkins[kr.checkins.length - 1] || null; },
  prevCheckin(kr) { return kr.checkins[kr.checkins.length - 2] || null; },

  /* Full health read-out for one key result. */
  kr(state, kr, noDeps) {
    const e = Engine.elapsed(state);
    const last = Engine.lastCheckin(kr);
    const prev = Engine.prevCheckin(kr);
    const value = last ? last.value : kr.start;
    const progress = Engine.progressOf(kr, value);
    const prevProgress = prev ? Engine.progressOf(kr, prev.value) : 0;
    const confidence = last ? last.confidence : 5;
    const confDelta = prev ? confidence - prev.confidence : 0;
    const gap = progress - e;
    const daysSince = last ? Engine.daysBetween(last.date, state.meta.asOf) : 99;
    const stale = daysSince > STALE_DAYS;

    let pace = gap >= ON_TRACK_GAP ? 0 : gap >= AT_RISK_GAP ? 1 : 2;
    let conf = confidence <= 3 ? 2 : confidence <= 5 ? 1 : 0;
    let level = progress >= 1 ? 0 : Math.max(pace, conf);
    const status = ['on', 'risk', 'off'][level];

    // Forecast: blend the quarter-to-date pace with the last two weeks' pace, then
    // discount the remaining gain by owner confidence (full credit at 7/10 or above).
    const weeksTotal = Engine.totalWeeks(state);
    const wkEl = Math.max(0.5, e * weeksTotal), wkLeft = Math.max(0, weeksTotal - wkEl);
    const r1 = progress / wkEl;
    let r2 = r1;
    if (last && kr.checkins.length >= 3) {
      const a = kr.checkins[kr.checkins.length - 3];
      const span = Math.max(0.5, Engine.daysBetween(a.date, last.date) / 7);
      r2 = (progress - Engine.progressOf(kr, a.value)) / span;
    }
    const rate = Math.max(0, (r1 + r2) / 2);
    const projected = progress >= 1 ? progress : Math.min(1.25, progress + rate * wkLeft * Math.min(1, confidence / 7));
    const projectedValue = kr.start + (kr.target - kr.start) * projected;

    const openRisks = state.risks.filter((r) => r.kr === kr.id && r.status !== 'closed');
    // Value at risk: what's at stake × the share we're projected to miss.
    const shortfall = Math.max(0, Math.min(1, 1 - projected));
    const exposure = progress >= 1 || level === 0 ? 0 : Math.round((kr.stake || 0) * shortfall);
    // Upstream dependencies that are late or rest on an off-track key result.
    const upstream = noDeps ? [] : Engine.depsFor(state, kr.id).filter((d) => d.risk);
    const reasons = [];
    if (pace === 2) reasons.push(`${Math.round(-gap * 100)} pts behind expected pace`);
    else if (pace === 1) reasons.push(`${Math.round(-gap * 100)} pts behind pace`);
    if (conf > 0) reasons.push(`owner confidence ${confidence}/10`);
    if (confDelta <= -2) reasons.push(`confidence fell ${-confDelta} pts`);
    if (stale) reasons.push(`no check-in for ${daysSince} days`);
    if (openRisks.some((r) => r.severity === 'high')) reasons.push('high-severity blocker open');
    const mh = noDeps ? null : Engine.metricHealth(state, kr);
    if (upstream.length) reasons.push(`waiting on ${upstream.map((d) => d.onKr || U.team(state, d.fromTeam).name).join(', ')}`);

    const attention = level * 3 + (stale ? 2 : 0) + (confDelta <= -2 ? 1 : 0)
      + openRisks.filter((r) => r.severity === 'high').length * 2 + openRisks.length * 0.5
      + Math.min(3, exposure / 300) + upstream.length * 0.5;

    return { value, progress, prevProgress, delta: progress - prevProgress, confidence, confDelta,
      expected: e, gap, status, stale, daysSince, projected, projectedValue, openRisks, reasons, attention, exposure, upstream, metric: mh };
  },

  objective(state, obj) {
    const krs = state.krs.filter((k) => k.obj === obj.id);
    const healths = krs.map((k) => Engine.kr(state, k));
    const progress = healths.length ? healths.reduce((a, h) => a + Math.min(1, h.progress), 0) / healths.length : 0;
    const counts = { on: 0, risk: 0, off: 0 };
    healths.forEach((h) => counts[h.status]++);
    const status = counts.off >= Math.max(1, Math.ceil(krs.length / 2)) ? 'off'
      : (counts.off || counts.risk) ? 'risk' : 'on';
    const children = state.objectives.filter((o) => o.parent === obj.id);
    return { krs, healths, progress, counts, status, children, expected: Engine.elapsed(state) };
  },

  portfolio(state) {
    const all = state.krs.map((k) => ({ kr: k, h: Engine.kr(state, k) }));
    const counts = { on: 0, risk: 0, off: 0 };
    all.forEach((x) => counts[x.h.status]++);
    const progress = all.reduce((a, x) => a + Math.min(1, x.h.progress), 0) / (all.length || 1);
    const stale = all.filter((x) => x.h.stale);
    const openRisks = state.risks.filter((r) => r.status !== 'closed');
    const decisions = Engine.pendingDecisions(state);
    const attention = all.filter((x) => x.h.status !== 'on' || x.h.stale)
      .sort((a, b) => b.h.attention - a.h.attention);
    const exposure = all.reduce((a, x) => a + x.h.exposure, 0);
    const commitments = Engine.commitments(state);
    return { all, counts, progress, expected: Engine.elapsed(state), stale, openRisks, decisions, attention, exposure, commitments };
  },

  pendingDecisions(state) {
    return state.risks.filter((r) => r.decision && r.status !== 'closed' && !r.decided)
      .map((r) => ({ ...r, age: Engine.daysBetween(r.raised, state.meta.asOf) }))
      .sort((a, b) => b.age - a.age);
  },

  /* Average progress across KRs at each check-in week, for the trend chart. */
  trend(state, krs) {
    const q = Engine.quarter(state);
    const nowWeek = Engine.week(state);
    const pts = [];
    for (let w = 0; w <= nowWeek; w++) {
      const cutoff = new Date(Engine.d(q.start).getTime() + w * 7 * DAY);
      let sum = 0;
      krs.forEach((k) => {
        let v = k.start;
        k.checkins.forEach((c) => { if (Engine.d(c.date) <= cutoff) v = c.value; });
        sum += Math.min(1, Engine.progressOf(k, v));
      });
      pts.push([w, krs.length ? sum / krs.length : 0]);
    }
    return pts;
  },

  team(state, teamId) {
    const objs = state.objectives.filter((o) => o.team === teamId);
    const krs = state.krs.filter((k) => objs.some((o) => o.id === k.obj));
    const hs = krs.map((k) => Engine.kr(state, k));
    const progress = hs.length ? hs.reduce((a, h) => a + Math.min(1, h.progress), 0) / hs.length : 0;
    const counts = { on: 0, risk: 0, off: 0 };
    hs.forEach((h) => counts[h.status]++);
    return { objs, krs, hs, progress, counts };
  },

  /* ---- Metric integrity ---- */
  VERIFY_WINDOW: { daily: 7, weekly: 14, monthly: 45 },
  metricHealth(state, kr) {
    const m = (state.metrics || []).find((x) => x.kr === kr.id);
    if (!m) return { status: 'undefined', label: 'No definition', metric: null };
    const vals = (m.sources || []).map((s) => +s.value);
    let spread = 0;
    if (vals.length > 1) { const mean = vals.reduce((a, v) => a + v, 0) / vals.length; spread = mean ? (Math.max(...vals) - Math.min(...vals)) / Math.abs(mean) * 100 : 0; }
    const age = Engine.daysBetween(m.lastVerified, state.meta.asOf);
    const window = Engine.VERIFY_WINDOW[m.refresh] || 14;
    if (vals.length > 1 && spread > m.tolerance) return { status: 'discrepancy', label: 'Sources disagree', metric: m, spread, age };
    if (age > window) return { status: 'unverified', label: 'Not verified recently', metric: m, spread, age };
    return { status: 'trusted', label: 'Trusted', metric: m, spread, age };
  },
  integrity(state) {
    const rows = state.krs.map((k) => ({ kr: k, mh: Engine.metricHealth(state, k) }));
    const c = { trusted: 0, discrepancy: 0, unverified: 0, undefined: 0 };
    rows.forEach((r) => c[r.mh.status]++);
    return { rows, counts: c };
  },

  /* ---- Decision speed ---- */
  decisionVelocity(state) {
    const made = (state.decisions || []).filter((d) => d.requested && d.date).map((d) => Engine.daysBetween(d.requested, d.date)).sort((a, b) => a - b);
    const median = made.length ? (made.length % 2 ? made[(made.length - 1) / 2] : (made[made.length / 2 - 1] + made[made.length / 2]) / 2) : null;
    const within7 = made.length ? made.filter((x) => x <= 7).length / made.length : null;
    const waiting = Engine.pendingDecisions(state);
    const overdue = waiting.filter((d) => d.neededBy && d.neededBy < state.meta.asOf);
    return { made: made.length, median, within7, waiting, overdue, oldest: waiting[0] ? waiting[0].age : 0 };
  },

  /* ---- Meeting cadence ---- */
  nextMeeting(state, m) {
    const today = Engine.d(state.meta.asOf);
    const iso = (d) => d.toISOString().slice(0, 10);
    if (m.freq === 'weekly') { const d = new Date(today); while (d.getDay() !== m.weekday) d.setDate(d.getDate() + 1); return iso(d); }
    if (m.freq === 'monthly') {
      for (let k = 0; k < 3; k++) {
        const d = new Date(today.getFullYear(), today.getMonth() + k, 1, 12);
        while (d.getDay() !== m.weekday) d.setDate(d.getDate() + 1);
        if (d >= today) return iso(d);
      }
    }
    if (m.freq === 'quarterly') { const q = Engine.quarter(state); const d = Engine.d(q.end); d.setDate(d.getDate() - 14); while (d.getDay() !== 4) d.setDate(d.getDate() - 1); return iso(d); }
    return m.date;
  },
  meetingsBetween(state, from, days) {
    const out = [];
    const start = Engine.d(from), end = new Date(start.getTime() + days * DAY);
    (state.cadence || []).forEach((m) => {
      if (m.freq === 'weekly') { const d = Engine.d(Engine.nextMeeting(state, m)); for (; d <= end; d.setDate(d.getDate() + 7)) out.push({ m, date: d.toISOString().slice(0, 10) }); }
      else if (m.freq === 'monthly') { for (let k = 0; k < 3; k++) { const d = new Date(start.getFullYear(), start.getMonth() + k, 1, 12); while (d.getDay() !== m.weekday) d.setDate(d.getDate() + 1); if (d >= start && d <= end) out.push({ m, date: d.toISOString().slice(0, 10) }); } }
      else { const nd = Engine.nextMeeting(state, m); if (nd && Engine.d(nd) <= end) out.push({ m, date: nd }); }
    });
    return out.sort((a, b) => a.date.localeCompare(b.date));
  },

  /* ---- Dependencies ---- */
  depsFor(state, krId) {
    return (state.deps || []).filter((d) => d.kr === krId).map((d) => Engine.dep(state, d));
  },
  dependents(state, krId) {
    return (state.deps || []).filter((d) => d.onKr === krId).map((d) => Engine.dep(state, d));
  },
  dep(state, d) {
    const up = d.onKr ? state.krs.find((k) => k.id === d.onKr) : null;
    const upH = up ? Engine.kr(state, up, true) : null;
    const late = !d.delivered && d.due < state.meta.asOf;
    const upOff = upH && upH.status !== 'on';
    const state_ = d.delivered ? 'delivered' : late ? 'late' : upOff ? 'at risk' : 'on time';
    return { ...d, up, upH, late, risk: !d.delivered && (late || upOff), label: state_ };
  },

  /* ---- Commitments & follow-through ---- */
  commitments(state) {
    const all = (state.commitments || []).map((c) => ({ ...c, overdue: c.status === 'open' && c.due < state.meta.asOf }));
    const open = all.filter((c) => c.status === 'open');
    const overdue = all.filter((c) => c.overdue);
    const due = all.filter((c) => c.due <= state.meta.asOf || c.status !== 'open');
    const done = due.filter((c) => c.status === 'done').length;
    const rate = due.length ? done / due.length : 1;
    const byOwner = {};
    all.forEach((c) => {
      const o = byOwner[c.owner] = byOwner[c.owner] || { owner: c.owner, done: 0, open: 0, overdue: 0, dropped: 0 };
      if (c.status === 'done') o.done++; else if (c.status === 'dropped') o.dropped++; else if (c.overdue) o.overdue++; else o.open++;
    });
    Object.values(byOwner).forEach((o) => { const d = o.done + o.overdue + o.dropped; o.rate = d ? o.done / d : null; });
    const reviews = [...new Set(all.map((c) => c.review))].filter(Boolean).sort();
    return { all, open, overdue, rate, byOwner: Object.values(byOwner), lastReview: reviews.filter((r) => r < state.meta.asOf).pop() || reviews.pop() };
  },

  /* ---- Initiatives & resources ---- */
  resources(state) {
    const inits = state.initiatives || [];
    const topOf = (krId) => { const k = state.krs.find((x) => x.id === krId); if (!k) return null; let o = state.objectives.find((x) => x.id === k.obj); while (o && o.parent) o = state.objectives.find((x) => x.id === o.parent); return o; };
    const rows = state.objectives.filter((o) => !o.parent).map((o) => ({ obj: o, fte: 0, budget: 0, inits: [] }));
    const unaligned = { fte: 0, budget: 0, inits: [] };
    inits.forEach((i) => {
      const tops = [...new Set(i.krs.map(topOf).filter(Boolean).map((o) => o.id))];
      if (!tops.length) { unaligned.fte += i.fte; unaligned.budget += i.budget; unaligned.inits.push(i); return; }
      tops.forEach((id) => { const r = rows.find((x) => x.obj.id === id); r.fte += i.fte / tops.length; r.budget += i.budget / tops.length; r.inits.push(i); });
    });
    const totalFte = inits.reduce((a, i) => a + i.fte, 0), totalBudget = inits.reduce((a, i) => a + i.budget, 0);
    const uncovered = state.krs.filter((k) => !inits.some((i) => i.krs.includes(k.id)));
    return { rows, unaligned, totalFte, totalBudget, uncovered };
  },

  /* ---- Goal-setting calibration ---- */
  calibration(scores) {
    const v = scores.filter((x) => x != null);
    const avg = v.reduce((a, x) => a + x, 0) / (v.length || 1);
    if (v.length >= 3 && v.every((x, i) => i === 0 || x < v[i - 1]) && v[0] - v[v.length - 1] >= 0.08) return { avg, label: 'Declining every quarter', tone: 'bad' };
    if (avg >= 0.9) return { avg, label: 'Targets may be too safe', tone: 'warn' };
    if (avg >= 0.6) return { avg, label: 'Healthy stretch', tone: 'good' };
    if (avg >= 0.5) return { avg, label: 'Slightly over-ambitious', tone: 'warn' };
    return { avg, label: 'Over-committing or under-resourced', tone: 'bad' };
  },
  projectedScore(state, krs) {
    if (!krs.length) return null;
    return krs.reduce((a, k) => a + Math.min(1, Engine.kr(state, k).projected), 0) / krs.length;
  },

  /* ---- Snapshot for "since you last looked" ---- */
  snapshot(state) {
    const krs = {};
    state.krs.forEach((k) => { const h = Engine.kr(state, k); krs[k.id] = { status: h.status, value: h.value, confidence: h.confidence }; });
    return { asOf: state.meta.asOf, at: new Date().toISOString(), krs,
      risks: state.risks.filter((r) => r.status !== 'closed').map((r) => r.id),
      decisions: state.decisions.map((d) => d.id),
      done: (state.commitments || []).filter((c) => c.status === 'done').map((c) => c.id) };
  },
  /* Baseline for a first visit: the picture as of last week's check-ins. */
  lastWeekSnapshot(state) {
    const s = JSON.parse(JSON.stringify(state));
    const cut = new Date(Engine.d(state.meta.asOf).getTime() - 7 * DAY).toISOString().slice(0, 10);
    s.meta.asOf = cut;
    s.krs.forEach((k) => { k.checkins = k.checkins.filter((c) => c.date <= cut); });
    s.risks = s.risks.filter((r) => r.raised <= cut);
    s.decisions = s.decisions.filter((d) => d.date <= cut);
    (s.commitments || []).forEach((c) => { if (c.status === 'done' && c.due > cut) c.status = 'open'; });
    const snap = Engine.snapshot(s);
    snap.asOf = cut; snap.firstVisit = true;
    return snap;
  },
  diff(state, snap) {
    const rank = { on: 0, risk: 1, off: 2 };
    const better = [], worse = [];
    state.krs.forEach((k) => {
      const before = snap.krs[k.id]; if (!before) return;
      const h = Engine.kr(state, k);
      if (rank[h.status] < rank[before.status]) better.push({ k, from: before.status, to: h.status });
      if (rank[h.status] > rank[before.status]) worse.push({ k, from: before.status, to: h.status });
    });
    const newRisks = state.risks.filter((r) => r.status !== 'closed' && !snap.risks.includes(r.id));
    const newDecisions = state.decisions.filter((d) => !snap.decisions.includes(d.id));
    const newlyDone = (state.commitments || []).filter((c) => c.status === 'done' && !snap.done.includes(c.id));
    return { better, worse, newRisks, newDecisions, newlyDone, empty: !(better.length + worse.length + newRisks.length + newDecisions.length + newlyDone.length) };
  },

  /* End-of-quarter style score (0.0-1.0), Google-style. */
  score(progress) { return Math.round(Math.min(1, progress) * 10) / 10; },
};

const STATUS_LABEL = { on: 'On track', risk: 'At risk', off: 'Off track' };
const STATUS_ICON = { on: '●', risk: '▲', off: '■' };

const fmtK = (k) => k >= 1000 ? '$' + (k / 1000).toFixed(k >= 10000 ? 0 : 1) + 'M' : '$' + Math.round(k) + 'K';
