
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  category: string | null;
}

interface RAGResponse {
  response: string;
  context?: any;
  success: boolean;
  error?: string;
}

export const useLocalRAGAgent = (currentProduct: Product | null) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const queryRAGAgent = async (query: string): Promise<string> => {
    setIsLoading(true);
    
    try {
      // Preparar contexto del producto actual
      const productContext = currentProduct ? {
        id: currentProduct.id,
        name: currentProduct.name,
        description: currentProduct.description,
        price: currentProduct.price,
        category: currentProduct.category
      } : null;

      console.log('Enviando consulta al agente RAG:', { query, productContext });

      const response = await fetch('http://localhost:8501/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          product_context: productContext,
          use_voice: true
        })
      });

      if (!response.ok) {
        throw new Error(`Error del servidor RAG: ${response.status} - ${response.statusText}`);
      }

      const data: RAGResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Error desconocido del agente RAG');
      }

      console.log('Respuesta del agente RAG:', data);
      return data.response;

    } catch (error) {
      console.error('Error consultando agente RAG:', error);
      
      // Fallback si el agente local no está disponible
      if (error instanceof TypeError && error.message.includes('fetch')) {
        toast({
          title: "Agente RAG no disponible",
          description: "El servidor local en puerto 8501 no está accesible. Usando respuesta básica.",
          variant: "destructive",
        });
        
        return generateFallbackResponse(query, currentProduct);
      }
      
      toast({
        title: "Error en consulta RAG",
        description: error.message,
        variant: "destructive",
      });
      
      return "Lo siento, hubo un problema procesando tu consulta. ¿Podrías intentar de nuevo?";
    } finally {
      setIsLoading(false);
    }
  };

  const generateFallbackResponse = (query: string, product: Product | null): string => {
    if (!product) {
      return "Lo siento, no tengo información específica disponible en este momento.";
    }

    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('precio') || lowerQuery.includes('cuesta') || lowerQuery.includes('vale')) {
      return `El precio de ${product.name} es €${product.price}.`;
    }
    
    if (lowerQuery.includes('características') || lowerQuery.includes('detalles') || lowerQuery.includes('información')) {
      return `${product.name}: ${product.description}. Precio: €${product.price}. Categoría: ${product.category || 'General'}.`;
    }
    
    if (lowerQuery.includes('recomienda') || lowerQuery.includes('similar') || lowerQuery.includes('alternativa')) {
      return `Te recomiendo considerar ${product.name} que cuesta €${product.price}. Es una excelente opción en la categoría ${product.category || 'general'}.`;
    }
    
    return `Sobre ${product.name}: ${product.description}. ¿Te gustaría saber algo específico?`;
  };

  return {
    queryRAGAgent,
    isLoading
  };
};
