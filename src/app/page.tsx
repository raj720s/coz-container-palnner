import type { Metadata } from "next";
import HomeClient from "./(full-width-pages)/home/HomeClient";

export const metadata: Metadata = {
  title: "COZ - Container Management System",
  description: "Efficient container logistics and planning solution",
};

export default function Home() {
  return <HomeClient />;
}