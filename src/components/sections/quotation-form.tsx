"use client";

import { useActionState, useId, useState, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import Button from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/form-field";
import { isValidEmail } from "@/lib/validation";
import { submitQuotation, type QuotationState } from "@/app/(storefront)/business/quotation/actions";

type FormValues = {
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  requirement: string;
  quantity: string;
  preferredContact: string;
  additionalRequirements: string;
  message: string;
};

type FormErrors = Partial<Record<keyof FormValues | "form", string>>;

const emptyValues: FormValues = {
  fullName: "",
  companyName: "",
  email: "",
  phone: "",
  requirement: "",
  quantity: "",
  preferredContact: "",
  additionalRequirements: "",
  message: "",
};

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.fullName.trim()) errors.fullName = "Full name is required.";
  if (!values.companyName.trim()) errors.companyName = "Company name is required.";

  if (!values.email.trim()) {
    errors.email = "Email is required.";
  } else if (!isValidEmail(values.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.phone.trim()) errors.phone = "Phone number is required.";
  if (!values.requirement.trim()) errors.requirement = "Please tell us what you need.";

  if (!values.quantity.trim()) {
    errors.quantity = "Quantity is required.";
  } else {
    const n = Number(values.quantity);
    if (!Number.isFinite(n) || n <= 0) {
      errors.quantity = "Quantity must be a valid positive number.";
    }
  }

  if (!values.message.trim()) errors.message = "Please add a short message.";

  return errors;
}

const initialActionState: QuotationState = {};

export default function QuotationForm({ initialRequirement = "" }: { initialRequirement?: string }) {
  const [values, setValues] = useState<FormValues>({ ...emptyValues, requirement: initialRequirement });
  const [clientErrors, setClientErrors] = useState<FormErrors>({});
  const [state, formAction, isPending] = useActionState(submitQuotation, initialActionState);
  const formId = useId();

  // Adjusted during render (not in a useEffect — avoids an extra render
  // pass and this project's set-state-in-effect lint rule) so a second
  // successful submission after "Submit Another Request" is detected even
  // though useActionState's own `state.success` never resets on its own.
  const [prevState, setPrevState] = useState(state);
  const [dismissedSuccess, setDismissedSuccess] = useState(false);
  if (state !== prevState) {
    setPrevState(state);
    if (state.success) setDismissedSuccess(false);
  }

  const errors: FormErrors = { ...clientErrors, ...state.errors };

  const setField = (field: keyof FormValues) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
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
        <h3 className="mt-4 text-lg font-bold text-navy">Quotation Request Submitted</h3>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-slate">
          Thank you — your request has been received. Our business team will follow up with you
          shortly.
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
            Submit Another Request
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
        <Field
          id={`${formId}-fullName`}
          label="Full Name"
          required
          error={errors.fullName}
        >
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

        <Field
          id={`${formId}-companyName`}
          label="Company Name"
          required
          error={errors.companyName}
        >
          <input
            id={`${formId}-companyName`}
            name="companyName"
            type="text"
            autoComplete="organization"
            value={values.companyName}
            onChange={setField("companyName")}
            aria-invalid={Boolean(errors.companyName)}
            aria-describedby={errors.companyName ? `${formId}-companyName-error` : undefined}
            className={inputClass(Boolean(errors.companyName))}
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

        <Field id={`${formId}-phone`} label="Phone" required error={errors.phone}>
          <input
            id={`${formId}-phone`}
            name="phone"
            type="tel"
            autoComplete="tel"
            value={values.phone}
            onChange={setField("phone")}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? `${formId}-phone-error` : undefined}
            className={inputClass(Boolean(errors.phone))}
          />
        </Field>
      </div>

      <Field
        id={`${formId}-requirement`}
        label="Product / Requirement"
        required
        error={errors.requirement}
      >
        <input
          id={`${formId}-requirement`}
          name="requirement"
          type="text"
          placeholder="e.g. 40x business laptops, or a specific product name"
          value={values.requirement}
          onChange={setField("requirement")}
          aria-invalid={Boolean(errors.requirement)}
          aria-describedby={errors.requirement ? `${formId}-requirement-error` : undefined}
          className={inputClass(Boolean(errors.requirement))}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={`${formId}-quantity`} label="Quantity" required error={errors.quantity}>
          <input
            id={`${formId}-quantity`}
            name="quantity"
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={values.quantity}
            onChange={setField("quantity")}
            aria-invalid={Boolean(errors.quantity)}
            aria-describedby={errors.quantity ? `${formId}-quantity-error` : undefined}
            className={inputClass(Boolean(errors.quantity))}
          />
        </Field>

        <Field id={`${formId}-preferredContact`} label="Preferred Contact Method">
          <select
            id={`${formId}-preferredContact`}
            name="preferredContact"
            value={values.preferredContact}
            onChange={setField("preferredContact")}
            className={inputClass(false)}
          >
            <option value="">No preference</option>
            <option value="email">Email</option>
            <option value="phone">Phone</option>
          </select>
        </Field>
      </div>

      <Field id={`${formId}-message`} label="Message" required error={errors.message}>
        <textarea
          id={`${formId}-message`}
          name="message"
          rows={4}
          value={values.message}
          onChange={setField("message")}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? `${formId}-message-error` : undefined}
          className={inputClass(Boolean(errors.message))}
        />
      </Field>

      <Field id={`${formId}-additionalRequirements`} label="Additional Requirements">
        <textarea
          id={`${formId}-additionalRequirements`}
          name="additionalRequirements"
          rows={3}
          placeholder="Delivery timeline, budget range, technical specifications, etc."
          value={values.additionalRequirements}
          onChange={setField("additionalRequirements")}
          className={inputClass(false)}
        />
      </Field>

      <Button type="submit" variant="primary" size="lg" className="w-full sm:w-auto" disabled={isPending}>
        {isPending ? "Submitting…" : "Submit Request"}
      </Button>
    </form>
  );
}
