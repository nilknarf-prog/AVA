/**
 * AVA Delta — Módulo de Conquistas e Medalhas (Gamificação)
 * Renderiza badges vetoriais fiéis em SVG, avalia critérios com base no histórico real
 * e exibe o modal e notificações de desbloqueio.
 */

(function() {
  'use strict';

  // --- DEFINIÇÃO DAS CONQUISTAS ---
  const CONQUISTAS_DEF = [
    // 1. TRILHA INICIAL
    {
      id: 'ti_7dias',
      categoria: 'trilha_inicial',
      catNome: 'TRILHA INICIAL',
      catDesc: 'Primeiras ações que marcam o início da sua jornada de estudos.',
      titulo: 'Primeiros 7 dias sem falhar',
      desc: 'Mantenha uma sequência de 7 dias estudando.',
      icone: 'fogo',
      cor: '#f59e0b',
      requisitoTipo: 'streak',
      requisitoQtd: 7,
      unidade: 'dias'
    },
    {
      id: 'ti_questoes',
      categoria: 'trilha_inicial',
      catNome: 'TRILHA INICIAL',
      catDesc: 'Primeiras ações que marcam o início da sua jornada de estudos.',
      titulo: 'Desafio Aceito',
      desc: 'Você respondeu seu primeiro treino com questões de forma ativa.',
      icone: 'cerebro',
      cor: '#ea580c',
      requisitoTipo: 'primeira_questao',
      requisitoQtd: 1,
      unidade: 'sessão com questões'
    },
    {
      id: 'ti_revisao',
      categoria: 'trilha_inicial',
      catNome: 'TRILHA INICIAL',
      catDesc: 'Primeiras ações que marcam o início da sua jornada de estudos.',
      titulo: 'Memória Ativada',
      desc: 'Você fez sua primeira revisão e fortaleceu o aprendizado.',
      icone: 'relogio',
      cor: '#06b6d4',
      requisitoTipo: 'primeira_revisao',
      requisitoQtd: 1,
      unidade: 'revisão'
    },
    {
      id: 'ti_plano',
      categoria: 'trilha_inicial',
      catNome: 'TRILHA INICIAL',
      catDesc: 'Primeiras ações que marcam o início da sua jornada de estudos.',
      titulo: 'Plano em ação',
      desc: 'Você criou um planejamento para estudar com mais clareza.',
      icone: 'prancheta',
      cor: '#8b5cf6',
      requisitoTipo: 'plano_criado',
      requisitoQtd: 1,
      unidade: 'plano'
    },
    {
      id: 'ti_largada',
      categoria: 'trilha_inicial',
      catNome: 'TRILHA INICIAL',
      catDesc: 'Primeiras ações que marcam o início da sua jornada de estudos.',
      titulo: 'Registro de Largada',
      desc: 'Seu primeiro estudo foi registrado.',
      icone: 'livro_aberto',
      cor: '#10b981',
      requisitoTipo: 'primeiro_registro',
      requisitoQtd: 1,
      unidade: 'registro'
    },
    {
      id: 'ti_primeiro_passo',
      categoria: 'trilha_inicial',
      catNome: 'TRILHA INICIAL',
      catDesc: 'Primeiras ações que marcam o início da sua jornada de estudos.',
      titulo: 'Primeiro Passo',
      desc: 'Você concluiu o onboarding e deu o primeiro passo da sua jornada.',
      icone: 'bussola',
      cor: '#3b82f6',
      requisitoTipo: 'onboarding',
      requisitoQtd: 1,
      unidade: 'passo'
    },

    // 2. MEDALHAS ESPECIAIS
    {
      id: 'med_semana_perfeita',
      categoria: 'medalhas',
      catNome: 'MEDALHAS',
      catDesc: 'Conquistas pelos momentos marcantes da sua jornada.',
      titulo: 'Semana Perfeita',
      desc: 'Você cumpriu todos os dias planejados da semana.',
      icone: 'estrela_escudo',
      cor: '#10b981',
      requisitoTipo: 'semana_perfeita',
      requisitoQtd: 7,
      unidade: 'dias na semana'
    },
    {
      id: 'med_simulados',
      categoria: 'medalhas',
      catNome: 'MEDALHAS',
      catDesc: 'Conquistas pelos momentos marcantes da sua jornada.',
      titulo: 'Mestre dos Simulados',
      desc: 'Mostre sua excelência treinando em ambiente de prova.',
      icone: 'alvo_ouro',
      cor: '#f59e0b',
      requisitoTipo: 'simulado',
      requisitoQtd: 1,
      unidade: 'simulado'
    },
    {
      id: 'med_incansavel',
      categoria: 'medalhas',
      catNome: 'MEDALHAS',
      catDesc: 'Conquistas pelos momentos marcantes da sua jornada.',
      titulo: 'Incansável',
      desc: 'Estude mais de 6h em um único dia.',
      icone: 'raio_hex',
      cor: '#ef4444',
      requisitoTipo: 'horas_dia',
      requisitoQtd: 6,
      unidade: 'horas no dia'
    },
    {
      id: 'med_corujao',
      categoria: 'medalhas',
      catNome: 'MEDALHAS',
      catDesc: 'Conquistas pelos momentos marcantes da sua jornada.',
      titulo: 'Corujão',
      desc: 'Você manteve o foco mesmo quando o dia já terminava (após 22h).',
      icone: 'coruja',
      cor: '#a855f7',
      requisitoTipo: 'noturno',
      requisitoQtd: 1,
      unidade: 'sessão noturna'
    },
    {
      id: 'med_madrugador',
      categoria: 'medalhas',
      catNome: 'MEDALHAS',
      catDesc: 'Conquistas pelos momentos marcantes da sua jornada.',
      titulo: 'Madrugador',
      desc: 'Você começou o dia acordando cedo e saiu na frente (antes das 7h).',
      icone: 'galo',
      cor: '#3b82f6',
      requisitoTipo: 'matutino',
      requisitoQtd: 1,
      unidade: 'sessão matutina'
    },

    // 3. CONSTÂNCIA
    {
      id: 'const_7d',
      categoria: 'constancia',
      catNome: 'CONSTÂNCIA',
      catDesc: 'Conquistas para quem mantém a sua sequência de estudos todos os dias.',
      titulo: 'Primeiro Ritmo',
      desc: '7 dias seguidos de estudo.',
      icone: 'calendario_num',
      badgeNum: '7',
      cor: '#10b981',
      requisitoTipo: 'streak',
      requisitoQtd: 7,
      unidade: 'dias'
    },
    {
      id: 'const_15d',
      categoria: 'constancia',
      catNome: 'CONSTÂNCIA',
      catDesc: 'Conquistas para quem mantém a sua sequência de estudos todos os dias.',
      titulo: 'Sem Falhar',
      desc: '15 dias de constância.',
      icone: 'calendario_num',
      badgeNum: '15',
      cor: '#10b981',
      requisitoTipo: 'streak',
      requisitoQtd: 15,
      unidade: 'dias'
    },
    {
      id: 'const_30d',
      categoria: 'constancia',
      catNome: 'CONSTÂNCIA',
      catDesc: 'Conquistas para quem mantém a sua sequência de estudos todos os dias.',
      titulo: 'Corrente Forte',
      desc: '30 dias seguidos de estudo.',
      icone: 'calendario_num',
      badgeNum: '30',
      cor: '#10b981',
      requisitoTipo: 'streak',
      requisitoQtd: 30,
      unidade: 'dias'
    },
    {
      id: 'const_100d',
      categoria: 'constancia',
      catNome: 'CONSTÂNCIA',
      catDesc: 'Conquistas para quem mantém a sua sequência de estudos todos os dias.',
      titulo: 'Imparável',
      desc: '100 dias de constância.',
      icone: 'calendario_num',
      badgeNum: '100',
      cor: '#64748b',
      requisitoTipo: 'streak',
      requisitoQtd: 100,
      unidade: 'dias'
    },
    {
      id: 'const_180d',
      categoria: 'constancia',
      catNome: 'CONSTÂNCIA',
      catDesc: 'Conquistas para quem mantém a sua sequência de estudos todos os dias.',
      titulo: 'Inquebrável',
      desc: '180 dias seguidos de estudo.',
      icone: 'calendario_num',
      badgeNum: '180',
      cor: '#64748b',
      requisitoTipo: 'streak',
      requisitoQtd: 180,
      unidade: 'dias'
    },
    {
      id: 'const_365d',
      categoria: 'constancia',
      catNome: 'CONSTÂNCIA',
      catDesc: 'Conquistas para quem mantém a sua sequência de estudos todos os dias.',
      titulo: 'Lendário',
      desc: '365 dias de constância.',
      icone: 'trofeu_ouro',
      badgeNum: '365',
      cor: '#f59e0b',
      requisitoTipo: 'streak',
      requisitoQtd: 365,
      unidade: 'dias'
    },

    // 4. HORAS DE ESTUDO
    {
      id: 'h_20h',
      categoria: 'horas',
      catNome: 'HORAS DE ESTUDO',
      catDesc: 'Conquistas para quem acumula tempo real de dedicação.',
      titulo: 'Aquecimento',
      desc: '20 horas acumuladas.',
      icone: 'ampulheta',
      badgeNum: '20',
      cor: '#f59e0b',
      requisitoTipo: 'horas_total',
      requisitoQtd: 20,
      unidade: 'horas'
    },
    {
      id: 'h_100h',
      categoria: 'horas',
      catNome: 'HORAS DE ESTUDO',
      catDesc: 'Conquistas para quem acumula tempo real de dedicação.',
      titulo: 'Em Movimento',
      desc: '100 horas acumuladas.',
      icone: 'ampulheta',
      badgeNum: '100',
      cor: '#f59e0b',
      requisitoTipo: 'horas_total',
      requisitoQtd: 100,
      unidade: 'horas'
    },
    {
      id: 'h_300h',
      categoria: 'horas',
      catNome: 'HORAS DE ESTUDO',
      catDesc: 'Conquistas para quem acumula tempo real de dedicação.',
      titulo: 'Ritmo Forte',
      desc: '300 horas de estudo.',
      icone: 'ampulheta',
      badgeNum: '300',
      cor: '#f59e0b',
      requisitoTipo: 'horas_total',
      requisitoQtd: 300,
      unidade: 'horas'
    },
    {
      id: 'h_500h',
      categoria: 'horas',
      catNome: 'HORAS DE ESTUDO',
      catDesc: 'Conquistas para quem acumula tempo real de dedicação.',
      titulo: 'Alta Carga',
      desc: '500 horas registradas.',
      icone: 'ampulheta',
      badgeNum: '500',
      cor: '#f59e0b',
      requisitoTipo: 'horas_total',
      requisitoQtd: 500,
      unidade: 'horas'
    },
    {
      id: 'h_1000h',
      categoria: 'horas',
      catNome: 'HORAS DE ESTUDO',
      catDesc: 'Conquistas para quem acumula tempo real de dedicação.',
      titulo: 'Maratonista',
      desc: '1.000 horas de estudo.',
      icone: 'ampulheta',
      badgeNum: '1.000',
      cor: '#64748b',
      requisitoTipo: 'horas_total',
      requisitoQtd: 1000,
      unidade: 'horas'
    },

    // 5. QUESTÕES RESOLVIDAS
    {
      id: 'q_50',
      categoria: 'questoes',
      catNome: 'QUESTÕES RESOLVIDAS',
      catDesc: 'Conquistas para quem treina com prática e melhora o desempenho.',
      titulo: 'Primeiro Alvo',
      desc: '50 questões resolvidas.',
      icone: 'lampada_hex',
      badgeNum: '50',
      cor: '#3b82f6',
      requisitoTipo: 'questoes_total',
      requisitoQtd: 50,
      unidade: 'questões'
    },
    {
      id: 'q_250',
      categoria: 'questoes',
      catNome: 'QUESTÕES RESOLVIDAS',
      catDesc: 'Conquistas para quem treina com prática e melhora o desempenho.',
      titulo: 'Mira Certa',
      desc: '250 questões resolvidas.',
      icone: 'lampada_hex',
      badgeNum: '250',
      cor: '#3b82f6',
      requisitoTipo: 'questoes_total',
      requisitoQtd: 250,
      unidade: 'questões'
    },
    {
      id: 'q_1000',
      categoria: 'questoes',
      catNome: 'QUESTÕES RESOLVIDAS',
      catDesc: 'Conquistas para quem treina com prática e melhora o desempenho.',
      titulo: 'Ritmo de Prova',
      desc: '1.000 questões resolvidas.',
      icone: 'lampada_hex',
      badgeNum: '1.000',
      cor: '#3b82f6',
      requisitoTipo: 'questoes_total',
      requisitoQtd: 1000,
      unidade: 'questões'
    },
    {
      id: 'q_2500',
      categoria: 'questoes',
      catNome: 'QUESTÕES RESOLVIDAS',
      catDesc: 'Conquistas para quem treina com prática e melhora o desempenho.',
      titulo: 'Bateria Forte',
      desc: '2.500 questões concluídas.',
      icone: 'lampada_hex',
      badgeNum: '2.500',
      cor: '#3b82f6',
      requisitoTipo: 'questoes_total',
      requisitoQtd: 2500,
      unidade: 'questões'
    },
    {
      id: 'q_5000',
      categoria: 'questoes',
      catNome: 'QUESTÕES RESOLVIDAS',
      catDesc: 'Conquistas para quem treina com prática e melhora o desempenho.',
      titulo: 'Máquina de Questões',
      desc: '5.000 questões resolvidas.',
      icone: 'lampada_hex',
      badgeNum: '5.000',
      cor: '#3b82f6',
      requisitoTipo: 'questoes_total',
      requisitoQtd: 5000,
      unidade: 'questões'
    },
    {
      id: 'q_10000',
      categoria: 'questoes',
      catNome: 'QUESTÕES RESOLVIDAS',
      catDesc: 'Conquistas para quem treina com prática e melhora o desempenho.',
      titulo: 'Mestre das Questões',
      desc: '10.000 questões resolvidas.',
      icone: 'coroa_hex',
      badgeNum: '10.000',
      cor: '#3b82f6',
      requisitoTipo: 'questoes_total',
      requisitoQtd: 10000,
      unidade: 'questões'
    },

    // 6. PÁGINAS LIDAS
    {
      id: 'pag_50',
      categoria: 'paginas',
      catNome: 'PÁGINAS LIDAS',
      catDesc: 'Conquistas para quem constrói repertório e domina o conteúdo.',
      titulo: 'Primeira Página',
      desc: '50 páginas lidas.',
      icone: 'livro_hex',
      badgeNum: '50',
      cor: '#ef4444',
      requisitoTipo: 'paginas_total',
      requisitoQtd: 50,
      unidade: 'páginas'
    },
    {
      id: 'pag_250',
      categoria: 'paginas',
      catNome: 'PÁGINAS LIDAS',
      catDesc: 'Conquistas para quem constrói repertório e domina o conteúdo.',
      titulo: 'Leitor em Curso',
      desc: '250 páginas lidas.',
      icone: 'livro_hex',
      badgeNum: '250',
      cor: '#ef4444',
      requisitoTipo: 'paginas_total',
      requisitoQtd: 250,
      unidade: 'páginas'
    },
    {
      id: 'pag_500',
      categoria: 'paginas',
      catNome: 'PÁGINAS LIDAS',
      catDesc: 'Conquistas para quem constrói repertório e domina o conteúdo.',
      titulo: 'Virador de Páginas',
      desc: '500 páginas lidas.',
      icone: 'livro_hex',
      badgeNum: '500',
      cor: '#64748b',
      requisitoTipo: 'paginas_total',
      requisitoQtd: 500,
      unidade: 'páginas'
    },
    {
      id: 'pag_1000',
      categoria: 'paginas',
      catNome: 'PÁGINAS LIDAS',
      catDesc: 'Conquistas para quem constrói repertório e domina o conteúdo.',
      titulo: 'Repertório Forte',
      desc: '1.000 páginas lidas.',
      icone: 'livro_hex',
      badgeNum: '1.000',
      cor: '#64748b',
      requisitoTipo: 'paginas_total',
      requisitoQtd: 1000,
      unidade: 'páginas'
    },
    {
      id: 'pag_2500',
      categoria: 'paginas',
      catNome: 'PÁGINAS LIDAS',
      catDesc: 'Conquistas para quem constrói repertório e domina o conteúdo.',
      titulo: 'Biblioteca Viva',
      desc: '2.500 páginas lidas.',
      icone: 'livro_hex',
      badgeNum: '2.500',
      cor: '#64748b',
      requisitoTipo: 'paginas_total',
      requisitoQtd: 2500,
      unidade: 'páginas'
    },

    // 7. REVISÕES FEITAS
    {
      id: 'rev_10',
      categoria: 'revisoes',
      catNome: 'REVISÕES FEITAS',
      catDesc: 'Conquistas para quem revisa e fixa o aprendizado.',
      titulo: 'Primeira Retomada',
      desc: '10 revisões concluídas.',
      icone: 'revisao_circ',
      badgeNum: '10',
      cor: '#a855f7',
      requisitoTipo: 'revisoes_total',
      requisitoQtd: 10,
      unidade: 'revisões'
    },
    {
      id: 'rev_50',
      categoria: 'revisoes',
      catNome: 'REVISÕES FEITAS',
      catDesc: 'Conquistas para quem revisa e fixa o aprendizado.',
      titulo: 'Memória em Treino',
      desc: '50 revisões concluídas.',
      icone: 'revisao_circ',
      badgeNum: '50',
      cor: '#a855f7',
      requisitoTipo: 'revisoes_total',
      requisitoQtd: 50,
      unidade: 'revisões'
    },
    {
      id: 'rev_100',
      categoria: 'revisoes',
      catNome: 'REVISÕES FEITAS',
      catDesc: 'Conquistas para quem revisa e fixa o aprendizado.',
      titulo: 'Fixação Sólida',
      desc: '100 revisões concluídas.',
      icone: 'revisao_circ',
      badgeNum: '100',
      cor: '#a855f7',
      requisitoTipo: 'revisoes_total',
      requisitoQtd: 100,
      unidade: 'revisões'
    },
    {
      id: 'rev_250',
      categoria: 'revisoes',
      catNome: 'REVISÕES FEITAS',
      catDesc: 'Conquistas para quem revisa e fixa o aprendizado.',
      titulo: 'Ciclo Fechado',
      desc: '250 revisões concluídas.',
      icone: 'revisao_circ',
      badgeNum: '250',
      cor: '#64748b',
      requisitoTipo: 'revisoes_total',
      requisitoQtd: 250,
      unidade: 'revisões'
    },
    {
      id: 'rev_500',
      categoria: 'revisoes',
      catNome: 'REVISÕES FEITAS',
      catDesc: 'Conquistas para quem revisa e fixa o aprendizado.',
      titulo: 'Memória de Ferro',
      desc: '500 revisões concluídas.',
      icone: 'revisao_circ',
      badgeNum: '500',
      cor: '#64748b',
      requisitoTipo: 'revisoes_total',
      requisitoQtd: 500,
      unidade: 'revisões'
    }
  ];

  // --- GERADOR DE SVGS VETORIAIS COM ALTA DEFINIÇÃO ---
  function getBadgeSVG(c, isUnlocked) {
    const cor = isUnlocked ? c.cor : '#64748b';
    const bgGradId = `grad_${c.id}_${isUnlocked ? 'u' : 'l'}`;
    const badgeNum = c.badgeNum || '';
    
    // Gradient definitions
    let defs = `
      <defs>
        <linearGradient id="${bgGradId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${isUnlocked ? cor : '#334155'}" stop-opacity="1" />
          <stop offset="100%" stop-color="${isUnlocked ? '#0f172a' : '#1e293b'}" stop-opacity="0.9" />
        </linearGradient>
        <filter id="glow_${c.id}" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
    `;

    let innerIcon = '';

    switch(c.icone) {
      case 'fogo':
        innerIcon = `
          <circle cx="36" cy="36" r="32" fill="url(#${bgGradId})" stroke="${cor}" stroke-width="2.5" ${isUnlocked ? `filter="url(#glow_${c.id})"` : ''} />
          <circle cx="36" cy="36" r="26" fill="none" stroke="${isUnlocked ? '#fbbf24' : '#475569'}" stroke-width="1.5" stroke-dasharray="3 3"/>
          <path d="M36 16c2 6 8 10 8 16a8 8 0 0 1-16 0c0-4 3-7 5-11 0 0 4 3 3 5z" fill="${isUnlocked ? '#fbbf24' : '#94a3b8'}"/>
          <path d="M36 24c1.5 3 4 5 4 8a4 4 0 0 1-8 0c0-2 1.5-3.5 2.5-5.5 0 0 2 1.5 1.5 2.5z" fill="${isUnlocked ? '#f97316' : '#64748b'}"/>
        `;
        break;

      case 'cerebro':
        innerIcon = `
          <circle cx="36" cy="36" r="32" fill="url(#${bgGradId})" stroke="${cor}" stroke-width="2.5" />
          <circle cx="36" cy="36" r="26" fill="none" stroke="${isUnlocked ? '#fb923c' : '#475569'}" stroke-width="1.5"/>
          <path d="M26 36a6 6 0 0 1 6-6 6 6 0 0 1 8 0 6 6 0 0 1 6 6c0 5-4 9-10 9s-10-4-10-9z" fill="none" stroke="${isUnlocked ? '#ffedd5' : '#94a3b8'}" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M36 28v18M30 33c2 2 4 2 6 2s4 0 6-2" stroke="${isUnlocked ? '#fb923c' : '#64748b'}" stroke-width="2" stroke-linecap="round"/>
        `;
        break;

      case 'relogio':
        innerIcon = `
          <circle cx="36" cy="36" r="32" fill="url(#${bgGradId})" stroke="${cor}" stroke-width="2.5" />
          <circle cx="36" cy="36" r="26" fill="none" stroke="${isUnlocked ? '#22d3ee' : '#475569'}" stroke-width="1.5"/>
          <circle cx="36" cy="36" r="16" fill="none" stroke="${isUnlocked ? '#cffafe' : '#94a3b8'}" stroke-width="2.5"/>
          <path d="M36 26v10l6 4" stroke="${isUnlocked ? '#22d3ee' : '#64748b'}" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M33 16h6" stroke="${isUnlocked ? '#22d3ee' : '#94a3b8'}" stroke-width="2" stroke-linecap="round"/>
        `;
        break;

      case 'prancheta':
        innerIcon = `
          <circle cx="36" cy="36" r="32" fill="url(#${bgGradId})" stroke="${cor}" stroke-width="2.5" />
          <circle cx="36" cy="36" r="26" fill="none" stroke="${isUnlocked ? '#c084fc' : '#475569'}" stroke-width="1.5"/>
          <rect x="24" y="22" width="24" height="28" rx="4" fill="${isUnlocked ? '#3b0764' : '#1e293b'}" stroke="${isUnlocked ? '#e9d5ff' : '#94a3b8'}" stroke-width="2"/>
          <rect x="30" y="19" width="12" height="6" rx="2" fill="${isUnlocked ? '#c084fc' : '#64748b'}"/>
          <path d="M29 30h14M29 36h14M29 42h8" stroke="${isUnlocked ? '#f3e8ff' : '#94a3b8'}" stroke-width="2" stroke-linecap="round"/>
        `;
        break;

      case 'livro_aberto':
        innerIcon = `
          <circle cx="36" cy="36" r="32" fill="url(#${bgGradId})" stroke="${cor}" stroke-width="2.5" />
          <circle cx="36" cy="36" r="26" fill="none" stroke="${isUnlocked ? '#34d399' : '#475569'}" stroke-width="1.5"/>
          <path d="M22 28c4-2 9-2 14 2 5-4 10-4 14-2v18c-4-2-9-2-14 2-5-4-10-4-14-2z" fill="${isUnlocked ? '#064e3b' : '#1e293b'}" stroke="${isUnlocked ? '#6ee7b7' : '#94a3b8'}" stroke-width="2"/>
          <path d="M36 30v18" stroke="${isUnlocked ? '#34d399' : '#64748b'}" stroke-width="2"/>
        `;
        break;

      case 'bussola':
        innerIcon = `
          <circle cx="36" cy="36" r="32" fill="url(#${bgGradId})" stroke="${cor}" stroke-width="2.5" />
          <circle cx="36" cy="36" r="26" fill="none" stroke="${isUnlocked ? '#60a5fa' : '#475569'}" stroke-width="1.5"/>
          <circle cx="36" cy="36" r="18" fill="none" stroke="${isUnlocked ? '#93c5fd' : '#64748b'}" stroke-width="1.5"/>
          <polygon points="36,20 40,36 36,33 32,36" fill="${isUnlocked ? '#ef4444' : '#94a3b8'}"/>
          <polygon points="36,52 40,36 36,39 32,36" fill="${isUnlocked ? '#93c5fd' : '#475569'}"/>
          <circle cx="36" cy="36" r="2.5" fill="#ffffff"/>
        `;
        break;

      case 'estrela_escudo':
        innerIcon = `
          <path d="M36 6l22 8v16c0 14-9 26-22 30-13-4-22-16-22-30V14z" fill="url(#${bgGradId})" stroke="${cor}" stroke-width="2.5"/>
          <polygon points="36,22 39,29 47,29 41,34 43,42 36,37 29,42 31,34 25,29 33,29" fill="${isUnlocked ? '#fef08a' : '#94a3b8'}" stroke="${isUnlocked ? '#ca8a04' : '#64748b'}" stroke-width="1"/>
        `;
        break;

      case 'alvo_ouro':
        innerIcon = `
          <polygon points="36,8 58,20 58,52 36,64 14,52 14,20" fill="url(#${bgGradId})" stroke="${cor}" stroke-width="2.5"/>
          <circle cx="36" cy="36" r="18" fill="none" stroke="${isUnlocked ? '#fde047' : '#94a3b8'}" stroke-width="2"/>
          <circle cx="36" cy="36" r="10" fill="none" stroke="${isUnlocked ? '#f59e0b' : '#64748b'}" stroke-width="2"/>
          <circle cx="36" cy="36" r="4" fill="${isUnlocked ? '#ef4444' : '#94a3b8'}"/>
          <path d="M22 22l8 8M50 22l-8 8" stroke="${isUnlocked ? '#fde047' : '#64748b'}" stroke-width="2" stroke-linecap="round"/>
        `;
        break;

      case 'raio_hex':
        innerIcon = `
          <polygon points="36,8 58,20 58,52 36,64 14,52 14,20" fill="url(#${bgGradId})" stroke="${cor}" stroke-width="2.5"/>
          <polygon points="38,18 26,36 35,36 32,52 46,32 37,32" fill="${isUnlocked ? '#fef08a' : '#94a3b8'}" stroke="${isUnlocked ? '#f97316' : '#64748b'}" stroke-width="1.5"/>
        `;
        break;

      case 'coruja':
        innerIcon = `
          <polygon points="36,8 58,20 58,52 36,64 14,52 14,20" fill="url(#${bgGradId})" stroke="${cor}" stroke-width="2.5"/>
          <circle cx="28" cy="32" r="7" fill="${isUnlocked ? '#f3e8ff' : '#334155'}" stroke="${isUnlocked ? '#c084fc' : '#94a3b8'}" stroke-width="2"/>
          <circle cx="44" cy="32" r="7" fill="${isUnlocked ? '#f3e8ff' : '#334155'}" stroke="${isUnlocked ? '#c084fc' : '#94a3b8'}" stroke-width="2"/>
          <circle cx="28" cy="32" r="3" fill="${isUnlocked ? '#581c87' : '#94a3b8'}"/>
          <circle cx="44" cy="32" r="3" fill="${isUnlocked ? '#581c87' : '#94a3b8'}"/>
          <polygon points="36,36 33,42 39,42" fill="${isUnlocked ? '#fbbf24' : '#64748b'}"/>
        `;
        break;

      case 'galo':
        innerIcon = `
          <circle cx="36" cy="36" r="30" fill="url(#${bgGradId})" stroke="${cor}" stroke-width="2.5"/>
          <circle cx="36" cy="36" r="16" fill="${isUnlocked ? '#1e3a8a' : '#1e293b'}"/>
          <path d="M30 26c0-6 8-6 8 0" stroke="${isUnlocked ? '#ef4444' : '#94a3b8'}" stroke-width="3" stroke-linecap="round"/>
          <circle cx="33" cy="34" r="2.5" fill="#ffffff"/>
          <polygon points="40,34 46,38 40,40" fill="${isUnlocked ? '#fbbf24' : '#94a3b8'}"/>
        `;
        break;

      case 'calendario_num':
        innerIcon = `
          <polygon points="36,8 58,20 58,52 36,64 14,52 14,20" fill="url(#${bgGradId})" stroke="${cor}" stroke-width="2.5"/>
          <rect x="22" y="22" width="28" height="26" rx="4" fill="${isUnlocked ? '#064e3b' : '#1e293b'}" stroke="${isUnlocked ? '#34d399' : '#94a3b8'}" stroke-width="2"/>
          <path d="M22 30h28" stroke="${isUnlocked ? '#34d399' : '#64748b'}" stroke-width="2"/>
          <text x="36" y="43" text-anchor="middle" font-size="12" font-weight="900" fill="${isUnlocked ? '#ffffff' : '#94a3b8'}" font-family="'IBM Plex Mono', monospace">${badgeNum}</text>
        `;
        break;

      case 'ampulheta':
        innerIcon = `
          <polygon points="36,8 58,20 58,52 36,64 14,52 14,20" fill="url(#${bgGradId})" stroke="${cor}" stroke-width="2.5"/>
          <path d="M24 20h24L36 34 48 48H24l12-14z" fill="${isUnlocked ? '#78350f' : '#1e293b'}" stroke="${isUnlocked ? '#fde047' : '#94a3b8'}" stroke-width="2"/>
          <text x="36" y="58" text-anchor="middle" font-size="10" font-weight="800" fill="${isUnlocked ? '#fef08a' : '#94a3b8'}" font-family="'IBM Plex Mono', monospace">${badgeNum}</text>
        `;
        break;

      case 'lampada_hex':
        innerIcon = `
          <polygon points="36,8 58,20 58,52 36,64 14,52 14,20" fill="url(#${bgGradId})" stroke="${cor}" stroke-width="2.5"/>
          <path d="M36 18a8 8 0 0 0-5 14c1 2 2 3 2 5h6c0-2 1-3 2-5a8 8 0 0 0-5-14z" fill="${isUnlocked ? '#1e3a8a' : '#1e293b'}" stroke="${isUnlocked ? '#93c5fd' : '#94a3b8'}" stroke-width="2"/>
          <rect x="33" y="38" width="6" height="3" rx="1" fill="${isUnlocked ? '#fde047' : '#64748b'}"/>
          <text x="36" y="58" text-anchor="middle" font-size="10" font-weight="800" fill="${isUnlocked ? '#bfdbfe' : '#94a3b8'}" font-family="'IBM Plex Mono', monospace">${badgeNum}</text>
        `;
        break;

      case 'coroa_hex':
        innerIcon = `
          <polygon points="36,8 58,20 58,52 36,64 14,52 14,20" fill="url(#${bgGradId})" stroke="${cor}" stroke-width="2.5"/>
          <polygon points="24,36 28,24 36,30 44,24 48,36" fill="${isUnlocked ? '#fbbf24' : '#94a3b8'}" stroke="${isUnlocked ? '#f59e0b' : '#64748b'}" stroke-width="1.5"/>
          <rect x="24" y="37" width="24" height="4" rx="1" fill="${isUnlocked ? '#d97706' : '#64748b'}"/>
          <text x="36" y="58" text-anchor="middle" font-size="9" font-weight="800" fill="${isUnlocked ? '#fef08a' : '#94a3b8'}" font-family="'IBM Plex Mono', monospace">${badgeNum}</text>
        `;
        break;

      case 'livro_hex':
        innerIcon = `
          <polygon points="36,8 58,20 58,52 36,64 14,52 14,20" fill="url(#${bgGradId})" stroke="${cor}" stroke-width="2.5"/>
          <rect x="24" y="20" width="24" height="26" rx="3" fill="${isUnlocked ? '#7f1d1d' : '#1e293b'}" stroke="${isUnlocked ? '#f87171' : '#94a3b8'}" stroke-width="2"/>
          <path d="M29 26h14M29 32h14M29 38h8" stroke="${isUnlocked ? '#fecaca' : '#94a3b8'}" stroke-width="2" stroke-linecap="round"/>
          <text x="36" y="58" text-anchor="middle" font-size="10" font-weight="800" fill="${isUnlocked ? '#fecaca' : '#94a3b8'}" font-family="'IBM Plex Mono', monospace">${badgeNum}</text>
        `;
        break;

      case 'revisao_circ':
        innerIcon = `
          <circle cx="36" cy="36" r="30" fill="url(#${bgGradId})" stroke="${cor}" stroke-width="2.5"/>
          <path d="M26 36a10 10 0 1 1 10 10" fill="none" stroke="${isUnlocked ? '#e9d5ff' : '#94a3b8'}" stroke-width="3" stroke-linecap="round"/>
          <polygon points="36,41 36,51 43,46" fill="${isUnlocked ? '#c084fc' : '#64748b'}"/>
          <text x="36" y="39" text-anchor="middle" font-size="11" font-weight="900" fill="${isUnlocked ? '#ffffff' : '#94a3b8'}" font-family="'IBM Plex Mono', monospace">${badgeNum}</text>
        `;
        break;

      case 'trofeu_ouro':
      default:
        innerIcon = `
          <polygon points="36,8 58,20 58,52 36,64 14,52 14,20" fill="url(#${bgGradId})" stroke="${cor}" stroke-width="2.5"/>
          <path d="M26 22h20v12a10 10 0 0 1-20 0z" fill="${isUnlocked ? '#b45309' : '#1e293b'}" stroke="${isUnlocked ? '#fde047' : '#94a3b8'}" stroke-width="2"/>
          <path d="M26 26h-4a4 4 0 0 0 4 4M46 26h4a4 4 0 0 1-4 4" stroke="${isUnlocked ? '#fde047' : '#64748b'}" stroke-width="2"/>
          <text x="36" y="58" text-anchor="middle" font-size="10" font-weight="900" fill="${isUnlocked ? '#fef08a' : '#94a3b8'}" font-family="'IBM Plex Mono', monospace">${badgeNum}</text>
        `;
    }

    return `<svg class="badge-icon-svg" viewBox="0 0 72 72" width="72" height="72" xmlns="http://www.w3.org/2000/svg">${defs}${innerIcon}</svg>`;
  }

  // --- ENGINE DE AVALIAÇÃO DE CONQUISTAS ---
  function evaluateAchievements(logs, stats, editalProgress) {
    const unlockedMap = {};
    const progressMap = {};

    // 1. Extração de métricas dos logs
    let totalMins = 0;
    let totalQts = 0;
    let totalAcertos = 0;
    let totalPaginas = 0;
    let totalRevisoes = 0;
    let maxHorasDia = 0;
    let hasSimulado = false;
    let hasNoturno = false;
    let hasMatutino = false;

    const dailyMins = {};
    const daysStudied = new Set();

    logs.forEach(l => {
      let tm = 0;
      if (typeof l.tempo === 'string' && l.tempo.includes(':')) {
        const parts = l.tempo.split(':').map(Number);
        tm = (parts[0] || 0) * 60 + (parts[1] || 0) + (parts[2] || 0) / 60;
      } else {
        tm = parseInt(l.tempo || 0);
      }

      const q = parseInt(l.qts || 0);
      const a = parseInt(l.acertos || 0);
      const p = parseInt(l.paginas || 0);
      const isRev = (l.categoria || '').toLowerCase().includes('revis') || (l.mat || '') === 'RLM/REV';
      const isSim = (l.categoria || '').toLowerCase().includes('simulado') || (l.assunto || '').toLowerCase().includes('simulado') || q >= 40;

      totalMins += tm;
      totalQts += q;
      totalAcertos += a;
      totalPaginas += p;
      if (isRev) totalRevisoes++;
      if (isSim) hasSimulado = true;

      if (l.hora) {
        const h = parseInt(l.hora.split(':')[0]);
        if (h >= 22 || h < 4) hasNoturno = true;
        if (h >= 4 && h < 7) hasMatutino = true;
      }

      if (l.date) {
        daysStudied.add(l.date);
        dailyMins[l.date] = (dailyMins[l.date] || 0) + tm;
      }
    });

    Object.values(dailyMins).forEach(m => {
      const h = m / 60;
      if (h > maxHorasDia) maxHorasDia = h;
    });

    const totalHoras = totalMins / 60;

    // Cálculo do streak
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;
    const sortedDates = Array.from(daysStudied).sort();
    let prevDate = null;
    sortedDates.forEach(dStr => {
      if (!prevDate) {
        tempStreak = 1;
      } else {
        const pd = new Date(prevDate + 'T00:00:00');
        const curr = new Date(dStr + 'T00:00:00');
        pd.setDate(pd.getDate() + 1);
        if (pd.getTime() === curr.getTime()) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      if (tempStreak > maxStreak) maxStreak = tempStreak;
      prevDate = dStr;
    });

    const hasPlan = !!localStorage.getItem('delta_custom_plans') || !!localStorage.getItem('delta_edital_verticalizado');
    const plansCount = hasPlan ? 1 : 0;

    // Avaliação individual
    CONQUISTAS_DEF.forEach(c => {
      let currentVal = 0;
      let isUnlocked = false;

      switch (c.requisitoTipo) {
        case 'streak':
          currentVal = Math.max(maxStreak, currentStreak);
          isUnlocked = currentVal >= c.requisitoQtd;
          break;
        case 'primeira_questao':
          currentVal = totalQts > 0 ? 1 : 0;
          isUnlocked = totalQts > 0;
          break;
        case 'primeira_revisao':
          currentVal = totalRevisoes > 0 ? 1 : 0;
          isUnlocked = totalRevisoes > 0;
          break;
        case 'plano_criado':
          currentVal = plansCount;
          isUnlocked = plansCount >= 1;
          break;
        case 'primeiro_registro':
          currentVal = logs.length > 0 ? 1 : 0;
          isUnlocked = logs.length > 0;
          break;
        case 'onboarding':
          currentVal = logs.length > 0 ? 1 : 0;
          isUnlocked = logs.length > 0;
          break;
        case 'semana_perfeita':
          currentVal = maxStreak >= 7 ? 7 : maxStreak;
          isUnlocked = maxStreak >= 7;
          break;
        case 'simulado':
          currentVal = hasSimulado ? 1 : 0;
          isUnlocked = hasSimulado;
          break;
        case 'horas_dia':
          currentVal = Math.floor(maxHorasDia);
          isUnlocked = maxHorasDia >= c.requisitoQtd;
          break;
        case 'noturno':
          currentVal = hasNoturno ? 1 : 0;
          isUnlocked = hasNoturno;
          break;
        case 'matutino':
          currentVal = hasMatutino ? 1 : 0;
          isUnlocked = hasMatutino;
          break;
        case 'horas_total':
          currentVal = Math.floor(totalHoras);
          isUnlocked = totalHoras >= c.requisitoQtd;
          break;
        case 'questoes_total':
          currentVal = totalQts;
          isUnlocked = totalQts >= c.requisitoQtd;
          break;
        case 'paginas_total':
          currentVal = totalPaginas;
          isUnlocked = totalPaginas >= c.requisitoQtd;
          break;
        case 'revisoes_total':
          currentVal = totalRevisoes;
          isUnlocked = totalRevisoes >= c.requisitoQtd;
          break;
        default:
          isUnlocked = false;
      }

      unlockedMap[c.id] = isUnlocked;
      progressMap[c.id] = {
        current: currentVal,
        target: c.requisitoQtd,
        pct: Math.min(100, Math.round((currentVal / c.requisitoQtd) * 100))
      };
    });

    return { unlockedMap, progressMap };
  }

  // --- RENDERIZAÇÃO DA PÁGINA DE CONQUISTAS ---
  function renderConquistasView(containerId, logs, stats, editalProgress) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const { unlockedMap, progressMap } = evaluateAchievements(logs, stats, editalProgress);

    // Agrupamento por categoria
    const categoriesOrder = [
      { id: 'trilha_inicial', title: 'TRILHA INICIAL', desc: 'Primeiras ações que marcam o início da sua jornada de estudos.' },
      { id: 'medalhas', title: 'MEDALHAS', desc: 'Conquistas pelos momentos marcantes da sua jornada.' },
      { id: 'constancia', title: 'CONSTÂNCIA', desc: 'Conquistas para quem mantém a sua sequência de estudos todos os dias.' },
      { id: 'horas', title: 'HORAS DE ESTUDO', desc: 'Conquistas para quem acumula tempo real de dedicação.' },
      { id: 'questoes', title: 'QUESTÕES RESOLVIDAS', desc: 'Conquistas para quem treina com prática e melhora o desempenho.' },
      { id: 'paginas', title: 'PÁGINAS LIDAS', desc: 'Conquistas para quem constrói repertório e domina o conteúdo.' },
      { id: 'revisoes', title: 'REVISÕES FEITAS', desc: 'Conquistas para quem revisa e fixa o aprendizado.' }
    ];

    let html = `
      <div class="conquistas-header-banner">
        <div class="chb-text">
          <h1>🏆 Suas Conquistas</h1>
          <p>Acompanhe suas medalhas e celebre sua evolução a cada etapa da preparação!</p>
        </div>
        <button class="btn-celebrar-modal" onclick="DeltaConquistas.openWelcomeModal()">🏅 Ver Destaques</button>
      </div>
    `;

    categoriesOrder.forEach(cat => {
      const items = CONQUISTAS_DEF.filter(c => c.categoria === cat.id);
      const unlockedCount = items.filter(c => unlockedMap[c.id]).length;
      const totalCount = items.length;
      const catPct = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

      html += `
        <div class="conquistas-category-group">
          <div class="cat-header">
            <div>
              <div class="cat-title-row">
                <span class="cat-dot" style="background:${items[0] ? items[0].cor : 'var(--brand)'};"></span>
                <h3 class="cat-title">${cat.title}</h3>
              </div>
              <p class="cat-desc">${cat.desc}</p>
            </div>
            <div class="cat-stats-badge">
              <span class="cat-count">${unlockedCount} de ${totalCount}</span>
              <div class="cat-progress-mini">
                <div class="cat-progress-fill" style="width:${catPct}%; background:${items[0] ? items[0].cor : 'var(--green)'};"></div>
              </div>
            </div>
          </div>

          <div class="conquistas-grid">
            ${items.map(c => {
              const isUnlocked = unlockedMap[c.id];
              const prog = progressMap[c.id];
              const svg = getBadgeSVG(c, isUnlocked);
              const statusClass = isUnlocked ? 'unlocked' : 'locked';
              const remaining = Math.max(0, prog.target - prog.current);

              return `
                <div class="conquista-card ${statusClass}">
                  <div class="cc-badge-wrap">
                    ${svg}
                  </div>
                  <div class="cc-info">
                    <h4 class="cc-title">${c.titulo}</h4>
                    <p class="cc-desc">${c.desc}</p>
                    <div class="cc-status-footer">
                      ${isUnlocked 
                        ? `<span class="badge-conquistado">✨ Conquistado</span>` 
                        : `<div class="cc-progress-wrap">
                            <span class="cc-faltam">Faltam ${remaining} ${c.unidade}</span>
                            <div class="cc-bar-track">
                              <div class="cc-bar-fill" style="width:${prog.pct}%;"></div>
                            </div>
                          </div>`
                      }
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  // --- MODAL DE DESTAQUES (MODAL ESTUDEI) ---
  function openWelcomeModal() {
    let modal = document.getElementById('modalConquistasWelcome');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modalConquistasWelcome';
      modal.className = 'modal-overlay';
      modal.onclick = function(e) { if(e.target === modal) DeltaConquistas.closeWelcomeModal(); };
      modal.innerHTML = `
        <div class="modal-content modal-conquistas-content">
          <div class="mc-trophy-hero">
            <div class="mc-trophy-cluster">
              <div class="mc-badge-side">${getBadgeSVG({id:'m1', icone:'fogo', cor:'#f59e0b'}, true)}</div>
              <div class="mc-badge-center">${getBadgeSVG({id:'m2', icone:'bussola', cor:'#3b82f6'}, true)}</div>
              <div class="mc-badge-side">${getBadgeSVG({id:'m3', icone:'prancheta', cor:'#a855f7'}, true)}</div>
            </div>
          </div>
          <div class="mc-body text-center">
            <h2>Chegaram as conquistas no AVA! 🏅</h2>
            <p>Agora você pode receber medalhas que são desbloqueadas pelas suas ações no Ambiente Virtual. Celebre sua evolução em cada etapa!</p>
          </div>
          <div class="mc-footer">
            <button class="btn-util" onclick="DeltaConquistas.closeWelcomeModal()">Agora não</button>
            <button class="btn-save" onclick="DeltaConquistas.closeWelcomeModal(); switchView('conquistas');">Acesse suas conquistas</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
    modal.style.display = 'flex';
  }

  function closeWelcomeModal() {
    const modal = document.getElementById('modalConquistasWelcome');
    if (modal) modal.style.display = 'none';
  }

  // Exposição Global
  window.DeltaConquistas = {
    CONQUISTAS_DEF,
    getBadgeSVG,
    evaluateAchievements,
    renderConquistasView,
    openWelcomeModal,
    closeWelcomeModal
  };

})();
