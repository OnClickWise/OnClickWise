"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Play, Pause, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AudioPlayerProps {
  fileId: string
  fileName?: string
  duration?: number
  direction: 'incoming' | 'outgoing'
  className?: string
}

export function AudioPlayer({ 
  fileId, 
  fileName, 
  duration = 0, 
  direction, 
  className = '' 
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(duration)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const waveformRef = useRef<HTMLDivElement>(null)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
  const audioUrl = `${API_BASE_URL}/telegram/files/${fileId}`
  
  // Determine audio type based on fileId or fileName
  const getAudioType = () => {
    if (fileName?.toLowerCase().includes('.ogg')) {
      return 'audio/ogg; codecs=opus'
    } else if (fileName?.toLowerCase().includes('.mp3')) {
      return 'audio/mpeg'
    } else if (fileName?.toLowerCase().includes('.wav')) {
      return 'audio/wav'
    } else if (fileName?.toLowerCase().includes('.m4a')) {
      return 'audio/mp4'
    } else if (fileId.includes('voice') || fileId.includes('mtproto_voice')) {
      return 'audio/ogg; codecs=opus'
    } else {
      return 'audio/mpeg' // Default fallback
    }
  }

  // Format time in MM:SS format
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Handle play/pause
  const togglePlayPause = async () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      try {
        setIsLoading(true)
        setError(null)
        await audioRef.current.play()
        setIsPlaying(true)
      } catch (err) {
        console.error('Error playing audio:', err)
        setError('Failed to play audio')
        setIsPlaying(false)
      } finally {
        setIsLoading(false)
      }
    }
  }

  // Handle playback rate change
  const changePlaybackRate = () => {
    const rates = [1, 1.5, 2]
    const currentIndex = rates.indexOf(playbackRate)
    const nextIndex = (currentIndex + 1) % rates.length
    const newRate = rates[nextIndex]
    
    setPlaybackRate(newRate)
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate
    }
  }


  // Handle progress bar click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressRef.current) return

    const rect = progressRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const width = rect.width
    const percentage = clickX / width
    const newTime = percentage * audioDuration

    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleEnded = () => setIsPlaying(false)
    const handleLoadedMetadata = () => {
      setError(null)
      setIsLoading(false)
      // Capture the real duration from the audio element
      if (audio && audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setAudioDuration(audio.duration)
      }
    }
    const handleError = () => {
      setError('Failed to load audio')
      setIsLoading(false)
      setIsPlaying(false)
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('error', handleError)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('error', handleError)
    }
  }, [])

  // Generate waveform visualization
  const generateWaveform = () => {
    if (!waveformRef.current) return

    const bars = 30
    // Create a more realistic waveform pattern
    const waveform = Array.from({ length: bars }, (_, index) => {
      // Create peaks and valleys for more realistic look
      const baseHeight = 0.3
      const variation = Math.sin(index * 0.5) * 0.4 + Math.sin(index * 0.2) * 0.2
      const randomFactor = Math.random() * 0.3
      return Math.max(0.1, Math.min(1, baseHeight + variation + randomFactor))
    })
    
    waveformRef.current.innerHTML = ''
    waveform.forEach((height, index) => {
      const bar = document.createElement('div')
      bar.className = 'bg-current opacity-40 rounded-sm transition-all duration-100'
      bar.style.height = `${height * 100}%`
      bar.style.width = '2px'
      bar.style.marginRight = '1px'
      bar.style.minHeight = '2px'
      waveformRef.current?.appendChild(bar)
    })
  }

  useEffect(() => {
    generateWaveform()
  }, [])

  // Update audioDuration when duration prop changes
  useEffect(() => {
    if (duration > 0) {
      setAudioDuration(duration)
    }
  }, [duration])

  // Download handler
  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = audioUrl
    link.download = fileName || `audio_${fileId}.ogg`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const progressPercentage = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0

  return (
    <div className={`flex items-center space-x-3 p-3 rounded-lg ${
      direction === 'outgoing' 
        ? 'bg-blue-600 text-white' 
        : 'bg-gray-50 text-gray-900'
    } ${className}`}>
      {/* Play/Pause Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={togglePlayPause}
        disabled={isLoading}
        className={`p-2 rounded-full hover:bg-black/10 transition-all duration-200 cursor-pointer ${
          direction === 'outgoing' 
            ? 'text-white hover:text-white hover:bg-white/20' 
            : 'text-gray-600 hover:text-gray-700 hover:bg-gray-200'
        } ${isPlaying ? 'scale-110' : ''}`}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4 ml-0.5" />
        )}
      </Button>

      {/* Waveform and Progress */}
      <div className="flex-1 min-w-0">
        {/* Waveform Visualization */}
        <div className="relative">
          <div 
            ref={waveformRef}
            className="flex items-center h-4 mb-1 space-x-0.5"
          />
          {/* Progress overlay on waveform */}
          <div 
            className="absolute top-0 left-0 h-4 overflow-hidden"
            style={{ width: `${progressPercentage}%` }}
          >
            <div className="flex items-center h-4 space-x-0.5">
              {/* Highlighted waveform bars for played portion */}
              {Array.from({ length: Math.floor((progressPercentage / 100) * 30) }, (_, index) => (
                <div
                  key={index}
                  className="bg-current opacity-80 rounded-sm"
                  style={{
                    height: `${Math.max(0.1, Math.min(1, 0.3 + Math.sin(index * 0.5) * 0.4 + Math.sin(index * 0.2) * 0.2 + Math.random() * 0.3)) * 100}%`,
                    width: '2px',
                    marginRight: '1px',
                    minHeight: '2px'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div 
          ref={progressRef}
          className="relative h-1 bg-black/20 rounded-full cursor-pointer"
          onClick={handleProgressClick}
        >
          <div 
            className="absolute top-0 left-0 h-full bg-current rounded-full transition-all duration-100"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        {/* Time Display */}
        <div className="flex justify-between text-xs mt-1">
          <span className="opacity-70">
            {formatTime(currentTime)}
          </span>
          <span className="opacity-70">
            {formatTime(audioDuration)}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center space-x-1">
        {/* Playback Rate */}
        <Button
          variant="ghost"
          size="sm"
          onClick={changePlaybackRate}
          className={`px-2 py-1 rounded text-xs font-medium hover:bg-black/10 cursor-pointer ${
            direction === 'outgoing' 
              ? 'text-white hover:text-white' 
              : 'text-gray-600 hover:text-gray-700'
          }`}
        >
          {playbackRate}x
        </Button>

        {/* Download */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownload}
          className={`p-1 rounded-full hover:bg-black/10 cursor-pointer ${
            direction === 'outgoing' 
              ? 'text-white hover:text-white' 
              : 'text-gray-600 hover:text-gray-700'
          }`}
        >
          <Download className="w-3 h-3" />
        </Button>
      </div>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        preload="metadata"
        onError={() => setError('Failed to load audio')}
      >
        <source src={audioUrl} type={getAudioType()} />
        <source src={audioUrl} type="audio/ogg; codecs=opus" />
        <source src={audioUrl} type="audio/webm" />
        <source src={audioUrl} type="audio/mpeg" />
        <source src={audioUrl} type="audio/mp3" />
        <source src={audioUrl} type="audio/mp4" />
        <source src={audioUrl} type="audio/wav" />
        Your browser does not support audio playback.
      </audio>

      {/* Error Display */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-red-100 text-red-700 text-xs rounded">
          {error}
        </div>
      )}
    </div>
  )
}
