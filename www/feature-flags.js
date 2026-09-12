(function (global) {
  'use strict';

  function cardsEnabled() {
    try {
      if (global.VNS_CONFIG && typeof global.VNS_CONFIG.enableCards === 'boolean') {
        return global.VNS_CONFIG.enableCards === true;
      }
    } catch (e) {}
    try {
      return localStorage.getItem('vns_enable_cards') === 'true';
    } catch (e) {}
    return false;
  }

  global.VNS_FEATURES = {
    get cards() { return cardsEnabled(); }
  };

  function applyGate() {
    var el = document.getElementById('m-sidebar-cards-trigger');
    if (!el) return;

    if (cardsEnabled()) {
      el.classList.remove('hidden');
      el.style.removeProperty('display');
      return;
    }

    el.classList.add('hidden');
    el.style.setProperty('display', 'none', 'important');
  }

  function run() {
    applyGate();
    setTimeout(applyGate, 500);
    setTimeout(applyGate, 1500);
    setTimeout(applyGate, 3000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  setInterval(applyGate, 2000);
})(window);// JavaScript Document