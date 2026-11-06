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
    { id: 'co', name: 'Executive team', parent: null },
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


/* ---- Extensions: what's at stake, leading indicators, commitments, initiatives,
   dependencies and quarter history. Kept separate so the core seed stays readable. ---- */

/* stake: $K of value tied to fully hitting the key result. stakeNote: how it was sized.
   leads: leading indicators — {name, value, prev, good: 'up'|'down', unit}. */
const KR_EXTRA = {
  KR1: { stake: 1800, stakeNote: 'Each point of NRR is about $300K of ARR on a $30M base.',
    leads: [{ name: 'Expansion pipeline', value: 2.1, prev: 1.8, good: 'up', unit: '$M' }] },
  KR2: { stake: 4200, stakeNote: 'The Q4 bookings target itself.',
    leads: [{ name: 'Late-stage deals in commit', value: 3.1, prev: 3.6, good: 'up', unit: '$M' }, { name: 'Late-stage deals with an exec sponsor', value: 4, prev: 3, good: 'up', unit: '' }] },
  KR3: { stake: 1200, stakeNote: 'Each margin point is about $300K of gross profit a quarter.',
    leads: [{ name: 'Contractor spend per month', value: 410, prev: 430, good: 'down', unit: '$K' }] },
  KR4: { stake: 1200, stakeNote: 'Pipeline shortfall × 20% historical win rate.',
    leads: [{ name: 'Marketing-sourced leads per week', value: 42, prev: 61, good: 'up', unit: '' }, { name: 'Partner referrals per week', value: 9, prev: 6, good: 'up', unit: '' }] },
  KR5: { stake: 900, stakeNote: 'Each win-rate point is about $130K of bookings.' },
  KR6: { stake: 400, stakeNote: 'Bookings pulled into the quarter by faster cycles.' },
  KR7: { stake: 300, stakeNote: 'Pricing decisions on the top 20 accounts.' },
  KR8: { stake: 200, stakeNote: 'Cost of over-hiring or under-hiring against a bad forecast.' },
  KR9: { stake: 900, stakeNote: 'Each churn point is about $300K of ARR.',
    leads: [{ name: 'Accounts with a red health score', value: 14, prev: 17, good: 'down', unit: '' }, { name: 'Renewals in next 90 days with no success plan', value: 6, prev: 11, good: 'down', unit: '' }] },
  KR10: { stake: 600, stakeNote: 'Renewal risk on detractor accounts.',
    leads: [{ name: 'Critical bugs open over 30 days', value: 11, prev: 8, good: 'down', unit: '' }, { name: 'Support CSAT', value: 4.4, prev: 4.3, good: 'up', unit: ' / 5' }] },
  KR11: { stake: 500, stakeNote: 'Earlier revenue recognition and lower early churn.' },
  KR12: { stake: 300, stakeNote: 'Share of churn prevented by early warning.' },
  KR13: { stake: 1500, stakeNote: 'ARR in accounts currently flagged at risk.',
    leads: [{ name: 'At-risk accounts with no recovery plan', value: 7, prev: 5, good: 'down', unit: '' }] },
  KR14: { stake: 200, stakeNote: 'Support-driven churn on smaller accounts.' },
  KR15: { stake: 1100, stakeNote: 'Renewals tied to committed roadmap features.',
    leads: [{ name: 'Committed items with dependencies cleared', value: 3, prev: 3, good: 'up', unit: '' }] },
  KR16: { stake: 800, stakeNote: 'ARR on accounts with an open critical bug.',
    leads: [{ name: 'New critical bugs per week', value: 5, prev: 4, good: 'down', unit: '' }, { name: 'Engineering hours on incidents per week', value: 120, prev: 60, good: 'down', unit: '' }] },
  KR17: { stake: 100, stakeNote: 'Management time saved on status gathering.' },
  KR18: { stake: 150, stakeNote: 'Cost of work stalled while waiting on decisions.' },
  KR19: { stake: 700, stakeNote: 'Replacement cost of regretted leavers.',
    leads: [{ name: 'Top performers with a stay interview', value: 100, prev: 64, good: 'up', unit: '%' }] },
  KR20: { stake: 150, stakeNote: 'Avoided cost of external leadership hires.' },
  KR21: { stake: 250, stakeNote: 'Premium paid for external leadership hires.' },
  KR22: { stake: 200, stakeNote: 'Rework and delay from unowned handoffs.' },
  KR23: { stake: 450, stakeNote: 'Annual license spend on overlapping tools.',
    leads: [{ name: 'Tools with a migration plan', value: 4, prev: 2, good: 'up', unit: '' }] },
};

