import { CustomerManager } from "@/components/shared/master-data";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customer Records | COZ",
  description: "Manage customer information and contact details",
};

export default function CustomersPage() {
  return <CustomerManager />;
}