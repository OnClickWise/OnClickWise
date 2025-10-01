'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2 } from 'lucide-react';

interface RepresentativeData {
  name: string;
  email: string;
  position: string;
  ssn: string;
}

interface CompanyData {
  name: string;
  slug: string;
  email: string;
  company_id: string;
  password: string;
  password_confirm: string;
  phone: string;
  zipCode: string;
  address: string;
  city: string;
  state: string;
  country: string;
}

export default function RepresentativePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [modalContent, setModalContent] = useState<'terms' | 'privacy'>('terms');
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [formData, setFormData] = useState<RepresentativeData>({
    name: '',
    email: '',
    position: '',
    ssn: ''
  });

  useEffect(() => {
    // Load company data from localStorage
    const savedCompanyData = localStorage.getItem('companyData');
    if (savedCompanyData) {
      setCompanyData(JSON.parse(savedCompanyData));
    } else {
      // If no company data, redirect to first page
      router.push('/register');
    }
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name || !formData.position || !formData.ssn) {
      setError('Name, position, and SSN are required');
      return false;
    }

    // If email is different from company email, validate
    if (formData.email && formData.email !== companyData?.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email');
        return false;
      }
    }

    if (!termsAccepted) {
      setError('You must accept the terms and conditions');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    if (!companyData) {
      setError('Company data not found');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organization: {
            name: companyData.name,
            slug: companyData.slug,
            email: companyData.email,
            company_id: companyData.company_id,
            password: companyData.password,
            phone: companyData.phone,
            address: companyData.address,
            city: companyData.city,
            state: companyData.state,
            country: companyData.country,
            zipCode: companyData.zipCode,
          },
          representative: {
            name: formData.name,
            email: formData.email || companyData.email,
            position: formData.position,
            ssn: formData.ssn
          }
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Limpar dados temporários
        localStorage.removeItem('companyData');
        
        // Salvar token no localStorage
        localStorage.setItem('token', result.token);
        localStorage.setItem('organization', JSON.stringify(result.organization));
        
        // Redirecionar para o dashboard
        router.push(`/${result.organization.slug}/dashboard`);
      } else {
        setError(result.error || 'Error creating account');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/register');
  };

  if (!companyData) {
    return (
      <div className="min-h-screen bg-background">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">OnClickWise</span>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header similar ao dashboard */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-foreground">OnClickWise</span>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <div className="max-w-2xl w-full">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-foreground mb-2">Legal Representative Information</h1>
              <p className="text-muted-foreground">Fill in the account holder information</p>
            </div>

            {/* Registration Form */}
            <div className="bg-card border rounded-xl p-8 shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-muted/50 p-6 rounded-lg">
                  <h2 className="text-lg font-semibold text-card-foreground mb-4">Representative Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-card-foreground mb-2">
                  Representative Name *
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full"
                  placeholder="Full name"
                />
              </div>

              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                  Position *
                </label>
                <Input
                  id="position"
                  name="position"
                  type="text"
                  value={formData.position}
                  onChange={handleInputChange}
                  required
                  className="w-full"
                  placeholder="CEO, Director, Manager, etc."
                />
              </div>

              <div>
                <label htmlFor="ssn" className="block text-sm font-medium text-gray-700 mb-1">
                  SSN (Social Security Number) *
                </label>
                <Input
                  id="ssn"
                  name="ssn"
                  type="text"
                  value={formData.ssn}
                  onChange={handleInputChange}
                  required
                  className="w-full"
                  placeholder="Enter SSN in any format"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Required for legal compliance and verification
                </p>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Representative Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full"
                  placeholder="representative@example.com (optional)"
                />
                <p className="text-sm text-gray-500 mt-1">
                  If not filled, the company email will be used: {companyData.email}
                </p>
              </div>
            </div>
          </div>

                <div className="bg-muted/50 p-6 rounded-lg">
                  <h2 className="text-lg font-semibold text-card-foreground mb-4">Terms and Conditions</h2>
            
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="text-sm text-gray-700">
                <label htmlFor="terms" className="cursor-pointer">
                  I accept the{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setModalContent('terms');
                      setShowTermsModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-700 underline cursor-pointer"
                  >
                    Terms of Use
                  </button>
                  {' '}and{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setModalContent('privacy');
                      setShowTermsModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-700 underline cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                  {' '}of the platform.
                </label>
              </div>
            </div>
          </div>

                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={loading || !termsAccepted || !formData.name || !formData.position || !formData.ssn}
                    className="flex-1"
                  >
                    {loading ? 'Creating account...' : 'Complete Registration'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Termos */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-card-foreground">
                  {modalContent === 'terms' ? 'Terms of Use' : 'Privacy Policy'}
                </h3>
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Abas */}
              <div className="flex border-b border-gray-200 mb-6">
                <button
                  onClick={() => setModalContent('terms')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 cursor-pointer ${
                    modalContent === 'terms'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Terms of Use
                </button>
                <button
                  onClick={() => setModalContent('privacy')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 cursor-pointer ${
                    modalContent === 'privacy'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Privacy Policy
                </button>
              </div>
              
              <div className="space-y-6 text-sm text-gray-700 max-h-96 overflow-y-auto">
                {modalContent === 'terms' ? (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4 text-lg">Termos de Uso</h4>
                  
                  <div className="space-y-4">
                    <p className="text-xs text-gray-500">
                      <strong>Última atualização:</strong> 30 / 09 / 2025
                    </p>
                    
                    <p>
                      Bem-vindo(a) à OnClickWise! Estes Termos de Uso ("Termos") regem o uso da plataforma da OnClickWise ("Plataforma", "serviço"), incluindo o cadastro, acesso e uso por empresas usuárias. Ao criar uma conta, ao usar ou ao acessar a Plataforma, você concorda com estes Termos. Se não concordar com qualquer parte, não utilize a Plataforma.
                    </p>

                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">1. Definições</h5>
                      <p className="mb-2">Para fins destes Termos:</p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li><strong>Usuário:</strong> toda pessoa física que representa uma empresa e que realiza cadastro na Plataforma.</li>
                        <li><strong>Empresa Cliente ou Empresa:</strong> pessoa jurídica cadastrada na Plataforma por meio do Usuário.</li>
                        <li><strong>Dados Cadastrais:</strong> os dados que você fornece no momento do cadastro, incluindo, mas não limitado a: Nome da empresa, Slug, CNPJ, E-mail da empresa, Telefone, Endereço completo (CEP, cidade, estado, país), Senha / confirmação de senha, Nome do responsável, E-mail do responsável, Cargo do responsável, CPF do responsável.</li>
                        <li><strong>Serviços:</strong> todas as funcionalidades oferecidas pela Plataforma da OnClickWise, incluindo CRM, gestão de leads, visualização de informações da empresa, etc.</li>
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">2. Cadastro e dados fornecidos</h5>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Para usar os serviços da Plataforma, você deverá fornecer os Dados Cadastrais completos e verdadeiros.</li>
                        <li>Você declara que os Dados Cadastrais, especialmente os Pessoa Jurídica (empresa) e Pessoa Física (responsável) são corretos, atualizados e que você tem autorização para fornecê-los.</li>
                        <li>É obrigação do Usuário manter essas informações atualizadas. Caso haja mudança relevante (por exemplo mudança de responsável, novo CPF, endereço etc.), o Usuário deverá atualizar os dados na Plataforma.</li>
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">3. Uso da senha, segurança e responsabilidade</h5>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Ao completar cadastro, você escolherá uma senha. Você é responsável por manter a confidencialidade da senha.</li>
                        <li>Você concorda em notificar imediatamente a OnClickWise sobre qualquer uso não autorizado de sua conta ou qualquer outra violação de segurança.</li>
                        <li>A OnClickWise não será responsável por perdas ou danos provenientes de uso indevido da sua conta, a menos que decorrentes de falha grave comprovada por parte da OnClickWise.</li>
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">4. Coleta, uso e tratamento de dados pessoais</h5>
                      <p className="mb-2">Os dados pessoais (nome responsável, e-mail, CPF, etc.) coletados são usados para: identificação da empresa usuária, segurança, fornecimento e manutenção do serviço, suporte, comunicação relacionada à conta, cumprimento de obrigações legais e regulatórias.</p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>A OnClickWise se compromete a respeitar a Lei Geral de Proteção de Dados Pessoais – Lei nº 13.709/2018 ("LGPD") no tratamento dos dados pessoais.</li>
                        <li>Os dados serão armazenados em ambiente seguro, com medidas técnicas e administrativas razoáveis para proteção contra acesso não autorizado, divulgação, alteração ou destruição.</li>
                        <li>A OnClickWise não compartilhará seus dados pessoais com terceiros, exceto quando necessário para cumprir obrigação legal, ordem judicial, ou mediante consentimento expresso, ou para a execução de serviços contratados que dependam de terceiros, os quais estejam obrigados a manter confidencialidade.</li>
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">5. Direitos dos titulares de dados</h5>
                      <p className="mb-2">Você, como titular dos dados pessoais fornecidos, tem os seguintes direitos previstos na LGPD:</p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>confirmação de existência de tratamento;</li>
                        <li>acesso aos seus dados;</li>
                        <li>correção de dados incompletos, inexatos ou desatualizados;</li>
                        <li>anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos;</li>
                        <li>portabilidade dos seus dados a outro fornecedor de serviço ou produto;</li>
                        <li>eliminação dos dados pessoais tratados com consentimento, quando este for revogado, salvo se houver obrigação legal para sua manutenção;</li>
                        <li>informação sobre compartilhamento de dados;</li>
                        <li>revogação do consentimento, quando aplicável.</li>
                      </ul>
                      <p className="mt-2">Para exercer esses direitos, você poderá entrar em contato conosco pelo e-mail: [colocar e-mail de contato da OnClickWise].</p>
                    </div>

                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">6. Limitação de responsabilidade</h5>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>A OnClickWise envidará esforços razoáveis para que a Plataforma esteja disponível e funcione corretamente, mas não garante que será ininterrupta ou livre de erros.</li>
                        <li>A OnClickWise não será responsável por danos indiretos, incidentais, especiais, consequenciais ou exemplares, incluindo perda de lucros, dados ou outras perdas intangíveis (mesmo que avisada da possibilidade desses danos), que resultem do uso ou da incapacidade de uso da Plataforma.</li>
                        <li>Não será responsabilidade da OnClickWise o uso indevido de informações ou má utilização da conta por parte de terceiro, salvo se ficar comprovado que foi falha da OnClickWise.</li>
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">7. Suspensão, cancelamento e exclusão de conta</h5>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Você pode cancelar sua conta e encerrar o uso da Plataforma a qualquer momento, mediante solicitação ou ação prevista na Plataforma.</li>
                        <li>Caso você solicite exclusão de conta, seus Dados Cadastrais serão excluídos ou anonimizados, salvo se mantidos por obrigação legal ou regulatória (por exemplo para retenção de registros fiscais, obrigações tributárias, auditorias).</li>
                        <li>A OnClickWise reserva-se o direito de suspender ou cancelar contas que violem estes Termos, apresentem fraude, uso indevido ou conduta ilegal.</li>
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">8. Alterações nos Termos</h5>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>A OnClickWise pode modificar estes Termos de Uso a qualquer momento. As alterações serão válidas após publicação no site ou aviso dentro da Plataforma.</li>
                        <li>Se você continuar usando a Plataforma após as alterações, considera-se que aceitou os Termos modificados.</li>
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">9. Disposições gerais</h5>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Estes Termos não criam qualquer vínculo societário, de emprego ou de agência entre você e a OnClickWise.</li>
                        <li>Caso alguma cláusula destes Termos seja considerada inválida ou inexequível, tal cláusula será interpretada na máxima extensão possível, e as demais permanecerão em vigor.</li>
                        <li>Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil.</li>
                        <li>Fica eleito o foro da comarca de [cidade/estado da sede da OnClickWise] para dirimir quaisquer questões relativas a estes Termos, com exclusão de qualquer outro, por mais privilegiado que seja.</li>
                      </ul>
                    </div>
                  </div>
                </div>
                ) : (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4 text-lg">Política de Privacidade</h4>
                    
                    <div className="space-y-4">
                      <p className="text-xs text-gray-500">
                        <strong>Última atualização:</strong> 30 / 09 / 2025
                      </p>
                      
                      <p>
                        A OnClickWise valoriza a sua privacidade e a proteção dos seus dados pessoais. Esta Política de Privacidade explica de forma clara como coletamos, usamos, armazenamos, compartilhamos e protegemos as informações fornecidas pelos usuários e empresas que utilizam nossa plataforma.
                      </p>

                      <p>
                        Ao se cadastrar ou utilizar a Plataforma, você concorda com as práticas descritas abaixo.
                      </p>

                      <div>
                        <h5 className="font-semibold text-gray-900 mb-2">1. Dados coletados</h5>
                        <p className="mb-2">Durante o cadastro e uso da Plataforma, podemos coletar os seguintes dados:</p>
                        
                        <div className="ml-4 space-y-2">
                          <div>
                            <strong>Dados da Empresa:</strong>
                            <ul className="list-disc list-inside space-y-1 ml-4 mt-1">
                              <li>Nome da empresa</li>
                              <li>Slug da empresa</li>
                              <li>CNPJ</li>
                              <li>E-mail da empresa</li>
                              <li>Telefone</li>
                              <li>Endereço (CEP, cidade, estado, país)</li>
                            </ul>
                          </div>
                          
                          <div>
                            <strong>Dados do Responsável pela Conta:</strong>
                            <ul className="list-disc list-inside space-y-1 ml-4 mt-1">
                              <li>Nome completo</li>
                              <li>Cargo</li>
                              <li>E-mail do responsável (se diferente)</li>
                              <li>CPF</li>
                            </ul>
                          </div>
                          
                          <div>
                            <strong>Dados de acesso:</strong>
                            <ul className="list-disc list-inside space-y-1 ml-4 mt-1">
                              <li>Senha (armazenada de forma criptografada)</li>
                              <li>Logs de acesso (data, hora, IP)</li>
                            </ul>
                          </div>
                          
                          <div>
                            <strong>Dados de uso:</strong>
                            <p className="ml-4">Informações sobre como você utiliza a Plataforma (ex.: páginas acessadas, interações, funcionalidades utilizadas).</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-semibold text-gray-900 mb-2">2. Finalidade do uso dos dados</h5>
                        <p className="mb-2">A OnClickWise utiliza os dados coletados para:</p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>Identificar e autenticar empresas e responsáveis pelo cadastro.</li>
                          <li>Permitir acesso e uso da Plataforma (CRM, captação de leads, gestão de informações).</li>
                          <li>Cumprir obrigações legais e regulatórias.</li>
                          <li>Realizar comunicação administrativa e operacional com os usuários.</li>
                          <li>Melhorar nossos serviços, corrigir falhas, implementar novas funcionalidades.</li>
                          <li>Proteger a segurança da Plataforma e prevenir fraudes.</li>
                          <li>Enviar comunicações relevantes (somente com consentimento prévio para comunicações de marketing).</li>
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-semibold text-gray-900 mb-2">3. Compartilhamento de dados</h5>
                        <p className="mb-2">Seus dados não são vendidos nem compartilhados com terceiros para fins comerciais.</p>
                        <p className="mb-2">Podemos compartilhar seus dados apenas nas seguintes hipóteses:</p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>Com prestadores de serviço e parceiros que atuam em nome da OnClickWise (ex.: provedores de hospedagem, suporte técnico), sempre sob obrigação de confidencialidade.</li>
                          <li>Para cumprir obrigações legais, regulatórias ou atender ordens judiciais.</li>
                          <li>Para proteger direitos, segurança ou propriedade da OnClickWise, de usuários ou de terceiros.</li>
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-semibold text-gray-900 mb-2">4. Armazenamento e segurança</h5>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>Os dados são armazenados em servidores seguros, localizados no Brasil ou no exterior, conforme legislação aplicável.</li>
                          <li>Senhas são armazenadas de forma criptografada.</li>
                          <li>Aplicamos medidas técnicas e administrativas para proteger contra acessos não autorizados, perdas, destruição ou alteração indevida.</li>
                          <li>Apesar dos nossos esforços, nenhum sistema é 100% seguro. Em caso de incidente de segurança que possa afetar seus dados, notificaremos você conforme exigido pela LGPD.</li>
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-semibold text-gray-900 mb-2">5. Retenção de dados</h5>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>Manteremos os dados enquanto sua conta estiver ativa ou conforme necessário para fornecer nossos serviços.</li>
                          <li>Após solicitação de exclusão de conta, os dados serão eliminados ou anonimizados, salvo se houver necessidade de retenção por obrigação legal ou regulatória.</li>
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-semibold text-gray-900 mb-2">6. Direitos do titular de dados</h5>
                        <p className="mb-2">De acordo com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 – LGPD), você tem direito a:</p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>Confirmar se tratamos seus dados pessoais.</li>
                          <li>Acessar os dados pessoais que possuímos sobre você.</li>
                          <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
                          <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos.</li>
                          <li>Solicitar a portabilidade dos dados a outro fornecedor.</li>
                          <li>Solicitar a exclusão dos dados tratados com base no consentimento.</li>
                          <li>Revogar o consentimento a qualquer momento.</li>
                          <li>Obter informações sobre com quem compartilhamos seus dados.</li>
                        </ul>
                        <p className="mt-2">Para exercer seus direitos, entre em contato através do e-mail: [colocar e-mail de contato da OnClickWise].</p>
                      </div>

                      <div>
                        <h5 className="font-semibold text-gray-900 mb-2">7. Cookies e tecnologias de rastreamento</h5>
                        <p>A Plataforma pode utilizar cookies e tecnologias semelhantes para melhorar a experiência do usuário, analisar uso e personalizar conteúdos. O usuário pode configurar seu navegador para recusar cookies, mas isso pode limitar algumas funcionalidades.</p>
                      </div>

                      <div>
                        <h5 className="font-semibold text-gray-900 mb-2">8. Alterações nesta política</h5>
                        <p>Podemos alterar esta Política de Privacidade a qualquer momento. A versão atualizada estará sempre disponível em nossa Plataforma. Recomendamos que revise periodicamente.</p>
                      </div>

                      <div>
                        <h5 className="font-semibold text-gray-900 mb-2">9. Contato</h5>
                        <p>Se você tiver dúvidas, solicitações ou preocupações relacionadas a esta Política de Privacidade ou ao tratamento de seus dados, entre em contato pelo e-mail: [inserir contato oficial da OnClickWise].</p>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h5 className="font-semibold text-gray-900 mb-2">⚖️ Resumo importante:</h5>
                        <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                          <li>Você coleta dados essenciais (empresa + responsável).</li>
                          <li>Deixa claro que segue LGPD.</li>
                          <li>Explica finalidades, compartilhamento limitado, direitos do titular.</li>
                          <li>Prevê exclusão de dados quando solicitado.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => setShowTermsModal(false)}
                >
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