/* Commitments made in weekly business reviews (and recovery-plan actions). */
const SEED_COMMITMENTS = [
  { id: 'C1', review: '2026-10-22', text: 'Add weekend support coverage in two regions', owner: 'tb', due: '2026-10-26', kr: 'KR14', status: 'done' },
  { id: 'C2', review: '2026-10-22', text: 'Send cost allocation data to Finance for account P&L', owner: 'cd', due: '2026-10-30', kr: 'KR7', status: 'open' },
  { id: 'C3', review: '2026-10-29', text: 'Send Tessera exec-sponsor briefing to Dana', owner: 'er', due: '2026-10-31', kr: 'KR2', status: 'done' },
  { id: 'C4', review: '2026-10-29', text: 'Bring contractor budget options to the CFO', owner: 'so', due: '2026-11-03', kr: 'KR16', status: 'open' },
  { id: 'C5', review: '2026-10-29', text: 'Publish the success plan template to all account managers', owner: 'lc', due: '2026-10-30', kr: 'KR12', status: 'done' },
  { id: 'C6', review: '2026-10-29', text: 'Write the pooled success model proposal', owner: 'lc', due: '2026-11-04', kr: 'KR13', status: 'done' },
  { id: 'C7', review: '2026-10-29', text: 'Campaign restart proposal with ROI case', owner: 'rp', due: '2026-11-02', kr: 'KR4', status: 'open' },
  { id: 'C8', review: '2026-10-29', text: 'Share stay-interview themes with the exec team', owner: 'ak', due: '2026-10-31', kr: 'KR19', status: 'open' },
  { id: 'C9', review: '2026-10-29', text: 'Draft a freeze on new software purchases', owner: 'jb', due: '2026-11-06', kr: 'KR23', status: 'open' },
  { id: 'C10', review: '2026-10-29', text: 'Pre-approved security pack ready for Sales', owner: 'rp', due: '2026-11-12', kr: 'KR6', status: 'open' },
  { id: 'C11', review: '2026-10-22', text: 'Pilot a referral bonus with two partners', owner: 'er', due: '2026-10-29', kr: 'KR4', status: 'dropped' },
];

