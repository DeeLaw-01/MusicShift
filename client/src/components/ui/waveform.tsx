import React, { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { formatTime } from "@/lib/utils";
import { Play, Pause, Volume2, Volume1, VolumeX } from "lucide-react";

interface WaveformProps {
  audioUrl: string;
  height?: number;
  waveColor?: string;
  progressColor?: string;
  title?: string;
}

export default function Waveform({
  audioUrl,
  height = 80,
  waveColor = "#d4d4d4",
  progressColor = "#6200EA",
  title,
}: WaveformProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);

  // Initialize wavesurfer when component mounts
  useEffect(() => {
    if (waveformRef.current) {
      setLoading(true);
      
      const ws = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: waveColor,
        progressColor: progressColor,
        height: height,
        cursorWidth: 1,
        cursorColor: "transparent",
        barWidth: 2,
        barGap: 2,
        barRadius: 2,
        normalize: true,
        responsive: true,
      });

      ws.load(audioUrl);
      
      ws.on("ready", () => {
        wavesurfer.current = ws;
        setDuration(ws.getDuration());
        setLoading(false);
        ws.setVolume(volume);
      });

      ws.on("audioprocess", () => {
        setCurrentTime(ws.getCurrentTime());
      });

      ws.on("finish", () => {
        setPlaying(false);
      });

      ws.on("error", (err) => {
        console.error("WaveSurfer error:", err);
        setLoading(false);
      });

      return () => {
        ws.destroy();
      };
    }
  }, [audioUrl, waveColor, progressColor, height]);

  // Update volume when it changes
  useEffect(() => {
    if (wavesurfer.current) {
      wavesurfer.current.setVolume(volume);
    }
  }, [volume]);

  const handlePlayPause = () => {
    if (wavesurfer.current) {
      wavesurfer.current.playPause();
      setPlaying(!playing);
    }
  };

  const handleVolumeChange = (newVolume: number[]) => {
    const vol = newVolume[0];
    setVolume(vol);
  };

  const VolumeIcon = () => {
    if (volume === 0) return <VolumeX size={18} />;
    if (volume < 0.5) return <Volume1 size={18} />;
    return <Volume2 size={18} />;
  };

  return (
    <div>
      {title && (
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium">{title}</h4>
        </div>
      )}
      
      <div className="waveform-container">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div ref={waveformRef} className="w-full h-full" />
        )}
      </div>
      
      <div className="audio-controls mt-2 p-3 flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handlePlayPause} 
          disabled={loading}
          className="text-primary"
        >
          {playing ? <Pause size={20} /> : <Play size={20} />}
        </Button>
        
        <div className="flex-grow mx-4">
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <VolumeIcon />
          <Slider
            value={[volume]}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            className="w-20"
          />
        </div>
      </div>
    </div>
  );
}
