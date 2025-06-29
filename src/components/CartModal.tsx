
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Plus, Minus, X, Trash2 } from "lucide-react";
import { useCart } from "@/hooks/useCart";

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartModal = ({ isOpen, onClose }: CartModalProps) => {
  const { cartItems, removeFromCart, updateQuantity, clearCart, totalItems } = useCart();

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5" />
            <span>Mi Carrito</span>
            <Badge variant="secondary">{totalItems} productos</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-full">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Tu carrito está vacío
              </h3>
              <p className="text-gray-500 mb-4">
                Agrega algunos productos para comenzar tu compra
              </p>
              <Button onClick={onClose} variant="outline">
                Continuar comprando
              </Button>
            </div>
          ) : (
            <>
              {/* Lista de productos */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-96">
                {cartItems.map((item) => (
                  <Card key={item.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        {/* Imagen del producto */}
                        <div className="flex-shrink-0">
                          <img
                            src={getImageUrl(item.product.image_url)}
                            alt={item.product.name}
                            className="w-16 h-16 object-cover rounded-lg"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=200&fit=crop';
                            }}
                          />
                        </div>

                        {/* Información del producto */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-semibold text-gray-900 truncate">
                            {item.product.name}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {formatPrice(item.product.price)} por unidad
                          </p>
                          
                          {/* Controles de cantidad */}
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                className="h-8 w-8 p-0"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="text-sm font-medium min-w-[2rem] text-center">
                                {item.quantity}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                className="h-8 w-8 p-0"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <span className="text-sm text-gray-500">
                              Subtotal: {formatPrice(item.product.price * item.quantity)}
                            </span>
                          </div>
                        </div>

                        {/* Botón eliminar */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Resumen y acciones */}
              <div className="border-t pt-4 mt-4 space-y-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total:</span>
                  <span className="text-blue-600">{formatPrice(calculateTotal())}</span>
                </div>
                
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={clearCart}
                    className="flex items-center space-x-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Vaciar carrito</span>
                  </Button>
                  
                  <Button 
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      // Aquí implementarías la lógica de checkout
                      console.log('Procesando compra...');
                    }}
                  >
                    Proceder al pago
                  </Button>
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
