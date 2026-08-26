import React, { useState } from 'react';
import {
  Scale, BookOpen, AlertTriangle, Lightbulb, ShieldAlert,
  ExternalLink, ZoomIn, X
} from 'lucide-react';
import { CLOZE_REGEX, hasCloze } from './cloze';

export type TextAlignment = 'left' | 'center' | 'right' | 'justify';

export interface RichTextProps {
  content: string;
  isBack?: boolean;
  targetCloze?: number;
  revealedIndices?: Set<number>;
  onToggleReveal?: (clozeIndex: number) => void;
  align?: TextAlignment;
  className?: string;
}

// 7 Cores de Bandeiras do Anki
export const FLAG_CONFIG = {
  red: { label: 'Gargalo / Urgente', color: '#ef4444', bg: 'bg-red-500', text: 'text-red-500', border: 'border-red-500', ring: 'ring-red-500/30' },
  orange: { label: 'Alta Prioridade', color: '#f97316', bg: 'bg-orange-500', text: 'text-orange-500', border: 'border-orange-500', ring: 'ring-orange-500/30' },
  yellow: { label: 'Importante', color: '#eab308', bg: 'bg-yellow-500', text: 'text-yellow-500', border: 'border-yellow-500', ring: 'ring-yellow-500/30' },
  green: { label: 'Conceito Dominado', color: '#10b981', bg: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500', ring: 'ring-emerald-500/30' },
  blue: { label: 'Jurisprudência / Lei', color: '#3b82f6', bg: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500', ring: 'ring-blue-500/30' },
  purple: { label: 'Doutrina Aprofundada', color: '#a855f7', bg: 'bg-purple-500', text: 'text-purple-500', border: 'border-purple-500', ring: 'ring-purple-500/30' },
  pink: { label: 'Pegadinha Clássica', color: '#ec4899', bg: 'bg-pink-500', text: 'text-pink-500', border: 'border-pink-500', ring: 'ring-pink-500/30' },
} as const;

export type FlagColor = keyof typeof FLAG_CONFIG;

// Cores de Texto e Marca-texto suportadas
export const HIGHLIGHT_COLORS: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  yellow: { bg: 'bg-yellow-200/80', text: 'text-yellow-950', darkBg: 'dark:bg-yellow-500/30', darkText: 'dark:text-yellow-200' },
  green: { bg: 'bg-emerald-200/80', text: 'text-emerald-950', darkBg: 'dark:bg-emerald-500/30', darkText: 'dark:text-emerald-200' },
  orange: { bg: 'bg-orange-200/80', text: 'text-orange-950', darkBg: 'dark:bg-orange-500/30', darkText: 'dark:text-orange-200' },
  red: { bg: 'bg-red-200/80', text: 'text-red-950', darkBg: 'dark:bg-red-500/30', darkText: 'dark:text-red-200' },
  blue: { bg: 'bg-blue-200/80', text: 'text-blue-950', darkBg: 'dark:bg-blue-500/30', darkText: 'dark:text-blue-200' },
  purple: { bg: 'bg-purple-200/80', text: 'text-purple-950', darkBg: 'dark:bg-purple-500/30', darkText: 'dark:text-purple-200' },
};

export const FONT_COLORS: Record<string, { light: string; dark: string }> = {
  orange: { light: 'text-[#ff6b00]', dark: 'dark:text-[#ff8533]' },
  red: { light: 'text-red-600', dark: 'dark:text-red-400' },
  emerald: { light: 'text-emerald-600', dark: 'dark:text-emerald-400' },
  blue: { light: 'text-blue-600', dark: 'dark:text-blue-400' },
  purple: { light: 'text-purple-600', dark: 'dark:text-purple-400' },
  amber: { light: 'text-amber-600', dark: 'dark:text-amber-400' },
};

/**
 * Modal Lightbox para visualização de imagem com zoom
 */
export const ImageLightboxModal: React.FC<{ imageUrl: string | null; onClose: () => void }> = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          title="Fechar"
        >
          <X size={24} />
        </button>
        <img
          src={imageUrl}
          alt="Flashcard ampliado"
          className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/20"
        />
        <p className="text-white/70 text-xs mt-3">Clique fora ou no botão acima para fechar</p>
      </div>
    </div>
  );
};

