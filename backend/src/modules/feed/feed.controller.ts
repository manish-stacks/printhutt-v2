import { Request, Response } from "express";
import Product from "@/db/models/productModel";

export const productFeed = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const products = await Product.find({ status: true })
      .populate("category", "title name")
      .lean();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<products>`;

    products.forEach((p: any) => {
      const image =
        p.thumbnail?.url ||
        p.images?.[0]?.url ||
        "";

      let availability = "in stock";

      switch (p.availabilityStatus) {
        case "out_of_stock":
          availability = "out of stock";
          break;

        case "low_stock":
          availability = "limited availability";
          break;

        default:
          availability = "in stock";
      }

      xml += `
  <product>
    <id>${p._id}</id>

    <title><![CDATA[${p.title || ""}]]></title>

    <description><![CDATA[${
      p.short_description ||
      p.description ||
      ""
    }]]></description>

    <link>${process.env.APP_URL}/product-details/${p.slug}</link>

    <image_link>${image}</image_link>

    <price>${Number(p.price).toFixed(2)} INR</price>

    ${
      p.discountPrice > 0
        ? `<sale_price>${Number(p.discountPrice).toFixed(
            2
          )} INR</sale_price>`
        : ""
    }

    <availability>${availability}</availability>

    <brand><![CDATA[${p.brand || "PrintHutt"}]]></brand>

    <sku>${p.sku}</sku>

    <category><![CDATA[${
      p.category?.title ||
      p.category?.name ||
      ""
    }]]></category>

    <condition>new</condition>

    <stock>${p.stock}</stock>

    <rating>${p.rating}</rating>

    <slug>${p.slug}</slug>

    <created_at>${p.createdAt}</created_at>

    <updated_at>${p.updatedAt}</updated_at>

  </product>`;
    });

    xml += `
</products>`;

    res.setHeader("Content-Type", "application/xml");
    res.status(200).send(xml);
  } catch (error) {
    console.error("Feed Error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to generate XML feed",
    });
  }
};