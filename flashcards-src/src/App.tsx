import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Layers, Flame, ArrowLeft, CheckCircle, Play,
  CalendarClock, BookOpen, FileText, Sun, Moon,
  BrainCircuit, Sparkles, Plus, Bookmark,
  BarChart3, Info, X, Edit3, Cloud
} from 'lucide-react';
import { bancosDeQuestoes, type Card, type Deck } from './data';
import {
  Rating,
  CardState,
  MasteryTier,
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
import { AuthModal } from './AuthModal';
import { supabase, uploadAvaToCloud, downloadAvaFromCloud, type User } from './supabase';



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
    <div className="inline-flex items-center gap-2 bg-[#131929] border border-white/10 px-3 py-1 rounded-full shadow-sm select-none h-9">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${isRunning ? 'bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse' : 'bg-amber-500'}`} />
      <span className="font-mono font-bold text-xs sm:text-[13.5px] text-[#ff8533] min-w-[62px] tracking-wider">
        {timeFormatted}
      </span>
      <div className="w-[1px] h-3.5 bg-white/15 mx-0.5 flex-shrink-0" />
      <div className="inline-flex items-center gap-1">
        {!isRunning ? (
          <button
            onClick={handlePlay}
            className="w-5.5 h-5.5 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white rounded-md flex items-center justify-center transition cursor-pointer"
            title="Iniciar / Continuar cronômetro"
          >
            <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4" /></svg>
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="w-5.5 h-5.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-md flex items-center justify-center transition cursor-pointer"
            title="Pausar cronômetro"
          >
            <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor"><rect x="5" y="4" width="4" height="16" rx="1" /><rect x="15" y="4" width="4" height="16" rx="1" /></svg>
          </button>
        )}
        <button
          onClick={handleStop}
          className="w-5.5 h-5.5 bg-blue-400 hover:bg-red-500 active:scale-95 text-white rounded-md flex items-center justify-center transition cursor-pointer"
          title="Finalizar e Salvar tempo estudado"
        >
          <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor"><rect x="5" y="5" width="14" height="14" rx="2" /></svg>
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'decks' | 'flashcards' | 'report' | 'stats'>('decks');
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Navigation & Drawer
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Custom Flashcards, Custom Decks & Card Overrides
  const [customCards, setCustomCards] = useState<Card[]>([]);
  const [customDecks, setCustomDecks] = useState<Deck[]>([]);
  const [cardOverrides, setCardOverrides] = useState<Record<string, Partial<Card> & { _deleted?: boolean }>>({});
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
  const [managerInitialDeck, setManagerInitialDeck] = useState<string>('all');
  const [managerInitialOrigin, setManagerInitialOrigin] = useState<'all' | 'custom' | 'standard'>('all');
  const [editingCard, setEditingCard] = useState<{ card: Card; deckId: string } | null>(null);

  // Stopwatch Modal State
  const [isStopwatchModalOpen, setIsStopwatchModalOpen] = useState(false);
  const [stopwatchData, setStopwatchData] = useState({
    date: '',
    tempo: '00:15:00',
    materia: 'DP',
    categoria: 'Revisão / Flashcards',
    assunto: 'Flashcards Atena',
    acertos: 0,
    erros: 0,
    paginas: 0,
    obs: '',
  });

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
  const [cardLatencyMs, setCardLatencyMs] = useState<number | undefined>(undefined);
  const [liveElapsedMs, setLiveElapsedMs] = useState<number>(0);
  const cardStartTimeRef = useRef<number>(performance.now());
  const [currentStreak, setCurrentStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [, setIncorrectCards] = useState<Card[]>([]);
  const [, setSessionRatings] = useState<RatingCounts>({ again: 0, hard: 0, good: 0, easy: 0 });

  const sessionStartTimeRef = useRef<number>(Date.now());

  // Cloud Auth & Sync State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);

  // Monitorar Autenticação e Sincronizar ao Iniciar
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setSupabaseUser(user);
      if (user) {
        downloadAvaFromCloud(user).then((res) => {
          if (res.applied) {
            try {
              const sc = localStorage.getItem('atena_custom_cards');
              if (sc) setCustomCards(JSON.parse(sc));
              const sd = localStorage.getItem('atena_custom_decks');
              if (sd) setCustomDecks(JSON.parse(sd));
              const so = localStorage.getItem('atena_card_overrides');
              if (so) setCardOverrides(JSON.parse(so));
              const sf = localStorage.getItem('atena_srs');
              if (sf) setFsrsData(JSON.parse(sf));
            } catch (e) {}
          }
        });
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseUser(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // 1. Carregar Custom Cards, Decks e Overrides do localStorage
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
      const savedOverrides = localStorage.getItem('atena_card_overrides');
      if (savedOverrides) {
        setCardOverrides(JSON.parse(savedOverrides));
      }
    } catch (e) {
      console.error('Erro ao ler custom cards/decks/overrides:', e);
    }
  }, []);

  // 2. Mesclar Baralhos Oficiais com Custom Decks, Overrides e Inserir Custom Cards
  const allDecks: Deck[] = useMemo(() => {
    const merged: Deck[] = bancosDeQuestoes.map((d) => {
      const activeCards: Card[] = [];
      d.cards.forEach((c) => {
        const override = cardOverrides[c.id];
        if (override && override._deleted) return; // Cartão ocultado/excluído
        activeCards.push(override ? { ...c, ...override, deckId: d.id } : { ...c, deckId: d.id });
      });
      return {
        ...d,
        cards: activeCards,
      };
    });

    customDecks.forEach((cd) => {
      if (!merged.find((m) => m.id === cd.id)) {
        merged.push({
          ...cd,
          cards: [],
        });
      }
    });

    customCards.forEach((c) => {
      const override = cardOverrides[c.id];
      if (override && override._deleted) return;
      const cardToUse = override ? { ...c, ...override } : c;
      const targetDeckId = cardToUse.deckId || 'dp';
      const deck = merged.find((m) => m.id === targetDeckId);
      if (deck) {
        if (!deck.cards.some((existing) => existing.id === cardToUse.id)) {
          deck.cards.push({ ...cardToUse, isCustom: true });
        }
      } else {
        if (merged.length > 0 && !merged[0].cards.some((existing) => existing.id === cardToUse.id)) {
          merged[0].cards.push({ ...cardToUse, isCustom: true });
        }
      }
    });

    return merged;
  }, [customCards, customDecks, cardOverrides]);

  const allCardsFlat = useMemo(() => {
    return allDecks.flatMap((d) =>
      d.cards.map((c) => ({
        ...c,
        deckId: c.deckId || d.id,
        deckTitle: d.titulo,
        sigla: d.sigla,
      }))
    );
  }, [allDecks]);

  // Recalcular cartões devidos hoje de acordo com o modo
  const calculateTodayCards = useCallback((data: FSRSData, decks: Deck[], mode = studyMode) => {
    const now = Date.now();
    const due: Card[] = [];
    const allCards = decks.flatMap((deck) => deck.cards);

    allCards.forEach((card) => {
      const cardFsrs = data[card.id];

      if (mode === StudyMode.Gargalos) {
        if (cardFsrs && (cardFsrs.lapses > 0 || cardFsrs.flag === 'red' || card.flag === 'red' || cardFsrs.difficulty >= 7)) {
          due.push(card);
        }
      } else if (!cardFsrs || cardFsrs.state === CardState.New || !cardFsrs.reps || cardFsrs.reps === 0) {
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
    if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
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
    setCardLatencyMs(undefined);
    setLiveElapsedMs(0);
    cardStartTimeRef.current = performance.now();
    sessionStartTimeRef.current = Date.now();
    setCurrentStreak(0);
    setCorrectCount(0);
    setIncorrectCards([]);
    setSessionRatings({ again: 0, hard: 0, good: 0, easy: 0 });
    setCurrentScreen('flashcards');
  };

  const flipCard = useCallback(() => {
    if (!isFlipped) {
      const elapsed = Math.round(performance.now() - cardStartTimeRef.current);
      setCardLatencyMs(elapsed);
    }
    setIsFlipped((prev) => !prev);
  }, [isFlipped]);

  // Cronômetro ao vivo durante a leitura da frente
  useEffect(() => {
    if (currentScreen !== 'flashcards' || isFlipped) return;
    const interval = setInterval(() => {
      setLiveElapsedMs(Math.round(performance.now() - cardStartTimeRef.current));
    }, 100);
    return () => clearInterval(interval);
  }, [currentScreen, isFlipped, cardIndex]);

  const openSaveModal = (_newFsrs?: FSRSData) => {
    // 1. Obter tempo exato do Cronômetro Global do cabeçalho
    let formattedTime = '00:05:00';
    try {
      const raw = localStorage.getItem('delta_stopwatch_state');
      if (raw) {
        const state = JSON.parse(raw);
        let totalSec = state.accumulatedSec || 0;
        if (state.isRunning && state.startTimestamp) {
          totalSec += Math.max(0, Math.floor((Date.now() - state.startTimestamp) / 1000));
        }
        if (totalSec > 0) {
          const h = Math.floor(totalSec / 3600);
          const m = Math.floor((totalSec % 3600) / 60);
          const s = totalSec % 60;
          formattedTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        } else {
          // Se o cronômetro do topo estava zerado, usar o tempo real decorrido desde o início da sessão
          const realElapsedSec = Math.max(1, Math.floor((Date.now() - sessionStartTimeRef.current) / 1000));
          const h = Math.floor(realElapsedSec / 3600);
          const m = Math.floor((realElapsedSec % 3600) / 60);
          const s = realElapsedSec % 60;
          formattedTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }
      }
    } catch(e) {}

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    setStopwatchData({
      date: dateStr,
      tempo: formattedTime,
      materia: currentDeck.length > 0 ? (currentDeck[0].deckId?.toUpperCase() || 'DP') : 'DP',
      categoria: 'Revisão / Flashcards',
      assunto: deckName ? `Flashcards - ${deckName}` : `Flashcards Atena (${STUDY_MODES_CONFIG[studyMode].shortName})`,
      acertos: correctCount,
      erros: Math.max(0, currentDeck.length - correctCount),
      paginas: 0,
      obs: `Sessão de Flashcards concluída · Modo ${STUDY_MODES_CONFIG[studyMode].name}`,
    });

    setIsStopwatchModalOpen(true);
  };

  const handleRating = (rating: Rating) => {
    const card = currentDeck[cardIndex];
    const newFsrs: FSRSData = { ...fsrsData };
    const currentCardData: FSRSCard | undefined = newFsrs[card.id];

    if (studyMode !== StudyMode.Simulado) {
      const updatedCard = scheduleFSRSCard(
        currentCardData,
        card.id,
        rating,
        desiredRetention,
        maxIntervalDays,
        new Date(),
        cardLatencyMs,
        fsrsData
      );
      newFsrs[card.id] = updatedCard;
      setFsrsData(newFsrs);
      localStorage.setItem('atena_srs', JSON.stringify(newFsrs));
    }

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
      setCardLatencyMs(undefined);
      setLiveElapsedMs(0);
      cardStartTimeRef.current = performance.now();
      setCardIndex((prev) => prev + 1);
    } else {
      openSaveModal(newFsrs);
    }
  };

  const handleToggleCardFlag = (targetFlag: FlagColor | null) => {
    if (!currentDeck || currentDeck.length === 0) return;
    const card = currentDeck[cardIndex];
    card.flag = targetFlag;

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

    // Gravar em overrides
    const newOverrides = {
      ...cardOverrides,
      [card.id]: { ...(cardOverrides[card.id] || {}), flag: targetFlag }
    };
    setCardOverrides(newOverrides);
    localStorage.setItem('atena_card_overrides', JSON.stringify(newOverrides));

    // Auto-sync com a nuvem
    uploadAvaToCloud(supabaseUser);
  };

  // Salvar ou Editar Card (Universal)
  const handleSaveCard = (cardsToSave: Card | Card[], deckId: string, closeModal = true) => {
    const list = Array.isArray(cardsToSave) ? cardsToSave : [cardsToSave];
    
    list.forEach(card => {
      // Se for card padrão (não custom), salvar em overrides
      if (!card.isCustom && bancosDeQuestoes.some(d => d.cards.some(c => c.id === card.id))) {
        const newOverrides = {
          ...cardOverrides,
          [card.id]: {
            assunto: card.assunto,
            frente: card.frente,
            verso: card.verso,
            extra: card.extra,
            flag: card.flag,
            tags: card.tags,
            imageUrl: card.imageUrl,
            align: card.align,
            targetCloze: card.targetCloze,
          }
        };
        setCardOverrides(newOverrides);
        localStorage.setItem('atena_card_overrides', JSON.stringify(newOverrides));
      } else {
        // É custom card
        const updatedCustom = [...customCards];
        const idx = updatedCustom.findIndex(c => c.id === card.id);
        if (idx >= 0) {
          updatedCustom[idx] = { ...card, deckId };
        } else {
          updatedCustom.push({ ...card, deckId, isCustom: true });
        }
        setCustomCards(updatedCustom);
        localStorage.setItem('atena_custom_cards', JSON.stringify(updatedCustom));
      }
    });

    // Atualizar em tempo real o baralho atual da sessão se estiver revisando
    setCurrentDeck(prev => prev.map(c => {
      const updated = list.find(savedCard => savedCard.id === c.id);
      return updated ? { ...c, ...updated, deckId } : c;
    }));

    setTodayCards(prev => prev.map(c => {
      const updated = list.find(savedCard => savedCard.id === c.id);
      return updated ? { ...c, ...updated, deckId } : c;
    }));

    if (closeModal) {
      setIsCreateModalOpen(false);
      setEditingCard(null);
    }

    // Auto-sync com a nuvem
    uploadAvaToCloud(supabaseUser);
  };

  // Excluir ou ocultar card
  const handleDeleteCard = (cardId: string, isStandard = false) => {
    if (!confirm('Deseja realmente remover este flashcard da sua base de estudos?')) return;

    if (isStandard) {
      const newOverrides = {
        ...cardOverrides,
        [cardId]: { ...(cardOverrides[cardId] || {}), _deleted: true }
      };
      setCardOverrides(newOverrides);
      localStorage.setItem('atena_card_overrides', JSON.stringify(newOverrides));
    } else {
      const updated = customCards.filter(c => c.id !== cardId);
      setCustomCards(updated);
      localStorage.setItem('atena_custom_cards', JSON.stringify(updated));
    }
  };

  // Atalhos de teclado na revisão (Espaço, 1-4 e 'E' para Editar)
  useEffect(() => {
    if (currentScreen !== 'flashcards' || isStopwatchModalOpen || isCreateModalOpen || isManagerModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        const currentCard = currentDeck[cardIndex];
        if (currentCard) {
          setEditingCard({
            card: { ...currentCard },
            deckId: currentCard.deckId || (currentDeck[0]?.deckId ?? 'dp')
          });
          setIsCreateModalOpen(true);
        }
        return;
      }

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        flipCard();
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
  }, [currentScreen, isFlipped, cardIndex, currentDeck, isStopwatchModalOpen, isCreateModalOpen, isManagerModalOpen, flipCard]);

  // Manipulador de parada do Cronômetro Global (Sem alert!)
  const handleStopStopwatch = (minutes: number) => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    let formattedTime = `${minutes} min`;
    try {
      const raw = localStorage.getItem('delta_stopwatch_state');
      if (raw) {
        const state = JSON.parse(raw);
        const totalSec = state.accumulatedSec || (minutes * 60);
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const s = totalSec % 60;
        formattedTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      }
    } catch(e) {}

    setStopwatchData({
      date: dateStr,
      tempo: formattedTime,
      materia: currentDeck.length > 0 ? (currentDeck[0].deckId?.toUpperCase() || 'DP') : 'DP',
      categoria: 'Revisão / Flashcards',
      assunto: `Estudo de Flashcards Atena (${STUDY_MODES_CONFIG[studyMode].shortName})`,
      acertos: correctCount,
      erros: currentDeck.length > 0 ? Math.max(0, currentDeck.length - correctCount) : 0,
      paginas: 0,
      obs: `Sessão de Flashcards FSRS · Modo ${STUDY_MODES_CONFIG[studyMode].name}`,
    });
    setIsStopwatchModalOpen(true);
  };

  const handleSaveStopwatchToTracker = () => {
    try {
      let parsedMins = 1;
      if (typeof stopwatchData.tempo === 'string' && stopwatchData.tempo.includes(':')) {
        const parts = stopwatchData.tempo.split(':').map(p => parseInt(p) || 0);
        if (parts.length === 3) {
          parsedMins = Math.max(1, Math.round((parts[0] * 3600 + parts[1] * 60 + parts[2]) / 60));
        } else if (parts.length === 2) {
          parsedMins = Math.max(1, Math.round((parts[0] * 60 + parts[1]) / 60));
        }
      } else {
        parsedMins = Math.max(1, parseInt(String(stopwatchData.tempo)) || 1);
      }

      const raw = localStorage.getItem('delta_estudos');
      const logs = raw ? JSON.parse(raw) : [];
      const now = new Date();
      const dateStr = stopwatchData.date || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      logs.push({
        date: dateStr,
        mat: stopwatchData.materia,
        assunto: stopwatchData.assunto || 'Flashcards Atena FSRS',
        categoria: stopwatchData.categoria || 'Revisão / Flashcards',
        tempo: parsedMins,
        qts: (stopwatchData.acertos || 0) + (stopwatchData.erros || 0),
        acertos: stopwatchData.acertos || 0,
        erros: stopwatchData.erros || 0,
        paginas: stopwatchData.paginas || 0,
        obs: stopwatchData.obs || 'Sessão registrada via Atena Flashcards',
      });
      localStorage.setItem('delta_estudos', JSON.stringify(logs));
      setIsStopwatchModalOpen(false);

      // Auto-sync com a nuvem
      uploadAvaToCloud(supabaseUser);
      
      // Resetar cronômetro
      const resetSw = { isRunning: false, startTimestamp: 0, accumulatedSec: 0, isOpen: false };
      localStorage.setItem('delta_stopwatch_state', JSON.stringify(resetSw));
      window.dispatchEvent(new Event('storage'));

      if (currentScreen === 'flashcards') {
        setCurrentScreen('report');
      }
    } catch (e) {
      console.error('Erro ao salvar no delta_estudos:', e);
    }
  };

  const memoryStats = useMemo(() => {
    return computeMemoryStats(allCardsFlat.map(c => c.id), fsrsData);
  }, [fsrsData, allCardsFlat]);

  // ── HEADER CANÔNICO & DRAWER ──────────────────────────────
  const renderHeader = () => (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0b0f1a]/95 backdrop-blur-md border-b border-gray-200 dark:border-[rgba(255,255,255,0.09)] px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16 gap-3">
        
        {/* Esquerda: Menu Hamburger + Logotipo Canônico Delta AVA */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Abrir Menu Lateral"
            className="p-2 text-gray-700 dark:text-[#e8eaf0] hover:bg-gray-100 dark:hover:bg-[#1a2235] rounded-xl transition cursor-pointer text-lg font-bold"
          >
            ☰
          </button>

          <a
            href="../index.html"
            title="Voltar ao Dashboard Principal do AVA"
            className="flex items-center gap-2 group text-decoration-none"
          >
            <span className="text-xs font-extrabold tracking-wider text-[#ff6b00] uppercase border border-[#ff6b00] px-2.5 py-1 rounded-full font-mono group-hover:bg-[#ff6b00]/10 transition-colors shadow-sm">
              ⚖️ DELTA AVA
            </span>
          </a>

          <div className="hidden md:flex items-center gap-1.5 pl-2 border-l border-gray-200 dark:border-[rgba(255,255,255,0.09)] text-xs text-gray-400 dark:text-[#9aa5bb]">
            <span>/</span>
            <span className="font-semibold text-gray-700 dark:text-[#e8eaf0]">Atena Flashcards</span>
          </div>
        </div>

        {/* Centro: Modos de Estudo */}
        <div className="hidden lg:flex items-center bg-gray-100 dark:bg-[#131929] p-1 rounded-2xl border border-gray-200 dark:border-[rgba(255,255,255,0.08)] text-xs">
          {(Object.keys(STUDY_MODES_CONFIG) as StudyMode[]).map((m) => {
            const cfg = STUDY_MODES_CONFIG[m];
            const isSelected = studyMode === m;
            return (
              <button
                key={m}
                onClick={() => handleSelectStudyMode(m)}
                title={cfg.description}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-white dark:bg-[#1a2235] text-[#ff6b00] dark:text-[#ff8533] shadow-sm'
                    : 'text-gray-600 dark:text-[#9aa5bb] hover:text-gray-900 dark:hover:text-white'
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

        {/* Direita: Cloud, Stopwatch, Stats, Theme */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 ${
              supabaseUser
                ? 'bg-white dark:bg-[#131929] text-gray-800 dark:text-[#e8eaf0] border border-emerald-500/30 hover:border-emerald-500'
                : 'bg-white dark:bg-[#131929] text-gray-700 dark:text-[#e8eaf0] border border-gray-200 dark:border-[rgba(255,255,255,0.12)] hover:border-[#ff6b00] hover:text-[#ff8533]'
            }`}
            title={supabaseUser ? `Conectado como ${supabaseUser.email} · Clique para gerenciar nuvem` : "Entrar ou Criar Conta para sincronizar entre PC e Tablet"}
          >
            <span className="relative flex h-2 w-2">
              {supabaseUser && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${supabaseUser ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]' : 'bg-gray-400'}`}></span>
            </span>
            <Cloud size={14} className={supabaseUser ? 'text-emerald-500' : 'text-gray-400 dark:text-[#9aa5bb]'} />
            <span className="hidden sm:inline">{supabaseUser ? 'Sincronizado' : 'Conectar Nuvem'}</span>
          </button>

          <HeaderStopwatch onStopSession={handleStopStopwatch} />

          <button
            onClick={() => setCurrentScreen('stats')}
            className={`px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
              currentScreen === 'stats'
                ? 'bg-[#ff6b00] text-white border-[#ff6b00]'
                : 'bg-white dark:bg-[#131929] text-gray-700 dark:text-[#e8eaf0] border-gray-200 dark:border-[rgba(255,255,255,0.09)] hover:bg-gray-50 dark:hover:bg-[#1a2235]'
            }`}
            title="Estatísticas Cognitivas da Memória"
          >
            <BarChart3 size={15} className="text-[#ff6b00]" />
            <span className="hidden sm:inline">Estatísticas</span>
          </button>

          <button
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-[#131929] border border-gray-200 dark:border-[rgba(255,255,255,0.09)] text-gray-700 dark:text-[#e8eaf0] hover:bg-gray-50 dark:hover:bg-[#1a2235] transition cursor-pointer"
            title="Alternar Tema Claro / Escuro"
          >
            {isDarkMode ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
          </button>
        </div>

      </div>
    </header>
  );

  // ── TELA 1: BIBLIOTECA DE BARALHOS ────────────────────────
  const renderDecks = () => {
    const totalCardsCount = allDecks.reduce((acc, d) => acc + d.cards.length, 0);

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto px-4 py-8 pb-16">
        
        {/* Top Action & Stats Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-[#e8eaf0] flex items-center gap-2.5 font-display">
              <Layers className="text-[#ff6b00]" /> Biblioteca de Baralhos
            </h2>
            <p className="text-gray-500 dark:text-[#9aa5bb] text-xs sm:text-sm mt-1">
              Motor FSRS-NC 3.0 Neuro-Calibrado com Repetição Espaçada, Cloze e Destaques Jurídicos
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Botão Novo Flashcard */}
            <button
              onClick={() => {
                setEditingCard(null);
                setIsCreateModalOpen(true);
              }}
              className="px-4 py-2 bg-[#ff6b00] hover:bg-[#e65c00] text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Plus size={16} /> Novo Flashcard
            </button>

            {/* Botão Meus Cards */}
            <button
              onClick={() => {
                setManagerInitialDeck('all');
                setManagerInitialOrigin('custom');
                setIsManagerModalOpen(true);
              }}
              className="px-3.5 py-2 bg-white dark:bg-[#131929] hover:bg-gray-50 dark:hover:bg-[#1a2235] text-gray-700 dark:text-[#e8eaf0] border border-gray-200 dark:border-[rgba(255,255,255,0.09)] font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition cursor-pointer"
            >
              <Bookmark size={15} className="text-[#ff6b00]" /> Meus Cards ({customCards.length})
            </button>
          </div>
        </div>

        {/* Hero Card: Revisões do Dia + Modo Ativo */}
        <div className="bg-gradient-to-br from-[#fff4ed] to-[#ffe6d4] dark:from-[#131929] dark:to-[#0b0f1a] border-2 border-[#ffd4b8] dark:border-[#ff6b00]/30 rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all mb-8 relative overflow-hidden">
          
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-[#ff6b00]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="space-y-2 max-w-xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-[#ff6b00] text-white text-[11px] uppercase font-black px-3 py-1 rounded-full flex items-center gap-1 shadow-sm font-mono">
                  <Sparkles size={13} /> {STUDY_MODES_CONFIG[studyMode].name}
                </span>
                <span className="bg-white/80 dark:bg-[#1a2235] text-gray-700 dark:text-[#e8eaf0] text-[11px] font-bold px-2.5 py-1 rounded-full border border-gray-200/60 dark:border-[rgba(255,255,255,0.08)] font-mono">
                  Teto: Máx {maxIntervalDays} dias
                </span>
                <span className="bg-white/80 dark:bg-[#1a2235] text-gray-700 dark:text-[#e8eaf0] text-[11px] font-bold px-2.5 py-1 rounded-full border border-gray-200/60 dark:border-[rgba(255,255,255,0.08)] font-mono">
                  Meta: {Math.round(desiredRetention * 100)}% Retenção
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-[#803200] dark:text-[#e8eaf0] flex items-center gap-2 pt-1 font-display">
                <CalendarClock className="text-[#ff6b00]" size={26} />
                Revisões do Dia (FSRS Concursos)
              </h3>

              <p className="text-[#a64800] dark:text-[#9aa5bb] text-xs sm:text-sm font-medium leading-relaxed">
                Você possui <strong className="font-extrabold text-base text-[#803200] dark:text-[#ff8533]">{todayCards.length}</strong> cartões prontos para consolidar a curva do esquecimento com base no modelo neurocientífico.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
              <button
                onClick={() => startDeck(todayCards, `Revisões do Dia (${STUDY_MODES_CONFIG[studyMode].shortName})`)}
                disabled={todayCards.length === 0}
                className={`px-8 py-3.5 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                  todayCards.length > 0
                    ? 'bg-[#ff6b00] hover:bg-[#e65c00] text-white cursor-pointer hover:scale-105 active:scale-95 shadow-[#ff6b00]/30'
                    : 'bg-gray-300 dark:bg-[#1a2235] text-gray-500 dark:text-[#7d889e] cursor-not-allowed'
                }`}
              >
                <Play size={18} />
                Revisar Agora ({todayCards.length})
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Baralhos */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-[#e8eaf0] flex items-center gap-2 font-display">
            Baralhos de Estudo ({totalCardsCount} Cartões)
          </h3>
          <span className="text-xs text-gray-500 dark:text-[#9aa5bb] font-mono">
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
                className="bg-white dark:bg-[#131929] border border-gray-200 dark:border-[rgba(255,255,255,0.08)] rounded-3xl p-6 shadow-sm hover:border-[#ff6b00]/40 dark:hover:border-[#ff6b00]/40 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-[#ff6b00] dark:text-[#ff8533] font-mono font-bold">
                      {deck.sigla} · Carreira Policial
                    </span>
                    
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ff6b00]/15 text-[#ff6b00] dark:text-[#ff8533] font-mono">
                        {dueInDeck} para hoje
                      </span>

                      {customCountInDeck > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setManagerInitialDeck(deck.id);
                            setManagerInitialOrigin('custom');
                            setIsManagerModalOpen(true);
                          }}
                          title="Ver seus flashcards personalizados deste baralho"
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition cursor-pointer font-mono"
                        >
                          +{customCountInDeck} meus
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 dark:text-[#e8eaf0] mt-1.5 font-display">
                    {deck.titulo}
                  </h3>
                  <p className="text-gray-600 dark:text-[#9aa5bb] mt-2 text-xs sm:text-sm leading-relaxed">
                    {deck.descricao}
                  </p>
                </div>

                {/* Tópicos / Assuntos dropdown */}
                <div className="mt-4">
                  <details className="group/assunto">
                    <summary className="text-xs font-bold text-gray-500 dark:text-[#9aa5bb] cursor-pointer flex items-center gap-1.5 hover:text-[#ff6b00] transition list-none">
                      <span className="transform group-open/assunto:rotate-90 transition-transform text-[10px]">▶</span> Ver Tópicos Detalhados
                    </summary>
                    <div className="mt-3 flex flex-col gap-2 pl-3 border-l-2 border-[#ffe6d4] dark:border-[#ff6b00]/20 max-h-48 overflow-y-auto pr-1">
                      {Object.entries(
                        deck.cards.reduce((acc, card) => {
                          if (!acc[card.assunto]) acc[card.assunto] = [];
                          acc[card.assunto].push(card);
                          return acc;
                        }, {} as Record<string, Card[]>)
                      ).map(([assunto, cards]) => (
                        <div
                          key={assunto}
                          className="flex justify-between items-center bg-gray-50 dark:bg-[#0b0f1a] p-2 rounded-xl text-xs border border-gray-100 dark:border-[rgba(255,255,255,0.08)]"
                        >
                          <span className="text-gray-700 dark:text-[#e8eaf0] font-medium truncate pr-2" title={assunto}>
                            {assunto}
                          </span>
                          <button
                            onClick={() => startDeck(cards, `${deck.sigla}: ${assunto}`)}
                            className="shrink-0 bg-white dark:bg-[#131929] text-[#ff6b00] border border-gray-200 dark:border-[rgba(255,255,255,0.08)] hover:bg-[#ff6b00] hover:text-white px-2.5 py-1 rounded-lg font-bold transition shadow-sm cursor-pointer"
                          >
                            Estudar ({cards.length})
                          </button>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>

                {/* Ações do Rodapé do Baralho */}
                <div className="mt-6 flex justify-between items-center border-t border-gray-100 dark:border-[rgba(255,255,255,0.08)] pt-4">
                  <button
                    onClick={() => {
                      setManagerInitialDeck(deck.id);
                      setManagerInitialOrigin('all');
                      setIsManagerModalOpen(true);
                    }}
                    className="text-gray-500 dark:text-[#9aa5bb] hover:text-[#ff6b00] dark:hover:text-[#ff8533] text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    title="Visualizar e gerenciar todos os cartões desta matéria"
                  >
                    <BookOpen size={15} /> {deck.cards.length} Cartões
                  </button>

                  <button
                    onClick={() => startDeck(deck.cards, deck.titulo)}
                    className="text-[#ff6b00] dark:text-[#ff8533] font-extrabold text-xs sm:text-sm flex items-center gap-1 group-hover:gap-2 transition-all cursor-pointer"
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
  };

  // ── TELA 2: FLASHCARDS PLAYER ─────────────────────────────
  const renderFlashcard = () => {
    if (!currentDeck || currentDeck.length === 0) return null;
    const card = currentDeck[cardIndex];
    const cardFsrs = fsrsData[card.id];
    const isCloze = card.tipo === 'cloze' || hasCloze(card.frente);

    const previews = previewFSRSIntervals(cardFsrs, card.id, desiredRetention, maxIntervalDays, new Date(), cardLatencyMs);

    const cardState = cardFsrs?.state ?? CardState.New;
    const cardTier = cardFsrs?.masteryTier ?? MasteryTier.Acquisition;

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
            <span className="text-[11px] font-extrabold text-gray-400 dark:text-[#7d889e] uppercase tracking-wider font-mono">
              {deckName}
            </span>
            <span className="text-gray-900 dark:text-[#e8eaf0] font-extrabold text-sm sm:text-base font-display">
              Cartão {cardIndex + 1} de {currentDeck.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Botão de Editar Cartão Imediato */}
            <button
              onClick={() => {
                setEditingCard({
                  card: { ...card },
                  deckId: card.deckId || (currentDeck[0]?.deckId ?? 'dp')
                });
                setIsCreateModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#131929] border border-gray-200 dark:border-[rgba(255,255,255,0.08)] hover:border-[#ff6b00] text-gray-700 dark:text-[#e8eaf0] hover:text-[#ff6b00] dark:hover:text-[#ff8533] text-xs font-bold shadow-sm transition cursor-pointer"
              title="Editar este cartão agora (Atalho: Tecla E)"
            >
              <Edit3 size={13} className="text-[#ff6b00]" />
              <span className="hidden sm:inline">Editar</span>
              <kbd className="hidden md:inline-block px-1 py-0.2 text-[9px] font-mono bg-gray-100 dark:bg-[#1a2235] text-gray-400 rounded border border-gray-200 dark:border-white/10">E</kbd>
            </button>

            {/* Seletor rápido de bandeiras */}
            <div className="flex items-center bg-white dark:bg-[#131929] border border-gray-200 dark:border-[rgba(255,255,255,0.08)] p-1 rounded-xl shadow-sm gap-1">
              {(Object.keys(FLAG_CONFIG) as FlagColor[]).map((f) => (
                <button
                  key={f}
                  onClick={() => handleToggleCardFlag(currentFlag === f ? null : f)}
                  title={`Marcar como ${FLAG_CONFIG[f].label}`}
                  className={`w-5 h-5 rounded-full transition-all cursor-pointer ${
                    currentFlag === f ? 'scale-125 ring-2 ring-offset-1 ' + FLAG_CONFIG[f].ring : 'opacity-40 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: FLAG_CONFIG[f].color }}
                />
              ))}
            </div>

            {/* Ofensiva */}
            <div className="flex items-center gap-1.5 bg-[#fff4ed] dark:bg-[#131929] px-3.5 py-1.5 rounded-xl border border-[#ffe6d4] dark:border-[rgba(255,255,255,0.08)] shadow-sm">
              <Flame size={16} className="text-[#ff6b00] dark:text-[#ff8533]" />
              <span className="text-[#803200] dark:text-[#ffad77] font-bold text-xs font-mono">{currentStreak}</span>
            </div>

            <button
              onClick={() => setCurrentScreen('decks')}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-[#1a2235] transition cursor-pointer"
              title="Sair da sessão"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Card 3D Flip */}
        <div className="w-full min-h-[420px] perspective-1000">
          <div className={`relative w-full h-full transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
            
            {/* FRENTE DO CARTÃO */}
            <div className={`w-full min-h-[420px] bg-white dark:bg-[#131929] border-2 border-gray-200 dark:border-[rgba(255,255,255,0.09)] rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col justify-between ${isFlipped ? 'hidden' : 'flex'}`}>
              
              {/* Top Header da Frente */}
              <div className="flex items-center justify-between gap-2 border-b border-gray-100 dark:border-[rgba(255,255,255,0.08)] pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-gray-100 dark:bg-[#1a2235] text-gray-700 dark:text-[#e8eaf0] text-xs px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider font-mono">
                    {card.assunto}
                  </span>
                  
                  {cardTier === MasteryTier.Mastered && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                      💎 Dominado
                    </span>
                  )}
                  {cardTier === MasteryTier.Consolidated && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      🥈 Consolidado
                    </span>
                  )}

                  {cardState === CardState.New && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-mono">
                      🔵 Novo
                    </span>
                  )}
                  {cardState === CardState.Learning && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 font-mono">
                      🟠 Aprendizagem
                    </span>
                  )}
                  {cardState === CardState.Review && cardTier !== MasteryTier.Mastered && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
                      🟢 Revisão
                    </span>
                  )}
                  {cardState === CardState.Relearning && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 font-mono">
                      🔴 Reaprendizagem
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Cronômetro ao Vivo na Frente do Cartão */}
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold border transition-colors shadow-sm"
                    style={{
                      backgroundColor: liveElapsedMs <= 6000 ? 'rgba(16, 185, 129, 0.12)' : liveElapsedMs <= 15000 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                      color: liveElapsedMs <= 6000 ? '#10b981' : liveElapsedMs <= 15000 ? '#f59e0b' : '#ef4444',
                      borderColor: liveElapsedMs <= 6000 ? 'rgba(16, 185, 129, 0.3)' : liveElapsedMs <= 15000 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'
                    }}
                    title={liveElapsedMs <= 6000 ? "Zona de Fluência Rápida (Bônus FSRS)" : liveElapsedMs <= 15000 ? "Esforço Moderado" : "Alta Hesitação"}
                  >
                    <span className="animate-pulse">⏱️</span>
                    <span>{(liveElapsedMs / 1000).toFixed(1)}s</span>
                    <span className="hidden sm:inline text-[10px] font-normal opacity-80">
                      {liveElapsedMs <= 6000 ? '· Fluente' : liveElapsedMs <= 15000 ? '· Normal' : '· Hesitação'}
                    </span>
                  </div>

                  {card.targetCloze && card.targetCloze > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ff6b00]/15 text-[#ff6b00] dark:text-[#ff8533] border border-[#ff6b00]/30 font-mono">
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
                  className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-[#e8eaf0]"
                />

                {card.imageUrl && (
                  <div className="mt-4 flex justify-center">
                    <img
                      src={card.imageUrl}
                      alt="Imagem do cartão"
                      className="max-h-56 rounded-2xl border border-gray-200 dark:border-[rgba(255,255,255,0.08)] shadow-md object-contain"
                    />
                  </div>
                )}

                {card.tags && card.tags.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1 mt-4">
                    {card.tags.map((t) => (
                      <span key={t} className="text-[10px] font-semibold text-gray-400 dark:text-[#7d889e] bg-gray-100 dark:bg-[#1a2235] px-2 py-0.5 rounded-md font-mono">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Rodapé da Frente */}
              <div className="text-center text-xs text-gray-400 dark:text-[#7d889e] border-t border-gray-100 dark:border-[rgba(255,255,255,0.08)] pt-3 flex flex-col sm:flex-row items-center justify-between gap-1">
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

            {/* VERSO DO CARTÃO (GABARITO) */}
            <div className={`w-full min-h-[420px] bg-[#fffaf5] dark:bg-[#0b0f1a] border-2 border-[#ffd4b8] dark:border-[#ff6b00]/30 rounded-3xl p-6 sm:p-8 shadow-xl flex-col justify-between rotate-y-180 ${!isFlipped ? 'hidden' : 'flex'}`}>
              
              {/* Top Header do Verso */}
              <div className="flex items-center justify-between gap-2 border-b border-[#ffe6d4] dark:border-[rgba(255,255,255,0.08)] pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-[#ffe6d4] dark:bg-[#1a2235] text-[#803200] dark:text-[#ff8533] text-xs px-2.5 py-1 rounded-lg font-extrabold uppercase tracking-wider font-mono">
                    Gabarito & Fundamentação
                  </span>
                  <span className="bg-[#fff0e6] dark:bg-[#131929] text-[#ff6b00] dark:text-[#ff8533] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#ffd4b8] dark:border-[#ff6b00]/20 font-mono">
                    Retenção: {currentRText}
                  </span>
                  
                  {cardLatencyMs !== undefined && (
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 font-mono ${
                      cardLatencyMs <= 6000
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : 'bg-gray-100 dark:bg-[#1a2235] text-gray-600 dark:text-[#9aa5bb] border-gray-200 dark:border-[rgba(255,255,255,0.08)]'
                    }`}>
                      {cardLatencyMs <= 6000
                        ? `⚡ ${(cardLatencyMs / 1000).toFixed(1)}s (Fluência Rápida)`
                        : `⏱️ ${(cardLatencyMs / 1000).toFixed(1)}s`}
                    </span>
                  )}

                  {cardFsrs?.consecutiveCorrect && cardFsrs.consecutiveCorrect > 1 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-mono">
                      🔥 {cardFsrs.consecutiveCorrect} acertos seguidos
                    </span>
                  )}
                  {cardTier === MasteryTier.Mastered && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                      💎 Dominado
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
                    className="text-lg sm:text-xl font-bold text-[#803200] dark:text-[#e8eaf0]"
                  />
                ) : (
                  <RichContentRenderer
                    content={card.verso}
                    isBack={true}
                    align={card.align || 'left'}
                    className="text-base sm:text-lg font-medium text-[#803200] dark:text-[#e8eaf0]"
                  />
                )}

                {card.extra && (
                  <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#131929] border border-[#ffe6d4] dark:border-[rgba(255,255,255,0.08)] text-xs sm:text-sm text-[#803200] dark:text-[#9aa5bb] shadow-sm">
                    📝 <strong>Fundamentação:</strong> {card.extra}
                  </div>
                )}

                {card.imageUrl && (
                  <div className="mt-3 flex justify-center">
                    <img
                      src={card.imageUrl}
                      alt="Imagem do cartão"
                      className="max-h-56 rounded-2xl border border-[#ffd4b8] dark:border-[rgba(255,255,255,0.08)] shadow-md object-contain"
                    />
                  </div>
                )}
              </div>

              {/* Rodapé do Verso */}
              <div className="text-center text-xs text-[#a64800] dark:text-[#9aa5bb] border-t border-[#ffe6d4] dark:border-[rgba(255,255,255,0.08)] pt-3 font-semibold">
                Classifique sua lembrança abaixo (Teclas 1, 2, 3 ou 4) para o agendamento FSRS
              </div>
            </div>

          </div>
        </div>

        {/* Botões de Ação & Classificação FSRS */}
        <div className="mt-6 w-full">
          {!isFlipped ? (
            <button
              onClick={flipCard}
              className="w-full h-16 bg-[#ff6b00] hover:bg-[#e65c00] text-white rounded-2xl font-extrabold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
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
                <span className="text-[11px] font-bold text-red-600/90 dark:text-red-300 mt-1 bg-red-100 dark:bg-red-900/50 px-2.5 py-0.5 rounded-full group-hover:scale-105 transition-transform font-mono">
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
                <span className="text-[11px] font-bold text-amber-700/90 dark:text-amber-300 mt-1 bg-amber-100 dark:bg-amber-900/50 px-2.5 py-0.5 rounded-full group-hover:scale-105 transition-transform font-mono">
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
                <span className="text-[11px] font-bold text-emerald-700/90 dark:text-emerald-300 mt-1 bg-emerald-100 dark:bg-emerald-900/50 px-2.5 py-0.5 rounded-full group-hover:scale-105 transition-transform font-mono">
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
                <span className="text-[11px] font-bold text-blue-700/90 dark:text-blue-300 mt-1 bg-blue-100 dark:bg-blue-900/50 px-2.5 py-0.5 rounded-full group-hover:scale-105 transition-transform font-mono">
                  +{previews[Rating.Easy].formatted}
                </span>
              </button>
            </div>
          )}
        </div>

      </div>
    );
  };

  // ── TELA 3: ESTATÍSTICAS DA MEMÓRIA ───────────────────────
  const renderStats = () => {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 pb-16 animate-in fade-in slide-in-from-bottom-6 duration-500">
        
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-[#e8eaf0] flex items-center gap-2.5 font-display">
              <BarChart3 className="text-[#ff6b00]" /> Dashboard da Memória & FSRS
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-[#9aa5bb] mt-1">
              Métricas cognitivas de fixação, estados e projeção de revisões futuras
            </p>
          </div>
          <button
            onClick={() => setCurrentScreen('decks')}
            className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#1a2235] text-gray-700 dark:text-[#e8eaf0] font-bold text-xs hover:bg-gray-200 dark:hover:bg-[#1f2a3c] transition cursor-pointer"
          >
            ← Voltar
          </button>
        </div>

        {/* 4 Cards Principais */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-[#131929] p-5 rounded-3xl border border-gray-200 dark:border-[rgba(255,255,255,0.08)] shadow-sm text-center">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-[#9aa5bb] font-mono">Total de Flashcards</span>
            <p className="text-3xl font-black text-gray-900 dark:text-[#e8eaf0] mt-1.5 font-mono">{memoryStats.totalCards}</p>
            <p className="text-[11px] text-gray-400 mt-1">Base completa</p>
          </div>

          <div className="bg-white dark:bg-[#131929] p-5 rounded-3xl border border-gray-200 dark:border-[rgba(255,255,255,0.08)] shadow-sm text-center">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-[#9aa5bb] font-mono">Retenção Média</span>
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1.5 font-mono">{memoryStats.avgRetrievability}%</p>
            <p className="text-[11px] text-gray-400 mt-1">Probabilidade de recall</p>
          </div>

          <div className="bg-white dark:bg-[#131929] p-5 rounded-3xl border border-gray-200 dark:border-[rgba(255,255,255,0.08)] shadow-sm text-center">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center justify-center gap-1 font-mono">
              💎 Dominados
            </span>
            <p className="text-3xl font-black text-purple-600 dark:text-purple-400 mt-1.5 font-mono">{memoryStats.countTier3}</p>
            <p className="text-[11px] text-gray-400 mt-1">Memória profunda consolidada</p>
          </div>

          <div className="bg-white dark:bg-[#131929] p-5 rounded-3xl border border-gray-200 dark:border-[rgba(255,255,255,0.08)] shadow-sm text-center">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1 font-mono">
              ⏱️ Tempo Médio
            </span>
            <p className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-1.5 font-mono">{memoryStats.avgLatencySec > 0 ? `${memoryStats.avgLatencySec}s` : '—'}</p>
            <p className="text-[11px] text-gray-400 mt-1">Fluência de recuperação</p>
          </div>
        </div>

        {/* Níveis de Domínio & Estados */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-[#131929] border border-gray-200 dark:border-[rgba(255,255,255,0.08)] rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-700 dark:text-[#e8eaf0] mb-4 flex items-center gap-2 font-mono">
              <BrainCircuit size={16} className="text-[#ff6b00]" /> Níveis de Domínio (Mastery Tiers)
            </h3>

            <div className="space-y-3 font-mono">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-purple-600 dark:text-purple-400">💎 Tier 3: Dominados</span>
                  <span>{memoryStats.countTier3} ({memoryStats.totalCards > 0 ? Math.round((memoryStats.countTier3 / memoryStats.totalCards) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-[#0b0f1a] h-2.5 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: `${(memoryStats.countTier3 / (memoryStats.totalCards || 1)) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-emerald-600 dark:text-emerald-400">🥈 Tier 2: Consolidados</span>
                  <span>{memoryStats.countTier2} ({memoryStats.totalCards > 0 ? Math.round((memoryStats.countTier2 / memoryStats.totalCards) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-[#0b0f1a] h-2.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(memoryStats.countTier2 / (memoryStats.totalCards || 1)) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-blue-600 dark:text-blue-400">🥉 Tier 1: Aquisição Inicial</span>
                  <span>{memoryStats.countTier1} ({memoryStats.totalCards > 0 ? Math.round((memoryStats.countTier1 / memoryStats.totalCards) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-[#0b0f1a] h-2.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: `${(memoryStats.countTier1 / (memoryStats.totalCards || 1)) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Projeção Temporal */}
          <div className="bg-white dark:bg-[#131929] border border-gray-200 dark:border-[rgba(255,255,255,0.08)] rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-700 dark:text-[#e8eaf0] mb-4 flex items-center gap-2 font-mono">
              <CalendarClock size={16} className="text-[#ff6b00]" /> Projeção de Carga
            </h3>

            <div className="grid grid-cols-3 gap-3 text-center pt-2 font-mono">
              <div className="bg-gray-50 dark:bg-[#0b0f1a] p-4 rounded-2xl border border-gray-100 dark:border-[rgba(255,255,255,0.08)]">
                <span className="text-xs text-gray-400 font-semibold">Hoje</span>
                <p className="text-2xl font-black text-[#ff6b00] mt-1">{memoryStats.dueToday}</p>
              </div>

              <div className="bg-gray-50 dark:bg-[#0b0f1a] p-4 rounded-2xl border border-gray-100 dark:border-[rgba(255,255,255,0.08)]">
                <span className="text-xs text-gray-400 font-semibold">14 Dias</span>
                <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{memoryStats.dueNext14Days}</p>
              </div>

              <div className="bg-gray-50 dark:bg-[#0b0f1a] p-4 rounded-2xl border border-gray-100 dark:border-[rgba(255,255,255,0.08)]">
                <span className="text-xs text-gray-400 font-semibold">30 Dias</span>
                <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{memoryStats.dueNext30Days}</p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-[#0b0f1a] border border-[#ff6b00]/20 rounded-2xl text-xs text-[#9aa5bb] flex items-start gap-2">
              <Info size={16} className="text-[#ff6b00] shrink-0 mt-0.5" />
              <span>
                Com o teto de <strong>{maxIntervalDays} dias</strong> ({STUDY_MODES_CONFIG[studyMode].shortName}), todos os cartões são garantidos de serem revistos antes da prova sem buracos de memória.
              </span>
            </div>
          </div>
        </div>

      </div>
    );
  };

  // ── TELA 4: RELATÓRIO PÓS-SESSÃO ──────────────────────────
  const renderReport = () => {
    const totalAnswered = currentDeck.length;
    const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

    return (
      <div className="max-w-3xl mx-auto px-4 py-8 pb-16 animate-in fade-in slide-in-from-bottom-8 duration-500">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-[#e8eaf0] mb-2 text-center font-display">
          Relatório de Sessão FSRS Concursos
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-[#9aa5bb] text-center mb-8">
          Sua sessão foi processada com sucesso no modo {STUDY_MODES_CONFIG[studyMode].name} e salva no Tracker.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-[#131929] p-6 rounded-3xl border border-gray-200 dark:border-[rgba(255,255,255,0.08)] shadow-sm text-center">
            <CheckCircle className="mx-auto text-emerald-500 dark:text-emerald-400 mb-2" size={32} />
            <p className="text-gray-500 dark:text-[#9aa5bb] text-xs font-bold uppercase tracking-wider font-mono">Aproveitamento</p>
            <p className="text-4xl font-black text-gray-900 dark:text-[#e8eaf0] mt-1 font-mono">{accuracy}%</p>
            <p className="text-gray-400 text-xs mt-1">{correctCount} de {totalAnswered} acertos</p>
          </div>

          <div className="bg-white dark:bg-[#131929] p-6 rounded-3xl border border-gray-200 dark:border-[rgba(255,255,255,0.08)] shadow-sm text-center flex flex-col justify-center items-center">
            <FileText className="text-[#ff6b00] dark:text-[#ff8533] mb-2" size={32} />
            <p className="text-gray-500 dark:text-[#9aa5bb] text-xs font-bold uppercase tracking-wider font-mono">Tempo Registrado</p>
            <p className="text-2xl font-black text-[#ff6b00] dark:text-[#ff8533] mt-1 font-mono">{stopwatchData.tempo.includes(':') ? stopwatchData.tempo : `+${stopwatchData.tempo} min`}</p>
            <p className="text-xs text-gray-400 mt-1">Salvo em delta_estudos</p>
          </div>

          <div className="bg-white dark:bg-[#131929] p-6 rounded-3xl border border-gray-200 dark:border-[rgba(255,255,255,0.08)] shadow-sm text-center">
            <Flame className="mx-auto text-amber-500 dark:text-amber-400 mb-2" size={32} />
            <p className="text-gray-500 dark:text-[#9aa5bb] text-xs font-bold uppercase tracking-wider font-mono">Ofensiva de Acertos</p>
            <p className="text-4xl font-black text-amber-500 dark:text-amber-400 mt-1 font-mono">{currentStreak}</p>
            <p className="text-gray-400 text-xs mt-1">Seguidos sem errar</p>
          </div>
        </div>

        <div className="flex justify-center gap-3">
          <button
            onClick={() => setCurrentScreen('decks')}
            className="px-6 py-3 bg-[#ff6b00] hover:bg-[#e65c00] text-white font-bold text-sm rounded-2xl shadow-lg transition cursor-pointer"
          >
            Voltar à Biblioteca de Baralhos
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f4f6fa] dark:bg-[#0b0f1a] text-[#0f172a] dark:text-[#e8eaf0] transition-colors duration-200">
      
      {/* ── SIDEBAR DRAWER MENU CANÔNICO ── */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[900] transition-opacity duration-300 ${
          isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsSidebarOpen(false)}
      />

      <div
        className={`fixed left-0 top-0 bottom-0 w-[300px] bg-white dark:bg-[#131929] border-r border-gray-200 dark:border-[rgba(255,255,255,0.09)] z-[901] transition-transform duration-300 shadow-2xl flex flex-col ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 border-b border-gray-100 dark:border-[rgba(255,255,255,0.08)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚖️</span>
            <h2 className="text-base font-extrabold text-gray-900 dark:text-[#e8eaf0] font-display">
              Menu Delta
            </h2>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a2235] transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
          <a
            href="../index.html"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-gray-700 dark:text-[#9aa5bb] hover:text-[#ff6b00] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1a2235] transition"
          >
            <span>🏠</span> Home / Dashboard
          </a>
          <a
            href="../index.html#edital"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-gray-700 dark:text-[#9aa5bb] hover:text-[#ff6b00] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1a2235] transition"
          >
            <span>📋</span> Edital Verticalizado
          </a>
          <a
            href="../index.html#conquistas"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-gray-700 dark:text-[#9aa5bb] hover:text-[#ff6b00] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1a2235] transition"
          >
            <span>🏆</span> Conquistas & Medalhas
          </a>
          <a
            href="../index.html#panels"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-gray-700 dark:text-[#9aa5bb] hover:text-[#ff6b00] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1a2235] transition"
          >
            <span>📚</span> Biblioteca de Painéis
          </a>
          <a
            href="../index.html#history"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-gray-700 dark:text-[#9aa5bb] hover:text-[#ff6b00] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1a2235] transition"
          >
            <span>📜</span> Histórico de Estudos
          </a>
          
          <div className="pt-2 border-t border-gray-100 dark:border-[rgba(255,255,255,0.08)]">
            <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#ff6b00]/10 text-[#ff6b00] dark:text-[#ff8533] border border-[#ff6b00]/20">
              <span>⚡</span> Módulo Flashcards (Atena)
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-[rgba(255,255,255,0.08)] text-[11px] text-gray-400 dark:text-[#7d889e] text-center font-mono">
          AVA Delta · Ambiente Virtual
        </div>
      </div>

      {renderHeader()}

      <main>
        {currentScreen === 'decks' && renderDecks()}
        {currentScreen === 'flashcards' && renderFlashcard()}
        {currentScreen === 'report' && renderReport()}
        {currentScreen === 'stats' && renderStats()}
      </main>

      {/* MODAL UNIVERSAL DE CRIAÇÃO / EDIÇÃO */}
      <CardCreatorModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingCard(null);
        }}
        onSaveCard={handleSaveCard}
        availableDecks={allDecks}
        editingCard={editingCard}
      />

      {/* GERENCIADOR E EDITOR UNIVERSAL DE CARDS */}
      <CustomCardsManager
        isOpen={isManagerModalOpen}
        onClose={() => setIsManagerModalOpen(false)}
        allCards={allCardsFlat}
        availableDecks={allDecks}
        fsrsData={fsrsData}
        initialDeckFilter={managerInitialDeck}
        initialOriginFilter={managerInitialOrigin}
        onEditCard={(card, deckId) => {
          setEditingCard({ card, deckId });
          setIsManagerModalOpen(false);
          setIsCreateModalOpen(true);
        }}
        onDeleteCard={handleDeleteCard}
        onOpenCreateModal={(defaultDeckId) => {
          setEditingCard(defaultDeckId ? { card: { id: '', deckId: defaultDeckId, assunto: '', frente: '', verso: '', tipo: 'basico' }, deckId: defaultDeckId } : null);
          setIsManagerModalOpen(false);
          setIsCreateModalOpen(true);
        }}
        onImportCards={(imported) => {
          const updated = [...customCards, ...imported];
          setCustomCards(updated);
          localStorage.setItem('atena_custom_cards', JSON.stringify(updated));
        }}
      />

      {/* MODAL DE REGISTRO DO CRONÔMETRO ESTILIZADO (PADRÃO CANÔNICO IDÊNTICO AO INDEX) */}
      {isStopwatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-[#131929] border border-gray-200 dark:border-[rgba(255,255,255,0.1)] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[rgba(255,255,255,0.08)] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">⏱️</span>
                <h3 className="text-base font-extrabold text-gray-900 dark:text-[#e8eaf0] font-display">
                  Registro de Estudo
                </h3>
              </div>
              <button
                onClick={() => setIsStopwatchModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5 max-h-[72vh] overflow-y-auto pr-1">
              {/* LINHA 1: DATA E TEMPO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase text-gray-400 dark:text-[#9aa5bb] tracking-wider">
                    Data
                  </label>
                  <input
                    type="date"
                    value={stopwatchData.date}
                    onChange={(e) => setStopwatchData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full mt-1 p-2.5 bg-gray-50 dark:bg-[#0b0f1a] border border-gray-200 dark:border-[rgba(255,255,255,0.08)] rounded-xl text-xs font-bold text-gray-900 dark:text-[#e8eaf0] focus:border-[#ff6b00] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-gray-400 dark:text-[#9aa5bb] tracking-wider">
                    Tempo (HH:MM:SS ou min)
                  </label>
                  <input
                    type="text"
                    value={stopwatchData.tempo}
                    onChange={(e) => setStopwatchData(prev => ({ ...prev, tempo: e.target.value }))}
                    placeholder="00:45:00"
                    className="w-full mt-1 p-2.5 bg-gray-50 dark:bg-[#0b0f1a] border border-gray-200 dark:border-[rgba(255,255,255,0.08)] rounded-xl text-xs font-bold text-gray-900 dark:text-[#e8eaf0] focus:border-[#ff6b00] outline-none font-mono"
                  />
                </div>
              </div>

              {/* LINHA 2: MATÉRIA E CATEGORIA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase text-gray-400 dark:text-[#9aa5bb] tracking-wider">
                    Matéria
                  </label>
                  <select
                    value={stopwatchData.materia}
                    onChange={(e) => setStopwatchData(prev => ({ ...prev, materia: e.target.value }))}
                    className="w-full mt-1 p-2.5 bg-gray-50 dark:bg-[#0b0f1a] border border-gray-200 dark:border-[rgba(255,255,255,0.08)] rounded-xl text-xs font-bold text-gray-900 dark:text-[#e8eaf0] focus:border-[#ff6b00] outline-none"
                  >
                    <option value="DP">Direito Penal (DP)</option>
                    <option value="DPP">Dir. Processual Penal (DPP)</option>
                    <option value="DC">Dir. Constitucional (DC)</option>
                    <option value="DA">Dir. Administrativo (DA)</option>
                    <option value="DCV">Direito Civil (DCV)</option>
                    <option value="ML">Medicina Legal (ML)</option>
                    <option value="LPE">Leg. Penal Especial (LPE)</option>
                    <option value="DH">Direitos Humanos (DH)</option>
                    <option value="DE">Dir. Empresarial (DE)</option>
                    <option value="CR">Criminologia (CR)</option>
                    <option value="RLM/REV">Revisão / Flashcards</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase text-gray-400 dark:text-[#9aa5bb] tracking-wider">
                    Categoria
                  </label>
                  <select
                    value={stopwatchData.categoria}
                    onChange={(e) => setStopwatchData(prev => ({ ...prev, categoria: e.target.value }))}
                    className="w-full mt-1 p-2.5 bg-gray-50 dark:bg-[#0b0f1a] border border-gray-200 dark:border-[rgba(255,255,255,0.08)] rounded-xl text-xs font-bold text-gray-900 dark:text-[#e8eaf0] focus:border-[#ff6b00] outline-none"
                  >
                    <option value="Teoria">Teoria</option>
                    <option value="Questões">Questões</option>
                    <option value="Revisão / Flashcards">Revisão / Flashcards</option>
                    <option value="Simulado">Simulado</option>
                    <option value="Lei Seca">Lei Seca</option>
                    <option value="Jurisprudência">Jurisprudência</option>
                    <option value="Discursiva">Discursiva</option>
                  </select>
                </div>
              </div>

              {/* LINHA 3: TÓPICO / ASSUNTO */}
              <div>
                <label className="text-[11px] font-bold uppercase text-gray-400 dark:text-[#9aa5bb] tracking-wider">
                  Tópico / Assunto do Edital
                </label>
                <input
                  type="text"
                  value={stopwatchData.assunto}
                  onChange={(e) => setStopwatchData(prev => ({ ...prev, assunto: e.target.value }))}
                  placeholder="Ex: Teoria do Crime, Princípios..."
                  className="w-full mt-1 p-2.5 bg-gray-50 dark:bg-[#0b0f1a] border border-gray-200 dark:border-[rgba(255,255,255,0.08)] rounded-xl text-xs text-gray-900 dark:text-[#e8eaf0] focus:border-[#ff6b00] outline-none"
                />
              </div>

              {/* LINHA 4: QUESTÕES & PÁGINAS (CAIXA CINZA) */}
              <div className="bg-gray-50 dark:bg-[#0b0f1a] border border-gray-200 dark:border-[rgba(255,255,255,0.08)] p-3 rounded-2xl">
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[10.5px] font-extrabold uppercase text-emerald-600 dark:text-[#10b981]">
                      Acertos
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={stopwatchData.acertos}
                      onChange={(e) => setStopwatchData(prev => ({ ...prev, acertos: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                      className="w-full mt-1 p-2 bg-white dark:bg-[#131929] border border-gray-200 dark:border-[rgba(255,255,255,0.08)] rounded-xl text-xs font-bold text-gray-900 dark:text-[#e8eaf0] focus:border-emerald-500 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] font-extrabold uppercase text-red-500">
                      Erros
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={stopwatchData.erros}
                      onChange={(e) => setStopwatchData(prev => ({ ...prev, erros: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                      className="w-full mt-1 p-2 bg-white dark:bg-[#131929] border border-gray-200 dark:border-[rgba(255,255,255,0.08)] rounded-xl text-xs font-bold text-gray-900 dark:text-[#e8eaf0] focus:border-red-500 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] font-extrabold uppercase text-gray-400 dark:text-[#9aa5bb]">
                      Páginas
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={stopwatchData.paginas}
                      onChange={(e) => setStopwatchData(prev => ({ ...prev, paginas: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                      className="w-full mt-1 p-2 bg-white dark:bg-[#131929] border border-gray-200 dark:border-[rgba(255,255,255,0.08)] rounded-xl text-xs font-bold text-gray-900 dark:text-[#e8eaf0] focus:border-[#ff6b00] outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* LINHA 5: COMENTÁRIOS */}
              <div>
                <label className="text-[11px] font-bold uppercase text-gray-400 dark:text-[#9aa5bb] tracking-wider">
                  Comentários & Anotações
                </label>
                <input
                  type="text"
                  value={stopwatchData.obs}
                  onChange={(e) => setStopwatchData(prev => ({ ...prev, obs: e.target.value }))}
                  placeholder="Dificuldades, artigos ou notas da sessão..."
                  className="w-full mt-1 p-2.5 bg-gray-50 dark:bg-[#0b0f1a] border border-gray-200 dark:border-[rgba(255,255,255,0.08)] rounded-xl text-xs text-gray-900 dark:text-[#e8eaf0] focus:border-[#ff6b00] outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-[rgba(255,255,255,0.08)] flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsStopwatchModalOpen(false);
                  if (currentScreen === 'flashcards') {
                    setCurrentScreen('report');
                  }
                }}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[rgba(255,255,255,0.08)] text-gray-600 dark:text-[#9aa5bb] font-bold text-xs hover:bg-gray-100 dark:hover:bg-[#1a2235] transition cursor-pointer"
              >
                Cancelar / Pular
              </button>
              <button
                onClick={handleSaveStopwatchToTracker}
                className="px-6 py-2.5 bg-[#ff6b00] hover:bg-[#e65c00] text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                Salvar Registro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE AUTENTICAÇÃO E SINCRONIZAÇÃO EM NUVEM */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSyncComplete={() => {
          try {
            const sc = localStorage.getItem('atena_custom_cards');
            if (sc) setCustomCards(JSON.parse(sc));
            const sd = localStorage.getItem('atena_custom_decks');
            if (sd) setCustomDecks(JSON.parse(sd));
            const so = localStorage.getItem('atena_card_overrides');
            if (so) setCardOverrides(JSON.parse(so));
            const sf = localStorage.getItem('atena_srs');
            if (sf) setFsrsData(JSON.parse(sf));
          } catch (e) {}
        }}
      />

    </div>
  );
}
