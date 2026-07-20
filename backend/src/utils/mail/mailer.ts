import nodemailer from "nodemailer";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import UserModel from "@/db/models/userModel";
import type { mallerType, OrderDetails } from "@/types/index";
import { formatCurrency } from "@/utils/helpers";
import { getCustomerEmailTemplate } from "./templates/customer";
import { getOwnerEmailTemplate } from "./templates/owner";
import dotenv from "dotenv";
import {
  generateOrderStatusEmail,
  getShippedEmailTemplate,
} from "./templates/order-status";
import axios from "axios";
// import { ShippingInformation } from "@/types/shipping";
import { logger } from "@/config/logger";
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  // secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendVerifyEmail = async ({
  email,
  emailType,
  userId,
}: mallerType) => {
  try {
    const rawToken = uuidv4();
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    if (emailType === "VERIFY") {
      await UserModel.findByIdAndUpdate(userId, {
        verifyToken: hashedToken,
        verifyTokenExpiry: Date.now() + 3600000,
      });
    } else if (emailType === "RESET") {
      await UserModel.findByIdAndUpdate(userId, {
        forgotPasswordToken: hashedToken,
        forgotPasswordTokenExpiry: Date.now() + 3600000,
      });
    }

    const actionURL = `${process.env.APP_URL}/${emailType === "VERIFY" ? "verifyemail" : "resetpassword"}?token=${rawToken}`;

    const mailOptions = {
      from: `"${process.env.APP_NAME}" <${process.env.SMTP_FROM}>`,
      to: email,
      subject:
        emailType === "VERIFY" ? "Verify your email" : "Reset your password",
      html: `
        <p>Click the link below to ${emailType === "VERIFY" ? "verify your email" : "reset your password"}:</p>
        <a href="${actionURL}" target="_blank">Click here</a>
        <p>Or copy and paste this URL in your browser:</p>
        <p>${actionURL}</p>
      `,
    };

    const mailResponse = await transporter.sendMail(mailOptions);
    return mailResponse;
  } catch (error) {
    console.error("Error while sending email:", error);
    throw new Error((error as Error).message);
  }
};

