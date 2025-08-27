import type { Metadata } from "next";
import { ContainerTypesManager } from "@/components/shared/master-data/ContainerTypesManager";
import { withSimpleRBAC } from "@/components/auth/withSimpleRBAC";

export const metadata: Metadata = {
  title: "Container Type Master | COZ",
  description: "Manage container types and their configurations",
};

function ContainerTypesPage() {
  return <ContainerTypesManager mode="admin" />;
}

// export default withSimpleRBAC(ContainerTypesPage, {
//   privilege: "VIEW_CONTAINER_TYPES"
// });

export default ContainerTypesPage;