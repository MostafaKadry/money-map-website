// Collapsible menu on small screens. Without JavaScript the menu is simply always visible.
(function () {
  'use strict';
  var btn = document.querySelector('.menu-btn');
  var nav = document.getElementById('site-nav');
  if (!btn || !nav) return;
  document.documentElement.classList.add('js');
  btn.hidden = false;
  function set(open) {
    btn.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('open', open);
  }
  btn.addEventListener('click', function () { set(btn.getAttribute('aria-expanded') !== 'true'); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { set(false); btn.focus(); }
  });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
})();
