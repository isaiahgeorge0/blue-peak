"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { loginAdmin, type LoginState } from "@/app/admin/actions";
import { fieldClass, fieldLabelClass } from "@/components/admin/dialog";
import { primaryButton } from "@/components/admin/ui";

const initialState: LoginState = { error: null };

export function AdminLoginForm() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/admin";
  const [state, formAction, isPending] = useActionState(loginAdmin, initialState);

  return (
    <form action={formAction} method="post" className="space-y-5">
      <input type="hidden" name="next" value={nextPath} />
      <div>
        <label htmlFor="email" className={fieldLabelClass}>
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required className={fieldClass} />
      </div>
      <div>
        <label htmlFor="password" className={fieldLabelClass}>
          Password
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={fieldClass} />
      </div>
      {state.error ? (
        <p role="alert" className="rounded-lg border border-ridge-cyan/60 bg-brand/25 px-4 py-3 text-sm text-ink">
          {state.error}
        </p>
      ) : null}
      <button type="submit" className={`${primaryButton} w-full`} disabled={isPending}>
        {isPending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
