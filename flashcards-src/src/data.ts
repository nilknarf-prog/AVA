// --- FONTE ÚNICA DOS FLASHCARDS ATENA (61 cartões) ---
// Editar aqui os baralhos/cartões; rodar `npm run build` para publicar.

export interface Card {
  id: string;
  assunto: string;
  frente: string;
  verso: string;
}

export interface Deck {
  id: string;
  titulo: string;
  sigla: string;
  descricao: string;
  cards: Card[];
}

export const bancosDeQuestoes: Deck[] = [
  {
    id: 'dp',
    titulo: 'Direito Penal',
    sigla: 'DP',
    descricao: 'Lei no Tempo, Extraterritorialidade e Conflito de Normas (Gargalos).',
    cards: [
      { id: 'dp1', assunto: 'Lei Penal no Tempo', frente: 'Aplica-se a lei penal mais benigna ao crime continuado se a lei mais grave entrou em vigor ANTES de cessar a continuidade?', verso: 'NÃO. Aplica-se a LEI MAIS GRAVE (Súmula 711 do STF).' },
      { id: 'dp2', assunto: 'Extraterritorialidade', frente: 'Genocídio cometido contra brasileiro no exterior exige que o agente entre no Brasil para ser punido?', verso: 'NÃO. Extraterritorialidade INCONDICIONADA.' },
      { id: 'dp3', assunto: 'Abolitio Criminis', frente: 'A abolitio criminis apaga também os efeitos extrapenais (civis) da condenação?', verso: 'NÃO. Apenas os EFEITOS PENAIS.' },
      { id: 'dp4', assunto: 'Tempo do Crime', frente: 'Para a definição do tempo do crime, adotou-se a Teoria da Ubiquidade?', verso: 'NÃO. Tempo = ATIVIDADE. Lugar = UBIQUIDADE (L-U-T-A).' },
      { id: 'dp5', assunto: 'Conflito de Normas', frente: 'Falsidade ideológica usada apenas como meio para estelionato é absorvida?', verso: 'SIM. Princípio da Consunção (Súmula 17 STJ).' },
      { id: 'dp6', assunto: 'Teoria do Crime', frente: 'A legítima defesa putativa exclui a ilicitude do fato?', verso: 'NÃO. Exclui a CULPABILIDADE (se inevitável) ou reduz a pena/desclassifica para culposo (se evitável), por ser Erro de Tipo Permissivo.' },
      { id: 'dp7', assunto: 'Crimes contra a Vida', frente: 'O perdão judicial no homicídio aplica-se a modalidades dolosas?', verso: 'NÃO. Somente ao homicídio CULPOSO.' },
      { id: 'dp8', assunto: 'Roubo e Furto', frente: 'O sistema de câmeras de segurança torna o furto crime impossível?', verso: 'NÃO. Súmula 567 do STJ: não torna o crime impossível.' },
      { id: 'dp9', assunto: 'Penas', frente: 'A pena de multa pode ser convertida em detenção se o condenado não pagar?', verso: 'NÃO. A multa passa a ser dívida de valor, cobrada pela Fazenda Pública.' },
      { id: 'dp10', assunto: 'Crime Impossível', frente: 'A ineficácia relativa do meio ou impropriedade relativa do objeto configuram crime impossível?', verso: 'NÃO. Devem ser ABSOLUTAS (Art. 17, CP).' },
    ],
  },
  {
    id: 'dpp',
    titulo: 'Dir. Processual Penal',
    sigla: 'DPP',
    descricao: 'Inquérito Policial, Prisões e Ação Penal.',
    cards: [
      { id: 'dpp1', assunto: 'Inquérito Policial', frente: 'O delegado de polícia pode mandar arquivar os autos de inquérito se não achar provas?', verso: 'NÃO. O arquivamento é de competência do Ministério Público / Juiz, JAMAIS da autoridade policial (Art. 17, CPP).' },
      { id: 'dpp2', assunto: 'Prisão em Flagrante', frente: 'Qualquer do povo DEVE prender quem quer que seja encontrado em flagrante delito?', verso: 'NÃO. O cidadão comum PODE prender (faculdade). Quem DEVE prender é a autoridade policial e seus agentes.' },
      { id: 'dpp3', assunto: 'Ação Penal', frente: 'A representação do ofendido na ação penal pública condicionada pode ser retratada após o oferecimento da denúncia?', verso: 'NÃO. A retratação só é possível ATÉ o oferecimento da denúncia (Art. 25, CPP).' },
      { id: 'dpp4', assunto: 'Provas', frente: 'São inadmissíveis as provas derivadas das ilícitas, sem qualquer exceção?', verso: 'NÃO. Há exceções: fonte independente e descoberta inevitável.' },
      { id: 'dpp5', assunto: 'Prisão Preventiva', frente: 'Pode ser decretada prisão preventiva como antecipação de cumprimento de pena?', verso: 'NÃO. A prisão preventiva não pode ter finalidade de antecipação de pena (Art. 313, §2º).' },
      { id: 'dpp6', assunto: 'Acordo de Não Persecução', frente: 'O ANPP cabe em crimes cometidos com violência ou grave ameaça?', verso: 'NÃO. O ANPP exige infração sem violência ou grave ameaça e pena mínima < 4 anos.' },
      { id: 'dpp7', assunto: 'Inquérito Policial', frente: 'É garantido ao advogado acessar os autos do inquérito de forma irrestrita, inclusive diligências em andamento?', verso: 'NÃO. O acesso abrange apenas os elementos JÁ DOCUMENTADOS (Súmula Vinculante 14).' },
      { id: 'dpp8', assunto: 'Competência', frente: 'O juízo competente para julgar estelionato por cheque sem fundo é o do local de recusa?', verso: 'SIM. Súmula 521 STF / Art. 70, §4º, CPP (Local da agência bancária sacada).' },
      { id: 'dpp9', assunto: 'Prisão Temporária', frente: 'A prisão temporária pode ser decretada de ofício pelo Juiz?', verso: 'NÃO. Depende SEMPRE de representação da autoridade policial ou requerimento do MP.' },
      { id: 'dpp10', assunto: 'Provas', frente: 'O juiz pode fundamentar sua decisão EXCLUSIVAMENTE nos elementos informativos do Inquérito?', verso: 'NÃO. Vedação expressa no art. 155, CPP (salvo provas cautelares, não repetíveis e antecipadas).' },
    ],
  },
  {
    id: 'dc',
    titulo: 'Direito Constitucional',
    sigla: 'DC',
    descricao: 'Controle de Constitucionalidade e Direitos Fundamentais.',
    cards: [
      { id: 'dc1', assunto: 'Eficácia das Normas', frente: 'A norma que garante o direito de greve no serviço público é de eficácia plena?', verso: 'NÃO. É de eficácia LIMITADA, dependendo de lei específica para seu exercício.' },
      { id: 'dc2', assunto: 'Habeas Corpus', frente: 'Cabe Habeas Corpus contra punição disciplinar militar?', verso: 'NÃO. Salvo para questionar os pressupostos de legalidade (hierarquia, poder de punir), mas não o mérito.' },
      { id: 'dc3', assunto: 'Remédios Constitucionais', frente: 'O Mandado de Injunção serve para suprir falta de norma regulamentadora de qualquer direito?', verso: 'NÃO. Apenas para direitos, liberdades constitucionais, nacionalidade, soberania e cidadania.' },
      { id: 'dc4', assunto: 'Segurança Pública', frente: 'As guardas municipais fazem parte do rol dos órgãos de segurança pública stricto sensu (Art. 144, incisos I a VI)?', verso: 'NÃO. Estão previstas no §8º do Art. 144, com função de proteção de bens, serviços e instalações.' },
      { id: 'dc5', assunto: 'CPI', frente: 'A CPI pode determinar quebra de sigilo bancário sem autorização judicial?', verso: 'SIM. A CPI possui poderes de investigação próprios das autoridades judiciais (cláusula de reserva de jurisdição atenuada).' },
      { id: 'dc6', assunto: 'Extradição', frente: 'O brasileiro nato pode ser extraditado se o crime foi cometido no exterior?', verso: 'NÃO. O brasileiro nato NUNCA pode ser extraditado.' },
      { id: 'dc7', assunto: 'CPI', frente: 'A CPI pode decretar prisão preventiva de testemunha que mente?', verso: 'NÃO. CPI não pode decretar prisão, exceto em flagrante delito.' },
      { id: 'dc8', assunto: 'Competência', frente: 'A segurança viária nas rodovias federais é de competência da Polícia Federal?', verso: 'NÃO. É de competência da Polícia Rodoviária Federal.' },
      { id: 'dc9', assunto: 'Súmula Vinculante', frente: 'Qualquer pessoa pode propor a edição, revisão ou cancelamento de Súmula Vinculante?', verso: 'NÃO. Apenas os legitimados da Ação Direta de Inconstitucionalidade (Art. 103) e outros específicos.' },
      { id: 'dc10', assunto: 'Mandado de Segurança', frente: 'Cabe mandado de segurança contra lei em tese?', verso: 'NÃO. Salvo se a lei produzir efeitos concretos imediatos (Súmula 266 STF).' },
      { id: 'dc11', assunto: 'Classificação das Constituições', frente: 'A Constituição Outorgada tem participação popular em sua elaboração, enquanto a Cesarista não tem?', verso: 'NÃO. Nenhuma tem participação na elaboração. A diferença é que a Cesarista (ex: Napoleão) prevê RATIFICAÇÃO POPULAR POSTERIOR (plebiscito de fachada). A Outorgada é 100% imposta (ex: 1824, 1937, 1967).' },
    ],
  },
  {
    id: 'da',
    titulo: 'Dir. Administrativo',
    sigla: 'DA',
    descricao: 'Atos, Poderes Administrativos e Responsabilidade Civil.',
    cards: [
      { id: 'da1', assunto: 'Atos Administrativos', frente: 'A revogação de um ato administrativo produz efeitos ex tunc (retroativos)?', verso: 'NÃO. A revogação produz efeitos EX NUNC (daqui para frente). A anulação é que produz efeitos ex tunc.' },
      { id: 'da2', assunto: 'Poder de Polícia', frente: 'O poder de polícia pode ser delegado integralmente à iniciativa privada?', verso: 'NÃO. STF decidiu que apenas fases de consentimento, fiscalização e sanção (em empresas públicas/sociedade economia mista que prestam serviço público em regime não concorrencial) podem, mas nunca legislar/ordem.' },
      { id: 'da3', assunto: 'Responsabilidade Civil', frente: 'A responsabilidade civil do Estado por conduta omissiva é sempre objetiva?', verso: 'NÃO. Via de regra, a omissão estatal enseja responsabilidade SUBJETIVA (teoria da culpa do serviço/faute du service).' },
      { id: 'da4', assunto: 'Atributos do Ato', frente: 'A presunção de legitimidade dos atos administrativos é absoluta?', verso: 'NÃO. É presunção RELATIVA (juris tantum), admitindo prova em contrário.' },
      { id: 'da5', assunto: 'Poder Disciplinar', frente: 'O poder disciplinar abrange a aplicação de multa a um cidadão por excesso de velocidade?', verso: 'NÃO. Multa de trânsito é exercício do Poder de POLÍCIA (vínculo geral). Poder Disciplinar exige vínculo específico (servidor ou contratado).' },
      { id: 'da6', assunto: 'Concessão', frente: 'A concessão de serviço público exige lei autorizadora e licitação na modalidade concorrência ou diálogo competitivo?', verso: 'SIM. Sempre exige licitação nas modalidades concorrência ou diálogo.' },
      { id: 'da7', assunto: 'Improbidade', frente: 'Após a Lei 14.230/21, admite-se ato de improbidade administrativa culposo?', verso: 'NÃO. A nova lei exige DOLO ESPECÍFICO para todas as modalidades.' },
      { id: 'da8', assunto: 'Agentes Públicos', frente: 'É permitida a acumulação remunerada de um cargo de professor com outro técnico ou científico?', verso: 'SIM, desde que haja compatibilidade de horários (Art. 37, XVI, CF).' },
      { id: 'da9', assunto: 'Licitação', frente: 'Na inexigibilidade de licitação, a competição é inviável, mas há vários possíveis fornecedores?', verso: 'NÃO. Inexigibilidade decorre justamente da inviabilidade de competição (ex: fornecedor exclusivo, artista consagrado).' },
      { id: 'da10', assunto: 'Bens Públicos', frente: 'Os bens de uso comum do povo e de uso especial são alienáveis?', verso: 'NÃO. São inalienáveis enquanto mantiverem essa destinação. Só alienáveis após desafetação.' },
    ],
  },
  {
    id: 'lpe',
    titulo: 'Leg. Penal Especial',
    sigla: 'LPE',
    descricao: 'Maria da Penha, Drogas, Desarmamento e Tortura.',
    cards: [
      { id: 'lpe1', assunto: 'Maria da Penha', frente: 'A Lei Maria da Penha (Lei 11.340) aplica-se somente quando a vítima for mulher e o agressor for homem?', verso: 'NÃO. O agressor pode ser de qualquer gênero (inclusive outra mulher), desde que a violência seja baseada em gênero contra a mulher.' },
      { id: 'lpe2', assunto: 'Lei de Drogas', frente: 'O crime de porte de drogas para consumo pessoal (Art. 28) é punido com pena de prisão?', verso: 'NÃO. Não há pena privativa de liberdade. Apenas advertência, prestação de serviços ou medida educativa (despenalização).' },
      { id: 'lpe3', assunto: 'Estatuto do Desarmamento', frente: 'O porte de arma de fogo de uso permitido, se a arma estiver desmuniciada, não é crime?', verso: 'NÃO. O STF e STJ consideram crime de perigo abstrato. É CRIME mesmo desmuniciada.' },
      { id: 'lpe4', assunto: 'Crime de Tortura', frente: 'O crime de tortura é inafiançável e imprescritível?', verso: 'NÃO. É inafiançável, insuscetível de graça ou anistia. MAS É PRESCRITÍVEL (apenas racismo e ação de grupos armados são imprescritíveis).' },
      { id: 'lpe5', assunto: 'Crimes Hediondos', frente: 'O roubo com restrição de liberdade da vítima (sequestro relâmpago) é considerado crime hediondo?', verso: 'SIM. Incluído pelo Pacote Anticrime na Lei 8.072/90.' },
      { id: 'lpe6', assunto: 'ECA', frente: 'Vender bebida alcoólica para adolescente é apenas infração administrativa?', verso: 'NÃO. É CRIME previsto no ECA (Art. 243) com pena de detenção.' },
      { id: 'lpe7', assunto: 'Abuso de Autoridade', frente: 'Existe crime de abuso de autoridade culposo na Lei 13.869/19?', verso: 'NÃO. Todos os crimes da lei de abuso exigem DOLO ESPECÍFICO.' },
      { id: 'lpe8', assunto: 'Lei de Drogas', frente: 'A associação para o tráfico (Art. 35) é considerada crime hediondo?', verso: 'NÃO. O tráfico (Art. 33) e financiamento (Art. 36) são equiparados a hediondos. A associação NÃO É.' },
      { id: 'lpe9', assunto: 'Crimes Ambientais', frente: 'Pessoas jurídicas podem ser responsabilizadas penalmente por crimes ambientais?', verso: 'SIM. Responsabilidade penal da pessoa jurídica é expressamente admitida na CF e na Lei 9.605/98.' },
      { id: 'lpe10', assunto: 'Organização Criminosa', frente: 'A infiltração policial em organização criminosa pode ser feita sem autorização judicial?', verso: 'NÃO. Exige, em qualquer hipótese, prévia autorização judicial motivada.' },
    ],
  },
  {
    id: 'dcv',
    titulo: 'Direito Civil',
    sigla: 'DCV',
    descricao: 'LINDB, Pessoas e Capacidade (Gargalos).',
    cards: [
      { id: 'dcv1', assunto: 'LINDB - Integração Normativa', frente: 'Na ausência de norma, o juiz aplicará a lei segundo a analogia, a equidade, os costumes e os princípios gerais do direito?', verso: 'NÃO. A ordem de integração (Art. 4º LINDB) é: 1º Analogia, 2º Costumes, 3º Princípios gerais de direito. A EQUIDADE NÃO ESTÁ NO ROL.' },
      { id: 'dcv2', assunto: 'LINDB - Subsunção x Integração', frente: 'A subsunção ocorre quando o juiz preenche uma lacuna da lei usando a analogia?', verso: 'NÃO. Subsunção é o enquadramento do fato à norma EXISTENTE. Preencher lacuna é INTEGRAÇÃO.' },
      { id: 'dcv3', assunto: 'Das Pessoas - Nascituro', frente: 'O STJ, na prática jurisprudencial, adota integralmente a Teoria Natalista descrita no art. 2º do CC?', verso: 'NÃO. O CC adota a Natalista na letra fria, mas o STJ tende para a Teoria CONCEPCIONISTA (reconhece danos morais por morte de nascituro e alimentos gravídicos).' },
      { id: 'dcv4', assunto: 'Capacidade Civil', frente: 'Após o Estatuto da Pessoa com Deficiência, quem são os absolutamente incapazes no Direito Civil brasileiro?', verso: 'APENAS os menores de 16 anos. Os enfermos/deficientes mentais saíram do rol e agora são capazes ou relativamente incapazes.' },
      { id: 'dcv5', assunto: 'Desconsideração da PJ', frente: 'Para ocorrer a desconsideração da Personalidade Jurídica (Art. 50, CC), basta demonstrar a insolvência ou encerramento irregular da empresa?', verso: 'NÃO. A regra (Teoria Maior) exige ABUSO DA PERSONALIDADE, caracterizado por Desvio de Finalidade OU Confusão Patrimonial.' },
      { id: 'dcv6', assunto: 'Desconsideração Direta x Inversa', frente: 'Na desconsideração INVERSA da personalidade jurídica, os bens da pessoa jurídica respondem por dívidas pessoais do sócio?', verso: 'SIM. É muito comum em varas de Família (ex: sócio oculta patrimônio na empresa para fugir de partilha ou pensão).' },
    ],
  },
  {
    id: 'ml',
    titulo: 'Medicina Legal',
    sigla: 'ML',
    descricao: 'Perícias, Documentos, Infortunística e Traumatologia.',
    cards: [
      { id: 'ml1', assunto: 'Corpo de Delito', frente: 'Se houver trauma (energia atingiu o corpo) mas não houver lesão constatável (nenhum vestígio físico), o crime a ser registrado é Lesão Corporal leve?', verso: 'NÃO. Sem vestígio, o laudo será negativo. A conduta deve ser desclassificada para VIAS DE FATO (Art. 21 da LCP).' },
      { id: 'ml2', assunto: 'Peritos', frente: 'Na ausência de perito oficial, o exame de corpo de delito pode ser feito por apenas 1 (uma) pessoa idônea com diploma superior?', verso: 'NÃO. Na falta de perito oficial (onde 1 basta), exige-se a nomeação de 2 (DUAS) pessoas idôneas com curso superior (Art. 159, §1º, CPP).' },
      { id: 'ml3', assunto: 'Documentos Médico-Legais', frente: "O 'Parecer' é o exame direto e minucioso realizado pelo perito no corpo da vítima, reduzido a termo?", verso: 'NÃO. Isso é o RELATÓRIO/LAUDO. O Parecer é apenas uma OPINIÃO TÉCNICA sobre um exame/laudo já realizado por outro profissional.' },
      { id: 'ml4', assunto: 'Infortunística', frente: 'O acidente de percurso (trajeto de casa para o trabalho) é equiparado a acidente de trabalho, garantindo direitos previdenciários?', verso: 'SIM. É o chamado acidente atípico (ou por equiparação), mesmo ocorrendo fora das dependências e do horário de trabalho.' },
      { id: 'ml5', assunto: 'Traumatologia', frente: 'Qual a diferença conceitual entre Trauma e Lesão na Medicina Legal?', verso: 'TRAUMA é a CAUSA (a energia ou objeto que atinge o corpo, ex: projétil, soco). LESÃO é o EFEITO (o dano ou alteração estrutural no corpo, ex: fratura, equimose).' },
    ],
  },
];
