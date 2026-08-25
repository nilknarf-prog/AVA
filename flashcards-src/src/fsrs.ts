/**
 * FSRS (Free Spaced Repetition Scheduler) Concursos Engine v2.0
 * Implementação neuro-calibrada para o ecossistema Atena (AVA Delta)
 * Baseado no modelo DSR (Difficulty, Stability, Retrievability) com Horizon Capping & Study Modes
 */

import { type FlagColor } from './richText';

export enum Rating {
  Again = 1, // Errei / Esqueci (Falha Total)
  Hard = 2,  // Difícil / Hesitei (Esforço Cognitivo Alto)
  Good = 3,  // Bom / Correto (Lembrança Fluida no Tempo Adequado)
  Easy = 4,  // Fácil / Domínio Pleno (Consolidação Imediata)
}

export enum CardState {
  New = 0,          // 🔵 Novo (Nunca estudado)
  Learning = 1,     // 🟠 Aprendizagem (Em aquisição de curto prazo)
  Review = 2,       // 🟢 Revisão (Estabilizado na memória de longo prazo)
  Relearning = 3,   // 🔴 Reaprendizagem (Falha/Esquecimento recente)
}

export enum StudyMode {
  Normal = 'normal',         // Modo Tradicional / Pré-Edital (Base sólida, máx 90 dias)
  PosEdital = 'pos_edital',   // Modo Reta Final / Pós-Edital (Alta retenção, máx 21 dias)
  Gargalos = 'gargalos',     // Modo Gargalos & Falhas (Foco em erros e bandeiras vermelhas)
  Simulado = 'simulado',     // Modo Simulado Livre (Treino sem alterar o agendamento SRS)
}

export interface StudyModeInfo {
  id: StudyMode;
  name: string;
  shortName: string;
  badge: string;
  icon: string;
  desiredRetention: number;
  maxIntervalDays: number;
  description: string;
  color: string;
}

export const STUDY_MODES_CONFIG: Record<StudyMode, StudyModeInfo> = {
  [StudyMode.Normal]: {
    id: StudyMode.Normal,
    name: 'Modo Normal (Pré-Edital)',
    shortName: 'Pré-Edital',
    badge: 'Base Sólida',
    icon: '📘',
    desiredRetention: 0.88,
    maxIntervalDays: 90,
    description: 'Espaçamento equilibrado para consolidação de longo prazo com teto máximo de 90 dias.',
    color: '#3b82f6',
  },
  [StudyMode.PosEdital]: {
    id: StudyMode.PosEdital,
    name: 'Modo Reta Final (Pós-Edital)',
    shortName: 'Reta Final',
    badge: 'Alta Retenção',
    icon: '⚡',
    desiredRetention: 0.94,
    maxIntervalDays: 21,
    description: 'Máxima densidade pré-prova. Nenhum cartão fica mais de 21 dias sem revisão.',
    color: '#ff6b00',
  },
  [StudyMode.Gargalos]: {
    id: StudyMode.Gargalos,
    name: 'Modo Gargalos & Erros',
    shortName: 'Gargalos',
    badge: 'Reativação',
    icon: '🎯',
    desiredRetention: 0.90,
    maxIntervalDays: 14,
    description: 'Foco exclusivo em cartões esquecidos, alta dificuldade e bandeiras de urgência.',
    color: '#ef4444',
  },
  [StudyMode.Simulado]: {
    id: StudyMode.Simulado,
    name: 'Modo Simulado Livre',
    shortName: 'Simulado',
    badge: 'Treino Livre',
    icon: '📝',
    desiredRetention: 0.90,
    maxIntervalDays: 90,
    description: 'Revisão livre para véspera de prova sem modificar os prazos oficiais de agendamento.',
    color: '#10b981',
  },
};

export interface FSRSCard {
  id: string;
  difficulty: number;  // D: 1 a 10
  stability: number;   // S: em dias
  reps: number;        // total de repetições
  lapses: number;      // total de esquecimentos
  state: CardState;    // estado atual (New, Learning, Review, Relearning)
  flag?: FlagColor | null;
  lastReview?: string; // ISO date string
  nextReview: string;  // ISO date string
  dueInterval: number; // intervalo atual em dias
  history?: Array<{
    date: string;
    rating: Rating;
    difficulty: number;
    stability: number;
    state: CardState;
  }>;
}

