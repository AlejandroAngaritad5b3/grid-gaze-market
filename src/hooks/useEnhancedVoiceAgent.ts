
import { useState, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useLocalRAGAgent } from "./useLocalRAGAgent";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  category: string | null;
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface VoiceAgentState {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  transcript: string;
  conversation: ConversationMessage[];
}

export const useEnhancedVoiceAgent = (currentProduct: Product | null) => {
  const [state, setState] = useState<VoiceAgentState>({
    isListening: false,
    isProcessing: false,
    isSpeaking: false,
    transcript: '',
    conversation: []
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const { toast } = useToast();
  const { queryRAGAgent, isLoading: ragLoading } = useLocalRAGAgent(currentProduct);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await processAudio(audioBlob);
      };

      mediaRecorderRef.current.start();
      setState(prev => ({ ...prev, isListening: true, transcript: 'Escuchando...' }));

      // Auto-stop después de 10 segundos
      setTimeout(() => {
        if (mediaRecorderRef.current && state.isListening) {
          stopListening();
        }
      }, 10000);

    } catch (error) {
      console.error('Error accediendo al micrófono:', error);
      toast({
        title: "Error de micrófono",
        description: "No se pudo acceder al micrófono",
        variant: "destructive",
      });
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setState(prev => ({ ...prev, isListening: false }));
  };

  const stopSpeaking = () => {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    setState(prev => ({ ...prev, isSpeaking: false }));
  };

  const processAudio = async (audioBlob: Blob) => {
    setState(prev => ({ ...prev, isProcessing: true }));

    try {
      // Simulación de transcripción para desarrollo
      // En producción, aquí llamarías a un servicio de speech-to-text
      const simulatedTranscripts = [
        "¿Cuáles son las características de este producto?",
        "¿Hay productos similares más baratos?",
        "¿Qué diferencias tiene con otros modelos?",
        "¿Vale la pena comprarlo?",
        "¿Qué ventajas tiene este producto?"
      ];
      
      const transcript = simulatedTranscripts[Math.floor(Math.random() * simulatedTranscripts.length)];
      
      await processQuery(transcript);

    } catch (error) {
      console.error('Error procesando audio:', error);
      toast({
        title: "Error de procesamiento",
        description: "No se pudo procesar el audio",
        variant: "destructive",
      });
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const processQuery = async (query: string) => {
    // Añadir mensaje del usuario
    setState(prev => ({
      ...prev,
      transcript: query,
      conversation: [...prev.conversation, {
        role: 'user',
        content: query,
        timestamp: new Date()
      }]
    }));

    try {
      // Consultar al agente RAG local
      const response = await queryRAGAgent(query);

      // Añadir respuesta del asistente
      setState(prev => ({
        ...prev,
        conversation: [...prev.conversation, {
          role: 'assistant',
          content: response,
          timestamp: new Date()
        }],
        transcript: ''
      }));

      // Síntesis de voz
      await speakResponse(response);

    } catch (error) {
      console.error('Error procesando consulta:', error);
      const errorMessage = "Disculpa, hubo un problema procesando tu consulta.";
      
      setState(prev => ({
        ...prev,
        conversation: [...prev.conversation, {
          role: 'assistant',
          content: errorMessage,
          timestamp: new Date()
        }],
        transcript: ''
      }));
    }
  };

  const speakResponse = async (text: string) => {
    if ('speechSynthesis' in window) {
      setState(prev => ({ ...prev, isSpeaking: true }));

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      
      // Buscar voz en español
      const voices = speechSynthesis.getVoices();
      const spanishVoice = voices.find(voice => voice.lang.includes('es'));
      if (spanishVoice) {
        utterance.voice = spanishVoice;
      }

      utterance.onend = () => {
        setState(prev => ({ ...prev, isSpeaking: false }));
      };

      utterance.onerror = () => {
        setState(prev => ({ ...prev, isSpeaking: false }));
      };

      speechSynthesisRef.current = utterance;
      speechSynthesis.speak(utterance);
    }
  };

  const clearConversation = () => {
    setState(prev => ({
      ...prev,
      conversation: [],
      transcript: ''
    }));
  };

  return {
    ...state,
    isLoading: ragLoading,
    startListening,
    stopListening,
    stopSpeaking,
    processQuery,
    clearConversation
  };
};
