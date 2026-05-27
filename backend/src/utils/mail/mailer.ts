import nodemailer from "nodemailer";
import crypto from "crypto";
import { v4 as uuidv4 } from 'uuid';
import UserModel from '@/db/models/userModel'
import type { mallerType, OrderDetails } from '@/types/index';
import { formatCurrency } from '@/utils/helpers';
import { getCustomerEmailTemplate } from './templates/customer';
import { getOwnerEmailTemplate } from './templates/owner';
import dotenv from "dotenv"
import { generateOrderStatusEmail, getShippedEmailTemplate } from "./templates/order-status";
import axios from "axios";
import { ShippingInformation } from "@/types/shipping";
dotenv.config()

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  // secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendVerifyEmail = async ({ email, emailType, userId }: mallerType) => {
  try {
    const rawToken = uuidv4();
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    if (emailType === 'VERIFY') {
      await UserModel.findByIdAndUpdate(userId, {
        verifyToken: hashedToken,
        verifyTokenExpiry: Date.now() + 3600000,
      });
    } else if (emailType === 'RESET') {
      await UserModel.findByIdAndUpdate(userId, {
        forgotPasswordToken: hashedToken,
        forgotPasswordTokenExpiry: Date.now() + 3600000,
      });
    }

    const actionURL = `${process.env.APP_URL}/${emailType === 'VERIFY' ? 'verifyemail' : 'resetpassword'}?token=${rawToken}`;

    const mailOptions = {
      from: `"${process.env.APP_NAME}" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: emailType === 'VERIFY' ? 'Verify your email' : 'Reset your password',
      html: `
        <p>Click the link below to ${emailType === 'VERIFY' ? 'verify your email' : 'reset your password'}:</p>
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



export const sendOtpByEmail = async (
  email: string,
  otp: string
) => {
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
                      background:linear-gradient(135deg,#2563eb,#4f46e5);
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
                      color:#dbeafe;
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
                        background:linear-gradient(135deg,#2563eb,#4f46e5);
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
                          color:#2563eb;
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
                          background:#111827;
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
    console.error('OTP Send Error:', error);
    throw new Error((error as Error).message);
  }

  return { to: mobile, message: `Your OTP is ${otp}` };
};


// export async function sendOrderConfirmationEmail(orderData: {
//   userId: { email: string };
//   orderId: string;
//   items: { name: string; quantity: number; price: number }[];
//   totalAmount: { discountPrice: number; shippingTotal: number; totalPrice: number };
//   payment: string;
//   shipping: ShippingInformation;
//   coupon?: string;
//   paymentType: string;
//   payAmt: number;
//   status: string;
// }) {
//   const { orderId, items, totalAmount, payment, shipping, coupon, paymentType, payAmt, userId, status } = orderData;

//   const commonData = { orderId, items, totalAmount, payment, shipping, coupon, paymentType, payAmt, formatCurrency };

//   const email = order?.shipping?.email || userId.email;

//   if (!email) {
//     console.log("No customer email, skipping mail");
//     return;
//   }

//   const emails = [
//     {
//       to: userId.email,
//       subject: `Order Confirmation - ${orderId}`,
//       html: getCustomerEmailTemplate(commonData),
//     },
//     {
//       to: process.env.SHOP_OWNER_EMAIL,
//       subject: `New Order Received - ${orderId}`,
//       html: getOwnerEmailTemplate(commonData),
//     },
//   ];

//   await Promise.all(emails.map(mail => transporter.sendMail({ from: process.env.SMTP_FROM, ...mail })));

//   if (shipping?.mobileNumber) {
//     const itemsList = items.map((item, i) => `${i + 1}. ${item.name} x ${item.quantity}`).join('\n');

//     const wappMsg = `
// Hi ${shipping.userName},

// Thank you for your order!

// 🧾 Order ID: ${orderId}
// Status: *${status}*

// 🛒 Items:
// ${itemsList}



// 💳 Payment Mode: ${paymentType === 'online' ? 'Prepaid' : 'COD'}
// 💰 Total Amount: ${formatCurrency(totalAmount.discountPrice)}
// 💰 Coupon Discount: ${coupon.discountAmount ? formatCurrency(coupon.discountAmount) : 'N/A'}
// 💵 Paid Amount: ${formatCurrency(payAmt)}
// ${paymentType === 'online' ? '' : `💵 COD Amount: ${formatCurrency(totalAmount.discountPrice - payAmt)}`}


// 🚚 Address: ${shipping.addressLine}, ${shipping.city}, ${shipping.state} ${shipping.postCode}

// We are processing your order. You'll be notified when it's shipped.

// Thank you!`;

//     const wappUrl = `${process.env.WAPP_URL}send?apikey=${process.env.WAPP_KEY}&mobile=${shipping.mobileNumber}&msg=${encodeURIComponent(wappMsg)}`;

//     try {
//       await axios.post(wappUrl);
//     } catch (error) {
//       console.error('Whatsapp Send Error:', error);
//       throw new Error((error as Error).message);
//     }
//   }
// }
export async function sendOrderConfirmationEmail(order: any) {
  const email = order.shipping?.email;
  if (!email) {
    console.log("No customer email found");
    return;
  }

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

  try {
    await Promise.all([
      transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: `Order Confirmed - ${order.orderId}`,
        html: getCustomerEmailTemplate(commonData),
      }),
      transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: process.env.SHOP_OWNER_EMAIL,
        subject: `New Order Received - ${order.orderId}`,
        html: getOwnerEmailTemplate(commonData),
      }),
    ]);
  } catch (err) {
    console.error("Mail send failed:", err);
  }

  if (order.shipping?.mobileNumber) {
    const itemsList = order.items
      .map((i: { name: string; quantity: number }, idx: number) => `${idx + 1}. ${i.name} x ${i.quantity}`)
      .join("\n");

    const wappMsg = `
    Hi ${order.shipping.userName},
    Thank you for your order!
    🧾 Order ID: ${order.orderId}
    Status: *${order.status}*
    🛒 Items:
    ${itemsList}

    💳 Payment Mode: ${order.paymentType === 'online' ? 'Prepaid' : 'COD'}
    💰 Total Amount: ${formatCurrency(order.totalAmount.discountPrice)}
    💰 Coupon Discount: ${(order.coupon as { discountAmount?: number })?.discountAmount ? formatCurrency((order.coupon as { discountAmount?: number })?.discountAmount ?? 0) : 'N/A'}
    💵 Paid Amount: ${formatCurrency(order.payAmt)}
    ${order.paymentType === 'online' ? '' : `💵 COD Amount: ${formatCurrency(order.totalAmount.discountPrice - order.payAmt)}`}

    🚚 Address: ${order.shipping.addressLine}, ${order.shipping.city}, ${order.shipping.state} ${order.shipping.postCode}

    We are processing your order. You'll be notified when it's shipped.
    Thank you for shopping with Print Hutt ❤️
    `;
    const wappUrl = `${process.env.WAPP_URL}send?apikey=${process.env.WAPP_KEY}&mobile=${order.shipping.mobileNumber}&msg=${encodeURIComponent(wappMsg)}`;

    try {
      await axios.post(wappUrl);
    } catch (e) {
      console.log("WhatsApp failed:", e);
    }
  }
}





