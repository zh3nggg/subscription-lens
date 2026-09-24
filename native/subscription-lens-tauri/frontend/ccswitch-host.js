(() => {
  'use strict';

  function addReturnButton() {
    if (document.getElementById('sublens-return')) return;
    const button = document.createElement('button');
    button.id = 'sublens-return';
    button.type = 'button';
    button.textContent = '← 返回余量';
    button.setAttribute('aria-label', '返回 Subscription Lens');
    button.style.cssText = 'position:fixed;right:20px;bottom:20px;z-index:2147483647;padding:10px 16px;border:1px solid #d1d5db;border-radius:12px;background:#fff;color:#111827;box-shadow:0 4px 18px #0002;font:600 14px sans-serif;cursor:pointer';
    button.addEventListener('click', () => {
      window.location.assign(new URL('../index.html', window.location.href).href);
    });
    document.body.appendChild(button);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addReturnButton, { once: true });
  } else {
    addReturnButton();
  }
})();
