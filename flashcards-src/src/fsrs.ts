/**
 * FSRS (Free Spaced Repetition Scheduler) Concursos Engine v3.0 Neuro-Cognitivo (FSRS-NC 3.0)
 * Implementação neuro-calibrada para o ecossistema Atena (AVA Delta)
 * Baseado no modelo DSR com:
 *  - Medição de Latência de Resposta (Response Time & Retrieval Fluency)
 *  - Bônus de Fluência Cognitiva (CFI Multiplier para respostas rápidas de 1 a 6s)
 *  - Níveis de Domínio (Mastery Tiers: Aquisição, Consolidado e Mestre 💎)
 *  - Balanceador Inteligente de Carga Diária (Daily Review Load Balancer)
 *  - Horizon Capping dinâmico por modo de estudo (Pós-Edital 21d / Pré-Edital até 120d)
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

export enum MasteryTier {
  Acquisition = 1,  // 🥉 Tier 1: Em Aquisição / Instável (Reps 0-2 ou S < 10d)
  Consolidated = 2, // 🥈 Tier 2: Consolidado (Reps 3-5, S 10-25d)
  Mastered = 3,     // 🥇 Tier 3: Dominado / Mestre 💎 (Reps >= 6, S >= 25d, Consecutivos >= 4, Tempo < 7s)
}

export enum StudyMode {
  Normal = 'normal',         // Modo Tradicional / Pré-Edital (Base sólida, máx 90-120 dias)
  PosEdital = 'pos_edital',   // Modo Reta Final / Pós-Edital (Alta retenção, máx 21 dias)
  Gargalos = 'gargalos',     // Modo Gargalos & Falhas (Foco em erros e bandeiras de urgência)
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
    description: 'Espaçamento equilibrado para consolidação de longo prazo com teto máximo de 90 a 120 dias para cartões dominados.',
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

export interface ReviewHistoryEntry {
  date: string;
  rating: Rating;
  latencyMs?: number;
  difficulty: number;
  stability: number;
  state: CardState;
}

export interface FSRSCard {
  id: string;
  difficulty: number;          // D: 1 a 10
  stability: number;           // S: em dias
  reps: number;                // total de repetições
  lapses: number;              // total de esquecimentos
  state: CardState;            // estado atual (New, Learning, Review, Relearning)
  flag?: FlagColor | null;
  lastReview?: string;         // ISO date string
  nextReview: string;          // ISO date string
  dueInterval: number;         // intervalo atual em dias
  avgLatencyMs?: number;       // tempo médio de resposta em milissegundos
  consecutiveCorrect?: number; // acertos consecutivos sem lapse
  masteryTier?: MasteryTier;   // 1, 2 ou 3
  history?: ReviewHistoryEntry[];
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
 * Calcula o multiplicador de Fluência Cognitiva baseado no tempo de resposta em milissegundos
 */
export function calculateFluencyMultiplier(latencyMs?: number, rating?: Rating): number {
  if (!latencyMs || latencyMs < 1000) return 1.0;
  const seconds = Math.min(latencyMs / 1000, 45.0); // Clamp a 45s para evitar punição de distração externa

  // Zona de Alta Fluência (Sistema 1 - Kahneman: 1s a 6s)
  if (seconds <= 6.0 && (rating === Rating.Good || rating === Rating.Easy)) {
    // Resposta em 2s gera +40% de bônus; resposta em 5s gera +10% de bônus
    const bonus = Math.min(0.40, Math.max(0, (6.0 - seconds) / 10.0));
    return 1.0 + bonus;
  }

  // Zona de Hesitação / Esforço Elevado (> 18s)
  if (seconds > 18.0) {
    const penalty = Math.min(0.20, (seconds - 18.0) / 60.0);
    return Math.max(0.80, 1.0 - penalty);
  }

  return 1.0;
}

/**
 * Calcula o Nível de Domínio Cognitivo do Cartão
 */
export function calculateMasteryTier(
  stability: number,
  consecutiveCorrect: number,
  avgLatencyMs?: number
): MasteryTier {
  // Dominado / Mestre (Tier 3): estabilidade >= 25 dias, pelo menos 4 acertos consecutivos e tempo ágil (< 7s)
  const isFast = !avgLatencyMs || avgLatencyMs <= 7000;
  if (stability >= 25 && consecutiveCorrect >= 4 && isFast) {
    return MasteryTier.Mastered;
  }
  // Consolidado (Tier 2): estabilidade >= 10 dias e pelo menos 2 acertos consecutivos
  if (stability >= 10 && consecutiveCorrect >= 2) {
    return MasteryTier.Consolidated;
  }
  return MasteryTier.Acquisition;
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
 * Calcula o próximo intervalo em dias com limite máximo de horizonte
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

  return Math.min(clampedInterval, maxIntervalDays);
}

