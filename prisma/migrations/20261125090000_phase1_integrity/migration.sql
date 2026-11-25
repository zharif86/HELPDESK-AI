-- The assigning administrator is a real user. Removing that account keeps the assignment.
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "user_roles_assigned_by_id_idx" ON "user_roles"("assigned_by_id");

-- Department heads can read their own organisation branch. Existing databases
-- already have the role; new databases receive the same grants from the seed.
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" AS r
JOIN "permissions" AS p ON p."key" IN ('departments.read', 'locations.read')
WHERE r."key" = 'DEPARTMENT_HEAD'
ON CONFLICT DO NOTHING;
