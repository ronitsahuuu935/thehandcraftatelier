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
