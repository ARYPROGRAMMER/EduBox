"use client";

import { FeatureFlag } from "@/features/flag";
import { LockedFeature } from "@/components/locked-feature";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Cloud, HardDrive, RefreshCw, CheckCircle, AlertCircle, Star, Settings, Link } from "lucide-react";
import { useState } from "react";

export default function CloudStoragePage() {
  const [autoSync, setAutoSync] = useState(true);
  const [syncInProgress, setSyncInProgress] = useState(false);

  const cloudProviders = [
    {
      name: "Google Drive",
      icon: Cloud,
      connected: true,
      storage: "15 GB available",
      lastSync: "2 minutes ago",
      status: "synced"
    },
    {
      name: "OneDrive",
      icon: Cloud,
      connected: false,
      storage: "5 GB available",
      lastSync: "Never",
      status: "disconnected"
    },
    {
      name: "Dropbox",
      icon: Cloud,
      connected: true,
      storage: "2 GB available",
      lastSync: "1 hour ago",
      status: "syncing"
    },
    {
      name: "iCloud Drive",
      icon: Cloud,
      connected: false,
      storage: "5 GB available",
      lastSync: "Never",
      status: "disconnected"
    }
  ];

  const syncStats = {
    totalFiles: 1247,
    syncedFiles: 1238,
    pendingFiles: 9,
    failedFiles: 0,
    totalSize: "4.2 GB",
    lastFullSync: "Yesterday at 2:30 PM"
  };

  const recentSyncActivity = [
    {
      file: "Calculus Notes.pdf",
      action: "Uploaded",
      provider: "Google Drive",
      time: "2 minutes ago",
      status: "success"
    },
    {
      file: "Biology Lab Report.docx",
      action: "Synced",
      provider: "Dropbox",
      time: "15 minutes ago",
      status: "success"
    },
    {
      file: "History Essay Draft.pdf",
      action: "Updated",
      provider: "Google Drive",
      time: "1 hour ago",
      status: "success"
    },
    {
      file: "Chemistry Formulas.xlsx",
      action: "Failed",
      provider: "OneDrive",
      time: "2 hours ago",
      status: "error"
    }
  ];

  const handleSync = () => {
    setSyncInProgress(true);
    setTimeout(() => setSyncInProgress(false), 3000);
  };

  return (
    <LockedFeature feature={FeatureFlag.UNLIMITED_STORAGE} requiredPlan="PRO">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Cloud className="h-8 w-8 text-sky-600" />
              Cloud Storage Sync
            </h2>
            <p className="text-muted-foreground">
              Keep your files synchronized across all your cloud storage providers
            </p>
          </div>
          <Badge variant="secondary" className="text-sky-600 border-sky-200">
            <Star className="w-3 h-3 mr-1" />
            Premium Feature
          </Badge>
        </div>

        {/* Sync Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Files</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-sky-600">{syncStats.totalFiles}</div>
              <p className="text-xs text-muted-foreground">
                {syncStats.totalSize} total size
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Synced Files</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{syncStats.syncedFiles}</div>
              <p className="text-xs text-muted-foreground">
                Up to date
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <RefreshCw className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{syncStats.pendingFiles}</div>
              <p className="text-xs text-muted-foreground">
                Waiting to sync
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{syncStats.failedFiles}</div>
              <p className="text-xs text-muted-foreground">
                Sync errors
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Cloud Providers */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Connected Cloud Providers</CardTitle>
              <Button 
                onClick={handleSync}
                disabled={syncInProgress}
                className="bg-sky-600 hover:bg-sky-700"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncInProgress ? 'animate-spin' : ''}`} />
                {syncInProgress ? 'Syncing...' : 'Sync All'}
              </Button>
            </div>
            <CardDescription>
              Manage your cloud storage connections and sync settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cloudProviders.map((provider, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <provider.icon className="h-6 w-6 text-sky-600" />
                      <div>
                        <h3 className="font-medium">{provider.name}</h3>
                        <p className="text-sm text-muted-foreground">{provider.storage}</p>
                      </div>
                    </div>
                    <Badge 
                      variant={provider.connected ? "default" : "secondary"}
                      className={provider.connected ? "bg-green-600" : ""}
                    >
                      {provider.status === "synced" && <CheckCircle className="h-3 w-3 mr-1" />}
                      {provider.status === "syncing" && <RefreshCw className="h-3 w-3 mr-1 animate-spin" />}
                      {provider.status === "disconnected" && <AlertCircle className="h-3 w-3 mr-1" />}
                      {provider.status.charAt(0).toUpperCase() + provider.status.slice(1)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Last sync: {provider.lastSync}
                    </span>
                    <Button 
                      variant={provider.connected ? "outline" : "default"}
                      size="sm"
                    >
                      <Link className="h-3 w-3 mr-1" />
                      {provider.connected ? "Disconnect" : "Connect"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sync Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Sync Settings</CardTitle>
            <CardDescription>
              Configure how your files are synchronized
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Auto-sync</div>
                <div className="text-sm text-muted-foreground">
                  Automatically sync files when changes are detected
                </div>
              </div>
              <Switch 
                checked={autoSync}
                onCheckedChange={setAutoSync}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Sync on mobile data</div>
                <div className="text-sm text-muted-foreground">
                  Allow syncing when not connected to WiFi
                </div>
              </div>
              <Switch />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Compress files</div>
                <div className="text-sm text-muted-foreground">
                  Reduce file sizes to save storage space
                </div>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Sync Activity</CardTitle>
            <CardDescription>
              Latest file synchronization activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSyncActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {activity.status === "success" ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{activity.file}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.action} to {activity.provider}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </LockedFeature>
  );
}