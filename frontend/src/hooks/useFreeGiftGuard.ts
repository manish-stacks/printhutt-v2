"use client";
import { useEffect, useRef, useState } from "react";
import { useCartStore } from "@/store/useCartStore";
import { productService } from "@/_services/common/productService";
import { Product } from "@/lib/types/product";
import confetti from "canvas-confetti";
import { toast } from "react-toastify";
import { FREE_GIFT_ID, FREE_THRESHOLD } from "@/lib/constants/gift";

export function useFreeGiftGuard() {
  const { items, addToCart, removeFromCart, getTotalPrice } = useCartStore();
  const [giftProduct, setGiftProduct] = useState<Product>();

  // ✅ FIX: Track if we already showed the confetti toast this session
  // Prevents double-fire when DB sync replaces items array reference
  const giftAddedRef = useRef(false);
  const prevThresholdMet = useRef(false);

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
    // ✅ FIX: Check only non-gift items for threshold calc
    const nonGiftItems = items.filter((i) => !(i as any).isGift);
    const nonGiftTotal = nonGiftItems.reduce((t, i) => {
      if (i.discountType === 'percentage') {
        return t + (i.price - (i.price * i.discountPrice) / 100) * i.quantity;
      }
      return t + (i.price - i.discountPrice) * i.quantity;
    }, 0);

    const thresholdMet = nonGiftTotal >= FREE_THRESHOLD;
    const hasFreeGift = items.some((i) => i._id === FREE_GIFT_ID);

    if (thresholdMet && !hasFreeGift) {
      // ✅ FIX: Only show confetti/toast when threshold NEWLY crossed
      const showCelebration = !prevThresholdMet.current;
      prevThresholdMet.current = true;

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

      if (showCelebration) {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        toast.success("🎁 Free gift unlocked!");
      }
    }

    if (!thresholdMet) {
      prevThresholdMet.current = false;
      if (hasFreeGift) {
        removeFromCart(FREE_GIFT_ID);
      }
    }
  }, [items, giftProduct]);
}
