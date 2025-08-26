import type { Metadata } from "next";
import ContainerTypesClient from "./ContainerTypesClient";
import { withSimpleRBAC } from "@/components/auth/withSimpleRBAC";

export const metadata: Metadata = {
  title: "Container Type Master | COZ",
  description: "Manage container types and their configurations",
};

function ContainerTypesPage() {
  return <ContainerTypesClient />;
}

export default ContainerTypesPage;