export type FSRSData = Record<string, FSRSCard>;

// Parâmetros calibrados do FSRS v4.5 / v5
export const DEFAULT_FSRS_WEIGHTS = [
  0.40255, 1.18385, 3.173, 15.69105, // w0-w3: Estabilidade inicial para Again, Hard, Good, Easy
  7.1949, 0.5345,                    // w4-w5: Dificuldade inicial
  1.4604, 0.0046,                    // w6-w7: Ajuste de dificuldade & regressão à média
  1.54575, 0.1192, 1.01925,          // w8-w10: Ganho de estabilidade no acerto
  1.9395, 0.11, 0.29605, 0.22695,    // w11-w14: Perda de estabilidade na falha (Again)
  0.5698, 2.8544,                    // w15-w16: Penalidade Hard / Bônus Easy
  0.2163, 0.4491                     // w17-w18: Constantes de decaimento
];

const FACTOR = 19 / 81; // ~0.2345679
const DECAY = -0.5;

function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

/**
 * Calcula a probabilidade instantânea de recuperação da memória (Retrievability - R)
 */
export function calculateRetrievability(elapsedDays: number, stability: number): number {
  if (stability <= 0) return 0;
  if (elapsedDays <= 0) return 1.0;
  return Math.pow(1 + FACTOR * (elapsedDays / stability), DECAY);
}

/**
 * Calcula o próximo intervalo em dias com limite máximo de horizonte (Horizon Capping)
 */
export function calculateInterval(
  stability: number,
  desiredRetention = 0.90,
  maxIntervalDays = 90
): number {
  if (stability <= 0) return 1;
  const targetR = clamp(desiredRetention, 0.70, 0.97);
  // Interval = (Stability / FACTOR) * (R^(1/DECAY) - 1)
  const power = 1 / DECAY; // -2.0
  const ratio = Math.pow(targetR, power) - 1;
  const rawInterval = (stability / FACTOR) * ratio;
  const clampedInterval = Math.max(1, Math.round(rawInterval));

  // Aplicar teto máximo do modo de estudo
  return Math.min(clampedInterval, maxIntervalDays);
}

/**
 * Adiciona leve variação (fuzzing) em intervalos médios/longos para evitar acúmulo no mesmo dia
 */
function applyFuzzing(interval: number, cardId: string): number {
  if (interval <= 5) return interval;
  // Variação pseudo-determinística de +- 5% baseada no ID do cartão
  let hash = 0;
  for (let i = 0; i < cardId.length; i++) {
    hash = (hash << 5) - hash + cardId.charCodeAt(i);
    hash |= 0;
  }
  const factor = 0.95 + (Math.abs(hash) % 11) * 0.01; // 0.95 a 1.05
  return Math.max(1, Math.round(interval * factor));
}

/**
 * Calcula Dificuldade Inicial (D0)
 */
function initialDifficulty(rating: Rating, w = DEFAULT_FSRS_WEIGHTS): number {
  const d0 = w[4] - Math.exp(w[5] * (rating - 1)) + 1;
  return clamp(d0, 1.0, 10.0);
}

/**
 * Calcula Estabilidade Inicial (S0)
 */
function initialStability(rating: Rating, w = DEFAULT_FSRS_WEIGHTS): number {
  const s0 = w[rating - 1];
  return Math.max(0.1, s0);
}

/**
 * Atualiza Dificuldade com regressão contínua à média
 */
function nextDifficulty(currentD: number, rating: Rating, w = DEFAULT_FSRS_WEIGHTS): number {
  const deltaD = -w[6] * (rating - 3);
  const rawD = currentD + deltaD;
  const meanReversionTarget = initialDifficulty(Rating.Good, w);
  const dPrime = w[7] * meanReversionTarget + (1 - w[7]) * rawD;
  return clamp(dPrime, 1.0, 10.0);
}

/**
 * Nova estabilidade após acerto (Hard, Good, Easy)
 */
function nextStabilityRecall(
  d: number,
  s: number,
  r: number,
  rating: Rating,
  w = DEFAULT_FSRS_WEIGHTS
): number {
  const hardPenalty = rating === Rating.Hard ? w[15] : 1.0;
  const easyBonus = rating === Rating.Easy ? w[16] : 1.0;

  const gain =
    Math.exp(w[8]) *
    (11 - d) *
    Math.pow(s, -w[9]) *
    (Math.exp(w[10] * (1 - r)) - 1) *
    hardPenalty *
    easyBonus;

  return Math.max(s, s * (1 + gain));
}

