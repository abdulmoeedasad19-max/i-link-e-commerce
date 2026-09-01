"use client";

import { useActionState, useId, useState, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import Button from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/form-field";
import { isValidEmail } from "@/lib/validation";
import { submitContactMessage, type ContactState } from "@/app/(storefront)/contact/actions";

type FormValues = {
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

type FormErrors = Partial<Record<keyof FormValues | "form", string>>;

const emptyValues: FormValues = {
  fullName: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.fullName.trim()) errors.fullName = "Full name is required.";

  if (!values.email.trim()) {
    errors.email = "Email is required.";
  } else if (!isValidEmail(values.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.subject.trim()) errors.subject = "Subject is required.";
  if (!values.message.trim()) errors.message = "Message is required.";

  return errors;
}

const initialActionState: ContactState = {};

export default function ContactForm() {
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [clientErrors, setClientErrors] = useState<FormErrors>({});
  const [state, formAction, isPending] = useActionState(submitContactMessage, initialActionState);
  const formId = useId();

  // Adjusted during render (not in a useEffect — avoids an extra render
  // pass and this project's set-state-in-effect lint rule), mirroring
  // quotation-form.tsx exactly: detects a second successful submission
  // after "Send Another Message" even though useActionState's own
  // `state.success` never resets on its own.
  const [prevState, setPrevState] = useState(state);
  const [dismissedSuccess, setDismissedSuccess] = useState(false);
  if (state !== prevState) {
    setPrevState(state);
    if (state.success) setDismissedSuccess(false);
  }

  const errors: FormErrors = { ...clientErrors, ...state.errors };

  const setField = (field: keyof FormValues) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    const nextErrors = validate(values);
    setClientErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      e.preventDefault();
    }
    // Otherwise let the native submission proceed to the formAction below
    // — the server independently re-validates everything regardless.
  };

  if (state.success && !dismissedSuccess) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-light-gray bg-soft-gray px-6 py-14 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 text-success">
          <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
        </span>
        <h3 className="mt-4 text-lg font-bold text-navy">Message Received</h3>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-slate">
          Thanks! Your message has been received. We&rsquo;ll get back to you soon.
        </p>
        <div className="mt-6">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => {
              setDismissedSuccess(true);
              setValues(emptyValues);
              setClientErrors({});
            }}
          >
            Send Another Message
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit} action={formAction} className="space-y-5">
      {errors.form && (
        <div
          role="alert"
          className="rounded-[10px] border border-error/30 bg-error/5 px-4 py-3 text-sm font-medium text-error"
        >
          {errors.form}
        </div>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={`${formId}-fullName`} label="Full Name" required error={errors.fullName}>
          <input
            id={`${formId}-fullName`}
            name="fullName"
            type="text"
            autoComplete="name"
            value={values.fullName}
            onChange={setField("fullName")}
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? `${formId}-fullName-error` : undefined}
            className={inputClass(Boolean(errors.fullName))}
          />
        </Field>

        <Field id={`${formId}-email`} label="Email" required error={errors.email}>
          <input
            id={`${formId}-email`}
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={setField("email")}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? `${formId}-email-error` : undefined}
            className={inputClass(Boolean(errors.email))}
          />
        </Field>
      </div>

      <Field id={`${formId}-phone`} label="Phone (optional)">
        <input
          id={`${formId}-phone`}
          name="phone"
          type="tel"
          autoComplete="tel"
          value={values.phone}
          onChange={setField("phone")}
          className={inputClass(false)}
        />
      </Field>

      <Field id={`${formId}-subject`} label="Subject" required error={errors.subject}>
        <input
          id={`${formId}-subject`}
          name="subject"
          type="text"
          value={values.subject}
          onChange={setField("subject")}
          aria-invalid={Boolean(errors.subject)}
          aria-describedby={errors.subject ? `${formId}-subject-error` : undefined}
          className={inputClass(Boolean(errors.subject))}
        />
      </Field>

      <Field id={`${formId}-message`} label="Message" required error={errors.message}>
        <textarea
          id={`${formId}-message`}
          name="message"
          rows={5}
          value={values.message}
          onChange={setField("message")}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? `${formId}-message-error` : undefined}
          className={inputClass(Boolean(errors.message))}
        />
      </Field>

      <Button type="submit" variant="primary" size="lg" className="w-full sm:w-auto" disabled={isPending}>
        {isPending ? "Sending…" : "Send Message"}
      </Button>
    </form>
  );
}
