import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/current-user";
import { getRequestMeta } from "@/server/http/request-meta";
import { openTicketAttachment } from "@/server/services/attachment-service";
import { ForbiddenError, AppError } from "@/server/errors";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || user.mustChangePassword) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const meta = await getRequestMeta();
  const actor = {
    id: user.id,
    email: user.email,
    name: user.name,
    departmentId: user.department?.id ?? null,
    roleKeys: user.roleKeys,
    permissions: user.permissions,
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  };

  try {
    const { id } = await context.params;
    const { attachment, absolutePath } = await openTicketAttachment(actor, id);
    const bytes = await readFile(absolutePath);
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Disposition": `attachment; filename="${attachment.originalName.replaceAll('"', "")}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to download the file." }, { status: 500 });
  }
}
