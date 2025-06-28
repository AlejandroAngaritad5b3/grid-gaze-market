
import { useState } from 'react';

export interface UserIntent {
  intent: 'compare' | 'recommend' | 'buy' | 'characteristics' | 'price' | 'general';
  entities: string[];
  confidence: number;
}

export const useIntentClassification = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const classifyIntent = async (userQuery: string): Promise<UserIntent> => {
    setIsProcessing(true);
    
    try {
      const query = userQuery.toLowerCase();
      
      // Intent patterns
      const intentPatterns = {
        compare: ['diferencia', 'comparar', 'versus', 'vs', 'mejor que', 'cuál es mejor'],
        recommend: ['recomienda', 'sugerir', 'alternativa', 'similar', 'parecido', 'qué me recomiendas'],
        buy: ['comprar', 'precio', 'cuesta', 'vale', 'coste', 'añadir al carrito'],
        characteristics: ['características', 'especificaciones', 'detalles', 'información', 'qué tiene'],
        price: ['precio', 'cuesta', 'vale', 'coste', 'barato', 'caro', 'oferta']
      };

      // Determine intent
      let detectedIntent: UserIntent['intent'] = 'general';
      let maxMatches = 0;

      for (const [intent, patterns] of Object.entries(intentPatterns)) {
        const matches = patterns.filter(pattern => query.includes(pattern)).length;
        if (matches > maxMatches) {
          maxMatches = matches;
          detectedIntent = intent as UserIntent['intent'];
        }
      }

      // Extract entities (product names, brands, categories)
      const entities: string[] = [];
      
      // Common product categories and brands
      const productTerms = [
        'iphone', 'samsung', 'xiaomi', 'huawei', 'google pixel',
        'laptop', 'macbook', 'dell', 'hp', 'lenovo', 'asus',
        'cámara', 'canon', 'nikon', 'sony', 'gopro',
        'auriculares', 'airpods', 'beats', 'bose',
        'televisor', 'tv', 'lg', 'panasonic', 'tcl'
      ];

      productTerms.forEach(term => {
        if (query.includes(term)) {
          entities.push(term);
        }
      });

      // Calculate confidence based on pattern matches and entity extraction
      const confidence = Math.min(0.9, (maxMatches * 0.3) + (entities.length * 0.2) + 0.3);

      return {
        intent: detectedIntent,
        entities,
        confidence
      };
    } catch (error) {
      console.error('Error classifying intent:', error);
      return {
        intent: 'general',
        entities: [],
        confidence: 0.1
      };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    classifyIntent,
    isProcessing
  };
};
