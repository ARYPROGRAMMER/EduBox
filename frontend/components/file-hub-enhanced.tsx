"use client";

import { useState, useRef, useEffect, useMemo } from "react";
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
import { CardSkeleton, PageLoader } from "@/components/ui/loader";
import { useAsyncOperation } from "@/components/ui/loading-context";
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
import { Upload as KendoUpload } from "@progress/kendo-react-upload";
import { ProgressBar } from "@progress/kendo-react-progressbars";
import {
  Sortable,
  SortableItemUIProps,
  SortableOnDragOverEvent,
} from "@progress/kendo-react-sortable";
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
  Eye,
  Share,
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
  order?: number;
}

// Custom Sortable Item UI Component
const SortableFileItemUI = (
  props: SortableItemUIProps & {
    onToggleFavorite: (fileId: Id<"files">) => void;
    onStartRename: (file: FileItem) => void;
    onDownload: (file: FileItem) => void;
    onDelete: (fileId: Id<"files">) => void;
    renamingFile: Id<"files"> | null;
    newFileName: string;
    onNewFileNameChange: (value: string) => void;
    onRenameFile: (fileId: Id<"files">) => void;
    onCancelRename: () => void;
  }
) => {
  const {
    isActive,
    style,
    attributes,
    dataItem,
    forwardRef,
    onToggleFavorite,
    onStartRename,
    onDownload,
    onDelete,
    renamingFile,
    newFileName,
    onNewFileNameChange,
    onRenameFile,
    onCancelRename,
  } = props;
  const file = dataItem as FileItem;

  return (
    <div ref={forwardRef} {...attributes} style={style} className="p-2">
      <Card
        className={`group hover:shadow-lg transition-shadow cursor-move select-none ${
          isActive
            ? "ring-2 ring-blue-500 shadow-xl bg-blue-50 dark:bg-blue-950/20"
            : "hover:bg-muted/50"
        }`}
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
                      onChange={(e) => onNewFileNameChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          onRenameFile(file._id);
                        } else if (e.key === "Escape") {
                          onCancelRename();
                        }
                      }}
                      className="h-8 text-sm"
                      autoFocus
                    />
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        onClick={() => onRenameFile(file._id)}
                        className="h-6 px-2 text-xs"
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={onCancelRename}
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
              onClick={() => onToggleFavorite(file._id)}
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
              onClick={() => onDownload(file)}
            >
              <Eye className="w-4 h-4 mr-2" />
              View
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={() => onStartRename(file)}
              disabled={renamingFile === file._id}
            >
              <Edit className="w-4 h-4 mr-2" />
              Rename
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={() => onDownload(file)}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(file._id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper functions moved outside component for SortableFileItemUI access
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
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

const formatDateString = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString();
};

