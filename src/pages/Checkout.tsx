
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CreditCard, Lock, Mail } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    address: '',
    city: '',
    postalCode: ''
  });

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Validación básica
    if (!formData.email || !formData.cardNumber || !formData.expiryDate || !formData.cvv || !formData.cardholderName) {
      toast({
        title: "Error",
        description: "Por favor, completa todos los campos obligatorios",
        variant: "destructive"
      });
      setIsProcessing(false);
      return;
    }

    // Simular procesamiento de pago
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Limpiar carrito
      await clearCart();
      
      toast({
        title: "¡Pago exitoso!",
        description: "Tu pedido ha sido procesado correctamente",
      });

      // Redirigir a página de confirmación o home
      navigate('/', { replace: true });
    } catch (error) {
      toast({
        title: "Error en el pago",
        description: "Hubo un problema procesando tu pago. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="container mx-auto max-w-2xl">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Tu carrito está vacío</h2>
              <p className="text-gray-600 mb-6">No tienes productos para procesar el pago</p>
              <Button onClick={() => navigate('/')}>
                Volver a la tienda
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver</span>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 ml-4">Finalizar Compra</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario de pago */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Información de Pago</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email */}
                  <div>
                    <Label htmlFor="email" className="flex items-center space-x-2 mb-2">
                      <Mail className="h-4 w-4" />
                      <span>Correo Electrónico *</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="tu@email.com"
                      required
                    />
                  </div>

                  {/* Información de la tarjeta */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Datos de la Tarjeta</h3>
                    
                    <div>
                      <Label htmlFor="cardholderName">Nombre del Titular *</Label>
                      <Input
                        id="cardholderName"
                        value={formData.cardholderName}
                        onChange={(e) => handleInputChange('cardholderName', e.target.value)}
                        placeholder="Nombre como aparece en la tarjeta"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="cardNumber">Número de Tarjeta *</Label>
                      <Input
                        id="cardNumber"
                        value={formData.cardNumber}
                        onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiryDate">Fecha de Vencimiento *</Label>
                        <Input
                          id="expiryDate"
                          value={formData.expiryDate}
                          onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                          placeholder="MM/AA"
                          maxLength={5}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="cvv">CVV *</Label>
                        <Input
                          id="cvv"
                          value={formData.cvv}
                          onChange={(e) => handleInputChange('cvv', e.target.value)}
                          placeholder="123"
                          maxLength={4}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dirección de facturación */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Dirección de Facturación</h3>
                    
                    <div>
                      <Label htmlFor="address">Dirección</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder="Calle, número, piso, etc."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">Ciudad</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          placeholder="Madrid"
                        />
                      </div>
                      <div>
                        <Label htmlFor="postalCode">Código Postal</Label>
                        <Input
                          id="postalCode"
                          value={formData.postalCode}
                          onChange={(e) => handleInputChange('postalCode', e.target.value)}
                          placeholder="28001"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Botón de pago */}
                  <Button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-semibold"
                  >
                    <Lock className="h-5 w-5 mr-2" />
                    {isProcessing ? 'Procesando Pago...' : `Confirmar Pago - ${formatPrice(calculateTotal())}`}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Resumen del pedido */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Resumen del Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.product.name}</p>
                      <p className="text-gray-500 text-xs">Cantidad: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-sm">
                      {formatPrice(item.product.price * item.quantity)}
                    </p>
                  </div>
                ))}
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-blue-600">{formatPrice(calculateTotal())}</span>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
                  <div className="flex items-center space-x-2 mb-2">
                    <Lock className="h-4 w-4" />
                    <span className="font-medium">Pago Seguro</span>
                  </div>
                  <p>Tu información está protegida con encriptación SSL</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
