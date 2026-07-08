import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  AlertTriangle, 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  Flame, 
  ArrowLeft, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Trophy,
  Play
} from 'lucide-react';

// --- BANCO DE DADOS (TEORIA DA LEI PENAL - DELEGADO DE POLÍCIA) ---
const bancoDeQuestoes = [
  {
    id: 1,
    banca: "Cebraspe/FGV",
    ano: 2024,
    assunto: "Lei Penal no Tempo / Súmulas",
    frente: "Aplica-se a lei penal mais benigna ao crime continuado ou ao crime permanente, caso uma nova lei mais gravosa entre em vigor antes da cessação da continuidade ou da permanência?",
    verso: "NÃO. Aplica-se a LEI MAIS GRAVE. Segundo a Súmula 711 do STF, a lei penal mais grave aplica-se ao crime continuado ou ao crime permanente, se a sua vigência é anterior à cessação da continuidade ou da permanência. O erro clássico é aplicar a retroatividade benéfica nestes casos."
  },
  {
    id: 2,
    banca: "Cebraspe/FGV",
    ano: 2024,
    assunto: "Tempo e Lugar do Crime",
    frente: "O Código Penal Brasileiro adotou a Teoria da Ubiquidade tanto para a definição do tempo do crime quanto para a definição do lugar do crime?",
    verso: "NÃO. Lembre-se do mnemônico L-U-T-A: Lugar = Ubiquidade / Tempo = Atividade. Para o tempo do crime, adotou-se a Teoria da Atividade (momento da ação ou omissão). Para o lugar, a Ubiquidade (onde ocorreu a ação/omissão e onde se produziu o resultado)."
  },
  {
    id: 3,
    banca: "Cebraspe/FGV",
    ano: 2024,
    assunto: "Extraterritorialidade",
    frente: "O crime de genocídio cometido no exterior contra brasileiro ou por brasileiro fica sujeito à lei brasileira, exigindo-se, contudo, que o agente entre no território nacional?",
    verso: "NÃO. O genocídio cometido contra brasileiro ou por brasileiro é caso de Extraterritorialidade INCONDICIONADA (Art. 7º, I, 'd', CP). A lei brasileira será aplicada independentemente de qualquer condição, como a entrada do agente no país."
  },
  {
    id: 4,
    banca: "Cebraspe/FGV",
    ano: 2024,
    assunto: "Abolitio Criminis",
    frente: "A 'abolitio criminis' (supressão formal e material da figura criminosa) faz cessar tanto os efeitos penais quanto os efeitos extrapenais da condenação?",
    verso: "NÃO. A abolitio criminis (art. 2º, caput, do CP) faz cessar apenas a execução e os EFEITOS PENAIS da condenação. Os efeitos extrapenais (como a obrigação de reparar o dano causado à vítima) permanecem hígidos."
  },
  {
    id: 5,
    banca: "Cebraspe/FGV",
    ano: 2024,
    assunto: "Conflito Aparente de Normas",
    frente: "Pelo princípio da consunção, o crime de falsidade ideológica é absorvido pelo crime de descaminho se a falsidade foi o meio necessário para a consumação do descaminho?",
    verso: "SIM. É a aplicação do Princípio da Consunção (lex consumens derogat legi consumptae). Quando o falso exaure sua potencialidade lesiva no crime-fim (descaminho ou estelionato - Súmula 17 STJ), ele é absorvido, não havendo concurso material."
  },
  {
    id: 6,
    banca: "Cebraspe/FGV",
    ano: 2024,
    assunto: "Lei Penal no Espaço",
    frente: "Aplica-se a lei penal brasileira a um crime cometido a bordo de uma aeronave privada brasileira em voo sobre o espaço aéreo de país estrangeiro (ex: Argentina)?",
    verso: "NÃO. Aplica-se a lei do país estrangeiro (Princípio do Pavilhão ou da Bandeira). As aeronaves privadas adotam a lei de onde se encontram. A exceção seria se a aeronave estivesse a serviço do governo brasileiro (aí seria considerada extensão do território nacional onde quer que se encontrasse)."
  },
  {
    id: 7,
    banca: "Cebraspe",
    ano: 2024,
    assunto: "Direito Constitucional",
    frente: "Art. 227 CF (dever de família/sociedade/Estado assegurar direitos da criança) é norma de eficácia plena, contida ou limitada?",
    verso: "LIMITADA (programática) — depende de legislação ou prestação estatal posterior para gerar seus efeitos plenos."
  },
  {
    id: 8,
    banca: "Cebraspe",
    ano: 2024,
    assunto: "Direito Civil - LINDB",
    frente: "Qual a diferença entre Subsunção e Integração normativa e qual a ordem da integração (art. 4º LINDB)?",
    verso: "Subsunção enquadra um fato a uma norma EXISTENTE. Integração é usada quando HÁ LACUNA. Ordem obrigatória: 1º Analogia, 2º Costumes, 3º Princípios gerais do direito. Obs: A equidade não está no rol."
  },
  {
    id: 9,
    banca: "Cebraspe",
    ano: 2024,
    assunto: "Medicina Legal - Perícias",
    frente: "Qual a diferença entre Trauma e Lesão na Medicina Legal?",
    verso: "Trauma = AÇÃO da energia ou agente vulnerante (causa). Lesão = EFEITO ou dano corporal resultante (consequência). Exemplo: Instrumento (faca) -> Trauma (ação cortante) -> Lesão (ferida incisa)."
  }
];

