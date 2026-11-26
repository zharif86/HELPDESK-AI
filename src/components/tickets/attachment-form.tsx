"use client";

import { useActionState } from "react";
import { Alert, SubmitButton, inputClass } from "@/components/admin/controls";
import { idleState } from "@/server/actions/state";
import { uploadTicketAttachmentAction } from "@/server/actions/attachment-actions";

export function AttachmentForm({
  ticketId,
  canInternal,
}: {
  ticketId: string;
  canInternal: boolean;
}) {
  const [state, formAction] = useActionState(uploadTicketAttachmentAction.bind(null, ticketId), idleState);
  return (
    <form action={formAction} className="space-y-3" encType="multipart/form-data">
      {state.status === "error" && state.message ? <Alert tone="error">{state.message}</Alert> : null}
      <input name="file" type="file" required className={inputClass} accept=".png,.jpg,.jpeg,.webp,.pdf,.txt,.log" />
      {canInternal ? (
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="isInternal" value="true" />
          Mark as internal attachment
        </label>
      ) : (
        <input type="hidden" name="isInternal" value="false" />
      )}
      <p className="text-xs text-slate-500">PNG, JPEG, WebP, PDF, or text. Maximum 5 MB.</p>
      <SubmitButton label="Upload file" pendingLabel="Uploading…" />
    </form>
  );
}
