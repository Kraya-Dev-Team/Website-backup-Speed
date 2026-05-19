# Delivery Integration — Shiprocket

## Overview

OmniCore uses **Shiprocket** as the sole delivery/logistics provider. All shipping operations (shipment creation, AWB generation, pickup scheduling, label printing, tracking, cancellations, returns) are handled via Shiprocket's REST API.

- **Shiprocket Base URL:** `https://apiv2.shiprocket.in/v1/external`
- **Auth:** Bearer token (JWT), valid for 10 days, cached in-memory for 23 hours
- **Payment Gateway:** Razorpay (for order payment, separate from delivery)

---

## Architecture

```
Frontend (User/Admin)
        │
        ▼
  OmniCore Backend (Express + TypeScript)
        │
        ├── OrderController          → user-facing order APIs
        ├── AdminOrderController     → admin order + all delivery APIs
        │
        ├── DeliveryService          → Shiprocket API client (token, shipment, AWB, etc.)
        ├── PaymentService           → Razorpay client
        │
        ├── OrderModel               → MongoDB orders collection
        └── AddressModel             → MongoDB addresses collection
```

---

## Shiprocket API Coverage

| # | Shiprocket API | Endpoint | Our Backend | Status |
|---|---------------|----------|-------------|--------|
| 1 | Generate Token | `POST /auth/login` | `DeliveryService.authenticate()` | ✅ Implemented (auto, cached) |
| 2 | Token Logout | `POST /auth/logout` | `DeliveryService.logout()` | ✅ Implemented |
| 3 | Create Custom Order | `POST /orders/create/adhoc` | `POST /api/admin/orders/:id/shipment` | ✅ Implemented |
| 4 | Assign AWB (Courier) | `POST /courier/assign/awb` | `POST /api/admin/delivery/awb` | ✅ Implemented |
| 5 | Track by AWB | `GET /couriers/track/awb/:awb` | `GET /api/admin/delivery/track/:awb` | ✅ Implemented |
| 6 | Cancel Order | `POST /orders/cancel` | `POST /api/admin/delivery/cancel` | ✅ Implemented |
| 7 | Check Serviceability | `GET /courier/serviceability/` | `GET /api/admin/delivery/serviceability` | ✅ Implemented |
| 8 | Request Pickup | `POST /courier/generate/pickup` | `POST /api/admin/delivery/pickup` | ✅ Implemented |
| 9 | Generate Label | `POST /courier/generate/label` | `POST /api/admin/delivery/label` | ✅ Implemented |
| 10 | Generate Manifest | `POST /manifests/generate` | `POST /api/admin/delivery/manifest` | ✅ Implemented |
| 11 | Generate Invoice | `POST /orders/print/invoice` | `POST /api/admin/delivery/invoice` | ✅ Implemented |
| 12 | Forward Shipment (Wrapper) | `POST /shipments/create/forward-shipment` | `POST /api/admin/delivery/forward` | ✅ Implemented |
| 13 | Return Shipment (Wrapper) | `POST /shipments/create/return-shipment` | `POST /api/admin/delivery/return` | ✅ Implemented |
| 14 | Sense RTO Score | `POST /sense/...` | — | ❌ Not implemented |
| 15 | Sense Address Validation | `POST /sense/...` | — | ❌ Not implemented |
| 16 | Webhooks (tracking updates) | Inbound POST from Shiprocket | — | ❌ Not implemented |

---

## Our Backend API Reference

### User APIs — `/api/orders` (auth required)

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|-------------|----------|
| `POST` | `/api/orders` | Create order from cart | `shippingAddressId` or `shippingAddress`, `phone`, `email` | `{ order, razorpayOrder }` |
| `POST` | `/api/orders/verify` | Verify Razorpay payment | `orderId`, `razorpayPaymentId`, `razorpayOrderId`, `razorpaySignature` | `{ success: true }` |
| `GET` | `/api/orders/my-orders` | Get user's own orders | `?page&limit` | `{ orders[], total }` |

### Admin Order APIs — `/api/admin/orders` (admin auth required)

| Method | Path | Description | Request Body / Params | Response |
|--------|------|-------------|----------------------|----------|
| `GET` | `/api/admin/orders` | List all orders | `?page&limit&status&search` | `{ orders[], total, totalPages }` |
| `GET` | `/api/admin/orders/:id` | Get single order | — | `{ order }` |
| `PATCH` | `/api/admin/orders/:id/status` | Update order status | `{ status, description }` | `{ order }` |
| `POST` | `/api/admin/orders/:id/shipment` | Create Shiprocket shipment | — | `{ order }` (with shipment info) |

### Admin Delivery APIs — `/api/admin/delivery` (admin auth required)

