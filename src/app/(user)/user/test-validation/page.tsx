"use client";

import { withUserAuth } from "@/components/auth/withAuth";
import Button from "@/components/ui/button/Button";
import { useRouter } from "next/navigation";

function TestValidationPage() {
  const router = useRouter();

  console.log('TestValidationPage: Component rendering');

  const handleGoToValidationSummary = () => {
    console.log('TestValidationPage: Navigating to validation summary');
    router.push('/user/validation-summary');
  };

  const handleGoToUpload = () => {
    console.log('TestValidationPage: Navigating to upload');
    router.push('/user/shipment-upload');
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Test Validation Page
      </h1>
      
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-400">
          This is a test page to verify routing and basic functionality.
        </p>
        
        <div className="flex space-x-4">
          <Button onClick={handleGoToValidationSummary}>
            Go to Validation Summary
          </Button>
          <Button onClick={handleGoToUpload} variant="outline">
            Go to Upload
          </Button>
        </div>
        
        <div className="bg-white rounded-lg shadow dark:bg-gray-800 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Debug Information
          </h3>
          <div className="space-y-2 text-sm">
            <p><strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'Server-side'}</p>
            <p><strong>Session Storage:</strong> {typeof window !== 'undefined' ? 'Available' : 'Not available'}</p>
            <p><strong>Validation Result:</strong> {typeof window !== 'undefined' ? (sessionStorage.getItem('validationResult') ? 'Present' : 'Not present') : 'Server-side'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withUserAuth(TestValidationPage);
