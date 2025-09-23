import { Metadata } from "next";
import ShipmentOrderManager from "@/components/shared/shipment-order/ShipmentOrderManager";

export const metadata: Metadata = {
  title: "Shipment Orders | Vendor Booking Tool",
  description: "Manage vendor booking shipment orders and container assignments",
};

export default function ShipmentOrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Shipment Orders
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage vendor booking shipment orders and container assignments
        </p>
      </div>
      
      <ShipmentOrderManager />
    </div>
  );
}
