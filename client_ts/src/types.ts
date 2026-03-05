export type TodoStatus = "todo" | "in_progress" | "done";
export type TodoPriority = "low" | "medium" | "high";

export type Todo = {
  _id: string;
  text: string;
  completed: boolean;
  status?: TodoStatus;
  dueDate?: string | null;
  tags?: string[];
  priority?: TodoPriority;
  roadmap?: string;
  milestoneTitle?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type User = {
  id: string;
  email: string;
  isGuest?: boolean;
};

export type Session = {
  token: string;
  user: User;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type RegistrationResponse = {
  token?: string;
  user?: User;
  requiresVerification?: boolean;
  message?: string;
};

export type RoadmapTodo = {
  text: string;
  dueDate?: string | null;
  priority?: TodoPriority;
  tags?: string[];
};

export type RoadmapMilestone = {
  title: string;
  description?: string;
  startDate?: string | null;
  endDate?: string | null;
  todos: RoadmapTodo[];
};

export type RoadmapPlan = {
  title: string;
  summary?: string;
  milestones: RoadmapMilestone[];
};

export type Roadmap = {
  _id: string;
  user: string;
  goal: string;
  title: string;
  summary?: string;
  milestones: RoadmapMilestone[];
  createdAt?: string;
  updatedAt?: string;
};

export type LayoutStatus = {
  title: string;
  detail: string;
  meta?: string;
};

export type DraftTodo = {
  text: string;
  dueDate: string;
  priority: TodoPriority;
  tags: string[];
};

export type DraftMilestone = {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  todos: DraftTodo[];
};

export type DraftPlan = {
  goal: string;
  title: string;
  summary: string;
  milestones: DraftMilestone[];
};
