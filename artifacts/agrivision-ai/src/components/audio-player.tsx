import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioPlayerProps {
  text: string;
  language?: string;
  className?: string;
}

export function AudioPlayer({ text, language = 'en-US', className }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const initUtterance = () => {
    if (!synthRef.current) return;
    
    // Stop any ongoing speech
    synthRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 0.9; // Slightly slower for better comprehension
    
    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };
    
    utterance.onerror = (e) => {
      if (e.error !== 'canceled') {
        console.error('Speech synthesis error', e);
        setIsPlaying(false);
        setIsPaused(false);
      }
    };

    utteranceRef.current = utterance;
  };

  const togglePlay = () => {
    if (!synthRef.current) return;

    if (isPlaying) {
      if (isPaused) {
        synthRef.current.resume();
        setIsPaused(false);
      } else {
        synthRef.current.pause();
        setIsPaused(true);
      }
    } else {
      initUtterance();
      if (utteranceRef.current) {
        synthRef.current.speak(utteranceRef.current);
        setIsPlaying(true);
        setIsPaused(false);
      }
    }
  };

  const stop = () => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  if (!window.speechSynthesis) {
    return null; // Not supported
  }

  return (
    <div className={cn("flex items-center gap-2 p-2 bg-muted/50 rounded-lg border", className)}>
      <Button 
        variant="secondary" 
        size="icon" 
        onClick={togglePlay}
        className="h-8 w-8 rounded-full shrink-0"
        title={isPlaying && !isPaused ? "Pause" : "Play Advisory"}
      >
        {isPlaying && !isPaused ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
      </Button>
      
      {(isPlaying || isPaused) && (
        <Button 
          variant="outline" 
          size="icon" 
          onClick={stop}
          className="h-8 w-8 rounded-full shrink-0"
          title="Stop"
        >
          <Square className="h-4 w-4" />
        </Button>
      )}
      
      <div className="flex-1 text-xs text-muted-foreground font-medium flex items-center px-2">
        {isPlaying 
          ? (isPaused ? "Paused" : "Playing audio...") 
          : "Listen to advisory"}
      </div>
      
      {isPlaying && !isPaused && (
        <div className="flex gap-1 h-3 items-center mr-2">
          <span className="w-1 bg-primary rounded-full animate-bounce" style={{ height: '40%', animationDuration: '0.8s' }} />
          <span className="w-1 bg-primary rounded-full animate-bounce" style={{ height: '80%', animationDuration: '1.2s' }} />
          <span className="w-1 bg-primary rounded-full animate-bounce" style={{ height: '100%', animationDuration: '0.9s' }} />
          <span className="w-1 bg-primary rounded-full animate-bounce" style={{ height: '60%', animationDuration: '1.1s' }} />
        </div>
      )}
    </div>
  );
}
