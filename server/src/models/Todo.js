import mongoose from "mongoose";

const todoSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    text: { type: String, required: true, trim: true },
    completed: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["todo", "in_progress", "done"],
      default: "todo",
    },
    dueDate: { type: Date },
    tags: [{ type: String, trim: true }],
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    roadmap: { type: mongoose.Schema.Types.ObjectId, ref: "Roadmap" },
    milestoneTitle: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model("Todo", todoSchema);
