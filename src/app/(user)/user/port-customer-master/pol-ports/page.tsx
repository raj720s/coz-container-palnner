import type { Metadata } from "next";
import POLPortsClient from "./POLPortsClient";

export const metadata: Metadata = {
  title: "POL Master | COZ",
  description: "Manage Port of Loading (POL) ports and their configurations",
};

export default function POLPortsPage() {
  return <POLPortsClient />;
}