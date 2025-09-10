"use client";

import { useState } from "react";
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
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [showEventModal, setShowEventModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

  const events: Event[] = [
    {
      id: 1,
      title: "Physics Midterm Exam",
      type: "exam",
      date: "2025-09-15",
      time: "10:00 AM",
      duration: "2 hours",
      location: "Room 301, Science Building",
      priority: "high",
      color: "red",
    },
    {
      id: 2,
      title: "Math Assignment 3 Due",
      type: "assignment",
      date: "2025-09-12",
      time: "11:59 PM",
      duration: undefined,
      location: "Online Submission",
      priority: "medium",
      color: "orange",
    },
    {
      id: 3,
      title: "Chemistry Lab Session",
      type: "class",
      date: "2025-09-13",
      time: "2:00 PM",
      duration: "3 hours",
      location: "Chemistry Lab B",
      priority: "medium",
      color: "blue",
    },
    {
      id: 4,
      title: "Study Group - Biology",
      type: "study",
      date: "2025-09-14",
      time: "4:00 PM",
      duration: "2 hours",
      location: "Library, Group Study Room 3",
      priority: "low",
      color: "green",
    },
    {
      id: 5,
      title: "Campus Career Fair",
      type: "event",
      date: "2025-09-18",
      time: "9:00 AM",
      duration: "6 hours",
      location: "Student Center Main Hall",
      priority: "medium",
      color: "purple",
    },
  ];

  const tasks: Task[] = [
    {
      id: 1,
      title: "Complete Physics Problem Set Chapter 7",
      completed: false,
      priority: "high",
      dueDate: "2025-09-12",
      category: "homework",
    },
    {
      id: 2,
      title: "Read Biology Chapter 5: Cell Division",
      completed: true,
      priority: "medium",
      dueDate: "2025-09-10",
      category: "reading",
    },
    {
      id: 3,
      title: "Prepare Chemistry Lab Report",
      completed: false,
      priority: "high",
      dueDate: "2025-09-15",
      category: "lab",
    },
    {
      id: 4,
      title: "Review Math Notes for Quiz",
      completed: false,
      priority: "medium",
      dueDate: "2025-09-11",
      category: "study",
    },
    {
      id: 5,
      title: "Update Resume for Career Fair",
      completed: false,
      priority: "high",
      dueDate: "2025-09-17",
      category: "career",
    },
  ];

  const upcomingEvents = events
    .filter((event) => new Date(event.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const pendingTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);

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
                  {pendingTasks.length}
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
                <p className="text-3xl font-bold text-red-600">2</p>
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
                  {Math.round((completedTasks.length / tasks.length) * 100)}%
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
                        <Input placeholder="Event title" />
                        <Select>
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
                            <SelectItem value="event">Campus Event</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input placeholder="Location" />
                        <Textarea placeholder="Notes (optional)" />
                        <div className="flex gap-2">
                          <Button className="flex-1">Save Event</Button>
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
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border w-full"
              />

              {/* Events for Selected Date */}
              {selectedDate && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">
                    Events for {selectedDate.toLocaleDateString()}
                  </h4>
                  <div className="space-y-2">
                    {events
                      .filter(
                        (event) =>
                          new Date(event.date).toDateString() ===
                          selectedDate.toDateString()
                      )
                      .map((event) => (
                        <div
                          key={event.id}
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
                      ))}
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
              {upcomingEvents.map((event) => (
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
                      {new Date(event.date).toLocaleDateString()} at{" "}
                      {event.time}
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
                    {completedTasks.length}/{tasks.length} completed
                  </span>
                </div>
                <Progress
                  value={(completedTasks.length / tasks.length) * 100}
                  className="h-2"
                />
              </div>

              <div className="space-y-3 mt-4">
                {pendingTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                  >
                    <CheckCircle className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{task.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={getPriorityColor(task.priority)}
                    >
                      {task.priority}
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
