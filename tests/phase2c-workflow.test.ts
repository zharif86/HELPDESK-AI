import { beforeEach, describe, expect, it } from "vitest";
import { ForbiddenError } from "../src/server/errors";
import { createTicket, getTicket } from "../src/server/services/ticket-service";
import {
  addTicketComment,
  assignTicket,
  changeTicketStatus,
  listTicketComments,
} from "../src/server/services/ticket-workflow-service";
import { createAccount, prisma, resetDatabase } from "./helpers";

async function seedTicket(actor: Awaited<ReturnType<typeof createAccount>>["actor"]) {
  const category = await prisma.ticketCategory.findFirstOrThrow({ where: { code: "HARDWARE" } });
  return createTicket(actor, {
    title: "Printer offline in finance",
    description: "The shared printer no longer appears on the network share.",
    categoryId: category.id,
    subcategoryId: "",
    impact: "MEDIUM",
    urgency: "HIGH",
    affectedEquipment: "Printer",
    assetTag: "",
    incidentLocationId: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
  });
}

describe("Phase 2C workflow", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("lets an IT manager assign a technician and records history", async () => {
    const manager = await createAccount({
      name: "Manager",
      email: "manager2c@test.local",
      role: "IT_MANAGER",
    });
    const technician = await createAccount({
      name: "Tech",
      email: "tech2c@test.local",
      role: "TECHNICIAN",
    });
    const employee = await createAccount({
      name: "Staff",
      email: "staff2c@test.local",
      role: "EMPLOYEE",
    });
    const ticket = await seedTicket(employee.actor);
    await changeTicketStatus(manager.actor, ticket.id, { status: "OPEN" });
    const assigned = await assignTicket(manager.actor, ticket.id, {
      assigneeId: technician.user.id,
      reason: "",
    });
    expect(assigned.assigneeId).toBe(technician.user.id);
    expect(assigned.status).toBe("ASSIGNED");
    const history = await prisma.ticketAssignment.count({ where: { ticketId: ticket.id } });
    expect(history).toBe(1);
  });

  it("rejects invalid transitions and requires resolution or reopen reasons", async () => {
    const manager = await createAccount({
      name: "Manager",
      email: "manager2c-b@test.local",
      role: "IT_MANAGER",
    });
    const employee = await createAccount({
      name: "Staff",
      email: "staff2c-b@test.local",
      role: "EMPLOYEE",
    });
    const ticket = await seedTicket(employee.actor);
    await expect(changeTicketStatus(manager.actor, ticket.id, { status: "RESOLVED", resolution: "fixed" })).rejects.toThrow(
      /Cannot move/,
    );
    await changeTicketStatus(manager.actor, ticket.id, { status: "OPEN" });
    await changeTicketStatus(manager.actor, ticket.id, { status: "IN_PROGRESS" });
    await expect(changeTicketStatus(manager.actor, ticket.id, { status: "RESOLVED" })).rejects.toThrow(/resolution/i);
    await changeTicketStatus(manager.actor, ticket.id, {
      status: "RESOLVED",
      resolution: "Reinstalled the printer driver and tested a page.",
    });
    await expect(changeTicketStatus(employee.actor, ticket.id, { status: "REOPENED" })).rejects.toThrow(/reason/i);
    await changeTicketStatus(employee.actor, ticket.id, {
      status: "REOPENED",
      reason: "The printer failed again after lunch.",
    });
  });

  it("hides internal notes from employees", async () => {
    const manager = await createAccount({
      name: "Manager",
      email: "manager2c-c@test.local",
      role: "IT_MANAGER",
    });
    const employee = await createAccount({
      name: "Staff",
      email: "staff2c-c@test.local",
      role: "EMPLOYEE",
    });
    const outsider = await createAccount({
      name: "Outsider",
      email: "out2c@test.local",
      role: "EMPLOYEE",
    });
    const ticket = await seedTicket(employee.actor);
    await addTicketComment(employee.actor, ticket.id, {
      body: "I can only print from one PC.",
      visibility: "PUBLIC",
    });
    await addTicketComment(manager.actor, ticket.id, {
      body: "Suspect a VLAN ACL on the finance printer.",
      visibility: "INTERNAL",
    });

    const forEmployee = await listTicketComments(employee.actor, ticket.id);
    expect(forEmployee).toHaveLength(1);
    expect(forEmployee[0]?.visibility).toBe("PUBLIC");

    const forManager = await listTicketComments(manager.actor, ticket.id);
    expect(forManager).toHaveLength(2);

    await expect(getTicket(outsider.actor, ticket.id)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      addTicketComment(outsider.actor, ticket.id, { body: "hello", visibility: "PUBLIC" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("stops an employee from assigning tickets", async () => {
    const employee = await createAccount({
      name: "Staff",
      email: "staff2c-d@test.local",
      role: "EMPLOYEE",
    });
    const technician = await createAccount({
      name: "Tech",
      email: "tech2c-d@test.local",
      role: "TECHNICIAN",
    });
    const ticket = await seedTicket(employee.actor);
    await expect(
      assignTicket(employee.actor, ticket.id, { assigneeId: technician.user.id, reason: "" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
