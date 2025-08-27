import type { Metadata } from "next";
import { ContainerTypesManager } from "@/components/shared/master-data/ContainerTypesManager";


export const metadata: Metadata = {
  title: "Container Types | COZ",
  description: "View container types and their configurations",
};

function ContainerTypesPage() {
  return <ContainerTypesManager mode="user" />;
}

export default ContainerTypesPage;