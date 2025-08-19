import type { Metadata } from "next";
import ContainerTypesClient from "./ContainerTypesClient";

export const metadata: Metadata = {
  title: "Container Type Master | COZ",
  description: "Manage container types and their configurations",
};

export default function ContainerTypesPage() {
  return <ContainerTypesClient />;
}