/* Initiatives: the funded work behind the key results. fte = people, budget/spent in $K. */
const SEED_INITIATIVES = [
  { id: 'I1', title: 'Partner referral program', promise: 'Add $3M of qualified pipeline from partners', krs: ['KR4'], owner: 'rp', team: 'sales', fte: 2, budget: 120, spent: 40, status: 'risk' },
  { id: 'I2', title: 'Paid demand campaigns (paused)', promise: 'Add $2.5M of qualified pipeline from paid campaigns', krs: ['KR4'], owner: 'rp', team: 'sales', fte: 1, budget: 300, spent: 90, status: 'off' },
  { id: 'I3', title: 'Deal desk and early solutions engineering', promise: 'Lift win rate 4 points and cut cycle time 10 days', krs: ['KR2', 'KR5', 'KR6'], owner: 'er', team: 'sales', fte: 3, budget: 0, spent: 0, status: 'on' },
  { id: 'I4', title: 'Pre-approved security pack', promise: 'Cut security review from 19 days to 7', krs: ['KR6'], owner: 'rp', team: 'sales', fte: 1, budget: 20, spent: 8, status: 'on' },
  { id: 'I5', title: 'Account-level P&L build', promise: 'Account P&L live for the top 20 customers', krs: ['KR7', 'KR3'], owner: 'na', team: 'fin', fte: 2, budget: 60, spent: 35, status: 'on' },
  { id: 'I6', title: 'Pricing refresh on legacy contracts', promise: 'Add 1.5 points of gross margin', krs: ['KR3', 'KR1'], owner: 'pn', team: 'fin', fte: 1, budget: 0, spent: 0, status: 'risk' },
  { id: 'I7', title: 'Success plans for every account', promise: 'Every account on an active success plan', krs: ['KR12', 'KR9'], owner: 'lc', team: 'cs', fte: 6, budget: 0, spent: 0, status: 'on' },
  { id: 'I8', title: 'At-risk account recovery program', promise: 'Recover 80% of at-risk accounts within 30 days', krs: ['KR13', 'KR9'], owner: 'lc', team: 'cs', fte: 4, budget: 40, spent: 12, status: 'risk' },
  { id: 'I9', title: 'Critical bug strike team', promise: 'Halve the time to resolve critical bugs', krs: ['KR16', 'KR10'], owner: 'so', team: 'tech', fte: 3, budget: 140, spent: 0, status: 'off' },
  { id: 'I10', title: 'Data platform upgrade', promise: 'Unblock 5 committed roadmap items', krs: ['KR15'], owner: 'cd', team: 'tech', fte: 5, budget: 400, spent: 210, status: 'risk' },
  { id: 'I11', title: 'Guided setup for new customers', promise: 'Cut median time-to-value to 35 days', krs: ['KR11'], owner: 'tb', team: 'cs', fte: 3, budget: 80, spent: 55, status: 'on' },
  { id: 'I12', title: 'Leadership program, cohort 2', promise: 'Graduate 24 managers ready for bigger roles', krs: ['KR20', 'KR21'], owner: 'ak', team: 'ppl', fte: 1, budget: 90, spent: 30, status: 'on' },
  { id: 'I13', title: 'Process ownership mapping', promise: 'Name an owner for 40 cross-team processes', krs: ['KR22'], owner: 'jb', team: 'ops', fte: 1, budget: 0, spent: 0, status: 'on' },
  { id: 'I14', title: 'Software tool consolidation', promise: 'Retire 18 overlapping tools', krs: ['KR23'], owner: 'jb', team: 'ops', fte: 0.5, budget: 0, spent: 0, status: 'risk' },
  { id: 'I15', title: 'Headquarters office move', promise: 'Move headquarters by March', krs: [], owner: 'jb', team: 'ops', fte: 2, budget: 250, spent: 60, status: 'on' },
  { id: 'I16', title: 'Intranet redesign', promise: 'New intranet live by year end', krs: [], owner: 'ak', team: 'ppl', fte: 1.5, budget: 45, spent: 20, status: 'on' },
];

/* Cross-team dependencies: one key result needs something from another team. */
const SEED_DEPS = [
  { id: 'X1', kr: 'KR10', fromTeam: 'tech', onKr: 'KR16', need: 'Fixes for the 6 critical bugs behind most detractor scores', due: '2026-11-20' },
  { id: 'X2', kr: 'KR13', fromTeam: 'tech', onKr: 'KR16', need: 'Bug fixes for 4 at-risk accounts', due: '2026-11-13' },
  { id: 'X3', kr: 'KR7', fromTeam: 'tech', onKr: null, need: 'Cost allocation data for the remaining 8 accounts', due: '2026-10-30' },
  { id: 'X4', kr: 'KR11', fromTeam: 'tech', onKr: 'KR15', need: 'Guided setup v2 (committed roadmap item)', due: '2026-12-04' },
  { id: 'X5', kr: 'KR5', fromTeam: 'fin', onKr: 'KR7', need: 'Account P&L so deal desk can price with confidence', due: '2026-11-15' },
  { id: 'X6', kr: 'KR22', fromTeam: 'ppl', onKr: null, need: 'Role definitions for new process owners', due: '2026-11-20' },
  { id: 'X7', kr: 'KR23', fromTeam: 'fin', onKr: null, need: 'CFO-backed freeze on new software purchases', due: '2026-11-06' },
  { id: 'X8', kr: 'KR2', fromTeam: 'co', onKr: null, need: 'CEO sponsor call with Tessera', due: '2026-11-07' },
  { id: 'X9', kr: 'KR5', fromTeam: 'tech', onKr: null, need: 'Solutions engineers on 5 late-stage deals', due: '2026-11-10', delivered: true },
];

