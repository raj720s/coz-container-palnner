import type { Metadata } from "next";
import ContainerPriorityPage from "./ContainerPriorityClient";


export const metadata: Metadata = {
  title: "Container Priority Master | COZ",
  description: "Manage container priority and their configurations",
};

function ContainerPriorityPageComponent() {
  return <ContainerPriorityPage />;
}

export default ContainerPriorityPageComponent;