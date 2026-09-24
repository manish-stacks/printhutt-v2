/**
 * useAddToCart — common hook for ProductCard
 *
 * ProductDetails.tsx ka same logic extract kiya hai:
 *  - isCustomize → router.push(customizeLink)
 *  - isVarientStatus → varient[0] auto-pick (cards pe variant select nahi hota)
 *  - selectedVariant price/discountType/discountPrice override
 *  - openCartSidebarView on success
 */
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { useCartStore } from '@/store/useCartStore';
import useCartSidebarStore from '@/store/useCartSidebarStore';
import { Product } from '@/lib/types/product';

export function useAddToCart() {
  const addToCart = useCartStore((state) => state.addToCart);
  const { openCartSidebarView } = useCartSidebarStore();
  const router = useRouter();

  const handleAddToCart = (product: Product, variant?: any) => {
    if (!product) return;

    // Customize wala product → redirect
    if (product?.isCustomize) {
      router.push(product?.customizeLink || `/product-details/${product.slug}`);
      return;
    }

    // Card pe variant selector nahi — first variant auto-pick; pricing store me normalize hoti hai
    const finalProduct: any = { ...product };
    // Card pe chuna gaya variant → warna first variant auto-pick
    const pick = variant || (product as any).varient?.[0];
    if (product.isVarientStatus && pick) {
      finalProduct.selectedVariant = pick;
      finalProduct.custom_data = { variant: pick.size || '' };
    }

    addToCart(finalProduct, 1);
    openCartSidebarView();
    toast.success('Added to cart!');
  };

  return { handleAddToCart };
}