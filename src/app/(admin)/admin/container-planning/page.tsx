import ContainerPlanningManager from "@/components/shared/master-data/ContainerPlanningManager";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Container Planning | COZ",
  description: "View container planning",
};

const AdminContainerPlanningPage = () => {
  return <ContainerPlanningManager />;
};

export default AdminContainerPlanningPage;