| Method | Path | Description | Request Body / Params | Shiprocket API Called |
|--------|------|-------------|----------------------|----------------------|
| `POST` | `/api/admin/delivery/awb` | Assign AWB to shipment | `{ shipment_id }` | `POST /courier/assign/awb` |
| `GET` | `/api/admin/delivery/track/:awb` | Track shipment by AWB | `:awb` param | `GET /couriers/track/awb/:awb` |
| `POST` | `/api/admin/delivery/cancel` | Cancel Shiprocket orders | `{ ids: number[] }` | `POST /orders/cancel` |
| `GET` | `/api/admin/delivery/serviceability` | Check courier serviceability | `?pickup_postcode&delivery_postcode&weight&cod` | `GET /courier/serviceability/` |
| `POST` | `/api/admin/delivery/pickup` | Schedule pickup | `{ shipment_id: number[] }` | `POST /courier/generate/pickup` |
| `POST` | `/api/admin/delivery/label` | Generate shipping label (PDF) | `{ shipment_id: number[] }` | `POST /courier/generate/label` |
| `POST` | `/api/admin/delivery/manifest` | Generate manifest | `{ shipment_id: number[] }` | `POST /manifests/generate` |
| `POST` | `/api/admin/delivery/invoice` | Generate invoice (PDF) | `{ ids: number[] }` | `POST /orders/print/invoice` |
| `POST` | `/api/admin/delivery/forward` | Forward shipment wrapper (create + AWB + label + manifest) | Full order payload | `POST /shipments/create/forward-shipment` |
| `POST` | `/api/admin/delivery/return` | Return shipment wrapper | Return order payload | `POST /shipments/create/return-shipment` |

---

## Data Models

### Order Status Flow

```
pending → confirmed → processing → shipped → delivered
                                           ↘ cancelled
                                           ↘ refunded
```

### Shipment Status Flow (ShipmentInfo)

```
pending → created → shipped → delivered
                 ↘ cancelled
                 ↘ returned
                 ↘ rto (Return to Origin)
```

### ShipmentInfo (stored on Order)

```typescript
{
  provider: "shiprocket"        // always "shiprocket"
  shipmentId?: string           // Shiprocket's shipment_id
  awb?: string                  // Air Waybill number (assigned after courier assign)
  courierName?: string          // e.g. "Delhivery", "Blue Dart"
  trackingUrl?: string          // public tracking URL
  labelUrl?: string             // label PDF URL
  status: "pending" | "created" | "shipped" | "delivered" | "cancelled" | "returned" | "rto"
  estimatedDelivery?: Date
  shippedAt?: Date
  deliveredAt?: Date
}
```

### Order → Shiprocket Payload Mapping

When admin calls `POST /api/admin/orders/:id/shipment`, the backend maps our order like this:

| Our Field | Shiprocket Field | Notes |
|-----------|-----------------|-------|
| `order.orderNumber` | `order_id` | Our reference ID |
| `order.createdAt` | `order_date` | ISO string |
| `config.shiprocket.pickupLocation` | `pickup_location` | From env `SHIPROCKET_PICKUP_LOCATION` |
| `shippingAddress.firstName` | `billing_customer_name` | |
| `shippingAddress.lastName` | `billing_last_name` | |
| `shippingAddress.addressLine1` | `billing_address` | |
| `shippingAddress.addressLine2` | `billing_address_2` | |
| `shippingAddress.city` | `billing_city` | |
| `shippingAddress.pincode` | `billing_pincode` | |
| `shippingAddress.state` | `billing_state` | |
| `shippingAddress.country` | `billing_country` | |
| `order.email` | `billing_email` | |
| `order.phone` | `billing_phone` | |
| `!order.billingAddress` | `shipping_is_billing` | true if no separate billing |
| `item.productName` | `order_items[].name` | |
| `item.sku` | `order_items[].sku` | |
| `item.quantity` | `order_items[].units` | |
| `item.price` | `order_items[].selling_price` | |
| `item.discountPrice` | `order_items[].discount` | |
| `"Prepaid"` | `payment_method` | Always Prepaid (Razorpay) |
| `order.total` | `sub_total` | |
| `10, 10, 10` | `length, breadth, height` | Hardcoded (cm) — needs dynamic value |
| `1` | `weight` | Hardcoded (kg) — needs dynamic value |

> ⚠️ **Known Gap:** `length`, `breadth`, `height`, and `weight` are hardcoded. These should come from product/variant data.

---

## User Flow (Frontend → Backend)

### 1. Place an Order

```
User browses products
    → Add items to cart
    → Go to checkout
    → Select/enter shipping address
    → Click "Place Order"

POST /api/orders
Body: { shippingAddressId, phone, email }

Backend:
  1. Validates address ownership
  2. Fetches cart items
  3. Calculates: subtotal, shippingCost (free >₹1000), tax (18%), total
  4. Creates order in MongoDB (status: "pending")
  5. Creates Razorpay order
  6. Clears cart
  7. Returns { order, razorpayOrder }
```

### 2. Complete Payment

```
Frontend receives razorpayOrder
    → Opens Razorpay payment modal
    → User pays
    → Razorpay returns: razorpayPaymentId, razorpayOrderId, razorpaySignature

POST /api/orders/verify
Body: { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature }

Backend:
  1. Verifies HMAC signature
  2. Updates payment status → "completed"
  3. Updates order status → "confirmed"
  4. Adds timeline entry
```

