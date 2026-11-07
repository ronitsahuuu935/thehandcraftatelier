import { money as formatMoney } from "../lib/format.js";
import { imageUrl, resolveGalleryMedia } from "../data/media.js";

import {
  BarChart3,
  Grid2X2,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Tag,
  Users,
  Scissors,
} from "lucide-react";

import { AVAILABLE_SIZES } from "../data/storefront.js";
const nav = [
  ["dashboard", "Dashboard", LayoutDashboard],
  ["orders", "Orders", ShoppingCart],
  ["products", "Products", Package],
  ["customers", "Customers", Users],
  ["categories", "Categories", Grid2X2],
  ["custom-orders", "Custom Orders", Scissors],
  ["discounts", "Discounts", Tag],
  ["reports", "Reports", BarChart3],
  ["settings", "Settings", Settings],
];
const copy = {
  dashboard: "Welcome back! Here’s what’s happening with your atelier today.",
  orders: "View and manage all customer orders from your store.",
  products: "Manage handmade products and keep your storefront fresh.",
  customers: "View customer details, order history, and more.",
  categories: "Organize your products for a thoughtful shopping experience.",
  "custom-orders": "Manage and track custom embroidery requests.",
  discounts: "Create and manage discounts, promo codes, and offers.",
  reports: "Get insights into store performance and customer behavior.",
  settings: "Manage your store settings, preferences, and configurations.",
};
const CREATE_CATEGORY_VALUE = "__create_new_category__";

const seedCustom = [];
const DISCOUNTS_STORAGE_KEY = "atelier-discounts";
const todayDate = () => new Date().toISOString().slice(0, 10);
const isDiscountExpired = (discount) =>
  discount.until && discount.until !== "No expiry" && discount.until < todayDate();
const discountFromRow = (row) => ({
  ...row,
  code: row.code,
  name: row.name,
  type: row.type,
  value: Number(row.value),
  displayValue: Number(row.value) + (row.type === "Percentage" ? "%" : ""),
  until: row.valid_until || "No expiry",
  from: row.valid_from || "",
  status: "Active",
  applicableTo: row.applicable_to || "All Products",
});
const discountToRow = (discount) => ({
  code: String(discount.code).trim().toUpperCase(),
  name: discount.name,
  type: discount.type,
  value: Number(discount.value),
  applicable_to: discount.applicableTo || "All Products",
  valid_from: discount.from || null,
  valid_until: discount.until && discount.until !== "No expiry" ? discount.until : null,
});
const money = (value) => formatMoney(Number(value || 0));

const catalogFromRow = (row) => ({
  ...row,
  image: imageUrl(row.image_url) || "/media/images/logo.webp",
  gallery:
    Array.isArray(row.gallery) && row.gallery.length
      ? row.gallery.map(resolveGalleryMedia)
      : [{ src: imageUrl(row.image_url) || "/media/images/logo.webp" }],
  sizes: Array.isArray(row.sizes) && row.sizes.length ? row.sizes : AVAILABLE_SIZES,
  stock_quantity: row.stock_quantity ?? null,
});

export {
  nav,
  copy,
  CREATE_CATEGORY_VALUE,
  seedCustom,
  DISCOUNTS_STORAGE_KEY,
  isDiscountExpired,
  discountFromRow,
  discountToRow,
  money,
  catalogFromRow,
};
