import React from 'react';

// Regex para capturar sintaxe Anki: {{c1::termo}} ou {{c1::termo::dica}}
export const CLOZE_REGEX = /\{\{c(\d+)::([^}:]+)(?:::([^}]+))?\}\}/g;

export function hasCloze(text: string): boolean {
  if (!text) return false;
  return /\{\{c\d+::.+?\}\}/.test(text);
}

export function extractClozeNumbers(text: string): number[] {
  if (!text) return [];
  const numbers = new Set<number>();
  const matches = text.matchAll(/\{\{c(\d+)::/g);
  for (const match of matches) {
    const num = parseInt(match[1], 10);
    if (!isNaN(num)) numbers.add(num);
  }
  return Array.from(numbers).sort((a, b) => a - b);
}

// Renderiza markdown básico (**negrito**)
function renderFormattedChunk(text: string, keyPrefix: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={`${keyPrefix}-b-${idx}`} className="font-extrabold text-[#ff6b00] dark:text-[#ff8533]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={`${keyPrefix}-t-${idx}`}>{part}</React.Fragment>;
  });
}

/**
 * Renderiza a Frente do Cartão com Ocultação
 * - targetCloze = 0: modo normal ou interativo (oculta todos os clozes, a menos que estejam em revealedIndices)
 * - targetCloze > 0: modo multi-cartão (oculta APENAS o targetCloze, e os outros aparecem visíveis como contexto)
 */
export function renderClozeFront(
  text: string,
  targetCloze = 0,
  revealedIndices?: Set<number>,
  onToggleReveal?: (clozeIndex: number) => void
): React.ReactNode {
  if (!text) return null;
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;

  const regex = new RegExp(CLOZE_REGEX.source, 'g');
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const [fullMatch, indexStr, answer, hint] = match;
    const clozeIndex = parseInt(indexStr, 10);
    const matchStart = match.index;

    // Texto antes da tag cloze
    if (matchStart > lastIndex) {
      elements.push(...renderFormattedChunk(text.substring(lastIndex, matchStart), `front-pre-${matchStart}`));
    }

    const isTarget = targetCloze === 0 || clozeIndex === targetCloze;
    const isRevealed = revealedIndices ? revealedIndices.has(clozeIndex) : false;

    if (isTarget && !isRevealed) {
      // Ocultar este termo como badge interativo (clique/toque para revelar)
      const label = hint ? `💡 ${hint}` : '...';
      elements.push(
        <button
          key={`cloze-front-${matchStart}`}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleReveal) onToggleReveal(clozeIndex);
          }}
          className="inline-flex items-center justify-center font-mono font-bold px-2.5 py-0.5 mx-1 rounded-xl bg-[#ffe6d4] dark:bg-[#4a1d00] text-[#ff6b00] dark:text-[#ff944d] border border-[#ff6b00]/40 shadow-sm hover:scale-105 active:scale-95 hover:bg-[#ffd4b8] dark:hover:bg-[#5e2500] transition cursor-pointer"
          title={onToggleReveal ? "Clique ou toque para revelar este termo" : (hint ? `Dica: ${hint}` : 'Termo oculto')}
        >
          <span>[{label}]</span>
          {onToggleReveal && (
            <span className="text-[9px] opacity-70 ml-1">👆</span>
          )}
        </button>
      );
    } else if (isTarget && isRevealed) {
      // Termo revelado individualmente por clique no mesmo cartão
      elements.push(
        <span
          key={`cloze-revealed-${matchStart}`}
          className="inline-flex flex-col items-center font-bold px-2.5 py-0.5 mx-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 shadow-sm animate-fadeIn"
        >
          <span>{answer}</span>
          {hint && (
            <span className="text-[9px] font-normal text-emerald-700/70 dark:text-emerald-300/70 italic">
              ({hint})
            </span>
          )}
        </span>
      );
    } else {
      // Outros clozes (em modo multi-cartão) exibem o texto normalmente como contexto
      elements.push(...renderFormattedChunk(answer, `front-ans-${matchStart}`));
    }

    lastIndex = matchStart + fullMatch.length;
  }

  if (lastIndex < text.length) {
    elements.push(...renderFormattedChunk(text.substring(lastIndex), `front-post-${lastIndex}`));
  }

  return <>{elements}</>;
}

/**
 * Renderiza o Verso do Cartão com o termo revelado em destaque
 */
export function renderClozeBack(text: string, targetCloze = 0): React.ReactNode {
  if (!text) return null;
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;

  const regex = new RegExp(CLOZE_REGEX.source, 'g');
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const [fullMatch, indexStr, answer, hint] = match;
    const clozeIndex = parseInt(indexStr, 10);
    const matchStart = match.index;

    if (matchStart > lastIndex) {
      elements.push(...renderFormattedChunk(text.substring(lastIndex, matchStart), `back-pre-${matchStart}`));
    }

    if (targetCloze === 0 || clozeIndex === targetCloze) {
      // Termo revelado em destaque
      elements.push(
        <span
          key={`cloze-back-${matchStart}`}
          className="inline-flex flex-col items-center font-bold px-2.5 py-0.5 mx-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 shadow-sm"
        >
          <span>{answer}</span>
          {hint && (
            <span className="text-[10px] font-normal text-emerald-700/70 dark:text-emerald-300/70 italic">
              ({hint})
            </span>
          )}
        </span>
      );
    } else {
      elements.push(...renderFormattedChunk(answer, `back-ans-${matchStart}`));
    }

    lastIndex = matchStart + fullMatch.length;
  }

  if (lastIndex < text.length) {
    elements.push(...renderFormattedChunk(text.substring(lastIndex), `back-post-${lastIndex}`));
  }

  return <>{elements}</>;
}

/**
 * Auxiliar para inserir marcação {{c1::...}} na seleção de um textarea
 */
export function wrapWithCloze(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  clozeNum = 1,
  hint = ''
): { newText: string; newCursorPos: number } {
  const selected = text.slice(selectionStart, selectionEnd) || 'termo';
  const tag = hint ? `{{c${clozeNum}::${selected}::${hint}}}` : `{{c${clozeNum}::${selected}}}`;
  const newText = text.slice(0, selectionStart) + tag + text.slice(selectionEnd);
  return {
    newText,
    newCursorPos: selectionStart + tag.length,
  };
}
