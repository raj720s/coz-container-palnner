import type { Metadata } from "next";
import UserDashboardClient from "./UserDashboardClient";

export const metadata: Metadata = {
  title: "Dashboard | COZ",
  description: "System overview and operational metrics for users",
};

export default function UserDashboard() {
  return <UserDashboardClient />;
}