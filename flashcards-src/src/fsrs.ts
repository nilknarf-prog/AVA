/**
 * FSRS (Free Spaced Repetition Scheduler) Engine v4.5 / v5
 * Implementação pura em TypeScript para o ecossistema Atena (AVA Delta)
 * Baseado no modelo DSR (Difficulty, Stability, Retrievability)
 */

export enum Rating {
  Again = 1, // Errei / Esqueci
  Hard = 2,  // Difícil / Hesitei
  Good = 3,  // Bom / Correto
  Easy = 4,  // Fácil / Domínio Pleno
}

export enum CardState {
  New = 0,
  Learning = 1,
  Review = 2,
  Relearning = 3,
}

export interface FSRSCard {
  id: string;
  difficulty: number;  // D: 1 a 10
  stability: number;   // S: em dias
  reps: number;        // total de repetições
  lapses: number;      // total de esquecimentos
  state: CardState;    // estado atual
  lastReview?: string; // ISO date string
  nextReview: string;  // ISO date string
  dueInterval: number; // intervalo atual em dias
  history?: Array<{
    date: string;
    rating: Rating;
    difficulty: number;
    stability: number;
  }>;
}

export type FSRSData = Record<string, FSRSCard>;

// Parâmetros padrão calibrados do FSRS v4.5 / v5
export const DEFAULT_FSRS_WEIGHTS = [
  0.40255, 1.18385, 3.173, 15.69105, // w0-w3: Estabilidade inicial para Again, Hard, Good, Easy
  7.1949, 0.5345,                    // w4-w5: Parâmetros de dificuldade inicial
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
 * @param elapsedDays Dias decorridos desde a última revisão
 * @param stability Estabilidade da memória em dias
 */
export function calculateRetrievability(elapsedDays: number, stability: number): number {
  if (stability <= 0) return 0;
  if (elapsedDays <= 0) return 1.0;
  return Math.pow(1 + FACTOR * (elapsedDays / stability), DECAY);
}

/**
 * Calcula o próximo intervalo (em dias) necessário para manter a Retenção Desejada
 * @param stability Estabilidade resultante
 * @param desiredRetention Meta de retenção (ex: 0.90 para 90%)
 */
export function calculateInterval(stability: number, desiredRetention = 0.90): number {
  if (stability <= 0) return 1;
  const targetR = clamp(desiredRetention, 0.70, 0.97);
  // Interval = (Stability / FACTOR) * (R^(1/DECAY) - 1)
  const power = 1 / DECAY; // -2.0
  const ratio = Math.pow(targetR, power) - 1;
  const interval = (stability / FACTOR) * ratio;
  return Math.max(1, Math.round(interval));
}

/**
 * Calcula a Dificuldade Inicial (D0) para um cartão novo
 */
function initialDifficulty(rating: Rating, w = DEFAULT_FSRS_WEIGHTS): number {
  const d0 = w[4] - Math.exp(w[5] * (rating - 1)) + 1;
  return clamp(d0, 1.0, 10.0);
}

/**
 * Calcula a Estabilidade Inicial (S0) para um cartão novo
 */
function initialStability(rating: Rating, w = DEFAULT_FSRS_WEIGHTS): number {
  const s0 = w[rating - 1];
  return Math.max(0.1, s0);
}

/**
 * Atualiza a Dificuldade (D) com base na resposta e regressão à média
 */
function nextDifficulty(currentD: number, rating: Rating, w = DEFAULT_FSRS_WEIGHTS): number {
  const deltaD = -w[6] * (rating - 3);
  const rawD = currentD + deltaD;
  const meanReversionTarget = initialDifficulty(Rating.Good, w);
  const dPrime = w[7] * meanReversionTarget + (1 - w[7]) * rawD;
  return clamp(dPrime, 1.0, 10.0);
}

/**
 * Calcula a nova Estabilidade após um acerto (Hard, Good ou Easy)
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
  
  const gain = Math.exp(w[8]) *
    (11 - d) *
    Math.pow(s, -w[9]) *
    (Math.exp(w[10] * (1 - r)) - 1) *
    hardPenalty *
    easyBonus;

  return Math.max(s, s * (1 + gain));
}

/**
 * Calcula a nova Estabilidade após uma falha (Again)
 */
function nextStabilityForget(
  d: number,
  s: number,
  r: number,
  w = DEFAULT_FSRS_WEIGHTS
): number {
  const sForget = w[11] *
    Math.pow(d, -w[12]) *
    (Math.pow(s + 1, w[13]) - 1) *
    Math.exp(w[14] * (1 - r));

  return clamp(sForget, 0.1, s);
}

/**
 * Agenda a próxima revisão de um cartão com o algoritmo FSRS completo
 */
export function scheduleFSRSCard(
  card: FSRSCard | undefined,
  cardId: string,
  rating: Rating,
  desiredRetention = 0.90,
  now = new Date()
): FSRSCard {
  const weights = DEFAULT_FSRS_WEIGHTS;
  const nowIso = now.toISOString();

  // Caso 1: Cartão Novo ou sem histórico FSRS
  if (!card || card.state === CardState.New || card.reps === 0) {
    const d = initialDifficulty(rating, weights);
    const s = initialStability(rating, weights);
    const interval = calculateInterval(s, desiredRetention);
    
    const nextDate = new Date(now.getTime());
    nextDate.setDate(nextDate.getDate() + (rating === Rating.Again ? 0 : interval));
    // Se errou na 1ª vez, programa para hoje/amanhã
    if (rating === Rating.Again) {
      nextDate.setHours(nextDate.getHours() + 1); // 1 hora ou mesmo dia
    }

    return {
      id: cardId,
      difficulty: Number(d.toFixed(2)),
      stability: Number(s.toFixed(2)),
      reps: 1,
      lapses: rating === Rating.Again ? 1 : 0,
      state: rating === Rating.Again ? CardState.Learning : CardState.Review,
      lastReview: nowIso,
      nextReview: nextDate.toISOString(),
      dueInterval: rating === Rating.Again ? 0 : interval,
      history: [
        ...(card?.history || []),
        { date: nowIso, rating, difficulty: Number(d.toFixed(2)), stability: Number(s.toFixed(2)) }
      ]
    };
  }

  // Caso 2: Cartão em Revisão / Aprendizado
  const lastReviewDate = card.lastReview ? new Date(card.lastReview) : new Date(now.getTime() - 86400000);
  const elapsedDays = Math.max(0, (now.getTime() - lastReviewDate.getTime()) / (1000 * 60 * 60 * 24));
  const currentR = calculateRetrievability(elapsedDays, card.stability);

  let newD = nextDifficulty(card.difficulty, rating, weights);
  let newS: number;
  let nextState: CardState;
  let lapses = card.lapses;

  if (rating === Rating.Again) {
    newS = nextStabilityForget(newD, card.stability, currentR, weights);
    nextState = CardState.Relearning;
    lapses += 1;
  } else {
    newS = nextStabilityRecall(newD, card.stability, currentR, rating, weights);
    nextState = CardState.Review;
  }

  const interval = calculateInterval(newS, desiredRetention);
  const nextDate = new Date(now.getTime());
  
  if (rating === Rating.Again) {
    nextDate.setDate(nextDate.getDate() + 1); // Repetir amanhã
  } else {
    nextDate.setDate(nextDate.getDate() + interval);
  }

  return {
    id: cardId,
    difficulty: Number(newD.toFixed(2)),
    stability: Number(newS.toFixed(2)),
    reps: card.reps + 1,
    lapses,
    state: nextState,
    lastReview: nowIso,
    nextReview: nextDate.toISOString(),
    dueInterval: rating === Rating.Again ? 1 : interval,
    history: [
      ...(card.history || []),
      { date: nowIso, rating, difficulty: Number(newD.toFixed(2)), stability: Number(newS.toFixed(2)) }
    ]
  };
}

/**
 * Retorna as previsões de intervalo para os 4 botões para exibição na UI
 */
export function previewFSRSIntervals(
  card: FSRSCard | undefined,
  cardId: string,
  desiredRetention = 0.90,
  now = new Date()
): Record<Rating, { days: number; formatted: string }> {
  const result: Record<Rating, { days: number; formatted: string }> = {
    [Rating.Again]: { days: 1, formatted: '1d' },
    [Rating.Hard]: { days: 2, formatted: '2d' },
    [Rating.Good]: { days: 4, formatted: '4d' },
    [Rating.Easy]: { days: 7, formatted: '7d' },
  };

  const ratings = [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy];
  for (const r of ratings) {
    const projected = scheduleFSRSCard(card, cardId, r, desiredRetention, now);
    const days = projected.dueInterval;
    result[r] = {
      days,
      formatted: formatIntervalString(days, r === Rating.Again)
    };
  }

  return result;
}

/**
 * Formata o intervalo em texto amigável (ex: "1d", "3d", "2m", "1a")
 */
export function formatIntervalString(days: number, isAgain = false): string {
  if (isAgain || days <= 0) return '1d';
  if (days === 1) return '1d';
  if (days < 30) return `${days}d`;
  if (days < 365) {
    const months = Math.round(days / 30);
    return `${months}m`;
  }
  const years = (days / 365).toFixed(1).replace('.0', '');
  return `${years}a`;
}

/**
 * Migra dados do formato legado SM-2 ({ interval, ease, nextReview }) para FSRS
 */
export function migrateLegacySRS(rawStorage: any): FSRSData {
  if (!rawStorage || typeof rawStorage !== 'object') return {};
  const migrated: FSRSData = {};

  for (const [id, entry] of Object.entries(rawStorage)) {
    if (!entry || typeof entry !== 'object') continue;
    const legacy = entry as any;

    // Se já estiver no padrão FSRS (possui stability e difficulty)
    if (typeof legacy.stability === 'number' && typeof legacy.difficulty === 'number') {
      migrated[id] = legacy as FSRSCard;
      continue;
    }

    // Conversão do SM-2 para FSRS aproximado
    const oldInterval = Number(legacy.interval) || 1;
    const oldEase = Number(legacy.ease) || 2.5;
    
    // Mapear facilidade do SM-2 (1.3 a 2.5) para Dificuldade FSRS (1 a 10 invertido)
    // Ease 2.5 -> Dificuldade ~4.5 | Ease 1.3 -> Dificuldade ~8.5
    const difficulty = clamp(10 - ((oldEase - 1.3) / 1.2) * 6, 1.0, 9.5);
    const stability = Math.max(1.0, oldInterval);

    migrated[id] = {
      id,
      difficulty: Number(difficulty.toFixed(2)),
      stability: Number(stability.toFixed(2)),
      reps: oldInterval > 1 ? 2 : 1,
      lapses: oldEase < 2.0 ? 1 : 0,
      state: oldInterval > 0 ? CardState.Review : CardState.New,
      lastReview: legacy.nextReview ? new Date(new Date(legacy.nextReview).getTime() - oldInterval * 86400000).toISOString() : new Date().toISOString(),
      nextReview: legacy.nextReview || new Date().toISOString(),
      dueInterval: oldInterval,
      history: []
    };
  }

  return migrated;
}
