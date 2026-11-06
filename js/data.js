/* Demo dataset for a fictional company, "Meridian Group".
   Everything here is invented for demonstration. buildDemo() expands the
   compact seed below into the full state the app works with. */

const DEMO_AS_OF = '2026-11-05';

const SEED = {
  meta: {
    company: 'Meridian Group',
    tagline: 'Fictional mid-size company · 1,400 employees · 6 regions',
    asOf: DEMO_AS_OF,
    quarter: '2026-Q4',
  },
  quarters: [
    { id: '2026-Q4', label: 'Q4 2026', start: '2026-10-01', end: '2026-12-31' },
  ],
  teams: [
    { id: 'co', name: 'Company', parent: null },
    { id: 'sales', name: 'Sales', parent: 'co' },
    { id: 'fin', name: 'Finance', parent: 'co' },
    { id: 'cs', name: 'Customer Success', parent: 'co' },
    { id: 'tech', name: 'Product & Engineering', parent: 'co' },
    { id: 'ppl', name: 'People', parent: 'co' },
    { id: 'ops', name: 'Operations', parent: 'co' },
  ],
  people: [
    { id: 'dw', name: 'Dana Whitaker', title: 'Chief Executive Officer', team: 'co' },
    { id: 'ml', name: 'Marcus Lee', title: 'Chief Operating Officer', team: 'co' },
    { id: 'pn', name: 'Priya Natarajan', title: 'Chief Financial Officer', team: 'fin' },
    { id: 'er', name: 'Elena Ruiz', title: 'VP, Sales', team: 'sales' },
    { id: 'jb', name: 'Jordan Brooks', title: 'VP, Operations', team: 'ops' },
    { id: 'so', name: 'Sam Okafor', title: 'Chief Technology Officer', team: 'tech' },
    { id: 'ak', name: 'Aisha Karim', title: 'Chief People Officer', team: 'ppl' },
    { id: 'tb', name: 'Tom Becker', title: 'VP, Customer Success', team: 'cs' },
    { id: 'lc', name: 'Leah Chen', title: 'Director, Customer Success', team: 'cs' },
    { id: 'rp', name: 'Ryan Patel', title: 'Director, Revenue Operations', team: 'sales' },
    { id: 'na', name: 'Nina Alvarez', title: 'Director, FP&A', team: 'fin' },
    { id: 'cd', name: 'Chris Doyle', title: 'Director, Engineering', team: 'tech' },
  ],

  /* Objectives. parent links a team objective up to the company objective it supports. */
  objectives: [
    { id: 'O1', team: 'co', owner: 'dw', parent: null,
      title: 'Grow revenue predictably and profitably',
      why: 'The board wants growth that does not come at the expense of margin. Predictability is the credibility play for next year\'s plan.' },
    { id: 'O2', team: 'co', owner: 'ml', parent: null,
      title: 'Earn customer loyalty from day one to renewal',
      why: 'Keeping and growing existing customers is cheaper than winning new ones, and churn is rising.' },
    { id: 'O3', team: 'co', owner: 'ml', parent: null,
      title: 'Build an operating rhythm that scales with the company',
      why: 'Decisions stall and information arrives late. We need a cadence that surfaces problems in days, not quarters.' },

    { id: 'O1a', team: 'sales', owner: 'er', parent: 'O1',
      title: 'Build a pipeline that converts, not just a bigger one',
      why: 'Win rate and cycle time matter more than raw pipeline volume for next quarter\'s bookings.' },
    { id: 'O1b', team: 'fin', owner: 'pn', parent: 'O1',
      title: 'Make profitability visible by customer and product',
      why: 'We cannot manage margin we cannot see. Today profitability is only reported in aggregate.' },
    { id: 'O2a', team: 'cs', owner: 'tb', parent: 'O2',
      title: 'Make customer success proactive, not reactive',
      why: 'We usually learn a customer is unhappy when they tell us they are leaving.' },
    { id: 'O2b', team: 'tech', owner: 'so', parent: 'O2',
      title: 'Ship what we promised, with fewer surprises',
      why: 'Missed roadmap dates and slow fixes on critical bugs are the top themes in detractor feedback.' },
    { id: 'O3a', team: 'ppl', owner: 'ak', parent: 'O3',
      title: 'Grow the next layer of leaders from within',
      why: 'Scaling depends on leaders we develop, not ones we hire at a premium.' },
    { id: 'O3b', team: 'ops', owner: 'jb', parent: 'O3',
      title: 'Remove the friction that slows teams down',
      why: 'Work crosses teams with no clear owner, and every team has bought its own tools.' },
  ],

  /* Key results.
     dir: 'up' (higher is better) or 'down'. unit: display unit. dp: decimals.
     conf: weekly confidence (1-10), oldest first. One entry per check-in.
     curve: shape of progress so far (<1 front-loaded, >1 back-loaded).
     notes: latest-first notes for the most recent check-ins. */
  krs: [
    // O1 Company
    { id: 'KR1', obj: 'O1', owner: 'pn', title: 'Raise net revenue retention', dir: 'up', unit: '%', dp: 0,
      start: 104, target: 110, current: 107, conf: [7, 7, 7, 8, 8], curve: 1,
      notes: ['Two expansion deals signed (Halverson, Corvid). Brightline renewal moved into November.', 'On pace. Expansion pipeline covers the gap if Brightline renews flat.'] },
    { id: 'KR2', obj: 'O1', owner: 'er', title: 'Close Q4 new bookings', dir: 'up', unit: '$M', dp: 1,
      start: 0, target: 4.2, current: 1.3, conf: [7, 6, 6, 5, 5], curve: 1.2,
      notes: ['Two late-stage deals slipped to January after procurement reviews. Need exec sponsor on Tessera.', 'Tessera legal review taking longer than forecast.'] },
    { id: 'KR3', obj: 'O1', owner: 'pn', title: 'Improve gross margin', dir: 'up', unit: '%', dp: 1,
      start: 31, target: 35, current: 32.1, conf: [6, 6, 6, 6, 5], curve: 1,
      notes: ['Contractor costs ate most of the pricing gains. Cost model review in progress.', 'Price increase on 3 accounts lands in December.'] },

    // O1a Sales
    { id: 'KR4', obj: 'O1a', owner: 'rp', title: 'Grow qualified pipeline for next quarter', dir: 'up', unit: '$M', dp: 1,
      start: 6, target: 12, current: 6.8, conf: [6, 5, 4, 4, 3], curve: 1.6,
      notes: ['Marketing-sourced leads down 30% since the campaign pause. Pipeline will not recover without a spend decision.', 'Waiting on decision to restart paid campaigns.'] },
    { id: 'KR5', obj: 'O1a', owner: 'er', title: 'Increase win rate on qualified deals', dir: 'up', unit: '%', dp: 0,
      start: 18, target: 25, current: 21, conf: [6, 7, 7, 7, 7], curve: 1,
      notes: ['Deal desk reviews are working. Lost two on price, won three on time-to-value commitments.', 'Win rate improving where solutions engineering is involved early.'] },
    { id: 'KR6', obj: 'O1a', owner: 'rp', title: 'Shorten average sales cycle', dir: 'down', unit: ' days', dp: 0,
      start: 74, target: 60, current: 70, conf: [7, 7, 6, 6, 6], curve: 1,
      notes: ['Security review is still the longest stage (avg 19 days). Pre-approved security pack in draft.', 'Cycle improving on mid-market deals only.'] },

    // O1b Finance
    { id: 'KR7', obj: 'O1b', owner: 'na', title: 'Ship account-level P&L for top 20 customers', dir: 'up', unit: ' accounts', dp: 0,
      start: 0, target: 20, current: 12, conf: [8, 8, 8, 9, 9], curve: 0.8,
      notes: ['12 of 20 live. Remaining 8 need cost allocation data from Engineering.', 'Ahead of plan.'] },
    { id: 'KR8', obj: 'O1b', owner: 'na', title: 'Improve revenue forecast accuracy', dir: 'up', unit: '%', dp: 0,
      start: 85, target: 95, current: 91, conf: [7, 7, 8, 8, 8], curve: 1,
      notes: ['October landed within 9% of forecast. Weekly pipeline review with Sales is now standard.'] },

    // O2 Company
    { id: 'KR9', obj: 'O2', owner: 'tb', title: 'Reduce gross revenue churn', dir: 'down', unit: '%', dp: 1,
      start: 9, target: 6, current: 7.9, conf: [6, 7, 7, 7, 7], curve: 1,
      notes: ['Two save plays worked in October. Churn concentrated in accounts under $50K.', 'Improving.'] },
    { id: 'KR10', obj: 'O2', owner: 'tb', title: 'Raise net promoter score', dir: 'up', unit: '', dp: 0,
      start: 28, target: 40, current: 31, conf: [6, 6, 6, 5, 5], curve: 1,
      notes: ['Detractors cite slow fixes on critical bugs and one missed roadmap date.', 'Product reliability is the theme behind most detractor comments.'] },
    { id: 'KR11', obj: 'O2', owner: 'ml', title: 'Cut time-to-value for new customers', dir: 'down', unit: ' days', dp: 0,
      start: 60, target: 30, current: 42, conf: [7, 7, 7, 8, 8], curve: 0.9,
      notes: ['Guided setup cut the median to 42 days. Larger accounts still take 55+.'] },

    // O2a Customer Success
    { id: 'KR12', obj: 'O2a', owner: 'lc', title: 'Accounts with an active success plan', dir: 'up', unit: '%', dp: 0,
      start: 40, target: 100, current: 85, conf: [7, 8, 8, 9, 9], curve: 0.7,
      notes: ['All top-tier accounts covered. Remaining gaps are long-tail accounts.', 'Ahead of plan.'] },
    { id: 'KR13', obj: 'O2a', owner: 'lc', title: 'At-risk accounts recovered within 30 days', dir: 'up', unit: '%', dp: 0,
      start: 55, target: 85, current: 60, conf: [6, 5, 5, 4, 4], curve: 1.3,
      notes: ['Account managers are at 1:62 against a 1:40 target. Recovery plans are starting late.', 'Recovery misses concentrated in mid-market.'] },
    { id: 'KR14', obj: 'O2a', owner: 'tb', title: 'Cut support first-response time', dir: 'down', unit: ' hrs', dp: 0,
      start: 14, target: 3, current: 9, conf: [6, 6, 7, 7, 7], curve: 1,
      notes: ['Follow-the-sun coverage live in two regions.'] },

    // O2b Product & Engineering
    { id: 'KR15', obj: 'O2b', owner: 'cd', title: 'Deliver roadmap commitments on schedule', dir: 'up', unit: '%', dp: 0,
      start: 50, target: 90, current: 58, conf: [6, 6, 5, 5], curve: 1, stale: true,
      notes: ['Two of five committed items slipped a sprint; dependencies on the data platform.'] },
    { id: 'KR16', obj: 'O2b', owner: 'so', title: 'Cut time to resolve critical bugs', dir: 'down', unit: ' days', dp: 0,
      start: 21, target: 10, current: 19, conf: [6, 5, 4, 3, 3], curve: 1.5,
      notes: ['Two engineers pulled to remediate the October platform incident. Critical bug backlog at 11. Need decision on contractor budget.', 'Losing capacity to incident work.'] },

    // O3 Company
    { id: 'KR17', obj: 'O3', owner: 'ml', title: 'Teams running weekly OKR check-ins', dir: 'up', unit: '%', dp: 0,
      start: 30, target: 100, current: 78, conf: [7, 8, 8, 8, 8], curve: 0.8,
      notes: ['Engineering and two regional offices still inconsistent.'] },
    { id: 'KR18', obj: 'O3', owner: 'ml', title: 'Close exec decisions within 7 days', dir: 'up', unit: '%', dp: 0,
      start: 45, target: 85, current: 66, conf: [6, 7, 7, 7, 7], curve: 1,
      notes: ['Decision log reviewed in every Monday staff meeting. Budget decisions are the slowest.'] },
    { id: 'KR19', obj: 'O3', owner: 'ak', title: 'Reduce regretted attrition (annualized)', dir: 'down', unit: '%', dp: 1,
      start: 14, target: 9, current: 12.5, conf: [6, 6, 6, 6], curve: 1, stale: true,
      notes: ['Stay interviews complete for top 100 performers.'] },

    // O3a People
    { id: 'KR20', obj: 'O3a', owner: 'ak', title: 'Managers completing the leadership program', dir: 'up', unit: ' managers', dp: 0,
      start: 0, target: 24, current: 9, conf: [8, 8, 8, 8, 8], curve: 1,
      notes: ['Cohort 2 starts Nov 16; 12 enrolled.'] },
    { id: 'KR21', obj: 'O3a', owner: 'ak', title: 'Fill leadership roles internally', dir: 'up', unit: '%', dp: 0,
      start: 35, target: 60, current: 40, conf: [6, 6, 5, 5, 5], curve: 1.2,
      notes: ['Only 3 of 8 recent leadership openings had a ready internal candidate. Succession plans are thin in Customer Success.'] },

    // O3b Operations
    { id: 'KR22', obj: 'O3b', owner: 'jb', title: 'Cross-team processes with a named owner', dir: 'up', unit: ' processes', dp: 0,
      start: 10, target: 40, current: 31, conf: [8, 8, 8, 8, 8], curve: 0.8,
      notes: ['Quote-to-cash and hire-to-productive mapped and owned. Procurement next.'] },
    { id: 'KR23', obj: 'O3b', owner: 'jb', title: 'Retire overlapping software tools', dir: 'down', unit: ' tools', dp: 0,
      start: 48, target: 30, current: 45, conf: [7, 6, 5, 5, 4], curve: 1,
      notes: ['Teams pushing back on giving up tools without a migration plan. Need a CFO-backed freeze on new purchases.', 'Only 3 tools retired so far.'] },
  ],

  risks: [
    { id: 'R1', kr: 'KR16', owner: 'so', severity: 'high', status: 'open', raised: '2026-10-21',
      title: 'Engineers pulled into incident remediation',
      impact: 'Critical bug backlog at 11; fixes customers are waiting on are slipping.',
      mitigation: 'Contract two engineers for 10 weeks (~$140K) to clear the backlog.',
      decision: 'Approve contractor budget for the bug backlog', decisionOwner: 'pn' },
    { id: 'R2', kr: 'KR4', owner: 'rp', severity: 'high', status: 'open', raised: '2026-10-14',
      title: 'Paid campaign pause starving next quarter\'s pipeline',
      impact: 'Marketing-sourced pipeline down 30%; next quarter\'s bookings target unreachable without recovery.',
      mitigation: 'Restart top two campaigns at 60% of prior spend; shift the rest to partner referrals.',
      decision: 'Restart paid campaigns at reduced spend', decisionOwner: 'dw' },
    { id: 'R3', kr: 'KR13', owner: 'lc', severity: 'medium', status: 'mitigating', raised: '2026-10-19',
      title: 'Account managers over capacity',
      impact: 'At 1:62 accounts per manager, recovery plans for at-risk accounts start late.',
      mitigation: 'Move 40 smallest accounts to a pooled, digital-first success model.',
      decision: 'Approve pooled success model for smaller accounts', decisionOwner: 'ml' },
    { id: 'R4', kr: 'KR10', owner: 'tb', severity: 'medium', status: 'open', raised: '2026-10-27',
      title: 'Product reliability driving detractor scores',
      impact: 'Most detractor comments cite slow critical-bug fixes.',
      mitigation: 'Weekly joint triage between Customer Success and Engineering on top customer issues.' },
    { id: 'R5', kr: 'KR2', owner: 'er', severity: 'medium', status: 'open', raised: '2026-10-30',
      title: 'Tessera deal stalled in legal review',
      impact: '$0.9M of Q4 bookings at risk of slipping to next quarter.',
      mitigation: 'CEO-to-CEO call to unblock the liability cap discussion.',
      decision: 'CEO sponsor call with Tessera this week', decisionOwner: 'dw' },
    { id: 'R6', kr: 'KR3', owner: 'pn', severity: 'medium', status: 'mitigating', raised: '2026-10-12',
      title: 'Contractor costs eroding margin',
      impact: 'Roughly 0.8 points of gross margin lost in October.',
      mitigation: 'Cost model reforecast; convert top 10 long-term contractors to employees.' },
    { id: 'R7', kr: 'KR23', owner: 'jb', severity: 'low', status: 'open', raised: '2026-11-02',
      title: 'Teams resisting tool consolidation',
      impact: 'Tool count barely moving; license spend flat.',
      mitigation: 'Freeze new software purchases; publish migration plans before retiring tools.' },
    { id: 'R8', kr: 'KR12', owner: 'lc', severity: 'low', status: 'closed', raised: '2026-10-05',
      title: 'No standard success plan template',
      impact: 'Resolved: one template adopted across all accounts.',
      mitigation: 'Template agreed in week 2.' },
  ],
};

