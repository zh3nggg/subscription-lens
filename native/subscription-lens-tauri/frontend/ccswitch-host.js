(() => {
  'use strict';

  function addReturnButton() {
    if (document.getElementById('sublens-return')) return;
    const style = document.createElement('style');
    style.textContent = `
      #root header > div:first-child { padding-left: 64px !important; }
      #sublens-return {
        position: fixed; top: 15px; left: 16px; z-index: 60;
        display: grid; place-items: center; width: 34px; height: 34px;
        border: 1px solid #d1d5db; border-radius: 10px;
        background: #fff; color: #111827; cursor: pointer;
        font: 22px/1 sans-serif;
      }
      #sublens-return:hover { background: #f3f4f6; }
      #sublens-return:focus-visible { outline: 2px solid #3b82f6; outline-offset: 2px; }
      html.dark #sublens-return { background: #1f2937; border-color: #4b5563; color: #f9fafb; }
      html.dark #sublens-return:hover { background: #374151; }
    `;
    document.head.appendChild(style);
    const button = document.createElement('button');
    button.id = 'sublens-return';
    button.type = 'button';
    button.textContent = '←';
    button.setAttribute('aria-label', '返回 Subscription Lens');
    button.title = '返回余量';
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
