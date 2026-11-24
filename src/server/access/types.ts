export type Actor = {
  id: string;
  email: string;
  name: string;
  departmentId: string | null;
  roleKeys: string[];
  permissions: string[];
  ipAddress: string | null;
  userAgent: string | null;
};

export type RequestMeta = {
  ipAddress: string | null;
  userAgent: string | null;
};