const resumoEstrategico = [
  {
    id: "r1",
    titulo: "Regras Gerais e Conflito de Leis no Tempo",
    topicos: [
      "A regra geral é a Irretroatividade da Lei Penal mais gravosa.",
      "A Exceção constitucional é a retroatividade da lei para beneficiar o réu (lex mitior).",
      "Leis excepcionais ou temporárias possuem ultratividade (aplicam-se ao fato cometido durante sua vigência, mesmo após revogadas ou findo o Prazo).",
      "Súmula 711 STF: Crime continuado/permanente aplica-se a lei mais grave se vigente antes de cessar a continuidade/permanência."
    ]
  },
  {
    id: "r2",
    titulo: "Lugar e Tempo do Crime (Mnemônico L.U.T.A)",
    topicos: [
      "Lugar do Crime: Teoria da Ubiquidade (tanto onde ocorreu a conduta quanto onde ocorreu o resultado).",
      "Tempo do Crime: Teoria da Atividade (momento da conduta, ainda que outro seja o do resultado).",
      "É Vedada a aplicação de teoria diversa dessas no Código Penal para fins de competência e prescrição geral."
    ]
  },
  {
    id: "r3",
    titulo: "Extraterritorialidade da Lei Penal",
    topicos: [
      "Incondicionada (art. 7º, I): O agente é punido segundo a lei brasileira ainda que absolvido ou condenado no exterior. Exemplos: Contra a vida do Presidente, Genocídio (se agente for brasileiro ou domiciliado no BR).",
      "Condicionada (art. 7º, II): Exige condições cumulativas (ex: o agente entrar no território nacional, o fato ser punível no país onde foi praticado).",
      "NÃO se aplica a lei brasileira a aeronaves/embarcações privadas estrangeiras de passagem, salvo se o crime atingir bem jurídico nacional ou houver inércia."
    ]
  }
];

