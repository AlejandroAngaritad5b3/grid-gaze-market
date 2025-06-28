
import { useState, useEffect } from 'react';
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

interface RecommendedProduct extends Product {
  similarity: number;
  reason: string;
}

export const useProductRecommendations = (currentProductId?: string) => {
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateRecommendations = async (productId: string) => {
    setIsLoading(true);
    try {
      console.log('Generating recommendations for product:', productId);

      // Get similar products using embeddings
      const { data: similarProducts, error } = await supabase.rpc('find_similar_products', {
        product_id_input: productId,
        match_threshold: 0.6,
        match_count: 4
      });

      if (error) {
        console.error('Error finding similar products:', error);
        throw error;
      }

      if (!similarProducts || similarProducts.length === 0) {
        setRecommendations([]);
        return;
      }

      // Enhance recommendations with AI-generated reasons
      const enhancedRecommendations = await Promise.all(
        similarProducts.map(async (product: any) => {
          const reason = generateRecommendationReason(product.similarity, product.category);
          return {
            ...product,
            reason
          };
        })
      );

      setRecommendations(enhancedRecommendations);
      console.log('Generated recommendations:', enhancedRecommendations);

    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast({
        title: "Error en recomendaciones",
        description: "No se pudieron generar recomendaciones para este producto",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateRecommendationReason = (similarity: number, category: string | null): string => {
    const similarityPercentage = Math.round(similarity * 100);
    
    const reasons = [
      `${similarityPercentage}% de similitud - Características muy parecidas`,
      `Alternativa popular en ${category || 'esta categoría'}`,
      `Mejor relación calidad-precio con ${similarityPercentage}% de similitud`,
      `Funcionalidades similares con ventajas adicionales`,
      `Opción recomendada por similitud del ${similarityPercentage}%`
    ];

    if (similarity > 0.8) {
      return `🌟 ${reasons[0]}`;
    } else if (similarity > 0.7) {
      return `⭐ ${reasons[1]}`;
    } else {
      return `💡 ${reasons[2]}`;
    }
  };

  useEffect(() => {
    if (currentProductId) {
      generateRecommendations(currentProductId);
    }
  }, [currentProductId]);

  return {
    recommendations,
    isLoading,
    generateRecommendations
  };
};
