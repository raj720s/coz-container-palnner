"use client";

import { withUserAuth } from "@/components/auth/withAuth";
import { useState } from "react";
import toast from "react-hot-toast";
import Button from "@/components/ui/button/Button";
import { DownloadIcon, AlertIcon, CheckCircleIcon, TimeIcon, DatabaseIcon, TrashBinIcon, RefreshIcon, PlayIcon, PauseIcon } from "@/icons";

interface BackupJob {
  id: string;
  name: string;
  type: "full" | "incremental" | "differential";
  status: "running" | "completed" | "failed" | "scheduled" | "paused";
  size: string;
  createdAt: string;
  completedAt?: string;
  duration?: string;
  location: string;
  retention: string;
}

interface BackupSchedule {
  id: string;
  name: string;
  frequency: "hourly" | "daily" | "weekly" | "monthly";
  time: string;
  type: "full" | "incremental";
  isActive: boolean;
  lastRun?: string;
  nextRun?: string;
}

function UserDataBackupPage() {
  const [backupJobs, setBackupJobs] = useState<BackupJob[]>([
    {
      id: "1",
      name: "My Data Backup - 2024-01-15",
      type: "full",
      status: "completed",
      size: "45 MB",
      createdAt: "2024-01-15T02:00:00Z",
      completedAt: "2024-01-15T02:05:00Z",
      duration: "5 minutes",
      location: "Cloud Storage",
      retention: "30 days"
    },
    {
      id: "2",
      name: "My Incremental Backup - 2024-01-16",
      type: "incremental",
      status: "completed",
      size: "12 MB",
      createdAt: "2024-01-16T02:00:00Z",
      completedAt: "2024-01-16T02:02:00Z",
      duration: "2 minutes",
      location: "Cloud Storage",
      retention: "7 days"
    },
    {
      id: "3",
      name: "My Full Backup - 2024-01-17",
      type: "full",
      status: "running",
      size: "52 MB",
      createdAt: "2024-01-17T02:00:00Z",
      location: "Cloud Storage",
      retention: "30 days"
    },
    {
      id: "4",
      name: "My Differential Backup - 2024-01-14",
      type: "differential",
      status: "failed",
      size: "0 MB",
      createdAt: "2024-01-14T02:00:00Z",
      location: "Cloud Storage",
      retention: "14 days"
    },
    {
      id: "5",
      name: "My Incremental Backup - 2024-01-18",
      type: "incremental",
      status: "scheduled",
      size: "0 MB",
      createdAt: "2024-01-18T02:00:00Z",
      location: "Cloud Storage",
      retention: "7 days"
    }
  ]);

  const [schedules, setSchedules] = useState<BackupSchedule[]>([
    {
      id: "1",
      name: "My Daily Backup",
      frequency: "daily",
      time: "02:00",
      type: "incremental",
      isActive: true,
      lastRun: "2024-01-17T02:00:00Z",
      nextRun: "2024-01-18T02:00:00Z"
    },
    {
      id: "2",
      name: "My Weekly Full Backup",
      frequency: "weekly",
      time: "03:00",
      type: "full",
      isActive: true,
      lastRun: "2024-01-14T03:00:00Z",
      nextRun: "2024-01-21T03:00:00Z"
    },
    {
      id: "3",
      name: "My Monthly Archive",
      frequency: "monthly",
      time: "04:00",
      type: "full",
      isActive: false,
      lastRun: "2023-12-01T04:00:00Z",
      nextRun: "2024-02-01T04:00:00Z"
    }
  ]);

  const [selectedJob, setSelectedJob] = useState<BackupJob | null>(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  const startBackup = (type: "full" | "incremental" | "differential") => {
    const newJob: BackupJob = {
      id: Date.now().toString(),
      name: `My ${type.charAt(0).toUpperCase() + type.slice(1)} Backup - ${new Date().toISOString().split('T')[0]}`,
      type,
      status: "running",
      size: "0 MB",
      createdAt: new Date().toISOString(),
      location: "Cloud Storage",
      retention: type === "full" ? "30 days" : "7 days"
    };

    setBackupJobs(prev => [newJob, ...prev]);
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} backup started successfully`);
  };

  const pauseBackup = (jobId: string) => {
    setBackupJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, status: "paused" } : job
    ));
    toast.success("Backup paused successfully");
  };

  const resumeBackup = (jobId: string) => {
    setBackupJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, status: "running" } : job
    ));
    toast.success("Backup resumed successfully");
  };

  const cancelBackup = (jobId: string) => {
    setBackupJobs(prev => prev.filter(job => job.id !== jobId));
    toast.success("Backup cancelled successfully");
  };

  const deleteBackup = (jobId: string) => {
    if (window.confirm("Are you sure you want to delete this backup?")) {
      setBackupJobs(prev => prev.filter(job => job.id !== jobId));
      toast.success("Backup deleted successfully");
    }
  };

  const downloadBackup = (job: BackupJob) => {
    if (job.status === "completed") {
      toast.success(`Downloading ${job.name}`);
      // In real app, this would trigger actual download
    } else {
      toast.error("Cannot download incomplete backup");
    }
  };

  const restoreBackup = (job: BackupJob) => {
    if (job.status === "completed") {
      setSelectedJob(job);
      setShowRestoreModal(true);
    } else {
      toast.error("Cannot restore incomplete backup");
    }
  };

  const confirmRestore = () => {
    if (selectedJob) {
      toast.success(`Restoring from ${selectedJob.name}`);
      setShowRestoreModal(false);
      setSelectedJob(null);
    }
  };

  const toggleSchedule = (scheduleId: string) => {
    setSchedules(prev => prev.map(schedule => 
      schedule.id === scheduleId ? { ...schedule, isActive: !schedule.isActive } : schedule
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300";
      case "running": return "text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300";
      case "failed": return "text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300";
      case "scheduled": return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300";
      case "paused": return "text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-300";
      default: return "text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "full": return "text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-300";
      case "incremental": return "text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300";
      case "differential": return "text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300";
      default: return "text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            My Data Backup
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your personal data backups and restore operations
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => startBackup("full")} className="flex items-center gap-2">
            <DatabaseIcon className="w-4 h-4" />
            Full Backup
          </Button>
          <Button onClick={() => startBackup("incremental")} variant="outline" className="flex items-center gap-2">
            <DatabaseIcon className="w-4 h-4" />
            Incremental Backup
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <DatabaseIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Backups</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{backupJobs.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {backupJobs.filter(job => job.status === "completed").length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <PlayIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Running</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {backupJobs.filter(job => job.status === "running").length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <AlertIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Failed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {backupJobs.filter(job => job.status === "failed").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Backup Jobs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Backup Jobs</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {backupJobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {job.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(job.type)}`}>
                      {job.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {job.size}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      {job.status === "running" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => pauseBackup(job.id)}>
                            <PauseIcon className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => cancelBackup(job.id)}>
                            <TrashBinIcon className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {job.status === "paused" && (
                        <Button size="sm" variant="outline" onClick={() => resumeBackup(job.id)}>
                          <PlayIcon className="w-4 h-4" />
                        </Button>
                      )}
                      {job.status === "completed" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => downloadBackup(job)}>
                            <DownloadIcon className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => restoreBackup(job)}>
                            <RefreshIcon className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="outline" onClick={() => deleteBackup(job.id)}>
                        <TrashBinIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Backup Schedules */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Backup Schedules</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Frequency</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Next Run</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {schedules.map((schedule) => (
                <tr key={schedule.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {schedule.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {schedule.frequency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {schedule.time}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(schedule.type)}`}>
                      {schedule.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${schedule.isActive ? getStatusColor("running") : getStatusColor("paused")}`}>
                      {schedule.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {schedule.nextRun ? new Date(schedule.nextRun).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button 
                      size="sm" 
                      variant={schedule.isActive ? "outline" : "primary"}
                      onClick={() => toggleSchedule(schedule.id)}
                    >
                      {schedule.isActive ? "Disable" : "Enable"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restore Modal */}
      {showRestoreModal && selectedJob && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Restore Backup
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to restore from "{selectedJob.name}"? This will overwrite your current data.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={confirmRestore} className="bg-red-600 hover:bg-red-700">
                  Confirm Restore
                </Button>
                <Button onClick={() => setShowRestoreModal(false)} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withUserAuth(UserDataBackupPage);
