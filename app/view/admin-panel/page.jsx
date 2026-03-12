/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "../../components/AuthGuard";
import Sidebar from "../../components/Sidebar";
import TopNavbar from "../../components/TopNavbar";
import {
  ShieldCheck,
  Search,
  Pencil,
  Trash2,
  X,
  Save,
  ChevronLeft,
  ChevronRight,
  Package,
  PackageCheck,
  Truck,
  ArrowDownToLine,
} from "lucide-react";
import { useAuth } from "../../hook/useAuth";
import { isAdminRole } from "../../utils/roleHelper";
import {
  fetchProductInController,
  fetchProductOutController,
  updateProductInController,
  deleteProductInController,
  updateProductOutController,
  deleteProductOutController,
} from "../../controller/productController";
import {
  getParcelInItems,
  updateParcelInItem,
  deleteParcelInItem,
} from "../../controller/parcelShipped";
import {
  getParcelOutItems,
  updateParcelOutItem,
  deleteParcelOutItem,
} from "../../controller/parcelDelivery";

const TABS = [
  { key: "products-in", label: "Products In", icon: PackageCheck },
  { key: "products-out", label: "Products Out", icon: Package },
  { key: "components-in", label: "Components In", icon: ArrowDownToLine },
  { key: "components-out", label: "Components Out", icon: Truck },
];

const ITEMS_PER_PAGE = 10;