/* Final scores (0.0-1.0, average across each team's key results) for past quarters. */
const SEED_HISTORY = {
  quarters: ['Q1 2026', 'Q2 2026', 'Q3 2026'],
  company: [0.64, 0.66, 0.69],
  teams: {
    sales: [0.62, 0.58, 0.55],
    fin: [0.95, 1.0, 0.97],
    cs: [0.55, 0.66, 0.71],
    tech: [0.41, 0.38, 0.45],
    ppl: [0.72, 0.70, 0.74],
    ops: [0.60, 0.68, 0.73],
  },
};

/* Weekly check-in dates for the demo quarter (Mondays). */
const DEMO_CHECKIN_DATES = ['2026-10-05', '2026-10-12', '2026-10-19', '2026-10-26', '2026-11-02'];

function roundTo(v, dp) { const m = Math.pow(10, dp); return Math.round(v * m) / m; }

/* ---- Metric definitions: [definition, source system, refresh] per key result.
   Overrides add a second source (to show reconciliation) or an old verification date. */
const B2B_METRICS = {
  KR1: ['ARR today from customers who were customers 12 months ago (incl. expansion, contraction, churn) ÷ their ARR 12 months ago', 'Billing system', 'monthly'],
  KR2: ['Signed contract value of new-customer deals closed this quarter', 'CRM', 'daily'],
  KR3: ['(Revenue − cost of revenue) ÷ revenue, from month-end close', 'ERP', 'monthly'],
  KR4: ['Open opportunities at stage 2+ with a close date next quarter', 'CRM', 'daily'],
  KR5: ['Won ÷ (won + lost) for stage 2+ opportunities closed in the last 90 days', 'CRM', 'weekly'],
  KR6: ['Median days from stage 2 to closed-won, last 90 days', 'CRM', 'weekly'],
  KR7: ['Top-20 accounts with a reconciled account-level P&L', 'Finance model', 'monthly'],
  KR8: ['1 − |actual − forecast| ÷ forecast for monthly revenue, forecast set on day 1', 'Finance model', 'monthly'],
  KR9: ['ARR lost to cancellations and downgrades, trailing 12 months ÷ starting ARR', 'Billing system', 'monthly'],
  KR10: ['% promoters − % detractors, rolling relationship survey', 'Survey tool', 'weekly'],
  KR11: ['Median days from contract signature to first value milestone', 'Customer success platform', 'weekly'],
  KR12: ['Accounts with a success plan updated in the last 90 days ÷ active accounts', 'Customer success platform', 'weekly'],
  KR13: ['At-risk accounts back to healthy within 30 days of being flagged ÷ accounts flagged', 'Customer success platform', 'weekly'],
  KR14: ['Median hours from ticket creation to first human reply', 'Support desk', 'daily'],
  KR15: ['Committed roadmap items shipped by the committed date ÷ items committed', 'Project tracker', 'weekly'],
  KR16: ['Median days to resolve severity-1 bugs, last 30 days', 'Issue tracker', 'daily'],
  KR17: ['Teams with a check-in in the last 8 days ÷ teams with OKRs', 'OKR Command Center', 'weekly'],
  KR19: ['Regretted leavers, annualized ÷ average headcount', 'HR system', 'monthly'],
  KR20: ['Managers who completed every program module', 'Learning platform', 'monthly'],
  KR21: ['Leadership roles filled internally ÷ leadership roles filled, year to date', 'Applicant tracking', 'monthly'],
  KR23: ['Software tools with active paid licenses', 'Procurement', 'monthly'],
};
const B2B_METRIC_OVERRIDES = {
  KR2: { sources: [{ system: 'CRM', value: 1.3 }, { system: 'Finance ledger', value: 1.15 }], tolerance: 3, note: 'CRM counts deals marked closed-won before the contract is countersigned.' },
  KR9: { sources: [{ system: 'Billing system', value: 7.9 }, { system: 'Customer success platform', value: 6.8 }], tolerance: 5, note: 'The customer success platform leaves out downgrades.' },
  KR11: { lastVerified: '2026-09-18' },
  KR15: { lastVerified: '2026-09-25' },
  KR19: { lastVerified: '2026-08-29' },
};

