import Content from "../models/contentSchema.js";
import { getIO } from "../socket.js";

// Get all content (optionally filter by status or tag)
export const getAllContent = async (req, res) => {
  try {
    const { status, tag } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (tag) filter.tags = tag;

    const contents = await Content.find(filter).populate(
      "author",
      "username role password",
    );
    res.status(200).json({ success: true, data: contents });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch content" });
  }
};

// Get single content by id
export const getContentById = async (req, res) => {
  try {
    const { id } = req.params;
    const content = await Content.findById(id).populate(
      "author",
      "username role",
    );
    if (!content)
      return res
        .status(404)
        .json({ success: false, message: "Content not found" });
    res.status(200).json({ success: true, data: content });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch content" });
  }
};

// Create content
export const createContent = async (req, res) => {
  try {
    const { title, body, status, tags } = req.body;
    if (!title || !body) {
      return res
        .status(400)
        .json({ success: false, message: "Title and body are required" });
    }

    const authorId = req.user?.id;
    if (!authorId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const newContent = new Content({
      title,
      body,
      status: status || "draft",
      tags: Array.isArray(tags) ? tags : tags ? [tags] : [],
      author: authorId,
    });

    await newContent.save();
    try {
      getIO().emit("content:created", newContent);
      getIO().emit("content:changed");
    } catch (e) {
      // socket may not be initialized in some environments
    }
    res.status(201).json({ success: true, data: newContent });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Failed to create content" });
  }
};

// Delete content
export const deleteContent = async (req, res) => {
  try {
    const { id } = req.params;
    const content = await Content.findById(id);
    if (!content)
      return res
        .status(404)
        .json({ success: false, message: "Content not found" });

    await Content.findByIdAndDelete(id);
    try {
      getIO().emit("content:deleted", { id });
      getIO().emit("content:changed");
    } catch (e) {}
    res.status(200).json({ success: true, message: "Content deleted" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete content" });
  }
};

// Update content
export const updateContent = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};
    const { title, body, status, tags, tag } = req.body;

    if (title !== undefined) updates.title = title;
    if (body !== undefined) updates.body = body;
    if (status !== undefined) updates.status = status;
    // accept either `tags` array or single `tag` string
    if (tags !== undefined) updates.tags = Array.isArray(tags) ? tags : [tags];
    else if (tag !== undefined) updates.tags = [tag];

    const content = await Content.findById(id);
    if (!content)
      return res
        .status(404)
        .json({ success: false, message: "Content not found" });

    // Authorization: allow Admin and Manager in middleware; additionally allow the author to edit
    const requesterRole = req.user?.role;
    const requesterId = req.user?.id;
    const isAuthor =
      requesterId &&
      content.author &&
      content.author.toString() === requesterId;
    if (!isAuthor && !["Admin", "Manager"].includes(requesterRole)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: insufficient permissions to update content",
      });
    }

    const updated = await Content.findByIdAndUpdate(id, updates, { new: true });
    try {
      getIO().emit("content:updated", updated);
      getIO().emit("content:changed");
    } catch (e) {}
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Failed to update content" });
  }
};
