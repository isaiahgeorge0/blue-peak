"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { loginAdmin, type LoginState } from "@/app/admin/actions";

const fieldClassName =
  "mt-2 w-full rounded-md border border-ink/15 bg-panel px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-accent focus:ring-2 focus:ring-accent/40";

const labelClassName = "block text-sm font-medium text-ink/85";

const buttonClassName =
  "inline-flex w-full items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-medium text-on-accent transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";

const initialState: LoginState = { error: null };

export function AdminLoginForm() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/admin";
  const [state, formAction, isPending] = useActionState(
    loginAdmin,
    initialState,
  );

  return (
    <form action={formAction} method="post" className="space-y-5">
      <input type="hidden" name="next" value={nextPath} />
      <div>
        <label htmlFor="email" className={labelClassName}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={fieldClassName}
        />
      </div>
      <div>
        <label htmlFor="password" className={labelClassName}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={fieldClassName}
        />
      </div>
      {state.error ? (
        <p
          role="alert"
          className="rounded-md border border-accent/40 bg-page px-4 py-3 text-sm text-ink"
        >
          {state.error}
        </p>
      ) : null}
      <button type="submit" className={buttonClassName} disabled={isPending}>
        {isPending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
