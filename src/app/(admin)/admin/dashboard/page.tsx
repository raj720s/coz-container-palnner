import type { Metadata } from "next";
import AdminDashboardClient from "./AdminDashboardClient";

export const metadata: Metadata = {
  title: "Dashboard | COZ",
  description: "System overview and operational metrics for administrators",
};

export default function AdminDashboard() {
  return <AdminDashboardClient />;
}