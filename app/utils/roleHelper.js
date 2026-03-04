export const normalizeRole = (role) =>
  (role || "").toString().trim().toLowerCase();

export const isAdminRole = (role) => normalizeRole(role) === "admin";

export const isStaffRole = (role) => normalizeRole(role) === "staff";