/* Extra detail for decisions that are waiting, so each one reads as a decision record. */
const B2B_DECISIONS = {
  R1: { context: 'Critical bug fixes are slipping because two engineers are on incident remediation.', options: ['Approve two contractors for 10 weeks (~$140K)', 'Pull two engineers off the data platform upgrade', 'Accept slower fixes this quarter'], recommendation: 'Approve two contractors for 10 weeks (~$140K)', consulted: ['so', 'tb'], neededBy: '2026-11-07' },
  R2: { context: 'Marketing-sourced pipeline fell 30% after paid campaigns were paused.', options: ['Restart top two campaigns at 60% of prior spend', 'Restart all campaigns at full spend', 'Keep paused and push partner referrals'], recommendation: 'Restart top two campaigns at 60% of prior spend', consulted: ['er', 'pn'], neededBy: '2026-11-06' },
  R3: { context: 'Account managers carry 62 accounts each against a target of 40, so recoveries start late.', options: ['Move the 40 smallest accounts to a pooled success model', 'Hire two account managers', 'Raise the recovery window to 45 days'], recommendation: 'Move the 40 smallest accounts to a pooled success model', consulted: ['tb', 'pn'], neededBy: '2026-11-10' },
  R5: { context: 'A $0.9M deal is stuck on the liability cap in legal review.', options: ['CEO-to-CEO call this week', 'Accept a higher liability cap', 'Let it slip to next quarter'], recommendation: 'CEO-to-CEO call this week', consulted: ['er'], neededBy: '2026-11-07' },
};

/* Recurring leadership meetings. Next dates are computed from the app date. */
function makeCadence(coo, ceo) {
  return [
    { id: 'M1', name: 'Weekly exec staff', freq: 'weekly', weekday: 1, minutes: 60, owner: coo, attendees: 'Executive team', preread: 'staff',
      purpose: 'Make the decisions that are waiting and unblock cross-team issues.',
      rights: 'Decides anything on the waiting list; spend over $250K goes to the CEO.', output: 'Decisions logged with rationale; owners and dates for follow-ups.' },
    { id: 'M2', name: 'Weekly business review', freq: 'weekly', weekday: 4, minutes: 45, owner: coo, attendees: 'Executive team + key result owners on the agenda', preread: 'wbr',
      purpose: 'Off-track goals and overdue commitments only — green items are not discussed.',
      rights: 'Agrees recovery actions; escalates decisions to exec staff.', output: 'New commitments with owners and dates.' },
    { id: 'M3', name: 'Monthly business review', freq: 'monthly', weekday: 2, minutes: 90, owner: coo, attendees: 'Executive team + finance and data leads', preread: 'mbr',
      purpose: 'Certify the numbers, then go deep on value at risk, resourcing and leading indicators.',
      rights: 'Approves metric definitions; reallocates people and budget within the quarter.', output: 'Certified metrics; resourcing changes.' },
    { id: 'M4', name: 'Quarterly business review', freq: 'quarterly', minutes: 240, owner: ceo, attendees: 'Executive team + team leads', preread: 'qbr',
      purpose: 'Score the quarter, check how well we set goals, and agree next quarter\'s OKRs.',
      rights: 'Sets company objectives and resourcing for next quarter.', output: 'Final scores; next quarter\'s objectives and owners.' },
    { id: 'M5', name: 'Leadership offsite', freq: 'semiannual', date: '2027-01-21', minutes: 960, owner: ceo, attendees: 'Executive team', preread: 'offsite',
      purpose: 'Strategy, annual priorities and how the leadership team is working.',
      rights: 'Sets annual priorities and the company operating plan.', output: 'Annual priorities; changes to the operating system itself.' },
  ];
}

