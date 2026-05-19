# Shiprocket API Documentation

This document describes the Shiprocket API integration implemented in the OmniCore backend.

## Base URL
`https://apiv2.shiprocket.in/v1/external`

## Authentication Flow

We use a Bearer token-based authentication. The application caches the token in-memory for 23 hours to avoid redundant login calls.

### 1. Login
Authenticate with Shiprocket to obtain a JWT token.

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "your_email@example.com",
  "password": "your_password"
}
```

**Response (Success - 200 OK):**
```json
{
  "company_id": 1234567,
  "created_at": "2026-04-14 17:56:44",
  "email": "user@email.com",
  "first_name": "API",
  "id": 12345,
  "last_name": "USER",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Logout
Invalidate the current session and token.

**Endpoint:** `POST /auth/logout`

**Headers:**
- `Authorization: Bearer <token>`

**Response (Success - 200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

---

## Order & Shipment Operations

### 3. Create Shipment (Ad-hoc)
Create a new order and shipment in Shiprocket.

**Endpoint:** `POST /orders/create/adhoc`

**Headers:**
- `Authorization: Bearer <token>`

**Request Body (Comprehensive Example):**
```json
{
  "order_id": "224-447",
  "order_date": "2026-04-14 11:11",
  "pickup_location": "Jammu",
  "comment": "Reseller: M/s Goku",
  "billing_customer_name": "Naruto",
  "billing_last_name": "Uzumaki",
  "billing_address": "House 221B, Leaf Village",
  "billing_address_2": "Near Hokage House",
  "billing_city": "New Delhi",
  "billing_pincode": 110002,
  "billing_state": "Delhi",
  "billing_country": "India",
  "billing_email": "naruto@uzumaki.com",
  "billing_phone": 9876543210,
  "shipping_is_billing": true,
  "shipping_customer_name": "",
  "shipping_last_name": "",
  "shipping_address": "",
  "shipping_address_2": "",
  "shipping_city": "",
  "shipping_pincode": "",
  "shipping_country": "",
  "shipping_state": "",
  "shipping_email": "",
  "shipping_phone": "",
  "order_items": [
    {
      "name": "Kunai",
      "sku": "chakra123",
      "units": 10,
      "selling_price": 900,
      "discount": 0,
      "tax": 0,
      "hsn": 441122
    }
  ],
  "payment_method": "Prepaid",
  "shipping_charges": 0,
  "giftwrap_charges": 0,
  "transaction_charges": 0,
  "total_discount": 0,
  "sub_total": 9000,
  "length": 10,
  "breadth": 15,
  "height": 20,
  "weight": 2.5
}
```

**Response (Success - 200 OK):**
```json
{
    "order_id": 16161616,
    "shipment_id": 15151515,
    "status": "NEW",
    "status_code": 1,
    "onboarding_completed_now": 0,
    "awb_code": null,
    "courier_company_id": null,
    "courier_name": null
}
```

### 4. Generate AWB
Assign an Air Waybill (AWB) to a specific shipment.

**Endpoint:** `POST /courier/assign/awb`

**Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "shipment_id": "15151515"
}
```

**Response (Success - 200 OK):**
```json
{
  "awb_assign_status": 1,
  "response": {
    "data": {
      "awb_code": "AWB123456789",
      "courier_name": "Delhivery"
    }
  }
}
```

### 5. Track Shipment
Track a shipment using its AWB number.

**Endpoint:** `GET /couriers/track/awb/{awb}`

**Headers:**
- `Authorization: Bearer <token>`

**Response (Success - 200 OK):**
```json
{
  "tracking_data": {
    "track_status": 1,
    "shipment_status": "Shipped",
    "shipment_track": [
      {
        "id": 123,
        "awb_code": "AWB123456789",
        "current_status": "Out for Delivery"
      }
    ]
  }
}
```

### 6. Cancel Order
Cancel an existing order.

**Endpoint:** `POST /orders/cancel`

**Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "ids": [16178831]
}
```

**Response (Success - 204 No Content):**
*(No body, HTTP 204)*

### 7. Check Serviceability
Check if delivery is available between two locations and get courier rates.

**Endpoint:** `GET /courier/serviceability/?pickup_postcode=110001&delivery_postcode=400001&weight=0.5&cod=1`

**Headers:**
- `Authorization: Bearer <token>`

**Response (Success - 200 OK):**
```json
{
  "data": {
    "available_courier_companies": [
      {
        "courier_company_id": 43,
        "courier_name": "Delhivery Surface",
        "rate": 54,
        "estimated_delivery_days": "4"
      }
    ]
  }
}
```

### 8. Request Pickup
Schedule a pickup for your shipment.

**Endpoint:** `POST /courier/generate/pickup`

**Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "shipment_id": [16090109]
}
```

**Response (Success - 200 OK):**
```json
{
  "pickup_status": 1,
  "response": {
    "pickup_scheduled_date": "2026-04-16 09:00:00",
    "pickup_token_number": "Reference No: ..."
  }
}
```

### 9. Generate Label, Manifest, and Invoice
Documents required for shipping.

**Endpoints:**
- **Label:** `POST /courier/generate/label`
- **Manifest:** `POST /manifests/generate`
- **Invoice:** `POST /orders/print/invoice`

**Request Body** (Arrays of shipment IDs or order IDs depending on endpoint):
```json
{
  "shipment_id": [16104408] // for label and manifest
  // OR "ids": [order_id] for invoice
}
```

**Response Example (Label - 200 OK):**
```json
{
  "label_created": 1,
  "label_url": "https://...shipping-label.pdf"
}
```

### 10. Wrapper APIs (Recommended)
Combines multiple steps into a single API call.

#### Forward Shipment (Create + AWB + Label + Manifest)
**Endpoint:** `POST /shipments/create/forward-shipment`

**Response Example:**
```json
{
  "status": 1,
  "payload": {
    "order_created": 1,
    "awb_generated": 1,
    "label_generated": 1,
    "manifest_generated": 1,
    "order_id": 222521420,
    "shipment_id": 222002884,
    "awb_code": "14326421307048",
    "label_url": "...",
    "manifest_url": "..."
  }
}
```

#### Return Shipment (Create + AWB + Pickup)
**Endpoint:** `POST /shipments/create/return-shipment`

---

## TypeScript Types

```typescript
export interface ShiprocketLoginResponse {
  token: string;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
}

