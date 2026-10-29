import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Search, UserRound, Heart, Leaf, ShoppingBag, Menu, X, ArrowRight, Star, SlidersHorizontal, Plus, Minus, ChevronDown } from "lucide-react";
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

function Header({ page, navigate, goShop, goSection, cartCount, search, setSearch, onBag, user, onGoogleSignIn, onSignOut }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return <header className="site-header">
    <div className="announcement">A little love, in every stitch. Complimentary shipping on orders ₹2,000+</div>
    <div className="brandbar">
      <button className="icon-btn mobile-menu" aria-label="Open menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X/> : <Menu/>}</button>
      <button className="wordmark" onClick={() => navigate("home")}><span>The Hand Craft Atelier</span><small>HANDMADE · HEARTFELT · FOREVER</small></button>
      <div className="search-inline"><Search size={17}/><input placeholder="Find something lovely" aria-label="Search products" value={search} onChange={e => { setSearch(e.target.value); if (e.target.value && page === "product") navigate("shop"); }} /></div>
      <div className="header-actions">
        <button className="icon-btn" aria-label={user ? "Sign out" : "Sign in with Google"} title={user ? `Sign out ${user.email || ""}` : "Sign in with Google"} onClick={user ? onSignOut : onGoogleSignIn}><UserRound/></button>
        <button className="icon-btn" aria-label="Wishlist"><Heart/></button>
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
      <div><h4>THE ATELIER</h4><a>Our story</a><a>Our craft</a><a>The journal</a><a>Made slowly. Kept forever.</a></div>
    </section>
    <div className="legal"><span>© 2026 The Hand Craft Atelier. All lovingly reserved.</span></div>
  </footer>;
}

function ProductCard({ product, onOpen, onAdd }) {
  const [liked, setLiked] = useState(false);
  return <article className="product-card">
    <div className="product-image" onClick={() => onOpen(product)} role="button" tabIndex={0} onKeyDown={e=>e.key==="Enter"&&onOpen(product)}>
      <img src={product.image} alt={product.name} loading="lazy" style={product.pos?{objectPosition:product.pos}:undefined} onError={e=>{e.currentTarget.style.opacity=".15"}}/>
      {product.tag && <span className="product-tag">{product.tag}</span>}
      <button className={"wishlist "+(liked?"liked":"")} aria-label="Toggle wishlist" onClick={e=>{e.stopPropagation();setLiked(!liked)}}><Heart size={17} fill={liked?"currentColor":"none"}/></button>
    </div>
    <div className="product-info"><button className="product-name" onClick={() => onOpen(product)}>{product.name}</button><strong>{money(product.price)}</strong><p className="product-craft-note">Handcrafted with care</p><button className="quick-add" onClick={() => onAdd(product)}>Add to bag <Plus size={13}/></button></div>
  </article>;
}

function ProductGrid({ items, onOpen, onAdd }) {
  return <div className="product-grid">{items.map(p=><ProductCard key={p.id} product={p} onOpen={onOpen} onAdd={onAdd}/>)}</div>;
}

