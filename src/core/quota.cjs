'use strict';
function mergeQuota(old, next) {
  if (!old) return next;
  if (!next) return old;
  let windows = [...old.windows];
  for (const limit of new Set(next.windows.map(w => w.limit))) {
    const incoming = next.windows.filter(w => w.limit === limit);
    const incomingAt = incoming.reduce((at, w) => (w.observedAt || next.observedAt) > at ? (w.observedAt || next.observedAt) : at, '');
    const priorAt = windows.filter(w => w.limit === limit).reduce((at, w) => (w.observedAt || old.observedAt) > at ? (w.observedAt || old.observedAt) : at, '');
    if (incomingAt >= priorAt) windows = windows.filter(w => w.limit !== limit).concat(incoming);
  }
  windows.sort((a,b) => (a.limit === 'codex' ? -1 : 0) - (b.limit === 'codex' ? -1 : 0) || a.limit.localeCompare(b.limit) || a.window.localeCompare(b.window));
  return {windows, observedAt: old.observedAt > next.observedAt ? old.observedAt : next.observedAt, source: next.source};
}
module.exports = {mergeQuota};
