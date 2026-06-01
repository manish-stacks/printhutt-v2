"use client";
import { useEffect, useState } from "react";
import { useCartStore } from "@/store/useCartStore";
import { productService } from "@/_services/common/productService";
import { Product } from "@/lib/types/product";
import confetti from "canvas-confetti";
import { toast } from "react-toastify";
import { FREE_GIFT_ID, FREE_THRESHOLD } from "@/lib/constants/gift";

// const FREE_THRESHOLD = 1000;
// const FREE_GIFT_ID = "67b4756b5e05b7be01d85ea2";

export function useFreeGiftGuard() {
  const { items, addToCart, removeFromCart, getTotalPrice } = useCartStore();
  const [giftProduct, setGiftProduct] = useState<Product>();

  /* Fetch gift product once on mount */
  useEffect(() => {
    (async () => {
      try {
        const resp: any = await productService.getById(FREE_GIFT_ID);
        setGiftProduct(resp?.product || resp);
      } catch (e) {
        console.error("Gift product fetch failed", e);
      }
    })();
  }, []);

  /* Watch threshold cross → auto add/remove gift */
  useEffect(() => {
    if (!giftProduct) return;

    const { discountPrice = 0 } = getTotalPrice();
    const hasFreeGift = items.some((i) => i._id === FREE_GIFT_ID);

    if (discountPrice >= FREE_THRESHOLD && !hasFreeGift) {
      addToCart(
        {
          ...giftProduct,
          thumbnail: {
            ...giftProduct.thumbnail,
            url: "https://cdn.shopify.com/app-store/listing_images/08313cab5d04fcc9a59ffc39eefa1521/icon/CPuHmrL0lu8CEAE=.png",
          },
          title: "Free Acrylic Photo Keychain With NFC Tag",
          price: 0,
          discountPrice: 0,
          isGift: true,
          quantity: 1,
        } as any,
        1
      );
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      toast.success("🎁 Free gift unlocked!");
    }

    if (discountPrice < FREE_THRESHOLD && hasFreeGift) {
      removeFromCart(FREE_GIFT_ID);
    }
  }, [items, giftProduct]);
}