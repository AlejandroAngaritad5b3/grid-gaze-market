
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, ArrowRight } from "lucide-react";
import { useProductRecommendations } from "@/hooks/useProductRecommendations";
import { useNavigate } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  category: string | null;
}

interface DynamicRecommendationsProps {
  currentProduct: Product;
}

const DynamicRecommendations = ({ currentProduct }: DynamicRecommendationsProps) => {
  const { recommendations, isLoading } = useProductRecommendations(currentProduct.id);
  const navigate = useNavigate();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const getImageUrl = (imageUrl: string | null) => {
    if (!imageUrl) {
      return 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop';
    }
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    return `https://images.unsplash.com/${imageUrl}?w=400&h=300&fit=crop`;
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-800">
            <Sparkles className="h-5 w-5" />
            <span>Generando recomendaciones...</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex space-x-4">
                <div className="w-20 h-20 bg-gray-300 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-600">
            <Sparkles className="h-5 w-5" />
            <span>Recomendaciones</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">
            No se encontraron productos similares en este momento.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-blue-800">
          <Sparkles className="h-5 w-5" />
          <span>Recomendaciones Inteligentes</span>
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            <TrendingUp className="h-3 w-3 mr-1" />
            IA + RAG
          </Badge>
        </CardTitle>
        <p className="text-sm text-blue-600">
          Basadas en análisis semántico y similitud de embeddings
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {recommendations.map((product) => (
          <div key={product.id} className="bg-white rounded-lg p-4 border border-blue-100 hover:shadow-md transition-shadow">
            <div className="flex space-x-4">
              <img
                src={getImageUrl(product.image_url)}
                alt={product.name}
                className="w-20 h-20 object-cover rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop';
                }}
              />
              
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 truncate">
                  {product.name}
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  {formatPrice(product.price)}
                </p>
                <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full inline-block mb-2">
                  {product.reason}
                </p>
                <p className="text-xs text-gray-500 line-clamp-2">
                  {product.description.substring(0, 100)}...
                </p>
              </div>
              
              <div className="flex flex-col justify-between">
                <Badge 
                  variant="outline" 
                  className="text-xs mb-2"
                >
                  {Math.round(product.similarity * 100)}% similar
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/product/${product.id}`)}
                  className="text-xs"
                >
                  Ver <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        
        <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
          <p className="text-xs text-purple-700 text-center">
            💡 Estas recomendaciones se generan usando IA y análisis semántico de productos
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DynamicRecommendations;
