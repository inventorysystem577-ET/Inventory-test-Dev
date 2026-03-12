import {
  upsertProductIn,
  getProductIn,
  getProductInByName,
  deductProductIn,
  insertProductOut,
  getProductOut,
  reserveComponentsFromStock,
  deleteAllProductInItems,
  deleteAllProductOutItems,
  updateProductIn,
  deleteProductIn,
  updateProductOut,
  deleteProductOut,
} from "../models/productModel";

/* =====================================
        PRODUCT IN CONTROLLER
=====================================*/

// ADD / UPDATE PRODUCT IN
export const handleAddProductIn = async (
  product_name,
  quantity,
  date,
  time_in,
  components,
  meta = {},
  options = {},
) => {
  if (!product_name || !quantity) {
    return { success: false, message: "Fill all fields" };
  }

  const formattedComponents = Array.isArray(components)
    ? components
    : JSON.parse(components || "[]");

  const stockResult = await reserveComponentsFromStock({
    components: formattedComponents,
    date,
    time_out: time_in,
    allowAlternatives: Boolean(options.allowAlternatives),
  });

  if (!stockResult.success) {
    return {
      success: false,
      message: stockResult.message,
      missingComponents: stockResult.missingComponents || [],
      alternativeOptions: stockResult.alternativeOptions || [],
      usedAlternatives: stockResult.usedAlternatives || [],
      requiresAlternativeApproval: Boolean(
        stockResult.requiresAlternativeApproval,
      ),
    };
  }

  const result = await upsertProductIn({
    product_name,
    quantity,
    date,
    time_in,
    components: formattedComponents,
    shipping_mode: meta.shipping_mode || null,
    client_name: meta.client_name || null,
    description: meta.description || null,
    price: meta.price,
  });

  if (result?.__error) {
    return { success: false, message: result.__error };
  }

  if (!result) {
    return { success: false, message: "Error adding/updating product" };
  }

  return {
    success: true,
    data: result,
    usedAlternatives: stockResult.usedAlternatives || [],
    deductedComponents: stockResult.stockDeductions || [],
  };
};

// FETCH PRODUCT IN
export const fetchProductInController = async () => {
  const data = await getProductIn();
  return data;
};

export const clearProductInInventory = async () => {
  return await deleteAllProductInItems();
};

/* =====================================
        PRODUCT OUT CONTROLLER
=====================================*/

// ADD PRODUCT OUT (with automatic deduction from Product IN)
export const handleAddProductOut = async (
  product_name,
  quantity,
  date,
  time_out,
  meta = {},
) => {
  if (!product_name || !quantity) {
    alert("Fill all fields");
    return;
  }

  // Step 1: Check and deduct from Product IN
  const deductResult = await deductProductIn(product_name, parseInt(quantity));

  if (!deductResult.success) {
    alert(deductResult.message);
    return;
  }

  // Step 2: Insert to Product OUT with deducted components
  const { data, error } = await insertProductOut({
    product_name,
    quantity: parseInt(quantity),
    date,
    time_out,
    components: deductResult.deductedComponents,
    shipping_mode: meta.shipping_mode || null,
    client_name: meta.client_name || null,
    description: deductResult.description || null,
    price: meta.price,
  });

  if (error) {
    console.error(error);
    alert("Error adding product OUT");
    return;
  }

  alert(
    `Product OUT added! Remaining stock: ${deductResult.remainingQuantity}`,
  );
  return data;
};

// FETCH PRODUCT OUT
export const fetchProductOutController = async () => {
  const data = await getProductOut();
  return data;
};

export const clearProductOutHistory = async () => {
  return await deleteAllProductOutItems();
};

/* =====================================
     INDIVIDUAL CRUD CONTROLLERS
=====================================*/

export const updateProductInController = async (id, updates) => {
  return await updateProductIn(id, updates);
};

export const deleteProductInController = async (id) => {
  return await deleteProductIn(id);
};

export const updateProductOutController = async (id, updates) => {
  return await updateProductOut(id, updates);
};

export const deleteProductOutController = async (id) => {
  return await deleteProductOut(id);
};
