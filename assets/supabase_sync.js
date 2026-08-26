/**
 * Delta AVA — Global Supabase Cloud Sync Manager (Multi-device Login & Sync)
 * Funciona de forma transparente no Home (index.html), nos Painéis e integrado ao Atena.
 */
(function() {
  'use strict';

  const SUPABASE_URL = 'https://nhwarucfecoqcahcosga.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od2FydWNmZWNvcWNhaGNvc2dhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4OTk0MDUsImV4cCI6MjA5NTQ3NTQwNX0.7PTvXgI5ea5WSS89MfHpn-ZSMsv3ztOC64Ogin6Y3qU';

  let supabaseClient = null;
  let currentUser = null;

  // Carregar script do Supabase JS via CDN se não existir
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

      // Verificar sessão atual
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

  // Coleta dados locais
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
      window.dispatchEvent(new Event('storage'));
      
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

  // Push para nuvem
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

  // Pull da nuvem
  async function autoPullFromCloud() {
    if (!supabaseClient || !currentUser) return;
    try {
      const { data } = await supabaseClient.auth.getUser();
      if (data && data.user && data.user.user_metadata) {
        const remotePayload = data.user.user_metadata.ava_sync_payload;
        if (remotePayload) {
          applyRemotePayload(remotePayload);
        } else {
          // Primeiro upload
          pushToCloud();
        }
      }
    } catch (e) {
      console.error('Erro ao sincronizar pull:', e);
    }
  }

  // Injetar estilos do Modal e Botão de Nuvem
  function injectSyncStyles() {
    if (document.getElementById('delta-cloud-sync-styles')) return;
    const style = document.createElement('style');
    style.id = 'delta-cloud-sync-styles';
    style.textContent = `
      .delta-cloud-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: #131929;
        color: #e8eaf0;
        border: 1px solid rgba(255, 255, 255, 0.12);
        padding: 5px 12px;
        border-radius: 9999px;
        font-family: var(--font-sans, sans-serif);
        font-size: 11.5px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.15s ease;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        white-space: nowrap;
        user-select: none;
      }
      .delta-cloud-btn:hover {
        background: #1a2235;
        border-color: #ff6b00;
        color: #ff8533;
        transform: translateY(-1px);
      }
      .delta-cloud-btn .cloud-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #10b981;
        box-shadow: 0 0 6px #10b981;
      }
      .delta-cloud-btn .cloud-dot.offline {
        background: #9aa5bb;
        box-shadow: none;
      }

      /* Modal Styles */
      .delta-sync-modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 10000;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(8px);
        display: none;
        align-items: center;
        justify-content: center;
        padding: 16px;
      }
      .delta-sync-modal-box {
        background: #131929;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 24px;
        width: 100%;
        max-width: 480px;
        padding: 24px;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
        color: #e8eaf0;
        font-family: var(--font-sans, sans-serif);
      }
      .delta-sync-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        padding-bottom: 14px;
        margin-bottom: 16px;
      }
      .delta-sync-tabs {
        display: flex;
        background: #0b0f1a;
        padding: 4px;
        border-radius: 12px;
        margin-bottom: 16px;
        border: 1px solid rgba(255, 255, 255, 0.08);
      }
      .delta-sync-tab {
        flex: 1;
        padding: 8px;
        font-size: 11.5px;
        font-weight: 700;
        border-radius: 8px;
        border: none;
        background: transparent;
        color: #9aa5bb;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .delta-sync-tab.active {
        background: #131929;
        color: #fff;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
      }
      .delta-sync-input-group {
        margin-bottom: 12px;
      }
      .delta-sync-input-group label {
        display: block;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        color: #9aa5bb;
        margin-bottom: 4px;
      }
      .delta-sync-input-group input {
        width: 100%;
        padding: 10px 14px;
        background: #0b0f1a;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        color: #fff;
        font-size: 12.5px;
        outline: none;
        box-sizing: border-box;
      }
      .delta-sync-input-group input:focus {
        border-color: #ff6b00;
      }
      .delta-sync-btn-primary {
        width: 100%;
        padding: 12px;
        background: #ff6b00;
        color: #fff;
        font-weight: 800;
        font-size: 12px;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        transition: background 0.15s;
        margin-top: 8px;
      }
      .delta-sync-btn-primary:hover {
        background: #e65c00;
      }
    `;
    document.head.appendChild(style);
  }

  function updateHeaderButton() {
    let btn = document.getElementById('deltaCloudSyncBtn');
    if (!btn) {
      const headerRight = document.querySelector('header .header-inner div:last-child') || document.querySelector('header .header-inner');
      if (!headerRight) return;
      
      btn = document.createElement('button');
      btn.id = 'deltaCloudSyncBtn';
      btn.className = 'delta-cloud-btn';
      btn.onclick = openSyncModal;
      headerRight.insertBefore(btn, headerRight.firstChild);
    }

    if (currentUser) {
      btn.innerHTML = `<span class="cloud-dot"></span> ☁️ Sincronizado`;
      btn.title = `Conectado como ${currentUser.email} · Clique para gerenciar nuvem`;
    } else {
      btn.innerHTML = `<span class="cloud-dot offline"></span> ☁️ Conectar Nuvem`;
      btn.title = `Clique para fazer login e sincronizar seus estudos entre PC e Tablet`;
    }
  }

  function openSyncModal() {
    injectSyncStyles();
    let modal = document.getElementById('deltaSyncModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'deltaSyncModal';
      modal.className = 'delta-sync-modal-backdrop';
      document.body.appendChild(modal);
    }

    renderModalContent();
    modal.style.display = 'flex';
  }

  function closeSyncModal() {
    const modal = document.getElementById('deltaSyncModal');
    if (modal) modal.style.display = 'none';
  }

  let activeTab = 'login';

  function renderModalContent() {
    const modal = document.getElementById('deltaSyncModal');
    if (!modal) return;

    const rawLast = localStorage.getItem('delta_last_sync_timestamp');
    const lastSync = rawLast ? new Date(parseInt(rawLast, 10)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (' + new Date(parseInt(rawLast, 10)).toLocaleDateString() + ')' : 'Nunca';

    if (currentUser) {
      modal.innerHTML = `
        <div class="delta-sync-modal-box">
          <div class="delta-sync-header">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:20px;">☁️</span>
              <div>
                <strong style="font-size:14px;">Conta & Sincronização</strong>
                <div style="font-size:11px; color:#10b981; font-weight:700;">🟢 Conectado à Nuvem</div>
              </div>
            </div>
            <button onclick="window.AvaSync.closeModal()" style="background:none; border:none; color:#9aa5bb; font-size:20px; cursor:pointer;">&times;</button>
          </div>

          <div style="background:#0b0f1a; padding:14px; border-radius:14px; border:1px solid rgba(255,255,255,0.08); margin-bottom:14px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:12px; font-weight:700;">${currentUser.email}</span>
              <button onclick="window.AvaSync.logout()" style="background:none; border:none; color:#ef4444; font-size:11px; font-weight:700; cursor:pointer;">Sair da Conta</button>
            </div>
            <div style="margin-top:8px; font-size:11px; color:#9aa5bb; font-family:monospace;">
              Última sincronização: <strong style="color:#ff8533;">${lastSync}</strong>
            </div>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:14px;">
            <button onclick="window.AvaSync.forcePush()" class="delta-sync-btn-primary" style="background:#ff6b00;">
              ⬆️ Enviar Dados (PC)
            </button>
            <button onclick="window.AvaSync.forcePull()" class="delta-sync-btn-primary" style="background:#1a2235; border:1px solid rgba(255,255,255,0.1);">
              ⬇️ Baixar Dados (Tablet)
            </button>
          </div>

          <div style="background:rgba(16, 185, 129, 0.08); border:1px solid rgba(16, 185, 129, 0.2); padding:10px; border-radius:12px; font-size:11px; color:#9aa5bb; line-height:1.4;">
            🛡️ <strong>Sincronização Ativa:</strong> Todos os seus estudos e flashcards são automaticamente salvos na nuvem a cada sessão.
          </div>
        </div>
      `;
    } else {
      modal.innerHTML = `
        <div class="delta-sync-modal-box">
          <div class="delta-sync-header">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:20px;">☁️</span>
              <div>
                <strong style="font-size:14px;">Sincronização em Nuvem</strong>
                <div style="font-size:11px; color:#9aa5bb;">Acesse seus estudos no PC, Tablet e Celular</div>
              </div>
            </div>
            <button onclick="window.AvaSync.closeModal()" style="background:none; border:none; color:#9aa5bb; font-size:20px; cursor:pointer;">&times;</button>
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

            <button type="submit" id="syncSubmitBtn" class="delta-sync-btn-primary">
              ${activeTab === 'login' ? 'Entrar e Sincronizar' : 'Criar Conta e Salvar na Nuvem'}
            </button>
          </form>

          <div id="syncFeedbackMsg" style="margin-top:10px; font-size:11.5px; display:none;"></div>
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

    submitBtn.innerText = 'Processando...';
    submitBtn.disabled = true;

    try {
      if (activeTab === 'login') {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        currentUser = data.user;
        feedback.style.display = 'block';
        feedback.style.color = '#10b981';
        feedback.innerText = '✅ Login realizado! Baixando seus dados da nuvem...';
        await autoPullFromCloud();
        setTimeout(() => { renderModalContent(); updateHeaderButton(); }, 1200);
      } else {
        const { data, error } = await supabaseClient.auth.signUp({ email, password });
        if (error) throw error;
        currentUser = data.user;
        feedback.style.display = 'block';
        feedback.style.color = '#10b981';
        feedback.innerText = '✅ Conta criada! Salvando seus dados atuais na nuvem...';
        await pushToCloud();
        setTimeout(() => { renderModalContent(); updateHeaderButton(); }, 1200);
      }
    } catch (err) {
      feedback.style.display = 'block';
      feedback.style.color = '#ef4444';
      feedback.innerText = `❌ ${err.message || 'Falha na autenticação'}`;
      submitBtn.innerText = activeTab === 'login' ? 'Entrar e Sincronizar' : 'Criar Conta e Salvar na Nuvem';
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

  async function forcePush() {
    await pushToCloud();
    alert('Dados enviados para a nuvem com sucesso!');
    renderModalContent();
  }

  async function forcePull() {
    await autoPullFromCloud();
    alert('Dados atualizados da nuvem com sucesso!');
    renderModalContent();
  }

  // Inicialização no DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => loadSupabaseScript(updateHeaderButton));
  } else {
    loadSupabaseScript(updateHeaderButton);
  }

  // Exposição Global
  window.AvaSync = {
    openModal: openSyncModal,
    closeModal: closeSyncModal,
    switchTab: (t) => { activeTab = t; renderModalContent(); },
    handleSubmit,
    logout,
    forcePush,
    forcePull,
    pushToCloud,
    autoPullFromCloud
  };
})();
