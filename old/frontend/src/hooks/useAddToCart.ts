/**
 * useAddToCart — common hook for ProductCard, ProductCardTwo, ProductCardThree
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

  const handleAddToCart = (product: Product) => {
    if (!product) return;

    // Customize wala product → redirect
    if (product?.isCustomize) {
      router.push(product?.customizeLink);
      return;
    }

    let finalProduct: any = { ...product };

    // Variant status ON hai — cards pe koi selector nahi hota,
    // isliye varient[0] auto-pick karo (same as ProductDetails default)
    const variants: any[] = (product as any).varient ?? [];
    const firstVariant = variants.length > 0 ? variants[0] : null;

    if (product.isVarientStatus && firstVariant) {
      finalProduct = {
        ...finalProduct,
        price: firstVariant.price ?? product.price,
        discountType: firstVariant.discountType ?? product.discountType,
        discountPrice: firstVariant.discountPrice ?? product.discountPrice,
        selectedVariant: firstVariant,
        custom_data: {
          variant: firstVariant.size || '',
        },
      };
    }

    addToCart(finalProduct, 1);
    openCartSidebarView();
    toast.success('Added to cart!');
  };

  return { handleAddToCart };
}