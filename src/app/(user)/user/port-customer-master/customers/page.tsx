import type { Metadata } from "next";
import CustomersClient from "./CustomersClient";

export const metadata: Metadata = {
  title: "Customer Records | COZ",
  description: "Manage customer information and contact details",
};

export default function CustomersPage() {
  return <CustomersClient />;
}
