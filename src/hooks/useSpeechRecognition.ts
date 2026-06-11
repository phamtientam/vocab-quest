import { useState, useCallback, useRef } from 'react';

interface RecognitionOptions {
  onResult: (transcript: string) => void;
  onError?: (error: string) => void;
}

// Extend window type for vendor-prefixed API
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

export function useSpeechRecognition({ onResult, onError }: RecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  // const recognitionRef = useRef<InstanceType<typeof window.SpeechRecognition> | null>(null);
  const recognitionRef = useRef<any>(null);

  const isSupported =
    typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const startListening = useCallback(() => {
    if (!isSupported) {
      onError?.('Speech recognition not supported in this browser.');
      return;
    }

    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      console.warn("SpeechRecognition not supported");
      return;
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 3;
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1][0];

      if (result.confidence < 0.6) return;

      onResult(result.transcript.toLowerCase().trim());
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false);
      onError?.(event.error);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, onResult, onError]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return { isListening, startListening, stopListening, isSupported };
}
