import { emailService } from "./email.js";
import { EmailTemplates } from "./EmailTemplates.js";
import { Order } from "../models/OrderModel.js";
import { logger } from "../utils/logger.js";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

// All methods are fire-and-forget — they never reject so controllers don't block on email.
function send(to: string | string[], subject: string, html: string): void {
  if (!to || (Array.isArray(to) && to.length === 0)) return;
  emailService.send({ to, subject, body: html, isHtml: true })
    .then(r => { if (!r.success) logger.warn("Email send failed", { to, subject, message: r.message }); })
    .catch(err => logger.error("Email send error", { to, subject, err }));
}

function adminEmail(subject: string, html: string): void {
  if (!ADMIN_EMAIL) return;
  send(ADMIN_EMAIL, subject, html);
}

export const EmailNotificationService = {

  // ── Customer events ────────────────────────────────────────────────────────

  orderPlaced(order: Order, userEmail: string | undefined, userName: string): void {
    if (!userEmail) return;
    const t = EmailTemplates.orderPlaced(order, userName);
    send(userEmail, t.subject, t.html);

    // Also notify admin
    const a = EmailTemplates.adminNewOrder(order);
    adminEmail(a.subject, a.html);
  },

  paymentConfirmed(order: Order, userEmail: string | undefined, userName: string): void {
    if (userEmail) {
      const t = EmailTemplates.paymentConfirmed(order, userName);
      send(userEmail, t.subject, t.html);
    }
    const a = EmailTemplates.adminPaymentConfirmed(order);
    adminEmail(a.subject, a.html);
  },

  orderStatusChanged(
    order: Order,
    userEmail: string | undefined,
    userName: string,
    newStatus: string,
    note?: string
  ): void {
    if (!userEmail) return;
    const t = EmailTemplates.orderStatusChanged(order, userName, newStatus, note);
    send(userEmail, t.subject, t.html);
  },

  shipmentCreated(order: Order, userEmail: string | undefined, userName: string): void {
    if (!userEmail) return;
    const t = EmailTemplates.shipmentCreated(order, userName);
    send(userEmail, t.subject, t.html);
  },

  awbAssigned(
    order: Order,
    userEmail: string | undefined,
    userName: string,
    awb: string,
    courierName?: string,
    trackingUrl?: string
  ): void {
    if (!userEmail) return;
    const t = EmailTemplates.awbAssigned(order, userName, awb, courierName, trackingUrl);
    send(userEmail, t.subject, t.html);
  },

  refundInitiated(order: Order, userEmail: string | undefined, userName: string, refundAmount: number): void {
    if (!userEmail) return;
    const t = EmailTemplates.refundInitiated(order, userName, refundAmount);
    send(userEmail, t.subject, t.html);
  },

  welcome(email: string, name: string): void {
    const t = EmailTemplates.welcome(email, name);
    send(email, t.subject, t.html);
  },

  otp(email: string, otp: string): void {
    const t = EmailTemplates.otp(otp);
    send(email, t.subject, t.html);
  },
};
