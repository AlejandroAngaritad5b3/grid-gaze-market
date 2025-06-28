
import { useState, useEffect, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIntentClassification } from "./useIntentClassification";

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
  const { toast } = useToast();
  const { classifyIntent } = useIntentClassification();

  // Initialize Gemini Live
  useEffect(() => {
    initializeGeminiLive();
  }, []);

  const initializeGeminiLive = async () => {
    try {
      const { data: sessionData } = await supabase.functions.invoke('generate-gemini-session-token');
      
      if (!sessionData?.success) {
        throw new Error('Failed to get session token');
      }

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

  const searchProductsWithRAG = async (query: string, intent: string, entities: string[]) => {
    try {
      console.log('Searching with RAG:', { query, intent, entities });

      // Generate embedding for the query
      const { data: embeddingData } = await supabase.functions.invoke('generate-embedding', {
        body: { text: query }
      });

      if (!embeddingData?.success) {
        throw new Error('Failed to generate embedding');
      }

      let products = [];

      // Different search strategies based on intent
      switch (intent) {
        case 'compare':
          // For comparison, try to find multiple products
          const { data: compareProducts, error: compareError } = await supabase.rpc('match_products_enhanced', {
            query_embedding: embeddingData.embedding,
            match_threshold: 0.6,
            match_count: 5
          });

          if (compareError) throw compareError;
          products = compareProducts || [];
          break;

        case 'recommend':
          // For recommendations, find similar products to current one
          if (currentProduct) {
            const { data: similarProducts, error: similarError } = await supabase.rpc('find_similar_products', {
              product_id_input: currentProduct.id,
              match_threshold: 0.7,
              match_count: 3
            });

            if (similarError) throw similarError;
            products = similarProducts || [];
          } else {
            // Fallback to general search
            const { data: generalProducts, error: generalError } = await supabase.rpc('match_products_enhanced', {
              query_embedding: embeddingData.embedding,
              match_threshold: 0.7,
              match_count: 3
            });

            if (generalError) throw generalError;
            products = generalProducts || [];
          }
          break;

        default:
          // General search with category filtering if entities detected
          const categoryFilter = entities.find(entity => 
            ['laptop', 'cámara', 'auriculares', 'televisor', 'smartphone'].some(cat => 
              entity.includes(cat) || cat.includes(entity)
            )
          );

          const { data: defaultProducts, error: defaultError } = await supabase.rpc('match_products_enhanced', {
            query_embedding: embeddingData.embedding,
            match_threshold: 0.7,
            match_count: 4,
            category_filter: categoryFilter
          });

          if (defaultError) throw defaultError;
          products = defaultProducts || [];
      }

      if (!products || products.length === 0) {
        return "No encontré productos específicos para tu consulta, pero puedo ayudarte con información general sobre nuestro catálogo.";
      }

      // Format response based on intent
      return formatRAGResponse(products, intent, query, currentProduct);

    } catch (error) {
      console.error('Error in searchProductsWithRAG:', error);
      return `Error al buscar productos: ${error.message}`;
    }
  };

  const formatRAGResponse = (products: any[], intent: string, query: string, currentProduct: Product | null) => {
    switch (intent) {
      case 'compare':
        if (products.length >= 2) {
          const comparison = products.slice(0, 2).map((product, index) => 
            `${index + 1}. ${product.name} - €${product.price} - ${product.description.substring(0, 100)}...`
          ).join('\n\n');
          
          return `Aquí tienes una comparación de productos relevantes:\n\n${comparison}\n\n¿Te gustaría que profundice en alguna característica específica?`;
        }
        break;

      case 'recommend':
        const recommendations = products.map((product, index) => 
          `${index + 1}. ${product.name} - €${product.price} - Similitud: ${(product.similarity * 100).toFixed(1)}%`
        ).join('\n');
        
        return `Basándome en ${currentProduct ? `tu interés en ${currentProduct.name}` : 'tu consulta'}, te recomiendo:\n\n${recommendations}\n\n¿Te interesa alguno de estos productos?`;

      case 'price':
        const priceInfo = products.map(product => 
          `${product.name}: €${product.price}`
        ).join('\n');
        
        return `Información de precios:\n\n${priceInfo}`;

      case 'characteristics':
        if (currentProduct) {
          return `${currentProduct.name} - ${currentProduct.description}\nPrecio: €${currentProduct.price}\nCategoría: ${currentProduct.category || 'General'}`;
        }
        
        const detailed = products[0];
        return `${detailed.name}:\n${detailed.description}\nPrecio: €${detailed.price}\nCategoría: ${detailed.category || 'General'}`;

      default:
        const generalInfo = products.slice(0, 3).map((product, index) => 
          `${index + 1}. ${product.name} - €${product.price}`
        ).join('\n');
        
        return `Productos relacionados con tu consulta:\n\n${generalInfo}\n\n¿Necesitas más información sobre alguno?`;
    }

    return products.map(p => `${p.name} - €${p.price}`).join(', ');
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
      // Enhanced simulation with more realistic queries
      const contextualQuestions = currentProduct ? [
        `¿Qué productos son similares a ${currentProduct.name}?`,
        `¿Cuáles son las características de ${currentProduct.name}?`,
        `¿Hay algo más barato que ${currentProduct.name}?`,
        `Compara ${currentProduct.name} con otros productos`,
        `¿Vale la pena comprar ${currentProduct.name}?`
      ] : [
        "¿Qué productos tienen en oferta?",
        "Busco una cámara buena y barata",
        "¿Cuáles son los mejores laptops?",
        "Necesito auriculares inalámbricos",
        "¿Qué smartphone me recomiendan?"
      ];
      
      const simulatedTranscript = contextualQuestions[Math.floor(Math.random() * contextualQuestions.length)];
      
      setState(prev => ({ 
        ...prev, 
        transcript: simulatedTranscript,
        conversation: [...prev.conversation, {
          role: 'user',
          content: simulatedTranscript,
          timestamp: new Date()
        }]
      }));

      // Process with intent classification and RAG
      await generateEnhancedAIResponse(simulatedTranscript);

    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: "Error de procesamiento",
        description: "No se pudo procesar el audio",
        variant: "destructive",
      });
    }
  };

  const generateEnhancedAIResponse = async (userQuery: string) => {
    try {
      // Classify user intent
      const intentData = await classifyIntent(userQuery);
      console.log('Intent classified:', intentData);

      let response = '';

      // Generate response using RAG
      response = await searchProductsWithRAG(userQuery, intentData.intent, intentData.entities);

      // Add contextual information
      if (currentProduct && intentData.intent !== 'recommend') {
        response += `\n\nActualmente estás viendo: ${currentProduct.name} (€${currentProduct.price})`;
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

      // Enhanced voice synthesis with better Spanish pronunciation
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(response);
        utterance.lang = 'es-ES';
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        
        // Try to use a Spanish voice if available
        const voices = speechSynthesis.getVoices();
        const spanishVoice = voices.find(voice => voice.lang.includes('es'));
        if (spanishVoice) {
          utterance.voice = spanishVoice;
        }
        
        speechSynthesis.speak(utterance);
      }

    } catch (error) {
      console.error('Error generating enhanced AI response:', error);
      
      const errorResponse = "Disculpa, hubo un problema procesando tu consulta. ¿Podrías intentar de nuevo?";
      
      setState(prev => ({
        ...prev,
        conversation: [...prev.conversation, {
          role: 'assistant',
          content: errorResponse,
          timestamp: new Date()
        }],
        transcript: ''
      }));
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
