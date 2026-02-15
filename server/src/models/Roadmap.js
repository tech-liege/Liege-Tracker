import mongoose from "mongoose";

const roadmapTodoSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    dueDate: { type: Date, required: true },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    tags: [{ type: String, trim: true }],
  },
  { _id: false },
);

const milestoneSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    startDate: { type: Date },
    endDate: { type: Date },
    todos: [roadmapTodoSchema],
  },
  { _id: false },
);

const roadmapSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    goal: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    summary: { type: String, trim: true },
    milestones: [milestoneSchema],
  },
  { timestamps: true },
);

export default mongoose.model("Roadmap", roadmapSchema);