export default function AdminPanelPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("products-in");
  const { role, loading } = useAuth();
  const router = useRouter();
  const isAdmin = isAdminRole(role);

  // Data
  const [productsIn, setProductsIn] = useState([]);
  const [productsOut, setProductsOut] = useState([]);
  const [componentsIn, setComponentsIn] = useState([]);
  const [componentsOut, setComponentsOut] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Search & pagination per tab
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Edit modal
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Feedback
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  useEffect(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved !== null) setDarkMode(saved === "true");
  }, []);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace("/view/dashboard");
    }
  }, [loading, isAdmin, router]);

  const loadAllData = useCallback(async () => {
    setDataLoading(true);
    const [pIn, pOut, cInResult, cOutResult] = await Promise.all([
      fetchProductInController(),
      fetchProductOutController(),
      getParcelInItems(),
      getParcelOutItems(),
    ]);
    setProductsIn(pIn || []);
    setProductsOut(pOut || []);
    setComponentsIn(cInResult?.data || []);
    setComponentsOut(cOutResult?.data || []);
    setDataLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) loadAllData();
  }, [isAdmin, loadAllData]);

  // Reset page and search when switching tabs
  useEffect(() => {
    setSearch("");
    setPage(1);
  }, [activeTab]);

  // Clear feedback after 4s
  useEffect(() => {
    if (!feedback.message) return;
    const t = setTimeout(() => setFeedback({ type: "", message: "" }), 4000);
    return () => clearTimeout(t);
  }, [feedback]);

  // Get current tab data
  const getCurrentData = () => {
    switch (activeTab) {
      case "products-in": return productsIn;
      case "products-out": return productsOut;
      case "components-in": return componentsIn;
      case "components-out": return componentsOut;
      default: return [];
    }
  };

  // Whether it's a product tab (vs component/parcel tab)
  const isProductTab = activeTab === "products-in" || activeTab === "products-out";

  // Get fields for current tab
  const getFields = () => {
    if (isProductTab) {
      return [
        { key: "product_name", label: "Product Name" },
        { key: "quantity", label: "Quantity", type: "number" },
        { key: "date", label: "Date" },
        { key: "price", label: "Price", type: "number" },
        { key: "shipping_mode", label: "Shipping Mode" },
        { key: "client_name", label: "Client Name" },
        { key: "description", label: "Description" },
      ];
    }
    return [
      { key: "item_name", label: "Item Name" },
      { key: "quantity", label: "Quantity", type: "number" },
      { key: "date", label: "Date" },
      { key: "price", label: "Price", type: "number" },
      { key: "shipping_mode", label: "Shipping Mode" },
      { key: "client_name", label: "Client Name" },
    ];
  };

  // Filter by search
  const getFilteredData = () => {
    const data = getCurrentData();
    const keyword = search.trim().toLowerCase();
    if (!keyword) return data;
    return data.filter((item) => {
      const name = (item.product_name || item.item_name || "").toLowerCase();
      const client = (item.client_name || "").toLowerCase();
      const mode = (item.shipping_mode || "").toLowerCase();
      return name.includes(keyword) || client.includes(keyword) || mode.includes(keyword);
    });
  };

  const filteredData = getFilteredData();
  const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
  const paginatedData = filteredData.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // Column config for table display
  const getColumns = () => {
    if (isProductTab) {
      return [
        { key: "product_name", label: "Name" },
        { key: "quantity", label: "Qty" },
        { key: "date", label: "Date" },
        { key: "price", label: "Price" },
        { key: "client_name", label: "Client" },
        { key: "shipping_mode", label: "Shipping" },
      ];
    }
    return [
      { key: "item_name", label: "Name" },
      { key: "quantity", label: "Qty" },
      { key: "date", label: "Date" },
      { key: "price", label: "Price" },
      { key: "client_name", label: "Client" },
      { key: "shipping_mode", label: "Shipping" },
    ];
  };

  // ---- EDIT ----
  const openEdit = (item) => {
    setEditItem(item);
    const fields = getFields();
    const form = {};
    for (const f of fields) {
      form[f.key] = item[f.key] ?? "";
    }
    setEditForm(form);
  };

  const closeEdit = () => {
    setEditItem(null);
    setEditForm({});
    setEditSaving(false);
  };

  const handleEditChange = (key, value) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleEditSave = async () => {
    if (!editItem) return;
    setEditSaving(true);

    // Build the update payload — only include changed fields
    const updates = {};
    const fields = getFields();
    for (const f of fields) {
      const newVal = f.type === "number"
        ? (editForm[f.key] === "" || editForm[f.key] === null ? null : Number(editForm[f.key]))
        : (editForm[f.key] || null);
      const oldVal = editItem[f.key] ?? null;
      if (newVal !== oldVal) {
        updates[f.key] = newVal;
      }
    }

    if (Object.keys(updates).length === 0) {
      closeEdit();
      return;
    }

    let result;
    switch (activeTab) {
      case "products-in":
        result = await updateProductInController(editItem.id, updates);
        break;
      case "products-out":
        result = await updateProductOutController(editItem.id, updates);
        break;
      case "components-in":
        result = await updateParcelInItem(editItem.id, updates);
        break;
      case "components-out":
        result = await updateParcelOutItem(editItem.id, updates);
        break;
    }

    if (result?.error) {
      setFeedback({ type: "error", message: `Update failed: ${result.error.message || "Unknown error"}` });
      setEditSaving(false);
      return;
    }

    setFeedback({ type: "success", message: "Record updated successfully." });
    closeEdit();
    await loadAllData();
  };

  // ---- DELETE ----
  const openDelete = (item) => {
    setDeleteTarget(item);
  };

  const closeDelete = () => {
    setDeleteTarget(null);
    setDeleting(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    let result;
    switch (activeTab) {
      case "products-in":
        result = await deleteProductInController(deleteTarget.id);
        break;
      case "products-out":
        result = await deleteProductOutController(deleteTarget.id);
        break;
      case "components-in":
        result = await deleteParcelInItem(deleteTarget.id);
        break;
      case "components-out":
        result = await deleteParcelOutItem(deleteTarget.id);
        break;
    }

    if (result?.error) {
      setFeedback({ type: "error", message: `Delete failed: ${result.error.message || "Unknown error"}` });
      setDeleting(false);
      return;
    }

    setFeedback({ type: "success", message: "Record deleted." });
    closeDelete();
    await loadAllData();
  };

  // ---- STYLE HELPERS ----
  const cardClass = (extra = "") =>
    `rounded-xl border ${extra} ${
      darkMode ? "bg-[#1F2937] border-[#374151]" : "bg-white border-[#E5E7EB]"
    }`;

  const subtextClass = darkMode ? "text-gray-400" : "text-gray-600";

  if (!isAdmin) {
    return (
      <AuthGuard darkMode={darkMode}>
        <div
          className={`min-h-screen flex items-center justify-center ${
            darkMode ? "bg-[#111827] text-white" : "bg-[#F3F4F6] text-black"
          }`}
        >
          <p className="text-sm">Redirecting...</p>
        </div>
      </AuthGuard>
    );
  }

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
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className={`${cardClass()} p-6 mb-6`}>
              <div className="flex items-center gap-3 mb-1">
                <ShieldCheck className="w-6 h-6 text-[#2563EB]" />
                <h1 className="text-2xl font-bold">Admin Control Panel</h1>
              </div>
              <p className={`text-sm ${subtextClass}`}>
                Edit, delete, and manage all inventory records.
              </p>
            </div>

            {/* Feedback Banner */}
            {feedback.message && (
              <div
                className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
                  feedback.type === "success"
                    ? darkMode
                      ? "bg-green-900/30 text-green-400 border border-green-800"
                      : "bg-green-50 text-green-700 border border-green-200"
                    : darkMode
                      ? "bg-red-900/30 text-red-400 border border-red-800"
                      : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {feedback.message}
              </div>
            )}

            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 mb-6">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-[#2563EB] text-white shadow-lg"
                        : darkMode
                          ? "bg-[#1F2937] text-gray-300 hover:bg-[#374151] border border-[#374151]"
                          : "bg-white text-gray-700 hover:bg-gray-100 border border-[#E5E7EB]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    <span
                      className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                        isActive
                          ? "bg-white/20 text-white"
                          : darkMode
                            ? "bg-[#374151] text-gray-400"
                            : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {activeTab === tab.key ? filteredData.length : (() => {
                        switch (tab.key) {
                          case "products-in": return productsIn.length;
                          case "products-out": return productsOut.length;
                          case "components-in": return componentsIn.length;
                          case "components-out": return componentsOut.length;
                          default: return 0;
                        }
                      })()}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Bar */}
            <div className={`${cardClass()} p-4 mb-4`}>
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${subtextClass}`} />
                <input
                  type="text"
                  placeholder={`Search ${isProductTab ? "products" : "components"}...`}
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg text-sm border transition-colors ${
                    darkMode
                      ? "bg-[#111827] border-[#374151] text-white placeholder-gray-500 focus:border-[#2563EB]"
                      : "bg-[#F9FAFB] border-[#E5E7EB] text-black placeholder-gray-400 focus:border-[#2563EB]"
                  } outline-none`}
                />
              </div>
            </div>

            {/* Data Table */}
            <div className={`${cardClass()} overflow-hidden`}>
              {dataLoading ? (
                <div className="p-12 text-center">
                  <div className="inline-block w-6 h-6 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
                  <p className={`mt-3 text-sm ${subtextClass}`}>Loading records...</p>
                </div>
              ) : filteredData.length === 0 ? (
                <div className="p-12 text-center">
                  <Package className={`w-10 h-10 mx-auto mb-3 ${subtextClass}`} />
                  <p className={`text-sm ${subtextClass}`}>
                    {search ? "No records match your search." : "No records found."}
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className={darkMode ? "bg-[#374151]/50" : "bg-[#F9FAFB]"}>
                          {getColumns().map((col) => (
                            <th
                              key={col.key}
                              className={`px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider ${subtextClass}`}
                            >
                              {col.label}
                            </th>
                          ))}
                          <th className={`px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider ${subtextClass}`}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {paginatedData.map((item) => (
                          <tr
                            key={item.id}
                            className={`transition-colors ${
                              darkMode ? "hover:bg-[#374151]/30" : "hover:bg-[#F9FAFB]"
                            }`}
                          >
                            {getColumns().map((col) => (
                              <td key={col.key} className="px-4 py-3">
                                {col.key === "price"
                                  ? item[col.key] != null
                                    ? `₱${Number(item[col.key]).toLocaleString()}`
                                    : "—"
                                  : col.key === "quantity"
                                    ? (
                                      <span className={`font-medium ${
                                        Number(item[col.key]) === 0
                                          ? "text-red-500"
                                          : Number(item[col.key]) <= 5
                                            ? "text-orange-500"
                                            : ""
                                      }`}>
                                        {item[col.key]}
                                      </span>
                                    )
                                    : item[col.key] || "—"
                                }
                              </td>
                            ))}
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => openEdit(item)}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    darkMode
                                      ? "hover:bg-[#374151] text-blue-400"
                                      : "hover:bg-blue-50 text-blue-600"
                                  }`}
                                  title="Edit"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openDelete(item)}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    darkMode
                                      ? "hover:bg-[#374151] text-red-400"
                                      : "hover:bg-red-50 text-red-600"
                                  }`}
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className={`flex items-center justify-between px-4 py-3 border-t ${
                      darkMode ? "border-[#374151]" : "border-[#E5E7EB]"
                    }`}>
                      <p className={`text-xs ${subtextClass}`}>
                        Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filteredData.length)} of {filteredData.length}
                      </p>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={page <= 1}
                          onClick={() => setPage((p) => p - 1)}
                          className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${
                            darkMode ? "hover:bg-[#374151]" : "hover:bg-gray-100"
                          }`}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs px-2">
                          {page} / {totalPages}
                        </span>
                        <button
                          type="button"
                          disabled={page >= totalPages}
                          onClick={() => setPage((p) => p + 1)}
                          className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${
                            darkMode ? "hover:bg-[#374151]" : "hover:bg-gray-100"
                          }`}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ====== EDIT MODAL ====== */}
        {editItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div
              className={`w-full max-w-lg rounded-xl border shadow-2xl ${
                darkMode ? "bg-[#1F2937] border-[#374151]" : "bg-white border-[#E5E7EB]"
              }`}
            >
              <div className={`flex items-center justify-between px-6 py-4 border-b ${
                darkMode ? "border-[#374151]" : "border-[#E5E7EB]"
              }`}>
                <h2 className="font-semibold text-lg">Edit Record</h2>
                <button type="button" onClick={closeEdit} className="p-1 rounded-lg hover:bg-gray-500/20">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
                {getFields().map((field) => (
                  <div key={field.key}>
                    <label className={`block text-xs font-medium mb-1.5 ${subtextClass}`}>
                      {field.label}
                    </label>
                    <input
                      type={field.type || "text"}
                      value={editForm[field.key] ?? ""}
                      onChange={(e) => handleEditChange(field.key, e.target.value)}
                      className={`w-full px-3 py-2.5 rounded-lg text-sm border transition-colors outline-none ${
                        darkMode
                          ? "bg-[#111827] border-[#374151] text-white focus:border-[#2563EB]"
                          : "bg-[#F9FAFB] border-[#E5E7EB] text-black focus:border-[#2563EB]"
                      }`}
                    />
                  </div>
                ))}
              </div>

              <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${
                darkMode ? "border-[#374151]" : "border-[#E5E7EB]"
              }`}>
                <button
                  type="button"
                  onClick={closeEdit}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    darkMode
                      ? "bg-[#374151] hover:bg-[#4B5563] text-gray-300"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleEditSave}
                  disabled={editSaving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#2563EB] text-white hover:bg-[#1D4ED8] disabled:opacity-50 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {editSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ====== DELETE CONFIRMATION ====== */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div
              className={`w-full max-w-sm rounded-xl border shadow-2xl ${
                darkMode ? "bg-[#1F2937] border-[#374151]" : "bg-white border-[#E5E7EB]"
              }`}
            >
              <div className="px-6 py-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </div>
                  <h2 className="font-semibold text-lg">Delete Record</h2>
                </div>
                <p className={`text-sm ${subtextClass}`}>
                  Are you sure you want to delete{" "}
                  <strong className={darkMode ? "text-white" : "text-black"}>
                    {deleteTarget.product_name || deleteTarget.item_name || `#${deleteTarget.id}`}
                  </strong>
                  ? This action cannot be undone.
                </p>
              </div>
              <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${
                darkMode ? "border-[#374151]" : "border-[#E5E7EB]"
              }`}>
                <button
                  type="button"
                  onClick={closeDelete}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    darkMode
                      ? "bg-[#374151] hover:bg-[#4B5563] text-gray-300"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
