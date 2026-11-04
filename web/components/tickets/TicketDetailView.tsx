"use client";

import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  MessageSquare,
  Pencil,
  RefreshCw,
  Trash2,
} from "lucide-react";

import {
  Avatar,
  Button,
  Card,
  EmptyState,
  Modal,
  PriorityPill,
  SectionHeader,
  Skeleton,
  StatusPill,
} from "@/components/ui/kit";
import {
  addComment,
  assignTicket,
  deleteTicket,
  fetchAgents,
  fetchComments,
  fetchTicket,
  getApiErrorMessage,
  getApiErrorStatus,
  updateTicketStatus,
} from "@/lib/api";
import { longDate, relativeTime } from "@/lib/format";
import {
  STATUS_LABEL,
  STATUS_ORDER,
  type CommentDto,
  type TicketDto,
  type TicketStatus,
  type UserDto,
} from "@/lib/types";
import { useApi } from "@/lib/use-api";

import { EditTicketModal } from "./EditTicketModal";
import { inlineErrorClass, selectClass, textareaClass } from "./form-styles";

interface DetailData {
  ticket: TicketDto;
  comments: CommentDto[];
  agents: UserDto[];
}

type BusyAction = "status" | "assign" | "delete" | null;

function DetailSkeleton() {
  return (
    <div role="status" aria-label="Loading ticket" className="space-y-4">
      <Skeleton className="h-9 w-32 rounded-pill" />
      <Skeleton className="h-64 w-full rounded-card" />
      <Skeleton className="h-44 w-full rounded-card" />
      <Skeleton className="h-72 w-full rounded-card" />
      <span className="sr-only">Loading ticket…</span>
    </div>
  );
}

function DetailError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm">
        <Link href="/AllTickets">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to queue
        </Link>
      </Button>
      <Card className="flex flex-col items-center px-6 py-14 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-danger-soft text-danger">
          <AlertCircle className="size-5" aria-hidden="true" />
        </span>
        <h2 className="mt-4 font-display text-heading text-ink">
          We couldn&apos;t load this ticket
        </h2>
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-faint">
          {message}
        </p>
        <Button onClick={onRetry} className="mt-5">
          <RefreshCw className="size-4" aria-hidden="true" />
          Try again
        </Button>
      </Card>
    </div>
  );
}

