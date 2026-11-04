"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";

type ControlProps = React.InputHTMLAttributes<HTMLInputElement> & {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false";
};

export interface FieldProps {
  label: string;
  children: React.ReactElement<ControlProps>;
  error?: string;
  hint?: string;
  required?: boolean;
  htmlFor?: string;
  className?: string;
}

export function Field({
  label,
  children,
  error,
  hint,
  required = false,
  htmlFor,
  className,
}: FieldProps) {
  const generatedId = React.useId();
  const id = htmlFor ?? generatedId;
  const descriptionId = error
    ? `${id}-error`
    : hint
      ? `${id}-hint`
      : undefined;

  const control = React.isValidElement<ControlProps>(children)
    ? React.cloneElement(children, {
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": descriptionId,
      })
    : children;

  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={id}
        className="flex items-center gap-1 text-[13px] font-medium text-ink"
      >
        {label}
        {required ? (
          <span className="text-danger" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {control}
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="flex items-start gap-1.5 text-[12px] leading-snug text-danger"
        >
          <AlertCircle
            className="mt-px size-3.5 shrink-0"
            aria-hidden="true"
          />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[12px] text-faint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
