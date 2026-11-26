import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ForbiddenError } from "../src/server/errors";
import { createTicket, getTicket } from "../src/server/services/ticket-service";
import { resolvePriority } from "../src/server/services/priority-service";
import { listCategories } from "../src/server/services/category-service";
import { nextTicketNumber } from "../src/server/tickets/numbering";
import { canTransition } from "../src/server/tickets/workflow";
import { createAccount, prisma, resetDatabase } from "./helpers";

describe("Phase 2A ticket foundation", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterEach(async () => {
    // keep shared client open across files
  });

  it("seeds the category catalogue and priority matrix", async () => {
    const { actor } = await createAccount({
      name: "Admin",
      email: "admin2a@test.local",
      role: "SYSTEM_ADMIN",
    });
    const categories = await listCategories(actor, { activeOnly: true });
    expect(categories.length).toBeGreaterThanOrEqual(30);
    expect(await resolvePriority("HIGH", "HIGH")).toBe("CRITICAL");
    expect(await resolvePriority("LOW", "LOW")).toBe("LOW");
  });

  it("creates tickets with unique concurrency-safe numbers", async () => {
    const { actor } = await createAccount({
      name: "Employee",
      email: "employee2a@test.local",
      role: "EMPLOYEE",
    });
    const category = await prisma.ticketCategory.findFirstOrThrow({
      where: { code: "HARDWARE", isActive: true },
    });
    const first = await createTicket(actor, {
      title: "Desktop will not start",
      description: "No power light after pressing the button this morning.",
      categoryId: category.id,
      subcategoryId: "",
      impact: "MEDIUM",
      urgency: "HIGH",
      affectedEquipment: "Desktop",
      assetTag: "",
      incidentLocationId: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
    });
    const second = await createTicket(actor, {
      title: "Second desktop fault",
      description: "Second machine shows the same blank screen on boot.",
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
    expect(first.number).toMatch(/^INC-\d{4}-\d{6}$/);
    expect(second.number).not.toBe(first.number);
    expect(first.priority).toBe("HIGH");
    expect(second.priority).toBe("LOW");

    const year = new Date().getUTCFullYear();
    const a = await prisma.$transaction((tx) => nextTicketNumber(tx));
    const b = await prisma.$transaction((tx) => nextTicketNumber(tx));
    expect(a).toBe(`INC-${year}-000003`);
    expect(b).toBe(`INC-${year}-000004`);
  });

  it("rejects an invalid category and blocks cross-user ticket access", async () => {
    const employee = await createAccount({
      name: "Requester",
      email: "requester2a@test.local",
      role: "EMPLOYEE",
    });
    const other = await createAccount({
      name: "Other",
      email: "other2a@test.local",
      role: "EMPLOYEE",
    });
    await expect(
      createTicket(employee.actor, {
        title: "Broken laptop screen",
        description: "The display stays black after login every day.",
        categoryId: "missing-category",
        subcategoryId: "",
        impact: "HIGH",
        urgency: "MEDIUM",
        affectedEquipment: "",
        assetTag: "",
        incidentLocationId: "",
        contactName: "",
        contactEmail: "",
        contactPhone: "",
      }),
    ).rejects.toThrow(/active incident category/i);

    const category = await prisma.ticketCategory.findFirstOrThrow({ where: { code: "LAPTOP" } });
    const parent = category.parentId
      ? await prisma.ticketCategory.findUniqueOrThrow({ where: { id: category.parentId } })
      : category;
    const ticket = await createTicket(employee.actor, {
      title: "Broken laptop screen",
      description: "The display stays black after login every day.",
      categoryId: parent.id,
      subcategoryId: category.parentId ? category.id : "",
      impact: "HIGH",
      urgency: "MEDIUM",
      affectedEquipment: "Laptop",
      assetTag: "AST-1",
      incidentLocationId: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
    });

    await expect(getTicket(other.actor, ticket.id)).rejects.toBeInstanceOf(ForbiddenError);
    const own = await getTicket(employee.actor, ticket.id);
    expect(own?.number).toBe(ticket.number);
  });

  it("enforces controlled status transitions", () => {
    expect(canTransition("NEW", "OPEN")).toBe(true);
    expect(canTransition("NEW", "RESOLVED")).toBe(false);
    expect(canTransition("RESOLVED", "CLOSED")).toBe(true);
    expect(canTransition("CLOSED", "IN_PROGRESS")).toBe(false);
  });
});
