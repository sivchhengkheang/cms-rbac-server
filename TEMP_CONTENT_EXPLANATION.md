Content Controller — Line-by-line Explanation

File: src/contollers/content.js

Overview: This controller implements CRUD for the Content model: list/filter (`getAllContent`), read (`getContentById`), create (`createContent`), delete (`deleteContent`), and update (`updateContent`). Each handler uses async/await, returns JSON with `success` and `data`/`message`, and logs errors to the console.

Detailed line-by-line explanation:

- `import Content from "../models/contentSchema.js";`
  - Imports the Mongoose `Content` model used for all DB operations in this file.

getAllContent
- Signature: `export const getAllContent = async (req, res) => {` — an exported async handler.
- `const { status, tag } = req.query;` — reads optional URL query parameters to filter results.
- `const filter = {};` — builds a dynamic Mongo filter object.
- `if (status) filter.status = status;` — include `status` in filter when provided.
- `if (tag) filter.tags = tag;` — include `tag` (will match array containment in Mongoose).
- `const contents = await Content.find(filter).populate("author", "username role");`
  - Executes the DB query and `populate`s the `author` reference, selecting only `username` and `role` fields.
- `res.status(200).json({ success: true, data: contents });` — returns the result.
- Error path: logs the error and returns HTTP 500 with a generic message.

getContentById
- `const { id } = req.params;` — route parameter `/content/:id`.
- `const content = await Content.findById(id).populate("author", "username role");` — fetch single doc with populated author.
- `if (!content) return res.status(404).json({ success: false, message: "Content not found" });` — 404 if absent.
- `res.status(200).json({ success: true, data: content });` — success response.
- Error path: logs and returns HTTP 500.

createContent
- `const { title, body, status, tags } = req.body;` — expect these in request JSON.
- `if (!title || !body) { return res.status(400)... }` — required-field validation for `title` and `body`.
- `const authorId = req.user?.id;` — reads authenticated user id set by `verifyToken` middleware.
- `if (!authorId) return res.status(401)...` — ensure request is authenticated.
- `const newContent = new Content({ title, body, status: status || "draft", tags: Array.isArray(tags) ? tags : tags ? [tags] : [], author: authorId });`
  - Normalizes `status` (default `draft`) and `tags` (accepts string or array, ensures array stored), sets `author` to the authenticated user.
- `await newContent.save();` — persists the document.
- `res.status(201).json({ success: true, data: newContent });` — returns created resource.
- Error path: logs and returns HTTP 500.

deleteContent
- `const { id } = req.params;` — get id parameter.
- `const content = await Content.findById(id);` — fetch to verify existence (and for potential auth checks).
- `if (!content) return res.status(404)...` — 404 if not found.
- `await Content.findByIdAndDelete(id);` — deletes the document.
- `res.status(200).json({ success: true, message: "Content deleted" });` — success response.
- Error path: logs and returns HTTP 500.

updateContent
- `const { id } = req.params;` — target id.
- `const updates = {};` — will collect fields to update.
- `const { title, body, status, tags, tag } = req.body;` — accept either `tags` array or single `tag` string.
- Field assignments:
  - `if (title !== undefined) updates.title = title;` — allows empty string or falsy values when explicitly provided.
  - `if (body !== undefined) updates.body = body;`
  - `if (status !== undefined) updates.status = status;`
  - `if (tags !== undefined) updates.tags = Array.isArray(tags) ? tags : [tags]; else if (tag !== undefined) updates.tags = [tag];` — normalize tags to an array.
- `const content = await Content.findById(id);` — load existing doc for existence and author check.
- `if (!content) return res.status(404)...` — 404 if missing.
- Authorization:
  - `const requesterRole = req.user?.role; const requesterId = req.user?.id;` — read role and id from `req.user`.
  - `const isAuthor = requesterId && content.author && content.author.toString() === requesterId;` — check if requester is the author.
  - `if (!isAuthor && !["Admin", "Manager"].includes(requesterRole)) { return res.status(403)... }` — forbid when not author or Admin/Manager.
- `const updated = await Content.findByIdAndUpdate(id, updates, { new: true });` — apply updates and return new doc.
- `res.status(200).json({ success: true, data: updated });` — return updated resource.
- Error path: logs and returns HTTP 500.

General notes and improvement suggestions:
- Input validation: the handlers perform minimal checks; use `express-validator` or Mongoose validation for stronger enforcement (title length, allowed `status`, etc.).
- Tags: controller accepts `tags` or `tag` and normalizes to an array; document this or accept single `tag` in API docs.
- Authorization: the router enforces JWT and role middleware; `updateContent` additionally allows the author. `deleteContent` is Admin-only via router configuration.
- Atomic updates: `updateContent` reads then updates — for strict author checks consider `findOneAndUpdate` with `{ _id: id, author: requesterId }` to atomically verify author.
- Pagination: `getAllContent` returns unpaginated results; add `limit`/`skip` or cursor pagination for large datasets.
- Logging: `console.error` used now — consider structured logging (winston/pino) for production.
- Error messages: avoid leaking internal details in production; provide consistent error shapes.

If you want, I can add `express-validator` validations, atomic author-only updates, or pagination. Specify which and I'll implement.
