import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
    getTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    useTemplate
} from "../controllers/template.controller.js";

const router = express.Router();

// Get all templates for logged in user
router.get("/", protectRoute, getTemplates);

// Create a new template
router.post("/", protectRoute, createTemplate);

// Update a template
router.put("/:templateId", protectRoute, updateTemplate);

// Delete a template
router.delete("/:templateId", protectRoute, deleteTemplate);

// Mark template as used (increments counter)
router.post("/:templateId/use", protectRoute, useTemplate);

export default router;
