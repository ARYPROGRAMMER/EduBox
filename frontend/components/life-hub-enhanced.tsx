"use client";

import { useState, useEffect } from "react";
import { useConvexUser } from "@/hooks/use-convex-user";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
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
import {
  CalendarDays,
  Users,
  MapPin,
  Plus,
} from "lucide-react";

export function LifeHubEnhanced() {
  const [mounted, setMounted] = useState(false);
  const { user: convexUser } = useConvexUser();

  // Fetch real data from Convex
  const campusEvents = useQuery(api.campusLife.getCampusEvents, { limit: 20 });
  const upcomingEvents = useQuery(api.campusLife.getUpcomingCampusEvents, { limit: 10 });
  const todayMenu = useQuery(api.campusLife.getTodayMenu, {});
  const diningVenues = useQuery(api.campusLife.getDiningVenues, {});

  // Mutations
  const createCampusEvent = useMutation(api.campusLife.createCampusEvent);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatDateTime = (timestamp?: number) => {
    if (!mounted || !timestamp) return "Date TBD";
    return new Date(timestamp).toLocaleDateString();
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "event":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "club":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "dining":
        return "bg-orange-100 text-orange-800 hover:bg-orange-200";
      case "announcement":
        return "bg-purple-100 text-purple-800 hover:bg-purple-200";
      case "facility":
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  const handleCreateEvent = async () => {
    if (!convexUser) return;
    
    try {
      // This would be connected to a form in a real implementation
      // For now, this function exists as a placeholder for future event creation
      console.log("Event creation would be handled through a proper form interface");
    } catch (error) {
      console.error("Failed to create event:", error);
    }
  };

  if (!mounted) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campus Life</h1>
          <p className="text-muted-foreground">
            Discover events, clubs, and campus activities
          </p>
        </div>
        <Button onClick={handleCreateEvent} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Event
        </Button>
      </div>

      <Tabs defaultValue="events" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="dining">Dining</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(campusEvents || []).map((event) => (
              <Card key={event._id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-lg">{event.title}</CardTitle>
                      <Badge className={getCategoryColor(event.category)}>
                        {event.category}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {event.description || "No description available"}
                  </p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-muted-foreground" />
                      <span>{formatDateTime(event.startTime)}</span>
                    </div>
                    
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{event.location}</span>
                      </div>
                    )}
                    
                    {event.capacity && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>Capacity: {event.capacity}</span>
                      </div>
                    )}
                  </div>
                  
                  <Button className="w-full" size="sm">
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
            
            {(!campusEvents || campusEvents.length === 0) && (
              <div className="col-span-full text-center py-12">
                <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No events yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first campus event to get started
                </p>
                <Button onClick={handleCreateEvent}>Create Event</Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(upcomingEvents || []).map((event) => (
              <Card key={event._id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-lg">{event.title}</CardTitle>
                      <Badge className={getCategoryColor(event.category)}>
                        {event.category}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {event.description || "No description available"}
                  </p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-muted-foreground" />
                      <span>{formatDateTime(event.startTime)}</span>
                    </div>
                    
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{event.location}</span>
                      </div>
                    )}
                  </div>
                  
                  <Button className="w-full" size="sm">
                    Join Event
                  </Button>
                </CardContent>
              </Card>
            ))}
            
            {(!upcomingEvents || upcomingEvents.length === 0) && (
              <div className="col-span-full text-center py-12">
                <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No upcoming events</h3>
                <p className="text-muted-foreground">
                  Check back later for new events
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="dining" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Today's Menu Items */}
            {todayMenu && todayMenu.length > 0 ? (
              todayMenu.map((menuItem) => (
                <Card key={menuItem._id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle>{menuItem.title}</CardTitle>
                    <CardDescription>{menuItem.location || "Main Dining Hall"}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {menuItem.description && (
                      <p className="text-sm text-muted-foreground">{menuItem.description}</p>
                    )}
                    {menuItem.menu && menuItem.menu.length > 0 && (
                      <div className="space-y-2">
                        {menuItem.menu.slice(0, 3).map((item, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-sm">{item.item}</span>
                            {item.price && (
                              <Badge variant="secondary">${item.price.toFixed(2)}</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <Button className="w-full" size="sm">
                      View Full Menu
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>Today's Menu</CardTitle>
                  <CardDescription>Main Dining Hall</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Menu not available</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Check back later for today's dining options
                    </p>
                  </div>
                  <Button className="w-full" size="sm">
                    View All Dining Options
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Dining Venues */}
            {diningVenues && diningVenues.length > 0 && (
              diningVenues.slice(0, 2).map((venue) => (
                <Card key={venue._id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle>{venue.title}</CardTitle>
                    <CardDescription>{venue.location || "Campus Location"}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {venue.description && (
                      <p className="text-sm text-muted-foreground">{venue.description}</p>
                    )}
                    <Button className="w-full" size="sm">
                      Visit Location
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}