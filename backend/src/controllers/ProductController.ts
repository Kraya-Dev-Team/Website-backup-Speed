import type { Request, Response } from "express";
import { productModel, type Product } from "../models/ProductModel.js";
import { brandModel } from "../models/BrandModel.js";
import { categoryModel } from "../models/CategoryModel.js";

const formatProduct = (product: Product) => ({
  id: product._id?.toString(),
  name: product.name,
  slug: product.slug,
  description: product.description,
  shortDescription: product.shortDescription,
  brand: product.brand,
  category: product.category,
  type: product.type,
  gender: product.gender,
  perfumeNotes: product.perfumeNotes,
  concentration: product.concentration,
  season: product.season,
  mood: product.mood,
  images: product.images,
  variants: product.variants.map((v) => ({
    id: v.id,
    size: v.size,
    unit: v.unit,
    price: v.price,
    discountPrice: v.discountPrice,
    discountPercentage: v.discountPercentage,
    stock: v.stock,
    sku: v.sku,
    isAvailable: v.isAvailable,
    isDefault: v.isDefault,
  })),
  basePrice: product.basePrice,
  discountPrice: product.discountPrice,
  discountPercentage: product.discountPercentage,
  rating: product.rating,
  reviewCount: product.reviewCount,
  isFeatured: product.isFeatured,
  isNew: product.isNew,
  isBestseller: product.isBestseller,
  tags: product.tags,
  shipping: product.shipping,
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
});

export const productController = {
  async create(req: Request, res: Response) {
    try {
      const product = await productModel.create(req.body);
      if (product.brand.id) {
        await brandModel.updateProductCount(product.brand.id, 1);
      }
      if (product.category.id) {
        await categoryModel.updateProductCount(product.category.id, 1);
      }
      res.status(201).json({ success: true, data: formatProduct(product) });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to create product", data: error });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const product = await productModel.findById(req.params.id as string);
      if (!product) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }
      await productModel.incrementView(product._id!.toString());
      res.json({ success: true, data: formatProduct(product) });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to get product", data: error });
    }
  },

  async getBySlug(req: Request, res: Response) {
    try {
      const product = await productModel.findBySlug(req.params.slug as string);
      if (!product) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }
      await productModel.incrementView(product._id!.toString());
      res.json({ success: true, data: formatProduct(product) });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to get product", data: error });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const product = await productModel.update(req.params.id as string, req.body);
      if (!product) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }
      res.json({ success: true, data: formatProduct(product) });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to update product", data: error });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const product = await productModel.findById(req.params.id as string);
      if (!product) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }
      const deleted = await productModel.delete(req.params.id as string);
      if (deleted) {
        if (product.brand.id) {
          await brandModel.updateProductCount(product.brand.id, -1);
        }
        if (product.category.id) {
          await categoryModel.updateProductCount(product.category.id, -1);
        }
      }
      res.json({ success: true, message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to delete product", data: error });
    }
  },

  async list(req: Request, res: Response) {
    try {
      const filter = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        brand: req.query.brand as string,
        category: req.query.category as string,
        type: req.query.type as string,
        gender: req.query.gender as string,
        season: req.query.season as string,
        concentration: req.query.concentration as string,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        isFeatured: req.query.isFeatured === "true" ? true : req.query.isFeatured === "false" ? false : undefined,
        isNew: req.query.isNew === "true" ? true : req.query.isNew === "false" ? false : undefined,
        isBestseller: req.query.isBestseller === "true" ? true : req.query.isBestseller === "false" ? false : undefined,
        isActive: req.query.isActive === "true" ? true : req.query.isActive === "false" ? false : undefined,
        search: req.query.search as string,
        sortBy: req.query.sortBy as "price" | "createdAt" | "rating" | "name" | "popularity",
        sortOrder: req.query.sortOrder as "asc" | "desc",
      };

      const result = await productModel.list(filter);
      res.json({
        success: true,
        data: {
          items: result.products.map(formatProduct),
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to list products", data: error });
    }
  },

  async getSimilar(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const products = await productModel.getSimilar(req.params.id as string, limit);
      res.json({ success: true, data: products.map(formatProduct) });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to get similar products", data: error });
    }
  },

  async getVariants(req: Request, res: Response) {
    try {
      const product = await productModel.findById(req.params.id as string);
      if (!product) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }
      const variants = product.variants.filter((v) => v.isAvailable);
      res.json({ success: true, data: variants });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to get variants", data: error });
    }
  },

  async checkSku(req: Request, res: Response) {
    try {
      const sku = req.query.sku as string;
      const product = await productModel.findBySku(sku);
      res.json({ success: true, data: { exists: !!product, product: product ? product._id?.toString() : null } });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to check SKU", data: error });
    }
  },
};