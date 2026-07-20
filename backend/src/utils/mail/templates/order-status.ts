import { formatCurrency } from "@/utils/helpers";
import { OrderDetails } from "@/types/index";

/* ── PrintHutt email theme (#271B54) ── */
const THEME = {
	primary: "#271B54",
	primaryLt: "#4A3591",
	lavBg: "#f4f2fb",
	lavBorder: "#ddd4f2",
	lavSub: "#d6ccf0",
	text: "#374151",
	muted: "#6b7280",
	line: "#ece8f7",
};

const LOGO = "https://printhutt.com/print-hutt-logo.webp";

/** Ek item ka net line-total (discount applied). */
function lineTotal(item: OrderDetails["items"][number]): number {
	const unit =
		item.discountType === "percentage"
			? item.price - (item.price * item.discountPrice) / 100
			: item.price - (item.discountPrice || 0);
	return unit * item.quantity;
}

function itemRows(order: OrderDetails): string {
	return order.items
		.map(
			(item, i) => `
				<tr style="background:${i % 2 ? "#ffffff" : THEME.lavBg};">
					<td style="padding:12px 16px;color:${THEME.text};font-size:14px;border-bottom:1px solid ${THEME.line};">${item.name}</td>
					<td style="padding:12px 16px;color:${THEME.muted};font-size:14px;text-align:center;border-bottom:1px solid ${THEME.line};">${item.quantity}</td>
					<td style="padding:12px 16px;color:${THEME.text};font-size:14px;text-align:right;font-weight:600;border-bottom:1px solid ${THEME.line};white-space:nowrap;">${formatCurrency(lineTotal(item))}</td>
				</tr>`
		)
		.join("");
}

/**
 * Shared shell — #271B54 header, item table, total, footer.
 * @param opts.badge  small pill text under title (e.g. status)
 * @param opts.intro  paragraph(s) HTML between greeting and table
 */
function shell(
	order: OrderDetails,
	opts: { title: string; emoji: string; badge?: string; intro: string }
): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${opts.title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
<tr>
<td align="center" style="padding:40px 15px;">

<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(39,27,84,0.12);">

<!-- Header -->
<tr>
<td align="center" style="background:${THEME.primary};background:linear-gradient(135deg,${THEME.primary},${THEME.primaryLt});padding:36px 20px;">
<img src="${LOGO}" alt="PrintHutt" width="120" style="display:block;margin:0 auto 14px;"/>
<h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">${opts.emoji} ${opts.title}</h1>
${opts.badge
			? `<span style="display:inline-block;margin-top:12px;padding:6px 16px;background:rgba(255,255,255,0.15);border:1px solid ${THEME.lavSub};border-radius:999px;color:#ffffff;font-size:13px;font-weight:600;text-transform:capitalize;">${opts.badge}</span>`
			: ""}
</td>
</tr>

<!-- Body -->
<tr>
<td style="padding:36px 34px 8px;">
<p style="margin:0 0 6px;color:${THEME.text};font-size:16px;">Dear <b>${order.shipping.userName}</b>,</p>
${opts.intro}
</td>
</tr>

<!-- Items -->
<tr>
<td style="padding:8px 34px 0;">
<h2 style="margin:22px 0 12px;color:${THEME.primary};font-size:17px;font-weight:700;">Order Details</h2>
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid ${THEME.lavBorder};border-radius:12px;overflow:hidden;">
<tr style="background:${THEME.primary};">
<th align="left" style="padding:12px 16px;color:#ffffff;font-size:13px;font-weight:600;">Item</th>
<th align="center" style="padding:12px 16px;color:#ffffff;font-size:13px;font-weight:600;">Qty</th>
<th align="right" style="padding:12px 16px;color:#ffffff;font-size:13px;font-weight:600;">Price</th>
</tr>
${itemRows(order)}
</table>
</td>
</tr>

<!-- Total -->
<tr>
<td style="padding:18px 34px 4px;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:${THEME.lavBg};border-radius:12px;">
<tr>
<td style="padding:16px 20px;color:${THEME.muted};font-size:15px;">Total Amount</td>
<td align="right" style="padding:16px 20px;color:${THEME.primary};font-size:22px;font-weight:800;white-space:nowrap;">${formatCurrency(order.totalAmount.discountPrice)}</td>
</tr>
</table>
</td>
</tr>

<!-- Footer -->
<tr>
<td style="padding:24px 34px 8px;">
<p style="margin:0;color:${THEME.muted};font-size:14px;line-height:1.7;">Thank you for shopping with <b style="color:${THEME.primary};">PrintHutt</b>! If you have any questions, feel free to reply or email us at <a href="mailto:printhutt05@gmail.com" style="color:${THEME.primary};font-weight:600;text-decoration:none;">printhutt05@gmail.com</a>.</p>
</td>
</tr>
<tr>
<td style="background:${THEME.lavBg};padding:20px;text-align:center;margin-top:18px;">
<p style="margin:0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} PrintHutt · <a href="https://printhutt.com" style="color:${THEME.primary};text-decoration:none;">printhutt.com</a></p>
</td>
</tr>

</table>

</td>
</tr>
</table>
</body>
</html>`;
}

export function generateOrderStatusEmail(order: OrderDetails): string {
	return shell(order, {
		title: "Order Status Update",
		emoji: "📦",
		badge: order.status,
		intro: `<p style="margin:0;color:${THEME.muted};font-size:15px;line-height:1.8;">The current status of your order <b style="color:${THEME.primary};">#${order.orderId}</b> is <b style="color:${THEME.primary};text-transform:capitalize;">${order.status}</b>. Order details are given below.</p>`,
	});
}

export function getShippedEmailTemplate(order: OrderDetails): string {
	return shell(order, {
		title: "Your Order Has Shipped!",
		emoji: "🚚",
		badge: "Shipped",
		intro: `<p style="margin:0 0 14px;color:${THEME.muted};font-size:15px;line-height:1.8;">Good news! Your order <b style="color:${THEME.primary};">#${order.orderId}</b> has been shipped and will reach you soon.</p>
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:${THEME.lavBg};border:1px solid ${THEME.lavBorder};border-radius:12px;margin-bottom:4px;">
<tr>
<td style="padding:14px 18px;color:${THEME.muted};font-size:13px;">Tracking ID<br/><span style="color:${THEME.primary};font-size:17px;font-weight:700;letter-spacing:0.5px;">${order.shipment.trackingId}</span></td>
</tr>
</table>`,
	});
}

export function getDeliveredEmailTemplate(order: OrderDetails): string {
	return shell(order, {
		title: "Your Order Has Been Delivered!",
		emoji: "🎉",
		badge: "Delivered",
		intro: `<p style="margin:0 0 14px;color:${THEME.muted};font-size:15px;line-height:1.8;">Good news! Your order <b style="color:${THEME.primary};">#${order.orderId}</b> has been delivered.</p>`,
	});
}