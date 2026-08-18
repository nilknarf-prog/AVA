import React, { useState } from 'react';
import { X, Search, Edit3, Trash2, Download, Upload, Plus, Sparkles, Layers } from 'lucide-react';
import { type Card, type Deck } from './data';
import { renderClozeFront } from './cloze';

interface CustomCardsManagerProps {
  isOpen: boolean;
  onClose: () => void;
  customCards: Card[];
  availableDecks: Deck[];
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
  onEditCard,
  onDeleteCard,
  onOpenCreateModal,
  onImportCards,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeckFilter, setSelectedDeckFilter] = useState('all');

  if (!isOpen) return null;

  const filteredCards = customCards.filter((card) => {
    const matchesSearch =
      card.assunto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.frente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.verso.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDeck = selectedDeckFilter === 'all' || card.deckId === selectedDeckFilter;
    return matchesSearch && matchesDeck;
  });

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(customCards, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `atena_meus_flashcards_${new Date().toISOString().slice(0, 10)}.json`);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#fff4ed] dark:bg-[#331500] text-[#ff6b00] dark:text-[#ff8533] flex items-center justify-center font-bold">
              <Layers size={22} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                Gerenciador de Flashcards Próprios
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#ff6b00]/10 text-[#ff6b00] font-bold">
                  {customCards.length} cards
                </span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                Visualize, edite, exclua e faça backup dos seus flashcards personalizados
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar: Search, Filter, Export/Import & New */}
        <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex flex-wrap gap-3 items-center justify-between bg-white dark:bg-zinc-900">
          
          <div className="flex flex-1 items-center gap-2 min-w-[280px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Buscar por termo, assunto ou resposta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-[#ff6b00]"
              />
            </div>

            <select
              value={selectedDeckFilter}
              onChange={(e) => setSelectedDeckFilter(e.target.value)}
              className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-[#ff6b00]"
            >
              <option value="all">Todos os Baralhos</option>
              {availableDecks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.sigla} · {d.titulo}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="px-3 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              title="Exportar backup em JSON"
            >
              <Download size={14} /> Exportar
            </button>
            <button
              onClick={handleImportJSON}
              className="px-3 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              title="Importar flashcards de backup"
            >
              <Upload size={14} /> Importar
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenCreateModal();
              }}
              className="px-3.5 py-2 bg-[#ff6b00] hover:bg-[#e65c00] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <Plus size={15} /> Novo Card
            </button>
          </div>

        </div>

        {/* Cards List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {filteredCards.length === 0 ? (
            <div className="py-16 text-center">
              <Sparkles size={40} className="mx-auto text-gray-300 dark:text-zinc-700 mb-3" />
              <h3 className="text-base font-bold text-gray-700 dark:text-zinc-300 mb-1">
                {customCards.length === 0
                  ? 'Nenhum flashcard próprio criado ainda.'
                  : 'Nenhum cartão encontrado com os filtros atuais.'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-zinc-500 max-w-sm mx-auto mb-4">
                Crie seus próprios resumos, prazos e artigos com o recurso de Ocultação de Palavras (Cloze Deletion).
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

              return (
                <div
                  key={card.id}
                  className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-gray-300 dark:hover:border-zinc-700 transition shadow-sm"
                >
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300">
                        {deck?.sigla || 'CUSTOM'}
                      </span>
                      <span className="text-xs font-bold text-[#ff6b00] dark:text-[#ff8533]">
                        {card.assunto}
                      </span>
                      {isCloze ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ff6b00]/10 text-[#ff6b00] dark:text-[#ff8533]">
                          🧩 Cloze
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          📑 Básico
                        </span>
                      )}
                    </div>

                    <div className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                      {isCloze ? renderClozeFront(card.frente) : card.frente}
                    </div>

                    {!isCloze && (
                      <div className="text-xs text-gray-500 dark:text-zinc-400 italic">
                        ↳ Verso: {card.verso}
                      </div>
                    )}

                    {card.extra && (
                      <div className="text-[11px] text-gray-400 dark:text-zinc-500">
                        📝 {card.extra}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 self-end md:self-center">
                    <button
                      onClick={() => onEditCard(card, card.deckId || 'dp')}
                      className="p-2 rounded-lg text-gray-500 hover:text-[#ff6b00] hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
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
                      className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
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
