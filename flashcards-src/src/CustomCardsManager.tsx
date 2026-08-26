import React, { useState, useMemo, useEffect } from 'react';
import {
  X, Search, Edit3, Trash2, Download, Upload, Plus, Layers,
  Image as ImageIcon, Filter
} from 'lucide-react';
import { type Card, type Deck } from './data';
import { renderClozeFront } from './cloze';
import { FLAG_CONFIG } from './richText';
import { CardState, MasteryTier, type FSRSData } from './fsrs';

interface CustomCardsManagerProps {
  isOpen: boolean;
  onClose: () => void;
  allCards: Card[];
  availableDecks: Deck[];
  fsrsData: FSRSData;
  initialDeckFilter?: string;
  initialOriginFilter?: 'all' | 'custom' | 'standard';
  onEditCard: (card: Card, deckId: string) => void;
  onDeleteCard: (cardId: string, isStandard?: boolean) => void;
  onRestoreCard?: (cardId: string) => void;
  onOpenCreateModal: (defaultDeckId?: string) => void;
  onImportCards: (cards: Card[]) => void;
}

export const CustomCardsManager: React.FC<CustomCardsManagerProps> = ({
  isOpen,
  onClose,
  allCards,
  availableDecks,
  fsrsData,
  initialDeckFilter = 'all',
  initialOriginFilter = 'all',
  onEditCard,
  onDeleteCard,
  onOpenCreateModal,
  onImportCards,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeckFilter, setSelectedDeckFilter] = useState(initialDeckFilter);
  const [selectedOriginFilter, setSelectedOriginFilter] = useState<'all' | 'custom' | 'standard'>(initialOriginFilter);
  const [selectedFlagFilter, setSelectedFlagFilter] = useState<string>('all');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all');
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('all');
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>('all');

  useEffect(() => {
    if (initialDeckFilter) setSelectedDeckFilter(initialDeckFilter);
  }, [initialDeckFilter]);

  useEffect(() => {
    if (initialOriginFilter) setSelectedOriginFilter(initialOriginFilter);
  }, [initialOriginFilter]);

  // Extrair todas as tags únicas
  const allUniqueTags = useMemo(() => {
    const set = new Set<string>();
    allCards.forEach((c) => {
      if (c.tags) c.tags.forEach((t) => set.add(t));
    });
    return Array.from(set).sort();
  }, [allCards]);

  const customCount = useMemo(() => allCards.filter(c => c.isCustom).length, [allCards]);
  const standardCount = useMemo(() => allCards.filter(c => !c.isCustom).length, [allCards]);

  const filteredCards = allCards.filter((card) => {
    // 1. Busca por texto
    const textToSearch = `${card.assunto} ${card.frente} ${card.verso} ${card.extra || ''} ${(card.tags || []).join(' ')}`.toLowerCase();
    const matchesSearch = !searchTerm.trim() || textToSearch.includes(searchTerm.toLowerCase());

    // 2. Filtro de Baralho
    const matchesDeck = selectedDeckFilter === 'all' || card.deckId === selectedDeckFilter;

    // 3. Filtro de Origem (Todos / Meus / Padrão)
    let matchesOrigin = true;
    if (selectedOriginFilter === 'custom') {
      matchesOrigin = !!card.isCustom;
    } else if (selectedOriginFilter === 'standard') {
      matchesOrigin = !card.isCustom;
    }

    // 4. Filtro de Bandeira
    let matchesFlag = true;
    if (selectedFlagFilter === 'none') {
      matchesFlag = !card.flag;
    } else if (selectedFlagFilter !== 'all') {
      matchesFlag = card.flag === selectedFlagFilter;
    }

    // 5. Filtro de Tag
    let matchesTag = true;
    if (selectedTagFilter !== 'all') {
      matchesTag = card.tags ? card.tags.includes(selectedTagFilter) : false;
    }

    // 6. Filtro de Estado FSRS
    let matchesState = true;
    if (selectedStateFilter !== 'all') {
      const cardFsrs = fsrsData[card.id];
      const state = cardFsrs?.state ?? CardState.New;
      matchesState = state.toString() === selectedStateFilter;
    }

    // 7. Filtro de Nível de Domínio
    let matchesTier = true;
    if (selectedTierFilter !== 'all') {
      const cardFsrs = fsrsData[card.id];
      const tier = cardFsrs?.masteryTier ?? MasteryTier.Acquisition;
      matchesTier = tier.toString() === selectedTierFilter;
    }

    return matchesSearch && matchesDeck && matchesOrigin && matchesFlag && matchesTag && matchesState && matchesTier;
  });

  const handleExportJSON = () => {
    const customOnly = allCards.filter(c => c.isCustom);
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(customOnly, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `atena_flashcards_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleImportJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target?.result as string);
          if (Array.isArray(parsed)) {
            onImportCards(parsed);
            alert(`✅ ${parsed.length} flashcards importados com sucesso!`);
          } else {
            alert('Arquivo JSON inválido. Esperada uma lista de cartões.');
          }
        } catch (err) {
          alert('Erro ao processar arquivo JSON.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const getStateBadge = (cardId: string) => {
    const s = fsrsData[cardId]?.state ?? CardState.New;
    switch (s) {
      case CardState.New:
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-mono">🔵 Novo</span>;
      case CardState.Learning:
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 font-mono">🟠 Aprendizagem</span>;
      case CardState.Review:
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">🟢 Revisão</span>;
      case CardState.Relearning:
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 font-mono">🔴 Reaprendizagem</span>;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-[#131929] border border-gray-200 dark:border-[rgba(255,255,255,0.1)] rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[rgba(255,255,255,0.08)] bg-gray-50/70 dark:bg-[#0b0f1a]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#fff4ed] dark:bg-[#1a2235] text-[#ff6b00] dark:text-[#ff8533] flex items-center justify-center font-bold shadow-sm border border-[#ff6b00]/20">
              <Layers size={22} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-[#e8eaf0] flex items-center gap-2">
                Gerenciador & Editor de Flashcards
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#ff6b00]/10 text-[#ff6b00] font-bold border border-[#ff6b00]/20 font-mono">
                  {filteredCards.length} de {allCards.length} cards
                </span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-[#9aa5bb]">
                Consulte, edite ou crie novos flashcards para qualquer matéria do concurso
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenCreateModal(selectedDeckFilter !== 'all' ? selectedDeckFilter : undefined)}
              className="px-3.5 py-2 bg-[#ff6b00] hover:bg-[#e65c00] text-white rounded-xl font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={15} /> Novo Flashcard
            </button>

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-[#1a2235] transition cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Toolbar de Filtros Multifacetados */}
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-[rgba(255,255,255,0.08)] bg-white dark:bg-[#131929] space-y-3">
          
          {/* Linha 1: Abas de Origem & Busca */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            
            {/* Seletor de Origem */}
            <div className="flex items-center bg-gray-100 dark:bg-[#0b0f1a] p-1 rounded-xl border border-gray-200 dark:border-[rgba(255,255,255,0.08)] w-full sm:w-auto shrink-0">
              <button
                onClick={() => setSelectedOriginFilter('all')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  selectedOriginFilter === 'all'
                    ? 'bg-white dark:bg-[#1a2235] text-gray-900 dark:text-[#e8eaf0] shadow-sm'
                    : 'text-gray-500 dark:text-[#9aa5bb] hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Todos ({allCards.length})
              </button>
              <button
                onClick={() => setSelectedOriginFilter('custom')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  selectedOriginFilter === 'custom'
                    ? 'bg-white dark:bg-[#1a2235] text-[#ff6b00] dark:text-[#ff8533] shadow-sm'
                    : 'text-gray-500 dark:text-[#9aa5bb] hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                ⭐ Meus Cards ({customCount})
              </button>
              <button
                onClick={() => setSelectedOriginFilter('standard')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  selectedOriginFilter === 'standard'
                    ? 'bg-white dark:bg-[#1a2235] text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-500 dark:text-[#9aa5bb] hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                📚 Padrão ({standardCount})
              </button>
            </div>

            {/* Input de Busca */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquisar por assunto, pergunta, resposta ou tags..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-[#0b0f1a] border border-gray-200 dark:border-[rgba(255,255,255,0.08)] rounded-xl text-xs sm:text-sm text-gray-900 dark:text-[#e8eaf0] placeholder-gray-400 focus:outline-none focus:border-[#ff6b00]"
              />
            </div>

            {/* Botões Import/Export */}
            <div className="flex items-center gap-1.5 self-end sm:self-center">
              <button
                onClick={handleExportJSON}
                title="Exportar backup dos seus flashcards personalizados"
                className="p-2 border border-gray-200 dark:border-[rgba(255,255,255,0.08)] rounded-xl text-gray-600 dark:text-[#9aa5bb] hover:bg-gray-100 dark:hover:bg-[#1a2235] transition cursor-pointer"
              >
                <Download size={16} />
              </button>
              <button
                onClick={handleImportJSON}
                title="Importar flashcards em JSON"
                className="p-2 border border-gray-200 dark:border-[rgba(255,255,255,0.08)] rounded-xl text-gray-600 dark:text-[#9aa5bb] hover:bg-gray-100 dark:hover:bg-[#1a2235] transition cursor-pointer"
              >
                <Upload size={16} />
              </button>
            </div>
          </div>

          {/* Linha 2: Filtros de Matéria, Bandeira, Tag, Estado FSRS e Nível de Domínio */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
            
            {/* 1. Baralho / Matéria */}
            <div>
              <select
                value={selectedDeckFilter}
                onChange={(e) => setSelectedDeckFilter(e.target.value)}
                className="w-full py-1.5 px-2 bg-gray-50 dark:bg-[#0b0f1a] border border-gray-200 dark:border-[rgba(255,255,255,0.08)] rounded-xl text-xs font-bold text-gray-700 dark:text-[#e8eaf0] focus:outline-none focus:border-[#ff6b00]"
              >
                <option value="all">📚 Todas as Matérias</option>
                {availableDecks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.sigla ? `[${d.sigla}] ` : ''}{d.titulo}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Nível de Domínio */}
            <div>
              <select
                value={selectedTierFilter}
                onChange={(e) => setSelectedTierFilter(e.target.value)}
                className="w-full py-1.5 px-2 bg-gray-50 dark:bg-[#0b0f1a] border border-gray-200 dark:border-[rgba(255,255,255,0.08)] rounded-xl text-xs font-bold text-gray-700 dark:text-[#e8eaf0] focus:outline-none focus:border-[#ff6b00]"
              >
                <option value="all">💎 Todos os Níveis</option>
                <option value={MasteryTier.Mastered.toString()}>💎 Dominados (Tier 3)</option>
                <option value={MasteryTier.Consolidated.toString()}>🥈 Consolidados (Tier 2)</option>
                <option value={MasteryTier.Acquisition.toString()}>🥉 Aquisição (Tier 1)</option>
              </select>
            </div>

            {/* 3. Bandeira */}
            <div>
              <select
                value={selectedFlagFilter}
                onChange={(e) => setSelectedFlagFilter(e.target.value)}
                className="w-full py-1.5 px-2 bg-gray-50 dark:bg-[#0b0f1a] border border-gray-200 dark:border-[rgba(255,255,255,0.08)] rounded-xl text-xs font-bold text-gray-700 dark:text-[#e8eaf0] focus:outline-none focus:border-[#ff6b00]"
              >
                <option value="all">🚩 Todas as Bandeiras</option>
                <option value="red">🚩 Vermelha (Crítica)</option>
                <option value="orange">🚩 Laranja (Atenção)</option>
                <option value="yellow">🚩 Amarela (Média)</option>
                <option value="green">🚩 Verde (Dominado)</option>
                <option value="blue">🚩 Azul (Informativo)</option>
                <option value="purple">🚩 Roxa (Decoreba)</option>
                <option value="none">⚪ Sem Bandeira</option>
              </select>
            </div>

            {/* 4. Estado FSRS */}
            <div>
              <select
                value={selectedStateFilter}
                onChange={(e) => setSelectedStateFilter(e.target.value)}
                className="w-full py-1.5 px-2 bg-gray-50 dark:bg-[#0b0f1a] border border-gray-200 dark:border-[rgba(255,255,255,0.08)] rounded-xl text-xs font-bold text-gray-700 dark:text-[#e8eaf0] focus:outline-none focus:border-[#ff6b00]"
              >
                <option value="all">🧠 Todos os Estados</option>
                <option value={CardState.New.toString()}>🔵 Novo</option>
                <option value={CardState.Learning.toString()}>🟠 Aprendizagem</option>
                <option value={CardState.Review.toString()}>🟢 Revisão</option>
                <option value={CardState.Relearning.toString()}>🔴 Reaprendizagem</option>
              </select>
            </div>

            {/* 5. Tag */}
            <div>
              <select
                value={selectedTagFilter}
                onChange={(e) => setSelectedTagFilter(e.target.value)}
                className="w-full py-1.5 px-2 bg-gray-50 dark:bg-[#0b0f1a] border border-gray-200 dark:border-[rgba(255,255,255,0.08)] rounded-xl text-xs font-bold text-gray-700 dark:text-[#e8eaf0] focus:outline-none focus:border-[#ff6b00]"
              >
                <option value="all">🏷️ Todas as Tags</option>
                {allUniqueTags.map((t) => (
                  <option key={t} value={t}>
                    #{t}
                  </option>
                ))}
              </select>
            </div>

          </div>

        </div>

        {/* Lista de Cartões */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-gray-50/50 dark:bg-[#0b0f1a]">
          {filteredCards.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 rounded-3xl bg-gray-100 dark:bg-[#131929] text-gray-400 dark:text-[#9aa5bb] flex items-center justify-center mx-auto mb-3 border border-gray-200 dark:border-[rgba(255,255,255,0.08)]">
                <Filter size={28} />
              </div>
              <h3 className="text-base font-bold text-gray-800 dark:text-[#e8eaf0]">
                Nenhum flashcard encontrado
              </h3>
              <p className="text-xs text-gray-500 dark:text-[#9aa5bb] mt-1 max-w-sm mx-auto">
                Tente ajustar os filtros ou clique em "Novo Flashcard" para adicionar seu próprio conteúdo.
              </p>
              <button
                onClick={() => onOpenCreateModal(selectedDeckFilter !== 'all' ? selectedDeckFilter : undefined)}
                className="mt-4 px-4 py-2 bg-[#ff6b00] hover:bg-[#e65c00] text-white rounded-xl font-bold text-xs shadow-md transition inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={15} /> Criar Primeiro Flashcard
              </button>
            </div>
          ) : (
            filteredCards.map((card) => {
              const deck = availableDecks.find((d) => d.id === card.deckId);
              const isCloze = card.tipo === 'cloze';
              const cardFlag = card.flag ? FLAG_CONFIG[card.flag] : null;

              return (
                <div
                  key={card.id}
                  className="bg-white dark:bg-[#131929] border border-gray-200 dark:border-[rgba(255,255,255,0.08)] rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-[#ff6b00]/40 dark:hover:border-[#ff6b00]/40 transition shadow-sm"
                >
                  <div className="flex-1 min-w-0 space-y-2">
                    
                    {/* Linha de Badges */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded bg-gray-100 dark:bg-[#1a2235] text-gray-700 dark:text-[#e8eaf0] font-mono border border-gray-200 dark:border-[rgba(255,255,255,0.08)]">
                        {deck?.sigla || (card as { sigla?: string }).sigla || 'MAT'}
                      </span>

                      <span className="text-xs font-bold text-[#ff6b00] dark:text-[#ff8533]">
                        {card.assunto}
                      </span>

                      {getStateBadge(card.id)}

                      {fsrsData[card.id]?.masteryTier === MasteryTier.Mastered && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                          💎 Dominado
                        </span>
                      )}

                      {fsrsData[card.id]?.avgLatencyMs && fsrsData[card.id].avgLatencyMs! > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center gap-0.5 font-mono">
                          ⏱️ {(fsrsData[card.id].avgLatencyMs! / 1000).toFixed(1)}s
                        </span>
                      )}

                      {fsrsData[card.id]?.consecutiveCorrect && fsrsData[card.id].consecutiveCorrect! > 1 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300">
                          🔥 {fsrsData[card.id].consecutiveCorrect}x
                        </span>
                      )}

                      {card.isCustom ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          ⭐ Meu Card
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#1a2235] text-gray-500 dark:text-[#9aa5bb]">
                          🏛️ Oficial Atena
                        </span>
                      )}

                      {cardFlag && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white flex items-center gap-1 shadow-sm"
                          style={{ backgroundColor: cardFlag.color }}
                        >
                          🚩 {cardFlag.label}
                        </span>
                      )}

                      {isCloze ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ff6b00]/10 text-[#ff6b00] dark:text-[#ff8533]">
                          🧩 Cloze {card.targetCloze ? `(c${card.targetCloze})` : ''}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          📑 Básico
                        </span>
                      )}

                      {card.imageUrl && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center gap-0.5">
                          <ImageIcon size={11} /> Imagem
                        </span>
                      )}
                    </div>

                    {/* Texto do Card */}
                    <div className="text-sm font-medium text-gray-900 dark:text-[#e8eaf0] line-clamp-2">
                      {isCloze ? renderClozeFront(card.frente, card.targetCloze || 0) : card.frente}
                    </div>

                    {!isCloze && (
                      <div className="text-xs text-gray-500 dark:text-[#9aa5bb] italic line-clamp-1">
                        ↳ Verso: {card.verso}
                      </div>
                    )}

                    {card.extra && (
                      <div className="text-[11px] text-gray-400 dark:text-[#7d889e]">
                        📝 {card.extra}
                      </div>
                    )}

                    {/* Tags */}
                    {card.tags && card.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {card.tags.map((t) => (
                          <span
                            key={t}
                            className="text-[10px] font-semibold text-gray-500 dark:text-[#9aa5bb] bg-gray-100 dark:bg-[#1a2235] px-2 py-0.5 rounded-md font-mono"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}

                  </div>

                  {/* Ações de Edição e Exclusão */}
                  <div className="flex items-center gap-1.5 self-end md:self-center">
                    <button
                      onClick={() => onEditCard(card, card.deckId || 'dp')}
                      title="Editar flashcard"
                      className="p-2 text-gray-500 hover:text-[#ff6b00] dark:text-[#9aa5bb] dark:hover:text-[#ff8533] rounded-xl hover:bg-gray-100 dark:hover:bg-[#1a2235] transition flex items-center gap-1 text-xs font-bold cursor-pointer"
                    >
                      <Edit3 size={15} /> Editar
                    </button>

                    <button
                      onClick={() => onDeleteCard(card.id, !card.isCustom)}
                      title="Excluir ou ocultar este flashcard da fila de estudos"
                      className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 dark:border-[rgba(255,255,255,0.08)] bg-gray-50/80 dark:bg-[#0b0f1a] flex items-center justify-between text-xs text-gray-500 dark:text-[#7d889e]">
          <span className="font-mono">
            {filteredCards.length} flashcards listados
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-gray-200 dark:bg-[#1a2235] text-gray-700 dark:text-[#e8eaf0] font-bold hover:bg-gray-300 dark:hover:bg-[#1f2a3c] transition cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
