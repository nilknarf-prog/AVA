/**
 * Delta AVA — Global Resilient Stopwatch (Multi-tab Sync via localStorage timestamps)
 * Garante sincronização perfeita entre guias e impede congelamento em abas em segundo plano.
 */
(function() {
  'use strict';

  const STORAGE_KEY = 'delta_stopwatch_state';

  function getStoredState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {}
    return {
      isRunning: false,
      startTimestamp: 0,
      accumulatedSec: 0,
      isOpen: false
    };
  }

  function saveStoredState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  function getElapsedSeconds(state) {
    if (!state.isRunning || !state.startTimestamp) {
      return state.accumulatedSec || 0;
    }
    const now = Date.now();
    const currentDiff = Math.max(0, Math.floor((now - state.startTimestamp) / 1000));
    return (state.accumulatedSec || 0) + currentDiff;
  }

  function secToHHMMSS(totalSec) {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  let timerInterval = null;
  let domContainer = null;
  let domDisplay = null;
  let domWidget = null;
  let domFab = null;
  let domPulse = null;

  function updateDisplay() {
    const state = getStoredState();
    const elapsed = getElapsedSeconds(state);
    if (domDisplay) {
      domDisplay.innerText = secToHHMMSS(elapsed);
    }
    if (domPulse) {
      domPulse.className = 'delta-sw-pulse ' + (state.isRunning ? 'running' : 'paused');
    }
    if (domFab) {
      if (state.isRunning) {
        domFab.classList.add('is-running');
      } else {
        domFab.classList.remove('is-running');
      }
    }
  }

  function startTicking() {
    if (timerInterval) clearInterval(timerInterval);
    updateDisplay();
    timerInterval = setInterval(updateDisplay, 1000);
  }

  function stopTicking() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
    updateDisplay();
  }

  function play() {
    const state = getStoredState();
    if (state.isRunning) return;
    state.isRunning = true;
    state.startTimestamp = Date.now();
    saveStoredState(state);
    startTicking();
  }

  function pause() {
    const state = getStoredState();
    if (!state.isRunning) return;
    const elapsed = getElapsedSeconds(state);
    state.isRunning = false;
    state.startTimestamp = 0;
    state.accumulatedSec = elapsed;
    saveStoredState(state);
    stopTicking();
  }

  function stopAndSave() {
    pause();
    const state = getStoredState();
    const totalSec = state.accumulatedSec;
    if (totalSec <= 0) return;

    const timeStr = secToHHMMSS(totalSec);
    const totalMins = Math.max(1, Math.round(totalSec / 60));

    // Se estiver na index com o modal de registro pronto
    if (typeof window.openRegistroModal === 'function') {
      window.openRegistroModal();
      const tempoInput = document.getElementById('modalTempo');
      if (tempoInput) tempoInput.value = timeStr;
      resetState();
      return;
    }

    // Se estiver em outra página (ex: direito_penal_teoria_do_crime.html)
    const pageTitle = document.title.replace('Delta · ', '').replace(' · Delegado', '') || 'Estudo de Painel';
    const matGuess = pageTitle.toLowerCase().includes('penal') ? 'DP' :
                     pageTitle.toLowerCase().includes('constitucional') ? 'DC' :
                     pageTitle.toLowerCase().includes('adm') ? 'DA' :
                     pageTitle.toLowerCase().includes('civil') ? 'DCV' :
                     pageTitle.toLowerCase().includes('medicina') ? 'ML' : 'DP';

    const confirmSave = confirm(`Deseja registrar essa sessão de estudo?\n\n⏱️ Tempo: ${timeStr} (${totalMins} min)\n📚 Matéria: ${pageTitle}`);
    if (confirmSave) {
      try {
        const rawLogs = localStorage.getItem('delta_estudos') || '[]';
        const logs = JSON.parse(rawLogs);
        const now = new Date();
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        logs.push({
          date: dateStr,
          mat: matGuess,
          assunto: pageTitle,
          categoria: 'Teoria',
          tempo: totalMins,
          qts: 0,
          acertos: 0,
          obs: 'Registrado via Cronômetro Global AVA'
        });
        localStorage.setItem('delta_estudos', JSON.stringify(logs));
        alert(`✅ Sessão de ${totalMins} min registrada com sucesso no AVA!`);
      } catch (e) {
        console.error('Erro ao salvar no storage:', e);
      }
    }
    resetState();
  }

  function resetState() {
    saveStoredState({
      isRunning: false,
      startTimestamp: 0,
      accumulatedSec: 0,
      isOpen: false
    });
    if (domWidget) domWidget.style.display = 'none';
    stopTicking();
  }

  function toggleWidget() {
    const state = getStoredState();
    state.isOpen = !state.isOpen;
    saveStoredState(state);
    if (domWidget) {
      domWidget.style.display = state.isOpen ? 'flex' : 'none';
    }
  }

  function renderDom() {
    // Se o DOM já tiver container delta-sw, não recriar
    if (document.querySelector('.delta-sw-container')) return;

    domContainer = document.createElement('div');
    domContainer.className = 'delta-sw-container';

    domContainer.innerHTML = `
      <div class="delta-sw-widget" id="deltaSwWidget">
        <div class="delta-sw-header">
          <span>Cronômetro AVA</span>
          <span class="delta-sw-pulse" id="deltaSwPulse"></span>
        </div>
        <div class="delta-sw-time" id="deltaSwDisplay">00:00:00</div>
        <div class="delta-sw-controls">
          <button class="delta-sw-btn delta-btn-play" id="deltaSwPlay" title="Iniciar / Continuar">▶️</button>
          <button class="delta-sw-btn delta-btn-pause" id="deltaSwPause" title="Pausar">⏸️</button>
          <button class="delta-sw-btn delta-btn-stop" id="deltaSwStop" title="Finalizar e Salvar">⏹️</button>
        </div>
      </div>
      <button class="delta-fab-btn" id="deltaFabBtn" title="Cronômetro de Estudo">⏱️</button>
    `;

    document.body.appendChild(domContainer);

    domWidget = document.getElementById('deltaSwWidget');
    domDisplay = document.getElementById('deltaSwDisplay');
    domPulse = document.getElementById('deltaSwPulse');
    domFab = document.getElementById('deltaFabBtn');

    document.getElementById('deltaSwPlay').addEventListener('click', play);
    document.getElementById('deltaSwPause').addEventListener('click', pause);
    document.getElementById('deltaSwStop').addEventListener('click', stopAndSave);
    domFab.addEventListener('click', toggleWidget);

    const state = getStoredState();
    if (state.isOpen) {
      domWidget.style.display = 'flex';
    }
    if (state.isRunning) {
      startTicking();
    } else {
      updateDisplay();
    }
  }

  // Sincronização entre abas
  window.addEventListener('storage', function(e) {
    if (e.key === STORAGE_KEY) {
      const state = getStoredState();
      if (domWidget) domWidget.style.display = state.isOpen ? 'flex' : 'none';
      if (state.isRunning) {
        startTicking();
      } else {
        stopTicking();
      }
    }
  });

  // Atualização ao focar/retornar à aba
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
      updateDisplay();
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderDom);
  } else {
    renderDom();
  }
})();
