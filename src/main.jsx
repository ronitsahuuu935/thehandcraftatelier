import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Search, UserRound, Heart, Leaf, ShoppingBag, Menu, X, ArrowRight, ArrowLeft, Star, SlidersHorizontal, Plus, Minus, ChevronDown, Truck, CreditCard, Check, MapPin, ShieldCheck, Phone, Mail, LogOut, Package } from "lucide-react";
import "./styles.css";
import { googleMapsApiKey, productStorageBucket, supabase } from "./lib/supabase";
import AdminPanel from "./AdminPanel";

const IMG = "/images/";           // site images (from assets/)
const PRODUCT_IMG = "/products/"; // product photos (from products/)
// TODO: put your real Instagram profile and WhatsApp number here (e.g. "https://wa.me/919XXXXXXXXX")
const SOCIAL = {
  instagram: "https://www.instagram.com/thehandcraftatelier?utm_source=ig_web_button_share_sheet&vrfl=ZDNlZDc0MzIxNw==",
  whatsapp: "https://wa.me/7877642926"
};
const images = {
  logo: IMG + "logo.png",
  heroBg: IMG + "hero-bg.webp",
  needle: IMG + "needle.webp",
  artisan: IMG + "model.webp",
  catShirts: PRODUCT_IMG + "p7.webp",
  catTops: PRODUCT_IMG + "p8.webp",
  catKids: PRODUCT_IMG + "p14.webp",
  catPersonalized: PRODUCT_IMG + "p13.webp",
  journal: IMG + "d1-wreath.webp",
  floralEmbroideryHoop: IMG + "Floral_Embroidery_Hoop.webp",
  journal2: IMG + "d6-960.webp",
  gift: IMG + "d9-960.webp",
  instagram: IMG + "instagram.webp",
  whatsapp: IMG + "whatsapp.webp"
};
const CATEGORIES = ["Shirts", "Tops & Tees", "Kids", "Personalized"];
const ADULT_SIZES = ["S", "M", "L", "XL"];
const KIDS_SIZES = ["2-3 yrs", "4-5 yrs", "6-7 yrs"];
const INDIAN_STATES_AND_UTS = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];
// NOTE: names and prices below are placeholders - replace with your real ones.
// image = card photo, gallery = photos on the product page (contain:true = two-view collage)
const g = (src, contain) => ({ src: PRODUCT_IMG + src, contain });
const products = [
  { id: 1, name: "Wildflower Line-Art Shirt", price: 2499, category: "Shirts", image: PRODUCT_IMG + "p1.webp", gallery: [g("p1.webp")] },
  { id: 13, name: "Monogram Wreath Tee", price: 1999, category: "Personalized", image: PRODUCT_IMG + "p13.webp", tag: "Personalized", gallery: [g("p13.webp"), g("p13b.webp")] },
  { id: 7, name: "Blue Floral Vine Shirt", price: 2349, category: "Shirts", image: PRODUCT_IMG + "p7.webp", gallery: [g("p7.webp"), g("p7b.webp", true)] },
  { id: 8, name: "Daisy Smocked Top", price: 2299, category: "Tops & Tees", image: PRODUCT_IMG + "p8.webp", gallery: [g("p8.webp"), g("p8b.webp", true)] },
  { id: 3, name: "Panda Pocket Shirt", price: 1799, category: "Shirts", image: PRODUCT_IMG + "p3.webp", gallery: [g("p3.webp")] },
  { id: 9, name: "Fruit Charm Shirt", price: 2399, category: "Shirts", image: PRODUCT_IMG + "p9.webp", gallery: [g("p9.webp"), g("p9b.webp", true)] },
  { id: 14, name: "Little Princess Floral Dress", price: 2199, category: "Kids", image: PRODUCT_IMG + "p14.webp", gallery: [g("p14.webp")] },
  { id: 12, name: "Sunflower Sprig Shirt", price: 2299, category: "Shirts", image: PRODUCT_IMG + "p12.webp", gallery: [g("p12.webp")] },
  { id: 2, name: "Silhouette Bloom Top", price: 1999, category: "Tops & Tees", image: PRODUCT_IMG + "p2.webp", gallery: [g("p2.webp")] },
  { id: 4, name: "Wild Sprig Pocket Shirt", price: 2299, category: "Shirts", image: PRODUCT_IMG + "p4.webp", gallery: [g("p4.webp"), g("p4b.webp")] },
  { id: 5, name: "Everyday Sprig Shirt", price: 2199, category: "Shirts", image: PRODUCT_IMG + "p5.webp", gallery: [g("p5.webp")] },
  { id: 6, name: "Woodland Bunny Cutwork Shirt", price: 2499, category: "Shirts", image: PRODUCT_IMG + "p6.webp", gallery: [g("p6.webp"), g("p6b.webp", true)] },
  { id: 10, name: "Palm Tree Shirt", price: 2499, category: "Shirts", image: PRODUCT_IMG + "p10.webp", gallery: [g("p10.webp")] }
];
const money = n => "₹" + n.toLocaleString("en-IN");
const ADMIN_HASH = "#12345Rsadmin";
const PENDING_CHECKOUT_KEY = "pending-checkout";

function Header({ page, navigate, goShop, goSection, cartCount, wishlistCount, search, setSearch, onBag, onWishlist, user, onGoogleSignIn }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return <header className="site-header">
    <div className="announcement">A little love, in every stitch. Complimentary shipping on orders ₹2,000+</div>
    <div className="brandbar">
      <button className="icon-btn mobile-menu" aria-label="Open menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X/> : <Menu/>}</button>
      <button className="wordmark" onClick={() => navigate("home")}><span>The Hand Craft Atelier</span><small>HANDMADE · HEARTFELT · FOREVER</small></button>
      <div className="search-inline"><Search size={17}/><input placeholder="Find something lovely" aria-label="Search products" value={search} onChange={e => { setSearch(e.target.value); if (e.target.value && page === "product") navigate("shop"); }} /></div>
      <div className="header-actions">
        <button className={user ? "icon-btn profile-trigger signed-in" : "icon-btn profile-trigger"} aria-label={user ? "Open your account" : "Sign in with Google"} title={user ? "My profile" : "Sign in with Google"} onClick={() => user ? navigate("account") : onGoogleSignIn}><UserRound/></button>
        <button className="icon-btn wishlist-header-button" aria-label="Open wishlist" title="Wishlist" onClick={onWishlist}><Heart/><span>{wishlistCount}</span></button>
        <button className="icon-btn bag" aria-label="Open shopping bag" onClick={onBag}><ShoppingBag/><span>{cartCount}</span></button>
      </div>
    </div>
    <nav className={menuOpen ? "main-nav open" : "main-nav"}>
      <button className={page === "home" ? "active" : ""} onClick={() => {navigate("home");setMenuOpen(false)}}>Home</button>
      <button className={page === "shop" ? "active" : ""} onClick={() => {goShop();setMenuOpen(false)}}>Shop</button>
      <button onClick={() => {goShop("Shirts");setMenuOpen(false)}}>Shirts</button>
      <button onClick={() => {goShop("Personalized");setMenuOpen(false)}}>Personalized</button>
      <button onClick={() => {goSection("story");setMenuOpen(false)}}>Our Story</button>
    </nav>
  </header>;
}

