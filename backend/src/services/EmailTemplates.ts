import { Order, OrderItem } from "../models/OrderModel.js";

// ── Base layout ──────────────────────────────────────────────────────────────

function base(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#111111;padding:24px 32px;">
              <p style="margin:0;font-size:22px;font-weight:bold;color:#ffffff;letter-spacing:1px;">KRAYA</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9f9f9;padding:20px 32px;border-top:1px solid #eeeeee;">
              <p style="margin:0;font-size:12px;color:#999999;text-align:center;">
                This is an automated email. Please do not reply directly to this message.<br/>
                &copy; ${new Date().getFullYear()} Kraya. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 16px;font-size:22px;color:#111111;">${text}</h1>`;
}

function para(text: string): string {
  return `<p style="margin:0 0 12px;font-size:15px;color:#444444;line-height:1.6;">${text}</p>`;
}

function badge(text: string, color = "#111111"): string {
  return `<span style="display:inline-block;padding:4px 12px;border-radius:20px;background:${color};color:#fff;font-size:13px;font-weight:bold;">${text}</span>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #eeeeee;margin:24px 0;" />`;
}

function infoRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;font-size:14px;color:#888888;width:160px;">${label}</td>
    <td style="padding:6px 0;font-size:14px;color:#111111;font-weight:bold;">${value}</td>
  </tr>`;
}

function infoTable(rows: [string, string][]): string {
  return `<table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:16px;">
    ${rows.map(([l, v]) => infoRow(l, v)).join("")}
  </table>`;
}

function itemsTable(items: OrderItem[]): string {
  const rows = items.map(item => `
    <tr style="border-bottom:1px solid #f0f0f0;">
      <td style="padding:10px 8px;font-size:14px;color:#333333;">
        ${item.productName}
        <br/><span style="font-size:12px;color:#888888;">${item.variantSize} &times; ${item.quantity}</span>
      </td>
      <td style="padding:10px 8px;font-size:14px;color:#111111;text-align:right;font-weight:bold;">&#8377;${(item.price * item.quantity).toFixed(2)}</td>
    </tr>`).join("");

  return `<table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:16px;">
    <thead>
      <tr style="background:#f7f7f7;">
        <th style="padding:10px 8px;font-size:13px;color:#666666;text-align:left;">Item</th>
        <th style="padding:10px 8px;font-size:13px;color:#666666;text-align:right;">Amount</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function totalBlock(subtotal: number, shippingCost: number, tax: number, discount: number, total: number, offerCode?: string): string {
  const discountRow = discount > 0
    ? `<tr><td style="padding:4px 0;font-size:14px;color:#2e7d32;">Discount${offerCode ? ` (${offerCode})` : ""}</td><td style="padding:4px 0;font-size:14px;color:#2e7d32;text-align:right;">- &#8377;${discount.toFixed(2)}</td></tr>`
    : "";
  return `<table cellpadding="0" cellspacing="0" style="width:100%;">
    <tr><td style="padding:4px 0;font-size:14px;color:#888888;">Subtotal</td><td style="padding:4px 0;font-size:14px;color:#111111;text-align:right;">&#8377;${subtotal.toFixed(2)}</td></tr>
    <tr><td style="padding:4px 0;font-size:14px;color:#888888;">Shipping</td><td style="padding:4px 0;font-size:14px;color:#111111;text-align:right;">${shippingCost === 0 ? "FREE" : "&#8377;" + shippingCost.toFixed(2)}</td></tr>
    <tr><td style="padding:4px 0;font-size:14px;color:#888888;">Tax (18%)</td><td style="padding:4px 0;font-size:14px;color:#111111;text-align:right;">&#8377;${tax.toFixed(2)}</td></tr>
    ${discountRow}
    <tr><td colspan="2"><hr style="border:none;border-top:1px solid #eeeeee;margin:8px 0;" /></td></tr>
    <tr><td style="padding:4px 0;font-size:16px;font-weight:bold;color:#111111;">Total</td><td style="padding:4px 0;font-size:16px;font-weight:bold;color:#111111;text-align:right;">&#8377;${total.toFixed(2)}</td></tr>
  </table>`;
}

// ── Templates ─────────────────────────────────────────────────────────────────

