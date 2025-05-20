import { useState, useEffect, useRef } from "react";

interface UseAudioOptions {
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  onLoadedMetadata?: (duration: number) => void;
  onError?: (error: Event) => void;
}

export function useAudio(audioSrc?: string, options: UseAudioOptions = {}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Event | null>(null);
  const [volume, setVolume] = useState(0.7);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    
    if (audioSrc) {
      audio.src = audioSrc;
      audio.load();
      setIsLoading(true);
    }
    
    const handlePlay = () => {
      setIsPlaying(true);
      options.onPlay?.();
    };
    
    const handlePause = () => {
      setIsPlaying(false);
      options.onPause?.();
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      options.onEnded?.();
    };
    
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      options.onTimeUpdate?.(audio.currentTime);
    };
    
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      options.onLoadedMetadata?.(audio.duration);
    };
    
    const handleError = (e: Event) => {
      setError(e);
      setIsLoading(false);
      options.onError?.(e);
    };
    
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('error', handleError);
    
    return () => {
      audio.pause();
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('error', handleError);
    };
  }, [audioSrc, options]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };
  
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
  };
  
  const seek = (time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
  };

  return {
    isPlaying,
    duration,
    currentTime,
    isLoading,
    error,
    volume,
    togglePlay,
    handleVolumeChange,
    seek,
  };
}
