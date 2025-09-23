"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

const signUpSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  agreeToTerms: z.boolean().refine((val) => val === true, "You must agree to the terms and conditions"),
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      agreeToTerms: false,
    },
  });

  const agreeToTerms = watch("agreeToTerms");

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    try {
      // Simulate sign up process
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Account created successfully!");
      // Redirect to sign in page
      window.location.href = "/signin";
    } catch (error) {
      toast.error("An error occurred during sign up");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full overflow-y-auto no-scrollbar">
      <div className="flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Logistics-themed header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-theme-purple-100 dark:bg-theme-purple-900/30 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-theme-purple-600 dark:text-theme-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Join Our Platform
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Create your Vendor Booking Tool account
            </p>
          </div>
          <div className="mt-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* First Name */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      First Name<span className="text-error-500 ml-1">*</span>
                    </Label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <Input
                        type="text"
                        id="firstName"
                        placeholder="Enter your first name"
                        className="pl-10"
                        {...register("firstName")}
                        error={errors.firstName?.message}
                      />
                    </div>
                  </div>
                  
                  {/* Last Name */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Last Name<span className="text-error-500 ml-1">*</span>
                    </Label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <Input
                        type="text"
                        id="lastName"
                        placeholder="Enter your last name"
                        className="pl-10"
                        {...register("lastName")}
                        error={errors.lastName?.message}
                      />
                    </div>
                  </div>
                </div>
                {/* Email */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email<span className="text-error-500 ml-1">*</span>
                  </Label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <Input
                      type="email"
                      id="email"
                      placeholder="Enter your email"
                      className="pl-10"
                      {...register("email")}
                      error={errors.email?.message}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password<span className="text-error-500 ml-1">*</span>
                  </Label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <Input
                      placeholder="Enter your password"
                      type={showPassword ? "text" : "password"}
                      className="pl-10 pr-10"
                      {...register("password")}
                      error={errors.password?.message}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeCloseIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
                {/* Terms and Conditions */}
                <div className="flex items-start gap-3">
                  <Checkbox
                    className="w-5 h-5 mt-0.5"
                    checked={agreeToTerms || false}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => setValue("agreeToTerms", event.target.checked)}
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    By creating an account, you agree to our{" "}
                    <Link href="/terms" className="font-medium text-theme-purple-600 hover:text-theme-purple-500 dark:text-theme-purple-400 dark:hover:text-theme-purple-300">
                      Terms and Conditions
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="font-medium text-theme-purple-600 hover:text-theme-purple-500 dark:text-theme-purple-400 dark:hover:text-theme-purple-300">
                      Privacy Policy
                    </Link>
                  </p>
                </div>
                {errors.agreeToTerms && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.agreeToTerms.message}
                  </p>
                )}

                {/* Submit Button */}
                <div>
                  <Button 
                    className="w-full bg-theme-purple-600 hover:bg-theme-purple-700 focus:ring-theme-purple-500 dark:bg-theme-purple-500 dark:hover:bg-theme-purple-600"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating account...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        Create account
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{" "}
                <Link
                  href="/signin"
                  className="font-medium text-theme-purple-600 hover:text-theme-purple-500 dark:text-theme-purple-400 dark:hover:text-theme-purple-300"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
