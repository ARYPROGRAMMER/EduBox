"use client";

import { FeatureFlag } from "@/features/flag";
import { LockedFeature } from "@/components/locked-feature";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp, BarChart3, PieChart, Activity, Calendar, BookOpen, Clock, Target } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
} from "recharts";

export function AnalyticsComponent() {
  // Sample data for charts
  const performanceData = [
    { week: "Week 1", gpa: 3.2, assignments: 8, study_hours: 25 },
    { week: "Week 2", gpa: 3.4, assignments: 9, study_hours: 28 },
    { week: "Week 3", gpa: 3.6, assignments: 10, study_hours: 32 },
    { week: "Week 4", gpa: 3.5, assignments: 8, study_hours: 30 },
    { week: "Week 5", gpa: 3.7, assignments: 11, study_hours: 35 },
    { week: "Week 6", gpa: 3.8, assignments: 12, study_hours: 38 },
    { week: "Week 7", gpa: 3.7, assignments: 10, study_hours: 33 },
    { week: "Week 8", gpa: 3.9, assignments: 13, study_hours: 40 },
  ];

  const courseData = [
    { name: "Mathematics", grade: 92, credits: 4, color: "#8884d8" },
    { name: "Computer Science", grade: 88, credits: 3, color: "#82ca9d" },
    { name: "Physics", grade: 85, credits: 4, color: "#ffc658" },
    { name: "English", grade: 90, credits: 3, color: "#ff7300" },
    { name: "History", grade: 87, credits: 3, color: "#00ff00" },
  ];

  return (
    <LockedFeature feature={FeatureFlag.COURSE_ANALYTICS} requiredPlan="STARTER">
      <div className="space-y-6">
        <div className="relative">
          <h2 className="text-3xl font-bold tracking-tight">
            Analytics Dashboard
          </h2>
          <p className="text-muted-foreground">
            Track your academic performance and identify improvement areas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current GPA</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3.8</div>
              <p className="text-xs text-muted-foreground">
                +0.2 from last semester
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Study Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">38</div>
              <p className="text-xs text-muted-foreground">
                This week
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assignments</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">13</div>
              <p className="text-xs text-muted-foreground">
                Completed this week
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">95%</div>
              <p className="text-xs text-muted-foreground">
                Assignment accuracy
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>
                Your academic performance over the past 8 weeks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="gpa"
                      stroke="#8884d8"
                      strokeWidth={2}
                      name="GPA"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Course Performance</CardTitle>
              <CardDescription>
                Current grades by course
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={courseData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="grade" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </LockedFeature>
  );
}