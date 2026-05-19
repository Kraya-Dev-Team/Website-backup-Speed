import { Response } from "express";
import { getDB } from "../models/Db.js";
import { AuthRequest } from "../middlewares/auth.js";
import { logger } from "../utils/logger.js";

// ── In-memory cache ──────────────────────────────────────────────────────────

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function buildCacheKey(params: Record<string, string | undefined>): string {
  return Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k] ?? ""}`)
    .join("|");
}

function fromCache(key: string): unknown | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function toCache(key: string, data: unknown): void {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ── Controller ───────────────────────────────────────────────────────────────

export const analyticsController = {

  async getAnalytics(req: AuthRequest, res: Response) {
    try {
      const { startDate, endDate, minAmount, maxAmount } = req.query as Record<string, string | undefined>;

      const key = buildCacheKey({ startDate, endDate, minAmount, maxAmount });
      const hit = fromCache(key);
      if (hit) {
        return res.json({ success: true, cached: true, data: hit });
      }

      const db = getDB();

      // ── Orders match filter ──────────────────────────────────────────────
      const orderMatch: Record<string, any> = {};

      if (startDate || endDate) {
        orderMatch.createdAt = {};
        if (startDate) orderMatch.createdAt.$gte = new Date(startDate);
        if (endDate) orderMatch.createdAt.$lte = new Date(endDate);
      }
      if (minAmount || maxAmount) {
        orderMatch.total = {};
        if (minAmount) orderMatch.total.$gte = Number(minAmount);
        if (maxAmount) orderMatch.total.$lte = Number(maxAmount);
      }

      // ── Two parallel aggregations: orders collection + products collection ─
      const [orderFacetResult, productFacetResult] = await Promise.all([

        // ── Single $facet pipeline over orders (1 round-trip) ─────────────
        db.collection("orders").aggregate([
          { $match: orderMatch },
          {
            $facet: {

              ordersSummary: [
                {
                  $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: "$total" },
                    totalTax: { $sum: "$tax" },
                    totalDiscount: { $sum: "$discount" },
                    totalShipping: { $sum: "$shippingCost" },
                    avgOrderValue: { $avg: "$total" },
                    totalItems: { $sum: "$itemCount" },
                  },
                },
              ],

              ordersByStatus: [
                {
                  $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    revenue: { $sum: "$total" },
                  },
                },
              ],

              paymentsByStatus: [
                {
                  $group: {
                    _id: "$payment.status",
                    count: { $sum: 1 },
                    amount: { $sum: "$payment.amount" },
                  },
                },
              ],

              paymentsByMethod: [
                { $match: { "payment.method": { $exists: true, $ne: null } } },
                {
                  $group: {
                    _id: "$payment.method",
                    count: { $sum: 1 },
                    amount: { $sum: "$payment.amount" },
                  },
                },
              ],

              shipmentsByStatus: [
                { $match: { "shipment.status": { $exists: true } } },
                {
                  $group: {
                    _id: "$shipment.status",
                    count: { $sum: 1 },
                  },
                },
              ],

              // Top 10 products by revenue within the filtered orders
              topProducts: [
                { $unwind: "$items" },
                {
                  $group: {
                    _id: "$items.productId",
                    productName: { $first: "$items.productName" },
                    totalQuantity: { $sum: "$items.quantity" },
                    totalRevenue: { $sum: "$items.total" },
                    orderCount: { $sum: 1 },
                  },
                },
                { $sort: { totalRevenue: -1 } },
                { $limit: 10 },
              ],

              // Daily revenue series (up to 90 days)
              revenueByDay: [
                {
                  $group: {
                    _id: {
                      year: { $year: "$createdAt" },
                      month: { $month: "$createdAt" },
                      day: { $dayOfMonth: "$createdAt" },
                    },
                    revenue: { $sum: "$total" },
                    orders: { $sum: 1 },
                  },
                },
                { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
                { $limit: 90 },
              ],
            },
          },
        ]).toArray(),

        // ── Single $facet pipeline over products (1 round-trip) ───────────
        db.collection("products").aggregate([
          {
            $facet: {

              summary: [
                {
                  $group: {
                    _id: null,
                    total: { $sum: 1 },
                    active: { $sum: { $cond: ["$isActive", 1, 0] } },
                    archived: { $sum: { $cond: ["$isArchived", 1, 0] } },
                    featured: { $sum: { $cond: ["$isFeatured", 1, 0] } },
                    newArrivals: { $sum: { $cond: ["$isNew", 1, 0] } },
                    bestsellers: { $sum: { $cond: ["$isBestseller", 1, 0] } },
                  },
                },
              ],

              byType: [
                { $group: { _id: "$type", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
              ],

              byGender: [
                { $group: { _id: "$gender", count: { $sum: 1 } } },
              ],

              // Products with at least one variant at or below 5 units
              lowStock: [
                { $unwind: "$variants" },
                {
                  $match: {
                    "variants.stock": { $gt: 0, $lte: 5 },
                    "variants.isAvailable": true,
                  },
                },
                {
                  $group: {
                    _id: "$_id",
                    name: { $first: "$name" },
                    slug: { $first: "$slug" },
                    minStock: { $min: "$variants.stock" },
                  },
                },
                { $sort: { minStock: 1 } },
                { $limit: 10 },
              ],

              outOfStock: [
                { $unwind: "$variants" },
                { $match: { "variants.stock": 0 } },
                { $group: { _id: "$_id" } },
                { $count: "total" },
              ],
            },
          },
        ]).toArray(),
      ]);

      // ── Shape the response ───────────────────────────────────────────────

      const of = orderFacetResult[0] ?? {};
      const pf = productFacetResult[0] ?? {};

      // Orders summary
      const rawSummary = of.ordersSummary?.[0] ?? {};
      const ordersSummary = {
        totalOrders: rawSummary.totalOrders ?? 0,
        totalRevenue: rawSummary.totalRevenue ?? 0,
        totalTax: rawSummary.totalTax ?? 0,
        totalDiscount: rawSummary.totalDiscount ?? 0,
        totalShipping: rawSummary.totalShipping ?? 0,
        avgOrderValue: rawSummary.avgOrderValue ?? 0,
        totalItems: rawSummary.totalItems ?? 0,
      };

      // Orders by status → keyed object
      const ordersByStatus: Record<string, { count: number; revenue: number }> = {};
      for (const s of (of.ordersByStatus ?? [])) {
        if (s._id) ordersByStatus[s._id] = { count: s.count, revenue: s.revenue };
      }

      // Payments by status → keyed object
      const paymentsByStatus: Record<string, { count: number; amount: number }> = {};
      for (const p of (of.paymentsByStatus ?? [])) {
        if (p._id) paymentsByStatus[p._id] = { count: p.count, amount: p.amount };
      }

      // Payments by method → keyed object
      const paymentsByMethod: Record<string, { count: number; amount: number }> = {};
      for (const m of (of.paymentsByMethod ?? [])) {
        if (m._id) paymentsByMethod[m._id] = { count: m.count, amount: m.amount };
      }

      // Shipments by status → keyed object
      const shipmentsByStatus: Record<string, number> = {};
      for (const s of (of.shipmentsByStatus ?? [])) {
        if (s._id) shipmentsByStatus[s._id] = s.count;
      }

      // Products summary
      const rawProd = pf.summary?.[0] ?? {};
      const productsSummary = {
        total: rawProd.total ?? 0,
        active: rawProd.active ?? 0,
        archived: rawProd.archived ?? 0,
        featured: rawProd.featured ?? 0,
        newArrivals: rawProd.newArrivals ?? 0,
        bestsellers: rawProd.bestsellers ?? 0,
        outOfStock: pf.outOfStock?.[0]?.total ?? 0,
      };

      const productsByType: Record<string, number> = {};
      for (const t of (pf.byType ?? [])) {
        if (t._id) productsByType[t._id] = t.count;
      }

      const productsByGender: Record<string, number> = {};
      for (const g of (pf.byGender ?? [])) {
        if (g._id) productsByGender[g._id] = g.count;
      }

      // Revenue by day — ISO date strings
      const revenueByDay = (of.revenueByDay ?? []).map((d: any) => ({
        date: `${d._id.year}-${String(d._id.month).padStart(2, "0")}-${String(d._id.day).padStart(2, "0")}`,
        revenue: d.revenue,
        orders: d.orders,
      }));

      const result = {
        generatedAt: new Date().toISOString(),
        filters: {
          startDate: startDate ?? null,
          endDate: endDate ?? null,
          minAmount: minAmount != null ? Number(minAmount) : null,
          maxAmount: maxAmount != null ? Number(maxAmount) : null,
        },
        orders: {
          summary: ordersSummary,
          byStatus: ordersByStatus,
        },
        payments: {
          byStatus: paymentsByStatus,
          byMethod: paymentsByMethod,
        },
        shipments: {
          byStatus: shipmentsByStatus,
        },
        products: {
          summary: productsSummary,
          byType: productsByType,
          byGender: productsByGender,
          lowStock: pf.lowStock ?? [],
        },
        topProducts: of.topProducts ?? [],
        revenueByDay,
      };

      toCache(key, result);
      return res.json({ success: true, cached: false, data: result });

    } catch (error) {
      logger.error("Analytics error", { error });
      return res.status(500).json({ success: false, message: "Failed to fetch analytics" });
    }
  },

  clearCache(_req: AuthRequest, res: Response) {
    const size = cache.size;
    cache.clear();
    return res.json({ success: true, message: `Cleared ${size} cache entries` });
  },
};
