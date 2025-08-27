import { PodDataManager } from "@/components/shared/master-data";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "POD Master | COZ",
  description: "Manage Port of Discharge ports for container shipments",
};

export default function PODPortsPageComponent() {
  return <PodDataManager />;
}