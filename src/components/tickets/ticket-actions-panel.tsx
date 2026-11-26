"use client";

import { useActionState } from "react";
import { Alert, SubmitButton, inputClass } from "@/components/admin/controls";
import { TICKET_PRIORITIES } from "@/lib/tickets";
import { idleState, type ActionState } from "@/server/actions/state";
import {
  addTicketCommentAction,
  assignTicketAction,
  changeTicketPriorityAction,
  changeTicketStatusAction,
} from "@/server/actions/ticket-workflow-actions";

type Technician = {
  id: string;
  name: string;
  email: string;
  specialisation: string | null;
  openTickets: number;
};

export function TicketActionsPanel({
  ticketId,
  status,
  priority,
  allowedStatuses,
  technicians,
  canAssign,
  canChangeStatus,
  canChangePriority,
  canComment,
  canInternalNote,
}: {
  ticketId: string;
  status: string;
  priority: string;
  allowedStatuses: string[];
  technicians: Technician[];
  canAssign: boolean;
  canChangeStatus: boolean;
  canChangePriority: boolean;
  canComment: boolean;
  canInternalNote: boolean;
}) {
  return (
    <div className="space-y-5">
      {canAssign ? (
        <ActionCard title="Assign technician">
          <BoundForm
            action={assignTicketAction.bind(null, ticketId)}
            submitLabel="Assign"
          >
            <select name="assigneeId" required className={inputClass} defaultValue="">
              <option value="">Select technician</option>
              {technicians.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.openTickets} open
                  {item.specialisation ? ` · ${item.specialisation}` : ""}
                </option>
              ))}
            </select>
            <input name="reason" className={inputClass} placeholder="Reassignment reason (if any)" />
          </BoundForm>
        </ActionCard>
      ) : null}

      {canChangeStatus && allowedStatuses.length > 0 ? (
        <ActionCard title="Update status">
          <BoundForm action={changeTicketStatusAction.bind(null, ticketId)} submitLabel="Update status">
            <select name="status" required className={inputClass} defaultValue={allowedStatuses[0]}>
              {allowedStatuses.map((item) => (
                <option key={item} value={item}>
                  {item.replaceAll("_", " ")}
                </option>
              ))}
            </select>
            <textarea name="resolution" rows={3} className={inputClass} placeholder="Resolution (required when resolving)" />
            <textarea name="reason" rows={2} className={inputClass} placeholder="Reason (required to reopen or cancel)" />
            <p className="text-xs text-slate-500">Current status: {status.replaceAll("_", " ")}</p>
          </BoundForm>
        </ActionCard>
      ) : null}

      {canChangePriority ? (
        <ActionCard title="Override priority">
          <BoundForm action={changeTicketPriorityAction.bind(null, ticketId)} submitLabel="Save priority">
            <select name="priority" required className={inputClass} defaultValue={priority}>
              {TICKET_PRIORITIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <textarea name="reason" required rows={2} className={inputClass} placeholder="Justification (required)" />
          </BoundForm>
        </ActionCard>
      ) : null}

      {canComment || canInternalNote ? (
        <ActionCard title="Add comment">
          <BoundForm action={addTicketCommentAction.bind(null, ticketId)} submitLabel="Post">
            <textarea name="body" required rows={4} className={inputClass} placeholder="Write an update" />
            <select name="visibility" className={inputClass} defaultValue="PUBLIC">
              {canComment ? <option value="PUBLIC">Public comment</option> : null}
              {canInternalNote ? <option value="INTERNAL">Internal note</option> : null}
            </select>
          </BoundForm>
        </ActionCard>
      ) : null}
    </div>
  );
}

function ActionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

function BoundForm({
  action,
  submitLabel,
  children,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel: string;
  children: React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, idleState);
  return (
    <form action={formAction} className="space-y-3">
      {state.status === "error" && state.message ? <Alert tone="error">{state.message}</Alert> : null}
      {children}
      <SubmitButton label={submitLabel} pendingLabel="Working…" />
    </form>
  );
}
