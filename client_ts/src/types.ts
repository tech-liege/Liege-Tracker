export type Todo = {
  _id: string;
  text: string;
  completed: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type User = {
  id: string;
  email: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};
