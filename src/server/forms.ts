export function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function readChecked(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "on" || value === "true";
}

export function readStrings(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0);
}

export function passwordsMatch(password: string, confirmation: string) {
  return password === confirmation
    ? null
    : {
        status: "error" as const,
        message: "Passwords do not match.",
        fieldErrors: { confirmPassword: ["Passwords do not match."] },
      };
}
