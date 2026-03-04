const normalizeName = (value = "") =>
  value.toString().trim().toLowerCase().replace(/\s+/g, " ");

export const buildProductCode = (row = {}, prefix = "PRD") => {
  const identityKey = normalizeName(row.product_name || row.name || "item");
  const numericId = Math.abs(
    Array.from(identityKey)
      .join("")
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0),
  );

  return `${prefix}-${String(numericId).padStart(5, "0")}`;
};

export const buildSku = (row = {}) => {
  if (row.sku) return row.sku;
  return `SKU-${buildProductCode(row).replace("PRD-", "")}`;
};

export const buildDescription = (row = {}) => {
  if (row.description) return row.description;
  const name = row.product_name || row.name || "Item";
  return `${name} inventory item`;
};
