"use client";

import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface ModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function Modal({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  footer,
  className,
}: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent
        className={cn(
          "gap-0 overflow-hidden rounded-panel border-line bg-surface p-0 shadow-float sm:max-w-lg",
          className
        )}
      >
        <DialogHeader className="border-b border-line px-6 py-5 text-left">
          <DialogTitle className="font-display text-subheading text-ink">
            {title}
          </DialogTitle>
          {description ? (
            <DialogDescription className="text-[13px] text-faint">
              {description}
            </DialogDescription>
          ) : (
            <DialogDescription className="sr-only">{title}</DialogDescription>
          )}
        </DialogHeader>
        <div className="px-6 py-5">{children}</div>
        {footer ? (
          <DialogFooter className="border-t border-line bg-sunken/50 px-6 py-4">
            {footer}
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export { Modal as Dialog };
