export type TicketStatus = "PENDING" | "OPEN" | "EXECUTED" | "FINISHED";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type Role = "ADMIN" | "AGENT" | "USER";

export interface UserDto {
  id: number;
  username: string;
  email: string;
  role: Role;
  phone?: string | null;
  profileImagePath?: string | null;
}

export interface TicketDto {
  id: number;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  projectId: number;
  projectName: string;
  createdById: number;
  createdByName: string;
  assignedToId: number | null;
  assignedToName: string | null;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDto {
  id: number;
  name: string;
}

export interface CommentDto {
  id: number;
  ticketId: number;
  content: string;
  authorId: number;
  authorName: string;
  createdAt: string;
}

export interface CreateTicketPayload {
  title: string;
  description: string;
  priority: TicketPriority;
  projectId: number;
}

export interface UpdateTicketPayload {
  title: string;
  description: string;
  priority: TicketPriority;
  projectId: number;
}

export interface UpdateUserPayload {
  username: string;
  email: string;
  phone: string | null;
}

export interface DayStat {
  date: string;
  created: number;
  closed: number;
}

export interface TicketStatsDto {
  total: number;
  unassigned: number;
  byStatus: Partial<Record<TicketStatus, number>>;
  byPriority: Partial<Record<TicketPriority, number>>;
  myOpen: number;
  last7Days: DayStat[];
}

export interface LoginResponse {
  token: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  phone: string;
}

export interface ApiErrorBody {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  path?: string;
}

export const STATUS_ORDER: readonly TicketStatus[] = [
  "OPEN",
  "PENDING",
  "EXECUTED",
  "FINISHED",
] as const;

export const PRIORITY_ORDER: readonly TicketPriority[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
] as const;

export const STATUS_LABEL: Record<TicketStatus, string> = {
  OPEN: "Open",
  PENDING: "Pending",
  EXECUTED: "Executed",
  FINISHED: "Finished",
};

export const PRIORITY_LABEL: Record<TicketPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};
