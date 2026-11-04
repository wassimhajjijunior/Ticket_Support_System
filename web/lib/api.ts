import axios from "axios";
import api from "@/app/utils/api";
import type {
  ApiErrorBody,
  CommentDto,
  CreateTicketPayload,
  LoginResponse,
  ProjectDto,
  RegisterPayload,
  TicketDto,
  TicketStatsDto,
  UpdateTicketPayload,
  UpdateUserPayload,
  UserDto,
} from "./types";

export async function loginRequest(
  username: string,
  password: string
): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/login", {
    username,
    password,
  });
  return data;
}

export async function registerRequest(payload: RegisterPayload): Promise<void> {
  await api.post("/auth/register", payload);
}

export async function fetchStats(): Promise<TicketStatsDto> {
  const { data } = await api.get<TicketStatsDto>("/ticket/stats");
  return data;
}

export async function fetchAllTickets(): Promise<TicketDto[]> {
  const { data } = await api.get<TicketDto[]>("/ticket/allTickets");
  return Array.isArray(data) ? data : [];
}

export async function fetchCurrentUser(): Promise<UserDto> {
  const { data } = await api.get<UserDto>("/user/me");
  return data;
}

export async function fetchAllUsers(): Promise<UserDto[]> {
  const { data } = await api.get<UserDto[]>("/user/all");
  return Array.isArray(data) ? data : [];
}

export async function fetchAgents(): Promise<UserDto[]> {
  const { data } = await api.get<UserDto[]>("/user/agents");
  return Array.isArray(data) ? data : [];
}

export async function updateUser(
  id: number,
  payload: UpdateUserPayload
): Promise<UserDto> {
  const { data } = await api.put<UserDto>(`/user/${id}`, payload);
  return data;
}

export async function fetchProjects(): Promise<ProjectDto[]> {
  const { data } = await api.get<ProjectDto[]>("/project/allProjects");
  return Array.isArray(data) ? data : [];
}

export async function fetchTicket(id: number): Promise<TicketDto> {
  const { data } = await api.get<TicketDto>(`/ticket/TicketDetails/${id}`);
  return data;
}

export async function fetchComments(id: number): Promise<CommentDto[]> {
  const { data } = await api.get<CommentDto[]>(`/ticket/${id}/comments`);
  return Array.isArray(data) ? data : [];
}

export async function createTicket(
  payload: CreateTicketPayload
): Promise<TicketDto> {
  const { data } = await api.post<TicketDto>("/ticket/create", payload);
  return data;
}

export async function updateTicket(
  id: number,
  payload: UpdateTicketPayload
): Promise<TicketDto> {
  const { data } = await api.put<TicketDto>(
    `/ticket/TicketUpdate/${id}`,
    payload
  );
  return data;
}

export async function updateTicketStatus(
  id: number,
  status: TicketDto["status"]
): Promise<TicketDto> {
  const { data } = await api.patch<TicketDto>(`/ticket/${id}/status`, {
    status,
  });
  return data;
}

export async function assignTicket(
  id: number,
  assigneeId: number | null
): Promise<TicketDto> {
  const { data } = await api.patch<TicketDto>(`/ticket/${id}/assign`, {
    assigneeId,
  });
  return data;
}

export async function deleteTicket(id: number): Promise<void> {
  await api.delete(`/ticket/DeleteTicket/${id}`);
}

export async function addComment(
  ticketId: number,
  content: string
): Promise<CommentDto> {
  const { data } = await api.post<CommentDto>(`/ticket/${ticketId}/comments`, {
    content,
  });
  return data;
}

export function getApiErrorStatus(error: unknown): number | undefined {
  if (!axios.isAxiosError(error)) return undefined;
  return error.response?.status;
}

export function persistSession(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("token", token);
  document.cookie = `token=${token}; path=/; max-age=3600; SameSite=Lax`;
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  document.cookie = "token=; path=/; max-age=0; SameSite=Lax";
}

export function hasSession(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem("token"));
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  if (!axios.isAxiosError<ApiErrorBody>(error)) return fallback;

  const status = error.response?.status;
  const serverMessage = error.response?.data?.message;

  if (!error.response) {
    return "Can't reach the server. Check your connection and try again.";
  }
  if (status === 401) {
    return "Those credentials don't match. Check your username and password.";
  }
  if (status === 403) {
    return "You don't have permission to do that.";
  }
  if (status === 409) {
    return "That username or email is already in use.";
  }
  if (status === 429) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (status === 404) {
    return serverMessage ?? "We couldn't find what you were looking for.";
  }
  if (status === 400 && serverMessage) {
    return serverMessage;
  }
  if (serverMessage) {
    return serverMessage;
  }
  return fallback;
}