/**
 * Parser de blocos e formatação rica de flashcards
 */
export const RichContentRenderer: React.FC<RichTextProps> = ({
  content,
  isBack = false,
  targetCloze = 0,
  revealedIndices,
  onToggleReveal,
  align = 'left',
  className = '',
}) => {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  if (!content) return null;

  // Alinhamento CSS
  const alignClass =
    align === 'center'
      ? 'text-center'
      : align === 'right'
      ? 'text-right'
      : align === 'justify'
      ? 'text-justify'
      : 'text-left';

  // Processar blocos especiais (:::sumula, :::lei, :::pegadinha, :::dica, :::excecao)
  const renderBlocks = (text: string) => {
    const blockRegex = /:::([a-z]+)\n?([\s\S]*?):::/g;
    const segments: React.ReactNode[] = [];
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    while ((match = blockRegex.exec(text)) !== null) {
      const [fullMatch, blockType, blockContent] = match;
      const matchStart = match.index;

      if (matchStart > lastIdx) {
        segments.push(
          <div key={`seg-${lastIdx}`} className="inline">
            {renderInlineMarkdown(
              text.substring(lastIdx, matchStart),
              isBack,
              targetCloze,
              setLightboxImage,
              revealedIndices,
              onToggleReveal
            )}
          </div>
        );
      }

      // Renderizar Callout Box especializada
      segments.push(
        <div key={`block-${matchStart}`} className="my-3 text-left w-full">
          {renderCalloutBox(
            blockType,
            blockContent.trim(),
            isBack,
            targetCloze,
            setLightboxImage,
            revealedIndices,
            onToggleReveal
          )}
        </div>
      );

      lastIdx = matchStart + fullMatch.length;
    }

    if (lastIdx < text.length) {
      segments.push(
        <div key={`seg-end-${lastIdx}`} className="inline">
          {renderInlineMarkdown(
            text.substring(lastIdx),
            isBack,
            targetCloze,
            setLightboxImage,
            revealedIndices,
            onToggleReveal
          )}
        </div>
      );
    }

    return segments;
  };

  return (
    <>
      <div className={`leading-relaxed ${alignClass} ${className} break-words`}>
        {renderBlocks(content)}
      </div>
      <ImageLightboxModal imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />
    </>
  );
};

/**
 * Renderiza caixas de destaque especializadas para concursos (Callouts)
 */
function renderCalloutBox(
  type: string,
  content: string,
  isBack: boolean,
  targetCloze: number,
  onImageClick: (url: string) => void,
  revealedIndices?: Set<number>,
  onToggleReveal?: (clozeIndex: number) => void
) {
  let title = 'Informação';
  let icon = <BookOpen size={16} />;
  let boxClasses = 'bg-gray-50 dark:bg-zinc-800/80 border-gray-200 dark:border-zinc-700 text-gray-800 dark:text-zinc-200';
  let titleClasses = 'text-gray-700 dark:text-zinc-300';

  switch (type.toLowerCase()) {
    case 'sumula':
    case 'jurisprudencia':
    case 'stf':
    case 'stj':
      title = 'Súmula / Jurisprudência (STF/STJ)';
      icon = <Scale size={16} className="text-blue-500" />;
      boxClasses = 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60 text-blue-950 dark:text-blue-100';
      titleClasses = 'text-blue-700 dark:text-blue-300 font-bold';
      break;

    case 'lei':
    case 'leiseca':
    case 'artigo':
      title = 'Letra da Lei (Artigo / Dispositivo)';
      icon = <BookOpen size={16} className="text-emerald-500" />;
      boxClasses = 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-950 dark:text-emerald-100';
      titleClasses = 'text-emerald-700 dark:text-emerald-300 font-bold';
      break;

    case 'pegadinha':
    case 'cuidado':
    case 'alerta':
      title = 'Pegadinha da Banca / Cuidado!';
      icon = <AlertTriangle size={16} className="text-red-500" />;
      boxClasses = 'bg-red-50/70 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-950 dark:text-red-100';
      titleClasses = 'text-red-700 dark:text-red-300 font-bold';
      break;

    case 'dica':
    case 'macete':
    case 'mnemonico':
      title = 'Dica / Macete Mnemônico';
      icon = <Lightbulb size={16} className="text-amber-500" />;
      boxClasses = 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-950 dark:text-amber-100';
      titleClasses = 'text-amber-700 dark:text-amber-300 font-bold';
      break;

    case 'excecao':
    case 'vedado':
      title = 'Exceção à Regra / Proibição';
      icon = <ShieldAlert size={16} className="text-purple-500" />;
      boxClasses = 'bg-purple-50/70 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900/60 text-purple-950 dark:text-purple-100';
      titleClasses = 'text-purple-700 dark:text-purple-300 font-bold';
      break;
  }

  return (
    <div className={`p-3.5 rounded-xl border text-xs sm:text-sm shadow-sm ${boxClasses}`}>
      <div className={`flex items-center gap-1.5 mb-1.5 text-xs uppercase tracking-wider ${titleClasses}`}>
        {icon}
        <span>{title}</span>
      </div>
      <div className="leading-relaxed">
        {renderInlineMarkdown(content, isBack, targetCloze, onImageClick, revealedIndices, onToggleReveal)}
      </div>
    </div>
  );
}