// --- COMPONENTE DE HIGHLIGHT DE PALAVRAS-CHAVE ---
const HighlightText = ({ text }) => {
  const keywords = ['Exceção', 'Súmula', 'Vedada', 'Proibida', 'Prazo', 'NÃO', 'INCONDICIONADA', 'GRAVE', 'LEI MAIS GRAVE'];
  const regex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi');
  
  const parts = text.split(regex);
  
  return (
    <span>
      {parts.map((part, i) => {
        const isKeyword = keywords.find(k => k.toLowerCase() === part.toLowerCase());
        if (isKeyword) {
          return (
            <span key={i} className="inline-flex items-center gap-1 bg-[#fff4ed] text-[#ff6b00] font-bold px-1.5 py-0.5 rounded border border-[#ffe6d4] shadow-sm">
              <AlertTriangle size={14} className="text-[#ff6b00]" />
              {part.toUpperCase()}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
};

// --- APLICAÇÃO PRINCIPAL ---
export default function App() {
  // Estados da Aplicação
  const [currentScreen, setCurrentScreen] = useState('decks'); // 'decks', 'flashcards', 'report', 'summary'
  const [favorites, setFavorites] = useState([]);
  const [bestStreak, setBestStreak] = useState(0);
  
  // Estados do Flashcard/Revisão
  const [currentDeck, setCurrentDeck] = useState([]);
  const [deckName, setDeckName] = useState("");
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCards, setIncorrectCards] = useState([]);

  // Carregar dados do localStorage
  useEffect(() => {
    const savedFavs = localStorage.getItem('atena_favorites');
    const savedStreak = localStorage.getItem('atena_bestStreak');
    if (savedFavs) setFavorites(JSON.parse(savedFavs));
    if (savedStreak) setBestStreak(parseInt(savedStreak, 10));
  }, []);

  // Salvar favoritos e streak no localStorage
  useEffect(() => {
    localStorage.setItem('atena_favorites', JSON.stringify(favorites));
    localStorage.setItem('atena_bestStreak', bestStreak.toString());
  }, [favorites, bestStreak]);

  // Funções de Navegação e Controle
  const startDeck = (deck, name) => {
    setCurrentDeck(deck);
    setDeckName(name);
    setCardIndex(0);
    setIsFlipped(false);
    setCurrentStreak(0);
    setCorrectCount(0);
    setIncorrectCards([]);
    setCurrentScreen('flashcards');
  };

  const toggleFavorite = (id) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter(favId => favId !== id));
    } else {
      setFavorites([...favorites, id]);
    }
  };

  const handleAnswer = (isCorrect) => {
    const currentCard = currentDeck[cardIndex];
    
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      const newStreak = currentStreak + 1;
      setCurrentStreak(newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);
    } else {
      setCurrentStreak(0);
      setIncorrectCards(prev => [...prev, currentCard]);
    }

    if (cardIndex < currentDeck.length - 1) {
      setIsFlipped(false);
      setCardIndex(prev => prev + 1);
    } else {
      setCurrentScreen('report');
    }
  };

  // --- RENDERIZADORES DE TELAS ---

  const renderDecks = () => {
    const favoriteCards = bancoDeQuestoes.filter(q => favorites.includes(q.id));

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto space-y-6 pb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Layers className="text-[#ff6b00]" /> Selecione seu Baralho
        </h2>

        {favoriteCards.length > 0 && (
          <div className="bg-[#fff4ed] border border-[#ffe6d4] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-[#803200] flex items-center gap-2">
                  <Star className="fill-[#ff6b00] text-[#ff6b00]" size={24}/>
                  Meus Favoritos
                </h3>
                <p className="text-gray-700 mt-2">Você possui {favoriteCards.length} cartões favoritados para revisão prioritária.</p>
              </div>
              <button 
                onClick={() => startDeck(favoriteCards, "Meus Favoritos")}
                className="bg-[#ff6b00] hover:bg-[#e65c00] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors"
              >
                <Play size={20} />
                Iniciar
              </button>
            </div>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Direito Penal • Delegado</span>
              <h3 className="text-xl font-bold text-gray-900 mt-1">Teoria da Lei Penal</h3>
              <p className="text-gray-600 mt-2 text-sm leading-relaxed">
                Tópicos de altíssima incidência (Cebraspe/FGV/Vunesp): Lei no tempo, Abolitio Criminis, Extraterritorialidade e Conflito de Normas.
              </p>
              <div className="mt-3 flex gap-3">
                <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full font-medium">6 Cartões</span>
                <span className="bg-[#fff4ed] text-[#803200] text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1">
                  <Trophy size={12}/> Alta Performance
                </span>
              </div>
            </div>
            <button 
              onClick={() => startDeck(bancoDeQuestoes, "Teoria da Lei Penal")}
              className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors ml-4 shrink-0"
            >
              <Play size={20} />
              Revisar
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderFlashcard = () => {
    const card = currentDeck[cardIndex];
    const isFav = favorites.includes(card.id);

    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
        
        {/* Progresso e Gamificação */}
        <div className="w-full flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 text-gray-500 font-medium">
            <span>Cartão {cardIndex + 1} de {currentDeck.length}</span>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5 bg-[#fff4ed] px-3 py-1.5 rounded-full border border-[#ffe6d4]">
              <Flame size={18} className="text-[#ff6b00]" />
              <span className="text-[#803200] font-bold">{currentStreak}</span>
            </div>
          </div>
        </div>

        {/* O Cartão */}
        <div className="w-full min-h-[400px] perspective-1000">
          <div className={`relative w-full h-full transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
            
            {/* FRENTE DO CARTÃO */}
            <div className={`absolute w-full h-full bg-white border border-gray-200 rounded-3xl p-8 shadow-lg flex flex-col backface-hidden ${isFlipped ? 'invisible' : 'visible'}`}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-md font-semibold tracking-wide uppercase">{card.assunto}</span>
                  <p className="text-gray-400 text-xs mt-2">{card.banca} • {card.ano}</p>
                </div>
                <button onClick={() => toggleFavorite(card.id)} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                  <Star size={24} className={isFav ? "fill-[#ff6b00] text-[#ff6b00]" : "text-gray-300"} />
                </button>
              </div>
              
              <div className="flex-1 flex items-center justify-center text-center">
                <h2 className="text-2xl font-semibold text-gray-900 leading-relaxed">
                  {card.frente}
                </h2>
              </div>
            </div>

            {/* VERSO DO CARTÃO */}
            <div className={`absolute w-full h-full bg-[#fff4ed] border-2 border-[#ffe6d4] rounded-3xl p-8 shadow-lg flex flex-col backface-hidden rotate-y-180 ${!isFlipped ? 'invisible' : 'visible'}`}>
               <div className="flex justify-between items-start mb-6">
                <span className="bg-[#ffe6d4] text-[#803200] text-xs px-2.5 py-1 rounded-md font-bold tracking-wide uppercase">Resposta e Explicação</span>
                <button onClick={() => toggleFavorite(card.id)} className="p-2 hover:bg-[#ffe6d4] rounded-full transition-colors">
                  <Star size={24} className={isFav ? "fill-[#ff6b00] text-[#ff6b00]" : "text-[#ff6b00]/30"} />
                </button>
              </div>
              
              <div className="flex-1 flex flex-col justify-center">
                <p className="text-[17px] text-[#803200] leading-relaxed font-medium">
                  <HighlightText text={card.verso} />
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Controles de Ação */}
        <div className="mt-8 w-full flex gap-4 h-16">
          {!isFlipped ? (
            <button 
              onClick={() => setIsFlipped(true)}
              className="flex-1 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl font-bold text-lg shadow-md transition-all active:scale-95"
            >
              Revelar Resposta
            </button>
          ) : (
            <>
              <button 
                onClick={() => handleAnswer(false)}
                className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <ThumbsDown size={22} /> Errei
              </button>
              <button 
                onClick={() => handleAnswer(true)}
                className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <ThumbsUp size={22} /> Acertei
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderReport = () => {
    const accuracy = Math.round((correctCount / currentDeck.length) * 100);

    return (
      <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-500 pb-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Relatório de Desempenho</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
            <CheckCircle className="mx-auto text-green-500 mb-2" size={32} />
            <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Acertos</p>
            <p className="text-4xl font-black text-gray-900 mt-1">{correctCount}/{currentDeck.length}</p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
            <Trophy className="mx-auto text-blue-500 mb-2" size={32} />
            <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Precisão</p>
            <p className="text-4xl font-black text-gray-900 mt-1">{accuracy}%</p>
          </div>
          
          <div className="bg-[#fff4ed] p-6 rounded-2xl border border-[#ffe6d4] shadow-sm text-center">
            <Flame className="mx-auto text-[#ff6b00] mb-2" size={32} />
            <p className="text-[#803200] text-sm font-semibold uppercase tracking-wider">Maior Ofensiva</p>
            <p className="text-4xl font-black text-[#ff6b00] mt-1">{bestStreak}</p>
          </div>
        </div>

        {incorrectCards.length > 0 && (
          <div className="mb-10">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <XCircle className="text-red-500" /> Caderno de Erros ({incorrectCards.length})
            </h3>
            <div className="space-y-4">
              {incorrectCards.map((card, idx) => (
                <div key={idx} className="bg-white border-l-4 border-l-red-500 border-t border-r border-b border-gray-200 rounded-r-xl p-5 shadow-sm">
                  <p className="text-sm text-gray-500 mb-2 font-semibold">{card.assunto}</p>
                  <p className="text-gray-900 font-medium mb-3">{card.frente}</p>
                  <div className="bg-red-50/50 p-4 rounded-lg">
                    <p className="text-red-900 text-sm"><HighlightText text={card.verso} /></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <button 
            onClick={() => setCurrentScreen('decks')}
            className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Layers size={20} /> Outros Baralhos
          </button>
          <button 
            onClick={() => startDeck(currentDeck, deckName)}
            className="px-6 py-3 bg-[#ff6b00] text-white font-bold rounded-xl hover:bg-[#e65c00] transition-colors flex items-center gap-2 shadow-md"
          >
            <RefreshCw size={20} /> Refazer Baralho
          </button>
        </div>
      </div>
    );
  };

  const renderSummary = () => {
    return (
      <div className="max-w-4xl mx-auto animate-in fade-in duration-500 pb-16">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <AlertTriangle className="text-[#ff6b00]" size={32} />
            Resumo Estratégico
          </h2>
          <p className="text-gray-500 mt-2">Mapeamento de Regras, Exceções e Súmulas Críticas.</p>
        </div>

        <div className="space-y-8">
          {resumoEstrategico.map((bloco) => (
            <div key={bloco.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                <h3 className="font-bold text-gray-900 text-lg">{bloco.titulo}</h3>
              </div>
              <div className="p-6">
                <ul className="space-y-4">
                  {bloco.topicos.map((topico, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#ff6b00] shrink-0"></div>
                      <p className="text-gray-700 leading-relaxed text-[15px]">
                        <HighlightText text={topico} />
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        
        body { font-family: 'Inter', sans-serif; background-color: #f8fafc; }
        
        /* 3D Flip Utilities */
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>

      <div className="min-h-screen bg-slate-50 font-sans">
        
        {/* HEADER */}
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm px-4 py-3">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Logo e Titulo */}
            <div className="flex items-center gap-3">
              <img 
                src="https://i.postimg.cc/wjDcBqwQ/Gemini-Generated-Image-mlk3y2mlk3y2mlk3.png" 
                alt="Atena Logo" 
                className="h-12 sm:h-14 w-auto object-contain drop-shadow-md hover:scale-105 transition-transform duration-300"
              />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold leading-tight mb-0.5">Teoria da Lei Penal</span>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  <span className="text-gray-900">Atena:</span> <span className="text-[#ff6b00]">Direito Penal</span>
                </h1>
              </div>
            </div>

            {/* Navegação Global */}
            <nav className="flex gap-2">
              <button 
                onClick={() => setCurrentScreen('decks')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition-colors ${currentScreen === 'decks' || currentScreen === 'flashcards' || currentScreen === 'report' ? 'bg-[#fff4ed] text-[#ff6b00]' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Layers size={18} /> <span className="hidden sm:inline">Estudar Baralhos</span>
              </button>
              <button 
                onClick={() => setCurrentScreen('summary')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition-colors ${currentScreen === 'summary' ? 'bg-[#fff4ed] text-[#ff6b00]' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <AlertTriangle size={18} /> <span className="hidden sm:inline">Resumo Estratégico</span>
              </button>
            </nav>
          </div>
        </header>

        {/* MAIN CONTAINER */}
        <main className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
          
          {currentScreen === 'flashcards' && (
            <button 
              onClick={() => setCurrentScreen('decks')}
              className="mb-8 text-gray-500 hover:text-gray-900 font-medium flex items-center gap-2 transition-colors"
            >
              <ArrowLeft size={20} /> Voltar aos Baralhos
            </button>
          )}

          {currentScreen === 'decks' && renderDecks()}
          {currentScreen === 'flashcards' && renderFlashcard()}
          {currentScreen === 'report' && renderReport()}
          {currentScreen === 'summary' && renderSummary()}

        </main>
      </div>
    </>
  );
}