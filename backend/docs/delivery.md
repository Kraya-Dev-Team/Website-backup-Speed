# Delivery Management - Shiprocket Integration

## Overview
Shiprocket is used for shipping and logistics management - creating shipments, generating AWB, and tracking deliveries.

## Shipment Flow

### 1. Create Shipment (After Payment Confirmed)
- Call Shiprocket Create Order API
- Send: order details, pickup address, package details
- Receive: shipment_id, awb, courier_id

### 2. Generate AWB
- Shiprocket assigns AWB (Air Waybill)
- Can generate via Shiprocket dashboard or API

### 3. Shipment Status Updates
- Shiprocket sends webhooks for status changes
- Track: created → shipped → in-transit → out-for-delivery → delivered

### 4. Cancellation
- Cancel shipment via Shiprocket API if order cancelled
- Status: "cancelled" or "rto" (Return to Origin)

## Shipment Status
```typescript
type ShipmentStatus = 
  | "pending"       // Shipment not created yet
  | "created"       // Shipment created in system
  | "shipped"       // Shipment handed to courier
  | "in-transit"    // Package in transit
  | "out-for-delivery" // With delivery agent
  | "delivered"     // Successfully delivered
  | "cancelled"     // Cancelled
  | "returned"      // Returned by customer
  | "rto";          // Return to Origin
```

## Shipment Interface
```typescript
interface ShipmentInfo {
  provider: "shiprocket";
  shipmentId?: string;
  awb?: string;
  courierName?: string;
  trackingUrl?: string;
  labelUrl?: string;
  status: ShipmentStatus;
  estimatedDelivery?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
}
```

## Shiprocket API Endpoints

### Authentication
- Use API key and secret from Shiprocket dashboard
- Base URL: `https://api.shiprocket.in/v1`

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/orders/create` | POST | Create new shipment |
| `/orders/{id}` | GET | Get order details |
| `/orders/cancel` | POST | Cancel shipment |
| `/shipments/track/{awb}` | GET | Track shipment |
| `/couriers/available` | GET | Get available couriers |
| `/shipments/generate/pickup` | POST | Generate pickup request |

### Webhook Events
Subscribe to webhook events:
- `order_created`
- `order_updated`
- `shipment_created`
- `shipment_status_changed`
- `shipment_delivered`

## Package Details Required
```typescript
interface PackageDetails {
  weight: number;        // in kg
  length: number;        // in cm
  width: number;         // in cm
  height: number;        // in cm
}
```

## Integration Flow
```
Order Paid → Create Shipment → Get AWB → Mark as Shipped
                    ↓
            Shiprocket Webhook → Update Status → Deliver
```

## Configuration
Required environment variables:
- `SHIPROCKET_API_KEY`
- `SHIPROCKET_API_SECRET`
- `SHIPROCKET_CHANNEL_ID`
- `SHIPROCKET_WEBHOOK_SECRET`

## Pickup Address
Configure pickup address in Shiprocket dashboard or via API:
- Merchant name
- Address (line 1, line 2)
- City, State, Pincode
- Phone number
