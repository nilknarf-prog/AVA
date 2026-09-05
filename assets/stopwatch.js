/**
 * Delta AVA — Global Resilient Stopwatch (Multi-tab Sync via localStorage timestamps)
 * Widget em formato de Pílula Canônica idêntico em todas as páginas (Index, Atena, Painéis).
 */
(function() {
  'use strict';

  const STORAGE_KEY = 'delta_stopwatch_state';

  // Injetar estilos CSS inline prioritários para garantir 100% de fidelidade visual
  function injectStyles() {
    if (document.getElementById('delta-stopwatch-styles')) return;
    const style = document.createElement('style');
    style.id = 'delta-stopwatch-styles';
    style.textContent = `
      .delta-stopwatch-pill {
        display: inline-flex !important;
        flex-direction: row !important;
        align-items: center !important;
        gap: 8px !important;
        background: #131929 !important;
        border: 1px solid rgba(255, 255, 255, 0.12) !important;
        border-radius: 9999px !important;
        padding: 4px 10px 4px 12px !important;
        height: 36px !important;
        box-sizing: border-box !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25) !important;
        user-select: none !important;
        white-space: nowrap !important;
      }
      .delta-stopwatch-pill .dsw-dot {
        width: 8px !important;
        height: 8px !important;
        border-radius: 50% !important;
        background: #f59e0b !important;
        flex-shrink: 0 !important;
        display: inline-block !important;
        transition: background 0.2s !important;
      }
      .delta-stopwatch-pill .dsw-dot.running {
        background: #10b981 !important;
        box-shadow: 0 0 8px #10b981 !important;
        animation: dswPulse 1.2s infinite ease-in-out !important;
      }
      @keyframes dswPulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.3); opacity: 0.7; }
      }
      .delta-stopwatch-pill .dsw-time {
        font-family: 'Space Mono', 'JetBrains Mono', 'Courier New', monospace !important;
        font-size: 13.5px !important;
        font-weight: 700 !important;
        color: #ff8533 !important;
        letter-spacing: 0.8px !important;
        line-height: 1 !important;
        display: inline-block !important;
      }
      .delta-stopwatch-pill .dsw-divider {
        width: 1px !important;
        height: 15px !important;
        background: rgba(255, 255, 255, 0.15) !important;
        margin: 0 2px !important;
        flex-shrink: 0 !important;
      }
      .delta-stopwatch-pill .dsw-btn-group {
        display: inline-flex !important;
        flex-direction: row !important;
        align-items: center !important;
        gap: 4px !important;
      }
      .delta-stopwatch-pill .dsw-btn {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 22px !important;
        height: 22px !important;
        border-radius: 6px !important;
        border: none !important;
        cursor: pointer !important;
        transition: all 0.15s ease !important;
        padding: 0 !important;
        line-height: 1 !important;
        flex-shrink: 0 !important;
      }
      .delta-stopwatch-pill .dsw-btn-play {
        background: #3b82f6 !important;
        color: #ffffff !important;
      }
      .delta-stopwatch-pill .dsw-btn-play:hover {
        background: #2563eb !important;
        transform: scale(1.08) !important;
      }
      .delta-stopwatch-pill .dsw-btn-pause {
        background: #f59e0b !important;
        color: #ffffff !important;
      }
      .delta-stopwatch-pill .dsw-btn-pause:hover {
        background: #d97706 !important;
        transform: scale(1.08) !important;
      }
      .delta-stopwatch-pill .dsw-btn-stop {
        background: #60a5fa !important;
        color: #ffffff !important;
      }
      .delta-stopwatch-pill .dsw-btn-stop:hover {
        background: #ef4444 !important;
        transform: scale(1.08) !important;
      }
      @media (max-width: 640px) {
        .delta-stopwatch-pill {
          height: 32px !important;
          padding: 2px 6px 2px 8px !important;
          gap: 5px !important;
        }
        .delta-stopwatch-pill .dsw-time {
          font-size: 11.5px !important;
          letter-spacing: 0.4px !important;
        }
        .delta-stopwatch-pill .dsw-btn {
          width: 20px !important;
          height: 20px !important;
          border-radius: 4px !important;
        }
        .delta-stopwatch-pill .dsw-btn svg {
          width: 10px !important;
          height: 10px !important;
        }
        .delta-stopwatch-pill .dsw-divider {
          height: 12px !important;
          margin: 0 1px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

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
      accumulatedSec: 0
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

    const timeDisplays = document.querySelectorAll('.delta-stopwatch-pill .dsw-time');
    timeDisplays.forEach(el => { el.innerText = timeStr; });

    const dots = document.querySelectorAll('.delta-stopwatch-pill .dsw-dot');
    dots.forEach(el => {
      if (state.isRunning) {
        el.classList.add('running');
      } else {
        el.classList.remove('running');
      }
    });

    const playBtns = document.querySelectorAll('.delta-stopwatch-pill .dsw-btn-play');
    const pauseBtns = document.querySelectorAll('.delta-stopwatch-pill .dsw-btn-pause');
    playBtns.forEach(btn => { btn.style.display = state.isRunning ? 'none' : 'inline-flex'; });
    pauseBtns.forEach(btn => { btn.style.display = state.isRunning ? 'inline-flex' : 'none'; });
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

    // Se estiver no index com o modal de registro pronto
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
      accumulatedSec: 0
    });
    stopTicking();
  }

  function renderHeaderWidget() {
    injectStyles();

    let container = document.getElementById('headerStopwatch');
    
    // Se não existir o container id, procurar no header
    if (!container) {
      const headerRight = document.querySelector('header .header-inner div:last-child') || document.querySelector('header .header-inner');
      if (!headerRight) return;
      
      container = document.createElement('div');
      container.id = 'headerStopwatch';
      headerRight.insertBefore(container, headerRight.firstChild);
    }

    container.innerHTML = `
      <div class="delta-stopwatch-pill">
        <span class="dsw-dot" title="Status do cronômetro"></span>
        <span class="dsw-time">00:00:00</span>
        <div class="dsw-divider"></div>
        <div class="dsw-btn-group">
          <button class="dsw-btn dsw-btn-play" title="Iniciar / Continuar cronômetro">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>
          </button>
          <button class="dsw-btn dsw-btn-pause" title="Pausar cronômetro" style="display:none;">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><rect x="5" y="4" width="4" height="16" rx="1"></rect><rect x="15" y="4" width="4" height="16" rx="1"></rect></svg>
          </button>
          <button class="dsw-btn dsw-btn-stop" title="Finalizar e Salvar estudo">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><rect x="5" y="5" width="14" height="14" rx="2"></rect></svg>
          </button>
        </div>
      </div>
    `;

    container.querySelector('.dsw-btn-play').addEventListener('click', play);
    container.querySelector('.dsw-btn-pause').addEventListener('click', pause);
    container.querySelector('.dsw-btn-stop').addEventListener('click', stopAndSave);

    const state = getStoredState();
    if (state.isRunning) {
      startTicking();
    } else {
      updateDisplay();
    }
  }

  // Sincronização multi-aba em tempo real
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
