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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  Plug, 
  Calendar, 
  Mail, 
  FileText, 
  Cloud,
  Smartphone,
  Zap,
  Settings,
  CheckCircle,
  XCircle,
  Crown,
  ExternalLink,
} from "lucide-react";

export function IntegrationsHub() {
  const [activeTab, setActiveTab] = useState("available");

  const availableIntegrations = [
    {
      id: "google-calendar",
      name: "Google Calendar",
      description: "Sync your academic schedule with Google Calendar",
      icon: Calendar,
      category: "Productivity",
      status: "available",
      pricing: "free",
    },
    {
      id: "outlook",
      name: "Microsoft Outlook",
      description: "Integrate with Outlook email and calendar",
      icon: Mail,
      category: "Email",
      status: "available",
      pricing: "free",
    },
    {
      id: "google-drive",
      name: "Google Drive",
      description: "Access and sync files from Google Drive",
      icon: Cloud,
      category: "Storage",
      status: "available",
      pricing: "free",
    },
    {
      id: "notion",
      name: "Notion",
      description: "Import and export notes to Notion",
      icon: FileText,
      category: "Note-taking",
      status: "beta",
      pricing: "pro",
    },
    {
      id: "slack",
      name: "Slack",
      description: "Get notifications in your Slack workspace",
      icon: Smartphone,
      category: "Communication",
      status: "coming-soon",
      pricing: "pro",
    },
    {
      id: "zoom",
      name: "Zoom",
      description: "Schedule and join Zoom meetings directly",
      icon: Zap,
      category: "Communication",
      status: "available",
      pricing: "pro",
    },
  ];

  const connectedIntegrations = [
    {
      id: "google-calendar",
      name: "Google Calendar",
      connectedAt: "2025-01-10",
      status: "active",
      lastSync: "2 minutes ago",
    },
    {
      id: "google-drive",
      name: "Google Drive",
      connectedAt: "2025-01-05",
      status: "active",
      lastSync: "1 hour ago",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge className="bg-green-100 text-green-800">Available</Badge>;
      case "beta":
        return <Badge className="bg-blue-100 text-blue-800">Beta</Badge>;
      case "coming-soon":
        return <Badge className="bg-gray-100 text-gray-800">Coming Soon</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPricingBadge = (pricing: string) => {
    return pricing === "pro" ? (
      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
        <Crown className="w-3 h-3 mr-1" />
        Pro
      </Badge>
    ) : (
      <Badge variant="outline">Free</Badge>
    );
  };

  return (
    <LockedFeature
      feature={FeatureFlag.THIRD_PARTY_INTEGRATIONS}
      title="Third-Party Integrations"
      description="Connect EduBox with your favorite apps and services."
      requiredPlan="PRO"
    >
      <div className="space-y-6">
        <div className="relative">
          <h2 className="text-3xl font-bold tracking-tight">
            Integrations
          </h2>
          <p className="text-muted-foreground">
            Connect EduBox with your favorite apps and services to streamline your workflow.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="available">Available</TabsTrigger>
            <TabsTrigger value="connected">Connected</TabsTrigger>
            <TabsTrigger value="api">API Access</TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Available Integrations</h3>
              <div className="flex gap-2">
                <Input placeholder="Search integrations..." className="w-64" />
                <Button variant="outline">Filter</Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {availableIntegrations.map((integration) => (
                <Card key={integration.id} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <integration.icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                          <CardDescription className="text-xs">
                            {integration.category}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        {getStatusBadge(integration.status)}
                        {getPricingBadge(integration.pricing)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {integration.description}
                    </p>
                    <Button 
                      className="w-full" 
                      size="sm"
                      disabled={integration.status === "coming-soon"}
                      variant={integration.status === "coming-soon" ? "outline" : "default"}
                    >
                      {integration.status === "coming-soon" ? "Coming Soon" : 
                       integration.status === "beta" ? "Try Beta" : "Connect"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="connected" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Connected Integrations</h3>
              <Badge variant="outline">{connectedIntegrations.length} connected</Badge>
            </div>

            {connectedIntegrations.length > 0 ? (
              <div className="space-y-4">
                {connectedIntegrations.map((integration) => (
                  <Card key={integration.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{integration.name}</CardTitle>
                            <CardDescription>
                              Connected on {integration.connectedAt}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          {integration.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          Last sync: {integration.lastSync}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Settings className="w-4 h-4 mr-1" />
                            Configure
                          </Button>
                          <Button size="sm" variant="outline">
                            Sync Now
                          </Button>
                          <Button size="sm" variant="outline">
                            <XCircle className="w-4 h-4 mr-1" />
                            Disconnect
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Plug className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Integrations Connected</h3>
                  <p className="text-muted-foreground mb-4">
                    Connect your favorite apps to get started
                  </p>
                  <Button onClick={() => setActiveTab("available")}>
                    Browse Integrations
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="api" className="space-y-4">
            <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>API Keys</CardTitle>
                    <CardDescription>
                      Manage your API keys for custom integrations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Production Key</div>
                        <div className="text-sm text-muted-foreground">
                          sk-prod-*********************xyz
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">Copy</Button>
                        <Button size="sm" variant="outline">Regenerate</Button>
                      </div>
                    </div>
                    <Button>
                      <Zap className="w-4 h-4 mr-2" />
                      Create New API Key
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>API Documentation</CardTitle>
                    <CardDescription>
                      Learn how to integrate with EduBox API
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View API Documentation
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      SDK Downloads
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Code Examples
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Usage Stats</CardTitle>
                    <CardDescription>
                      Monitor your API usage
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold">1,247</div>
                        <div className="text-sm text-muted-foreground">Requests this month</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">99.9%</div>
                        <div className="text-sm text-muted-foreground">Uptime</div>
                      </div>
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