/* Weekly check-in dates for the demo quarter (Mondays). */
const DEMO_CHECKIN_DATES = ['2026-10-05', '2026-10-12', '2026-10-19', '2026-10-26', '2026-11-02'];

function roundTo(v, dp) { const m = Math.pow(10, dp); return Math.round(v * m) / m; }

function buildDemo() {
  const s = JSON.parse(JSON.stringify(SEED));
  s.krs = s.krs.map((k) => {
    const n = k.conf.length;
    const checkins = [];
    for (let i = 0; i < n; i++) {
      const t = (i + 1) / n;
      const f = Math.pow(t, k.curve || 1);
      // small deterministic wobble so the history doesn't look machine-made
      const wobble = i < n - 1 ? Math.sin((k.id.length + i) * 1.7) * 0.04 * (k.current - k.start) : 0;
      const value = roundTo(k.start + (k.current - k.start) * f + wobble, k.dp);
      const noteIdx = n - 1 - i; // notes are latest-first
      checkins.push({
        date: DEMO_CHECKIN_DATES[i],
        value,
        confidence: k.conf[i],
        note: k.notes[noteIdx] || '',
        by: k.owner,
      });
    }
    const out = { ...k, checkins };
    delete out.conf; delete out.notes; delete out.curve; delete out.stale;
    return out;
  });
  s.decisions = [
    { id: 'D1', date: '2026-10-12', title: 'Adopt one success plan template for all accounts', owner: 'tb', status: 'made', kr: 'KR12' },
    { id: 'D2', date: '2026-10-26', title: 'Add weekend support coverage in two regions', owner: 'tb', status: 'made', kr: 'KR14' },
  ];
  return s;
}
