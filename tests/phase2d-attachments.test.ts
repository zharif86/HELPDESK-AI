import { beforeEach, describe, expect, it } from "vitest";
import { ForbiddenError } from "../src/server/errors";
import {
  listTicketAttachments,
  openTicketAttachment,
  uploadTicketAttachment,
} from "../src/server/services/attachment-service";
import { createTicket } from "../src/server/services/ticket-service";
import { getHelpdeskDashboard } from "../src/server/services/helpdesk-dashboard-service";
import { createAccount, prisma, resetDatabase } from "./helpers";

function fileFrom(name: string, type: string, bytes: number[]) {
  return new File([new Uint8Array(bytes)], name, { type });
}

describe("Phase 2D attachments and dashboard", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("rejects invalid and oversized files, and protects internal downloads", async () => {
    const employee = await createAccount({
      name: "Staff",
      email: "staff2d@test.local",
      role: "EMPLOYEE",
    });
    const manager = await createAccount({
      name: "Manager",
      email: "manager2d@test.local",
      role: "IT_MANAGER",
    });
    const category = await prisma.ticketCategory.findFirstOrThrow({ where: { code: "HARDWARE" } });
    const ticket = await createTicket(employee.actor, {
      title: "Need screenshot review",
      description: "Attached evidence shows the blue screen details from this morning.",
      categoryId: category.id,
      subcategoryId: "",
      impact: "LOW",
      urgency: "LOW",
      affectedEquipment: "",
      assetTag: "",
      incidentLocationId: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
    });

    await expect(
      uploadTicketAttachment(
        employee.actor,
        ticket.id,
        fileFrom("malware.exe", "application/octet-stream", [0x4d, 0x5a]),
      ),
    ).rejects.toThrow(/not allowed/i);

    const huge = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "big.png", { type: "image/png" });
    await expect(uploadTicketAttachment(employee.actor, ticket.id, huge)).rejects.toThrow(/5 MB/i);

    const png = fileFrom(
      "screen.png",
      "image/png",
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0],
    );
    const publicFile = await uploadTicketAttachment(employee.actor, ticket.id, png);
    const internal = await uploadTicketAttachment(
      manager.actor,
      ticket.id,
      fileFrom("note.txt", "text/plain", [72, 101, 108, 108, 111]),
      { isInternal: true },
    );

    const forEmployee = await listTicketAttachments(employee.actor, ticket.id);
    expect(forEmployee.map((item) => item.id)).toContain(publicFile.id);
    expect(forEmployee.map((item) => item.id)).not.toContain(internal.id);
    await expect(openTicketAttachment(employee.actor, internal.id)).rejects.toBeInstanceOf(ForbiddenError);
    const opened = await openTicketAttachment(manager.actor, internal.id);
    expect(opened.attachment.id).toBe(internal.id);
  });

  it("builds dashboard totals from real ticket rows", async () => {
    const employee = await createAccount({
      name: "Staff",
      email: "staff2d-b@test.local",
      role: "EMPLOYEE",
    });
    const manager = await createAccount({
      name: "Manager",
      email: "manager2d-b@test.local",
      role: "IT_MANAGER",
    });
    const category = await prisma.ticketCategory.findFirstOrThrow({ where: { code: "NETWORK" } });
    await createTicket(employee.actor, {
      title: "Wi-Fi drops in meeting room",
      description: "Connection drops every few minutes during video calls.",
      categoryId: category.id,
      subcategoryId: "",
      impact: "HIGH",
      urgency: "HIGH",
      affectedEquipment: "",
      assetTag: "",
      incidentLocationId: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
    });
    const employeeDash = await getHelpdeskDashboard(employee.actor);
    const managerDash = await getHelpdeskDashboard(manager.actor);
    expect(employeeDash?.total).toBe(1);
    expect(employeeDash?.critical).toBe(1);
    expect(managerDash?.total).toBe(1);
    expect(managerDash?.byPriority.some((row) => row.priority === "CRITICAL" && row.count === 1)).toBe(true);
  });
});
