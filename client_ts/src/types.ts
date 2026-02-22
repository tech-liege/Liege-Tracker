export type Priority = "low" | "medium" | "high";

export type Todo = {
  _id: string;
  text: string;
  completed: boolean;
  dueDate?: string | null;
  tags?: string[];
  priority?: Priority;
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

export type RoadmapTodo = {
  text: string;
  dueDate?: string | null;
  priority?: Priority;
  tags?: string[];
};

export type RoadmapMilestone = {
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  todos?: RoadmapTodo[];
};

export type Roadmap = {
  _id: string;
  user: string;
  goal: string;
  title: string;
  summary?: string;
  milestones?: RoadmapMilestone[];
  createdAt?: string;
  updatedAt?: string;
};

export type GenerateRoadmapResponse = {
  roadmap: Roadmap;
  todos: Todo[];
};

export type LayoutStatus = {
  title: string;
  detail: string;
  meta?: string;
};
