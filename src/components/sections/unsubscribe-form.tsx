"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, MailX } from "lucide-react";
import Button from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/form-field";
import { unsubscribe, type UnsubscribeState } from "@/app/(storefront)/unsubscribe/actions";

const initialState: UnsubscribeState = {};

type UnsubscribeFormProps = {
  /** Pre-filled from a verified `?email=&token=` link — see the page
   * component. Never trusted here; the Server Action re-verifies the
   * token itself on every submit. */
  initialEmail?: string;
  /** Only rendered as a hidden field when the page already verified it —
   * a form loaded without a token simply omits this prop. */
  token?: string;
};

export default function UnsubscribeForm({ initialEmail = "", token }: UnsubscribeFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [state, formAction, isPending] = useActionState(unsubscribe, initialState);

  if (state.success) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-light-gray bg-soft-gray px-6 py-14 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 text-success">
          <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
        </span>
        <h3 className="mt-4 text-lg font-bold text-navy">You&rsquo;re Unsubscribed</h3>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-slate">
          If that address was on our newsletter list, it has been removed. You won&rsquo;t receive
          any further newsletter emails from us.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <div className="flex items-start gap-3 rounded-xl border border-light-gray bg-soft-gray px-4 py-3.5">
        <MailX className="mt-0.5 h-5 w-5 shrink-0 text-slate" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-slate">
          Enter the email address you subscribed with and we&rsquo;ll remove it from our newsletter
          list.
        </p>
      </div>

      {state.error && (
        <div
          role="alert"
          className="rounded-[10px] border border-error/30 bg-error/5 px-4 py-3 text-sm font-medium text-error"
        >
          {state.error}
        </div>
      )}

      {token && <input type="hidden" name="token" value={token} />}

      <Field id="unsubscribe-email" label="Email Address" required>
        <input
          id="unsubscribe-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={inputClass(Boolean(state.error))}
        />
      </Field>

      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isPending}>
        {isPending ? "Processing…" : "Unsubscribe"}
      </Button>
    </form>
  );
}
