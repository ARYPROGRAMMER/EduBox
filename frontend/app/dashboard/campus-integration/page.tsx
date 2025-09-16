"use client";

import { FeatureFlag } from "@/features/flag";
import { LockedFeature } from "@/components/locked-feature";
import MobileGate from "@/components/mobile-gate";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Building, MapPin, Calendar, Users, Utensils, Wifi, Star, Settings, Link } from "lucide-react";
import { useState } from "react";

export default function CampusIntegrationPage() {
  const [isConnecting, setIsConnecting] = useState(false);

  const campusServices = [
    {
      name: "Student Information System",
      description: "Sync grades, schedules, and academic records",
      icon: Building,
      status: "available",
      provider: "Banner/Colleague"
    },
    {
      name: "Learning Management System",
      description: "Connect with Canvas, Blackboard, or Moodle",
      icon: Users,
      status: "available", 
      provider: "Canvas/Blackboard"
    },
    {
      name: "Campus Events",
      description: "Stay updated with campus activities and events",
      icon: Calendar,
      status: "available",
      provider: "Campus Calendar"
    },
    {
      name: "Dining Services",
      description: "View dining hall hours and meal plans",
      icon: Utensils,
      status: "available",
      provider: "Campus Dining"
    },
    {
      name: "Campus Map & Navigation",
      description: "Find your way around campus buildings",
      icon: MapPin,
      status: "available",
      provider: "Campus Map"
    },
    {
      name: "WiFi & IT Services",
      description: "Check network status and IT support",
      icon: Wifi,
      status: "coming-soon",
      provider: "IT Services"
    }
  ];

  const integrationSteps = [
    {
      step: 1,
      title: "Connect Your Institution",
      description: "Search and select your college or university"
    },
    {
      step: 2,
      title: "Authenticate",
      description: "Login with your student credentials securely"
    },
    {
      step: 3,
      title: "Select Services",
      description: "Choose which campus services to integrate"
    },
    {
      step: 4,
      title: "Sync Data",
      description: "Automatically import your academic information"
    }
  ];

  return (
    <LockedFeature feature={FeatureFlag.CAMPUS_INTEGRATION} requiredPlan="PRO">
      <MobileGate>
        <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Building className="h-8 w-8 text-emerald-600" />
              Campus Integration
            </h2>
            <p className="text-muted-foreground">
              Connect your campus services for a unified academic experience
            </p>
          </div>
          <Badge variant="secondary" className="text-emerald-600 border-emerald-200">
            <Star className="w-3 h-3 mr-1" />
            Premium Feature
          </Badge>
          </div>
        
        </div>

        {/* Institution Connection */}
        <Card>
          <CardHeader>
            <CardTitle>Connect Your Institution</CardTitle>
            <CardDescription>
              Enter your college or university to get started with campus integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Input 
                placeholder="Search for your college or university..."
                className="flex-1"
              />
              <Button 
                onClick={() => setIsConnecting(true)}
                disabled={isConnecting}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isConnecting ? "Connecting..." : "Connect"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              We support 500+ institutions including major universities and community colleges
            </p>
          </CardContent>
        </Card>

        {/* Available Campus Services */}
        <Card>
          <CardHeader>
            <CardTitle>Available Campus Services</CardTitle>
            <CardDescription>
              Services you can integrate with EduBox
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campusServices.map((service, index) => (
                <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <service.icon className="h-6 w-6 text-emerald-600" />
                    <Badge 
                      variant={service.status === "available" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {service.status === "available" ? "Available" : "Coming Soon"}
                    </Badge>
                  </div>
                  <h3 className="font-medium mb-2">{service.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {service.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {service.provider}
                    </span>
                    {service.status === "available" && (
                      <Button variant="outline" size="sm">
                        <Link className="h-3 w-3 mr-1" />
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Integration Process */}
        <Card>
          <CardHeader>
            <CardTitle>How Campus Integration Works</CardTitle>
            <CardDescription>
              Simple steps to connect your campus services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {integrationSteps.map((step, index) => (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold mx-auto mb-3">
                    {step.step}
                  </div>
                  <h3 className="font-medium mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Automatic Sync</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your grades, schedules, and assignments are automatically updated from your institution's systems
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Single Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Access all your campus services and academic information from one unified interface
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Secure Connection</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                All integrations use secure authentication and encrypted connections to protect your data
              </p>
            </CardContent>
          </Card>
        </div>
      </MobileGate>
    </LockedFeature>
  );
}