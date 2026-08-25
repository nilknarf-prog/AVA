import React, { useState, useMemo } from 'react';
import {
  X, Search, Edit3, Trash2, Download, Upload, Plus, Sparkles, Layers,
  Image as ImageIcon, Filter
} from 'lucide-react';
import { type Card, type Deck } from './data';
import { renderClozeFront } from './cloze';
import { FLAG_CONFIG, type FlagColor } from './richText';
import { CardState, type FSRSData } from './fsrs';

interface CustomCardsManagerProps {
  isOpen: boolean;
  onClose: () => void;
  customCards: Card[];
  availableDecks: Deck[];
  fsrsData: FSRSData;
  onEditCard: (card: Card, deckId: string) => void;
  onDeleteCard: (cardId: string) => void;
  onOpenCreateModal: () => void;
  onImportCards: (cards: Card[]) => void;
}

export const CustomCardsManager: React.FC<CustomCardsManagerProps> = ({
  isOpen,
  onClose,
  customCards,
  availableDecks,
  fsrsData,
  onEditCard,
  onDeleteCard,
  onOpenCreateModal,
  onImportCards,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeckFilter, setSelectedDeckFilter] = useState('all');
  const [selectedFlagFilter, setSelectedFlagFilter] = useState<string>('all');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all');
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('all');

  if (!isOpen) return null;

  // Extrair todas as tags únicas
  const allUniqueTags = useMemo(() => {
    const set = new Set<string>();
    customCards.forEach((c) => {
      if (c.tags) c.tags.forEach((t) => set.add(t));
    });
    return Array.from(set).sort();
  }, [customCards]);

  const filteredCards = customCards.filter((card) => {
    // 1. Busca por texto
    const textToSearch = `${card.assunto} ${card.frente} ${card.verso} ${card.extra || ''} ${(card.tags || []).join(' ')}`.toLowerCase();
    const matchesSearch = !searchTerm.trim() || textToSearch.includes(searchTerm.toLowerCase());

    // 2. Filtro de Baralho
    const matchesDeck = selectedDeckFilter === 'all' || card.deckId === selectedDeckFilter;

    // 3. Filtro de Bandeira
    let matchesFlag = true;
    if (selectedFlagFilter === 'none') {
      matchesFlag = !card.flag;
    } else if (selectedFlagFilter !== 'all') {
      matchesFlag = card.flag === selectedFlagFilter;
    }

    // 4. Filtro de Tag
    let matchesTag = true;
    if (selectedTagFilter !== 'all') {
      matchesTag = card.tags ? card.tags.includes(selectedTagFilter) : false;
    }

    // 5. Filtro de Estado FSRS
    let matchesState = true;
    if (selectedStateFilter !== 'all') {
      const cardFsrs = fsrsData[card.id];
      const state = cardFsrs?.state ?? CardState.New;
      matchesState = state.toString() === selectedStateFilter;
    }

    return matchesSearch && matchesDeck && matchesFlag && matchesTag && matchesState;
  });

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(customCards, null, 2));
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
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">🔵 Novo</span>;
      case CardState.Learning:
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">🟠 Aprendizagem</span>;
      case CardState.Review:
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">🟢 Revisão</span>;
      case CardState.Relearning:
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">🔴 Reaprendizagem</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-zinc-800 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/70 dark:bg-zinc-900/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#fff4ed] dark:bg-[#331500] text-[#ff6b00] dark:text-[#ff8533] flex items-center justify-center font-bold shadow-sm">
              <Layers size={22} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                Gerenciador de Flashcards Próprios
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#ff6b00]/10 text-[#ff6b00] font-bold">
                  {customCards.length} cards
                </span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                Filtre por bandeira, tags, estado da memória e faça backup sincronizado
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

        {/* Toolbar & Filters */}
        <div className="p-4 border-b border-gray-100 dark:border-zinc-800 space-y-3 bg-white dark:bg-zinc-900">
          
          {/* Linha 1: Busca e Ações Rápidas */}
          <div className="flex flex-wrap gap-2.5 items-center justify-between">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3.5 top-2.5 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Buscar por assunto, termo, artigo, tag..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-[#ff6b00]"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportJSON}
                className="px-3 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                title="Exportar backup em JSON para celular/tablet"
              >
                <Download size={14} /> Exportar JSON
              </button>
              <button
                onClick={handleImportJSON}
                className="px-3 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                title="Importar flashcards de backup"
              >
                <Upload size={14} /> Importar JSON
              </button>
              <button
                onClick={() => {
                  onClose();
                  onOpenCreateModal();
                }}
                className="px-3.5 py-2 bg-[#ff6b00] hover:bg-[#e65c00] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
              >
                <Plus size={15} /> Novo Card
              </button>
            </div>
          </div>

          {/* Linha 2: Barra de Filtros Multifacetados */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100 dark:border-zinc-800 text-xs">
            <span className="text-gray-400 flex items-center gap-1 font-semibold">
              <Filter size={13} /> Filtrar:
            </span>

            {/* Filtro Baralho */}
            <select
              value={selectedDeckFilter}
              onChange={(e) => setSelectedDeckFilter(e.target.value)}
              className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-gray-800 dark:text-zinc-200"
            >
              <option value="all">Todos os Baralhos</option>
              {availableDecks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.sigla} · {d.titulo}
                </option>
              ))}
            </select>

            {/* Filtro Bandeira */}
            <select
              value={selectedFlagFilter}
              onChange={(e) => setSelectedFlagFilter(e.target.value)}
              className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-gray-800 dark:text-zinc-200"
            >
              <option value="all">🚩 Todas as Bandeiras</option>
              <option value="none">Sem Bandeira</option>
              {(Object.keys(FLAG_CONFIG) as FlagColor[]).map((f) => (
                <option key={f} value={f}>
                  🚩 {FLAG_CONFIG[f].label}
                </option>
              ))}
            </select>

            {/* Filtro Estado FSRS */}
            <select
              value={selectedStateFilter}
              onChange={(e) => setSelectedStateFilter(e.target.value)}
              className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-gray-800 dark:text-zinc-200"
            >
              <option value="all">🧠 Todos os Estados</option>
              <option value={CardState.New.toString()}>🔵 Novos</option>
              <option value={CardState.Learning.toString()}>🟠 Aprendizagem</option>
              <option value={CardState.Review.toString()}>🟢 Revisão</option>
              <option value={CardState.Relearning.toString()}>🔴 Reaprendizagem (Falhas)</option>
            </select>

            {/* Filtro Tags */}
            {allUniqueTags.length > 0 && (
              <select
                value={selectedTagFilter}
                onChange={(e) => setSelectedTagFilter(e.target.value)}
                className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-gray-800 dark:text-zinc-200"
              >
                <option value="all">🏷️ Todas as Tags</option>
                {allUniqueTags.map((t) => (
                  <option key={t} value={t}>
                    #{t}
                  </option>
                ))}
              </select>
            )}

            {(selectedDeckFilter !== 'all' || selectedFlagFilter !== 'all' || selectedTagFilter !== 'all' || selectedStateFilter !== 'all' || searchTerm) && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedDeckFilter('all');
                  setSelectedFlagFilter('all');
                  setSelectedTagFilter('all');
                  setSelectedStateFilter('all');
                }}
                className="text-[11px] text-[#ff6b00] hover:underline font-bold ml-auto"
              >
                Limpar Filtros ({filteredCards.length} de {customCards.length})
              </button>
            )}
          </div>

        </div>

        {/* Cards List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {filteredCards.length === 0 ? (
            <div className="py-16 text-center">
              <Sparkles size={40} className="mx-auto text-gray-300 dark:text-zinc-700 mb-3" />
              <h3 className="text-base font-bold text-gray-700 dark:text-zinc-300 mb-1">
                {customCards.length === 0
                  ? 'Nenhum flashcard próprio criado ainda.'
                  : 'Nenhum cartão encontrado com os filtros atuais.'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-zinc-500 max-w-sm mx-auto mb-4">
                Crie seus próprios resumos, prazos, artigos e jurisprudências com recursos modernos de edição.
              </p>
              {customCards.length === 0 && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenCreateModal();
                  }}
                  className="px-4 py-2 bg-[#ff6b00] text-white rounded-xl text-xs font-bold shadow hover:bg-[#e65c00] transition"
                >
                  Criar Primeiro Flashcard
                </button>
              )}
            </div>
          ) : (
            filteredCards.map((card) => {
              const deck = availableDecks.find((d) => d.id === card.deckId);
              const isCloze = card.tipo === 'cloze';
              const cardFlag = card.flag ? FLAG_CONFIG[card.flag] : null;

              return (
                <div
                  key={card.id}
                  className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-gray-300 dark:hover:border-zinc-700 transition shadow-sm"
                >
                  <div className="flex-1 min-w-0 space-y-2">
                    
                    {/* Linha de Badges */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300">
                        {deck?.sigla || 'CUSTOM'}
                      </span>

                      <span className="text-xs font-bold text-[#ff6b00] dark:text-[#ff8533]">
                        {card.assunto}
                      </span>

                      {getStateBadge(card.id)}

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
                    <div className="text-sm font-medium text-gray-900 dark:text-zinc-100 line-clamp-2">
                      {isCloze ? renderClozeFront(card.frente, card.targetCloze || 0) : card.frente}
                    </div>

                    {!isCloze && (
                      <div className="text-xs text-gray-500 dark:text-zinc-400 italic line-clamp-1">
                        ↳ Verso: {card.verso}
                      </div>
                    )}

                    {card.extra && (
                      <div className="text-[11px] text-gray-400 dark:text-zinc-500">
                        📝 {card.extra}
                      </div>
                    )}

                    {/* Tags */}
                    {card.tags && card.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {card.tags.map((t) => (
                          <span
                            key={t}
                            className="text-[10px] font-semibold text-gray-500 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}

                  </div>

                  <div className="flex items-center gap-1.5 self-end md:self-center">
                    <button
                      onClick={() => onEditCard(card, card.deckId || 'dp')}
                      className="p-2 rounded-xl text-gray-500 hover:text-[#ff6b00] hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
                      title="Editar flashcard"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Tem certeza que deseja excluir o flashcard "${card.assunto}"?`)) {
                          onDeleteCard(card.id);
                        }
                      }}
                      className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                      title="Excluir flashcard"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
