/**
 * Delta AVA — Global Resilient Stopwatch (Multi-tab Sync via localStorage timestamps)
 * Renderizado no cabeçalho em todas as telas (Index, Painéis, Atena), sem botão flutuante.
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
      window.dispatchEvent(new Event('storage'));
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

  function updateDisplay() {
    const state = getStoredState();
    const elapsed = getElapsedSeconds(state);
    const timeStr = secToHHMMSS(elapsed);

    const timeDisplays = document.querySelectorAll('.delta-sw-time-display');
    timeDisplays.forEach(el => { el.innerText = timeStr; });

    const indicators = document.querySelectorAll('.delta-sw-indicator');
    indicators.forEach(el => {
      if (state.isRunning) {
        el.classList.add('running');
      } else {
        el.classList.remove('running');
      }
    });

    const playBtns = document.querySelectorAll('.delta-btn-play');
    const pauseBtns = document.querySelectorAll('.delta-btn-pause');
    playBtns.forEach(btn => { btn.style.display = state.isRunning ? 'none' : 'inline-block'; });
    pauseBtns.forEach(btn => { btn.style.display = state.isRunning ? 'inline-block' : 'none'; });
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
    const totalSec = state.accumulatedSec || 0;
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

    // Se estiver em painel ou outra página estática
    const pageTitle = document.title.replace('Delta · ', '').replace(' · Delegado', '') || 'Estudo de Painel';
    const matGuess = pageTitle.toLowerCase().includes('penal') ? 'DP' :
                     pageTitle.toLowerCase().includes('constitucional') ? 'DC' :
                     pageTitle.toLowerCase().includes('adm') ? 'DA' :
                     pageTitle.toLowerCase().includes('civil') ? 'DCV' :
                     pageTitle.toLowerCase().includes('medicina') ? 'ML' : 'DP';

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
    } catch (e) {
      console.error('Erro ao salvar no storage:', e);
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
    stopTicking();
  }

  function renderHeaderWidget() {
    let container = document.getElementById('headerStopwatch');
    
    // Se não existir o container id, procurar no header
    if (!container) {
      const headerRight = document.querySelector('header .header-inner div:last-child') || document.querySelector('header .header-inner');
      if (!headerRight) return;
      
      container = document.createElement('div');
      container.id = 'headerStopwatch';
      container.className = 'delta-header-stopwatch';
      headerRight.insertBefore(container, headerRight.firstChild);
    }

    container.innerHTML = `
      <span class="delta-sw-indicator" title="Status do cronômetro"></span>
      <span class="delta-sw-time-display">00:00:00</span>
      <div class="delta-sw-actions">
        <button class="delta-sw-btn-mini delta-btn-play" title="Iniciar / Continuar cronômetro">▶️</button>
        <button class="delta-sw-btn-mini delta-btn-pause" title="Pausar cronômetro" style="display:none;">⏸️</button>
        <button class="delta-sw-btn-mini delta-btn-stop" title="Finalizar e Salvar estudo">⏹️</button>
      </div>
    `;

    container.querySelector('.delta-btn-play').addEventListener('click', play);
    container.querySelector('.delta-btn-pause').addEventListener('click', pause);
    container.querySelector('.delta-btn-stop').addEventListener('click', stopAndSave);

    const state = getStoredState();
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
      if (state.isRunning) {
        startTicking();
      } else {
        stopTicking();
      }
    }
  });

  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
      updateDisplay();
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderHeaderWidget);
  } else {
    renderHeaderWidget();
  }

  // Expor globalmente para controle via JS
  window.DeltaStopwatch = {
    play,
    pause,
    stopAndSave,
    resetState,
    getStoredState,
    secToHHMMSS
  };
})();
