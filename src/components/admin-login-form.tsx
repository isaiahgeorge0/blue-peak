"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { loginAdmin, type LoginState } from "@/app/admin/actions";

const fieldClassName =
  "mt-2 w-full rounded-md border border-off-white/15 bg-black px-4 py-3 text-sm text-off-white outline-none transition-colors placeholder:text-off-white/35 focus:border-baby-blue";

const labelClassName = "block text-sm font-medium text-off-white/85";

const buttonClassName =
  "inline-flex w-full items-center justify-center rounded-full bg-baby-blue px-6 py-3 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";

const initialState: LoginState = { error: null };

export function AdminLoginForm() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/admin/leads";
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
          className="rounded-md border border-baby-blue/40 bg-charcoal px-4 py-3 text-sm text-off-white"
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
