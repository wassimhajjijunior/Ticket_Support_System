"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from "lucide-react";

import {
  Button,
  Card,
  Field,
  Input,
  SectionHeader,
  Skeleton,
} from "@/components/ui/kit";
import { getApiErrorMessage, updateUser } from "@/lib/api";
import { useCurrentUser } from "@/lib/current-user";

interface ProfileValues {
  username: string;
  email: string;
  phone: string;
}

type ProfileErrors = Partial<Record<keyof ProfileValues, string>>;

function validate(values: ProfileValues): ProfileErrors {
  const errors: ProfileErrors = {};

  if (!values.username.trim()) {
    errors.username = "Enter your username.";
  } else if (values.username.trim().length > 255) {
    errors.username = "Keep the username under 255 characters.";
  }

  if (!values.email.trim()) {
    errors.email = "Enter your email.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (values.phone.trim().length > 30) {
    errors.phone = "Keep the phone number under 30 characters.";
  }

  return errors;
}

function SettingsSkeleton() {
  return (
    <div role="status" aria-label="Loading settings" className="space-y-4">
      <div className="space-y-2 px-1">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-3 w-72 max-w-full" />
      </div>
      <Card className="max-w-2xl p-5 sm:p-6">
        <div className="space-y-5">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-11 w-full rounded-field" />
            </div>
          ))}
          <Skeleton className="h-10 w-32 rounded-pill" />
        </div>
      </Card>
      <span className="sr-only">Loading settings…</span>
    </div>
  );
}

export function SettingsView() {
  const { user, loading, error, refresh } = useCurrentUser();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState<Record<keyof ProfileValues, boolean>>({
    username: false,
    email: false,
    phone: false,
  });
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    setUsername(user.username);
    setEmail(user.email);
    setPhone(user.phone ?? "");
  }, [user]);

  if (loading && !user) {
    return <SettingsSkeleton />;
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <SectionHeader
          title="Settings"
          description="Your account details across Relay."
        />
        <Card className="flex max-w-2xl flex-col items-center px-6 py-14 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-danger-soft text-danger">
            <AlertCircle className="size-5" aria-hidden="true" />
          </span>
          <h2 className="mt-4 font-display text-heading text-ink">
            We couldn&apos;t load your profile
          </h2>
          <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-faint">
            {error ?? "The profile endpoint returned no data."}
          </p>
          <Button onClick={refresh} className="mt-5">
            <RefreshCw className="size-4" aria-hidden="true" />
            Try again
          </Button>
        </Card>
      </div>
    );
  }

  const values: ProfileValues = { username, email, phone };

  const updateField = (key: keyof ProfileValues, value: string) => {
    const next = { ...values, [key]: value };
    if (key === "username") setUsername(value);
    if (key === "email") setEmail(value);
    if (key === "phone") setPhone(value);
    if (touched[key]) setErrors(validate(next));
  };

  const blurField = (key: keyof ProfileValues) => {
    setTouched((current) => ({ ...current, [key]: true }));
    setErrors(validate(values));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setSuccess(null);
    setTouched({ username: true, email: true, phone: true });

    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const updated = await updateUser(user.id, {
        username: username.trim(),
        email: email.trim(),
        phone: phone.trim() ? phone.trim() : null,
      });
      setSuccess(`Profile saved. Signed in as ${updated.username}.`);
      refresh();
    } catch (reason: unknown) {
      setFormError(
        getApiErrorMessage(reason, "We couldn't save your profile.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Settings"
        description="Update the details your team sees across Relay."
      />

      <Card className="max-w-2xl p-5 sm:p-6">
        <SectionHeader
          title="Profile"
          description="Your name, email and phone number."
        />

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-5 space-y-4"
          aria-label="Profile settings"
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

          {success ? (
            <div
              role="status"
              className="flex items-start gap-2 rounded-field border border-success/20 bg-success-soft px-3.5 py-3 text-[12px] leading-snug text-success"
            >
              <CheckCircle2
                className="mt-px size-4 shrink-0"
                aria-hidden="true"
              />
              {success}
            </div>
          ) : null}

          <Field
            label="Username"
            required
            error={touched.username ? errors.username : undefined}
          >
            <Input
              name="username"
              autoComplete="username"
              value={username}
              onChange={(event) =>
                updateField("username", event.target.value)
              }
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
              autoComplete="email"
              value={email}
              onChange={(event) => updateField("email", event.target.value)}
              onBlur={() => blurField("email")}
            />
          </Field>

          <Field
            label="Phone"
            error={touched.phone ? errors.phone : undefined}
            hint="Optional. Used only to reach you about your tickets."
          >
            <Input
              name="phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(event) => updateField("phone", event.target.value)}
              onBlur={() => blurField("phone")}
            />
          </Field>

          <Field
            label="Role"
            hint="Roles are managed by an administrator."
          >
            <Input
              name="role"
              value={user.role}
              readOnly
              disabled
              aria-readonly="true"
            />
          </Field>

          <div className="flex justify-end pt-1">
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden="true" />
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
