/**
 * Delta AVA — Global Supabase Cloud Sync Manager & Auth Modal
 * Sincronização 100% Automática em Tempo Real (Estilo Estudei / AnkiWeb)
 * Design System: high-end-visual-design & impeccable
 */
(function() {
  'use strict';

  const SUPABASE_URL = 'https://nhwarucfecoqcahcosga.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od2FydWNmZWNvcWNhaGNvc2dhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4OTk0MDUsImV4cCI6MjA5NTQ3NTQwNX0.7PTvXgI5ea5WSS89MfHpn-ZSMsv3ztOC64Ogin6Y3qU';

  let supabaseClient = null;
  let currentUser = null;
  let activeTab = 'login';

  // Injetar estilos do Modal e Botão de Nuvem
  function injectSyncStyles() {
    if (document.getElementById('delta-cloud-sync-styles')) return;
    const style = document.createElement('style');
    style.id = 'delta-cloud-sync-styles';
    style.textContent = `
      /* Botão no Cabeçalho */
      .delta-cloud-btn {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        background: #ffffff;
        color: #0f172a;
        border: 1px solid #dbe1ea;
        padding: 0 12px;
        border-radius: 9999px;
        font-family: var(--font-body, 'Public Sans', system-ui, sans-serif);
        font-size: 11.5px;
        font-weight: 700;
        letter-spacing: -0.01em;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.32, 0.72, 0, 1);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        white-space: nowrap;
        user-select: none;
        height: 34px;
        box-sizing: border-box;
      }
      body.dark-theme .delta-cloud-btn {
        background: #131929;
        color: #e8eaf0;
        border: 1px solid rgba(255, 255, 255, 0.12);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
      }
      .delta-cloud-btn:hover {
        background: #f8f9fa;
        border-color: #ff6b00;
        color: #ff8533;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(255, 107, 0, 0.15);
      }
      body.dark-theme .delta-cloud-btn:hover {
        background: #1a2235;
        border-color: rgba(255, 107, 0, 0.6);
        color: #ff8533;
      }
      .delta-cloud-btn:active {
        transform: scale(0.97);
      }
      .delta-cloud-btn .cloud-beacon {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #9aa5bb;
        position: relative;
        flex-shrink: 0;
      }
      .delta-cloud-btn.is-synced .cloud-beacon {
        background: #10b981;
        box-shadow: 0 0 8px #10b981;
      }
      .delta-cloud-btn.is-synced .cloud-beacon::after {
        content: '';
        position: absolute;
        inset: -2px;
        border-radius: 50%;
        border: 1.5px solid #10b981;
        animation: cloud-beacon-ping 2.2s cubic-bezier(0, 0, 0.2, 1) infinite;
        opacity: 0.75;
      }
      @keyframes cloud-beacon-ping {
        0% { transform: scale(1); opacity: 0.8; }
        75%, 100% { transform: scale(2.2); opacity: 0; }
      }
      .delta-cloud-btn .cloud-icon-svg {
        display: flex;
        align-items: center;
        color: inherit;
      }
      @media (max-width: 640px) {
        .delta-cloud-btn .cloud-btn-label {
          display: none;
        }
        .delta-cloud-btn {
          padding: 0 9px;
        }
      }

      /* Modal Styles (Double-Bezel High-End Glassmorphism) */
      .delta-sync-modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 10000;
        background: rgba(0, 0, 0, 0.82);
        backdrop-filter: blur(14px);
        display: none;
        align-items: center;
        justify-content: center;
        padding: 16px;
        animation: delta-fade-in 0.2s cubic-bezier(0.32, 0.72, 0, 1);
      }
      @keyframes delta-fade-in {
        from { opacity: 0; transform: scale(0.98); }
        to { opacity: 1; transform: scale(1); }
      }
      .delta-sync-modal-box {
        background: #111726;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 28px;
        width: 100%;
        max-width: 480px;
        padding: 24px;
        box-shadow: 0 25px 60px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.08);
        color: #e8eaf0;
        font-family: var(--font-body, 'Public Sans', system-ui, sans-serif);
        box-sizing: border-box;
      }
      .delta-sync-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        padding-bottom: 14px;
        margin-bottom: 18px;
      }
      .delta-sync-tabs {
        display: flex;
        background: #0b0f1a;
        padding: 4px;
        border-radius: 14px;
        margin-bottom: 18px;
        border: 1px solid rgba(255, 255, 255, 0.08);
      }
      .delta-sync-tab {
        flex: 1;
        padding: 9px;
        font-size: 12px;
        font-weight: 700;
        border-radius: 10px;
        border: none;
        background: transparent;
        color: #9aa5bb;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .delta-sync-tab.active {
        background: #131929;
        color: #ffffff;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
      }
      .delta-sync-input-group {
        margin-bottom: 14px;
      }
      .delta-sync-input-group label {
        display: block;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #9aa5bb;
        margin-bottom: 6px;
      }
      .delta-sync-input-group input {
        width: 100%;
        padding: 11px 14px;
        background: #0b0f1a;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        color: #ffffff;
        font-size: 13px;
        font-family: inherit;
        outline: none;
        box-sizing: border-box;
        transition: border-color 0.2s, box-shadow 0.2s;
      }
      .delta-sync-input-group input:focus {
        border-color: #ff6b00;
        box-shadow: 0 0 0 3px rgba(255, 107, 0, 0.15);
      }
      .delta-sync-btn-primary {
        width: 100%;
        padding: 13px;
        background: #ff6b00;
        color: #ffffff;
        font-weight: 800;
        font-size: 12.5px;
        border: none;
        border-radius: 14px;
        cursor: pointer;
        transition: all 0.2s;
        margin-top: 8px;
        box-shadow: 0 4px 14px rgba(255, 107, 0, 0.25);
      }
      .delta-sync-btn-primary:hover {
        background: #e65c00;
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(255, 107, 0, 0.35);
      }
      .delta-sync-btn-primary:active {
        transform: scale(0.98);
      }
    `;
    document.head.appendChild(style);
  }

  injectSyncStyles();

  // Carregar script do Supabase JS via CDN
  function loadSupabaseScript(callback) {
    if (window.supabase) {
      initSupabase();
      if (callback) callback();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = () => {
      initSupabase();
      if (callback) callback();
    };
    document.head.appendChild(script);
  }

  function initSupabase() {
    if (!window.supabase || supabaseClient) return;
    try {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        }
      });

      // Verificar sessão atual e puxar dados automaticamente
      supabaseClient.auth.getUser().then(res => {
        currentUser = res.data ? res.data.user : null;
        updateHeaderButton();
        if (currentUser) {
          autoPullFromCloud();
        }
      });

      supabaseClient.auth.onAuthStateChange((_event, session) => {
        currentUser = session ? session.user : null;
        updateHeaderButton();
        if (currentUser) {
          autoPullFromCloud();
        }
      });
    } catch (e) {
      console.error('Erro ao inicializar Supabase:', e);
    }
  }

  // Coleta dados locais para sincronização
  function getLocalPayload() {
    let estudos = [], fsrs = {}, customCards = [], customDecks = [], cardOverrides = {};
    try { estudos = JSON.parse(localStorage.getItem('delta_estudos') || '[]'); } catch (e) {}
    try { fsrs = JSON.parse(localStorage.getItem('atena_srs') || '{}'); } catch (e) {}
    try { customCards = JSON.parse(localStorage.getItem('atena_custom_cards') || '[]'); } catch (e) {}
    try { customDecks = JSON.parse(localStorage.getItem('atena_custom_decks') || '[]'); } catch (e) {}
    try { cardOverrides = JSON.parse(localStorage.getItem('atena_card_overrides') || '{}'); } catch (e) {}

    return {
      version: 2,
      updatedAt: Date.now(),
      estudos,
      fsrs,
      customCards,
      customDecks,
      cardOverrides,
      studyMode: localStorage.getItem('atena_study_mode') || 'pos-edital',
      theme: localStorage.getItem('delta-theme') || 'dark',
    };
  }

  // Aplica dados remotos no localStorage
  function applyRemotePayload(remote) {
    if (!remote) return false;
    try {
      if (Array.isArray(remote.estudos)) {
        const localEstudos = JSON.parse(localStorage.getItem('delta_estudos') || '[]');
        const map = new Map();
        localEstudos.forEach(e => map.set(`${e.date}_${e.mat}_${e.tempo}_${e.assunto || ''}`, e));
        remote.estudos.forEach(e => map.set(`${e.date}_${e.mat}_${e.tempo}_${e.assunto || ''}`, e));
        const merged = Array.from(map.values()).sort((a, b) => (a.date > b.date ? 1 : -1));
        localStorage.setItem('delta_estudos', JSON.stringify(merged));
      }

      if (remote.fsrs && typeof remote.fsrs === 'object') {
        const localFsrs = JSON.parse(localStorage.getItem('atena_srs') || '{}');
        const mergedFsrs = { ...localFsrs };
        Object.keys(remote.fsrs).forEach(cardId => {
          const rCard = remote.fsrs[cardId];
          const lCard = localFsrs[cardId];
          if (!lCard) {
            mergedFsrs[cardId] = rCard;
          } else {
            const rDate = rCard.lastReview ? new Date(rCard.lastReview).getTime() : 0;
            const lDate = lCard.lastReview ? new Date(lCard.lastReview).getTime() : 0;
            if (rDate >= lDate || (rCard.reps || 0) >= (lCard.reps || 0)) {
              mergedFsrs[cardId] = rCard;
            }
          }
        });
        localStorage.setItem('atena_srs', JSON.stringify(mergedFsrs));
      }

      if (Array.isArray(remote.customCards)) {
        const localCards = JSON.parse(localStorage.getItem('atena_custom_cards') || '[]');
        const map = new Map();
        localCards.forEach(c => map.set(c.id, c));
        remote.customCards.forEach(c => map.set(c.id, c));
        localStorage.setItem('atena_custom_cards', JSON.stringify(Array.from(map.values())));
      }

      if (Array.isArray(remote.customDecks)) {
        const localDecks = JSON.parse(localStorage.getItem('atena_custom_decks') || '[]');
        const map = new Map();
        localDecks.forEach(d => map.set(d.id, d));
        remote.customDecks.forEach(d => map.set(d.id, d));
        localStorage.setItem('atena_custom_decks', JSON.stringify(Array.from(map.values())));
      }

      if (remote.cardOverrides && typeof remote.cardOverrides === 'object') {
        const localOverrides = JSON.parse(localStorage.getItem('atena_card_overrides') || '{}');
        localStorage.setItem('atena_card_overrides', JSON.stringify({ ...localOverrides, ...remote.cardOverrides }));
      }

      localStorage.setItem('delta_last_sync_timestamp', String(Date.now()));
      
      // Disparar eventos de sincronização para atualizar UI
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('ava-cloud-synced', { detail: remote }));
      
      if (window.renderDashboardEstudei) window.renderDashboardEstudei();
      if (window.DeltaRevisoes && window.DeltaRevisoes.renderRevisoesDashboard) {
        window.DeltaRevisoes.renderRevisoesDashboard('dashRevisoesContainer');
      }
      return true;
    } catch (e) {
      console.error('Erro ao aplicar payload remoto:', e);
      return false;
    }
  }

  // Push para nuvem automático
  async function pushToCloud() {
    if (!supabaseClient || !currentUser) return;
    try {
      const payload = getLocalPayload();
      await supabaseClient.auth.updateUser({
        data: {
          ava_sync_payload: payload,
          ava_last_synced: Date.now(),
        }
      });
      localStorage.setItem('delta_last_sync_timestamp', String(Date.now()));
    } catch (e) {
      console.error('Erro ao sincronizar push:', e);
    }
  }

  // Pull da nuvem automático
  async function autoPullFromCloud() {
    if (!supabaseClient || !currentUser) return;
    try {
      const { data } = await supabaseClient.auth.getUser();
      if (data && data.user && data.user.user_metadata) {
        const remotePayload = data.user.user_metadata.ava_sync_payload;
        if (remotePayload) {
          applyRemotePayload(remotePayload);
        } else {
          // Primeiro upload caso o usuário tenha acabado de criar a conta
          pushToCloud();
        }
      }
    } catch (e) {
      console.error('Erro ao sincronizar pull:', e);
    }
  }

  // Atualização automática ao focar na janela / aba
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && currentUser) {
      autoPullFromCloud();
    }
  });

  function updateHeaderButton() {
    let btn = document.getElementById('deltaCloudSyncBtn');
    if (!btn) {
      const headerRight = document.querySelector('header .header-inner div:last-child');
      if (!headerRight) return;
      btn = document.createElement('button');
      btn.id = 'deltaCloudSyncBtn';
      btn.className = 'delta-cloud-btn';
      btn.onclick = openSyncModal;
      headerRight.insertBefore(btn, headerRight.firstChild);
    }

    const cloudSvg = `
      <span class="cloud-icon-svg">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path>
        </svg>
      </span>
    `;

    if (currentUser) {
      btn.className = 'delta-cloud-btn is-synced';
      btn.innerHTML = `<span class="cloud-beacon"></span>${cloudSvg}<span class="cloud-btn-label">Sincronizado</span>`;
      btn.title = `Conectado como ${currentUser.email} · Clique para gerenciar conta`;
    } else {
      btn.className = 'delta-cloud-btn';
      btn.innerHTML = `<span class="cloud-beacon"></span>${cloudSvg}<span class="cloud-btn-label">Conectar Nuvem</span>`;
      btn.title = `Clique para entrar na sua conta e acessar seus estudos em qualquer aparelho`;
    }
  }

  function openSyncModal() {
    injectSyncStyles();
    let modal = document.getElementById('deltaSyncModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'deltaSyncModal';
      modal.className = 'delta-sync-modal-backdrop';
      modal.onclick = (e) => {
        if (e.target === modal) closeSyncModal();
      };
      document.body.appendChild(modal);
    }

    renderModalContent();
    modal.style.display = 'flex';
  }

  function closeSyncModal() {
    const modal = document.getElementById('deltaSyncModal');
    if (modal) modal.style.display = 'none';
  }

  function renderModalContent() {
    const modal = document.getElementById('deltaSyncModal');
    if (!modal) return;

    if (currentUser) {
      modal.innerHTML = `
        <div class="delta-sync-modal-box">
          <div class="delta-sync-header">
            <div style="display:flex; align-items:center; gap:10px;">
              <div style="width:38px; height:38px; border-radius:12px; background:rgba(16,185,129,0.12); display:flex; align-items:center; justify-content:center; color:#10b981;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path>
                </svg>
              </div>
              <div>
                <strong style="font-size:15px; font-weight:800; color:#e8eaf0;">Minha Conta AVA</strong>
                <div style="font-size:11.5px; color:#10b981; font-weight:700; display:flex; align-items:center; gap:5px;">
                  <span style="width:6px; height:6px; border-radius:50%; background:#10b981; display:inline-block; box-shadow:0 0 6px #10b981;"></span>
                  Sincronização em Tempo Real Ativa
                </div>
              </div>
            </div>
            <button onclick="window.AvaSync.closeModal()" style="background:none; border:none; color:#9aa5bb; font-size:22px; cursor:pointer; padding:4px;">&times;</button>
          </div>

          <div style="background:#0b0f1a; padding:16px; border-radius:16px; border:1px solid rgba(255,255,255,0.08); margin-bottom:16px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div>
                <div style="font-size:10.5px; font-weight:700; text-transform:uppercase; color:#9aa5bb; letter-spacing:0.05em;">E-mail Conectado</div>
                <div style="font-size:13px; font-weight:800; color:#e8eaf0; margin-top:2px;">${currentUser.email}</div>
              </div>
              <button onclick="window.AvaSync.logout()" style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.2); color:#ef4444; font-size:11px; font-weight:700; padding:6px 12px; border-radius:8px; cursor:pointer; transition:all 0.15s;">
                Sair da Conta
              </button>
            </div>
          </div>

          <div style="background:rgba(16, 185, 129, 0.08); border:1px solid rgba(16, 185, 129, 0.25); padding:14px; border-radius:16px; font-size:12px; color:#9aa5bb; line-height:1.5; margin-bottom:16px;">
            ☁️ <strong style="color:#e8eaf0;">Nuvem 100% Automática:</strong> Tudo o que você estuda neste computador, tablet ou celular é salvo e compartilhado em tempo real. Basta abrir o site e entrar com sua conta.
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.08); padding-top:14px;">
            <button onclick="window.AvaSync.exportBackup()" style="background:none; border:none; color:#9aa5bb; font-size:11.5px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:5px;">
              💾 Exportar Backup (.json)
            </button>
            <button onclick="window.AvaSync.closeModal()" style="background:#1a2235; border:1px solid rgba(255,255,255,0.1); color:#e8eaf0; font-size:11.5px; font-weight:700; padding:6px 16px; border-radius:10px; cursor:pointer;">
              Fechar
            </button>
          </div>
        </div>
      `;
    } else {
      modal.innerHTML = `
        <div class="delta-sync-modal-box">
          <div class="delta-sync-header">
            <div style="display:flex; align-items:center; gap:10px;">
              <div style="width:38px; height:38px; border-radius:12px; background:rgba(255,107,0,0.12); display:flex; align-items:center; justify-content:center; color:#ff8533;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path>
                </svg>
              </div>
              <div>
                <strong style="font-size:15px; font-weight:800; color:#e8eaf0;">Acesse sua Conta AVA</strong>
                <div style="font-size:11.5px; color:#9aa5bb;">Sincronização contínua no PC, Tablet e Celular</div>
              </div>
            </div>
            <button onclick="window.AvaSync.closeModal()" style="background:none; border:none; color:#9aa5bb; font-size:22px; cursor:pointer; padding:4px;">&times;</button>
          </div>

          <div class="delta-sync-tabs">
            <button class="delta-sync-tab ${activeTab === 'login' ? 'active' : ''}" onclick="window.AvaSync.switchTab('login')">Entrar na Conta</button>
            <button class="delta-sync-tab ${activeTab === 'signup' ? 'active' : ''}" onclick="window.AvaSync.switchTab('signup')">Criar Nova Conta</button>
          </div>

          <form id="deltaSyncAuthForm" onsubmit="window.AvaSync.handleSubmit(event)">
            <div class="delta-sync-input-group">
              <label>E-mail</label>
              <input type="email" id="syncEmail" required placeholder="seu-email@exemplo.com" />
            </div>
            <div class="delta-sync-input-group">
              <label>Senha</label>
              <input type="password" id="syncPassword" required placeholder="Sua senha segura" />
            </div>

            <div style="background:#0b0f1a; padding:10px 12px; border-radius:12px; border:1px solid rgba(255,255,255,0.06); margin-bottom:14px; font-size:11px; color:#9aa5bb; line-height:1.4;">
              ${activeTab === 'login'
                ? '💡 Ao entrar, todos os seus flashcards e tempo de estudo serão carregados automaticamente.'
                : '💡 Crie sua conta para manter seus estudos salvos e sincronizados para sempre.'}
            </div>

            <button type="submit" id="syncSubmitBtn" class="delta-sync-btn-primary">
              ${activeTab === 'login' ? 'Entrar e Carregar Meus Estudos' : 'Criar Conta e Salvar na Nuvem'}
            </button>
          </form>

          <div id="syncFeedbackMsg" style="margin-top:12px; font-size:12px; font-weight:700; display:none;"></div>
        </div>
      `;
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!supabaseClient) return;

    const email = (document.getElementById('syncEmail')?.value || '').trim();
    const password = (document.getElementById('syncPassword')?.value || '').trim();
    const feedback = document.getElementById('syncFeedbackMsg');
    const submitBtn = document.getElementById('syncSubmitBtn');

    if (!email || !password) return;

    submitBtn.innerText = 'Autenticando...';
    submitBtn.disabled = true;

    try {
      if (activeTab === 'login') {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        currentUser = data.user;
        feedback.style.display = 'block';
        feedback.style.color = '#10b981';
        feedback.innerText = '✅ Conectado com sucesso! Carregando seus estudos...';
        await autoPullFromCloud();
        setTimeout(() => {
          closeSyncModal();
          updateHeaderButton();
        }, 1000);
      } else {
        const { data, error } = await supabaseClient.auth.signUp({ email, password });
        if (error) throw error;
        currentUser = data.user;
        feedback.style.display = 'block';
        feedback.style.color = '#10b981';
        feedback.innerText = '✅ Conta criada com sucesso! Salvando seus estudos na nuvem...';
        await pushToCloud();
        setTimeout(() => {
          closeSyncModal();
          updateHeaderButton();
        }, 1000);
      }
    } catch (err) {
      feedback.style.display = 'block';
      feedback.style.color = '#ef4444';
      feedback.innerText = `❌ ${err.message || 'Falha na autenticação'}`;
      submitBtn.innerText = activeTab === 'login' ? 'Entrar e Carregar Meus Estudos' : 'Criar Conta e Salvar na Nuvem';
      submitBtn.disabled = false;
    }
  }

  async function logout() {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    currentUser = null;
    updateHeaderButton();
    renderModalContent();
  }

  function exportBackup() {
    try {
      const data = getLocalPayload();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_ava_delta_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Erro ao exportar backup:', e);
    }
  }

  // Inicialização
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => loadSupabaseScript(updateHeaderButton));
  } else {
    loadSupabaseScript(updateHeaderButton);
  }

  window.AvaSync = {
    openModal: openSyncModal,
    closeModal: closeSyncModal,
    switchTab: (t) => { activeTab = t; renderModalContent(); },
    handleSubmit,
    logout,
    exportBackup,
    pushToCloud,
    autoPullFromCloud
  };
})();
