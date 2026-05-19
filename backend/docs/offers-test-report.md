# Offers — Full Test Report

**Date:** 2026-04-30  
**Server:** `http://localhost:8000`  
**DB:** MongoDB Atlas (Kraya-dev)  
**Debug mode:** `OTP_DEBUG=true`

---

## Cart Used for Validation

| Product | Variant | Price | Qty | Line Total |
|---|---|---|---|---|
| Kraya Moksha | 100ml (var-004) | ₹1,599 | 2 | ₹3,198 |
| Kraya Karma  | 100ml (var-002) | ₹1,499 | 1 | ₹1,499 |

**Subtotal:** ₹4,697 · **Shipping:** ₹0 (free above ₹1,000) · **Tax (18%):** ₹845.46

---

## Step 1 — Get Auth Token (Debug OTP)

### Request
```
POST /api/auth/send-otp
Content-Type: application/json

{
  "phone": "9999999999"
}
```

### Response
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

---

### Request
```
POST /api/auth/verify-otp
Content-Type: application/json

{
  "phone": "9999999999",
  "code": "123123"
}
```

### Response
```json
{
  "success": true,
  "user": {
    "phone": "9999999999",
    "role": "admin",
    "isVerified": false,
    "createdAt": "2026-04-19T05:03:15.713Z",
    "updatedAt": "2026-04-19T05:03:15.713Z",
    "addresses": []
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Step 2 — Build Cart

### Request
```
PUT /api/cart
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "productId": "69d3875351dbd83caee1fe37",
      "variantId": "var-004",
      "quantity": 2,
      "price": 1599
    },
    {
      "productId": "69d3874951dbd83caee1fe35",
      "variantId": "var-002",
      "quantity": 1,
      "price": 1499
    }
  ]
}
```

### Response
```json
{
  "success": true,
  "data": {
    "_id": "69f2d0fb6a243f4c13326a03",
    "userId": "69e4621369a95f0df7fb48a1",
    "items": [
      {
        "productId": "69d3875351dbd83caee1fe37",
        "variantId": "var-004",
        "quantity": 2,
        "price": 1599,
        "name": "Kraya Moksha",
        "brand": "KRAYA",
        "image": "https://res.cloudinary.com/db9wcsulz/image/upload/v1776873715/classmanager/blue_tjsneu.jpg",
        "slug": "kraya-moksha",
        "variantSize": "100",
        "variantUnit": "ml",
        "sku": "KRG-100ML",
        "isAvailable": true
      },
      {
        "productId": "69d3874951dbd83caee1fe35",
        "variantId": "var-002",
        "quantity": 1,
        "price": 1499,
        "name": "Kraya Karma",
        "brand": "Kraya",
        "image": "https://res.cloudinary.com/db9wcsulz/image/upload/v1776873782/classmanager/DSC04733_hm3r66.jpg",
        "slug": "kraya-karma",
        "variantSize": "100",
        "variantUnit": "ml",
        "sku": "KMO-100ML",
        "isAvailable": true
      }
    ],
    "subtotal": 4697,
    "createdAt": "2026-04-30T03:48:11.767Z",
    "updatedAt": "2026-04-30T03:48:12.461Z"
  }
}
```

---

## Step 3 — Validate All Offers

### 3.1 SAVE10 — Percentage Discount (10% off, max ₹200)

**Logic:** 10% of ₹4,697 = ₹469.70 → capped at ₹200

#### Request
```
POST /api/offers/validate
Authorization: Bearer <token>
Content-Type: application/json

{
  "offerCode": "SAVE10"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "valid": true,
    "offer": {
      "code": "SAVE10",
      "title": "10% Off on All Orders",
      "type": "percentage"
    },
    "breakdown": {
      "subtotal": 4697,
      "shippingCost": 0,
      "tax": 845.46,
      "discount": 200,
      "total": 5342.46
    }
  }
}
```

---

### 3.2 FLAT150 — Flat Rupee Discount (₹150 off, min order ₹999)

**Logic:** Subtotal ₹4,697 > ₹999 minimum → flat ₹150 off

#### Request
```
POST /api/offers/validate
Authorization: Bearer <token>
Content-Type: application/json

{
  "offerCode": "FLAT150"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "valid": true,
    "offer": {
      "code": "FLAT150",
      "title": "₹150 Off",
      "type": "flat"
    },
    "breakdown": {
      "subtotal": 4697,
      "shippingCost": 0,
      "tax": 845.46,
      "discount": 150,
      "total": 5392.46
    }
  }
}
```

---

### 3.3 BUY2GET1 — Buy X Get Y Free (buy 3, get 1 cheapest free)

**Logic:** Total qty = 3 (≥ buyQuantity 3) → cheapest 1 item free = Kraya Karma ₹1,499

#### Request
```
POST /api/offers/validate
Authorization: Bearer <token>
Content-Type: application/json

{
  "offerCode": "BUY2GET1"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "valid": true,
    "offer": {
      "code": "BUY2GET1",
      "title": "Buy 2 Get 1 Free",
      "type": "buy_x_get_y"
    },
    "breakdown": {
      "subtotal": 4697,
      "shippingCost": 0,
      "tax": 845.46,
      "discount": 1499,
      "total": 4043.46
    }
  }
}
```

---

### 3.4 CART1000 — Cart Value Discount (cart ≥ ₹1,000 → ₹200 off)

**Logic:** Subtotal ₹4,697 ≥ ₹1,000 threshold → ₹200 off

#### Request
```
POST /api/offers/validate
Authorization: Bearer <token>
Content-Type: application/json

{
  "offerCode": "CART1000"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "valid": true,
    "offer": {
      "code": "CART1000",
      "title": "₹200 Off on Cart above ₹1000",
      "type": "cart_value"
    },
    "breakdown": {
      "subtotal": 4697,
      "shippingCost": 0,
      "tax": 845.46,
      "discount": 200,
      "total": 5342.46
    }
  }
}
```

---

### 3.5 CART3000 — Cart Value Discount (cart ≥ ₹3,000 → ₹500 off)

**Logic:** Subtotal ₹4,697 ≥ ₹3,000 threshold → ₹500 off

#### Request
```
POST /api/offers/validate
Authorization: Bearer <token>
Content-Type: application/json

{
  "offerCode": "CART3000"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "valid": true,
    "offer": {
      "code": "CART3000",
      "title": "₹500 Off on Cart above ₹3000",
      "type": "cart_value"
    },
    "breakdown": {
      "subtotal": 4697,
      "shippingCost": 0,
      "tax": 845.46,
      "discount": 500,
      "total": 5042.46
    }
  }
}
```

---

## Summary

| Offer Code | Type | Discount Applied | Final Total |
|---|---|---|---|
| `SAVE10` | percentage | ₹200 (capped from ₹469.70) | ₹5,342.46 |
| `FLAT150` | flat | ₹150 | ₹5,392.46 |
| `BUY2GET1` | buy_x_get_y | ₹1,499 (Kraya Karma free) | ₹4,043.46 |
| `CART1000` | cart_value | ₹200 | ₹5,342.46 |
| `CART3000` | cart_value | ₹500 | ₹5,042.46 |

All 5 offers validated successfully against a cart subtotal of ₹4,697.  
Shipping is ₹0 (free above ₹1,000). Tax is 18% = ₹845.46.