export const sendOtpByEmail = async (email: string, otp: string) => {
  const mailOptions = {
    from: `"${process.env.APP_NAME}" <${process.env.SMTP_FROM}>`,
    to: email,
    subject: "Your PrintHutt Login OTP",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>PrintHutt OTP</title>
      </head>

      <body style="margin:0; padding:0; background:#f4f7fb; font-family:Arial,sans-serif;">
        
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center" style="padding:40px 15px;">

              <table 
                width="100%" 
                cellpadding="0" 
                cellspacing="0" 
                border="0"
                style="
                  max-width:600px;
                  background:#ffffff;
                  border-radius:18px;
                  overflow:hidden;
                  box-shadow:0 10px 30px rgba(0,0,0,0.08);
                "
              >

                <!-- HEADER -->
                <tr>
                  <td 
                    align="center"
                    style="
                      background:#271B54;background:linear-gradient(135deg,#271B54,#4A3591);
                      padding:40px 20px;
                    "
                  >

                    <img
                      src="https://www.printhutt.com/print-hutt-logo.webp"
                      alt="PrintHutt"
                      width="120"
                      style="margin-bottom:15px;"
                    />

                    <h1 style="
                      margin:0;
                      color:#ffffff;
                      font-size:32px;
                      font-weight:700;
                    ">
                      PrintHutt
                    </h1>

                    <p style="
                      margin:10px 0 0;
                      color:#d6ccf0;
                      font-size:15px;
                    ">
                      Premium Personalized Gifts & Neon Signs
                    </p>

                  </td>
                </tr>

                <!-- BODY -->
                <tr>
                  <td style="padding:45px 35px;">

                    <h2 style="
                      margin:0 0 15px;
                      font-size:28px;
                      color:#111827;
                    ">
                      Verify Your Account
                    </h2>

                    <p style="
                      margin:0 0 25px;
                      color:#6b7280;
                      font-size:16px;
                      line-height:1.7;
                    ">
                      Use the OTP below to securely login to your PrintHutt account.
                      This OTP is valid for the next <b>10 minutes</b>.
                    </p>

                    <!-- OTP BOX -->
                    <div style="text-align:center; margin:35px 0;">

                      <div style="
                        display:inline-block;
                        background:#271B54;background:linear-gradient(135deg,#271B54,#4A3591);
                        color:#ffffff;
                        padding:18px 40px;
                        border-radius:14px;
                        font-size:38px;
                        font-weight:700;
                        letter-spacing:10px;
                        box-shadow:0 8px 20px rgba(37,99,235,0.25);
                      ">
                        ${otp}
                      </div>

                    </div>

                    <p style="
                      margin:0;
                      color:#6b7280;
                      font-size:15px;
                      line-height:1.7;
                    ">
                      For security reasons, please do not share this OTP with anyone.
                      PrintHutt will never ask for your OTP via call or message.
                    </p>

                  </td>
                </tr>

                <!-- FOOTER -->
                <tr>
                  <td style="
                    background:#f9fafb;
                    padding:30px;
                    text-align:center;
                    border-top:1px solid #e5e7eb;
                  ">

                    <p style="
                      margin:0 0 10px;
                      font-size:14px;
                      color:#6b7280;
                    ">
                      Need help? Contact our support team
                    </p>

                    <p style="
                      margin:0;
                      font-size:14px;
                    ">
                      <a 
                        href="mailto:printhutt05@gmail.com"
                        style="
                          color:#271B54;
                          text-decoration:none;
                          font-weight:600;
                        "
                      >
                        printhutt05@gmail.com
                      </a>
                    </p>

                    <div style="margin-top:20px;">
                      <a
                        href="https://www.printhutt.com"
                        style="
                          display:inline-block;
                          background:#271B54;
                          color:#ffffff;
                          text-decoration:none;
                          padding:12px 24px;
                          border-radius:10px;
                          font-size:14px;
                          font-weight:600;
                        "
                      >
                        Visit Website
                      </a>
                    </div>

                    <p style="
                      margin-top:25px;
                      font-size:12px;
                      color:#9ca3af;
                    ">
                      © ${new Date().getFullYear()} PrintHutt. All rights reserved.
                    </p>

                  </td>
                </tr>

              </table>

            </td>
          </tr>
        </table>

      </body>
      </html>
    `,
  };

  try {
    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("OTP Email Error:", error);
    throw new Error((error as Error).message);
  }
};

export const sendOtpBySms = async (mobile: string, otp: string) => {
  const receiver = `+91${mobile}`;
  const template = "OTP1";

  const smsUrl = `https://2factor.in/API/V1/${process.env.TWO_FACTOR_API}/SMS/${receiver}/${otp}/${template}`;

  const wappMsg = `
  Your OTP is *${otp}*. 
  Valid for 10 minutes. Do not share it with anyone.`;

  //const wappUrl = `${process.env.WAPP_URL}send?apikey=${process.env.WAPP_KEY}&mobile=${mobile}&msg=${encodeURIComponent(wappMsg)}`;

  try {
    await Promise.all([
      axios.post(smsUrl),
      //axios.post(wappUrl)
    ]);
  } catch (error) {
    console.error("OTP Send Error:", error);
    throw new Error((error as Error).message);
  }

  return { to: mobile, message: `Your OTP is ${otp}` };
};

export async function sendOrderConfirmationEmail(order: any) {
  const email = order.shipping?.email;

  // ── EMAIL ── (sirf tab jab valid email ho; warna skip — WhatsApp fir bhi jayega)
  if (email && String(email).includes("@")) {
    const commonData = {
      orderId: order.orderId,
      items: order.items,
      totalAmount: order.totalAmount,
      payment: order.payment,
      shipping: order.shipping,
      coupon: order.coupon,
      formatCurrency,
      paymentType: order.paymentType,
      payAmt: order.payAmt,
    };

    // Customer aur owner email ALAG-ALAG bhejo — ek fail ho to doosra na ruke
    // (Promise.all me owner email undefined hone par customer email bhi block ho rahi thi)
    const customerMail = transporter
      .sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: `Order Confirmed - ${order.orderId}`,
        html: getCustomerEmailTemplate(commonData),
      })
      .then(() => console.log(`[mailer] customer email sent → ${email}`))
      .catch((err) => console.error("Customer mail failed:", (err as Error)?.message || err));

    const ownerEmail = process.env.SHOP_OWNER_EMAIL;
    const ownerMail = ownerEmail
      ? transporter
          .sendMail({
            from: process.env.SMTP_FROM,
            to: ownerEmail,
            subject: `New Order Received - ${order.orderId}`,
            html: getOwnerEmailTemplate(commonData),
          })
          .then(() => console.log(`[mailer] owner email sent → ${ownerEmail}`))
          .catch((err) => console.error("Owner mail failed:", (err as Error)?.message || err))
      : Promise.resolve(console.warn("[mailer] SHOP_OWNER_EMAIL not set — owner email skipped"));

    await Promise.allSettled([customerMail, ownerMail]);
  } else {
    console.log(`[mailer] order ${order.orderId} — no valid email, email skipped (WhatsApp continue)`);
  }

  // ── WHATSAPP ── (email se INDEPENDENT — ab email na ho to bhi jayega)
  await sendOrderConfirmationWhatsApp(order);
}

