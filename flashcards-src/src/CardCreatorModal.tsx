import React, { useState, useRef, useEffect } from 'react';
import { X, Sparkles, Eye, Check } from 'lucide-react';
import { type Card, type Deck } from './data';
import { renderClozeFront, renderClozeBack, wrapWithCloze, hasCloze } from './cloze';

interface CardCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCard: (card: Card, deckId: string) => void;
  availableDecks: Deck[];
  editingCard?: { card: Card; deckId: string } | null;
}

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

  const [previewSide, setPreviewSide] = useState<'frente' | 'verso'>('frente');
  const [hintInput, setHintInput] = useState<string>('');
  const [showHintModal, setShowHintModal] = useState<boolean>(false);
  const [savedFeedback, setSavedFeedback] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Inicializar dados se estiver em modo de edição
  useEffect(() => {
    if (editingCard) {
      const { card, deckId } = editingCard;
      setSelectedDeckId(deckId);
      setAssunto(card.assunto || '');
      setExtra(card.extra || '');
      if (card.tipo === 'cloze' || hasCloze(card.frente)) {
        setTipo('cloze');
        setClozeText(card.frente);
      } else {
        setTipo('basico');
        setFrente(card.frente);
        setVerso(card.verso);
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
    setHintInput('');
    setShowHintModal(false);
    setIsCreatingNewDeck(false);
    setCustomDeckName('');
  };

  if (!isOpen) return null;

  // Toolbar Actions
  const handleInsertCloze = (hint = '') => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;

    // Detectar próximo número de cloze disponível
    const currentMatches = clozeText.matchAll(/\{\{c(\d+)::/g);
    let maxNum = 0;
    for (const m of currentMatches) {
      const n = parseInt(m[1], 10);
      if (n > maxNum) maxNum = n;
    }
    const nextClozeNum = maxNum === 0 ? 1 : maxNum + 1;

    const { newText, newCursorPos } = wrapWithCloze(clozeText, start, end, nextClozeNum, hint);
    setClozeText(newText);
    setShowHintModal(false);
    setHintInput('');

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 50);
  };

  const handleFormatText = (prefix: string, suffix: string, isClozeField: boolean) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const currentVal = isClozeField ? clozeText : tipo === 'basico' ? frente : clozeText;
    const selected = currentVal.slice(start, end) || 'texto';
    const updated = currentVal.slice(0, start) + prefix + selected + suffix + currentVal.slice(end);

    if (isClozeField) {
      setClozeText(updated);
    } else {
      setFrente(updated);
    }

    setTimeout(() => {
      if (el) {
        el.focus();
        el.setSelectionRange(start + prefix.length, end + prefix.length);
      }
    }, 50);
  };

  const handleSave = (createAnother = false) => {
    if (!assunto.trim()) {
      alert('Por favor, informe o assunto ou tema do flashcard (ex: Teoria do Delito, Inquérito Policial).');
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

    let newCard: Card;
    if (tipo === 'cloze') {
      if (!clozeText.trim() || !hasCloze(clozeText)) {
        alert('Para o tipo Ocultação (Cloze), inclua pelo menos uma marcação {{c1::palavra}} no texto.');
        return;
      }
      newCard = {
        id: editingCard ? editingCard.card.id : `user_card_${Date.now()}`,
        assunto: assunto.trim(),
        frente: clozeText.trim(),
        verso: extra.trim() || 'Termo oculto memorizado.',
        tipo: 'cloze',
        extra: extra.trim(),
        deckId: targetDeckId,
        isCustom: true,
        createdAt: editingCard?.card.createdAt || new Date().toISOString(),
      };
    } else {
      if (!frente.trim() || !verso.trim()) {
        alert('Preencha a Frente (Pergunta) e o Verso (Resposta) do flashcard.');
        return;
      }
      newCard = {
        id: editingCard ? editingCard.card.id : `user_card_${Date.now()}`,
        assunto: assunto.trim(),
        frente: frente.trim(),
        verso: verso.trim(),
        tipo: 'basico',
        extra: extra.trim(),
        deckId: targetDeckId,
        isCustom: true,
        createdAt: editingCard?.card.createdAt || new Date().toISOString(),
      };
    }

    onSaveCard(newCard, targetDeckId);

    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 1500);

    if (createAnother) {
      setFrente('');
      setVerso('');
      setClozeText('');
      setExtra('');
      if (textareaRef.current) textareaRef.current.focus();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#fff4ed] dark:bg-[#331500] text-[#ff6b00] dark:text-[#ff8533] flex items-center justify-center font-bold">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-gray-900 dark:text-zinc-100">
                {editingCard ? 'Editar Flashcard' : 'Criar Novo Flashcard'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                Adicione cartões com repetição espaçada FSRS e ocultação de termos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Deck Selector & Card Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Baralho */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1.5">
                Baralho de Destino
              </label>
              {!isCreatingNewDeck ? (
                <div className="flex gap-2">
                  <select
                    value={selectedDeckId}
                    onChange={(e) => setSelectedDeckId(e.target.value)}
                    className="flex-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-[#ff6b00] dark:focus:border-[#ff8533]"
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
                    className="px-3 py-2 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-xl text-xs font-semibold hover:bg-gray-200 dark:hover:bg-zinc-700 transition"
                    title="Criar novo baralho"
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
                    className="flex-1 bg-white dark:bg-zinc-900 border border-[#ff6b00] rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-zinc-100"
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

            {/* Tipo de Card */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1.5">
                Tipo do Cartão
              </label>
              <div className="grid grid-cols-2 gap-2 bg-gray-100 dark:bg-zinc-900 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTipo('cloze')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                    tipo === 'cloze'
                      ? 'bg-white dark:bg-zinc-800 text-[#ff6b00] dark:text-[#ff8533] shadow-sm'
                      : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900'
                  }`}
                >
                  🧩 Cloze (Ocultação)
                </button>
                <button
                  type="button"
                  onClick={() => setTipo('basico')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                    tipo === 'basico'
                      ? 'bg-white dark:bg-zinc-800 text-[#ff6b00] dark:text-[#ff8533] shadow-sm'
                      : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900'
                  }`}
                >
                  📑 Básico (Frente/Verso)
                </button>
              </div>
            </div>

          </div>

          {/* Assunto / Tag */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1.5">
              Assunto / Tema do Card
            </label>
            <input
              type="text"
              placeholder="Ex: Teoria da Imputação Objetiva, Conflito Aparente de Normas..."
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-[#ff6b00]"
            />
          </div>

          {/* Editor Area (Cloze vs Básico) */}
          {tipo === 'cloze' ? (
            <div className="space-y-2">
              
              {/* Toolbar */}
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400">
                  Texto com Ocultação (Sintaxe Anki)
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleInsertCloze()}
                    className="px-2.5 py-1 bg-[#fff4ed] dark:bg-[#331500] text-[#ff6b00] dark:text-[#ff8533] border border-[#ffe6d4] dark:border-[#662a00] rounded-lg text-xs font-bold hover:scale-105 transition active:scale-95 shadow-sm"
                    title="Oculta a palavra selecionada com {{c1::...}}"
                  >
                    [+] Ocultar Seleção
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowHintModal(true)}
                    className="px-2 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 rounded-lg text-xs font-semibold hover:bg-gray-200"
                    title="Ocultar com dica customizada"
                  >
                    💡 Ocultar c/ Dica
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormatText('**', '**', true)}
                    className="px-2 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 rounded-lg text-xs font-bold hover:bg-gray-200"
                  >
                    B
                  </button>
                </div>
              </div>

              {/* Hint input popup */}
              {showHintModal && (
                <div className="flex gap-2 p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl animate-fadeIn">
                  <input
                    type="text"
                    placeholder="Digite a dica (ex: prazo do réu preso, súmula...)"
                    value={hintInput}
                    onChange={(e) => setHintInput(e.target.value)}
                    className="flex-1 bg-white dark:bg-zinc-900 border border-amber-300 rounded-lg px-2.5 py-1 text-xs text-gray-900 dark:text-zinc-100"
                  />
                  <button
                    type="button"
                    onClick={() => handleInsertCloze(hintInput)}
                    className="px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-bold"
                  >
                    Aplicar
                  </button>
                </div>
              )}

              <textarea
                ref={textareaRef}
                rows={4}
                placeholder="Ex: O inquérito policial no caso de réu preso deve ser concluído no prazo de {{c1::10 dias::prazo da lei}} improrrogáveis."
                value={clozeText}
                onChange={(e) => setClozeText(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl p-3 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-[#ff6b00] font-mono leading-relaxed"
              />
              <p className="text-[11px] text-gray-400 dark:text-zinc-500">
                💡 Dica: Selecione a palavra que deseja memorizar e clique em <strong>[+] Ocultar Seleção</strong>.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1.5">
                  Frente (Pergunta / Situação-Problema)
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Qual a consequência jurídica do estelionato cometido com documento falso que se exaure no golpe?"
                  value={frente}
                  onChange={(e) => setFrente(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl p-3 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-[#ff6b00]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1.5">
                  Verso (Resposta / Gabarito)
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: O falso é absorvido pelo estelionato por força do princípio da consunção (Súmula 17 STJ)."
                  value={verso}
                  onChange={(e) => setVerso(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl p-3 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-[#ff6b00]"
                />
              </div>
            </div>
          )}

          {/* Extra / Fundamentação */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1.5">
              Fundamentação / Artigo / Macete (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Súmula 17 do STJ; Art. 10 do CPP; Informativo 740 do STF..."
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-[#ff6b00]"
            />
          </div>

          {/* Live Preview Box */}
          <div className="border border-gray-200 dark:border-zinc-800 rounded-xl p-4 bg-gray-50/80 dark:bg-zinc-900/80 space-y-2">
            <div className="flex items-center justify-between border-b border-gray-200/60 dark:border-zinc-800 pb-2">
              <span className="text-xs font-bold text-gray-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Eye size={14} /> Prévia em Tempo Real
              </span>
              <div className="flex gap-1 bg-white dark:bg-zinc-800 p-0.5 rounded-lg border border-gray-200 dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() => setPreviewSide('frente')}
                  className={`px-2.5 py-0.5 text-[11px] font-bold rounded ${
                    previewSide === 'frente'
                      ? 'bg-[#ff6b00] text-white'
                      : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400'
                  }`}
                >
                  Frente
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewSide('verso')}
                  className={`px-2.5 py-0.5 text-[11px] font-bold rounded ${
                    previewSide === 'verso'
                      ? 'bg-[#ff6b00] text-white'
                      : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400'
                  }`}
                >
                  Verso
                </button>
              </div>
            </div>

            <div className="min-h-[70px] flex items-center justify-center p-3 text-center text-sm">
              {tipo === 'cloze' ? (
                previewSide === 'frente' ? (
                  renderClozeFront(clozeText) || <span className="text-gray-400 italic">Digite o texto acima...</span>
                ) : (
                  <div className="space-y-2">
                    <div>{renderClozeBack(clozeText)}</div>
                    {extra && (
                      <div className="text-xs text-gray-500 dark:text-zinc-400 italic">
                        📝 {extra}
                      </div>
                    )}
                  </div>
                )
              ) : previewSide === 'frente' ? (
                frente ? <span>{frente}</span> : <span className="text-gray-400 italic">Digite a pergunta...</span>
              ) : (
                <div className="space-y-2">
                  <span className="font-semibold">{verso || 'Digite a resposta...'}</span>
                  {extra && (
                    <div className="text-xs text-gray-500 dark:text-zinc-400 italic">
                      📝 {extra}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            {savedFeedback && (
              <>
                <Check size={14} /> Flashcard salvo com sucesso!
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
              {editingCard ? 'Salvar Alterações' : 'Salvar Flashcard'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
