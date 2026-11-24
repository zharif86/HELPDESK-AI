export function parentCreatesCycle(
  departmentId: string,
  parentId: string | null,
  parentById: ReadonlyMap<string, string | null>,
) {
  if (!parentId) return false;
  const seen = new Set<string>();
  let current: string | null = parentId;
  while (current) {
    if (current === departmentId || seen.has(current)) return true;
    seen.add(current);
    current = parentById.get(current) ?? null;
  }
  return false;
}
