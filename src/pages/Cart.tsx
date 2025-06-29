
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Plus, Minus, X, Trash2, ArrowLeft } from "lucide-react";
import { useCart } from "@/hooks/useCart";

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateQuantity, clearCart, totalItems, isLoading } = useCart();

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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Volver</span>
            </Button>
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Mi Carrito</h1>
              <Badge variant="secondary" className="ml-2">
                {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
              </Badge>
            </div>
          </div>
          {isLoading && (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          )}
        </div>

        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-lg shadow-sm">
            <ShoppingCart className="h-24 w-24 text-gray-300 mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              Tu carrito está vacío
            </h2>
            <p className="text-gray-500 mb-8 max-w-md">
              Explora nuestros productos y agrega algunos artículos para comenzar tu compra
            </p>
            <Button onClick={() => navigate('/')} className="bg-blue-600 hover:bg-blue-700">
              Continuar comprando
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Lista de productos */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-6">
                      {/* Imagen del producto */}
                      <div className="flex-shrink-0">
                        <img
                          src={getImageUrl(item.product.image_url)}
                          alt={item.product.name}
                          className="w-24 h-24 object-cover rounded-lg border"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=200&fit=crop';
                          }}
                        />
                      </div>

                      {/* Información del producto */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {item.product.name || 'Producto sin nombre'}
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Precio unitario: {formatPrice(item.product.price)}
                        </p>
                        
                        {/* Controles de cantidad */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
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
                              <span className="text-lg font-medium min-w-[3rem] text-center bg-white px-3 py-1 rounded">
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
                            
                            <div className="text-lg">
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
                            <X className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Resumen del pedido */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-6">Resumen del pedido</h2>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-gray-600">
                      <span>Productos ({totalItems})</span>
                      <span>{formatPrice(calculateTotal())}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Envío</span>
                      <span>Gratis</span>
                    </div>
                    <hr />
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total</span>
                      <span className="text-blue-600">{formatPrice(calculateTotal())}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                      onClick={() => navigate('/checkout')}
                      disabled={isLoading}
                    >
                      Comprar ({formatPrice(calculateTotal())})
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={clearCart}
                      className="w-full hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Vaciar carrito
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
