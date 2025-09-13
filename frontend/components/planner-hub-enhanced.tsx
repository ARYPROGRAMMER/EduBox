"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useConvexUser } from "@/hooks/use-convex-user";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { enUS } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ButtonLoader, CardSkeleton } from "@/components/ui/loader";
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
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Plus,
  BookOpen,
  FileText,
  GraduationCap,
  Users,
  CheckCircle,
  AlertCircle,
  Target,
} from "lucide-react";

interface Event {
  id: number;
  title: string;
  type: "exam" | "assignment" | "class" | "study" | "event";
  date: string;
  time: string;
  duration?: string;
  location: string;
  priority: "high" | "medium" | "low";
  color: string;
}

interface Task {
  id: number;
  title: string;
  completed: boolean;
  priority: "high" | "medium" | "low";
  dueDate: string;
  category: string;
}

export function PlannerHubEnhanced() {
  const { user: clerkUser } = useUser();
  const { user: convexUser } = useConvexUser();
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    type: "",
    location: "",
  });

  // Fetch real data from Convex
  const events = useQuery(
    api.events.getEvents,
    convexUser ? { userId: convexUser.clerkId } : "skip"
  );
  const upcomingAssignments = useQuery(
    api.assignments.getUpcomingAssignments,
    convexUser ? { userId: convexUser.clerkId } : "skip"
  );
  const courses = useQuery(
    api.courses.getCourses,
    convexUser ? { userId: convexUser.clerkId } : "skip"
  );

  // Mutations
  const createEvent = useMutation(api.events.createEvent);
  const createAssignment = useMutation(api.assignments.createAssignment);
  const updateAssignment = useMutation(api.assignments.updateAssignment);
  const deleteEvent = useMutation(api.events.deleteEvent);
  const deleteAssignment = useMutation(api.assignments.deleteAssignment);

  // Use simple loading state instead of useAsyncOperation
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSelectedDate(new Date());
  }, []);

  // Safe date formatting function to prevent hydration issues
  const formatDate = (date: Date) => {
    if (!mounted) return "";
    return date.toLocaleDateString();
  };

  const formatDateString = (dateString: string) => {
    if (!mounted) return "";
    return new Date(dateString).toLocaleDateString();
  };

  const handleCreateEvent = async () => {
    if (!convexUser || !newEvent.title || !newEvent.startTime) return;

    setIsCreatingEvent(true);
    try {
      const startTime = new Date(newEvent.startTime).getTime();
      const endTime = newEvent.endTime
        ? new Date(newEvent.endTime).getTime()
        : startTime + 60 * 60 * 1000; // Default 1 hour

      await createEvent({
        userId: convexUser.clerkId,
        title: newEvent.title,
        description: newEvent.description,
        startTime,
        endTime,
        type: newEvent.type || "personal",
        location: newEvent.location,
      });

      setNewEvent({
        title: "",
        description: "",
        startTime: "",
        endTime: "",
        type: "",
        location: "",
      });
      setShowEventModal(false);
    } catch (error) {
      console.error("Error creating event:", error);
    } finally {
      setIsCreatingEvent(false);
    }
  };

  // Convert events and assignments to calendar format
  const calendarEvents = events || [];
  const assignments = upcomingAssignments || [];

  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split("T")[0];

    const dayEvents = calendarEvents.filter((event: any) => {
      const eventDate = new Date(event.startTime).toISOString().split("T")[0];
      return eventDate === dateString;
    });

    const dayAssignments = assignments.filter((assignment: any) => {
      const assignmentDate = new Date(assignment.dueDate)
        .toISOString()
        .split("T")[0];
      return assignmentDate === dateString;
    });

    return [...dayEvents, ...dayAssignments];
  };

  const upcomingEvents =
    mounted && calendarEvents
      ? calendarEvents
          .filter((event: any) => new Date(event.startTime) >= new Date())
          .sort(
            (a: any, b: any) =>
              new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          )
          .slice(0, 5)
      : [];

  const pendingAssignments = assignments.filter(
    (assignment: any) => assignment.status === "pending"
  );
  const completedAssignments = assignments.filter(
    (assignment: any) => assignment.status === "completed"
  );

  // Calculate exams this week
  const getExamsThisWeek = () => {
    const today = new Date();
    const oneWeekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const examsThisWeek = calendarEvents.filter((event: any) => {
      const eventDate = new Date(event.startTime);
      return (
        event.type === "exam" &&
        eventDate >= today &&
        eventDate <= oneWeekFromNow
      );
    });
    
    return examsThisWeek.length;
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case "exam":
        return <BookOpen className="w-4 h-4" />;
      case "assignment":
        return <FileText className="w-4 h-4" />;
      case "class":
        return <GraduationCap className="w-4 h-4" />;
      case "study":
        return <Users className="w-4 h-4" />;
      case "event":
        return <CalendarIcon className="w-4 h-4" />;
      default:
        return <CalendarIcon className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200";
      case "medium":
        return "text-orange-600 bg-orange-50 dark:bg-orange-900/20 border-orange-200";
      case "low":
        return "text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 dark:bg-gray-900/20 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-600">
                  {upcomingEvents.length}
                </p>
                <p className="text-sm text-blue-600/70">Upcoming Events</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-orange-600">
                  {pendingAssignments.length}
                </p>
                <p className="text-sm text-orange-600/70">Pending Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/50 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-red-600">{getExamsThisWeek()}</p>
                <p className="text-sm text-red-600/70">Exams This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">
                  {Math.round(
                    (completedAssignments.length / assignments.length) * 100
                  ) || 0}
                  %
                </p>
                <p className="text-sm text-green-600/70">Completion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Academic Calendar</CardTitle>
                  <CardDescription>
                    Manage your schedule and important dates
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === "month" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("month")}
                  >
                    Month
                  </Button>
                  <Button
                    variant={viewMode === "week" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("week")}
                  >
                    Week
                  </Button>
                  <Dialog
                    open={showEventModal}
                    onOpenChange={setShowEventModal}
                  >
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-blue-600 to-purple-600"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Event
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Event</DialogTitle>
                        <DialogDescription>
                          Create a new event in your academic calendar
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          placeholder="Event title"
                          value={newEvent.title}
                          onChange={(e) =>
                            setNewEvent({ ...newEvent, title: e.target.value })
                          }
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="datetime-local"
                            placeholder="Start time"
                            value={newEvent.startTime}
                            onChange={(e) =>
                              setNewEvent({
                                ...newEvent,
                                startTime: e.target.value,
                              })
                            }
                          />
                          <Input
                            type="datetime-local"
                            placeholder="End time"
                            value={newEvent.endTime}
                            onChange={(e) =>
                              setNewEvent({
                                ...newEvent,
                                endTime: e.target.value,
                              })
                            }
                          />
                        </div>
                        <Select
                          value={newEvent.type}
                          onValueChange={(value) =>
                            setNewEvent({ ...newEvent, type: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Event type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="exam">Exam</SelectItem>
                            <SelectItem value="assignment">
                              Assignment
                            </SelectItem>
                            <SelectItem value="class">Class</SelectItem>
                            <SelectItem value="study">Study Session</SelectItem>
                            <SelectItem value="personal">Personal</SelectItem>
                            <SelectItem value="event">Campus Event</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Location"
                          value={newEvent.location}
                          onChange={(e) =>
                            setNewEvent({
                              ...newEvent,
                              location: e.target.value,
                            })
                          }
                        />
                        <Textarea
                          placeholder="Description (optional)"
                          value={newEvent.description}
                          onChange={(e) =>
                            setNewEvent({
                              ...newEvent,
                              description: e.target.value,
                            })
                          }
                        />
                        <div className="flex gap-2">
                          <Button
                            className="flex-1"
                            onClick={handleCreateEvent}
                            disabled={isCreatingEvent}
                          >
                            {isCreatingEvent ? "Creating..." : "Save Event"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setShowEventModal(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {mounted ? (
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border w-full"
                  locale={enUS}
                />
              ) : (
                <div className="rounded-md border w-full h-64 bg-muted animate-pulse" />
              )}

              {/* Events for Selected Date */}
              {selectedDate && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">
                    Events for{" "}
                    {selectedDate && mounted
                      ? formatDate(selectedDate)
                      : "Selected Date"}
                  </h4>
                  <div className="space-y-2">
                    {mounted && selectedDate
                      ? getEventsForDate(selectedDate).map((event: any) => (
                          <div
                            key={event._id || event.id}
                            className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                          >
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center ${getPriorityColor(
                                event.priority
                              )}`}
                            >
                              {getEventTypeIcon(event.type)}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{event.title}</p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {event.time}
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {event.location}
                                </div>
                              </div>
                            </div>
                            <Badge className={getPriorityColor(event.priority)}>
                              {event.priority}
                            </Badge>
                          </div>
                        ))
                      : []}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tasks & Upcoming Events */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Events</CardTitle>
              <CardDescription>Your next important dates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingEvents.map((event: any) => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 p-3 rounded-lg border"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${getPriorityColor(
                      event.priority
                    )}`}
                  >
                    {getEventTypeIcon(event.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{event.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateString(event.date)} at {event.time}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Task Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Task Management</CardTitle>
                  <CardDescription>
                    Track your assignments and todos
                  </CardDescription>
                </div>
                <Dialog open={showTaskModal} onOpenChange={setShowTaskModal}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Task
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Task</DialogTitle>
                      <DialogDescription>
                        Create a new task to track your progress
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input placeholder="Task title" />
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High Priority</SelectItem>
                          <SelectItem value="medium">
                            Medium Priority
                          </SelectItem>
                          <SelectItem value="low">Low Priority</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input type="date" placeholder="Due date" />
                      <div className="flex gap-2">
                        <Button className="flex-1">Save Task</Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowTaskModal(false)}
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
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Progress</span>
                  <span>
                    {completedAssignments.length}/{assignments.length} completed
                  </span>
                </div>
                <Progress
                  value={
                    (completedAssignments.length / assignments.length) * 100 ||
                    0
                  }
                  className="h-2"
                />
              </div>

              <div className="space-y-3 mt-4">
                {pendingAssignments.slice(0, 5).map((assignment: any) => (
                  <div
                    key={assignment._id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                  >
                    <CheckCircle className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{assignment.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Due: {formatDateString(assignment.dueDate)}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={getPriorityColor(assignment.priority)}
                    >
                      {assignment.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
