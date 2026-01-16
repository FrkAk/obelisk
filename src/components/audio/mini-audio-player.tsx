"use client";

import { useCallback, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAudioStore } from "@/stores/audio-store";
import { cn } from "@/lib/utils";

interface MiniAudioPlayerProps {
  audioUrl?: string;
  title?: string;
  onPlay?: () => void;
  onPause?: () => void;
  className?: string;
}

/**
 * Compact inline audio player for story cards.
 *
 * Args:
 *     audioUrl: URL of the audio file to play.
 *     title: Title of the audio track.
 *     onPlay: Callback when playback starts.
 *     onPause: Callback when playback pauses.
 *     className: Additional CSS classes.
 *
 * Returns:
 *     React component rendering a mini audio player.
 */
export function MiniAudioPlayer({
  audioUrl,
  title = "Audio",
  onPlay,
  onPause,
  className,
}: MiniAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    play,
    pause,
    setCurrentTime,
    setDuration,
    setVolume,
  } = useAudioStore();

  const handlePlayPause = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      pause();
      onPause?.();
    } else {
      audioRef.current.play();
      play();
      onPlay?.();
    }
  }, [isPlaying, play, pause, onPlay, onPause]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, [setCurrentTime]);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  }, [setDuration]);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressRef.current || !audioRef.current) return;

      const rect = progressRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = percentage * duration;

      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    },
    [duration, setCurrentTime]
  );

  const toggleMute = useCallback(() => {
    if (volume > 0) {
      setVolume(0);
      if (audioRef.current) audioRef.current.volume = 0;
    } else {
      setVolume(1);
      if (audioRef.current) audioRef.current.volume = 1;
    }
  }, [volume, setVolume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      pause();
      setCurrentTime(0);
    };

    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [pause, setCurrentTime]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!audioUrl) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3",
        "glass rounded-xl",
        "border border-white/20",
        className
      )}
    >
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        preload="metadata"
      />

      <Button
        variant="ghost"
        size="icon"
        onClick={handlePlayPause}
        className={cn(
          "h-10 w-10 rounded-full shrink-0",
          "bg-primary text-primary-foreground",
          "hover:bg-primary/90 hover:scale-105",
          "transition-all duration-200",
          "active:scale-95"
        )}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" fill="currentColor" />
        ) : (
          <Play className="h-4 w-4 ml-0.5" fill="currentColor" />
        )}
      </Button>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate mb-1.5">{title}</p>
        <div
          ref={progressRef}
          onClick={handleProgressClick}
          className="h-1.5 bg-muted rounded-full cursor-pointer overflow-hidden"
        >
          <div
            className="h-full bg-primary rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMute}
          className="h-8 w-8 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
        >
          {volume > 0 ? (
            <Volume2 className="h-4 w-4 text-muted-foreground" />
          ) : (
            <VolumeX className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>
    </div>
  );
}
