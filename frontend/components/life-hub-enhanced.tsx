"use client";

import { useState, useEffect, useRef } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  CalendarDays,
  Users,
  MapPin,
  Plus,
  Upload,
  FileText,
  Loader2,
} from "lucide-react";

export function LifeHubEnhanced() {
  const [mounted, setMounted] = useState(false);
  const { user: convexUser } = useConvexUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch real data from Convex
  const campusEvents = useQuery(api.campusLife.getCampusEvents, { limit: 20 });
  const upcomingEvents = useQuery(api.campusLife.getUpcomingCampusEvents, { limit: 10 });
  const todayMenu = useQuery(api.campusLife.getTodayMenu, {});
  const diningVenues = useQuery(api.campusLife.getDiningVenues, {});

  // Mutations
  const createCampusEvent = useMutation(api.campusLife.createCampusEvent);
  const createDiningItem = useMutation(api.campusLife.createDiningItem);

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

  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [isDiningFormOpen, setIsDiningFormOpen] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    type: "social",
    location: "",
    dateTime: "",
  });
  const [diningForm, setDiningForm] = useState({
    name: "",
    description: "",
    price: "",
    location: "Main Dining Hall",
    availableUntil: "",
  });
  const [uploadedPdf, setUploadedPdf] = useState<File | null>(null);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [extractedMenuItems, setExtractedMenuItems] = useState<any[]>([]);

  const handleCreateEvent = async () => {
    setIsEventFormOpen(true);
  };

  const handleCreateDining = async () => {
    setIsDiningFormOpen(true);
  };

  const handlePdfUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setUploadedPdf(file);
    } else {
      alert("Please select a valid PDF file.");
    }
  };

  const handleProcessPdfMenu = async () => {
    if (!uploadedPdf) return;

    setIsProcessingPdf(true);
    try {
      // Create a FormData object to send the PDF
      const formData = new FormData();
      formData.append('pdf', uploadedPdf);
      formData.append('type', 'dining-menu');

      // Send to our PDF processing API that uses Gemini
      const response = await fetch('/api/process-pdf-menu', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process PDF');
      }

      const result = await response.json();
      setExtractedMenuItems(result.menuItems || []);
      
      if (result.menuItems?.length > 0) {
        // Set the first item as the main form data
        const firstItem = result.menuItems[0];
        setDiningForm({
          name: firstItem.name || "",
          description: firstItem.description || "",
          price: firstItem.price?.toString() || "",
          location: "Main Dining Hall",
          availableUntil: "",
        });
      }
    } catch (error) {
      console.error('Error processing PDF:', error);
      alert('Failed to process PDF menu. Please try again.');
    } finally {
      setIsProcessingPdf(false);
    }
  };

  const handleSubmitEvent = async () => {
    if (!convexUser || !eventForm.title || !eventForm.dateTime) return;
    
    try {
      await createCampusEvent({
        title: eventForm.title,
        description: eventForm.description,
        category: eventForm.type,
        location: eventForm.location,
        startTime: new Date(eventForm.dateTime).getTime(),
        organizer: convexUser.firstName && convexUser.lastName ? 
          `${convexUser.firstName} ${convexUser.lastName}` : 
          convexUser.email || "Anonymous",
      });
      
      setEventForm({
        title: "",
        description: "",
        type: "social", 
        location: "",
        dateTime: "",
      });
      setIsEventFormOpen(false);
    } catch (error) {
      console.error("Failed to create event:", error);
    }
  };

  const handleSubmitDining = async () => {
    if (!convexUser || !diningForm.name) return;
    
    try {
      await createDiningItem({
        title: diningForm.name,
        description: diningForm.description,
        location: diningForm.location,
        menu: [{
          item: diningForm.name,
          price: diningForm.price ? parseFloat(diningForm.price) : undefined,
        }],
      });
      
      setDiningForm({
        name: "",
        description: "",
        price: "",
        location: "Main Dining Hall",
        availableUntil: "",
      });
      setIsDiningFormOpen(false);
    } catch (error) {
      console.error("Failed to create dining item:", error);
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
        <Dialog open={isEventFormOpen} onOpenChange={setIsEventFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateEvent} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Campus Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                  placeholder="Enter event title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={eventForm.description}
                  onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                  placeholder="Describe your event"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Event Type</Label>
                  <Select value={eventForm.type} onValueChange={(value) => setEventForm({...eventForm, type: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="social">Social</SelectItem>
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="sports">Sports</SelectItem>
                      <SelectItem value="cultural">Cultural</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={eventForm.location}
                    onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
                    placeholder="Event location"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="datetime">Date & Time</Label>
                <Input
                  id="datetime"
                  type="datetime-local"
                  value={eventForm.dateTime}
                  onChange={(e) => setEventForm({...eventForm, dateTime: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsEventFormOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitEvent} disabled={!eventForm.title || !eventForm.dateTime}>
                  Create Event
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold">Dining Options</h3>
              <p className="text-sm text-muted-foreground">Browse today's menu and dining venues</p>
            </div>
            <Dialog open={isDiningFormOpen} onOpenChange={setIsDiningFormOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleCreateDining} variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Dining Item
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add Dining Menu Item</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {/* PDF Upload Section */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <Label className="text-sm font-medium">Upload PDF Menu (Optional)</Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Upload a PDF menu and let AI extract items automatically
                    </p>
                    
                    <div className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        onChange={handlePdfUpload}
                        className="hidden"
                      />
                      <Button 
                        type="button"
                        variant="outline" 
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessingPdf}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Choose PDF
                      </Button>
                      
                      {uploadedPdf && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleProcessPdfMenu}
                          disabled={isProcessingPdf}
                        >
                          {isProcessingPdf ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <FileText className="w-4 h-4 mr-2" />
                              Extract Items
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                    
                    {uploadedPdf && (
                      <p className="text-xs text-green-600">
                        ✓ PDF uploaded: {uploadedPdf.name}
                      </p>
                    )}
                    
                    {extractedMenuItems.length > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded p-3">
                        <p className="text-xs text-green-700 font-medium mb-2">
                          ✓ Extracted {extractedMenuItems.length} items from PDF
                        </p>
                        <div className="max-h-20 overflow-y-auto text-xs">
                          {extractedMenuItems.map((item, idx) => (
                            <div key={idx} className="text-green-600">
                              • {item.name} {item.price ? `($${item.price})` : ''}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Item Name</Label>
                    <Input
                      id="name"
                      value={diningForm.name}
                      onChange={(e) => setDiningForm({...diningForm, name: e.target.value})}
                      placeholder="Enter item name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={diningForm.description}
                      onChange={(e) => setDiningForm({...diningForm, description: e.target.value})}
                      placeholder="Describe the item"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price ($)</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={diningForm.price}
                        onChange={(e) => setDiningForm({...diningForm, price: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Select value={diningForm.location} onValueChange={(value) => setDiningForm({...diningForm, location: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Main Dining Hall">Main Dining Hall</SelectItem>
                          <SelectItem value="Student Union">Student Union</SelectItem>
                          <SelectItem value="Coffee Shop">Coffee Shop</SelectItem>
                          <SelectItem value="Food Court">Food Court</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="availableUntil">Available Until</Label>
                    <Input
                      id="availableUntil"
                      type="datetime-local"
                      value={diningForm.availableUntil}
                      onChange={(e) => setDiningForm({...diningForm, availableUntil: e.target.value})}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsDiningFormOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSubmitDining} disabled={!diningForm.name}>
                      Add Item
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
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