export async function sendOrderStatus(order: OrderDetails) {
  const emailContent = order.status === 'shipped'
    ? getShippedEmailTemplate(order)
    : generateOrderStatusEmail(order);

  const emailPromise = transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: order.shipping.email,
    subject: `Order Status - ${order.orderId}`,
    html: emailContent,
  });

  let wappPromise = Promise.resolve();

  if (order?.shipping?.mobileNumber) {
    const itemsList = order.items.map((item, i) => {
      const price = item.discountType === 'percentage'
        ? item.price - (item.price * item.discountPrice) / 100
        : item.price - item.discountPrice;

      return `${i + 1}. ${item.name} x ${item.quantity} = ₹${price * item.quantity}`;
    }).join('\n');

    const wappMsg = `
        Hi ${order.shipping.userName},

        Your order with ID: ${order.orderId} is currently *${order.status}*.

        🧾 Order Details:
        ${itemsList}


        💳 Payment Mode: ${order.paymentType === 'online' ? 'Prepaid' : 'COD'}
        💰 Total Amount: ${formatCurrency(order.totalAmount.discountPrice)}
        💰 Coupon Discount: ${(order.coupon as { discountAmount?: number })?.discountAmount ? formatCurrency((order.coupon as { discountAmount?: number })?.discountAmount ?? 0) : 'N/A'}
        💵 Paid Amount: ${formatCurrency(order.payAmt)}
        ${order.paymentType === 'online' ? '' : `💵 COD Amount: ${formatCurrency(order.totalAmount.discountPrice - order.payAmt)}`}

        🚚 Address: ${order.shipping.addressLine}, ${order.shipping.city}, ${order.shipping.state} ${order.shipping.postCode}

        If you have any questions, feel free to reply to this message.

        Thank you for shopping with us!`;

    const wappUrl = `${process.env.WAPP_URL}send?apikey=${process.env.WAPP_KEY}&mobile=${order.shipping.mobileNumber}&msg=${encodeURIComponent(wappMsg)}`;

    wappPromise = axios.post(wappUrl);
  }

  await Promise.all([emailPromise, wappPromise]);
}

export async function sendRtoMessage(order: OrderDetails, refundReason: string) {
  const shipping = order.shipping;

  const wappMsg = `
Hi ${shipping.userName},

Your order with ID: ${order.orderId} has been RTO *${refundReason}*.

If you have any questions, feel free to reply to this message.

Thank you for shopping with us!`;

  const wappUrl = `${process.env.WAPP_URL}send?apikey=${process.env.WAPP_KEY}&mobile=${shipping.mobileNumber}&msg=${encodeURIComponent(wappMsg)}`;

  try {
    await axios.post(wappUrl);
  } catch (error) {
    console.error('Whatsapp Send Error:', error);
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
</a>`
    )
    .join("<br/><br/>");

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; line-height:1.6; color:#333;">
      <h2 style="color:#22c55e;">🎉 Your Order is Delivered!</h2>

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
  let wappPromise = Promise.resolve();

  if (order?.shipping?.mobileNumber) {
    const productList = order.items
      .map(
        (item, i) =>
          `${i + 1}. ${item.name}\n⭐ Rate: ${process.env.APP_URL}product-details/${item.slug}/write-review`
      )
      .join("\n\n");

    const wappMsg = `
Hi ${order.shipping.userName} 👋

🎉 Your order *${order.orderId}* has been *DELIVERED* successfully!

⭐ Please rate your products:
${productList}

Your feedback means a lot to us ❤️
`;

    const wappUrl = `${process.env.WAPP_URL}send?apikey=${process.env.WAPP_KEY}&mobile=${order.shipping.mobileNumber}&msg=${encodeURIComponent(
      wappMsg
    )}`;

    wappPromise = axios.post(wappUrl);
  }

  await Promise.all([emailPromise, wappPromise]);
}
