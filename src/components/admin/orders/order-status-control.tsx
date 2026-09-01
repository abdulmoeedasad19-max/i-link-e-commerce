"use client";

import { useState, useTransition } from "react";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import { orderStatusLabel, orderStatusVariant } from "@/lib/order-status";
import { ALLOWED_ORDER_TRANSITIONS } from "@/lib/admin/order-transitions";
import { updateOrderStatus } from "@/app/admin/orders/actions";
import type { OrderStatus } from "@/generated/prisma/enums";

export default function OrderStatusControl({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [selected, setSelected] = useState<OrderStatus>(status);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const allowedNext = ALLOWED_ORDER_TRANSITIONS[currentStatus] ?? [];
  const isTerminal = allowedNext.length === 0;

  const handleSave = () => {
    if (selected === currentStatus) return;
    if (
      !window.confirm(
        `Change this order's status from ${orderStatusLabel[currentStatus]} to ${orderStatusLabel[selected]}?`,
      )
    ) {
      return;
    }
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, currentStatus, selected);
      if (result?.error) {
        setError(result.error);
        setSelected(currentStatus);
      } else {
        setCurrentStatus(selected);
        setSuccess(true);
      }
    });
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-navy">Current status:</span>
        <Badge variant={orderStatusVariant[currentStatus]}>{orderStatusLabel[currentStatus]}</Badge>
      </div>

      {isTerminal ? (
        <p className="mt-3 text-sm text-slate">
          This order is in a final state and its status can no longer be changed.
        </p>
      ) : (
        <div className="mt-4">
          <label htmlFor="order-status-select" className="mb-1.5 block text-xs font-semibold text-slate">
            Change status to
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <select
              id="order-status-select"
              value={selected}
              onChange={(e) => {
                setSelected(e.target.value as OrderStatus);
                setSuccess(false);
                setError(null);
              }}
              disabled={isPending}
              className="rounded-[10px] border border-light-gray bg-white px-3 py-2.5 text-sm text-dark-slate outline-none transition-colors focus:border-royal focus:ring-2 focus:ring-royal/15 disabled:opacity-50"
            >
              <option value={currentStatus}>{orderStatusLabel[currentStatus]} (current)</option>
              {allowedNext.map((next) => (
                <option key={next} value={next}>
                  {orderStatusLabel[next]}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={isPending || selected === currentStatus}
              onClick={handleSave}
            >
              {isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-xs font-medium text-error">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="mt-3 text-xs font-medium text-success">
          Status updated.
        </p>
      )}
    </div>
  );
}
