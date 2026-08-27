/**
 * AVA Delta — Módulo de Revisões e Flashcards SRS Integrado ao Dashboard
 * Verifica cartões devidos no FSRS (atena_srs), permite revisar todos embaralhados
 * ou por matéria, calcula aproveitamento e exibe alerta para re-revisar no mesmo dia
 * caso a média fique abaixo do esperado.
 */

(function() {
  'use strict';

  // Baralhos de questões padrão da base oficial Atena (77 cartões)
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
        { id: 'dp14', deckId: 'dp', assunto: 'Teoria Finalista (Welzel)', frente: 'Na teoria finalista (adotada no CP), onde ficam o dolo e a culpa e quais os 3 elementos da culpabilidade?', verso: 'Dolo e culpa ficam na CONDUTA (fato típico). A culpabilidade é normativa pura, composta pelo IPE: Imputabilidade, Potencial consciência da ilicitude e Exigibilidade de conduta diversa.' },
        { id: 'dp15', deckId: 'dp', assunto: 'Dolo Normativo vs Dolo Natural', frente: 'Qual a diferença entre o Dolo Normativo (Causalismo) e o Dolo Natural (Finalismo)?', verso: 'Dolo Normativo (Causalismo): Ficava na culpabilidade e continha a consciência da ilicitude (dolus malus). Dolo Natural (Finalismo): Fica no fato típico e é composto apenas por CONSCIÊNCIA e VONTADE.' }
      ]
    },
    {
      id: 'dpp',
      titulo: 'Dir. Processual Penal',
      sigla: 'DPP',
      cards: [
        { id: 'dpp1', deckId: 'dpp', assunto: 'Inquérito Policial', frente: 'O delegado de polícia pode mandar arquivar os autos de inquérito se não achar provas?', verso: 'NÃO. O arquivamento é de competência do Ministério Público / Juiz, JAMAIS da autoridade policial (Art. 17, CPP).' },
        { id: 'dpp2', deckId: 'dpp', assunto: 'Prisão em Flagrante', frente: 'Qualquer do povo DEVE prender quem quer que seja encontrado em flagrante delito?', verso: 'NÃO. O cidadão comum PODE prender (faculdade). Quem DEVE prender é a autoridade policial e seus agentes.' },
        { id: 'dpp3', deckId: 'dpp', assunto: 'Ação Penal', frente: 'A representação do ofendido na ação penal pública condicionada pode ser retratada após o oferecimento da denúncia?', verso: 'NÃO. A retratação só é possível ATÉ o oferecimento da denúncia (Art. 25, CPP).' },
        { id: 'dpp4', deckId: 'dpp', assunto: 'Provas', frente: 'São inadmissíveis as provas derivadas das ilícitas, sem qualquer exceção?', verso: 'NÃO. Há exceções: fonte independente e descoberta inevitável.' },
        { id: 'dpp5', deckId: 'dpp', assunto: 'Prisão Preventiva', frente: 'Pode ser decretada prisão preventiva como antecipação de cumprimento de pena?', verso: 'NÃO. A prisão preventiva não pode ter finalidade de antecipação de pena (Art. 313, §2º).' },
        { id: 'dpp6', deckId: 'dpp', assunto: 'Acordo de Não Persecução', frente: 'O ANPP cabe em crimes cometidos com violência ou grave ameaça?', verso: 'NÃO. O ANPP exige infração sem violência ou grave ameaça e pena mínima < 4 anos.' },
        { id: 'dpp7', deckId: 'dpp', assunto: 'Inquérito Policial', frente: 'É garantido ao advogado acessar os autos do inquérito de forma irrestrita, inclusive diligências em andamento?', verso: 'NÃO. O acesso abrange apenas os elementos JÁ DOCUMENTADOS (Súmula Vinculante 14).' },
        { id: 'dpp8', deckId: 'dpp', assunto: 'Competência', frente: 'O juízo competente para julgar estelionato por cheque sem fundo é o do local de recusa?', verso: 'SIM. Súmula 521 STF / Art. 70, §4º, CPP (Local da agência bancária sacada).' },
        { id: 'dpp9', deckId: 'dpp', assunto: 'Prisão Temporária', frente: 'A prisão temporária pode ser decretada de ofício pelo Juiz?', verso: 'NÃO. Depende SEMPRE de representação da autoridade policial ou requerimento do MP.' },
        { id: 'dpp10', deckId: 'dpp', assunto: 'Provas', frente: 'O juiz pode fundamentar sua decisão EXCLUSIVAMENTE nos elementos informativos do Inquérito?', verso: 'NÃO. Vedação expressa no art. 155, CPP (salvo provas cautelares, não repetíveis e antecipadas).' }
      ]
    },
    {
      id: 'dc',
      titulo: 'Direito Constitucional',
      sigla: 'DC',
      cards: [
        { id: 'dc1', deckId: 'dc', assunto: 'Eficácia das Normas', frente: 'A norma que garante o direito de greve no serviço público é de eficácia plena?', verso: 'NÃO. É de eficácia LIMITADA, dependendo de lei específica para seu exercício.' },
        { id: 'dc2', deckId: 'dc', assunto: 'Habeas Corpus', frente: 'Cabe Habeas Corpus contra punição disciplinar militar?', verso: 'NÃO. Salvo para questionar os pressupostos de legalidade (hierarquia, poder de punir), mas não o mérito.' },
        { id: 'dc3', deckId: 'dc', assunto: 'Remédios Constitucionais', frente: 'O Mandado de Injunção serve para suprir falta de norma regulamentadora de qualquer direito?', verso: 'NÃO. Apenas para direitos, liberdades constitucionais, nacionalidade, soberania e cidadania.' },
        { id: 'dc4', deckId: 'dc', assunto: 'Segurança Pública', frente: 'As guardas municipais fazem parte do rol dos órgãos de segurança pública stricto sensu (Art. 144, incisos I a VI)?', verso: 'NÃO. Estão previstas no §8º do Art. 144, com função de proteção de bens, serviços e instalações.' },
        { id: 'dc5', deckId: 'dc', assunto: 'CPI', frente: 'A CPI pode determinar quebra de sigilo bancário sem autorização judicial?', verso: 'SIM. A CPI possui poderes de investigação próprios das autoridades judiciais (cláusula de reserva de jurisdição atenuada).' },
        { id: 'dc6', deckId: 'dc', assunto: 'Extradição', frente: 'O brasileiro nato pode ser extraditado se o crime foi cometido no exterior?', verso: 'NÃO. O brasileiro nato NUNCA pode ser extraditado.' },
        { id: 'dc7', deckId: 'dc', assunto: 'CPI', frente: 'A CPI pode decretar prisão preventiva de testemunha que mente?', verso: 'NÃO. CPI não pode decretar prisão, exceto em flagrante delito.' },
        { id: 'dc8', deckId: 'dc', assunto: 'Competência', frente: 'A segurança viária nas rodovias federais é de competência da Polícia Federal?', verso: 'NÃO. É de competência da Polícia Rodoviária Federal.' },
        { id: 'dc9', deckId: 'dc', assunto: 'Súmula Vinculante', frente: 'Qualquer pessoa pode propor a edição, revisão ou cancelamento de Súmula Vinculante?', verso: 'NÃO. Apenas os legitimados da Ação Direta de Inconstitucionalidade (Art. 103) e outros específicos.' },
        { id: 'dc10', deckId: 'dc', assunto: 'Mandado de Segurança', frente: 'Cabe mandado de segurança contra lei em tese?', verso: 'NÃO. Salvo se a lei produzir efeitos concretos imediatos (Súmula 266 STF).' },
        { id: 'dc11', deckId: 'dc', assunto: 'Classificação das Constituições', frente: 'A Constituição Outorgada tem participação popular em sua elaboração, enquanto a Cesarista não tem?', verso: 'NÃO. Nenhuma tem participação na elaboração. A diferença é que a Cesarista (ex: Napoleão) prevê RATIFICAÇÃO POPULAR POSTERIOR (plebiscito de fachada). A Outorgada é 100% imposta (ex: 1824, 1937, 1967).' }
      ]
    },
    {
      id: 'da',
      titulo: 'Dir. Administrativo',
      sigla: 'DA',
      cards: [
        { id: 'da1', deckId: 'da', assunto: 'Atos Administrativos', frente: 'A revogação de um ato administrativo produz efeitos ex tunc (retroativos)?', verso: 'NÃO. A revogação produz efeitos EX NUNC (daqui para frente). A anulação é que produz efeitos ex tunc.' },
        { id: 'da2', deckId: 'da', assunto: 'Poder de Polícia', frente: 'O poder de polícia pode ser delegado integralmente à iniciativa privada?', verso: 'NÃO. STF decidiu que apenas fases de consentimento, fiscalização e sanção (em empresas públicas/sociedade economia mista que prestam serviço público em regime não concorrencial) podem, mas nunca legislar/ordem.' },
        { id: 'da3', deckId: 'da', assunto: 'Responsabilidade Civil', frente: 'A responsabilidade civil do Estado por conduta omissiva é sempre objetiva?', verso: 'NÃO. Via de regra, a omissão estatal enseja responsabilidade SUBJETIVA (teoria da culpa do serviço/faute du service).' },
        { id: 'da4', deckId: 'da', assunto: 'Atributos do Ato', frente: 'A presunção de legitimidade dos atos administrativos é absoluta?', verso: 'NÃO. É presunção RELATIVA (juris tantum), admitindo prova em contrário.' },
        { id: 'da5', deckId: 'da', assunto: 'Poder Disciplinar', frente: 'O poder disciplinar abrange a aplicação de multa a um cidadão por excesso de velocidade?', verso: 'NÃO. Multa de trânsito é exercício do Poder de POLÍCIA (vínculo geral). Poder Disciplinar exige vínculo específico (servidor ou contratado).' },
        { id: 'da6', deckId: 'da', assunto: 'Concessão', frente: 'A concessão de serviço público exige lei autorizadora e licitação na modalidade concorrência ou diálogo competitivo?', verso: 'SIM. Sempre exige licitação nas modalidades concorrência ou diálogo.' },
        { id: 'da7', deckId: 'da', assunto: 'Improbidade', frente: 'Após a Lei 14.230/21, admite-se ato de improbidade administrativa culposo?', verso: 'NÃO. A nova lei exige DOLO ESPECÍFICO para todas as modalidades.' },
        { id: 'da8', deckId: 'da', assunto: 'Agentes Públicos', frente: 'É permitida a acumulação remunerada de um cargo de professor com outro técnico ou científico?', verso: 'SIM, desde que haja compatibilidade de horários (Art. 37, XVI, CF).' },
        { id: 'da9', deckId: 'da', assunto: 'Licitação', frente: 'Na inexigibilidade de licitação, a competição é inviável, mas há vários possíveis fornecedores?', verso: 'NÃO. Inexigibilidade decorre justamente da inviabilidade de competição (ex: fornecedor exclusivo, artista consagrado).' },
        { id: 'da10', deckId: 'da', assunto: 'Bens Públicos', frente: 'Os bens de uso comum do povo e de uso especial são alienáveis?', verso: 'NÃO. São inalienáveis enquanto mantiverem essa destinação. Só alienáveis após desafetação.' }
      ]
    },
    {
      id: 'lpe',
      titulo: 'Leg. Penal Especial',
      sigla: 'LPE',
      cards: [
        { id: 'lpe1', deckId: 'lpe', assunto: 'Maria da Penha', frente: 'A Lei Maria da Penha (Lei 11.340) aplica-se somente quando a vítima for mulher e o agressor for homem?', verso: 'NÃO. O agressor pode ser de qualquer gênero (inclusive outra mulher), desde que a violência seja baseada em gênero contra a mulher.' },
        { id: 'lpe2', deckId: 'lpe', assunto: 'Lei de Drogas', frente: 'O crime de porte de drogas para consumo pessoal (Art. 28) é punido com pena de prisão?', verso: 'NÃO. Não há pena privativa de liberdade. Apenas advertência, prestação de serviços ou medida educativa (despenalização).' },
        { id: 'lpe3', deckId: 'lpe', assunto: 'Estatuto do Desarmamento', frente: 'O porte de arma de fogo de uso permitido, se a arma estiver desmuniciada, não é crime?', verso: 'NÃO. O STF e STJ consideram crime de perigo abstrato. É CRIME mesmo desmuniciada.' },
        { id: 'lpe4', deckId: 'lpe', assunto: 'Crime de Tortura', frente: 'O crime de tortura é inafiançável e imprescritível?', verso: 'NÃO. É inafiançável, insuscetível de graça ou anistia. MAS É PRESCRITÍVEL (apenas racismo e ação de grupos armados são imprescritíveis).' },
        { id: 'lpe5', deckId: 'lpe', assunto: 'Crimes Hediondos', frente: 'O roubo com restrição de liberdade da vítima (sequestro relâmpago) é considerado crime hediondo?', verso: 'SIM. Incluído pelo Pacote Anticrime na Lei 8.072/90.' },
        { id: 'lpe6', deckId: 'lpe', assunto: 'ECA', frente: 'Vender bebida alcoólica para adolescente é apenas infração administrativa?', verso: 'NÃO. É CRIME previsto no ECA (Art. 243) com pena de detenção.' },
        { id: 'lpe7', deckId: 'lpe', assunto: 'Abuso de Autoridade', frente: 'Existe crime de abuso de autoridade culposo na Lei 13.869/19?', verso: 'NÃO. Todos os crimes da lei de abuso exigem DOLO ESPECÍFICO.' },
        { id: 'lpe8', deckId: 'lpe', assunto: 'Lei de Drogas', frente: 'A associação para o tráfico (Art. 35) é considerada crime hediondo?', verso: 'NÃO. O tráfico (Art. 33) e financiamento (Art. 36) são equiparados a hediondos. A associação NÃO É.' },
        { id: 'lpe9', deckId: 'lpe', assunto: 'Crimes Ambientais', frente: 'Pessoas jurídicas podem ser responsabilizadas penalmente por crimes ambientais?', verso: 'SIM. Responsabilidade penal da pessoa jurídica é expressamente admitida na CF e na Lei 9.605/98.' },
        { id: 'lpe10', deckId: 'lpe', assunto: 'Organização Criminosa', frente: 'A infiltração policial em organização criminosa pode ser feita sem autorização judicial?', verso: 'NÃO. Exige, em qualquer hipótese, prévia autorização judicial motivada.' }
      ]
    },
    {
      id: 'dcv',
      titulo: 'Direito Civil',
      sigla: 'DCV',
      cards: [
        { id: 'dcv1', deckId: 'dcv', assunto: 'LINDB - Integração Normativa', frente: 'Na ausência de norma, o juiz aplicará a lei segundo a analogia, a equidade, os costumes e os princípios gerais do direito?', verso: 'NÃO. A ordem de integração (Art. 4º LINDB) é: 1º Analogia, 2º Costumes, 3º Princípios gerais de direito. A EQUIDADE NÃO ESTÁ NO ROL.' },
        { id: 'dcv2', deckId: 'dcv', assunto: 'LINDB - Subsunção x Integração', frente: 'A subsunção ocorre quando o juiz preenche uma lacuna da lei usando a analogia?', verso: 'NÃO. Subsunção é o enquadramento do fato à norma EXISTENTE. Preencher lacuna é INTEGRAÇÃO.' },
        { id: 'dcv3', deckId: 'dcv', assunto: 'Das Pessoas - Nascituro', frente: 'O STJ, na prática jurisprudencial, adota integralmente a Teoria Natalista descrita no art. 2º do CC?', verso: 'NÃO. O CC adota a Natalista na letra fria, mas o STJ tende para a Teoria CONCEPCIONISTA (reconhece danos morais por morte de nascituro e alimentos gravídicos).' },
        { id: 'dcv4', deckId: 'dcv', assunto: 'Capacidade Civil', frente: 'Após o Estatuto da Pessoa com Deficiência, quem são os absolutamente incapazes no Direito Civil brasileiro?', verso: 'APENAS os menores de 16 anos. Os enfermos/deficientes mentais saíram do rol e agora são capazes ou relativamente incapazes.' },
        { id: 'dcv5', deckId: 'dcv', assunto: 'Desconsideração da PJ', frente: 'Para ocorrer a desconsideração da Personalidade Jurídica (Art. 50, CC), basta demonstrar a insolvência ou encerramento irregular da empresa?', verso: 'NÃO. A regra (Teoria Maior) exige ABUSO DA PERSONALIDADE, caracterizado por Desvio de Finalidade OU Confusão Patrimonial.' },
        { id: 'dcv6', deckId: 'dcv', assunto: 'Desconsideração Direta x Inversa', frente: 'Na desconsideração INVERSA da personalidade jurídica, os bens da pessoa jurídica respondem por dívidas pessoais do sócio?', verso: 'SIM. É muito comum em varas de Família (ex: sócio oculta patrimônio na empresa para fugir de partilha ou pensão).' }
      ]
    },
    {
      id: 'ml',
      titulo: 'Medicina Legal',
      sigla: 'ML',
      cards: [
        { id: 'ml1', deckId: 'ml', assunto: 'Corpo de Delito', frente: 'Se houver trauma (energia atingiu o corpo) mas não houver lesão constatável (nenhum vestígio físico), o crime a ser registrado é Lesão Corporal leve?', verso: 'NÃO. Sem vestígio, o laudo será negativo. A conduta deve ser desclassificada para VIAS DE FATO (Art. 21 da LCP).' },
        { id: 'ml2', deckId: 'ml', assunto: 'Peritos', frente: 'Na ausência de perito oficial, o exame de corpo de delito pode ser feito por apenas 1 (uma) pessoa idônea com diploma superior?', verso: 'NÃO. Na falta de perito oficial (onde 1 basta), exige-se a nomeação de 2 (DUAS) pessoas idôneas com curso superior (Art. 159, §1º, CPP).' },
        { id: 'ml3', deckId: 'ml', assunto: 'Documentos Médico-Legais', frente: "O 'Parecer' é o exame direto e minucioso realizado pelo perito no corpo da vítima, reduzido a termo?", verso: 'NÃO. Isso é o RELATÓRIO/LAUDO. O Parecer é apenas uma OPINIÃO TÉCNICA sobre um exame/laudo já realizado por outro profissional.' },
        { id: 'ml4', deckId: 'ml', assunto: 'Infortunística', frente: 'O acidente de percurso (trajeto de casa para o trabalho) é equiparado a acidente de trabalho, garantindo direitos previdenciários?', verso: 'SIM. É o chamado acidente atípico (ou por equiparação), mesmo ocorrendo fora das dependências e do horário de trabalho.' },
        { id: 'ml5', deckId: 'ml', assunto: 'Traumatologia', frente: 'Qual a diferença conceitual entre Trauma e Lesão na Medicina Legal?', verso: 'TRAUMA é a CAUSA (a energia ou objeto que atinge o corpo, ex: projétil, soco). LESÃO é o EFEITO (o dano ou alteração estrutural no corpo, ex: fratura, equimose).' }
      ]
    }
  ];

  // --- CARREGAMENTO DE TODOS OS CARTÕES E DO ESTADO FSRS ---
  function getAllCards() {
    let all = [];
    
    // 1. Ler Overrides salvos pelo usuário (edições de cartões padrão)
    let overrides = {};
    try {
      const rawOverrides = localStorage.getItem('atena_card_overrides');
      if (rawOverrides) overrides = JSON.parse(rawOverrides);
    } catch(e) {}

    BANCOS_PADRAO.forEach(deck => {
      deck.cards.forEach(c => {
        const cardOverride = overrides[c.id];
        if (cardOverride && cardOverride._deleted) return; // Cartão ocultado/excluído
        const merged = cardOverride ? { ...c, ...cardOverride } : c;
        all.push({ ...merged, deckTitle: deck.titulo, sigla: deck.sigla });
      });
    });

    // 2. Custom Decks
    try {
      const customDecksRaw = localStorage.getItem('atena_custom_decks');
      if (customDecksRaw) {
        const cDecks = JSON.parse(customDecksRaw);
        if (Array.isArray(cDecks)) {
          cDecks.forEach(cd => {
            if (cd.cards && Array.isArray(cd.cards)) {
              cd.cards.forEach(c => {
                all.push({ ...c, deckTitle: cd.titulo, sigla: cd.sigla || 'CUST' });
              });
            }
          });
        }
      }
    } catch(e) {}

    // 3. Custom Cards
    try {
      const customRaw = localStorage.getItem('atena_custom_cards');
      if (customRaw) {
        const customCards = JSON.parse(customRaw);
        if (Array.isArray(customCards)) {
          customCards.forEach(c => {
            if (!all.some(existing => existing.id === c.id)) {
              const deckMatch = BANCOS_PADRAO.find(d => d.id === c.deckId);
              all.push({
                ...c,
                deckTitle: deckMatch ? deckMatch.titulo : (c.assunto || 'Personalizados'),
                sigla: deckMatch ? deckMatch.sigla : 'CUST'
              });
            }
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

  // --- OBTENÇÃO DOS CARTÕES DEVIDOS HOJE (IDÊNTICO AO ATENA FLASHCARDS) ---
  function getDueCards(subjectFilter = null) {
    const allCards = getAllCards();
    const fsrs = getFSRSData();
    const now = Date.now();
    const studyMode = localStorage.getItem('atena_study_mode') || 'pos_edital';

    const dueCards = allCards.filter(card => {
      if (subjectFilter && card.deckId !== subjectFilter && card.sigla !== subjectFilter && card.deckTitle !== subjectFilter) {
        return false;
      }
      const srsInfo = fsrs[card.id];

      if (studyMode === 'gargalos') {
        return srsInfo && (srsInfo.lapses > 0 || srsInfo.flag === 'red' || card.flag === 'red' || srsInfo.difficulty >= 7);
      }

      if (!srsInfo || srsInfo.state === 0 || !srsInfo.reps || srsInfo.reps === 0) {
        // Cartão novo: sempre devido na primeira vez
        return true;
      }

      if (!srsInfo.nextReview) return true;
      return new Date(srsInfo.nextReview).getTime() <= now;
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
  let sessionStreak = 0;
  let isCardFlipped = false;
  let failedCardsInSession = [];
  
  // Timer de Latência de Recuperação por Cartão
  let cardStartTime = 0;
  let cardResponseTimeSec = 0;
  let cardTimerInterval = null;
  let sessionResponseTimes = [];

  const FLAG_COLORS = [
    { id: 'red', color: '#ef4444', label: 'Crítico' },
    { id: 'orange', color: '#f97316', label: 'Atenção' },
    { id: 'yellow', color: '#eab308', label: 'Médio' },
    { id: 'green', color: '#22c55e', label: 'Dominado' },
    { id: 'blue', color: '#3b82f6', label: 'Informativo' },
    { id: 'purple', color: '#a855f7', label: 'Decoreba' }
  ];

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
    sessionStreak = 0;
    failedCardsInSession = [];
    sessionResponseTimes = [];
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
      sessionStreak = 0;
      failedCardsInSession = [];
      sessionResponseTimes = [];
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
      document.body.appendChild(modal);
    }

    const studyModeKey = localStorage.getItem('atena_study_mode') || 'pos_edital';
    const modeNames = {
      'pos_edital': 'Reta Final (Pós-Edital)',
      'normal': 'Padrão (Pré-Edital)',
      'gargalos': 'Foco em Gargalos',
      'simulado': 'Simulado Direcionado'
    };
    const modeLabel = (modeNames[studyModeKey] || 'Pré-Edital').toUpperCase();

    const flagDotsHtml = FLAG_COLORS.map(f => 
      `<button class="flag-dot" style="background-color:${f.color};" title="Bandeira ${f.label}" onclick="DeltaRevisoes.setCardFlag('${f.id}')"></button>`
    ).join('');

    modal.innerHTML = `
      <div class="modal-content modal-review-box">
        <div class="mrh-header-top">
          <div>
            <div class="mrh-meta-mode" id="mrhModeLabel">REVISÕES DO DIA (${modeLabel})</div>
            <h3 class="mrh-card-title" id="mrhCounter">Cartão 1 de ${activeSessionCards.length || 1}</h3>
          </div>
          <div class="mrh-right-controls">
            <div class="mrh-flag-dots" id="mrhFlagDots">
              ${flagDotsHtml}
            </div>
            <div class="fc-streak-pill" title="Sequência de acertos">
              🔥 <span id="mrhStreak">${sessionStreak}</span>
            </div>
            <button onclick="DeltaRevisoes.closeReviewModal()" class="mrh-close-btn" title="Fechar">&times;</button>
          </div>
        </div>

        <div class="modal-body modal-review-body" id="reviewBodyContent">
          <!-- Conteúdo dinâmico do flashcard -->
        </div>
      </div>
    `;
    modal.style.display = 'flex';
  }

  function setCardFlag(flagId) {
    if (!activeSessionCards || activeSessionCards.length === 0) return;
    const card = activeSessionCards[currentCardIndex];
    if (!card) return;

    try {
      const fsrs = getFSRSData();
      if (!fsrs[card.id]) {
        fsrs[card.id] = { id: card.id, difficulty: 5.0, stability: 1.0, reps: 0, lapses: 0, state: 0, flag: flagId };
      } else {
        fsrs[card.id].flag = fsrs[card.id].flag === flagId ? null : flagId;
      }
      saveFSRSData(fsrs);
    } catch(e) {}
  }

  function closeReviewModal() {
    if (cardTimerInterval) {
      clearInterval(cardTimerInterval);
      cardTimerInterval = null;
    }
    const modal = document.getElementById('modalReviewPlayer');
    if (modal) modal.style.display = 'none';
    renderRevisoesDashboard('dashRevisoesContainer');
    if (window.renderDashboardEstudei) window.renderDashboardEstudei();
  }

  function formatClozeFront(text) {
    return formatRichCardText(text, false);
  }

  function formatClozeBack(text) {
    return formatRichCardText(text, true);
  }

  function highlightKeywords(text) {
    return formatRichCardText(text, true);
  }

  function formatRichCardText(text, isBack) {
    if (!text) return '';

    // 1. Processar Callout Boxes (:::sumula ... :::)
    text = text.replace(/:::([a-z]+)\n?([\s\S]*?):::/gi, function(_, type, content) {
      let icon = '📖';
      let title = 'Informação';
      let boxClass = 'callout-default';
      const t = (type || '').toLowerCase();
      if (t === 'sumula' || t === 'jurisprudencia' || t === 'stf' || t === 'stj') {
        icon = '⚖️';
        title = 'Súmula / Jurisprudência (STF/STJ)';
        boxClass = 'callout-sumula';
      } else if (t === 'lei' || t === 'leiseca' || t === 'artigo') {
        icon = '📜';
        title = 'Letra da Lei (Artigo / Dispositivo)';
        boxClass = 'callout-lei';
      } else if (t === 'pegadinha' || t === 'cuidado' || t === 'alerta') {
        icon = '⚠️';
        title = 'Pegadinha da Banca / Cuidado!';
        boxClass = 'callout-pegadinha';
      } else if (t === 'dica' || t === 'macete' || t === 'mnemonico') {
        icon = '💡';
        title = 'Dica / Macete Mnemônico';
        boxClass = 'callout-dica';
      } else if (t === 'excecao' || t === 'vedado') {
        icon = '🛡️';
        title = 'Exceção à Regra / Proibição';
        boxClass = 'callout-excecao';
      }
      return `<div class="fc-callout-box ${boxClass}"><div class="fc-callout-header">${icon} <span>${title}</span></div><div class="fc-callout-content">${formatLineContent(content.trim(), isBack)}</div></div>`;
    });

    return formatLineContent(text, isBack);
  }

  function formatLineContent(rawText, isBack) {
    if (!rawText) return '';
    const lines = rawText.split('\n');
    const output = [];
    let currentList = null;

    const flushList = () => {
      if (!currentList) return;
      if (currentList.type === 'ul') {
        output.push(`<ul class="fc-bullet-list" style="margin:8px 0; padding-left:4px; list-style:none; text-align:left;">${currentList.items.map(item => `<li class="fc-bullet-item" style="display:flex; align-items:flex-start; gap:8px; margin-bottom:4px;"><span class="fc-bullet-dot" style="color:#ff6b00; font-weight:bold; font-size:16px; line-height:1; user-select:none; margin-top:2px;">•</span><span class="fc-item-txt" style="flex:1;">${parseInlineMarkup(item, isBack)}</span></li>`).join('')}</ul>`);
      } else {
        output.push(`<ol class="fc-ordered-list" style="margin:8px 0; padding-left:4px; list-style:none; text-align:left;">${currentList.items.map((item, idx) => `<li class="fc-ordered-item" style="display:flex; align-items:flex-start; gap:8px; margin-bottom:4px;"><span class="fc-ordered-num" style="color:#ff6b00; font-family:monospace; font-weight:bold; font-size:12px; user-select:none; min-width:18px; margin-top:2px;">${idx + 1}.</span><span class="fc-item-txt" style="flex:1;">${parseInlineMarkup(item, isBack)}</span></li>`).join('')}</ol>`);
      }
      currentList = null;
    };

    lines.forEach(line => {
      const trimmed = line.trim();
      const bulletMatch = line.match(/^(\s*)([-*•])\s+(.*)$/);
      const numMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);

      if (bulletMatch) {
        if (currentList && currentList.type !== 'ul') flushList();
        if (!currentList) currentList = { type: 'ul', items: [] };
        currentList.items.push(bulletMatch[3]);
      } else if (numMatch) {
        if (currentList && currentList.type !== 'ol') flushList();
        if (!currentList) currentList = { type: 'ol', items: [] };
        currentList.items.push(numMatch[3]);
      } else {
        flushList();
        if (trimmed === '') {
          output.push('<div class="fc-spacer-line" style="height:10px;"></div>');
        } else {
          output.push(`<div class="fc-text-line" style="min-height:1.4em; margin:2px 0;">${parseInlineMarkup(line, isBack)}</div>`);
        }
      }
    });

    flushList();
    return output.join('');
  }

  function parseInlineMarkup(text, isBack) {
    if (!text) return '';

    // Clozes
    if (!isBack) {
      text = text.replace(/\{\{c(\d+)::([^}:]+)(?:::([^}]+))?\}\}/g, function(_, num, answer, hint) {
        const label = hint ? `💡 ${hint}` : '[...]';
        const cleanAnswer = answer.trim();
        return `<span class="fc-cloze-badge" data-label="${label}" data-answer="${encodeURIComponent(cleanAnswer)}" onclick="event.stopPropagation(); this.classList.toggle('revealed'); this.innerText = this.classList.contains('revealed') ? decodeURIComponent(this.dataset.answer) : this.dataset.label;" title="Clique para revelar o termo">${label}</span>`;
      });
    } else {
      text = text.replace(/\{\{c(\d+)::([^}:]+)(?:::([^}]+))?\}\}/g, function(_, num, answer, hint) {
        return `<span class="fc-cloze-answer">${answer.trim()}</span>`;
      });
    }

    // Marca-texto
    text = text.replace(/<mark:([a-z]+)>([\s\S]*?)<\/mark>/gi, '<mark class="fc-mark-$1" style="padding:2px 6px; border-radius:6px; font-weight:700;">$2</mark>');
    text = text.replace(/==([\s\S]*?)==/g, '<mark class="fc-mark-yellow" style="background:rgba(254,240,138,0.8); color:#713f12; padding:2px 6px; border-radius:6px; font-weight:700;">$1</mark>');

    // Cores
    text = text.replace(/<color:([a-z#0-9]+)>([\s\S]*?)<\/color>/gi, '<span style="color:$1; font-weight:700;">$2</span>');

    // Negrito, Itálico, Sublinhado, Riscado
    text = text.replace(/\*\*([\s\S]*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/<b>([\s\S]*?)<\/b>/gi, '<strong>$1</strong>');
    text = text.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
    text = text.replace(/<i>([\s\S]*?)<\/i>/gi, '<em>$1</em>');
    text = text.replace(/<u>([\s\S]*?)<\/u>/gi, '<u style="text-decoration-color:#ff6b00; text-underline-offset:3px;">$1</u>');
    text = text.replace(/__([\s\S]*?)__/g, '<u style="text-decoration-color:#ff6b00; text-underline-offset:3px;">$1</u>');
    text = text.replace(/~~([\s\S]*?)~~/g, '<s style="opacity:0.6;">$1</s>');
    text = text.replace(/<s>([\s\S]*?)<\/s>/gi, '<s style="opacity:0.6;">$1</s>');

    // Links e Imagens
    text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<div class="fc-inline-img-box" style="margin:8px 0; text-align:center;"><img src="$2" alt="$1" class="fc-inline-img" style="max-height:220px; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.15);" /></div>');
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="fc-inline-link" style="color:#ff6b00; font-weight:700; text-decoration:underline;">$1 ↗</a>');

    if (isBack) {
      const KEYWORDS = ['Exceção', 'Súmula', 'Vedada', 'Proibida', 'Prazo', 'NÃO', 'INCONDICIONADA', 'GRAVE', 'SIM', 'SEMPRE', 'NUNCA', 'JAMAIS', 'APENAS', 'MAIOR', 'ROXIN', 'JAKOBS', 'EX TUNC', 'EX NUNC', 'DOLO ESPECÍFICO'];
      KEYWORDS.forEach(kw => {
        const reg = new RegExp(`\\b(${kw})\\b`, 'gi');
        text = text.replace(reg, `<span class="kw-highlight">$1</span>`);
      });
    }

    return text;
  }

  function renderActiveCard() {
    if (cardTimerInterval) {
      clearInterval(cardTimerInterval);
      cardTimerInterval = null;
    }

    const container = document.getElementById('reviewBodyContent');
    const counter = document.getElementById('mrhCounter');
    const streakEl = document.getElementById('mrhStreak');
    if (!container) return;

    if (currentCardIndex >= activeSessionCards.length) {
      renderSessionSummary();
      return;
    }

    const card = activeSessionCards[currentCardIndex];
    if (counter) counter.innerText = `Cartão ${currentCardIndex + 1} de ${activeSessionCards.length}`;
    if (streakEl) streakEl.innerText = sessionStreak;

    const fsrs = getFSRSData();
    const cardSrs = fsrs[card.id];
    let stateText = '🔵 Novo';
    let stateClass = 'state-new';

    if (cardSrs && cardSrs.reps > 0) {
      if (cardSrs.state === 1) {
        stateText = '🟠 Aprendizagem';
        stateClass = 'state-learning';
      } else if (cardSrs.state === 2) {
        stateText = '🟢 Revisão';
        stateClass = 'state-review';
      } else {
        stateText = '🟠 Aprendizagem';
        stateClass = 'state-learning';
      }
    }

    isCardFlipped = false;
    cardStartTime = Date.now();
    cardResponseTimeSec = 0;

    container.innerHTML = `
      <div class="fc-card-container">
        <div class="fc-badge-top">
          <div class="fc-badge-left">
            <span class="fc-subject-pill">${(card.assunto || card.sigla || 'MAT').toUpperCase()}</span>
            <span class="fc-state-pill ${stateClass}">${stateText}</span>
            <button class="fc-edit-btn-inline" onclick="DeltaRevisoes.openEditCardModal('${card.id}')" title="Editar este cartão agora">✏️ Editar</button>
          </div>
          <div class="fc-live-latency-pill pill-fluente" id="fcLiveTimerBox" title="Tempo de resposta ao vivo">
            <span>⏱️</span>
            <span id="fcCardLiveTimer">0.0s</span>
            <span id="fcLatencyText" class="latency-lbl">· Fluente</span>
          </div>
        </div>

        <div class="fc-front-box" id="fcFrontBox">
          <div class="fc-question-text">${formatClozeFront(card.frente)}</div>
        </div>

        <div class="fc-back-box" id="fcBackBox" style="display:none;">
          <div class="fc-back-header">
            <span class="fc-back-title">Gabarito & Fundamentação</span>
            <span class="fc-back-latency" id="fcFinalLatency">⏱️ 0.0s</span>
          </div>
          <div class="fc-answer-text">${highlightKeywords(card.verso)}</div>
        </div>

        <div class="fc-bottom-hint" id="fcBottomHint">
          Pressione <strong>Espaço</strong> ou botão abaixo para gabarito
        </div>
      </div>

      <!-- BOTÃO DE REVELAR / AVALIAÇÃO FSRS -->
      <div id="fcActionArea" style="width:100%; margin-top:6px;">
        <button class="btn-reveal-orange" onclick="DeltaRevisoes.flipCurrentCard()">
          Revelar Gabarito (Espaço)
        </button>
      </div>

      <div class="fc-rating-buttons-bar" id="fcRatingBar" style="display:none;">
        <button class="btn-rate btn-rate-again" onclick="DeltaRevisoes.rateCard(1)">
          <span class="br-num">[1]</span>
          <span class="br-label">🔴 Errei</span>
          <span class="br-sub">10 min</span>
        </button>
        <button class="btn-rate btn-rate-hard" onclick="DeltaRevisoes.rateCard(2)">
          <span class="br-num">[2]</span>
          <span class="br-label">🟡 Difícil</span>
          <span class="br-sub">+1 dia</span>
        </button>
        <button class="btn-rate btn-rate-good" onclick="DeltaRevisoes.rateCard(3)">
          <span class="br-num">[3]</span>
          <span class="br-label">🟢 Bom</span>
          <span class="br-sub">+3 dias</span>
        </button>
        <button class="btn-rate btn-rate-easy" onclick="DeltaRevisoes.rateCard(4)">
          <span class="br-num">[4]</span>
          <span class="br-label">🔵 Fácil</span>
          <span class="br-sub">+7 dias</span>
        </button>
      </div>
    `;

    // Iniciar contagem do cronômetro em tempo real por cartão
    const timerLabel = document.getElementById('fcCardLiveTimer');
    const timerBox = document.getElementById('fcLiveTimerBox');
    const timerText = document.getElementById('fcLatencyText');

    cardTimerInterval = setInterval(() => {
      if (isCardFlipped) {
        clearInterval(cardTimerInterval);
        return;
      }
      const elapsed = ((Date.now() - cardStartTime) / 1000).toFixed(1);
      const elapsedNum = parseFloat(elapsed);
      if (timerLabel) timerLabel.innerText = `${elapsed}s`;

      if (timerBox && timerText) {
        if (elapsedNum <= 6.0) {
          timerBox.className = 'fc-live-latency-pill pill-fluente';
          timerText.innerText = '· Fluente';
        } else if (elapsedNum <= 15.0) {
          timerBox.className = 'fc-live-latency-pill pill-normal';
          timerText.innerText = '· Normal';
        } else {
          timerBox.className = 'fc-live-latency-pill pill-hesitacao';
          timerText.innerText = '· Hesitação';
        }
      }
    }, 100);
  }

  function flipCurrentCard() {
    if (isCardFlipped) return;
    isCardFlipped = true;

    if (cardTimerInterval) {
      clearInterval(cardTimerInterval);
      cardTimerInterval = null;
    }

    cardResponseTimeSec = Math.max(0.3, parseFloat(((Date.now() - cardStartTime) / 1000).toFixed(1)));
    sessionResponseTimes.push(cardResponseTimeSec);

    const backBox = document.getElementById('fcBackBox');
    const bottomHint = document.getElementById('fcBottomHint');
    const actionArea = document.getElementById('fcActionArea');
    const ratingBar = document.getElementById('fcRatingBar');
    const finalLatency = document.getElementById('fcFinalLatency');

    if (backBox) backBox.style.display = 'flex';
    if (bottomHint) bottomHint.style.display = 'none';
    if (actionArea) actionArea.style.display = 'none';
    if (ratingBar) ratingBar.style.display = 'grid';
    if (finalLatency) finalLatency.innerText = `⏱️ ${cardResponseTimeSec}s`;

    // Rolar suavemente para exibir a resposta
    setTimeout(() => {
      const reviewBody = document.getElementById('reviewBodyContent');
      if (reviewBody) {
        reviewBody.scrollTo({ top: reviewBody.scrollHeight, behavior: 'smooth' });
      }
    }, 50);
  }

  // --- CLASSIFICAÇÃO FSRS DO CARTÃO COM CALIBRAÇÃO DE LATÊNCIA ---
  function rateCard(rating) {
    if (cardTimerInterval) {
      clearInterval(cardTimerInterval);
      cardTimerInterval = null;
    }

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
    currentSrs.lastLatency = cardResponseTimeSec;

    let addDays = 1;
    if (rating === 1) {
      sessionStats.again++;
      sessionStreak = 0;
      currentSrs.lapses = (currentSrs.lapses || 0) + 1;
      currentSrs.stability = Math.max(0.4, (currentSrs.stability || 1) * 0.5);
      currentSrs.difficulty = Math.min(10, (currentSrs.difficulty || 5) + 1.0);
      currentSrs.state = 1; // Learning
      addDays = 0; // revisar hoje ainda
      failedCardsInSession.push(card);
    } else if (rating === 2) {
      sessionStats.hard++;
      sessionStreak = Math.max(0, sessionStreak);
      currentSrs.stability = (currentSrs.stability || 1) * 1.2;
      currentSrs.difficulty = Math.min(10, (currentSrs.difficulty || 5) + 0.5);
      currentSrs.state = 2;
      addDays = 1;
      failedCardsInSession.push(card);
    } else if (rating === 3) {
      sessionStats.good++;
      sessionStreak++;
      const multiplier = cardResponseTimeSec > 15.0 ? 1.6 : (cardResponseTimeSec <= 6.0 ? 2.8 : 2.4);
      currentSrs.stability = (currentSrs.stability || 1) * multiplier;
      currentSrs.state = 2; // Review
      if (cardResponseTimeSec > 15.0) {
        currentSrs.difficulty = Math.min(10, (currentSrs.difficulty || 5) + 0.3);
      }
      addDays = Math.max(2, Math.round(currentSrs.stability));
    } else if (rating === 4) {
      sessionStats.easy++;
      sessionStreak += 2;
      const multiplier = cardResponseTimeSec > 15.0 ? 2.2 : (cardResponseTimeSec <= 6.0 ? 4.5 : 3.8);
      currentSrs.stability = (currentSrs.stability || 1) * multiplier;
      currentSrs.difficulty = Math.max(1, (currentSrs.difficulty || 5) - 0.5);
      currentSrs.state = 2; // Review
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
    if (cardTimerInterval) {
      clearInterval(cardTimerInterval);
      cardTimerInterval = null;
    }

    const container = document.getElementById('reviewBodyContent');
    const counter = document.getElementById('mrhCounter');
    if (!container) return;

    if (counter) counter.innerText = 'Concluído';

    const total = sessionStats.total;
    const acertos = sessionStats.good + sessionStats.easy;
    const taxaAcerto = total > 0 ? Math.round((acertos / total) * 100) : 0;
    const isBelowAverage = taxaAcerto < 75; // Limite de 75%

    // Estatísticas de tempo real
    const totalTimeSec = sessionResponseTimes.reduce((acc, v) => acc + v, 0);
    const avgTimeSec = sessionResponseTimes.length > 0 ? (totalTimeSec / sessionResponseTimes.length).toFixed(1) : '0.0';
    const minTimeSec = sessionResponseTimes.length > 0 ? Math.min(...sessionResponseTimes).toFixed(1) : '0.0';
    const maxTimeSec = sessionResponseTimes.length > 0 ? Math.max(...sessionResponseTimes).toFixed(1) : '0.0';
    
    const totalMin = Math.floor(totalTimeSec / 60);
    const totalSecRemainder = Math.round(totalTimeSec % 60);
    const totalFormatted = totalMin > 0 ? `${totalMin}m ${totalSecRemainder}s` : `${totalSecRemainder}s`;

    // Formatar HH:MM:SS para registro no AVA
    const logHours = String(Math.floor(totalTimeSec / 3600)).padStart(2, '0');
    const logMins = String(Math.floor((totalTimeSec % 3600) / 60)).padStart(2, '0');
    const logSecs = String(Math.round(totalTimeSec % 60)).padStart(2, '0');
    const logTempoHMS = `${logHours}:${logMins}:${logSecs}`;

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
        tempo: logTempoHMS,
        qts: total,
        acertos: acertos,
        obs: `FSRS: ${sessionStats.easy} Fácil, ${sessionStats.good} Bom, ${sessionStats.hard} Difícil, ${sessionStats.again} Errei (${taxaAcerto}%) · Média: ${avgTimeSec}s/card`
      });
      localStorage.setItem('delta_estudos', JSON.stringify(logs));
    } catch (e) {
      console.error('Erro ao registrar sessão de revisão:', e);
    }

    container.innerHTML = `
      <div class="rev-summary-box">
        <div class="rs-trophy">${isBelowAverage ? '⚠️' : '🎉'}</div>
        <h3 class="rs-title">${isBelowAverage ? 'Revisão Concluída com Alerta' : 'Excelente Rendimento!'}</h3>
        <p class="rs-subtitle">Você revisou ${total} flashcards em <strong>${totalFormatted}</strong>.</p>

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
          <div class="rs-stat-item">
            <span class="rs-val" style="color:var(--brand);">${avgTimeSec}s</span>
            <span class="rs-lbl">Média / Card</span>
          </div>
        </div>

        <div style="background:var(--surface); border:1px solid var(--border); border-radius:var(--r-sm); padding:10px 14px; margin-bottom:18px; font-size:12px; color:var(--text-muted); display:flex; justify-content:space-around; font-family:var(--font-mono);">
          <span>⏱️ Total: <strong>${totalFormatted}</strong></span>
          <span>⚡ Mais Rápido: <strong style="color:var(--green);">${minTimeSec}s</strong></span>
          <span>⏳ Mais Demorado: <strong style="color:var(--amber);">${maxTimeSec}s</strong></span>
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
            ✨ Parabéns! Sua taxa de retenção foi de ${taxaAcerto}%. Seus intervalos foram expandidos com calibração precisa de tempo de resposta pelo algoritmo FSRS.
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

  // --- EDIÇÃO DE CARTÃO EM TEMPO REAL ---
  function openEditCardModal(cardId) {
    const card = activeSessionCards.find(c => c.id === cardId);
    if (!card) return;

    let editModal = document.getElementById('deltaInlineCardEditModal');
    if (!editModal) {
      editModal = document.createElement('div');
      editModal.id = 'deltaInlineCardEditModal';
      editModal.className = 'modal-backdrop';
      editModal.style.zIndex = '9999';
      document.body.appendChild(editModal);
    }

    editModal.innerHTML = `
      <div class="modal-content" style="max-width: 520px; border-radius: 24px;">
        <div class="modal-header">
          <div class="modal-title">
            <span>✏️</span>
            <h3>Editar Flashcard</h3>
          </div>
          <button class="modal-close" onclick="DeltaRevisoes.closeEditCardModal()">&times;</button>
        </div>
        <div class="modal-body" style="gap: 12px;">
          <div class="modal-group">
            <label>Tópico / Assunto</label>
            <input type="text" id="inlineEditAssunto" class="modal-input" value="${(card.assunto || '').replace(/"/g, '&quot;')}" />
          </div>
          <div class="modal-group">
            <label>Frente do Cartão (Pergunta ou Oclusão {{c1::termo}})</label>
            <textarea id="inlineEditFrente" class="modal-input" rows="3" style="resize:vertical;">${card.frente || ''}</textarea>
          </div>
          <div class="modal-group">
            <label>Verso do Cartão (Gabarito & Fundamentação)</label>
            <textarea id="inlineEditVerso" class="modal-input" rows="4" style="resize:vertical;">${card.verso || ''}</textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" onclick="DeltaRevisoes.closeEditCardModal()">Cancelar</button>
          <button class="btn-save" onclick="DeltaRevisoes.saveEditedCard('${card.id}')">Salvar Alterações</button>
        </div>
      </div>
    `;

    editModal.style.display = 'flex';
  }

  function closeEditCardModal() {
    const editModal = document.getElementById('deltaInlineCardEditModal');
    if (editModal) editModal.style.display = 'none';
  }

  function saveEditedCard(cardId) {
    const card = activeSessionCards.find(c => c.id === cardId);
    if (!card) return;

    const newAssunto = (document.getElementById('inlineEditAssunto')?.value || '').trim();
    const newFrente = (document.getElementById('inlineEditFrente')?.value || '').trim();
    const newVerso = (document.getElementById('inlineEditVerso')?.value || '').trim();

    if (!newFrente || !newVerso) {
      alert('Preencha a Frente e o Verso do cartão.');
      return;
    }

    try {
      const overrides = JSON.parse(localStorage.getItem('atena_card_overrides') || '{}');
      overrides[cardId] = {
        ...(overrides[cardId] || {}),
        assunto: newAssunto,
        frente: newFrente,
        verso: newVerso
      };
      localStorage.setItem('atena_card_overrides', JSON.stringify(overrides));

      // Atualizar também customCards se for custom
      const customCards = JSON.parse(localStorage.getItem('atena_custom_cards') || '[]');
      const cIdx = customCards.findIndex(c => c.id === cardId);
      if (cIdx >= 0) {
        customCards[cIdx] = { ...customCards[cIdx], assunto: newAssunto, frente: newFrente, verso: newVerso };
        localStorage.setItem('atena_custom_cards', JSON.stringify(customCards));
      }

      // Atualizar no objeto da sessão ativa
      card.assunto = newAssunto;
      card.frente = newFrente;
      card.verso = newVerso;

      closeEditCardModal();
      renderActiveCard();
    } catch(e) {
      console.error('Erro ao salvar edição do cartão:', e);
    }
  }

  // Atalho de teclado (Espaço e números 1-4)
  document.addEventListener('keydown', function(e) {
    const modal = document.getElementById('modalReviewPlayer');
    if (!modal || modal.style.display !== 'flex') return;

    const editModal = document.getElementById('deltaInlineCardEditModal');
    if (editModal && editModal.style.display === 'flex') return;
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    if (e.key === 'e' || e.key === 'E') {
      e.preventDefault();
      const card = activeSessionCards[currentCardIndex];
      if (card) openEditCardModal(card.id);
      return;
    }

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

  // Utilitário de Normalização Canônica (Title Case inteligente e deduplicação)
  function normalizeTitle(str) {
    if (!str) return '';
    const trimmed = str.trim().replace(/\s+/g, ' ');
    const lowerWords = ['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'no', 'na', 'nos', 'nas', 'por', 'para', 'com', 'sem', 'a', 'o', 'as', 'os'];
    const uppercaseWords = ['STF', 'STJ', 'CPP', 'CP', 'CF', 'CF/88', 'LINDB', 'ECA', 'LPE', 'DP', 'DPP', 'DC', 'DA', 'ML', 'DCV', 'DH', 'DE', 'CR', 'RLM', 'FSRS', 'SRS', 'ANPP', 'CPI', 'PRF', 'PF'];

    return trimmed.split(' ').map((word, idx) => {
      const upperCandidate = word.toUpperCase().replace(/[^A-Z0-9/]/g, '');
      if (uppercaseWords.includes(upperCandidate)) {
        return word.toUpperCase();
      }
      const lowerCandidate = word.toLowerCase();
      if (idx > 0 && lowerWords.includes(lowerCandidate)) {
        return lowerCandidate;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
  }

  function getAssuntosPorDeck(deckId) {
    const cards = getAllCards();
    const query = (deckId || '').toLowerCase();
    const assuntos = new Set();

    cards.forEach(c => {
      if (!deckId || (c.deckId && c.deckId.toLowerCase() === query)) {
        if (c.assunto) {
          assuntos.add(normalizeTitle(c.assunto));
        }
      }
    });

    return Array.from(assuntos).sort();
  }

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
    setCardFlag,
    restartFailedCardsSession,
    openEditCardModal,
    closeEditCardModal,
    saveEditedCard,
    normalizeTitle,
    getAssuntosPorDeck
  };

})();
