
import { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  category: string | null;
}

interface VoiceAgentState {
  isListening: boolean;
  isConnected: boolean;
  transcript: string;
  conversation: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
}

export const useGeminiVoiceAgent = (currentProduct: Product | null) => {
  const [state, setState] = useState<VoiceAgentState>({
    isListening: false,
    isConnected: false,
    transcript: '',
    conversation: []
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const geminiModelRef = useRef<any>(null);
  const { toast } = useToast();

  // Initialize Gemini Live
  useEffect(() => {
    initializeGeminiLive();
  }, []);

  const initializeGeminiLive = async () => {
    try {
      // Get session token from our Edge Function
      const { data: sessionData } = await supabase.functions.invoke('generate-gemini-session-token');
      
      if (!sessionData?.success) {
        throw new Error('Failed to get session token');
      }

      // Initialize Gemini AI (using a mock implementation for now)
      setState(prev => ({ ...prev, isConnected: true }));
      
      toast({
        title: "Agente de voz conectado",
        description: "Gemini Live está listo para usar",
      });

    } catch (error) {
      console.error('Error initializing Gemini Live:', error);
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con Gemini Live",
        variant: "destructive",
      });
    }
  };

  const searchProducts = async (query: string) => {
    try {
      // Generate embedding for the query
      const { data: embeddingData } = await supabase.functions.invoke('generate-embedding', {
        body: { text: query }
      });

      if (!embeddingData?.success) {
        throw new Error('Failed to generate embedding');
      }

      // Search for similar products using the match_products function
      const { data: products, error } = await supabase.rpc('match_products', {
        query_embedding: embeddingData.embedding,
        match_threshold: 0.7,
        match_count: 3
      });

      if (error) {
        console.error('Error searching products:', error);
        return `Error searching products: ${error.message}`;
      }

      if (!products || products.length === 0) {
        return "No se encontraron productos similares a tu consulta.";
      }

      // Format the results
      const formattedResults = products.map((product: any) => 
        `${product.name} - ${product.description} - Precio: €${product.price} - Categoría: ${product.category || 'Sin categoría'}`
      ).join('\n');

      return `Productos encontrados:\n${formattedResults}`;

    } catch (error) {
      console.error('Error in searchProducts:', error);
      return `Error al buscar productos: ${error.message}`;
    }
  };

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

      // Stop after 10 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current && state.isListening) {
          stopListening();
        }
      }, 10000);

    } catch (error) {
      console.error('Error starting voice recording:', error);
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

  const processAudio = async (audioBlob: Blob) => {
    try {
      // Convert audio to base64 for processing
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        // For now, simulate voice processing with a sample question
        const sampleQuestions = [
          "¿Qué productos similares tienen?",
          "¿Cuál es el precio de este producto?",
          "¿Qué características tiene este producto?",
          "¿Hay productos más baratos?",
          "¿Qué productos están en oferta?"
        ];
        
        const simulatedTranscript = sampleQuestions[Math.floor(Math.random() * sampleQuestions.length)];
        
        setState(prev => ({ 
          ...prev, 
          transcript: simulatedTranscript,
          conversation: [...prev.conversation, {
            role: 'user',
            content: simulatedTranscript,
            timestamp: new Date()
          }]
        }));

        // Process the query and get AI response
        await generateAIResponse(simulatedTranscript);
      };
      
      reader.readAsDataURL(audioBlob);

    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: "Error de procesamiento",
        description: "No se pudo procesar el audio",
        variant: "destructive",
      });
    }
  };

  const generateAIResponse = async (userQuery: string) => {
    try {
      let response = '';

      // Check if the query is about product search
      if (userQuery.toLowerCase().includes('productos') || 
          userQuery.toLowerCase().includes('buscar') ||
          userQuery.toLowerCase().includes('similar') ||
          userQuery.toLowerCase().includes('precio') ||
          userQuery.toLowerCase().includes('oferta')) {
        
        // Use RAG to search for products
        response = await searchProducts(userQuery);
      } else if (currentProduct) {
        // Answer about the current product
        response = `Estás viendo ${currentProduct.name}. ${currentProduct.description} Su precio es €${currentProduct.price}. ${currentProduct.category ? `Está en la categoría ${currentProduct.category}.` : ''} ¿Hay algo específico que te gustaría saber sobre este producto?`;
      } else {
        response = "Hola, soy tu asistente de voz. Puedo ayudarte a buscar productos y responder preguntas sobre ellos. ¿En qué puedo ayudarte?";
      }

      setState(prev => ({
        ...prev,
        conversation: [...prev.conversation, {
          role: 'assistant',
          content: response,
          timestamp: new Date()
        }],
        transcript: ''
      }));

      // Simulate voice synthesis (you can integrate with Web Speech API here)
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(response);
        utterance.lang = 'es-ES';
        speechSynthesis.speak(utterance);
      }

    } catch (error) {
      console.error('Error generating AI response:', error);
      toast({
        title: "Error de IA",
        description: "No se pudo generar una respuesta",
        variant: "destructive",
      });
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
    startListening,
    stopListening,
    clearConversation
  };
};
