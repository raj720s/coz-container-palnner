import { Metadata } from "next";
import DataBackupManager from "@/components/shared/common/DataBackupManager";

export const metadata: Metadata = {
  title: "Data Backup",
  description: "Manage data backup",
};

export default function DataBackupPage() {
  return <DataBackupManager />;
}