/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import TopNavbar from "../../components/TopNavbar";
import AuthGuard from "../../components/AuthGuard";
import { useAuth } from "../../hook/useAuth";
import { isAdminRole } from "../../utils/roleHelper";
import {
  PackageCheck,
  PackageOpen,
  Package,
  Clock,
  AlertTriangle,
  XCircle,
  TrendingDown,
  Box,
  Boxes,
} from "lucide-react";
import "animate.css";

import { fetchParcelItems } from "../../utils/parcelShippedHelper";
import { fetchParcelOutItems } from "../../utils/parcelOutHelper";
import {
  fetchProductInController,
  fetchProductOutController,
} from "../../controller/productController";
import { buildProductCode, buildSku } from "../../utils/inventoryMeta";

export default function page() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [darkMode, setDarkMode] = useState(false);

  const [parcelShipped, setParcelShipped] = useState([]);
  const [parcelDelivery, setParcelDelivery] = useState([]);
  const [stockItems, setStockItems] = useState([]);

  const [parcelShippedCount, setParcelShippedCount] = useState(0);
  const [parcelDeliveryCount, setParcelDeliveryCount] = useState(0);

  const [productIn, setProductIn] = useState([]);
  const [productOut, setProductOut] = useState([]);
  const [productInCount, setProductInCount] = useState(0);
  const [productOutCount, setProductOutCount] = useState(0);

  // Component (parcel) stock status counts
  const [statusCounts, setStatusCounts] = useState({
    out: 0,
    critical: 0,
    low: 0,
    available: 0,
  });

  // Product stock status counts
  const [productStatusCounts, setProductStatusCounts] = useState({
    out: 0,
    critical: 0,
    low: 0,
    available: 0,
  });

  const [inventorySearch, setInventorySearch] = useState("");

  const router = useRouter();
  const { role } = useAuth();
  const isAdmin = isAdminRole(role);

  const convertTo12Hour = (time24) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(":");
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${period}`;
  };

  const getStockStatus = (quantity) => {
    if (quantity === 0) return "out";
    if (quantity <= 5) return "critical";
    if (quantity < 10) return "low";
    return "available";
  };

  const getStatusLabel = (quantity) => {
    if (quantity === 0) return "Out of Stock";
    if (quantity <= 5) return "Critical Level";
    if (quantity < 10) return "Low Stock";
    return "Available";
  };

  const getStatusColor = (quantity, darkMode) => {
    if (quantity === 0) {
      return darkMode
        ? "bg-red-900/30 text-red-400 border border-red-800"
        : "bg-red-50 text-red-700 border border-red-200";
    }
    if (quantity <= 5) {
      return darkMode
        ? "bg-orange-900/30 text-orange-400 border border-orange-800"
        : "bg-orange-50 text-orange-700 border border-orange-200";
    }
    if (quantity < 10) {
      return darkMode
        ? "bg-yellow-900/30 text-yellow-400 border border-yellow-800"
        : "bg-yellow-50 text-yellow-700 border border-yellow-200";
    }
    return darkMode
      ? "bg-green-900/30 text-green-400 border border-green-800"
      : "bg-green-50 text-green-700 border border-green-200";
  };

  const getStatusIcon = (quantity) => {
    if (quantity === 0) return <XCircle className="w-4 h-4" />;
    if (quantity <= 5)
      return <AlertTriangle className="w-4 h-4 animate-pulse" />;
    if (quantity < 10) return <TrendingDown className="w-4 h-4" />;
    return <Box className="w-4 h-4" />;
  };

  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode");
    if (savedDarkMode !== null) setDarkMode(savedDarkMode === "true");

    const fetchData = async () => {
      const shippedRes = await fetchParcelItems();
      const deliveryRes = await fetchParcelOutItems();

      setParcelShipped(shippedRes || []);
      setStockItems(shippedRes || []);

      // Calculate component status counts
      const counts = { out: 0, critical: 0, low: 0, available: 0 };
      (shippedRes || []).forEach((item) => {
        const status = getStockStatus(item.quantity);
        counts[status]++;
      });
      setStatusCounts(counts);

      const itemsWithStock =
        (shippedRes || []).filter((item) => item.quantity > 0).length || 0;
      setParcelShippedCount(itemsWithStock);

      setParcelDelivery(deliveryRes || []);
      setParcelDeliveryCount((deliveryRes || []).length || 0);

      const productInRes = await fetchProductInController();
      const productOutRes = await fetchProductOutController();

      setProductIn(productInRes || []);
      setProductOut(productOutRes || []);

      const productInWithStock =
        (productInRes || []).filter((item) => item.quantity > 0).length || 0;
      setProductInCount(productInWithStock);
      setProductOutCount((productOutRes || []).length || 0);

      // Calculate product status counts
      const productCounts = { out: 0, critical: 0, low: 0, available: 0 };
      (productInRes || []).forEach((item) => {
        const status = getStockStatus(item.quantity);
        productCounts[status]++;
      });
      setProductStatusCounts(productCounts);
    };

    fetchData();
  }, []);

  const handleCardClick = (route, status = null, type = null) => {
    if (status && type) {
      router.push(`${route}?status=${status}&type=${type}&focus=${type}-table`);
    } else if (status) {
      router.push(`${route}?status=${status}`);
    } else {
      router.push(route);
    }
  };

  const searchKey = inventorySearch.trim().toLowerCase();

  const itemsNeedingAttention = stockItems.filter((item) => item.quantity < 10);

  const productsNeedingAttention = productIn.filter((item) => {
    if (item.quantity >= 10) return false;
    if (!searchKey) return true;
    return (
      (item.product_name || "").toLowerCase().includes(searchKey) ||
      buildProductCode(item).toLowerCase().includes(searchKey) ||
      buildSku(item).toLowerCase().includes(searchKey)
    );
  });

  const totalAlertsCount =
    statusCounts.out +
    statusCounts.critical +
    productStatusCounts.out +
    productStatusCounts.critical;

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
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          darkMode={darkMode}
        />

        <div
          className={`transition-all duration-300 ${sidebarOpen ? "lg:ml-64" : "ml-0"} pt-16`}
        >
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Summary Cards - Stock In / Stock Out */}
            <div
              className={`grid gap-4 sm:gap-6 mb-8 ${
                isAdmin ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2" : "grid-cols-1"
              }`}
            >
              <div
                onClick={() => handleCardClick("/view/parcel-shipped")}
                className="bg-gradient-to-br from-[#1e40af] to-[#1e3a8a] text-white p-6 rounded-xl shadow-lg animate__animated animate__fadeInUp cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-2xl active:scale-95"
              >
                <div className="flex items-center justify-between mb-4">
                  <PackageCheck className="w-10 h-10" />
                  <Clock className="w-5 h-5 opacity-70" />
                </div>
                <h3 className="text-sm font-medium opacity-90 mb-1">
                  Stock In
                </h3>
                <p className="text-3xl font-bold mb-2">{parcelShippedCount}</p>
                <p className="text-xs opacity-75">Items in stock</p>
              </div>

              {isAdmin && (
                <div
                  onClick={() => handleCardClick("/view/parcel-delivery")}
                  className="bg-gradient-to-br from-[#ea580c] to-[#c2410c] text-white p-6 rounded-xl shadow-lg animate__animated animate__fadeInUp cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-2xl active:scale-95"
                  style={{ animationDelay: "0.1s" }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <PackageOpen className="w-10 h-10" />
                    <TrendingDown className="w-5 h-5 opacity-70" />
                  </div>
                  <h3 className="text-sm font-medium opacity-90 mb-1">
                    Stock Out
                  </h3>
                  <p className="text-3xl font-bold mb-2">{parcelDeliveryCount}</p>
                  <p className="text-xs opacity-75">Items delivered</p>
                </div>
              )}
            </div>

            {/* ============= COMPONENT STOCK STATUS ============= */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-[#1e40af]" />
                Component Stock Status
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Component Out of Stock */}
                <div
                  onClick={() =>
                    handleCardClick("/view/out-of-stock", "out", "parcel")
                  }
                  className={`p-6 rounded-xl shadow-lg animate__animated animate__fadeInUp cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95 ${
                    darkMode
                      ? "bg-gray-800 border border-gray-700"
                      : "bg-white border border-gray-200"
                  }`}
                  style={{ animationDelay: "0.2s" }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <XCircle className="w-6 h-6 text-red-500" />
                    <p className="text-xs text-gray-500">Critical</p>
                  </div>
                  <p
                    className={`text-sm mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Out of Stock
                  </p>
                  <p className="text-2xl font-bold">{statusCounts.out}</p>
                  <div className="mt-2 bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                    <div
                      className="bg-red-500 h-1.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${stockItems.length > 0 ? (statusCounts.out / stockItems.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Component Critical */}
                <div
                  onClick={() =>
                    handleCardClick("/view/out-of-stock", "critical", "parcel")
                  }
                  className={`p-6 rounded-xl shadow-lg animate__animated animate__fadeInUp cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95 ${
                    darkMode
                      ? "bg-gray-800 border border-gray-700"
                      : "bg-white border border-gray-200"
                  }`}
                  style={{ animationDelay: "0.3s" }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <AlertTriangle className="w-6 h-6 text-orange-500" />
                    <p className="text-xs text-gray-500">Alert</p>
                  </div>
                  <p
                    className={`text-sm mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Critical Level
                  </p>
                  <p className="text-2xl font-bold">{statusCounts.critical}</p>
                  <div className="mt-2 bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                    <div
                      className="bg-orange-500 h-1.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${stockItems.length > 0 ? (statusCounts.critical / stockItems.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Component Low Stock */}
                <div
                  onClick={() =>
                    handleCardClick("/view/out-of-stock", "low", "parcel")
                  }
                  className={`p-6 rounded-xl shadow-lg animate__animated animate__fadeInUp cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95 ${
                    darkMode
                      ? "bg-gray-800 border border-gray-700"
                      : "bg-white border border-gray-200"
                  }`}
                  style={{ animationDelay: "0.4s" }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <TrendingDown className="w-6 h-6 text-yellow-500" />
                    <p className="text-xs text-gray-500">Warning</p>
                  </div>
                  <p
                    className={`text-sm mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Low Stock
                  </p>
                  <p className="text-2xl font-bold">{statusCounts.low}</p>
                  <div className="mt-2 bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                    <div
                      className="bg-yellow-500 h-1.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${stockItems.length > 0 ? (statusCounts.low / stockItems.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Component Available */}
                <div
                  onClick={() =>
                    handleCardClick("/view/out-of-stock", "available", "parcel")
                  }
                  className={`p-6 rounded-xl shadow-lg animate__animated animate__fadeInUp cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95 ${
                    darkMode
                      ? "bg-gray-800 border border-gray-700"
                      : "bg-white border border-gray-200"
                  }`}
                  style={{ animationDelay: "0.5s" }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <Box className="w-6 h-6 text-green-500" />
                    <p className="text-xs text-gray-500">Good</p>
                  </div>
                  <p
                    className={`text-sm mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Available
                  </p>
                  <p className="text-2xl font-bold">{statusCounts.available}</p>
                  <div className="mt-2 bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                    <div
                      className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${stockItems.length > 0 ? (statusCounts.available / stockItems.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ============= PRODUCT STOCK STATUS ============= */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Boxes className="w-5 h-5 text-[#7c3aed]" />
                Product Stock Status
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Product Out of Stock */}
                <div
                  onClick={() =>
                    handleCardClick("/view/out-of-stock", "out", "product")
                  }
                  className={`p-6 rounded-xl shadow-lg animate__animated animate__fadeInUp cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95 ${
                    darkMode
                      ? "bg-gray-800 border border-gray-700"
                      : "bg-white border border-gray-200"
                  }`}
                  style={{ animationDelay: "0.6s" }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <XCircle className="w-6 h-6 text-red-500" />
                    <p className="text-xs text-gray-500">Critical</p>
                  </div>
                  <p
                    className={`text-sm mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Out of Stock
                  </p>
                  <p className="text-2xl font-bold">
                    {productStatusCounts.out}
                  </p>
                  <div className="mt-2 bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                    <div
                      className="bg-red-500 h-1.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${productIn.length > 0 ? (productStatusCounts.out / productIn.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Product Critical */}
                <div
                  onClick={() =>
                    handleCardClick("/view/out-of-stock", "critical", "product")
                  }
                  className={`p-6 rounded-xl shadow-lg animate__animated animate__fadeInUp cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95 ${
                    darkMode
                      ? "bg-gray-800 border border-gray-700"
                      : "bg-white border border-gray-200"
                  }`}
                  style={{ animationDelay: "0.7s" }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <AlertTriangle className="w-6 h-6 text-orange-500" />
                    <p className="text-xs text-gray-500">Alert</p>
                  </div>
                  <p
                    className={`text-sm mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Critical Level
                  </p>
                  <p className="text-2xl font-bold">
                    {productStatusCounts.critical}
                  </p>
                  <div className="mt-2 bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                    <div
                      className="bg-orange-500 h-1.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${productIn.length > 0 ? (productStatusCounts.critical / productIn.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Product Low Stock */}
                <div
                  onClick={() =>
                    handleCardClick("/view/out-of-stock", "low", "product")
                  }
                  className={`p-6 rounded-xl shadow-lg animate__animated animate__fadeInUp cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95 ${
                    darkMode
                      ? "bg-gray-800 border border-gray-700"
                      : "bg-white border border-gray-200"
                  }`}
                  style={{ animationDelay: "0.8s" }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <TrendingDown className="w-6 h-6 text-yellow-500" />
                    <p className="text-xs text-gray-500">Warning</p>
                  </div>
                  <p
                    className={`text-sm mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Low Stock
                  </p>
                  <p className="text-2xl font-bold">
                    {productStatusCounts.low}
                  </p>
                  <div className="mt-2 bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                    <div
                      className="bg-yellow-500 h-1.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${productIn.length > 0 ? (productStatusCounts.low / productIn.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Product Available */}
                <div
                  onClick={() =>
                    handleCardClick(
                      "/view/out-of-stock",
                      "available",
                      "product",
                    )
                  }
                  className={`p-6 rounded-xl shadow-lg animate__animated animate__fadeInUp cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95 ${
                    darkMode
                      ? "bg-gray-800 border border-gray-700"
                      : "bg-white border border-gray-200"
                  }`}
                  style={{ animationDelay: "0.9s" }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <Box className="w-6 h-6 text-green-500" />
                    <p className="text-xs text-gray-500">Good</p>
                  </div>
                  <p
                    className={`text-sm mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Available
                  </p>
                  <p className="text-2xl font-bold">
                    {productStatusCounts.available}
                  </p>
                  <div className="mt-2 bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                    <div
                      className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${productIn.length > 0 ? (productStatusCounts.available / productIn.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Alert Banner */}
            {totalAlertsCount > 0 && (
              <div
                className={`p-4 rounded-xl mb-6 border-l-4 animate__animated animate__fadeInDown ${darkMode ? "bg-[#7f1d1d]/20 border-[#EF4444]" : "bg-[#FEE2E2] border-[#DC2626]"}`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#EF4444] flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-[#EF4444] mb-1">
                      ⚠️ Inventory Alert
                    </h3>
                    <p
                      className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Components:{" "}
                      {statusCounts.out > 0 &&
                        `${statusCounts.out} out of stock`}
                      {statusCounts.out > 0 &&
                        statusCounts.critical > 0 &&
                        " • "}
                      {statusCounts.critical > 0 &&
                        `${statusCounts.critical} critical`}
                      {(statusCounts.out > 0 || statusCounts.critical > 0) &&
                        (productStatusCounts.out > 0 ||
                          productStatusCounts.critical > 0) &&
                        " | "}
                      Products:{" "}
                      {productStatusCounts.out > 0 &&
                        `${productStatusCounts.out} out of stock`}
                      {productStatusCounts.out > 0 &&
                        productStatusCounts.critical > 0 &&
                        " • "}
                      {productStatusCounts.critical > 0 &&
                        `${productStatusCounts.critical} critical`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Search */}
            <div
              className={`rounded-xl border p-4 mb-6 ${darkMode ? "bg-[#1F2937] border-[#374151]" : "bg-white border-[#E5E7EB]"}`}
            >
              <label
                className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                Search Product Inventory (by code, product, SKU)
              </label>
              <input
                type="text"
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                placeholder="e.g. PRD-00001, SKU-00001, product name"
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${darkMode ? "border-[#374151] focus:ring-[#60A5FA] bg-[#111827] text-white" : "border-[#D1D5DB] focus:ring-[#1E40AF] bg-white text-black"}`}
              />
            </div>

            {/* Attention Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Components Needing Attention */}
              <div
                className={`rounded-xl shadow-lg p-6 border ${darkMode ? "bg-[#1F2937] border-[#374151]" : "bg-white border-[#E5E7EB]"}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    Components Needing Attention
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${darkMode ? "bg-orange-900/30 text-orange-400" : "bg-orange-50 text-orange-700"}`}
                  >
                    {itemsNeedingAttention.length}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full table-fixed">
                    <thead
                      className={`${darkMode ? "bg-[#374151]" : "bg-gray-50"}`}
                    >
                      <tr>
                        {["Item", "Stock Quantity", "Status"].map((head) => (
                          <th
                            key={head}
                            className={`px-4 py-2 text-center text-xs font-medium uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-700"}`}
                          >
                            {head}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody
                      className={`divide-y ${darkMode ? "divide-[#374151]" : "divide-gray-200"}`}
                    >
                      {itemsNeedingAttention.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="px-4 py-8 text-center">
                            <p
                              className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                            >
                              All items well-stocked
                            </p>
                          </td>
                        </tr>
                      ) : (
                        itemsNeedingAttention.slice(0, 5).map((item) => (
                          <tr
                            key={item.id}
                            className={`${darkMode ? "hover:bg-[#374151]" : "hover:bg-gray-50"}`}
                          >
                            <td className="px-4 py-3 text-sm text-center align-middle">
                              {item.name}
                            </td>
                            <td className="px-4 py-3 text-sm text-center align-middle">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 text-sm text-center align-middle">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusColor(item.quantity, darkMode)}`}
                              >
                                {getStatusIcon(item.quantity)}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Products Needing Attention */}
              <div
                className={`rounded-xl shadow-lg p-6 border ${darkMode ? "bg-[#1F2937] border-[#374151]" : "bg-white border-[#E5E7EB]"}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    Products Needing Attention
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${darkMode ? "bg-orange-900/30 text-orange-400" : "bg-orange-50 text-orange-700"}`}
                  >
                    {productsNeedingAttention.length}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full table-fixed">
                    <thead
                      className={`${darkMode ? "bg-[#374151]" : "bg-gray-50"}`}
                    >
                      <tr>
                        {[
                          "Product",
                          "Code",
                          "SKU",
                          "Stock Quantity",
                          "Status",
                        ].map((head) => (
                          <th
                            key={head}
                            className={`px-4 py-2 text-center text-xs font-medium uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-700"}`}
                          >
                            {head}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody
                      className={`divide-y ${darkMode ? "divide-[#374151]" : "divide-gray-200"}`}
                    >
                      {productsNeedingAttention.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-4 py-8 text-center">
                            <p
                              className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                            >
                              All products well-stocked
                            </p>
                          </td>
                        </tr>
                      ) : (
                        productsNeedingAttention.slice(0, 5).map((item) => (
                          <tr
                            key={item.id}
                            className={`${darkMode ? "hover:bg-[#374151]" : "hover:bg-gray-50"}`}
                          >
                            <td className="px-4 py-3 text-sm text-center align-middle">
                              {item.product_name}
                            </td>
                            <td className="px-4 py-3 text-sm text-center align-middle">
                              {buildProductCode(item)}
                            </td>
                            <td className="px-4 py-3 text-sm text-center align-middle">
                              {buildSku(item)}
                            </td>
                            <td className="px-4 py-3 text-sm text-center align-middle">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 text-sm text-center align-middle">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusColor(item.quantity, darkMode)}`}
                              >
                                {getStatusIcon(item.quantity)}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                📋 Recent Activity
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Recent Stock In */}
              <div
                className={`rounded-xl shadow-lg p-6 border ${darkMode ? "bg-[#1F2937] border-[#374151]" : "bg-white border-[#E5E7EB]"}`}
              >
                <h3 className="text-lg font-semibold mb-4">Recent Stock In</h3>
                <div className="overflow-x-auto">
                  <table className="w-full table-fixed">
                    <thead
                      className={`${darkMode ? "bg-[#374151]" : "bg-gray-50"}`}
                    >
                      <tr>
                        {["Item", "Qty", "Date"].map((head) => (
                          <th
                            key={head}
                            className={`px-4 py-2 text-center text-xs font-medium uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-700"}`}
                          >
                            {head}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody
                      className={`divide-y ${darkMode ? "divide-[#374151]" : "divide-gray-200"}`}
                    >
                      {parcelShipped.slice(0, 5).map((item, index) => (
                        <tr
                          key={index}
                          className={`${darkMode ? "hover:bg-[#374151]" : "hover:bg-gray-50"}`}
                        >
                          <td className="px-4 py-3 text-sm text-center align-middle">
                            {item.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-center align-middle">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-sm text-center align-middle">
                            {item.date}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Stock Out */}
              <div
                className={`rounded-xl shadow-lg p-6 border ${darkMode ? "bg-[#1F2937] border-[#374151]" : "bg-white border-[#E5E7EB]"}`}
              >
                <h3 className="text-lg font-semibold mb-4">Recent Stock Out</h3>
                <div className="overflow-x-auto">
                  <table className="w-full table-fixed">
                    <thead
                      className={`${darkMode ? "bg-[#374151]" : "bg-gray-50"}`}
                    >
                      <tr>
                        {["Item", "Qty", "Date"].map((head) => (
                          <th
                            key={head}
                            className={`px-4 py-2 text-center text-xs font-medium uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-700"}`}
                          >
                            {head}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody
                      className={`divide-y ${darkMode ? "divide-[#374151]" : "divide-gray-200"}`}
                    >
                      {parcelDelivery.slice(0, 5).map((item, index) => (
                        <tr
                          key={index}
                          className={`${darkMode ? "hover:bg-[#374151]" : "hover:bg-gray-50"}`}
                        >
                          <td className="px-4 py-3 text-sm text-center align-middle">
                            {item.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-center align-middle">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-sm text-center align-middle">
                            {item.date}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
