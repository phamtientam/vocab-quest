export {};

declare global {
  interface SpeechRecognition extends EventTarget {
    start(): void;
    stop(): void;
    abort(): void;

    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;   // 👈 FIX LỖI CỦA BẠN

    onstart: (() => void) | null;
    onend: (() => void) | null;

    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  }

  interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionErrorEvent extends Event {
    error: string;
  }

  var SpeechRecognition: {
    new (): SpeechRecognition;
    prototype: SpeechRecognition;
  };

  var webkitSpeechRecognition: {
    new (): SpeechRecognition;
    prototype: SpeechRecognition;
  };
}