/**
 * Nova estabilidade após esquecimento (Again)
 */
function nextStabilityForget(
  d: number,
  s: number,
  r: number,
  w = DEFAULT_FSRS_WEIGHTS
): number {
  const sForget =
    w[11] *
    Math.pow(d, -w[12]) *
    (Math.pow(s + 1, w[13]) - 1) *
    Math.exp(w[14] * (1 - r));

  return clamp(sForget, 0.2, s);
}

/**
 * Agenda a próxima revisão de um cartão com o algoritmo FSRS Concursos 2.0
 */
export function scheduleFSRSCard(
  card: FSRSCard | undefined,
  cardId: string,
  rating: Rating,
  desiredRetention = 0.90,
  maxIntervalDays = 90,
  now = new Date()
): FSRSCard {
  const weights = DEFAULT_FSRS_WEIGHTS;
  const nowIso = now.toISOString();
  const currentState = card?.state ?? CardState.New;

  // CASO 1: Cartão Novo (New) ou Primeira Repetição
  if (!card || currentState === CardState.New || card.reps === 0) {
    const d = initialDifficulty(rating, weights);
    let s = initialStability(rating, weights);

    let nextState: CardState;
    let intervalDays = 0;
    const nextDate = new Date(now.getTime());

    if (rating === Rating.Again) {
      // Errou na 1ª vez: entra em Aprendizagem e reaparece na mesma sessão (10m) ou amanhã
      nextState = CardState.Learning;
      intervalDays = 0;
      nextDate.setMinutes(nextDate.getMinutes() + 10);
    } else if (rating === Rating.Hard) {
      // Hesitou: entra em Aprendizagem com passo de 1 a 2 dias
      nextState = CardState.Learning;
      intervalDays = 1;
      nextDate.setDate(nextDate.getDate() + 1);
    } else if (rating === Rating.Good) {
      // Lembrou bem: gradua para Revisão com intervalo de 3 a 4 dias
      nextState = CardState.Review;
      intervalDays = Math.min(3, maxIntervalDays);
      nextDate.setDate(nextDate.getDate() + intervalDays);
    } else {
      // Fácil / Pleno: gradua para Revisão com intervalo de 6 a 7 dias
      nextState = CardState.Review;
      s = Math.max(s, 6.0);
      intervalDays = Math.min(6, maxIntervalDays);
      nextDate.setDate(nextDate.getDate() + intervalDays);
    }

    return {
      id: cardId,
      difficulty: Number(d.toFixed(2)),
      stability: Number(s.toFixed(2)),
      reps: 1,
      lapses: rating === Rating.Again ? 1 : 0,
      state: nextState,
      flag: card?.flag || null,
      lastReview: nowIso,
      nextReview: nextDate.toISOString(),
      dueInterval: intervalDays,
      history: [
        ...(card?.history || []),
        { date: nowIso, rating, difficulty: Number(d.toFixed(2)), stability: Number(s.toFixed(2)), state: nextState },
      ],
    };
  }

  // CASO 2: Cartão em Aprendizagem / Reaprendizagem
  if (currentState === CardState.Learning || currentState === CardState.Relearning) {
    let newD = nextDifficulty(card.difficulty, rating, weights);
    let newS = card.stability;
    let nextState: CardState = currentState;
    let intervalDays = 1;
    const nextDate = new Date(now.getTime());
    let lapses = card.lapses;

    if (rating === Rating.Again) {
      nextState = CardState.Relearning;
      lapses += 1;
      intervalDays = 0;
      nextDate.setMinutes(nextDate.getMinutes() + 10);
    } else if (rating === Rating.Hard) {
      nextState = CardState.Learning;
      intervalDays = 1;
      nextDate.setDate(nextDate.getDate() + 1);
      newS = Math.max(1.0, newS * 1.1);
    } else if (rating === Rating.Good) {
      // Gradua para Revisão
      nextState = CardState.Review;
      newS = Math.max(2.5, newS * 1.5);
      intervalDays = Math.min(3, maxIntervalDays);
      nextDate.setDate(nextDate.getDate() + intervalDays);
    } else {
      // Fácil: gradua para Revisão com salto seguro
      nextState = CardState.Review;
      newS = Math.max(5.0, newS * 2.0);
      intervalDays = Math.min(6, maxIntervalDays);
      nextDate.setDate(nextDate.getDate() + intervalDays);
    }

    return {
      id: cardId,
      difficulty: Number(newD.toFixed(2)),
      stability: Number(newS.toFixed(2)),
      reps: card.reps + 1,
      lapses,
      state: nextState,
      flag: card.flag || null,
      lastReview: nowIso,
      nextReview: nextDate.toISOString(),
      dueInterval: intervalDays,
      history: [
        ...(card.history || []),
        { date: nowIso, rating, difficulty: Number(newD.toFixed(2)), stability: Number(newS.toFixed(2)), state: nextState },
      ],
    };
  }

  // CASO 3: Cartão em Revisão (Review)
  const lastReviewDate = card.lastReview ? new Date(card.lastReview) : new Date(now.getTime() - 86400000);
  const elapsedDays = Math.max(0, (now.getTime() - lastReviewDate.getTime()) / (1000 * 60 * 60 * 24));
  const currentR = calculateRetrievability(elapsedDays, card.stability);

  let newD = nextDifficulty(card.difficulty, rating, weights);
  let newS: number;
  let nextState: CardState;
  let lapses = card.lapses;
  let intervalDays: number;
  const nextDate = new Date(now.getTime());

  if (rating === Rating.Again) {
    // Falha: entra em Reaprendizagem
    newS = nextStabilityForget(newD, card.stability, currentR, weights);
    nextState = CardState.Relearning;
    lapses += 1;
    intervalDays = 1; // Revisar amanhã obrigatoriamente
    nextDate.setDate(nextDate.getDate() + 1);
  } else {
    // Acerto (Hard, Good, Easy)
    newS = nextStabilityRecall(newD, card.stability, currentR, rating, weights);
    nextState = CardState.Review;
    const baseInterval = calculateInterval(newS, desiredRetention, maxIntervalDays);
    intervalDays = applyFuzzing(baseInterval, cardId);
    intervalDays = Math.min(intervalDays, maxIntervalDays);
    nextDate.setDate(nextDate.getDate() + intervalDays);
  }

  return {
    id: cardId,
    difficulty: Number(newD.toFixed(2)),
    stability: Number(newS.toFixed(2)),
    reps: card.reps + 1,
    lapses,
    state: nextState,
    flag: card.flag || null,
    lastReview: nowIso,
    nextReview: nextDate.toISOString(),
    dueInterval: intervalDays,
    history: [
      ...(card.history || []),
      { date: nowIso, rating, difficulty: Number(newD.toFixed(2)), stability: Number(newS.toFixed(2)), state: nextState },
    ],
  };
}

