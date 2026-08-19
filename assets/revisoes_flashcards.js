/**
 * AVA Delta — Módulo de Revisões e Flashcards SRS Integrado ao Dashboard
 * Verifica cartões devidos no FSRS (atena_srs), permite revisar todos embaralhados
 * ou por matéria, calcula aproveitamento e exibe alerta para re-revisar no mesmo dia
 * caso a média fique abaixo do esperado.
 */

(function() {
  'use strict';

  // Baralhos de questões padrão da base Atena
  const BANCOS_PADRAO = [
    {
      id: 'dp',
      titulo: 'Direito Penal',
      sigla: 'DP',
      cards: [
        { id: 'dp1', deckId: 'dp', assunto: 'Lei Penal no Tempo', frente: 'Aplica-se a lei penal mais benigna ao crime continuado se a lei mais grave entrou em vigor ANTES de cessar a continuidade?', verso: 'NÃO. Aplica-se a LEI MAIS GRAVE (Súmula 711 do STF).' },
        { id: 'dp2', deckId: 'dp', assunto: 'Extraterritorialidade', frente: 'Genocídio cometido contra brasileiro no exterior exige que o agente entre no Brasil para ser punido?', verso: 'NÃO. Extraterritorialidade INCONDICIONADA.' },
        { id: 'dp3', deckId: 'dp', assunto: 'Abolitio Criminis', frente: 'A abolitio criminis apaga também os efeitos extrapenais (civis) da condenação?', verso: 'NÃO. Apenas os EFEITOS PENAIS.' },
        { id: 'dp4', deckId: 'dp', assunto: 'Tempo do Crime', frente: 'Para a definição do tempo do crime, adotou-se a Teoria da Ubiquidade?', verso: 'NÃO. Tempo = ATIVIDADE. Lugar = UBIQUIDADE (L-U-T-A).' },
        { id: 'dp5', deckId: 'dp', assunto: 'Conflito de Normas', frente: 'Falsidade ideológica usada apenas como meio para estelionato é absorvida?', verso: 'SIM. Princípio da Consunção (Súmula 17 STJ).' },
        { id: 'dp6', deckId: 'dp', assunto: 'Teoria do Crime', frente: 'A legítima defesa putativa exclui a ilicitude do fato?', verso: 'NÃO. Exclui a CULPABILIDADE (se inevitável) ou reduz a pena/desclassifica para culposo (se evitável), por ser Erro de Tipo Permissivo.' },
        { id: 'dp7', deckId: 'dp', assunto: 'Crimes contra a Vida', frente: 'O perdão judicial no homicídio aplica-se a modalidades dolosas?', verso: 'NÃO. Somente ao homicídio CULPOSO.' },
        { id: 'dp8', deckId: 'dp', assunto: 'Roubo e Furto', frente: 'O sistema de câmeras de segurança torna o furto crime impossível?', verso: 'NÃO. Súmula 567 do STJ: não torna o crime impossível.' },
        { id: 'dp9', deckId: 'dp', assunto: 'Penas', frente: 'A pena de multa pode ser convertida em detenção se o condenado não pagar?', verso: 'NÃO. A multa passa a ser dívida de valor, cobrada pela Fazenda Pública.' },
        { id: 'dp10', deckId: 'dp', assunto: 'Crime Impossível', frente: 'A ineficácia relativa do meio ou impropriedade relativa do objeto configuram crime impossível?', verso: 'NÃO. Devem ser ABSOLUTAS (Art. 17, CP).' },
        { id: 'dp11', deckId: 'dp', assunto: 'Funcionalismo Penal', frente: 'No Funcionalismo, qual a diferença entre a finalidade do Direito Penal para Roxin e para Jakobs?', verso: 'ROXIN (Moderado): Proteção de Bens Jurídicos. JAKOBS (Radical/Sistêmico): Assegurar a vigência da Norma (autor do Direito Penal do Inimigo). MACETE: Roxin = Respeita os Bens Jurídicos. Jakobs = Justiça para o Sistema.' },
        { id: 'dp12', deckId: 'dp', assunto: 'Interpretação Restritiva', frente: 'Na interpretação restritiva da lei penal, qual é a premissa sobre o texto legal e a vontade da lei?', verso: 'A premissa é que a lei disse MAIS do que queria ("lex dixit plus quam voluit"). O intérprete deve limitar/restringir seu alcance.' },
        { id: 'dp13', deckId: 'dp', assunto: 'Consunção', frente: 'Para a aplicação do princípio da consunção, é obrigatório que o crime absorvido (meio) tenha pena menor que o crime continente (fim)?', verso: 'NÃO. É plenamente possível que o crime absorvido tenha pena MAIOR. O que importa é a relação de dependência (meio e fim) e não o quantum da pena.' },
        { id: 'dp14', deckId: 'dp', assunto: 'Teoria Finalista', frente: 'Na teoria finalista (adotada no CP), onde ficam o dolo e a culpa e quais os 3 elementos da culpabilidade?', verso: 'Dolo e culpa ficam na CONDUTA (fato típico). A culpabilidade é normativa pura, composta pelo IPE: Imputabilidade, Potencial consciência da ilicitude e Exigibilidade de conduta diversa.' },
        { id: 'dp15', deckId: 'dp', assunto: 'Dolo Normativo vs Natural', frente: 'Qual a diferença entre o Dolo Normativo (Causalismo) e o Dolo Natural (Finalismo)?', verso: 'Dolo Normativo (Causalismo): Ficava na culpabilidade e continha a consciência da ilicitude (dolus malus). Dolo Natural (Finalismo): Fica no fato típico e é composto apenas por CONSCIÊNCIA e VONTADE.' }
      ]
    },
    {
      id: 'dpp',
      titulo: 'Processo Penal',
      sigla: 'DPP',
      cards: [
        { id: 'dpp1', deckId: 'dpp', assunto: 'Inquérito Policial', frente: 'O delegado de polícia pode mandar arquivar os autos de inquérito se não achar provas?', verso: 'NÃO. O arquivamento é de competência do Ministério Público / Juiz, JAMAIS da autoridade policial (Art. 17, CPP).' },
        { id: 'dpp2', deckId: 'dpp', assunto: 'Prisão em Flagrante', frente: 'Qualquer do povo DEVE prender quem quer que seja encontrado em flagrante delito?', verso: 'NÃO. O cidadão comum PODE prender (faculdade). Quem DEVE prender é a autoridade policial e seus agentes.' },
        { id: 'dpp3', deckId: 'dpp', assunto: 'Ação Penal', frente: 'A representação do ofendido na ação penal pública condicionada pode ser retratada após o oferecimento da denúncia?', verso: 'NÃO. A retratação só é possível ATÉ o oferecimento da denúncia (Art. 25, CPP).' },
        { id: 'dpp4', deckId: 'dpp', assunto: 'Provas', frente: 'São inadmissíveis as provas derivadas das ilícitas, sem qualquer exceção?', verso: 'NÃO. Há exceções: fonte independente e descoberta inevitável.' },
        { id: 'dpp5', deckId: 'dpp', assunto: 'Prisão Preventiva', frente: 'Pode ser decretada prisão preventiva como antecipação de cumprimento de pena?', verso: 'NÃO. A prisão preventiva não pode ter finalidade de antecipação de pena (Art. 313, §2º).' },
        { id: 'dpp6', deckId: 'dpp', assunto: 'ANPP', frente: 'O ANPP cabe em crimes cometidos com violência ou grave ameaça?', verso: 'NÃO. O ANPP exige infração sem violência ou grave ameaça e pena mínima < 4 anos.' }
      ]
    },
    {
      id: 'dc',
      titulo: 'Direito Constitucional',
      sigla: 'DC',
      cards: [
        { id: 'dc1', deckId: 'dc', assunto: 'Remédios Constitucionais', frente: 'Cabe Habeas Corpus contra imposição de pena de exclusão de militar ou perda de posto?', verso: 'NÃO. Não cabe HC em punições disciplinares militares quanto ao mérito, mas cabe quanto à LEGALIDADE.' },
        { id: 'dc2', deckId: 'dc', assunto: 'Direitos Fundamentais', frente: 'A inviolabilidade do domicílio admite entrada noturna sem consentimento em caso de determinação judicial?', verso: 'NÃO. Determinação judicial apenas DURANTE O DIA. À noite: flagrante delito, desastre ou socorro.' },
        { id: 'dc3', deckId: 'dc', assunto: 'Segurança Pública', frente: 'A Polícia Penal está expressamente prevista no rol do Art. 144 da CF/88?', verso: 'SIM. Inserida pela Emenda Constitucional nº 104/2019.' },
        { id: 'dc4', deckId: 'dc', assunto: 'Competências', frente: 'Compete privativamente à União legislar sobre direito penal e processual penal?', verso: 'SIM. Art. 22, I da CF/88.' }
      ]
    },
    {
      id: 'da',
      titulo: 'Direito Administrativo',
      sigla: 'DA',
      cards: [
        { id: 'da1', deckId: 'da', assunto: 'Poder de Polícia', frente: 'O poder de polícia administrativa incide sobre bens, direitos e atividades, enquanto a judiciária sobre pessoas?', verso: 'SIM. Polícia Administrativa = caráter preventivo/bens. Polícia Judiciária = repressiva/pessoas infratoras.' },
        { id: 'da2', deckId: 'da', assunto: 'Atos Administrativos', frente: 'A revogação de um ato administrativo produz efeitos retroativos (ex tunc)?', verso: 'NÃO. Revogação produz efeitos EX NUNC (não retroage). A anulação é que produz efeitos EX TUNC.' },
        { id: 'da3', deckId: 'da', assunto: 'Improbidade Administrativa', frente: 'Após a Lei 14.230/21, ainda existe ato de improbidade na modalidade culposa?', verso: 'NÃO. Exige-se DOLO ESPECÍFICO em todas as modalidades.' }
      ]
    },
    {
      id: 'ml',
      titulo: 'Medicina Legal',
      sigla: 'ML',
      cards: [
        { id: 'ml1', deckId: 'ml', assunto: 'Tanatologia', frente: 'A mancha verde abdominal aparece primeiro na fossa ilíaca esquerda nos afogados?', verso: 'NÃO. No cadáver comum: fossa ilíaca DIREITA. No afogado: início no TÓRAX e PESCOÇO.' },
        { id: 'ml2', deckId: 'ml', assunto: 'Traumatologia', frente: 'Feridas pérfuro-contusas são provocadas tipicamente por projéteis de arma de fogo?', verso: 'SIM. PAF produz ferida pérfuro-contusa com orifício de entrada, orla de escoriação e orla de enxugo.' }
      ]
    }
  ];

  // --- CARREGAMENTO DE TODOS OS CARTÕES E DO ESTADO FSRS ---
  function getAllCards() {
    let all = [];
    BANCOS_PADRAO.forEach(deck => {
      deck.cards.forEach(c => {
        all.push({ ...c, deckTitle: deck.titulo, sigla: deck.sigla });
      });
    });

    try {
      const customRaw = localStorage.getItem('atena_custom_cards');
      if (customRaw) {
        const customCards = JSON.parse(customRaw);
        if (Array.isArray(customCards)) {
          customCards.forEach(c => {
            all.push({ ...c, deckTitle: c.assunto || 'Personalizados', sigla: 'CUST' });
          });
        }
      }
    } catch (e) {
      console.error('Erro ao ler custom cards:', e);
    }

    return all;
  }

  function getFSRSData() {
    try {
      const raw = localStorage.getItem('atena_srs');
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Erro ao ler atena_srs:', e);
    }
    return {};
  }

  function saveFSRSData(fsrsData) {
    try {
      localStorage.setItem('atena_srs', JSON.stringify(fsrsData));
    } catch (e) {
      console.error('Erro ao salvar atena_srs:', e);
    }
  }

  // --- OBTENÇÃO DOS CARTÕES DEVIDOS HOJE ---
  function getDueCards(subjectFilter = null) {
    const allCards = getAllCards();
    const fsrs = getFSRSData();
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

    const dueCards = allCards.filter(card => {
      if (subjectFilter && card.deckId !== subjectFilter && card.sigla !== subjectFilter) {
        return false;
      }
      const srsInfo = fsrs[card.id];
      if (!srsInfo) {
        // Cartão novo ainda não estudado: entra na fila se não tiver data
        return true;
      }
      if (!srsInfo.nextReview) return true;
      const nextDate = srsInfo.nextReview.split('T')[0];
      return nextDate <= todayStr;
    });

    return dueCards;
  }

  // --- RENDERIZAÇÃO DO CARD DE REVISÕES NO DASHBOARD ---
  function renderRevisoesDashboard(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const dueCards = getDueCards();
    const allCards = getAllCards();
    
    // Agrupamento por matéria
    const bySubject = {};
    dueCards.forEach(c => {
      const subj = c.deckTitle || c.sigla || 'Gerais';
      bySubject[subj] = (bySubject[subj] || 0) + 1;
    });

    let html = '';

    if (dueCards.length === 0) {
      html = `
        <div class="rev-dash-box">
          <div class="rev-dash-empty">
            <div class="rev-empty-icon">🎉</div>
            <div class="rev-empty-text">
              <h4>Revisões em dia!</h4>
              <p>Você não tem flashcards pendentes para hoje no algoritmo FSRS. Ótimo trabalho!</p>
            </div>
            <a href="./atena/" class="btn-util btn-sm" style="margin-left:auto;">Abrir Atena</a>
          </div>
        </div>
      `;
    } else {
      const subjectOptions = Object.keys(bySubject).map(s => `<option value="${s}">${s} (${bySubject[s]})</option>`).join('');

      html = `
        <div class="rev-dash-box has-due">
          <div class="rev-header-row">
            <div class="rev-badge-due">
              <span class="rev-fire-icon">⚡</span>
              <strong>${dueCards.length}</strong> ${dueCards.length === 1 ? 'flashcard pendente' : 'flashcards pendentes'} para hoje
            </div>
            <a href="./atena/" class="rev-link-atena" title="Abrir módulo Atena completo">Modo Avançado ↗</a>
          </div>

          <div class="rev-actions-toolbar">
            <button class="btn-rev-start-all" onclick="DeltaRevisoes.startReviewSession(null, true)">
              🔀 Revisar Todos (${dueCards.length}) Embaralhado
            </button>
            <div class="rev-subj-select-wrap">
              <select id="revSubjSelect" class="rev-select">
                <option value="">📚 Escolher por Matéria...</option>
                ${subjectOptions}
              </select>
              <button class="btn-rev-start-subj" onclick="DeltaRevisoes.startReviewBySelectedSubj()">Iniciar</button>
            </div>
          </div>

          <!-- LISTA DE CARTÕES PENDENTES (PRÉVIA) -->
          <div class="rev-preview-list">
            <div class="rpl-title">Próximos cartões na fila:</div>
            ${dueCards.slice(0, 4).map(c => `
              <div class="rpl-item" onclick="DeltaRevisoes.startSingleCardReview('${c.id}')">
                <span class="rpl-tag">${c.sigla || 'MAT'}</span>
                <span class="rpl-assunto">${c.assunto}:</span>
                <span class="rpl-frente">${c.frente}</span>
                <span class="rpl-arrow">▶</span>
              </div>
            `).join('')}
            ${dueCards.length > 4 ? `<div class="rpl-more">+ ${dueCards.length - 4} outros cartões na fila de repetição espaçada</div>` : ''}
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
  }

  // --- SESSÃO INTERATIVA DE REVISÃO (PLAYER) ---
  let activeSessionCards = [];
  let currentCardIndex = 0;
  let sessionStats = { again: 0, hard: 0, good: 0, easy: 0, total: 0 };
  let isCardFlipped = false;
  let failedCardsInSession = [];

  function startReviewSession(filterSubj = null, shuffle = false) {
    let cards = getDueCards();
    if (filterSubj) {
      cards = cards.filter(c => (c.deckTitle === filterSubj || c.sigla === filterSubj));
    }

    if (cards.length === 0) {
      alert('Nenhum flashcard devido para esta matéria no momento.');
      return;
    }

    if (shuffle) {
      cards = [...cards].sort(() => Math.random() - 0.5);
    }

    activeSessionCards = cards;
    currentCardIndex = 0;
    sessionStats = { again: 0, hard: 0, good: 0, easy: 0, total: cards.length };
    failedCardsInSession = [];
    isCardFlipped = false;

    openReviewModal();
    renderActiveCard();
  }

  function startReviewBySelectedSubj() {
    const sel = document.getElementById('revSubjSelect');
    if (!sel || !sel.value) {
      alert('Por favor, selecione uma matéria para revisar.');
      return;
    }
    startReviewSession(sel.value, true);
  }

  function startSingleCardReview(cardId) {
    const all = getAllCards();
    const found = all.find(c => c.id === cardId);
    if (found) {
      activeSessionCards = [found];
      currentCardIndex = 0;
      sessionStats = { again: 0, hard: 0, good: 0, easy: 0, total: 1 };
      failedCardsInSession = [];
      isCardFlipped = false;
      openReviewModal();
      renderActiveCard();
    }
  }

  function openReviewModal() {
    let modal = document.getElementById('modalReviewPlayer');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modalReviewPlayer';
      modal.className = 'modal-overlay';
      modal.onclick = function(e) { if(e.target === modal) DeltaRevisoes.closeReviewModal(); };
      modal.innerHTML = `
        <div class="modal-content modal-review-box">
          <div class="modal-header">
            <div class="mrh-left">
              <span class="mrh-icon">⚡</span>
              <h2 id="mrhTitle">Revisão FSRS Atena</h2>
            </div>
            <div class="mrh-progress-wrap">
              <span id="mrhCounter">1 / 10</span>
              <button onclick="DeltaRevisoes.closeReviewModal()" class="btn-close">&times;</button>
            </div>
          </div>

          <div class="modal-body modal-review-body" id="reviewBodyContent">
            <!-- Conteúdo dinâmico do flashcard -->
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
    modal.style.display = 'flex';
  }

  function closeReviewModal() {
    const modal = document.getElementById('modalReviewPlayer');
    if (modal) modal.style.display = 'none';
    renderRevisoesDashboard('dashRevisoesContainer');
    if (window.renderDashboardEstudei) window.renderDashboardEstudei();
  }

  function highlightKeywords(text) {
    const KEYWORDS = ['Exceção', 'Súmula', 'Vedada', 'Proibida', 'Prazo', 'NÃO', 'INCONDICIONADA', 'GRAVE', 'SIM', 'SEMPRE', 'NUNCA', 'JAMAIS', 'APENAS', 'MAIOR', 'ROXIN', 'JAKOBS', 'EX TUNC', 'EX NUNC', 'DOLO ESPECÍFICO'];
    let res = text;
    KEYWORDS.forEach(kw => {
      const reg = new RegExp(`\\b(${kw})\\b`, 'gi');
      res = res.replace(reg, `<span class="kw-highlight">$1</span>`);
    });
    return res;
  }

  function renderActiveCard() {
    const container = document.getElementById('reviewBodyContent');
    const counter = document.getElementById('mrhCounter');
    if (!container) return;

    if (currentCardIndex >= activeSessionCards.length) {
      renderSessionSummary();
      return;
    }

    const card = activeSessionCards[currentCardIndex];
    if (counter) counter.innerText = `${currentCardIndex + 1} de ${activeSessionCards.length}`;

    isCardFlipped = false;

    container.innerHTML = `
      <div class="fc-card-container ${isCardFlipped ? 'flipped' : ''}" onclick="DeltaRevisoes.flipCurrentCard()">
        <div class="fc-badge-top">
          <span class="fc-tag-mat">${card.sigla || 'MAT'}</span>
          <span class="fc-assunto-lbl">${card.assunto}</span>
        </div>

        <div class="fc-front-box">
          <div class="fc-prompt-label">Pergunta:</div>
          <div class="fc-question-text">${card.frente}</div>
          <div class="fc-tap-hint">👆 Toque no cartão ou pressione [Espaço] para ver a resposta</div>
        </div>

        <div class="fc-back-box" id="fcBackBox" style="display:none;">
          <div class="fc-divider-line"></div>
          <div class="fc-answer-label">Resposta:</div>
          <div class="fc-answer-text">${highlightKeywords(card.verso)}</div>
        </div>
      </div>

      <!-- BOTÕES DE AVALIAÇÃO FSRS -->
      <div class="fc-rating-buttons-bar" id="fcRatingBar" style="display:none;">
        <button class="btn-rate btn-rate-again" onclick="DeltaRevisoes.rateCard(1)">
          <span class="br-num">1</span>
          <span class="br-label">Errei</span>
          <span class="br-sub">10 min</span>
        </button>
        <button class="btn-rate btn-rate-hard" onclick="DeltaRevisoes.rateCard(2)">
          <span class="br-num">2</span>
          <span class="br-label">Difícil</span>
          <span class="br-sub">1 dia</span>
        </button>
        <button class="btn-rate btn-rate-good" onclick="DeltaRevisoes.rateCard(3)">
          <span class="br-num">3</span>
          <span class="br-label">Bom</span>
          <span class="br-sub">3 dias</span>
        </button>
        <button class="btn-rate btn-rate-easy" onclick="DeltaRevisoes.rateCard(4)">
          <span class="br-num">4</span>
          <span class="br-label">Fácil</span>
          <span class="br-sub">7 dias</span>
        </button>
      </div>
    `;
  }

  function flipCurrentCard() {
    if (isCardFlipped) return;
    isCardFlipped = true;
    const cardEl = document.querySelector('.fc-card-container');
    const tapHint = document.querySelector('.fc-tap-hint');
    const backBox = document.getElementById('fcBackBox');
    const ratingBar = document.getElementById('fcRatingBar');
    if (cardEl) cardEl.classList.add('flipped');
    if (tapHint) tapHint.style.display = 'none';
    if (backBox) backBox.style.display = 'flex';
    if (ratingBar) ratingBar.style.display = 'grid';

    // Rolar suavemente para exibir os botões de resposta se o cartão for longo
    setTimeout(() => {
      const reviewBody = document.getElementById('reviewBodyContent');
      if (reviewBody) {
        reviewBody.scrollTo({ top: reviewBody.scrollHeight, behavior: 'smooth' });
      }
    }, 50);
  }

  // --- CLASSIFICAÇÃO FSRS DO CARTÃO ---
  function rateCard(rating) {
    const card = activeSessionCards[currentCardIndex];
    const fsrs = getFSRSData();
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

    let currentSrs = fsrs[card.id] || {
      id: card.id,
      difficulty: 5.0,
      stability: 1.0,
      reps: 0,
      lapses: 0,
      state: 0,
      nextReview: todayStr,
      dueInterval: 1
    };

    // Atualização de repetições e estabilidade
    currentSrs.reps = (currentSrs.reps || 0) + 1;
    currentSrs.lastReview = todayStr;

    let addDays = 1;
    if (rating === 1) {
      sessionStats.again++;
      currentSrs.lapses = (currentSrs.lapses || 0) + 1;
      currentSrs.stability = Math.max(0.4, (currentSrs.stability || 1) * 0.5);
      currentSrs.difficulty = Math.min(10, (currentSrs.difficulty || 5) + 1.0);
      addDays = 0; // revisar hoje ainda
      failedCardsInSession.push(card);
    } else if (rating === 2) {
      sessionStats.hard++;
      currentSrs.stability = (currentSrs.stability || 1) * 1.2;
      currentSrs.difficulty = Math.min(10, (currentSrs.difficulty || 5) + 0.5);
      addDays = 1;
      failedCardsInSession.push(card); // entra na fila de reforço
    } else if (rating === 3) {
      sessionStats.good++;
      currentSrs.stability = (currentSrs.stability || 1) * 2.5;
      addDays = Math.max(2, Math.round(currentSrs.stability));
    } else if (rating === 4) {
      sessionStats.easy++;
      currentSrs.stability = (currentSrs.stability || 1) * 4.0;
      currentSrs.difficulty = Math.max(1, (currentSrs.difficulty || 5) - 0.5);
      addDays = Math.max(5, Math.round(currentSrs.stability * 1.5));
    }

    const nextDateObj = new Date();
    nextDateObj.setDate(nextDateObj.getDate() + addDays);
    currentSrs.nextReview = `${nextDateObj.getFullYear()}-${String(nextDateObj.getMonth()+1).padStart(2,'0')}-${String(nextDateObj.getDate()).padStart(2,'0')}`;
    currentSrs.dueInterval = addDays;

    fsrs[card.id] = currentSrs;
    saveFSRSData(fsrs);

    // Próximo cartão
    currentCardIndex++;
    renderActiveCard();
  }

  // --- RESUMO DA SESSÃO & ALERTA DE REVISÃO NO MESMO DIA ---
  function renderSessionSummary() {
    const container = document.getElementById('reviewBodyContent');
    const counter = document.getElementById('mrhCounter');
    if (!container) return;

    if (counter) counter.innerText = 'Concluído';

    const total = sessionStats.total;
    const acertos = sessionStats.good + sessionStats.easy;
    const taxaAcerto = total > 0 ? Math.round((acertos / total) * 100) : 0;
    const isBelowAverage = taxaAcerto < 75; // Limite de 75%

    // Salvar sessão no histórico geral do delta_estudos
    try {
      const raw = localStorage.getItem('delta_estudos');
      let logs = raw ? JSON.parse(raw) : [];
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
      
      logs.push({
        date: todayStr,
        mat: 'RLM/REV',
        assunto: `Revisão Flashcards (${total} cards)`,
        categoria: 'Revisão',
        tempo: Math.max(5, Math.round(total * 0.8)),
        qts: total,
        acertos: acertos,
        obs: `FSRS: ${sessionStats.easy} Fácil, ${sessionStats.good} Bom, ${sessionStats.hard} Difícil, ${sessionStats.again} Errei (${taxaAcerto}%)`
      });
      localStorage.setItem('delta_estudos', JSON.stringify(logs));
    } catch (e) {
      console.error('Erro ao registrar sessão de revisão:', e);
    }

    container.innerHTML = `
      <div class="rev-summary-box">
        <div class="rs-trophy">${isBelowAverage ? '⚠️' : '🎉'}</div>
        <h3 class="rs-title">${isBelowAverage ? 'Revisão Concluída com Alerta' : 'Excelente Rendimento!'}</h3>
        <p class="rs-subtitle">Você revisou ${total} flashcards nesta sessão.</p>

        <div class="rs-stats-row">
          <div class="rs-stat-item">
            <span class="rs-val" style="color:var(--green);">${sessionStats.good + sessionStats.easy}</span>
            <span class="rs-lbl">Retidos</span>
          </div>
          <div class="rs-stat-item">
            <span class="rs-val" style="color:#ef4444;">${sessionStats.again + sessionStats.hard}</span>
            <span class="rs-lbl">Falhas/Dificuldades</span>
          </div>
          <div class="rs-stat-item">
            <span class="rs-val" style="color:${isBelowAverage ? '#ef4444' : 'var(--green)'};">${taxaAcerto}%</span>
            <span class="rs-lbl">Aproveitamento</span>
          </div>
        </div>

        ${isBelowAverage ? `
          <div class="rs-alert-warning">
            <div class="rs-alert-icon">⚠️</div>
            <div class="rs-alert-text">
              <strong>Atenção: Seu aproveitamento ficou em ${taxaAcerto}% (abaixo da meta de 75%).</strong>
              <p>A ciência da repetição espaçada exige reforço imediato para consolidar os pontos fracos. Você precisa revisar estes ${failedCardsInSession.length} cartões novamente ainda hoje!</p>
            </div>
          </div>
          <button class="btn-re-revisar-agora" onclick="DeltaRevisoes.restartFailedCardsSession()">
            🔁 Refazer Revisão dos Cartões com Dificuldade Agora (${failedCardsInSession.length})
          </button>
        ` : `
          <div class="rs-alert-success">
            ✨ Parabéns! Sua taxa de retenção foi de ${taxaAcerto}%. Seus intervalos foram expandidos com sucesso pelo algoritmo FSRS.
          </div>
          <button class="btn-save" style="width:100%; margin-top:16px;" onclick="DeltaRevisoes.closeReviewModal()">
            Concluir e Voltar ao Painel
          </button>
        `}
      </div>
    `;
  }

  function restartFailedCardsSession() {
    if (failedCardsInSession.length === 0) {
      alert('Nenhum cartão pendente de reforço.');
      return;
    }

    activeSessionCards = [...failedCardsInSession].sort(() => Math.random() - 0.5);
    currentCardIndex = 0;
    sessionStats = { again: 0, hard: 0, good: 0, easy: 0, total: activeSessionCards.length };
    failedCardsInSession = [];
    isCardFlipped = false;
    renderActiveCard();
  }

  // Atalho de teclado (Espaço e números 1-4)
  document.addEventListener('keydown', function(e) {
    const modal = document.getElementById('modalReviewPlayer');
    if (!modal || modal.style.display !== 'flex') return;

    if (e.code === 'Space') {
      e.preventDefault();
      flipCurrentCard();
    } else if (isCardFlipped) {
      if (e.key === '1') rateCard(1);
      else if (e.key === '2') rateCard(2);
      else if (e.key === '3') rateCard(3);
      else if (e.key === '4') rateCard(4);
    }
  });

  // Exposição Global
  window.DeltaRevisoes = {
    getAllCards,
    getDueCards,
    renderRevisoesDashboard,
    startReviewSession,
    startReviewBySelectedSubj,
    startSingleCardReview,
    openReviewModal,
    closeReviewModal,
    flipCurrentCard,
    rateCard,
    restartFailedCardsSession
  };

})();
