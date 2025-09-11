"use client";

import { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ButtonLoader, CardSkeleton, PageLoader } from "@/components/ui/loader";
import { useLoading, useAsyncOperation } from "@/components/ui/loading-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Upload,
  FileText,
  Image,
  Video,
  FileAudio,
  Archive,
  Download,
  Trash2,
  FolderOpen,
  Search,
  Plus,
  Eye,
  Share,
  MoreVertical,
} from "lucide-react";

interface FileItem {
  id: number;
  name: string;
  type: "document" | "image" | "video" | "audio" | "archive" | "other";
  size: string;
  uploadDate: string;
  category: string;
  thumbnail?: string;
  url?: string;
}

export function FileHubEnhanced() {
  const [mounted, setMounted] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { executeWithLoading } = useAsyncOperation();
  const [files, setFiles] = useState<FileItem[]>([
    {
      id: 1,
      name: "Physics_Notes_Chapter_7.pdf",
      type: "document",
      size: "2.4 MB",
      uploadDate: "2025-09-10",
      category: "notes",
      thumbnail: "/placeholder.jpg",
    },
    {
      id: 2,
      name: "Chemistry_Lab_Results.xlsx",
      type: "document",
      size: "1.8 MB",
      uploadDate: "2025-09-09",
      category: "assignments",
    },
    {
      id: 3,
      name: "Biology_Presentation.pptx",
      type: "document",
      size: "15.6 MB",
      uploadDate: "2025-09-08",
      category: "presentations",
    },
    {
      id: 4,
      name: "Math_Formula_Sheet.png",
      type: "image",
      size: "856 KB",
      uploadDate: "2025-09-07",
      category: "references",
      thumbnail: "/placeholder.jpg",
    },
    {
      id: 5,
      name: "Lecture_Recording_Sept5.mp4",
      type: "video",
      size: "124.3 MB",
      uploadDate: "2025-09-05",
      category: "lectures",
    },
    {
      id: 6,
      name: "Study_Guide_Audio.mp3",
      type: "audio",
      size: "45.2 MB",
      uploadDate: "2025-09-04",
      category: "study-materials",
    },
  ]);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Safe date formatting function to prevent hydration issues
  const formatDateString = (dateString: string) => {
    if (!mounted) return "";
    return new Date(dateString).toLocaleDateString();
  };

  const categories = [
    { value: "all", label: "All Files" },
    { value: "notes", label: "Notes" },
    { value: "assignments", label: "Assignments" },
    { value: "presentations", label: "Presentations" },
    { value: "references", label: "References" },
    { value: "lectures", label: "Lectures" },
    { value: "study-materials", label: "Study Materials" },
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = async (fileList: FileList) => {
    if (fileList.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate file upload with progress
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];

        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 10) {
          setUploadProgress(progress);
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        // Create new file item
        const newFile: FileItem = {
          id: Date.now() + i,
          name: file.name,
          type: getFileType(file.type),
          size: formatFileSize(file.size),
          uploadDate: new Date().toISOString().split("T")[0],
          category: "other",
        };

        setFiles((prev) => [...prev, newFile]);
      }

      setShowUploadModal(false);
    } catch (error) {
      console.error("Error uploading files:", error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const getFileType = (mimeType: string): FileItem["type"] => {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("audio/")) return "audio";
    if (
      mimeType.includes("pdf") ||
      mimeType.includes("document") ||
      mimeType.includes("text")
    )
      return "document";
    if (mimeType.includes("zip") || mimeType.includes("rar")) return "archive";
    return "other";
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleDeleteFile = async (fileId: number) => {
    await executeWithLoading(async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setFiles((prev) => prev.filter((file) => file.id !== fileId));
    }, "Deleting file...");
  };

  const handleDownloadFile = async (file: FileItem) => {
    await executeWithLoading(async () => {
      // Simulate download
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log("Downloading file:", file.name);
    }, "Preparing download...");
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "document":
        return <FileText className="w-8 h-8 text-blue-600" />;
      case "image":
        return <Image className="w-8 h-8 text-green-600" />;
      case "video":
        return <Video className="w-8 h-8 text-purple-600" />;
      case "audio":
        return <FileAudio className="w-8 h-8 text-orange-600" />;
      case "archive":
        return <Archive className="w-8 h-8 text-gray-600" />;
      default:
        return <FileText className="w-8 h-8 text-gray-600" />;
    }
  };

  const filteredFiles = files.filter((file) => {
    const matchesCategory =
      selectedCategory === "all" || file.category === selectedCategory;
    const matchesSearch = file.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalFiles = files.length;
  const totalSize = files.reduce((acc, file) => {
    const sizeValue = parseFloat(file.size.split(" ")[0]);
    const unit = file.size.split(" ")[1];
    let sizeInMB = sizeValue;

    if (unit === "KB") sizeInMB = sizeValue / 1024;
    if (unit === "GB") sizeInMB = sizeValue * 1024;

    return acc + sizeInMB;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                <FolderOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-600">{totalFiles}</p>
                <p className="text-sm text-blue-600/70">Total Files</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                <Upload className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">
                  {totalSize.toFixed(1)}
                </p>
                <p className="text-sm text-green-600/70">MB Used</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-purple-600">
                  {files.filter((f) => f.type === "document").length}
                </p>
                <p className="text-sm text-purple-600/70">Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
                <Image className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-orange-600">
                  {files.filter((f) => f.type === "image").length}
                </p>
                <p className="text-sm text-orange-600/70">Images</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">File Management</CardTitle>
              <CardDescription>
                Upload and organize your academic files
              </CardDescription>
            </div>
            <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Files
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Upload Files</DialogTitle>
                  <DialogDescription>
                    Choose files to upload to your file hub
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {isUploading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="w-full" />
                    </div>
                  )}
                  <Select disabled={isUploading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.slice(1).map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <ButtonLoader size="sm" className="mr-2" />
                          Uploading...
                        </>
                      ) : (
                        "Choose Files"
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowUploadModal(false)}
                      disabled={isUploading}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? "border-blue-400 bg-blue-50 dark:bg-blue-950/50"
                : "border-gray-300 dark:border-gray-700"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">
              {dragActive ? "Drop files here" : "Drag & drop files here"}
            </h3>
            <p className="text-muted-foreground mb-4">
              or click to browse your files
            </p>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              Browse Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
          </div>
        </CardContent>
      </Card>

      {/* File Management */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <CardTitle className="text-lg">Your Files</CardTitle>
              <CardDescription>
                Manage and organize your uploaded files
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFiles.map((file) => (
              <Card
                key={file.id}
                className="group hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate text-sm">
                        {file.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {file.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {file.size}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDateString(file.uploadDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => handleDownloadFile(file)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Share className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-red-600"
                        onClick={() => handleDeleteFile(file.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredFiles.length === 0 && (
            <div className="text-center py-12">
              <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No files found</h3>
              <p className="text-muted-foreground">
                {searchQuery || selectedCategory !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Upload your first file to get started"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