function CustomerAccount({ user, customerProfile, productCatalog, onSignOut, onShop }) {
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
  const name = customerProfile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || "Your account";
  const email = customerProfile?.email || user?.email || "Not added yet";
  const phone = customerProfile?.phone || user?.phone || "Not added yet";
  const address = [customerProfile?.address_line1, customerProfile?.address_line2, customerProfile?.city, customerProfile?.state, customerProfile?.postal_code].filter(Boolean).join(", ");
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "A";

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
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          setOrdersError("Sign in again to view your order history.");
          setOrdersLoading(false);
          return;
        }
        const response = await fetch("/api/customer-orders", { headers: { authorization: `Bearer ${session.access_token}` } });
        const result = await response.json().catch(() => ({}));
        if (!active) return;
        if (!response.ok) {
          console.error("Unable to load customer orders.", result.error);
          setOrdersError(result.error || "We couldn't load your orders right now.");
          setOrders([]);
        } else {
          setOrders((result.orders || []).map(order => ({ ...order, items: Array.isArray(order.items) ? order.items : [] })));
          const { data: reviews, error: reviewsError } = await supabase.from("product_reviews").select("order_id,product_id").eq("customer_id", customerProfile.id);
          if (!active) return;
          if (reviewsError) {
            console.error("Unable to load the customer's submitted reviews.", reviewsError);
            setReviewedPurchases([]);
            if (["PGRST205", "42P01", "42501"].includes(reviewsError.code)) setReviewSetupError("Run supabase/migrations/20261029230000_verified_product_reviews.sql in the Supabase SQL Editor to enable verified reviews.");
          } else {
            setReviewSetupError("");
            setReviewedPurchases((reviews || []).map(review => `${review.order_id}:${review.product_id}`));
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
    return () => { active = false; };
  }, [customerProfile?.id]);

  const navItems = [
    { id: "profile", label: "My Profile", icon: UserRound },
    { id: "orders", label: "My Orders", icon: Package },
    { id: "addresses", label: "Addresses", icon: MapPin },
    { id: "reviews", label: "Reviews", icon: Star }
  ];
  const eligibleReviews = orders
    .filter(order => String(order.payment_status || "").toLowerCase() === "paid" && !["cancelled", "canceled", "rejected", "refunded"].includes(String(order.status || "").toLowerCase()) && ["", "not_required", "not required"].includes(String(order.refund_status || "not_required").toLowerCase()))
    .flatMap(order => order.items.map(item => {
      const product = productCatalog.find(candidate => String(candidate.id) === String(item.product_id));
      const key = `${order.id}:${item.product_id}`;
      return product && !reviewedPurchases.includes(key) ? { order, item, product, key } : null;
    }).filter(Boolean));
  const uniqueEligibleReviews = eligibleReviews.filter((candidate, index) => eligibleReviews.findIndex(value => value.key === candidate.key) === index);
  const markPackageReceived = async order => {
    if (!supabase || deliveryBusy) return;
    setDeliveryBusy(order.id);
    setDeliveryMessage("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Sign in again to update your order.");
      const response = await fetch("/api/customer-orders", {
        method: "PATCH",
        headers: { "content-type": "application/json", authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ orderId: order.id })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "We could not update this order.");
      setOrders(current => current.map(item => item.id === order.id ? { ...item, status: "delivered" } : item));
      setDeliveryMessage("Thank you. Your package has been marked as received.");
    } catch (error) {
      setDeliveryMessage(error instanceof Error ? error.message : "We could not update this order.");
    } finally {
      setDeliveryBusy("");
    }
  };
  const submitReview = async event => {
    event.preventDefault();
    if (!reviewing || !supabase) return;
    setReviewBusy(true);
    setReviewMessage("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Sign in again to submit your review.");
      const result = await fetch("/api/customer-reviews", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ orderId: reviewing.order.id, productId: reviewing.product.id, rating: reviewRating, review: reviewText })
      });
      const payload = await result.json().catch(() => ({}));
      if (!result.ok) throw new Error(payload.error || "We could not submit your review.");
      setReviewedPurchases(current => [...current, reviewing.key]);
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
  const renderReviews = () => ordersLoading
    ? <div className="account-orders-empty"><Star size={24}/><h3>Checking your purchases</h3><p>We’re verifying your paid orders.</p></div>
    : reviewSetupError
      ? <div className="account-orders-empty"><Star size={24}/><h3>Reviews need setup</h3><p>{reviewSetupError}</p></div>
    : ordersError
      ? <div className="account-orders-empty"><Star size={24}/><h3>Reviews unavailable</h3><p>{ordersError}</p></div>
      : uniqueEligibleReviews.length
        ? <div className="customer-review-list">{uniqueEligibleReviews.map(candidate => <article className="customer-review-item" key={candidate.key}><img src={candidate.product.image} alt=""/><div><strong>{candidate.product.name}</strong><small>Order #{String(candidate.order.id).slice(0, 8)} · Paid</small></div><button className="account-edit-button" onClick={() => { setReviewing(candidate); setReviewRating(5); setReviewText(""); setReviewMessage(""); }}>Write review</button></article>)}</div>
        : <div className="account-orders-empty"><Star size={24}/><h3>No eligible purchases yet</h3><p>Once an order is successfully paid, you can leave a review for the products in it.</p></div>;
  const renderOrders = () => ordersLoading
    ? <div className="account-orders-empty"><Package size={24}/><h3>Loading your orders</h3><p>Your order history will be here in a moment.</p></div>
    : ordersError
      ? <div className="account-orders-empty"><Package size={24}/><h3>Orders unavailable</h3><p>{ordersError}</p></div>
      : orders.length
        ? <>{deliveryMessage && <p className="customer-delivery-message" role="status">{deliveryMessage}</p>}<div className="account-order-list">{(section === "orders" ? orders : orders.slice(0, 5)).map(order => {
          const firstItem = order.items[0];
          const product = productCatalog.find(item => String(item.id) === String(firstItem?.product_id));
          const orderName = firstItem?.name || "Handcrafted order";
          const itemCount = order.items.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
          const status = String(order.status || "processing").replaceAll("_", " ");
          return <article className="account-order-row" key={order.id}>
            <img src={product?.image || firstItem?.image || images.logo} alt=""/>
            <div className="account-order-id"><strong>#{String(order.id).slice(0, 8)}</strong><small>{new Date(order.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</small></div>
            <div className="account-order-items"><span>{orderName}{order.items.length > 1 ? ` + ${order.items.length - 1} more` : ""}</span><small>{itemCount} {itemCount === 1 ? "item" : "items"}</small></div>
            <strong className="account-order-total">{money(Number(order.total || 0))}</strong>
            <div className="account-order-actions"><span className={`account-order-status status-${status.toLowerCase().replaceAll(" ", "-")}`}>{status}</span>{String(order.status || "").toLowerCase() === "shipped" && <button className="account-received-button" type="button" onClick={() => markPackageReceived(order)} disabled={deliveryBusy === order.id}>{deliveryBusy === order.id ? "Updating…" : "Package received"}</button>}</div>
          </article>;
        })}</div></>
        : <div className="account-orders-empty"><Package size={24}/><h3>No orders yet</h3><p>Your orders will appear here after you place one.</p><button className="account-edit-button" onClick={onShop}>Explore the collection <ArrowRight size={15}/></button></div>;

  return <main className="customer-account-page">
    <aside className="customer-account-sidebar">
      <nav aria-label="Account sections">{navItems.map(item => { const Icon = item.icon; return <button key={item.id} className={section === item.id ? "active" : ""} onClick={() => setSection(item.id)}><Icon size={19}/>{item.label}</button>; })}</nav>
      <div className="customer-account-sidebar-note">Small<br/>handmade pieces.<br/><em>Big happiness.</em><Leaf size={19}/></div>
      <button className="customer-account-logout" onClick={onSignOut}><LogOut size={17}/> Log out</button>
    </aside>
    <div className="customer-account-main">
      <section className="customer-profile-hero">
        <div className="customer-profile-banner"><div><span className="eyebrow">YOUR ATELIER ACCOUNT</span><h1>{section === "profile" ? "My Profile" : section === "orders" ? "My Orders" : section === "reviews" ? "My Reviews" : "Your Address"}</h1><p>Manage your account details, orders, and delivery information.</p></div><span className="customer-profile-flower" aria-hidden="true">✿</span></div>
        <div className="customer-profile-card">
          <div className="customer-profile-avatar" aria-label={`${name} initials`}>{initials}</div>
          <div className="customer-profile-identity"><div className="customer-profile-name"><h2>{name}</h2><span><Check size={13}/> Customer account</span></div><p>{email}</p><p><Phone size={14}/>{phone}</p><small><Leaf size={14}/> Member since {new Date(user?.created_at || Date.now()).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</small></div>
          <button className="account-edit-button" onClick={() => setSection("addresses")}><MapPin size={15}/> View address</button>
        </div>
      </section>
      {section === "addresses" ? <section className="customer-account-card customer-address-card"><div className="customer-account-card-heading"><span><MapPin size={19}/></span><div><h2>Shipping address</h2><p>Your saved delivery details</p></div></div>{address ? <div className="customer-saved-address"><strong>{name}</strong><p>{address}</p>{phone !== "Not added yet" && <small>{phone}</small>}</div> : <div className="account-orders-empty"><MapPin size={24}/><h3>No saved address yet</h3><p>Your delivery address will be saved here after checkout.</p></div>}</section> : section === "reviews" ? <section className="customer-account-card customer-reviews-card"><div className="customer-account-card-heading"><span><Star size={19}/></span><div><h2>Verified purchase reviews</h2><p>Only products in your successfully paid orders are eligible.</p></div></div>{renderReviews()}{reviewMessage&&<p className="customer-review-message" role="status">{reviewMessage}</p>}</section> : <section className="customer-account-card customer-orders-card"><div className="customer-account-card-heading"><span><Package size={19}/></span><div><h2>{section === "orders" ? "All your orders" : "Recent Orders"}</h2><p>View your latest orders and their status.</p></div><button onClick={() => setSection("orders")}>View all orders <ArrowRight size={14}/></button></div>{renderOrders()}</section>}
    </div>
    <aside className="customer-account-aside"><section className="customer-account-card customer-address-summary"><div className="customer-account-card-heading"><span><MapPin size={18}/></span><div><h2>Shipping Address</h2></div><button onClick={() => setSection("addresses")}>View</button></div>{address ? <div className="customer-saved-address"><strong>{name}</strong><p>{address}</p>{phone !== "Not added yet" && <small>{phone}</small>}</div> : <p className="customer-account-muted">No address saved. It will appear here after checkout.</p>}</section><section className="customer-account-care"><Leaf size={18}/><div><strong>Love handmade?</strong><span>Thank you for supporting our little atelier.</span></div></section></aside>
    {reviewing&&<div className="customer-review-backdrop" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget&&!reviewBusy)setReviewing(null);}}><form className="customer-review-dialog" role="dialog" aria-modal="true" aria-labelledby="customer-review-title" onSubmit={submitReview}><button className="customer-review-close" type="button" aria-label="Close review form" onClick={()=>setReviewing(null)}>×</button><span className="eyebrow">VERIFIED PURCHASE</span><h2 id="customer-review-title">Review {reviewing.product.name}</h2><p>Your review is linked to order #{String(reviewing.order.id).slice(0, 8)}.</p><label className="customer-review-rating-label">Your rating</label><div className="customer-review-stars" role="group" aria-label="Rating from 1 to 5 stars">{[1,2,3,4,5].map(value=><button type="button" key={value} aria-label={`${value} star${value===1?"":"s"}`} aria-pressed={reviewRating===value} onClick={()=>setReviewRating(value)}><Star size={25} fill={reviewRating>=value?"currentColor":"none"}/></button>)}</div><label className="customer-review-text-label">Your review<textarea value={reviewText} onChange={event=>setReviewText(event.target.value)} minLength={5} maxLength={2000} required placeholder="Share what you loved about this handmade piece."/></label>{reviewMessage&&<p className="customer-review-message" role="alert">{reviewMessage}</p>}<button className="account-edit-button customer-review-submit" disabled={reviewBusy||reviewText.trim().length<5}>{reviewBusy?"Submitting…":"Submit verified review"}</button></form></div>}
  </main>;
}

