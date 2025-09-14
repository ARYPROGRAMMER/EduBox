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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Share2, 
  MessageSquare, 
  FileText, 
  Calendar,
  UserPlus,
  Settings,
  Crown,
} from "lucide-react";

export function CollaborationHub() {
  const [activeTab, setActiveTab] = useState("projects");

  const mockProjects = [
    {
      id: 1,
      title: "Physics Lab Report",
      course: "PHYS 101",
      members: ["John Doe", "Jane Smith", "You"],
      status: "In Progress",
      dueDate: "2025-01-20",
    },
    {
      id: 2,
      title: "Marketing Strategy Presentation",
      course: "MKTG 301",
      members: ["Alice Johnson", "Bob Wilson", "You"],
      status: "Planning",
      dueDate: "2025-01-25",
    },
  ];

  const mockStudyGroups = [
    {
      id: 1,
      name: "Calculus Study Group",
      course: "MATH 201",
      members: 8,
      nextSession: "Tomorrow 3:00 PM",
      location: "Library Room 204",
    },
    {
      id: 2,
      name: "Chemistry Review",
      course: "CHEM 101",
      members: 6,
      nextSession: "Friday 2:00 PM",
      location: "Science Building 302",
    },
  ];

  return (
    <LockedFeature
      feature={FeatureFlag.COLLABORATION_TOOLS}
      title="Collaboration Tools"
      description="Work together with classmates on projects and study groups."
      requiredPlan="PRO"
    >
      <div className="space-y-6">
        <div className="relative">
          <h2 className="text-3xl font-bold tracking-tight">
            Collaboration Hub
          </h2>
          <p className="text-muted-foreground">
            Work together with classmates on projects and study groups.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="projects">Group Projects</TabsTrigger>
            <TabsTrigger value="study-groups">Study Groups</TabsTrigger>
            <TabsTrigger value="sharing">File Sharing</TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Your Group Projects</h3>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {mockProjects.map((project) => (
                <Card key={project.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{project.title}</CardTitle>
                        <CardDescription>{project.course}</CardDescription>
                      </div>
                      <Badge variant={project.status === "In Progress" ? "default" : "secondary"}>
                        {project.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Team Members:</p>
                      <div className="flex flex-wrap gap-1">
                        {project.members.map((member, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {member}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Due: {project.dueDate}</span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Chat
                        </Button>
                        <Button size="sm">
                          <FileText className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="study-groups" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Study Groups</h3>
              <Button>
                <Users className="w-4 h-4 mr-2" />
                Join Group
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {mockStudyGroups.map((group) => (
                <Card key={group.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                    <CardDescription>{group.course}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>{group.members} members</span>
                      <Badge variant="outline">{group.course}</Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                        {group.nextSession}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span className="ml-6">{group.location}</span>
                      </div>
                    </div>
                    <Button className="w-full" size="sm">
                      Join Session
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sharing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Share Files & Resources</CardTitle>
                <CardDescription>
                  Share study materials and resources with your classmates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Share with:</label>
                  <Input placeholder="Enter classmate emails or group name" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message (optional):</label>
                  <Textarea placeholder="Add a note about these files..." />
                </div>
                <Button className="w-full">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Selected Files
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Shared Files</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Share2 className="w-12 h-12 mx-auto mb-4" />
                  <p>No shared files yet</p>
                  <p className="text-sm">Files shared with you will appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </LockedFeature>
  );
}