const PROFILES = {
  b2b: {
    label: 'B2B software company', short: 'B2B software',
    seed: SEED, extra: KR_EXTRA, commitments: SEED_COMMITMENTS, initiatives: SEED_INITIATIVES, deps: SEED_DEPS, history: SEED_HISTORY,
    metrics: B2B_METRICS, metricOverrides: B2B_METRIC_OVERRIDES, decisionDetail: B2B_DECISIONS, cadence: () => makeCadence('ml', 'dw'),
    decisions: [
      { id: 'D1', requested: '2026-10-08', date: '2026-10-12', title: 'Adopt one success plan template for all accounts', owner: 'tb', status: 'made', kr: 'KR12', rationale: 'Three templates in use made coverage impossible to measure.' },
      { id: 'D2', requested: '2026-10-21', date: '2026-10-26', title: 'Add weekend support coverage in two regions', owner: 'tb', status: 'made', kr: 'KR14', rationale: 'Weekend tickets were waiting 30+ hours for a first reply.' },
    ],
    suggestions: ['What needs my attention this week?', 'Which decisions are waiting on me?', 'Which green goals might actually be red?', 'What should we stop doing?', 'Will we hit our Q4 bookings target?', 'What if the Tessera deal slips to next quarter?', 'Which numbers can we trust?', 'How much value is at risk?', 'What commitments are overdue?', 'Can teams rely on each other?', 'How fast do we make decisions?', 'Did our initiatives deliver what they promised?', 'Do we have the capacity to do all this?', 'What should I tell the board?'],
  },
};

function buildMetrics(p, krs) {
  const out = [];
  krs.forEach((k) => {
    const def = p.metrics[k.id]; if (!def) return;
    const o = (p.metricOverrides || {})[k.id] || {};
    out.push({ id: 'M-' + k.id, kr: k.id, name: k.title, definition: def[0], source: def[1], refresh: def[2], owner: k.owner,
      lastVerified: o.lastVerified || '2026-11-02', sources: o.sources || [{ system: def[1], value: k.current }], tolerance: o.tolerance || 2, note: o.note || '' });
  });
  return out;
}

function buildDemo(profileId) {
  const p = PROFILES[profileId] || PROFILES.b2b;
  const s = JSON.parse(JSON.stringify(p.seed));
  s.meta.profile = PROFILES[profileId] ? profileId : 'b2b';
  s.meta.suggestions = p.suggestions;
  s.krs = s.krs.map((k) => {
    const n = k.conf.length;
    const checkins = [];
    let prevG = 0;
    for (let i = 0; i < n; i++) {
      const t = (i + 1) / n;
      const f = Math.pow(t, k.curve || 1);
      // small deterministic variation, kept moving in one direction so history looks real
      let g = i < n - 1 ? Math.min(1, Math.max(0, f + Math.sin((k.id.length * 3 + i) * 1.3) * 0.05 * t)) : 1;
      g = Math.max(g, prevG); prevG = g;
      const value = roundTo(k.start + (k.current - k.start) * g, k.dp);
      checkins.push({ date: DEMO_CHECKIN_DATES[i], value, confidence: k.conf[i], note: k.notes[n - 1 - i] || '', by: k.owner });
    }
    const out = { ...k, checkins };
    delete out.conf; delete out.notes; delete out.curve; delete out.stale;
    Object.assign(out, JSON.parse(JSON.stringify(p.extra[k.id] || {})));
    return out;
  });
  s.risks.forEach((r) => Object.assign(r, JSON.parse(JSON.stringify((p.decisionDetail || {})[r.id] || {}))));
  const copy = (x) => JSON.parse(JSON.stringify(x));
  s.decisions = copy(p.decisions);
  s.commitments = copy(p.commitments);
  s.initiatives = copy(p.initiatives);
  s.deps = copy(p.deps);
  s.history = copy(p.history);
  s.metrics = buildMetrics(p, s.krs);
  s.cadence = p.cadence();
  return s;
}
