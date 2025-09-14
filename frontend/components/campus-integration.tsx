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
import { Label } from "@/components/ui/label";
import { 
  Building2, 
  Wifi, 
  Car,
  Utensils,
  BookOpen,
  Calendar,
  MapPin,
  Clock,
  Star,
  Users,
  Crown,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Bell,
  Settings,
  Info,
  Coffee,
  Dumbbell,
  GraduationCap,
  Bus,
} from "lucide-react";

export function CampusIntegration() {
  const [activeTab, setActiveTab] = useState("services");

  const campusServices = [
    {
      id: "library",
      name: "Library System",
      icon: BookOpen,
      status: "connected",
      description: "Access library catalog, reserve study rooms, check due dates",
      lastSync: "2 minutes ago",
      features: ["Book reservations", "Room booking", "Due date reminders"],
    },
    {
      id: "dining",
      name: "Dining Services", 
      icon: Utensils,
      status: "connected",
      description: "View dining hall hours, menus, and meal plan balance",
      lastSync: "15 minutes ago", 
      features: ["Menu viewing", "Meal plan balance", "Hours & locations"],
    },
    {
      id: "parking",
      name: "Parking Services",
      icon: Car,
      status: "available",
      description: "Find parking spots, pay for parking, view permit status",
      lastSync: "Never",
      features: ["Spot availability", "Mobile payments", "Permit management"],
    },
    {
      id: "gym",
      name: "Recreation Center",
      icon: Dumbbell,
      status: "connected", 
      description: "Check gym hours, class schedules, equipment availability",
      lastSync: "1 hour ago",
      features: ["Class enrollment", "Equipment tracking", "Hours & events"],
    },
    {
      id: "transport",
      name: "Campus Shuttle",
      icon: Bus,
      status: "available",
      description: "Real-time shuttle tracking and route information",
      lastSync: "Never",
      features: ["Live tracking", "Route schedules", "Arrival predictions"],
    },
    {
      id: "wifi",
      name: "Campus WiFi",
      icon: Wifi,
      status: "connected",
      description: "Auto-connect to campus networks and check signal strength",
      lastSync: "Active",
      features: ["Auto-connection", "Signal monitoring", "Network switching"],
    },
  ];

  const campusInfo = {
    library: {
      status: "Open",
      hours: "7:00 AM - 11:00 PM",
      studyRooms: "3 available",
      quietZones: "Available",
    },
    dining: {
      status: "Open",
      mealPlan: "$247.50 remaining",
      nearestHall: "Commons - 5 min walk",
      todaysSpecial: "Mediterranean Bowl",
    },
    parking: {
      availability: "67% full",
      nearestSpot: "Lot B - 2 min walk", 
      permit: "Valid until May 2024",
      violations: "None",
    },
    recreation: {
      status: "Open",
      capacity: "42% occupied",
      nextClass: "Yoga at 6:00 PM",
      equipmentWait: "Minimal",
    },
  };

  const notifications = [
    {
      id: "1",
      service: "Library",
      type: "reminder",
      message: "Book 'Introduction to Algorithms' due tomorrow",
      time: "2 hours ago",
      priority: "high",
    },
    {
      id: "2",
      service: "Dining",
      type: "info",
      message: "New menu items available at Commons",
      time: "1 day ago", 
      priority: "low",
    },
    {
      id: "3",
      service: "Recreation",
      type: "update",
      message: "Yoga class moved to Room 203",
      time: "3 hours ago",
      priority: "medium",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-green-100 text-green-800">Connected</Badge>;
      case "available":
        return <Badge className="bg-blue-100 text-blue-800">Available</Badge>;
      case "error":
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "medium":
        return <Info className="w-4 h-4 text-yellow-500" />;
      case "low":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <LockedFeature
      feature={FeatureFlag.CAMPUS_INTEGRATION}
      title="Campus Integration"
      description="Connect with campus services like library, dining, parking, and more."
      requiredPlan="PRO"
    >
      <div className="space-y-6">
        <div className="relative">
          <h2 className="text-3xl font-bold tracking-tight">
            Campus Integration
          </h2>
          <p className="text-muted-foreground">
            Stay connected with all campus services and information in one place.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Campus Services</h3>
              <Button>
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync All Services
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {campusServices.map((service) => (
                <Card key={service.id} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <service.icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{service.name}</CardTitle>
                          <CardDescription className="text-sm">
                            Last sync: {service.lastSync}
                          </CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(service.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {service.description}
                    </p>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Features:</div>
                      {service.features.map((feature, index) => (
                        <div key={index} className="text-xs text-muted-foreground flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          {feature}
                        </div>
                      ))}
                    </div>
                    <Button 
                      className="w-full" 
                      size="sm"
                      variant={service.status === "connected" ? "outline" : "default"}
                    >
                      {service.status === "connected" ? "Configure" : "Connect"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Campus Dashboard</h3>
              <Badge variant="outline">Live updates</Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-500" />
                    Library Services
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Status</div>
                      <div className="text-muted-foreground flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        {campusInfo.library.status}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Hours</div>
                      <div className="text-muted-foreground">{campusInfo.library.hours}</div>
                    </div>
                    <div>
                      <div className="font-medium">Study Rooms</div>
                      <div className="text-muted-foreground">{campusInfo.library.studyRooms}</div>
                    </div>
                    <div>
                      <div className="font-medium">Quiet Zones</div>
                      <div className="text-muted-foreground">{campusInfo.library.quietZones}</div>
                    </div>
                  </div>
                  <Button className="w-full" size="sm">Reserve Study Room</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-orange-500" />
                    Dining Services
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Meal Plan</div>
                      <div className="text-muted-foreground">{campusInfo.dining.mealPlan}</div>
                    </div>
                    <div>
                      <div className="font-medium">Nearest Hall</div>
                      <div className="text-muted-foreground">{campusInfo.dining.nearestHall}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="font-medium">Today's Special</div>
                      <div className="text-muted-foreground">{campusInfo.dining.todaysSpecial}</div>
                    </div>
                  </div>
                  <Button className="w-full" size="sm">View Full Menu</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Car className="w-5 h-5 text-purple-500" />
                    Parking Services
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Availability</div>
                      <div className="text-muted-foreground">{campusInfo.parking.availability}</div>
                    </div>
                    <div>
                      <div className="font-medium">Nearest Spot</div>
                      <div className="text-muted-foreground">{campusInfo.parking.nearestSpot}</div>
                    </div>
                    <div>
                      <div className="font-medium">Permit</div>
                      <div className="text-muted-foreground">{campusInfo.parking.permit}</div>
                    </div>
                    <div>
                      <div className="font-medium">Violations</div>
                      <div className="text-muted-foreground">{campusInfo.parking.violations}</div>
                    </div>
                  </div>
                  <Button className="w-full" size="sm">Find Parking</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Dumbbell className="w-5 h-5 text-green-500" />
                    Recreation Center
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Status</div>
                      <div className="text-muted-foreground flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        {campusInfo.recreation.status}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Capacity</div>
                      <div className="text-muted-foreground">{campusInfo.recreation.capacity}</div>
                    </div>
                    <div>
                      <div className="font-medium">Next Class</div>
                      <div className="text-muted-foreground">{campusInfo.recreation.nextClass}</div>
                    </div>
                    <div>
                      <div className="font-medium">Equipment Wait</div>
                      <div className="text-muted-foreground">{campusInfo.recreation.equipmentWait}</div>
                    </div>
                  </div>
                  <Button className="w-full" size="sm">Book Class</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Campus Notifications</h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{notifications.length} unread</Badge>
                <Button variant="outline" size="sm">Mark All Read</Button>
              </div>
            </div>

            <div className="space-y-4">
              {notifications.map((notification) => (
                <Card key={notification.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getPriorityIcon(notification.priority)}
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {notification.service}
                            <Badge variant="outline" className="text-xs">
                              {notification.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <div className="text-xs text-muted-foreground mt-2">
                            {notification.time}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <h3 className="text-lg font-semibold">Integration Settings</h3>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Notification Preferences</CardTitle>
                  <CardDescription>
                    Choose what campus notifications you want to receive
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Library Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Due dates, room reservations, and holds
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Dining Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Menu updates and meal plan balance alerts
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Parking Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Availability updates and permit expiration
                      </p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Recreation Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Class changes and facility status
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sync Settings</CardTitle>
                  <CardDescription>
                    Configure how often to sync with campus services
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Sync Frequency</Label>
                    <select className="w-full p-2 border rounded-md">
                      <option>Every 5 minutes</option>
                      <option>Every 15 minutes</option>
                      <option>Every 30 minutes</option>
                      <option>Every hour</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Background Sync</Label>
                      <p className="text-sm text-muted-foreground">
                        Sync even when app is not in use
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>WiFi Only</Label>
                      <p className="text-sm text-muted-foreground">
                        Only sync when connected to WiFi
                      </p>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Privacy Settings</CardTitle>
                  <CardDescription>
                    Control what information is shared with campus services
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Share Academic Schedule</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow services to access your class schedule
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Share Location Data</Label>
                      <p className="text-sm text-muted-foreground">
                        Help services provide location-based features
                      </p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Usage Analytics</Label>
                      <p className="text-sm text-muted-foreground">
                        Share usage data to improve services
                      </p>
                    </div>
                    <Switch defaultChecked />
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