/* Shared helpers. */
const U = {
  esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  },
  pct(x) { return Math.round(x * 100) + '%'; },
  fmt(kr, v) {
    const n = Number(v).toFixed(kr.dp);
    if (kr.unit === '$M') return '$' + n + 'M';
    if (kr.unit === '%') return n + '%';
    if (kr.unit === '$') return '$' + n;
    if (kr.unit === '×') return n + '×';
    return n + (kr.unit || '');
  },
  person(state, id) { return state.people.find((p) => p.id === id) || { name: 'Unassigned', title: '' }; },
  team(state, id) { return state.teams.find((t) => t.id === id) || { name: '—' }; },
  obj(state, id) { return state.objectives.find((o) => o.id === id); },
  /* Team doing the work: the objective's team, or the owner's team for company-level KRs. */
  workTeam(state, kr) { const o = U.obj(state, kr.obj); const tid = o && o.team !== 'co' ? o.team : U.person(state, kr.owner).team; return U.team(state, tid); },
  krTeam(state, kr) { const o = U.obj(state, kr.obj); return o ? U.team(state, o.team) : { name: '—' }; },
  date(s, opts) {
    return Engine.d(s).toLocaleDateString('en-US', opts || { month: 'short', day: 'numeric' });
  },
  initials(name) { return name.split(' ').map((w) => w[0]).join('').slice(0, 2); },
  uid(prefix) { return prefix + Math.random().toString(36).slice(2, 7).toUpperCase(); },
  /* Minimal, safe markdown: escapes first, then **bold**, bullets, line breaks. */
  md(text) {
    const lines = U.esc(text).split('\n');
    let html = '', inList = false;
    lines.forEach((ln) => {
      const b = ln.match(/^\s*[-*•]\s+(.*)/);
      const fmtInline = (s) => s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      if (b) { if (!inList) { html += '<ul>'; inList = true; } html += '<li>' + fmtInline(b[1]) + '</li>'; }
      else {
        if (inList) { html += '</ul>'; inList = false; }
        if (ln.trim()) html += '<p>' + fmtInline(ln) + '</p>';
      }
    });
    if (inList) html += '</ul>';
    return html;
  },
};
