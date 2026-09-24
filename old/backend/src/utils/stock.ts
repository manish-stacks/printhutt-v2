/**
 * Stock management helpers.
 *
 *  - validateStockForItems : order banane se PEHLE check — product active hai,
 *    out_of_stock nahi hai, aur enough stock hai. Warna BadRequestError.
 *  - reduceStockForOrder    : order CONFIRM hone par atomic decrement +
 *    availabilityStatus update. Idempotent (order.stockReduced flag se).
 */
import Product from '@/db/models/productModel';
import { BadRequestError } from '@/utils/errors';
import { logger } from '@/config/logger';

interface OrderItemLite {
  productId: string;
  name?: string;
  quantity: number;
}

/** availabilityStatus stock value ke hisaab se derive karo */
function deriveAvailability(stock: number): 'in_stock' | 'low_stock' | 'out_of_stock' {
  if (stock <= 0) return 'out_of_stock';
  if (stock <= 5) return 'low_stock';
  return 'in_stock';
}

/**
 * Order create se pehle stock validate karo.
 * Koi bhi item invalid hua to ek combined error throw hota hai.
 */
export async function validateStockForItems(items: OrderItemLite[]): Promise<void> {
  if (!items?.length) throw new BadRequestError('No items in the order.');

  const ids = items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: ids } })
    .select('_id title status stock availabilityStatus')
    .lean<Array<{ _id: unknown; title?: string; status?: boolean; stock?: number; availabilityStatus?: string }>>();

  const map = new Map(products.map((p) => [String(p._id), p]));
  const problems: string[] = [];

  for (const item of items) {
    const p = map.get(String(item.productId));
    const label = item.name || p?.title || item.productId;

    if (!p) {
      problems.push(`"${label}" ab available nahi hai`);
      continue;
    }
    if (p.status === false) {
      problems.push(`"${label}" currently unavailable hai`);
      continue;
    }
    const stock = Number(p.stock ?? 0);
    if (p.availabilityStatus === 'out_of_stock' || stock <= 0) {
      problems.push(`"${label}" out of stock hai`);
      continue;
    }
    if (stock < item.quantity) {
      problems.push(`"${label}" ke sirf ${stock} units bache hain (aapne ${item.quantity} maange)`);
    }
  }

  if (problems.length) {
    throw new BadRequestError(problems.join('. '));
  }
}

/**
 * Order confirm hone par stock kam karo. Idempotent — agar pehle ho chuka
 * (order.stockReduced === true) to dobara nahi karega.
 *
 * Atomic guard: updateOne({ stock: { $gte: qty } }, { $inc: { stock: -qty } })
 * — race condition me oversell nahi hoga.
 */
export async function reduceStockForOrder(order: any): Promise<void> {
  try {
    if (!order) return;
    if (order.stockReduced) {
      logger.debug(`[stock] order ${order.orderId} already reduced — skip`);
      return;
    }

    const items: OrderItemLite[] = order.items || [];
    for (const item of items) {
      if (!item.productId || !item.quantity) continue;

      const res = await Product.updateOne(
        { _id: item.productId, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } }
      );

      if (res.modifiedCount === 0) {
        // Stock kam pad gaya (race) — clamp to 0 taaki negative na ho
        logger.warn(
          `[stock] order ${order.orderId} — insufficient stock for product ${item.productId}, clamping to 0`
        );
        await Product.updateOne(
          { _id: item.productId, stock: { $lt: item.quantity } },
          { $set: { stock: 0 } }
        );
      }

      // availabilityStatus refresh
      const fresh = await Product.findById(item.productId).select('stock').lean<{ stock?: number } | null>();
      if (fresh) {
        await Product.updateOne(
          { _id: item.productId },
          { $set: { availabilityStatus: deriveAvailability(Number(fresh.stock ?? 0)) } }
        );
      }
    }

    // Idempotency flag set karo (agar mongoose doc hai to)
    order.stockReduced = true;
    if (typeof order.save === 'function') {
      await order.save();
    }

    logger.info(`[stock] order ${order.orderId} — stock reduced`);
  } catch (e) {
    logger.error('[stock] reduceStockForOrder failed', e);
  }
}

/**
 * Order cancel/refund par stock wapas badhao. Sirf tab jab pehle reduce hua tha.
 * Idempotent — stockReduced flag false kar deta hai.
 */
export async function restoreStockForOrder(order: any): Promise<void> {
  try {
    if (!order || !order.stockReduced) return;

    const items: OrderItemLite[] = order.items || [];
    for (const item of items) {
      if (!item.productId || !item.quantity) continue;
      await Product.updateOne(
        { _id: item.productId },
        { $inc: { stock: item.quantity } }
      );
      const fresh = await Product.findById(item.productId).select('stock').lean<{ stock?: number } | null>();
      if (fresh) {
        await Product.updateOne(
          { _id: item.productId },
          { $set: { availabilityStatus: deriveAvailability(Number(fresh.stock ?? 0)) } }
        );
      }
    }

    order.stockReduced = false;
    if (typeof order.save === 'function') await order.save();

    logger.info(`[stock] order ${order.orderId} — stock restored`);
  } catch (e) {
    logger.error('[stock] restoreStockForOrder failed', e);
  }
}
