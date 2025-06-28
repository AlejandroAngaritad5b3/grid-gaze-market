import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ArrowLeft, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/useCart";
import EnhancedVoiceAgent from "@/components/EnhancedVoiceAgent";
import CartIcon from "@/components/CartIcon";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  category: string | null;
}

const ProductDetail = () => {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const {
    toast
  } = useToast();
  const { addToCart, isLoading: cartLoading } = useCart();

  useEffect(() => {
    if (id) {
      fetchProduct(id);
    }
  }, [id]);
  const fetchProduct = async (productId: string) => {
    try {
      console.log('Fetching product with ID:', productId);
      const {
        data,
        error
      } = await supabase.from('products').select('*').eq('id', productId).maybeSingle();
      if (error) {
        console.error('Error fetching product:', error);
        toast({
          title: "Error",
          description: "No se pudo cargar el producto",
          variant: "destructive"
        });
        return;
      }
      if (!data) {
        toast({
          title: "Producto no encontrado",
          description: "El producto que buscas no existe",
          variant: "destructive"
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
        variant: "destructive"
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
  const handleAddToCart = async () => {
    if (!product) return;
    
    await addToCart(product.id, 1);
  };

  const handleBuyNow = async () => {
    if (!product) return;
    
    await addToCart(product.id, 1);
    // Here you could navigate to checkout page
    toast({
      title: "Producto añadido",
      description: "Producto añadido al carrito. Redirigiendo al checkout...",
    });
  };

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
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
      </div>;
  }
  if (!product) {
    return null;
  }
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6 bg-[#ffd300]">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/')} className="flex items-center space-x-2 bg-yellow-400 hover:bg-yellow-300">
              <ArrowLeft className="h-4 w-4" />
              <span>Volver al catálogo</span>
            </Button>
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Tech Market</h1>
              <CartIcon />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 bg-yellow-50">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Image */}
          <div className="lg:col-span-1">
            <Card className="overflow-hidden shadow-lg">
              <div className="relative">
                <img src={getImageUrl(product.image_url)} alt={product.name} className="w-full h-96 lg:h-[500px] object-cover" onError={e => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop';
              }} />
                {product.category && <Badge className="absolute top-4 left-4 bg-blue-600 hover:bg-blue-700 text-white">
                    {product.category}
                  </Badge>}
              </div>
            </Card>
          </div>

          {/* Product Details */}
          <div className="lg:col-span-1 space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
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
              <p className="text-gray-700 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Add to Cart Button */}
            <div className="space-y-4">
              <Button 
                onClick={handleAddToCart} 
                disabled={cartLoading}
                size="lg" 
                className="w-full text-white py-3 text-lg font-semibold bg-orange-500 hover:bg-orange-400 disabled:opacity-50"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {cartLoading ? 'Añadiendo...' : 'Añadir al Carrito'}
              </Button>
              
              <Button 
                onClick={handleBuyNow}
                disabled={cartLoading}
                variant="outline" 
                size="lg" 
                className="w-full py-3 text-lg font-semibold bg-blue-700 text-white hover:bg-blue-600 disabled:opacity-50"
              >
                {cartLoading ? 'Procesando...' : 'Comprar Ahora'}
              </Button>
            </div>

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

          {/* Enhanced Voice AI Agent */}
          <div className="lg:col-span-1">
            <EnhancedVoiceAgent product={product} />
          </div>
        </div>
      </div>
    </div>;
};

export default ProductDetail;
