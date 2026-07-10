import { useState, useEffect } from 'react';
import {
  Layers, AlertTriangle, ThumbsUp, ThumbsDown,
  Flame, ArrowLeft, CheckCircle, XCircle, Play,
  CalendarClock, BookOpen, LogOut, FileText, Sun, Moon,
} from 'lucide-react';
import { bancosDeQuestoes, type Card } from './data';

// --- SRS ---
interface SrsEntry {
  interval: number;
  ease: number;
  nextReview: string;
}
type SrsData = Record<string, SrsEntry>;

// --- HIGHLIGHT ---
const KEYWORDS = ['Exceção', 'Súmula', 'Vedada', 'Proibida', 'Prazo', 'NÃO', 'INCONDICIONADA', 'GRAVE', 'SIM', 'SEMPRE', 'NUNCA', 'JAMAIS', 'APENAS'];

function HighlightText({ text }: { text: string }) {
  const regex = new RegExp(`\\b(${KEYWORDS.join('|')})\\b`, 'gi');
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) => {
        const isKeyword = KEYWORDS.find((k) => k.toLowerCase() === part.toLowerCase());
        if (isKeyword) {
          return (
            <span key={i} className="inline-flex items-center gap-1 bg-[#fff4ed] dark:bg-[#331500] text-[#ff6b00] dark:text-[#ff8533] font-bold px-1.5 py-0.5 rounded border border-[#ffe6d4] dark:border-[#662a00] shadow-sm">
              <AlertTriangle size={14} className="text-[#ff6b00] dark:text-[#ff8533]" />
              {part.toUpperCase()}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

interface ModalData {
  tempo: number;
  obs: string;
  date: string;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'decks' | 'flashcards' | 'report'>('decks');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // SRS State
  const [srsData, setSrsData] = useState<SrsData>({});
  const [todayCards, setTodayCards] = useState<Card[]>([]);

  // Review Session State
  const [currentDeck, setCurrentDeck] = useState<Card[]>([]);
  const [deckName, setDeckName] = useState('');
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCards, setIncorrectCards] = useState<Card[]>([]);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [modalData, setModalData] = useState<ModalData>({ tempo: 0, obs: '', date: '' });
  const [tempSrs, setTempSrs] = useState<SrsData>({});

  // Init Theme and Load
  useEffect(() => {
    const savedTheme = localStorage.getItem('delta-theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    const savedSrs = localStorage.getItem('atena_srs');
    if (savedSrs) {
      const parsedSrs: SrsData = JSON.parse(savedSrs);
      setSrsData(parsedSrs);
      calculateTodayCards(parsedSrs);
    } else {
      calculateTodayCards({});
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const newTheme = !prev;
      if (newTheme) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('delta-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('delta-theme', 'light');
      }
      return newTheme;
    });
  };

  const calculateTodayCards = (srs: SrsData) => {
    const now = new Date().getTime();
    const due: Card[] = [];
    const allCards = bancosDeQuestoes.flatMap((deck) => deck.cards);
    allCards.forEach((card) => {
      const cardSrs = srs[card.id];
      if (cardSrs && new Date(cardSrs.nextReview).getTime() <= now) {
        due.push(card);
      }
    });
    setTodayCards(due);
  };

  const startDeck = (deck: Card[], name: string) => {
    if (deck.length === 0) return;
    setCurrentDeck(deck);
    setDeckName(name);
    setCardIndex(0);
    setIsFlipped(false);
    setCurrentStreak(0);
    setCorrectCount(0);
    setIncorrectCards([]);
    setCurrentScreen('flashcards');
  };

  const openSaveModal = (newSrs: SrsData) => {
    const tempoTotal = Math.round(currentDeck.length * 1.5);
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    setModalData({ tempo: tempoTotal, obs: '', date: dateStr });
    setTempSrs(newSrs);
    setShowSaveModal(true);
  };

  const handleAnswer = (isCorrect: boolean) => {
    const card = currentDeck[cardIndex];
    const newSrs: SrsData = { ...srsData };
    const cardData: SrsEntry = newSrs[card.id] || { interval: 0, ease: 2.5, nextReview: new Date().toISOString() };

    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
      setCurrentStreak((prev) => prev + 1);
      cardData.interval = cardData.interval === 0 ? 1 : Math.round(cardData.interval * cardData.ease);
    } else {
      setCurrentStreak(0);
      setIncorrectCards((prev) => [...prev, card]);
      cardData.interval = 1;
      cardData.ease = Math.max(1.3, cardData.ease - 0.2);
    }

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + cardData.interval);
    cardData.nextReview = nextDate.toISOString();

    newSrs[card.id] = cardData;
    setSrsData(newSrs);
    localStorage.setItem('atena_srs', JSON.stringify(newSrs));

    if (cardIndex < currentDeck.length - 1) {
      setIsFlipped(false);
      setCardIndex((prev) => prev + 1);
    } else {
      openSaveModal(newSrs);
    }
  };

  const confirmSaveSession = () => {
    try {
      const logsStr = localStorage.getItem('delta_estudos') || '[]';
      const logs = JSON.parse(logsStr);
      logs.push({
        date: modalData.date,
        mat: 'RLM/REV',
        assunto: `Flashcards: ${deckName}`,
        tempo: Number(modalData.tempo) || 0,
        qts: currentDeck.length,
        acertos: correctCount,
        obs: modalData.obs || 'Registro: Método SRS Atena',
      });
      localStorage.setItem('delta_estudos', JSON.stringify(logs));
    } catch (e) {
      console.error('Erro ao integrar tracker', e);
    }
    setShowSaveModal(false);
    calculateTodayCards(tempSrs);
    setCurrentScreen('report');
  };

  // --- RENDERS ---
  const renderDecks = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-12">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <Layers className="text-[#ff6b00]" /> Biblioteca de Baralhos
      </h2>

      <div className="bg-[#fff4ed] dark:bg-[#1a0a00] border border-[#ffe6d4] dark:border-[#4d1f00] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-xl font-bold text-[#803200] dark:text-[#ff9955] flex items-center gap-2">
              <CalendarClock className="text-[#ff6b00]" size={24} />
              Revisões do Dia
            </h3>
            <p className="text-[#a64800] dark:text-[#cc6611] mt-2 font-medium">Você tem <span className="font-bold text-xl">{todayCards.length}</span> cartões agendados pelo algoritmo de Revisão Espaçada para hoje.</p>
          </div>
          <button
            onClick={() => startDeck(todayCards, 'Revisões do Dia')}
            disabled={todayCards.length === 0}
            className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors shrink-0 shadow-md ${todayCards.length > 0 ? 'bg-[#ff6b00] hover:bg-[#e65c00] text-white' : 'bg-gray-300 dark:bg-zinc-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'}`}
          >
            <Play size={20} />
            Revisar Agora
          </button>
        </div>
      </div>

      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">Baralhos por Matéria (Estudo Direto)</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bancosDeQuestoes.map((deck) => (
          <div key={deck.id} className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400 font-bold">{deck.sigla} • Carreira Policial</span>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">{deck.titulo}</h3>
              <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm leading-relaxed">{deck.descricao}</p>
            </div>

            <div className="mt-4">
              <details className="group/assunto">
                <summary className="text-sm font-semibold text-gray-500 dark:text-gray-400 cursor-pointer flex items-center gap-2 hover:text-[#ff6b00] transition-colors list-none">
                  <span className="transform group-open/assunto:rotate-90 transition-transform text-[10px]">▶</span> Ver Assuntos
                </summary>
                <div className="mt-3 flex flex-col gap-2 pl-3 border-l-2 border-[#ffe6d4] dark:border-[#4d1f00]">
                  {Object.entries(
                    deck.cards.reduce((acc, card) => {
                      if (!acc[card.assunto]) acc[card.assunto] = [];
                      acc[card.assunto].push(card);
                      return acc;
                    }, {} as Record<string, Card[]>)
                  ).map(([assunto, cards]) => (
                    <div key={assunto} className="flex justify-between items-center bg-gray-50 dark:bg-zinc-800/80 p-2 rounded-lg text-sm border border-gray-100 dark:border-zinc-700">
                      <span className="text-gray-700 dark:text-gray-300 font-medium truncate pr-2" title={assunto}>{assunto}</span>
                      <button 
                        onClick={() => startDeck(cards, `${deck.sigla}: ${assunto}`)}
                        className="shrink-0 bg-white dark:bg-zinc-700 text-[#ff6b00] border border-gray-200 dark:border-zinc-600 hover:bg-[#ff6b00] hover:text-white hover:border-[#ff6b00] px-3 py-1 rounded-md text-xs font-bold transition-colors shadow-sm"
                      >
                        Estudar ({cards.length})
                      </button>
                    </div>
                  ))}
                </div>
              </details>
            </div>

            <div className="mt-6 flex justify-between items-center border-t border-gray-100 dark:border-zinc-700 pt-4">
              <span className="text-gray-500 dark:text-gray-400 text-sm font-semibold flex items-center gap-1.5"><BookOpen size={16} /> {deck.cards.length} Cartões</span>
              <button
                onClick={() => startDeck(deck.cards, deck.titulo)}
                className="text-[#ff6b00] dark:text-[#ff8533] font-bold flex items-center gap-1 group-hover:gap-2 transition-all"
              >
                Estudar Tudo <ArrowLeft size={16} className="rotate-180" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFlashcard = () => {
    if (!currentDeck || currentDeck.length === 0) return null;
    const card = currentDeck[cardIndex];

    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
        <div className="w-full flex justify-between items-center mb-6">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{deckName}</span>
            <span className="text-gray-900 dark:text-gray-100 font-bold">Cartão {cardIndex + 1} de {currentDeck.length}</span>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5 bg-[#fff4ed] dark:bg-[#331500] px-4 py-2 rounded-full border border-[#ffe6d4] dark:border-[#662a00]">
              <Flame size={18} className="text-[#ff6b00] dark:text-[#ff8533]" />
              <span className="text-[#803200] dark:text-[#ffad77] font-bold text-sm">Ofensiva: {currentStreak}</span>
            </div>
          </div>
        </div>

        <div className="w-full min-h-[400px] perspective-1000">
          <div className={`relative w-full h-full transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
            <div className={`absolute w-full h-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-3xl p-8 shadow-lg flex flex-col backface-hidden ${isFlipped ? 'invisible' : 'visible'}`}>
              <div className="mb-6 flex justify-between items-center">
                <span className="bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-gray-300 text-xs px-2.5 py-1 rounded-md font-semibold tracking-wide uppercase">{card.assunto}</span>
              </div>
              <div className="flex-1 flex items-center justify-center text-center">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white leading-relaxed">{card.frente}</h2>
              </div>
            </div>

            <div className={`absolute w-full h-full bg-[#fff4ed] dark:bg-[#1a0a00] border-2 border-[#ffe6d4] dark:border-[#4d1f00] rounded-3xl p-8 shadow-lg flex flex-col backface-hidden rotate-y-180 ${!isFlipped ? 'invisible' : 'visible'}`}>
              <div className="mb-6">
                <span className="bg-[#ffe6d4] dark:bg-[#4d1f00] text-[#803200] dark:text-[#ffad77] text-xs px-2.5 py-1 rounded-md font-bold tracking-wide uppercase">Resposta e Explicação</span>
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <p className="text-lg text-[#803200] dark:text-[#ffcfb3] leading-relaxed font-medium">
                  <HighlightText text={card.verso} />
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 w-full flex gap-4 h-16">
          {!isFlipped ? (
            <button
              onClick={() => setIsFlipped(true)}
              className="flex-1 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-white text-white dark:text-gray-900 rounded-2xl font-bold text-lg shadow-md transition-all active:scale-95"
            >
              Revelar Resposta
            </button>
          ) : (
            <>
              <button
                onClick={() => handleAnswer(false)}
                className="flex-1 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <ThumbsDown size={22} /> Errei (Reiniciar)
              </button>
              <button
                onClick={() => handleAnswer(true)}
                className="flex-1 bg-green-50 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <ThumbsUp size={22} /> Acertei (Espaçar)
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderReport = () => {
    const actualCorrect = correctCount;
    const accuracy = Math.round((actualCorrect / currentDeck.length) * 100) || 0;

    return (
      <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-500 pb-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 text-center">Relatório de Sessão</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center mb-8">Essa sessão foi salva automaticamente no Tracker do Menu Principal.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl border border-gray-100 dark:border-zinc-700 shadow-sm text-center">
            <CheckCircle className="mx-auto text-green-500 dark:text-green-400 mb-2" size={32} />
            <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wider">Desempenho</p>
            <p className="text-4xl font-black text-gray-900 dark:text-white mt-1">{accuracy}%</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">{actualCorrect} de {currentDeck.length} corretos</p>
          </div>

          <div className="bg-[#fff4ed] dark:bg-[#1a0a00] p-6 rounded-2xl border border-[#ffe6d4] dark:border-[#4d1f00] shadow-sm text-center flex flex-col justify-center items-center">
            <FileText className="text-[#ff6b00] dark:text-[#ff8533] mb-2" size={32} />
            <p className="text-[#803200] dark:text-[#ffad77] text-sm font-semibold uppercase tracking-wider">Sessão Salva</p>
            <p className="text-lg font-bold text-[#ff6b00] dark:text-[#ff8533] mt-1">+ {modalData.tempo} minutos registrados</p>
          </div>
        </div>

        {incorrectCards.length > 0 && (
          <div className="mb-10">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <XCircle className="text-red-500" /> Caderno de Erros ({incorrectCards.length})
            </h3>
            <div className="space-y-4">
              {incorrectCards.map((card, idx) => (
                <div key={idx} className="bg-white dark:bg-zinc-800 border-l-4 border-l-red-500 border-t border-r border-b border-gray-200 dark:border-zinc-700 rounded-r-xl p-5 shadow-sm">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 font-semibold">{card.assunto}</p>
                  <p className="text-gray-900 dark:text-gray-100 font-medium mb-3">{card.frente}</p>
                  <div className="bg-red-50/50 dark:bg-red-950/20 p-4 rounded-lg">
                    <p className="text-red-900 dark:text-red-300 text-sm"><HighlightText text={card.verso} /></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => setCurrentScreen('decks')}
            className="px-6 py-3 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2"
          >
            <Layers size={20} /> Voltar aos Baralhos
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 transition-colors duration-200 font-sans">
      <header className="sticky top-0 z-50 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 shadow-sm px-4 py-3 transition-colors duration-200">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400 font-bold leading-tight mb-0.5">Método de Revisão Espaçada</span>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                <span className="text-gray-900 dark:text-white">Atena:</span> <span className="text-[#ff6b00]">Flashcards</span>
              </h1>
            </div>
          </div>

          <nav className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-300 transition-colors"
              title="Alternar Tema"
              aria-label="Alternar tema claro/escuro"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <a href="../index.html" className="px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-white transition-colors shadow-sm">
              <LogOut size={16} /> <span className="hidden sm:inline">Menu Principal</span>
            </a>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        {currentScreen === 'flashcards' && (
          <button
            onClick={() => setCurrentScreen('decks')}
            className="mb-8 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium flex items-center gap-2 transition-colors"
          >
            <ArrowLeft size={20} /> Abortar Sessão e Voltar
          </button>
        )}

        {currentScreen === 'decks' && renderDecks()}
        {currentScreen === 'flashcards' && renderFlashcard()}
        {currentScreen === 'report' && renderReport()}

        {showSaveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-zinc-700">
              <div className="p-6 border-b border-gray-100 dark:border-zinc-700 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Registro de Estudo</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Data</label>
                    <input
                      type="date"
                      value={modalData.date}
                      onChange={(e) => setModalData({ ...modalData, date: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none focus:border-[#ff6b00]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Tempo (Min)</label>
                    <input
                      type="number"
                      value={modalData.tempo}
                      onChange={(e) => setModalData({ ...modalData, tempo: Number(e.target.value) })}
                      className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none focus:border-[#ff6b00]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Tópico</label>
                  <input
                    type="text"
                    value={`Flashcards: ${deckName}`}
                    readOnly
                    className="w-full bg-gray-100 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Questões</label>
                    <div className="w-full bg-gray-100 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-gray-600 dark:text-gray-400 text-center font-bold">
                      {currentDeck.length}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-green-600 dark:text-green-500 uppercase tracking-wider mb-1">Acertos</label>
                    <div className="w-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 rounded-lg px-3 py-2 text-green-700 dark:text-green-400 text-center font-bold">
                      {correctCount}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Comentários</label>
                  <textarea
                    value={modalData.obs}
                    onChange={(e) => setModalData({ ...modalData, obs: e.target.value })}
                    placeholder="Alguma observação sobre essa revisão?"
                    className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none focus:border-[#ff6b00] h-20 resize-none"
                  />
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-700 flex justify-end gap-3">
                <button
                  onClick={confirmSaveSession}
                  className="px-6 py-2 bg-[#ff6b00] hover:bg-[#e65c00] text-white font-bold rounded-xl transition-colors"
                >
                  Salvar Registro
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
