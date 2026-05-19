# Review APIs

## Create Review
**POST** `/api/reviews`

**Headers:** `Authorization: Bearer <token>`

**Content-Type:** `multipart/form-data`

**Required Fields:**
| Field | Type | Description |
|-------|------|-------------|
| productId | string | Product ID |
| rating | number (0-5) | Star rating |
| comment | string | Review comment |

**Optional Fields:**
| Field | Type | Description |
|-------|------|-------------|
| userName | string | User name (defaults to profile name) |
| title | string | Review title |
| orderId | string | Order ID for verified purchase |
| images | file[] | Review images (max 5) |
| pros | string[] | List of pros |
| cons | string[] | List of cons |
| isVerified | boolean | Verified purchase flag |
| isActive | boolean | Active status |

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "review_id",
    "productId": "product_id",
    "userId": "user_id",
    "userName": "John Doe",
    "orderId": "order_id",
    "rating": 4,
    "title": "Great product!",
    "comment": "This product is amazing...",
    "images": [{ "url": "https://..." }],
    "pros": ["Quality", "Price"],
    "cons": ["Shipping"],
    "isVerified": true,
    "isFeatured": false,
    "isActive": true,
    "helpful": 0,
    "notHelpful": 0,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## Get Reviews by Product
**GET** `/api/reviews/product/:productId`

**Query Parameters:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Items per page |
| rating | number | - | Filter by rating (1-5) |
| sortBy | string | createdAt | Sort: createdAt, helpful, rating |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "reviews": [...],
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

---

## Get Review by ID
**GET** `/api/reviews/:id`

**Success Response (200):**
```json
{
  "success": true,
  "data": { ...review }
}
```

---

## Get Reviews by User
**GET** `/api/reviews/user/:userId`

**Query Parameters:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| limit | number | 10 | Max items |

**Success Response (200):**
```json
{
  "success": true,
  "data": [...]
}
```

---

## Update Review
**PUT** `/api/reviews/:id`

**Headers:** `Authorization: Bearer <token>`

**Request Body:** Similar to create, fields to update

**Success Response (200):**
```json
{
  "success": true,
  "data": { ...updatedReview }
}
```

---

## Delete Review
**DELETE** `/api/reviews/:id`

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Review deleted successfully"
}
```

---

## Mark Review as Helpful
**POST** `/api/reviews/:id/helpful`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Marked as helpful"
}
```

---

## Mark Review as Not Helpful
**POST** `/api/reviews/:id/not-helpful`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Marked as not helpful"
}
```

---

## Get Rating Distribution
**GET** `/api/reviews/:productId/distribution`

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    { "rating": 5, "count": 50 },
    { "rating": 4, "count": 30 },
    { "rating": 3, "count": 15 },
    { "rating": 2, "count": 3 },
    { "rating": 1, "count": 2 }
  ]
}
```

---

## Error Responses
**400 Bad Request:**
```json
{
  "success": false,
  "message": "Validation error message"
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Review not found"
}
```

**500 Server Error:**
```json
{
  "success": false,
  "message": "Failed to create review",
  "data": { ...error }
}
```