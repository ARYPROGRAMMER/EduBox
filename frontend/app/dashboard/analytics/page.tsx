"use client";

import React from "react";
import { FeatureFlag } from "@/features/flag";
import { LockedFeature } from "@/components/locked-feature";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  BarChart3,
  Activity,
  Calendar,
  Plus,
  BookOpen,
  FileText,
  Timer,
  Upload,
} from "lucide-react";
import { CourseCreationDialog } from "@/components/dialogs/course-creation-dialog";
import { AssignmentCreationDialog } from "@/components/dialogs/assignment-creation-dialog";
import { StudySessionTimer } from "@/components/dialogs/study-session-timer";
import {
  ResponsiveContainer,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import MobileGate from "@/components/mobile-gate";
import { DashboardHeader } from "@/components/dashboard-header";
import AnalyticsPDFExport from "@/components/analytics-pdf-export";

// Main component wrapped in React.memo with proper dependency tracking
const AnalyticsPage = React.memo(() => {
  const { user } = useUser();
  const [selectedPeriod, setSelectedPeriod] = useState("30");
  const [mounted, setMounted] = useState(false);

  // Stabilize query parameters
  const queryParams = useMemo(() => {
    if (!user?.id) return "skip";
    return {
      userId: user.id,
      periodDays: parseInt(selectedPeriod),
    };
  }, [user?.id, selectedPeriod]);

  const studySessionsParams = useMemo(() => {
    if (!user?.id) return "skip";
    return {
      userId: user.id,
      startDate: Date.now() - parseInt(selectedPeriod) * 24 * 60 * 60 * 1000,
      endDate: Date.now(),
      limit: 50,
    };
  }, [user?.id, selectedPeriod]);

  const gradeHistoryParams = useMemo(() => {
    if (!user?.id) return "skip";
    return {
      userId: user.id,
      limit: 50,
    };
  }, [user?.id]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Queries with stabilized parameters
  const analyticsSummary = useQuery(
    api.analytics.getAnalyticsSummary,
    queryParams
  );
  const studySessions = useQuery(
    api.analytics.getStudySessions,
    studySessionsParams
  );
  const gradeHistory = useQuery(
    api.analytics.getGradeHistory,
    gradeHistoryParams
  );
  const assignmentStats = useQuery(
    api.assignments.getAssignmentStats,
    user?.id ? { userId: user.id } : "skip"
  );
  const courseStats = useQuery(
    api.courses.getCourseStats,
    user?.id ? { userId: user.id } : "skip"
  );
  const academicAnalytics = useQuery(
    api.analytics.getAcademicAnalytics,
    user?.id ? { userId: user.id, period: selectedPeriod } : "skip"
  );

  // Reminder-related queries
  const upcomingAssignmentsQuery = useQuery(
    api.assignments.getUpcomingAssignments,
    user?.id ? { userId: user.id, days: 7 } : "skip"
  );
  // Fallback: fetch pending assignments and compute upcoming client-side so reminders are robust
  const pendingAssignmentsQuery = useQuery(
    api.assignments.getAssignments,
    user?.id ? { userId: user.id, status: "pending", limit: 50 } : "skip"
  );
  const upcomingEventsQuery = useQuery(
    api.events.getUpcomingEvents,
    user?.id ? { userId: user.id } : "skip"
  );
  const activeStudySessionsQuery = useQuery(
    api.analytics.getActiveStudySessionsForUser,
    user?.id ? { userId: user.id } : "skip"
  );
  const todayScheduleQuery = useQuery(
    api.schedules.getCombinedSchedule,
    user?.id
      ? {
          userId: user.id,
          includeClasses: true,
          includeDining: true,
          dayOfWeek: new Date().toLocaleString("en-US", { weekday: "long" }),
        }
      : "skip"
  );

  // Derived datasets for charts
  const studiesByDay = useMemo(() => {
    if (!studySessions || studySessions.length === 0) return [];
    const map: Record<
      string,
      { date: string; studyMinutes: number; focusSum: number; count: number }
    > = {};
    for (const s of studySessions as any[]) {
      const date = new Date(s.startTime).toISOString().split("T")[0];
      if (!map[date])
        map[date] = { date, studyMinutes: 0, focusSum: 0, count: 0 };
      map[date].studyMinutes += s.duration || 0;
      map[date].focusSum += s.focusScore || 0;
      map[date].count += 1;
    }
    const arr = Object.values(map).sort((a, b) => (a.date > b.date ? 1 : -1));
    return arr.map((d) => ({
      date: d.date,
      studyHours: +(d.studyMinutes / 60).toFixed(2),
      avgFocus: Math.round(d.focusSum / Math.max(1, d.count)),
    }));
  }, [studySessions]);

  const assignmentsByDay = useMemo(() => {
    if (!gradeHistory || gradeHistory.length === 0) return [];
    const map: Record<string, number> = {};
    for (const g of gradeHistory as any[]) {
      const date = new Date(g.submittedAt || Date.now())
        .toISOString()
        .split("T")[0];
      map[date] = (map[date] || 0) + 1;
    }
    return Object.keys(map)
      .sort()
      .map((d) => ({ date: d, submissions: map[d] }));
  }, [gradeHistory]);

  // Assignment status pie data
  const assignmentStatusPie = useMemo(() => {
    if (!assignmentStats) return [];
    const keys = [
      { key: "pending", label: "Pending", color: "#f59e0b" },
      { key: "submitted", label: "Submitted", color: "#3b82f6" },
      { key: "graded", label: "Graded", color: "#10b981" },
      { key: "overdue", label: "Overdue", color: "#ef4444" },
    ];
    return keys.map((k) => ({
      name: k.label,
      value: (assignmentStats as any)[k.key] || 0,
      color: k.color,
    }));
  }, [assignmentStats]);

  // Weekly study hours (last 7 days)
  const weeklyStudy = useMemo(() => {
    const days = 7;
    const now = Date.now();
    const map: Record<string, number> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      map[d] = 0;
    }
    if (studySessions) {
      for (const s of studySessions as any[]) {
        const d = new Date(s.startTime).toISOString().split("T")[0];
        map[d] = (map[d] || 0) + (s.duration || 0) / 60;
      }
    }
    return Object.keys(map).map((d) => ({
      date: d,
      hours: +(map[d] || 0).toFixed(2),
    }));
  }, [studySessions]);

  // Session/streak cards
  const sessionStats = useMemo(() => {
    const totalSessions = studySessions?.length || 0;
    const avgDuration =
      studySessions && studySessions.length > 0
        ? Math.round(
            studySessions.reduce((s: any, x: any) => s + (x.duration || 0), 0) /
              studySessions.length /
              60
          )
        : 0;
    // compute simple streak: consecutive days with >0 study for last N days
    const days = 14;
    const now = Date.now();
    const seen: Record<string, boolean> = {};
    if (studySessions) {
      for (const s of studySessions as any[]) {
        const d = new Date(s.startTime).toISOString().split("T")[0];
        seen[d] = true;
      }
    }
    let streak = 0;
    for (let i = 0; i < days; i++) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      if (seen[d]) streak++;
      else break;
    }
    return { totalSessions, avgDuration, streak };
  }, [studySessions]);

  const courseAverages = useMemo(() => {
    if (!gradeHistory || gradeHistory.length === 0) return [];
    const map: Record<string, { name: string; total: number; count: number }> =
      {};
    for (const g of gradeHistory as any[]) {
      const key =
        g.courseId || (g.assignmentTitle ? g.assignmentTitle : "Unknown");
      if (!map[key])
        map[key] = { name: g.courseId || "Unknown", total: 0, count: 0 };
      const val = Number(g.numericGrade || 0);
      map[key].total += val;
      map[key].count += 1;
    }
    return Object.keys(map).map((k, idx) => ({
      name: map[k].name,
      avgGrade:
        Math.round((map[k].total / Math.max(1, map[k].count)) * 10) / 10,
      color: ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00c2ff"][idx % 5],
    }));
  }, [gradeHistory]);

  // Memoized period change handler
  const handlePeriodChange = useCallback((period: string) => {
    setSelectedPeriod(period);
  }, []);

  // Check if analytics data is empty
  const hasData = useMemo(() => {
    return (
      (analyticsSummary?.totalStudyHours || 0) > 0 ||
      (analyticsSummary?.totalAssignments || 0) > 0 ||
      (analyticsSummary?.studySessionsCount || 0) > 0 ||
      (analyticsSummary?.totalCourses || 0) > 0
    );
  }, [analyticsSummary]);

  if (!user) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">
          Please sign in to view analytics.
        </p>
      </div>
    );
  }

  // Show empty state when no data exists
  if (!hasData && analyticsSummary !== undefined) {
    return (
      <div className="space-y-6">
        <DashboardHeader mounted />
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
            <p className="text-muted-foreground">
              Track your academic performance and study patterns
            </p>
          </div>
        </div>

        {/* Empty State */}
        <div className="text-center space-y-8 py-12">
          <div className="space-y-4">
            <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground/50" />
            <div>
              <h3 className="text-2xl font-semibold mb-2">
                No Analytics Data Yet
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Start adding courses, assignments, and study sessions to see
                your academic performance analytics.
              </p>
            </div>
          </div>

          {/* Quick Data Entry Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <CourseCreationDialog>
              <Card className="cursor-pointer hover:shadow-md transition-shadow border-dashed">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg mx-auto flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Add Course</h4>
                    <p className="text-sm text-muted-foreground">
                      Create your first course with schedule
                    </p>
                  </div>
                  <Button size="sm" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Course
                  </Button>
                </CardContent>
              </Card>
            </CourseCreationDialog>

            <AssignmentCreationDialog>
              <Card className="cursor-pointer hover:shadow-md transition-shadow border-dashed">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg mx-auto flex items-center justify-center">
                    <FileText className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Add Assignment</h4>
                    <p className="text-sm text-muted-foreground">
                      Track assignments and due dates
                    </p>
                  </div>
                  <Button size="sm" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Assignment
                  </Button>
                </CardContent>
              </Card>
            </AssignmentCreationDialog>

            <StudySessionTimer>
              <Card className="cursor-pointer hover:shadow-md transition-shadow border-dashed">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg mx-auto flex items-center justify-center">
                    <Timer className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Start Study Session</h4>
                    <p className="text-sm text-muted-foreground">
                      Track study time and productivity
                    </p>
                  </div>
                  <Button size="sm" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Start Session
                  </Button>
                </CardContent>
              </Card>
            </StudySessionTimer>

            <Card className="cursor-pointer hover:shadow-md transition-shadow border-dashed">
              <CardContent className="p-6 text-center space-y-3">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg mx-auto flex items-center justify-center">
                  <Upload className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium">Import Data</h4>
                  <p className="text-sm text-muted-foreground">
                    Upload CSV files to import data
                  </p>
                </div>
                <Button size="sm" className="w-full" asChild>
                  <a href="/dashboard/data-import-export">
                    <Upload className="w-4 h-4 mr-2" />
                    Import Data
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Getting Started Tips */}
          <div className="max-w-2xl mx-auto">
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg">Getting Started Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-left space-y-3">
                <div className="space-y-2">
                  <p className="text-sm">
                    <strong>1. Add your courses</strong> - Start by adding your
                    current courses with schedules
                  </p>
                  <p className="text-sm">
                    <strong>2. Track assignments</strong> - Add assignments with
                    due dates to track your workload
                  </p>
                  <p className="text-sm">
                    <strong>3. Log study sessions</strong> - Use the study timer
                    to track your productivity
                  </p>
                  <p className="text-sm">
                    <strong>4. Import existing data</strong> - Upload CSV files
                    if you have existing academic data
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardHeader mounted />
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        <p className="text-muted-foreground">
          Track your academic performance and study patterns
        </p>
      </div>
      {/* Reminders Panel - high visibility */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Reminders</CardTitle>
            <CardDescription>
              Assignments, classes and sessions to act on
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <h4 className="text-sm font-medium">Upcoming Assignments</h4>
                <div className="space-y-2 mt-2">
                  {(
                    (upcomingAssignmentsQuery && upcomingAssignmentsQuery.length
                      ? upcomingAssignmentsQuery
                      : (pendingAssignmentsQuery || [])
                          .filter(
                            (a: any) => a.dueDate && a.dueDate > Date.now()
                          )
                          .sort(
                            (x: any, y: any) => x.dueDate - y.dueDate
                          )) as any[]
                  )
                    .slice(0, 4)
                    .map((a: any) => (
                      <div
                        key={a._id}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <div className="min-w-0">
                          <div className="truncate font-medium">{a.title}</div>
                          <div className="text-xs text-muted-foreground">
                            Due{" "}
                            {mounted
                              ? new Date(a.dueDate).toLocaleString()
                              : ""}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground ml-2">
                          {a.priority}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium">Today's Schedule</h4>
                <div className="space-y-2 mt-2">
                  {(todayScheduleQuery?.classes || [])
                    .slice(0, 4)
                    .map((c: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <div className="min-w-0">
                          <div className="truncate font-medium">
                            {c.subject || c.courseName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {c.startTime} - {c.endTime}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground ml-2">
                          {c.location}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium">Active Study Sessions</h4>
                <div className="space-y-2 mt-2">
                  {(activeStudySessionsQuery || [])
                    .slice(0, 4)
                    .map((s: any) => (
                      <div
                        key={s._id}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <div className="min-w-0">
                          <div className="truncate font-medium">
                            {s.title || s.subject}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Started{" "}
                            {mounted
                              ? new Date(s.startTime).toLocaleTimeString()
                              : ""}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground ml-2">
                          {Math.round((s.duration || 0) / 60)}m
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium">Upcoming Events</h4>
                <div className="space-y-2 mt-2">
                  {(upcomingEventsQuery || []).slice(0, 4).map((e: any) => (
                    <div
                      key={e._id}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">{e.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {mounted
                            ? new Date(e.startTime).toLocaleString()
                            : ""}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground ml-2">
                        {e.type}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {["7", "30", "90"].map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? "default" : "outline"}
              onClick={() => handlePeriodChange(period)}
            >
              {period} days
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Hours</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsSummary?.totalStudyHours?.toFixed(1) || "0.0"}
            </div>
            <p className="text-xs text-muted-foreground">
              Last {selectedPeriod} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsSummary?.totalAssignments || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Completed this period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Study Sessions
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsSummary?.studySessionsCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">Total sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsSummary?.totalCourses || 0}
            </div>
            <p className="text-xs text-muted-foreground">Active courses</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Charts */}
      <AnalyticsPDFExport>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Assignment Status</CardTitle>
              <CardDescription>
                Distribution of assignment states
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-56 flex items-center justify-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={assignmentStatusPie}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={70}
                      label
                    >
                      {assignmentStatusPie.map((entry: any, idx: number) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Weekly Study Hours</CardTitle>
              <CardDescription>
                Hours studied per day (last 7 days)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={weeklyStudy}
                    margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="hours" name="Hours" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Session Stats</CardTitle>
              <CardDescription>Streak and averages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground">
                    Total Sessions
                  </div>
                  <div className="text-xl font-bold">
                    {sessionStats.totalSessions}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    Avg Session (min)
                  </div>
                  <div className="text-xl font-bold">
                    {sessionStats.avgDuration}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    Current Streak (days)
                  </div>
                  <div className="text-xl font-bold">{sessionStats.streak}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Study Hours & Focus</CardTitle>
              <CardDescription>
                Daily study hours (area) and average focus score (line)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={studiesByDay}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorStudy"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#82ca9d"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#82ca9d"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} />
                    <YAxis yAxisId="left" unit="h" />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      domain={[0, 100]}
                    />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="studyHours"
                      name="Study Hours"
                      stroke="#82ca9d"
                      fillOpacity={1}
                      fill="url(#colorStudy)"
                      yAxisId="left"
                    />
                    <Line
                      type="monotone"
                      dataKey="avgFocus"
                      name="Avg Focus"
                      stroke="#8884d8"
                      yAxisId="right"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assignments Submitted</CardTitle>
              <CardDescription>Assignments submitted by day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={assignmentsByDay}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} />
                    <YAxis />
                    <Tooltip />
                    <Bar
                      dataKey="submissions"
                      name="Submissions"
                      fill="#8884d8"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Average Grades</CardTitle>
              <CardDescription>Average grade per course</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={courseAverages}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="avgGrade" name="Avg Grade">
                      {courseAverages.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Study Sessions Breakdown</CardTitle>
              <CardDescription>
                Distribution of session durations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72 flex items-center justify-center">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={studiesByDay.slice(-8).map((d) => ({
                        name: d.date.slice(5),
                        value: d.studyHours,
                      }))}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={80}
                      fill="#8884d8"
                      label
                    >
                      {studiesByDay.slice(-8).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            [
                              "#8884d8",
                              "#82ca9d",
                              "#ffc658",
                              "#ff7300",
                              "#00c2ff",
                            ][index % 5]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </AnalyticsPDFExport>
    </div>
  );
});

AnalyticsPage.displayName = "AnalyticsPage";

// Export with LockedFeature wrapper
export default function AnalyticsPageWrapper() {
  return (
    <LockedFeature
      feature={FeatureFlag.COURSE_ANALYTICS}
      requiredPlan="STARTER"
    >
      <MobileGate>
        <AnalyticsPage />
      </MobileGate>
    </LockedFeature>
  );
}
