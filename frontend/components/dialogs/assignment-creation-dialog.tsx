"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useConvexUser } from "@/hooks/use-convex-user";
import { toast as sonnerToast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, FileText, AlertTriangle, Clock } from "lucide-react";

interface AssignmentCreationDialogProps {
  children: React.ReactNode;
  onSuccess?: () => void;
  preSelectedCourseId?: string;
}

export function AssignmentCreationDialog({ 
  children, 
  onSuccess, 
  preSelectedCourseId 
}: AssignmentCreationDialogProps) {
  const { user } = useConvexUser();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState(preSelectedCourseId || "none");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("23:59");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [estimatedHours, setEstimatedHours] = useState<number>(2);
  const [maxPoints, setMaxPoints] = useState<number>(100);
  const [reminderSet, setReminderSet] = useState(true);
  const [attachments, setAttachments] = useState<string[]>([]);

  // Queries
  const courses = useQuery(
    api.courses.getCourses,
    user ? { userId: user.clerkId } : "skip"
  );

  const createAssignment = useMutation(api.assignments.createAssignment);

  const priorityOptions = [
    { value: "low", label: "Low Priority", color: "bg-green-100 text-green-800" },
    { value: "medium", label: "Medium Priority", color: "bg-yellow-100 text-yellow-800" },
    { value: "high", label: "High Priority", color: "bg-red-100 text-red-800" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      sonnerToast.error('Error — You must be logged in to create an assignment.');
      return;
    }

    if (!title.trim() || !dueDate) {
      sonnerToast.error('Missing Information — Please provide assignment title and due date.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Combine date and time for due date
      const dueDateWithTime = new Date(`${dueDate}T${dueTime}`);
      const assignedDate = new Date();

      await createAssignment({
        userId: user.clerkId,
        courseId: courseId && courseId !== "none" ? courseId : undefined,
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dueDateWithTime.getTime(),
        assignedDate: assignedDate.getTime(),
        priority,
        maxPoints: maxPoints || undefined,
        estimatedHours: estimatedHours || undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      sonnerToast.success(`"${title}" has been added to your assignments.`);

      // Reset form
      setTitle("");
      setDescription("");
      setCourseId(preSelectedCourseId || "none");
      setDueDate("");
      setDueTime("23:59");
      setPriority("medium");
      setEstimatedHours(2);
      setMaxPoints(100);
      setReminderSet(true);
      setAttachments([]);
      setOpen(false);
      
      onSuccess?.();
    } catch (error) {
      console.error("Error creating assignment:", error);
      sonnerToast.error('Error — Failed to create assignment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityBadge = (priorityValue: string) => {
    const option = priorityOptions.find(p => p.value === priorityValue);
    return option ? (
      <Badge className={option.color}>
        {priorityValue === "high" && <AlertTriangle className="w-3 h-3 mr-1" />}
        {option.label}
      </Badge>
    ) : null;
  };

  const getDaysUntilDue = () => {
    if (!dueDate) return null;
    const due = new Date(`${dueDate}T${dueTime}`);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "Due tomorrow";
    return `Due in ${diffDays} days`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Create New Assignment
          </DialogTitle>
          <DialogDescription>
            Add a new assignment with due date, priority, and course association.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Assignment Information */}
          <div className="space-y-2">
            <Label htmlFor="title">Assignment Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Problem Set 3, Research Paper, Lab Report"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Assignment details, requirements, or notes"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="courseId">Course</Label>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a course (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No course selected</SelectItem>
                  {courses?.map((course) => (
                    <SelectItem key={course._id} value={course._id}>
                      {course.courseCode} - {course.courseName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className="flex items-center gap-2">
                        {option.value === "high" && <AlertTriangle className="w-3 h-3" />}
                        {option.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date and Time */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              <Label className="text-base font-medium">Due Date & Time</Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueTime">Due Time</Label>
                <Input
                  id="dueTime"
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                />
              </div>
            </div>

            {dueDate && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                {getDaysUntilDue()}
              </div>
            )}
          </div>

          {/* Additional Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimatedHours">Estimated Hours</Label>
              <Input
                id="estimatedHours"
                type="number"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(Number(e.target.value))}
                min="0.5"
                max="100"
                step="0.5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxPoints">Max Points</Label>
              <Input
                id="maxPoints"
                type="number"
                value={maxPoints}
                onChange={(e) => setMaxPoints(Number(e.target.value))}
                min="1"
                max="1000"
              />
            </div>
          </div>

          {/* Preview Summary */}
          {title && dueDate && (
            <div className="p-4 border rounded-lg bg-muted/50">
              <Label className="text-sm font-medium">Assignment Preview:</Label>
              <div className="mt-2 space-y-2">
                <div className="flex items-start justify-between">
                  <h4 className="font-medium">{title}</h4>
                  {getPriorityBadge(priority)}
                </div>
                {courseId && courses && (
                  <p className="text-sm text-muted-foreground">
                    Course: {courses.find(c => c._id === courseId)?.courseCode} - {courses.find(c => c._id === courseId)?.courseName}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  Due: {new Date(`${dueDate}T${dueTime}`).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  Estimated time: {estimatedHours} hours • Max points: {maxPoints}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Assignment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}