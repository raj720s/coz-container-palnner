import AssignmentResultsManager from "@/components/shared/master-data/AssignmentResultsManager";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Assignment Results | COZ",
  description: "View assignment results",
};

const userAssignmentResultsPage = () => {
  return <AssignmentResultsManager />;
};

export default userAssignmentResultsPage;