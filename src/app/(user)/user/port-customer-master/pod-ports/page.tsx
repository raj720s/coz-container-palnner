import type { Metadata } from "next";
import PODPortsClient from "./PODPortsClient";

export const metadata: Metadata = {
  title: "POD Master | COZ",
  description: "Manage Port of Discharge ports for container shipments",
};

export default function PODPortsPage() {
  return <PODPortsClient />;
}