function Home({ onOpen, onAdd, goShop, search, productCatalog }) {
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
    <section className="section-wrap"><div className="section-heading"><div><span className="eyebrow">FROM THE ATELIER</span><h2>Featured Pieces</h2><p>Thoughtfully stitched designs from the collection.</p></div><button className="text-link" onClick={()=>goShop()}>View all <ArrowRight size={15}/></button></div><ProductGrid items={visible.slice(0,4)} onOpen={onOpen} onAdd={onAdd}/></section>
    <section className="story-split" id="story"><div className="story-image"><img src={images.artisan} alt="Woman in a linen co-ord set standing among pink flowers" loading="lazy"/></div><div className="story-copy"><span className="story-leaf story-leaf-top">⌁</span><span className="eyebrow">A SLOWER KIND OF BEAUTY <i/></span><h2>More Than Just<br/>Products</h2><p>Every piece is a result of patience, skill and a deep love for traditional craftsmanship. Made slowly, to be treasured for years.</p><div className="story-benefits"><div><span><Leaf size={25} strokeWidth={1.6}/></span><strong>HANDCRAFTED<br/>WITH CARE</strong></div><div><span><Heart size={25} strokeWidth={1.6}/></span><strong>TIMELESS<br/>DESIGNS</strong></div><div><span><Leaf size={25} strokeWidth={1.6}/></span><strong>SUPPORTS<br/>ARTISANS</strong></div></div><button className="story-cta" onClick={()=>goShop()}>Shop the collection <ArrowRight size={17}/></button><span className="story-leaf story-leaf-bottom">⌁</span></div></section>
    <section className="section-wrap"><div className="section-heading"><div><span className="eyebrow">FRESH FROM THE ATELIER</span><h2>New Arrivals</h2><p>Fresh designs for your special moments.</p></div><button className="text-link" onClick={()=>goShop()}>View all <ArrowRight size={15}/></button></div><ProductGrid items={visible.slice(4,8).length ? visible.slice(4,8) : visible.slice(0,4)} onOpen={onOpen} onAdd={onAdd}/></section>
    <section className="testimonial">
      <div className="testimonial-copy"><span className="eyebrow"><Leaf size={24}/>OUR PROMISE</span><h2>Made with <em>thoughtful</em> detail</h2><blockquote><span className="quote-mark">“</span><span>Every piece is stitched slowly, with care in every detail.<br/>Made to be worn, gifted, and kept close.</span></blockquote><p className="testimonial-author"><span className="author-mark"><Leaf size={18}/></span> Handmade, heartfelt, forever</p></div>
      <div className="testimonial-art"><img src={images.floralEmbroideryHoop} alt="Floral embroidery hoop" loading="lazy"/></div>
    </section>
    <section className="journal-strip" id="journal"><img src={images.journal2} alt="Hand-embroidered hoop with tiny birds and flowers on turquoise fabric" style={{objectPosition:"center 52%"}} loading="lazy"/><div><span className="eyebrow">NOTES FROM THE ATELIER <i/></span><h2>Made to be <em>kept close.</em></h2><p>Thoughtful gifts, little rituals, and the beauty of making things slowly.</p><button className="story-cta" onClick={()=>goShop()}>Discover more <ArrowRight size={15}/></button></div><div className="journal-decoration" aria-hidden="true"/><Leaf className="journal-sprig sprig-left" aria-hidden="true"/><Leaf className="journal-sprig sprig-right" aria-hidden="true"/><span className="journal-heart" aria-hidden="true">♡</span></section>
  </main>;
}

function Shop({ onOpen, onAdd, search, category, setCategory, productCatalog }) {
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
        <ProductGrid items={filtered} onOpen={onOpen} onAdd={onAdd}/>
        {filtered.length===0&&<div className="empty-state">No pieces match those filters. Try clearing your filters.</div>}
      </section>
    </div>
    <section className="gift-banner"><img src={images.gift} alt="Hand-embroidered hoop with a hand holding coral flowers on peach fabric" style={{objectPosition:"50% 58%"}} loading="lazy"/><div><span className="eyebrow">GIVE SOMETHING MEANINGFUL</span><h2>The Perfect Gift</h2><p>Thoughtful. Handmade. Meaningful.</p><button className="btn primary" onClick={()=>{setCategory("Personalized");window.scrollTo({top:450,behavior:"smooth"})}}>Explore gifts <ArrowRight size={15}/></button></div></section>
  </main>;
}

