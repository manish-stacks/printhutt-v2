import { Request, Response } from "express";
import Product from "@/db/models/productModel";

const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const cdata = (s: unknown) => `<![CDATA[${String(s ?? "").replace(/\]\]>/g, "]]]]><![CDATA[>")}]]>`;
const stripHtml = (s: string) => s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

/** discountPrice kai products me % ya flat amount hota hai — asli sale price nikalo */
function finalPrice(p: any): number {
  const price = Number(p.price) || 0;
  const d = Number(p.discountPrice) || 0;
  if (!d) return price;
  if (p.discountType === "percentage") return Math.max(0, Math.round(price * (1 - d / 100)));
  if (p.discountType === "fixed") return Math.max(0, Math.round(price - d));
  return d < price ? d : price; // type missing: discountPrice ko final price maano
}

/**
 * Meta Catalog + Google Merchant dono ke liye RSS 2.0 (g: namespace) feed.
 * id = Mongo _id  → Meta Pixel content_ids se match karta hai (dynamic ads ke liye zaroori).
 */
export const productFeed = async (_req: Request, res: Response): Promise<void> => {
  try {
    const base = (process.env.APP_URL || "https://www.printhutt.com").replace(/\/$/, "");
    const products = await Product.find({ status: true }).populate("category", "name").lean();

    const items = (products as any[])
      .map((p) => {
        const image = p.thumbnail?.url || p.images?.[0]?.url;
        const price = Number(p.price) || 0;
        if (!image || price <= 0) return ""; // invalid items poore feed ko reject karwa dete hain
        const sale = finalPrice(p);
        const inStock = p.stock > 0 && p.availabilityStatus !== "out_of_stock";
        const desc = stripHtml(p.short_description || p.description || p.title || "").slice(0, 4900) || p.title;
        const extra = (p.images || []).slice(0, 5).map((i: any) => i?.url).filter(Boolean)
          .map((u: string) => `<g:additional_image_link>${esc(u)}</g:additional_image_link>`).join("");
        return `<item>
<g:id>${esc(p._id)}</g:id>
<g:title>${cdata(String(p.title || "").slice(0, 150))}</g:title>
<g:description>${cdata(desc)}</g:description>
<g:link>${esc(`${base}/product-details/${p.slug}`)}</g:link>
<g:image_link>${esc(image)}</g:image_link>${extra}
<g:availability>${inStock ? "in stock" : "out of stock"}</g:availability>
<g:price>${price.toFixed(2)} INR</g:price>${sale > 0 && sale < price ? `\n<g:sale_price>${sale.toFixed(2)} INR</g:sale_price>` : ""}
<g:brand>${cdata(p.brand || "PrintHutt")}</g:brand>
<g:condition>new</g:condition>
<g:identifier_exists>no</g:identifier_exists>${p.sku ? `\n<g:mpn>${esc(p.sku)}</g:mpn>` : ""}
<g:product_type>${cdata(p.category?.name || "")}</g:product_type>
</item>`;
      })
      .filter(Boolean)
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>PrintHutt</title>
<link>${esc(base)}</link>
<description>PrintHutt product feed</description>
${items}
</channel>
</rss>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.status(200).send(xml);
  } catch (error) {
    console.error("Feed Error:", error);
    res.status(500).json({ success: false, message: "Unable to generate XML feed" });
  }
};
