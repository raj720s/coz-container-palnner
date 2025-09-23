import ContainerPlanningManager from "@/components/shared/operations/ContainerPlanningManager";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Container Planning | COZ",
  description: "View container planning",
};

const AdminContainerPlanningPage = () => {
  return <ContainerPlanningManager />;
};

export default AdminContainerPlanningPage;