import client from "./client";

export interface ProductResponse {
  product_id: string;
  brand: string;
  product_name: string;
  category: string;
  subcategory: string | null;
  ingredients: string[] | null;
  key_ingredients: string[] | null;
  image_url: string | null;
  price: number | null;
  volume: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function searchProducts(q: string): Promise<ProductResponse[]> {
  const { data } = await client.get<ProductResponse[]>("/v1/products/search", {
    params: { q },
  });
  return data;
}

export async function getProduct(productId: string): Promise<ProductResponse> {
  const { data } = await client.get<ProductResponse>(`/v1/products/${productId}`);
  return data;
}
