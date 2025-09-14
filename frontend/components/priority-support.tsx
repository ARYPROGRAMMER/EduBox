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
  Headphones, 
  MessageCircle, 
  Mail, 
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  Crown,
} from "lucide-react";

export function PrioritySupport() {
  const [activeTab, setActiveTab] = useState("tickets");

  const mockTickets = [
    {
      id: "TK-001",
      title: "Unable to sync calendar with Google Calendar",
      status: "In Progress",
      priority: "High",
      created: "2025-01-10",
      lastUpdate: "2 hours ago",
      assignedTo: "Sarah Johnson",
    },
    {
      id: "TK-002",
      title: "File upload not working for large files",
      status: "Resolved",
      priority: "Medium",
      created: "2025-01-08",
      lastUpdate: "Yesterday",
      assignedTo: "Mike Chen",
    },
  ];

  const supportOptions = [
    {
      title: "Live Chat",
      description: "Get instant help from our support team",
      icon: MessageCircle,
      availability: "24/7",
      responseTime: "< 2 minutes",
      premium: true,
    },
    {
      title: "Priority Email",
      description: "Fast-track your support requests",
      icon: Mail,
      availability: "Business hours",
      responseTime: "< 4 hours",
      premium: true,
    },
    {
      title: "Phone Support",
      description: "Speak directly with our experts",
      icon: Phone,
      availability: "9 AM - 6 PM EST",
      responseTime: "Immediate",
      premium: true,
    },
    {
      title: "Screen Sharing",
      description: "Get personalized assistance",
      icon: Headphones,
      availability: "By appointment",
      responseTime: "Same day",
      premium: true,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open": return "bg-blue-100 text-blue-800";
      case "In Progress": return "bg-yellow-100 text-yellow-800";
      case "Resolved": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "bg-red-100 text-red-800";
      case "Medium": return "bg-yellow-100 text-yellow-800";
      case "Low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <LockedFeature
      feature={FeatureFlag.PRIORITY_SUPPORT}
      title="Priority Support"
      description="Get premium support with faster response times and dedicated assistance."
      requiredPlan="PRO"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between relative">
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Star className="w-8 h-8 text-yellow-500" />
              Priority Support
            </h2>
            <p className="text-muted-foreground">
              Premium support for Pro users with faster response times.
            </p>
          </div>
          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
            <Crown className="w-4 h-4 mr-1" />
            Pro Feature
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tickets">My Tickets</TabsTrigger>
            <TabsTrigger value="contact">Contact Support</TabsTrigger>
            <TabsTrigger value="resources">Help Resources</TabsTrigger>
          </TabsList>

          <TabsContent value="tickets" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Support Tickets</h3>
              <Button>Create New Ticket</Button>
            </div>

            <div className="space-y-4">
              {mockTickets.map((ticket) => (
                <Card key={ticket.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{ticket.title}</CardTitle>
                        <CardDescription>Ticket #{ticket.id}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                        <Badge className={getStatusColor(ticket.status)}>
                          {ticket.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Created:</span>
                        <span className="ml-2">{ticket.created}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last Update:</span>
                        <span className="ml-2">{ticket.lastUpdate}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Assigned to:</span>
                        <span className="ml-2">{ticket.assignedTo}</span>
                      </div>
                      <div className="flex justify-end">
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {supportOptions.map((option, index) => (
                <Card key={index} className="relative">
                  {option.premium && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs">
                        <Crown className="w-3 h-3 mr-1" />
                        Pro
                      </Badge>
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <option.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{option.title}</CardTitle>
                        <CardDescription>{option.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Availability:</span>
                        <span>{option.availability}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Response Time:</span>
                        <span className="text-green-600 font-medium">{option.responseTime}</span>
                      </div>
                    </div>
                    <Button className="w-full">
                      Contact via {option.title}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Submit a Support Request</CardTitle>
                <CardDescription>
                  Describe your issue and we'll get back to you quickly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject</label>
                  <Input placeholder="Brief description of your issue" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <select className="w-full p-2 border rounded-md">
                    <option value="low">Low - General question</option>
                    <option value="medium">Medium - Feature request</option>
                    <option value="high">High - Blocking issue</option>
                    <option value="urgent">Urgent - Critical problem</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea 
                    placeholder="Please provide detailed information about your issue..."
                    className="min-h-[120px]"
                  />
                </div>
                <Button className="w-full">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Submit Support Request
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Knowledge Base</CardTitle>
                  <CardDescription>
                    Find answers to common questions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      Getting Started Guide
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      File Management FAQ
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Troubleshooting Common Issues
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Account & Billing
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Common support tasks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <Clock className="w-4 h-4 mr-2" />
                      Schedule Screen Share
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Account Verification
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Report a Bug
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Star className="w-4 h-4 mr-2" />
                      Feature Request
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </LockedFeature>
  );
}