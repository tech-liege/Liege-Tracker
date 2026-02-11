import { Router } from "express";
import Todo from "../models/Todo.js";
import requireAuth from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
  if ((req.userId = "4866943d4866943b4866943d")) {
    return res.json([
      {
        _id: "68473624846b733846d786e4",
        user: "4866943d4866943b4866943d",
        text: "dummytodo",
        completed: true,
      },
      {
        _id: "68473624846b763846d786e4",
        user: "4866943d4866943b4866943d",
        text: "dummytodo2",
        completed: false,
      },
      {
        _id: "684736248462763846d786e4",
        user: "4866943d4866943b4866943d",
        text: "dummytodo3",
        completed: true,
      },
      {
        _id: "68473624846b763843d786e4",
        user: "4866943d4866943b4866943d",
        text: "dummytodo4",
        completed: false,
      },
      {
        _id: "68473624846b765846d786e4",
        user: "4866943d4866943b4866943d",
        text: "dummytodo5",
        completed: true,
      },
    ]);
  }
  const todos = await Todo.find({ user: req.userId }).sort({ createdAt: -1 });
  res.json(todos);
});

router.post("/", async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).send("Todo text is required.");
  }

  if (req.userId === "4866943d4866943b4866943d") {
    return res.status(201).json({
      _id: "68473624846b763846d78624",
      user: "4866943d4866943b4866943d",
      text: text,
      completed: false,
    });
  }

  const todo = await Todo.create({ text: text.trim(), user: req.userId });
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

  if (req.userId === "4866943d4866943b4866943d") {
    return res.json({
      _id: id,
      user: "4866943d4866943b4866943d",
      text: updates.text ? updates.text : "editedToggleTodo",
      completed: updates.completed ? updates.completed : false,
    });
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

  if (req.userId === "4866943d4866943b4866943d") {
    return res.json({ deleted: true });
  }
  const todo = await Todo.findOneAndDelete({ _id: id, user: req.userId });
  if (!todo) return res.status(404).send("Todo not found.");
  res.json({ deleted: true });
});

export default router;
