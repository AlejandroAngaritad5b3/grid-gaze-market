
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/useCart";
import IntegratedAssistant from "@/components/IntegratedAssistant";
import DynamicRecommendations from "@/components/DynamicRecommendations";
import ProductHeader from "@/components/ProductHeader";
import ProductImage from "@/components/ProductImage";
import ProductInfo from "@/components/ProductInfo";
import ProductLoadingSkeleton from "@/components/ProductLoadingSkeleton";

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
  const { toast } = useToast();
  const { addToCart, isLoading: cartLoading } = useCart();

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

  const handleAddToCart = async () => {
    if (!product) return;
    await addToCart(product.id, 1);
  };

  const handleBuyNow = async () => {
    if (!product) return;
    await addToCart(product.id, 1);
    toast({
      title: "Producto añadido",
      description: "Redirigiendo al checkout...",
    });
    navigate('/checkout');
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop';
  };

  if (loading) {
    return <ProductLoadingSkeleton />;
  }

  if (!product) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <ProductHeader />

      <div className="container mx-auto px-4 py-12 bg-yellow-50">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <ProductImage
            imageUrl={product.image_url}
            productName={product.name}
            category={product.category}
            onImageError={handleImageError}
            getImageUrl={getImageUrl}
          />

          <ProductInfo
            product={product}
            cartLoading={cartLoading}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            formatPrice={formatPrice}
          />

          <div className="lg:col-span-1">
            <DynamicRecommendations currentProduct={product} />
          </div>

          <div className="lg:col-span-1">
            <IntegratedAssistant product={product} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
