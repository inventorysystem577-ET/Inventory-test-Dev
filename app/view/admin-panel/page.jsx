"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "../../components/AuthGuard";
import Sidebar from "../../components/Sidebar";
import TopNavbar from "../../components/TopNavbar";
import {
  ShieldCheck,
  Settings,
  ArrowRight,
  PencilLine,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import { useAuth } from "../../hook/useAuth";
import { isAdminRole } from "../../utils/roleHelper";
import {
  clearAdminUndoAction,
  loadAdminUndoAction,
} from "../../utils/adminUndo";
import {
  SIDEBAR_ICON_MAP,
  SIDEBAR_ICON_OPTIONS,
  getSidebarMenuItems,
} from "../../utils/sidebarMenuConfig";
import {
  clearSidebarCustomization,
  loadSidebarCustomization,
  saveSidebarCustomization,
} from "../../utils/sidebarCustomization";
import { fetchParcelItems } from "../../utils/parcelShippedHelper";
import { fetchParcelOutItems } from "../../utils/parcelOutHelper";
import {
  fetchProductInController,
  fetchProductOutController,
  restoreProductInInventory,
  restoreProductOutHistory,
} from "../../controller/productController";
import { restoreParcelInInventory } from "../../controller/parcelShipped";
import { restoreParcelOutHistory } from "../../controller/parcelDelivery";

export default function AdminPanelPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const { role, loading } = useAuth();
  const router = useRouter();

  const isAdmin = isAdminRole(role);
  const [undoAction, setUndoAction] = useState(null);
  const [undoError, setUndoError] = useState("");
  const [undoSuccess, setUndoSuccess] = useState("");
  const [isUndoing, setIsUndoing] = useState(false);

  const [sidebarDraft, setSidebarDraft] = useState({});
  const [customizationError, setCustomizationError] = useState("");
  const [customizationSuccess, setCustomizationSuccess] = useState("");

  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode");
    if (savedDarkMode !== null) {
      setDarkMode(savedDarkMode === "true");
    }
  }, []);

  useEffect(() => {
    const refreshUndo = () => {
      setUndoAction(loadAdminUndoAction());
    };

    refreshUndo();
    window.addEventListener("adminUndoUpdated", refreshUndo);
    window.addEventListener("storage", refreshUndo);

    return () => {
      window.removeEventListener("adminUndoUpdated", refreshUndo);
      window.removeEventListener("storage", refreshUndo);
    };
  }, []);

  useEffect(() => {
    const defaults = getSidebarMenuItems(true);
    const stored = loadSidebarCustomization();

    const draft = {};
    defaults.forEach((item) => {
      const override = stored?.[item.id] || {};
      draft[item.id] = {
        label:
          typeof override.label === "string" && override.label.trim()
            ? override.label
            : item.label,
        iconKey:
          typeof override.iconKey === "string" && SIDEBAR_ICON_MAP[override.iconKey]
            ? override.iconKey
            : item.iconKey,
      };
    });

    setSidebarDraft(draft);
  }, []);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace("/view/product-in");
    }
  }, [loading, isAdmin, router]);

  if (!isAdmin) {
    return (
      <AuthGuard darkMode={darkMode}>
        <div
          className={`min-h-screen flex items-center justify-center ${
            darkMode ? "bg-[#111827] text-white" : "bg-[#F3F4F6] text-black"
          }`}
        >
          <p className="text-sm">Redirecting to monitoring page...</p>
        </div>
      </AuthGuard>
    );
  }

  const adminActions = [
    {
      title: "System Inventory Status",
      description: "Manage inventory records and export/delete controls.",
      path: "/view/out-of-stock",
    },
    {
      title: "Product Management",
      description: "Create, edit, and monitor product records.",
      path: "/view/product-in",
    },
    {
      title: "Product Out Monitoring",
      description: "Review monthly product out transactions and receipts.",
      path: "/view/product-out",
    },
  ];

  const formatUndoTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  };

  const handleUndo = async () => {
    if (!undoAction?.data) return;

    setUndoError("");
    setUndoSuccess("");
    setIsUndoing(true);

    try {
      const [parcelInNow, productInNow, parcelOutNow, productOutNow] =
        await Promise.all([
          fetchParcelItems(),
          fetchProductInController(),
          fetchParcelOutItems(),
          fetchProductOutController(),
        ]);

      const hasExistingData =
        (parcelInNow || []).length > 0 ||
        (productInNow || []).length > 0 ||
        (parcelOutNow || []).length > 0 ||
        (productOutNow || []).length > 0;

      if (hasExistingData) {
        setUndoError(
          "Undo is disabled because inventory/history is not empty. Please undo immediately after deletion (before adding new records).",
        );
        return;
      }

      const payload = undoAction.data || {};
      const [restoreParcelIn, restoreProductIn, restoreParcelOut, restoreProductOut] =
        await Promise.all([
          restoreParcelInInventory(payload.parcelIn || []),
          restoreProductInInventory(payload.productIn || []),
          restoreParcelOutHistory(payload.parcelOut || []),
          restoreProductOutHistory(payload.productOut || []),
        ]);

      const failures = [
        restoreParcelIn,
        restoreProductIn,
        restoreParcelOut,
        restoreProductOut,
      ].filter((result) => result?.success === false || result?.error);

      if (failures.length > 0) {
        setUndoError("Restore failed for one or more tables. No changes were cleared.");
        return;
      }

      clearAdminUndoAction();
      window.dispatchEvent(new Event("adminUndoUpdated"));
      setUndoAction(null);
      setUndoSuccess("Undo complete. Inventory restored.");
    } finally {
      setIsUndoing(false);
    }
  };

  const handleDiscardUndo = () => {
    clearAdminUndoAction();
    window.dispatchEvent(new Event("adminUndoUpdated"));
    setUndoAction(null);
    setUndoError("");
    setUndoSuccess("Undo snapshot cleared.");
  };

  const handleSidebarDraftChange = (id, patch) => {
    setCustomizationError("");
    setCustomizationSuccess("");
    setSidebarDraft((prev) => ({
      ...(prev || {}),
      [id]: { ...(prev?.[id] || {}), ...(patch || {}) },
    }));
  };

  const handleSaveSidebarCustomization = () => {
    const defaults = getSidebarMenuItems(true);
    const nextCustomization = {};

    defaults.forEach((item) => {
      const draft = sidebarDraft?.[item.id] || {};
      const nextLabel =
        typeof draft.label === "string" && draft.label.trim()
          ? draft.label.trim()
          : item.label;
      const nextIconKey =
        typeof draft.iconKey === "string" && SIDEBAR_ICON_MAP[draft.iconKey]
          ? draft.iconKey
          : item.iconKey;

      const changed = nextLabel !== item.label || nextIconKey !== item.iconKey;
      if (changed) {
        nextCustomization[item.id] = { label: nextLabel, iconKey: nextIconKey };
      }
    });

    const result = saveSidebarCustomization(nextCustomization);
    if (!result.success) {
      setCustomizationError("Failed to save menu customization (storage full).");
      return;
    }

    window.dispatchEvent(new Event("sidebarCustomizationUpdated"));
    setCustomizationSuccess("Sidebar customization saved.");
  };

  const handleResetSidebarCustomization = () => {
    clearSidebarCustomization();
    window.dispatchEvent(new Event("sidebarCustomizationUpdated"));

    const defaults = getSidebarMenuItems(true);
    const draft = {};
    defaults.forEach((item) => {
      draft[item.id] = { label: item.label, iconKey: item.iconKey };
    });
    setSidebarDraft(draft);
    setCustomizationError("");
    setCustomizationSuccess("Sidebar customization reset.");
  };

  return (
    <AuthGuard darkMode={darkMode}>
      <div
        className={`min-h-screen transition-colors duration-300 ${
          darkMode ? "bg-[#111827] text-white" : "bg-[#F3F4F6] text-black"
        }`}
      >
        <TopNavbar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          darkMode={darkMode}
        />

        <div
          className={`transition-all duration-300 ${
            sidebarOpen ? "lg:ml-64" : "ml-0"
          } pt-16`}
        >
          <div className="p-6 sm:p-8">
            <div
              className={`rounded-xl border p-6 mb-6 ${
                darkMode
                  ? "bg-[#1F2937] border-[#374151]"
                  : "bg-white border-[#E5E7EB]"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <ShieldCheck className="w-6 h-6 text-[#2563EB]" />
                <h1 className="text-2xl font-bold">Admin Control Panel</h1>
              </div>
              <p
                className={`text-sm ${
                  darkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Admin can modify the whole system, access all pages, and manage
                inventory controls.
              </p>
            </div>

            {/* Safety: Undo */}
            <div
              className={`rounded-xl border p-5 mb-6 ${
                darkMode ? "bg-[#1F2937] border-[#374151]" : "bg-white border-[#E5E7EB]"
              }`}
            >
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-[#2563EB]" />
                  <h2 className="font-semibold">Undo last delete</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={!undoAction || isUndoing}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                      !undoAction || isUndoing
                        ? darkMode
                          ? "bg-[#374151] text-[#9CA3AF] cursor-not-allowed"
                          : "bg-[#E5E7EB] text-[#6B7280] cursor-not-allowed"
                        : "bg-[#16A34A] text-white hover:bg-[#15803D]"
                    }`}
                  >
                    Undo
                  </button>
                  <button
                    type="button"
                    onClick={handleDiscardUndo}
                    disabled={!undoAction || isUndoing}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                      !undoAction || isUndoing
                        ? darkMode
                          ? "bg-[#374151] text-[#9CA3AF] cursor-not-allowed"
                          : "bg-[#E5E7EB] text-[#6B7280] cursor-not-allowed"
                        : darkMode
                          ? "bg-[#374151] text-white hover:bg-[#4B5563]"
                          : "bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]"
                    }`}
                  >
                    Discard
                  </button>
                </div>
              </div>

              <div className={`mt-3 text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                {undoAction ? (
                  <div className="space-y-1">
                    <div>
                      Last snapshot:{" "}
                      <span className="font-semibold">
                        {formatUndoTime(undoAction.createdAt)}
                      </span>
                    </div>
                    <div className="text-xs opacity-80">
                      Snapshot includes Product In/Out and Parcel In/Out.
                    </div>
                  </div>
                ) : (
                  <div className="text-xs opacity-80">
                    No undo snapshot found. Create one by running “Delete Inventory + Save PDF” in Inventory Status.
                  </div>
                )}
              </div>

              {undoError ? (
                <div
                  className={`mt-3 text-sm font-medium ${
                    darkMode ? "text-red-300" : "text-red-700"
                  }`}
                >
                  {undoError}
                </div>
              ) : null}
              {undoSuccess ? (
                <div
                  className={`mt-3 text-sm font-medium ${
                    darkMode ? "text-green-300" : "text-green-700"
                  }`}
                >
                  {undoSuccess}
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {adminActions.map((action) => (
                <button
                  key={action.title}
                  type="button"
                  onClick={() => router.push(action.path)}
                  className={`text-left rounded-xl border p-5 transition-all hover:scale-[1.01] ${
                    darkMode
                      ? "bg-[#1F2937] border-[#374151] hover:bg-[#374151]"
                      : "bg-white border-[#E5E7EB] hover:bg-[#F9FAFB]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <Settings className="w-5 h-5 text-[#2563EB]" />
                    <ArrowRight className="w-4 h-4" />
                  </div>
                  <h2 className="font-semibold mb-1">{action.title}</h2>
                  <p
                    className={`text-xs ${
                      darkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    {action.description}
                  </p>
                </button>
              ))}
            </div>

            {/* Sidebar customization */}
            <div
              className={`rounded-xl border p-5 mt-6 ${
                darkMode ? "bg-[#1F2937] border-[#374151]" : "bg-white border-[#E5E7EB]"
              }`}
            >
              <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                <div className="flex items-center gap-2">
                  <PencilLine className="w-5 h-5 text-[#2563EB]" />
                  <h2 className="font-semibold">Rename & change icons</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveSidebarCustomization}
                    className="inline-flex items-center gap-2 bg-[#1E40AF] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                  >
                    <Save className="w-4 h-4" /> Save
                  </button>
                  <button
                    type="button"
                    onClick={handleResetSidebarCustomization}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                      darkMode
                        ? "bg-[#374151] text-white hover:bg-[#4B5563]"
                        : "bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]"
                    }`}
                  >
                    <Trash2 className="w-4 h-4" /> Reset
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {getSidebarMenuItems(true).map((item) => {
                  const draft = sidebarDraft?.[item.id] || {
                    label: item.label,
                    iconKey: item.iconKey,
                  };
                  const PreviewIcon =
                    SIDEBAR_ICON_MAP[draft.iconKey] || SIDEBAR_ICON_MAP[item.iconKey];

                  return (
                    <div
                      key={item.id}
                      className={`grid grid-cols-1 lg:grid-cols-12 gap-2 items-center p-3 rounded-lg border ${
                        darkMode
                          ? "border-[#374151] bg-[#111827]/40"
                          : "border-[#E5E7EB] bg-[#F9FAFB]"
                      }`}
                    >
                      <div className="lg:col-span-3 flex items-center gap-2 min-w-0">
                        <PreviewIcon className="w-5 h-5 text-[#2563EB]" />
                        <div className="text-sm font-semibold truncate">{item.id}</div>
                      </div>
                      <div className="lg:col-span-6">
                        <input
                          value={draft.label || ""}
                          onChange={(e) =>
                            handleSidebarDraftChange(item.id, {
                              label: e.target.value,
                            })
                          }
                          className={`w-full border rounded-lg px-3 py-2 text-sm ${
                            darkMode
                              ? "bg-[#111827] border-[#374151] text-white"
                              : "bg-white border-[#D1D5DB] text-black"
                          }`}
                          placeholder={item.label}
                        />
                      </div>
                      <div className="lg:col-span-3">
                        <select
                          value={draft.iconKey || item.iconKey}
                          onChange={(e) =>
                            handleSidebarDraftChange(item.id, {
                              iconKey: e.target.value,
                            })
                          }
                          className={`w-full border rounded-lg px-3 py-2 text-sm ${
                            darkMode
                              ? "bg-[#111827] border-[#374151] text-white"
                              : "bg-white border-[#D1D5DB] text-black"
                          }`}
                        >
                          {SIDEBAR_ICON_OPTIONS.map((key) => (
                            <option key={key} value={key}>
                              {key}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>

              {customizationError ? (
                <div className={`mt-3 text-sm font-medium ${darkMode ? "text-red-300" : "text-red-700"}`}>
                  {customizationError}
                </div>
              ) : null}
              {customizationSuccess ? (
                <div className={`mt-3 text-sm font-medium ${darkMode ? "text-green-300" : "text-green-700"}`}>
                  {customizationSuccess}
                </div>
              ) : null}
            </div>

            <div
              className={`rounded-xl border p-4 mt-6 ${
                darkMode
                  ? "bg-[#1F2937] border-[#374151]"
                  : "bg-white border-[#E5E7EB]"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <PencilLine className="w-5 h-5 text-[#2563EB]" />
                <h3 className="font-semibold">Admin Modification Scope</h3>
              </div>
              <p
                className={`text-sm ${
                  darkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Staff can monitor and add products. Only admin can manage full
                system-level actions and restricted edits.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
