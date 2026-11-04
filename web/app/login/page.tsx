"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";

import { AuthShell } from "@/components/auth/AuthShell";
import { Button, Field, Input } from "@/components/ui/kit";
import {
  getApiErrorMessage,
  hasSession,
  loginRequest,
  persistSession,
} from "@/lib/api";

interface LoginValues {
  username: string;
  password: string;
}

type LoginErrors = Partial<Record<keyof LoginValues, string>>;

function validate(values: LoginValues): LoginErrors {
  const errors: LoginErrors = {};
  if (!values.username.trim()) errors.username = "Enter your username.";
  if (!values.password) errors.password = "Enter your password.";
  return errors;
}

function safeRedirectTarget(): string {
  const from = new URLSearchParams(window.location.search).get("from");
  if (from && from.startsWith("/") && !from.startsWith("//")) return from;
  return "/";
}

export default function LoginPage() {
  const router = useRouter();

  const [values, setValues] = useState<LoginValues>({
    username: "",
    password: "",
  });
  const [touched, setTouched] = useState<Record<keyof LoginValues, boolean>>({
    username: false,
    password: false,
  });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("registered") === "1") {
      setNotice("Account created. Sign in to continue.");
      return;
    }
    if (hasSession()) {
      router.replace(safeRedirectTarget());
    }
  }, [router]);

  const updateField = (key: keyof LoginValues, value: string) => {
    const next = { ...values, [key]: value };
    setValues(next);
    if (touched[key]) setErrors(validate(next));
  };

  const blurField = (key: keyof LoginValues) => {
    setTouched((current) => ({ ...current, [key]: true }));
    setErrors(validate(values));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setNotice(null);

    setTouched({ username: true, password: true });
    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (nextErrors.username) {
      usernameRef.current?.focus();
      return;
    }
    if (nextErrors.password) {
      passwordRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const { token } = await loginRequest(
        values.username.trim(),
        values.password
      );
      persistSession(token);
      router.replace(safeRedirectTarget());
      router.refresh();
    } catch (reason: unknown) {
      setFormError(getApiErrorMessage(reason));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Ticket support workspace"
      headline="Support that stays calm when the queue doesn’t."
      description="Relay brings tickets, people and progress into one clear workspace, so your team can answer faster and miss nothing."
    >
      <div>
        <h2 className="font-display text-title text-ink">Welcome back</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-body">
          Sign in to pick up where your team left off.
        </p>
      </div>

      {notice ? (
        <div
          role="status"
          className="mt-5 flex items-start gap-2 rounded-field border border-success/20 bg-success-soft px-3.5 py-3 text-[12px] leading-snug text-[#087443]"
        >
          <CheckCircle2
            className="mt-px size-4 shrink-0"
            aria-hidden="true"
          />
          {notice}
        </div>
      ) : null}

      {formError ? (
        <div
          role="alert"
          className="mt-5 flex items-start gap-2 rounded-field border border-danger/20 bg-danger-soft px-3.5 py-3 text-[12px] leading-snug text-[#b42318]"
        >
          <AlertCircle className="mt-px size-4 shrink-0" aria-hidden="true" />
          {formError}
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-6 space-y-4"
        aria-label="Sign in"
      >
        <Field
          label="Username"
          required
          error={touched.username ? errors.username : undefined}
        >
          <Input
            ref={usernameRef}
            name="username"
            autoComplete="username"
            placeholder="Your username"
            value={values.username}
            onChange={(event) => updateField("username", event.target.value)}
            onBlur={() => blurField("username")}
          />
        </Field>

        <Field
          label="Password"
          required
          error={touched.password ? errors.password : undefined}
        >
          <div className="relative">
            <Input
              ref={passwordRef}
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Your password"
              className="pr-11"
              value={values.password}
              onChange={(event) => updateField("password", event.target.value)}
              onBlur={() => blurField("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-faint outline-none transition-colors hover:bg-sunken hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </Field>

        <Button
          type="submit"
          size="md"
          disabled={submitting}
          className="mt-1 w-full"
        >
          {submitting ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-faint">
        New to Relay?{" "}
        <Link
          href="/register"
          className="font-semibold text-brand outline-none transition-colors hover:text-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