### 3. Track Order (User)

```
GET /api/orders/my-orders
Response: orders list with status, timeline, shipment.awb, shipment.trackingUrl
```

---

## Admin Flow (Frontend → Backend → Shiprocket)

### Step 1: View Orders

```
GET /api/admin/orders
→ Shows all orders with pagination
→ Filters by status, date, search
```

### Step 2: Create Shiprocket Shipment

```
Admin selects order → Click "Create Shipment"

POST /api/admin/orders/:id/shipment

Backend:
  1. Fetches order from DB
  2. Checks shipment doesn't already exist
  3. Maps order data to Shiprocket payload
  4. Calls DeliveryService.createShipment() → Shiprocket /orders/create/adhoc
  5. Stores shipmentId in order.shipment
  6. Updates order status → "processing"
  7. Adds timeline entry

Shiprocket returns: { order_id (SR), shipment_id, status: "NEW", awb_code: null }
```

### Step 3: Generate AWB (Assign Courier)

```
POST /api/admin/delivery/awb
Body: { shipment_id: "15151515" }

→ Calls Shiprocket POST /courier/assign/awb
→ Returns: courier_name, awb_code, estimated_delivery_date
→ Admin should store awb in order.shipment.awb (currently manual)
```

### Step 4: Schedule Pickup

```
POST /api/admin/delivery/pickup
Body: { shipment_id: [15151515] }

→ Calls Shiprocket POST /courier/generate/pickup
→ Courier is scheduled to pick up package from pickup location
```

### Step 5: Generate Label & Manifest

```
POST /api/admin/delivery/label
Body: { shipment_id: [15151515] }
→ Returns label PDF URL

POST /api/admin/delivery/manifest
Body: { shipment_id: [15151515] }
→ Returns manifest PDF URL
```

### Step 6: Track Shipment

```
GET /api/admin/delivery/track/:awb
→ Returns full tracking scan history from Shiprocket
→ Shows current location, status, timestamps
```

### Step 7: Handle Returns / Cancellations

```
Cancel before dispatch:
POST /api/admin/delivery/cancel
Body: { ids: [16161616] }   ← Shiprocket order IDs
→ 204 No Content on success

Create return shipment:
POST /api/admin/delivery/return
Body: { ... return shipment payload ... }
→ Creates reverse pickup

Forward shipment (all-in-one):
POST /api/admin/delivery/forward
Body: { ... full order payload ... }
→ Creates order + assigns AWB + generates label + manifest in one call
```

### Step 8: Check Serviceability (Before creating order)

```
GET /api/admin/delivery/serviceability
Query: ?pickup_postcode=110001&delivery_postcode=400001&weight=1&cod=0

→ Returns list of available couriers, rates, ETD for the route
```

---

## Webhook — Tracking Updates (Not Yet Implemented)

Shiprocket can push real-time tracking events to a webhook URL. When implemented:

```
Setup in Shiprocket Dashboard: Settings → API → Webhooks
Add URL: https://yourdomain.com/api/webhooks/shiprocket
Security token: set as x-api-key header

Shiprocket sends POST with:
{
  "awb": "19041424751540",
  "current_status": "IN TRANSIT",
  "current_status_id": 20,
  "sr_order_id": 348456385,
  "scans": [ { date, status, activity, location } ]
}

Backend should:
  1. Validate x-api-key
  2. Find order by awb
  3. Update order.shipment.status
  4. Add timeline entry
  5. Send push notification to user
  6. Return 200
```

---

## Environment Variables Required

```env
SHIPROCKET_EMAIL=your-api-user@email.com
SHIPROCKET_PASSWORD=your-api-user-password
SHIPROCKET_PICKUP_LOCATION=maalpur        # pickup location name in Shiprocket dashboard
```

---

## Known Gaps & Improvements Needed

| # | Issue | Impact | Fix |
|---|-------|--------|-----|
| 1 | `length`, `breadth`, `height`, `weight` hardcoded to `10,10,10,1` | Wrong shipping rates/courier selection | Add dimensions/weight to product/variant model |
| 2 | AWB not auto-saved to order after `/delivery/awb` call | Admin has to manually track AWB | Save AWB back to `order.shipment.awb` in the controller |
| 3 | Shiprocket Webhook not implemented | No real-time status sync | Implement `POST /api/webhooks/shiprocket` |
| 4 | User cannot track by AWB directly | No public tracking URL | Expose `GET /api/orders/:id/track` using stored AWB |
| 5 | Sense RTO Score not implemented | No fraud/RTO prediction | Integrate Sense API before shipment creation |
| 6 | Token is module-level memory | Resets on server restart | Consider Redis for token caching in production |
| 7 | `billing_email` fallback is `"test@test.com"` | Bad data in Shiprocket | Require email at order creation |
| 8 | `payment_method` always `"Prepaid"` | COD orders not supported | Add COD payment method support |
