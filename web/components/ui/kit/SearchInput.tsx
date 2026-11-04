import * as React from "react";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

export interface SearchInputProps
  extends Omit<React.ComponentProps<"input">, "className"> {
  className?: string;
  inputClassName?: string;
  shortcut?: string;
}

export function SearchInput({
  className,
  inputClassName,
  shortcut,
  placeholder = "Search…",
  ...props
}: SearchInputProps) {
  const { "aria-label": ariaLabel, ...rest } = props;

  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint"
        aria-hidden="true"
      />
      <input
        type="search"
        placeholder={placeholder}
        className={cn(
          "h-10 w-full rounded-pill border border-line bg-sunken/70 pl-10 pr-16 text-sm text-ink outline-none transition-[border-color,background-color,box-shadow] duration-200 placeholder:text-faint focus:border-brand focus:bg-surface focus:ring-4 focus:ring-brand/10 [&::-webkit-search-cancel-button]:appearance-none",
          inputClassName
        )}
        {...rest}
        aria-label={ariaLabel ?? "Search"}
      />
      {shortcut ? (
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-[6px] border border-line bg-surface px-1.5 py-0.5 text-[10px] font-medium text-faint shadow-soft">
          {shortcut}
        </kbd>
      ) : null}
    </div>
  );
}
