const SIDEBAR_CUSTOMIZATION_KEY = "sidebarCustomization:v1";

const safeParseJson = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const loadSidebarCustomization = () => {
  if (typeof window === "undefined") return {};
  const parsed = safeParseJson(window.localStorage.getItem(SIDEBAR_CUSTOMIZATION_KEY));
  return parsed && typeof parsed === "object" ? parsed : {};
};

export const saveSidebarCustomization = (customization) => {
  if (typeof window === "undefined") return { success: false, error: "No window" };
  try {
    window.localStorage.setItem(
      SIDEBAR_CUSTOMIZATION_KEY,
      JSON.stringify(customization || {}),
    );
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};

export const clearSidebarCustomization = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SIDEBAR_CUSTOMIZATION_KEY);
};

