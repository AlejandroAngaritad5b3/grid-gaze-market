
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ArrowLeft, Star, Mic, MicOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  category: string | null;
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchProduct(id);
    }
  }, [id]);

  const fetchProduct = async (productId: string) => {
    try {
      console.log('Fetching product with ID:', productId);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching product:', error);
        toast({
          title: "Error",
          description: "No se pudo cargar el producto",
          variant: "destructive",
        });
        return;
      }

      if (!data) {
        toast({
          title: "Producto no encontrado",
          description: "El producto que buscas no existe",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      console.log('Product fetched:', data);
      setProduct(data);
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "Error inesperado al cargar el producto",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const getImageUrl = (imageUrl: string | null) => {
    if (!imageUrl) {
      return 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop';
    }
    
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    return `https://images.unsplash.com/${imageUrl}?w=800&h=600&fit=crop`;
  };

  const handleAddToCart = () => {
    toast({
      title: "Producto añadido",
      description: `${product?.name} se ha añadido al carrito`,
    });
  };

  const toggleVoiceAgent = () => {
    setIsListening(!isListening);
    toast({
      title: isListening ? "Agente de voz desactivado" : "Agente de voz activado",
      description: isListening ? "El agente de voz está ahora inactivo" : "El agente de voz está ahora escuchando",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-32 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="h-96 bg-gray-300 rounded-xl"></div>
              <div className="space-y-6">
                <div className="h-8 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
                <div className="h-8 bg-gray-300 rounded w-1/3"></div>
                <div className="h-12 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Volver al catálogo</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">GridGaze Market</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="space-y-4">
            <Card className="overflow-hidden shadow-lg">
              <div className="relative">
                <img
                  src={getImageUrl(product.image_url)}
                  alt={product.name}
                  className="w-full h-96 lg:h-[500px] object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop';
                  }}
                />
                {product.category && (
                  <Badge className="absolute top-4 left-4 bg-blue-600 hover:bg-blue-700 text-white">
                    {product.category}
                  </Badge>
                )}
              </div>
            </Card>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                {product.name}
              </h1>
              <div className="flex items-center space-x-4 mb-6">
                <span className="text-3xl font-bold text-blue-600">
                  {formatPrice(product.price)}
                </span>
                <div className="flex items-center space-x-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <Star className="h-5 w-5 text-gray-300" />
                  <span className="text-sm text-gray-600 ml-2">(4.5)</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Descripción</h3>
              <p className="text-gray-700 leading-relaxed text-lg">
                {product.description}
              </p>
            </div>

            {/* Add to Cart Button */}
            <div className="space-y-4">
              <Button 
                onClick={handleAddToCart}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold"
                size="lg"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Añadir al Carrito
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full py-3 text-lg font-semibold"
                size="lg"
              >
                Comprar Ahora
              </Button>
            </div>

            {/* Voice AI Agent Section */}
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Asistente de Voz AI
                  </h3>
                  <Button
                    onClick={toggleVoiceAgent}
                    variant={isListening ? "destructive" : "default"}
                    size="sm"
                    className={isListening ? "bg-red-500 hover:bg-red-600" : "bg-purple-600 hover:bg-purple-700"}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-gray-700 text-sm mb-4">
                  {isListening 
                    ? "🎤 Escuchando... Hazme cualquier pregunta sobre este producto"
                    : "Activa el asistente de voz para hacer preguntas sobre este producto"
                  }
                </p>
                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <p className="text-sm text-gray-600 italic">
                    {isListening 
                      ? "Asistente activado. Puedes preguntarme sobre características, compatibilidad, garantía, etc."
                      : "Haz clic en el micrófono para activar el asistente de voz inteligente"
                    }
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Additional Product Info */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-200">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Envío</h4>
                <p className="text-sm text-gray-600">Envío gratuito en 24-48h</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Garantía</h4>
                <p className="text-sm text-gray-600">2 años de garantía oficial</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Devoluciones</h4>
                <p className="text-sm text-gray-600">30 días sin preguntas</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Soporte</h4>
                <p className="text-sm text-gray-600">Atención 24/7</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
