import type { Metadata } from "next";
import ContainerThreshHoldClient from "./ContainerThreshHoldClient";


export const metadata: Metadata = {
  title: "Container ThreshHold Master | COZ",
  description: "Manage container threshhold and their configurations",
};

function ContainerThresholdsPageComponent() {
  return <ContainerThreshHoldClient />;
}

export default ContainerThresholdsPageComponent;
