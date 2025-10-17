import { useState, useEffect } from 'react';

export interface FormField {
  name: string;
  label: string;
  type: string;
  required: boolean;
}

export interface LandingPageBlock {
  type: string;
  content: string;
}

export interface LandingPageConfig {
  id: string;
  name: string;
  template: string;
  title: string;
  subtitle: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  formFields: FormField[];
  ctaText: string;
  ctaButtonText: string;
  blocks: LandingPageBlock[];
  isPublished: boolean;
  publicUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface LandingPageResponse {
  success: boolean;
  landingPage?: LandingPageConfig;
  html?: string;
  error?: string;
}

export function useLandingPage(orgSlug: string) {
  const [config, setConfig] = useState<LandingPageConfig | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLandingPageConfig = async () => {
      if (!orgSlug) {
        setError('Slug da organização é obrigatório');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fazer requisição para a API sem autenticação (página pública)
        const response = await fetch(`http://localhost:3000/${orgSlug}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        
        // Se retornou HTML diretamente
        if (contentType && contentType.includes('text/html')) {
          console.log('Recebido HTML diretamente da API');
          const htmlContent = await response.text();
          console.log('HTML recebido:', htmlContent.substring(0, 200) + '...');
          
          // Extrair apenas o conteúdo do body para renderização no React
          const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
          const bodyContent = bodyMatch ? bodyMatch[1] : htmlContent;
          
          setHtml(bodyContent);
          return;
        }
        
        // Se retornou JSON
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('A API retornou um formato inválido (não é JSON nem HTML)');
        }

        let data: LandingPageResponse;
        try {
          data = await response.json();
        } catch {
          throw new Error('Resposta da API não é um JSON válido');
        }

        if (data.success) {
          if (data.html) {
            setHtml(data.html);
          } else if (data.landingPage) {
            setConfig(data.landingPage);
          } else {
            throw new Error('Nenhum conteúdo encontrado na resposta');
          }
        } else {
          throw new Error(data.error || 'Erro ao carregar configuração da landing page');
        }
      } catch (err) {
        console.error('Erro ao carregar landing page:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchLandingPageConfig();
  }, [orgSlug]);

  return {
    config,
    html,
    loading,
    error,
  };
}
