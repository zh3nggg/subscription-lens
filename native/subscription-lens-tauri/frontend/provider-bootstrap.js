/* Opens the unmodified CC Switch provider surface bundled beside this shell. */
(() => {
  try {
    localStorage.setItem('cc-switch-last-app', 'codex');
    localStorage.setItem('cc-switch-last-view', 'providers');
  } catch (_) {
    // The provider manager can still choose Codex in its own app selector.
  }
  window.location.replace('./ccswitch/index.html');
})();