/**
 * BUZWAP positional-param fix:
 * Params comma-separated bhejte hain. Agar kisi param ke andar comma/newline ho
 * (jaise address ya formatCurrency ka "₹1,141" thousand-comma) to provider extra
 * value bana deta hai aur 7 ki jagah 8 params ban jate hain → template MISMATCH
 * → message FAIL. Isliye har param se comma/newline/extra-space strip karte hain.
 */
function sanitizeWaParam(v: unknown): string {
  return String(v ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/,/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Amount ko CLEAN number string banao — koi ₹ symbol, comma ya Intl special-space nahi
 *  (₹ multibyte glyph + thousand-comma utility template ko fail kara dete the). */
function waAmount(v: unknown): string {
  const n = Math.round(Number(v) || 0);
  return String(n);
}

/** Sirf digits — raw 10-digit (jaise order_status template me chal raha hai). */
function waPhone(num: unknown): string {
  return String(num ?? "").replace(/\D/g, "");
}

export async function sendOrderConfirmationWhatsApp(order: any): Promise<void> {
  const phone = waPhone(order.shipping?.mobileNumber);
  if (!phone) {
    console.log(`[whatsapp] order ${order.orderId} — no mobile number, skip`);
    return;
  }

  // Template: printhutt_order_confirmation → 7 params {{1}}..{{7}}
  const params = [
    sanitizeWaParam(order.shipping?.userName), // {{1}} name
    sanitizeWaParam(order.orderId), // {{2}} Order ID
    sanitizeWaParam(order.status), // {{3}} Status
    order.paymentType === "online" ? "Prepaid" : "COD", // {{4}} Payment Mode
    waAmount(order.totalAmount?.discountPrice), // {{5}} Total Amount (plain number)
    waAmount(order.payAmt), // {{6}} Paid Amount (plain number)
    sanitizeWaParam( // {{7}} Address (commas → space)
      `${order.shipping?.addressLine || ""} ${order.shipping?.city || ""} ${order.shipping?.state || ""} ${order.shipping?.postCode || ""}`
    ),
  ];

  const waUrl =
    `http://waapi.hoverbusinessservices.com/api/sendmsgutil.php` +
    `?user=Printhutt_BW` +
    `&pass=123456` +
    `&sender=BUZWAP` +
    `&phone=${phone}` +
    `&text=printhutt_order_confirmation` +
    `&priority=wa` +
    `&stype=normal` +
    `&Params=${encodeURIComponent(params.join(","))}`;

  try {
    const response = await axios.get(waUrl, { timeout: 15000 });
    console.log(`[whatsapp] order_confirmation → ${phone} | params=[${params.join(" | ")}]`, response.data);
  } catch (error) {
    console.error("WhatsApp order_confirmation failed:", (error as Error)?.message || error);
  }
}

export async function sendOrderStatus(order: OrderDetails) {
  const emailContent =
    order.status === "shipped"
      ? getShippedEmailTemplate(order)
      : generateOrderStatusEmail(order);

  const emailPromise = transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: order.shipping.email,
    subject: `Order Status - ${order.orderId}`,
    html: emailContent,
  });

  let wappPromise: Promise<void> = Promise.resolve();

  if (order?.shipping?.mobileNumber) {
    const params = [
      order.shipping.userName || "",
      order.orderId || "",
      order.status || "",
    ];

    const waUrl =
      `http://waapi.hoverbusinessservices.com/api/sendmsgutil.php` +
      `?user=Printhutt_BW` +
      `&pass=123456` +
      `&sender=BUZWAP` +
      `&phone=${order.shipping.mobileNumber}` +
      `&text=printhutt_order_status` +
      `&priority=wa` +
      `&stype=normal` +
      `&Params=${encodeURIComponent(params.join(","))}`;

    wappPromise = axios
      .get(waUrl)
      .then(() => { })
      .catch((error) => {
        console.error("WhatsApp failed:", error);
      });
  }

  await Promise.all([emailPromise, wappPromise]);

}

export async function sendRtoMessage(
  order: OrderDetails,
  refundReason: string,
) {
  const shipping = order.shipping;

  const params = [
    shipping.userName || "", // {{1}}
    order.orderId || "", // {{2}}
    refundReason || "", // {{3}}
  ];

  const waUrl =
    `http://waapi.hoverbusinessservices.com/api/sendmsgutil.php` +
    `?user=Printhutt_BW` +
    `&pass=123456` +
    `&sender=BUZWAP` +
    `&phone=${shipping.mobileNumber}` +
    `&text=printhutt_order_rto` +
    `&priority=wa` +
    `&stype=normal` +
    `&Params=${encodeURIComponent(params.join(","))}`;

  try {
    const response = await axios.get(waUrl);
    console.log("WhatsApp sent:", response.data);
  } catch (error) {
    console.error("Whatsapp Send Error:", error);
    throw new Error((error as Error).message);
  }
}

