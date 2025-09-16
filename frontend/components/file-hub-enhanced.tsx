"use client"

import { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { FileThumbnail } from "@/components/file-thumbnail";
import { useFeatureGate } from "@/components/feature-gate";
import { LockedFeature } from "@/components/locked-feature";
import { FeatureFlag } from "@/features/flag";
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
  Heart,
  Edit,
  Cloud,
} from "lucide-react";
import { toast } from "sonner";

interface FileItem {
  _id: Id<"files">;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  category: string;
  courseId?: string;
  subject?: string;
  tags?: string[];
  description?: string;
  thumbnail?: string;
  uploadedAt: number;
  url?: string;
  isFavorite?: boolean;
}

export function FileHubEnhanced() {
  const { user } = useUser();
  const { canUse: canManageFiles, hasReachedLimit, checkAccess } = useFeatureGate(
    FeatureFlag.FILE_MANAGEMENT
  );
  const [mounted, setMounted] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { executeWithLoading } = useAsyncOperation();

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [renamingFile, setRenamingFile] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convex hooks
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const storeFile = useMutation(api.files.storeFile);
  const deleteFile = useMutation(api.files.deleteFile);
  const toggleFavorite = useMutation(api.files.toggleFavorite);
  const renameFile = useMutation(api.files.renameFile);

  // Get user ID from Clerk
  const userId = user?.id;

  // Fetch files
  const files = useQuery(
    api.files.getFiles,
    userId
      ? {
          userId,
          category: selectedCategory !== "all" ? selectedCategory : undefined,
        }
      : "skip"
  ) as FileItem[] | undefined;

  // Search files
  const searchResults = useQuery(
    api.files.searchFiles,
    userId && searchQuery.length > 2
      ? {
          userId,
          searchQuery,
          category: selectedCategory !== "all" ? selectedCategory : undefined,
        }
      : "skip"
  ) as FileItem[] | undefined;

  const displayFiles = searchQuery.length > 2 ? searchResults : files;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Safe date formatting function to prevent hydration issues
  const formatDateString = (timestamp: number) => {
    if (!mounted) return "";
    return new Date(timestamp).toLocaleDateString();
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
    if (fileList.length === 0 || !userId) return;

    // Check feature access before uploading
    if (!canManageFiles) {
      toast.error(
        "File management is not available on your current plan. Please upgrade to continue."
      );
      return;
    }

    // Check usage limit
    if (hasReachedLimit) {
      toast.error("You have reached your file upload limit. Please upgrade your plan to continue.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];

        // Generate upload URL
        const uploadUrl = await generateUploadUrl();

        // Simulate upload progress
        for (let progress = 0; progress <= 80; progress += 20) {
          setUploadProgress(progress);
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        // Upload file to Convex storage
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        const { storageId } = await response.json();

        setUploadProgress(90);

        // Store file metadata
        await storeFile({
          storageId,
          fileName: file.name,
          originalName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          category: "other",
          userId,
        });

        setUploadProgress(100);
      }

      setShowUploadModal(false);
    } catch (error) {
      console.error("Error uploading files:", error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const getFileType = (mimeType: string): string => {
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

  const handleDeleteFile = async (fileId: Id<"files">) => {
    if (!userId) return;

    await executeWithLoading(async () => {
      await deleteFile({ fileId, userId });
    }, "Deleting file...");
  };

  const handleToggleFavorite = async (fileId: Id<"files">) => {
    if (!userId) return;

    await toggleFavorite({ fileId, userId });
  };

  const handleStartRename = (file: FileItem) => {
    setRenamingFile(file._id);
    setNewFileName(file.originalName);
  };

  const handleRenameFile = async (fileId: Id<"files">) => {
    if (!userId || !newFileName.trim()) return;

    try {
      await renameFile({
        fileId,
        userId,
        newName: newFileName.trim(),
      });
      setRenamingFile(null);
      setNewFileName("");
    } catch (error) {
      console.error("Error renaming file:", error);
    }
  };

  const handleCancelRename = () => {
    setRenamingFile(null);
    setNewFileName("");
  };

  const handleDownloadFile = async (file: FileItem) => {
    if (file.url) {
      window.open(file.url, "_blank");
    }
  };

  const getFileIcon = (mimeType: string) => {
    const type = getFileType(mimeType);
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
        return <Archive className="w-8 h-8 text-yellow-600" />;
      default:
        return <FileText className="w-8 h-8 text-gray-600" />;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      notes: "bg-blue-100 text-blue-800",
      assignments: "bg-red-100 text-red-800",
      presentations: "bg-purple-100 text-purple-800",
      references: "bg-green-100 text-green-800",
      lectures: "bg-orange-100 text-orange-800",
      "study-materials": "bg-indigo-100 text-indigo-800",
      other: "bg-gray-100 text-gray-800",
    };
    return colors[category] || colors.other;
  };

  if (!mounted) {
    return <PageLoader text="Loading files..." />;
  }

  if (!userId) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">
          Please sign in to access your files.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">File Management</h2>
          <p className="text-muted-foreground">
            Organize and access all your academic files in one place
          </p>
        </div>
        <LockedFeature feature={FeatureFlag.FILE_MANAGEMENT} requiredPlan="PRO">
          <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 w-full md:w-auto">
                <Upload className="w-4 h-4 mr-2" />
                Upload Files
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Upload Files</DialogTitle>
                <DialogDescription>
                  Drag and drop files here or click to browse
                </DialogDescription>
              </DialogHeader>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {isUploading ? (
                  <div className="space-y-4">
                    <Upload className="w-12 h-12 mx-auto text-blue-500 animate-pulse" />
                    <div>
                      <p className="font-medium">Uploading files...</p>
                      <Progress value={uploadProgress} className="mt-2" />
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-lg font-medium mb-2">
                      Drop files here or click to upload
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Support for academic files: PDFs, presentations, images,
                      videos, and documents
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) {
                          handleFiles(e.target.files);
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose Files
                    </Button>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </LockedFeature>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter by category" />
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

      {/* Premium Storage Features */}
      <LockedFeature
        feature={FeatureFlag.UNLIMITED_STORAGE}
        title="Unlimited Storage"
        description="Upgrade to PRO for unlimited file storage and advanced file management features."
        requiredPlan="PRO"
      >
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-purple-600" />
              Premium Storage Features
            </CardTitle>
            <CardDescription>
              Advanced file management and unlimited storage capacity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                <Archive className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                <h4 className="font-semibold">Unlimited Storage</h4>
                <p className="text-sm text-muted-foreground">Never worry about storage limits</p>
              </div>
              <div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                <Share className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                <h4 className="font-semibold">Advanced Sharing</h4>
                <p className="text-sm text-muted-foreground">Share with password protection</p>
              </div>
              <div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                <Search className="w-8 h-8 mx-auto text-green-600 mb-2" />
                <h4 className="font-semibold">Smart Search</h4>
                <p className="text-sm text-muted-foreground">AI-powered content search</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </LockedFeature>

      {/* Files Grid */}
      {!displayFiles ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <CardSkeleton key={index} lines={3} />
          ))}
        </div>
      ) : displayFiles.length === 0 ? (
        <Card className="p-8">
          <div className="text-center">
            <FolderOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No files found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? "Try a different search term"
                : "Upload your first file to get started"}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setShowUploadModal(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Files
              </Button>
            )}
          </div>
        </Card>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayFiles.map((file) => (
            <Card
              key={file._id}
              className="group hover:shadow-lg transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <FileThumbnail
                      fileName={file.originalName}
                      mimeType={file.mimeType}
                      fileSize={file.fileSize}
                      thumbnailUrl={file.thumbnail}
                      fileUrl={file.url}
                      className="w-12 h-12 flex-shrink-0"
                      showFileType={false}
                    />
                    <div className="flex-1 min-w-0">
                      {renamingFile === file._id ? (
                        <div className="space-y-2">
                          <Input
                            value={newFileName}
                            onChange={(e) => setNewFileName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleRenameFile(file._id);
                              } else if (e.key === "Escape") {
                                handleCancelRename();
                              }
                            }}
                            className="h-8 text-sm"
                            autoFocus
                          />
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() => handleRenameFile(file._id)}
                              className="h-6 px-2 text-xs"
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelRename}
                              className="h-6 px-2 text-xs"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h3
                            className="font-medium truncate"
                            title={file.originalName}
                          >
                            {file.originalName}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(file.fileSize)}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleFavorite(file._id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        file.isFavorite ? "fill-red-500 text-red-500" : ""
                      }`}
                    />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge className={getCategoryColor(file.category)}>
                    {file.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDateString(file.uploadedAt)}
                  </span>
                </div>

                {file.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {file.description}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDownloadFile(file)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleStartRename(file)}
                    disabled={renamingFile === file._id}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Rename
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDownloadFile(file)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteFile(file._id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
