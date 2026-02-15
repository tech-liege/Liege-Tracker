import { Router } from "express";
import requireAuth from "../middleware/auth.js";
import Roadmap from "../models/Roadmap.js";
import Todo from "../models/Todo.js";

const router = Router();
const priorities = new Set(["low", "medium", "high"]);
const maxMilestones = 6;
const maxTodosPerMilestone = 6;
const maxGoalLength = 300;

function toNonEmptyString(value, maxLength = 140) {
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
  const deduped = new Set();
  for (const tag of value) {
    const normalized = toNonEmptyString(tag, 24).toLowerCase();
    if (normalized) deduped.add(normalized);
    if (deduped.size >= 6) break;
  }
  return [...deduped];
}

function parseDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function extractJsonObject(rawContent) {
  const content = String(rawContent || "").trim();
  if (!content) throw new Error("OpenAI returned an empty response.");

  try {
    return JSON.parse(content);
  } catch (_err) {
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(content.slice(start, end + 1));
    }
    throw new Error("OpenAI response was not valid JSON.");
  }
}

function sanitizeRoadmapPlan(payload, goal) {
  const today = new Date();
  const title =
    toNonEmptyString(payload?.title, 140) || `Roadmap: ${goal.slice(0, 80)}`;
  const summary = toNonEmptyString(payload?.summary, 700);
  const rawMilestones = Array.isArray(payload?.milestones)
    ? payload.milestones.slice(0, maxMilestones)
    : [];

  const milestones = rawMilestones
    .map((milestone, milestoneIndex) => {
      const milestoneTitle =
        toNonEmptyString(milestone?.title, 120) ||
        `Milestone ${milestoneIndex + 1}`;
      const description = toNonEmptyString(milestone?.description, 400);

      const startDate = parseDate(milestone?.startDate);
      const endDate = parseDate(milestone?.endDate);

      const rawTodos = Array.isArray(milestone?.todos)
        ? milestone.todos.slice(0, maxTodosPerMilestone)
        : [];

      const todos = rawTodos
        .map((todo, todoIndex) => {
          const text = toNonEmptyString(todo?.text, 200);
          if (!text) return null;

          const dueDate =
            parseDate(todo?.dueDate) ||
            addDays(today, 7 * (milestoneIndex + 1) + todoIndex * 2);

          return {
            text,
            dueDate,
            priority: normalizePriority(todo?.priority),
            tags: normalizeTags(todo?.tags),
          };
        })
        .filter(Boolean);

      if (!todos.length) {
        todos.push({
          text: `Make progress on ${milestoneTitle}`,
          dueDate: addDays(today, 7 * (milestoneIndex + 1)),
          priority: "medium",
          tags: ["milestone"],
        });
      }

      return {
        title: milestoneTitle,
        description,
        startDate,
        endDate,
        todos,
      };
    })
    .filter((milestone) => milestone.todos.length > 0);

  if (!milestones.length) {
    milestones.push({
      title: "Initial Milestone",
      description: "Get momentum on the goal with a focused first step.",
      startDate: today,
      endDate: addDays(today, 7),
      todos: [
        {
          text: `Plan first actions for: ${goal.slice(0, 120)}`,
          dueDate: addDays(today, 2),
          priority: "high",
          tags: ["planning"],
        },
      ],
    });
  }

  return { title, summary, milestones };
}

async function generateRoadmapPlan(goal) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY.");
  }
  if (typeof fetch !== "function") {
    throw new Error("Global fetch is not available in this Node runtime.");
  }

  const today = new Date().toISOString().slice(0, 10);
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You generate actionable project roadmaps. Return JSON only with: title, summary, milestones[]. Each milestone must include title, description, startDate, endDate, todos[]. Each todo must include text, dueDate, priority(low|medium|high), tags(array). Use ISO date format YYYY-MM-DD.",
        },
        {
          role: "user",
          content: `Goal: ${goal}\nToday's date: ${today}\nCreate a practical roadmap with clear deadlines, priorities, and tags.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed (${response.status}): ${errorText.slice(0, 220)}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  const parsed = extractJsonObject(content);
  return sanitizeRoadmapPlan(parsed, goal);
}

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const roadmaps = await Roadmap.find({ user: req.userId }).sort({
      createdAt: -1,
    });
    return res.json(roadmaps);
  } catch (err) {
    return next(err);
  }
});

router.post("/generate", async (req, res, next) => {
  try {
    const goal = toNonEmptyString(req.body?.goal, maxGoalLength);
    if (!goal || goal.length < 5) {
      return res.status(400).send("Goal must be at least 5 characters.");
    }

    const plan = await generateRoadmapPlan(goal);
    const roadmap = await Roadmap.create({
      user: req.userId,
      goal,
      title: plan.title,
      summary: plan.summary,
      milestones: plan.milestones,
    });

    const todoDocs = [];
    for (const milestone of plan.milestones) {
      for (const todo of milestone.todos) {
        todoDocs.push({
          user: req.userId,
          text: todo.text,
          completed: false,
          dueDate: todo.dueDate,
          tags: todo.tags,
          priority: todo.priority,
          roadmap: roadmap._id,
          milestoneTitle: milestone.title,
        });
      }
    }

    const createdTodos = todoDocs.length ? await Todo.insertMany(todoDocs) : [];
    return res.status(201).json({ roadmap, todos: createdTodos });
  } catch (err) {
    if (
      String(err?.message || "").includes("OPENAI_API_KEY") ||
      String(err?.message || "").includes("OpenAI response") ||
      String(err?.message || "").includes("OpenAI request failed")
    ) {
      return res.status(500).send(err.message);
    }
    return next(err);
  }
});

export default router;
