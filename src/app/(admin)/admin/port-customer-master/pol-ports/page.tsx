import type { Metadata } from "next";
import { PolDataManager } from "@/components/shared/master-data";

export const metadata: Metadata = {
  title: "POL Master | COZ", 
  description: "Manage Port of Loading (POL) ports and their configurations",
};

export default function POLPortsPage() {
  return <PolDataManager />;
}