"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";

import { AuthShell } from "@/components/auth/AuthShell";
import { Button, Field, Input } from "@/components/ui/kit";
import { getApiErrorMessage, registerRequest } from "@/lib/api";

interface RegisterValues {
  username: string;
  email: string;
  phone: string;
  password: string;
}

type RegisterErrors = Partial<Record<keyof RegisterValues, string>>;

function validate(values: RegisterValues): RegisterErrors {
  const errors: RegisterErrors = {};

  if (!values.username.trim()) {
    errors.username = "Choose a username.";
  } else if (!/^[a-zA-Z0-9_.-]{3,}$/.test(values.username.trim())) {
    errors.username = "Use 3+ letters, numbers, dots or dashes.";
  }

  if (!values.email.trim()) {
    errors.email = "Enter your email address.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (values.phone.trim() && !/^[+\d][\d\s().-]{5,}$/.test(values.phone.trim())) {
    errors.phone = "Enter a valid phone number.";
  }

  if (!values.password) {
    errors.password = "Create a password.";
  } else if (values.password.length < 8) {
    errors.password = "Use at least 8 characters.";
  }

  return errors;
}

export default function RegisterPage() {
  const router = useRouter();

  const [values, setValues] = useState<RegisterValues>({
    username: "",
    email: "",
    phone: "",
    password: "",
  });
  const [touched, setTouched] = useState<Record<keyof RegisterValues, boolean>>({
    username: false,
    email: false,
    phone: false,
    password: false,
  });
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const updateField = (key: keyof RegisterValues, value: string) => {
    const next = { ...values, [key]: value };
    setValues(next);
    if (touched[key]) setErrors(validate(next));
  };

  const blurField = (key: keyof RegisterValues) => {
    setTouched((current) => ({ ...current, [key]: true }));
    setErrors(validate(values));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    setTouched({
      username: true,
      email: true,
      phone: true,
      password: true,
    });

    const nextErrors = validate(values);
    setErrors(nextErrors);

    const firstInvalid = (
      ["username", "email", "phone", "password"] as const
    ).find((key) => nextErrors[key]);
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    setSubmitting(true);
    try {
      await registerRequest({
        username: values.username.trim(),
        email: values.email.trim(),
        password: values.password,
        phone: values.phone.trim(),
      });
      router.push("/login?registered=1");
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
        <h2 className="font-display text-title text-ink">Create your account</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-body">
          Join the workspace and start triaging in minutes.
        </p>
      </div>

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
        aria-label="Create account"
      >
        <Field
          label="Username"
          required
          error={touched.username ? errors.username : undefined}
        >
          <Input
            name="username"
            autoComplete="username"
            placeholder="Choose a username"
            value={values.username}
            onChange={(event) => updateField("username", event.target.value)}
            onBlur={() => blurField("username")}
          />
        </Field>

        <Field
          label="Email"
          required
          error={touched.email ? errors.email : undefined}
        >
          <Input
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={values.email}
            onChange={(event) => updateField("email", event.target.value)}
            onBlur={() => blurField("email")}
          />
        </Field>

        <Field
          label="Phone"
          hint="Optional — helps your team reach you."
          error={touched.phone ? errors.phone : undefined}
        >
          <Input
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+216 00 000 000"
            value={values.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            onBlur={() => blurField("phone")}
          />
        </Field>

        <Field
          label="Password"
          required
          hint="At least 8 characters."
          error={touched.password ? errors.password : undefined}
        >
          <div className="relative">
            <Input
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Create a password"
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
              Creating account…
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-faint">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-brand outline-none transition-colors hover:text-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
