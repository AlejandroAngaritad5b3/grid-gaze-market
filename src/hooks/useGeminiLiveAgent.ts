
import { useState, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";

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

export const useGeminiLiveAgent = (currentProduct: Product | null) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startListening = async () => {
    try {
      console.log('Iniciando grabación de voz...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processVoiceWithGeminiLive(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsListening(true);
      setTranscript('🎤 Escuchando...');

      // Auto-stop después de 10 segundos
      setTimeout(() => {
        if (mediaRecorderRef.current && isListening) {
          stopListening();
        }
      }, 10000);

    } catch (error) {
      console.error('Error accediendo al micrófono:', error);
      toast({
        title: "Error de micrófono",
        description: "No se pudo acceder al micrófono. Verifique los permisos.",
        variant: "destructive",
      });
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setIsListening(false);
  };

  const stopSpeaking = () => {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const processVoiceWithGeminiLive = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      console.log('Enviando audio a Gemini Live Agent:', audioBlob.size);
      
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice.webm');
      if (currentProduct) {
        formData.append('product_context', JSON.stringify({
          id: currentProduct.id,
          name: currentProduct.name,
          description: currentProduct.description,
          price: currentProduct.price,
          category: currentProduct.category
        }));
      }

      const response = await fetch('http://localhost:8502/api/voice/chat', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Error del Gemini Live Agent: ${response.status}`);
      }

      const data = await response.json();
      console.log('Respuesta de Gemini Live:', data);

      // Agregar mensaje del usuario (transcripción)
      if (data.transcript) {
        const userMessage: ConversationMessage = {
          role: 'user',
          content: data.transcript,
          timestamp: new Date()
        };
        setTranscript(data.transcript);
        setConversation(prev => [...prev, userMessage]);
      }

      // Agregar respuesta del asistente
      if (data.response) {
        const assistantMessage: ConversationMessage = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };
        setConversation(prev => [...prev, assistantMessage]);
        
        // Reproducir respuesta por voz
        await speakResponse(data.response);
      }

    } catch (error) {
      console.error('Error procesando voz con Gemini Live:', error);
      
      const errorMessage: ConversationMessage = {
        role: 'assistant',
        content: "Lo siento, no pude procesar tu consulta de voz. El agente Gemini Live no está disponible.",
        timestamp: new Date()
      };
      setConversation(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error en Gemini Live",
        description: "El servidor en localhost:8502 no está accesible",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setTranscript('');
    }
  };

  const processTextQuery = async (textQuery: string) => {
    console.log('Enviando consulta de texto al agente RAG:', textQuery);
    
    const userMessage: ConversationMessage = {
      role: 'user',
      content: textQuery,
      timestamp: new Date()
    };
    setConversation(prev => [...prev, userMessage]);

    try {
      const productContext = currentProduct ? {
        id: currentProduct.id,
        name: currentProduct.name,
        description: currentProduct.description,
        price: currentProduct.price,
        category: currentProduct.category
      } : null;

      const response = await fetch('http://localhost:8501/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: textQuery,
          product_context: productContext
        })
      });

      if (!response.ok) {
        throw new Error(`Error del agente RAG: ${response.status}`);
      }

      const data = await response.json();
      console.log('Respuesta del agente RAG:', data);

      const assistantMessage: ConversationMessage = {
        role: 'assistant',
        content: data.response || data.answer || "No se pudo obtener una respuesta",
        timestamp: new Date()
      };
      setConversation(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error con agente RAG:', error);
      
      const errorMessage: ConversationMessage = {
        role: 'assistant',
        content: "Lo siento, no pude procesar tu consulta. El agente RAG no está disponible.",
        timestamp: new Date()
      };
      setConversation(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error en agente RAG",
        description: "El servidor en localhost:8501 no está accesible",
        variant: "destructive",
      });
    }
  };

  const speakResponse = async (text: string) => {
    if ('speechSynthesis' in window) {
      setIsSpeaking(true);

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 0.85;
      utterance.pitch = 1.0;
      utterance.volume = 0.9;
      
      const voices = speechSynthesis.getVoices();
      const spanishVoice = voices.find(voice => 
        voice.lang.includes('es') && voice.name.includes('Google')
      ) || voices.find(voice => voice.lang.includes('es'));
      
      if (spanishVoice) {
        utterance.voice = spanishVoice;
      }

      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      speechSynthesis.speak(utterance);
    }
  };

  const clearConversation = () => {
    setConversation([]);
    setTranscript('');
  };

  return {
    isListening,
    isProcessing,
    isSpeaking,
    transcript,
    conversation,
    startListening,
    stopListening,
    stopSpeaking,
    processTextQuery,
    clearConversation
  };
};
