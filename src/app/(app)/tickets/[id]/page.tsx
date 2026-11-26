import Link from "next/link";
import { notFound } from "next/navigation";
import { Flash, PageHeader, Panel } from "@/components/admin/page";
import { PriorityBadge, TicketStatusBadge } from "@/components/tickets/badges";
import { AttachmentForm } from "@/components/tickets/attachment-form";
import { TicketActionsPanel } from "@/components/tickets/ticket-actions-panel";
import { firstParam } from "@/lib/query";
import { requireUser } from "@/server/auth/current-user";
import { hasPermission } from "@/server/access/catalog";
import { listTicketAttachments } from "@/server/services/attachment-service";
import { getTicket } from "@/server/services/ticket-service";
import {
  listTechnicianOptions,
  listTicketComments,
} from "@/server/services/ticket-workflow-service";
import { TICKET_TRANSITIONS } from "@/server/tickets/workflow";
import { canReadInternalNotes } from "@/server/tickets/access";

export default async function TicketDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { actor, user } = await requireUser();
  const ticket = await getTicket(actor, id);
  if (!ticket) notFound();

  const canAssign = hasPermission(user.permissions, "tickets.assign");
  const canChangeStatus =
    hasPermission(user.permissions, "tickets.change_status") ||
    hasPermission(user.permissions, "tickets.resolve") ||
    hasPermission(user.permissions, "tickets.close") ||
    hasPermission(user.permissions, "tickets.reopen") ||
    hasPermission(user.permissions, "tickets.cancel");
  const canChangePriority = hasPermission(user.permissions, "tickets.change_priority");
  const canComment = hasPermission(user.permissions, "tickets.comment");
  const canInternalNote = hasPermission(user.permissions, "tickets.internal_note");

  const [comments, technicians, attachments] = await Promise.all([
    listTicketComments(actor, ticket.id),
    canAssign ? listTechnicianOptions(actor) : Promise.resolve([]),
    listTicketAttachments(actor, ticket.id),
  ]);

  const allowedStatuses = TICKET_TRANSITIONS[ticket.status].filter((status) => {
    if (status === "RESOLVED") return hasPermission(user.permissions, "tickets.resolve");
    if (status === "CLOSED") return hasPermission(user.permissions, "tickets.close");
    if (status === "REOPENED") return hasPermission(user.permissions, "tickets.reopen");
    if (status === "CANCELLED") return hasPermission(user.permissions, "tickets.cancel");
    return hasPermission(user.permissions, "tickets.change_status");
  });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title={ticket.number}
          description={`${ticket.title}${ticket.priority === "CRITICAL" ? " · Critical incident" : ""}`}
        />
        <Link href="/tickets" className="text-sm text-blue-800">
          Back to tickets
        </Link>
      </div>
      <Flash notice={firstParam(query.notice)} error={firstParam(query.error)} />

      {ticket.priority === "CRITICAL" ? (
        <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-900">
          Critical priority — treat this incident as urgent.
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          <Panel>
            <div className="flex flex-wrap gap-2">
              <TicketStatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
            <h2 className="mt-4 text-sm font-semibold text-slate-900">Description</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{ticket.description}</p>
            {ticket.resolution ? (
              <>
                <h2 className="mt-6 text-sm font-semibold text-slate-900">Resolution</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{ticket.resolution}</p>
              </>
            ) : null}
          </Panel>

          <Panel>
            <h2 className="text-sm font-semibold text-slate-900">Attachments</h2>
            {attachments.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No files uploaded yet.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {attachments.map((file) => (
                  <li key={file.id} className="flex flex-wrap items-center justify-between gap-2">
                    <a href={`/api/tickets/attachments/${file.id}`} className="text-blue-800">
                      {file.originalName}
                    </a>
                    <span className="text-xs text-slate-500">
                      {file.isInternal ? "Internal · " : ""}
                      {file.uploadedBy.name} · {Math.ceil(file.sizeBytes / 1024)} KB
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {canComment || canInternalNote ? (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <AttachmentForm ticketId={ticket.id} canInternal={canInternalNote} />
              </div>
            ) : null}
          </Panel>

          <Panel>
            <h2 className="text-sm font-semibold text-slate-900">Discussion</h2>
            {comments.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No comments yet.</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {comments.map((comment) => (
                  <li key={comment.id} className="rounded-md border border-slate-100 bg-slate-50 px-3 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-slate-900">{comment.author.name}</p>
                      <p className="text-xs text-slate-500">
                        {comment.visibility === "INTERNAL" ? "Internal note · " : ""}
                        {comment.createdAt.toLocaleString()}
                      </p>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{comment.body}</p>
                  </li>
                ))}
              </ul>
            )}
            {!canReadInternalNotes(actor) ? (
              <p className="mt-3 text-xs text-slate-500">Internal technical notes are hidden on this view.</p>
            ) : null}
          </Panel>

          <Panel>
            <h2 className="text-sm font-semibold text-slate-900">Activity</h2>
            <ol className="mt-4 space-y-3">
              {ticket.activities.map((activity) => (
                <li key={activity.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <p className="text-sm text-slate-900">{activity.summary}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {activity.actor?.name ?? "System"} · {activity.createdAt.toLocaleString()}
                  </p>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel>
            <h2 className="text-sm font-semibold text-slate-900">People</h2>
            <dl className="mt-3 space-y-2 text-sm text-slate-700">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Requester</dt>
                <dd>{ticket.requester.name}</dd>
                <dd className="text-xs text-slate-500">{ticket.contactEmail ?? ticket.requester.email}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Department</dt>
                <dd>{ticket.department?.name ?? ticket.requesterDepartmentName ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Assignee</dt>
                <dd>{ticket.assignee?.name ?? "Unassigned"}</dd>
              </div>
            </dl>
          </Panel>
          <Panel>
            <h2 className="text-sm font-semibold text-slate-900">Classification</h2>
            <dl className="mt-3 space-y-2 text-sm text-slate-700">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Category</dt>
                <dd>
                  {ticket.category?.name ?? "—"}
                  {ticket.subcategory ? ` / ${ticket.subcategory.name}` : ""}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Impact / Urgency</dt>
                <dd>
                  {ticket.impact} / {ticket.urgency}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Equipment</dt>
                <dd>{ticket.affectedEquipment ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Asset tag</dt>
                <dd>{ticket.assetTag ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Incident location</dt>
                <dd>{ticket.incidentLocation?.name ?? ticket.location?.name ?? ticket.requesterLocationName ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Reported</dt>
                <dd>{ticket.reportedAt.toLocaleString()}</dd>
              </div>
            </dl>
          </Panel>

          <TicketActionsPanel
            ticketId={ticket.id}
            status={ticket.status}
            priority={ticket.priority}
            allowedStatuses={allowedStatuses}
            technicians={technicians}
            canAssign={canAssign}
            canChangeStatus={canChangeStatus}
            canChangePriority={canChangePriority}
            canComment={canComment}
            canInternalNote={canInternalNote}
          />
        </div>
      </div>
    </div>
  );
}
