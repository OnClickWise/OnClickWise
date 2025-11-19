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
      <div className="py-12 px-4 mx-auto max-w-screen-xl text-center lg:py-20 lg:px-12">

        {/* ALERTA / TAG */}
        <button
          onClick={() => router.push("/register")}
          className="inline-flex justify-between items-center py-1 px-1 pr-4 mb-7 text-sm 
          text-gray-700 bg-gray-100 rounded-full dark:bg-gray-800 dark:text-white 
          hover:bg-gray-200 dark:hover:bg-gray-700 transition cursor-pointer"
        >
          <span className="text-sm font-medium px-4 py-1 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            {t("tag")}
          </span>

          <ArrowRight className="ml-2 w-5 h-5" />
        </button>

        {/* TÍTULO */}
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight leading-none text-gray-900 
          md:text-5xl lg:text-6xl dark:text-white"
        >
          {t("title")} <br />

          {/* AQUI ESTÁ A ANIMAÇÃO */}
          <span className="text-blue-600 dark:text-blue-400">
            {text}
            <span className="animate-pulse">|</span>
          </span>{" "}
          {t("titleEnd")}
        </h1>

        {/* SUBTÍTULO */}
        <p className="mb-8 text-lg font-normal text-gray-500 lg:text-xl sm:px-16 xl:px-48 
          dark:text-gray-400"
        >
          {t("subtitle")}
        </p>

        {/* BOTÕES */}
        <div className="flex flex-col mb-8 lg:mb-16 space-y-4 sm:flex-row sm:justify-center 
          sm:space-y-0 sm:space-x-4"
        >
          <a
            href="#features"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="inline-flex justify-center items-center py-3 px-5 text-base 
            font-medium text-center dark:text-white rounded-lg hover:bg-primary-800 
            focus:ring-4 focus:ring-primary-300 dark:hover:bg-blue-200 transition cursor-pointer"
          >
            {t("learnMore")}
            <ArrowRight className="ml-2 -mr-1 w-5 h-5" />
          </a>

          <button
            onClick={() => {
              // Abre modal de vídeo ou link para vídeo
              // Por enquanto, apenas scroll para seção de vídeo se existir
              const videoSection = document.getElementById("video") || document.getElementById("about");
              videoSection?.scrollIntoView({ behavior: "smooth" });
            }}
            className="inline-flex justify-center items-center py-3 px-5 text-base 
            font-medium text-center text-gray-900 rounded-lg border border-gray-300 
            hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 dark:text-white 
            dark:border-gray-700 dark:hover:bg-gray-700 dark:focus:ring-gray-800 transition cursor-pointer"
          >
            <Play className="mr-2 -ml-1 w-5 h-5" />
            {t("watchVideo")}
          </button>
        </div>

        {/* FEATURED IN */}
        <div className="px-4 mx-auto text-center md:max-w-screen-md lg:max-w-screen-lg lg:px-12 pt-8">
          <span className="font-semibold text-gray-400 uppercase">
            {t("featuredIn")}
          </span>

          <div className="flex justify-center items-center gap-4 md:gap-6 lg:gap-8 mt-8 text-gray-500">

            <a
              href="#features"
              className="text-lg md:text-xl lg:text-2xl font-bold 
              hover:text-gray-800 dark:hover:text-gray-400 transition flex items-center gap-2 whitespace-nowrap flex-shrink cursor-pointer"
            >
              <Cog className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 flex-shrink-0" />
              <span>{t("automate")}</span>
            </a>

            <a
              href="#features"
              className="text-lg md:text-xl lg:text-2xl font-bold 
              hover:text-gray-800 dark:hover:text-gray-400 transition flex items-center gap-2 whitespace-nowrap flex-shrink cursor-pointer"
            >
              <Sliders className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 flex-shrink-0" />
              <span>{t("systIntegration")}</span>
            </a>

            <a
              href="#features"
              className="text-lg md:text-xl lg:text-2xl font-bold 
              hover:text-gray-800 dark:hover:text-gray-400 transition flex items-center gap-2 whitespace-nowrap flex-shrink cursor-pointer"
            >
              <LineChart className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 flex-shrink-0" />
              <span>{t("dataAnalysis")}</span>
            </a>

          </div>
        </div>

      </div>
    </section>
  );
}
