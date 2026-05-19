import type { Request, Response } from "express";
import { categoryModel, type Category } from "../models/CategoryModel.js";

const formatCategory = (category: Category) => ({
  id: category._id?.toString(),
  name: category.name,
  slug: category.slug,
  description: category.description,
  image: category.image,
  parentId: category.parentId,
  level: category.level,
  isFeatured: category.isFeatured,
  isActive: category.isActive,
  productCount: category.productCount,
  metaTitle: category.metaTitle,
  metaDescription: category.metaDescription,
  order: category.order,
  createdAt: category.createdAt,
  updatedAt: category.updatedAt,
});

export const categoryController = {
  async create(req: Request, res: Response) {
    try {
      const category = await categoryModel.create(req.body);
      res.status(201).json({ success: true, data: formatCategory(category) });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to create category", data: error });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const category = await categoryModel.findById(req.params.id as string);
      if (!category) {
        return res.status(404).json({ success: false, message: "Category not found" });
      }
      res.json({ success: true, data: formatCategory(category) });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to get category", data: error });
    }
  },

  async getBySlug(req: Request, res: Response) {
    try {
      const category = await categoryModel.findBySlug(req.params.slug as string);
      if (!category) {
        return res.status(404).json({ success: false, message: "Category not found" });
      }
      res.json({ success: true, data: formatCategory(category) });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to get category", data: error });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const category = await categoryModel.update(req.params.id as string, req.body);
      if (!category) {
        return res.status(404).json({ success: false, message: "Category not found" });
      }
      res.json({ success: true, data: formatCategory(category) });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to update category", data: error });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const deleted = await categoryModel.delete(req.params.id as string);
      if (!deleted) {
        return res.status(400).json({ success: false, message: "Category has children or not found" });
      }
      res.json({ success: true, message: "Category deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to delete category", data: error });
    }
  },

  async list(req: Request, res: Response) {
    try {
      const filter = {
        isFeatured: req.query.featured === "true" ? true : req.query.featured === "false" ? false : undefined,
        isActive: req.query.active === "true" ? true : req.query.active === "false" ? false : undefined,
      };
      const categories = await categoryModel.findAll(filter);
      res.json({ success: true, data: categories.map(formatCategory) });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to list categories", data: error });
    }
  },

  async getTree(req: Request, res: Response) {
    try {
      const tree = await categoryModel.getTree();
      res.json({ success: true, data: tree.map((c) => formatCategory(c)) });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to get category tree", data: error });
    }
  },

  async getChildren(req: Request, res: Response) {
    try {
      const children = await categoryModel.findChildren(req.params.id as string);
      res.json({ success: true, data: children.map(formatCategory) });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to get children", data: error });
    }
  },

  async getRoots(req: Request, res: Response) {
    try {
      const roots = await categoryModel.findRootCategories();
      res.json({ success: true, data: roots.map(formatCategory) });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to get root categories", data: error });
    }
  },
};