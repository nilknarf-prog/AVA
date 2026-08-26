import { createClient, type User } from '@supabase/supabase-js';
export type { User };

export const SUPABASE_URL = 'https://nhwarucfecoqcahcosga.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od2FydWNmZWNvcWNhaGNvc2dhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4OTk0MDUsImV4cCI6MjA5NTQ3NTQwNX0.7PTvXgI5ea5WSS89MfHpn-ZSMsv3ztOC64Ogin6Y3qU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export interface AvaSyncPayload {
  version: number;
  updatedAt: number;
  estudos: any[];
  fsrs: Record<string, any>;
  customCards: any[];
  customDecks: any[];
  cardOverrides: Record<string, any>;
  studyMode?: string;
  theme?: string;
}

/**
 * Coleta todos os dados locais do AVA para empacotamento
 */
export function getLocalAvaPayload(): AvaSyncPayload {
  let estudos = [];
  let fsrs = {};
  let customCards = [];
  let customDecks = [];
  let cardOverrides = {};
  let studyMode = 'pos-edital';
  let theme = 'dark';

  try { estudos = JSON.parse(localStorage.getItem('delta_estudos') || '[]'); } catch (e) {}
  try { fsrs = JSON.parse(localStorage.getItem('atena_srs') || '{}'); } catch (e) {}
  try { customCards = JSON.parse(localStorage.getItem('atena_custom_cards') || '[]'); } catch (e) {}
  try { customDecks = JSON.parse(localStorage.getItem('atena_custom_decks') || '[]'); } catch (e) {}
  try { cardOverrides = JSON.parse(localStorage.getItem('atena_card_overrides') || '{}'); } catch (e) {}
  try { studyMode = localStorage.getItem('atena_study_mode') || 'pos-edital'; } catch (e) {}
  try { theme = localStorage.getItem('delta-theme') || 'dark'; } catch (e) {}

  return {
    version: 2,
    updatedAt: Date.now(),
    estudos,
    fsrs,
    customCards,
    customDecks,
    cardOverrides,
    studyMode,
    theme,
  };
}

/**
 * Aplica um payload da nuvem no localStorage local de forma inteligente
 */
export function applyRemoteAvaPayload(remote: AvaSyncPayload): boolean {
  if (!remote) return false;

  try {
    if (Array.isArray(remote.estudos)) {
      // Mesclar logs de estudo por data, matéria e tempo evitando duplicatas exatas
      const localEstudos = JSON.parse(localStorage.getItem('delta_estudos') || '[]');
      const mergedMap = new Map();
      
      localEstudos.forEach((e: any) => {
        const key = `${e.date}_${e.mat}_${e.tempo}_${e.assunto || ''}`;
        mergedMap.set(key, e);
      });

      remote.estudos.forEach((e: any) => {
        const key = `${e.date}_${e.mat}_${e.tempo}_${e.assunto || ''}`;
        mergedMap.set(key, e);
      });

      const mergedList = Array.from(mergedMap.values()).sort((a: any, b: any) => (a.date > b.date ? 1 : -1));
      localStorage.setItem('delta_estudos', JSON.stringify(mergedList));
    }

    if (remote.fsrs && typeof remote.fsrs === 'object') {
      const localFsrs = JSON.parse(localStorage.getItem('atena_srs') || '{}');
      const mergedFsrs = { ...localFsrs };

      // Para cada cartão FSRS, manter o registro com mais repetições ou lastReview mais recente
      Object.keys(remote.fsrs).forEach((cardId) => {
        const rCard = remote.fsrs[cardId];
        const lCard = localFsrs[cardId];
        if (!lCard) {
          mergedFsrs[cardId] = rCard;
        } else {
          const rDate = rCard.lastReview ? new Date(rCard.lastReview).getTime() : 0;
          const lDate = lCard.lastReview ? new Date(lCard.lastReview).getTime() : 0;
          if (rDate >= lDate || (rCard.reps || 0) >= (lCard.reps || 0)) {
            mergedFsrs[cardId] = rCard;
          }
        }
      });
      localStorage.setItem('atena_srs', JSON.stringify(mergedFsrs));
    }

    if (Array.isArray(remote.customCards)) {
      const localCards = JSON.parse(localStorage.getItem('atena_custom_cards') || '[]');
      const cardMap = new Map();
      localCards.forEach((c: any) => cardMap.set(c.id, c));
      remote.customCards.forEach((c: any) => cardMap.set(c.id, c));
      localStorage.setItem('atena_custom_cards', JSON.stringify(Array.from(cardMap.values())));
    }

    if (Array.isArray(remote.customDecks)) {
      const localDecks = JSON.parse(localStorage.getItem('atena_custom_decks') || '[]');
      const deckMap = new Map();
      localDecks.forEach((d: any) => deckMap.set(d.id, d));
      remote.customDecks.forEach((d: any) => deckMap.set(d.id, d));
      localStorage.setItem('atena_custom_decks', JSON.stringify(Array.from(deckMap.values())));
    }

    if (remote.cardOverrides && typeof remote.cardOverrides === 'object') {
      const localOverrides = JSON.parse(localStorage.getItem('atena_card_overrides') || '{}');
      const mergedOverrides = { ...localOverrides, ...remote.cardOverrides };
      localStorage.setItem('atena_card_overrides', JSON.stringify(mergedOverrides));
    }

    if (remote.studyMode) {
      localStorage.setItem('atena_study_mode', remote.studyMode);
    }

    localStorage.setItem('delta_last_sync_timestamp', String(Date.now()));
    window.dispatchEvent(new Event('storage'));
    return true;
  } catch (e) {
    console.error('Erro ao aplicar payload remoto:', e);
    return false;
  }
}

/**
 * Envia o estado local atual para a nuvem do usuário autenticado
 */
export async function uploadAvaToCloud(user?: User | null): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = user || (await supabase.auth.getUser()).data.user;
    if (!currentUser) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    const payload = getLocalAvaPayload();

    const { error } = await supabase.auth.updateUser({
      data: {
        ava_sync_payload: payload,
        ava_last_synced: Date.now(),
      },
    });

    if (error) throw error;

    localStorage.setItem('delta_last_sync_timestamp', String(Date.now()));
    return { success: true };
  } catch (e: any) {
    console.error('Erro ao fazer upload para nuvem:', e);
    return { success: false, error: e.message || 'Falha ao sincronizar com a nuvem' };
  }
}

/**
 * Baixa os dados da nuvem do usuário e mescla localmente
 */
export async function downloadAvaFromCloud(user?: User | null): Promise<{ success: boolean; error?: string; applied?: boolean }> {
  try {
    const currentUser = user || (await supabase.auth.getUser()).data.user;
    if (!currentUser) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    const remotePayload = currentUser.user_metadata?.ava_sync_payload as AvaSyncPayload | undefined;
    if (!remotePayload) {
      // Se não há payload na nuvem ainda, faz o primeiro upload dos dados locais
      await uploadAvaToCloud(currentUser);
      return { success: true, applied: false };
    }

    const applied = applyRemoteAvaPayload(remotePayload);
    return { success: true, applied };
  } catch (e: any) {
    console.error('Erro ao baixar da nuvem:', e);
    return { success: false, error: e.message || 'Falha ao baixar dados da nuvem' };
  }
}
