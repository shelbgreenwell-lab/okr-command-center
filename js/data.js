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
    { id: 'ops', name: 'Operations', parent: 'co' },
    { id: 'tech', name: 'Technology', parent: 'co' },
    { id: 'ppl', name: 'People', parent: 'co' },
    { id: 'cx', name: 'Customer Experience', parent: 'co' },
  ],
  people: [
    { id: 'dw', name: 'Dana Whitaker', title: 'Chief Executive Officer', team: 'co' },
    { id: 'ml', name: 'Marcus Lee', title: 'Chief Operating Officer', team: 'co' },
    { id: 'pn', name: 'Priya Natarajan', title: 'Chief Financial Officer', team: 'fin' },
    { id: 'er', name: 'Elena Ruiz', title: 'VP, Sales', team: 'sales' },
    { id: 'jb', name: 'Jordan Brooks', title: 'VP, Operations', team: 'ops' },
    { id: 'so', name: 'Sam Okafor', title: 'Chief Technology Officer', team: 'tech' },
    { id: 'ak', name: 'Aisha Karim', title: 'Chief People Officer', team: 'ppl' },
    { id: 'tb', name: 'Tom Becker', title: 'VP, Customer Experience', team: 'cx' },
    { id: 'lc', name: 'Leah Chen', title: 'Director, Customer Onboarding', team: 'ops' },
    { id: 'rp', name: 'Ryan Patel', title: 'Director, Sales Operations', team: 'sales' },
    { id: 'na', name: 'Nina Alvarez', title: 'Director, FP&A', team: 'fin' },
    { id: 'cd', name: 'Chris Doyle', title: 'Director, Platform Engineering', team: 'tech' },
  ],

  /* Objectives. parent links a team objective up to the company objective it supports. */
  objectives: [
    { id: 'O1', team: 'co', owner: 'dw', parent: null,
      title: 'Deliver predictable, profitable growth',
      why: 'The board wants growth that does not come at the expense of margin. Predictability is the credibility play for the 2027 plan.' },
    { id: 'O2', team: 'co', owner: 'ml', parent: null,
      title: 'Get every new customer live on time and without surprises',
      why: 'Late or rocky onboarding is the #1 driver of early-life churn and the most common CEO escalation.' },
    { id: 'O3', team: 'co', owner: 'ml', parent: null,
      title: 'Build an operating rhythm that scales past 2,000 people',
      why: 'Decisions stall and information arrives late. We need a cadence that surfaces problems in days, not quarters.' },

    { id: 'O1a', team: 'sales', owner: 'er', parent: 'O1',
      title: 'Build a pipeline that converts, not just a bigger one',
      why: 'Win rate and cycle time matter more than raw pipeline volume for Q1 bookings.' },
    { id: 'O1b', team: 'fin', owner: 'pn', parent: 'O1',
      title: 'Make margin visible at the customer level',
      why: 'We cannot manage margin we cannot see. Today profitability is only reported in aggregate.' },
    { id: 'O2a', team: 'ops', owner: 'jb', parent: 'O2',
      title: 'Run every onboarding on one standard playbook',
      why: 'Every onboarding team runs its own version of the process, so outcomes depend on who you get.' },
    { id: 'O2b', team: 'tech', owner: 'so', parent: 'O2',
      title: 'Take the manual work out of customer setup',
      why: 'Integration builds are the critical path on most onboardings and are still largely manual.' },
    { id: 'O3a', team: 'ppl', owner: 'ak', parent: 'O3',
      title: 'Grow the next layer of leaders from within',
      why: 'Scaling depends on frontline leaders we develop, not ones we hire at a premium.' },
    { id: 'O3b', team: 'cx', owner: 'tb', parent: 'O3',
      title: 'Protect the customer experience through the change',
      why: 'Process change cannot show up as service degradation for existing customers.' },
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
      notes: ['Two expansion deals signed (Halverson, Corvid). Renewal for Brightline moved into November.', 'On pace. Expansion pipeline covers the gap if Brightline renews flat.'] },
    { id: 'KR2', obj: 'O1', owner: 'er', title: 'Close Q4 new bookings', dir: 'up', unit: '$M', dp: 1,
      start: 0, target: 4.2, current: 1.3, conf: [7, 6, 6, 5, 5], curve: 1.2,
      notes: ['Two late-stage deals slipped to January after procurement reviews. Need exec sponsor on Tessera.', 'Tessera legal review taking longer than forecast.'] },
    { id: 'KR3', obj: 'O1', owner: 'pn', title: 'Improve gross margin', dir: 'up', unit: '%', dp: 1,
      start: 31, target: 35, current: 32.1, conf: [6, 6, 6, 6, 5], curve: 1,
      notes: ['Contractor and overtime costs ate most of the pricing gains. Cost model review in progress.', 'Repricing on 3 accounts lands in December.'] },

    // O1a Sales
    { id: 'KR4', obj: 'O1a', owner: 'rp', title: 'Grow qualified pipeline for Q1', dir: 'up', unit: '$M', dp: 1,
      start: 6, target: 12, current: 6.8, conf: [6, 5, 4, 4, 3], curve: 1.6,
      notes: ['Marketing-sourced leads down 30% since the campaign pause. Pipeline will not recover without spend decision.', 'Waiting on decision to restart paid campaigns.'] },
    { id: 'KR5', obj: 'O1a', owner: 'er', title: 'Increase win rate on qualified deals', dir: 'up', unit: '%', dp: 0,
      start: 18, target: 25, current: 21, conf: [6, 7, 7, 7, 7], curve: 1,
      notes: ['Deal desk reviews are working. Lost two on price, won three on time-to-value commitments.', 'Win rate improving where solutions engineering is involved early.'] },
    { id: 'KR6', obj: 'O1a', owner: 'rp', title: 'Shorten average sales cycle', dir: 'down', unit: ' days', dp: 0,
      start: 74, target: 60, current: 70, conf: [7, 7, 6, 6, 6], curve: 1,
      notes: ['Security review still the longest stage (avg 19 days). Pre-approved security pack in draft.', 'Cycle improving on mid-market deals only.'] },

    // O1b Finance
    { id: 'KR7', obj: 'O1b', owner: 'na', title: 'Ship customer-level P&L for top 20 accounts', dir: 'up', unit: ' accounts', dp: 0,
      start: 0, target: 20, current: 12, conf: [8, 8, 8, 9, 9], curve: 0.8,
      notes: ['12 of 20 live. Remaining 8 need labor cost allocation from Workforce Management.', 'Ahead of plan.'] },
    { id: 'KR8', obj: 'O1b', owner: 'na', title: 'Improve revenue forecast accuracy', dir: 'up', unit: '%', dp: 0,
      start: 85, target: 95, current: 91, conf: [7, 7, 8, 8, 8], curve: 1,
      notes: ['October landed within 9% of forecast. Weekly pipeline scrub with Sales is now standard.'] },

    // O2 Company
    { id: 'KR9', obj: 'O2', owner: 'jb', title: 'Reduce average time-to-go-live', dir: 'down', unit: ' days', dp: 0,
      start: 68, target: 45, current: 58, conf: [6, 7, 7, 7, 7], curve: 1,
      notes: ['Playbook onboardings average 51 days. Legacy-process onboardings still at 66 and pulling the average up.', 'Improving.'] },
    { id: 'KR10', obj: 'O2', owner: 'jb', title: 'Hit the committed go-live date', dir: 'up', unit: '%', dp: 0,
      start: 62, target: 90, current: 71, conf: [6, 6, 6, 5, 5], curve: 1,
      notes: ['Two of seven October go-lives slipped, both waiting on customer-side integrations.', 'Integration dependency is the pattern behind every slip this quarter.'] },
    { id: 'KR11', obj: 'O2', owner: 'tb', title: 'Raise 30-day post-go-live CSAT', dir: 'up', unit: ' / 5', dp: 1,
      start: 4.1, target: 4.6, current: 4.3, conf: [7, 7, 7, 7, 7], curve: 1,
      notes: ['Hypercare check-ins at day 7 and day 21 lifting scores.'] },

    // O2a Operations
    { id: 'KR12', obj: 'O2a', owner: 'lc', title: 'Run onboardings on the standard playbook', dir: 'up', unit: '%', dp: 0,
      start: 40, target: 100, current: 85, conf: [7, 8, 8, 9, 9], curve: 0.7,
      notes: ['All new October onboardings on the playbook. Only legacy in-flight onboardings remain off it.', 'Ahead of plan.'] },
    { id: 'KR13', obj: 'O2a', owner: 'lc', title: 'Pass the readiness gate on first attempt', dir: 'up', unit: '%', dp: 0,
      start: 55, target: 85, current: 60, conf: [6, 5, 5, 4, 4], curve: 1.3,
      notes: ['Training sign-off is the most common gate failure. Trainers are shared with internal enablement and are overbooked.', 'Gate failures concentrated in two regions.'] },
    { id: 'KR14', obj: 'O2a', owner: 'jb', title: 'Cut open defects at go-live', dir: 'down', unit: ' defects', dp: 0,
      start: 14, target: 3, current: 9, conf: [6, 6, 7, 7, 7], curve: 1,
      notes: ['Defect triage at T-10 days now mandatory.'] },

    // O2b Technology
    { id: 'KR15', obj: 'O2b', owner: 'cd', title: 'Automate customer environment provisioning', dir: 'up', unit: '%', dp: 0,
      start: 20, target: 80, current: 34, conf: [6, 6, 5, 5], curve: 1, stale: true,
      notes: ['Terraform modules done for telephony; CRM connectors next.'] },
    { id: 'KR16', obj: 'O2b', owner: 'so', title: 'Cut integration build time', dir: 'down', unit: ' days', dp: 0,
      start: 21, target: 10, current: 19, conf: [6, 5, 4, 3, 3], curve: 1.5,
      notes: ['Two engineers pulled to the October platform incident remediation. Integration backlog at 11 builds. Need decision on contractor budget.', 'Losing capacity to incident work.'] },

    // O3 Company
    { id: 'KR17', obj: 'O3', owner: 'ml', title: 'Teams running weekly OKR check-ins', dir: 'up', unit: '%', dp: 0,
      start: 30, target: 100, current: 78, conf: [7, 8, 8, 8, 8], curve: 0.8,
      notes: ['Technology and two regional offices still inconsistent.'] },
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
    { id: 'KR21', obj: 'O3a', owner: 'ak', title: 'Fill lead roles internally', dir: 'up', unit: '%', dp: 0,
      start: 35, target: 60, current: 40, conf: [6, 6, 5, 5, 5], curve: 1.2,
      notes: ['Only 3 of 8 recent lead openings had a ready internal candidate. Succession plans thin in CX.'] },

    // O3b CX
    { id: 'KR22', obj: 'O3b', owner: 'tb', title: 'Hold SLA attainment across all customers', dir: 'up', unit: '%', dp: 1,
      start: 92, target: 97, current: 95.8, conf: [8, 8, 8, 8, 8], curve: 0.8,
      notes: ['Holding. Weekend staffing fix in place.'] },
    { id: 'KR23', obj: 'O3b', owner: 'tb', title: 'Reduce escalations per 1,000 tickets', dir: 'down', unit: '', dp: 1,
      start: 6.2, target: 4, current: 5.9, conf: [7, 6, 5, 5, 4], curve: 1,
      notes: ['The October platform incident drove a spike. Excluding it we are at 5.1. Root-cause review with Technology Friday.', 'Escalations ticking up on two accounts.'] },
  ],

  risks: [
    { id: 'R1', kr: 'KR16', owner: 'so', severity: 'high', status: 'open', raised: '2026-10-21',
      title: 'Integration engineers pulled into incident remediation',
      impact: 'Integration backlog at 11 builds; at least three December go-lives at risk.',
      mitigation: 'Contract two integration engineers for 10 weeks (~$140K).',
      decision: 'Approve contractor budget for integration backlog', decisionOwner: 'pn' },
    { id: 'R2', kr: 'KR4', owner: 'rp', severity: 'high', status: 'open', raised: '2026-10-14',
      title: 'Paid campaign pause starving Q1 pipeline',
      impact: 'Marketing-sourced pipeline down 30%; Q1 bookings target unreachable without recovery.',
      mitigation: 'Restart top two campaigns at 60% of prior spend; shift remainder to partner referrals.',
      decision: 'Restart paid campaigns at reduced spend', decisionOwner: 'dw' },
    { id: 'R3', kr: 'KR13', owner: 'lc', severity: 'medium', status: 'mitigating', raised: '2026-10-19',
      title: 'Trainers double-booked between onboarding and internal enablement',
      impact: 'Training sign-off is failing the readiness gate; pushes go-live dates.',
      mitigation: 'Dedicated onboarding trainer pool (4 FTE) carved out of internal enablement.',
      decision: 'Agree to ring-fence 4 trainers for onboarding', decisionOwner: 'ml' },
    { id: 'R4', kr: 'KR10', owner: 'jb', severity: 'medium', status: 'open', raised: '2026-10-27',
      title: 'Customer-side integration delays drive go-live slips',
      impact: 'Every slipped go-live this quarter waited on a customer integration.',
      mitigation: 'Add customer integration readiness to the kickoff checklist; escalate at T-30.' },
    { id: 'R5', kr: 'KR2', owner: 'er', severity: 'medium', status: 'open', raised: '2026-10-30',
      title: 'Tessera deal stalled in legal review',
      impact: '$0.9M of Q4 bookings at risk of slipping to Q1.',
      mitigation: 'CEO-to-CEO call to unblock liability cap discussion.',
      decision: 'CEO sponsor call with Tessera this week', decisionOwner: 'dw' },
    { id: 'R6', kr: 'KR3', owner: 'pn', severity: 'medium', status: 'mitigating', raised: '2026-10-12',
      title: 'Contractor and overtime costs eroding margin',
      impact: 'Roughly 0.8 points of gross margin lost in October.',
      mitigation: 'Cost model reforecast; convert top 10 long-term contractors to employees.' },
    { id: 'R7', kr: 'KR23', owner: 'tb', severity: 'low', status: 'open', raised: '2026-11-02',
      title: 'Escalation spike tied to the October platform incident',
      impact: 'Inflates escalation rate; likely one-off.',
      mitigation: 'Joint root-cause review with Technology; customer comms plan in place.' },
    { id: 'R8', kr: 'KR12', owner: 'lc', severity: 'low', status: 'closed', raised: '2026-10-05',
      title: 'Legacy onboardings resisting playbook adoption',
      impact: 'Resolved: in-flight onboardings exempted; all new onboardings on playbook.',
      mitigation: 'Exemption policy agreed in week 2.' },
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
    { id: 'D1', date: '2026-10-12', title: 'Exempt in-flight legacy onboardings from the playbook mandate', owner: 'ml', status: 'made', kr: 'KR12' },
    { id: 'D2', date: '2026-10-26', title: 'Make T-10 defect triage mandatory for all go-lives', owner: 'jb', status: 'made', kr: 'KR14' },
  ];
  return s;
}
