
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: {
    name: string;
    price: number;
    image_url: string | null;
  };
}

export const useCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Generate or get session ID
  const getSessionId = () => {
    let sessionId = localStorage.getItem('cart_session_id');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('cart_session_id', sessionId);
    }
    return sessionId;
  };

  const sessionId = getSessionId();

  // Load cart items
  const loadCart = async () => {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          product_id,
          quantity,
          products (
            name,
            price,
            image_url
          )
        `)
        .eq('session_id', sessionId);

      if (error) {
        console.error('Error loading cart:', error);
        return;
      }

      const formattedItems = data?.map(item => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        product: {
          name: item.products?.name || '',
          price: item.products?.price || 0,
          image_url: item.products?.image_url || null
        }
      })) || [];

      setCartItems(formattedItems);
      setTotalItems(formattedItems.reduce((sum, item) => sum + item.quantity, 0));
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  // Add item to cart
  const addToCart = async (productId: string, quantity: number = 1) => {
    setIsLoading(true);
    try {
      // Check if item already exists
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('session_id', sessionId)
        .eq('product_id', productId)
        .maybeSingle();

      if (existingItem) {
        // Update existing item
        const { error } = await supabase
          .from('cart_items')
          .update({ 
            quantity: existingItem.quantity + quantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingItem.id);

        if (error) throw error;
      } else {
        // Add new item
        const { error } = await supabase
          .from('cart_items')
          .insert({
            session_id: sessionId,
            product_id: productId,
            quantity
          });

        if (error) throw error;
      }

      await loadCart();
      
      toast({
        title: "Producto añadido",
        description: "El producto se ha añadido al carrito correctamente"
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "No se pudo añadir el producto al carrito",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Remove item from cart
  const removeFromCart = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      await loadCart();
      
      toast({
        title: "Producto eliminado",
        description: "El producto se ha eliminado del carrito"
      });
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto del carrito",
        variant: "destructive"
      });
    }
  };

  // Update quantity
  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ 
          quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) throw error;

      await loadCart();
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  // Clear cart
  const clearCart = async () => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('session_id', sessionId);

      if (error) throw error;

      setCartItems([]);
      setTotalItems(0);
      
      toast({
        title: "Carrito limpiado",
        description: "Se han eliminado todos los productos del carrito"
      });
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  return {
    cartItems,
    totalItems,
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    loadCart
  };
};
