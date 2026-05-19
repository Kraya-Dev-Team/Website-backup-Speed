import { ObjectId } from "mongodb";
import { getDB } from "./Db.js";

export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
  price: number;
}

export interface Cart {
  _id?: ObjectId;
  userId: string;
  items: CartItem[];
  subtotal: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItemEnriched extends CartItem {
  name: string | null;
  brand: string | null;
  image: string | null;
  slug: string | null;
  variantSize: string | null;
  variantUnit: string | null;
  sku: string | null;
  isAvailable: boolean;
}

export interface CartWithDetails extends Omit<Cart, "items"> {
  items: CartItemEnriched[];
}

export const cartModel = {
  async getCartWithDetails(userId: string): Promise<CartWithDetails | null> {
    const db = getDB();
    const cart = await db.collection("carts").findOne({ userId }) as Cart | null;
    if (!cart) return null;
    if (!cart.items.length) return { ...cart, items: [] };

    const productIds = [...new Set(cart.items.map((i) => new ObjectId(i.productId)))];
    const products = await db
      .collection("products")
      .find(
        { _id: { $in: productIds } },
        { projection: { name: 1, slug: 1, images: 1, variants: 1, brand: 1, isActive: 1 } }
      )
      .toArray();

    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const items: CartItemEnriched[] = cart.items.map((item) => {
      const p = productMap.get(item.productId);
      const v = p?.variants?.find((x: any) => x.id === item.variantId);
      const variantPrice = v?.discountPrice || v?.price || item.price || 0;
      return {
        ...item,
        price: variantPrice,
        name: p?.name ?? null,
        brand: p?.brand?.name ?? null,
        image: p?.images?.find((x: any) => x.isPrimary)?.url ?? p?.images?.[0]?.url ?? null,
        slug: p?.slug ?? null,
        variantSize: v?.size ?? null,
        variantUnit: v?.unit ?? null,
        sku: v?.sku ?? null,
        isAvailable: !!(p?.isActive && v?.isAvailable && v?.stock >= item.quantity),
      };
    });

    let currentSubtotal = 0;
    for (const item of items) {
      currentSubtotal += item.price * item.quantity;
    }

    return { ...cart, items, subtotal: currentSubtotal };
  },

  async getCart(userId: string): Promise<Cart | null> {
    const db = getDB();
    return db.collection("carts").findOne({ userId }) as Promise<Cart | null>;
  },

  async createCart(userId: string): Promise<Cart> {
    const db = getDB();
    const now = new Date();
    const cart: Cart = {
      userId,
      items: [],
      subtotal: 0,
      createdAt: now,
      updatedAt: now,
    };
    await db.collection("carts").insertOne(cart as any);
    return cart;
  },

  async updateCart(userId: string, items: CartItem[]): Promise<Cart | null> {
    const db = getDB();
    
    const productIds = [...new Set(items.map((i) => {
      try { return new ObjectId(i.productId); } catch(e) { return null; }
    }).filter(id => id !== null))];

    const products = await db
      .collection("products")
      .find(
        { _id: { $in: productIds } },
        { projection: { variants: 1, name: 1, slug: 1, images: 1, brand: 1, isActive: 1 } }
      )
      .toArray();

    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    let subtotal = 0;
    const enrichedItems = items.map(item => {
      const p = productMap.get(item.productId);
      const v = p?.variants?.find((x: any) => x.id === item.variantId);
      const price = v?.discountPrice || v?.price || item.price || 0;
      subtotal += price * item.quantity;
      return {
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        price,
        name: p?.name ?? null,
        brand: p?.brand?.name ?? null,
        image: p?.images?.find((x: any) => x.isPrimary)?.url ?? p?.images?.[0]?.url ?? null,
        slug: p?.slug ?? null,
        variantSize: v?.size ?? null,
        variantUnit: v?.unit ?? null,
        sku: v?.sku ?? null,
        isAvailable: !!(p?.isActive && v?.isAvailable && v?.stock >= item.quantity),
      };
    });

    const result = await db.collection("carts").findOneAndUpdate(
      { userId },
      { 
        $set: { 
          items: enrichedItems, 
          subtotal, 
          updatedAt: new Date() 
        } 
      },
      { returnDocument: "after" }
    );
    return result as Cart | null;
  },

  async clearCart(userId: string): Promise<boolean> {
    const db = getDB();
    const result = await db.collection("carts").updateOne(
      { userId },
      { 
        $set: { 
          items: [], 
          subtotal: 0, 
          updatedAt: new Date() 
        } 
      }
    );
    return result.modifiedCount > 0;
  }
};
