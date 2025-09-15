"use client";

import React, { useState, useRef } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useConvexUser } from "@/hooks/use-convex-user";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Upload,
  Download,
  FileText,
  BarChart3,
  BookOpen,
  Calendar,
  GraduationCap,
  AlertCircle,
  CheckCircle,
  Clock,
  Trash2,
  FileUp,
  FileDown,
} from "lucide-react";
import { toast as sonnerToast } from "sonner";

interface ImportJob {
  _id: string;
  operation: string;
  dataType: string;
  status: string;
  progress?: number;
  fileName?: string;
  recordsProcessed?: number;
  recordsTotal?: number;
  recordsSuccessful?: number;
  recordsFailed?: number;
  errors?: string[];
  startedAt: number;
  completedAt?: number;
}

const DATA_TYPES = {
  courses: {
    label: "Courses & Schedules",
    icon: BookOpen,
    description: "Import course information, schedules, and enrollment data",
    example:
      "CourseCode,CourseName,Instructor,Semester,Credits,Monday,Tuesday,Wednesday,Thursday,Friday",
  },
  assignments: {
    label: "Assignments & Tasks",
    icon: FileText,
    description: "Import assignments, due dates, and task management data",
    example: "Title,Description,CourseCode,DueDate,Priority,MaxPoints,Status",
  },
  detailed_grades: {
    label: "Detailed Grade Sheets",
    icon: GraduationCap,
    description:
      "Import comprehensive grade data with individual assignment scores",
    example:
      "Semester,CourseCode,CourseName,Instructor,Credits,Assignment1,Quiz1,Midterm,Final,FinalGrade,GPA",
  },
  transcript: {
    label: "Official Transcripts",
    icon: BarChart3,
    description: "Import official transcript data with historical grades",
    example:
      "Year,Semester,CourseCode,CourseName,Credits,FinalGrade,GradePoints,Percentage",
  },
  study_sessions: {
    label: "Study Session Logs",
    icon: Clock,
    description: "Import study time tracking and productivity data",
    example:
      "Date,CourseCode,Title,Duration,SessionType,FocusScore,ProductivityRating,Location,Notes",
  },
  schedule: {
    label: "Course Schedules",
    icon: Calendar,
    description: "Import detailed class schedules with times and locations",
    example:
      "CourseCode,CourseName,Instructor,Semester,Monday,Tuesday,Wednesday,Thursday,Friday,Location",
  },
};

