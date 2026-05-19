# Payment Management - Gokwik Integration

## Overview
Payment processing is handled via Gokwik checkout integration.

## Payment Flow

### 1. Order Creation
- Customer places order with pending payment status
- Order created with payment status "pending"

### 2. Payment Initiation
- Redirect to Gokwik checkout with order details
- Include: amount, currency, order_id, callback_url

### 3. Payment Processing
- Gokwik handles payment collection
- Returns transaction details via webhook/callback

### 4. Payment Confirmation
- Update order payment status based on webhook
- Record transaction ID, payment ID, gateway response
- If successful: Update order to "confirmed"
- If failed: Update order to "failed"

## Payment Status
```typescript
type PaymentStatus = 
  | "pending"    // Payment not initiated
  | "processing" // Payment in progress
  | "completed"  // Payment successful
  | "failed"     // Payment failed
  | "refunded"   // Payment refunded
  | "cancelled"; // Payment cancelled
```

## Payment Interface
```typescript
interface PaymentInfo {
  provider: "gokwik";
  transactionId?: string;
  paymentId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method?: string;           // card, upi, netbanking, wallet
  gatewayResponse?: Record<string, any>;
  paidAt?: Date;
}
```

## Webhook Handling
- Receive payment status updates from Gokwik
- Validate webhook signature
- Update order payment information
- Trigger order status updates

## Refund Flow
- Initiate refund via Gokwik API
- Update payment status to "refunded"
- Add timeline entry to order
- Update order status if needed

## API Endpoints (Planned)
- `POST /api/payments/initiate` - Initialize payment
- `POST /api/payments/webhook` - Gokwik webhook endpoint
- `POST /api/payments/refund` - Process refund

## Configuration
Required environment variables:
- `GOKWIK_API_KEY`
- `GOKWIK_API_SECRET`
- `GOKWIK_MERCHANT_ID`
- `GOKWIK_BASE_URL`
- `GOKWIK_WEBHOOK_SECRET`
