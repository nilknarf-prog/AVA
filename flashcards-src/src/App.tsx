import { useState, useEffect, useMemo } from 'react';
import {
  Layers, AlertTriangle, Flame, ArrowLeft, CheckCircle, XCircle, Play,
  CalendarClock, BookOpen, LogOut, FileText, Sun, Moon,
  BrainCircuit, Sparkles, Gauge, Plus, Bookmark
} from 'lucide-react';
import { bancosDeQuestoes, type Card, type Deck } from './data';
import {
  Rating,
  type FSRSCard,
  type FSRSData,
  scheduleFSRSCard,
  previewFSRSIntervals,
  migrateLegacySRS,
  calculateRetrievability,
} from './fsrs';
import { renderClozeFront, renderClozeBack, hasCloze } from './cloze';
import { CardCreatorModal } from './CardCreatorModal';
import { CustomCardsManager } from './CustomCardsManager';

// --- HIGHLIGHT ---
const KEYWORDS = ['Exceção', 'Súmula', 'Vedada', 'Proibida', 'Prazo', 'NÃO', 'INCONDICIONADA', 'GRAVE', 'SIM', 'SEMPRE', 'NUNCA', 'JAMAIS', 'APENAS', 'MAIOR', 'ROXIN', 'JAKOBS'];

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

interface RatingCounts {
  again: number;
  hard: number;
  good: number;
  easy: number;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'decks' | 'flashcards' | 'report'>('decks');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Custom Flashcards & Custom Decks State
  const [customCards, setCustomCards] = useState<Card[]>([]);
  const [customDecks, setCustomDecks] = useState<Deck[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<{ card: Card; deckId: string } | null>(null);

  // FSRS State
  const [fsrsData, setFsrsData] = useState<FSRSData>({});
  const [desiredRetention, setDesiredRetention] = useState<number>(0.90);
  const [todayCards, setTodayCards] = useState<Card[]>([]);

  // Review Session State
  const [currentDeck, setCurrentDeck] = useState<Card[]>([]);
  const [deckName, setDeckName] = useState('');
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCards, setIncorrectCards] = useState<Card[]>([]);
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

  // 2. Mesclar Baralhos Oficiais com Custom Decks e Inserir Custom Cards nos respectivos baralhos
  const allDecks: Deck[] = useMemo(() => {
    // Clona os baralhos oficiais
    const merged: Deck[] = bancosDeQuestoes.map((d) => ({
      ...d,
      cards: [...d.cards],
    }));

    // Injeta baralhos customizados criados pelo usuário
    customDecks.forEach((cd) => {
      if (!merged.find((m) => m.id === cd.id)) {
        merged.push({
          ...cd,
          cards: [],
        });
      }
    });

    // Injeta os cartões customizados em seus respectivos baralhos
    customCards.forEach((c) => {
      const targetDeckId = c.deckId || 'dp';
      const deck = merged.find((m) => m.id === targetDeckId);
      if (deck) {
        if (!deck.cards.some((existing) => existing.id === c.id)) {
          deck.cards.push(c);
        }
      } else {
        // Se o baralho não existir, coloca no primeiro
        if (merged.length > 0 && !merged[0].cards.some((existing) => existing.id === c.id)) {
          merged[0].cards.push(c);
        }
      }
    });

    return merged;
  }, [customCards, customDecks]);

  // Init Theme, Retention and Load FSRS
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

    // Retention Setting
    const savedRetention = localStorage.getItem('atena_retention');
    if (savedRetention) {
      const parsed = parseFloat(savedRetention);
      if (!isNaN(parsed) && parsed >= 0.7 && parsed <= 0.98) {
        setDesiredRetention(parsed);
      }
    }

