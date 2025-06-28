
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
  transcriptionQuality?: 'high' | 'medium' | 'low';
}

interface RAGResponse {
  response: string;
  context?: any;
  success: boolean;
  error?: string;
  confidence?: number;
}

export const useImprovedRAGAgent = (currentProduct: Product | null) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [audioQuality, setAudioQuality] = useState<'high' | 'medium' | 'low'>('medium');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const { toast } = useToast();

  const startListening = async (retryCount = 0) => {
    try {
      console.log('Starting voice recording, attempt:', retryCount + 1);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });
      
      // Check audio quality
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      
      if (average > 50) {
        setAudioQuality('high');
      } else if (average > 20) {
        setAudioQuality('medium');
      } else {
        setAudioQuality('low');
        if (retryCount < 2) {
          toast({
            title: "Calidad de audio baja",
            description: "Reintentando con mejor configuración...",
          });
          stream.getTracks().forEach(track => track.stop());
          await new Promise(resolve => setTimeout(resolve, 1000));
          return startListening(retryCount + 1);
        }
      }

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
        await processAudioWithTranscription(audioBlob);
      };

      mediaRecorderRef.current.start(1000); // Collect data every second
      setIsListening(true);
      setTranscript('🎤 Escuchando... (Calidad: ' + audioQuality + ')');

      // Auto-stop after 15 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current && isListening) {
          stopListening();
        }
      }, 15000);

    } catch (error) {
      console.error('Error starting voice recording:', error);
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

  const processAudioWithTranscription = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      console.log('Processing audio with size:', audioBlob.size);
      
      if (audioBlob.size < 1000) {
        throw new Error('Audio muy corto o silencioso');
      }

      // Enhanced simulation with context-aware responses
      const contextualQuestions = currentProduct ? [
        `¿Cuáles son las ventajas de ${currentProduct.name}?`,
        `¿Hay productos similares a ${currentProduct.name} más baratos?`,
        `Compara ${currentProduct.name} con otros modelos`,
        `¿Vale la pena comprar ${currentProduct.name}?`,
        `¿Qué características tiene ${currentProduct.name}?`,
        `¿Cuál es la diferencia entre ${currentProduct.name} y la competencia?`
      ] : [
        "¿Qué productos tienen en oferta?",
        "Busco una cámara con buena relación calidad-precio",
        "¿Cuáles son los mejores laptops para gaming?",
        "Necesito auriculares inalámbricos con cancelación de ruido",
        "¿Qué smartphone me recomiendan para fotografía?"
      ];
      
      const simulatedTranscript = contextualQuestions[Math.floor(Math.random() * contextualQuestions.length)];
      
      await processQueryWithRAG(simulatedTranscript);

    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: "Error de procesamiento",
        description: error.message || "No se pudo procesar el audio",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const processQueryWithRAG = async (query: string) => {
    console.log('Processing query with RAG:', query);
    
    // Add user message
    const userMessage: ConversationMessage = {
      role: 'user',
      content: query,
      timestamp: new Date(),
      transcriptionQuality: audioQuality
    };

    setTranscript(query);
    setConversation(prev => [...prev, userMessage]);

    try {
      // Prepare enhanced context for RAG
      const ragContext = {
        current_product: currentProduct ? {
          id: currentProduct.id,
          name: currentProduct.name,
          description: currentProduct.description,
          price: currentProduct.price,
          category: currentProduct.category
        } : null,
        user_intent: classifyUserIntent(query),
        conversation_history: conversation.slice(-3).map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      };

      console.log('Sending to RAG agent:', { query, context: ragContext });

      // Call RAG agent
      const response = await fetch('http://localhost:8501/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          product_context: ragContext.current_product,
          conversation_context: ragContext.conversation_history,
          user_intent: ragContext.user_intent,
          use_voice: true,
          enhance_response: true
        })
      });

      if (!response.ok) {
        throw new Error(`RAG Agent error: ${response.status} - ${response.statusText}`);
      }

      const data: RAGResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Unknown RAG error');
      }

      console.log('RAG response received:', data);

      // Add assistant response
      const assistantMessage: ConversationMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setConversation(prev => [...prev, assistantMessage]);
      setTranscript('');

      // Enhanced voice synthesis
      await speakResponse(data.response);

    } catch (error) {
      console.error('Error with RAG agent:', error);
      
      let fallbackResponse = "Lo siento, hubo un problema procesando tu consulta.";
      
      if (error.message.includes('fetch')) {
        fallbackResponse = "El agente RAG no está disponible. Usando respuesta básica: ";
        if (currentProduct) {
          fallbackResponse += generateBasicProductResponse(query, currentProduct);
        } else {
          fallbackResponse += "Por favor, intenta de nuevo más tarde.";
        }
        
        toast({
          title: "Agente RAG no disponible",
          description: "Servidor en localhost:8501 no accesible",
          variant: "destructive",
        });
      }

      const errorMessage: ConversationMessage = {
        role: 'assistant',
        content: fallbackResponse,
        timestamp: new Date()
      };

      setConversation(prev => [...prev, errorMessage]);
    }
  };

  const classifyUserIntent = (query: string) => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('compar') || lowerQuery.includes('diferencia') || lowerQuery.includes('versus')) {
      return 'compare';
    } else if (lowerQuery.includes('recomiend') || lowerQuery.includes('similar') || lowerQuery.includes('alternativ')) {
      return 'recommend';
    } else if (lowerQuery.includes('precio') || lowerQuery.includes('cuesta') || lowerQuery.includes('barato')) {
      return 'price';
    } else if (lowerQuery.includes('característic') || lowerQuery.includes('especificacion') || lowerQuery.includes('detalles')) {
      return 'features';
    } else if (lowerQuery.includes('comprar') || lowerQuery.includes('vale la pena')) {
      return 'purchase';
    }
    
    return 'general';
  };

  const generateBasicProductResponse = (query: string, product: Product): string => {
    const intent = classifyUserIntent(query);
    
    switch (intent) {
      case 'price':
        return `${product.name} cuesta €${product.price}.`;
      case 'features':
        return `${product.name}: ${product.description}`;
      case 'compare':
        return `${product.name} es una excelente opción en la categoría ${product.category}. Para comparaciones detalladas, necesito acceso al agente RAG.`;
      case 'recommend':
        return `Basándome en ${product.name}, te recomendaría productos similares en la categoría ${product.category}.`;
      default:
        return `${product.name} - €${product.price}. ${product.description.substring(0, 100)}...`;
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
      
      // Try to use a Spanish voice
      const voices = speechSynthesis.getVoices();
      const spanishVoice = voices.find(voice => 
        voice.lang.includes('es') && voice.name.includes('Google')
      ) || voices.find(voice => voice.lang.includes('es'));
      
      if (spanishVoice) {
        utterance.voice = spanishVoice;
      }

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        console.error('Speech synthesis error');
      };

      speechSynthesisRef.current = utterance;
      speechSynthesis.speak(utterance);
    }
  };

  const processTextQuery = async (textQuery: string) => {
    await processQueryWithRAG(textQuery);
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
    audioQuality,
    startListening,
    stopListening,
    stopSpeaking,
    processTextQuery,
    clearConversation
  };
};
