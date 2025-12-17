import Template from "../models/Template.js";

// Get all templates for a user
export const getTemplates = async (req, res) => {
    try {
        const userId = req.user._id;

        const templates = await Template.find({ userId })
            .sort({ useCount: -1, createdAt: -1 });

        res.status(200).json(templates);
    } catch (error) {
        console.error("Error fetching templates:", error);
        res.status(500).json({ message: error.message });
    }
};

// Create a new template
export const createTemplate = async (req, res) => {
    try {
        const userId = req.user._id;
        const { name, text, category, shortcut } = req.body;

        if (!name || !text) {
            return res.status(400).json({ message: "Name and text are required" });
        }

        // Check if shortcut already exists for this user
        if (shortcut) {
            const existing = await Template.findOne({ userId, shortcut });
            if (existing) {
                return res.status(400).json({ message: "Shortcut already in use" });
            }
        }

        const template = await Template.create({
            userId,
            name,
            text,
            category: category || "general",
            shortcut: shortcut || null,
        });

        res.status(201).json(template);
    } catch (error) {
        console.error("Error creating template:", error);
        res.status(500).json({ message: error.message });
    }
};

// Update a template
export const updateTemplate = async (req, res) => {
    try {
        const userId = req.user._id;
        const { templateId } = req.params;
        const { name, text, category, shortcut } = req.body;

        const template = await Template.findById(templateId);
        if (!template) {
            return res.status(404).json({ message: "Template not found" });
        }

        if (template.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        // Check if new shortcut conflicts
        if (shortcut && shortcut !== template.shortcut) {
            const existing = await Template.findOne({ userId, shortcut });
            if (existing) {
                return res.status(400).json({ message: "Shortcut already in use" });
            }
        }

        template.name = name || template.name;
        template.text = text || template.text;
        template.category = category || template.category;
        template.shortcut = shortcut !== undefined ? shortcut : template.shortcut;

        await template.save();

        res.status(200).json(template);
    } catch (error) {
        console.error("Error updating template:", error);
        res.status(500).json({ message: error.message });
    }
};

// Delete a template
export const deleteTemplate = async (req, res) => {
    try {
        const userId = req.user._id;
        const { templateId } = req.params;

        const template = await Template.findById(templateId);
        if (!template) {
            return res.status(404).json({ message: "Template not found" });
        }

        if (template.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        await Template.findByIdAndDelete(templateId);

        res.status(200).json({ message: "Template deleted" });
    } catch (error) {
        console.error("Error deleting template:", error);
        res.status(500).json({ message: error.message });
    }
};

// Increment use count (called when template is used)
export const useTemplate = async (req, res) => {
    try {
        const userId = req.user._id;
        const { templateId } = req.params;

        const template = await Template.findById(templateId);
        if (!template || template.userId.toString() !== userId.toString()) {
            return res.status(404).json({ message: "Template not found" });
        }

        template.useCount += 1;
        await template.save();

        res.status(200).json(template);
    } catch (error) {
        console.error("Error using template:", error);
        res.status(500).json({ message: error.message });
    }
};