export async function sendDeliveredWithRatingMessage(order: OrderDetails) {
  /* ================= EMAIL ================= */
  const reviewLinks = order.items
    .map(
      (item, i) =>
        `${i + 1}. ${item.name}
👉 <a href="${process.env.APP_URL}/product-details/${item.slug}/write-review" target="_blank">
Rate this product
</a>`,
    )
    .join("<br/><br/>");

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; line-height:1.6; color:#333;">
      <h2 style="color:#271B54;">🎉 Your Order is Delivered!</h2>

      <p>Hi <strong>${order.shipping.userName}</strong>,</p>

      <p>
        Your order <strong>${order.orderId}</strong> has been successfully delivered.
      </p>

      <h3>⭐ Rate Your Products</h3>
      <p>Your feedback helps other customers.</p>

      <div>
        ${reviewLinks}
      </div>

      <br/>
      <p>Thank you for shopping with us ❤️</p>
    </div>
  `;

  const emailPromise = transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: order.shipping.email,
    subject: `Order Delivered – Rate Your Purchase (${order.orderId})`,
    html: emailHtml,
  });

  /* ================= WHATSAPP ================= */
  let wappPromise: Promise<void> = Promise.resolve();

  if (order?.shipping?.mobileNumber) {
    const reviewLink =
      order.items?.length > 0
        ? `${process.env.APP_URL}/product-details/${order.items[0].slug}/write-review`
        : `${process.env.APP_URL}`;

    const params = [
      order.shipping.userName || "", // {{1}}
      order.orderId || "", // {{2}}
      reviewLink, // {{3}}
    ];

    const waUrl =
      `http://waapi.hoverbusinessservices.com/api/sendmsgutil.php` +
      `?user=Printhutt_BW` +
      `&pass=123456` +
      `&sender=BUZWAP` +
      `&phone=${order.shipping.mobileNumber}` +
      `&text=printhutt_order_delivered` +
      `&priority=wa` +
      `&stype=normal` +
      `&Params=${encodeURIComponent(params.join(","))}`;

    wappPromise = axios
      .get(waUrl)
      .then(() => { })
      .catch((error) => {
        console.error("WhatsApp failed:", error);
      });
  }

  await Promise.all([emailPromise, wappPromise]);
}
/* ─── NEW: Generic email (admin manual send) ─── */
export async function sendCustomEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<unknown> {
  if (!to || typeof to !== "string" || !to.includes("@")) {
    logger.warn("[mailer] skipping email — invalid recipient", { to });
    return { skipped: true, reason: "invalid recipient" };
  }
  // Wrap body in branded HTML template
  const wrappedHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${subject}</title>
      </head>
      <body style="font-family: Arial, sans-serif; background: #f8f8fb; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
          <div style="background: #271B54; background: linear-gradient(135deg, #271B54, #4A3591); padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 22px;">PrintHutt</h1>
          </div>
          <div style="padding: 30px; color: #333; line-height: 1.6; font-size: 14px; white-space: pre-wrap;">
            ${html}
          </div>
          <div style="background: #f3f4f6; padding: 16px; text-align: center; font-size: 12px; color: #666;">
            <p style="margin: 0;">
              PrintHutt · 25 Krishna Market, Delhi 110034<br/>
              <a href="https://printhutt.com" style="color: #271B54;">printhutt.com</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  return transporter.sendMail({
    from: process.env.MAIL_FROM || '"PrintHutt" <printhutt05@gmail.com>',
    to,
    subject,
    html: wrappedHtml,
  });
}

/* ─── NEW: Generic SMS (admin manual send) ─── */
export async function sendCustomSms(
  mobile: string,
  body: string,
): Promise<unknown> {
  if (!mobile) throw new Error("Mobile is required");
  if (!body) throw new Error("Body is required");

  // Reuse existing SMS service — wherever sendOtpBySms hits
  // Typically Fast2SMS / MSG91 / Twilio etc.

  // Example with Fast2SMS (adjust to your provider):
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) {
    logger.warn("[mailer] Fast2SMS API key not set — SMS skipped");
    return;
  }

  const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      authorization: apiKey,
    },
    body: new URLSearchParams({
      route: "q", // quick transactional
      message: body,
      numbers: mobile.replace(/\D/g, ""),
      flash: "0",
    }).toString(),
  });

  if (!response.ok) {
    throw new Error(`SMS send failed: ${response.status}`);
  }

  return response.json();
}