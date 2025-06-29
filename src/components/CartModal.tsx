
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Plus, Minus, X, Trash2, AlertCircle } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useNavigate } from "react-router-dom";

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartModal = ({ isOpen, onClose }: CartModalProps) => {
  const { cartItems, removeFromCart, updateQuantity, clearCart, totalItems, isLoading } = useCart();
  const navigate = useNavigate();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const getImageUrl = (imageUrl: string | null) => {
    if (!imageUrl) {
      return 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=200&fit=crop';
    }
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    return `https://images.unsplash.com/${imageUrl}?w=300&h=200&fit=crop`;
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  const handleBuyNow = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center space-x-2 text-xl">
            <ShoppingCart className="h-6 w-6" />
            <span>Mi Carrito de Compras</span>
            <Badge variant="secondary" className="ml-2">
              {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
            </Badge>
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 ml-2"></div>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-full">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-gray-50 rounded-lg">
              <ShoppingCart className="h-20 w-20 text-gray-300 mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Tu carrito está vacío
              </h3>
              <p className="text-gray-500 mb-6 max-w-md">
                Explora nuestros productos y agrega algunos artículos para comenzar tu compra
              </p>
              <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700">
                Continuar comprando
              </Button>
            </div>
          ) : (
            <>
              {/* Lista de productos */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-96 mb-6">
                {cartItems.map((item) => (
                  <Card key={item.id} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        {/* Imagen del producto */}
                        <div className="flex-shrink-0">
                          <img
                            src={getImageUrl(item.product.image_url)}
                            alt={item.product.name}
                            className="w-20 h-20 object-cover rounded-lg border"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=200&fit=crop';
                            }}
                          />
                        </div>

                        {/* Información del producto */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-semibold text-gray-900 truncate mb-1">
                            {item.product.name || 'Producto sin nombre'}
                          </h4>
                          <p className="text-sm text-gray-600 mb-3">
                            Precio unitario: {formatPrice(item.product.price)}
                          </p>
                          
                          {/* Controles de cantidad */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                  className="h-8 w-8 p-0 hover:bg-gray-200"
                                  disabled={isLoading}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="text-sm font-medium min-w-[3rem] text-center bg-white px-2 py-1 rounded">
                                  {item.quantity}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                  className="h-8 w-8 p-0 hover:bg-gray-200"
                                  disabled={isLoading}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              <div className="text-sm">
                                <span className="text-gray-500">Subtotal: </span>
                                <span className="font-semibold text-blue-600">
                                  {formatPrice(item.product.price * item.quantity)}
                                </span>
                              </div>
                            </div>

                            {/* Botón eliminar */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeFromCart(item.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              disabled={isLoading}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Resumen y acciones */}
              <div className="border-t pt-6 bg-gray-50 -mx-6 px-6 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">Total de productos: {totalItems}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      Total: <span className="text-blue-600">{formatPrice(calculateTotal())}</span>
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={clearCart}
                    className="flex items-center space-x-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Vaciar carrito</span>
                  </Button>
                  
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleBuyNow}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Procesando...' : 'Comprar'}
                  </Button>
                </div>

                {/* Debug info */}
                <div className="text-xs text-gray-400 bg-white p-2 rounded border">
                  <div className="flex items-center space-x-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>Debug: {cartItems.length} items cargados desde la base de datos</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CartModal;
