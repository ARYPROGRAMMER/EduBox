"use client";

import React from "react";
import { FeatureFlag } from "@/features/flag";
import { LockedFeature } from "@/components/locked-feature";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, BarChart3, Activity, Calendar, Plus, BookOpen, FileText, Timer, Upload } from "lucide-react";
import { CourseCreationDialog } from "@/components/dialogs/course-creation-dialog";
import { AssignmentCreationDialog } from "@/components/dialogs/assignment-creation-dialog";
import { StudySessionTimer } from "@/components/dialogs/study-session-timer";

// Main component wrapped in React.memo with proper dependency tracking
const AnalyticsPage = React.memo(() => {
  const { user } = useUser();
  const [selectedPeriod, setSelectedPeriod] = useState("30");
  
  // Stabilize query parameters
  const queryParams = useMemo(() => {
    if (!user?.id) return "skip";
    return { 
      userId: user.id,
      periodDays: parseInt(selectedPeriod)
    };
  }, [user?.id, selectedPeriod]);

  const studySessionsParams = useMemo(() => {
    if (!user?.id) return "skip";
    return {
      userId: user.id,
      startDate: Date.now() - (parseInt(selectedPeriod) * 24 * 60 * 60 * 1000),
      endDate: Date.now(),
      limit: 50
    };
  }, [user?.id, selectedPeriod]);

  const gradeHistoryParams = useMemo(() => {
    if (!user?.id) return "skip";
    return {
      userId: user.id,
      limit: 50
    };
  }, [user?.id]);
  
  // Queries with stabilized parameters
  const analyticsSummary = useQuery(api.analytics.getAnalyticsSummary, queryParams);
  const studySessions = useQuery(api.analytics.getStudySessions, studySessionsParams);
  const gradeHistory = useQuery(api.analytics.getGradeHistory, gradeHistoryParams);

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
        <p className="text-muted-foreground">Please sign in to view analytics.</p>
      </div>
    );
  }

  // Show empty state when no data exists
  if (!hasData && analyticsSummary !== undefined) {
    return (
      <div className="space-y-6">
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
              <h3 className="text-2xl font-semibold mb-2">No Analytics Data Yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Start adding courses, assignments, and study sessions to see your academic performance analytics.
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
                    <p className="text-sm text-muted-foreground">Create your first course with schedule</p>
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
                    <p className="text-sm text-muted-foreground">Track assignments and due dates</p>
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
                    <p className="text-sm text-muted-foreground">Track study time and productivity</p>
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
                  <p className="text-sm text-muted-foreground">Upload CSV files to import data</p>
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
                  <p className="text-sm"><strong>1. Add your courses</strong> - Start by adding your current courses with schedules</p>
                  <p className="text-sm"><strong>2. Track assignments</strong> - Add assignments with due dates to track your workload</p>
                  <p className="text-sm"><strong>3. Log study sessions</strong> - Use the study timer to track your productivity</p>
                  <p className="text-sm"><strong>4. Import existing data</strong> - Upload CSV files if you have existing academic data</p>
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">
            Track your academic performance and study patterns
          </p>
        </div>
        
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
            <CardTitle className="text-sm font-medium">Study Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsSummary?.studySessionsCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Total sessions
            </p>
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
            <p className="text-xs text-muted-foreground">
              Active courses
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

AnalyticsPage.displayName = "AnalyticsPage";

// Export with LockedFeature wrapper
export default function AnalyticsPageWrapper() {
  return (
    <LockedFeature feature={FeatureFlag.COURSE_ANALYTICS} requiredPlan="STARTER">
      <AnalyticsPage />
    </LockedFeature>
  );
}