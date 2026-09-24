"use client";
import { useEffect, useRef, useState } from "react";
import { useCartStore } from "@/store/useCartStore";
import { productService } from "@/_services/common/productService";
import { Product } from "@/lib/types/product";
import confetti from "canvas-confetti";
import { toast } from "react-toastify";
import { useStoreSettings } from "@/store/useSettingsStore";
import { unitPrice } from "@/lib/pricing";

export function useFreeGiftGuard() {
  const cfg = useStoreSettings();
  const FREE_GIFT_ID = cfg.giftProductId;
  const FREE_THRESHOLD = cfg.giftThreshold;
  const items = useCartStore((s) => s.items);
  const addToCart = useCartStore((s) => s.addToCart);
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  const [giftProduct, setGiftProduct] = useState<Product>();

  // ✅ FIX: Track if we already showed the confetti toast this session
  // Prevents double-fire when DB sync replaces items array reference
  const prevThresholdMet = useRef(false);

  /* Gift product sirf tab fetch karo jab gift ON ho aur cart me kuch ho */
  const hasItems = items.length > 0;
  useEffect(() => {
    if (!cfg.giftEnabled || !hasItems || !FREE_GIFT_ID) return;
    if (giftProduct && String(giftProduct._id) === String(FREE_GIFT_ID)) return;
    (async () => {
      try {
        const resp: any = await productService.getById(FREE_GIFT_ID);
        setGiftProduct(resp?.product || resp);
      } catch (e) {
        console.error("Gift product fetch failed", e);
      }
    })();
  }, [cfg.giftEnabled, hasItems, FREE_GIFT_ID, giftProduct]);

  /* Threshold cross → auto add/remove gift (sab admin settings se) */
  useEffect(() => {
    // Gift OFF ya admin ne gift product badla → purane gift items hatao
    const staleIdx = items.findIndex((i: any) => i.isGift && (!cfg.giftEnabled || String(i._id) !== String(FREE_GIFT_ID)));
    if (staleIdx >= 0) { removeFromCart(items[staleIdx]._id, staleIdx); return; }
    if (!cfg.giftEnabled || !giftProduct) return;

    const nonGiftTotal = items
      .filter((i: any) => !i.isGift)
      .reduce((t, i) => t + unitPrice(i.price, i.discountType, i.discountPrice) * i.quantity, 0);

    const thresholdMet = nonGiftTotal >= FREE_THRESHOLD;
    const giftIndex = items.findIndex((i: any) => i.isGift && String(i._id) === String(FREE_GIFT_ID));

    if (thresholdMet && giftIndex < 0) {
      const showCelebration = !prevThresholdMet.current;
      prevThresholdMet.current = true;
      addToCart(
        {
          ...giftProduct,
          thumbnail: { ...giftProduct.thumbnail, url: cfg.giftImage || giftProduct.thumbnail?.url },
          title: cfg.giftTitle || giftProduct.title,
          price: 0,
          discountPrice: 0,
          discountType: '',
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
      if (giftIndex >= 0) removeFromCart(String(FREE_GIFT_ID), giftIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, giftProduct, cfg.giftEnabled, FREE_GIFT_ID, FREE_THRESHOLD, cfg.giftTitle, cfg.giftImage]);
}