export interface ShiprocketCreateOrderRequest {
  order_id: string;
  order_date: string;
  pickup_location: string;
  channel_id?: string | number;
  comment?: string;
  reseller_name?: string;
  company_name?: string;
  billing_customer_name: string;
  billing_last_name?: string;
  billing_address: string;
  billing_address_2?: string;
  billing_isd_code?: string;
  billing_city: string;
  billing_pincode: number | string;
  billing_state: string;
  billing_country: string;
  billing_email: string;
  billing_phone: number | string;
  billing_alternate_phone?: number | string;
  shipping_is_billing: boolean | number;
  shipping_customer_name?: string;
  shipping_last_name?: string;
  shipping_address?: string;
  shipping_address_2?: string;
  shipping_city?: string;
  shipping_pincode?: number | string;
  shipping_country?: string;
  shipping_state?: string;
  shipping_email?: string;
  shipping_phone?: number | string;
  longitude?: number;
  latitude?: number;
  order_items: {
    name: string;
    sku: string;
    units: number | string;
    selling_price: number | string;
    discount?: number | string;
    tax?: number | string;
    hsn?: number | string;
  }[];
  payment_method: "Prepaid" | "COD" | string;
  shipping_charges?: number | string;
  giftwrap_charges?: number | string;
  transaction_charges?: number | string;
  total_discount?: number | string;
  sub_total: number | string;
  length: number | string;
  breadth: number | string;
  height: number | string;
  weight: number | string;
  customer_gstin?: string;
  invoice_number?: string;
  order_type?: "ESSENTIALS" | "NON ESSENTIALS" | string;
  checkout_shipping_method?: string;
  what3words_address?: string;
  is_insurance_opt?: boolean;
  is_document?: number;
  order_tag?: string;
  ewaybill_no?: string;
}

export interface ShiprocketShipmentResponse {
  order_id: number;
  shipment_id: number;
  status: string;
  status_code: number;
  onboarding_completed_now?: number;
  awb_code?: string | null;
  courier_company_id?: number | null;
  courier_name?: string | null;
}
```
