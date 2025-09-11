"use client";

import { useState, useEffect } from "react";
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
import { CardSkeleton, ListSkeleton } from "@/components/ui/loader";
import {
  BookOpen,
  Calendar,
  Clock,
  TrendingUp,
  Target,
  Trophy,
  FileText,
  Users,
  Bell,
  CheckCircle,
  AlertCircle,
  Star,
  Zap,
  GraduationCap,
  CalendarDays,
  Brain,
} from "lucide-react";
import { motion } from "framer-motion";
import { BorderBeam } from "@/components/ui/border-beam";
import { cn } from "@/lib/utils";

export function DashboardOverview() {
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading data
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);
  const recentActivities = [
    {
      id: 1,
      type: "assignment",
      title: "Physics Problem Set submitted",
      time: "2 hours ago",
      icon: FileText,
      color: "text-blue-600",
    },
    {
      id: 2,
      type: "study",
      title: "Chemistry study session completed",
      time: "5 hours ago",
      icon: BookOpen,
      color: "text-green-600",
    },
    {
      id: 3,
      type: "exam",
      title: "Math Midterm scheduled",
      time: "1 day ago",
      icon: Calendar,
      color: "text-orange-600",
    },
  ];

  const upcomingDeadlines = [
    {
      id: 1,
      title: "Physics Lab Report",
      course: "Physics 101",
      dueDate: "Sep 15, 2025",
      priority: "high",
      timeLeft: "2 days",
    },
    {
      id: 2,
      title: "Math Assignment 3",
      course: "Calculus I",
      dueDate: "Sep 18, 2025",
      priority: "medium",
      timeLeft: "5 days",
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Welcome Section */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Welcome back! 👋
        </h1>
        <p className="text-muted-foreground text-lg">
          Here&apos;s your academic overview for today. Keep up the great work!
        </p>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <CardSkeleton key={index} lines={1} />
            ))
          : [
              {
                title: "Active Courses",
                value: "12",
                icon: GraduationCap,
                color: "blue",
                gradient: "from-blue-500 to-blue-600",
              },
              {
                title: "Current GPA",
                value: "3.85",
                icon: Trophy,
                color: "green",
                gradient: "from-green-500 to-green-600",
              },
              {
                title: "Study Streak",
                value: "24",
                icon: Zap,
                color: "purple",
                gradient: "from-purple-500 to-purple-600",
              },
              {
                title: "Assignments Due",
                value: "3",
                icon: CalendarDays,
                color: "orange",
                gradient: "from-orange-500 to-orange-600",
              },
            ].map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-200">
                  <BorderBeam size={250} duration={12 + index} delay={index} />
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "w-14 h-14 rounded-2xl bg-gradient-to-r flex items-center justify-center text-white transition-all duration-300 group-hover:scale-110",
                          stat.gradient
                        )}
                      >
                        <stat.icon className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-foreground">
                          {stat.value}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {stat.title}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="group relative overflow-hidden">
            <BorderBeam size={300} duration={15} delay={2} />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-600" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Your latest academic accomplishments and updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <ListSkeleton items={4} />
              ) : (
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mt-1">
                        <activity.icon
                          className={cn("w-4 h-4", activity.color)}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Deadlines */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <Card className="group relative overflow-hidden">
            <BorderBeam size={200} duration={18} delay={3} />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <ListSkeleton items={3} />
              ) : (
                <div className="space-y-3">
                  {upcomingDeadlines.map((deadline) => (
                    <div
                      key={deadline.id}
                      className="p-3 rounded-lg border bg-card/50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {deadline.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {deadline.course}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {deadline.dueDate}
                          </p>
                        </div>
                        <Badge
                          variant={
                            deadline.priority === "high"
                              ? "destructive"
                              : deadline.priority === "medium"
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {deadline.timeLeft}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
