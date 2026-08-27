/**
 * AVA Delta — Módulo de Edital Verticalizado e Planos Customizados
 * Permite ao usuário criar e gerenciar seus próprios planos, matérias e tópicos,
 * acompanhar a porcentagem de conclusão, marcar matérias estudadas,
 * analisar taxa de acerto/erro de questões e contagem de revisões.
 */

(function() {
  'use strict';

  const STORAGE_PLANS_KEY = 'delta_custom_plans';
  const STORAGE_ACTIVE_PLAN_KEY = 'delta_active_plan_id';

  // Template base sugerido para quando o usuário quiser criar um plano inicial estruturado
  const DEFAULT_SUBJECTS_TEMPLATE = [
    {
      id: 'mat_dp',
      sigla: 'DP',
      nome: 'Direito Penal',
      topicos: [
        { id: 'dp_0', codigo: '0', nome: 'Questões Gerais e Revisão Rápida', concluido: false, acertos: 0, erros: 0, dataEstudo: '', revisoes: 0, link: './direito_penal_teoria_do_crime.html' },
        { id: 'dp_1', codigo: '1.1', nome: 'Princípios do Direito Penal e Aplicação da Lei Penal', concluido: false, acertos: 0, erros: 0, dataEstudo: '', revisoes: 0, link: './direito-penal-nocoes-principios.html' },
        { id: 'dp_2', codigo: '1.2', nome: 'Teoria do Crime: Fato Típico, Ilicitude e Culpabilidade', concluido: false, acertos: 0, erros: 0, dataEstudo: '', revisoes: 0, link: './direito_penal_teoria_do_crime.html' },
        { id: 'dp_3', codigo: '1.3', nome: 'Concurso de Pessoas e Concurso de Crimes', concluido: false, acertos: 0, erros: 0, dataEstudo: '', revisoes: 0, link: '' },
        { id: 'dp_4', codigo: '1.4', nome: 'Teoria das Penas e Extinção da Punibilidade', concluido: false, acertos: 0, erros: 0, dataEstudo: '', revisoes: 0, link: '' },
        { id: 'dp_5', codigo: '2.1', nome: 'Crimes Contra a Pessoa e Crimes Contra o Patrimônio', concluido: false, acertos: 0, erros: 0, dataEstudo: '', revisoes: 0, link: '' },
        { id: 'dp_6', codigo: '2.2', nome: 'Crimes Contra a Administração Pública (Peculato, Corrupção)', concluido: false, acertos: 0, erros: 0, dataEstudo: '', revisoes: 0, link: '' }
      ]
    },
    {
      id: 'mat_dc',
      sigla: 'DC',
      nome: 'Direito Constitucional',
      topicos: [
        { id: 'dc_1', codigo: '1.1', nome: 'Teoria da Constituição e Controle de Constitucionalidade', concluido: false, acertos: 0, erros: 0, dataEstudo: '', revisoes: 0, link: './direito-constitucional-teoria.html' },
        { id: 'dc_2', codigo: '1.2', nome: 'Direitos e Garantias Fundamentais (Art. 5º ao 17)', concluido: false, acertos: 0, erros: 0, dataEstudo: '', revisoes: 0, link: '' },
        { id: 'dc_3', codigo: '1.3', nome: 'Organização do Estado e Repartição de Competências', concluido: false, acertos: 0, erros: 0, dataEstudo: '', revisoes: 0, link: '' },
        { id: 'dc_4', codigo: '1.4', nome: 'Organização dos Poderes (Executivo, Legislativo, Judiciário)', concluido: false, acertos: 0, erros: 0, dataEstudo: '', revisoes: 0, link: '' },
        { id: 'dc_5', codigo: '1.5', nome: 'Segurança Pública (Art. 144 da CF/88) e Forças Policiais', concluido: false, acertos: 0, erros: 0, dataEstudo: '', revisoes: 0, link: '' }
      ]
    },
    {
      id: 'mat_da',
      sigla: 'DA',
      nome: 'Direito Administrativo',
      topicos: [
        { id: 'da_1', codigo: '1.1', nome: 'Poderes da Administração e Atos Administrativos', concluido: false, acertos: 0, erros: 0, dataEstudo: '', revisoes: 0, link: './dir-adm-poderes-administracao.html' },
        { id: 'da_2', codigo: '1.2', nome: 'Agentes Públicos, Regime Jurídico e Responsabilidade', concluido: false, acertos: 0, erros: 0, dataEstudo: '', revisoes: 0, link: '' },
        { id: 'da_3', codigo: '1.3', nome: 'Licitações e Contratos Administrativos (Lei 14.133/2021)', concluido: false, acertos: 0, erros: 0, dataEstudo: '', revisoes: 0, link: '' },
        { id: 'da_4', codigo: '1.4', nome: 'Responsabilidade Civil do Estado e Improbidade (Lei 8.429)', concluido: false, acertos: 0, erros: 0, dataEstudo: '', revisoes: 0, link: '' }
      ]
    },
    {
      id: 'mat_dpp',
      sigla: 'DPP',
      nome: 'Processo Penal',
      topicos: [
        { id: 'dpp_1', codigo: '1.1', nome: 'Inquérito Policial e Investigação Criminal (Lei 12.830/13)', concluido: false, acertos: 0, erros: 0, dataEstudo: '', revisoes: 0, link: '' },
        { id: 'dpp_2', codigo: '1.2', nome: 'Ação Penal e Acordo de Não Persecução Penal (ANPP)', concluido: false, acertos: 0, erros: 0, dataEstudo: '', revisoes: 0, link: '' },
        { id: 'dpp_3', codigo: '1.3', nome: 'Prisões Cautelares (Flagrante, Preventiva e Temporária)', concluido: false, acertos: 0, erros: 0, dataEstudo: '', revisoes: 0, link: '' },
        { id: 'dpp_4', codigo: '1.4', nome: 'Provas no Processo Penal e Cadeia de Custódia', concluido: false, acertos: 0, erros: 0, dataEstudo: '', revisoes: 0, link: '' }
      ]
    },
    {
      id: 'mat_ml',
      sigla: 'ML',
      nome: 'Medicina Legal',
      topicos: [
        { id: 'ml_1', codigo: '1.1', nome: 'Perícias, Peritos e Documentos Médico-Legais', concluido: false, acertos: 0, erros: 0, dataEstudo: '', revisoes: 0, link: './medicina-legal-pericias-documentos.html' },
        { id: 'ml_2', codigo: '1.2', nome: 'Traumatologia Forense (Lesões Corporais e Energias)', concluido: false, acertos: 0, erros: 0, dataEstudo: '', revisoes: 0, link: '' },
        { id: 'ml_3', codigo: '1.3', nome: 'Tanatologia Forense (Morte, Cronotanatognose e Fenômenos Cadavéricos)', concluido: false, acertos: 0, erros: 0, dataEstudo: '', revisoes: 0, link: '' }
      ]
    },
    {
      id: 'mat_dcv',
      sigla: 'DCV',
      nome: 'Direito Civil',
      topicos: [
        { id: 'dcv_1', codigo: '1.1', nome: 'LINDB e Pessoas Naturais e Jurídicas', concluido: false, acertos: 0, erros: 0, dataEstudo: '', revisoes: 0, link: './direito-civil-lindb-pessoas.html' },
        { id: 'dcv_2', codigo: '1.2', nome: 'Bens, Fatos Jurídicos e Negócio Jurídico', concluido: false, acertos: 0, erros: 0, dataEstudo: '', revisoes: 0, link: '' }
      ]
    }
  ];
  ];

  // --- GERENCIAMENTO DE ESTADO ---
  let plans = [];
  let activePlanId = null;

  function loadPlans() {
    try {
      const raw = localStorage.getItem(STORAGE_PLANS_KEY);
      if (raw) {
        plans = JSON.parse(raw);
      }
    } catch (e) {
      console.error('Erro ao ler planos:', e);
      plans = [];
    }

    // Se o usuário ainda não tiver criado planos, cria o primeiro com base nas suas matérias
    if (!plans || plans.length === 0) {
      const initialPlan = {
        id: 'plano_' + Date.now(),
        nome: 'Meu Plano de Estudos',
        descricao: 'Plano personalizado de matérias e edital verticalizado',
        dataCriacao: new Date().toISOString(),
        disciplinas: JSON.parse(JSON.stringify(DEFAULT_SUBJECTS_TEMPLATE))
      };
      plans = [initialPlan];
      savePlans();
    }

    const savedActiveId = localStorage.getItem(STORAGE_ACTIVE_PLAN_KEY);
    if (savedActiveId && plans.some(p => p.id === savedActiveId)) {
      activePlanId = savedActiveId;
    } else {
      activePlanId = plans[0].id;
      localStorage.setItem(STORAGE_ACTIVE_PLAN_KEY, activePlanId);
    }

    return getActivePlan();
  }

  function savePlans() {
    try {
      localStorage.setItem(STORAGE_PLANS_KEY, JSON.stringify(plans));
      if (activePlanId) {
        localStorage.setItem(STORAGE_ACTIVE_PLAN_KEY, activePlanId);
      }
    } catch (e) {
      console.error('Erro ao salvar planos:', e);
    }
  }

  function getActivePlan() {
    return plans.find(p => p.id === activePlanId) || plans[0];
  }

  function setActivePlan(planId) {
    if (plans.some(p => p.id === planId)) {
      activePlanId = planId;
      localStorage.setItem(STORAGE_ACTIVE_PLAN_KEY, activePlanId);
      renderAll();
    }
  }

  function createNewPlan(nome, descricao, useTemplate = false) {
    const newPlan = {
      id: 'plano_' + Date.now(),
      nome: nome || 'Novo Plano',
      descricao: descricao || '',
      dataCriacao: new Date().toISOString(),
      disciplinas: useTemplate ? JSON.parse(JSON.stringify(DEFAULT_SUBJECTS_TEMPLATE)) : []
    };
    plans.push(newPlan);
    activePlanId = newPlan.id;
    savePlans();
    renderAll();
    return newPlan;
  }

  function deletePlan(planId) {
    if (plans.length <= 1) {
      alert('Você precisa manter pelo menos um plano.');
      return;
    }
    if (confirm('Deseja realmente excluir este plano?')) {
      plans = plans.filter(p => p.id !== planId);
      activePlanId = plans[0].id;
      savePlans();
      renderAll();
    }
  }

  function renamePlan(planId, newName) {
    const plan = plans.find(p => p.id === planId);
    if (plan) {
      plan.nome = newName;
      savePlans();
      renderAll();
    }
  }

  // --- CÁLCULO DE ESTATÍSTICAS DO PLANO ATIVO ---
  function calculatePlanStats(plan) {
    if (!plan || !plan.disciplinas) {
      return { totalTopicos: 0, concluidos: 0, pendentes: 0, pctConcluido: 0, acertos: 0, erros: 0, totalQuestoes: 0, pctAcertos: 0 };
    }

    let totalTopicos = 0;
    let concluidos = 0;
    let acertos = 0;
    let erros = 0;

    plan.disciplinas.forEach(d => {
      (d.topicos || []).forEach(t => {
        totalTopicos++;
        if (t.concluido) concluidos++;
        acertos += parseInt(t.acertos || 0);
        erros += parseInt(t.erros || 0);
      });
    });

    const pendentes = totalTopicos - concluidos;
    const pctConcluido = totalTopicos > 0 ? Math.round((concluidos / totalTopicos) * 100) : 0;
    const totalQuestoes = acertos + erros;
    const pctAcertos = totalQuestoes > 0 ? Math.round((acertos / totalQuestoes) * 100) : 0;

    return {
      totalTopicos,
      concluidos,
      pendentes,
      pctConcluido,
      acertos,
      erros,
      totalQuestoes,
      pctAcertos
    };
  }

  // --- TOGGLE TÓPICO CONCLUÍDO ---
  function toggleTopicoConcluido(discId, topicoId) {
    const plan = getActivePlan();
    if (!plan) return;

    const disc = (plan.disciplinas || []).find(d => d.id === discId);
    if (!disc) return;

    const topico = (disc.topicos || []).find(t => t.id === topicoId);
    if (!topico) return;

    topico.concluido = !topico.concluido;
    if (topico.concluido && !topico.dataEstudo) {
      const now = new Date();
      topico.dataEstudo = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    }

    savePlans();
    renderAll();
  }

  // --- INCREMENTO DE REVISÃO ---
  function addRevisaoTopico(discId, topicoId) {
    const plan = getActivePlan();
    if (!plan) return;
    const disc = plan.disciplinas.find(d => d.id === discId);
    if (!disc) return;
    const topico = disc.topicos.find(t => t.id === topicoId);
    if (!topico) return;

    topico.revisoes = (parseInt(topico.revisoes) || 0) + 1;
    const now = new Date();
    topico.dataEstudo = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    
    savePlans();
    renderEditalView('view-edital-content');
  }

  // --- ADICIONAR NOVA DISCIPLINA ---
  function addDisciplina(nome, sigla) {
    const plan = getActivePlan();
    if (!plan) return;

    const newDisc = {
      id: 'mat_' + Date.now(),
      nome: nome || 'Nova Disciplina',
      sigla: sigla || nome.substring(0, 3).toUpperCase(),
      topicos: []
    };

    plan.disciplinas.push(newDisc);
    savePlans();
    renderEditalView('view-edital-content');
  }

  // --- ADICIONAR NOVO TÓPICO ---
  function addTopico(discId, codigo, nome, link = '') {
    const plan = getActivePlan();
    if (!plan) return;
    const disc = plan.disciplinas.find(d => d.id === discId);
    if (!disc) return;

    const newTopico = {
      id: 'top_' + Date.now(),
      codigo: codigo || String(disc.topicos.length + 1),
      nome: nome || 'Novo Tópico',
      concluido: false,
      acertos: 0,
      erros: 0,
      dataEstudo: '',
      revisoes: 0,
      link: link
    };

    disc.topicos.push(newTopico);
    savePlans();
    renderEditalView('view-edital-content');
  }

  // --- EXCLUIR TÓPICO ---
  function deleteTopico(discId, topicoId) {
    if (!confirm('Deseja excluir este tópico?')) return;
    const plan = getActivePlan();
    if (!plan) return;
    const disc = plan.disciplinas.find(d => d.id === discId);
    if (!disc) return;

    disc.topicos = disc.topicos.filter(t => t.id !== topicoId);
    savePlans();
    renderEditalView('view-edital-content');
  }

  // --- EXCLUIR DISCIPLINA ---
  function deleteDisciplina(discId) {
    if (!confirm('Deseja excluir toda esta disciplina e seus tópicos?')) return;
    const plan = getActivePlan();
    if (!plan) return;

    plan.disciplinas = plan.disciplinas.filter(d => d.id !== discId);
    savePlans();
    renderEditalView('view-edital-content');
  }

  // --- REGISTRAR QUESTÕES NO TÓPICO VINCULADO ---
  function updateTopicoQuestoes(materiaSigla, assuntoNome, acertos, erros, dateStr) {
    const plan = getActivePlan();
    if (!plan || !plan.disciplinas) return;

    // Procura por correspondência de matéria ou assunto
    let targetTopico = null;
    plan.disciplinas.forEach(d => {
      if (d.sigla === materiaSigla || d.nome.toLowerCase().includes(materiaSigla.toLowerCase())) {
        d.topicos.forEach(t => {
          if (t.nome.toLowerCase().includes(assuntoNome.toLowerCase()) || assuntoNome.toLowerCase().includes(t.nome.toLowerCase())) {
            targetTopico = t;
          }
        });
      }
    });

    if (targetTopico) {
      targetTopico.acertos = (parseInt(targetTopico.acertos) || 0) + parseInt(acertos || 0);
      targetTopico.erros = (parseInt(targetTopico.erros) || 0) + parseInt(erros || 0);
      targetTopico.dataEstudo = dateStr || new Date().toISOString().split('T')[0];
      targetTopico.concluido = true;
      savePlans();
    }
  }

  // --- RENDERIZAÇÃO DA VIEW DO EDITAL VERTICALIZADO ---
  function renderEditalView(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const plan = getActivePlan();
    const stats = calculatePlanStats(plan);

    let html = `
      <!-- CABEÇALHO DO EDITAL -->
      <div class="edital-top-card">
        <div class="edital-header-row">
          <div>
            <h1 class="edital-title">Edital Verticalizado</h1>
            <p class="edital-sub">Acompanhe seu avanço tópico a tópico, taxa de acertos e contagem de revisões.</p>
          </div>
          <div class="edital-actions-top">
            <button class="btn-util" onclick="DeltaEdital.openCreatePlanModal()">+ Novo Plano</button>
            <button class="btn-novo-estudo-top" onclick="openRegistroModal()">+ Adicionar Estudo</button>
          </div>
        </div>

        <!-- BARRA DE PROGRESSO GLOBAL -->
        <div class="edital-global-progress-box">
          <div class="egp-label-row">
            <span class="egp-label">PROGRESSO NO EDITAL</span>
            <span class="egp-val">${stats.concluidos} de ${stats.totalTopicos} tópicos concluídos</span>
            <span class="egp-pct">${stats.pctConcluido}%</span>
          </div>
          <div class="egp-track">
            <div class="egp-fill" style="width:${stats.pctConcluido}%;"></div>
          </div>
        </div>
      </div>

      <!-- SELETOR DE PLANO E BOTÃO NOVA DISCIPLINA -->
      <div class="edital-controls-bar">
        <div class="edital-plan-selector-wrap">
          <label>Plano Atual:</label>
          <select id="editalPlanSelect" onchange="DeltaEdital.setActivePlan(this.value)">
            ${plans.map(p => `<option value="${p.id}" ${p.id === activePlanId ? 'selected' : ''}>📋 ${p.nome}</option>`).join('')}
          </select>
          <button class="btn-icon-util" title="Renomear Plano" onclick="DeltaEdital.promptRenamePlan('${activePlanId}')">✏️</button>
          <button class="btn-icon-util" title="Excluir Plano" onclick="DeltaEdital.deletePlan('${activePlanId}')">🗑️</button>
        </div>

        <div style="display:flex; gap:8px;">
          <button class="btn-util" onclick="DeltaEdital.openAddDisciplinaModal()">+ Adicionar Disciplina</button>
        </div>
      </div>

      <!-- ACORDEÃO DE MATÉRIAS E TABELAS DE TÓPICOS -->
      <div class="edital-disciplinas-list">
    `;

    if (!plan.disciplinas || plan.disciplinas.length === 0) {
      html += `
        <div class="edital-empty-state">
          <p>Nenhuma disciplina adicionada a este plano ainda.</p>
          <button class="btn-save" onclick="DeltaEdital.openAddDisciplinaModal()">+ Criar Primeira Disciplina</button>
        </div>
      `;
    } else {
      plan.disciplinas.forEach(d => {
        const topicos = d.topicos || [];
        const concluidosDisc = topicos.filter(t => t.concluido).length;
        const totalDisc = topicos.length;
        const pctDisc = totalDisc > 0 ? Math.round((concluidosDisc / totalDisc) * 100) : 0;

        html += `
          <div class="edital-disc-card" id="disc_card_${d.id}">
            <div class="edital-disc-header" onclick="DeltaEdital.toggleDiscAccordion('${d.id}')">
              <div class="edh-left">
                <span class="disc-tag-badge">${d.sigla || 'MAT'}</span>
                <h3 class="disc-name">${d.nome}</h3>
                <span class="disc-count-badge">${concluidosDisc}/${totalDisc} tópicos (${pctDisc}%)</span>
              </div>
              <div class="edh-right" onclick="event.stopPropagation();">
                <button class="btn-disc-action" title="Adicionar Tópico" onclick="DeltaEdital.openAddTopicoModal('${d.id}')">+ Tópico</button>
                <button class="btn-disc-action" title="Excluir Disciplina" onclick="DeltaEdital.deleteDisciplina('${d.id}')">🗑️</button>
                <span class="disc-chevron" id="chevron_${d.id}">▼</span>
              </div>
            </div>

            <div class="edital-table-wrap" id="table_wrap_${d.id}">
              <table class="edital-table">
                <thead>
                  <tr>
                    <th style="width:40%;">Tópicos</th>
                    <th style="width:8%; text-align:center;">✔️ Acertos</th>
                    <th style="width:8%; text-align:center;">❌ Erros</th>
                    <th style="width:8%; text-align:center;">📝 Total</th>
                    <th style="width:8%; text-align:center;">% Taxa</th>
                    <th style="width:12%; text-align:center;">📅 Último Estudo</th>
                    <th style="width:8%; text-align:center;">🧮 Revisões</th>
                    <th style="width:8%; text-align:right;">Ações</th>
                  </tr>
                </thead>
                <tbody>
        `;

        if (topicos.length === 0) {
          html += `
            <tr>
              <td colspan="8" style="text-align:center; padding:20px; color:var(--text-dim);">
                Nenhum tópico nesta disciplina. <a href="javascript:void(0)" onclick="DeltaEdital.openAddTopicoModal('${d.id}')" style="color:var(--brand); font-weight:bold;">Adicionar tópico</a>
              </td>
            </tr>
          `;
        } else {
          topicos.forEach(t => {
            const totQ = (parseInt(t.acertos) || 0) + (parseInt(t.erros) || 0);
            const pct = totQ > 0 ? Math.round(((parseInt(t.acertos) || 0) / totQ) * 100) : 0;
            const pctBadgeClass = pct >= 70 ? 'badge-pct' : (totQ > 0 ? 'badge-pct low' : 'badge-pct-zero');
            
            let formattedDate = '-';
            if (t.dataEstudo) {
              const parts = t.dataEstudo.split('-');
              formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}` : t.dataEstudo;
            }

            html += `
              <tr class="${t.concluido ? 'row-concluido' : ''}">
                <td class="col-topico">
                  <div class="topico-checkbox-title">
                    <input type="checkbox" ${t.concluido ? 'checked' : ''} onchange="DeltaEdital.toggleTopicoConcluido('${d.id}', '${t.id}')">
                    <span class="topico-codigo">${t.codigo}</span>
                    <span class="topico-nome-text">${t.nome}</span>
                  </div>
                </td>
                <td class="col-acertos">${t.acertos || 0}</td>
                <td class="col-erros">${t.erros || 0}</td>
                <td class="col-total">${totQ}</td>
                <td class="col-taxa"><span class="${pctBadgeClass}">${pct}%</span></td>
                <td class="col-data">${formattedDate}</td>
                <td class="col-revisoes">
                  <div class="rev-counter-wrap">
                    <span>${t.revisoes || 0}</span>
                    <button class="btn-rev-add" title="Registrar +1 Revisão" onclick="DeltaEdital.addRevisaoTopico('${d.id}', '${t.id}')">+</button>
                  </div>
                </td>
                <td class="col-acoes">
                  <div class="topico-actions-wrap">
                    <button class="btn-estudar-topico" title="Registrar Estudo deste tópico" onclick="DeltaEdital.quickEstudoTopico('${d.sigla}', '${t.nome}')">+ Estudar</button>
                    ${t.link ? `<a href="${t.link}" class="link-painel-topico" title="Abrir Painel">📖</a>` : ''}
                    <button class="btn-del-topico" title="Excluir" onclick="DeltaEdital.deleteTopico('${d.id}', '${t.id}')">&times;</button>
                  </div>
                </td>
              </tr>
            `;
          });
        }

        html += `
                </tbody>
              </table>
            </div>
          </div>
        `;
      });
    }

    html += `</div>`;
    container.innerHTML = html;
  }

  // --- ACCORDION TOGGLE ---
  function toggleDiscAccordion(discId) {
    const wrap = document.getElementById(`table_wrap_${discId}`);
    const chevron = document.getElementById(`chevron_${discId}`);
    if (wrap && chevron) {
      const isHidden = wrap.style.display === 'none';
      wrap.style.display = isHidden ? 'block' : 'none';
      chevron.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(-90deg)';
    }
  }

  // --- ATALHO ESTUDAR TÓPICO ---
  function quickEstudoTopico(sigla, topicoNome) {
    openRegistroModal();
    const selMat = document.getElementById('modalMat');
    if (selMat) {
      for (let i = 0; i < selMat.options.length; i++) {
        if (selMat.options[i].value === sigla) {
          selMat.selectedIndex = i;
          break;
        }
      }
    }
    const inpAssunto = document.getElementById('modalAssunto');
    if (inpAssunto) {
      inpAssunto.value = topicoNome;
    }
  }

  // --- MODAIS E DIALOGS ---
  function openCreatePlanModal() {
    const nome = prompt('Nome do novo plano:', 'Plano Concurso Delegado');
    if (nome && nome.trim() !== '') {
      const useTemplate = confirm('Deseja iniciar com a estrutura padrão de matérias para Delegado de Polícia (que você poderá editar totalmente)?');
      createNewPlan(nome.trim(), '', useTemplate);
    }
  }

  function promptRenamePlan(planId) {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    const newName = prompt('Novo nome para o plano:', plan.nome);
    if (newName && newName.trim() !== '') {
      renamePlan(planId, newName.trim());
    }
  }

  function openAddDisciplinaModal() {
    const nome = prompt('Nome da Disciplina (ex: Direito Processual Civil):');
    if (nome && nome.trim() !== '') {
      const sigla = prompt('Sigla da Disciplina (ex: DPC):', nome.substring(0, 3).toUpperCase());
      addDisciplina(nome.trim(), (sigla || '').trim());
    }
  }

  function openAddTopicoModal(discId) {
    const codigo = prompt('Código / Numeração do Tópico (ex: 1.1):', '1.1');
    if (codigo === null) return;
    const nome = prompt('Título / Conteúdo do Tópico:');
    if (nome && nome.trim() !== '') {
      const link = prompt('Link do Painel (opcional, ex: ./direito_penal_teoria_do_crime.html):', '');
      addTopico(discId, codigo.trim(), nome.trim(), (link || '').trim());
    }
  }

  function getTopicosPorMateria(siglaOuNome) {
    if (!siglaOuNome) return [];
    const plan = getActivePlan();
    const query = siglaOuNome.trim().toLowerCase();
    const results = [];

    // Busca no plano ativo
    if (plan && plan.disciplinas) {
      const disc = plan.disciplinas.find(d => 
        (d.sigla && d.sigla.toLowerCase() === query) ||
        (d.nome && d.nome.toLowerCase() === query) ||
        (d.sigla && query.includes(d.sigla.toLowerCase()))
      );
      if (disc && disc.topicos) {
        disc.topicos.forEach(t => {
          if (t.nome && !results.includes(t.nome)) results.push(t.nome);
        });
      }
    }

    // Se não encontrou no plano ativo, busca no template padrão
    if (results.length === 0) {
      const defDisc = DEFAULT_SUBJECTS_TEMPLATE.find(d => 
        (d.sigla && d.sigla.toLowerCase() === query) ||
        (d.nome && d.nome.toLowerCase() === query)
      );
      if (defDisc && defDisc.topicos) {
        defDisc.topicos.forEach(t => {
          if (t.nome && !results.includes(t.nome)) results.push(t.nome);
        });
      }
    }

    return results;
  }

  function renderAll() {
    renderEditalView('view-edital-content');
    if (window.renderDashboardEstudei) {
      window.renderDashboardEstudei();
    }
  }

  // Exposição Global
  window.DeltaEdital = {
    loadPlans,
    savePlans,
    getActivePlan,
    setActivePlan,
    createNewPlan,
    deletePlan,
    renamePlan,
    calculatePlanStats,
    toggleTopicoConcluido,
    addRevisaoTopico,
    addDisciplina,
    addTopico,
    deleteTopico,
    deleteDisciplina,
    updateTopicoQuestoes,
    renderEditalView,
    toggleDiscAccordion,
    quickEstudoTopico,
    openCreatePlanModal,
    promptRenamePlan,
    openAddDisciplinaModal,
    openAddTopicoModal,
    getTopicosPorMateria
  };

})();
