import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { categoryDiscount, discountCategories } from "../lib/discounts.js";
import { money } from "../lib/format.js";

function useActiveCoupons() {
  const [coupons, setCoupons] = useState([]);
  useEffect(() => {
    if (!supabase) return;
    const controller = new AbortController();
    async function load() {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("discounts")
        .select("code,type,value,applicable_to,valid_from,valid_until")
        .order("code")
        .abortSignal(controller.signal);
      if (error || controller.signal.aborted) return;
      setCoupons(
        data.filter(
          (c) =>
            c.value > 0 &&
            (!c.valid_from || c.valid_from <= today) &&
            (!c.valid_until || c.valid_until >= today),
        ),
      );
    }
    load();
    return () => controller.abort();
  }, []);
  return coupons;
}

export function CouponList({ coupons, items, onApply, appliedCode }) {
  const [copied, setCopied] = useState("");
  const [copyError, setCopyError] = useState("");
  async function copy(code) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setCopyError("");
    } catch {
      setCopyError("Select the code and copy it manually.");
    }
  }
  return (
    <>
      <ul className="store-coupon-list">
        {coupons.map((coupon) => {
          const categories = discountCategories(coupon.applicable_to);
          const eligible = !items || categoryDiscount(coupon, items) > 0;
          return (
            <li key={coupon.code}>
              <div>
                <strong>{coupon.code}</strong>
                <small>
                  {coupon.type === "Percentage" ? coupon.value + "%" : money(Number(coupon.value))}{" "}
                  off · {categories.join(", ") || "All products"}
                </small>
                {!eligible && <small>No matching items in your cart</small>}
              </div>
              {onApply ? (
                <button
                  type="button"
                  disabled={!eligible || appliedCode === coupon.code}
                  onClick={() => onApply(coupon.code)}
                >
                  {appliedCode === coupon.code ? "Applied" : "Apply"}
                </button>
              ) : (
                <button
                  type="button"
                  aria-label={"Copy " + coupon.code}
                  onClick={() => copy(coupon.code)}
                >
                  {copied === coupon.code ? "Copied" : "Copy"}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {copyError && <small role="status">{copyError}</small>}
    </>
  );
}

export function CheckoutCoupons(props) {
  const coupons = useActiveCoupons();
  if (!coupons.length) return null;
  return (
    <section aria-label="Available coupon codes">
      <h3>Available coupons</h3>
      <CouponList coupons={coupons} {...props} />
    </section>
  );
}

export function HomeCouponPopup() {
  const coupons = useActiveCoupons();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let timer;
    function onScroll() {
      timer = window.setTimeout(() => setVisible(true), 3500);
    }
    window.addEventListener("scroll", onScroll, { once: true, passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(timer);
    };
  }, []);
  if (!visible || !coupons.length) return null;
  return (
    <aside className="home-coupon-popup" aria-labelledby="home-coupon-title">
      <header>
        <h2 id="home-coupon-title">Coupon codes</h2>
        <button type="button" aria-label="Close coupon codes" onClick={() => setVisible(false)}>
          ×
        </button>
      </header>
      <CouponList coupons={coupons} />
    </aside>
  );
}
