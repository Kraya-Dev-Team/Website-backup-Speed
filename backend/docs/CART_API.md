# Cart API

All endpoints require a valid JWT via `Authorization: Bearer <token>`.

Base path: `/cart`

---

## Enriched Item Shape

Every response that includes cart items returns the following enriched shape (raw `CartItem` fields + product details joined from the products collection):

```json
{
  "productId": "prod_abc",
  "variantId": "var_50ml",
  "quantity": 2,
  "price": 750,
  "name": "Oud Noir",
  "brand": "Maison Orient",
  "image": "https://cdn.example.com/oud-noir.jpg",
  "slug": "oud-noir",
  "variantSize": "50",
  "variantUnit": "ml",
  "sku": "ON-50ML",
  "isAvailable": true
}
```

| Field | Source | Notes |
|-------|--------|-------|
| `name` | `product.name` | `null` if product deleted |
| `brand` | `product.brand.name` | `null` if product deleted |
| `image` | `product.images` (primary first) | `null` if no images |
| `slug` | `product.slug` | |
| `variantSize` | `variant.size` | |
| `variantUnit` | `variant.unit` | |
| `sku` | `variant.sku` | |
| `isAvailable` | computed | `true` only when product is active, variant is available, and `variant.stock >= quantity` |

**Efficiency:** All product lookups are a single bulk query (`$in`) regardless of cart size — no N+1.

---

## GET /cart

Returns the user's cart with enriched items. Auto-creates an empty cart on first call.

### Response

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "userId": "user123",
    "subtotal": 1500,
    "items": [ /* enriched items */ ],
    "createdAt": "2026-04-18T10:00:00.000Z",
    "updatedAt": "2026-04-18T12:30:00.000Z"
  }
}
```

---

## PUT /cart

Replaces the entire items array. Use to set a full cart state (e.g. from checkout page).

### Body

```json
{
  "items": [
    { "productId": "prod_abc", "variantId": "var_50ml", "quantity": 2, "price": 750 }
  ]
}
```

### Response

Returns the updated cart with enriched items (same shape as GET).

---

## POST /cart/sync

Merges a local (offline) items array with the server cart. For duplicate items (same `productId` + `variantId`), keeps the **higher** quantity.

### Body

```json
{
  "items": [
    { "productId": "prod_abc", "variantId": "var_50ml", "quantity": 1, "price": 750 },
    { "productId": "prod_xyz", "variantId": "var_100ml", "quantity": 2, "price": 1200 }
  ]
}
```

### Response

Returns the merged cart with enriched items.

---

## DELETE /cart

Empties the cart (sets items to `[]` and subtotal to `0`).

### Response

```json
{ "success": true, "message": "Cart cleared" }
```

---

## Error responses

| Status | Message |
|--------|---------|
| 400 | `Items must be an array` |
| 401 | `Unauthorized` |
| 500 | `Failed to get cart` / `Failed to update cart` / `Failed to sync cart` / `Failed to clear cart` |
