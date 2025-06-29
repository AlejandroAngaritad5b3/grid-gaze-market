
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
      console.log('Loading cart for session:', sessionId);
      
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
        toast({
          title: "Error",
          description: "No se pudo cargar el carrito",
          variant: "destructive"
        });
        return;
      }

      console.log('Raw cart data:', data);

      const formattedItems = data?.map(item => {
        console.log('Processing cart item:', item);
        return {
          id: item.id,
          product_id: item.product_id,
          quantity: item.quantity,
          product: {
            name: item.products?.name || 'Producto sin nombre',
            price: Number(item.products?.price) || 0,
            image_url: item.products?.image_url || null
          }
        };
      }) || [];

      console.log('Formatted cart items:', formattedItems);
      setCartItems(formattedItems);
      setTotalItems(formattedItems.reduce((sum, item) => sum + item.quantity, 0));
    } catch (error) {
      console.error('Error loading cart:', error);
      toast({
        title: "Error",
        description: "Error al cargar el carrito",
        variant: "destructive"
      });
    }
  };

  // Add item to cart
  const addToCart = async (productId: string, quantity: number = 1) => {
    setIsLoading(true);
    console.log('Adding to cart:', { productId, quantity, sessionId });
    
    try {
      // First check if product exists
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name, price')
        .eq('id', productId)
        .single();

      if (productError || !product) {
        console.error('Product not found:', productError);
        throw new Error('Producto no encontrado');
      }

      console.log('Product found:', product);

      // Check if item already exists in cart
      const { data: existingItem, error: checkError } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('session_id', sessionId)
        .eq('product_id', productId)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing item:', checkError);
        throw checkError;
      }

      console.log('Existing item check:', existingItem);

      if (existingItem) {
        console.log('Updating existing item');
        // Update existing item
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({ 
            quantity: existingItem.quantity + quantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingItem.id);

        if (updateError) {
          console.error('Error updating cart item:', updateError);
          throw updateError;
        }
      } else {
        console.log('Adding new item');
        // Add new item
        const { error: insertError } = await supabase
          .from('cart_items')
          .insert({
            session_id: sessionId,
            product_id: productId,
            quantity
          });

        if (insertError) {
          console.error('Error inserting cart item:', insertError);
          throw insertError;
        }
      }

      // Reload cart to get updated data
      await loadCart();
      
      toast({
        title: "Producto añadido",
        description: `${product.name} se ha añadido al carrito`
      });
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo añadir el producto al carrito",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Remove item from cart
  const removeFromCart = async (itemId: string) => {
    try {
      console.log('Removing item from cart:', itemId);
      
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('Error removing from cart:', error);
        throw error;
      }

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
      console.log('Updating quantity:', { itemId, quantity });
      
      const { error } = await supabase
        .from('cart_items')
        .update({ 
          quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) {
        console.error('Error updating quantity:', error);
        throw error;
      }

      await loadCart();
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la cantidad",
        variant: "destructive"
      });
    }
  };

  // Clear cart
  const clearCart = async () => {
    try {
      console.log('Clearing cart for session:', sessionId);
      
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('session_id', sessionId);

      if (error) {
        console.error('Error clearing cart:', error);
        throw error;
      }

      setCartItems([]);
      setTotalItems(0);
      
      toast({
        title: "Carrito limpiado",
        description: "Se han eliminado todos los productos del carrito"
      });
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast({
        title: "Error",
        description: "No se pudo limpiar el carrito",
        variant: "destructive"
      });
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
