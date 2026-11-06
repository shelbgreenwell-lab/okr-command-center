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
  kr(state, kr) {
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

    // Linear forecast: if the current rate holds, where do we land?
    const projected = e > 0 ? Math.min(1.5, progress / e) : 0;
    const projectedValue = kr.start + (kr.target - kr.start) * projected;

    const openRisks = state.risks.filter((r) => r.kr === kr.id && r.status !== 'closed');
    const reasons = [];
    if (pace === 2) reasons.push(`${Math.round(-gap * 100)} pts behind expected pace`);
    else if (pace === 1) reasons.push(`${Math.round(-gap * 100)} pts behind pace`);
    if (conf > 0) reasons.push(`owner confidence ${confidence}/10`);
    if (confDelta <= -2) reasons.push(`confidence fell ${-confDelta} pts`);
    if (stale) reasons.push(`no check-in for ${daysSince} days`);
    if (openRisks.some((r) => r.severity === 'high')) reasons.push('high-severity blocker open');

    const attention = level * 3 + (stale ? 2 : 0) + (confDelta <= -2 ? 1 : 0)
      + openRisks.filter((r) => r.severity === 'high').length * 2 + openRisks.length * 0.5;

    return { value, progress, prevProgress, delta: progress - prevProgress, confidence, confDelta,
      expected: e, gap, status, stale, daysSince, projected, projectedValue, openRisks, reasons, attention };
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
    return { all, counts, progress, expected: Engine.elapsed(state), stale, openRisks, decisions, attention };
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

  /* End-of-quarter style score (0.0-1.0), Google-style. */
  score(progress) { return Math.round(Math.min(1, progress) * 10) / 10; },
};

const STATUS_LABEL = { on: 'On track', risk: 'At risk', off: 'Off track' };
const STATUS_ICON = { on: '●', risk: '▲', off: '■' };
