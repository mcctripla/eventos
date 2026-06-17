import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { Lock, Mail, AlertCircle, ArrowRight, X, User } from 'lucide-react';

export function Auth({ onAuthSuccess }: { onAuthSuccess: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const cleanEmail = email.toLowerCase().trim();
        if (!cleanEmail.endsWith('@tripla.com.br')) {
          setError('Apenas endereços de e-mail @tripla.com.br são permitidos para cadastro.');
          setLoading(false);
          return;
        }
        if (!nome.trim()) {
          setError('O preenchimento do campo Nome Completo é obrigatório para cadastro.');
          setLoading(false);
          return;
        }

        // Search for an existing user document with this email
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', cleanEmail));
        const querySnapshot = await getDocs(q);

        let initialRole = 'pending';
        let existingDocId = null;

        if (!querySnapshot.empty) {
          const docData = querySnapshot.docs[0].data();
          initialRole = docData.role || 'pending';
          existingDocId = querySnapshot.docs[0].id;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        const user = userCredential.user;

        // Create user document in Firestore 'users' collection using user's uid
        await setDoc(doc(db, 'users', user.uid), {
          nome: nome.trim(),
          email: cleanEmail,
          role: initialRole,
          createdAt: new Date().toISOString()
        });

        // Clean up the temporary pre-created document if it has a different ID
        try {
          if (existingDocId && existingDocId !== user.uid) {
            await deleteDoc(doc(db, 'users', existingDocId));
          }
        } catch (delErr) {
          console.warn("Failed to delete temp pre-created document:", delErr);
        }
      }
      onAuthSuccess();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') {
        setError('E-mail ou senha incorretos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está em uso.');
      } else if (err.code === 'auth/weak-password') {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Erro de rede: Verifique sua conexão e se há bloqueadores de anúncios (AdBlock) ativos. Confirme se o domínio está autorizado no Firebase.');
      } else {
        setError('Ocorreu um erro na autenticação. Verifique os códigos no console.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-indigo-500/30">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-14 w-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Lock className="text-white h-7 w-7" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {isLogin ? 'Bem-vindo de volta' : 'Criar nova conta'}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-zinc-400">
          Acesse o Hub do Calendário Estratégico
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-zinc-900 py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-slate-200 dark:border-white/5">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm font-medium rounded-xl flex items-start gap-2 border border-red-200 dark:border-red-900/30">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}
            
            {!isLogin && (
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300">
                  Nome completo
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400 dark:text-zinc-500" />
                  </div>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 py-3 sm:text-sm border-slate-300 dark:border-white/10 rounded-xl dark:bg-zinc-950 dark:text-white transition-colors"
                    placeholder="Seu Nome Completo"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300">
                Endereço de e-mail
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400 dark:text-zinc-500" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 py-3 sm:text-sm border-slate-300 dark:border-white/10 rounded-xl dark:bg-zinc-950 dark:text-white transition-colors"
                  placeholder="seu@email.com.br"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300">
                Senha
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 dark:text-zinc-500" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 py-3 sm:text-sm border-slate-300 dark:border-white/10 rounded-xl dark:bg-zinc-950 dark:text-white transition-colors"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900 dark:text-zinc-300 select-none">
                  Lembrar de mim
                </label>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Aguarde...' : (isLogin ? 'Entrar' : 'Criar conta')}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-white/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-zinc-900 text-slate-500 dark:text-zinc-400">
                  Ou
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                  setNome('');
                }}
                className="w-full inline-flex justify-center py-2.5 px-4 border border-slate-300 dark:border-white/10 rounded-xl shadow-sm bg-white dark:bg-zinc-950 text-sm font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors"
              >
                {isLogin ? 'Ainda não tem conta? Registre-se' : 'Já tem conta? Faça login'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