    // FSRS Data & Migration
    const savedSrs = localStorage.getItem('atena_srs');
    if (savedSrs) {
      try {
        const raw = JSON.parse(savedSrs);
        const migrated = migrateLegacySRS(raw);
        setFsrsData(migrated);
        localStorage.setItem('atena_srs', JSON.stringify(migrated));
        calculateTodayCards(migrated, allDecks);
      } catch (e) {
        console.error('Erro ao ler atena_srs:', e);
        calculateTodayCards({}, allDecks);
      }
    } else {
      calculateTodayCards({}, allDecks);
    }
  }, [allDecks]);

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

  const changeRetention = (rate: number) => {
    setDesiredRetention(rate);
    localStorage.setItem('atena_retention', rate.toString());
  };

  const calculateTodayCards = (data: FSRSData, decks: Deck[]) => {
    const now = new Date().getTime();
    const due: Card[] = [];
    const allCards = decks.flatMap((deck) => deck.cards);
    allCards.forEach((card) => {
      const cardFsrs = data[card.id];
      if (cardFsrs && new Date(cardFsrs.nextReview).getTime() <= now) {
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
    setSessionRatings({ again: 0, hard: 0, good: 0, easy: 0 });
    setCurrentScreen('flashcards');
  };

  const openSaveModal = (newFsrs: FSRSData) => {
    const tempoTotal = Math.max(1, Math.round(currentDeck.length * 1.5));
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

    // Atualizar no motor FSRS
    const updatedCard = scheduleFSRSCard(currentCardData, card.id, rating, desiredRetention);
    newFsrs[card.id] = updatedCard;

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

    setFsrsData(newFsrs);
    localStorage.setItem('atena_srs', JSON.stringify(newFsrs));

    if (cardIndex < currentDeck.length - 1) {
      setIsFlipped(false);
      setCardIndex((prev) => prev + 1);
    } else {
      openSaveModal(newFsrs);
    }
  };

  const confirmSaveSession = () => {
    try {
      const logsStr = localStorage.getItem('delta_estudos') || '[]';
      const logs = JSON.parse(logsStr);
      logs.push({
        date: modalData.date,
        mat: 'RLM/REV',
        assunto: `Flashcards (FSRS): ${deckName}`,
        tempo: Number(modalData.tempo) || 0,
        qts: currentDeck.length,
        acertos: correctCount,
        obs: modalData.obs || `FSRS 90% | Errei:${sessionRatings.again} Dif:${sessionRatings.hard} Bom:${sessionRatings.good} Fac:${sessionRatings.easy}`,
      });
      localStorage.setItem('delta_estudos', JSON.stringify(logs));
    } catch (e) {
      console.error('Erro ao integrar tracker', e);
    }
    setShowSaveModal(false);
    calculateTodayCards(tempFsrs, allDecks);
    setCurrentScreen('report');
  };

  // --- HANDLERS PARA CARTÕES CUSTOMIZADOS ---
  const handleSaveCustomCard = (card: Card, deckId: string) => {
    let updatedCards = [...customCards];
    const existingIndex = updatedCards.findIndex((c) => c.id === card.id);

    if (existingIndex >= 0) {
      updatedCards[existingIndex] = { ...card, deckId };
    } else {
      updatedCards.push({ ...card, deckId });
    }

    setCustomCards(updatedCards);
    localStorage.setItem('atena_custom_cards', JSON.stringify(updatedCards));

    // Se o baralho for novo customizado
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

  // --- RENDERS ---
  const renderDecks = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-12">
      
      {/* Top Action & Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Layers className="text-[#ff6b00]" /> Biblioteca de Baralhos
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Selecione uma matéria ou crie seus próprios flashcards com Cloze Deletion
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

          {/* Botão Gerenciar Meus Cards */}
          <button
            onClick={() => setIsManagerModalOpen(true)}
            className="px-3.5 py-2 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 border border-gray-200 dark:border-zinc-700 font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Bookmark size={15} className="text-[#ff6b00]" /> Meus Cards ({customCards.length})
          </button>

          {/* Meta de Retenção */}
          <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 p-1 rounded-xl text-xs shadow-sm">
            <span className="text-gray-400 dark:text-gray-500 font-semibold px-1.5">Meta:</span>
            {[
              { label: '85%', val: 0.85, tip: 'Mais Rápido' },
              { label: '90%', val: 0.90, tip: 'Padrão Otimizado' },
              { label: '95%', val: 0.95, tip: 'Reta Final' },
            ].map((opt) => (
              <button
                key={opt.val}
                onClick={() => changeRetention(opt.val)}
                title={opt.tip}
                className={`px-2 py-1 rounded-lg font-bold transition-colors ${
                  desiredRetention === opt.val
                    ? 'bg-[#ff6b00] text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Card de Revisões do Dia */}
      <div className="bg-[#fff4ed] dark:bg-[#1a0a00] border border-[#ffe6d4] dark:border-[#4d1f00] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-[#803200] dark:text-[#ff9955] flex items-center gap-2">
                <CalendarClock className="text-[#ff6b00]" size={24} />
                Revisões do Dia (FSRS)
              </h3>
              <span className="bg-[#ffe6d4] dark:bg-[#4d1f00] text-[#803200] dark:text-[#ffad77] text-[10px] uppercase font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles size={12} /> DSR {Math.round(desiredRetention * 100)}%
              </span>
            </div>
            <p className="text-[#a64800] dark:text-[#cc6611] mt-2 font-medium">
              Você tem <span className="font-bold text-xl">{todayCards.length}</span> cartões que atingiram o limiar ótimo de recuperação para hoje.
            </p>
          </div>
          <button
            onClick={() => startDeck(todayCards, 'Revisões do Dia (FSRS)')}
            disabled={todayCards.length === 0}
            className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors shrink-0 shadow-md ${
              todayCards.length > 0
                ? 'bg-[#ff6b00] hover:bg-[#e65c00] text-white cursor-pointer'
                : 'bg-gray-300 dark:bg-zinc-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            <Play size={20} />
            Revisar Agora
          </button>
        </div>
      </div>

      {/* Lista de Baralhos */}
      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">
        Baralhos de Estudo ({allDecks.reduce((acc, d) => acc + d.cards.length, 0)} Cartões Totais)
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allDecks.map((deck) => {
          const customCountInDeck = deck.cards.filter((c) => c.isCustom).length;

          return (
            <div
              key={deck.id}
              className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400 font-bold">
                    {deck.sigla} • Carreira Policial
                  </span>
                  {customCountInDeck > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ff6b00]/10 text-[#ff6b00] dark:text-[#ff8533]">
                      +{customCountInDeck} personalizados
                    </span>
                  )}
                </div>
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
                      <div
                        key={assunto}
                        className="flex justify-between items-center bg-gray-50 dark:bg-zinc-800/80 p-2 rounded-lg text-sm border border-gray-100 dark:border-zinc-700"
                      >
                        <span className="text-gray-700 dark:text-gray-300 font-medium truncate pr-2" title={assunto}>
                          {assunto}
                        </span>
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
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 dark:text-gray-400 text-sm font-semibold flex items-center gap-1.5">
                    <BookOpen size={16} /> {deck.cards.length} Cartões
                  </span>
                  <button
                    onClick={() => {
                      setEditingCard(null);
                      setIsCreateModalOpen(true);
                    }}
                    className="p-1 rounded-lg text-gray-400 hover:text-[#ff6b00] hover:bg-gray-100 dark:hover:bg-zinc-700 transition"
                    title="Adicionar cartão neste baralho"
                  >
                    <Plus size={15} />
                  </button>
                </div>
                <button
                  onClick={() => startDeck(deck.cards, deck.titulo)}
                  className="text-[#ff6b00] dark:text-[#ff8533] font-bold flex items-center gap-1 group-hover:gap-2 transition-all"
                >
                  Estudar Tudo <ArrowLeft size={16} className="rotate-180" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderFlashcard = () => {
    if (!currentDeck || currentDeck.length === 0) return null;
    const card = currentDeck[cardIndex];
    const cardFsrs = fsrsData[card.id];
    const isCloze = card.tipo === 'cloze' || hasCloze(card.frente);

    // Previsão dos 4 intervalos FSRS em tempo real
    const previews = previewFSRSIntervals(cardFsrs, card.id, desiredRetention);

    // Calcular Retrievability instantânea se o card já tiver histórico
    let currentRText = 'Novo';
    if (cardFsrs && cardFsrs.stability > 0 && cardFsrs.lastReview) {
      const elapsedDays = Math.max(0, (new Date().getTime() - new Date(cardFsrs.lastReview).getTime()) / (1000 * 60 * 60 * 24));
      const r = calculateRetrievability(elapsedDays, cardFsrs.stability);
      currentRText = `${Math.round(r * 100)}%`;
    }

    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
        <div className="w-full flex justify-between items-center mb-6">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{deckName}</span>
            <span className="text-gray-900 dark:text-gray-100 font-bold">
              Cartão {cardIndex + 1} de {currentDeck.length}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* Indicador DSR */}
            {cardFsrs && (
              <div className="hidden sm:flex items-center gap-2 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 text-xs px-3 py-1.5 rounded-full border border-gray-200 dark:border-zinc-700 font-semibold" title="Modelo DSR (Dificuldade, Estabilidade e Retenção)">
                <Gauge size={14} className="text-[#ff6b00]" />
                <span>Estabilidade: <strong>{cardFsrs.stability}d</strong></span>
                <span>•</span>
                <span>Dificuldade: <strong>{cardFsrs.difficulty}</strong></span>
              </div>
            )}
            <div className="flex items-center gap-1.5 bg-[#fff4ed] dark:bg-[#331500] px-4 py-2 rounded-full border border-[#ffe6d4] dark:border-[#662a00]">
              <Flame size={18} className="text-[#ff6b00] dark:text-[#ff8533]" />
              <span className="text-[#803200] dark:text-[#ffad77] font-bold text-sm">Ofensiva: {currentStreak}</span>
            </div>
          </div>
        </div>

        {/* Card 3D Flip */}
        <div className="w-full min-h-[400px] perspective-1000">
          <div className={`relative w-full h-full transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
            
            {/* Frente */}
            <div className={`absolute w-full h-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-3xl p-8 shadow-lg flex flex-col justify-between backface-hidden ${isFlipped ? 'invisible' : 'visible'}`}>
              <div className="flex justify-between items-center">
                <span className="bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-gray-300 text-xs px-2.5 py-1 rounded-md font-semibold tracking-wide uppercase">
                  {card.assunto}
                </span>
                <span className="text-[11px] text-gray-400 font-medium">
                  {isCloze ? '🧩 Omissão de Palavra' : 'Clique em Revelar'}
                </span>
              </div>
              <div className="my-auto py-8 text-center">
                <div className="text-2xl font-semibold text-gray-900 dark:text-white leading-relaxed">
                  {isCloze ? renderClozeFront(card.frente) : card.frente}
                </div>
              </div>
              <div className="text-center text-xs text-gray-400">
                Toque no botão abaixo para conferir o gabarito
              </div>
            </div>

            {/* Verso */}
            <div className={`absolute w-full h-full bg-[#fff4ed] dark:bg-[#1a0a00] border-2 border-[#ffe6d4] dark:border-[#4d1f00] rounded-3xl p-8 shadow-lg flex flex-col justify-between backface-hidden rotate-y-180 ${!isFlipped ? 'invisible' : 'visible'}`}>
              <div className="flex justify-between items-center">
                <span className="bg-[#ffe6d4] dark:bg-[#4d1f00] text-[#803200] dark:text-[#ffad77] text-xs px-2.5 py-1 rounded-md font-bold tracking-wide uppercase">
                  Resposta e Fundamento
                </span>
                <span className="bg-[#fff0e6] dark:bg-[#331500] text-[#ff6b00] dark:text-[#ff8533] text-[10px] font-bold px-2 py-0.5 rounded border border-[#ffd4b8] dark:border-[#662a00]">
                  Retenção Atual: {currentRText}
                </span>
              </div>
              <div className="my-auto py-6">
                {isCloze ? (
                  <div className="space-y-4 text-center">
                    <div className="text-xl text-[#803200] dark:text-[#ffcfb3] leading-relaxed font-semibold">
                      {renderClozeBack(card.frente)}
                    </div>
                    {card.extra && (
                      <div className="inline-block p-3 rounded-xl bg-white/70 dark:bg-zinc-900/60 border border-[#ffe6d4] dark:border-[#4d1f00] text-xs text-[#803200] dark:text-[#ffad77]">
                        📝 <strong>Fundamentação:</strong> {card.extra}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-lg text-[#803200] dark:text-[#ffcfb3] leading-relaxed font-medium">
                      <HighlightText text={card.verso} />
                    </p>
                    {card.extra && (
                      <div className="p-3 rounded-xl bg-white/70 dark:bg-zinc-900/60 border border-[#ffe6d4] dark:border-[#4d1f00] text-xs text-[#803200] dark:text-[#ffad77]">
                        📝 <strong>Fundamentação:</strong> {card.extra}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="text-center text-xs text-[#a64800] dark:text-[#cc6611] font-semibold">
                Classifique sua lembrança abaixo para o FSRS recalcular o intervalo ideal
              </div>
            </div>

          </div>
        </div>

        {/* Barra de Botões FSRS */}
        <div className="mt-8 w-full">
          {!isFlipped ? (
            <button
              onClick={() => setIsFlipped(true)}
              className="w-full h-16 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-white text-white dark:text-gray-900 rounded-2xl font-bold text-lg shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              Revelar Resposta
            </button>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {/* 1. Again (Errei) */}
              <button
                onClick={() => handleRating(Rating.Again)}
                className="flex flex-col items-center justify-center p-3 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 rounded-2xl transition-all active:scale-95 shadow-sm cursor-pointer group"
              >
                <span className="text-sm font-bold">🔴 Errei</span>
                <span className="text-[11px] font-semibold text-red-500/80 dark:text-red-400/80 mt-0.5 bg-red-100 dark:bg-red-900/40 px-2 py-0.5 rounded-full group-hover:scale-105 transition-transform">
                  {previews[Rating.Again].formatted}
                </span>
              </button>

              {/* 2. Hard (Difícil) */}
              <button
                onClick={() => handleRating(Rating.Hard)}
                className="flex flex-col items-center justify-center p-3 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 rounded-2xl transition-all active:scale-95 shadow-sm cursor-pointer group"
              >
                <span className="text-sm font-bold">🟡 Difícil</span>
                <span className="text-[11px] font-semibold text-amber-600/80 dark:text-amber-400/80 mt-0.5 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full group-hover:scale-105 transition-transform">
                  +{previews[Rating.Hard].formatted}
                </span>
              </button>

              {/* 3. Good (Bom) */}
              <button
                onClick={() => handleRating(Rating.Good)}
                className="flex flex-col items-center justify-center p-3 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl transition-all active:scale-95 shadow-sm cursor-pointer group"
              >
                <span className="text-sm font-bold">🟢 Bom</span>
                <span className="text-[11px] font-semibold text-emerald-600/80 dark:text-emerald-400/80 mt-0.5 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full group-hover:scale-105 transition-transform">
                  +{previews[Rating.Good].formatted}
                </span>
              </button>

              {/* 4. Easy (Fácil) */}
              <button
                onClick={() => handleRating(Rating.Easy)}
                className="flex flex-col items-center justify-center p-3 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60 rounded-2xl transition-all active:scale-95 shadow-sm cursor-pointer group"
              >
                <span className="text-sm font-bold">🔵 Fácil</span>
                <span className="text-[11px] font-semibold text-blue-600/80 dark:text-blue-400/80 mt-0.5 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded-full group-hover:scale-105 transition-transform">
                  +{previews[Rating.Easy].formatted}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderReport = () => {
    const totalAnswered = currentDeck.length;
    const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

    return (
      <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-500 pb-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 text-center">Relatório de Sessão FSRS</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center mb-8">
          Sua sessão foi processada pelo algoritmo FSRS e integrada ao Tracker do Menu Principal.
        </p>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl border border-gray-100 dark:border-zinc-700 shadow-sm text-center">
            <CheckCircle className="mx-auto text-emerald-500 dark:text-emerald-400 mb-2" size={32} />
            <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wider">Aproveitamento</p>
            <p className="text-4xl font-black text-gray-900 dark:text-white mt-1">{accuracy}%</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">{correctCount} de {totalAnswered} acertos</p>
          </div>

          <div className="bg-[#fff4ed] dark:bg-[#1a0a00] p-6 rounded-2xl border border-[#ffe6d4] dark:border-[#4d1f00] shadow-sm text-center flex flex-col justify-center items-center">
            <FileText className="text-[#ff6b00] dark:text-[#ff8533] mb-2" size={32} />
            <p className="text-[#803200] dark:text-[#ffad77] text-sm font-semibold uppercase tracking-wider">Tempo Registrado</p>
            <p className="text-2xl font-bold text-[#ff6b00] dark:text-[#ff8533] mt-1">+{modalData.tempo} minutos</p>
            <p className="text-xs text-[#a64800] dark:text-[#cc6611] mt-1">Salvo em delta_estudos</p>
          </div>

          <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl border border-gray-100 dark:border-zinc-700 shadow-sm text-center flex flex-col justify-center">
            <BrainCircuit className="mx-auto text-blue-500 mb-2" size={32} />
            <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wider">Meta FSRS</p>
            <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{Math.round(desiredRetention * 100)}%</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Retenção Projetada</p>
          </div>
        </div>

        {/* Distribuição FSRS */}
        <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl p-6 shadow-sm mb-10">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-2">
            <Gauge size={16} className="text-[#ff6b00]" /> Distribuição de Respostas (FSRS)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="bg-red-50 dark:bg-red-950/30 p-3 rounded-xl border border-red-100 dark:border-red-900/40">
              <span className="text-xs font-bold text-red-600 dark:text-red-400 block">Errei (Again)</span>
              <span className="text-2xl font-black text-red-700 dark:text-red-300">{sessionRatings.again}</span>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-100 dark:border-amber-900/40">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 block">Difícil (Hard)</span>
              <span className="text-2xl font-black text-amber-800 dark:text-amber-300">{sessionRatings.hard}</span>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block">Bom (Good)</span>
              <span className="text-2xl font-black text-emerald-800 dark:text-emerald-300">{sessionRatings.good}</span>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-xl border border-blue-100 dark:border-blue-900/40">
              <span className="text-xs font-bold text-blue-700 dark:text-blue-400 block">Fácil (Easy)</span>
              <span className="text-2xl font-black text-blue-800 dark:text-blue-300">{sessionRatings.easy}</span>
            </div>
          </div>
        </div>

        {/* Caderno de Erros */}
        {incorrectCards.length > 0 && (
          <div className="mb-10">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <XCircle className="text-red-500" /> Caderno de Erros da Sessão ({incorrectCards.length})
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
            className="px-8 py-3 bg-[#ff6b00] hover:bg-[#e65c00] text-white font-bold rounded-xl transition-colors flex items-center gap-2 shadow-md cursor-pointer"
          >
            <Layers size={20} /> Voltar aos Baralhos
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 transition-colors duration-200 font-sans">
      <header className="sticky top-0 z-40 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 shadow-sm px-4 py-3 transition-colors duration-200">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400 font-bold leading-tight mb-0.5 flex items-center gap-1">
                <BrainCircuit size={12} className="text-[#ff6b00]" /> Motor FSRS v4.5 (Modelo DSR)
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                <span className="text-gray-900 dark:text-white">Atena:</span> <span className="text-[#ff6b00]">Flashcards</span>
              </h1>
            </div>
          </div>

          <nav className="flex items-center gap-3">
            <button
              onClick={() => {
                setEditingCard(null);
                setIsCreateModalOpen(true);
              }}
              className="px-3.5 py-1.5 bg-[#ff6b00] hover:bg-[#e65c00] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <Plus size={14} /> Novo Card
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
              title="Alternar Tema"
              aria-label="Alternar tema claro/escuro"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <a
              href="../index.html"
              className="px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-white transition-colors shadow-sm"
            >
              <LogOut size={16} /> <span className="hidden sm:inline">Menu Principal</span>
            </a>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        {currentScreen === 'flashcards' && (
          <button
            onClick={() => setCurrentScreen('decks')}
            className="mb-8 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium flex items-center gap-2 transition-colors cursor-pointer"
          >
            <ArrowLeft size={20} /> Abortar Sessão e Voltar
          </button>
        )}

        {currentScreen === 'decks' && renderDecks()}
        {currentScreen === 'flashcards' && renderFlashcard()}
        {currentScreen === 'report' && renderReport()}

        {/* Modal de Salvar Registro de Estudo */}
        {showSaveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-zinc-700">
              <div className="p-6 border-b border-gray-100 dark:border-zinc-700 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <BrainCircuit className="text-[#ff6b00]" /> Registro de Estudo (FSRS)
                </h3>
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
                    value={`Flashcards (FSRS): ${deckName}`}
                    readOnly
                    className="w-full bg-gray-100 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total de Cards</label>
                    <div className="w-full bg-gray-100 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-gray-600 dark:text-gray-400 text-center font-bold">
                      {currentDeck.length}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider mb-1">Acertos</label>
                    <div className="w-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/50 rounded-lg px-3 py-2 text-emerald-700 dark:text-emerald-400 text-center font-bold">
                      {correctCount} ({Math.round((correctCount / currentDeck.length) * 100)}%)
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
                  className="px-6 py-2 bg-[#ff6b00] hover:bg-[#e65c00] text-white font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Salvar Registro
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Criação / Edição de Flashcards */}
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

        {/* Modal Gerenciador de Flashcards do Usuário */}
        <CustomCardsManager
          isOpen={isManagerModalOpen}
          onClose={() => setIsManagerModalOpen(false)}
          customCards={customCards}
          availableDecks={allDecks}
          onEditCard={(card, deckId) => {
            setIsManagerModalOpen(false);
            setEditingCard({ card, deckId });
            setIsCreateModalOpen(true);
          }}
          onDeleteCard={handleDeleteCustomCard}
          onOpenCreateModal={() => {
            setEditingCard(null);
            setIsCreateModalOpen(true);
          }}
          onImportCards={handleImportCustomCards}
        />
      </main>
    </div>
  );
}
