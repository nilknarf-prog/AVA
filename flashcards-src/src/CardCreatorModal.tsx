import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X, Sparkles, Eye, Check, Bold, Italic, Underline, Strikethrough,
  Image as ImageIcon, Link as LinkIcon, Tag, AlignLeft, AlignCenter,
  AlignRight, AlignJustify, Scale, BookOpen, AlertTriangle, Lightbulb,
  ShieldAlert, Highlighter, Palette, Split, MousePointerClick
} from 'lucide-react';
import { type Card, type Deck } from './data';
import { wrapWithCloze, hasCloze, extractClozeNumbers } from './cloze';
import {
  RichContentRenderer, FLAG_CONFIG, type FlagColor, type TextAlignment,
  HIGHLIGHT_COLORS, FONT_COLORS
} from './richText';

interface CardCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCard: (card: Card | Card[], deckId: string, closeModal?: boolean) => void;
  availableDecks: Deck[];
  editingCard?: { card: Card; deckId: string } | null;
}

const COMMON_TAGS = [
  'lei-seca', 'stf', 'stj', 'jurisprudencia', 'sumula', 'delegado',
  'pos-edital', 'prazo', 'pegadinha', 'doutrina', 'constitucional', 'penal'
];

export const CardCreatorModal: React.FC<CardCreatorModalProps> = ({
  isOpen,
  onClose,
  onSaveCard,
  availableDecks,
  editingCard,
}) => {
  const [tipo, setTipo] = useState<'basico' | 'cloze'>('cloze');
  const [selectedDeckId, setSelectedDeckId] = useState<string>('dp');
  const [customDeckName, setCustomDeckName] = useState<string>('');
  const [isCreatingNewDeck, setIsCreatingNewDeck] = useState<boolean>(false);

  const [assunto, setAssunto] = useState<string>('');
  const [frente, setFrente] = useState<string>('');
  const [verso, setVerso] = useState<string>('');
  const [clozeText, setClozeText] = useState<string>('');
  const [extra, setExtra] = useState<string>('');

  // Novo: Modo de Omissão de Palavras (Mesmo cartão por clique vs Desmembrar em novos cartões)
  const [clozeMultiOption, setClozeMultiOption] = useState<'single_interactive' | 'multi_cards'>('single_interactive');
  const [previewTargetCloze, setPreviewTargetCloze] = useState<number>(0);
  const [previewRevealedClozes, setPreviewRevealedClozes] = useState<Set<number>>(new Set());

  // Campos ricos
  const [flag, setFlag] = useState<FlagColor | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [align, setAlign] = useState<TextAlignment>('left');

  // Modais de ferramentas da Toolbar
  const [previewSide, setPreviewSide] = useState<'frente' | 'verso'>('frente');
  const [showImageModal, setShowImageModal] = useState<boolean>(false);
  const [showLinkModal, setShowLinkModal] = useState<boolean>(false);
  const [showColorMenu, setShowColorMenu] = useState<boolean>(false);
  const [showHighlightMenu, setShowHighlightMenu] = useState<boolean>(false);
  const [showHintModal, setShowHintModal] = useState<boolean>(false);

  const [tempImageUrl, setTempImageUrl] = useState<string>('');
  const [linkText, setLinkText] = useState<string>('');
  const [linkUrl, setLinkUrl] = useState<string>('');
  const [hintInput, setHintInput] = useState<string>('');
  const [hintClozeMode, setHintClozeMode] = useState<'same' | 'new'>('new');
  const [savedFeedback, setSavedFeedback] = useState<boolean>(false);

  const [activeField, setActiveField] = useState<'frente' | 'verso' | 'cloze'>('cloze');
  const textareaFrenteRef = useRef<HTMLTextAreaElement>(null);
  const textareaVersoRef = useRef<HTMLTextAreaElement>(null);
  const textareaClozeRef = useRef<HTMLTextAreaElement>(null);

  // Detectar clozes disponíveis no texto
  const detectedClozeNumbers = useMemo(() => {
    return extractClozeNumbers(clozeText);
  }, [clozeText]);

  // Inicializar dados se estiver em modo de edição
  useEffect(() => {
    if (editingCard) {
      const { card, deckId } = editingCard;
      setSelectedDeckId(deckId);
      setAssunto(card.assunto || '');
      setExtra(card.extra || '');
      setFlag(card.flag || null);
      setTags(card.tags || []);
      setImageUrl(card.imageUrl || '');
      setAlign(card.align || 'left');
      setClozeMultiOption(card.clozeMode || 'single_interactive');

      if (card.tipo === 'cloze' || hasCloze(card.frente)) {
        setTipo('cloze');
        setClozeText(card.frente);
        setActiveField('cloze');
        setPreviewTargetCloze(card.targetCloze || 0);
      } else {
        setTipo('basico');
        setFrente(card.frente);
        setVerso(card.verso);
        setActiveField('frente');
      }
    } else {
      resetForm();
    }
  }, [editingCard, isOpen]);

  const resetForm = () => {
    setAssunto('');
    setFrente('');
    setVerso('');
    setClozeText('');
    setExtra('');
    setFlag(null);
    setTags([]);
    setTagInput('');
    setImageUrl('');
    setAlign('left');
    setClozeMultiOption('single_interactive');
    setPreviewTargetCloze(0);
    setPreviewRevealedClozes(new Set());
    setHintInput('');
    setShowHintModal(false);
    setShowImageModal(false);
    setShowLinkModal(false);
    setShowColorMenu(false);
    setShowHighlightMenu(false);
    setIsCreatingNewDeck(false);
    setCustomDeckName('');
  };

  if (!isOpen) return null;

  const getActiveTextarea = () => {
    if (tipo === 'cloze') return textareaClozeRef.current;
    return activeField === 'frente' ? textareaFrenteRef.current : textareaVersoRef.current;
  };

  const getActiveValue = () => {
    if (tipo === 'cloze') return clozeText;
    return activeField === 'frente' ? frente : verso;
  };

  const setActiveValue = (val: string) => {
    if (tipo === 'cloze') {
      setClozeText(val);
    } else if (activeField === 'frente') {
      setFrente(val);
    } else {
      setVerso(val);
    }
  };

  // Inserção de formatação
  const handleInsertFormat = (prefix: string, suffix: string, defaultPlaceholder = 'texto') => {
    const el = getActiveTextarea();
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const currentVal = getActiveValue();
    const selected = currentVal.slice(start, end) || defaultPlaceholder;
    const updated = currentVal.slice(0, start) + prefix + selected + suffix + currentVal.slice(end);

    setActiveValue(updated);

    setTimeout(() => {
      if (el) {
        el.focus();
        el.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
      }
    }, 50);
  };

  // Inserir Callout
  const handleInsertCallout = (type: string, titleHint: string) => {
    const el = getActiveTextarea();
    const currentVal = getActiveValue();
    const start = el ? el.selectionStart : currentVal.length;
    const end = el ? el.selectionEnd : currentVal.length;
    const selected = currentVal.slice(start, end) || titleHint;

    const calloutBlock = `\n:::${type}\n${selected}\n:::\n`;
    const updated = currentVal.slice(0, start) + calloutBlock + currentVal.slice(end);

    setActiveValue(updated);
  };

  // Inserção de Cloze (Mesmo Cartão vs Novo Cartão)
  const handleInsertCloze = (mode: 'same' | 'new' = 'new', hint = '') => {
    const el = textareaClozeRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;

    let clozeNum = 1;
    if (mode === 'same') {
      // Usar o índice 1 (ou o último índice existente para agrupar)
      clozeNum = detectedClozeNumbers.length > 0 ? detectedClozeNumbers[0] : 1;
    } else {
      // Incrementar para novo cartão
      const maxNum = detectedClozeNumbers.length > 0 ? Math.max(...detectedClozeNumbers) : 0;
      clozeNum = maxNum === 0 ? 1 : maxNum + 1;
    }

    const { newText, newCursorPos } = wrapWithCloze(clozeText, start, end, clozeNum, hint);
    setClozeText(newText);
    setShowHintModal(false);
    setHintInput('');

    setTimeout(() => {
      if (textareaClozeRef.current) {
        textareaClozeRef.current.focus();
        textareaClozeRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 50);
  };

  // Inserção de Link
  const handleApplyLink = () => {
    if (!linkUrl.trim()) return;
    const text = linkText.trim() || 'Ver referência';
    handleInsertFormat(`[${text}](`, `)`);
    setShowLinkModal(false);
    setLinkText('');
    setLinkUrl('');
  };

  // Inserção de Imagem (URL ou File)
  const handleApplyImage = () => {
    if (!tempImageUrl.trim()) return;
    setImageUrl(tempImageUrl.trim());
    setShowImageModal(false);
    setTempImageUrl('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setImageUrl(base64);
      setShowImageModal(false);
    };
    reader.readAsDataURL(file);
  };

  // Tags Handlers
  const handleAddTag = (rawTag: string) => {
    const clean = rawTag.replace(/^#/, '').trim().toLowerCase();
    if (!clean || tags.includes(clean)) return;
    setTags([...tags, clean]);
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Alternar revelação de um cloze na prévia
  const togglePreviewCloze = (index: number) => {
    setPreviewRevealedClozes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  // Salvar Flashcard (Único ou Multi-Cartões)
  const handleSave = (createAnother = false) => {
    if (!assunto.trim()) {
      alert('Por favor, informe o assunto ou tema do flashcard (ex: Teoria do Crime, Inquérito Policial).');
      return;
    }

    let targetDeckId = selectedDeckId;
    if (isCreatingNewDeck) {
      if (!customDeckName.trim()) {
        alert('Por favor, digite o nome do novo baralho.');
        return;
      }
      targetDeckId = 'custom_' + Date.now();
    }

    if (tipo === 'cloze') {
      if (!clozeText.trim() || !hasCloze(clozeText)) {
        alert('Para o tipo Cloze (Ocultação), inclua pelo menos uma marcação {{c1::palavra}} no texto.');
        return;
      }

      const clozeNums = extractClozeNumbers(clozeText);

      // CASO A: Desmembrar em Múltiplos Cartões Separados (c1, c2, c3...)
      if (clozeMultiOption === 'multi_cards' && clozeNums.length > 1 && !editingCard) {
        const cardsToCreate: Card[] = clozeNums.map((cNum, idx) => ({
          id: `user_card_${Date.now()}_c${cNum}`,
          assunto: `${assunto.trim()} [Card ${idx + 1}/${clozeNums.length}]`,
          frente: clozeText.trim(),
          verso: extra.trim() || `Termo c${cNum} memorizado.`,
          tipo: 'cloze',
          targetCloze: cNum,
          clozeMode: 'multi_cards',
          extra: extra.trim(),
          deckId: targetDeckId,
          isCustom: true,
          createdAt: new Date().toISOString(),
          flag,
          tags,
          imageUrl: imageUrl.trim() || undefined,
          align,
        }));

        onSaveCard(cardsToCreate, targetDeckId, !createAnother);
      } else {
        // CASO B: Cartão Único com Revelação Interativa (ou edição)
        const singleCard: Card = {
          id: editingCard ? editingCard.card.id : `user_card_${Date.now()}`,
          assunto: assunto.trim(),
          frente: clozeText.trim(),
          verso: extra.trim() || 'Termos ocultos memorizados.',
          tipo: 'cloze',
          targetCloze: 0,
          clozeMode: 'single_interactive',
          extra: extra.trim(),
          deckId: targetDeckId,
          isCustom: true,
          createdAt: editingCard?.card.createdAt || new Date().toISOString(),
          flag,
          tags,
          imageUrl: imageUrl.trim() || undefined,
          align,
        };

        onSaveCard(singleCard, targetDeckId, !createAnother);
      }
    } else {
      if (!frente.trim() || !verso.trim()) {
        alert('Preencha a Frente (Pergunta) e o Verso (Resposta) do flashcard.');
        return;
      }
      const basicCard: Card = {
        id: editingCard ? editingCard.card.id : `user_card_${Date.now()}`,
        assunto: assunto.trim(),
        frente: frente.trim(),
        verso: verso.trim(),
        tipo: 'basico',
        extra: extra.trim(),
        deckId: targetDeckId,
        isCustom: true,
        createdAt: editingCard?.card.createdAt || new Date().toISOString(),
        flag,
        tags,
        imageUrl: imageUrl.trim() || undefined,
        align,
      };

      onSaveCard(basicCard, targetDeckId, !createAnother);
    }

    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 1500);

    if (createAnother) {
      setFrente('');
      setVerso('');
      setClozeText('');
      setExtra('');
      setImageUrl('');
      setPreviewRevealedClozes(new Set());
      if (tipo === 'cloze' && textareaClozeRef.current) textareaClozeRef.current.focus();
      if (tipo === 'basico' && textareaFrenteRef.current) textareaFrenteRef.current.focus();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-zinc-800 rounded-3xl w-full max-w-3xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/70 dark:bg-zinc-900/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#fff4ed] dark:bg-[#331500] text-[#ff6b00] dark:text-[#ff8533] flex items-center justify-center font-bold shadow-sm">
              <Sparkles size={22} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                {editingCard ? 'Editar Flashcard Avançado' : 'Novo Flashcard Avançado'}
                {flag && (
                  <span
                    className="w-3.5 h-3.5 rounded-full inline-block shadow-sm"
                    style={{ backgroundColor: FLAG_CONFIG[flag].color }}
                    title={`Bandeira: ${FLAG_CONFIG[flag].label}`}
                  />
                )}
              </h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                Ocultação interativa por clique, múltiplos cartões, imagens e formatação rica
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          
          {/* Baralho & Tipo de Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">
                Baralho de Destino
              </label>
              {!isCreatingNewDeck ? (
                <div className="flex gap-2">
                  <select
                    value={selectedDeckId}
                    onChange={(e) => setSelectedDeckId(e.target.value)}
                    className="flex-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-[#ff6b00]"
                  >
                    {availableDecks.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.sigla} · {d.titulo}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsCreatingNewDeck(true)}
                    className="px-3 py-2 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-xl text-xs font-bold hover:bg-gray-200 transition"
                  >
                    + Novo
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nome do Novo Baralho"
                    value={customDeckName}
                    onChange={(e) => setCustomDeckName(e.target.value)}
                    className="flex-1 bg-white dark:bg-zinc-900 border border-[#ff6b00] rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-900 dark:text-zinc-100"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCreatingNewDeck(false)}
                    className="px-3 py-2 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 rounded-xl text-xs"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">
                Estrutura do Cartão
              </label>
              <div className="grid grid-cols-2 gap-2 bg-gray-100 dark:bg-zinc-900 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setTipo('cloze');
                    setActiveField('cloze');
                  }}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                    tipo === 'cloze'
                      ? 'bg-white dark:bg-zinc-800 text-[#ff6b00] dark:text-[#ff8533] shadow-sm'
                      : 'text-gray-500 dark:text-zinc-400'
                  }`}
                >
                  🧩 Cloze (Ocultação)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTipo('basico');
                    setActiveField('frente');
                  }}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                    tipo === 'basico'
                      ? 'bg-white dark:bg-zinc-800 text-[#ff6b00] dark:text-[#ff8533] shadow-sm'
                      : 'text-gray-500 dark:text-zinc-400'
                  }`}
                >
                  📑 Básico (Frente/Verso)
                </button>
              </div>
            </div>
          </div>

          {/* Assunto / Tema & Bandeira de Cor */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">
                Assunto / Tópico Jurídico
              </label>
              <input
                type="text"
                placeholder="Ex: Teoria da Imputação Objetiva, Prisão Preventiva..."
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-[#ff6b00]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1 flex items-center justify-between">
                <span>Bandeira (Importância)</span>
                {flag && (
                  <button
                    type="button"
                    onClick={() => setFlag(null)}
                    className="text-[10px] text-gray-400 hover:text-red-500"
                  >
                    Limpar
                  </button>
                )}
              </label>
              <div className="flex items-center justify-between bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl p-1.5">
                {(Object.keys(FLAG_CONFIG) as FlagColor[]).map((col) => {
                  const cfg = FLAG_CONFIG[col];
                  const isSelected = flag === col;
                  return (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setFlag(isSelected ? null : col)}
                      title={cfg.label}
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isSelected ? 'scale-125 ring-2 ring-offset-1 ' + cfg.ring : 'hover:scale-110 opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: cfg.color }}
                    >
                      {isSelected && <Check size={12} className="text-white drop-shadow" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* BARRA DE FERRAMENTAS RICA (WYSIWYG TOOLBAR) */}
          <div className="bg-gray-100/90 dark:bg-zinc-900/90 border border-gray-200 dark:border-zinc-700 rounded-2xl p-2 flex flex-wrap items-center gap-1.5 text-xs shadow-inner">
            
            {/* 1. Estilos Básicos */}
            <div className="flex items-center bg-white dark:bg-zinc-800 rounded-xl p-0.5 border border-gray-200/80 dark:border-zinc-700 shadow-sm">
              <button
                type="button"
                onClick={() => handleInsertFormat('**', '**')}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 font-bold"
                title="Negrito (**texto**)"
              >
                <Bold size={15} />
              </button>
              <button
                type="button"
                onClick={() => handleInsertFormat('*', '*')}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 italic"
                title="Itálico (*texto*)"
              >
                <Italic size={15} />
              </button>
              <button
                type="button"
                onClick={() => handleInsertFormat('<u>', '</u>')}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 underline"
                title="Sublinhado (<u>texto</u>)"
              >
                <Underline size={15} />
              </button>
              <button
                type="button"
                onClick={() => handleInsertFormat('~~', '~~')}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 line-through"
                title="Riscado (~~texto~~)"
              >
                <Strikethrough size={15} />
              </button>
            </div>

            {/* 2. Marca-texto / Highlighter */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowHighlightMenu(!showHighlightMenu);
                  setShowColorMenu(false);
                }}
                className="flex items-center gap-1 px-2 py-1.5 bg-white dark:bg-zinc-800 border border-gray-200/80 dark:border-zinc-700 rounded-xl hover:bg-gray-50 text-amber-600 dark:text-amber-400 font-semibold shadow-sm"
                title="Marca-texto Colorido"
              >
                <Highlighter size={15} />
                <span className="hidden sm:inline text-[11px]">Realce</span>
              </button>

              {showHighlightMenu && (
                <div className="absolute left-0 top-10 z-20 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-2 shadow-xl flex gap-1.5 animate-fadeIn">
                  {(Object.keys(HIGHLIGHT_COLORS) as Array<keyof typeof HIGHLIGHT_COLORS>).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        handleInsertFormat(`<mark:${c}>`, `</mark>`);
                        setShowHighlightMenu(false);
                      }}
                      className={`w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center ${HIGHLIGHT_COLORS[c].bg} ${HIGHLIGHT_COLORS[c].text}`}
                      title={`Marca-texto ${c}`}
                    >
                      A
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Cor da Fonte */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowColorMenu(!showColorMenu);
                  setShowHighlightMenu(false);
                }}
                className="flex items-center gap-1 px-2 py-1.5 bg-white dark:bg-zinc-800 border border-gray-200/80 dark:border-zinc-700 rounded-xl hover:bg-gray-50 text-[#ff6b00] font-semibold shadow-sm"
                title="Cor do Texto"
              >
                <Palette size={15} />
                <span className="hidden sm:inline text-[11px]">Cor</span>
              </button>

              {showColorMenu && (
                <div className="absolute left-0 top-10 z-20 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-2 shadow-xl flex gap-1.5 animate-fadeIn">
                  {(Object.keys(FONT_COLORS) as Array<keyof typeof FONT_COLORS>).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        handleInsertFormat(`<color:${c}>`, `</color>`);
                        setShowColorMenu(false);
                      }}
                      className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center bg-gray-100 dark:bg-zinc-700 ${FONT_COLORS[c].light}`}
                      title={`Texto ${c}`}
                    >
                      A
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Alinhamento de Texto */}
            <div className="flex items-center bg-white dark:bg-zinc-800 rounded-xl p-0.5 border border-gray-200/80 dark:border-zinc-700 shadow-sm">
              {(['left', 'center', 'right', 'justify'] as TextAlignment[]).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAlign(a)}
                  className={`p-1.5 rounded-lg transition ${
                    align === a ? 'bg-[#ff6b00] text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
                  }`}
                  title={`Alinhamento ${a}`}
                >
                  {a === 'left' && <AlignLeft size={14} />}
                  {a === 'center' && <AlignCenter size={14} />}
                  {a === 'right' && <AlignRight size={14} />}
                  {a === 'justify' && <AlignJustify size={14} />}
                </button>
              ))}
            </div>

            {/* 5. Caixas de Destaque Jurídico (Callouts) */}
            <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 rounded-xl p-0.5 border border-gray-200/80 dark:border-zinc-700 shadow-sm">
              <button
                type="button"
                onClick={() => handleInsertCallout('sumula', 'Súmula Vinculante ou Tema Repetitivo STF/STJ')}
                className="px-2 py-1 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 flex items-center gap-1 font-semibold text-[11px]"
                title="Caixa de Súmula / Jurisprudência"
              >
                <Scale size={13} /> Súmula
              </button>
              <button
                type="button"
                onClick={() => handleInsertCallout('lei', 'Art. 10 do CPP / Dispositivo de Lei Seca')}
                className="px-2 py-1 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 flex items-center gap-1 font-semibold text-[11px]"
                title="Caixa de Letra da Lei"
              >
                <BookOpen size={13} /> Lei
              </button>
              <button
                type="button"
                onClick={() => handleInsertCallout('pegadinha', 'Pegadinha clássica da Banca')}
                className="px-2 py-1 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 flex items-center gap-1 font-semibold text-[11px]"
                title="Caixa de Pegadinha"
              >
                <AlertTriangle size={13} /> Cuidado
              </button>
              <button
                type="button"
                onClick={() => handleInsertCallout('dica', 'Macete mnemônico')}
                className="px-2 py-1 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 flex items-center gap-1 font-semibold text-[11px]"
                title="Caixa de Macete"
              >
                <Lightbulb size={13} /> Dica
              </button>
              <button
                type="button"
                onClick={() => handleInsertCallout('excecao', 'Exceção à regra')}
                className="px-2 py-1 rounded-lg text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50 flex items-center gap-1 font-semibold text-[11px]"
                title="Caixa de Exceção"
              >
                <ShieldAlert size={13} /> Exceção
              </button>
            </div>

            {/* 6. Mídias & Links */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowImageModal(true)}
                className={`p-1.5 rounded-xl border border-gray-200/80 dark:border-zinc-700 shadow-sm font-semibold flex items-center gap-1 ${
                  imageUrl ? 'bg-[#ff6b00] text-white' : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 hover:bg-gray-50'
                }`}
                title="Anexar Imagem (URL ou Arquivo)"
              >
                <ImageIcon size={15} />
                <span className="hidden sm:inline text-[11px]">{imageUrl ? 'Img Anexa' : 'Imagem'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowLinkModal(true)}
                className="p-1.5 bg-white dark:bg-zinc-800 border border-gray-200/80 dark:border-zinc-700 rounded-xl hover:bg-gray-50 text-gray-700 dark:text-zinc-200 font-semibold flex items-center gap-1 shadow-sm"
                title="Inserir Link"
              >
                <LinkIcon size={15} />
              </button>
            </div>

          </div>

          {/* TOOLBAR ESPECÍFICA DE OCULTAÇÃO (CLOZE TOOLBAR) */}
          {tipo === 'cloze' && (
            <div className="p-3 bg-[#fff8f2] dark:bg-[#261400] border border-[#ffd4b8] dark:border-[#5e2b00] rounded-2xl space-y-2.5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-black text-[#803200] dark:text-[#ffad77] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#ff6b00]" /> Opções de Ocultação de Palavras
                </span>

                <div className="flex flex-wrap items-center gap-1.5">
                  {/* Botão Ocultar no Mesmo Cartão */}
                  <button
                    type="button"
                    onClick={() => handleInsertCloze('same')}
                    className="px-2.5 py-1 bg-white dark:bg-zinc-800 text-[#ff6b00] dark:text-[#ff8533] border border-[#ffd4b8] dark:border-zinc-700 rounded-xl text-xs font-bold hover:bg-[#fff0e6] transition flex items-center gap-1 shadow-sm"
                    title="Oculta usando c1 para revelar no mesmo cartão"
                  >
                    <MousePointerClick size={13} /> [+] Ocultar (Mesmo Cartão · c1)
                  </button>

                  {/* Botão Ocultar em Novo Cartão */}
                  <button
                    type="button"
                    onClick={() => handleInsertCloze('new')}
                    className="px-2.5 py-1 bg-[#ff6b00] text-white rounded-xl text-xs font-black hover:bg-[#e65c00] transition flex items-center gap-1 shadow-sm active:scale-95"
                    title="Oculta gerando c2, c3... para criar cartões separados"
                  >
                    <Split size={13} /> [+] Ocultar (Novo Cartão · c+)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setHintClozeMode('new');
                      setShowHintModal(true);
                    }}
                    className="px-2 py-1 bg-white dark:bg-zinc-800 text-amber-600 dark:text-amber-400 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-semibold hover:bg-gray-50"
                    title="Ocultar com dica customizada"
                  >
                    💡 c/ Dica
                  </button>
                </div>
              </div>

              {/* Seletor de Comportamento dos Múltiplos Clozes */}
              {detectedClozeNumbers.length > 1 && (
                <div className="p-2.5 bg-white dark:bg-zinc-900 border border-[#ffe6d4] dark:border-[#4d1f00] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                  <div className="text-gray-700 dark:text-zinc-300 font-bold">
                    Foram detectadas <strong>{detectedClozeNumbers.length} oclusões</strong> ({detectedClozeNumbers.map(n => `c${n}`).join(', ')}). Como deseja salvar?
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setClozeMultiOption('single_interactive');
                        setPreviewTargetCloze(0);
                      }}
                      className={`px-3 py-1 rounded-lg font-extrabold transition ${
                        clozeMultiOption === 'single_interactive'
                          ? 'bg-[#ff6b00] text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400'
                      }`}
                    >
                      👆 1 Cartão (Clique por Clique)
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setClozeMultiOption('multi_cards');
                        setPreviewTargetCloze(detectedClozeNumbers[0] || 1);
                      }}
                      className={`px-3 py-1 rounded-lg font-extrabold transition ${
                        clozeMultiOption === 'multi_cards'
                          ? 'bg-[#ff6b00] text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400'
                      }`}
                    >
                      📑 Criar {detectedClozeNumbers.length} Cartões Separados
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sub-modais flutuantes da Toolbar */}
          {/* Modal Imagem */}
          {showImageModal && (
            <div className="p-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-2xl space-y-3 animate-fadeIn">
              <div className="flex justify-between items-center text-xs font-bold uppercase text-gray-700 dark:text-zinc-300">
                <span className="flex items-center gap-1.5"><ImageIcon size={15} /> Anexar Imagem ao Flashcard</span>
                <button onClick={() => setShowImageModal(false)}><X size={15} /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-500">Opção 1: URL da Imagem (Web)</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://exemplo.com/esquema.png"
                      value={tempImageUrl}
                      onChange={(e) => setTempImageUrl(e.target.value)}
                      className="flex-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-gray-900 dark:text-zinc-100"
                    />
                    <button
                      type="button"
                      onClick={handleApplyImage}
                      className="px-3 py-1 bg-[#ff6b00] text-white rounded-xl text-xs font-bold"
                    >
                      OK
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-500">Opção 2: Arquivo Local do Computador</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="w-full text-xs file:mr-2 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#ff6b00]/10 file:text-[#ff6b00] hover:file:bg-[#ff6b00]/20"
                  />
                </div>
              </div>

              {imageUrl && (
                <div className="flex items-center justify-between p-2 bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700">
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold truncate max-w-xs">
                    ✓ Imagem anexada com sucesso
                  </span>
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Remover Imagem
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Modal Link */}
          {showLinkModal && (
            <div className="p-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-2xl space-y-2 animate-fadeIn">
              <div className="flex justify-between items-center text-xs font-bold uppercase text-gray-700 dark:text-zinc-300">
                <span className="flex items-center gap-1.5"><LinkIcon size={15} /> Inserir Link Externo</span>
                <button onClick={() => setShowLinkModal(false)}><X size={15} /></button>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Texto do Link (Ex: STF Inf. 1100)"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className="flex-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-gray-900 dark:text-zinc-100"
                />
                <input
                  type="url"
                  placeholder="URL (https://...)"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="flex-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-gray-900 dark:text-zinc-100"
                />
                <button
                  type="button"
                  onClick={handleApplyLink}
                  className="px-4 py-1.5 bg-[#ff6b00] text-white rounded-xl text-xs font-bold"
                >
                  Inserir
                </button>
              </div>
            </div>
          )}

          {/* Modal Hint Cloze */}
          {showHintModal && (
            <div className="flex gap-2 p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-2xl animate-fadeIn">
              <input
                type="text"
                placeholder="Digite a dica do Cloze (ex: prazo do réu preso, súmula...)"
                value={hintInput}
                onChange={(e) => setHintInput(e.target.value)}
                className="flex-1 bg-white dark:bg-zinc-900 border border-amber-300 dark:border-amber-800 rounded-xl px-3 py-1.5 text-xs text-gray-900 dark:text-zinc-100"
              />
              <button
                type="button"
                onClick={() => handleInsertCloze(hintClozeMode, hintInput)}
                className="px-3.5 py-1.5 bg-amber-600 text-white rounded-xl text-xs font-bold"
              >
                Aplicar Dica
              </button>
            </div>
          )}

          {/* ÁREA DE DIGITAÇÃO PRINCIPAL */}
          {tipo === 'cloze' ? (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400">
                Texto com Ocultação (Sintaxe Anki)
              </label>
              <textarea
                ref={textareaClozeRef}
                rows={4}
                placeholder="Ex: No Direito Penal, a tipicidade conglobante é composta pela tipicidade {{c1::formal}} e pela tipicidade {{c2::material}}."
                value={clozeText}
                onChange={(e) => setClozeText(e.target.value)}
                onFocus={() => setActiveField('cloze')}
                className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-2xl p-3.5 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-[#ff6b00] font-mono leading-relaxed"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">
                  Frente (Pergunta / Situação-Problema)
                </label>
                <textarea
                  ref={textareaFrenteRef}
                  rows={3}
                  placeholder="Ex: Qual a consequência jurídica do estelionato cometido com documento falso que se exaure no golpe?"
                  value={frente}
                  onChange={(e) => setFrente(e.target.value)}
                  onFocus={() => setActiveField('frente')}
                  className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-2xl p-3 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-[#ff6b00]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">
                  Verso (Resposta / Gabarito)
                </label>
                <textarea
                  ref={textareaVersoRef}
                  rows={3}
                  placeholder="Ex: O falso é absorvido pelo estelionato por força do princípio da consunção (Súmula 17 STJ)."
                  value={verso}
                  onChange={(e) => setVerso(e.target.value)}
                  onFocus={() => setActiveField('verso')}
                  className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-2xl p-3 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-[#ff6b00]"
                />
              </div>
            </div>
          )}

          {/* Fundamentação / Observação Extra */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1">
              Fundamentação / Artigo / Dica Complementar (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Súmula 17 do STJ; Art. 10 do CPP; Informativo 740 do STF..."
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-2xl px-3.5 py-2 text-xs sm:text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-[#ff6b00]"
            />
          </div>

          {/* Sistema de Tags / Etiquetas */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Tag size={13} /> Etiquetas / Tags (#)</span>
              <span className="text-[10px] text-gray-400">Pressione Enter ou Vírgula para adicionar</span>
            </label>
            
            <div className="flex flex-wrap items-center gap-1.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-2xl p-2 min-h-[42px]">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 bg-[#ff6b00]/10 text-[#ff6b00] dark:text-[#ff8533] text-xs font-bold px-2.5 py-0.5 rounded-lg border border-[#ff6b00]/20"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-red-500 ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}

              <input
                type="text"
                placeholder={tags.length === 0 ? "Digite tags (ex: stf, sumula, delegado)..." : ""}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    handleAddTag(tagInput);
                  }
                }}
                className="flex-1 min-w-[120px] bg-transparent text-xs text-gray-900 dark:text-zinc-100 focus:outline-none"
              />
            </div>

            {/* Sugestões rápidas de tags */}
            <div className="flex flex-wrap gap-1 pt-0.5">
              <span className="text-[10px] text-gray-400 font-semibold self-center mr-1">Sugestões:</span>
              {COMMON_TAGS.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleAddTag(st)}
                  className={`text-[10px] px-2 py-0.5 rounded-md transition font-medium ${
                    tags.includes(st)
                      ? 'bg-gray-200 dark:bg-zinc-800 text-gray-400'
                      : 'bg-gray-100 dark:bg-zinc-800/80 text-gray-600 dark:text-zinc-400 hover:bg-[#ff6b00]/10 hover:text-[#ff6b00]'
                  }`}
                >
                  #{st}
                </button>
              ))}
            </div>
          </div>

          {/* LIVE PREVIEW BOX (PRÉVIA RICA EM TEMPO REAL) */}
          <div className="border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 bg-gray-50/80 dark:bg-zinc-900/80 space-y-3">
            <div className="flex flex-wrap items-center justify-between border-b border-gray-200/60 dark:border-zinc-800 pb-2 gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <Eye size={15} /> Prévia em Tempo Real
                </span>
                {flag && (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: FLAG_CONFIG[flag].color }}
                  >
                    🚩 {FLAG_CONFIG[flag].label}
                  </span>
                )}
              </div>

              {/* Seletor de prévia para subcartões ou Frente/Verso */}
              <div className="flex flex-wrap items-center gap-1.5">
                {tipo === 'cloze' && clozeMultiOption === 'multi_cards' && detectedClozeNumbers.length > 1 && (
                  <div className="flex gap-1 bg-gray-200 dark:bg-zinc-800 p-0.5 rounded-xl text-xs">
                    {detectedClozeNumbers.map((cNum) => (
                      <button
                        key={cNum}
                        type="button"
                        onClick={() => setPreviewTargetCloze(cNum)}
                        className={`px-2 py-0.5 rounded-lg font-bold text-[11px] ${
                          previewTargetCloze === cNum
                            ? 'bg-[#ff6b00] text-white shadow-sm'
                            : 'text-gray-600 dark:text-zinc-400'
                        }`}
                      >
                        Card c{cNum}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex gap-1 bg-white dark:bg-zinc-800 p-0.5 rounded-xl border border-gray-200 dark:border-zinc-700">
                  <button
                    type="button"
                    onClick={() => setPreviewSide('frente')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg ${
                      previewSide === 'frente'
                        ? 'bg-[#ff6b00] text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400'
                    }`}
                  >
                    Frente
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewSide('verso')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg ${
                      previewSide === 'verso'
                        ? 'bg-[#ff6b00] text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400'
                    }`}
                  >
                    Verso
                  </button>
                </div>
              </div>
            </div>

            <div className="min-h-[90px] p-3 text-sm flex flex-col justify-center">
              {tipo === 'cloze' ? (
                <div className="space-y-3">
                  <RichContentRenderer
                    content={clozeText || 'Digite o texto com cloze acima...'}
                    isBack={previewSide === 'verso'}
                    targetCloze={clozeMultiOption === 'multi_cards' ? previewTargetCloze : 0}
                    revealedIndices={previewRevealedClozes}
                    onToggleReveal={togglePreviewCloze}
                    align={align}
                  />
                  
                  {previewSide === 'frente' && clozeMultiOption === 'single_interactive' && detectedClozeNumbers.length > 0 && (
                    <div className="text-[11px] text-gray-400 italic pt-1 border-t border-gray-200/50 dark:border-zinc-800 flex items-center justify-between">
                      <span>💡 <strong>Toque nos botões acima</strong> para testar a revelação interativa!</span>
                      {previewRevealedClozes.size > 0 && (
                        <button
                          type="button"
                          onClick={() => setPreviewRevealedClozes(new Set())}
                          className="text-[#ff6b00] hover:underline font-bold"
                        >
                          Ocultar novamente
                        </button>
                      )}
                    </div>
                  )}

                  {previewSide === 'verso' && extra && (
                    <div className="text-xs text-gray-500 dark:text-zinc-400 italic pt-1 border-t border-gray-200/50 dark:border-zinc-800">
                      📝 {extra}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <RichContentRenderer
                    content={previewSide === 'frente' ? (frente || 'Digite a pergunta...') : (verso || 'Digite a resposta...')}
                    isBack={previewSide === 'verso'}
                    align={align}
                  />
                  {previewSide === 'verso' && extra && (
                    <div className="text-xs text-gray-500 dark:text-zinc-400 italic pt-1 border-t border-gray-200/50 dark:border-zinc-800">
                      📝 {extra}
                    </div>
                  )}
                </div>
              )}

              {imageUrl && (
                <div className="mt-3 pt-2 border-t border-gray-200/60 dark:border-zinc-800 flex flex-col items-center">
                  <img
                    src={imageUrl}
                    alt="Imagem anexa"
                    className="max-h-36 object-contain rounded-xl border border-gray-200 dark:border-zinc-700 shadow-sm"
                  />
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/70 dark:bg-zinc-900/70 flex items-center justify-between">
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            {savedFeedback && (
              <>
                <Check size={16} /> Flashcard salvo com sucesso!
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
            >
              Cancelar
            </button>
            {!editingCard && (
              <button
                type="button"
                onClick={() => handleSave(true)}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 hover:bg-gray-200 dark:hover:bg-zinc-700 transition"
              >
                Salvar e Criar Outro
              </button>
            )}
            <button
              type="button"
              onClick={() => handleSave(false)}
              className="px-5 py-2 rounded-xl text-sm font-bold bg-[#ff6b00] hover:bg-[#e65c00] text-white shadow-md shadow-[#ff6b00]/20 hover:scale-[1.02] active:scale-98 transition-all"
            >
              {editingCard
                ? 'Salvar Alterações'
                : tipo === 'cloze' && clozeMultiOption === 'multi_cards' && detectedClozeNumbers.length > 1
                ? `Criar ${detectedClozeNumbers.length} Flashcards`
                : 'Salvar Flashcard'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
