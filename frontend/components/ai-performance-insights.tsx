"use client";

import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown,
  Brain, 
  Target, 
  Award,
  Clock,
  BookOpen,
  BarChart3,
  Crown,
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Zap,
  Star,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";

export function AiPerformanceInsights() {
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("week");

  const performanceData = [
    { name: "Mon", studyTime: 4, efficiency: 78, retention: 85 },
    { name: "Tue", studyTime: 6, efficiency: 82, retention: 88 },
    { name: "Wed", studyTime: 3, efficiency: 75, retention: 82 },
    { name: "Thu", studyTime: 5, efficiency: 88, retention: 92 },
    { name: "Fri", studyTime: 4, efficiency: 80, retention: 86 },
    { name: "Sat", studyTime: 7, efficiency: 85, retention: 90 },
    { name: "Sun", studyTime: 2, efficiency: 70, retention: 78 },
  ];

  const subjectPerformance = [
    { subject: "Mathematics", score: 92, trend: "up", change: "+5%" },
    { subject: "Physics", score: 87, trend: "up", change: "+3%" },
    { subject: "Chemistry", score: 79, trend: "down", change: "-2%" },
    { subject: "Computer Science", score: 95, trend: "up", change: "+8%" },
    { subject: "English", score: 84, trend: "stable", change: "0%" },
  ];

  const studyPatterns = [
    { pattern: "Morning Study", efficiency: 85, frequency: 4, recommendation: "Optimal time for complex topics" },
    { pattern: "Afternoon Review", efficiency: 72, frequency: 6, recommendation: "Good for practice problems" },
    { pattern: "Evening Reading", efficiency: 68, frequency: 5, recommendation: "Best for light reading" },
    { pattern: "Weekend Deep Study", efficiency: 92, frequency: 2, recommendation: "Excellent for project work" },
  ];

  const insights = [
    {
      id: "1",
      type: "strength",
      title: "Mathematics Performance Spike",
      description: "Your math scores improved by 15% after implementing spaced repetition",
      confidence: 94,
      actionable: true,
      priority: "high",
    },
    {
      id: "2",
      type: "opportunity",
      title: "Chemistry Study Optimization",
      description: "Switch chemistry study sessions to mornings for 23% better retention",
      confidence: 87,
      actionable: true,
      priority: "medium",
    },
    {
      id: "3",
      type: "pattern",
      title: "Weekend Study Efficiency",
      description: "Your learning efficiency peaks on Saturday mornings",
      confidence: 91,
      actionable: false,
      priority: "low",
    },
    {
      id: "4",
      type: "warning",
      title: "Attention Span Declining",
      description: "Study session effectiveness drops after 45 minutes",
      confidence: 89,
      actionable: true,
      priority: "high",
    },
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <ArrowUp className="w-4 h-4 text-green-600" />;
      case "down":
        return <ArrowDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "strength":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "opportunity":
        return <Lightbulb className="w-5 h-5 text-blue-600" />;
      case "pattern":
        return <BarChart3 className="w-5 h-5 text-purple-600" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Brain className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-100 text-red-800">High Priority</Badge>;
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800">Medium Priority</Badge>;
      case "low":
        return <Badge className="bg-green-100 text-green-800">Low Priority</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  return (
    <LockedFeature
      feature={FeatureFlag.AI_PERFORMANCE_INSIGHTS}
      title="AI Performance Insights"
      description="Get AI-powered analysis of your learning patterns and performance trends."
      requiredPlan="PRO"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center relative">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              AI Performance Insights
            </h2>
            <p className="text-muted-foreground">
              Discover patterns in your learning and get personalized recommendations.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="semester">This Semester</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline">8 insights remaining this week</Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Overall Performance</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">87%</div>
                  <p className="text-xs text-muted-foreground">
                    +12% from last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Study Efficiency</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">82%</div>
                  <p className="text-xs text-muted-foreground">
                    +8% from last week
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Knowledge Retention</CardTitle>
                  <Brain className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">89%</div>
                  <p className="text-xs text-muted-foreground">
                    +5% from last week
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12 days</div>
                  <p className="text-xs text-muted-foreground">
                    Personal best!
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Trends</CardTitle>
                  <CardDescription>
                    Your study efficiency and retention over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="efficiency" 
                        stroke="#8884d8" 
                        name="Efficiency %" 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="retention" 
                        stroke="#82ca9d" 
                        name="Retention %" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Subject Performance</CardTitle>
                  <CardDescription>
                    How you're performing across different subjects
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {subjectPerformance.map((subject, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          {getTrendIcon(subject.trend)}
                          <span className="font-medium">{subject.subject}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Progress value={subject.score} className="w-20 h-2" />
                        <span className="text-sm font-medium">{subject.score}%</span>
                        <Badge variant="outline" className="text-xs">
                          {subject.change}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">AI-Generated Insights</h3>
              <Button>
                <Brain className="w-4 h-4 mr-2" />
                Generate New Insights
              </Button>
            </div>

            <div className="space-y-4">
              {insights.map((insight) => (
                <Card key={insight.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getInsightIcon(insight.type)}
                        <div>
                          <CardTitle className="text-lg">{insight.title}</CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <span>Confidence: {insight.confidence}%</span>
                            {insight.actionable && (
                              <>
                                <span>•</span>
                                <Zap className="w-3 h-3" />
                                <span>Actionable</span>
                              </>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                      {getPriorityBadge(insight.priority)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-muted-foreground">{insight.description}</p>
                    <div className="flex justify-between items-center">
                      <Progress value={insight.confidence} className="flex-1 mr-4" />
                      <div className="flex gap-2">
                        {insight.actionable && (
                          <Button size="sm">
                            Apply Recommendation
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          Learn More
                        </Button>
                        <Button variant="outline" size="sm">
                          <Star className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="patterns" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Learning Patterns</h3>
              <Badge variant="outline">Analyzed from 12 weeks of data</Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Study Time Distribution</CardTitle>
                  <CardDescription>
                    When you study throughout the week
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="studyTime" 
                        stroke="#8884d8" 
                        fill="#8884d8" 
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Study Pattern Analysis</CardTitle>
                  <CardDescription>
                    Effectiveness of different study patterns
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {studyPatterns.map((pattern, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{pattern.pattern}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {pattern.frequency}x/week
                          </Badge>
                          <span className="text-sm">{pattern.efficiency}%</span>
                        </div>
                      </div>
                      <Progress value={pattern.efficiency} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {pattern.recommendation}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Performance Heatmap</CardTitle>
                <CardDescription>
                  Your learning effectiveness by time and day
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2 text-center">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                    <div key={day} className="space-y-1">
                      <div className="text-sm font-medium">{day}</div>
                      {[1, 2, 3, 4].map((timeSlot) => (
                        <div 
                          key={timeSlot}
                          className={`h-8 rounded text-xs flex items-center justify-center text-white ${
                            Math.random() > 0.5 ? 'bg-green-500' : 
                            Math.random() > 0.3 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                        >
                          {Math.floor(Math.random() * 40) + 60}%
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-xs text-muted-foreground">
                  Time slots: Early Morning, Morning, Afternoon, Evening
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Personalized Recommendations</h3>
              <Button>
                <Target className="w-4 h-4 mr-2" />
                Generate Action Plan
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-500" />
                    Optimize Study Schedule
                  </CardTitle>
                  <CardDescription>
                    Based on your peak performance times
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="font-medium">Recommended Changes:</div>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Move math sessions to Saturday mornings (92% efficiency)</li>
                      <li>• Schedule chemistry for early morning (23% improvement)</li>
                      <li>• Keep physics in current afternoon slot</li>
                      <li>• Add 15-minute breaks every 45 minutes</li>
                    </ul>
                  </div>
                  <Button className="w-full">Apply to Schedule</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-green-500" />
                    Study Method Optimization
                  </CardTitle>
                  <CardDescription>
                    Techniques that work best for you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="font-medium">Recommended Techniques:</div>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Use spaced repetition for vocabulary (15% improvement)</li>
                      <li>• Practice problems for math concepts</li>
                      <li>• Visual diagrams for physics understanding</li>
                      <li>• Pomodoro technique for sustained focus</li>
                    </ul>
                  </div>
                  <Button className="w-full">Save Preferences</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-500" />
                    Focus Areas
                  </CardTitle>
                  <CardDescription>
                    Subjects that need attention
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="font-medium">Priority Focus:</div>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Chemistry: Increase review frequency</li>
                      <li>• English: Practice essay writing</li>
                      <li>• Physics: Strengthen problem-solving</li>
                      <li>• Math: Maintain current momentum</li>
                    </ul>
                  </div>
                  <Button className="w-full">Create Study Plan</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-500" />
                    Goal Setting
                  </CardTitle>
                  <CardDescription>
                    Achievable targets based on your patterns
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="font-medium">Suggested Goals:</div>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Increase overall efficiency to 90%</li>
                      <li>• Maintain 15-day study streak</li>
                      <li>• Improve chemistry score by 10%</li>
                      <li>• Master 5 new study techniques</li>
                    </ul>
                  </div>
                  <Button className="w-full">Set Goals</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </LockedFeature>
  );
}