function ProductDetail({ product, onAdd, onBuyNow, navigate, goShop, productCatalog }) {
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
      <div className="detail-info"><span className="eyebrow">MADE SLOWLY, KEPT FOREVER</span><h1>{product.name}</h1><p className="product-craft-note">Hand-embroidered with care</p><div className="detail-price">{money(product.price)}</div><p className="detail-description">Hand-embroidered with care, stitch by stitch. A little everyday beauty you can wear.</p>
        <div className="option-label">Size</div><div className="size-options">{sizes.map(s=><button key={s} className={size===s?"selected":""} onClick={()=>setSize(s)}>{s}</button>)}</div>
        <label className="personal-label">Personalization <span>Optional</span><input value={personalization} onChange={e=>setPersonalization(e.target.value)} placeholder="Add a name or short message"/></label>
        <div className="option-label">Quantity</div><div className="quantity"><button onClick={()=>setQty(Math.max(1,qty-1))}><Minus size={14}/></button><span>{qty}</span><button onClick={()=>setQty(qty+1)}><Plus size={14}/></button></div>
        <button className="btn primary add-large" onClick={()=>onAdd({...product,quantity:qty,size,personalization})}>Add to bag — {money(product.price*qty)}</button><button className="btn secondary buy-large" onClick={()=>onBuyNow({...product,quantity:qty,size,personalization})}>Buy now</button>
        <div className="trust-row"><span>♡ Handmade with care</span><span>♧ Dispatch in 5–7 days</span><span>✧ Free shipping above ₹2,000</span></div>
        <div className="detail-tabs">{["Details","Shipping","Care"].map(t=><button key={t} className={activeTab===t?"selected":""} onClick={()=>setActiveTab(t)}>{t}</button>)}</div>
        <div className="tab-content">{activeTab==="Details"?"Soft, breathable fabric with hand embroidery in cotton thread. Each piece is finished by hand, so small variations make it yours.":activeTab==="Shipping"?"Carefully packed and dispatched in 5–7 business days. Complimentary shipping on orders above ₹2,000.":"Gentle hand wash in cold water. Do not wring or bleach. Dry in shade and iron on the reverse side."}</div>
      </div></div>
    <section className="section-wrap related"><div className="section-heading"><div><span className="eyebrow">A FEW MORE LOVELY THINGS</span><h2>You may also like</h2></div><button className="text-link" onClick={()=>goShop()}>Shop all <ArrowRight size={15}/></button></div><ProductGrid items={productCatalog.filter(p=>p.id!==product.id).slice(0,4)} onOpen={p=>navigate("product",p)} onAdd={onAdd}/></section>
  </main>;
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

function Checkout({ item, onBack, onPlaceOrder, user, onGoogleSignIn }) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pin, setPin] = useState("");
  const [locationStatus, setLocationStatus] = useState("");
  const checkoutItems = item.items || [item];
  const orderTotal = checkoutItems.reduce((total, product) => total + Number(product.price || 0) * (product.quantity || 1), 0);
  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Location access is not supported by this browser.");
      return;
    }
    if (!googleMapsApiKey) {
      setLocationStatus("Location lookup is not configured yet.");
      return;
    }

    setLocationStatus("Requesting your location...");
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
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
        setPin(component("postal_code"));
        setLocationStatus("Address filled from your location.");
      } catch (error) {
        console.error("Unable to convert location into an address.", error);
        setLocationStatus("We could not find an address for that location.");
      }
    }, error => {
      const message = error.code === error.PERMISSION_DENIED
        ? "Location permission was not granted."
        : "We could not access your location.";
      setLocationStatus(message);
    }, { enableHighAccuracy: true, timeout: 10000 });
  };
  const submitOrder = async event => {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    const details = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const error = await onPlaceOrder(details);
      if (error) setSubmitError(error);
      else setSubmitted(true);
    } catch {
      setSubmitError("We could not save your order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
  return <main className="checkout-page">
    {user && <div className="checkout-heading"><span className="eyebrow">A THOUGHTFUL CHECKOUT</span><h1>Complete your order</h1><p>Your handmade piece is almost on its way.</p></div>}
    {!user ? <GoogleSignInScreen onGoogleSignIn={onGoogleSignIn}/> :
    submitted ? <section className="checkout-success"><span>✓</span><h2>Thank you for your order.</h2><p>We have received your details and will be in touch shortly.</p><button className="story-cta" onClick={onBack}>Continue shopping <ArrowRight size={15}/></button></section> :
      <form className="checkout-layout" onSubmit={submitOrder}>
        <section className="checkout-form"><h2>Delivery details</h2><button className="text-link" type="button" onClick={useCurrentLocation}>Use my current location <ArrowRight size={15}/></button>{locationStatus&&<small role="status">{locationStatus}</small>}<div className="checkout-fields"><label>Full name<input name="customer_name" required autoComplete="name" placeholder="Your full name"/></label><label>Email address<input name="email" required type="email" autoComplete="email" placeholder="you@example.com"/></label><label>Phone number<input name="phone" required type="tel" autoComplete="tel" placeholder="+91 00000 00000"/></label><label>Address<input name="address" required autoComplete="street-address" placeholder="House number and street" value={address} onChange={event=>setAddress(event.target.value)}/></label><label>City<input name="city" required autoComplete="address-level2" placeholder="Your city" value={city} onChange={event=>setCity(event.target.value)}/></label><label>PIN code<input name="postal_code" required inputMode="numeric" pattern="[0-9]{6}" autoComplete="postal-code" placeholder="000000" value={pin} onChange={event=>setPin(event.target.value)}/></label></div><h2 className="payment-title">Payment</h2><div className="payment-note">Cash on delivery and payment instructions will be confirmed with you after placing the order.</div>{submitError&&<p className="checkout-order-error" role="alert">{submitError}</p>}<button className="story-cta checkout-submit" type="submit" disabled={submitting}>{submitting?"Placing order…":"Place order"} <ArrowRight size={15}/></button></section>
        <aside className="checkout-summary"><h2>Order summary</h2>{checkoutItems.map((product,index)=><div className="checkout-product" key={`${product.id}-${index}`}><img src={product.image} alt={product.name}/><div><h3>{product.name}</h3>{product.size&&<small>Size: {product.size}</small>}{product.personalization&&<small>Personalized: {product.personalization}</small>}<p>{money(product.price)} × {product.quantity||1}</p></div></div>)}<div className="checkout-total"><span>Subtotal</span><strong>{money(orderTotal)}</strong></div><small>Complimentary shipping on orders above ₹2,000.</small></aside>
      </form>}
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
  const [search,setSearch] = useState("");
  const [category,setCategory] = useState("All pieces");
  const [toast,setToast] = useState(false);
  const [bagOpen,setBagOpen] = useState(false);
  const [checkoutItem,setCheckoutItem] = useState(null);
  const [user, setUser] = useState(null);
  const restorePendingCheckout = () => {
    const pending = sessionStorage.getItem(PENDING_CHECKOUT_KEY);
    if (!pending) return;
    try {
      const item = JSON.parse(pending);
      if (item?.id) {
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
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
      if (data.session?.user) restorePendingCheckout();
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) restorePendingCheckout();
    });
    return () => listener.subscription.unsubscribe();
  }, []);
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

      const { data, error } = await supabase.storage.from(productStorageBucket).list("", { limit: 100 });
      if (error) console.error("Unable to load product images from Supabase Storage.", error);
      const availableFiles = new Set((data || []).map(file => file.name));
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
  const buyNow = product => { setCheckoutItem({items:[product]}); setBagOpen(false); navigate("checkout"); };
  const checkoutCart = () => { setCheckoutItem({items:cart}); setBagOpen(false); navigate("checkout"); };
  const add = product => {
    setCart(old => {
      const match = old.findIndex(item => item.id === product.id && item.size === product.size && item.personalization === product.personalization);
      if(match < 0) return [...old, {...product, quantity: product.quantity || 1}];
      return old.map((item,index) => index === match ? {...item, quantity:(item.quantity || 1) + (product.quantity || 1)} : item);
    });
    setToast(true);
  };
  const removeFromCart = index => setCart(old => old.filter((_, itemIndex) => itemIndex !== index));
  const changeCartQuantity = (index, delta) => setCart(old => old.map((item, itemIndex) => itemIndex === index ? {...item, quantity:Math.max(1,(item.quantity || 1) + delta)} : item));
  useEffect(()=>{ if(!toast) return; const t=setTimeout(()=>setToast(false),3000); return ()=>clearTimeout(t); },[toast,cart.length]);
  if (adminMode) return <AdminPanel products={productCatalog} onProductsChange={updated=>{setProductCatalog(updated);setSelected(current=>updated.find(product=>product.id===current.id)||current);}} onExit={() => { window.history.replaceState(null, "", window.location.pathname + window.location.search); setAdminMode(false); }} />;
  return <><Header page={page} navigate={navigate} goShop={goShop} goSection={goSection} cartCount={cart.reduce((n,p)=>n+(p.quantity||1),0)} search={search} setSearch={setSearch} onBag={()=>setBagOpen(true)} user={user} onGoogleSignIn={signInWithGoogle} onSignOut={signOut}/>
    {page==="home"&&<Home onOpen={p=>navigate("product",p)} onAdd={add} goShop={goShop} search={search} productCatalog={productCatalog}/>}
    {page==="shop"&&<Shop onOpen={p=>navigate("product",p)} onAdd={add} search={search} category={category} setCategory={setCategory} productCatalog={productCatalog}/>}
    {page==="product"&&<ProductDetail key={selected.id} product={selected} onAdd={add} onBuyNow={buyNow} navigate={navigate} goShop={goShop} productCatalog={productCatalog}/>}
    {page==="checkout"&&checkoutItem&&<Checkout item={checkoutItem} onBack={()=>navigate("home")} onPlaceOrder={async details=>{
      if(!supabase)return "Order placement is unavailable because Supabase is not configured.";
      const checkoutItems=checkoutItem.items||[checkoutItem];
      const orderItems=checkoutItems.map(product=>({product_id:product.id,name:product.name,unit_price:Number(product.price),quantity:product.quantity||1,size:product.size||null,personalization:product.personalization||null}));
      const total=orderItems.reduce((sum,product)=>sum+product.unit_price*product.quantity,0);
      const {error}=await supabase.from("orders").insert({customer_id:user.id,customer_name:String(details.customer_name||"").trim(),email:String(details.email||"").trim(),phone:String(details.phone||"").trim(),address:String(details.address||"").trim(),city:String(details.city||"").trim(),postal_code:String(details.postal_code||"").trim(),items:orderItems,total,payment_method:"Cash on delivery",status:"Pending confirmation"});
      if(!error)setCart([]);
      return error?"We could not save your order: "+error.message:null;
    }} user={user} onGoogleSignIn={signInWithGoogle}/>}
    <Footer goShop={goShop}/>
    <FloatingSocials/>
    {bagOpen&&<><button className="cart-backdrop" aria-label="Close shopping bag" onClick={()=>setBagOpen(false)}/><CartDrawer cart={cart} onClose={()=>setBagOpen(false)} onRemove={removeFromCart} onQuantityChange={changeCartQuantity} onCheckout={checkoutCart}/></>}
    {toast&&<div className="cart-toast" role="status"><ShoppingBag size={16}/><span>Added to your bag</span><button onClick={()=>setToast(false)}>Dismiss</button></div>}
  </>;
}
createRoot(document.getElementById("root")).render(<App/>);
