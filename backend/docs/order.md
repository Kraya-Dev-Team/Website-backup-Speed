# Order Management Architecture

## Overview
The order system manages the complete lifecycle of orders from creation to delivery and refund handling.

## Data Model

### Order Interface
```typescript
interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  phone: string;
  email?: string;
  items: OrderItem[];
  itemCount: number;
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  shippingAddress: ShippingAddress;
  billingAddress?: ShippingAddress;
  payment: PaymentInfo;
  shipment?: ShipmentInfo;
  status: OrderStatus;
  timeline: OrderTimeline[];
  notes?: string;
  internalNotes?: string;
  source: "web" | "app" | "api";
  createdAt: Date;
  updatedAt: Date;
}
```

### Order Status Flow
```
pending → confirmed → processing → shipped → delivered
                ↓                      ↓
             cancelled            returned
                ↓
             refunded (if cancelled after payment)
```

## Order Operations

### Create Order
- Generate unique order number: `ORD-{timestamp}-{random}`
- Create initial timeline entry
- Set status to "pending"

### Update Order Status
- Automatically adds timeline entry
- Updates `updatedAt` timestamp

### Order Timeline
Tracks all status changes with timestamp and description.

## API Endpoints (Planned)
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order by ID
- `GET /api/orders/:orderNumber` - Get order by order number
- `GET /api/orders/user/:userId` - Get user's orders
- `PATCH /api/orders/:id/status` - Update order status
- `GET /api/orders` - List orders (admin)
- `GET /api/orders/stats` - Get order statistics

## Integration Points
- **Payment**: Gokwik checkout for payment processing
- **Delivery**: Shiprocket for shipment creation and tracking
