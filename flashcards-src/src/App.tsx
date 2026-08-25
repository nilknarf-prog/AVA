import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Layers, Flame, ArrowLeft, CheckCircle, Play,
  CalendarClock, BookOpen, FileText, Sun, Moon,
  BrainCircuit, Sparkles, Gauge, Plus, Bookmark,
  BarChart3, Target, Info
} from 'lucide-react';
import { bancosDeQuestoes, type Card, type Deck } from './data';
import {
  Rating,
  CardState,
  StudyMode,
  STUDY_MODES_CONFIG,
  type FSRSCard,
  type FSRSData,
  scheduleFSRSCard,
  previewFSRSIntervals,
  migrateLegacySRS,
  calculateRetrievability,
  computeMemoryStats,
} from './fsrs';
import { hasCloze } from './cloze';
import {
  RichContentRenderer,
  FLAG_CONFIG,
  type FlagColor,
} from './richText';
import { CardCreatorModal } from './CardCreatorModal';
import { CustomCardsManager } from './CustomCardsManager';

interface ModalData {
  tempo: number;
  obs: string;
  date: string;
}

interface RatingCounts {
  again: number;
  hard: number;
  good: number;
  easy: number;
}

function HeaderStopwatch({ onStopSession }: { onStopSession?: (minutes: number) => void }) {
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const STORAGE_KEY = 'delta_stopwatch_state';

  const updateStateFromStorage = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const state = JSON.parse(raw);
        setIsRunning(state.isRunning || false);
        if (state.isRunning && state.startTimestamp) {
          const diff = Math.max(0, Math.floor((Date.now() - state.startTimestamp) / 1000));
          setSeconds((state.accumulatedSec || 0) + diff);
        } else {
          setSeconds(state.accumulatedSec || 0);
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    updateStateFromStorage();
    const interval = setInterval(updateStateFromStorage, 1000);
    window.addEventListener('storage', updateStateFromStorage);
    document.addEventListener('visibilitychange', updateStateFromStorage);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', updateStateFromStorage);
      document.removeEventListener('visibilitychange', updateStateFromStorage);
    };
  }, []);

  const handlePlay = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const state = raw ? JSON.parse(raw) : { accumulatedSec: 0 };
      state.isRunning = true;
      state.startTimestamp = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setIsRunning(true);
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}
  };

  const handlePause = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const state = JSON.parse(raw);
      if (!state.isRunning) return;
      const diff = Math.max(0, Math.floor((Date.now() - state.startTimestamp) / 1000));
      state.accumulatedSec = (state.accumulatedSec || 0) + diff;
      state.isRunning = false;
      state.startTimestamp = 0;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setIsRunning(false);
      setSeconds(state.accumulatedSec);
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}
  };

  const handleStop = () => {
    handlePause();
    if (seconds <= 0) return;
    const mins = Math.max(1, Math.round(seconds / 60));
    if (onStopSession) {
      onStopSession(mins);
    }
  };

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const timeFormatted = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  return (
    <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 px-2.5 py-1 rounded-xl shadow-sm">
      <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
      <span className="font-mono font-bold text-xs sm:text-sm text-[#ff6b00] dark:text-[#ff8533] min-w-[62px]">
        {timeFormatted}
      </span>
      <div className="flex items-center gap-0.5 ml-1 border-l border-gray-200 dark:border-zinc-700 pl-1">
        {!isRunning ? (
          <button
            onClick={handlePlay}
            className="p-1 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg text-emerald-600 dark:text-emerald-400 text-xs font-bold transition cursor-pointer"
            title="Iniciar / Continuar cronômetro"
          >
            ▶️
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="p-1 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg text-amber-600 dark:text-amber-400 text-xs font-bold transition cursor-pointer"
            title="Pausar cronômetro"
          >
            ⏸️
          </button>
        )}
        <button
          onClick={handleStop}
          className="p-1 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg text-red-500 text-xs font-bold transition cursor-pointer"
          title="Finalizar e Salvar tempo estudado"
        >
          ⏹️
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'decks' | 'flashcards' | 'report' | 'stats'>('decks');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Custom Flashcards & Custom Decks State
  const [customCards, setCustomCards] = useState<Card[]>([]);
  const [customDecks, setCustomDecks] = useState<Deck[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<{ card: Card; deckId: string } | null>(null);

  // FSRS & Study Modes State
  const [fsrsData, setFsrsData] = useState<FSRSData>({});
  const [studyMode, setStudyMode] = useState<StudyMode>(StudyMode.PosEdital);
  const [desiredRetention, setDesiredRetention] = useState<number>(0.94);
  const [maxIntervalDays, setMaxIntervalDays] = useState<number>(21);
  const [todayCards, setTodayCards] = useState<Card[]>([]);

  // Review Session State
  const [currentDeck, setCurrentDeck] = useState<Card[]>([]);
  const [deckName, setDeckName] = useState('');
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [revealedClozes, setRevealedClozes] = useState<Set<number>>(new Set());
  const [currentStreak, setCurrentStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [, setIncorrectCards] = useState<Card[]>([]);
  const [sessionRatings, setSessionRatings] = useState<RatingCounts>({ again: 0, hard: 0, good: 0, easy: 0 });

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [modalData, setModalData] = useState<ModalData>({ tempo: 0, obs: '', date: '' });
  const [tempFsrs, setTempFsrs] = useState<FSRSData>({});

  // 1. Carregar Custom Cards e Decks do localStorage
  useEffect(() => {
    try {
      const savedCustomCards = localStorage.getItem('atena_custom_cards');
      if (savedCustomCards) {
        setCustomCards(JSON.parse(savedCustomCards));
      }
      const savedCustomDecks = localStorage.getItem('atena_custom_decks');
      if (savedCustomDecks) {
        setCustomDecks(JSON.parse(savedCustomDecks));
      }
    } catch (e) {
      console.error('Erro ao ler custom cards/decks:', e);
    }
  }, []);

  // 2. Mesclar Baralhos Oficiais com Custom Decks e Inserir Custom Cards
  const allDecks: Deck[] = useMemo(() => {
    const merged: Deck[] = bancosDeQuestoes.map((d) => ({
      ...d,
      cards: [...d.cards],
    }));

    customDecks.forEach((cd) => {
      if (!merged.find((m) => m.id === cd.id)) {
        merged.push({
          ...cd,
          cards: [],
        });
      }
    });

    customCards.forEach((c) => {
      const targetDeckId = c.deckId || 'dp';
      const deck = merged.find((m) => m.id === targetDeckId);
      if (deck) {
        if (!deck.cards.some((existing) => existing.id === c.id)) {
          deck.cards.push(c);
        }
      } else {
        if (merged.length > 0 && !merged[0].cards.some((existing) => existing.id === c.id)) {
          merged[0].cards.push(c);
        }
      }
    });

    return merged;
  }, [customCards, customDecks]);

  const allCardIds = useMemo(() => {
    return allDecks.flatMap((d) => d.cards.map((c) => c.id));
  }, [allDecks]);

  // Recalcular cartões devidos hoje de acordo com o modo
  const calculateTodayCards = useCallback((data: FSRSData, decks: Deck[], mode = studyMode) => {
    const now = new Date().getTime();
    const due: Card[] = [];
    const allCards = decks.flatMap((deck) => deck.cards);

    allCards.forEach((card) => {
      const cardFsrs = data[card.id];

      if (mode === StudyMode.Gargalos) {
        // Foco em gargalos: lapses >= 1 ou bandeira vermelha ou não dominados
        if (cardFsrs && (cardFsrs.lapses > 0 || cardFsrs.flag === 'red' || card.flag === 'red' || cardFsrs.difficulty >= 7)) {
          due.push(card);
        }
      } else if (!cardFsrs || cardFsrs.state === CardState.New || cardFsrs.reps === 0) {
        // Cartões novos sempre disponíveis para primeiro estudo
        due.push(card);
      } else if (new Date(cardFsrs.nextReview).getTime() <= now) {
        due.push(card);
      }
    });

    setTodayCards(due);
  }, [studyMode]);

  // Init Theme, Study Mode, Retention and Load FSRS
  useEffect(() => {
    // Theme
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

    // Study Mode
    const savedMode = localStorage.getItem('atena_study_mode') as StudyMode;
    if (savedMode && STUDY_MODES_CONFIG[savedMode]) {
      setStudyMode(savedMode);
      setDesiredRetention(STUDY_MODES_CONFIG[savedMode].desiredRetention);
      setMaxIntervalDays(STUDY_MODES_CONFIG[savedMode].maxIntervalDays);
    } else {
      // Padrão: Modo Reta Final (Pós-Edital)
      setStudyMode(StudyMode.PosEdital);
      setDesiredRetention(0.94);
      setMaxIntervalDays(21);
    }

    // FSRS Data & Migration
    const savedSrs = localStorage.getItem('atena_srs');
    if (savedSrs) {
      try {
        const raw = JSON.parse(savedSrs);
        const migrated = migrateLegacySRS(raw);
        setFsrsData(migrated);
        localStorage.setItem('atena_srs', JSON.stringify(migrated));
        calculateTodayCards(migrated, allDecks, savedMode || StudyMode.PosEdital);
      } catch (e) {
        console.error('Erro ao ler atena_srs:', e);
        calculateTodayCards({}, allDecks, savedMode || StudyMode.PosEdital);
      }
    } else {
      calculateTodayCards({}, allDecks, savedMode || StudyMode.PosEdital);
    }
  }, [allDecks, calculateTodayCards]);

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

  const handleSelectStudyMode = (mode: StudyMode) => {
    setStudyMode(mode);
    const cfg = STUDY_MODES_CONFIG[mode];
    setDesiredRetention(cfg.desiredRetention);
    setMaxIntervalDays(cfg.maxIntervalDays);
    localStorage.setItem('atena_study_mode', mode);
    calculateTodayCards(fsrsData, allDecks, mode);
  };

  const startDeck = (deck: Card[], name: string) => {
    if (deck.length === 0) return;
    setCurrentDeck(deck);
    setDeckName(name);
    setCardIndex(0);
    setIsFlipped(false);
    setRevealedClozes(new Set());
    setCurrentStreak(0);
    setCorrectCount(0);
    setIncorrectCards([]);
    setSessionRatings({ again: 0, hard: 0, good: 0, easy: 0 });
    setCurrentScreen('flashcards');
  };

  const openSaveModal = (newFsrs: FSRSData) => {
    const tempoTotal = Math.max(1, Math.round(currentDeck.length * 1.2));
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    setModalData({ tempo: tempoTotal, obs: '', date: dateStr });
    setTempFsrs(newFsrs);
    setShowSaveModal(true);
  };

  const handleRating = (rating: Rating) => {
    const card = currentDeck[cardIndex];
    const newFsrs: FSRSData = { ...fsrsData };
    const currentCardData: FSRSCard | undefined = newFsrs[card.id];

    // Se for modo simulado, não altera o agendamento SRS oficial
    if (studyMode !== StudyMode.Simulado) {
      const updatedCard = scheduleFSRSCard(
        currentCardData,
        card.id,
        rating,
        desiredRetention,
        maxIntervalDays
      );
      newFsrs[card.id] = updatedCard;
      setFsrsData(newFsrs);
      localStorage.setItem('atena_srs', JSON.stringify(newFsrs));
    }

    // Atualizar estatísticas da sessão
    if (rating === Rating.Again) {
      setCurrentStreak(0);
      setIncorrectCards((prev) => [...prev, card]);
      setSessionRatings((prev) => ({ ...prev, again: prev.again + 1 }));
    } else {
      setCorrectCount((prev) => prev + 1);
      setCurrentStreak((prev) => prev + 1);
      if (rating === Rating.Hard) {
        setSessionRatings((prev) => ({ ...prev, hard: prev.hard + 1 }));
      } else if (rating === Rating.Good) {
        setSessionRatings((prev) => ({ ...prev, good: prev.good + 1 }));
      } else if (rating === Rating.Easy) {
        setSessionRatings((prev) => ({ ...prev, easy: prev.easy + 1 }));
      }
    }

    if (cardIndex < currentDeck.length - 1) {
      setIsFlipped(false);
      setRevealedClozes(new Set());
      setCardIndex((prev) => prev + 1);
    } else {
      openSaveModal(newFsrs);
    }
  };

  // Alterar bandeira de um cartão durante a revisão
  const handleToggleCardFlag = (targetFlag: FlagColor | null) => {
    if (!currentDeck || currentDeck.length === 0) return;
    const card = currentDeck[cardIndex];
    card.flag = targetFlag;

    // Atualizar no fsrsData
    const newFsrs: FSRSData = { ...fsrsData };
    if (newFsrs[card.id]) {
      newFsrs[card.id].flag = targetFlag;
    } else {
      newFsrs[card.id] = {
        id: card.id,
        difficulty: 5.0,
        stability: 1.0,
        reps: 0,
        lapses: 0,
        state: CardState.New,
        flag: targetFlag,
        nextReview: new Date().toISOString(),
        dueInterval: 0,
      };
    }
    setFsrsData(newFsrs);
    localStorage.setItem('atena_srs', JSON.stringify(newFsrs));

    // Se for custom card, atualizar no localStorage de custom cards
    const customIdx = customCards.findIndex((c) => c.id === card.id);
    if (customIdx >= 0) {
      const updated = [...customCards];
      updated[customIdx].flag = targetFlag;
      setCustomCards(updated);
      localStorage.setItem('atena_custom_cards', JSON.stringify(updated));
    }
  };

  // Atalhos de teclado na revisão
  useEffect(() => {
    if (currentScreen !== 'flashcards' || showSaveModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (isFlipped) {
        if (e.key === '1') {
          e.preventDefault();
          handleRating(Rating.Again);
        } else if (e.key === '2') {
          e.preventDefault();
          handleRating(Rating.Hard);
        } else if (e.key === '3') {
          e.preventDefault();
          handleRating(Rating.Good);
        } else if (e.key === '4') {
          e.preventDefault();
          handleRating(Rating.Easy);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentScreen, isFlipped, cardIndex, currentDeck, showSaveModal]);

  const confirmSaveSession = () => {
    try {
      const logsStr = localStorage.getItem('delta_estudos') || '[]';
      const logs = JSON.parse(logsStr);
      logs.push({
        date: modalData.date,
        mat: 'RLM/REV',
        assunto: `Flashcards (${STUDY_MODES_CONFIG[studyMode].shortName}): ${deckName}`,
        tempo: Number(modalData.tempo) || 0,
        qts: currentDeck.length,
        acertos: correctCount,
        obs: modalData.obs || `FSRS Concursos | Modo: ${STUDY_MODES_CONFIG[studyMode].shortName} | Errei:${sessionRatings.again} Dif:${sessionRatings.hard} Bom:${sessionRatings.good} Fac:${sessionRatings.easy}`,
      });
      localStorage.setItem('delta_estudos', JSON.stringify(logs));
    } catch (e) {
      console.error('Erro ao integrar tracker', e);
    }
    setShowSaveModal(false);
    calculateTodayCards(tempFsrs, allDecks, studyMode);
    setCurrentScreen('report');
  };

  // --- HANDLERS PARA CARTÕES CUSTOMIZADOS ---
  const handleSaveCustomCard = (cardOrCards: Card | Card[], deckId: string) => {
    let updatedCards = [...customCards];
    const cardsToAdd = Array.isArray(cardOrCards) ? cardOrCards : [cardOrCards];

    cardsToAdd.forEach((c) => {
      const existingIndex = updatedCards.findIndex((card) => card.id === c.id);
      if (existingIndex >= 0) {
        updatedCards[existingIndex] = { ...c, deckId };
      } else {
        updatedCards.push({ ...c, deckId });
      }
    });

    setCustomCards(updatedCards);
    localStorage.setItem('atena_custom_cards', JSON.stringify(updatedCards));

    if (deckId.startsWith('custom_') && !customDecks.some((d) => d.id === deckId)) {
      const newDeck: Deck = {
        id: deckId,
        titulo: 'Baralho Personalizado',
        sigla: 'MEU',
        descricao: 'Baralho de flashcards criado por você.',
        cards: [],
        isCustom: true,
      };
      const updatedDecks = [...customDecks, newDeck];
      setCustomDecks(updatedDecks);
      localStorage.setItem('atena_custom_decks', JSON.stringify(updatedDecks));
    }

    setEditingCard(null);
  };

  const handleDeleteCustomCard = (cardId: string) => {
    const updated = customCards.filter((c) => c.id !== cardId);
    setCustomCards(updated);
    localStorage.setItem('atena_custom_cards', JSON.stringify(updated));
  };

  const handleImportCustomCards = (imported: Card[]) => {
    const map = new Map<string, Card>();
    customCards.forEach((c) => map.set(c.id, c));
    imported.forEach((c) => map.set(c.id, { ...c, isCustom: true }));
    const merged = Array.from(map.values());
    setCustomCards(merged);
    localStorage.setItem('atena_custom_cards', JSON.stringify(merged));
  };

  // Estatísticas cognitivas globais
  const memoryStats = useMemo(() => {
    return computeMemoryStats(allCardIds, fsrsData);
  }, [allCardIds, fsrsData]);

  // --- RENDERS ---

  // Header Global
  const renderNavbar = () => (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-gray-200 dark:border-zinc-800 transition-colors">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        
        {/* Logo & Voltar */}
        <div className="flex items-center gap-3">
          {currentScreen !== 'decks' ? (
            <button
              onClick={() => setCurrentScreen('decks')}
              className="p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft size={18} /> Baralhos
            </button>
          ) : (
            <a
              href="../index.html"
              className="flex items-center gap-2.5 text-gray-900 dark:text-white font-extrabold text-base tracking-tight hover:opacity-80 transition"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#ff6b00] to-[#ff8533] text-white flex items-center justify-center font-black shadow-md shadow-[#ff6b00]/20">
                Δ
              </div>
              <span className="hidden sm:inline">Atena · Flashcards</span>
            </a>
          )}
        </div>

        {/* Centro: Seletor Rápido de Modo de Estudo */}
        <div className="hidden md:flex items-center gap-1 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 p-1 rounded-2xl shadow-inner text-xs">
          {(Object.keys(STUDY_MODES_CONFIG) as StudyMode[]).map((m) => {
            const cfg = STUDY_MODES_CONFIG[m];
            const isSelected = studyMode === m;
            return (
              <button
                key={m}
                onClick={() => handleSelectStudyMode(m)}
                title={cfg.description}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-white dark:bg-zinc-900 text-[#ff6b00] dark:text-[#ff8533] shadow-sm scale-100'
                    : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span>{cfg.icon}</span>
                <span>{cfg.shortName}</span>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff6b00] animate-ping" />
                )}
              </button>
            );
          })}
        </div>

        {/* Direita: Stopwatch, Stats, Theme */}
        <div className="flex items-center gap-2">
          <HeaderStopwatch
            onStopSession={(mins) => {
              const now = new Date();
              const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
              try {
                const logsStr = localStorage.getItem('delta_estudos') || '[]';
                const logs = JSON.parse(logsStr);
                logs.push({
                  date: dateStr,
                  mat: 'RLM/REV',
                  assunto: `Estudo Livre: Flashcards Atena`,
                  tempo: mins,
                  qts: 0,
                  acertos: 0,
                  obs: `Sessão de Cronômetro | Modo: ${STUDY_MODES_CONFIG[studyMode].shortName}`,
                });
                localStorage.setItem('delta_estudos', JSON.stringify(logs));
                alert(`✅ ${mins} minutos de estudo salvos no Tracker!`);
              } catch (e) {}
            }}
          />

          <button
            onClick={() => setCurrentScreen('stats')}
            className={`p-2 rounded-xl border transition flex items-center gap-1 text-xs font-bold ${
              currentScreen === 'stats'
                ? 'bg-[#ff6b00] text-white border-[#ff6b00]'
                : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border-gray-200 dark:border-zinc-700 hover:bg-gray-50'
            }`}
            title="Estatísticas Cognitivas da Memória"
          >
            <BarChart3 size={16} />
            <span className="hidden sm:inline">Estatísticas</span>
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 transition"
            title="Alternar Tema Claro / Escuro"
          >
            {isDarkMode ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
          </button>
        </div>

      </div>
    </header>
  );

  // Tela 1: Biblioteca de Baralhos
  const renderDecks = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto px-4 py-8 pb-16">
      
      {/* Top Action & Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2.5">
            <Layers className="text-[#ff6b00]" /> Biblioteca de Baralhos
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-1">
            Motor FSRS Concursos 2.0 com Repetição Espaçada, Cloze e Destaques Jurídicos
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Botão Novo Flashcard */}
          <button
            onClick={() => {
              setEditingCard(null);
              setIsCreateModalOpen(true);
            }}
            className="px-4 py-2 bg-[#ff6b00] hover:bg-[#e65c00] text-white font-bold text-xs rounded-xl shadow-md shadow-[#ff6b00]/20 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={16} /> Novo Flashcard
          </button>

          {/* Botão Meus Cards */}
          <button
            onClick={() => setIsManagerModalOpen(true)}
            className="px-3.5 py-2 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 border border-gray-200 dark:border-zinc-700 font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Bookmark size={15} className="text-[#ff6b00]" /> Meus Cards ({customCards.length})
          </button>
        </div>
      </div>

      {/* Hero Card: Revisões do Dia + Modo Ativo */}
      <div className="bg-gradient-to-br from-[#fff4ed] to-[#ffe6d4] dark:from-[#261200] dark:to-[#170a00] border-2 border-[#ffd4b8] dark:border-[#592200] rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all mb-8 relative overflow-hidden">
        
        {/* Glow de fundo */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-[#ff6b00]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-[#ff6b00] text-white text-[11px] uppercase font-black px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                <Sparkles size={13} /> {STUDY_MODES_CONFIG[studyMode].name}
              </span>
              <span className="bg-white/80 dark:bg-zinc-800/80 text-gray-700 dark:text-zinc-300 text-[11px] font-bold px-2.5 py-1 rounded-full border border-gray-200/60 dark:border-zinc-700">
                Teto: Máx {maxIntervalDays} dias
              </span>
              <span className="bg-white/80 dark:bg-zinc-800/80 text-gray-700 dark:text-zinc-300 text-[11px] font-bold px-2.5 py-1 rounded-full border border-gray-200/60 dark:border-zinc-700">
                Meta: {Math.round(desiredRetention * 100)}% Retenção
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-[#803200] dark:text-[#ffad77] flex items-center gap-2 pt-1">
              <CalendarClock className="text-[#ff6b00]" size={26} />
              Revisões do Dia (FSRS Concursos)
            </h3>

            <p className="text-[#a64800] dark:text-[#cca080] text-xs sm:text-sm font-medium leading-relaxed">
              Você possui <strong className="font-extrabold text-base text-[#803200] dark:text-[#ffb280]">{todayCards.length}</strong> cartões prontos para consolidar a curva do esquecimento com base no modelo neurocientífico.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
            <button
              onClick={() => startDeck(todayCards, `Revisões do Dia (${STUDY_MODES_CONFIG[studyMode].shortName})`)}
              disabled={todayCards.length === 0}
              className={`px-8 py-3.5 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                todayCards.length > 0
                  ? 'bg-[#ff6b00] hover:bg-[#e65c00] text-white cursor-pointer hover:scale-105 active:scale-95 shadow-[#ff6b00]/30'
                  : 'bg-gray-300 dark:bg-zinc-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              <Play size={18} />
              Revisar Agora ({todayCards.length})
            </button>
          </div>
        </div>

        {/* Seletor mobile de modos */}
        <div className="mt-5 pt-4 border-t border-[#ff6b00]/20 flex flex-wrap gap-2 md:hidden">
          <span className="text-xs font-bold text-gray-500 self-center">Modo:</span>
          {(Object.keys(STUDY_MODES_CONFIG) as StudyMode[]).map((m) => (
            <button
              key={m}
              onClick={() => handleSelectStudyMode(m)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                studyMode === m
                  ? 'bg-[#ff6b00] text-white'
                  : 'bg-white/80 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300'
              }`}
            >
              {STUDY_MODES_CONFIG[m].shortName}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Baralhos */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          Baralhos de Estudo ({allDecks.reduce((acc, d) => acc + d.cards.length, 0)} Cartões)
        </h3>
        <span className="text-xs text-gray-500 dark:text-zinc-400">
          {allDecks.length} matérias disponíveis
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allDecks.map((deck) => {
          const customCountInDeck = deck.cards.filter((c) => c.isCustom).length;
          const dueInDeck = deck.cards.filter((c) => {
            const cardFsrs = fsrsData[c.id];
            return !cardFsrs || cardFsrs.state === CardState.New || new Date(cardFsrs.nextReview).getTime() <= Date.now();
          }).length;

          return (
            <div
              key={deck.id}
              className="bg-white dark:bg-zinc-800/90 border border-gray-200 dark:border-zinc-700/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-[#ff6b00] dark:text-[#ff8533] font-black">
                    {deck.sigla} · Carreira Policial
                  </span>
                  <div className="flex items-center gap-1.5">
                    {dueInDeck > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ff6b00]/15 text-[#ff6b00] dark:text-[#ff8533]">
                        {dueInDeck} para hoje
                      </span>
                    )}
                    {customCountInDeck > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        +{customCountInDeck} meus
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1.5">{deck.titulo}</h3>
                <p className="text-gray-600 dark:text-gray-300 mt-2 text-xs sm:text-sm leading-relaxed">{deck.descricao}</p>
              </div>

              {/* Tópicos / Assuntos dropdown */}
              <div className="mt-4">
                <details className="group/assunto">
                  <summary className="text-xs font-bold text-gray-500 dark:text-gray-400 cursor-pointer flex items-center gap-1.5 hover:text-[#ff6b00] transition list-none">
                    <span className="transform group-open/assunto:rotate-90 transition-transform text-[10px]">▶</span> Ver Tópicos Detalhados
                  </summary>
                  <div className="mt-3 flex flex-col gap-2 pl-3 border-l-2 border-[#ffe6d4] dark:border-[#4d1f00] max-h-48 overflow-y-auto pr-1">
                    {Object.entries(
                      deck.cards.reduce((acc, card) => {
                        if (!acc[card.assunto]) acc[card.assunto] = [];
                        acc[card.assunto].push(card);
                        return acc;
                      }, {} as Record<string, Card[]>)
                    ).map(([assunto, cards]) => (
                      <div
                        key={assunto}
                        className="flex justify-between items-center bg-gray-50 dark:bg-zinc-800 p-2 rounded-xl text-xs border border-gray-100 dark:border-zinc-700"
                      >
                        <span className="text-gray-700 dark:text-zinc-300 font-medium truncate pr-2" title={assunto}>
                          {assunto}
                        </span>
                        <button
                          onClick={() => startDeck(cards, `${deck.sigla}: ${assunto}`)}
                          className="shrink-0 bg-white dark:bg-zinc-700 text-[#ff6b00] border border-gray-200 dark:border-zinc-600 hover:bg-[#ff6b00] hover:text-white px-2.5 py-1 rounded-lg font-bold transition shadow-sm"
                        >
                          Estudar ({cards.length})
                        </button>
                      </div>
                    ))}
                  </div>
                </details>
              </div>

              <div className="mt-6 flex justify-between items-center border-t border-gray-100 dark:border-zinc-700 pt-4">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 dark:text-gray-400 text-xs font-bold flex items-center gap-1">
                    <BookOpen size={15} /> {deck.cards.length} Cartões
                  </span>
                  <button
                    onClick={() => {
                      setEditingCard(null);
                      setIsCreateModalOpen(true);
                    }}
                    className="p-1 rounded-lg text-gray-400 hover:text-[#ff6b00] hover:bg-gray-100 dark:hover:bg-zinc-700 transition"
                    title="Adicionar cartão neste baralho"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <button
                  onClick={() => startDeck(deck.cards, deck.titulo)}
                  className="text-[#ff6b00] dark:text-[#ff8533] font-extrabold text-xs sm:text-sm flex items-center gap-1 group-hover:gap-2 transition-all"
                >
                  Estudar Baralho Completo <ArrowLeft size={16} className="rotate-180" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );

  // Tela 2: Flashcards Player (Revisão Interativa com Rich Text e Flags)
  const renderFlashcard = () => {
    if (!currentDeck || currentDeck.length === 0) return null;
    const card = currentDeck[cardIndex];
    const cardFsrs = fsrsData[card.id];
    const isCloze = card.tipo === 'cloze' || hasCloze(card.frente);

    // Previsão dos 4 intervalos FSRS em tempo real
    const previews = previewFSRSIntervals(cardFsrs, card.id, desiredRetention, maxIntervalDays);

    // Estado do cartão
    const cardState = cardFsrs?.state ?? CardState.New;

    // Calcular Retrievability instantânea
    let currentRText = 'Novo';
    if (cardFsrs && cardFsrs.stability > 0 && cardFsrs.lastReview) {
      const elapsedDays = Math.max(0, (Date.now() - new Date(cardFsrs.lastReview).getTime()) / (1000 * 60 * 60 * 24));
      const r = calculateRetrievability(elapsedDays, cardFsrs.stability);
      currentRText = `${Math.round(r * 100)}%`;
    }

    const currentFlag = card.flag || cardFsrs?.flag || null;

    return (
      <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
        
        {/* Top Info Bar */}
        <div className="w-full flex justify-between items-center mb-5 gap-3">
          <div className="flex flex-col">
            <span className="text-[11px] font-extrabold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
              {deckName}
            </span>
            <span className="text-gray-900 dark:text-zinc-100 font-extrabold text-sm sm:text-base">
              Cartão {cardIndex + 1} de {currentDeck.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Seletor rápido de bandeiras durante o estudo */}
            <div className="flex items-center bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 p-1 rounded-xl shadow-sm gap-1">
              {(Object.keys(FLAG_CONFIG) as FlagColor[]).map((f) => (
                <button
                  key={f}
                  onClick={() => handleToggleCardFlag(currentFlag === f ? null : f)}
                  title={`Marcar como ${FLAG_CONFIG[f].label}`}
                  className={`w-5 h-5 rounded-full transition-all ${
                    currentFlag === f ? 'scale-125 ring-2 ring-offset-1 ' + FLAG_CONFIG[f].ring : 'opacity-40 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: FLAG_CONFIG[f].color }}
                />
              ))}
            </div>

            {/* Indicador de Ofensiva */}
            <div className="flex items-center gap-1.5 bg-[#fff4ed] dark:bg-[#331500] px-3.5 py-1.5 rounded-xl border border-[#ffe6d4] dark:border-[#662a00] shadow-sm">
              <Flame size={16} className="text-[#ff6b00] dark:text-[#ff8533]" />
              <span className="text-[#803200] dark:text-[#ffad77] font-bold text-xs">{currentStreak}</span>
            </div>
          </div>
        </div>

        {/* Card 3D Flip */}
        <div className="w-full min-h-[420px] perspective-1000">
          <div className={`relative w-full h-full transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
            
            {/* FRENTE DO CARTÃO */}
            <div className={`w-full min-h-[420px] bg-white dark:bg-zinc-800/95 border-2 border-gray-200 dark:border-zinc-700 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col justify-between ${isFlipped ? 'hidden' : 'flex'}`}>
              
              {/* Top Header da Frente */}
              <div className="flex items-center justify-between gap-2 border-b border-gray-100 dark:border-zinc-700/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300 text-xs px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider">
                    {card.assunto}
                  </span>
                  
                  {/* Badge de Estado */}
                  {cardState === CardState.New && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      🔵 Novo
                    </span>
                  )}
                  {cardState === CardState.Learning && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                      🟠 Aprendizagem
                    </span>
                  )}
                  {cardState === CardState.Review && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      🟢 Revisão
                    </span>
                  )}
                  {cardState === CardState.Relearning && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                      🔴 Reaprendizagem
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {card.targetCloze && card.targetCloze > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ff6b00]/15 text-[#ff6b00] dark:text-[#ff8533] border border-[#ff6b00]/30">
                      🎯 Oclusão c{card.targetCloze}
                    </span>
                  )}
                  {currentFlag && (
                    <span
                      className="text-[10px] font-bold px-2.5 py-0.5 rounded-full text-white shadow-sm"
                      style={{ backgroundColor: FLAG_CONFIG[currentFlag].color }}
                    >
                      🚩 {FLAG_CONFIG[currentFlag].label}
                    </span>
                  )}
                  <span className="text-[11px] text-gray-400 font-medium">
                    {isCloze ? '🧩 Cloze Deletion' : 'Frente'}
                  </span>
                </div>
              </div>

              {/* Corpo da Frente */}
              <div className="my-auto py-6">
                <RichContentRenderer
                  content={card.frente}
                  isBack={false}
                  targetCloze={card.targetCloze || 0}
                  revealedIndices={revealedClozes}
                  onToggleReveal={(clozeNum) => {
                    setRevealedClozes((prev) => {
                      const next = new Set(prev);
                      if (next.has(clozeNum)) next.delete(clozeNum);
                      else next.add(clozeNum);
                      return next;
                    });
                  }}
                  align={card.align || 'center'}
                  className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-zinc-100"
                />

                {card.imageUrl && (
                  <div className="mt-4 flex justify-center">
                    <img
                      src={card.imageUrl}
                      alt="Imagem do cartão"
                      className="max-h-56 rounded-2xl border border-gray-200 dark:border-zinc-700 shadow-md object-contain"
                    />
                  </div>
                )}

                {card.tags && card.tags.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1 mt-4">
                    {card.tags.map((t) => (
                      <span key={t} className="text-[10px] font-semibold text-gray-400 dark:text-zinc-500 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Rodapé da Frente */}
              <div className="text-center text-xs text-gray-400 border-t border-gray-100 dark:border-zinc-700/60 pt-3 flex flex-col sm:flex-row items-center justify-between gap-1">
                {isCloze ? (
                  <span className="text-[#ff6b00] dark:text-[#ff8533] font-medium text-[11px]">
                    👆 Toque/clique nas palavras ocultas para revelar uma a uma
                  </span>
                ) : (
                  <span></span>
                )}
                <span>Pressione <strong>Espaço</strong> ou botão abaixo para gabarito</span>
              </div>
            </div>

            {/* VERSO DO CARTÃO (GABARITO REVELADO) */}
            <div className={`w-full min-h-[420px] bg-[#fffaf5] dark:bg-[#1c0e00] border-2 border-[#ffd4b8] dark:border-[#592200] rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col justify-between ${!isFlipped ? 'hidden' : 'flex'}`}>
              
              {/* Top Header do Verso */}
              <div className="flex items-center justify-between gap-2 border-b border-[#ffe6d4] dark:border-[#401900] pb-3">
                <div className="flex items-center gap-2">
                  <span className="bg-[#ffe6d4] dark:bg-[#4d1f00] text-[#803200] dark:text-[#ffad77] text-xs px-2.5 py-1 rounded-lg font-extrabold uppercase tracking-wider">
                    Gabarito & Fundamentação
                  </span>
                  <span className="bg-[#fff0e6] dark:bg-[#331500] text-[#ff6b00] dark:text-[#ff8533] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#ffd4b8] dark:border-[#662a00]">
                    Retenção: {currentRText}
                  </span>
                  {card.targetCloze && card.targetCloze > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ff6b00]/15 text-[#ff6b00] dark:text-[#ff8533]">
                      Oclusão c{card.targetCloze}
                    </span>
                  )}
                </div>

                {currentFlag && (
                  <span
                    className="text-[10px] font-bold px-2.5 py-0.5 rounded-full text-white shadow-sm"
                    style={{ backgroundColor: FLAG_CONFIG[currentFlag].color }}
                  >
                    🚩 {FLAG_CONFIG[currentFlag].label}
                  </span>
                )}
              </div>

              {/* Corpo do Verso */}
              <div className="my-auto py-6 space-y-4">
                {isCloze ? (
                  <RichContentRenderer
                    content={card.frente}
                    isBack={true}
                    targetCloze={card.targetCloze || 0}
                    align={card.align || 'center'}
                    className="text-lg sm:text-xl font-bold text-[#803200] dark:text-[#ffcfb3]"
                  />
                ) : (
                  <RichContentRenderer
                    content={card.verso}
                    isBack={true}
                    align={card.align || 'left'}
                    className="text-base sm:text-lg font-medium text-[#803200] dark:text-[#ffcfb3]"
                  />
                )}

                {card.extra && (
                  <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border border-[#ffe6d4] dark:border-[#4d1f00] text-xs sm:text-sm text-[#803200] dark:text-[#ffad77] shadow-sm">
                    📝 <strong>Fundamentação:</strong> {card.extra}
                  </div>
                )}

                {card.imageUrl && (
                  <div className="mt-3 flex justify-center">
                    <img
                      src={card.imageUrl}
                      alt="Imagem do cartão"
                      className="max-h-56 rounded-2xl border border-[#ffd4b8] dark:border-[#4d1f00] shadow-md object-contain"
                    />
                  </div>
                )}
              </div>

              {/* Rodapé do Verso */}
              <div className="text-center text-xs text-[#a64800] dark:text-[#cca080] border-t border-[#ffe6d4] dark:border-[#401900] pt-3 font-semibold">
                Classifique sua lembrança abaixo (Teclas 1, 2, 3 ou 4) para o agendamento FSRS
              </div>
            </div>

          </div>
        </div>

        {/* Botões de Ação & Classificação FSRS */}
        <div className="mt-6 w-full">
          {!isFlipped ? (
            <button
              onClick={() => setIsFlipped(true)}
              className="w-full h-16 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-2xl font-extrabold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              Revelar Gabarito (Espaço)
            </button>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              {/* 1. Again (Errei) */}
              <button
                onClick={() => handleRating(Rating.Again)}
                className="flex flex-col items-center justify-center p-3 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 rounded-2xl transition-all active:scale-95 shadow-sm cursor-pointer group"
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs text-red-400 font-mono">[1]</span>
                  <span className="text-sm font-black">🔴 Errei</span>
                </div>
                <span className="text-[11px] font-bold text-red-600/90 dark:text-red-300 mt-1 bg-red-100 dark:bg-red-900/50 px-2.5 py-0.5 rounded-full group-hover:scale-105 transition-transform">
                  {previews[Rating.Again].formatted}
                </span>
              </button>

              {/* 2. Hard (Difícil) */}
              <button
                onClick={() => handleRating(Rating.Hard)}
                className="flex flex-col items-center justify-center p-3 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 rounded-2xl transition-all active:scale-95 shadow-sm cursor-pointer group"
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs text-amber-400 font-mono">[2]</span>
                  <span className="text-sm font-black">🟡 Difícil</span>
                </div>
                <span className="text-[11px] font-bold text-amber-700/90 dark:text-amber-300 mt-1 bg-amber-100 dark:bg-amber-900/50 px-2.5 py-0.5 rounded-full group-hover:scale-105 transition-transform">
                  +{previews[Rating.Hard].formatted}
                </span>
              </button>

              {/* 3. Good (Bom) */}
              <button
                onClick={() => handleRating(Rating.Good)}
                className="flex flex-col items-center justify-center p-3 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl transition-all active:scale-95 shadow-sm cursor-pointer group"
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs text-emerald-400 font-mono">[3]</span>
                  <span className="text-sm font-black">🟢 Bom</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-700/90 dark:text-emerald-300 mt-1 bg-emerald-100 dark:bg-emerald-900/50 px-2.5 py-0.5 rounded-full group-hover:scale-105 transition-transform">
                  +{previews[Rating.Good].formatted}
                </span>
              </button>

              {/* 4. Easy (Fácil) */}
              <button
                onClick={() => handleRating(Rating.Easy)}
                className="flex flex-col items-center justify-center p-3 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60 rounded-2xl transition-all active:scale-95 shadow-sm cursor-pointer group"
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs text-blue-400 font-mono">[4]</span>
                  <span className="text-sm font-black">🔵 Fácil</span>
                </div>
                <span className="text-[11px] font-bold text-blue-700/90 dark:text-blue-300 mt-1 bg-blue-100 dark:bg-blue-900/50 px-2.5 py-0.5 rounded-full group-hover:scale-105 transition-transform">
                  +{previews[Rating.Easy].formatted}
                </span>
              </button>
            </div>
          )}
        </div>

      </div>
    );
  };

  // Tela 3: Estatísticas Cognitivas de Memória
  const renderStats = () => {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 pb-16 animate-in fade-in slide-in-from-bottom-6 duration-500">
        
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2.5">
              <BarChart3 className="text-[#ff6b00]" /> Dashboard da Memória & FSRS
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mt-1">
              Métricas cognitivas de fixação, estados e projeção de revisões futuras
            </p>
          </div>
          <button
            onClick={() => setCurrentScreen('decks')}
            className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-bold text-xs hover:bg-gray-200 transition"
          >
            ← Voltar
          </button>
        </div>

        {/* 4 Cards Principais de Indicadores */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          
          <div className="bg-white dark:bg-zinc-800/90 p-5 rounded-3xl border border-gray-200 dark:border-zinc-700 shadow-sm text-center">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Total de Flashcards</span>
            <p className="text-3xl font-black text-gray-900 dark:text-white mt-1.5">{memoryStats.totalCards}</p>
            <p className="text-[11px] text-gray-400 mt-1">Base completa</p>
          </div>

          <div className="bg-white dark:bg-zinc-800/90 p-5 rounded-3xl border border-gray-200 dark:border-zinc-700 shadow-sm text-center">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Retenção Estimada</span>
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1.5">{memoryStats.avgRetrievability}%</p>
            <p className="text-[11px] text-gray-400 mt-1">Probabilidade média de recall</p>
          </div>

          <div className="bg-white dark:bg-zinc-800/90 p-5 rounded-3xl border border-gray-200 dark:border-zinc-700 shadow-sm text-center">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Para Hoje</span>
            <p className="text-3xl font-black text-[#ff6b00] dark:text-[#ff8533] mt-1.5">{memoryStats.dueToday}</p>
            <p className="text-[11px] text-gray-400 mt-1">Atingiram limiar ótimo</p>
          </div>

          <div className="bg-white dark:bg-zinc-800/90 p-5 rounded-3xl border border-gray-200 dark:border-zinc-700 shadow-sm text-center">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Próximos 7 Dias</span>
            <p className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-1.5">{memoryStats.dueNext7Days}</p>
            <p className="text-[11px] text-gray-400 mt-1">Demanda semanal</p>
          </div>

        </div>

        {/* Distribuição por Estados da Memória */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          
          <div className="bg-white dark:bg-zinc-800/90 border border-gray-200 dark:border-zinc-700 rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-700 dark:text-zinc-300 mb-4 flex items-center gap-2">
              <BrainCircuit size={16} className="text-[#ff6b00]" /> Distribuição por Estados Cognitivos
            </h3>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-blue-600 dark:text-blue-400">🔵 Novos (Nunca estudados)</span>
                  <span>{memoryStats.countNew} ({memoryStats.totalCards > 0 ? Math.round((memoryStats.countNew / memoryStats.totalCards) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-zinc-700 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: `${(memoryStats.countNew / (memoryStats.totalCards || 1)) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-orange-600 dark:text-orange-400">🟠 Aprendizagem (Em aquisição)</span>
                  <span>{memoryStats.countLearning} ({memoryStats.totalCards > 0 ? Math.round((memoryStats.countLearning / memoryStats.totalCards) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-zinc-700 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-orange-500 h-full rounded-full" style={{ width: `${(memoryStats.countLearning / (memoryStats.totalCards || 1)) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-emerald-600 dark:text-emerald-400">🟢 Revisão (Memória Estabilizada)</span>
                  <span>{memoryStats.countReview} ({memoryStats.totalCards > 0 ? Math.round((memoryStats.countReview / memoryStats.totalCards) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-zinc-700 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(memoryStats.countReview / (memoryStats.totalCards || 1)) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-red-600 dark:text-red-400">🔴 Reaprendizagem (Falhas Recentes)</span>
                  <span>{memoryStats.countRelearning} ({memoryStats.totalCards > 0 ? Math.round((memoryStats.countRelearning / memoryStats.totalCards) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-zinc-700 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-red-500 h-full rounded-full" style={{ width: `${(memoryStats.countRelearning / (memoryStats.totalCards || 1)) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Projeção Temporal */}
          <div className="bg-white dark:bg-zinc-800/90 border border-gray-200 dark:border-zinc-700 rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-700 dark:text-zinc-300 mb-4 flex items-center gap-2">
              <CalendarClock size={16} className="text-[#ff6b00]" /> Projeção de Carga de Revisão
            </h3>

            <div className="grid grid-cols-3 gap-3 text-center pt-2">
              <div className="bg-gray-50 dark:bg-zinc-900 p-4 rounded-2xl border border-gray-100 dark:border-zinc-700">
                <span className="text-xs text-gray-400 font-semibold">Hoje</span>
                <p className="text-2xl font-black text-[#ff6b00] mt-1">{memoryStats.dueToday}</p>
              </div>

              <div className="bg-gray-50 dark:bg-zinc-900 p-4 rounded-2xl border border-gray-100 dark:border-zinc-700">
                <span className="text-xs text-gray-400 font-semibold">14 Dias</span>
                <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{memoryStats.dueNext14Days}</p>
              </div>

              <div className="bg-gray-50 dark:bg-zinc-900 p-4 rounded-2xl border border-gray-100 dark:border-zinc-700">
                <span className="text-xs text-gray-400 font-semibold">30 Dias</span>
                <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{memoryStats.dueNext30Days}</p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-2xl text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2">
              <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
              <span>
                Com o teto de <strong>{maxIntervalDays} dias</strong> do modo ativo ({STUDY_MODES_CONFIG[studyMode].shortName}), todos os cartões são garantidos de serem revistos antes da prova sem buracos de memória.
              </span>
            </div>
          </div>

        </div>

      </div>
    );
  };

  // Tela 4: Relatório pós-sessão
  const renderReport = () => {
    const totalAnswered = currentDeck.length;
    const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

    return (
      <div className="max-w-3xl mx-auto px-4 py-8 pb-16 animate-in fade-in slide-in-from-bottom-8 duration-500">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-2 text-center">
          Relatório de Sessão FSRS Concursos
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 text-center mb-8">
          Sua sessão foi processada com sucesso no modo {STUDY_MODES_CONFIG[studyMode].name} e salva no Tracker.
        </p>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-3xl border border-gray-200 dark:border-zinc-700 shadow-sm text-center">
            <CheckCircle className="mx-auto text-emerald-500 dark:text-emerald-400 mb-2" size={32} />
            <p className="text-gray-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">Aproveitamento</p>
            <p className="text-4xl font-black text-gray-900 dark:text-white mt-1">{accuracy}%</p>
            <p className="text-gray-400 text-xs mt-1">{correctCount} de {totalAnswered} acertos</p>
          </div>

          <div className="bg-[#fff4ed] dark:bg-[#210e00] p-6 rounded-3xl border border-[#ffd4b8] dark:border-[#592200] shadow-sm text-center flex flex-col justify-center items-center">
            <FileText className="text-[#ff6b00] dark:text-[#ff8533] mb-2" size={32} />
            <p className="text-[#803200] dark:text-[#ffad77] text-xs font-bold uppercase tracking-wider">Tempo Registrado</p>
            <p className="text-2xl font-black text-[#ff6b00] dark:text-[#ff8533] mt-1">+{modalData.tempo} minutos</p>
            <p className="text-xs text-[#a64800] dark:text-[#cca080] mt-1">Salvo em delta_estudos</p>
          </div>

          <div className="bg-white dark:bg-zinc-800 p-6 rounded-3xl border border-gray-200 dark:border-zinc-700 shadow-sm text-center flex flex-col justify-center">
            <Target className="mx-auto text-blue-500 mb-2" size={32} />
            <p className="text-gray-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">Modo Utilizado</p>
            <p className="text-xl font-black text-gray-900 dark:text-white mt-1">{STUDY_MODES_CONFIG[studyMode].shortName}</p>
            <p className="text-xs text-gray-400 mt-1">Teto de {maxIntervalDays} dias</p>
          </div>
        </div>

        {/* Distribuição de Respostas */}
        <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-3xl p-6 shadow-sm mb-8">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-4 flex items-center gap-2">
            <Gauge size={16} className="text-[#ff6b00]" /> Classificação das Respostas
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-2xl border border-red-100 dark:border-red-900/40">
              <span className="text-xs font-bold text-red-600 dark:text-red-400">🔴 Errei</span>
              <p className="text-2xl font-black text-red-700 dark:text-red-300 mt-1">{sessionRatings.again}</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-100 dark:border-amber-900/40">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">🟡 Difícil</span>
              <p className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">{sessionRatings.hard}</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-900/40">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">🟢 Bom</span>
              <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">{sessionRatings.good}</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-2xl border border-blue-100 dark:border-blue-900/40">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">🔵 Fácil</span>
              <p className="text-2xl font-black text-blue-700 dark:text-blue-300 mt-1">{sessionRatings.easy}</p>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => setCurrentScreen('decks')}
            className="w-full sm:w-auto px-8 py-3.5 bg-[#ff6b00] hover:bg-[#e65c00] text-white font-extrabold text-sm rounded-2xl shadow-md transition-all active:scale-95"
          >
            Voltar aos Baralhos
          </button>
          <button
            onClick={() => startDeck(todayCards, `Revisões do Dia (${STUDY_MODES_CONFIG[studyMode].shortName})`)}
            disabled={todayCards.length === 0}
            className="w-full sm:w-auto px-8 py-3.5 bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 font-bold text-sm rounded-2xl hover:bg-gray-200 transition"
          >
            Continuar Revisando ({todayCards.length})
          </button>
        </div>

      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f12] text-gray-900 dark:text-zinc-100 font-sans transition-colors duration-200">
      
      {/* Top Navigation */}
      {renderNavbar()}

      {/* Main Screens Router */}
      <main>
        {currentScreen === 'decks' && renderDecks()}
        {currentScreen === 'flashcards' && renderFlashcard()}
        {currentScreen === 'stats' && renderStats()}
        {currentScreen === 'report' && renderReport()}
      </main>

      {/* Modal de Salvar Sessão */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-2 font-bold text-xl">
                ✓
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">Sessão Concluída!</h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                Grave o tempo de estudo no Tracker do AVA Delta
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">
                  Tempo Estudado (minutos)
                </label>
                <input
                  type="number"
                  min="1"
                  value={modalData.tempo}
                  onChange={(e) => setModalData({ ...modalData, tempo: Number(e.target.value) })}
                  className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-zinc-100 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">
                  Observações da Sessão
                </label>
                <input
                  type="text"
                  placeholder="Ex: Foco em Crimes contra a Vida e Prazos"
                  value={modalData.obs}
                  onChange={(e) => setModalData({ ...modalData, obs: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 dark:text-zinc-100"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-3">
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setCurrentScreen('report');
                }}
                className="flex-1 py-3 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-xl font-bold text-xs"
              >
                Pular Registro
              </button>
              <button
                onClick={confirmSaveSession}
                className="flex-1 py-3 bg-[#ff6b00] hover:bg-[#e65c00] text-white rounded-xl font-extrabold text-xs shadow-md shadow-[#ff6b00]/20"
              >
                Salvar no Tracker
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Criar / Editar Flashcard */}
      <CardCreatorModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingCard(null);
        }}
        onSaveCard={handleSaveCustomCard}
        availableDecks={allDecks}
        editingCard={editingCard}
      />

      {/* Modal Gerenciador de Flashcards Próprios */}
      <CustomCardsManager
        isOpen={isManagerModalOpen}
        onClose={() => setIsManagerModalOpen(false)}
        customCards={customCards}
        availableDecks={allDecks}
        fsrsData={fsrsData}
        onEditCard={(card, deckId) => {
          setEditingCard({ card, deckId });
          setIsManagerModalOpen(false);
          setIsCreateModalOpen(true);
        }}
        onDeleteCard={handleDeleteCustomCard}
        onOpenCreateModal={() => {
          setEditingCard(null);
          setIsCreateModalOpen(true);
        }}
        onImportCards={handleImportCustomCards}
      />

    </div>
  );
}
