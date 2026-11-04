"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import { Button, Field, Input, Modal, Segmented } from "@/components/ui/kit";
import { createTicket, fetchProjects, getApiErrorMessage } from "@/lib/api";
import {
  PRIORITY_LABEL,
  PRIORITY_ORDER,
  type TicketDto,
  type TicketPriority,
} from "@/lib/types";
import { useApi } from "@/lib/use-api";

import {
  fieldLabelClass,
  inlineErrorClass,
  selectClass,
  textareaClass,
} from "./form-styles";

interface FormErrors {
  title?: string;
  description?: string;
  projectId?: string;
}

const PRIORITY_OPTIONS = PRIORITY_ORDER.map((priority) => ({
  value: priority,
  label: PRIORITY_LABEL[priority],
}));

interface CreateTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (ticket: TicketDto) => void;
}

export function CreateTicketModal({
  open,
  onOpenChange,
  onCreated,
}: CreateTicketModalProps) {
  const projects = useApi(fetchProjects);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("MEDIUM");
  const [projectId, setProjectId] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!projectId && projects.data && projects.data.length > 0) {
      setProjectId(String(projects.data[0].id));
    }
  }, [projectId, projects.data]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const nextErrors: FormErrors = {};
    if (!title.trim()) {
      nextErrors.title = "Enter a ticket title.";
    } else if (title.trim().length > 255) {
      nextErrors.title = "Keep the title under 255 characters.";
    }
    if (!description.trim()) {
      nextErrors.description = "Describe the issue or request.";
    }
    if (!projectId) {
      nextErrors.projectId = "Choose a project.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const ticket = await createTicket({
        title: title.trim(),
        description: description.trim(),
        priority,
        projectId: Number(projectId),
      });
      onCreated(ticket);
    } catch (reason: unknown) {
      setFormError(
        getApiErrorMessage(reason, "We couldn't create the ticket.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="New ticket"
      description="Add it to the queue and the desk can pick it up."
      className="max-h-[90dvh] overflow-y-auto"
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-ticket-form"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                Creating…
              </>
            ) : (
              "Create ticket"
            )}
          </Button>
        </>
      }
    >
      <form
        id="create-ticket-form"
        onSubmit={handleSubmit}
        noValidate
        className="max-h-[60dvh] space-y-4 overflow-y-auto pr-1"
      >
        {formError ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-field border border-danger/20 bg-danger-soft px-3.5 py-3 text-[12px] leading-snug text-danger"
          >
            <AlertCircle
              className="mt-px size-4 shrink-0"
              aria-hidden="true"
            />
            {formError}
          </div>
        ) : null}

        <Field label="Title" required error={errors.title}>
          <Input
            name="title"
            placeholder="Short summary of the issue"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            autoFocus
          />
        </Field>

        <div className="space-y-1.5">
          <label htmlFor="create-description" className={fieldLabelClass}>
            Description
            <span className="text-danger" aria-hidden="true">
              *
            </span>
          </label>
          <textarea
            id="create-description"
            name="description"
            placeholder="What happened, and what did you expect?"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            aria-invalid={errors.description ? true : undefined}
            aria-describedby={
              errors.description ? "create-description-error" : undefined
            }
            className={textareaClass}
          />
          {errors.description ? (
            <p id="create-description-error" role="alert" className={inlineErrorClass}>
              <AlertCircle
                className="mt-px size-3.5 shrink-0"
                aria-hidden="true"
              />
              {errors.description}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <span className={fieldLabelClass}>Priority</span>
          <Segmented
            ariaLabel="Ticket priority"
            value={priority}
            onChange={setPriority}
            options={PRIORITY_OPTIONS}
            className="max-w-full flex-wrap"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="create-project" className={fieldLabelClass}>
            Project
            <span className="text-danger" aria-hidden="true">
              *
            </span>
          </label>
          <select
            id="create-project"
            name="projectId"
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
            disabled={projects.loading || Boolean(projects.error)}
            aria-invalid={errors.projectId ? true : undefined}
            aria-describedby={
              errors.projectId ? "create-project-error" : undefined
            }
            className={selectClass}
          >
            <option value="">
              {projects.loading ? "Loading projects…" : "Select a project"}
            </option>
            {(projects.data ?? []).map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          {projects.error ? (
            <div className="flex flex-wrap items-center gap-2">
              <p className={inlineErrorClass}>{projects.error}</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={projects.refetch}
              >
                Retry
              </Button>
            </div>
          ) : errors.projectId ? (
            <p id="create-project-error" role="alert" className={inlineErrorClass}>
              <AlertCircle
                className="mt-px size-3.5 shrink-0"
                aria-hidden="true"
              />
              {errors.projectId}
            </p>
          ) : null}
        </div>
      </form>
    </Modal>
  );
}
