-- Phase 2 helpdesk core. Does not alter or remove Phase 1 tables beyond adding users.specialisation.

CREATE TYPE "TicketStatus" AS ENUM ('NEW', 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_USER', 'PENDING_VENDOR', 'ESCALATED', 'RESOLVED', 'CLOSED', 'REOPENED', 'CANCELLED');
CREATE TYPE "TicketImpact" AS ENUM ('HIGH', 'MEDIUM', 'LOW');
CREATE TYPE "TicketUrgency" AS ENUM ('HIGH', 'MEDIUM', 'LOW');
CREATE TYPE "TicketPriority" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');
CREATE TYPE "TicketCommentVisibility" AS ENUM ('PUBLIC', 'INTERNAL');
CREATE TYPE "TicketSource" AS ENUM ('USER', 'ADMIN', 'AI');

ALTER TABLE "users" ADD COLUMN "specialisation" TEXT;

CREATE TABLE "ticket_number_sequences" (
    "year" INTEGER NOT NULL,
    "last_value" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ticket_number_sequences_pkey" PRIMARY KEY ("year")
);

CREATE TABLE "ticket_categories" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parent_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by_id" TEXT,
    CONSTRAINT "ticket_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ticket_priority_rules" (
    "id" TEXT NOT NULL,
    "impact" "TicketImpact" NOT NULL,
    "urgency" "TicketUrgency" NOT NULL,
    "priority" "TicketPriority" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ticket_priority_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'NEW',
    "impact" "TicketImpact" NOT NULL,
    "urgency" "TicketUrgency" NOT NULL,
    "priority" "TicketPriority" NOT NULL,
    "priority_override_reason" TEXT,
    "source" "TicketSource" NOT NULL DEFAULT 'USER',
    "contact_name" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "affected_equipment" TEXT,
    "asset_tag" TEXT,
    "asset_id" TEXT,
    "requester_department_name" TEXT,
    "requester_location_name" TEXT,
    "reported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolution" TEXT,
    "resolved_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "cancellation_reason" TEXT,
    "reopen_reason" TEXT,
    "ai_diagnostic_summary" TEXT,
    "ai_suggested_category_id" TEXT,
    "ai_suggested_priority" "TicketPriority",
    "ai_confidence_score" DOUBLE PRECISION,
    "ai_session_ref" TEXT,
    "requester_id" TEXT NOT NULL,
    "department_id" TEXT,
    "location_id" TEXT,
    "incident_location_id" TEXT,
    "category_id" TEXT,
    "subcategory_id" TEXT,
    "assignee_id" TEXT,
    "created_by_id" TEXT,
    "updated_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ticket_assignments" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "assignee_id" TEXT NOT NULL,
    "assigned_by_id" TEXT,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unassigned_at" TIMESTAMP(3),
    "reassignment_reason" TEXT,
    CONSTRAINT "ticket_assignments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ticket_comments" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "visibility" "TicketCommentVisibility" NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ticket_comments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ticket_activities" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "previous_value" TEXT,
    "new_value" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ticket_activities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ticket_attachments" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "comment_id" TEXT,
    "uploaded_by_id" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ticket_attachments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ticket_categories_code_key" ON "ticket_categories"("code");
CREATE INDEX "ticket_categories_parent_id_idx" ON "ticket_categories"("parent_id");
CREATE INDEX "ticket_categories_is_active_idx" ON "ticket_categories"("is_active");
CREATE INDEX "ticket_categories_sort_order_idx" ON "ticket_categories"("sort_order");

CREATE UNIQUE INDEX "ticket_priority_rules_impact_urgency_key" ON "ticket_priority_rules"("impact", "urgency");

CREATE UNIQUE INDEX "tickets_number_key" ON "tickets"("number");
CREATE INDEX "tickets_status_idx" ON "tickets"("status");
CREATE INDEX "tickets_priority_idx" ON "tickets"("priority");
CREATE INDEX "tickets_requester_id_idx" ON "tickets"("requester_id");
CREATE INDEX "tickets_assignee_id_idx" ON "tickets"("assignee_id");
CREATE INDEX "tickets_department_id_idx" ON "tickets"("department_id");
CREATE INDEX "tickets_category_id_idx" ON "tickets"("category_id");
CREATE INDEX "tickets_subcategory_id_idx" ON "tickets"("subcategory_id");
CREATE INDEX "tickets_reported_at_idx" ON "tickets"("reported_at");
CREATE INDEX "tickets_created_at_idx" ON "tickets"("created_at");

CREATE INDEX "ticket_assignments_ticket_id_idx" ON "ticket_assignments"("ticket_id");
CREATE INDEX "ticket_assignments_assignee_id_idx" ON "ticket_assignments"("assignee_id");
CREATE INDEX "ticket_assignments_assigned_at_idx" ON "ticket_assignments"("assigned_at");

CREATE INDEX "ticket_comments_ticket_id_idx" ON "ticket_comments"("ticket_id");
CREATE INDEX "ticket_comments_author_id_idx" ON "ticket_comments"("author_id");
CREATE INDEX "ticket_comments_visibility_idx" ON "ticket_comments"("visibility");
CREATE INDEX "ticket_comments_created_at_idx" ON "ticket_comments"("created_at");

CREATE INDEX "ticket_activities_ticket_id_idx" ON "ticket_activities"("ticket_id");
CREATE INDEX "ticket_activities_actor_id_idx" ON "ticket_activities"("actor_id");
CREATE INDEX "ticket_activities_action_idx" ON "ticket_activities"("action");
CREATE INDEX "ticket_activities_created_at_idx" ON "ticket_activities"("created_at");

CREATE UNIQUE INDEX "ticket_attachments_storage_key_key" ON "ticket_attachments"("storage_key");
CREATE INDEX "ticket_attachments_ticket_id_idx" ON "ticket_attachments"("ticket_id");
CREATE INDEX "ticket_attachments_comment_id_idx" ON "ticket_attachments"("comment_id");
CREATE INDEX "ticket_attachments_uploaded_by_id_idx" ON "ticket_attachments"("uploaded_by_id");

ALTER TABLE "ticket_categories" ADD CONSTRAINT "ticket_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "ticket_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ticket_categories" ADD CONSTRAINT "ticket_categories_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "tickets" ADD CONSTRAINT "tickets_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_incident_location_id_fkey" FOREIGN KEY ("incident_location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "ticket_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "ticket_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ticket_assignments" ADD CONSTRAINT "ticket_assignments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ticket_assignments" ADD CONSTRAINT "ticket_assignments_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ticket_assignments" ADD CONSTRAINT "ticket_assignments_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ticket_activities" ADD CONSTRAINT "ticket_activities_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ticket_activities" ADD CONSTRAINT "ticket_activities_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ticket_attachments" ADD CONSTRAINT "ticket_attachments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ticket_attachments" ADD CONSTRAINT "ticket_attachments_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "ticket_comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ticket_attachments" ADD CONSTRAINT "ticket_attachments_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
