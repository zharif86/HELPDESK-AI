"use client";

import { useActionState, useMemo, useState } from "react";
import { Alert, SubmitButton, inputClass } from "@/components/admin/controls";
import { idleState, type ActionState } from "@/server/actions/state";

type Option = { id: string; name: string; code?: string; parentId?: string | null };

export function TicketForm({
  action,
  categories,
  locations,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  categories: Option[];
  locations: Option[];
}) {
  const [state, formAction] = useActionState(action, idleState);
  const roots = useMemo(() => categories.filter((item) => !item.parentId), [categories]);
  const [categoryId, setCategoryId] = useState(roots[0]?.id ?? "");
  const children = categories.filter((item) => item.parentId === categoryId);
  const field = (name: string) => state.fieldErrors?.[name]?.[0];

  return (
    <form action={formAction} className="space-y-6">
      {state.status === "error" && state.message ? <Alert tone="error">{state.message}</Alert> : null}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">What happened?</h2>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="title">
            Title
          </label>
          <input id="title" name="title" required className={inputClass} placeholder="Short summary of the issue" />
          {field("title") ? <p className="mt-1 text-xs text-red-700">{field("title")}</p> : null}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={6}
            className={inputClass}
            placeholder="Steps already tried, error messages, and when it started"
          />
          {field("description") ? <p className="mt-1 text-xs text-red-700">{field("description")}</p> : null}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <h2 className="text-sm font-semibold text-slate-900 md:col-span-2">Classification</h2>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="categoryId">
            Category
          </label>
          <select
            id="categoryId"
            name="categoryId"
            required
            className={inputClass}
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            <option value="">Select category</option>
            {roots.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          {field("categoryId") ? <p className="mt-1 text-xs text-red-700">{field("categoryId")}</p> : null}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="subcategoryId">
            Subcategory
          </label>
          <select id="subcategoryId" name="subcategoryId" className={inputClass} disabled={children.length === 0}>
            <option value="">{children.length ? "Optional subcategory" : "No subcategory"}</option>
            {children.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="impact">
            Impact
          </label>
          <select id="impact" name="impact" required defaultValue="MEDIUM" className={inputClass}>
            <option value="HIGH">High — many people or a critical service</option>
            <option value="MEDIUM">Medium — one team or shared resource</option>
            <option value="LOW">Low — one person, workaround available</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="urgency">
            Urgency
          </label>
          <select id="urgency" name="urgency" required defaultValue="MEDIUM" className={inputClass}>
            <option value="HIGH">High — needs attention today</option>
            <option value="MEDIUM">Medium — soon</option>
            <option value="LOW">Low — can wait</option>
          </select>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <h2 className="text-sm font-semibold text-slate-900 md:col-span-2">Equipment and contact</h2>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="affectedEquipment">
            Affected equipment
          </label>
          <input id="affectedEquipment" name="affectedEquipment" className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="assetTag">
            Asset tag
          </label>
          <input id="assetTag" name="assetTag" className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="incidentLocationId">
            Incident location
          </label>
          <select id="incidentLocationId" name="incidentLocationId" className={inputClass} defaultValue="">
            <option value="">Same as my profile location</option>
            {locations.map((item) => (
              <option key={item.id} value={item.id}>
                {item.code ? `${item.code} — ${item.name}` : item.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="contactPhone">
            Contact phone
          </label>
          <input id="contactPhone" name="contactPhone" className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="contactName">
            Contact name
          </label>
          <input id="contactName" name="contactName" className={inputClass} placeholder="Defaults to your name" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="contactEmail">
            Contact email
          </label>
          <input id="contactEmail" name="contactEmail" type="email" className={inputClass} placeholder="Defaults to your email" />
        </div>
      </section>

      <SubmitButton label="Submit ticket" pendingLabel="Submitting…" />
    </form>
  );
}