export function FileHubEnhanced() {
  const { user } = useUser();
  const {
    canUse: canManageFiles,
    hasReachedLimit,
    checkAccess,
  } = useFeatureGate(FeatureFlag.FILE_MANAGEMENT);
  const [mounted, setMounted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { executeWithLoading } = useAsyncOperation();

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [renamingFile, setRenamingFile] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState("");

  // File order management
  const [fileOrder, setFileOrder] = useState<FileItem[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Convex hooks
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const storeFile = useMutation(api.files.storeFile);
  const deleteFile = useMutation(api.files.deleteFile);
  const toggleFavorite = useMutation(api.files.toggleFavorite);
  const updateFileOrder = useMutation(api.files.updateFileOrder);
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

  const displayFiles = useMemo(() => {
    return files?.filter((file) => {
      if (!searchQuery) return true;

      const query = searchQuery.toLowerCase();
      return (
        file.originalName.toLowerCase().includes(query) ||
        file.category.toLowerCase().includes(query) ||
        (file.description && file.description.toLowerCase().includes(query))
      );
    });
  }, [files, searchQuery]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize file order when files are loaded
  useEffect(() => {
    if (displayFiles && displayFiles.length > 0) {
      // Sort files: first by order (if exists), then by uploadedAt desc
      const sortedFiles = [...displayFiles].sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        if (a.order !== undefined) return -1;
        if (b.order !== undefined) return 1;
        return b.uploadedAt - a.uploadedAt;
      });
      setFileOrder(sortedFiles);
      setHasUnsavedChanges(false);
    } else if (displayFiles && displayFiles.length === 0) {
      setFileOrder([]);
      setHasUnsavedChanges(false);
    }
  }, [displayFiles]);

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

  const handleFileAdd = async (event: any) => {
    if (!userId) return;

    // Check feature access before uploading
    if (!canManageFiles) {
      toast.error(
        "File management is not available on your current plan. Please upgrade to continue."
      );
      return;
    }

    // Check usage limit
    if (hasReachedLimit) {
      toast.error(
        "You have reached your file upload limit. Please upgrade your plan to continue."
      );
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Process files sequentially to show proper progress
      for (let i = 0; i < event.newState.length; i++) {
        const file = event.newState[i];

        // Generate upload URL
        const uploadUrl = await generateUploadUrl();

        // Update progress for current file
        setUploadProgress(Math.round((i / event.newState.length) * 100));

        // Upload file to Convex storage
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.getRawFile().type },
          body: file.getRawFile(),
        });

        const { storageId } = await response.json();

        // Store file metadata
        await storeFile({
          storageId,
          fileName: file.name,
          originalName: file.name,
          fileSize: file.size,
          mimeType: file.getRawFile().type,
          category: "other",
          userId,
        });

        // Update progress after each file
        setUploadProgress(Math.round(((i + 1) / event.newState.length) * 100));
      }

      // Show completion
      setUploadProgress(100);
      toast.success("Files uploaded successfully!");

      // Close modal after a short delay
      setTimeout(() => {
        setShowUploadModal(false);
      }, 1500);
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Failed to upload files. Please try again.");
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 2000);
    }
  };

  const handleFileRemove = (event: any) => {
    // Handle file removal if needed
    console.log("File removed:", event);
  };

  const handleUploadProgress = (event: any) => {
    // Update progress based on Kendo's progress event
    if (event.newState && event.newState.length > 0) {
      const totalProgress =
        event.newState.reduce((acc: number, file: any) => {
          return acc + (file.progress || 0);
        }, 0) / event.newState.length;
      setUploadProgress(Math.round(totalProgress));
    }
  };

  const handleUploadStatusChange = (event: any) => {
    // Handle status changes (upload complete, failed, etc.)
    console.log("Upload status changed:", event);

    // If all files are uploaded successfully, close modal
    if (
      event.newState &&
      event.newState.every((file: any) => file.status === 4)
    ) {
      setTimeout(() => {
        setShowUploadModal(false);
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000); // Small delay to show 100% completion
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

  const handleSaveLayout = async () => {
    if (!userId || !hasUnsavedChanges) return;

    const fileOrders = fileOrder.map((file, index) => ({
      fileId: file._id,
      order: index,
    }));

    await executeWithLoading(async () => {
      await updateFileOrder({ userId, fileOrders });
      setHasUnsavedChanges(false);
      toast.success("Layout saved successfully!");
    }, "Saving layout...");
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
              <div className="space-y-4">
                {isUploading && (
                  <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          Uploading files...
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          {Math.round(uploadProgress)}% complete
                        </p>
                      </div>
                    </div>
                    <ProgressBar
                      value={uploadProgress}
                      label={(props) => `${Math.round(props.value || 0)}%`}
                      progressStyle={{
                        background:
                          "linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)",
                        borderRadius: "4px",
                      }}
                      style={{
                        height: "10px",
                        borderRadius: "5px",
                        backgroundColor: "#f3f4f6",
                      }}
                      className="k-progressbar-custom"
                      animation={true}
                    />
                  </div>
                )}
                <KendoUpload
                  batch={false}
                  multiple={true}
                  defaultFiles={[]}
                  withCredentials={false}
                  autoUpload={false}
                  saveHeaders={{
                    "Content-Type": "application/json",
                  }}
                  onAdd={handleFileAdd}
                  onRemove={handleFileRemove}
                  onProgress={handleUploadProgress}
                  onStatusChange={handleUploadStatusChange}
                  restrictions={{
                    allowedExtensions: [
                      ".pdf",
                      ".doc",
                      ".docx",
                      ".ppt",
                      ".pptx",
                      ".xls",
                      ".xlsx",
                      ".txt",
                      ".jpg",
                      ".jpeg",
                      ".png",
                      ".gif",
                      ".mp4",
                      ".avi",
                      ".mov",
                      ".zip",
                      ".rar",
                    ],
                  }}
                  className="k-upload-custom"
                />
                <p className="text-sm text-muted-foreground text-center">
                  Support for academic files: PDFs, presentations, images,
                  videos, and documents
                </p>
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
                <p className="text-sm text-muted-foreground">
                  Never worry about storage limits
                </p>
              </div>
              <div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                <Share className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                <h4 className="font-semibold">Advanced Sharing</h4>
                <p className="text-sm text-muted-foreground">
                  Share with password protection
                </p>
              </div>
              <div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                <Search className="w-8 h-8 mx-auto text-green-600 mb-2" />
                <h4 className="font-semibold">Smart Search</h4>
                <p className="text-sm text-muted-foreground">
                  AI-powered content search
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </LockedFeature>

      {/* Save Layout Button */}
      {hasUnsavedChanges && (
        <div className="flex justify-center">
          <Button
            onClick={handleSaveLayout}
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
          >
            Save Layout
          </Button>
        </div>
      )}

      {/* Files Grid */}
      {!fileOrder || fileOrder.length === 0 ? (
        !displayFiles ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <CardSkeleton key={index} lines={3} />
            ))}
          </div>
        ) : (
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
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Sortable
            data={fileOrder}
            idField="_id"
            className="contents"
            itemUI={(props) => (
              <SortableFileItemUI
                {...props}
                onToggleFavorite={handleToggleFavorite}
                onStartRename={handleStartRename}
                onDownload={handleDownloadFile}
                onDelete={handleDeleteFile}
                renamingFile={renamingFile as Id<"files"> | null}
                newFileName={newFileName}
                onNewFileNameChange={setNewFileName}
                onRenameFile={handleRenameFile}
                onCancelRename={handleCancelRename}
              />
            )}
            onDragOver={(e: SortableOnDragOverEvent) => {
              const newOrder = [...fileOrder];
              const oldIndex = e.prevIndex;
              const newIndex = e.nextIndex;

              if (oldIndex !== newIndex) {
                const [draggedItem] = newOrder.splice(oldIndex, 1);
                newOrder.splice(newIndex, 0, draggedItem);
                setFileOrder(newOrder);
                setHasUnsavedChanges(true);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
