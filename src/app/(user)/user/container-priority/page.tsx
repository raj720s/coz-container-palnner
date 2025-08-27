import ContainerPriorityManager from "@/components/shared/master-data/ContainerPriorityManager";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Container Priority Master | COZ",
  description: "Manage container priority and their configurations",
};


export default function ContainerPriorityPage() {
  return <ContainerPriorityManager />;
}
