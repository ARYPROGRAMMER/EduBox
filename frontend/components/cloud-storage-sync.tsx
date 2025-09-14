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
import { Textarea } from "@/components/ui/textarea";
import { 
  Cloud, 
  Upload, 
  Download, 
  Folder,
  File,
  Search,
  Share,
  Archive,
  Trash2,
  Eye,
  Edit,
  Crown,
  CheckCircle,
  AlertCircle,
  Clock,
  Calendar,
  User,
  Lock,
  Unlock,
} from "lucide-react";

export function CloudStorageSync() {
  const [activeTab, setActiveTab] = useState("files");
  const [searchQuery, setSearchQuery] = useState("");

  const connectedServices = [
    {
      id: "google-drive",
      name: "Google Drive",
      icon: Cloud,
      status: "connected",
      storage: "15 GB",
      used: "8.2 GB",
      lastSync: "2 minutes ago",
    },
    {
      id: "dropbox",
      name: "Dropbox",
      icon: Cloud,
      status: "connected", 
      storage: "2 GB",
      used: "1.1 GB",
      lastSync: "5 minutes ago",
    },
    {
      id: "onedrive",
      name: "OneDrive",
      icon: Cloud,
      status: "disconnected",
      storage: "5 GB",
      used: "0 GB",
      lastSync: "Never",
    },
  ];

  const syncedFiles = [
    {
      id: "1",
      name: "Mathematics_Notes.pdf",
      type: "pdf",
      size: "2.3 MB",
      lastModified: "2 hours ago",
      source: "Google Drive",
      shared: true,
      synced: true,
    },
    {
      id: "2",
      name: "Physics_Assignment.docx",
      type: "docx", 
      size: "1.5 MB",
      lastModified: "1 day ago",
      source: "Dropbox",
      shared: false,
      synced: true,
    },
    {
      id: "3",
      name: "Chemistry_Lab_Report.pdf",
      type: "pdf",
      size: "3.7 MB",
      lastModified: "3 days ago",
      source: "Google Drive",
      shared: true,
      synced: false,
    },
    {
      id: "4",
      name: "Study_Schedule.xlsx",
      type: "xlsx",
      size: "856 KB",
      lastModified: "1 week ago",
      source: "Dropbox",
      shared: false,
      synced: true,
    },
  ];

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return "📄";
      case "docx":
        return "📝";
      case "xlsx":
        return "📊";
      default:
        return "📁";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-green-100 text-green-800">Connected</Badge>;
      case "syncing":
        return <Badge className="bg-blue-100 text-blue-800">Syncing</Badge>;
      case "disconnected":
        return <Badge className="bg-gray-100 text-gray-800">Disconnected</Badge>;
      case "error":
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <LockedFeature
      feature={FeatureFlag.UNLIMITED_STORAGE}
      requiredPlan="PRO"
    >
      <div className="space-y-6">
        <div className="relative">
          <h2 className="text-3xl font-bold tracking-tight">
            Cloud Storage Sync
          </h2>
          <p className="text-muted-foreground">
            Keep your files synchronized across all your cloud storage services.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="sync">Sync Rules</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="files" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Synced Files</h3>
              <div className="flex gap-2">
                <Input 
                  placeholder="Search files..." 
                  className="w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {syncedFiles
                .filter(file => 
                  file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  file.source.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((file) => (
                <Card key={file.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{getFileIcon(file.type)}</div>
                        <div>
                          <div className="font-medium">{file.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-4">
                            <span>{file.size}</span>
                            <span>•</span>
                            <span>{file.lastModified}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Cloud className="w-3 h-3" />
                              {file.source}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {file.synced ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Clock className="w-5 h-5 text-yellow-600" />
                        )}
                        {file.shared && (
                          <Share className="w-4 h-4 text-blue-600" />
                        )}
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Connected Services</h3>
              <Button>
                <Cloud className="w-4 h-4 mr-2" />
                Add Service
              </Button>
            </div>

            <div className="grid gap-4">
              {connectedServices.map((service) => (
                <Card key={service.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <service.icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{service.name}</CardTitle>
                          <CardDescription>
                            {service.used} of {service.storage} used
                          </CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(service.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ 
                          width: `${(parseFloat(service.used) / parseFloat(service.storage)) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Last sync: {service.lastSync}
                      </span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Sync Now
                        </Button>
                        <Button size="sm" variant="outline">
                          Configure
                        </Button>
                        {service.status === "connected" ? (
                          <Button size="sm" variant="outline">
                            Disconnect
                          </Button>
                        ) : (
                          <Button size="sm">
                            Connect
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sync" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Sync Rules</h3>
              <Button>
                <Upload className="w-4 h-4 mr-2" />
                Add Rule
              </Button>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Auto-sync Settings</CardTitle>
                  <CardDescription>
                    Configure how files are automatically synchronized
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Real-time sync</div>
                      <div className="text-sm text-muted-foreground">
                        Sync files as soon as they change
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Sync on upload</div>
                      <div className="text-sm text-muted-foreground">
                        Automatically sync new uploads
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Conflict resolution</div>
                      <div className="text-sm text-muted-foreground">
                        Keep both versions when conflicts occur
                      </div>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Folder Rules</CardTitle>
                  <CardDescription>
                    Set up automatic sync rules for specific folders
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Folder className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="font-medium">/Documents/School</div>
                        <div className="text-sm text-muted-foreground">
                          Sync to Google Drive, Dropbox
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Folder className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="font-medium">/Downloads/Assignments</div>
                        <div className="text-sm text-muted-foreground">
                          Sync to Google Drive only
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <h3 className="text-lg font-semibold">Sync Settings</h3>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Storage Preferences</CardTitle>
                  <CardDescription>
                    Configure how files are stored and organized
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Default storage location</label>
                    <select className="w-full p-2 border rounded-md">
                      <option>Google Drive</option>
                      <option>Dropbox</option>
                      <option>OneDrive</option>
                      <option>Local Storage</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">File naming convention</label>
                    <Input placeholder="e.g., {course}_{assignment}_{date}" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Maximum file size (MB)</label>
                    <Input type="number" placeholder="100" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Security Settings</CardTitle>
                  <CardDescription>
                    Configure security and privacy options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Encrypt synced files</div>
                      <div className="text-sm text-muted-foreground">
                        Use end-to-end encryption for cloud storage
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Private sharing only</div>
                      <div className="text-sm text-muted-foreground">
                        Require authentication for shared files
                      </div>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Auto-delete after</div>
                      <div className="text-sm text-muted-foreground">
                        Automatically remove old files
                      </div>
                    </div>
                    <select className="w-32 p-1 border rounded-md text-sm">
                      <option value="never">Never</option>
                      <option value="30">30 days</option>
                      <option value="90">90 days</option>
                      <option value="365">1 year</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Bandwidth Settings</CardTitle>
                  <CardDescription>
                    Manage sync performance and data usage
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Upload speed limit</label>
                    <select className="w-full p-2 border rounded-md">
                      <option>Unlimited</option>
                      <option>1 MB/s</option>
                      <option>5 MB/s</option>
                      <option>10 MB/s</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Sync only on WiFi</div>
                      <div className="text-sm text-muted-foreground">
                        Pause sync when using mobile data
                      </div>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Schedule sync times</div>
                      <div className="text-sm text-muted-foreground">
                        Only sync during specified hours
                      </div>
                    </div>
                    <Switch />
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