function CartDrawer({ cart, onClose, onRemove, onQuantityChange, onCheckout }) {
  const subtotal = cart.reduce((total, item) => total + item.price * (item.quantity || 1), 0);
  return <aside className="cart-drawer" aria-label="Shopping bag">
    <div className="cart-drawer-head"><div><span className="eyebrow">YOUR ATELIER BAG</span><h2>Your bag <small>({cart.reduce((n, item) => n + (item.quantity || 1), 0)})</small></h2></div><button className="cart-close" aria-label="Close shopping bag" onClick={onClose}><X size={20}/></button></div>
    {cart.length===0 ? <div className="cart-empty"><ShoppingBag size={30}/><p>Your bag is waiting for something lovely.</p><button className="story-cta" onClick={onClose}>Continue shopping <ArrowRight size={15}/></button></div> :
      <><div className="cart-items">{cart.map((item,index)=><article className="cart-item" key={`${item.id}-${item.size||""}-${item.personalization||""}-${index}`}><img src={item.image} alt={item.name}/><div className="cart-item-info"><h3>{item.name}</h3>{item.size&&<small>Size: {item.size}</small>}{item.personalization&&<small>Personalized: {item.personalization}</small>}<strong>{money(item.price)}</strong><div className="cart-item-actions"><div className="quantity"><button aria-label="Decrease quantity" onClick={()=>onQuantityChange(index,-1)}><Minus size={13}/></button><span>{item.quantity||1}</span><button aria-label="Increase quantity" onClick={()=>onQuantityChange(index,1)}><Plus size={13}/></button></div><button className="cart-remove" onClick={()=>onRemove(index)}>Remove</button></div></div></article>)}</div><div className="cart-summary"><div><span>Subtotal</span><strong>{money(subtotal)}</strong></div><small>Shipping calculated at checkout. Complimentary shipping above ₹2,000.</small><button className="story-cta cart-checkout" onClick={onCheckout}>Proceed to checkout <ArrowRight size={15}/></button></div></>}
  </aside>;
}