/**
 * Renderiza Markdown inline, cores, marca-texto, imagens, links e Cloze Deletions
 */
function renderInlineMarkdown(
  text: string,
  isBack: boolean,
  targetCloze: number,
  onImageClick: (url: string) => void,
  revealedIndices?: Set<number>,
  onToggleReveal?: (clozeIndex: number) => void
): React.ReactNode[] {
  if (!text) return [];

  // Se houver tags Cloze, intercalar com o parser de Cloze
  if (hasCloze(text)) {
    return renderClozeWithRichText(text, isBack, targetCloze, onImageClick, revealedIndices, onToggleReveal);
  }

  return parseRichTokens(text, 't', onImageClick);
}

/**
 * Intercala tags Cloze {{c1::termo}} com formatação rica e suporte a revelação por clique
 */
function renderClozeWithRichText(
  text: string,
  isBack: boolean,
  targetCloze: number,
  onImageClick: (url: string) => void,
  revealedIndices?: Set<number>,
  onToggleReveal?: (clozeIndex: number) => void
): React.ReactNode[] {
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
      elements.push(...parseRichTokens(text.substring(lastIndex, matchStart), `cl-pre-${matchStart}`, onImageClick));
    }

    const isTarget = targetCloze === 0 || clozeIndex === targetCloze;
    const isRevealed = revealedIndices ? revealedIndices.has(clozeIndex) : false;

    if (!isBack) {
      // FRENTE DO CARTÃO
      if (isTarget && !isRevealed) {
        const label = hint ? `💡 ${hint}` : '...';
        elements.push(
          <button
            key={`cloze-btn-${matchStart}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onToggleReveal) onToggleReveal(clozeIndex);
            }}
            className="inline-flex items-center justify-center font-mono font-bold px-2.5 py-0.5 mx-1 rounded-xl bg-[#ffe6d4] dark:bg-[#4a1d00] text-[#ff6b00] dark:text-[#ff944d] border border-[#ff6b00]/40 shadow-sm hover:scale-105 active:scale-95 hover:bg-[#ffd4b8] dark:hover:bg-[#5e2500] transition cursor-pointer"
            title={onToggleReveal ? "Clique ou toque para revelar" : (hint ? `Dica: ${hint}` : 'Termo oculto')}
          >
            <span>[{label}]</span>
            {onToggleReveal && (
              <span className="text-[9px] opacity-70 ml-1">👆</span>
            )}
          </button>
        );
      } else if (isTarget && isRevealed) {
        // Revelado individualmente pelo aluno
        elements.push(
          <span
            key={`cloze-rev-${matchStart}`}
            className="inline-flex flex-col items-center font-bold px-2.5 py-0.5 mx-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 shadow-sm animate-fadeIn"
          >
            <span>{parseRichTokens(answer, `cl-ansrev-${matchStart}`, onImageClick)}</span>
            {hint && (
              <span className="text-[9px] font-normal text-emerald-700/70 dark:text-emerald-300/70 italic">
                ({hint})
              </span>
            )}
          </span>
        );
      } else {
        // Contexto visível para outros clozes em cartões desmembrados
        elements.push(...parseRichTokens(answer, `cl-ans-${matchStart}`, onImageClick));
      }
    } else {
      // VERSO DO CARTÃO (REVELADO TOTAL)
      if (isTarget) {
        elements.push(
          <span
            key={`cloze-back-${matchStart}`}
            className="inline-flex flex-col items-center font-bold px-2.5 py-0.5 mx-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 shadow-sm"
          >
            <span>{parseRichTokens(answer, `cl-backans-${matchStart}`, onImageClick)}</span>
            {hint && (
              <span className="text-[10px] font-normal text-emerald-700/70 dark:text-emerald-300/70 italic">
                ({hint})
              </span>
            )}
          </span>
        );
      } else {
        elements.push(...parseRichTokens(answer, `cl-backctx-${matchStart}`, onImageClick));
      }
    }

    lastIndex = matchStart + fullMatch.length;
  }

  if (lastIndex < text.length) {
    elements.push(...parseRichTokens(text.substring(lastIndex), `cl-post-${lastIndex}`, onImageClick));
  }

  return elements;
}

/**
 * Parser de tokens ricos: Negrito, Itálico, Sublinhado, Riscado, Cores, Marca-texto, Imagens e Links
 */
function parseRichTokens(
  rawText: string,
  keyPrefix: string,
  onImageClick: (url: string) => void
): React.ReactNode[] {
  if (!rawText) return [];

  const tokensRegex =
    /(!\[([^\]]*)\]\(([^)]+)\))|(\[([^\]]+)\]\(([^)]+)\))|(<mark:([a-z]+)>([\s\S]*?)<\/mark>)|(==([\s\S]*?)==)|(<color:([a-z#0-9]+)>([\s\S]*?)<\/color>)|(<u>([\s\S]*?)<\/u>)|(__([\s\S]*?)__)|(~~([\s\S]*?)~~)|(<s>([\s\S]*?)<\/s>)|(\*\*([\s\S]*?)\*\*)|(<b>([\s\S]*?)<\/b>)|(\*([^*\n]+)\*)|(<i>([\s\S]*?)<\/i>|(\n))/g;

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokensRegex.exec(rawText)) !== null) {
    const matchStart = match.index;

    // Texto plano antes do match
    if (matchStart > lastIndex) {
      nodes.push(
        <React.Fragment key={`${keyPrefix}-txt-${lastIndex}`}>
          {rawText.substring(lastIndex, matchStart)}
        </React.Fragment>
      );
    }

    // 1. Imagem: ![alt](url)
    if (match[1]) {
      const alt = match[2] || 'Imagem do flashcard';
      const url = match[3];
      nodes.push(
        <div key={`${keyPrefix}-img-${matchStart}`} className="my-3 flex flex-col items-center group relative cursor-pointer" onClick={() => onImageClick(url)}>
          <img
            src={url}
            alt={alt}
            className="max-h-64 sm:max-h-80 max-w-full rounded-xl border border-gray-200 dark:border-zinc-700 shadow-md object-contain hover:opacity-95 transition"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-xl transition-opacity">
            <span className="bg-black/70 text-white text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
              <ZoomIn size={14} /> Ampliar
            </span>
          </div>
          {alt && alt !== 'Imagem do flashcard' && (
            <span className="text-[11px] text-gray-500 dark:text-zinc-400 mt-1 italic">{alt}</span>
          )}
        </div>
      );
    }
    // 2. Link: [texto](url)
    else if (match[4]) {
      const text = match[5];
      const url = match[6];
      nodes.push(
        <a
          key={`${keyPrefix}-link-${matchStart}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 text-[#ff6b00] dark:text-[#ff8533] underline font-semibold hover:opacity-80 transition"
          onClick={(e) => e.stopPropagation()}
        >
          <span>{text}</span>
          <ExternalLink size={12} className="inline ml-0.5" />
        </a>
      );
    }
    // 3. Marca-texto colorido: <mark:cor>texto</mark>
    else if (match[7]) {
      const colorKey = match[8] || 'yellow';
      const text = match[9];
      const style = HIGHLIGHT_COLORS[colorKey] || HIGHLIGHT_COLORS.yellow;
      nodes.push(
        <mark
          key={`${keyPrefix}-mark-${matchStart}`}
          className={`px-1.5 py-0.5 mx-0.5 rounded font-semibold ${style.bg} ${style.text} ${style.darkBg} ${style.darkText}`}
        >
          {parseRichTokens(text, `${keyPrefix}-submark-${matchStart}`, onImageClick)}
        </mark>
      );
    }
    // 4. Marca-texto padrão: ==texto==
    else if (match[10]) {
      const text = match[11];
      const style = HIGHLIGHT_COLORS.yellow;
      nodes.push(
        <mark
          key={`${keyPrefix}-mark2-${matchStart}`}
          className={`px-1.5 py-0.5 mx-0.5 rounded font-semibold ${style.bg} ${style.text} ${style.darkBg} ${style.darkText}`}
        >
          {parseRichTokens(text, `${keyPrefix}-submark2-${matchStart}`, onImageClick)}
        </mark>
      );
    }
    // 5. Cor da fonte: <color:cor>texto</color>
    else if (match[12]) {
      const colorVal = match[13];
      const text = match[14];
      const fontColor = FONT_COLORS[colorVal];

      if (fontColor) {
        nodes.push(
          <span key={`${keyPrefix}-color-${matchStart}`} className={`font-bold ${fontColor.light} ${fontColor.dark}`}>
            {parseRichTokens(text, `${keyPrefix}-subcolor-${matchStart}`, onImageClick)}
          </span>
        );
      } else {
        nodes.push(
          <span key={`${keyPrefix}-color-${matchStart}`} style={{ color: colorVal }} className="font-bold">
            {parseRichTokens(text, `${keyPrefix}-subcolor-${matchStart}`, onImageClick)}
          </span>
        );
      }
    }
    // 6. Sublinhado: <u>texto</u> ou __texto__
    else if (match[15] || match[17]) {
      const text = match[16] || match[18];
      nodes.push(
        <u key={`${keyPrefix}-u-${matchStart}`} className="decoration-[#ff6b00] decoration-2 underline-offset-2">
          {parseRichTokens(text, `${keyPrefix}-subu-${matchStart}`, onImageClick)}
        </u>
      );
    }
    // 7. Riscado: ~~texto~~ ou <s>texto</s>
    else if (match[19] || match[21]) {
      const text = match[20] || match[22];
      nodes.push(
        <s key={`${keyPrefix}-s-${matchStart}`} className="line-through text-gray-400 dark:text-zinc-500">
          {parseRichTokens(text, `${keyPrefix}-subs-${matchStart}`, onImageClick)}
        </s>
      );
    }
    // 8. Negrito: **texto** ou <b>texto</b>
    else if (match[23] || match[25]) {
      const text = match[24] || match[26];
      nodes.push(
        <strong key={`${keyPrefix}-b-${matchStart}`} className="font-black text-gray-900 dark:text-zinc-50">
          {parseRichTokens(text, `${keyPrefix}-subb-${matchStart}`, onImageClick)}
        </strong>
      );
    }
    // 9. Itálico: *texto* ou <i>texto</i>
    else if (match[27] || match[29]) {
      const text = match[28] || match[30];
      nodes.push(
        <em key={`${keyPrefix}-i-${matchStart}`} className="italic">
          {parseRichTokens(text, `${keyPrefix}-subi-${matchStart}`, onImageClick)}
        </em>
      );
    }
    // 10. Quebra de linha: \n
    else if (match[31] === '\n') {
      nodes.push(<br key={`${keyPrefix}-br-${matchStart}`} />);
    }

    lastIndex = matchStart + match[0].length;
  }

  if (lastIndex < rawText.length) {
    nodes.push(
      <React.Fragment key={`${keyPrefix}-txt-end-${lastIndex}`}>
        {rawText.substring(lastIndex)}
      </React.Fragment>
    );
  }

  return nodes;
}
