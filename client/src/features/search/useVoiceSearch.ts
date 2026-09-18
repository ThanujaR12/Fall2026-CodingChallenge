// Voice input for search using the browser's built-in speech recognition (Chrome, Edge, Safari).
// Words appear as they are heard; when the person stops talking, the final phrase is delivered.
import { useCallback, useEffect, useRef, useState } from 'react';

// The Web Speech API isn't in TypeScript's DOM types yet, so describe the part we use.
type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> };
type RecognitionErrorEvent = { error: string };
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type RecognitionConstructor = new () => Recognition;

function getRecognition(): RecognitionConstructor | null {
  const w = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const MESSAGES: Record<string, string> = {
  'not-allowed': 'Microphone access is blocked. Allow it in your browser to search by voice.',
  'service-not-allowed':
    'Microphone access is blocked. Allow it in your browser to search by voice.',
  'no-speech': "Didn't catch that. Tap the mic and try again.",
  'audio-capture': 'No microphone was found.',
  network: 'Voice search needs an internet connection.',
};

type Options = {
  /** Called with the words heard so far, while the person is still talking. */
  onInterim: (text: string) => void;
  /** Called once with the final phrase. */
  onFinal: (text: string) => void;
  onError: (message: string) => void;
};

export function useVoiceSearch({ onInterim, onFinal, onError }: Options) {
  const [supported] = useState(() => typeof window !== 'undefined' && getRecognition() !== null);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<Recognition | null>(null);
  // Keep the latest callbacks without restarting recognition when they change.
  const handlers = useRef({ onInterim, onFinal, onError });
  useEffect(() => {
    handlers.current = { onInterim, onFinal, onError };
  });

  const stop = useCallback(() => recognitionRef.current?.stop(), []);

  const start = useCallback(() => {
    const Constructor = getRecognition();
    if (!Constructor || recognitionRef.current) return;
    const recognition = new Constructor();
    recognition.lang = navigator.language || 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    let finalText = '';
    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
        else interim += result[0].transcript;
      }
      handlers.current.onInterim((finalText + interim).trim());
    };
    recognition.onerror = (event) => {
      // "aborted" is our own cancel; everything else gets a friendly explanation.
      if (event.error !== 'aborted') {
        handlers.current.onError(MESSAGES[event.error] ?? "Voice search didn't work. Try typing.");
      }
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
      const text = finalText.trim();
      if (text) handlers.current.onFinal(text);
    };

    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }, []);

  // Never leave the microphone on after leaving the page.
  useEffect(() => () => recognitionRef.current?.abort(), []);

  return { supported, listening, start, stop };
}
