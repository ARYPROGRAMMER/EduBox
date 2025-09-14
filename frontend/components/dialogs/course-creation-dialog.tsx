"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
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
import { Plus, X, Clock, MapPin, BookOpen } from "lucide-react";

interface ScheduleEntry {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  location?: string;
}

interface CourseCreationDialogProps {
  children: React.ReactNode;
  onSuccess?: () => void;
}

export function CourseCreationDialog({ children, onSuccess }: CourseCreationDialogProps) {
  const { user } = useConvexUser();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [instructor, setInstructor] = useState("");
  const [semester, setSemester] = useState("");
  const [credits, setCredits] = useState<number>(3);
  const [description, setDescription] = useState("");
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);

  // Schedule form state
  const [newSchedule, setNewSchedule] = useState<ScheduleEntry>({
    dayOfWeek: "",
    startTime: "",
    endTime: "",
    location: "",
  });

  const createCourse = useMutation(api.courses.createCourse);

  const daysOfWeek = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
  ];

  const currentSemesters = [
    "Fall 2024", "Spring 2025", "Summer 2025", "Fall 2025", "Spring 2026"
  ];

  const handleAddSchedule = () => {
    if (newSchedule.dayOfWeek && newSchedule.startTime && newSchedule.endTime) {
      setSchedule([...schedule, { ...newSchedule }]);
      setNewSchedule({
        dayOfWeek: "",
        startTime: "",
        endTime: "",
        location: "",
      });
    }
  };

  const handleRemoveSchedule = (index: number) => {
    setSchedule(schedule.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      sonnerToast.error('Error — You must be logged in to create a course.');
      return;
    }

    if (!courseCode.trim() || !courseName.trim() || !semester) {
      sonnerToast.error('Missing Information — Please fill in course code, name, and semester.');
      return;
    }

    setIsSubmitting(true);

    try {
      await createCourse({
        userId: user.clerkId,
        courseCode: courseCode.trim().toUpperCase(),
        courseName: courseName.trim(),
        instructor: instructor.trim() || undefined,
        semester,
        credits: credits || undefined,
        schedule: schedule.length > 0 ? schedule : undefined,
      });

      sonnerToast.success(`${courseCode} - ${courseName} has been added to your courses.`);

      // Reset form
      setCourseCode("");
      setCourseName("");
      setInstructor("");
      setSemester("");
      setCredits(3);
      setDescription("");
      setSchedule([]);
      setOpen(false);
      
      onSuccess?.();
    } catch (error) {
      console.error("Error creating course:", error);
      sonnerToast.error('Error — Failed to create course. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Add New Course
          </DialogTitle>
          <DialogDescription>
            Create a new course with schedule and details for your academic planning.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Course Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="courseCode">Course Code *</Label>
              <Input
                id="courseCode"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                placeholder="e.g., CS101, MATH201"
                className="uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="credits">Credits</Label>
              <Input
                id="credits"
                type="number"
                value={credits}
                onChange={(e) => setCredits(Number(e.target.value))}
                min="1"
                max="6"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="courseName">Course Name *</Label>
            <Input
              id="courseName"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="e.g., Introduction to Computer Science"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instructor">Instructor</Label>
              <Input
                id="instructor"
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                placeholder="Professor name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="semester">Semester *</Label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {currentSemesters.map((sem) => (
                    <SelectItem key={sem} value={sem}>
                      {sem}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Course description, prerequisites, or notes"
              rows={3}
            />
          </div>

          {/* Schedule Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <Label className="text-base font-medium">Class Schedule</Label>
            </div>

            {/* Add Schedule Entry */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 p-4 border rounded-lg bg-muted/50">
              <Select
                value={newSchedule.dayOfWeek}
                onValueChange={(value) => setNewSchedule({ ...newSchedule, dayOfWeek: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Day" />
                </SelectTrigger>
                <SelectContent>
                  {daysOfWeek.map((day) => (
                    <SelectItem key={day} value={day}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="time"
                value={newSchedule.startTime}
                onChange={(e) => setNewSchedule({ ...newSchedule, startTime: e.target.value })}
                placeholder="Start time"
              />

              <Input
                type="time"
                value={newSchedule.endTime}
                onChange={(e) => setNewSchedule({ ...newSchedule, endTime: e.target.value })}
                placeholder="End time"
              />

              <div className="flex gap-1">
                <Input
                  value={newSchedule.location}
                  onChange={(e) => setNewSchedule({ ...newSchedule, location: e.target.value })}
                  placeholder="Room/Location"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleAddSchedule}
                  size="sm"
                  disabled={!newSchedule.dayOfWeek || !newSchedule.startTime || !newSchedule.endTime}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Current Schedule Entries */}
            {schedule.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Current Schedule:</Label>
                <div className="flex flex-wrap gap-2">
                  {schedule.map((entry, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-2">
                      <span>
                        {entry.dayOfWeek} {entry.startTime}-{entry.endTime}
                        {entry.location && (
                          <span className="flex items-center gap-1 ml-1">
                            <MapPin className="w-3 h-3" />
                            {entry.location}
                          </span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSchedule(index)}
                        className="hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

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
              {isSubmitting ? "Creating..." : "Create Course"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}