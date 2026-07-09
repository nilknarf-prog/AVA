/* ══════════════════════════════════════════════════════════════
   Delta AVA · base.js — Fase 4
   Enhancement progressivo de acessibilidade das abas dos painéis.
   Não substitui o showTab() inline de cada painel: apenas
   adiciona semântica ARIA + navegação por teclado (WAI-ARIA Tabs).
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function enhanceTablist(nav) {
    var tabs = Array.prototype.slice.call(nav.querySelectorAll('.tab-btn'));
    if (!tabs.length) return;

    // Painéis na ordem do documento (mesma ordem das abas).
    var panels = Array.prototype.slice.call(document.querySelectorAll('.tab-panel'));

    tabs.forEach(function (tab, i) {
      tab.setAttribute('role', 'tab');
      var panel = panels[i];
      if (panel && panel.id) {
        var tabId = 'tabbtn-' + panel.id;
        tab.id = tabId;
        tab.setAttribute('aria-controls', panel.id);
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', tabId);
        panel.setAttribute('tabindex', '0');
      }
      var active = tab.classList.contains('active');
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
      tab.setAttribute('tabindex', active ? '0' : '-1');

      // Mantém ARIA em sincronia após o clique (o showTab inline já
      // atualizou a classe .active neste ponto).
      tab.addEventListener('click', function () {
        syncSelection(tabs);
      });
    });

    // Navegação por teclado: setas, Home/End.
    nav.addEventListener('keydown', function (e) {
      var current = tabs.indexOf(document.activeElement);
      if (current === -1) {
        current = tabs.findIndex(function (t) {
          return t.getAttribute('aria-selected') === 'true';
        });
      }
      var next = null;
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          next = (current + 1) % tabs.length; break;
        case 'ArrowLeft':
        case 'ArrowUp':
          next = (current - 1 + tabs.length) % tabs.length; break;
        case 'Home':
          next = 0; break;
        case 'End':
          next = tabs.length - 1; break;
        default:
          return;
      }
      e.preventDefault();
      tabs[next].click();   // dispara showTab inline
      tabs[next].focus();
    });
  }

  function syncSelection(tabs) {
    tabs.forEach(function (t) {
      var sel = t.classList.contains('active');
      t.setAttribute('aria-selected', sel ? 'true' : 'false');
      t.setAttribute('tabindex', sel ? '0' : '-1');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.tabs-nav[role="tablist"]').forEach(enhanceTablist);
  });
})();
