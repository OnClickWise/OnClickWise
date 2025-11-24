"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Play, Lightbulb, Cog, Sliders, LineChart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export default function Hero() {
  const t = useTranslations("HomePage.Hero");
  const router = useRouter();
  const word = "OnclickWise";
  const [text, setText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [speed] = useState(120);

  useEffect(() => {
    if (isComplete) return; // Para a animação quando completa

    const timeout = setTimeout(() => {
      setText(prev => {
        const newText = word.substring(0, prev.length + 1);
        if (newText === word) {
          setIsComplete(true); // Marca como completo e para
        }
        return newText;
      });
    }, speed);

    return () => clearTimeout(timeout);
  }, [text, isComplete, speed, word]);

  return (
    <section id="home" className="bg-white dark:bg-gray-900">
      <div className="py-8 sm:py-12 px-4 sm:px-6 mx-auto max-w-screen-xl text-center lg:py-20 lg:px-12">

        {/* ALERTA / TAG */}
        <button
          onClick={() => router.push("/register")}
          className="inline-flex justify-between items-center py-1 px-1 pr-2 sm:pr-4 mb-4 sm:mb-7 text-xs sm:text-sm 
          text-gray-700 bg-gray-100 rounded-full dark:bg-gray-800 dark:text-white 
          hover:bg-gray-200 dark:hover:bg-gray-700 transition cursor-pointer w-full sm:w-auto max-w-xs sm:max-w-none mx-auto"
        >
          <span className="text-xs sm:text-sm font-medium px-2 sm:px-4 py-1 flex items-center gap-1 sm:gap-2">
            <Lightbulb className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="truncate">{t("tag")}</span>
          </span>

          <ArrowRight className="ml-1 sm:ml-2 w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
        </button>

        {/* TÍTULO */}
        <h1 className="mb-3 sm:mb-4 px-2 sm:px-0 text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight leading-tight sm:leading-none text-gray-900 dark:text-white">
          {t("title")} <br />

          {/* AQUI ESTÁ A ANIMAÇÃO */}
          <span className="text-blue-600 dark:text-blue-400">
            {text}
            <span className="animate-pulse">|</span>
          </span>{" "}
          <span className="block sm:inline">{t("titleEnd")}</span>
        </h1>

        {/* SUBTÍTULO */}
        <p className="mb-6 sm:mb-8 px-2 sm:px-4 md:px-8 lg:px-16 xl:px-48 text-sm sm:text-base md:text-lg lg:text-xl font-normal text-gray-500 dark:text-gray-400 leading-relaxed">
          {t("subtitle")}
        </p>

        {/* BOTÕES */}
        <div className="flex flex-col mb-6 sm:mb-8 lg:mb-16 space-y-3 sm:space-y-4 sm:flex-row sm:justify-center 
          sm:space-y-0 sm:space-x-3 md:space-x-4 px-4 sm:px-0"
        >
          <a
            href="#features"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="inline-flex justify-center items-center py-2.5 sm:py-3 px-4 sm:px-5 text-sm sm:text-base 
            font-medium text-center dark:text-white rounded-lg hover:bg-primary-800 
            focus:ring-4 focus:ring-primary-300 dark:hover:bg-blue-200 transition cursor-pointer min-h-[44px]"
          >
            {t("learnMore")}
            <ArrowRight className="ml-2 -mr-1 w-4 h-4 sm:w-5 sm:h-5" />
          </a>

          <button
            onClick={() => {
              // Abre modal de vídeo ou link para vídeo
              // Por enquanto, apenas scroll para seção de vídeo se existir
              const videoSection = document.getElementById("video") || document.getElementById("about");
              videoSection?.scrollIntoView({ behavior: "smooth" });
            }}
            className="inline-flex justify-center items-center py-2.5 sm:py-3 px-4 sm:px-5 text-sm sm:text-base 
            font-medium text-center text-gray-900 rounded-lg border border-gray-300 
            hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 dark:text-white 
            dark:border-gray-700 dark:hover:bg-gray-700 dark:focus:ring-gray-800 transition cursor-pointer min-h-[44px]"
          >
            <Play className="mr-2 -ml-1 w-4 h-4 sm:w-5 sm:h-5" />
            {t("watchVideo")}
          </button>
        </div>

        {/* FEATURED IN */}
        <div className="px-2 sm:px-4 mx-auto text-center md:max-w-screen-md lg:max-w-screen-lg lg:px-12 pt-6 sm:pt-8">
          <span className="font-semibold text-gray-400 uppercase text-xs sm:text-sm">
            {t("featuredIn")}
          </span>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 md:gap-6 lg:gap-8 mt-4 sm:mt-6 md:mt-8 text-gray-500">

            <a
              href="#features"
              className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold 
              hover:text-gray-800 dark:hover:text-gray-400 transition flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink cursor-pointer"
            >
              <Cog className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 flex-shrink-0" />
              <span className="text-sm sm:text-base md:text-lg lg:text-xl">{t("automate")}</span>
            </a>

            <a
              href="#features"
              className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold 
              hover:text-gray-800 dark:hover:text-gray-400 transition flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink cursor-pointer"
            >
              <Sliders className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 flex-shrink-0" />
              <span className="text-sm sm:text-base md:text-lg lg:text-xl">{t("systIntegration")}</span>
            </a>

            <a
              href="#features"
              className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold 
              hover:text-gray-800 dark:hover:text-gray-400 transition flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink cursor-pointer"
            >
              <LineChart className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 flex-shrink-0" />
              <span className="text-sm sm:text-base md:text-lg lg:text-xl">{t("dataAnalysis")}</span>
            </a>

          </div>
        </div>

      </div>
    </section>
  );
}
