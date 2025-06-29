
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Star, TrendingUp, Users, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/useCart";
import { useNavigate } from "react-router-dom";
import CartIcon from "@/components/CartIcon";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  category: string | null;
}

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { addToCart, isLoading: cartLoading } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      console.log('Fetching products...');
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los productos",
          variant: "destructive",
        });
        return;
      }

      console.log('Products fetched:', data);
      setProducts(data || []);
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "Error inesperado al cargar los productos",
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
      return 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop';
    }
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    return `https://images.unsplash.com/${imageUrl}?w=400&h=300&fit=crop`;
  };

  const handleAddToCart = async (productId: string) => {
    await addToCart(productId, 1);
  };

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-32 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-80 bg-gray-300 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6 bg-[#ffd300]">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Tech Market</h1>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={() => navigate('/admin')}
                className="flex items-center space-x-2"
              >
                <TrendingUp className="h-4 w-4" />
                <span>Admin Dashboard</span>
              </Button>
              <CartIcon />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-yellow-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Encuentra la mejor tecnología
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Descubre productos tecnológicos de última generación con precios increíbles
          </p>
          
          {/* Featured Products at the top */}
          {products.length > 0 && (
            <div className="mb-12">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Productos Destacados</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {products.slice(0, 3).map((product) => (
                  <Card key={product.id} className="group hover:shadow-lg transition-all duration-300 cursor-pointer bg-white/90 backdrop-blur-sm">
                    <div className="relative overflow-hidden rounded-t-lg">
                      <img 
                        src={getImageUrl(product.image_url)} 
                        alt={product.name} 
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        onClick={() => handleProductClick(product.id)}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop';
                        }}
                      />
                      {product.category && (
                        <Badge className="absolute top-3 left-3 bg-blue-600 hover:bg-blue-700 text-white">
                          {product.category}
                        </Badge>
                      )}
                    </div>
                    
                    <CardHeader onClick={() => handleProductClick(product.id)} className="pb-2">
                      <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {product.name}
                      </CardTitle>
                    </CardHeader>
                    
                    <CardContent onClick={() => handleProductClick(product.id)} className="pt-0">
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xl font-bold text-blue-600">
                          {formatPrice(product.price)}
                        </span>
                        <div className="flex space-x-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <Star className="h-4 w-4 text-gray-300" />
                        </div>
                      </div>
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product.id);
                        }}
                        disabled={cartLoading}
                        className="w-full bg-orange-500 hover:bg-orange-400 text-white font-semibold py-2 text-sm"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {cartLoading ? 'Añadiendo...' : 'Añadir al Carrito'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <ShoppingCart className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Productos de Calidad</h3>
                <p className="text-sm text-gray-600">Solo los mejores productos tecnológicos</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <Users className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Miles de Clientes</h3>
                <p className="text-sm text-gray-600">Confianza de usuarios satisfechos</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <MessageSquare className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Soporte 24/7</h3>
                <p className="text-sm text-gray-600">Atención personalizada siempre</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Todos Nuestros Productos</h2>
            <p className="text-xl text-gray-600">Explora nuestra colección completa de productos tecnológicos</p>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-500 mb-2">No hay productos disponibles</h3>
              <p className="text-gray-400">Vuelve más tarde para ver nuevos productos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <Card key={product.id} className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg">
                  <div className="relative overflow-hidden rounded-t-lg">
                    <img 
                      src={getImageUrl(product.image_url)} 
                      alt={product.name} 
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                      onClick={() => handleProductClick(product.id)}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop';
                      }}
                    />
                    {product.category && (
                      <Badge className="absolute top-3 left-3 bg-blue-600 hover:bg-blue-700 text-white">
                        {product.category}
                      </Badge>
                    )}
                    <div className="absolute top-3 right-3 flex space-x-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <Star className="h-4 w-4 text-gray-300" />
                    </div>
                  </div>
                  
                  <CardHeader onClick={() => handleProductClick(product.id)}>
                    <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent onClick={() => handleProductClick(product.id)}>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-blue-600">
                        {formatPrice(product.price)}
                      </span>
                    </div>
                  </CardContent>
                  
                  <div className="px-6 pb-6">
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product.id);
                      }}
                      disabled={cartLoading}
                      className="w-full bg-orange-500 hover:bg-orange-400 text-white font-semibold py-2"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {cartLoading ? 'Añadiendo...' : 'Añadir al Carrito'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Index;
