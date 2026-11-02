import React, { useState } from "react";
import { ArrowUpRight, Camera, Gift, Heart, Leaf, Mail, MessageCircle, Phone, Send, UserRound } from "lucide-react";
import "./contact.css";

export default function ContactUs({ contact }) {
  const [prepared, setPrepared] = useState(false);
  const openEmail = event => {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const subject = `${fields.get("enquiry")} — ${fields.get("name").trim()}`;
    const body = `Name: ${fields.get("name").trim()}\nEmail: ${fields.get("email").trim()}\n\n${fields.get("message").trim()}`;
    window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setPrepared(true);
  };
  return <main className="contact-page">
    <section className="contact-hero" aria-labelledby="contact-title">
      <div className="contact-hero-copy"><h1 id="contact-title">Contact Us</h1><p className="contact-subtitle"><span/>Let’s Get in Touch<span/></p><p>Have a question, a custom order, or a special idea?<br/>We’d love to hear from you!</p></div>
      <svg className="contact-thread" viewBox="0 0 600 240" fill="none" aria-hidden="true"><path d="M0 222C130 250 170 100 260 162S400 201 435 90C450 45 489 30 482 13C465-20 422 40 450 63C474 85 524 13 501 3C475-8 479 53 470 82"/></svg>
    </section>
    <div className="contact-content">
      <section className="contact-message-panel" aria-labelledby="message-title">
        <div className="contact-panel-heading"><Leaf aria-hidden="true"/><h2 id="message-title">Send us a Message</h2><Leaf aria-hidden="true"/></div>
        <p className="contact-form-intro">A little conversation is where something lovely begins.</p>
        <form className="contact-form" onSubmit={openEmail} onChange={() => setPrepared(false)}>
          <div className="contact-form-pair">
            <label><span><UserRound size={18} aria-hidden="true"/>Your Name *</span><input name="name" autoComplete="name" required maxLength={100} placeholder="Your name" pattern=".*\S.*"/></label>
            <label><span><Mail size={18} aria-hidden="true"/>Your Email *</span><input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@example.com"/></label>
          </div>
          <label><span>Enquiry Type *</span><select name="enquiry" required defaultValue=""><option value="" disabled>Select an enquiry type</option><option>Custom Embroidery</option><option>Personalized Order</option><option>Order Support</option><option>General Enquiry</option></select></label>
          <label><span><MessageCircle size={18} aria-hidden="true"/>Your Message *</span><textarea name="message" required maxLength={3000} rows={5} placeholder="Tell us about your idea or how we can help…"/></label>
          <button className="contact-send" type="submit"><Send size={20} aria-hidden="true"/>Prepare Email</button>
          <p className="contact-form-hint">Opens your email app with your message ready to send.</p>
          {prepared && <p className="contact-form-status" role="status">Send your draft from your email app. If no email app opens, you can reach us on WhatsApp instead.</p>}
        </form>
        <Leaf className="contact-panel-leaf" aria-hidden="true"/>
      </section>
      <aside className="contact-details" aria-labelledby="contact-details-title">
        <h2 id="contact-details-title">Get in Touch</h2>
        <div className="contact-direct-links">
          {[{title:"Email Us", Icon:Mail, detail:contact.email, href:`mailto:${contact.email}`}, {title:"WhatsApp", Icon:MessageCircle, detail:contact.phoneLabel, href:contact.whatsapp, external:true}, {title:"Call Us", Icon:Phone, detail:contact.phoneLabel, href:`tel:${contact.phone}`}].map(({title, Icon, detail, href, external}) => <a className="contact-direct-link" key={title} href={href} {...(external ? {target:"_blank", rel:"noopener noreferrer"} : {})}><span className="contact-icon"><Icon size={28} strokeWidth={1.6} aria-hidden="true"/></span><span><strong>{title}</strong><span>{detail}</span></span><ArrowUpRight size={17} aria-hidden="true"/></a>)}
        </div>
        <section className="contact-instagram"><div className="contact-panel-heading"><Leaf aria-hidden="true"/><h2>Connect With Us</h2><Leaf aria-hidden="true"/></div><a href={contact.instagram} target="_blank" rel="noopener noreferrer"><Camera size={34} strokeWidth={1.5} aria-hidden="true"/><span>Follow us on Instagram<strong>@thehandcraftatelier</strong></span><ArrowUpRight size={22} aria-hidden="true"/></a><span className="contact-lace" aria-hidden="true"/></section>
        <p className="contact-personal-note">Small stitches, thoughtful conversations.<br/><Heart size={18} aria-hidden="true"/></p>
      </aside>
    </div>
    <section className="contact-benefits" aria-label="How we can help">{[{Icon:Heart, title:"Custom Embroidery", detail:"Enquiries"},{Icon:Gift,title:"Personalized",detail:"Orders"},{Icon:Leaf,title:"General",detail:"Support"}].map(({Icon,title,detail}) => <div key={title}><Icon size={46} strokeWidth={1.1} aria-hidden="true"/><h2>{title}<br/>{detail}</h2></div>)}</section>
    <div className="contact-stitched-edge" aria-hidden="true"><span>♡</span></div>
  </main>;
}