function FloatingSocials() {
  return <>
    <a className="float-social left" href={SOCIAL.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><img src={images.instagram} alt="" width="34" height="34"/></a>
    <a className="float-social right" href={SOCIAL.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><img src={images.whatsapp} alt="" width="34" height="34"/></a>
  </>;
}

function Footer({ goShop }) {
  const [phone, setPhone] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  return <footer>
    <section className="newsletter">
      <div className="flower-mark">✿</div><div className="newsletter-copy"><h2>A little joy, delivered.</h2><p>Letters from the atelier, new blooms & a little something special. Enjoy 10% off your first order.</p></div>
      <form onSubmit={e => {e.preventDefault(); if(phone.replace(/\D/g,"").length>=10) setSubscribed(true)}} className="newsletter-form"><div><input type="tel" inputMode="tel" required pattern="[+]?[0-9 ()-]{10,15}" autoComplete="tel" placeholder="Your phone number" value={phone} onChange={e=>setPhone(e.target.value)}/><button>{subscribed ? "JOINED ✓" : "JOIN US"}</button></div><small>{subscribed ? "Welcome to our atelier." : "Only thoughtful messages. Reply STOP whenever you like."}</small></form>
    </section>
    <section className="footer-main">
      <div className="footer-brand"><h3>The Hand Craft Atelier</h3><p className="tagline">Handmade · Heartfelt · Forever</p><p>Thoughtful keepsakes, stitched slowly. For the little moments and the people who mean everything.</p></div>
      <div><h4>EXPLORE</h4><a href="#shop" onClick={e=>{e.preventDefault();goShop()}}>Shop all</a><a href="#shop" onClick={e=>{e.preventDefault();goShop("Shirts")}}>Shirts</a><a href="#shop" onClick={e=>{e.preventDefault();goShop("Personalized")}}>Personalized</a></div>
      <div><h4>HERE TO HELP</h4><a>Contact us</a><a href="/policies/shipping.html" target="_blank" rel="noopener noreferrer">Shipping policy</a><a href="/policies/refund.html" target="_blank" rel="noopener noreferrer">Refund policy</a><a href="/policies/terms.html" target="_blank" rel="noopener noreferrer">Terms of Service</a><a href="/policies/privacy.html" target="_blank" rel="noopener noreferrer">Privacy Policy</a></div>
      <div><h4>THE ATELIER</h4><a>Our story</a><a>Made slowly. Kept forever.</a></div>
    </section>
    <div className="legal"><span>© 2026 The Hand Craft Atelier. All lovingly reserved.</span></div>
  </footer>;
}

function ProductCard({ product, onOpen, onAdd, isWishlisted, onToggleWishlist }) {
  return <article className="product-card">
    <div className="product-image" onClick={() => onOpen(product)} role="button" tabIndex={0} onKeyDown={e=>e.key==="Enter"&&onOpen(product)}>
      <img src={product.image} alt={product.name} loading="lazy" style={product.pos?{objectPosition:product.pos}:undefined} onError={e=>{e.currentTarget.style.opacity=".15"}}/>
      {product.tag && <span className="product-tag">{product.tag}</span>}
      <button className={"wishlist "+(isWishlisted?"liked":"")} aria-label={isWishlisted?"Remove from wishlist":"Add to wishlist"} onClick={e=>{e.stopPropagation();onToggleWishlist(product)}}><Heart size={17} fill={isWishlisted?"currentColor":"none"}/></button>
    </div>
    <div className="product-info"><button className="product-name" onClick={() => onOpen(product)}>{product.name}</button><strong>{money(product.price)}</strong><p className="product-craft-note">Handcrafted with care</p><button className="quick-add" onClick={() => onAdd(product)}>Add to bag <Plus size={13}/></button></div>
  </article>;
}

function ProductGrid({ items, onOpen, onAdd, isWishlisted, onToggleWishlist }) {
  return <div className="product-grid">{items.map(p=><ProductCard key={p.id} product={p} onOpen={onOpen} onAdd={onAdd} isWishlisted={isWishlisted(p.id)} onToggleWishlist={onToggleWishlist}/>)}</div>;
}

function Home({ onOpen, onAdd, goShop, search, productCatalog, isWishlisted, onToggleWishlist }) {
  const visible = productCatalog.filter(p=>p.name.toLowerCase().includes(search.toLowerCase()));
  return <main>
    <section className="hero">
      <div className="hero-copy"><img className="hero-logo" src={images.logo} alt="The Hand Craft Atelier embroidered logo"/><span className="eyebrow">Stitched to Stand Out</span><h1>Not Just Thread.<br/>A Work of Art.</h1><p>Timeless embroidery. Thoughtful details. Pieces made just for you.</p><button className="btn primary" onClick={()=>goShop()}>Explore the collection <ArrowRight size={16}/></button></div>
      
      <div className="hero-bg" role="img" aria-label="Embroidery threads, scissors and blush flowers resting on soft cream fabric" style={{backgroundImage:`url(${images.heroBg})`}}></div>
      <img className="hero-needle" src={images.needle} alt="" aria-hidden="true"/>
    </section>
    <section className="category-row">
      {[
        ["Shirts", images.catShirts], ["Tops & Tees", images.catTops], ["Kids", images.catKids], ["Personalized", images.catPersonalized]
      ].map(([name,img])=><button className="category-card" key={name} onClick={()=>goShop(name)}><img src={img} alt=""/><span>{name}<small>Shop now ↗</small></span></button>)}
    </section>
    <section className="section-wrap"><div className="section-heading"><div><span className="eyebrow">FROM THE ATELIER</span><h2>Featured Pieces</h2><p>Thoughtfully stitched designs from the collection.</p></div><button className="text-link" onClick={()=>goShop()}>View all <ArrowRight size={15}/></button></div><ProductGrid items={visible.slice(0,4)} onOpen={onOpen} onAdd={onAdd} isWishlisted={isWishlisted} onToggleWishlist={onToggleWishlist}/></section>
    <section className="story-split" id="story"><div className="story-image"><img src={images.artisan} alt="Woman in a linen co-ord set standing among pink flowers" loading="lazy"/></div><div className="story-copy"><span className="story-leaf story-leaf-top">⌁</span><span className="eyebrow">A SLOWER KIND OF BEAUTY <i/></span><h2>More Than Just<br/>Products</h2><p>Every piece is a result of patience, skill and a deep love for traditional craftsmanship. Made slowly, to be treasured for years.</p><div className="story-benefits"><div><span><Leaf size={25} strokeWidth={1.6}/></span><strong>HANDCRAFTED<br/>WITH CARE</strong></div><div><span><Heart size={25} strokeWidth={1.6}/></span><strong>TIMELESS<br/>DESIGNS</strong></div><div><span><Leaf size={25} strokeWidth={1.6}/></span><strong>SUPPORTS<br/>ARTISANS</strong></div></div><button className="story-cta" onClick={()=>goShop()}>Shop the collection <ArrowRight size={17}/></button><span className="story-leaf story-leaf-bottom">⌁</span></div></section>
    <section className="section-wrap"><div className="section-heading"><div><span className="eyebrow">FRESH FROM THE ATELIER</span><h2>New Arrivals</h2><p>Fresh designs for your special moments.</p></div><button className="text-link" onClick={()=>goShop()}>View all <ArrowRight size={15}/></button></div><ProductGrid items={visible.slice(4,8).length ? visible.slice(4,8) : visible.slice(0,4)} onOpen={onOpen} onAdd={onAdd} isWishlisted={isWishlisted} onToggleWishlist={onToggleWishlist}/></section>
    <section className="testimonial">
      <div className="testimonial-copy"><span className="eyebrow"><Leaf size={24}/>OUR PROMISE</span><h2>Made with <em>thoughtful</em> detail</h2><blockquote><span className="quote-mark">“</span><span>Every piece is stitched slowly, with care in every detail.<br/>Made to be worn, gifted, and kept close.</span></blockquote><p className="testimonial-author"><span className="author-mark"><Leaf size={18}/></span> Handmade, heartfelt, forever</p></div>
      <div className="testimonial-art"><img src={images.floralEmbroideryHoop} alt="Floral embroidery hoop" loading="lazy"/></div>
    </section>
    <section className="journal-strip" id="journal"><img src={images.journal2} alt="Hand-embroidered hoop with tiny birds and flowers on turquoise fabric" style={{objectPosition:"center 52%"}} loading="lazy"/><div><span className="eyebrow">NOTES FROM THE ATELIER <i/></span><h2>Made to be <em>kept close.</em></h2><p>Thoughtful gifts, little rituals, and the beauty of making things slowly.</p><button className="story-cta" onClick={()=>goShop()}>Discover more <ArrowRight size={15}/></button></div><div className="journal-decoration" aria-hidden="true"/><Leaf className="journal-sprig sprig-left" aria-hidden="true"/><Leaf className="journal-sprig sprig-right" aria-hidden="true"/><span className="journal-heart" aria-hidden="true">♡</span></section>
  </main>;
}

function Shop({ onOpen, onAdd, search, category, setCategory, productCatalog, isWishlisted, onToggleWishlist }) {
  const [sort, setSort] = useState("Featured");
  const [filterOpen, setFilterOpen] = useState(false);
  const [maxPrice, setMaxPrice] = useState(2500);
  const filtered = useMemo(() => {
    let list = productCatalog.filter(p => (category==="All pieces" || p.category===category) && p.price<=maxPrice && p.name.toLowerCase().includes(search.toLowerCase()));
    if(sort==="Price: Low to High") list.sort((a,b)=>a.price-b.price);
    if(sort==="Price: High to Low") list.sort((a,b)=>b.price-a.price);
    return list;
  },[category,sort,maxPrice,search]);
  return <main className="shop-page">
    <section className="shop-banner"><img src={images.heroBg} alt=""/><div><span className="eyebrow">THOUGHTFULLY HANDMADE</span><h1>Shop All Handcrafted Pieces</h1><p>Discover unique embroidery and handcrafted pieces designed to bring beauty to your everyday life.</p></div></section>
    <div className="breadcrumbs">Home <span>/</span> Shop</div>
    <div className="shop-layout">
      <aside className={filterOpen?"filters show":"filters"}><div className="filter-head"><h3>Filter</h3><button onClick={()=>{setCategory("All pieces");setMaxPrice(2500)}}>Clear all</button><button className="filter-close" onClick={()=>setFilterOpen(false)}><X size={17}/></button></div>
        <div className="filter-group"><h4>Category</h4>{["All pieces",...CATEGORIES].map(c=><label key={c}><input type="radio" checked={category===c} onChange={()=>setCategory(c)}/>{c}</label>)}</div>
        <div className="filter-group"><h4>Price <span>{money(maxPrice)}</span></h4><input className="range" type="range" min="1000" max="2500" step="100" value={maxPrice} onChange={e=>setMaxPrice(+e.target.value)}/><div className="range-labels"><span>₹1,000</span><span>₹2,500</span></div></div>
        <div className="filter-group"><h4>Availability</h4><label><input type="checkbox"/> In stock</label><label><input type="checkbox"/> Made to order</label></div>
        <div className="filter-group"><h4>Personalization</h4><label><input type="checkbox"/> Can be personalized</label></div>
      </aside>
      <section className="shop-results"><div className="shop-toolbar"><button className="filter-trigger" onClick={()=>setFilterOpen(true)}><SlidersHorizontal size={16}/> Filter & sort</button><span>{filtered.length} thoughtfully made pieces</span><label className="sort-label">Sort by <select value={sort} onChange={e=>setSort(e.target.value)}><option>Featured</option><option>Price: Low to High</option><option>Price: High to Low</option></select></label></div>
        <ProductGrid items={filtered} onOpen={onOpen} onAdd={onAdd} isWishlisted={isWishlisted} onToggleWishlist={onToggleWishlist}/>
        {filtered.length===0&&<div className="empty-state">No pieces match those filters. Try clearing your filters.</div>}
      </section>
    </div>
    <section className="gift-banner"><img src={images.gift} alt="Hand-embroidered hoop with a hand holding coral flowers on peach fabric" style={{objectPosition:"50% 58%"}} loading="lazy"/><div><span className="eyebrow">GIVE SOMETHING MEANINGFUL</span><h2>The Perfect Gift</h2><p>Thoughtful. Handmade. Meaningful.</p><button className="btn primary" onClick={()=>{setCategory("Personalized");window.scrollTo({top:450,behavior:"smooth"})}}>Explore gifts <ArrowRight size={15}/></button></div></section>
  </main>;
}

function ProductDetail({ product, onAdd, onBuyNow, navigate, goShop, productCatalog, isWishlisted, onToggleWishlist }) {
  const sizes = product.category === "Kids" ? KIDS_SIZES : ADULT_SIZES;
  const [size,setSize] = useState(sizes[Math.min(1,sizes.length-1)]);
  const [qty,setQty] = useState(1);
  const [activeTab,setActiveTab] = useState("Details");
  const [personalization,setPersonalization] = useState("");
  const gallery = product.gallery;
  const [active,setActive] = useState(0);
  return <main className="detail-page">
    <div className="breadcrumbs">Home <span>/</span> Shop <span>/</span> {product.name}</div>
    <div className="detail-layout"><div className={"detail-gallery"+(gallery.length>1?"":" single")}>{gallery.length>1&&<div className="thumbs">{gallery.map((src,i)=><button key={src.src} className={i===active?"chosen":""} aria-label={"View image "+(i+1)} onClick={()=>setActive(i)}><img src={src.src} alt="" style={{objectFit:src.contain?"contain":"cover"}}/></button>)}</div>}<div className="detail-main-image"><img src={gallery[active].src} alt={product.name} style={{objectFit:gallery[active].contain?"contain":"cover"}}/></div></div>
      <div className="detail-info"><span className="eyebrow">MADE SLOWLY, KEPT FOREVER</span><div className="detail-title-row"><h1>{product.name}</h1><button className={"wishlist detail-wishlist "+(isWishlisted(product.id)?"liked":"")} aria-label={isWishlisted(product.id)?"Remove from wishlist":"Add to wishlist"} onClick={()=>onToggleWishlist(product)}><Heart size={20} fill={isWishlisted(product.id)?"currentColor":"none"}/></button></div><p className="product-craft-note">Hand-embroidered with care</p><div className="detail-price">{money(product.price)}</div><p className="detail-description">Hand-embroidered with care, stitch by stitch. A little everyday beauty you can wear.</p>
        <div className="option-label">Size</div><div className="size-options">{sizes.map(s=><button key={s} className={size===s?"selected":""} onClick={()=>setSize(s)}>{s}</button>)}</div>
        <label className="personal-label">Personalization <span>Optional</span><input value={personalization} onChange={e=>setPersonalization(e.target.value)} placeholder="Add a name or short message"/></label>
        <div className="option-label">Quantity</div><div className="quantity"><button onClick={()=>setQty(Math.max(1,qty-1))}><Minus size={14}/></button><span>{qty}</span><button onClick={()=>setQty(qty+1)}><Plus size={14}/></button></div>
        <button className="btn primary add-large" onClick={()=>onAdd({...product,quantity:qty,size,personalization})}>Add to bag — {money(product.price*qty)}</button><button className="btn secondary buy-large" onClick={()=>onBuyNow({...product,quantity:qty,size,personalization})}>Buy now</button>
        <div className="trust-row"><span>♡ Handmade with care</span><span>♧ Dispatch in 5–7 days</span><span>✧ Free shipping above ₹2,000</span></div>
        <div className="detail-tabs">{["Details","Shipping","Care"].map(t=><button key={t} className={activeTab===t?"selected":""} onClick={()=>setActiveTab(t)}>{t}</button>)}</div>
        <div className="tab-content">{activeTab==="Details"?"Soft, breathable fabric with hand embroidery in cotton thread. Each piece is finished by hand, so small variations make it yours.":activeTab==="Shipping"?"Carefully packed and dispatched in 5–7 business days. Complimentary shipping on orders above ₹2,000.":"Gentle hand wash in cold water. Do not wring or bleach. Dry in shade and iron on the reverse side."}</div>
      </div></div>
    <section className="section-wrap related"><div className="section-heading"><div><span className="eyebrow">A FEW MORE LOVELY THINGS</span><h2>You may also like</h2></div><button className="text-link" onClick={()=>goShop()}>Shop all <ArrowRight size={15}/></button></div><ProductGrid items={productCatalog.filter(p=>p.id!==product.id).slice(0,4)} onOpen={p=>navigate("product",p)} onAdd={onAdd} isWishlisted={isWishlisted} onToggleWishlist={onToggleWishlist}/></section>
  </main>;
}

function Wishlist({ products, onOpen, onAdd, isWishlisted, onToggleWishlist, onShop }) {
  return <main className="wishlist-page"><div className="wishlist-page-heading"><span className="eyebrow">SAVED WITH LOVE</span><h1>Your Wishlist</h1><p>Keep the pieces you would love to bring home.</p></div>{products.length?<ProductGrid items={products} onOpen={onOpen} onAdd={onAdd} isWishlisted={isWishlisted} onToggleWishlist={onToggleWishlist}/>:<div className="wishlist-empty"><Heart size={30}/><h2>Your wishlist is empty</h2><p>Tap the heart on any product to save it here.</p><button className="btn primary" onClick={onShop}>Explore the collection <ArrowRight size={16}/></button></div>}</main>;
}

function GoogleSignInScreen({ onGoogleSignIn }) {
  return <section className="google-signin-page">
    <img className="google-flower google-flower-one" src={IMG + "flower-1.webp"} alt="" aria-hidden="true"/>
    <img className="google-flower google-flower-two" src={IMG + "flower-2.webp"} alt="" aria-hidden="true"/>
    <img className="google-flower google-flower-three" src={IMG + "flower-3.webp"} alt="" aria-hidden="true"/>
    <section className="google-signin-card">
      <div className="google-signin-mark">⌁</div>
      <h2>Welcome back</h2>
      <p>Sign in to continue to your account and<br/>keep track of your orders, favourites and more.</p>
      <button className="google-signin-button" type="button" onClick={onGoogleSignIn}>
        <img src={IMG + "G_logo.webp"} alt="" aria-hidden="true"/>
        <span>Continue with Google</span>
        <ArrowRight size={19}/>
      </button>
    </section>
  </section>;
}

function Checkout({ item, onBack, onBackToCart, onPlaceOrder, user, customerProfile, authLoading, onGoogleSignIn }) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [activeStep, setActiveStep] = useState(1);
  const [reviewDetails, setReviewDetails] = useState(null);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pin, setPin] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [fullName, setFullName] = useState(user.user_metadata?.full_name || "");
  const [phone, setPhone] = useState("");
  const [locationStatus, setLocationStatus] = useState("");
  const checkoutItems = item.items || [item];
  const orderTotal = checkoutItems.reduce((total, product) => total + Number(product.price || 0) * (product.quantity || 1), 0);
  useEffect(() => {
    if (!customerProfile) return;
    setFullName(customerProfile.full_name || user.user_metadata?.full_name || "");
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
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        if (!googleMapsApiKey) {
          setLocationStatus("Location permission was granted, but address lookup is not configured yet.");
          return;
        }
        const params = new URLSearchParams({
          latlng: `${coords.latitude},${coords.longitude}`,
          key: googleMapsApiKey
        });
        const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);
        if (!response.ok) throw new Error("Location lookup failed.");
        const result = await response.json();
        if (result.status !== "OK" || !result.results?.[0]) throw new Error("Address not found.");

        const firstResult = result.results[0];
        const components = firstResult.address_components || [];
        const component = type => components.find(value => value.types.includes(type))?.long_name || "";
        setAddress(firstResult.formatted_address || "");
        setCity(component("locality") || component("administrative_area_level_2"));
        const detectedState = component("administrative_area_level_1");
        setState(INDIAN_STATES_AND_UTS.find(value => value.toLowerCase() === detectedState.toLowerCase()) || "");
        setPin(component("postal_code"));
        setLocationStatus("Address filled from your location.");
      } catch (error) {
        console.error("Unable to convert location into an address.", error);
        setLocationStatus("We could not find an address for that location.");
      }
    }, error => {
      const message = error.code === error.PERMISSION_DENIED
        ? "Location permission was blocked. Allow location access in your browser settings, then try again."
        : error.code === error.TIMEOUT
          ? "Location request timed out. Please try again."
          : "We could not access your location. Please try again.";
      setLocationStatus(message);
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 });
  };
  const submitOrder = async event => {
    event.preventDefault();
    if (activeStep === 1) {
      setReviewDetails(Object.fromEntries(new FormData(event.currentTarget).entries()));
      setActiveStep(2);
      return;
    }
    if (activeStep !== 3) return;
    if (orderTotal < 200) {
      setSubmitError("The minimum order total for online payment is ₹200.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    const details = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const payment = await onPlaceOrder(details);
      if (payment?.error) {
        setSubmitError(payment.error);
      } else if (!payment?.paymentSessionId || !window.Cashfree) {
        setSubmitError("Cashfree checkout could not be loaded. Please refresh and try again.");
      } else {
        const cashfree = window.Cashfree({ mode: import.meta.env.VITE_CASHFREE_MODE === "sandbox" ? "sandbox" : "production" });
        const result = await cashfree.checkout({ paymentSessionId: payment.paymentSessionId, redirectTarget: "_self" });
        if (result?.error) setSubmitError(result.error.message || "Cashfree could not open the payment page. Please try again.");
      }
    } catch {
      setSubmitError("We could not start the payment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
  const steps=["Shipping","Payment","Review","Confirmation"];
  return <main className="checkout-page">
    {authLoading ? <section className="checkout-success" aria-live="polite"><span><Leaf size={22}/></span><h2>Preparing your checkout</h2><p>We’re restoring your secure sign-in. Your selected piece is saved.</p></section> : !user ? <GoogleSignInScreen onGoogleSignIn={onGoogleSignIn}/> : <>
      <div className="checkout-heading checkout-heading-left"><span className="eyebrow">A THOUGHTFUL CHECKOUT</span><h1>Checkout <Leaf size={25}/></h1><p>Fill in your details and complete your order securely.</p></div>
      <div className="checkout-layout">
        <section className="checkout-main-column">
          <nav className="checkout-steps" aria-label="Checkout progress">{steps.map((step,index)=>{const number=index+1;return <button type="button" key={step} className={number===activeStep?"active":number<activeStep?"complete":""} onClick={()=>number<activeStep&&setActiveStep(number)} disabled={number>activeStep} aria-current={number===activeStep?"step":undefined}><span>{number<activeStep?<Check size={14}/>:number}</span><b>{step}</b></button>;})}</nav>
          {submitted ? <section className="checkout-success"><span><Check size={23}/></span><h2>Your order is confirmed.</h2><p>We’ve saved your order details. Our atelier will contact you to confirm delivery and payment.</p><button className="story-cta" type="button" onClick={onBack}>Continue shopping <ArrowRight size={15}/></button></section> :
          <form className="checkout-form checkout-multistep" onSubmit={submitOrder}>
            <section className="checkout-step-panel" hidden={activeStep!==1}>
              <div className="checkout-section-heading"><span><Truck size={21}/></span><div><h2>Shipping address</h2><p>Enter your delivery details</p></div></div>
              <button className="checkout-location" type="button" onClick={useCurrentLocation}><MapPin size={14}/> Use my current location</button>{locationStatus&&<small className="checkout-location-status" role="status">{locationStatus}</small>}
              <div className="checkout-fields"><label>Full name <i>*</i><input name="customer_name" required autoComplete="name" value={fullName} onChange={event=>setFullName(event.target.value)} placeholder="Your full name"/></label><label>Phone number <i>*</i><input name="phone" required type="tel" autoComplete="tel" value={phone} onChange={event=>setPhone(event.target.value)} placeholder="+91 00000 00000"/></label><label>Email address <i>*</i><input name="email" required type="email" autoComplete="email" value={user.email||""} readOnly/></label><label>Address line 1 <i>*</i><input name="address" required autoComplete="address-line1" placeholder="House number and street" value={address} onChange={event=>setAddress(event.target.value)}/></label><label>Address line 2 <small>(optional)</small><input name="address_line2" autoComplete="address-line2" placeholder="Apartment, suite, etc." value={addressLine2} onChange={event=>setAddressLine2(event.target.value)}/></label><label>City <i>*</i><input name="city" required autoComplete="address-level2" placeholder="Your city" value={city} onChange={event=>setCity(event.target.value)}/></label><label>State <i>*</i><select name="state" required autoComplete="address-level1" value={state} onChange={event=>setState(event.target.value)}><option value="" disabled>Select state or union territory</option>{INDIAN_STATES_AND_UTS.map(value=><option key={value} value={value}>{value}</option>)}</select></label><label>PIN code <i>*</i><input name="postal_code" required inputMode="numeric" pattern="[0-9]{6}" autoComplete="postal-code" placeholder="6-digit PIN" value={pin} onChange={event=>setPin(event.target.value)}/></label></div>
              <label className="checkout-billing-check"><input type="checkbox" defaultChecked/> Use this address for billing as well</label>
              <div className="checkout-section-heading checkout-subheading"><span><Truck size={20}/></span><div><h2>Shipping method</h2><p>Thoughtful packing, delivered with care</p></div></div>
              <label className="checkout-choice selected"><input type="radio" name="shipping_method" value="standard" defaultChecked/><span><b>Standard delivery</b><small>5–7 business days</small></span><strong>Complimentary</strong><Leaf size={16}/></label>
            </section>
            {activeStep===2&&<section className="checkout-step-panel"><div className="checkout-section-heading"><span><CreditCard size={20}/></span><div><h2>Payment method</h2><p>Pay securely through Cashfree</p></div></div><div className="checkout-payment-choice selected"><span className="checkout-cashfree-mark">C</span><span><b>Online payment</b><small>UPI, cards, net banking and other available methods</small></span><ShieldCheck size={18}/></div><div className="checkout-secure-note"><ShieldCheck size={18}/><span>Your payment is processed securely by Cashfree. We only mark your order paid after Cashfree confirms it.</span></div></section>}
            {activeStep===3&&<section className="checkout-step-panel"><div className="checkout-section-heading"><span><Check size={20}/></span><div><h2>Review your order</h2><p>Check your delivery details before continuing to payment</p></div></div><div className="checkout-review-card"><b>{reviewDetails?.customer_name}</b><span>{reviewDetails?.email} · {reviewDetails?.phone}</span><span>{[reviewDetails?.address,reviewDetails?.address_line2,reviewDetails?.city,reviewDetails?.state,reviewDetails?.postal_code].filter(Boolean).join(", ")}</span><button type="button" onClick={()=>setActiveStep(1)}>Edit address</button></div><div className="checkout-review-card"><b>Delivery & payment</b><span>Standard delivery · 5–7 business days</span><span>Online payment via Cashfree</span><input type="hidden" name="payment_method" value="Cashfree"/><button type="button" onClick={()=>setActiveStep(2)}>Edit payment</button></div></section>}
            <div className="checkout-step-actions">{activeStep===1?<button className="checkout-back-link" type="button" onClick={onBackToCart}><ArrowLeft size={15}/> Back to cart</button>:<button className="checkout-back-link" type="button" onClick={()=>setActiveStep(activeStep-1)}><ArrowLeft size={15}/> Back</button>}{activeStep===1&&<button className="story-cta checkout-submit" type="submit">Continue to Payment <ArrowRight size={15}/></button>}{activeStep===2&&<button className="story-cta checkout-submit" type="button" onClick={()=>setActiveStep(3)}>Review Order <ArrowRight size={15}/></button>}{activeStep===3&&<button className="story-cta checkout-submit" type="submit" disabled={submitting}>{submitting?"Connecting to Cashfree…":"Pay securely with Cashfree"} <ArrowRight size={15}/></button>}</div>
            {submitError&&<p className="checkout-order-error" role="alert">{submitError}</p>}
          </form>}
        </section>
        <aside className="checkout-summary"><div className="checkout-summary-heading"><span><Leaf size={19}/></span><div><h2>Order summary</h2><p>Review your items and total amount</p></div></div><div className="checkout-summary-items">{checkoutItems.map((product,index)=><article className="checkout-product" key={`${product.id}-${index}`}><img src={product.image} alt={product.name}/><div><h3>{product.name}</h3>{product.size&&<small>Size: {product.size}</small>}{product.personalization&&<small>Personalized: {product.personalization}</small>}<small>Qty: {product.quantity||1}</small></div><strong>{money(Number(product.price)*(product.quantity||1))}</strong></article>)}</div><div className="checkout-cost-row"><span>Subtotal</span><strong>{money(orderTotal)}</strong></div><div className="checkout-cost-row"><span>Shipping</span><strong>Complimentary</strong></div><div className="checkout-total"><span>Total</span><strong>{money(orderTotal)}</strong></div><div className="checkout-thankyou"><Leaf size={20}/><div><b>Every piece tells a story…</b><span>Thank you for supporting handmade. 💚</span></div><Leaf size={20}/></div></aside>
      </div>
    </>}
  </main>;
}


function App() {
  const [productCatalog, setProductCatalog] = useState(products);
  const [adminMode, setAdminMode] = useState(() => window.location.hash === ADMIN_HASH);
  useEffect(() => {
    const syncAdminRoute = () => setAdminMode(window.location.hash === ADMIN_HASH);
    window.addEventListener("hashchange", syncAdminRoute);
    return () => window.removeEventListener("hashchange", syncAdminRoute);
  }, []);
  const [page,setPage] = useState("home");
  const [selected,setSelected] = useState(products[0]);
  const [cart,setCart] = useState([]);
  const [wishlistIds,setWishlistIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem("atelier-wishlist") || "[]").map(Number); }
    catch { return []; }
  });
  const [search,setSearch] = useState("");
  const [category,setCategory] = useState("All pieces");
  const [toast,setToast] = useState(false);
  const [bagOpen,setBagOpen] = useState(false);
  const [checkoutItem,setCheckoutItem] = useState(null);
  const [checkoutFromBag,setCheckoutFromBag] = useState(false);
  const [user, setUser] = useState(null);
  const [customerProfile, setCustomerProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(Boolean(supabase));
  const [cashfreeReturn, setCashfreeReturn] = useState(() => {
    const orderId = new URLSearchParams(window.location.search).get("order_id");
    return orderId ? { orderId, status: "verifying" } : null;
  });
  const restorePendingCheckout = () => {
    const pending = sessionStorage.getItem(PENDING_CHECKOUT_KEY);
    if (!pending) return;
    try {
      const item = JSON.parse(pending);
      if (item?.id || item?.items?.length) {
        setCheckoutItem(item);
        setPage("checkout");
      }
      sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
    } catch (error) {
      console.error("Unable to restore the pending checkout item.", error);
      sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
    }
  };
  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user || null;
      setUser(sessionUser);
      if (sessionUser) restorePendingCheckout();
    }).catch(error => {
      console.error("Unable to restore the Supabase session.", error);
    }).finally(() => setAuthLoading(false));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) restorePendingCheckout();
      setAuthLoading(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!supabase || !user) {
      setCustomerProfile(null);
      return;
    }
    let active = true;
    supabase.from("customers").select("id,full_name,email,phone,address_line1,address_line2,city,state,postal_code").eq("auth_user_id", user.id).maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error("Unable to load the saved customer profile.", error);
        if (active) setCustomerProfile(data || null);
      });
    return () => { active = false; };
  }, [user]);
  useEffect(() => {
    if (!cashfreeReturn || cashfreeReturn.status !== "verifying" || authLoading) return;
    let active = true;
    const verifyPayment = async () => {
      try {
        if (!supabase) throw new Error("Payment verification is unavailable. Contact the atelier with your Cashfree order reference.");
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error("Sign in again to verify this payment.");
        const response = await fetch("/api/payments/cashfree/verify-order", {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ orderId: cashfreeReturn.orderId })
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || "We could not verify this payment yet.");
        if (!active) return;
        setCashfreeReturn({ ...result, orderId: cashfreeReturn.orderId });
        if (result.status === "paid") setCart([]);
      } catch (error) {
        if (active) setCashfreeReturn({ orderId: cashfreeReturn.orderId, status: "error", message: error.message });
      } finally {
        const cleanUrl = `${window.location.pathname}${window.location.hash}`;
        window.history.replaceState(null, "", cleanUrl);
      }
    };
    verifyPayment();
    return () => { active = false; };
  }, [authLoading, cashfreeReturn?.orderId, cashfreeReturn?.status]);
  const signInWithGoogle = async () => {
    if (!supabase) {
      setToast(true);
      console.error("Google sign-in requires Supabase browser credentials.");
      return;
    }
    if (checkoutItem) {
      sessionStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(checkoutItem));
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin }
    });
    if (error) {
      setToast(true);
      console.error("Google sign-in failed.", error);
    }
  };
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Sign out failed.", error);
    else setPage("home");
  };
  useEffect(() => {
    if (!supabase) {
      console.error("Supabase is not configured with browser-safe VITE_ credentials.");
      return;
    }

    let active = true;
    const loadProductImages = async () => {
      let catalog = products;
      const { data: rows, error: catalogError } = await supabase
        .from("products")
        .select("id,name,price,category,image_url,gallery,tag,description,stock_quantity")
        .order("id");

      if (catalogError) {
        console.warn("Unable to load the products table; using the built-in catalog until the admin schema is applied.", catalogError);
      } else if (rows?.length) {
        catalog = rows.map(row => {
          const image = row.image_url || `${PRODUCT_IMG}p${row.id}.webp`;
          return {
            ...row,
            image,
            gallery: Array.isArray(row.gallery) && row.gallery.length ? row.gallery : [{ src: image }],
            stock_quantity: row.stock_quantity ?? null
          };
        });
      }

      const { data: rootFiles, error: rootError } = await supabase.storage.from(productStorageBucket).list("", { limit: 100 });
      const { data: catalogFiles, error: catalogStorageError } = await supabase.storage.from(productStorageBucket).list("catalog", { limit: 100 });
      if (rootError || catalogStorageError) console.error("Unable to load product images from Supabase Storage.", rootError || catalogStorageError);
      const availableFiles = new Set([
        ...(rootFiles || []).map(file => file.name),
        ...(catalogFiles || []).map(file => `catalog/${file.name}`)
      ]);
      const withStorageImages = catalog.map(product => {
        const gallery = product.gallery.map(image => {
          const fileName = image.src.replace(PRODUCT_IMG, "");
          if (!availableFiles.has(fileName)) return image;
          return { ...image, src: supabase.storage.from(productStorageBucket).getPublicUrl(fileName).data.publicUrl };
        });
        const imageFileName = product.image.replace(PRODUCT_IMG, "");
        return {
          ...product,
          image: availableFiles.has(imageFileName)
            ? supabase.storage.from(productStorageBucket).getPublicUrl(imageFileName).data.publicUrl
            : product.image,
          gallery
        };
      });

      if (active) {
        setProductCatalog(withStorageImages);
        setSelected(current => withStorageImages.find(product => product.id === current.id) || current);
      }
    };

    loadProductImages();
    return () => { active = false; };
  }, []);
  const navigate = (next,product) => { if(product) setSelected(product); setPage(next); window.scrollTo({top:0,behavior:"smooth"}); };
  const goShop = (cat="All pieces") => { setCategory(cat); navigate("shop"); };
  const goSection = id => { setPage("home"); setTimeout(()=>document.getElementById(id)?.scrollIntoView({behavior:"smooth"}),80); };
  const startCheckout = (items, fromBag = false) => {
    const checkoutItems = items.map(item => {
      const catalogItem = productCatalog.find(product => product.id === item.id);
      return { ...(catalogItem || {}), ...item, quantity: item.quantity || 1 };
    });
    setCheckoutItem({ items: checkoutItems });
    setCheckoutFromBag(fromBag);
    setBagOpen(false);
    setPage("checkout");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const buyNow = product => startCheckout([product]);
  const checkoutCart = () => startCheckout(cart, true);
  const returnToCart = () => { if(checkoutFromBag){setPage("home");setBagOpen(true);window.scrollTo({top:0,behavior:"smooth"});}else navigate("home"); };
  const add = product => {
    setCart(old => {
      const match = old.findIndex(item => item.id === product.id && item.size === product.size && item.personalization === product.personalization);
      if(match < 0) return [...old, {...product, quantity: product.quantity || 1}];
      return old.map((item,index) => index === match ? {...item, quantity:(item.quantity || 1) + (product.quantity || 1)} : item);
    });
    setToast(true);
  };
  const toggleWishlist = product => setWishlistIds(current => current.includes(Number(product.id)) ? current.filter(id => id !== Number(product.id)) : [...current, Number(product.id)]);
  const isWishlisted = id => wishlistIds.includes(Number(id));
  const wishlistProducts = productCatalog.filter(product => isWishlisted(product.id));
  useEffect(() => { localStorage.setItem("atelier-wishlist", JSON.stringify(wishlistIds)); }, [wishlistIds]);
  const removeFromCart = index => setCart(old => old.filter((_, itemIndex) => itemIndex !== index));
  const changeCartQuantity = (index, delta) => setCart(old => old.map((item, itemIndex) => itemIndex === index ? {...item, quantity:Math.max(1,(item.quantity || 1) + delta)} : item));
  useEffect(()=>{ if(!toast) return; const t=setTimeout(()=>setToast(false),3000); return ()=>clearTimeout(t); },[toast,cart.length]);
  if (adminMode) return <AdminPanel products={productCatalog} onProductsChange={updated=>{setProductCatalog(updated);setSelected(current=>updated.find(product=>product.id===current.id)||current);}} onExit={() => { window.history.replaceState(null, "", window.location.pathname + window.location.search); setAdminMode(false); }} />;
  return <><Header page={page} navigate={navigate} goShop={goShop} goSection={goSection} cartCount={cart.reduce((n,p)=>n+(p.quantity||1),0)} wishlistCount={wishlistIds.length} search={search} setSearch={setSearch} onBag={()=>setBagOpen(true)} onWishlist={()=>navigate("wishlist")} user={user} onGoogleSignIn={signInWithGoogle}/>
    {cashfreeReturn ? <main className="checkout-page"><section className="checkout-success" aria-live="polite"><span>{cashfreeReturn.status==="paid"?<Check size={23}/>:<ShieldCheck size={22}/>}</span><h2>{cashfreeReturn.status==="paid"?"Payment confirmed":cashfreeReturn.status==="verifying"?"Verifying your payment":cashfreeReturn.status==="pending"?"Payment is processing":"Payment needs confirmation"}</h2><p>{cashfreeReturn.status==="paid"?"Cashfree confirmed your payment. Your order is now being prepared.":cashfreeReturn.status==="verifying"?"We’re checking your payment securely with Cashfree.":cashfreeReturn.status==="pending"?"Cashfree has not confirmed the payment yet. Check again shortly.":cashfreeReturn.message||"If your account was charged, please contact the atelier with this order reference."}</p><small>Order reference: {cashfreeReturn.orderId}</small>{cashfreeReturn.status!=="paid"&&<button className="checkout-back-link" type="button" onClick={()=>setCashfreeReturn(current=>({...current,status:"verifying",message:""}))}>Check payment status</button>}<button className="story-cta checkout-submit" type="button" onClick={()=>{setCashfreeReturn(null);navigate("home");}}>Continue shopping <ArrowRight size={15}/></button></section></main> : <>
      {page==="home"&&<Home onOpen={p=>navigate("product",p)} onAdd={add} goShop={goShop} search={search} productCatalog={productCatalog} isWishlisted={isWishlisted} onToggleWishlist={toggleWishlist}/>}
      {page==="shop"&&<Shop onOpen={p=>navigate("product",p)} onAdd={add} search={search} category={category} setCategory={setCategory} productCatalog={productCatalog} isWishlisted={isWishlisted} onToggleWishlist={toggleWishlist}/>}
      {page==="product"&&<ProductDetail key={selected.id} product={selected} onAdd={add} onBuyNow={buyNow} navigate={navigate} goShop={goShop} productCatalog={productCatalog} isWishlisted={isWishlisted} onToggleWishlist={toggleWishlist}/>}
      {page==="wishlist"&&<Wishlist products={wishlistProducts} onOpen={p=>navigate("product",p)} onAdd={add} isWishlisted={isWishlisted} onToggleWishlist={toggleWishlist} onShop={()=>goShop()}/>}
      {page==="account"&&user&&<CustomerAccount user={user} customerProfile={customerProfile} productCatalog={productCatalog} onSignOut={signOut} onShop={()=>goShop()}/>}
      {page==="checkout"&&checkoutItem&&<Checkout item={checkoutItem} user={user} customerProfile={customerProfile} authLoading={authLoading} onBack={()=>navigate("home")} onBackToCart={returnToCart} onPlaceOrder={async details=>{
        if(!supabase)return {error:"Online payment is unavailable because Supabase is not configured."};
        const {data:{session}}=await supabase.auth.getSession();
        if(!session?.access_token)return {error:"Your sign-in has expired. Sign in again to continue with payment."};
        const response=await fetch("/api/payments/cashfree/create-order",{
          method:"POST",
          headers:{"content-type":"application/json",authorization:`Bearer ${session.access_token}`},
          body:JSON.stringify({details,items:(checkoutItem.items||[checkoutItem]).map(product=>({product_id:product.id,quantity:product.quantity||1,size:product.size||null,personalization:product.personalization||null}))})
        });
        const result=await response.json().catch(()=>({}));
        return response.ok?result:{error:result.error||"Cashfree could not start the payment. Please try again."};
      }} user={user} onGoogleSignIn={signInWithGoogle}/>}
      {bagOpen&&<><button className="cart-backdrop" aria-label="Close shopping bag" onClick={()=>setBagOpen(false)}/><CartDrawer cart={cart} onClose={()=>setBagOpen(false)} onRemove={removeFromCart} onQuantityChange={changeCartQuantity} onCheckout={checkoutCart}/></>}
      {toast&&<div className="cart-toast" role="status"><ShoppingBag size={16}/><span>Added to your bag</span><button onClick={()=>setToast(false)}>Dismiss</button></div>}
    </>}
    <Footer goShop={goShop}/>
    <FloatingSocials/>
  </>;
}
createRoot(document.getElementById("root")).render(<App/>);