/**
 * Previsões de intervalo em tempo real para os 4 botões de classificação
 */
export function previewFSRSIntervals(
  card: FSRSCard | undefined,
  cardId: string,
  desiredRetention = 0.90,
  maxIntervalDays = 90,
  now = new Date()
): Record<Rating, { days: number; formatted: string }> {
  const result: Record<Rating, { days: number; formatted: string }> = {
    [Rating.Again]: { days: 0, formatted: '10m' },
    [Rating.Hard]: { days: 1, formatted: '1d' },
    [Rating.Good]: { days: 3, formatted: '3d' },
    [Rating.Easy]: { days: 6, formatted: '6d' },
  };

  const ratings = [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy];
  for (const r of ratings) {
    const projected = scheduleFSRSCard(card, cardId, r, desiredRetention, maxIntervalDays, now);
    const days = projected.dueInterval;
    result[r] = {
      days,
      formatted: formatIntervalString(days, projected.state, r === Rating.Again),
    };
  }

  return result;
}

/**
 * Formata o intervalo em texto amigável (ex: "10m", "1d", "3d", "2sem", "1m")
 */
export function formatIntervalString(days: number, _state?: CardState, isAgain = false): string {
  if (isAgain && days === 0) return '10m';
  if (days <= 0) return '10m';
  if (days === 1) return '1d';
  if (days < 7) return `${days}d`;
  if (days < 30) {
    const weeks = Math.round(days / 7);
    return `${days}d (${weeks}sem)`;
  }
  const months = (days / 30).toFixed(1).replace('.0', '');
  return `${months}m`;
}

