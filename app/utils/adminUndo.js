const ADMIN_UNDO_KEY = "adminUndo:lastAction:v1";

const safeParseJson = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const loadAdminUndoAction = () => {
  if (typeof window === "undefined") return null;
  return safeParseJson(window.localStorage.getItem(ADMIN_UNDO_KEY));
};

export const saveAdminUndoAction = (action) => {
  if (typeof window === "undefined") return { success: false, error: "No window" };
  try {
    window.localStorage.setItem(ADMIN_UNDO_KEY, JSON.stringify(action));
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};

export const clearAdminUndoAction = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ADMIN_UNDO_KEY);
};

