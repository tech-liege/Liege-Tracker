import { Router } from "express";
import Todo from "../models/Todo.js";

const router = Router();

router.get("/", async (_req, res) => {
  const todos = await Todo.find().sort({ createdAt: -1 });
  res.json(todos);
});

router.post("/", async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).send("Todo text is required.");
  }

  const todo = await Todo.create({ text: text.trim() });
  res.status(201).json(todo);
});

router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const updates = {};

  if (typeof req.body.completed === "boolean") {
    updates.completed = req.body.completed;
  }
  if (typeof req.body.text === "string" && req.body.text.trim()) {
    updates.text = req.body.text.trim();
  }

  const todo = await Todo.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true
  });

  if (!todo) return res.status(404).send("Todo not found.");
  res.json(todo);
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const todo = await Todo.findByIdAndDelete(id);
  if (!todo) return res.status(404).send("Todo not found.");
  res.json({ deleted: true });
});

export default router;
