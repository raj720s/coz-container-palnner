import { PolDataManager } from "@/components/shared/master-data";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "POL Master | COZ",
  description: "Manage Port of Loading (POL) ports and their configurations",
};

export default function POLPortsPageComponent() {
  return <PolDataManager />;
}                 