/**
 * Adiciona leve variação (fuzzing) em intervalos médios/longos para evitar acúmulo no mesmo dia
 */
export function applyFuzzing(intervalDays: number, cardId: string): number {
  if (intervalDays <= 4) return intervalDays;
  let hash = 0;
  for (let i = 0; i < cardId.length; i++) {
    hash = (hash << 5) - hash + cardId.charCodeAt(i);
    hash |= 0;
  }
  const deltaFactor = ((Math.abs(hash) % 11) - 5) / 100; // -5% a +5%
  const fuzzed = Math.round(intervalDays * (1 + deltaFactor));
  return Math.max(1, fuzzed);
}

/**
 * Balanceador de Carga Diária: suaviza picos de revisão alocando para dias vizinhos
 */
export function balanceReviewDate(
  targetDate: Date,
  allCardsFsrs: FSRSData | undefined,
  maxDailyCapacity = 35
): Date {
  if (!allCardsFsrs) return targetDate;

  const loadByDay: Record<string, number> = {};
  const targetKey = targetDate.toISOString().split('T')[0];

  for (const c of Object.values(allCardsFsrs)) {
    if (!c.nextReview) continue;
    const dayKey = c.nextReview.split('T')[0];
    loadByDay[dayKey] = (loadByDay[dayKey] || 0) + 1;
  }

  const currentLoad = loadByDay[targetKey] || 0;
  if (currentLoad < maxDailyCapacity) {
    return targetDate;
  }

  // Procurar o dia vizinho mais leve (+1, -1, +2, -2)
  let bestDate = targetDate;
  let minLoad = currentLoad;

  for (const offset of [1, -1, 2, -2]) {
    const candidate = new Date(targetDate.getTime() + offset * 86400000);
    // Não antecipar para o passado ou hoje
    if (candidate.getTime() <= Date.now() + 12 * 3600 * 1000) continue;

    const candKey = candidate.toISOString().split('T')[0];
    const candLoad = loadByDay[candKey] || 0;

    if (candLoad < minLoad) {
      minLoad = candLoad;
      bestDate = candidate;
    }
  }

  return bestDate;
}

// -------------------------------------------------------------
// FÓRMULAS INTERNAS DO FSRS v4.5 / v5
// -------------------------------------------------------------

function initialStability(r: Rating, w: number[]): number {
  return Math.max(w[r - 1], 0.1);
}

function initialDifficulty(r: Rating, w: number[]): number {
  const d = w[4] - Math.exp(w[5] * (r - 1)) + 1;
  return clamp(d, 1.0, 10.0);
}

function nextDifficulty(d: number, r: Rating, w: number[]): number {
  const nextD = d - w[6] * (r - 3);
  const meanReversion = w[7] * initialDifficulty(Rating.Good, w) + (1 - w[7]) * nextD;
  return clamp(meanReversion, 1.0, 10.0);
}

function nextStabilityRecall(
  d: number,
  s: number,
  r: number,
  rating: Rating,
  w: number[]
): number {
  const hardPenalty = rating === Rating.Hard ? w[15] : 1.0;
  const easyBonus = rating === Rating.Easy ? w[16] : 1.0;
  const newS =
    s *
    (1 +
      Math.exp(w[8]) *
        (11 - d) *
        Math.pow(s, -w[9]) *
        (Math.exp((1 - r) * w[10]) - 1) *
        hardPenalty *
        easyBonus);
  return Math.max(newS, 0.1);
}

function nextStabilityForget(d: number, s: number, r: number, w: number[]): number {
  const newS =
    w[11] *
    Math.pow(d, -w[12]) *
    (Math.pow(s + 1, w[13]) - 1) *
    Math.exp((1 - r) * w[14]);
  return clamp(newS, 0.1, s);
}

// -------------------------------------------------------------
// MOTOR PRINCIPAL DE AGENDAMENTO (FSRS-NC 3.0)
// -------------------------------------------------------------

/**
 * Agenda o próximo intervalo do flashcard incorporando tempo de resposta e fluência cognitiva
 */
