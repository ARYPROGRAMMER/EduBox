"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CardSkeleton, ListSkeleton } from "@/components/ui/loader";
import {
  Calendar,
  Clock,
  Trophy,
  Zap,
  GraduationCap,
  CalendarDays,
  Brain,
} from "lucide-react";
import { motion } from "framer-motion";
import { EventWithMeeting } from "@/components/event-with-meeting";
import { cn } from "@/lib/utils";

export function DashboardOverview() {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real data from Convex
  const userProfile = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkId: user.id } : "skip"
  );
  const userStats = useQuery(
    api.users.getUserStats,
    user ? { userId: user.id } : "skip"
  );
  const courseStats = useQuery(
    api.courses.getCourseStats,
    user ? { userId: user.id } : "skip"
  );
  const upcomingAssignments = useQuery(
    api.assignments.getUpcomingAssignments,
    user ? { userId: user.id } : "skip"
  );
  const overdueAssignments = useQuery(
    api.assignments.getOverdueAssignments,
    user ? { userId: user.id } : "skip"
  );
  const upcomingEvents = useQuery(
    api.events.getUpcomingEvents,
    user ? { userId: user.id, days: 7, limit: 5 } : "skip"
  );
  const eventStats = useQuery(
    api.events.getEventStats,
    user ? { userId: user.id } : "skip"
  );

  useEffect(() => {
    if (
      userProfile !== undefined &&
      userStats !== undefined &&
      courseStats !== undefined &&
      upcomingAssignments !== undefined &&
      upcomingEvents !== undefined
    ) {
      setIsLoading(false);
    }
  }, [
    userProfile,
    userStats,
    courseStats,
    upcomingAssignments,
    upcomingEvents,
  ]);

  const formatTimeLeft = (dueDate: number) => {
    const now = Date.now();
    const diff = dueDate - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return "Overdue";
    if (days === 0) return "Due today";
    if (days === 1) return "Due tomorrow";
    return `${days} days left`;
  };

  return (

    
    <div className="min-h-screen">
      <div className="space-y-8 p-6 sm:p-8">
        {/* Welcome Section */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative">
            <h1 className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4 leading-tight">
              Welcome back, {user?.firstName || user?.fullName || "Student"}! 👋
            </h1>
            <p className="text-muted-foreground text-xl max-w-2xl">
              Here&apos;s your academic overview for today. You&apos;re doing
              great - keep up the excellent work!
            </p>
            {/* Decorative elements */}
            <div className="absolute -top-2 -right-2 w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-10 blur-xl"></div>
            <div className="absolute top-8 -left-4 w-16 h-16 bg-gradient-to-r from-indigo-400 to-blue-500 rounded-full opacity-10 blur-lg"></div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <CardSkeleton key={index} lines={1} />
              ))
            : [
                {
                  title: "Active Courses",
                  value: courseStats?.activeCourses?.toString() || "0",
                  icon: GraduationCap,
                  color: "blue",
                  gradient: "from-blue-500 to-blue-600",
                  bgGradient:
                    "from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900",
                  description: "Enrolled this semester",
                },
                {
                  title: "Current GPA",
                  value: userProfile?.gpa
                    ? userProfile.gpa.toFixed(2)
                    : "Not Set",
                  icon: Trophy,
                  color: "green",
                  gradient: "from-green-500 to-green-600",
                  bgGradient:
                    "from-green-50 to-green-100 dark:from-green-950 dark:to-green-900",
                  description: "Academic performance",
                },
                {
                  title: "Upcoming Events",
                  value: eventStats?.thisWeek?.toString() || "0",
                  icon: Zap,
                  color: "purple",
                  gradient: "from-purple-500 to-purple-600",
                  bgGradient:
                    "from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900",
                  description: "This week",
                },
                {
                  title: "Due Soon",
                  value: upcomingAssignments?.length?.toString() || "0",
                  icon: CalendarDays,
                  color: "orange",
                  gradient: "from-orange-500 to-orange-600",
                  bgGradient:
                    "from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900",
                  description: "Assignments pending",
                },
              ].map((stat, index) => (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-500 border-0 bg-gradient-to-br border-blue-200 shadow-lg">
                    <div
                      className={cn(
                        "absolute inset-0 bg-gradient-to-br opacity-5",
                        stat.bgGradient
                      )}
                    ></div>

                    <CardContent className="p-7 relative z-10">
                      <div className="flex items-center gap-5">
                        <div
                          className={cn(
                            "w-16 h-16 rounded-2xl bg-gradient-to-r flex items-center justify-center text-white shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:shadow-xl",
                            stat.gradient
                          )}
                        >
                          <stat.icon className="w-8 h-8" />
                        </div>
                        <div className="flex-1">
                          <p className="text-4xl font-bold text-foreground mb-1">
                            {stat.value}
                          </p>
                          <p className="text-base font-medium text-muted-foreground mb-1">
                            {stat.title}
                          </p>
                          <p className="text-sm text-muted-foreground/70">
                            {stat.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="group relative overflow-hidden border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <div className="absolute inset-0 "></div>
              <CardHeader className="relative z-10 pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  Recent Activity
                </CardTitle>
                <CardDescription className="text-base">
                  Your latest academic accomplishments and updates
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                {isLoading ? (
                  <ListSkeleton items={4} />
                ) : (
                  <div className="space-y-4">
                    {upcomingEvents && upcomingEvents.length > 0 ? (
                      upcomingEvents.map((event: any) => (
                        <div
                          key={event._id}
                          className="flex items-start gap-4 p-4 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-blue-100/50 dark:border-blue-900/50 hover:bg-blue-50/70 dark:hover:bg-blue-950/70 transition-all duration-300 shadow-sm hover:shadow-md"
                        >
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                            <Calendar className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-base text-foreground">
                              {event.title}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {new Date(event.startTime).toLocaleDateString()} •{" "}
                              {event.location || "Online"}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mx-auto mb-4">
                          <Calendar className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-base text-muted-foreground">
                          No recent activity
                        </p>
                        <p className="text-sm text-muted-foreground/70 mt-1">
                          Your recent events will appear here
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Upcoming Deadlines */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="group relative overflow-hidden border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-red-50/50 dark:from-orange-950/50 dark:to-red-950/50"></div>
              <CardHeader className="relative z-10 pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  Upcoming Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <ListSkeleton items={3} />
                ) : (
                  <div className="space-y-3">
                    {upcomingAssignments && upcomingAssignments.length > 0 ? (
                      upcomingAssignments.map((assignment: any) => (
                        <div
                          key={assignment._id}
                          className="p-3 rounded-lg border bg-card/50"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm">
                                {assignment.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {assignment.courseName || "Course"}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Due:{" "}
                                {new Date(
                                  assignment.dueDate
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge
                              variant={
                                assignment.priority === "high"
                                  ? "destructive"
                                  : assignment.priority === "medium"
                                  ? "secondary"
                                  : "outline"
                              }
                              className="text-xs"
                            >
                              {formatTimeLeft(assignment.dueDate)}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No upcoming deadlines
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Upcoming Meetings Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <EventWithMeeting
              events={upcomingEvents}
              showCreateButton={true}
              className="mt-6 "
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
