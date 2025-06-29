
import { Button } from "@/components/ui/button";
import { ShoppingCart, Star } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  category: string | null;
}

interface ProductInfoProps {
  product: Product;
  cartLoading: boolean;
  onAddToCart: () => void;
  onBuyNow: () => void;
  formatPrice: (price: number) => string;
}

const ProductInfo = ({ 
  product, 
  cartLoading, 
  onAddToCart, 
  onBuyNow, 
  formatPrice 
}: ProductInfoProps) => {
  return (
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
          onClick={onAddToCart} 
          disabled={cartLoading}
          size="lg" 
          className="w-full text-white py-3 text-lg font-semibold bg-orange-500 hover:bg-orange-400 disabled:opacity-50"
        >
          <ShoppingCart className="h-5 w-5 mr-2" />
          {cartLoading ? 'Añadiendo...' : 'Añadir al Carrito'}
        </Button>
        
        <Button 
          onClick={onBuyNow}
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
  );
};

export default ProductInfo;
