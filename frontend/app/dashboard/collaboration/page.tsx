"use client";

import { FeatureFlag } from "@/features/flag";
import { LockedFeature } from "@/components/locked-feature";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Users, MessageSquare, Share2, Video, Plus, Star, Search, Settings } from "lucide-react";
import { useState } from "react";

export default function CollaborationHubPage() {
  const [activeTab, setActiveTab] = useState("study-groups");

  const studyGroups = [
    {
      id: 1,
      name: "Calculus Study Group",
      members: 8,
      subject: "Mathematics",
      lastActivity: "2 hours ago",
      status: "active"
    },
    {
      id: 2,
      name: "Biology Lab Partners",
      members: 4,
      subject: "Biology",
      lastActivity: "1 day ago",
      status: "active"
    },
    {
      id: 3,
      name: "History Research Team",
      members: 6,
      subject: "History",
      lastActivity: "3 days ago",
      status: "inactive"
    }
  ];

  const recentActivity = [
    {
      user: "Sarah Johnson",
      action: "shared notes",
      group: "Calculus Study Group",
      time: "1 hour ago",
      avatar: "/placeholder-woman-avatar.png"
    },
    {
      user: "Mike Chen",
      action: "started video session",
      group: "Biology Lab Partners",
      time: "2 hours ago",
      avatar: "/professional-man-avatar.png"
    },
    {
      user: "Emma Davis",
      action: "created study plan",
      group: "History Research Team",
      time: "5 hours ago",
      avatar: "/professional-woman-avatar-2.png"
    }
  ];

  const collaborationTools = [
    {
      name: "Study Groups",
      description: "Create and join study groups with classmates",
      icon: Users,
      count: 3
    },
    {
      name: "Shared Workspace",
      description: "Collaborate on documents and projects",
      icon: Share2,
      count: 12
    },
    {
      name: "Video Sessions",
      description: "Host virtual study sessions and meetings",
      icon: Video,
      count: 8
    },
    {
      name: "Group Chat",
      description: "Real-time messaging with study partners",
      icon: MessageSquare,
      count: 24
    }
  ];

  return (
    <LockedFeature feature={FeatureFlag.COLLABORATION_TOOLS} requiredPlan="PRO">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              Collaboration Hub
            </h2>
            <p className="text-muted-foreground">
              Connect and collaborate with classmates and study partners
            </p>
          </div>
          <Badge variant="secondary" className="text-blue-600 border-blue-200">
            <Star className="w-3 h-3 mr-1" />
            Premium Feature
          </Badge>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {collaborationTools.map((tool, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{tool.name}</CardTitle>
                <tool.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{tool.count}</div>
                <p className="text-xs text-muted-foreground">
                  {tool.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Study Groups */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>My Study Groups</CardTitle>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Group
                  </Button>
                </div>
                <CardDescription>
                  Manage your study groups and collaborate with classmates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input placeholder="Search study groups..." className="flex-1" />
                    <Button variant="outline" size="sm">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {studyGroups.map((group) => (
                      <div key={group.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{group.name}</h3>
                            <Badge variant={group.status === "active" ? "default" : "secondary"} className="text-xs">
                              {group.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{group.subject}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{group.members} members</span>
                            <span>Last activity: {group.lastActivity}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Chat
                          </Button>
                          <Button variant="outline" size="sm">
                            <Video className="h-4 w-4 mr-2" />
                            Meet
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest updates from your study groups
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={activity.avatar} />
                        <AvatarFallback>
                          {activity.user.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1 flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{activity.user}</span>{' '}
                          {activity.action} in{' '}
                          <span className="font-medium">{activity.group}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Study Group
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Search className="h-4 w-4 mr-2" />
                  Find Study Partners
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Video className="h-4 w-4 mr-2" />
                  Start Video Session
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Collaboration Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Real-time Collaboration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Work together on documents, share notes, and collaborate in real-time with built-in tools
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Video & Voice</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Host virtual study sessions with high-quality video and voice chat capabilities
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Smart Matching</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Find study partners with similar courses, schedules, and academic goals using AI matching
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </LockedFeature>
  );
}