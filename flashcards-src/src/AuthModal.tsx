import React, { useState, useEffect } from 'react';
import {
  Cloud,
  RefreshCw,
  LogOut,
  Mail,
  Lock,
  Download,
  CheckCircle,
  AlertCircle,
  X,
  ShieldCheck,
  Tablet,
  Laptop
} from 'lucide-react';
import { supabase, uploadAvaToCloud, downloadAvaFromCloud, type User } from './supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSyncComplete }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Verificar sessão atual
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setMessage({ type: 'error', text: 'Preencha o e-mail e a senha.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Login realizado! Baixando seus dados da nuvem...' });
      
      // Baixar dados da nuvem
      if (data.user) {
        await downloadAvaFromCloud(data.user);
      }

      if (onSyncComplete) onSyncComplete();

      setTimeout(() => {
        setMessage(null);
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Falha ao autenticar. Verifique seus dados.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setMessage({ type: 'error', text: 'Preencha o e-mail e a senha.' });
      return;
    }
    if (password.length < 6) {
      setMessage({ type: 'error', text: 'A senha deve ter no mínimo 6 caracteres.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Conta criada! Enviando seus dados atuais para a nuvem...' });

      // Enviar os dados locais atuais para a nova conta
      if (data.user) {
        await uploadAvaToCloud(data.user);
      }

      if (onSyncComplete) onSyncComplete();

      setTimeout(() => {
        setMessage(null);
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Falha ao criar conta.' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setCurrentUser(null);
      setMessage({ type: 'success', text: 'Desconectado da nuvem. Seus dados locais continuam seguros neste aparelho.' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportBackup = () => {
    try {
      const data = {
        delta_estudos: JSON.parse(localStorage.getItem('delta_estudos') || '[]'),
        atena_srs: JSON.parse(localStorage.getItem('atena_srs') || '{}'),
        atena_custom_cards: JSON.parse(localStorage.getItem('atena_custom_cards') || '[]'),
        atena_custom_decks: JSON.parse(localStorage.getItem('atena_custom_decks') || '[]'),
        atena_card_overrides: JSON.parse(localStorage.getItem('atena_card_overrides') || '{}'),
        atena_study_mode: localStorage.getItem('atena_study_mode') || 'pos-edital',
        backup_date: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_ava_delta_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Erro ao exportar backup:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-[#131929] border border-gray-200 dark:border-[rgba(255,255,255,0.1)] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden p-6 space-y-5">
        
        {/* Header do Modal */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-[rgba(255,255,255,0.08)] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#ff6b00]/10 flex items-center justify-center text-[#ff6b00] dark:text-[#ff8533]">
              <Cloud size={22} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900 dark:text-[#e8eaf0] font-display flex items-center gap-2">
                Sincronização em Nuvem
                {currentUser && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    🟢 Conectado
                  </span>
                )}
              </h3>
              <p className="text-xs text-gray-500 dark:text-[#9aa5bb]">
                Acesse seus flashcards e estudos no PC, Tablet e Celular
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-[#1a2235] transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mensagens de Alerta / Sucesso */}
        {message && (
          <div
            className={`p-3 rounded-2xl flex items-center gap-2.5 text-xs font-semibold ${
              message.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
            }`}
          >
            {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* CONTEÚDO QUANDO O USUÁRIO ESTÁ LOGADO */}
        {currentUser ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#0b0f1a] border border-gray-200 dark:border-[rgba(255,255,255,0.08)] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-[#9aa5bb]">
                    E-mail Conectado
                  </div>
                  <div className="text-xs font-bold text-gray-900 dark:text-[#e8eaf0] mt-0.5">
                    {currentUser.email}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="flex items-center gap-1 text-[11px] font-bold text-red-500 hover:text-red-600 transition cursor-pointer p-1.5 rounded-lg hover:bg-red-500/10"
                >
                  <LogOut size={13} />
                  Sair da Conta
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-[#9aa5bb] pt-2 border-t border-gray-200/50 dark:border-white/5 font-mono">
                <span>Status da Nuvem:</span>
                <span className="text-emerald-500 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
                  100% Sincronizado
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-start gap-2.5">
              <ShieldCheck size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
              <p className="text-[11.5px] text-gray-700 dark:text-[#9aa5bb] leading-relaxed">
                <strong className="text-gray-900 dark:text-[#e8eaf0]">Sincronização 100% Automática:</strong> Todas as sessões de estudo, flashcards e revisões feitas no seu PC, Tablet ou Celular são salvas e compartilhadas instantaneamente.
              </p>
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-gray-100 dark:border-[rgba(255,255,255,0.08)]">
              <button
                onClick={handleExportBackup}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-[#ff8533] flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download size={13} />
                Exportar Backup (.json)
              </button>

              <button
                onClick={onClose}
                className="px-5 py-2 bg-gray-100 dark:bg-[#1a2235] text-gray-700 dark:text-[#e8eaf0] rounded-xl font-bold text-xs hover:bg-gray-200 dark:hover:bg-[#232d46] transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        ) : (
          /* CONTEÚDO QUANDO NÃO ESTÁ LOGADO (FORMULÁRIO DE LOGIN / CADASTRO) */
          <div className="space-y-4">
            
            {/* Tabs de Seleção: Entrar ou Criar Conta */}
            <div className="flex bg-gray-100 dark:bg-[#0b0f1a] p-1 rounded-2xl border border-gray-200 dark:border-[rgba(255,255,255,0.08)]">
              <button
                type="button"
                onClick={() => { setTab('login'); setMessage(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                  tab === 'login'
                    ? 'bg-white dark:bg-[#131929] text-gray-900 dark:text-[#e8eaf0] shadow-sm'
                    : 'text-gray-500 dark:text-[#9aa5bb] hover:text-gray-700 dark:hover:text-white'
                }`}
              >
                Entrar na Conta
              </button>
              <button
                type="button"
                onClick={() => { setTab('signup'); setMessage(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                  tab === 'signup'
                    ? 'bg-white dark:bg-[#131929] text-gray-900 dark:text-[#e8eaf0] shadow-sm'
                    : 'text-gray-500 dark:text-[#9aa5bb] hover:text-gray-700 dark:hover:text-white'
                }`}
              >
                Criar Nova Conta
              </button>
            </div>

            <form onSubmit={tab === 'login' ? handleLogin : handleSignup} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold uppercase text-gray-400 dark:text-[#9aa5bb] tracking-wider">
                  E-mail
                </label>
                <div className="relative mt-1">
                  <Mail size={16} className="absolute left-3.5 top-3 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu-email@exemplo.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 dark:bg-[#0b0f1a] border border-gray-200 dark:border-[rgba(255,255,255,0.08)] rounded-xl text-xs font-semibold text-gray-900 dark:text-[#e8eaf0] focus:border-[#ff6b00] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-gray-400 dark:text-[#9aa5bb] tracking-wider">
                  Senha
                </label>
                <div className="relative mt-1">
                  <Lock size={16} className="absolute left-3.5 top-3 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha segura"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 dark:bg-[#0b0f1a] border border-gray-200 dark:border-[rgba(255,255,255,0.08)] rounded-xl text-xs font-semibold text-gray-900 dark:text-[#e8eaf0] focus:border-[#ff6b00] outline-none"
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#0b0f1a] border border-gray-200 dark:border-[rgba(255,255,255,0.08)] flex items-center gap-3">
                <div className="flex gap-1 text-[#ff6b00]">
                  <Laptop size={16} />
                  <Tablet size={16} />
                </div>
                <p className="text-[11px] text-gray-500 dark:text-[#9aa5bb] leading-relaxed">
                  {tab === 'login'
                    ? 'Ao entrar no Tablet, todos os seus flashcards e revisões feitas no PC serão baixados automaticamente.'
                    : 'Crie sua conta no Computador e seus dados atuais serão salvos na nuvem para acesso no Tablet.'}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#ff6b00] hover:bg-[#e65c00] text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    Processando...
                  </>
                ) : tab === 'login' ? (
                  'Entrar e Sincronizar'
                ) : (
                  'Criar Conta e Salvar na Nuvem'
                )}
              </button>
            </form>

            <div className="pt-2 flex justify-between items-center border-t border-gray-100 dark:border-[rgba(255,255,255,0.08)]">
              <button
                onClick={handleExportBackup}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-[#ff8533] flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download size={13} />
                Exportar Backup (.json)
              </button>

              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-500 dark:text-[#9aa5bb] font-bold text-xs hover:text-gray-800 dark:hover:text-white transition cursor-pointer"
              >
                Continuar Offline
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