export function scheduleFSRSCard(
  card: FSRSCard | undefined,
  cardId: string,
  rating: Rating,
  desiredRetention = 0.90,
  maxIntervalDays = 90,
  now = new Date(),
  latencyMs?: number,
  allFsrsData?: FSRSData
): FSRSCard {
  const weights = DEFAULT_FSRS_WEIGHTS;
  const nowIso = now.toISOString();
  const currentState = card?.state ?? CardState.New;

  // 1. Calcular métricas de latência e sequência
  const prevAvg = card?.avgLatencyMs;
  const newAvgLatency = latencyMs && latencyMs >= 1000
    ? prevAvg ? Math.round(prevAvg * 0.65 + latencyMs * 0.35) : latencyMs
    : prevAvg;

  const prevStreak = card?.consecutiveCorrect || 0;
  const consecutiveCorrect = rating === Rating.Again ? 0 : prevStreak + 1;

  // 2. Bônus de Fluência Cognitiva (CFI)
  const fluencyMult = calculateFluencyMultiplier(latencyMs, rating);
  const streakBonus = Math.min(0.40, consecutiveCorrect * 0.08); // até +40% por sequência limpa

  // CASO 1: Cartão Novo (New) ou Primeira Repetição
  if (!card || currentState === CardState.New || card.reps === 0) {
    let d = initialDifficulty(rating, weights);
    let s = initialStability(rating, weights);

    if (rating === Rating.Easy) {
      s = Math.max(s, 6.0) * fluencyMult;
      d = Math.max(1.0, d - 1.5);
    } else if (rating === Rating.Good) {
      s = s * fluencyMult;
    }

    let nextState: CardState;
    let intervalDays = 0;
    let nextDate = new Date(now.getTime());

    if (rating === Rating.Again) {
      nextState = CardState.Learning;
      intervalDays = 0;
      nextDate.setMinutes(nextDate.getMinutes() + 10);
    } else if (rating === Rating.Hard) {
      nextState = CardState.Learning;
      intervalDays = 1;
      nextDate.setDate(nextDate.getDate() + 1);
    } else if (rating === Rating.Good) {
      nextState = CardState.Review;
      intervalDays = Math.min(Math.round(3 * fluencyMult), maxIntervalDays);
      nextDate.setDate(nextDate.getDate() + intervalDays);
    } else {
      // Fácil: salto seguro calibrado
      nextState = CardState.Review;
      intervalDays = Math.min(Math.round(6 * fluencyMult), maxIntervalDays);
      nextDate.setDate(nextDate.getDate() + intervalDays);
    }

    if (intervalDays > 1) {
      nextDate = balanceReviewDate(nextDate, allFsrsData);
    }

    const masteryTier = calculateMasteryTier(s, consecutiveCorrect, newAvgLatency);

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
      avgLatencyMs: newAvgLatency,
      consecutiveCorrect,
      masteryTier,
      history: [
        ...(card?.history || []),
        { date: nowIso, rating, latencyMs, difficulty: Number(d.toFixed(2)), stability: Number(s.toFixed(2)), state: nextState },
      ],
    };
  }

  // CASO 2: Cartão em Aprendizagem / Reaprendizagem
  if (currentState === CardState.Learning || currentState === CardState.Relearning) {
    let newD = nextDifficulty(card.difficulty, rating, weights);
    let newS = card.stability;
    let nextState: CardState = currentState;
    let intervalDays = 1;
    let nextDate = new Date(now.getTime());
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
      nextState = CardState.Review;
      newS = Math.max(2.5, newS * 1.5 * fluencyMult);
      intervalDays = Math.min(Math.round(3 * fluencyMult), maxIntervalDays);
      nextDate.setDate(nextDate.getDate() + intervalDays);
    } else {
      // Fácil: gradua para Revisão com aceleração
      nextState = CardState.Review;
      newS = Math.max(6.0, newS * 2.2 * fluencyMult);
      newD = Math.max(1.0, newD - 1.2);
      intervalDays = Math.min(Math.round(7 * fluencyMult), maxIntervalDays);
      nextDate.setDate(nextDate.getDate() + intervalDays);
    }

    if (intervalDays > 1) {
      nextDate = balanceReviewDate(nextDate, allFsrsData);
    }

    const masteryTier = calculateMasteryTier(newS, consecutiveCorrect, newAvgLatency);

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
      avgLatencyMs: newAvgLatency,
      consecutiveCorrect,
      masteryTier,
      history: [
        ...(card.history || []),
        { date: nowIso, rating, latencyMs, difficulty: Number(newD.toFixed(2)), stability: Number(newS.toFixed(2)), state: nextState },
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
  let nextDate = new Date(now.getTime());

  if (rating === Rating.Again) {
    // Falha: entra em Reaprendizagem
    newS = nextStabilityForget(newD, card.stability, currentR, weights);
    nextState = CardState.Relearning;
    lapses += 1;
    intervalDays = 1;
    nextDate.setDate(nextDate.getDate() + 1);
  } else {
    // Acerto (Hard, Good, Easy) com Aceleração de Estabilidade & Fluência
    const rawS = nextStabilityRecall(newD, card.stability, currentR, rating, weights);
    newS = rawS * fluencyMult * (1.0 + streakBonus);

    if (rating === Rating.Easy) {
      newD = Math.max(1.0, newD - 1.0);
    }

    nextState = CardState.Review;

    // Se o cartão for Dominado no Pré-Edital, o teto expande até 120 dias
    const dynamicMaxDays =
      maxIntervalDays >= 90 && consecutiveCorrect >= 4
        ? Math.min(120, maxIntervalDays * 1.3)
        : maxIntervalDays;

    const baseInterval = calculateInterval(newS, desiredRetention, dynamicMaxDays);
    intervalDays = applyFuzzing(baseInterval, cardId);
    intervalDays = Math.min(intervalDays, dynamicMaxDays);
    nextDate.setDate(nextDate.getDate() + intervalDays);
    nextDate = balanceReviewDate(nextDate, allFsrsData);
  }

  const masteryTier = calculateMasteryTier(newS, consecutiveCorrect, newAvgLatency);

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
    avgLatencyMs: newAvgLatency,
    consecutiveCorrect,
    masteryTier,
    history: [
      ...(card.history || []),
      { date: nowIso, rating, latencyMs, difficulty: Number(newD.toFixed(2)), stability: Number(newS.toFixed(2)), state: nextState },
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
  now = new Date(),
  latencyMs?: number
): Record<Rating, { days: number; formatted: string }> {
  const result: Record<Rating, { days: number; formatted: string }> = {
    [Rating.Again]: { days: 0, formatted: '10m' },
    [Rating.Hard]: { days: 1, formatted: '1d' },
    [Rating.Good]: { days: 3, formatted: '3d' },
    [Rating.Easy]: { days: 6, formatted: '6d' },
  };

  const ratings = [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy];
  for (const r of ratings) {
    const projected = scheduleFSRSCard(card, cardId, r, desiredRetention, maxIntervalDays, now, latencyMs);
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
 * Migra dados do formato legado SM-2 ou FSRS antigo para FSRS-NC 3.0
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
      const stability = legacy.stability;
      const consecutiveCorrect = legacy.consecutiveCorrect || (legacy.reps > 0 && legacy.lapses === 0 ? legacy.reps : 1);
      const masteryTier = legacy.masteryTier || calculateMasteryTier(stability, consecutiveCorrect, legacy.avgLatencyMs);

      migrated[id] = {
        ...legacy,
        state,
        flag: legacy.flag || null,
        dueInterval: legacy.dueInterval || Math.max(1, Math.round(stability)),
        consecutiveCorrect,
        masteryTier,
      };
      continue;
    }

    // Conversão do SM-2
    const oldInterval = Number(legacy.interval) || 1;
    const oldEase = Number(legacy.ease) || 2.5;
    const difficulty = clamp(10 - ((oldEase - 1.3) / 1.2) * 6, 1.0, 9.5);
    const stability = Math.max(1.0, oldInterval);
    const consecutiveCorrect = oldInterval > 1 ? 2 : 1;
    const masteryTier = calculateMasteryTier(stability, consecutiveCorrect);

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
      consecutiveCorrect,
      masteryTier,
      history: [],
    };
  }

  return migrated;
}