export function DataImportExportHub() {
  const { user } = useConvexUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedDataType, setSelectedDataType] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState("import");

  // Queries
  const importJobs = useQuery(
    api.dataImportExport.getImportExportJobs,
    user ? { userId: user.clerkId } : "skip"
  );

  const importStatus = useQuery(
    api.userContext.getImportExportStatus,
    user ? { userId: user.clerkId } : "skip"
  );

  // Available export data counts
  const availableExportData = useQuery(
    api.dataImportExport.getAvailableExportData,
    user ? { userId: user.clerkId } : "skip"
  );

  // Mutations
  const createImportJob = useMutation(
    api.dataImportExport.createImportExportJob
  );
  const requestExport = useMutation(
    (api.dataImportExport as any).requestExport ||
      api.dataImportExport.createImportExportJob
  );
  // Prefer the immediate export action that returns CSV content
  const exportDataNow = useMutation(
    (api.dataImportExport as any).exportDataNow ||
      (api.dataImportExport as any).requestExport ||
      api.dataImportExport.createImportExportJob
  );
  const processImport = useAction(api.dataImportExport.processCsvImport);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
        sonnerToast.error("Invalid File Type — Please select a CSV file.");
        return;
      }
      setUploadedFile(file);
    }
  };

  const handleStartImport = async () => {
    if (!user || !uploadedFile || !selectedDataType) {
      sonnerToast.error(
        "Missing Information — Please select a data type and upload a CSV file."
      );
      return;
    }

    try {
      // Create the import job
      const jobId = await createImportJob({
        userId: user.clerkId,
        operation: "import",
        dataType: selectedDataType,
        format: "csv",
        fileName: uploadedFile.name,
        fileSize: uploadedFile.size,
      });

      // Read the file content
      const fileContent = await uploadedFile.text();

      // Start processing
      await processImport({
        jobId,
        csvData: fileContent,
      });

      sonnerToast.success(
        `Started importing ${selectedDataType} data from ${uploadedFile.name}`
      );

      // Reset form
      setUploadedFile(null);
      setSelectedDataType("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      sonnerToast.error(
        "Import Failed — Failed to start the import process. Please try again."
      );
    }
  };

  const handleExportData = async (dataType: string) => {
    if (!user) return;

    try {
      // If we have availability info, validate before requesting export
      const count = availableExportData
        ? availableExportData[dataType] || 0
        : undefined;
      if (typeof count === "number" && count <= 0) {
        sonnerToast.error(`No ${dataType} data available to export`);
        return;
      }

      // Prefer immediate export that returns CSV content and triggers download
      if ((api.dataImportExport as any).exportDataNow) {
        const result: any = await exportDataNow({
          userId: user.clerkId,
          dataType,
          format: "csv",
        });
        if (result && result.csv && result.fileName) {
          // Trigger browser download
          const blob = new Blob([result.csv], {
            type: "text/csv;charset=utf-8;",
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = result.fileName;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);

          sonnerToast.success(
            `Exported ${dataType} — download should start shortly.`
          );
          return;
        }
      }

      // Fallback to server-side request which validates availability and creates the job (older flow)
      await requestExport({
        userId: user.clerkId,
        dataType,
        format: "csv",
      });

      sonnerToast.success(
        `Started exporting ${dataType} data to CSV format (job created)`
      );
    } catch (error: any) {
      const message =
        error?.message ||
        "Export Failed — Failed to start the export process. Please try again.";
      sonnerToast.error(message);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "processing":
        return <Clock className="h-4 w-4 text-blue-600 animate-pulse" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Please sign in to access import/export features.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">
          Data Import & Export
        </h2>
        <p className="text-muted-foreground mt-2">
          Manage your academic data with powerful import and export tools
        </p>
      </div>

      {/* Import/Export Status Overview */}
      {importStatus && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Imports
              </CardTitle>
              <FileUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {importStatus.importStats.totalImports}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Successful</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {importStatus.importStats.successfulImports}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {importStatus.activeJobs.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Records Imported
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {importStatus.importStats.totalRecordsImported}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="import">Import Data</TabsTrigger>
          <TabsTrigger value="export">Export Data</TabsTrigger>
          <TabsTrigger value="history">Job History</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import Academic Data
              </CardTitle>
              <CardDescription>
                Upload CSV files to import your academic data into EduBox
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="dataType">Data Type</Label>
                  <Select
                    value={selectedDataType}
                    onValueChange={setSelectedDataType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select data type to import" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DATA_TYPES).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <value.icon className="h-4 w-4" />
                            {value.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedDataType && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      {
                        DATA_TYPES[selectedDataType as keyof typeof DATA_TYPES]
                          ?.description
                      }
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="file">CSV File</Label>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="cursor-pointer"
                  />
                  {uploadedFile && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      Selected: {uploadedFile.name} (
                      {Math.round(uploadedFile.size / 1024)} KB)
                    </div>
                  )}
                </div>

                {selectedDataType && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Expected CSV Format:</h4>
                    <code className="text-xs bg-background p-2 rounded block overflow-x-auto">
                      {
                        DATA_TYPES[selectedDataType as keyof typeof DATA_TYPES]
                          ?.example
                      }
                    </code>
                  </div>
                )}

                <Button
                  onClick={handleStartImport}
                  disabled={
                    !selectedDataType ||
                    !uploadedFile ||
                    !importStatus?.readyForImport
                  }
                  className="w-full"
                >
                  {importStatus?.readyForImport
                    ? "Start Import"
                    : "Another import is in progress..."}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(DATA_TYPES).map(([key, value]) => (
              <Card key={key} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <value.icon className="h-5 w-5" />
                    {value.label}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {value.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm text-muted-foreground">
                      {availableExportData ? (
                        <>
                          {availableExportData[key] || 0} records available to
                          export
                        </>
                      ) : (
                        <>Loading...</>
                      )}
                    </div>
                    <Button
                      onClick={() => handleExportData(key)}
                      className="ml-auto"
                      variant="outline"
                      disabled={
                        availableExportData
                          ? (availableExportData[key] || 0) === 0
                          : false
                      }
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export as CSV
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Import/Export History</CardTitle>
              <CardDescription>
                Track the status of your data import and export operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {importJobs && importJobs.length > 0 ? (
                <div className="space-y-4">
                  {importJobs.map((job: ImportJob) => (
                    <div
                      key={job._id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(job.status)}
                          <Badge
                            variant={
                              job.status === "completed"
                                ? "default"
                                : job.status === "failed"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {job.status}
                          </Badge>
                        </div>
                        <div>
                          <h4 className="font-medium">
                            {job.operation === "import" ? "Import" : "Export"}{" "}
                            {job.dataType}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {job.fileName && `File: ${job.fileName} • `}
                            Started: {formatDate(job.startedAt)}
                            {job.completedAt &&
                              ` • Completed: ${formatDate(job.completedAt)}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {job.progress !== undefined &&
                          job.status === "processing" && (
                            <div className="w-32">
                              <Progress value={job.progress} className="h-2" />
                              <p className="text-xs text-muted-foreground mt-1">
                                {job.progress}% complete
                              </p>
                            </div>
                          )}
                        {job.recordsSuccessful !== undefined && (
                          <p className="text-sm font-medium">
                            {job.recordsSuccessful} records processed
                          </p>
                        )}
                        {job.recordsFailed && job.recordsFailed > 0 && (
                          <p className="text-sm text-red-600">
                            {job.recordsFailed} errors
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No import/export history</h3>
                  <p className="text-muted-foreground">
                    Your import and export operations will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
