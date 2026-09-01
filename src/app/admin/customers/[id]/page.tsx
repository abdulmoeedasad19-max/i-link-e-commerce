import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getAdminCustomerById } from "@/lib/admin/customers";
import { orderStatusLabel, orderStatusVariant } from "@/lib/order-status";
import { paymentMethodLabel, paymentStatusLabel } from "@/lib/payment";
import { quotationStatusLabel, quotationStatusVariant } from "@/lib/quotation-status";
import CustomerRoleControl from "@/components/admin/customers/customer-role-control";
import ResetPasswordControl from "@/components/admin/customers/reset-password-control";

export const metadata: Metadata = {
  title: "Customer Details",
};

const ROLE_BADGE_VARIANT: Record<"CUSTOMER" | "ADMIN", "navy" | "royal"> = {
  CUSTOMER: "navy",
  ADMIN: "royal",
};

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();

  const { id } = await params;
  const customer = await getAdminCustomerById(id);

  if (!customer) {
    notFound();
  }

  return (
    <div>
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate hover:text-royal"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Customers
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">{customer.name || customer.email}</h1>
          <p className="mt-1 text-sm text-slate">
            Joined{" "}
            {customer.createdAt.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <Badge variant={ROLE_BADGE_VARIANT[customer.role]}>{customer.role}</Badge>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="space-y-6 lg:col-span-2">
          <Card hover={false} className="p-5 sm:p-6">
            <h2 className="text-base font-bold text-navy">Customer Information</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate">Name</dt>
                <dd className="font-semibold text-navy">{customer.name || "—"}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate">Email</dt>
                <dd className="font-semibold text-navy">{customer.email}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate">Phone</dt>
                <dd className="font-semibold text-navy">{customer.phone || "—"}</dd>
              </div>
            </dl>

            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-light-gray pt-5 text-center">
              <div>
                <p className="text-lg font-bold text-navy">{customer.orderCount}</p>
                <p className="text-xs text-slate">Order{customer.orderCount === 1 ? "" : "s"}</p>
              </div>
              <div>
                <p className="text-lg font-bold text-navy">{customer.quotationCount}</p>
                <p className="text-xs text-slate">Quotation{customer.quotationCount === 1 ? "" : "s"}</p>
              </div>
              <div>
                <p className="text-lg font-bold text-navy">{customer.addressCount}</p>
                <p className="text-xs text-slate">Address{customer.addressCount === 1 ? "" : "es"}</p>
              </div>
            </div>
          </Card>

          <Card hover={false} className="p-5 sm:p-6">
            <h2 className="text-base font-bold text-navy">Addresses</h2>
            {customer.addresses.length === 0 ? (
              <p className="mt-3 text-sm text-slate">No addresses found.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {customer.addresses.map((address) => (
                  <li key={address.id} className="rounded-xl border border-light-gray p-3 text-sm">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-navy">{address.label}</p>
                      {address.isDefault && (
                        <span className="rounded-full bg-royal/10 px-2 py-0.5 text-[10px] font-semibold text-royal">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-slate">
                      {address.line1}
                      {address.line2 ? `, ${address.line2}` : ""}
                    </p>
                    <p className="text-slate">
                      {address.city}, {address.province} {address.postalCode}
                    </p>
                    <p className="text-slate">{address.phone}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card hover={false} className="p-5 sm:p-6">
            <h2 className="text-base font-bold text-navy">Order History</h2>
            {customer.orders.length === 0 ? (
              <p className="mt-3 text-sm text-slate">No orders found.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-light-gray text-xs font-semibold uppercase tracking-wide text-slate">
                      <th scope="col" className="py-2 pr-3">
                        Order #
                      </th>
                      <th scope="col" className="py-2 pr-3">
                        Date
                      </th>
                      <th scope="col" className="py-2 pr-3">
                        Total
                      </th>
                      <th scope="col" className="py-2 pr-3">
                        Payment
                      </th>
                      <th scope="col" className="py-2 pr-3">
                        Status
                      </th>
                      <th scope="col" className="py-2 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-light-gray">
                    {customer.orders.map((order) => (
                      <tr key={order.id}>
                        <td className="py-2.5 pr-3 font-mono text-xs font-semibold text-navy" title={order.id}>
                          #{order.id.slice(-8).toUpperCase()}
                        </td>
                        <td className="py-2.5 pr-3 text-slate">
                          {order.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="py-2.5 pr-3 font-semibold text-navy">{formatPrice(order.total)}</td>
                        <td className="py-2.5 pr-3 text-slate">
                          {paymentMethodLabel[order.paymentMethod]} · {paymentStatusLabel[order.paymentStatus]}
                        </td>
                        <td className="py-2.5 pr-3">
                          <Badge variant={orderStatusVariant[order.status]}>{orderStatusLabel[order.status]}</Badge>
                        </td>
                        <td className="py-2.5 text-right">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="text-sm font-semibold text-royal hover:text-royal-600"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {customer.orderCount > customer.orders.length && (
                  <p className="mt-3 text-xs text-slate">
                    Showing {customer.orders.length} most recent of {customer.orderCount} total orders.
                  </p>
                )}
              </div>
            )}
          </Card>

          <Card hover={false} className="p-5 sm:p-6">
            <h2 className="text-base font-bold text-navy">Quotation History</h2>
            {customer.quotations.length === 0 ? (
              <p className="mt-3 text-sm text-slate">No quotations found.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-light-gray text-xs font-semibold uppercase tracking-wide text-slate">
                      <th scope="col" className="py-2 pr-3">
                        Request #
                      </th>
                      <th scope="col" className="py-2 pr-3">
                        Date
                      </th>
                      <th scope="col" className="py-2 pr-3">
                        Requirement
                      </th>
                      <th scope="col" className="py-2 pr-3">
                        Qty
                      </th>
                      <th scope="col" className="py-2 pr-3">
                        Status
                      </th>
                      <th scope="col" className="py-2 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-light-gray">
                    {customer.quotations.map((q) => (
                      <tr key={q.id}>
                        <td className="py-2.5 pr-3 font-mono text-xs font-semibold text-navy" title={q.id}>
                          #{q.id.slice(-8).toUpperCase()}
                        </td>
                        <td className="py-2.5 pr-3 text-slate">
                          {q.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="max-w-[200px] truncate py-2.5 pr-3 text-slate" title={q.requirement}>
                          {q.requirement}
                        </td>
                        <td className="py-2.5 pr-3 text-slate">{q.quantity}</td>
                        <td className="py-2.5 pr-3">
                          <Badge variant={quotationStatusVariant[q.status]}>{quotationStatusLabel[q.status]}</Badge>
                        </td>
                        <td className="py-2.5 text-right">
                          <Link
                            href={`/admin/quotations/${q.id}`}
                            className="text-sm font-semibold text-royal hover:text-royal-600"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {customer.quotationCount > customer.quotations.length && (
                  <p className="mt-3 text-xs text-slate">
                    Showing {customer.quotations.length} most recent of {customer.quotationCount} total quotations.
                  </p>
                )}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card hover={false} className="p-5 sm:p-6">
            <h2 className="text-base font-bold text-navy">Role</h2>
            <div className="mt-4">
              <CustomerRoleControl
                userId={customer.id}
                role={customer.role}
                isSelf={customer.id === session.user.id}
              />
            </div>
          </Card>

          {customer.role === "CUSTOMER" && (
            <Card hover={false} className="p-5 sm:p-6">
              <h2 className="text-base font-bold text-navy">Reset Password</h2>
              <div className="mt-4">
                <ResetPasswordControl userId={customer.id} isSelf={customer.id === session.user.id} />
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
