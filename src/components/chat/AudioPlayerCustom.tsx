import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause } from 'lucide-react';

interface AudioPlayerCustomProps {
  src: string;
  primaryColor?: string;
  backgroundColor?: string;
}

export function AudioPlayerCustom({
  src,
  primaryColor = '#3b82f6',
  backgroundColor = '#f0f4f8',
}: AudioPlayerCustomProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // Carregar duração quando o src mudar
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src) return;

    // Resetar o estado quando o src muda
    setCurrentTime(0);
    setIsPlaying(false);

    // Adicionar listeners
    const handleLoadedMetadata = () => {
      const dur = audio.duration;
      if (isFinite(dur)) {
        setDuration(dur);
      }
    };

    const handleCanPlayThrough = () => {
      const dur = audio.duration;
      if (isFinite(dur)) {
        setDuration(dur);
      }
    };

    const handleDurationChange = () => {
      const dur = audio.duration;
      if (isFinite(dur) && dur > 0) {
        setDuration(dur);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    // Se o áudio já tem duração carregada
    if (isFinite(audio.duration) && audio.duration > 0) {
      setDuration(audio.duration);
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    // Tentar recarregar src para forçar carregamento dos metadados
    audio.load();

    // Fallback: verificar duração após um pequeno delay
    const timeoutId = setTimeout(() => {
      const dur = audio.duration;
      if (isFinite(dur) && dur > 0) {
        setDuration(dur);
      }
    }, 100);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      clearTimeout(timeoutId);
    };
  }, [src]);

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handlePlayPause = useCallback(() => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  }, []);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className="mt-2 flex items-center gap-3 rounded-full px-3 py-2 w-full max-w-xs"
      style={{ backgroundColor }}
    >
      {/* Play Button */}
      <button
        onClick={handlePlayPause}
        className="flex-shrink-0 rounded-full p-2.5 transition hover:opacity-80"
        style={{ backgroundColor: primaryColor }}
      >
        {isPlaying ? (
          <Pause size={16} className="text-white" fill="white" />
        ) : (
          <Play size={16} className="text-white" fill="white" style={{ marginLeft: '2px' }} />
        )}
      </button>

      {/* Waveform Visualization */}
      <div className="flex-1 flex items-center gap-1 h-6">
        {[...Array(20)].map((_, i) => {
          const isActive = progress > (i / 20) * 100;
          const randomHeight = Math.sin(i * 0.5) * 0.4 + 0.6;
          return (
            <div
              key={i}
              className="flex-1 rounded-sm transition-all duration-100"
              style={{
                height: `${randomHeight * 24}px`,
                backgroundColor: isActive ? primaryColor : '#d1d5db',
                opacity: isActive ? 1 : 0.3,
              }}
            />
          );
        })}
      </div>

      {/* Duration Time */}
      <span
        className="flex-shrink-0 text-xs font-medium whitespace-nowrap"
        style={{ color: primaryColor }}
      >
        {formatTime(isPlaying ? currentTime : duration)}
      </span>

      {/* Hidden Audio Element */}
      <audio 
        ref={audioRef} 
        src={src} 
        crossOrigin="anonymous" 
        preload="metadata"
        onLoadedMetadata={(e) => {
          const dur = (e.target as HTMLAudioElement).duration;
          if (isFinite(dur)) setDuration(dur);
        }}
        onCanPlayThrough={(e) => {
          const dur = (e.target as HTMLAudioElement).duration;
          if (isFinite(dur)) setDuration(dur);
        }}
      />
    </div>
  );
}
