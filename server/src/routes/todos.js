import { Router } from "express";
import mongoose from "mongoose";
import Todo from "../models/Todo.js";
import requireAuth from "../middleware/auth.js";

const router = Router();
const demoUserId = "4866943d4866943b4866943d";
const priorities = new Set(["low", "medium", "high"]);

const demoTodos = [
  {
    _id: "68473624846b733846d786e4",
    user: demoUserId,
    text: "dummytodo",
    completed: true,
    priority: "medium",
    tags: ["demo"],
    dueDate: "2026-02-20T00:00:00.000Z",
    createdAt: "2026-02-01T00:00:00.000Z",
    updatedAt: "2026-02-01T00:00:00.000Z",
  },
  {
    _id: "68473624846b763846d786e4",
    user: demoUserId,
    text: "dummytodo2",
    completed: false,
    priority: "high",
    tags: ["demo", "urgent"],
    dueDate: "2026-02-18T00:00:00.000Z",
    createdAt: "2026-02-02T00:00:00.000Z",
    updatedAt: "2026-02-02T00:00:00.000Z",
  },
  {
    _id: "684736248462763846d786e4",
    user: demoUserId,
    text: "dummytodo3",
    completed: true,
    priority: "low",
    tags: ["demo"],
    dueDate: "2026-03-01T00:00:00.000Z",
    createdAt: "2026-02-03T00:00:00.000Z",
    updatedAt: "2026-02-03T00:00:00.000Z",
  },
];

function toNonEmptyString(value, maxLength = 200) {
  const normalized = String(value || "").trim().replace(/\s+/g, " ");
  if (!normalized) return "";
  return normalized.slice(0, maxLength);
}

function normalizePriority(value) {
  const normalized = toNonEmptyString(value, 20).toLowerCase();
  return priorities.has(normalized) ? normalized : "medium";
}

function normalizeTags(value) {
  if (!Array.isArray(value)) return [];
  const unique = new Set();
  for (const tag of value) {
    const normalized = toNonEmptyString(tag, 24).toLowerCase();
    if (normalized) unique.add(normalized);
    if (unique.size >= 8) break;
  }
  return [...unique];
}

function parseDateOrNull(value) {
  if (value === null) return null;
  if (typeof value === "undefined") return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
}

function parseTodoUpdates(body) {
  const updates = {};

  if (typeof body.completed === "boolean") {
    updates.completed = body.completed;
  }
  if (typeof body.text === "string" && body.text.trim()) {
    updates.text = body.text.trim();
  }
  if (typeof body.priority === "string") {
    updates.priority = normalizePriority(body.priority);
  }
  if (Array.isArray(body.tags)) {
    updates.tags = normalizeTags(body.tags);
  }
  if (Object.prototype.hasOwnProperty.call(body, "dueDate")) {
    const parsedDueDate = parseDateOrNull(body.dueDate);
    if (typeof parsedDueDate !== "undefined") {
      updates.dueDate = parsedDueDate;
    }
  }

  return updates;
}

router.use(requireAuth);

router.get("/", async (req, res) => {
  if (req.userId === demoUserId) {
    try {
      const storedDemoTodos = await Todo.find({ user: req.userId }).sort({
        createdAt: -1,
      });
      if (storedDemoTodos.length > 0) {
        return res.json(storedDemoTodos);
      }
    } catch (_err) {
      // Fallback to in-memory demo todos when DB is unavailable.
    }
    return res.json([...demoTodos].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)));
  }
  const todos = await Todo.find({ user: req.userId }).sort({ createdAt: -1 });
  res.json(todos);
});

router.post("/", async (req, res) => {
  const { text } = req.body;
  const normalizedText = toNonEmptyString(text);
  if (!normalizedText) {
    return res.status(400).send("Todo text is required.");
  }

  const dueDate = parseDateOrNull(req.body?.dueDate);
  const payload = {
    priority: normalizePriority(req.body?.priority),
    tags: normalizeTags(req.body?.tags),
  };
  if (typeof dueDate !== "undefined") {
    payload.dueDate = dueDate;
  }

  if (req.userId === demoUserId) {
    try {
      const created = await Todo.create({
        text: normalizedText,
        user: req.userId,
        ...payload,
      });
      return res.status(201).json(created);
    } catch (_err) {
      // Fallback to in-memory demo todos when DB is unavailable.
    }

    const now = new Date().toISOString();
    const todo = {
      _id: new mongoose.Types.ObjectId().toString(),
      user: demoUserId,
      text: normalizedText,
      completed: false,
      dueDate: payload.dueDate ? payload.dueDate.toISOString() : null,
      tags: payload.tags,
      priority: payload.priority,
      createdAt: now,
      updatedAt: now,
    };
    demoTodos.unshift(todo);
    return res.status(201).json(todo);
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

  if (req.userId === demoUserId) {
    try {
      const storedTodo = await Todo.findOneAndUpdate(
        { _id: id, user: req.userId },
        updates,
        {
          new: true,
          runValidators: true,
        },
      );
      if (storedTodo) return res.json(storedTodo);
    } catch (_err) {
      // Fallback to in-memory demo todos when DB is unavailable.
    }

    const todoIndex = demoTodos.findIndex((todo) => todo._id === id);
    if (todoIndex === -1) return res.status(404).send("Todo not found.");

    const updated = {
      ...demoTodos[todoIndex],
      ...updates,
      dueDate:
        updates.dueDate === null
          ? null
          : updates.dueDate
            ? updates.dueDate.toISOString()
            : demoTodos[todoIndex].dueDate,
      updatedAt: new Date().toISOString(),
    };
    demoTodos[todoIndex] = updated;
    return res.json(updated);
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

  if (req.userId === demoUserId) {
    try {
      const storedTodo = await Todo.findOneAndDelete({ _id: id, user: req.userId });
      if (storedTodo) return res.json({ deleted: true });
    } catch (_err) {
      // Fallback to in-memory demo todos when DB is unavailable.
    }

    const todoIndex = demoTodos.findIndex((todo) => todo._id === id);
    if (todoIndex === -1) return res.status(404).send("Todo not found.");
    demoTodos.splice(todoIndex, 1);
    return res.json({ deleted: true });
  }
  const todo = await Todo.findOneAndDelete({ _id: id, user: req.userId });
  if (!todo) return res.status(404).send("Todo not found.");
  res.json({ deleted: true });
});

export default router;
