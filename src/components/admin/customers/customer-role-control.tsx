"use client";

import { useState, useTransition } from "react";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import { updateCustomerRole } from "@/app/admin/customers/actions";
import type { Role } from "@/generated/prisma/enums";

// Only two roles exist (Role has exactly CUSTOMER/ADMIN) — a single toggle
// button is the correct fit here, not a reused select-based control built
// for a larger state set like order/quotation status.
const ROLE_LABEL: Record<Role, string> = { CUSTOMER: "Customer", ADMIN: "Admin" };
const ROLE_VARIANT: Record<Role, "royal" | "navy" | "success" | "gold" | "error"> = {
  CUSTOMER: "navy",
  ADMIN: "royal",
};

export default function CustomerRoleControl({
  userId,
  role,
  isSelf,
}: {
  userId: string;
  role: Role;
  isSelf: boolean;
}) {
  const [currentRole, setCurrentRole] = useState(role);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const otherRole: Role = currentRole === "ADMIN" ? "CUSTOMER" : "ADMIN";

  const handleToggle = () => {
    if (
      !window.confirm(
        `Change this customer's role from ${ROLE_LABEL[currentRole]} to ${ROLE_LABEL[otherRole]}?`,
      )
    ) {
      return;
    }
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updateCustomerRole(userId, currentRole, otherRole);
      if (result?.error) {
        setError(result.error);
      } else {
        setCurrentRole(otherRole);
        setSuccess(true);
      }
    });
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-navy">Current role:</span>
        <Badge variant={ROLE_VARIANT[currentRole]}>{ROLE_LABEL[currentRole]}</Badge>
      </div>

      {isSelf ? (
        <p className="mt-3 text-sm text-slate">You cannot change your own role.</p>
      ) : (
        <div className="mt-4">
          <Button type="button" variant="secondary" size="sm" disabled={isPending} onClick={handleToggle}>
            {isPending ? "Saving…" : `Change to ${ROLE_LABEL[otherRole]}`}
          </Button>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-xs font-medium text-error">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="mt-3 text-xs font-medium text-success">
          Role updated.
        </p>
      )}
    </div>
  );
}
