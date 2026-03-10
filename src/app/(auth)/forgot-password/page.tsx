'use client';


import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Building2, ArrowLeft, Mail } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { forgotPassword } from '@/services/authService';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar instruções');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background text-foreground transition-colors">
      {/* LEFT */}
      <div className="w-full lg:w-1/2 h-screen flex justify-center px-4 sm:px-6">
        <div className="w-full max-w-md py-10">
          <div className="flex justify-center mb-6">
            <Logo width={160} height={0} />
          </div>

          <div className="bg-white rounded-xl shadow-xl p-6 sm:p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Recuperar senha
              </h1>
              <p className="text-gray-600 mt-1 text-sm">
                Informe seu e-mail para receber as instruções.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  E-mail
                </label>

                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="email@empresa.com"
                    className="pl-10 h-11 rounded-lg"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>


              {error && <div className="text-red-500 text-sm">{error}</div>}
              {success && <div className="text-green-600 text-sm">Instruções enviadas para seu e-mail.</div>}

              <button
                type="submit"
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold flex items-center justify-center transition-colors"
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Enviar instruções'}
              </button>

              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:underline"
                onClick={() => router.push('/login')}
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar para login
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="hidden lg:flex w-1/2 items-center justify-center p-10 bg-gradient-to-br from-blue-700 to-blue-900 rounded-l-[80px]">
        <div className="text-white max-w-md space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold">
              Recuperação de Acesso
            </h2>
          </div>

          <p className="text-blue-100 text-lg">
            Enviaremos instruções seguras para redefinir sua senha.
          </p>
        </div>
      </div>
    </div>
  );
}
