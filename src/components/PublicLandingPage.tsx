"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Mail, Phone, ArrowRight } from "lucide-react";
import { LandingPageConfig } from "@/hooks/useLandingPage";

interface PublicLandingPageProps {
  config: LandingPageConfig;
}

export function PublicLandingPage({ config }: PublicLandingPageProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      // Aqui você pode implementar o envio do formulário para sua API
      // Por enquanto, vamos simular um envio
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubmitMessage("Obrigado! Entraremos em contato em breve.");
      setFormData({});
    } catch {
      setSubmitMessage("Erro ao enviar formulário. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFormField = (field: { name: string; label: string; type: string; required: boolean }) => {
    const Icon = field.type === 'email' ? Mail : field.type === 'tel' ? Phone : null;
    
    return (
      <div key={field.name} className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative">
          {Icon && (
            <Icon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          )}
          <input
            type={field.type}
            name={field.name}
            value={formData[field.name] || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={field.label}
            required={field.required}
            className={`w-full p-3 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
              Icon ? 'pl-10' : ''
            }`}
            style={{
              '--tw-ring-color': config.primaryColor,
            } as React.CSSProperties}
          />
        </div>
      </div>
    );
  };

  const renderBlock = (block: { type: string; content: string }, index: number) => {
    switch (block.type) {
      case 'hero':
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-6"
          >
            <div 
              className="text-4xl md:text-6xl font-extrabold drop-shadow-lg"
              style={{ color: config.textColor }}
            >
              {config.title}
            </div>
            <div 
              className="text-lg md:text-xl"
              style={{ color: config.textColor }}
            >
              {config.subtitle}
            </div>
            <div 
              className="text-base md:text-lg opacity-90"
              style={{ color: config.textColor }}
            >
              {config.description}
            </div>
          </motion.div>
        );

      case 'benefits':
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <div 
              className="text-2xl font-bold text-center mb-8"
              style={{ color: config.textColor }}
            >
              Benefícios
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((item, i) => (
                <div
                  key={i}
                  className="p-6 rounded-2xl border bg-white shadow hover:shadow-lg transition-all"
                >
                  <CheckCircle2 
                    className="w-10 h-10 mb-4" 
                    style={{ color: config.primaryColor }}
                  />
                  <h3 
                    className="text-xl font-semibold mb-2"
                    style={{ color: config.textColor }}
                  >
                    Benefício {item}
                  </h3>
                  <p 
                    className="text-gray-600"
                    style={{ color: config.textColor }}
                  >
                    Descrição do benefício {item} que irá agregar valor ao seu negócio.
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        );

      case 'features':
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <div 
              className="text-2xl font-bold text-center mb-8"
              style={{ color: config.textColor }}
            >
              Recursos
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {[1, 2, 3, 4].map((item, i) => (
                <div
                  key={i}
                  className="p-6 rounded-2xl border bg-white shadow hover:shadow-lg transition-all"
                >
                  <h3 
                    className="text-xl font-semibold mb-2"
                    style={{ color: config.textColor }}
                  >
                    Recurso {item}
                  </h3>
                  <p 
                    className="text-gray-600"
                    style={{ color: config.textColor }}
                  >
                    Descrição detalhada do recurso {item} e como ele pode ajudar você.
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        );

      default:
        return (
          <div
            key={index}
            className="p-6 rounded-2xl border bg-white shadow"
            dangerouslySetInnerHTML={{ __html: block.content }}
          />
        );
    }
  };

  // Aplicar estilos dinâmicos via CSS custom properties
  React.useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', config.primaryColor);
    root.style.setProperty('--secondary-color', config.secondaryColor);
    root.style.setProperty('--background-color', config.backgroundColor);
    root.style.setProperty('--text-color', config.textColor);
  }, [config]);

  return (
    <div 
      className="min-h-screen landing-page"
      style={{ 
        backgroundColor: config.backgroundColor,
        color: config.textColor 
      }}
    >
      {/* Hero Section */}
      <section 
        className="relative py-20 text-center dynamic-gradient"
      >
        <div className="max-w-4xl mx-auto space-y-6 px-4">
          {config.blocks
            .filter(block => block.type === 'hero')
            .map((block, index) => renderBlock(block, index))}
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-4"
          >
            <div 
              className="text-lg md:text-xl font-medium"
              style={{ color: config.textColor }}
            >
              {config.ctaText}
            </div>
            <button
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold shadow-lg hover:scale-105 transition-transform"
              style={{ color: config.primaryColor }}
            >
              {config.ctaButtonText}
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Content Blocks */}
      <section className="py-20 container mx-auto px-4">
        <div className="space-y-20">
          {config.blocks
            .filter(block => block.type !== 'hero')
            .map((block, index) => renderBlock(block, index))}
        </div>
      </section>

      {/* Contact Form */}
      <section 
        className="py-20"
        style={{ backgroundColor: config.backgroundColor }}
      >
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto"
          >
            <h2 
              className="text-3xl font-bold text-center mb-12"
              style={{ color: config.textColor }}
            >
              Entre em Contato
            </h2>
            
            <form 
              onSubmit={handleSubmit}
              className="space-y-6 bg-white p-8 rounded-2xl shadow-lg"
            >
              {config.formFields.map(renderFormField)}
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl font-semibold text-white transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: config.primaryColor }}
              >
                {isSubmitting ? 'Enviando...' : 'Enviar Mensagem'}
              </button>
              
              {submitMessage && (
                <div 
                  className="text-center p-4 rounded-xl"
                  style={{ 
                    backgroundColor: submitMessage.includes('Erro') ? '#fee2e2' : '#dcfce7',
                    color: submitMessage.includes('Erro') ? '#dc2626' : '#16a34a'
                  }}
                >
                  {submitMessage}
                </div>
              )}
            </form>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
