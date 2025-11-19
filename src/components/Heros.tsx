"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Play, Lightbulb, Cog, Sliders, LineChart } from "lucide-react";

export default function Hero() {
  const words = ["OnclickWise"]; // pode adicionar mais palavras se quiser
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [loop, setLoop] = useState(0);
  const [speed, setSpeed] = useState(120);

  useEffect(() => {
    const word = words[loop % words.length];

    const timeout = setTimeout(() => {
      setText(prev => {
        if (!isDeleting) {
          const newText = word.substring(0, prev.length + 1);
          if (newText === word) {
            // Pausa antes de apagar
            setTimeout(() => setIsDeleting(true), 1000);
          }
          return newText;
        } else {
          const newText = word.substring(0, prev.length - 1);
          if (newText === "") {
            setIsDeleting(false);
            setLoop(loop + 1);
          }
          return newText;
        }
      });

      setSpeed(isDeleting ? 60 : 120);
    }, speed);

    return () => clearTimeout(timeout);
  }, [text, isDeleting, loop, speed]);

  return (
    <section id="home" className="bg-white dark:bg-gray-900">
      <div className="py-12 px-4 mx-auto max-w-screen-xl text-center lg:py-20 lg:px-12">

        {/* ALERTA / TAG */}
        <a
          href="#"
          className="inline-flex justify-between items-center py-1 px-1 pr-4 mb-7 text-sm 
          text-gray-700 bg-gray-100 rounded-full dark:bg-gray-800 dark:text-white 
          hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        >
          <span className="text-sm font-medium px-4 py-1 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            It has never been so simple!
          </span>

          <ArrowRight className="ml-2 w-5 h-5" />
        </a>

        {/* TÍTULO */}
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight leading-none text-gray-900 
          md:text-5xl lg:text-6xl dark:text-white"
        >
          Simplify. Automate. <br />

          {/* AQUI ESTÁ A ANIMAÇÃO */}
          <span className="text-blue-600 dark:text-blue-400">
            {text}
            <span className="animate-pulse">|</span>
          </span>{" "}
          makes everything easier!
        </h1>

        {/* SUBTÍTULO */}
        <p className="mb-8 text-lg font-normal text-gray-500 lg:text-xl sm:px-16 xl:px-48 
          dark:text-gray-400"
        >
          Manage leads, contacts, companies, deals, tasks and teams — all in one powerful
          platform. Designed to streamline your sales process and help you close more deals effortlessly.
        </p>

        {/* BOTÕES */}
        <div className="flex flex-col mb-8 lg:mb-16 space-y-4 sm:flex-row sm:justify-center 
          sm:space-y-0 sm:space-x-4"
        >
          <a
            href="#"
            className="inline-flex justify-center items-center py-3 px-5 text-base 
            font-medium text-center dark:text-white rounded-lg hover:bg-primary-800 
            focus:ring-4 focus:ring-primary-300 dark:hover:bg-blue-200 transition"
          >
            Learn more
            <ArrowRight className="ml-2 -mr-1 w-5 h-5" />
          </a>

          <a
            href="#"
            className="inline-flex justify-center items-center py-3 px-5 text-base 
            font-medium text-center text-gray-900 rounded-lg border border-gray-300 
            hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 dark:text-white 
            dark:border-gray-700 dark:hover:bg-gray-700 dark:focus:ring-gray-800 transition"
          >
            <Play className="mr-2 -ml-1 w-5 h-5" />
            Watch video
          </a>
        </div>

        {/* FEATURED IN */}
        <div className="px-4 mx-auto text-center md:max-w-screen-md lg:max-w-screen-lg lg:px-12 pt-8">
          <span className="font-semibold text-gray-400 uppercase">
            FEATURED IN
          </span>

          <div className="flex flex-wrap justify-center items-center mt-8 text-gray-500 sm:justify-between">

            <a
              href="#"
              className="text-3xl font-bold mr-5 mb-5 lg:mb-0 
              hover:text-gray-800 dark:hover:text-gray-400 transition flex items-center gap-2"
            >
              <Cog className="w-7 h-7" />
              Automate
            </a>

            <a
              href="#"
              className="text-3xl font-bold mr-5 mb-5 lg:mb-0 
              hover:text-gray-800 dark:hover:text-gray-400 transition flex items-center gap-2"
            >
              <Sliders className="w-7 h-7" />
              SystIntegration
            </a>

            <a
              href="#"
              className="text-3xl font-bold mr-5 mb-5 lg:mb-0 
              hover:text-gray-800 dark:hover:text-gray-400 transition flex items-center gap-2"
            >
              <LineChart className="w-7 h-7" />
              DataAnalysis
            </a>

          </div>
        </div>

      </div>
    </section>
  );
}