/**
 * Migra dados do formato legado SM-2 ou FSRS antigo para FSRS Concursos 2.0
 */
export function migrateLegacySRS(rawStorage: any): FSRSData {
  if (!rawStorage || typeof rawStorage !== 'object') return {};
  const migrated: FSRSData = {};

  for (const [id, entry] of Object.entries(rawStorage)) {
    if (!entry || typeof entry !== 'object') continue;
    const legacy = entry as any;

    const state =
      legacy.state !== undefined
        ? (legacy.state as CardState)
        : legacy.reps && legacy.reps > 0
        ? CardState.Review
        : CardState.New;

    // Se já estiver no padrão FSRS
    if (typeof legacy.stability === 'number' && typeof legacy.difficulty === 'number') {
      migrated[id] = {
        ...legacy,
        state,
        flag: legacy.flag || null,
        dueInterval: legacy.dueInterval || Math.max(1, Math.round(legacy.stability)),
      };
      continue;
    }

    // Conversão do SM-2
    const oldInterval = Number(legacy.interval) || 1;
    const oldEase = Number(legacy.ease) || 2.5;
    const difficulty = clamp(10 - ((oldEase - 1.3) / 1.2) * 6, 1.0, 9.5);
    const stability = Math.max(1.0, oldInterval);

    migrated[id] = {
      id,
      difficulty: Number(difficulty.toFixed(2)),
      stability: Number(stability.toFixed(2)),
      reps: oldInterval > 1 ? 2 : 1,
      lapses: oldEase < 2.0 ? 1 : 0,
      state: oldInterval > 0 ? CardState.Review : CardState.New,
      flag: null,
      lastReview: legacy.nextReview
        ? new Date(new Date(legacy.nextReview).getTime() - oldInterval * 86400000).toISOString()
        : new Date().toISOString(),
      nextReview: legacy.nextReview || new Date().toISOString(),
      dueInterval: oldInterval,
      history: [],
    };
  }

  return migrated;
}

/**
 * Computa estatísticas detalhadas de memória da base de flashcards
 */
export function computeMemoryStats(
  allCardIds: string[],
  fsrsData: FSRSData,
  now = new Date()
) {
  const nowMs = now.getTime();
  let countNew = 0;
  let countLearning = 0;
  let countReview = 0;
  let countRelearning = 0;

  let dueToday = 0;
  let dueNext7Days = 0;
  let dueNext14Days = 0;
  let dueNext30Days = 0;

  let totalR = 0;
  let scoredCards = 0;

  const flagCounts: Record<string, number> = {
    red: 0,
    orange: 0,
    yellow: 0,
    green: 0,
    blue: 0,
    purple: 0,
    pink: 0,
  };

  allCardIds.forEach((id) => {
    const card = fsrsData[id];
    if (!card || card.state === CardState.New || card.reps === 0) {
      countNew++;
      dueToday++;
    } else {
      if (card.state === CardState.Learning) countLearning++;
      else if (card.state === CardState.Relearning) countRelearning++;
      else countReview++;

      if (card.flag && flagCounts[card.flag] !== undefined) {
        flagCounts[card.flag]++;
      }

      const nextReviewMs = new Date(card.nextReview).getTime();
      const diffDays = (nextReviewMs - nowMs) / (1000 * 60 * 60 * 24);

      if (diffDays <= 0) dueToday++;
      if (diffDays <= 7) dueNext7Days++;
      if (diffDays <= 14) dueNext14Days++;
      if (diffDays <= 30) dueNext30Days++;

      if (card.stability > 0 && card.lastReview) {
        const elapsed = (nowMs - new Date(card.lastReview).getTime()) / (1000 * 60 * 60 * 24);
        const r = calculateRetrievability(elapsed, card.stability);
        totalR += r;
        scoredCards++;
      }
    }
  });

  const avgRetrievability = scoredCards > 0 ? totalR / scoredCards : 1.0;

  return {
    totalCards: allCardIds.length,
    countNew,
    countLearning,
    countReview,
    countRelearning,
    dueToday,
    dueNext7Days,
    dueNext14Days,
    dueNext30Days,
    avgRetrievability: Math.round(avgRetrievability * 100),
    flagCounts,
  };
}
