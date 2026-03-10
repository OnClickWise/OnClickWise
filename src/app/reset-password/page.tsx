'use client';


import { Suspense, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Building2, Lock } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { resetPassword } from '@/services/authService';
import { useRouter, useSearchParams } from 'next/navigation';

function ResetPasswordContent() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!password || password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem');
      return;
    }
    setLoading(true);
    try {
      await resetPassword({ token, password });
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      setError(err.message || 'Erro ao redefinir senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground transition-colors">
      {/* LEFT */}
      <div className="w-full lg:w-1/2 flex justify-center px-4 py-10">
        <div className="w-full max-w-md">

          <div className="flex justify-center mb-6">
            <Logo width={160} height={0} />
          </div>

          <div className="bg-white rounded-xl shadow-xl p-6 sm:p-8">
            <h1 className="text-2xl font-bold text-center mb-2">
              Redefinir senha
            </h1>

            <p className="text-sm text-gray-600 text-center mb-6">
              Crie uma nova senha para acessar sua conta.
            </p>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm font-medium">
                  Nova senha
                </label>

                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    type="password"
                    className="pl-10 h-11"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">
                  Confirmar senha
                </label>

                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    type="password"
                    className="pl-10 h-11"
                    placeholder="••••••••"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && <div className="text-red-500 text-sm">{error}</div>}
              {success && <div className="text-green-600 text-sm">Senha redefinida com sucesso! Redirecionando...</div>}

              <button
                type="submit"
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold flex justify-center items-center transition-colors"
                disabled={loading}
              >
                {loading ? 'Redefinindo...' : 'Redefinir senha'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <aside className="hidden lg:flex w-1/2 items-center justify-center bg-gradient-to-br from-blue-700 to-blue-900 rounded-l-[80px]">
        <div className="text-white max-w-md space-y-6 p-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold">
              Segurança da Conta
            </h2>
          </div>

          <p className="text-blue-100">
            Proteção corporativa com link temporário e criptografia avançada.
          </p>
        </div>
      </aside>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}
