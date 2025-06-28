
-- Crear tabla para el carrito de compras
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_cart_items_session_id ON public.cart_items(session_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON public.cart_items(product_id);

-- Crear función para obtener el total de items en el carrito
CREATE OR REPLACE FUNCTION public.get_cart_total(p_session_id TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(quantity) FROM public.cart_items WHERE session_id = p_session_id),
    0
  );
END;
$$;

-- Crear función para limpiar carritos antiguos (más de 7 días)
CREATE OR REPLACE FUNCTION public.cleanup_old_carts()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.cart_items 
  WHERE created_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Mejorar la función match_products para soportar mejores búsquedas RAG
CREATE OR REPLACE FUNCTION public.match_products_enhanced(
  query_embedding extensions.vector, 
  match_threshold double precision DEFAULT 0.5, 
  match_count integer DEFAULT 5,
  category_filter text DEFAULT NULL
)
RETURNS TABLE(
  id uuid, 
  name text, 
  description text, 
  price numeric, 
  image_url text, 
  category text, 
  similarity double precision
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN query
  SELECT
    p.id,
    p.name,
    p.description,
    p.price,
    p.image_url,
    p.category,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM
    products p
  WHERE
    1 - (p.embedding <=> query_embedding) > match_threshold
    AND (category_filter IS NULL OR p.category ILIKE '%' || category_filter || '%')
  ORDER BY
    similarity DESC
  LIMIT match_count;
END;
$$;

-- Crear función para encontrar productos similares
CREATE OR REPLACE FUNCTION public.find_similar_products(
  product_id_input uuid,
  match_threshold double precision DEFAULT 0.7,
  match_count integer DEFAULT 3
)
RETURNS TABLE(
  id uuid,
  name text,
  description text,
  price numeric,
  image_url text,
  category text,
  similarity double precision
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN query
  SELECT
    p2.id,
    p2.name,
    p2.description,
    p2.price,
    p2.image_url,
    p2.category,
    1 - (p1.embedding <=> p2.embedding) AS similarity
  FROM
    products p1,
    products p2
  WHERE
    p1.id = product_id_input
    AND p2.id != product_id_input
    AND p1.embedding IS NOT NULL
    AND p2.embedding IS NOT NULL
    AND 1 - (p1.embedding <=> p2.embedding) > match_threshold
  ORDER BY
    similarity DESC
  LIMIT match_count;
END;
$$;
