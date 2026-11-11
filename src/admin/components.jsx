import { money } from "../lib/format.js";
import React from "react";
import { Leaf, Sprout } from "lucide-react";

export const Status = ({ children }) => (
  <span className={"admin-status status-" + String(children).toLowerCase().replaceAll(" ", "-")}>
    {children}
  </span>
);
export const Metric = ({ icon: Icon, label, value, trend }) => (
  <article className="admin-metric">
    <span className="admin-metric-icon">
      <Icon size={20} />
    </span>
    <div>
      <small>{label}</small>
      <strong>{value}</strong>
      {trend && <p>{trend}</p>}
    </div>
    <Sprout className="admin-metric-sprig" size={40} />
  </article>
);
export const DemoNote = () => (
  <div className="admin-demo-note">
    <b>New store</b> Order, customer, sales, discount, and stock data will appear here when
    recorded.
  </div>
);
export const Empty = ({ title, children }) => (
  <div className="admin-empty">
    <Leaf size={22} />
    <h3>{title}</h3>
    <p>{children}</p>
  </div>
);
export const Chart = ({
  title = "No data yet",
  detail = "Reports will appear after store activity is connected.",
}) => (
  <div className="admin-chart-empty">
    <Empty title={title}>{detail}</Empty>
  </div>
);

export function DiscountCategories({ categories, selected }) {
  return (
    <fieldset className="admin-discount-categories">
      <legend>Applicable categories</legend>
      <small>Leave all unchecked to apply to all products.</small>
      {[...new Set([...categories, ...selected])].map((category) => (
        <label key={category}>
          <input
            type="checkbox"
            name="applicableTo"
            value={category}
            defaultChecked={selected.includes(category)}
          />
          {category}
        </label>
      ))}
    </fieldset>
  );
}

const saleMonth = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  timeZone: "Asia/Kolkata",
});
const monthLabel = new Intl.DateTimeFormat("en-IN", {
  year: "numeric",
  month: "short",
  timeZone: "UTC",
});

export function SalesChart({ orders, state }) {
  if (state === "loading")
    return <Chart title="Loading sales…" detail="Retrieving order history." />;
  if (state === "error")
    return (
      <Chart title="Could not load sales" detail="Order history will refresh automatically." />
    );
  if (!orders.length)
    return <Chart title="No paid sales yet" detail="Confirmed payments will appear here." />;
  const totals = new Map();
  for (const order of orders) {
    const parts = saleMonth.formatToParts(new Date(order.created_at));
    const month =
      parts.find((p) => p.type === "year").value +
      "-" +
      parts.find((p) => p.type === "month").value;
    totals.set(month, (totals.get(month) || 0) + order.total);
  }
  const peak = Math.max(...totals.values(), 1);
  return (
    <ul className="admin-monthly-sales" aria-label="Paid sales by month">
      {Array.from(totals)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, total]) => (
          <li key={month}>
            <span>{monthLabel.format(new Date(month + "-01T00:00:00Z"))}</span>
            <div aria-hidden="true">
              <i style={{ width: (total / peak) * 100 + "%" }} />
            </div>
            <strong>{money(total)}</strong>
          </li>
        ))}
    </ul>
  );
}