export function TicketDetailView({ ticketId }: { ticketId: number }) {
  const router = useRouter();

  const [ticket, setTicket] = useState<TicketDto | null>(null);
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [agents, setAgents] = useState<UserDto[]>([]);
  const [missing, setMissing] = useState(false);

  const [busyAction, setBusyAction] = useState<BusyAction>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [commentText, setCommentText] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [postingComment, setPostingComment] = useState(false);

  const load = useCallback(async (): Promise<DetailData> => {
    try {
      const [nextTicket, nextComments, nextAgents] = await Promise.all([
        fetchTicket(ticketId),
        fetchComments(ticketId),
        fetchAgents(),
      ]);
      return {
        ticket: nextTicket,
        comments: nextComments,
        agents: nextAgents,
      };
    } catch (reason: unknown) {
      if (getApiErrorStatus(reason) === 404) setMissing(true);
      throw reason;
    }
  }, [ticketId]);

  const { data, error, loading, refetch } = useApi(load);

  useEffect(() => {
    if (!data) return;
    setTicket(data.ticket);
    setComments(data.comments);
    setAgents(data.agents);
  }, [data]);

  const currentTicket = ticket ?? data?.ticket ?? null;
  const currentComments = ticket ? comments : (data?.comments ?? []);
  const currentAgents = ticket ? agents : (data?.agents ?? []);

  if (missing) {
    notFound();
  }

  if (loading && !currentTicket) {
    return <DetailSkeleton />;
  }

  if (error && !currentTicket) {
    return <DetailError message={error} onRetry={refetch} />;
  }

  if (!currentTicket) {
    return <DetailSkeleton />;
  }

  const handleStatus = async (nextStatus: TicketStatus) => {
    if (nextStatus === currentTicket.status || busyAction) return;
    setBusyAction("status");
    setActionError(null);
    try {
      const updated = await updateTicketStatus(
        currentTicket.id,
        nextStatus
      );
      setTicket(updated);
    } catch (reason: unknown) {
      setActionError(
        getApiErrorMessage(reason, "We couldn't update the status.")
      );
    } finally {
      setBusyAction(null);
    }
  };

  const handleAssign = async (value: string) => {
    if (busyAction) return;
    const assigneeId = value === "unassigned" ? null : Number(value);
    if (assigneeId === currentTicket.assignedToId) return;
    setBusyAction("assign");
    setActionError(null);
    try {
      const updated = await assignTicket(currentTicket.id, assigneeId);
      setTicket(updated);
    } catch (reason: unknown) {
      setActionError(
        getApiErrorMessage(reason, "We couldn't assign the ticket.")
      );
    } finally {
      setBusyAction(null);
    }
  };

  const handleDelete = async () => {
    if (busyAction) return;
    setBusyAction("delete");
    setDeleteError(null);
    try {
      await deleteTicket(currentTicket.id);
      setDeleteOpen(false);
      router.push("/AllTickets");
      router.refresh();
    } catch (reason: unknown) {
      setDeleteError(
        getApiErrorMessage(reason, "We couldn't delete the ticket.")
      );
      setBusyAction(null);
    }
  };

  const handleComment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = commentText.trim();
    if (!content) {
      setCommentError("Write a comment before posting.");
      return;
    }

    setPostingComment(true);
    setCommentError(null);
    try {
      const created = await addComment(currentTicket.id, content);
      setComments((current) => [...current, created]);
      setTicket((current) =>
        current
          ? { ...current, commentCount: current.commentCount + 1 }
          : current
      );
      setCommentText("");
    } catch (reason: unknown) {
      setCommentError(
        getApiErrorMessage(reason, "We couldn't post your comment.")
      );
    } finally {
      setPostingComment(false);
    }
  };

  const handleUpdated = (updated: TicketDto) => {
    setTicket(updated);
    setEditOpen(false);
  };

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm">
        <Link href="/AllTickets">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to queue
        </Link>
      </Button>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-faint">
                #{currentTicket.id}
              </span>
              <StatusPill status={currentTicket.status} />
              <PriorityPill priority={currentTicket.priority} />
            </div>
            <h2 className="mt-2 break-words font-display text-heading text-ink">
              {currentTicket.title}
            </h2>
            <p className="mt-1 text-[12px] text-faint">
              Created by {currentTicket.createdByName} ·{" "}
              {currentTicket.projectName}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="size-4" aria-hidden="true" />
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setDeleteError(null);
                setDeleteOpen(true);
              }}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Delete
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="ticket-status"
              className="text-[13px] font-medium text-ink"
            >
              Status
            </label>
            <select
              id="ticket-status"
              value={currentTicket.status}
              onChange={(event) =>
                void handleStatus(event.target.value as TicketStatus)
              }
              disabled={busyAction !== null}
              className={selectClass}
            >
              {STATUS_ORDER.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABEL[status]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="ticket-assignee"
              className="text-[13px] font-medium text-ink"
            >
              Assignee
            </label>
            <select
              id="ticket-assignee"
              value={
                currentTicket.assignedToId
                  ? String(currentTicket.assignedToId)
                  : "unassigned"
              }
              onChange={(event) => void handleAssign(event.target.value)}
              disabled={busyAction !== null}
              className={selectClass}
            >
              <option value="unassigned">Unassigned</option>
              {currentAgents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.username}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-faint">
          <span>Created {longDate(currentTicket.createdAt)}</span>
          <span>Updated {relativeTime(currentTicket.updatedAt)}</span>
          <span>
            {currentTicket.commentCount}{" "}
            {currentTicket.commentCount === 1 ? "comment" : "comments"}
          </span>
        </div>

        {actionError ? (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-field border border-danger/20 bg-danger-soft px-3.5 py-3 text-[12px] leading-snug text-danger"
          >
            <AlertCircle
              className="mt-px size-4 shrink-0"
              aria-hidden="true"
            />
            {actionError}
          </div>
        ) : null}
      </Card>

      <Card className="p-5 sm:p-6">
        <SectionHeader title="Description" />
        <p className="mt-3 whitespace-pre-line break-words text-[13px] leading-relaxed text-body">
          {currentTicket.description}
        </p>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-line px-5 py-4 sm:px-6">
          <SectionHeader
            title="Comments"
            description={
              currentComments.length === 0
                ? "No replies yet. Start the thread."
                : `${currentComments.length} ${
                    currentComments.length === 1 ? "reply" : "replies"
                  }, oldest first.`
            }
          />
        </div>

        {currentComments.length === 0 ? (
          <EmptyState
            compact
            icon={MessageSquare}
            title="No comments yet"
            description="Add the first note so the thread has context."
          />
        ) : (
          <ul className="divide-y divide-line/70">
            {currentComments.map((comment) => (
              <li
                key={comment.id}
                className="flex gap-3 px-5 py-4 sm:px-6"
              >
                <Avatar
                  name={comment.authorName}
                  size="sm"
                  className="ring-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <p className="text-[12px] font-semibold text-ink">
                      {comment.authorName}
                    </p>
                    <p className="text-[11px] text-faint">
                      {relativeTime(comment.createdAt)}
                    </p>
                  </div>
                  <p className="mt-1 whitespace-pre-line break-words text-[13px] leading-relaxed text-body">
                    {comment.content}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="border-t border-line px-5 py-4 sm:px-6">
          <form onSubmit={handleComment} noValidate>
            <label htmlFor="comment-content" className="sr-only">
              Add a comment
            </label>
            <textarea
              id="comment-content"
              name="comment"
              placeholder="Write a reply…"
              value={commentText}
              onChange={(event) => {
                setCommentText(event.target.value);
                if (commentError) setCommentError(null);
              }}
              aria-invalid={commentError ? true : undefined}
              aria-describedby={
                commentError ? "comment-content-error" : undefined
              }
              className={textareaClass}
            />
            {commentError ? (
              <p
                id="comment-content-error"
                role="alert"
                className={`mt-1.5 ${inlineErrorClass}`}
              >
                <AlertCircle
                  className="mt-px size-3.5 shrink-0"
                  aria-hidden="true"
                />
                {commentError}
              </p>
            ) : null}
            <div className="mt-2 flex justify-end">
              <Button type="submit" size="sm" disabled={postingComment}>
                {postingComment ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden="true" />
                    Posting…
                  </>
                ) : (
                  "Post comment"
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>

      {editOpen ? (
        <EditTicketModal
          open={editOpen}
          onOpenChange={setEditOpen}
          ticket={currentTicket}
          onUpdated={handleUpdated}
        />
      ) : null}

      <Modal
        open={deleteOpen}
        onOpenChange={(next) => {
          setDeleteOpen(next);
          if (!next) setDeleteError(null);
        }}
        title={`Delete ticket #${currentTicket.id}?`}
        description="This permanently removes the ticket and its comments. This can't be undone."
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDeleteOpen(false)}
              disabled={busyAction === "delete"}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => void handleDelete()}
              disabled={busyAction === "delete"}
            >
              {busyAction === "delete" ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden="true" />
                  Deleting…
                </>
              ) : (
                "Delete ticket"
              )}
            </Button>
          </>
        }
      >
        <p className="text-[13px] leading-relaxed text-body">
          You&apos;re about to delete{" "}
          <span className="font-semibold text-ink">
            {currentTicket.title}
          </span>
          . This action cannot be undone.
        </p>
        {deleteError ? (
          <div
            role="alert"
            className="mt-3 flex items-start gap-2 rounded-field border border-danger/20 bg-danger-soft px-3.5 py-3 text-[12px] leading-snug text-danger"
          >
            <AlertCircle
              className="mt-px size-4 shrink-0"
              aria-hidden="true"
            />
            {deleteError}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
