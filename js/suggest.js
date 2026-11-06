/* Mitigation suggestions for key results that are at risk or off track.
   Each rule reads one diagnostic signal (pace, confidence, blockers, stale data,
   stalled progress, owner load, objective-wide slippage) and proposes a concrete
   next step. Suggestions are ranked by priority and capped so the list stays usable. */

const Suggest = {
  forKr(state, kr) {
    const h = Engine.kr(state, kr);
    if (h.status === 'on' && !h.stale) return [];
    const out = [];
    const owner = U.person(state, kr.owner);
    const first = owner.name.split(' ')[0];
    const add = (priority, kind, title, detail) => out.push({ priority, kind, title, detail });

    const weeksTotal = Engine.totalWeeks(state);
    const weeksElapsed = Math.max(0.5, h.expected * weeksTotal);
    const weeksLeft = Math.max(0.5, weeksTotal - weeksElapsed);
    const remaining = kr.target - h.value;
    const ratePerWeek = (h.value - kr.start) / weeksElapsed;
    const neededPerWeek = remaining / weeksLeft;
    const multiple = ratePerWeek !== 0 && Math.sign(ratePerWeek) === Math.sign(neededPerWeek) ? neededPerWeek / ratePerWeek : Infinity;
    const fmtRate = (v) => U.fmt({ ...kr, dp: kr.dp + 1 }, Math.abs(v));
    const pendingDecision = h.openRisks.find((r) => r.decision && !r.decided);
    const plan = kr.actions || [];
    const has = (kind) => plan.some((a) => a.kind === kind && !a.done);

    // 1. A decision is the unblock
    if (pendingDecision) {
      const age = Engine.daysBetween(pendingDecision.raised, state.meta.asOf);
      add(10, 'decide', `Get a decision on "${pendingDecision.decision}"`,
        `This has waited ${age} days with ${U.person(state, pendingDecision.decisionOwner).name}. Put it first on the next exec agenda, or agree a decision date this week. Proposed fix: ${pendingDecision.mitigation}`);
    }

    // 2. Target is out of reach at the current rate
    if (h.status === 'off' && (multiple > 2.5 || multiple === Infinity)) {
      add(9, 'reset', 'Decide: add resources, cut scope or reset the target',
        `${multiple === Infinity ? 'There has been no progress yet' : `Hitting target needs about ${multiple.toFixed(1)}× the current pace`} with ${Math.round(weeksLeft)} weeks left. Choose one path now, not in week 12. If resetting, at the current rate the realistic landing point is ${U.fmt(kr, h.projectedValue)}. Tell the people who depend on this.`);
    } else if (h.gap < -0.1 && isFinite(multiple) && multiple > 1) {
      add(7, 'rebaseline', 'Set weekly milestones to recover the pace',
        `The target needs about ${fmtRate(neededPerWeek)} a week for the next ${Math.round(weeksLeft)} weeks (current pace: ${fmtRate(ratePerWeek)} a week). Ask ${first} to commit to next week's number and track it in the weekly review.`);
    }

    // 3. Open blocker with no executive decision attached
    h.openRisks.filter((r) => !r.decision || r.decided).slice(0, 1).forEach((r) => {
      const age = Engine.daysBetween(r.raised, state.meta.asOf);
      add(r.severity === 'high' ? 8 : 6, 'escalate', `Put a date on fixing "${r.title}"`,
        `Open for ${age} days${r.severity === 'high' ? ' at high severity' : ''}. Agree a resolution date with ${U.person(state, r.owner).name}. If it can't be solved inside the team, raise it as an exec decision.`);
    });

    // 4. Confidence falling or low before the numbers show it
    if (h.confDelta <= -2 || (h.confidence <= 4 && !pendingDecision)) {
      add(h.confDelta <= -2 ? 8 : 6, 'conversation', `Hold a 15-minute risk review with ${first}`,
        h.confDelta <= -2
          ? `Confidence dropped from ${h.confidence - h.confDelta} to ${h.confidence} in a week. Find out what changed before it shows up in the number.`
          : `Confidence is ${h.confidence}/10. Ask what would have to be true to get to 7, and who else needs to help.`);
    }

    // 5. Behind with no blocker on record
    if (h.status === 'off' && !h.openRisks.length) {
      add(7, 'surface', 'Name the blocker',
        `This is off track but no blocker is logged. That usually means the real issue hasn't been said out loud yet. Ask ${first} to log it so it can be owned.`);
    }

    // 6. Progress stalled over the last two check-ins
    const cs = kr.checkins;
    if (cs.length >= 3 && Math.abs(cs[cs.length - 1].value - cs[cs.length - 3].value) < Math.abs(kr.target - kr.start) * 0.02) {
      add(6, 'unstick', 'Break the stall with one next action',
        `The number has barely moved in two check-ins. Ask ${first} for the single action that would move it by next week, and remove whatever is in the way.`);
    }

    // 7. Stale data
    if (h.stale) {
      add(9, 'refresh', `Get a fresh update from ${first}`,
        `There has been no check-in for ${h.daysSince} days, so this status may be wrong. Ask for an update before the next weekly review.`);
    }

    // 8. Whole objective slipping
    const sib = state.krs.filter((k) => k.obj === kr.obj);
    const behind = sib.filter((k) => Engine.kr(state, k).status !== 'on').length;
    if (sib.length > 1 && behind / sib.length >= 0.66) {
      const o = U.obj(state, kr.obj);
      add(5, 'objective', 'Review the objective as a whole',
        `${behind} of ${sib.length} key results under "${o.title}" are behind. The problem may be the plan, not one metric. Spend part of the next review on it with ${U.person(state, o.owner).name}.`);
    }

    // 9. Owner overloaded
    const ownerBehind = state.krs.filter((k) => k.owner === kr.owner && Engine.kr(state, k).status !== 'on').length;
    if (ownerBehind >= 3) {
      add(5, 'capacity', `Lighten ${first}'s load`,
        `${owner.name} owns ${ownerBehind} key results that need attention. Consider handing one to a deputy so the most important one gets full focus.`);
    }

    return out.filter((s) => !has(s.kind)).sort((a, b) => b.priority - a.priority).slice(0, 4);
  },
};