export const EmailTemplates = {

  // 1. Order placed (pending payment)
  orderPlaced(order: Order, userName: string): { subject: string; html: string } {
    const subject = `Order Received — ${order.orderNumber}`;
    const html = base(subject, `
      ${heading("We've received your order!")}
      ${para(`Hi ${userName}, your order has been placed and is awaiting payment confirmation.`)}
      ${infoTable([
        ["Order No.", order.orderNumber],
        ["Status", "Pending Payment"],
        ["Date", order.createdAt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })],
      ])}
      ${divider()}
      ${itemsTable(order.items)}
      ${totalBlock(order.subtotal, order.shippingCost, order.tax, order.discount, order.total, order.offerCode)}
      ${divider()}
      ${para("Complete your payment to confirm the order. If you did not place this order, please contact us.")}
    `);
    return { subject, html };
  },

  // 2. Payment confirmed / order confirmed
  paymentConfirmed(order: Order, userName: string): { subject: string; html: string } {
    const subject = `Payment Confirmed — ${order.orderNumber}`;
    const html = base(subject, `
      ${heading("Payment confirmed!")}
      ${para(`Hi ${userName}, your payment of <strong>&#8377;${order.total.toFixed(2)}</strong> was successful.`)}
      ${infoTable([
        ["Order No.", order.orderNumber],
        ["Status", "Confirmed"],
        ["Amount Paid", `₹${order.total.toFixed(2)}`],
      ])}
      ${divider()}
      ${itemsTable(order.items)}
      ${totalBlock(order.subtotal, order.shippingCost, order.tax, order.discount, order.total, order.offerCode)}
      ${divider()}
      ${para("We will notify you once your order is shipped. Thank you for shopping with us!")}
    `);
    return { subject, html };
  },

  // 3. Generic order status update
  orderStatusChanged(order: Order, userName: string, newStatus: string, note?: string): { subject: string; html: string } {
    const statusLabels: Record<string, { label: string; color: string; message: string }> = {
      confirmed:   { label: "Confirmed",   color: "#1565c0", message: "Your order has been confirmed and is being prepared." },
      processing:  { label: "Processing",  color: "#6a1b9a", message: "Your order is being processed and packed." },
      shipped:     { label: "Shipped",     color: "#00695c", message: "Your order is on its way!" },
      delivered:   { label: "Delivered",   color: "#2e7d32", message: "Your order has been delivered. Hope you love it!" },
      cancelled:   { label: "Cancelled",   color: "#b71c1c", message: "Your order has been cancelled." },
      refunded:    { label: "Refunded",    color: "#e65100", message: "Your refund has been processed. It will reflect in 5–7 business days." },
    };
    const info = statusLabels[newStatus] ?? { label: newStatus, color: "#555555", message: "Your order status has been updated." };
    const subject = `Order ${info.label} — ${order.orderNumber}`;
    const html = base(subject, `
      ${heading(`Order ${info.label}`)}
      ${para(`Hi ${userName}, here's an update on your order.`)}
      <p style="margin:0 0 20px;">${badge(info.label, info.color)}</p>
      ${para(note || info.message)}
      ${infoTable([
        ["Order No.", order.orderNumber],
        ["Status", info.label],
      ])}
      ${divider()}
      ${para("If you have any questions, please contact our support team.")}
    `);
    return { subject, html };
  },

  // 4. Shipment created
  shipmentCreated(order: Order, userName: string): { subject: string; html: string } {
    const subject = `Shipment Created — ${order.orderNumber}`;
    const html = base(subject, `
      ${heading("Your order has been dispatched!")}
      ${para(`Hi ${userName}, your order is packed and a shipment has been created.`)}
      ${infoTable([
        ["Order No.", order.orderNumber],
        ["Courier", order.shipment?.courierName || "Being assigned"],
        ["AWB No.", order.shipment?.awb || "Pending"],
        ...(order.shipment?.trackingUrl ? [["Track", `<a href="${order.shipment.trackingUrl}" style="color:#1565c0;">${order.shipment.trackingUrl}</a>`] as [string, string]] : []),
      ])}
      ${divider()}
      ${para("You will receive another update once it is out for delivery.")}
    `);
    return { subject, html };
  },

  // 5. AWB assigned (shipment handed to courier)
  awbAssigned(order: Order, userName: string, awb: string, courierName?: string, trackingUrl?: string): { subject: string; html: string } {
    const subject = `Shipment Picked Up — ${order.orderNumber}`;
    const html = base(subject, `
      ${heading("Your order is on the way!")}
      ${para(`Hi ${userName}, your order has been picked up by the courier.`)}
      ${infoTable([
        ["Order No.", order.orderNumber],
        ["AWB No.", awb],
        ["Courier", courierName || "N/A"],
        ...(trackingUrl ? [["Track", `<a href="${trackingUrl}" style="color:#1565c0;">${trackingUrl}</a>`] as [string, string]] : []),
      ])}
      ${divider()}
      ${para("Use the AWB number to track your package on the courier website.")}
    `);
    return { subject, html };
  },

  // 6. Refund initiated
  refundInitiated(order: Order, userName: string, refundAmount: number): { subject: string; html: string } {
    const subject = `Refund Initiated — ${order.orderNumber}`;
    const html = base(subject, `
      ${heading("Refund is on its way!")}
      ${para(`Hi ${userName}, a refund of <strong>&#8377;${refundAmount.toFixed(2)}</strong> has been initiated for your order.`)}
      ${infoTable([
        ["Order No.", order.orderNumber],
        ["Refund Amount", `₹${refundAmount.toFixed(2)}`],
        ["Expected", "5–7 business days"],
      ])}
      ${divider()}
      ${para("The amount will be credited back to your original payment method. If you face any issues, please contact our support team.")}
    `);
    return { subject, html };
  },

  // 7. Welcome email
  welcome(email: string, name: string): { subject: string; html: string } {
    const subject = "Welcome to Kraya!";
    const html = base(subject, `
      ${heading(`Welcome, ${name || "there"}!`)}
      ${para("We're thrilled to have you with us. Explore our latest products and enjoy a seamless shopping experience.")}
      ${divider()}
      ${para("If you have any questions, our support team is always happy to help.")}
      ${para("Happy shopping!")}
    `);
    return { subject, html };
  },

  // 8. OTP email (HTML version)
  otp(otp: string): { subject: string; html: string } {
    const subject = "Your Kraya OTP Code";
    const html = base(subject, `
      ${heading("Your OTP Code")}
      ${para("Use the code below to verify your account. It expires in <strong>5 minutes</strong>.")}
      <div style="text-align:center;margin:24px 0;">
        <span style="display:inline-block;padding:16px 40px;font-size:32px;font-weight:bold;letter-spacing:8px;color:#111111;background:#f7f7f7;border-radius:8px;border:1px solid #e0e0e0;">${otp}</span>
      </div>
      ${para("If you did not request this, please ignore this email.")}
    `);
    return { subject, html };
  },

  // 9. Admin — new order alert
  adminNewOrder(order: Order): { subject: string; html: string } {
    const subject = `New Order — ${order.orderNumber}`;
    const html = base(subject, `
      ${heading("New order received")}
      ${infoTable([
        ["Order No.", order.orderNumber],
        ["Customer Phone", order.phone],
        ["Email", order.email || "N/A"],
        ["Total", `₹${order.total.toFixed(2)}`],
        ["Items", `${order.itemCount}`],
        ["Offer", order.offerCode || "None"],
        ["Date", order.createdAt.toLocaleString("en-IN")],
      ])}
      ${divider()}
      ${itemsTable(order.items)}
      ${totalBlock(order.subtotal, order.shippingCost, order.tax, order.discount, order.total, order.offerCode)}
    `);
    return { subject, html };
  },

  // 10. Admin — payment confirmed alert
  adminPaymentConfirmed(order: Order): { subject: string; html: string } {
    const subject = `Payment Confirmed — ${order.orderNumber}`;
    const html = base(subject, `
      ${heading("Payment confirmed")}
      ${infoTable([
        ["Order No.", order.orderNumber],
        ["Customer Phone", order.phone],
        ["Amount", `₹${order.total.toFixed(2)}`],
        ["Razorpay Payment ID", order.payment.razorpayPaymentId || "N/A"],
      ])}
    `);
    return { subject, html };
  },
};
