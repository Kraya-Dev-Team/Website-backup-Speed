import type { Request, Response } from "express";
import { brandModel, type Brand } from "../models/BrandModel.js";

const formatBrand = (brand: Brand) => ({
  id: brand._id?.toString(),
  name: brand.name,
  slug: brand.slug,
  description: brand.description,
  logo: brand.logo,
  country: brand.country,
  founded: brand.founded,
  website: brand.website,
  socials: brand.socials,
  isFeatured: brand.isFeatured,
  isActive: brand.isActive,
  productCount: brand.productCount,
  metaTitle: brand.metaTitle,
  metaDescription: brand.metaDescription,
  order: brand.order,
  createdAt: brand.createdAt,
  updatedAt: brand.updatedAt,
});

export const brandController = {
  async create(req: Request, res: Response) {
    try {
      const brand = await brandModel.create(req.body);
      res.status(201).json({ success: true, data: formatBrand(brand) });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to create brand", data: error });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const brand = await brandModel.findById(req.params.id as string);
      if (!brand) {
        return res.status(404).json({ success: false, message: "Brand not found" });
      }
      res.json({ success: true, data: formatBrand(brand) });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to get brand", data: error });
    }
  },

  async getBySlug(req: Request, res: Response) {
    try {
      const brand = await brandModel.findBySlug(req.params.slug as string);
      if (!brand) {
        return res.status(404).json({ success: false, message: "Brand not found" });
      }
      res.json({ success: true, data: formatBrand(brand) });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to get brand", data: error });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const brand = await brandModel.update(req.params.id as string, req.body);
      if (!brand) {
        return res.status(404).json({ success: false, message: "Brand not found" });
      }
      res.json({ success: true, data: formatBrand(brand) });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to update brand", data: error });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const deleted = await brandModel.delete(req.params.id as string);
      if (!deleted) {
        return res.status(404).json({ success: false, message: "Brand not found" });
      }
      res.json({ success: true, message: "Brand deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to delete brand", data: error });
    }
  },

  async list(req: Request, res: Response) {
    try {
      const filter = {
        isFeatured: req.query.featured === "true" ? true : req.query.featured === "false" ? false : undefined,
        isActive: req.query.active === "true" ? true : req.query.active === "false" ? false : undefined,
      };
      const brands = await brandModel.findAll(filter);
      res.json({ success: true, data: brands.map(formatBrand) });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to list brands", data: error });
    }
  },
};