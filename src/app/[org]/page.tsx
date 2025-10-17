"use client";

import { useParams } from "next/navigation";
import { useLandingPage } from "@/hooks/useLandingPage";
import { PublicLandingPage } from "@/components/PublicLandingPage";
import { motion } from "framer-motion";
import { Loader2, AlertCircle } from "lucide-react";

export default function LandingPage() {
  const params = useParams();
  const orgSlug = params.org as string;
  
  const { config, html, loading, error } = useLandingPage(orgSlug);
  
  console.log('LandingPage render - orgSlug:', orgSlug);
  console.log('LandingPage render - config:', config);
  console.log('LandingPage render - html:', html ? 'HTML presente' : 'HTML ausente');
  console.log('LandingPage render - loading:', loading);
  console.log('LandingPage render - error:', error);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center space-y-4"
        >
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600">Carregando landing page...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 max-w-md mx-auto px-4"
        >
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900">Página não encontrada</h1>
          <p className="text-gray-600">
            A landing page para esta organização não foi encontrada ou não está disponível.
          </p>
          <div className="text-sm text-gray-500">
            Erro: {error}
          </div>
        </motion.div>
      </div>
    );
  }

  // Se tem HTML, renderizar diretamente
  if (html) {
    return (
      <>
        <style jsx global>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
          .hero { background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 80px 0; text-align: center; }
          .hero h1 { font-size: 3rem; margin-bottom: 1rem; }
          .hero p { font-size: 1.2rem; margin-bottom: 2rem; }
          .btn { background: white; color: #3b82f6; padding: 15px 30px; border: none; border-radius: 8px; font-size: 1.1rem; cursor: pointer; text-decoration: none; display: inline-block; }
          .features { padding: 80px 0; background: #f8fafc; }
          .features h2 { text-align: center; margin-bottom: 3rem; font-size: 2.5rem; }
          .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
          .feature { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
          .feature h3 { color: #3b82f6; margin-bottom: 1rem; }
          .form-section { padding: 80px 0; background: white; }
          .form-container { max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 2rem; border-radius: 12px; }
          .form-group { margin-bottom: 1.5rem; }
          .form-group label { display: block; margin-bottom: 0.5rem; font-weight: bold; }
          .form-group input, .form-group select { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; }
          .form-group input:focus, .form-group select:focus { outline: none; border-color: #3b82f6; }
          .submit-btn { background: #3b82f6; color: white; padding: 15px 30px; border: none; border-radius: 8px; font-size: 1.1rem; cursor: pointer; width: 100%; }
          .submit-btn:hover { background: #1e40af; }
        `}</style>
        <div 
          dangerouslySetInnerHTML={{ __html: html }}
          className="w-full"
        />
      </>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900">Configuração não disponível</h1>
          <p className="text-gray-600">
            A configuração da landing page não está disponível no momento.
          </p>
        </motion.div>
      </div>
    );
  }

  return <PublicLandingPage config={config} />;
}