/**
 * Computa estatísticas cognitivas detalhadas da memória
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

  let countTier1 = 0;
  let countTier2 = 0;
  let countTier3 = 0;

  let dueToday = 0;
  let dueNext7Days = 0;
  let dueNext14Days = 0;
  let dueNext30Days = 0;

  let totalR = 0;
  let scoredCards = 0;
  let totalLatencySum = 0;
  let latencyCardsCount = 0;

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
      countTier1++;
      dueToday++;
    } else {
      if (card.state === CardState.Learning) countLearning++;
      else if (card.state === CardState.Relearning) countRelearning++;
      else countReview++;

      const tier = card.masteryTier || calculateMasteryTier(card.stability, card.consecutiveCorrect || 0, card.avgLatencyMs);
      if (tier === MasteryTier.Mastered) countTier3++;
      else if (tier === MasteryTier.Consolidated) countTier2++;
      else countTier1++;

      if (card.avgLatencyMs && card.avgLatencyMs > 0) {
        totalLatencySum += card.avgLatencyMs;
        latencyCardsCount++;
      }

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
  const avgLatencySec = latencyCardsCount > 0 ? Number((totalLatencySum / latencyCardsCount / 1000).toFixed(1)) : 0;

  return {
    totalCards: allCardIds.length,
    countNew,
    countLearning,
    countReview,
    countRelearning,
    countTier1,
    countTier2,
    countTier3, // Dominados 💎
    dueToday,
    dueNext7Days,
    dueNext14Days,
    dueNext30Days,
    avgRetrievability: Math.round(avgRetrievability * 100),
    avgLatencySec,
    flagCounts,
  };
}
