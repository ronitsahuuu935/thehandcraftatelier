import { isVideo, imageUrl as resolveImageUrl } from "./data/media.js";
import {
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
} from "./admin/helpers.js";
import { AVAILABLE_SIZES, SOCIAL } from "./data/storefront.js";
import { isPaidOrder } from "./lib/orders.js";
import { Status, Metric, DemoNote, Empty, Chart } from "./admin/components.jsx";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Boxes,
  Check,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Download,
  Grid2X2,
  Leaf,
  Menu,
  Package,
  Pencil,
  Plus,
  Search,
  Settings,
  ShoppingCart,
  Tag,
  Truck,
  UserRound,
  Users,
  Scissors,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import "./admin.css";
import { productStorageBucket, supabase } from "./lib/supabase";

function AdminPanel({ products = [], onProductsChange, onExit }) {
  const [downloadingLabelId, setDownloadingLabelId] = useState(null);
  const labelDownloadInProgress = useRef(false);
  const [sessionUser, setSessionUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [loginName, setLoginName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      return;
    }
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive) {
        setSessionUser(data.session?.user || null);
        setAuthReady(true);
      }
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (alive) setSessionUser(session?.user || null);
    });
    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    if (!supabase) {
      setLoginError("Admin sign-in is unavailable because Supabase is not configured.");
      return;
    }
    setLoginBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginName.trim(),
        password: loginPassword,
      });
      if (error) setLoginError(error.message);
    } catch (error) {
      setLoginError(
        error instanceof Error
          ? error.message
          : "Could not reach Supabase Auth. Check your connection and project settings.",
      );
    } finally {
      setLoginBusy(false);
    }
  };
  const handleAdminLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    onExit();
  };
  const [page, setPage] = useState("dashboard");
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState(false);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [discounts, setDiscounts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(DISCOUNTS_STORAGE_KEY) || "[]").filter(
        (discount) => !isDiscountExpired(discount),
      );
    } catch {
      return [];
    }
  });
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [discountsReady, setDiscountsReady] = useState(false);
  const [categories, setCategories] = useState([...new Set(products.map((p) => p.category))]);
  const [activeSettings, setActiveSettings] = useState("Store Information");
  const [notice, setNotice] = useState("");
  const [stockByProduct, setStockByProduct] = useState({});
  const [catalogProducts, setCatalogProducts] = useState(products);
  const [catalogError, setCatalogError] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [addingProduct, setAddingProduct] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [customerFormOpen, setCustomerFormOpen] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [customerFormError, setCustomerFormError] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [lastNotificationSeen, setLastNotificationSeen] = useState(() =>
    Number(localStorage.getItem("atelier-admin-notifications-seen") || 0),
  );
  const [rejectingOrder, setRejectingOrder] = useState(null);
  const [rejectionStep, setRejectionStep] = useState(1);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionBusy, setRejectionBusy] = useState(false);
  const [rejectionError, setRejectionError] = useState("");
  const [rejectionConfirmed, setRejectionConfirmed] = useState(false);
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!supabase) {
        setDiscountsReady(true);
        return;
      }
      const { data, error } = await supabase
        .from("discounts")
        .select("*")
        .order("created_at", { ascending: false });
      if (!alive) return;
      if (error) {
        console.error("Could not load shared discounts.", error.message);
        setNotice("Could not load shared discounts. Apply the discounts migration in Supabase.");
        setDiscountsReady(true);
        return;
      }
      setDiscounts((data || []).map(discountFromRow));
      setDiscountsReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    const removeExpiredDiscounts = () =>
      setDiscounts((current) => current.filter((discount) => !isDiscountExpired(discount)));
    removeExpiredDiscounts();
    const timer = window.setInterval(removeExpiredDiscounts, 60000);
    return () => window.clearInterval(timer);
  }, []);
  const saveDiscount = async (discount) => {
    if (supabase) {
      if (editingDiscount && editingDiscount.code !== discount.code) {
        const deleted = await deleteSharedDiscount(editingDiscount.code);
        if (!deleted) {
          setNotice("Could not update the shared discount code.");
          return false;
        }
      }
      const { error } = await supabase
        .from("discounts")
        .upsert(discountToRow(discount), { onConflict: "code" });
      if (error) {
        console.error("Could not save shared discount.", error.message);
        setNotice("Could not save the shared discount. Apply the discounts migration in Supabase.");
        return false;
      }
    }
    return true;
  };
  const deleteSharedDiscount = async (code) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setNotice("Your admin session has expired. Sign in again.");
      return false;
    }
    const response = await fetch(`/api/admin/discounts?code=${encodeURIComponent(code)}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${session.access_token}` },
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("Could not delete shared discount.", result.error || response.statusText);
      return false;
    }
    return true;
  };
  const deleteDiscount = async (discount) => {
    if (supabase && !(await deleteSharedDiscount(discount.code))) {
      setNotice("Could not delete the shared discount.");
      return;
    }
    setDiscounts((current) => current.filter((existing) => existing.code !== discount.code));
    if (editingDiscount?.code === discount.code) setEditingDiscount(null);
    setNotice("Discount deleted.");
  };
  useEffect(() => {
    if (discountsReady) localStorage.setItem(DISCOUNTS_STORAGE_KEY, JSON.stringify(discounts));
  }, [discounts, discountsReady]);
  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
  const [productStatusFilter, setProductStatusFilter] = useState("all");
  const [productSort, setProductSort] = useState("name-asc");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderStatusBusy, setOrderStatusBusy] = useState(false);
  const [adminAvatar, setAdminAvatar] = useState("/media/images/ronit.webp");
  const [adminAvatarOpen, setAdminAvatarOpen] = useState(false);
  const [adminAvatarFile, setAdminAvatarFile] = useState(null);
  const [adminAvatarPreview, setAdminAvatarPreview] = useState("");
  const [adminAvatarBusy, setAdminAvatarBusy] = useState(false);
  const [adminAvatarError, setAdminAvatarError] = useState("");
  useEffect(() => {
    const metadata = sessionUser?.user_metadata || {};
    setAdminAvatar(
      metadata.admin_avatar_removed
        ? ""
        : resolveImageUrl(metadata.admin_avatar_url) || "/media/images/ronit.webp",
    );
  }, [sessionUser]);
  useEffect(() => {
    if (!adminAvatarFile) {
      setAdminAvatarPreview("");
      return;
    }
    const preview = URL.createObjectURL(adminAvatarFile);
    setAdminAvatarPreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [adminAvatarFile]);
  const saveAdminAvatar = async () => {
    if (!supabase || !sessionUser || !adminAvatarFile) return;
    if (!adminAvatarFile.type.startsWith("image/") || adminAvatarFile.size > 8 * 1024 * 1024) {
      setAdminAvatarError("Choose an image smaller than 8 MB.");
      return;
    }
    setAdminAvatarBusy(true);
    setAdminAvatarError("");
    const extension =
      adminAvatarFile.name
        .split(".")
        .pop()
        ?.toLowerCase()
        .replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `admin/${sessionUser.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
    const bucket = supabase.storage.from(productStorageBucket);
    const { error: uploadError } = await bucket.upload(path, adminAvatarFile, {
      contentType: adminAvatarFile.type,
      upsert: false,
    });
    if (uploadError) {
      setAdminAvatarError("Could not upload the image: " + uploadError.message);
      setAdminAvatarBusy(false);
      return;
    }
    const url = bucket.getPublicUrl(path).data.publicUrl;
    const metadata = sessionUser.user_metadata || {};
    const { data, error } = await supabase.auth.updateUser({
      data: {
        ...metadata,
        admin_avatar_url: url,
        admin_avatar_path: path,
        admin_avatar_removed: false,
      },
    });
    if (error) {
      await bucket.remove([path]);
      setAdminAvatarError("Could not save the image: " + error.message);
      setAdminAvatarBusy(false);
      return;
    }
    setSessionUser(
      data.user || {
        ...sessionUser,
        user_metadata: {
          ...metadata,
          admin_avatar_url: url,
          admin_avatar_path: path,
          admin_avatar_removed: false,
        },
      },
    );
    setAdminAvatar(url);
    setAdminAvatarFile(null);
    setAdminAvatarBusy(false);
    setAdminAvatarOpen(false);
    setNotice("Admin profile image saved.");
    if (metadata.admin_avatar_path && metadata.admin_avatar_path !== path)
      await bucket.remove([metadata.admin_avatar_path]);
  };
  const removeAdminAvatar = async () => {
    if (!supabase || !sessionUser) return;
    setAdminAvatarBusy(true);
    setAdminAvatarError("");
    const metadata = sessionUser.user_metadata || {};
    const { data, error } = await supabase.auth.updateUser({
      data: {
        ...metadata,
        admin_avatar_url: null,
        admin_avatar_path: null,
        admin_avatar_removed: true,
      },
    });
    if (error) {
      setAdminAvatarError("Could not remove the image: " + error.message);
      setAdminAvatarBusy(false);
      return;
    }
    setSessionUser(
      data.user || {
        ...sessionUser,
        user_metadata: {
          ...metadata,
          admin_avatar_url: null,
          admin_avatar_path: null,
          admin_avatar_removed: true,
        },
      },
    );
    setAdminAvatar("");
    setAdminAvatarFile(null);
    setAdminAvatarBusy(false);
    setAdminAvatarOpen(false);
    setNotice("Admin profile image removed.");
    if (metadata.admin_avatar_path) {
      const { error: removeError } = await supabase.storage
        .from(productStorageBucket)
        .remove([metadata.admin_avatar_path]);
      if (removeError)
        console.warn(
          "Removed admin avatar reference but could not delete its stored file.",
          removeError.message,
        );
    }
  };
  useEffect(() => {
    if (!notificationsOpen) return;
    const closeOnOutsideClick = (event) => {
      if (!(event.target instanceof Element) || !event.target.closest(".admin-notification-wrap"))
        setNotificationsOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [notificationsOpen]);
  useEffect(() => {
    if (!supabase || !sessionUser) return;
    let active = true;
    const loadCustomers = async () => {
      const [
        { data: customerRows, error: customerError },
        { data: customerOrders, error: orderError },
      ] = await Promise.all([
        supabase
          .from("customers")
          .select("id,full_name,email,phone,city,state,created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("orders")
          .select("id,customer_id,total,created_at,status")
          .neq("status", "cancelled"),
      ]);
      if (!active) return;
      if (customerError || orderError) {
        setCatalogError(
          "Could not load customer records. Details: " +
            (customerError?.message || orderError?.message),
        );
        return;
      }
      const ordersByCustomer = new Map();
      (customerOrders || []).forEach((order) => {
        const current = ordersByCustomer.get(order.customer_id) || {
          count: 0,
          spent: 0,
          last: null,
        };
        current.count += 1;
        current.spent += Number(order.total || 0);
        if (!current.last || new Date(order.created_at) > new Date(current.last))
          current.last = order.created_at;
        ordersByCustomer.set(order.customer_id, current);
      });
      setCustomers(
        (customerRows || []).map((customer) => {
          const summary = ordersByCustomer.get(customer.id) || { count: 0, spent: 0, last: null };
          return {
            id: customer.id,
            name: customer.full_name || "Unnamed customer",
            email: customer.email || "—",
            phone: customer.phone || "—",
            city: [customer.city, customer.state].filter(Boolean).join(", ") || "—",
            orders: summary.count,
            spent: summary.spent,
            last: summary.last ? new Date(summary.last).toLocaleDateString() : "—",
            status: "Active",
          };
        }),
      );
    };
    loadCustomers();
    const timer = window.setInterval(loadCustomers, 30000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [sessionUser, orders]);
  const stockFor = (p) =>
    Object.prototype.hasOwnProperty.call(stockByProduct, p.id)
      ? stockByProduct[p.id]
      : (p.stock_quantity ?? null);
  const inventory = catalogProducts.map((p) => ({ ...p, stock: stockFor(p) }));
  const saveStock = (id, value) =>
    setStockByProduct((current) => ({
      ...current,
      [id]: value === "" ? null : Math.max(0, Number.parseInt(value, 10) || 0),
    }));
  const persistStock = async (id, value) => {
    if (!supabase) return setNotice("Supabase is not configured.");
    const { error } = await supabase
      .from("products")
      .update({ stock_quantity: value })
      .eq("id", id);
    if (error) setNotice("Stock was not saved: " + error.message);
    else {
      setCatalogProducts((current) =>
        current.map((p) => (p.id === id ? { ...p, stock_quantity: value } : p)),
      );
      setNotice("Stock saved to Supabase.");
    }
  };
  const selectedOrderDelivered = [
    selectedOrder?.status,
    orders.find((order) => order.id === selectedOrder?.id)?.status,
  ].some(
    (status) =>
      String(status || "")
        .trim()
        .toLowerCase() === "delivered",
  );
  const updateOrderStatus = async (status) => {
    if (!supabase || !selectedOrder || orderStatusBusy || selectedOrderDelivered) return;
    setOrderStatusBusy(true);
    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", selectedOrder.id)
      .eq("status", selectedOrder.status)
      .select("id,status")
      .maybeSingle();
    setOrderStatusBusy(false);
    if (error || !data) {
      setNotice(
        "Order status could not be updated: " +
          (error?.message || "You may not have admin access."),
      );
      return;
    }
    setOrders((current) =>
      current.map((order) => (order.id === selectedOrder.id ? { ...order, status } : order)),
    );
    setSelectedOrder((current) => (current ? { ...current, status } : current));
    setNotice(status === "shipped" ? "Order marked as dispatched." : "Order marked as delivered.");
  };
  const q = query.trim().toLowerCase();
  const match = (row, keys) =>
    !q ||
    keys.some((k) =>
      String(row[k] || "")
        .toLowerCase()
        .includes(q),
    );
  const shownProducts = useMemo(() => {
    const filtered = catalogProducts
      .filter((product) => {
        const stock = stockFor(product);
        const categoryMatches =
          productCategoryFilter === "all" || product.category === productCategoryFilter;
        const statusMatches =
          productStatusFilter === "all" ||
          (productStatusFilter === "not-tracked"
            ? stock === null
            : productStatusFilter === "out-of-stock"
              ? stock === 0
              : productStatusFilter === "low-stock"
                ? stock !== null && stock > 0 && stock <= 5
                : stock !== null && stock > 5);
        return categoryMatches && statusMatches && match(product, ["name", "category", "tag"]);
      })
      .map((product) => ({ ...product, stock: stockFor(product) }));
    return filtered.sort((a, b) =>
      productSort === "price-asc"
        ? Number(a.price) - Number(b.price)
        : productSort === "price-desc"
          ? Number(b.price) - Number(a.price)
          : productSort === "stock-asc"
            ? (a.stock ?? -1) - (b.stock ?? -1)
            : productSort === "stock-desc"
              ? (b.stock ?? -1) - (a.stock ?? -1)
              : String(a.name).localeCompare(String(b.name)),
    );
  }, [catalogProducts, q, stockByProduct, productCategoryFilter, productStatusFilter, productSort]);
  useEffect(() => {
    if (!supabase || !sessionUser) return;
    let active = true;
    const loadCatalog = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,name,price,category,image_url,gallery,sizes,tag,description,stock_quantity")
        .eq("is_active", true)
        .order("id");
      if (!active) return;
      if (error) {
        setCatalogError(
          "Could not load the products table. Run supabase/migrations/20261029_products_admin.sql, then refresh. Details: " +
            error.message,
        );
        return;
      }
      const rows = (data || []).map(catalogFromRow);
      setCatalogProducts(rows);
      setCategories([...new Set(rows.map((row) => row.category).filter(Boolean))]);
      setStockByProduct(
        Object.fromEntries(
          rows
            .filter((row) => row.stock_quantity !== null)
            .map((row) => [row.id, row.stock_quantity]),
        ),
      );
      setCatalogError("");
    };
    loadCatalog();
    return () => {
      active = false;
    };
  }, [sessionUser]);
  const saveProduct = async (event) => {
    event.preventDefault();
    if (!supabase || !editingProduct) return;
    setSavingProduct(true);
    setCatalogError("");
    const form = new FormData(event.currentTarget);
    const chosenCategory = String(form.get("category") || "");
    const category =
      chosenCategory === CREATE_CATEGORY_VALUE ? newCategoryName.trim() : chosenCategory.trim();
    if (!category) {
      setCatalogError("Enter a name for the new category.");
      setSavingProduct(false);
      return;
    }
    const newImages = Array.from(form.getAll("galleryImages")).filter(
      (file) => file instanceof File && file.size,
    );
    if (newImages.some((file) => !file.type.startsWith("image/") || file.size > 8 * 1024 * 1024)) {
      setCatalogError("Choose images smaller than 8 MB.");
      setSavingProduct(false);
      return;
    }
    const gallery = Array.isArray(editingProduct.gallery)
      ? editingProduct.gallery
          .filter((image) => image?.src)
          .map((image) => ({
            ...image,
            color:
              String(
                form.get(`image_color_${editingProduct.gallery.indexOf(image)}`) || "",
              ).trim() || null,
          }))
      : [];
    const uploadedPaths = [];
    for (const file of newImages) {
      const extension =
        file.name
          .split(".")
          .pop()
          ?.toLowerCase()
          .replace(/[^a-z0-9]/g, "") || "jpg";
      const imagePath = `catalog/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from(productStorageBucket)
        .upload(imagePath, file, { contentType: file.type, upsert: false });
      if (uploadError) {
        if (uploadedPaths.length)
          await supabase.storage.from(productStorageBucket).remove(uploadedPaths);
        setCatalogError("Could not upload product images. Details: " + uploadError.message);
        setSavingProduct(false);
        return;
      }
      uploadedPaths.push(imagePath);
      gallery.push({
        src: supabase.storage.from(productStorageBucket).getPublicUrl(imagePath).data.publicUrl,
        color: String(form.get("galleryImageColor") || "").trim() || null,
      });
    }
    const sizes = AVAILABLE_SIZES.filter((size) => form.getAll("sizes").includes(size));
    if (!sizes.length) {
      setCatalogError("Select at least one available size.");
      setSavingProduct(false);
      return;
    }
    const values = {
      name: String(form.get("name")).trim(),
      price: Number(form.get("price")),
      category,
      image_url: gallery[0]?.src || null,
      gallery,
      sizes,
      tag: String(form.get("tag")).trim() || null,
      description: String(form.get("description")).trim() || null,
    };
    const { error } = await supabase.from("products").update(values).eq("id", editingProduct.id);
    setSavingProduct(false);
    if (error) {
      setCatalogError(
        "Could not save product. Check the products table migration and admin access. Details: " +
          error.message,
      );
      return;
    }
    const { data: savedRow, error: reloadError } = await supabase
      .from("products")
      .select("id,name,price,category,image_url,gallery,sizes,tag,description,stock_quantity")
      .eq("id", editingProduct.id)
      .maybeSingle();
    if (reloadError || !savedRow) {
      setCatalogError(
        "Product update was not accepted. Confirm this Supabase user is listed in public.admin_users.",
      );
      return;
    }
    const saved = catalogFromRow(savedRow);
    const updated = catalogProducts.map((item) => (item.id === saved.id ? saved : item));
    setCatalogProducts(updated);
    setCategories([...new Set(updated.map((row) => row.category).filter(Boolean))]);
    onProductsChange?.(updated);
    setEditingProduct(null);
    setNotice("Product updated in Supabase.");
  };
  const saveNewProduct = async (event) => {
    event.preventDefault();
    if (!supabase) return setCatalogError("Supabase is not configured.");
    setSavingProduct(true);
    setCatalogError("");
    const form = new FormData(event.currentTarget);
    const chosenCategory = String(form.get("category") || "");
    const category =
      chosenCategory === CREATE_CATEGORY_VALUE ? newCategoryName.trim() : chosenCategory.trim();
    const file = form.get("image");
    if (!category) {
      setCatalogError("Choose a category or enter a new category name.");
      setSavingProduct(false);
      return;
    }
    const sizes = AVAILABLE_SIZES.filter((size) => form.getAll("sizes").includes(size));
    if (!sizes.length) {
      setCatalogError("Select at least one available size.");
      setSavingProduct(false);
      return;
    }
    if (!(file instanceof File) || !file.size) {
      setCatalogError("Choose a product image to upload.");
      setSavingProduct(false);
      return;
    }
    if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) {
      setCatalogError("Choose an image smaller than 8 MB.");
      setSavingProduct(false);
      return;
    }
    const extension =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase()
        .replace(/[^a-z0-9]/g, "") || "jpg";
    const imagePath = `catalog/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from(productStorageBucket)
      .upload(imagePath, file, { contentType: file.type, upsert: false });
    if (uploadError) {
      setCatalogError(
        "Could not upload the product image. Check the admin Storage policy and bucket. Details: " +
          uploadError.message,
      );
      setSavingProduct(false);
      return;
    }
    const imageUrl = supabase.storage.from(productStorageBucket).getPublicUrl(imagePath)
      .data.publicUrl;
    const nextId = Math.max(0, ...catalogProducts.map((product) => Number(product.id) || 0)) + 1;
    const values = {
      id: nextId,
      name: String(form.get("name") || "").trim(),
      price: Number(form.get("price")),
      category,
      image_url: imageUrl,
      gallery: [{ src: imageUrl, color: String(form.get("image_color") || "").trim() || null }],
      sizes,
      tag: String(form.get("tag") || "").trim() || null,
      description: String(form.get("description") || "").trim() || null,
      stock_quantity: form.get("stock") === "" ? null : Number(form.get("stock")),
    };
    const { data, error } = await supabase
      .from("products")
      .insert(values)
      .select("id,name,price,category,image_url,gallery,sizes,tag,description,stock_quantity")
      .single();
    setSavingProduct(false);
    if (error) {
      await supabase.storage.from(productStorageBucket).remove([imagePath]);
      setCatalogError(
        "Could not add the product. Check the products migration and admin access. Details: " +
          error.message,
      );
      return;
    }
    const updated = [...catalogProducts, catalogFromRow(data)];
    setCatalogProducts(updated);
    setCategories([...new Set(updated.map((row) => row.category).filter(Boolean))]);
    onProductsChange?.(updated);
    setAddingProduct(false);
    setCreatingCategory(false);
    setNewCategoryName("");
    setNotice("Product added to your Supabase catalog.");
  };
  useEffect(() => {
    if (!supabase || !sessionUser) return;
    let active = true;
    const loadOrders = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id,recipient_name,recipient_email,recipient_phone,shipping_address_line1,shipping_city,shipping_postal_code,items,total,payment_method,payment_status,cashfree_order_id,cashfree_refund_id,refund_status,rejection_reason,status,created_at",
        )
        .neq("status", "Rejected")
        .order("created_at", { ascending: false })
        .limit(30);
      if (!active) return;
      if (error) {
        setCatalogError(
          "Could not load sales notifications. Apply the latest Supabase migration, then refresh. Details: " +
            error.message,
        );
        return;
      }
      setOrders(
        (data || [])
          .filter(
            (order) =>
              !["cancelled", "canceled", "rejected"].includes(
                String(order.status || "").toLowerCase(),
              ),
          )
          .map((order) => ({
            ...order,
            name: order.recipient_name,
            email: order.recipient_email,
            phone: order.recipient_phone,
            address: order.shipping_address_line1,
            city: order.shipping_city,
            postal_code: order.shipping_postal_code,
            date: new Date(order.created_at).toLocaleDateString(),
            method: order.payment_method,
            total: Number(order.total),
            items: Array.isArray(order.items) ? order.items : [],
          })),
      );
    };
    loadOrders();
    const timer = window.setInterval(loadOrders, 30000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [sessionUser]);
  const openRejectOrder = (order) => {
    setRejectingOrder(order);
    setRejectionStep(1);
    setRejectionReason("");
    setRejectionError("");
    setRejectionConfirmed(false);
  };
  const saveCustomer = async (event) => {
    event.preventDefault();
    if (!supabase) return;
    setSavingCustomer(true);
    setCustomerFormError("");
    const form = new FormData(event.currentTarget);
    const values = {
      full_name: String(form.get("full_name") || "").trim(),
      email: String(form.get("email") || "").trim(),
      phone: String(form.get("phone") || "").trim() || null,
      address_line1: String(form.get("address_line1") || "").trim() || null,
      address_line2: String(form.get("address_line2") || "").trim() || null,
      city: String(form.get("city") || "").trim() || null,
      state: String(form.get("state") || "").trim() || null,
      postal_code: String(form.get("postal_code") || "").trim() || null,
    };
    if (!values.full_name || !values.email) {
      setCustomerFormError("Name and email are required.");
      setSavingCustomer(false);
      return;
    }
    const { data, error } = await supabase
      .from("customers")
      .insert(values)
      .select("id,full_name,email,phone,city,state,created_at")
      .single();
    if (error) {
      setCustomerFormError(
        error.code === "23505"
          ? "A customer with this email already exists."
          : "Could not create customer: " + error.message,
      );
      setSavingCustomer(false);
      return;
    }
    setCustomers((current) => [
      {
        id: data.id,
        name: data.full_name || "Unnamed customer",
        email: data.email || "—",
        phone: data.phone || "—",
        city: [data.city, data.state].filter(Boolean).join(", ") || "—",
        orders: 0,
        spent: 0,
        last: "—",
        status: "Active",
      },
      ...current,
    ]);
    setCustomerFormOpen(false);
    setNotice("Customer added successfully.");
    setSavingCustomer(false);
  };
  const closeRejectOrder = () => {
    if (!rejectionBusy) {
      setRejectingOrder(null);
      setRejectionError("");
      setRejectionConfirmed(false);
    }
  };
  const processOrderRejection = async (event) => {
    event.preventDefault();
    if (rejectionStep === 1) {
      if (!rejectionReason.trim()) {
        setRejectionError("Enter a reason before continuing.");
        return;
      }
      setRejectionStep(2);
      setRejectionError("");
      return;
    }
    if (!supabase || !rejectingOrder) return;
    if (!rejectionConfirmed) {
      setRejectionError("Confirm the rejection and refund instructions to continue.");
      return;
    }
    setRejectionBusy(true);
    setRejectionError("");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Admin session expired. Sign in again.");
      const response = await fetch("/api/admin/orders/reject", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ orderId: rejectingOrder.id, reason: rejectionReason.trim() }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Could not reject this order.");
      setOrders((current) => current.filter((order) => order.id !== rejectingOrder.id));
      setRejectingOrder(null);
      setNotice(
        result.refundStatus === "manual_required"
          ? "Order rejected. A manual refund is required for this paid COD order."
          : result.refundStatus && result.refundStatus !== "not_required"
            ? `Order rejected. Refund status: ${result.refundStatus}.`
            : "Order rejected. No refund was needed because no online payment was captured.",
      );
    } catch (error) {
      setRejectionError(
        error instanceof Error ? error.message : "Could not reject this order. Please try again.",
      );
    } finally {
      setRejectionBusy(false);
    }
  };
  if (!authReady)
    return (
      <div className="admin-login-screen">
        <div className="admin-login-card">
          <span className="admin-login-mark">
            <Leaf size={25} />
          </span>
          <p>THE HANDCRAFT ATELIER</p>
          <h1>Opening your atelier…</h1>
        </div>
      </div>
    );
  if (!sessionUser)
    return (
      <main className="admin-login-screen">
        <form className="admin-login-card" onSubmit={handleAdminLogin}>
          <span className="admin-login-mark">
            <Leaf size={25} />
          </span>
          <p className="admin-login-eyebrow">THE HANDCRAFT ATELIER</p>
          <h1>Welcome back</h1>
          <p className="admin-login-subtitle">Sign in to access your atelier dashboard.</p>
          <label>
            Username
            <input
              value={loginName}
              onChange={(e) => setLoginName(e.target.value)}
              autoComplete="username"
              required
              placeholder="Your admin email"
              type="email"
            />
          </label>
          <label>
            Password
            <span className="admin-password-field">
              <input
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                autoComplete="current-password"
                required
                placeholder="Enter your password"
                type={showPassword ? "text" : "password"}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>
          {loginError && (
            <p className="admin-login-error" role="alert">
              {loginError}
            </p>
          )}
          <button className="admin-primary-button" disabled={loginBusy}>
            {loginBusy ? "Signing in…" : "Sign in"}
          </button>
          <small>Use the administrator account created in Supabase Auth.</small>
        </form>
      </main>
    );
  const shownOrders = orders.filter(
    (r) =>
      !["cancelled", "canceled", "rejected"].includes(String(r.status || "").toLowerCase()) &&
      match(r, ["id", "name", "email", "status", "method"]),
  );
  const setPageTo = (id) => {
    setPage(id);
    setQuery("");
    setMenu(false);
    setNotice("");
  };
  const heading = (action, onAction) => (
    <div className="admin-page-heading">
      <div>
        <h1>
          {page[0].toUpperCase() + page.slice(1).replaceAll("-", " ")} <Leaf size={21} />
        </h1>
        <p>{copy[page]}</p>
      </div>
      {action && (
        <button className="admin-primary-button" onClick={onAction}>
          <Plus size={16} />
          {action}
        </button>
      )}
    </div>
  );
  const metrics = (children) => <div className="admin-metrics">{children}</div>;
  const toolbar = (
    <div className="admin-toolbar">
      <select>
        <option>All Statuses</option>
        <option>Pending</option>
        <option>Processing</option>
        <option>Shipped</option>
        <option>Delivered</option>
      </select>
      <select>
        <option>All Payment Methods</option>
        <option>UPI</option>
        <option>Cashfree</option>
      </select>
      <button
        className="admin-outline-button"
        onClick={() => setNotice("There is no order data to export yet.")}
      >
        <Download size={15} /> Export
      </button>
    </div>
  );
  const downloadOrderLabel = async (order) => {
    if (labelDownloadInProgress.current || !isPaidOrder(order)) return;
    labelDownloadInProgress.current = true;
    setDownloadingLabelId(order.id);
    try {
      if (!supabase) throw new Error("Sign in to download an order label.");
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Your session has expired. Please sign in again.");
      // Read the saved shipping details and payment status again under the admin session.
      const { data: latestOrder, error } = await supabase
        .from("orders")
        .select(
          "id,recipient_name,recipient_phone,shipping_address_line1,shipping_address_line2,shipping_city,shipping_state,shipping_postal_code,shipping_country,total,payment_status",
        )
        .eq("id", order.id)
        .maybeSingle();
      if (error) throw new Error("Could not load this order's delivery details. Please try again.");
      if (!latestOrder) throw new Error("This order is unavailable or you no longer have access.");
      if (!isPaidOrder(latestOrder)) {
        setOrders((current) =>
          current.map((item) =>
            item.id === order.id ? { ...item, payment_status: latestOrder.payment_status } : item,
          ),
        );
        throw new Error("Labels are available only for paid orders.");
      }
      const { downloadShippingLabel } = await import("./admin/shipping-label.js");
      await downloadShippingLabel(latestOrder, {
        name: "The Hand Craft Atelier",
        address: "Malviya Nagar, Creware Coworks, near Saras Parlour",
        postalCode: "302017",
        phone: SOCIAL.phoneLabel,
      });
      setNotice("Shipping label download started.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not download the shipping label.");
    } finally {
      labelDownloadInProgress.current = false;
      setDownloadingLabelId(null);
    }
  };
  const orderRows = (
    <>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Refund</th>
              <th>Items</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {shownOrders.map((o) => (
              <tr key={o.id}>
                <td>#{String(o.id).slice(0, 8)}</td>
                <td>
                  <b>{o.name}</b>
                  <small>{o.email}</small>
                  <small>{o.phone}</small>
                </td>
                <td>{o.date}</td>
                <td>{money(o.total)}</td>
                <td>
                  <CreditCard size={14} /> {o.method}
                  <small>{o.payment_status || "pending"}</small>
                </td>
                <td>
                  <Status>{o.status}</Status>
                </td>
                <td>
                  <Status>{String(o.refund_status || "not_required").replaceAll("_", " ")}</Status>
                </td>
                <td>
                  {o.items?.map((item) => `${item.name} × ${item.quantity}`).join(", ") || "—"}
                </td>
                <td>
                  <div className="admin-order-actions">
                    <button className="admin-row-button" onClick={() => setSelectedOrder(o)}>
                      View
                    </button>
                    {isPaidOrder(o) && (
                      <button
                        className="admin-row-button admin-label-button"
                        type="button"
                        onClick={() => downloadOrderLabel(o)}
                        disabled={downloadingLabelId !== null}
                        aria-label={`Download PDF label for order ${String(o.id).slice(0, 8)}`}
                      >
                        <Download size={13} aria-hidden="true" />
                        {downloadingLabelId === o.id ? "Preparing…" : "Label"}
                      </button>
                    )}
                    {!["rejected", "shipped", "delivered", "fulfilled"].includes(
                      String(o.status || "").toLowerCase(),
                    ) && (
                      <button className="admin-reject-button" onClick={() => openRejectOrder(o)}>
                        Reject
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!shownOrders.length && (
        <Empty title="No orders yet">
          Orders will appear here after a customer completes checkout.
        </Empty>
      )}
    </>
  );
  const paidSales = orders.filter(isPaidOrder);
  const unreadSales = paidSales.filter(
    (order) => new Date(order.created_at || 0).getTime() > lastNotificationSeen,
  );
  const rejectingPaymentStatus = String(rejectingOrder?.payment_status || "pending").toLowerCase();
  const rejectingPaid = ["paid", "success", "successful", "captured"].includes(
    rejectingPaymentStatus,
  );
  const rejectingCod = /cash\s*on\s*delivery|\bcod\b/i.test(
    String(rejectingOrder?.payment_method || ""),
  );
  const rejectingUnpaid = ["", "pending", "unpaid", "failed", "declined", "not_required"].includes(
    rejectingPaymentStatus,
  );
  const rejectionCanProceed =
    Boolean(rejectingOrder) &&
    (rejectingPaid ? rejectingCod || Boolean(rejectingOrder.cashfree_order_id) : rejectingUnpaid);
  return (
    <div className="admin-app">
      <aside className={"admin-sidebar" + (menu ? " is-open" : "")}>
        <div className="admin-brand">
          <img src="/media/images/logo.webp" alt="" />
          <span>
            The Handcraft
            <br />
            Atelier
          </span>
        </div>
        <nav aria-label="Admin navigation">
          {nav.map(([id, label, Icon]) => (
            <button key={id} className={page === id ? "active" : ""} onClick={() => setPageTo(id)}>
              <Icon size={20} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-note">
          <p>Handcrafted with care</p>
        </div>
      </aside>
      {menu && (
        <button
          className="admin-sidebar-scrim"
          onClick={() => setMenu(false)}
          aria-label="Close menu"
        />
      )}
      <div className="admin-workspace">
        <header className="admin-topbar">
          <button className="admin-mobile-menu" onClick={() => setMenu(true)}>
            <Menu size={19} />
          </button>
          <label className="admin-global-search">
            <Search size={17} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={"Search " + page.replaceAll("-", " ") + ", products, customers..."}
            />
          </label>
          <div className="admin-top-actions">
            <div className="admin-notification-wrap">
              <button
                className="admin-notifications"
                aria-label="Sales notifications"
                aria-expanded={notificationsOpen}
                onClick={() => {
                  const opening = !notificationsOpen;
                  setNotificationsOpen(opening);
                  if (opening) {
                    const seen = Date.now();
                    localStorage.setItem("atelier-admin-notifications-seen", String(seen));
                    setLastNotificationSeen(seen);
                  }
                }}
              >
                <Bell size={18} />
                {unreadSales.length > 0 && <i />}
              </button>
              {notificationsOpen && (
                <section className="admin-notification-popover" aria-label="Recent sales">
                  <h3>Recent sales</h3>
                  {paidSales.length ? (
                    paidSales.slice(0, 8).map((order) => (
                      <button
                        key={order.id}
                        onClick={() => {
                          setPageTo("orders");
                          setNotificationsOpen(false);
                        }}
                      >
                        <b>
                          {order.customer_name || order.name} · {money(order.total)}
                        </b>
                        <span>
                          {(order.items || [])
                            .map((item) => `${item.name} × ${item.quantity}`)
                            .join(", ") || "Order placed"}
                        </span>
                        <small>
                          {new Date(order.created_at).toLocaleString()} · {order.status}
                        </small>
                      </button>
                    ))
                  ) : (
                    <p>No paid sales yet. Purchases will appear here once payment is confirmed.</p>
                  )}
                </section>
              )}
            </div>
            <button
              type="button"
              className="admin-avatar-trigger"
              aria-label="Edit admin profile image"
              title="Edit admin profile image"
              onClick={() => {
                setAdminAvatarFile(null);
                setAdminAvatarError("");
                setAdminAvatarOpen(true);
              }}
            >
              {adminAvatar ? (
                <img className="admin-avatar" src={adminAvatar} alt="Admin profile" />
              ) : (
                <span className="admin-avatar admin-avatar-fallback">A</span>
              )}
            </button>
            <span className="admin-user-name">Admin</span>
            <button className="admin-store-link" onClick={handleAdminLogout}>
              <ArrowLeft size={14} /> Sign out
            </button>
          </div>
        </header>
        {adminAvatarOpen && (
          <div
            className="admin-avatar-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !adminAvatarBusy)
                setAdminAvatarOpen(false);
            }}
          >
            <section
              className="admin-avatar-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="admin-avatar-title"
            >
              <button
                type="button"
                className="admin-avatar-close"
                aria-label="Close"
                onClick={() => !adminAvatarBusy && setAdminAvatarOpen(false)}
              >
                <X size={18} />
              </button>
              <span className="admin-avatar-eyebrow">ADMIN ACCOUNT</span>
              <h2 id="admin-avatar-title">Profile image</h2>
              <p>Choose a clear image for the admin header. It will be saved to your account.</p>
              <div className="admin-avatar-preview">
                {adminAvatarPreview || adminAvatar ? (
                  <img src={adminAvatarPreview || adminAvatar} alt="Admin profile preview" />
                ) : (
                  <span>A</span>
                )}
              </div>
              <label className="admin-avatar-file">
                Choose image
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    setAdminAvatarFile(event.target.files?.[0] || null);
                    setAdminAvatarError("");
                  }}
                />
                <small>
                  {adminAvatarFile ? adminAvatarFile.name : "PNG, JPG, or WebP · up to 8 MB"}
                </small>
              </label>
              {adminAvatarError && (
                <p className="admin-avatar-error" role="alert">
                  {adminAvatarError}
                </p>
              )}
              <div className="admin-avatar-actions">
                <button
                  type="button"
                  className="admin-avatar-remove"
                  disabled={adminAvatarBusy}
                  onClick={removeAdminAvatar}
                >
                  Remove image
                </button>
                <button
                  type="button"
                  className="admin-avatar-save"
                  disabled={adminAvatarBusy || !adminAvatarFile}
                  onClick={saveAdminAvatar}
                >
                  {adminAvatarBusy ? "Saving…" : "Save image"}
                </button>
              </div>
            </section>
          </div>
        )}
        <main className="admin-content">
          <DemoNote />
          {page === "dashboard" && (
            <>
              <div className="admin-page-heading">
                <div>
                  <h1>Dashboard</h1>
                  <p>{copy.dashboard}</p>
                </div>
              </div>
              {metrics(
                <>
                  <Metric icon={ShoppingCart} label="Total Orders" value={orders.length} />
                  <Metric icon={CircleDollarSign} label="Total Sales" value="—" />
                  <Metric icon={Package} label="Catalog Products" value={catalogProducts.length} />
                  <Metric icon={Users} label="Total Customers" value={customers.length} />
                </>,
              )}
              <div className="admin-dashboard-grid">
                <section className="admin-panel-card admin-sales-panel">
                  <div className="admin-card-heading">
                    <div>
                      <h2>Sales Overview</h2>
                      <p>Sales data will appear after orders are recorded.</p>
                    </div>
                  </div>
                  <Chart />
                </section>
                <section className="admin-panel-card admin-best-panel">
                  <div className="admin-card-heading">
                    <h2>Catalog</h2>
                    <button onClick={() => setPageTo("products")}>
                      View All <ArrowUpRight size={14} />
                    </button>
                  </div>
                  {catalogProducts.length ? (
                    catalogProducts.slice(0, 4).map((p) => (
                      <div className="admin-mini-product" key={p.id}>
                        <img src={p.image} alt="" />
                        <span>
                          <strong>{p.name}</strong>
                          <small>{p.category}</small>
                        </span>
                      </div>
                    ))
                  ) : (
                    <Empty title="No products yet">Add catalog items to see them here.</Empty>
                  )}
                </section>
                <section className="admin-panel-card admin-lowstock-panel">
                  <div className="admin-card-heading">
                    <h2>Stock at a glance</h2>
                    <button onClick={() => setPageTo("products")}>Manage in Products</button>
                  </div>
                  {inventory.some((p) => p.stock !== null) ? (
                    <>
                      <p className="admin-stock-summary">
                        {inventory.filter((p) => p.stock !== null).length} products have stock
                        quantities set ·{" "}
                        {inventory.filter((p) => p.stock !== null && p.stock <= 5).length} at 5 or
                        fewer
                      </p>
                      {inventory
                        .filter((p) => p.stock !== null && p.stock <= 5)
                        .slice(0, 3)
                        .map((p) => (
                          <div className="admin-alert-row" key={p.id}>
                            <img src={p.image} alt="" />
                            <span>
                              <strong>{p.name}</strong>
                              <small>{p.stock} in stock</small>
                            </span>
                          </div>
                        ))}
                    </>
                  ) : (
                    <Empty title="Stock not set">Set stock quantities directly in Products.</Empty>
                  )}
                </section>
                <section className="admin-panel-card admin-recent-panel">
                  <div className="admin-card-heading">
                    <h2>Recent Orders</h2>
                    <button onClick={() => setPageTo("orders")}>View All</button>
                  </div>
                  {orderRows}
                </section>
              </div>
            </>
          )}
          {page === "orders" && (
            <>
              {heading(null)}
              {metrics(
                <>
                  <Metric icon={ShoppingCart} label="Total Orders" value={orders.length} />
                  <Metric
                    icon={Clock3}
                    label="Pending"
                    value={
                      orders.filter(
                        (order) => String(order.status || "").toLowerCase() === "pending",
                      ).length
                    }
                  />
                  <Metric
                    icon={Truck}
                    label="Shipped"
                    value={
                      orders.filter(
                        (order) => String(order.status || "").toLowerCase() === "shipped",
                      ).length
                    }
                  />
                  <Metric
                    icon={Check}
                    label="Delivered"
                    value={
                      orders.filter(
                        (order) => String(order.status || "").toLowerCase() === "delivered",
                      ).length
                    }
                  />
                </>,
              )}
              <section className="admin-panel-card admin-table-card">
                {toolbar}
                {orderRows}
              </section>
            </>
          )}
          {page === "products" && (
            <>
              {heading("Add New Product", () => {
                setCatalogError("");
                setCreatingCategory(false);
                setNewCategoryName("");
                setAddingProduct(true);
              })}
              {metrics(
                <>
                  <Metric icon={Package} label="Catalog Products" value={catalogProducts.length} />
                  <Metric icon={Tag} label="Categories" value={categories.length} />
                  <Metric
                    icon={Boxes}
                    label="Products with Stock Set"
                    value={inventory.filter((p) => p.stock !== null).length}
                  />
                  <Metric
                    icon={Leaf}
                    label="Low Stock (5 or fewer)"
                    value={inventory.filter((p) => p.stock !== null && p.stock <= 5).length}
                  />
                </>,
              )}
              <section className="admin-panel-card admin-table-card">
                <p className="admin-stock-summary">
                  Stock quantities save to Supabase when you leave the field.
                </p>
                <div className="admin-toolbar">
                  <select
                    aria-label="Filter by category"
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Filter by stock status"
                    value={productStatusFilter}
                    onChange={(e) => setProductStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="in-stock">In stock</option>
                    <option value="low-stock">Low stock (5 or fewer)</option>
                    <option value="out-of-stock">Out of stock</option>
                    <option value="not-tracked">Not tracked</option>
                  </select>
                  <select
                    aria-label="Sort products"
                    value={productSort}
                    onChange={(e) => setProductSort(e.target.value)}
                  >
                    <option value="name-asc">Sort: Name</option>
                    <option value="price-asc">Price: low to high</option>
                    <option value="price-desc">Price: high to low</option>
                    <option value="stock-asc">Stock: low to high</option>
                    <option value="stock-desc">Stock: high to low</option>
                  </select>
                </div>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Product ID</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock Qty</th>
                        <th>Availability</th>
                        <th>Featured</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shownProducts.map((p) => (
                        <tr key={p.id}>
                          <td>
                            <div className="admin-product-cell">
                              <img src={p.image} alt="" />
                              <span>
                                <b>{p.name}</b>
                                <small>Hand-embroidered piece</small>
                              </span>
                            </div>
                          </td>
                          <td>{p.id}</td>
                          <td>{p.category}</td>
                          <td>{money(p.price)}</td>
                          <td>
                            <input
                              className="admin-stock-input"
                              type="number"
                              min="0"
                              step="1"
                              value={p.stock ?? ""}
                              placeholder="Set qty"
                              aria-label={"Stock quantity for " + p.name}
                              onChange={(e) => saveStock(p.id, e.target.value)}
                              onBlur={() => persistStock(p.id, p.stock)}
                            />
                          </td>
                          <td>
                            <Status>
                              {p.stock === null
                                ? "Not tracked"
                                : p.stock === 0
                                  ? "Out of stock"
                                  : p.stock <= 5
                                    ? "Low stock"
                                    : "In stock"}
                            </Status>
                          </td>
                          <td>Not set</td>
                          <td>
                            <button
                              className="admin-row-button"
                              onClick={() => {
                                setCatalogError("");
                                setCreatingCategory(false);
                                setNewCategoryName("");
                                setEditingProduct(p);
                              }}
                            >
                              <Pencil size={13} /> Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!shownProducts.length && (
                  <Empty title="No catalog products">
                    Add products to your storefront to see them here.
                  </Empty>
                )}
              </section>
            </>
          )}
          {page === "customers" && (
            <>
              {heading("Add Customer", () => {
                setCustomerFormError("");
                setCustomerFormOpen(true);
              })}
              {metrics(
                <>
                  <Metric icon={Users} label="Customers" value={customers.length} />
                  <Metric
                    icon={UserRound}
                    label="New Customers"
                    value={customers.filter((c) => c.orders === 1).length}
                  />
                  <Metric
                    icon={Users}
                    label="Active Customers"
                    value={customers.filter((c) => c.status === "Active").length}
                  />
                  <Metric
                    icon={CircleDollarSign}
                    label="Avg. Order Value"
                    value={
                      customers.length
                        ? money(customers.reduce((sum, c) => sum + c.spent, 0) / customers.length)
                        : "—"
                    }
                  />
                </>,
              )}
              <section className="admin-panel-card admin-table-card">
                {toolbar}
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Location</th>
                        <th>Orders</th>
                        <th>Total Spent</th>
                        <th>Last Order</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers
                        .filter((c) => match(c, ["name", "email", "phone", "city"]))
                        .map((c) => (
                          <tr key={c.id}>
                            <td>{c.name}</td>
                            <td>{c.email}</td>
                            <td>{c.phone}</td>
                            <td>{c.city}</td>
                            <td>{c.orders}</td>
                            <td>{money(c.spent)}</td>
                            <td>{c.last}</td>
                            <td>
                              <Status>{c.status}</Status>
                            </td>
                            <td>
                              <button className="admin-row-button">View</button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                {!customers.length && (
                  <Empty title="No customers yet">
                    Customer details will appear after customers are recorded.
                  </Empty>
                )}
              </section>
            </>
          )}
          {page === "categories" && (
            <>
              {heading("Add Category", () =>
                setNotice("Category creation will be enabled with catalog management."),
              )}
              {metrics(
                <>
                  <Metric icon={Grid2X2} label="Catalog Categories" value={categories.length} />
                  <Metric icon={Package} label="Catalog Products" value={catalogProducts.length} />
                  <Metric icon={Check} label="Category Status" value="In catalog" />
                  <Metric icon={CircleDollarSign} label="Category Sales" value="—" />
                </>,
              )}
              <section className="admin-panel-card admin-table-card">
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Products</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((c) => (
                        <tr key={c}>
                          <td>
                            <b>{c}</b>
                          </td>
                          <td>{catalogProducts.filter((p) => p.category === c).length}</td>
                          <td>
                            <Status>In catalog</Status>
                          </td>
                          <td>
                            <button
                              className="admin-row-button"
                              onClick={() =>
                                setNotice(
                                  "Category editing will be enabled with catalog management.",
                                )
                              }
                            >
                              <Pencil size={13} /> Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!categories.length && (
                  <Empty title="No categories yet">
                    Categories will appear when catalog products are added.
                  </Empty>
                )}
              </section>
            </>
          )}
          {page === "custom-orders" && (
            <>
              {heading("New Custom Order", () =>
                setNotice("Custom order intake will be enabled when request storage is connected."),
              )}
              {metrics(
                <>
                  <Metric icon={Scissors} label="Custom Requests" value={seedCustom.length} />
                  <Metric icon={Clock3} label="In Progress" value="0" />
                  <Metric icon={Check} label="Completed" value="0" />
                  <Metric icon={Clock3} label="Pending Approval" value="0" />
                </>,
              )}
              <div className="admin-custom-layout">
                <section className="admin-panel-card admin-table-card">
                  <div className="admin-toolbar">
                    <select>
                      <option>All Statuses</option>
                      <option>Pending</option>
                      <option>In Progress</option>
                    </select>
                    <select>
                      <option>All Time</option>
                    </select>
                  </div>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Request ID</th>
                          <th>Customer</th>
                          <th>Design</th>
                          <th>Details</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Timeline</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {seedCustom
                          .filter((c) => match(c, ["id", "name", "title", "status"]))
                          .map((c) => (
                            <tr key={c.id}>
                              <td>{c.id}</td>
                              <td>{c.name}</td>
                              <td>
                                <span className="custom-preview">
                                  <Scissors size={18} />
                                </span>
                              </td>
                              <td>
                                <b>{c.title}</b>
                                <small>{c.details}</small>
                              </td>
                              <td>{money(c.amount)}</td>
                              <td>
                                <Status>{c.status}</Status>
                              </td>
                              <td>{c.step}</td>
                              <td>
                                <button className="admin-row-button">View</button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  {!seedCustom.length && (
                    <Empty title="No custom requests">
                      Requests will appear here when customers submit them.
                    </Empty>
                  )}
                </section>
                <aside className="admin-side-stack">
                  <section className="admin-panel-card admin-side-card">
                    <h2>Recent Custom Requests</h2>
                    <Empty title="No requests yet">New requests will appear here.</Empty>
                  </section>
                  <section className="admin-promo-panel compact-promo">
                    <h2>
                      Let’s bring
                      <br />
                      your idea to life
                    </h2>
                    <p>Custom embroidery for every story.</p>
                    <button
                      onClick={() => setNotice("Custom request storage is not connected yet.")}
                    >
                      Create Custom Order <ArrowRight size={14} />
                    </button>
                  </section>
                  <section className="admin-panel-card admin-side-card">
                    <h2>Quick Actions</h2>
                    <p>No pending approvals or request reports yet.</p>
                  </section>
                </aside>
              </div>
            </>
          )}
          {page === "discounts" && (
            <>
              {heading(editingDiscount ? "Edit Discount" : "Create Discount", () =>
                document.getElementById("discount-name")?.focus(),
              )}
              {metrics(
                <>
                  <Metric icon={Tag} label="Total Discounts" value={discounts.length} />
                  <Metric
                    icon={Check}
                    label="Active Discounts"
                    value={discounts.filter((d) => d.status === "Active").length}
                  />
                  <Metric icon={Clock3} label="Expired Discounts" value={0} />
                  <Metric icon={CircleDollarSign} label="Total Savings" value="—" />
                </>,
              )}
              <div className="admin-discount-layout">
                <section className="admin-panel-card admin-table-card">
                  <div className="admin-toolbar">
                    <select>
                      <option>All Types</option>
                      <option>Percentage</option>
                      <option>Fixed Amount</option>
                    </select>
                    <select>
                      <option>All Statuses</option>
                      <option>Active</option>
                      <option>Expired</option>
                    </select>
                  </div>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Discount Name</th>
                          <th>Code</th>
                          <th>Type</th>
                          <th>Value</th>
                          <th>Applicable To</th>
                          <th>Valid Until</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {discounts
                          .filter((d) => match(d, ["name", "code", "type"]))
                          .map((d) => (
                            <tr key={d.code}>
                              <td>
                                <b>{d.name}</b>
                              </td>
                              <td>{d.code}</td>
                              <td>{d.type}</td>
                              <td>{d.displayValue || d.value}</td>
                              <td>{d.applicableTo || "Not configured"}</td>
                              <td>{d.until}</td>
                              <td>
                                <Status>{d.status}</Status>
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="admin-icon-button"
                                  onClick={() => setEditingDiscount(d)}
                                >
                                  <Pencil size={14} />
                                </button>{" "}
                                <button
                                  type="button"
                                  className="admin-row-button"
                                  onClick={() => {
                                    if (window.confirm(`Delete discount ${d.code}?`))
                                      deleteDiscount(d);
                                  }}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  {!discounts.length && (
                    <Empty title="No discounts created">
                      Create a discount to add it to this preview.
                    </Empty>
                  )}
                </section>
                <form
                  key={editingDiscount?.code || "new"}
                  className="admin-panel-card admin-side-form"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    const numericValue = Number(f.get("value"));
                    const type = String(f.get("type"));
                    const code = String(f.get("code")).trim().toUpperCase();
                    const d = {
                      name: String(f.get("name")).trim(),
                      code,
                      type,
                      value: numericValue,
                      displayValue: numericValue + (type === "Percentage" ? "%" : ""),
                      until: String(f.get("until") || "").trim() || "No expiry",
                      status: "Active",
                      applicableTo: String(f.get("applicableTo")),
                    };
                    if (!(await saveDiscount(d))) return;
                    setDiscounts((current) => [
                      d,
                      ...current.filter(
                        (existing) =>
                          existing.code !== d.code && existing.code !== editingDiscount?.code,
                      ),
                    ]);
                    setEditingDiscount(null);
                    e.currentTarget.reset();
                    setNotice(editingDiscount ? "Discount updated." : "Discount saved.");
                  }}
                >
                  <h2>{editingDiscount ? "Edit Discount" : "Create New Discount"}</h2>
                  <p>Set up a discount or promo offer.</p>
                  <label>
                    Discount Name *
                    <input
                      id="discount-name"
                      name="name"
                      required
                      defaultValue={editingDiscount?.name || ""}
                      placeholder="e.g. Spring Special"
                    />
                  </label>
                  <label>
                    Discount Code *
                    <input
                      name="code"
                      required
                      defaultValue={editingDiscount?.code || ""}
                      placeholder="e.g. SPRING20"
                    />
                  </label>
                  <label>
                    Discount Type
                    <select name="type" defaultValue={editingDiscount?.type || "Percentage"}>
                      <option>Percentage</option>
                      <option>Fixed Amount</option>
                    </select>
                  </label>
                  <label>
                    Value *
                    <input
                      name="value"
                      required
                      type="number"
                      min="1"
                      defaultValue={editingDiscount?.value || ""}
                      placeholder="Enter value"
                    />
                  </label>
                  <label>
                    Applicable To
                    <select
                      name="applicableTo"
                      defaultValue={editingDiscount?.applicableTo || "All Products"}
                    >
                      <option>All Products</option>
                      {categories.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                  <div className="admin-form-grid">
                    {" "}
                    <label>
                      Valid From
                      <input name="from" type="date" defaultValue={editingDiscount?.from || ""} />
                    </label>
                    <label>
                      Valid Until
                      <input
                        name="until"
                        type="date"
                        defaultValue={
                          editingDiscount?.until === "No expiry" ? "" : editingDiscount?.until || ""
                        }
                      />
                    </label>
                  </div>
                  <button className="admin-primary-button">
                    <Check size={15} />
                    {editingDiscount ? "Save Changes" : "Create Discount"}
                  </button>
                  {editingDiscount && (
                    <button
                      type="button"
                      className="admin-outline-button"
                      onClick={() => setEditingDiscount(null)}
                    >
                      Cancel Edit
                    </button>
                  )}
                </form>
              </div>
            </>
          )}
          {page === "reports" && (
            <>
              {heading("Download Report", () =>
                setNotice("There is no recorded sales data to export yet."),
              )}
              {metrics(
                <>
                  <Metric icon={CircleDollarSign} label="Total Sales" value="—" />
                  <Metric icon={ShoppingCart} label="Total Orders" value={orders.length} />
                  <Metric icon={Users} label="New Customers" value={seedCustomers.length} />
                  <Metric icon={BarChart3} label="Avg. Order Value" value="—" />
                </>,
              )}
              <div className="admin-reports-grid">
                <section className="admin-panel-card report-chart-panel">
                  <h2>Sales Overview</h2>
                  <p>Sales data will appear after orders are recorded.</p>
                  <Chart />
                </section>
                <section className="admin-panel-card report-chart-panel">
                  <h2>Sales by Product Category</h2>
                  <p>Revenue breakdown will appear after sales are recorded.</p>
                  <Chart />
                </section>
                <section className="admin-panel-card report-top-panel">
                  <h2>Catalog Products</h2>
                  {catalogProducts.length ? (
                    catalogProducts.slice(0, 5).map((p) => (
                      <div className="report-product" key={p.id}>
                        <img src={p.image} alt="" />
                        <span>
                          {p.name}
                          <small>
                            {p.category} · {money(p.price)}
                          </small>
                        </span>
                      </div>
                    ))
                  ) : (
                    <Empty title="No products yet">Catalog data will appear here.</Empty>
                  )}
                </section>
                <section className="admin-panel-card report-orders-panel">
                  <h2>Recent Orders</h2>
                  {orderRows}
                </section>
                <section className="admin-panel-card report-region-panel">
                  <h2>Sales by Region</h2>
                  <Empty title="No regional data">
                    Regional sales will appear after orders are recorded.
                  </Empty>
                </section>
                <section className="admin-panel-card report-growth-panel">
                  <h2>Monthly Growth</h2>
                  <Chart />
                </section>
              </div>
            </>
          )}
          {page === "settings" && (
            <>
              {heading()}
              <div className="admin-settings-layout">
                <nav className="admin-settings-nav">
                  {[
                    "Store Information",
                    "Business Hours",
                    "Shipping Settings",
                    "Payment Settings",
                    "Email Notifications",
                    "Tax Settings",
                    "Appearance",
                    "User Management",
                    "Backup & Export",
                    "System Settings",
                  ].map((tab, i) => (
                    <button
                      className={activeSettings === tab ? "active" : ""}
                      key={tab}
                      onClick={() => setActiveSettings(tab)}
                    >
                      {
                        [
                          <Package />,
                          <Clock3 />,
                          <Truck />,
                          <CreditCard />,
                          <Bell />,
                          <CircleDollarSign />,
                          <Leaf />,
                          <Users />,
                          <Download />,
                          <Settings />,
                        ][i]
                      }
                      {tab}
                    </button>
                  ))}
                </nav>
                <form
                  className="admin-panel-card admin-settings-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setNotice("Settings saved in this browser preview only.");
                  }}
                >
                  <h2>{activeSettings}</h2>
                  <p>Update your atelier preferences. Values are preview-only.</p>
                  <div className="admin-settings-fields">
                    {(activeSettings === "Store Information"
                      ? [
                          "Store Name",
                          "Store Email",
                          "Phone Number",
                          "Website URL",
                          "Store Description",
                        ]
                      : activeSettings === "Shipping Settings"
                        ? ["Free Shipping Threshold", "Flat Shipping Fee", "Dispatch Time"]
                        : activeSettings === "Payment Settings"
                          ? ["Cashfree Payments", "Cash on Delivery", "Currency"]
                          : activeSettings === "Email Notifications"
                            ? ["Order Confirmations", "Shipping Updates", "Newsletter Signup"]
                            : activeSettings === "Business Hours"
                              ? ["Weekdays", "Saturday", "Sunday"]
                              : activeSettings === "Tax Settings"
                                ? ["GST Number", "Tax Rate", "Prices Include Tax"]
                                : activeSettings === "Appearance"
                                  ? ["Store Theme", "Accent Color", "Show Stock Status"]
                                  : activeSettings === "User Management"
                                    ? [
                                        "Admin Email",
                                        "Require Sign In",
                                        "Two-factor Authentication",
                                      ]
                                    : activeSettings === "Backup & Export"
                                      ? ["Last Backup", "Export Products", "Export Customer Data"]
                                      : ["Store Status", "Maintenance Mode", "Guest Checkout"]
                    ).map((label, i) => (
                      <label key={label}>
                        {label}
                        <input
                          placeholder="Not configured"
                          defaultValue={
                            activeSettings === "Store Information" && i === 0
                              ? "The Handcraft Atelier"
                              : activeSettings === "Store Information" && i === 3
                                ? "https://thehandcraftatelier.live"
                                : activeSettings === "Payment Settings" && i === 2
                                  ? "INR (₹)"
                                  : ""
                          }
                        />
                      </label>
                    ))}
                  </div>
                  <button className="admin-primary-button">
                    <Check size={15} />
                    Save Settings
                  </button>
                </form>
                <aside className="admin-panel-card admin-settings-side">
                  <h2>Store Address</h2>
                  <p>Business address for invoices and shipping.</p>
                  <label>
                    Address
                    <input placeholder="Not configured" />
                  </label>
                  <h2>Currency & Locale</h2>
                  <label>
                    Currency
                    <select>
                      <option>INR (₹) – Indian Rupee</option>
                    </select>
                  </label>
                  <label>
                    Timezone
                    <select>
                      <option>Asia/Kolkata (UTC +5:30)</option>
                    </select>
                  </label>
                </aside>
              </div>
            </>
          )}
          {catalogError && (
            <div className="admin-db-error" role="alert">
              {catalogError}
              <button onClick={() => setCatalogError("")} aria-label="Dismiss">
                ×
              </button>
            </div>
          )}
          {(editingProduct || addingProduct) && (
            <div
              className="admin-modal-backdrop"
              role="presentation"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                  setEditingProduct(null);
                  setAddingProduct(false);
                }
              }}
            >
              <form
                className="admin-product-editor"
                role="dialog"
                aria-modal="true"
                onSubmit={editingProduct ? saveProduct : saveNewProduct}
                aria-labelledby="edit-product-title"
              >
                <button
                  className="admin-modal-close"
                  type="button"
                  onClick={() => {
                    setEditingProduct(null);
                    setAddingProduct(false);
                  }}
                  aria-label="Close"
                >
                  ×
                </button>
                <span className="eyebrow">PRODUCT CATALOG</span>
                <h2 id="edit-product-title">{editingProduct ? "Edit product" : "Add a product"}</h2>
                <p>
                  {editingProduct
                    ? "Changes are saved to your Supabase products table."
                    : "New products and their photos are added to your Supabase catalog."}
                </p>
                <label>
                  Product name
                  <input
                    name="name"
                    required
                    defaultValue={editingProduct?.name || ""}
                    placeholder="Product name"
                  />
                </label>
                <div className="admin-form-grid">
                  <label>
                    Price (INR)
                    <input
                      name="price"
                      type="number"
                      min="0"
                      step="1"
                      required
                      defaultValue={editingProduct?.price || ""}
                      placeholder="0"
                    />
                    <small>Enter the amount in rupees.</small>
                  </label>
                  <label>
                    Category
                    <select
                      name="category"
                      required
                      defaultValue={
                        editingProduct?.category || categories[0] || CREATE_CATEGORY_VALUE
                      }
                      onChange={(e) => {
                        setCreatingCategory(e.target.value === CREATE_CATEGORY_VALUE);
                        setNewCategoryName("");
                      }}
                    >
                      {!categories.length && (
                        <option value={CREATE_CATEGORY_VALUE}>＋ Create new category</option>
                      )}
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                      {categories.length > 0 && (
                        <option value={CREATE_CATEGORY_VALUE}>＋ Create new category</option>
                      )}
                    </select>
                  </label>
                </div>
                {creatingCategory && (
                  <label>
                    New category name
                    <input
                      name="new_category"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      required
                      autoFocus
                      placeholder="Enter category name"
                    />
                  </label>
                )}
                <fieldset className="admin-size-picker">
                  <legend>Available sizes</legend>
                  <div>
                    {AVAILABLE_SIZES.map((size) => (
                      <label key={size}>
                        <input
                          type="checkbox"
                          name="sizes"
                          value={size}
                          defaultChecked={(editingProduct?.sizes || AVAILABLE_SIZES).includes(size)}
                        />
                        <span>{size}</span>
                      </label>
                    ))}
                  </div>
                  <small>Customers can choose from the sizes selected here.</small>
                </fieldset>
                {(editingProduct || addingProduct) && (
                  <div className="admin-gallery-manager">
                    <span>Product images and colors</span>
                    <p>
                      Enter a color name for each image. Customers selecting that color will see its
                      linked photo.
                    </p>
                    <div className="admin-gallery-grid">
                      {(editingProduct?.gallery || []).map((image, index) => (
                        <div className="admin-gallery-item" key={`${image.src}-${index}`}>
                          {isVideo(image) ? (
                            <video
                              src={image.src}
                              poster={image.poster}
                              controls
                              preload="none"
                              aria-label={`Product video ${index + 1}`}
                            />
                          ) : (
                            <img src={image.src} alt={`Product image ${index + 1}`} />
                          )}
                          <label>
                            Color
                            <input
                              name={`image_color_${index}`}
                              defaultValue={image.color || ""}
                              placeholder="e.g. Sage green"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setEditingProduct((current) => ({
                                ...current,
                                gallery: (current.gallery || []).filter(
                                  (_, imageIndex) => imageIndex !== index,
                                ),
                              }))
                            }
                            aria-label={`Remove product image ${index + 1}`}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    {editingProduct && (
                      <label className="admin-gallery-upload">
                        Add images
                        <input name="galleryImages" type="file" accept="image/*" multiple />
                        <small>
                          Color name below will be linked to each new image in this upload.
                        </small>
                        <input
                          name="galleryImageColor"
                          placeholder="Color for new image(s), optional"
                        />
                      </label>
                    )}
                    {addingProduct && (
                      <>
                        <label className="admin-gallery-upload">
                          Product image
                          <input name="image" type="file" accept="image/*" required />
                          <small>Upload a product photo (up to 8 MB).</small>
                        </label>
                        <label>
                          Image color
                          <input name="image_color" placeholder="e.g. Natural white" />
                        </label>
                      </>
                    )}
                  </div>
                )}
                <label>
                  Product tag
                  <input
                    name="tag"
                    defaultValue={editingProduct?.tag || ""}
                    placeholder="Optional"
                  />
                </label>
                <label>
                  Description
                  <textarea
                    name="description"
                    defaultValue={editingProduct?.description || ""}
                    placeholder="Product description"
                  />
                </label>
                {addingProduct && (
                  <label>
                    Stock quantity
                    <input name="stock" type="number" min="0" step="1" placeholder="Optional" />
                  </label>
                )}
                {catalogError && (
                  <p className="admin-login-error" role="alert">
                    {catalogError}
                  </p>
                )}
                <div className="admin-editor-actions">
                  <button
                    type="button"
                    className="admin-outline-button"
                    onClick={() => {
                      setEditingProduct(null);
                      setAddingProduct(false);
                    }}
                  >
                    Cancel
                  </button>
                  <button className="admin-primary-button" disabled={savingProduct}>
                    {savingProduct ? "Saving…" : editingProduct ? "Save changes" : "Add product"}
                  </button>
                </div>
              </form>
            </div>
          )}
          {selectedOrder && (
            <div
              className="admin-modal-backdrop"
              role="presentation"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) setSelectedOrder(null);
              }}
            >
              <section
                className="admin-order-detail-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="order-detail-title"
              >
                <button
                  className="admin-modal-close"
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  aria-label="Close"
                >
                  ×
                </button>
                <span className="eyebrow">ORDER DETAILS</span>
                <h2 id="order-detail-title">Order #{String(selectedOrder.id).slice(0, 8)}</h2>
                <p className="admin-order-detail-meta">
                  {selectedOrder.date} · <Status>{selectedOrder.status}</Status>
                </p>
                <div className="admin-order-detail-grid">
                  <div>
                    <h3>Customer</h3>
                    <p>
                      <b>{selectedOrder.name}</b>
                      <br />
                      {selectedOrder.email}
                      <br />
                      {selectedOrder.phone}
                    </p>
                  </div>
                  <div>
                    <h3>Delivery address</h3>
                    <p>
                      {[selectedOrder.address, selectedOrder.city, selectedOrder.postal_code]
                        .filter(Boolean)
                        .join(", ") || "Not available"}
                    </p>
                  </div>
                  <div>
                    <h3>Payment</h3>
                    <p>
                      {selectedOrder.method} · {selectedOrder.payment_status || "pending"}
                      <br />
                      <b>{money(selectedOrder.total)}</b>
                    </p>
                  </div>
                </div>
                <h3>Items</h3>
                <ul className="admin-order-detail-items">
                  {(selectedOrder.items || []).map((item, index) => (
                    <li key={`${item.product_id || item.name}-${index}`}>
                      <span>
                        {item.name} × {item.quantity}
                      </span>
                      <b>{money(Number(item.unit_price || 0) * Number(item.quantity || 1))}</b>
                    </li>
                  ))}
                </ul>
                <div className="admin-order-detail-actions">
                  <button
                    className={
                      "admin-outline-button admin-dispatch-button" +
                      (selectedOrder.status === "shipped" ? " is-dispatched" : "")
                    }
                    type="button"
                    disabled={orderStatusBusy || selectedOrderDelivered}
                    onClick={() =>
                      updateOrderStatus(selectedOrder.status === "shipped" ? "pending" : "shipped")
                    }
                  >
                    <Truck size={15} />{" "}
                    {selectedOrder.status === "shipped" ? "Undo dispatch" : "Dispatch order"}
                  </button>
                  <button
                    className="admin-primary-button"
                    type="button"
                    disabled={orderStatusBusy || selectedOrderDelivered}
                    onClick={() => updateOrderStatus("delivered")}
                  >
                    <Check size={15} /> Mark delivered
                  </button>
                </div>
              </section>
            </div>
          )}
          {customerFormOpen && (
            <div
              className="admin-modal-backdrop"
              role="presentation"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget && !savingCustomer)
                  setCustomerFormOpen(false);
              }}
            >
              <form
                className="admin-product-editor"
                role="dialog"
                aria-modal="true"
                aria-labelledby="add-customer-title"
                onSubmit={saveCustomer}
              >
                <button
                  className="admin-modal-close"
                  type="button"
                  onClick={() => !savingCustomer && setCustomerFormOpen(false)}
                  aria-label="Close"
                >
                  ×
                </button>
                <span className="eyebrow">CUSTOMER DIRECTORY</span>
                <h2 id="add-customer-title">Add customer</h2>
                <p>Create a customer profile for future orders and saved delivery details.</p>
                <label>
                  Full name
                  <input name="full_name" required placeholder="Customer name" />
                </label>
                <label>
                  Email
                  <input name="email" type="email" required placeholder="customer@example.com" />
                </label>
                <div className="admin-form-grid">
                  <label>
                    Phone
                    <input name="phone" type="tel" placeholder="Phone number" />
                  </label>
                  <label>
                    Postal code
                    <input name="postal_code" placeholder="Postal code" />
                  </label>
                </div>
                <label>
                  Address line 1<input name="address_line1" placeholder="House number and street" />
                </label>
                <label>
                  Address line 2
                  <input name="address_line2" placeholder="Apartment, landmark (optional)" />
                </label>
                <div className="admin-form-grid">
                  <label>
                    City
                    <input name="city" placeholder="City" />
                  </label>
                  <label>
                    State
                    <input name="state" placeholder="State" />
                  </label>
                </div>
                {customerFormError && (
                  <p className="admin-login-error" role="alert">
                    {customerFormError}
                  </p>
                )}
                <div className="admin-editor-actions">
                  <button
                    type="button"
                    className="admin-outline-button"
                    onClick={() => setCustomerFormOpen(false)}
                    disabled={savingCustomer}
                  >
                    Cancel
                  </button>
                  <button className="admin-primary-button" disabled={savingCustomer}>
                    {savingCustomer ? "Saving…" : "Add customer"}
                  </button>
                </div>
              </form>
            </div>
          )}
          {rejectingOrder && (
            <div
              className="admin-modal-backdrop"
              role="presentation"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) closeRejectOrder();
              }}
            >
              <form
                className="admin-reject-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="reject-order-title"
                onSubmit={processOrderRejection}
              >
                <button
                  className="admin-modal-close"
                  type="button"
                  onClick={closeRejectOrder}
                  aria-label="Close"
                  disabled={rejectionBusy}
                >
                  ×
                </button>
                <span className="eyebrow">ORDER MANAGEMENT · STEP {rejectionStep} OF 2</span>
                <h2 id="reject-order-title">
                  {rejectionStep === 1 ? "Review order rejection" : "Confirm rejection & refund"}
                </h2>
                <p>
                  Order #{String(rejectingOrder.id).slice(0, 8)} · {rejectingOrder.name} ·{" "}
                  {money(rejectingOrder.total)}
                </p>
                {rejectionStep === 1 ? (
                  <>
                    <div className="admin-reject-payment-summary">
                      <b>Payment: {rejectingOrder.method}</b>
                      <span>Payment status: {rejectingOrder.payment_status || "pending"}</span>
                      <span>
                        Items:{" "}
                        {rejectingOrder.items
                          ?.map((item) => `${item.name} × ${item.quantity}`)
                          .join(", ") || "No items listed"}
                      </span>
                    </div>
                    <label>
                      Reason for rejection
                      <textarea
                        value={rejectionReason}
                        onChange={(event) => setRejectionReason(event.target.value)}
                        required
                        maxLength={500}
                        placeholder="For example: item unavailable or address could not be verified"
                      />
                    </label>
                    <p className="admin-reject-guidance">
                      You will review the refund action before confirming.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="admin-reject-payment-summary">
                      <b>Refund action</b>
                      {rejectingPaid && rejectingCod ? (
                        <span>
                          This COD order is marked paid. Rejecting it will flag a manual refund;
                          cash payments cannot be refunded through Cashfree.
                        </span>
                      ) : rejectingPaid && rejectingOrder.cashfree_order_id ? (
                        <span>
                          A full Cashfree refund of {money(rejectingOrder.total)} will be initiated.
                          Cashfree may take time to complete it; the order will show the refund
                          status returned by Cashfree.
                        </span>
                      ) : rejectingPaid ? (
                        <span className="admin-reject-warning">
                          This order is marked paid but has no Cashfree order ID. Verify the payment
                          and add its Cashfree order ID before proceeding.
                        </span>
                      ) : rejectingUnpaid ? (
                        <span>
                          No payment is recorded as captured, so this order will be rejected without
                          a refund.
                        </span>
                      ) : (
                        <span className="admin-reject-warning">
                          Payment status is {rejectingPaymentStatus}. Verify it before rejecting; no
                          refund will be sent.
                        </span>
                      )}
                      <span>
                        <b>Reason:</b> {rejectionReason}
                      </span>
                    </div>
                    <label className="admin-reject-confirm-check">
                      <input
                        type="checkbox"
                        checked={rejectionConfirmed}
                        onChange={(event) => setRejectionConfirmed(event.target.checked)}
                      />{" "}
                      I confirm this order should be rejected and understand the refund action shown
                      above.
                    </label>
                  </>
                )}
                {rejectionError && (
                  <p className="admin-login-error" role="alert">
                    {rejectionError}
                  </p>
                )}
                <div className="admin-editor-actions">
                  {rejectionStep === 1 ? (
                    <button
                      type="button"
                      className="admin-outline-button"
                      onClick={closeRejectOrder}
                    >
                      Cancel
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="admin-outline-button"
                      onClick={() => {
                        setRejectionStep(1);
                        setRejectionError("");
                        setRejectionConfirmed(false);
                      }}
                      disabled={rejectionBusy}
                    >
                      Back
                    </button>
                  )}
                  {rejectionStep === 1 ? (
                    <button className="admin-primary-button" disabled={!rejectionReason.trim()}>
                      Continue to confirmation
                    </button>
                  ) : (
                    <button
                      className="admin-danger-button"
                      disabled={rejectionBusy || !rejectionConfirmed || !rejectionCanProceed}
                    >
                      {rejectionBusy
                        ? "Processing…"
                        : rejectingPaid && !rejectingCod
                          ? "Confirm rejection & refund"
                          : "Confirm rejection"}
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}
          {notice && (
            <div className="admin-toast" role="status">
              {notice}
              <button onClick={() => setNotice("")}>
                <X size={15} />
              </button>
            </div>
          )}
        </main>
        <footer className="admin-footer">
          <span>
            <Leaf size={14} /> The Handcraft Atelier
          </span>
          <span>Admin Panel</span>
          <span>Preview · v1</span>
        </footer>
      </div>
    </div>
  );
}
export default AdminPanel;
