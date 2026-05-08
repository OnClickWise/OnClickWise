'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  onError?: (error: Error) => void;
  fallback?: ReactNode;
  criticalOperation?: boolean; // Se true, não permite ignorar erro
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
}

/**
 * Error Boundary especializado para operações críticas financeiras.
 * 
 * - Captura erros em operações de pagamento, reconciliação e lançamentos
 * - Impede falhas silenciosas em transações financeiras
 * - Oferece retry automático para erros temporários
 * - Log automático de erros críticos
 * 
 * Uso:
 * <FinancialErrorBoundary criticalOperation>
 *   <ContasAPagarPage />
 * </FinancialErrorBoundary>
 */
export default class FinancialErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorCount: 1,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🔴 Erro Crítico Financeiro:', error);
    console.error('Stack:', errorInfo.componentStack);

    // Callback customizado
    this.props.onError?.(error);

    // Log remoto para erros críticos (deve ser implementado)
    if (this.props.criticalOperation) {
      this.logCriticalError(error, errorInfo);
    }
  }

  private logCriticalError(error: Error, errorInfo: React.ErrorInfo) {
    // TODO: Implementar envio para serviço de logging (Sentry, LogRocket, etc.)
    console.warn('⚠️ Erro crítico financeiro detectado:', {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorCount: this.state.errorCount + 1,
    });
  };

  handleDismiss = () => {
    if (!this.props.criticalOperation) {
      this.setState({
        hasError: false,
        error: null,
      });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full bg-red-50 rounded-lg border-l-4 border-red-500 p-6">
          {/* Header com ícone */}
          <div className="flex items-start gap-4">
            <AlertTriangle className="text-red-500 flex-shrink-0 mt-1" size={24} />
            <div className="flex-1">
              {/* Título */}
              <h2 className="text-lg font-bold text-red-800">
                {this.props.criticalOperation
                  ? '⚠️ Erro Crítico em Operação Financeira'
                  : '❌ Algo deu errado'}
              </h2>

              {/* Mensagem de erro */}
              <p className="text-red-700 mt-2 text-sm">
                {this.state.error?.message || 'Erro desconhecido'}
              </p>

              {/* Dicas de ação */}
              {this.props.criticalOperation && (
                <div className="bg-red-100 rounded p-3 mt-3 text-xs text-red-700">
                  <p className="font-semibold mb-1">
                    🔒 Operação Bloqueada por Segurança
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Verifique sua conexão com a internet</li>
                    <li>Recarregue a página (F5 ou Ctrl+Shift+R)</li>
                    <li>Contacte o suporte se o problema persistir</li>
                  </ul>
                </div>
              )}

              {/* Stack trace em desenvolvimento */}
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-4 cursor-pointer">
                  <summary className="text-xs font-mono text-red-600 hover:text-red-800">
                    Detalhes Técnicos (Dev Mode)
                  </summary>
                  <pre className="bg-red-100 p-2 rounded mt-2 text-xs overflow-auto max-h-48">
                    {this.state.error?.stack}
                  </pre>
                </details>
              )}

              {/* Ações */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={this.handleRetry}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
                >
                  🔄 Tentar Novamente ({this.state.errorCount})
                </button>

                {!this.props.criticalOperation && (
                  <button
                    onClick={this.handleDismiss}
                    className="px-4 py-2 border border-red-300 text-red-700 rounded hover:bg-red-100 text-sm font-medium"
                  >
                    Descartar
                  </button>
                )}

                <a
                  href="mailto:suporte@onclickwise.com"
                  className="px-4 py-2 border border-red-300 text-red-700 rounded hover:bg-red-100 text-sm font-medium ml-auto"
                >
                  📧 Contatar Suporte
                </a>
              </div>
            </div>
          </div>

          {/* Fallback customizado */}
          {this.props.fallback && (
            <div className="mt-4 border-t border-red-200 pt-4">
              {this.props.fallback}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
