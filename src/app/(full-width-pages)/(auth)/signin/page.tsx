import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | COZ",
  description: "Sign in to your Container Management System account",
};

export default function SignIn() {
  return <SignInForm />;
}
