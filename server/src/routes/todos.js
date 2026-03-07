import { Router } from "express";
import Todo from "../models/Todo.js";
import requireAuth from "../middleware/auth.js";
import requireVerified from "../middleware/requireVerified.js";
import {
  normalizePriority,
  normalizeStatus,
  normalizeTags,
  parseNullableDate,
  toNonEmptyString,
} from "../utils/fields.js";

const router = Router();

function parseTodoUpdates(body) {
  const updates = {};

  if (typeof body.completed === "boolean") {
    updates.completed = body.completed;
    updates.status = body.completed ? "done" : "todo";
  }
  if (typeof body.status === "string") {
    updates.status = normalizeStatus(body.status);
    updates.completed = updates.status === "done";
  }
  if (typeof body.text === "string" && body.text.trim()) {
    updates.text = body.text.trim();
  }
  if (typeof body.priority === "string") {
    updates.priority = normalizePriority(body.priority);
  }
  if (Array.isArray(body.tags)) {
    updates.tags = normalizeTags(body.tags, 8);
  }
  if (Object.prototype.hasOwnProperty.call(body, "dueDate")) {
    const parsedDueDate = parseNullableDate(body.dueDate);
    if (typeof parsedDueDate !== "undefined") {
      updates.dueDate = parsedDueDate;
    }
  }

  return updates;
}

router.use(requireAuth, requireVerified);

router.get("/", async (req, res) => {
  const todos = await Todo.find({ user: req.userId }).sort({ createdAt: -1 });
  res.json(todos);
});

router.post("/", async (req, res) => {
  const { text } = req.body;
  const normalizedText = toNonEmptyString(text, 200);
  if (!normalizedText) {
    return res.status(400).send("Todo text is required.");
  }

  const dueDate = parseNullableDate(req.body?.dueDate);
  const status = normalizeStatus(req.body?.status);
  const payload = {
    priority: normalizePriority(req.body?.priority),
    tags: normalizeTags(req.body?.tags, 8),
    status,
    completed:
      typeof req.body?.completed === "boolean"
        ? Boolean(req.body.completed)
        : status === "done",
  };
  if (payload.completed && payload.status !== "done") {
    payload.status = "done";
  } else if (!payload.completed && payload.status === "done") {
    payload.completed = true;
  }
  if (typeof dueDate !== "undefined") {
    payload.dueDate = dueDate;
  }

  const todo = await Todo.create({
    text: normalizedText,
    user: req.userId,
    ...payload,
  });
  res.status(201).json(todo);
});

router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const updates = parseTodoUpdates(req.body || {});
  if (!Object.keys(updates).length) {
    return res.status(400).send("No valid updates provided.");
  }

  const todo = await Todo.findOneAndUpdate(
    { _id: id, user: req.userId },
    updates,
    {
      new: true,
      runValidators: true,
    },
  );

  if (!todo) return res.status(404).send("Todo not found.");
  res.json(todo);
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const todo = await Todo.findOneAndDelete({ _id: id, user: req.userId });
  if (!todo) return res.status(404).send("Todo not found.");
  res.json({ deleted: true });
});

export default router;
