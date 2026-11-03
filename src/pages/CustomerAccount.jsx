import React, { useEffect, useState } from "react";

import {
  UserRound,
  Leaf,
  ArrowRight,
  Star,
  Check,
  MapPin,
  Phone,
  LogOut,
  Package,
} from "lucide-react";
import { supabase } from "../lib/supabase";

import { images } from "../data/storefront.js";

import { money } from "../lib/format.js";

export function CustomerAccount({ user, customerProfile, productCatalog, onSignOut, onShop }) {
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [reviewSetupError, setReviewSetupError] = useState("");
  const [section, setSection] = useState("profile");
  const [reviewedPurchases, setReviewedPurchases] = useState([]);
  const [reviewing, setReviewing] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);
  const [deliveryBusy, setDeliveryBusy] = useState("");
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const name =
    customerProfile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    "Your account";
  const email = customerProfile?.email || user?.email || "Not added yet";
  const phone = customerProfile?.phone || user?.phone || "Not added yet";
  const address = [
    customerProfile?.address_line1,
    customerProfile?.address_line2,
    customerProfile?.city,
    customerProfile?.state,
    customerProfile?.postal_code,
  ]
    .filter(Boolean)
    .join(", ");
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "A";

  useEffect(() => {
    let active = true;
    const loadOrders = async () => {
      if (!supabase || !customerProfile?.id) {
        setOrders([]);
        setOrdersLoading(false);
        return;
      }
      setOrdersLoading(true);
      setOrdersError("");
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) {
          setOrdersError("Sign in again to view your order history.");
          setOrdersLoading(false);
          return;
        }
        const response = await fetch("/api/customer-orders", {
          headers: { authorization: `Bearer ${session.access_token}` },
        });
        const result = await response.json().catch(() => ({}));
        if (!active) return;
        if (!response.ok) {
          console.error("Unable to load customer orders.", result.error);
          setOrdersError(result.error || "We couldn't load your orders right now.");
          setOrders([]);
        } else {
          setOrders(
            (result.orders || []).map((order) => ({
              ...order,
              items: Array.isArray(order.items) ? order.items : [],
            })),
          );
          const { data: reviews, error: reviewsError } = await supabase
            .from("product_reviews")
            .select("order_id,product_id")
            .eq("customer_id", customerProfile.id);
          if (!active) return;
          if (reviewsError) {
            console.error("Unable to load the customer's submitted reviews.", reviewsError);
            setReviewedPurchases([]);
            if (["PGRST205", "42P01", "42501"].includes(reviewsError.code))
              setReviewSetupError(
                "Run supabase/migrations/20261029230000_verified_product_reviews.sql in the Supabase SQL Editor to enable verified reviews.",
              );
          } else {
            setReviewSetupError("");
            setReviewedPurchases(
              (reviews || []).map((review) => `${review.order_id}:${review.product_id}`),
            );
          }
        }
      } catch (error) {
        if (!active) return;
        console.error("Unable to load customer account orders.", error);
        setOrdersError("We couldn't load your orders right now. Please refresh and try again.");
        setOrders([]);
      }
      if (active) setOrdersLoading(false);
    };
    loadOrders();
    return () => {
      active = false;
    };
  }, [customerProfile?.id]);

  const navItems = [
    { id: "profile", label: "My Profile", icon: UserRound },
    { id: "orders", label: "My Orders", icon: Package },
    { id: "addresses", label: "Addresses", icon: MapPin },
    { id: "reviews", label: "Reviews", icon: Star },
  ];
  const eligibleReviews = orders
    .filter(
      (order) =>
        String(order.payment_status || "").toLowerCase() === "paid" &&
        !["cancelled", "canceled", "rejected", "refunded"].includes(
          String(order.status || "").toLowerCase(),
        ) &&
        ["", "not_required", "not required"].includes(
          String(order.refund_status || "not_required").toLowerCase(),
        ),
    )
    .flatMap((order) =>
      order.items
        .map((item) => {
          const product = productCatalog.find(
            (candidate) => String(candidate.id) === String(item.product_id),
          );
          const key = `${order.id}:${item.product_id}`;
          return product && !reviewedPurchases.includes(key) ? { order, item, product, key } : null;
        })
        .filter(Boolean),
    );
  const uniqueEligibleReviews = eligibleReviews.filter(
    (candidate, index) =>
      eligibleReviews.findIndex((value) => value.key === candidate.key) === index,
  );
  const markPackageReceived = async (order) => {
    if (!supabase || deliveryBusy) return;
    setDeliveryBusy(order.id);
    setDeliveryMessage("");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Sign in again to update your order.");
      const response = await fetch("/api/customer-orders", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ orderId: order.id }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "We could not update this order.");
      setOrders((current) =>
        current.map((item) => (item.id === order.id ? { ...item, status: "delivered" } : item)),
      );
      setDeliveryMessage("Thank you. Your package has been marked as received.");
    } catch (error) {
      setDeliveryMessage(
        error instanceof Error ? error.message : "We could not update this order.",
      );
    } finally {
      setDeliveryBusy("");
    }
  };
  const submitReview = async (event) => {
    event.preventDefault();
    if (!reviewing || !supabase) return;
    setReviewBusy(true);
    setReviewMessage("");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Sign in again to submit your review.");
      const result = await fetch("/api/customer-reviews", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          orderId: reviewing.order.id,
          productId: reviewing.product.id,
          rating: reviewRating,
          review: reviewText,
        }),
      });
      const payload = await result.json().catch(() => ({}));
      if (!result.ok) throw new Error(payload.error || "We could not submit your review.");
      setReviewedPurchases((current) => [...current, reviewing.key]);
      setReviewMessage("Thank you. Your verified purchase review has been submitted.");
      setReviewing(null);
      setReviewText("");
      setReviewRating(5);
    } catch (error) {
      setReviewMessage(error.message || "We could not submit your review.");
    } finally {
      setReviewBusy(false);
    }
  };
  const renderReviews = () =>
    ordersLoading ? (
      <div className="account-orders-empty">
        <Star size={24} />
        <h3>Checking your purchases</h3>
        <p>We’re verifying your paid orders.</p>
      </div>
    ) : reviewSetupError ? (
      <div className="account-orders-empty">
        <Star size={24} />
        <h3>Reviews need setup</h3>
        <p>{reviewSetupError}</p>
      </div>
    ) : ordersError ? (
      <div className="account-orders-empty">
        <Star size={24} />
        <h3>Reviews unavailable</h3>
        <p>{ordersError}</p>
      </div>
    ) : uniqueEligibleReviews.length ? (
      <div className="customer-review-list">
        {uniqueEligibleReviews.map((candidate) => (
          <article className="customer-review-item" key={candidate.key}>
            <img src={candidate.product.image} alt="" />
            <div>
              <strong>{candidate.product.name}</strong>
              <small>Order #{String(candidate.order.id).slice(0, 8)} · Paid</small>
            </div>
            <button
              className="account-edit-button"
              onClick={() => {
                setReviewing(candidate);
                setReviewRating(5);
                setReviewText("");
                setReviewMessage("");
              }}
            >
              Write review
            </button>
          </article>
        ))}
      </div>
    ) : (
      <div className="account-orders-empty">
        <Star size={24} />
        <h3>No eligible purchases yet</h3>
        <p>Once an order is successfully paid, you can leave a review for the products in it.</p>
      </div>
    );
  const renderOrders = () =>
    ordersLoading ? (
      <div className="account-orders-empty">
        <Package size={24} />
        <h3>Loading your orders</h3>
        <p>Your order history will be here in a moment.</p>
      </div>
    ) : ordersError ? (
      <div className="account-orders-empty">
        <Package size={24} />
        <h3>Orders unavailable</h3>
        <p>{ordersError}</p>
      </div>
    ) : orders.length ? (
      <>
        {deliveryMessage && (
          <p className="customer-delivery-message" role="status">
            {deliveryMessage}
          </p>
        )}
        <div className="account-order-list">
          {(section === "orders" ? orders : orders.slice(0, 5)).map((order) => {
            const firstItem = order.items[0];
            const product = productCatalog.find(
              (item) => String(item.id) === String(firstItem?.product_id),
            );
            const orderName = firstItem?.name || "Handcrafted order";
            const itemCount = order.items.reduce(
              (sum, item) => sum + Number(item.quantity || 1),
              0,
            );
            const status = String(order.status || "processing").replaceAll("_", " ");
            return (
              <article className="account-order-row" key={order.id}>
                <img src={product?.image || firstItem?.image || images.logo} alt="" />
                <div className="account-order-id">
                  <strong>#{String(order.id).slice(0, 8)}</strong>
                  <small>
                    {new Date(order.created_at).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </small>
                </div>
                <div className="account-order-items">
                  <span>
                    {orderName}
                    {order.items.length > 1 ? ` + ${order.items.length - 1} more` : ""}
                  </span>
                  <small>
                    {itemCount} {itemCount === 1 ? "item" : "items"}
                  </small>
                </div>
                <strong className="account-order-total">{money(Number(order.total || 0))}</strong>
                <div className="account-order-actions">
                  <span
                    className={`account-order-status status-${status.toLowerCase().replaceAll(" ", "-")}`}
                  >
                    {status}
                  </span>
                  {String(order.status || "").toLowerCase() === "shipped" && (
                    <button
                      className="account-received-button"
                      type="button"
                      onClick={() => markPackageReceived(order)}
                      disabled={deliveryBusy === order.id}
                    >
                      {deliveryBusy === order.id ? "Updating…" : "Package received"}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </>
    ) : (
      <div className="account-orders-empty">
        <Package size={24} />
        <h3>No orders yet</h3>
        <p>Your orders will appear here after you place one.</p>
        <button className="account-edit-button" onClick={onShop}>
          Explore the collection <ArrowRight size={15} />
        </button>
      </div>
    );

  return (
    <main className="customer-account-page">
      <aside className="customer-account-sidebar">
        <nav aria-label="Account sections">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={section === item.id ? "active" : ""}
                onClick={() => setSection(item.id)}
              >
                <Icon size={19} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="customer-account-sidebar-note">
          Small
          <br />
          handmade pieces.
          <br />
          <em>Big happiness.</em>
          <Leaf size={19} />
        </div>
        <button className="customer-account-logout" onClick={onSignOut}>
          <LogOut size={17} /> Log out
        </button>
      </aside>
      <div className="customer-account-main">
        <section className="customer-profile-hero">
          <div className="customer-profile-banner">
            <div>
              <span className="eyebrow">YOUR ATELIER ACCOUNT</span>
              <h1>
                {section === "profile"
                  ? "My Profile"
                  : section === "orders"
                    ? "My Orders"
                    : section === "reviews"
                      ? "My Reviews"
                      : "Your Address"}
              </h1>
              <p>Manage your account details, orders, and delivery information.</p>
            </div>
            <span className="customer-profile-flower" aria-hidden="true">
              ✿
            </span>
          </div>
          <div className="customer-profile-card">
            <div className="customer-profile-avatar" aria-label={`${name} initials`}>
              {initials}
            </div>
            <div className="customer-profile-identity">
              <div className="customer-profile-name">
                <h2>{name}</h2>
                <span>
                  <Check size={13} /> Customer account
                </span>
              </div>
              <p>{email}</p>
              <p>
                <Phone size={14} />
                {phone}
              </p>
              <small>
                <Leaf size={14} /> Member since{" "}
                {new Date(user?.created_at || Date.now()).toLocaleDateString("en-IN", {
                  month: "long",
                  year: "numeric",
                })}
              </small>
            </div>
            <button className="account-edit-button" onClick={() => setSection("addresses")}>
              <MapPin size={15} /> View address
            </button>
          </div>
        </section>
        {section === "addresses" ? (
          <section className="customer-account-card customer-address-card">
            <div className="customer-account-card-heading">
              <span>
                <MapPin size={19} />
              </span>
              <div>
                <h2>Shipping address</h2>
                <p>Your saved delivery details</p>
              </div>
            </div>
            {address ? (
              <div className="customer-saved-address">
                <strong>{name}</strong>
                <p>{address}</p>
                {phone !== "Not added yet" && <small>{phone}</small>}
              </div>
            ) : (
              <div className="account-orders-empty">
                <MapPin size={24} />
                <h3>No saved address yet</h3>
                <p>Your delivery address will be saved here after checkout.</p>
              </div>
            )}
          </section>
        ) : section === "reviews" ? (
          <section className="customer-account-card customer-reviews-card">
            <div className="customer-account-card-heading">
              <span>
                <Star size={19} />
              </span>
              <div>
                <h2>Verified purchase reviews</h2>
                <p>Only products in your successfully paid orders are eligible.</p>
              </div>
            </div>
            {renderReviews()}
            {reviewMessage && (
              <p className="customer-review-message" role="status">
                {reviewMessage}
              </p>
            )}
          </section>
        ) : (
          <section className="customer-account-card customer-orders-card">
            <div className="customer-account-card-heading">
              <span>
                <Package size={19} />
              </span>
              <div>
                <h2>{section === "orders" ? "All your orders" : "Recent Orders"}</h2>
                <p>View your latest orders and their status.</p>
              </div>
              <button onClick={() => setSection("orders")}>
                View all orders <ArrowRight size={14} />
              </button>
            </div>
            {renderOrders()}
          </section>
        )}
      </div>
      <aside className="customer-account-aside">
        <section className="customer-account-card customer-address-summary">
          <div className="customer-account-card-heading">
            <span>
              <MapPin size={18} />
            </span>
            <div>
              <h2>Shipping Address</h2>
            </div>
            <button onClick={() => setSection("addresses")}>View</button>
          </div>
          {address ? (
            <div className="customer-saved-address">
              <strong>{name}</strong>
              <p>{address}</p>
              {phone !== "Not added yet" && <small>{phone}</small>}
            </div>
          ) : (
            <p className="customer-account-muted">
              No address saved. It will appear here after checkout.
            </p>
          )}
        </section>
        <section className="customer-account-care">
          <Leaf size={18} />
          <div>
            <strong>Love handmade?</strong>
            <span>Thank you for supporting our little atelier.</span>
          </div>
        </section>
      </aside>
      {reviewing && (
        <div
          className="customer-review-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !reviewBusy) setReviewing(null);
          }}
        >
          <form
            className="customer-review-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-review-title"
            onSubmit={submitReview}
          >
            <button
              className="customer-review-close"
              type="button"
              aria-label="Close review form"
              onClick={() => setReviewing(null)}
            >
              ×
            </button>
            <span className="eyebrow">VERIFIED PURCHASE</span>
            <h2 id="customer-review-title">Review {reviewing.product.name}</h2>
            <p>Your review is linked to order #{String(reviewing.order.id).slice(0, 8)}.</p>
            <label className="customer-review-rating-label">Your rating</label>
            <div
              className="customer-review-stars"
              role="group"
              aria-label="Rating from 1 to 5 stars"
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  type="button"
                  key={value}
                  aria-label={`${value} star${value === 1 ? "" : "s"}`}
                  aria-pressed={reviewRating === value}
                  onClick={() => setReviewRating(value)}
                >
                  <Star size={25} fill={reviewRating >= value ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
            <label className="customer-review-text-label">
              Your review
              <textarea
                value={reviewText}
                onChange={(event) => setReviewText(event.target.value)}
                minLength={5}
                maxLength={2000}
                required
                placeholder="Share what you loved about this handmade piece."
              />
            </label>
            {reviewMessage && (
              <p className="customer-review-message" role="alert">
                {reviewMessage}
              </p>
            )}
            <button
              className="account-edit-button customer-review-submit"
              disabled={reviewBusy || reviewText.trim().length < 5}
            >
              {reviewBusy ? "Submitting…" : "Submit verified review"}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
