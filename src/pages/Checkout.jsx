import { categoryDiscount } from "../lib/discounts.js";
import React, { useEffect, useState } from "react";

import {
  Leaf,
  ArrowRight,
  ArrowLeft,
  Truck,
  CreditCard,
  Check,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { googleMapsApiKey, supabase } from "../lib/supabase";

import { INDIAN_STATES_AND_UTS } from "../data/locations.js";
import { money } from "../lib/format.js";
import { loadCashfree } from "../lib/load-cashfree.js";

import { GoogleSignInScreen } from "../components/GoogleSignInScreen.jsx";

export function Checkout({
  item,
  onBackToCart,
  onPlaceOrder,
  user,
  customerProfile,
  authLoading,
  onGoogleSignIn,
}) {
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    loadCashfree().catch(() => {});
  }, []);
  const [submitError, setSubmitError] = useState("");
  const [activeStep, setActiveStep] = useState(1);
  const [reviewDetails, setReviewDetails] = useState(null);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pin, setPin] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "");
  const [phone, setPhone] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [locationStatus, setLocationStatus] = useState("");
  const checkoutItems = item.items || [item];
  const orderTotal = checkoutItems.reduce(
    (total, product) => total + Number(product.price || 0) * (product.quantity || 1),
    0,
  );
  const discountAmount = categoryDiscount(appliedCoupon, checkoutItems);
  const payableTotal = Math.max(0, Math.round((orderTotal - discountAmount) * 100) / 100);
  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    const { data: discount, error } = supabase
      ? await supabase
          .from("discounts")
          .select("code,name,type,value,applicable_to,valid_from,valid_until")
          .eq("code", code)
          .maybeSingle()
      : { data: null, error: new Error("Supabase is not configured.") };
    if (error) console.error("Could not load shared discount.", error.message);
    if (!discount) {
      setAppliedCoupon(null);
      setCouponMessage(
        error
          ? "Discount service is unavailable. Please try again."
          : "That coupon code is not valid.",
      );
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    if (
      (discount.valid_from && discount.valid_from > today) ||
      (discount.valid_until && discount.valid_until < today)
    ) {
      setAppliedCoupon(null);
      setCouponMessage(
        discount.valid_from && discount.valid_from > today
          ? "That coupon is not active yet."
          : "That coupon has expired.",
      );
      return;
    }
    const rawType = String(discount.type || "")
      .trim()
      .toLowerCase();
    const type =
      rawType === "fixed amount" ? "Fixed Amount" : rawType === "percentage" ? "Percentage" : "";
    const value = Number(discount.value);
    if (!type || !Number.isFinite(value) || value <= 0) {
      setAppliedCoupon(null);
      setCouponMessage("That coupon has an invalid discount value.");
      return;
    }
    const coupon = { ...discount, code, type, value };
    if (!categoryDiscount(coupon, checkoutItems)) {
      setAppliedCoupon(null);
      setCouponMessage("This coupon does not apply to the items in your cart.");
      return;
    }
    setAppliedCoupon(coupon);
    setCouponMessage(`${discount.code} applied successfully.`);
  };
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponMessage("");
    setCouponCode("");
  };
  useEffect(() => {
    if (!customerProfile) return;
    setFullName(customerProfile.full_name || user?.user_metadata?.full_name || "");
    setPhone(customerProfile.phone || "");
    setAddress(customerProfile.address_line1 || "");
    setAddressLine2(customerProfile.address_line2 || "");
    setCity(customerProfile.city || "");
    setState(customerProfile.state || "");
    setPin(customerProfile.postal_code || "");
  }, [customerProfile]);
  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Location access is not supported by this browser.");
      return;
    }

    setLocationStatus("Requesting your location...");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          if (!googleMapsApiKey) {
            setLocationStatus(
              "Location permission was granted, but address lookup is not configured yet.",
            );
            return;
          }
          const params = new URLSearchParams({
            latlng: `${coords.latitude},${coords.longitude}`,
            key: googleMapsApiKey,
          });
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?${params}`,
          );
          if (!response.ok) throw new Error("Location lookup failed.");
          const result = await response.json();
          if (result.status !== "OK" || !result.results?.[0]) throw new Error("Address not found.");

          const firstResult = result.results[0];
          const components = firstResult.address_components || [];
          const component = (type) =>
            components.find((value) => value.types.includes(type))?.long_name || "";
          setAddress(firstResult.formatted_address || "");
          setCity(component("locality") || component("administrative_area_level_2"));
          const detectedState = component("administrative_area_level_1");
          setState(
            INDIAN_STATES_AND_UTS.find(
              (value) => value.toLowerCase() === detectedState.toLowerCase(),
            ) || "",
          );
          setPin(component("postal_code"));
          setLocationStatus("Address filled from your location.");
        } catch (error) {
          console.error("Unable to convert location into an address.", error);
          setLocationStatus("We could not find an address for that location.");
        }
      },
      (error) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? "Location permission was blocked. Allow location access in your browser settings, then try again."
            : error.code === error.TIMEOUT
              ? "Location request timed out. Please try again."
              : "We could not access your location. Please try again.";
        setLocationStatus(message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 },
    );
  };
  const submitOrder = async (event) => {
    event.preventDefault();
    if (activeStep === 1) {
      setReviewDetails(Object.fromEntries(new FormData(event.currentTarget).entries()));
      setActiveStep(2);
      return;
    }
    if (activeStep !== 3) return;
    if (payableTotal < 200) {
      setSubmitError("The minimum order total for online payment is ₹200.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    const details = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      await loadCashfree();
      const payment = await onPlaceOrder(
        details,
        appliedCoupon ? { ...appliedCoupon, discountAmount } : null,
      );
      if (payment?.error) {
        setSubmitError(payment.error);
      } else if (!payment?.paymentSessionId || !window.Cashfree) {
        setSubmitError("Cashfree checkout could not be loaded. Please refresh and try again.");
      } else {
        const cashfree = window.Cashfree({
          mode: import.meta.env.VITE_CASHFREE_MODE === "sandbox" ? "sandbox" : "production",
        });
        const result = await cashfree.checkout({
          paymentSessionId: payment.paymentSessionId,
          redirectTarget: "_self",
        });
        if (result?.error)
          setSubmitError(
            result.error.message || "Cashfree could not open the payment page. Please try again.",
          );
      }
    } catch {
      setSubmitError("We could not start the payment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
  const steps = ["Shipping", "Payment", "Review", "Confirmation"];
  return (
    <main className="checkout-page">
      {authLoading ? (
        <section className="checkout-success" aria-live="polite">
          <span>
            <Leaf size={22} />
          </span>
          <h2>Preparing your checkout</h2>
          <p>We’re restoring your secure sign-in. Your selected piece is saved.</p>
        </section>
      ) : !user ? (
        <GoogleSignInScreen onGoogleSignIn={onGoogleSignIn} />
      ) : (
        <>
          <div className="checkout-heading checkout-heading-left">
            <span className="eyebrow">A THOUGHTFUL CHECKOUT</span>
            <h1>
              Checkout <Leaf size={25} />
            </h1>
            <p>Fill in your details and complete your order securely.</p>
          </div>
          <div className="checkout-layout">
            <section className="checkout-main-column">
              <nav className="checkout-steps" aria-label="Checkout progress">
                {steps.map((step, index) => {
                  const number = index + 1;
                  return (
                    <button
                      type="button"
                      key={step}
                      className={
                        number === activeStep ? "active" : number < activeStep ? "complete" : ""
                      }
                      onClick={() => number < activeStep && setActiveStep(number)}
                      disabled={number > activeStep}
                      aria-current={number === activeStep ? "step" : undefined}
                    >
                      <span>{number < activeStep ? <Check size={14} /> : number}</span>
                      <b>{step}</b>
                    </button>
                  );
                })}
              </nav>
              {
                <form className="checkout-form checkout-multistep" onSubmit={submitOrder}>
                  <section className="checkout-step-panel" hidden={activeStep !== 1}>
                    <div className="checkout-section-heading">
                      <span>
                        <Truck size={21} />
                      </span>
                      <div>
                        <h2>Shipping address</h2>
                        <p>Enter your delivery details</p>
                      </div>
                    </div>
                    <button
                      className="checkout-location"
                      type="button"
                      onClick={useCurrentLocation}
                    >
                      <MapPin size={14} /> Use my current location
                    </button>
                    {locationStatus && (
                      <small className="checkout-location-status" role="status">
                        {locationStatus}
                      </small>
                    )}
                    <div className="checkout-fields">
                      <label>
                        Full name <i>*</i>
                        <input
                          name="customer_name"
                          required
                          autoComplete="name"
                          value={fullName}
                          onChange={(event) => setFullName(event.target.value)}
                          placeholder="Your full name"
                        />
                      </label>
                      <label>
                        Phone number <i>*</i>
                        <input
                          name="phone"
                          required
                          type="tel"
                          autoComplete="tel"
                          value={phone}
                          onChange={(event) => setPhone(event.target.value)}
                          placeholder="+91 00000 00000"
                        />
                      </label>
                      <label>
                        Email address <i>*</i>
                        <input
                          name="email"
                          required
                          type="email"
                          autoComplete="email"
                          value={user.email || ""}
                          readOnly
                        />
                      </label>
                      <label>
                        Address line 1 <i>*</i>
                        <input
                          name="address"
                          required
                          autoComplete="address-line1"
                          placeholder="House number and street"
                          value={address}
                          onChange={(event) => setAddress(event.target.value)}
                        />
                      </label>
                      <label>
                        Address line 2 <small>(optional)</small>
                        <input
                          name="address_line2"
                          autoComplete="address-line2"
                          placeholder="Apartment, suite, etc."
                          value={addressLine2}
                          onChange={(event) => setAddressLine2(event.target.value)}
                        />
                      </label>
                      <label>
                        City <i>*</i>
                        <input
                          name="city"
                          required
                          autoComplete="address-level2"
                          placeholder="Your city"
                          value={city}
                          onChange={(event) => setCity(event.target.value)}
                        />
                      </label>
                      <label>
                        State <i>*</i>
                        <select
                          name="state"
                          required
                          autoComplete="address-level1"
                          value={state}
                          onChange={(event) => setState(event.target.value)}
                        >
                          <option value="" disabled>
                            Select state or union territory
                          </option>
                          {INDIAN_STATES_AND_UTS.map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        PIN code <i>*</i>
                        <input
                          name="postal_code"
                          required
                          inputMode="numeric"
                          pattern="[0-9]{6}"
                          autoComplete="postal-code"
                          placeholder="6-digit PIN"
                          value={pin}
                          onChange={(event) => setPin(event.target.value)}
                        />
                      </label>
                    </div>
                    <label className="checkout-billing-check">
                      <input type="checkbox" defaultChecked /> Use this address for billing as well
                    </label>
                    <div className="checkout-section-heading checkout-subheading">
                      <span>
                        <Truck size={20} />
                      </span>
                      <div>
                        <h2>Shipping method</h2>
                        <p>Thoughtful packing, delivered with care</p>
                      </div>
                    </div>
                    <label className="checkout-choice selected">
                      <input type="radio" name="shipping_method" value="standard" defaultChecked />
                      <span>
                        <b>Standard delivery</b>
                        <small>5–7 business days</small>
                      </span>
                      <strong>Complimentary</strong>
                      <Leaf size={16} />
                    </label>
                  </section>
                  {activeStep === 2 && (
                    <section className="checkout-step-panel">
                      <div className="checkout-section-heading">
                        <span>
                          <CreditCard size={20} />
                        </span>
                        <div>
                          <h2>Payment method</h2>
                          <p>Pay securely through Cashfree</p>
                        </div>
                      </div>
                      <div className="checkout-payment-choice selected">
                        <span className="checkout-cashfree-mark">C</span>
                        <span>
                          <b>Online payment</b>
                          <small>UPI, cards, net banking and other available methods</small>
                        </span>
                        <ShieldCheck size={18} />
                      </div>
                      <div className="checkout-secure-note">
                        <ShieldCheck size={18} />
                        <span>
                          Your payment is processed securely by Cashfree. We only mark your order
                          paid after Cashfree confirms it.
                        </span>
                      </div>
                    </section>
                  )}
                  {activeStep === 3 && (
                    <section className="checkout-step-panel">
                      <div className="checkout-section-heading">
                        <span>
                          <Check size={20} />
                        </span>
                        <div>
                          <h2>Review your order</h2>
                          <p>Check your delivery details before continuing to payment</p>
                        </div>
                      </div>
                      <div className="checkout-review-card">
                        <b>{reviewDetails?.customer_name}</b>
                        <span>
                          {reviewDetails?.email} · {reviewDetails?.phone}
                        </span>
                        <span>
                          {[
                            reviewDetails?.address,
                            reviewDetails?.address_line2,
                            reviewDetails?.city,
                            reviewDetails?.state,
                            reviewDetails?.postal_code,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                        <button type="button" onClick={() => setActiveStep(1)}>
                          Edit address
                        </button>
                      </div>
                      <div className="checkout-review-card">
                        <b>Delivery & payment</b>
                        <span>Standard delivery · 5–7 business days</span>
                        <span>Online payment via Cashfree</span>
                        <input type="hidden" name="payment_method" value="Cashfree" />
                        <button type="button" onClick={() => setActiveStep(2)}>
                          Edit payment
                        </button>
                      </div>
                    </section>
                  )}
                  <input type="hidden" name="coupon_code" value={appliedCoupon?.code || ""} />
                  <div className="checkout-step-actions">
                    {activeStep === 1 ? (
                      <button className="checkout-back-link" type="button" onClick={onBackToCart}>
                        <ArrowLeft size={15} /> Back to cart
                      </button>
                    ) : (
                      <button
                        className="checkout-back-link"
                        type="button"
                        onClick={() => setActiveStep(activeStep - 1)}
                      >
                        <ArrowLeft size={15} /> Back
                      </button>
                    )}
                    {activeStep === 1 && (
                      <button className="story-cta checkout-submit" type="submit">
                        Continue to Payment <ArrowRight size={15} />
                      </button>
                    )}
                    {activeStep === 2 && (
                      <button
                        className="story-cta checkout-submit"
                        type="button"
                        onClick={() => setActiveStep(3)}
                      >
                        Review Order <ArrowRight size={15} />
                      </button>
                    )}
                    {activeStep === 3 && (
                      <button
                        className="story-cta checkout-submit"
                        type="submit"
                        disabled={submitting}
                      >
                        {submitting ? "Connecting to Cashfree…" : "Pay securely with Cashfree"}{" "}
                        <ArrowRight size={15} />
                      </button>
                    )}
                  </div>
                  {submitError && (
                    <p className="checkout-order-error" role="alert">
                      {submitError}
                    </p>
                  )}
                </form>
              }
            </section>
            <aside className="checkout-summary">
              <div className="checkout-summary-heading">
                <span>
                  <Leaf size={19} />
                </span>
                <div>
                  <h2>Order summary</h2>
                  <p>Review your items and total amount</p>
                </div>
              </div>
              <div className="checkout-summary-items">
                {checkoutItems.map((product, index) => (
                  <article className="checkout-product" key={`${product.id}-${index}`}>
                    <img src={product.image} alt={product.name} />
                    <div>
                      <h3>{product.name}</h3>
                      {product.size && <small>Size: {product.size}</small>}
                      {product.color && <small>Color: {product.color}</small>}
                      {product.personalization && (
                        <small>Personalized: {product.personalization}</small>
                      )}
                      <small>Qty: {product.quantity || 1}</small>
                    </div>
                    <strong>{money(Number(product.price) * (product.quantity || 1))}</strong>
                  </article>
                ))}
              </div>
              <div className="checkout-coupon">
                <label htmlFor="checkout-coupon-code">Have a coupon code?</label>
                <div className="checkout-coupon-row">
                  <input
                    id="checkout-coupon-code"
                    value={couponCode}
                    onChange={(event) => {
                      setCouponCode(event.target.value);
                      setCouponMessage("");
                    }}
                    placeholder="Enter coupon code"
                    autoComplete="off"
                  />
                  {appliedCoupon ? (
                    <button type="button" onClick={removeCoupon}>
                      Remove
                    </button>
                  ) : (
                    <button type="button" onClick={applyCoupon}>
                      Apply
                    </button>
                  )}
                </div>
                {couponMessage && (
                  <small
                    className={appliedCoupon ? "checkout-coupon-success" : "checkout-coupon-error"}
                    role="status"
                  >
                    {couponMessage}
                  </small>
                )}
              </div>
              <div className="checkout-cost-row">
                <span>Subtotal</span>
                <strong>{money(orderTotal)}</strong>
              </div>
              {appliedCoupon && (
                <div className="checkout-cost-row checkout-discount-row">
                  <span>Discount ({appliedCoupon.code})</span>
                  <strong>-{money(discountAmount)}</strong>
                </div>
              )}
              <div className="checkout-cost-row">
                <span>Shipping</span>
                <strong>Complimentary</strong>
              </div>
              <div className="checkout-total">
                <span>Total</span>
                <strong>{money(payableTotal)}</strong>
              </div>
              <div className="checkout-thankyou">
                <Leaf size={20} />
                <div>
                  <b>Every piece tells a story…</b>
                  <span>Thank you for supporting handmade. 💚</span>
                </div>
                <Leaf size={20} />
              </div>
            </aside>
          </div>
        </>
      )}
    </main>
  );
}
