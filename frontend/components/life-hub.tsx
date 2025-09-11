"use client";

import { useState, useEffect } from "react";
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
import { Separator } from "@/components/ui/separator";
import {
  CardSkeleton,
  ListSkeleton,
  ButtonLoader,
} from "@/components/ui/loader";
import { useLoadingState } from "@/hooks/use-loading";
import {
  CalendarDays,
  Users,
  Utensils,
  Star,
  MapPin,
  Clock,
  Heart,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Event {
  id: string;
  title: string;
  type: "club" | "sports" | "academic" | "social";
  date: string;
  time: string;
  location: string;
  description: string;
  attendees: number;
  maxAttendees?: number;
  isJoined: boolean;
}

interface Club {
  id: string;
  name: string;
  category: string;
  members: number;
  description: string;
  nextMeeting: string;
  isJoined: boolean;
}

interface MenuItem {
  id: string;
  name: string;
  category: "main" | "sides" | "dessert" | "drink";
  price: number;
  rating: number;
  isAvailable: boolean;
  isVegetarian?: boolean;
}

const sampleEvents: Event[] = [
  {
    id: "1",
    title: "Photography Workshop",
    type: "club",
    date: "2025-09-12",
    time: "3:00 PM",
    location: "Art Building Room 205",
    description: "Learn basics of digital photography and editing techniques",
    attendees: 15,
    maxAttendees: 20,
    isJoined: false,
  },
  {
    id: "2",
    title: "Basketball Tournament",
    type: "sports",
    date: "2025-09-14",
    time: "6:00 PM",
    location: "Sports Complex",
    description: "Inter-department basketball championship",
    attendees: 45,
    maxAttendees: 100,
    isJoined: true,
  },
  {
    id: "3",
    title: "Science Fair",
    type: "academic",
    date: "2025-09-16",
    time: "10:00 AM",
    location: "Main Auditorium",
    description: "Annual student research presentation event",
    attendees: 120,
    isJoined: false,
  },
];

const sampleClubs: Club[] = [
  {
    id: "1",
    name: "Debate Society",
    category: "Academic",
    members: 45,
    description: "Improve your public speaking and critical thinking skills",
    nextMeeting: "2025-09-13 at 4:00 PM",
    isJoined: true,
  },
  {
    id: "2",
    name: "Gaming Club",
    category: "Entertainment",
    members: 78,
    description: "Connect with fellow gamers and participate in tournaments",
    nextMeeting: "2025-09-15 at 5:30 PM",
    isJoined: false,
  },
  {
    id: "3",
    name: "Environmental Club",
    category: "Service",
    members: 32,
    description: "Promote sustainability and environmental awareness on campus",
    nextMeeting: "2025-09-14 at 3:30 PM",
    isJoined: false,
  },
];

const todayMenu: MenuItem[] = [
  {
    id: "1",
    name: "Grilled Chicken Bowl",
    category: "main",
    price: 8.99,
    rating: 4.5,
    isAvailable: true,
  },
  {
    id: "2",
    name: "Veggie Pasta",
    category: "main",
    price: 7.5,
    rating: 4.2,
    isAvailable: true,
    isVegetarian: true,
  },
  {
    id: "3",
    name: "Caesar Salad",
    category: "sides",
    price: 5.99,
    rating: 4.0,
    isAvailable: true,
    isVegetarian: true,
  },
  {
    id: "4",
    name: "Chocolate Brownie",
    category: "dessert",
    price: 3.5,
    rating: 4.8,
    isAvailable: false,
  },
  {
    id: "5",
    name: "Fresh Orange Juice",
    category: "drink",
    price: 2.99,
    rating: 4.3,
    isAvailable: true,
  },
];

export function LifeHub() {
  const [mounted, setMounted] = useState(false);
  const [events, setEvents] = useState<Event[]>(sampleEvents);
  const [clubs, setClubs] = useState<Club[]>(sampleClubs);
  const [menu] = useState<MenuItem[]>(todayMenu);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Safe date formatting function to prevent hydration issues
  const formatDateString = (dateString: string) => {
    if (!mounted) return "";
    return new Date(dateString).toLocaleDateString();
  };

  const toggleEventJoin = (eventId: string) => {
    setEvents(
      events.map((event) =>
        event.id === eventId ? { ...event, isJoined: !event.isJoined } : event
      )
    );
  };

  const toggleClubJoin = (clubId: string) => {
    setClubs(
      clubs.map((club) =>
        club.id === clubId ? { ...club, isJoined: !club.isJoined } : club
      )
    );
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "club":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "sports":
        return "bg-green-100 text-green-800 border-green-200";
      case "academic":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "social":
        return "bg-pink-100 text-pink-800 border-pink-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn(
          "h-3 w-3",
          i < Math.floor(rating)
            ? "fill-yellow-400 text-yellow-400"
            : "text-gray-300"
        )}
      />
    ));
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="events" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="events">🎉 Events</TabsTrigger>
          <TabsTrigger value="clubs">👥 Clubs</TabsTrigger>
          <TabsTrigger value="cafeteria">🍽️ Cafeteria</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Upcoming Events
              </CardTitle>
              <CardDescription>
                Discover and join campus events that match your interests
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {events.map((event) => (
              <Card
                key={event.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{event.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={getEventTypeColor(event.type)}>
                          {event.type}
                        </Badge>
                        {event.isJoined && (
                          <Badge variant="default">Joined</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {event.description}
                  </p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {formatDateString(event.date)} at {event.time}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {event.attendees} attending
                        {event.maxAttendees && ` (${event.maxAttendees} max)`}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <Button
                    onClick={() => toggleEventJoin(event.id)}
                    variant={event.isJoined ? "outline" : "default"}
                    className="w-full"
                  >
                    {event.isJoined ? "Leave Event" : "Join Event"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="clubs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Student Clubs & Organizations
              </CardTitle>
              <CardDescription>
                Find communities that share your passions and interests
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {clubs.map((club) => (
              <Card key={club.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{club.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{club.category}</Badge>
                        {club.isJoined && (
                          <Badge variant="default">Member</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {club.description}
                  </p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{club.members} members</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Next meeting: {club.nextMeeting}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex gap-2">
                    <Button
                      onClick={() => toggleClubJoin(club.id)}
                      variant={club.isJoined ? "outline" : "default"}
                      className="flex-1"
                    >
                      {club.isJoined ? "Leave Club" : "Join Club"}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="cafeteria" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="h-5 w-5" />
                Today&apos;s Menu
              </CardTitle>
              <CardDescription>
                Fresh meals available at the campus cafeteria • Open until 9:00
                PM
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid gap-4">
            {["main", "sides", "dessert", "drink"].map((category) => {
              const categoryItems = menu.filter(
                (item) => item.category === category
              );
              const categoryName =
                category.charAt(0).toUpperCase() +
                category.slice(1) +
                (category === "main"
                  ? " Courses"
                  : category === "sides"
                  ? " & Salads"
                  : "s");

              return (
                <Card key={category}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{categoryName}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {categoryItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4
                              className={cn(
                                "font-medium",
                                !item.isAvailable && "text-muted-foreground"
                              )}
                            >
                              {item.name}
                            </h4>
                            {item.isVegetarian && (
                              <Badge
                                variant="outline"
                                className="text-green-600 border-green-600"
                              >
                                <Heart className="h-3 w-3 mr-1" />
                                Veg
                              </Badge>
                            )}
                            {!item.isAvailable && (
                              <Badge variant="secondary">Sold Out</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {renderStars(item.rating)}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              ({item.rating})
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold">
                            ${item.price}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Cafeteria Hours */}
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-orange-900">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Cafeteria Hours</span>
              </div>
              <div className="mt-2 text-sm text-orange-800">
                <p>Monday - Friday: 7:00 AM - 9:00 PM</p>
                <p>Saturday - Sunday: 8:00 AM - 8:00 PM</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
