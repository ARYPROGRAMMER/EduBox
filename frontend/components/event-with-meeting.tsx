"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useConvexUser } from "@/hooks/use-convex-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Video,
  Plus,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  Calendar,
  Clock,
  MapPin,
  Users
} from "lucide-react";
import { format } from "date-fns";

interface EventWithMeetingProps {
  events?: any[];
  showCreateButton?: boolean;
  className?: string;
}

export function EventWithMeeting({ events: providedEvents, showCreateButton = true, className }: EventWithMeetingProps) {
  const { user: convexUser } = useConvexUser();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    location: "",
    type: "meeting",
    meetingLink: "",
    meetingPlatform: "",
    meetingId: "",
    meetingPassword: "",
  });

  // Fetch events if not provided
  const fetchedEvents = useQuery(
    api.events.getUpcomingEvents,
    convexUser && !providedEvents ? { userId: convexUser.clerkId } : "skip"
  );

  const createEvent = useMutation(api.events.createEvent);
  const updateEvent = useMutation(api.events.updateEvent);
  const deleteEvent = useMutation(api.events.deleteEvent);

  const events = providedEvents || fetchedEvents || [];
  const eventsWithMeetings = events.filter(event => event.meetingLink);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      startTime: "",
      endTime: "",
      location: "",
      type: "meeting",
      meetingLink: "",
      meetingPlatform: "",
      meetingId: "",
      meetingPassword: "",
    });
    setEditingEvent(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convexUser) return;

    try {
      const startTime = new Date(formData.startTime).getTime();
      const endTime = new Date(formData.endTime).getTime();

      if (editingEvent) {
        await updateEvent({
          eventId: editingEvent._id,
          userId: convexUser.clerkId,
          updates: {
            ...formData,
            startTime,
            endTime,
          },
        });
        toast.success("Meeting updated successfully");
      } else {
        await createEvent({
          userId: convexUser.clerkId,
          ...formData,
          startTime,
          endTime,
        });
        toast.success("Meeting created successfully");
      }

      setIsCreateOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to save meeting");
      console.error(error);
    }
  };

  const handleEdit = (event: any) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      startTime: new Date(event.startTime).toISOString().slice(0, 16),
      endTime: new Date(event.endTime).toISOString().slice(0, 16),
      location: event.location || "",
      type: event.type,
      meetingLink: event.meetingLink || "",
      meetingPlatform: event.meetingPlatform || "",
      meetingId: event.meetingId || "",
      meetingPassword: event.meetingPassword || "",
    });
    setIsCreateOpen(true);
  };

  const handleDelete = async (eventId: string) => {
    if (!convexUser) return;
    
    try {
      await deleteEvent({ 
        eventId: eventId as any, // Cast to Id<"events">
        userId: convexUser.clerkId 
      });
      toast.success("Meeting deleted successfully");
    } catch (error) {
      toast.error("Failed to delete meeting");
      console.error(error);
    }
  };

  const copyMeetingLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success("Meeting link copied to clipboard");
  };

  const joinMeeting = (link: string) => {
    window.open(link, '_blank');
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Upcoming Meetings</h3>
          <p className="text-muted-foreground text-sm">
            Manage your virtual meetings and events
          </p>
        </div>
        {showCreateButton && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                New Meeting
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingEvent ? "Edit Meeting" : "Create New Meeting"}
                </DialogTitle>
                <DialogDescription>
                  Schedule a meeting with video conferencing details
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Meeting Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Team standup, Project review..."
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Meeting agenda or description..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="datetime-local"
                      value={formData.startTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="datetime-local"
                      value={formData.endTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="meetingLink">Meeting Link</Label>
                  <Input
                    id="meetingLink"
                    value={formData.meetingLink}
                    onChange={(e) => setFormData(prev => ({ ...prev, meetingLink: e.target.value }))}
                    placeholder="https://zoom.us/j/123456789..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="meetingPlatform">Platform</Label>
                    <Select 
                      value={formData.meetingPlatform} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, meetingPlatform: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="zoom">Zoom</SelectItem>
                        <SelectItem value="teams">Microsoft Teams</SelectItem>
                        <SelectItem value="meet">Google Meet</SelectItem>
                        <SelectItem value="webex">Cisco Webex</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="meetingId">Meeting ID</Label>
                    <Input
                      id="meetingId"
                      value={formData.meetingId}
                      onChange={(e) => setFormData(prev => ({ ...prev, meetingId: e.target.value }))}
                      placeholder="123 456 789"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="meetingPassword">Meeting Password</Label>
                  <Input
                    id="meetingPassword"
                    value={formData.meetingPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, meetingPassword: e.target.value }))}
                    placeholder="Optional password"
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingEvent ? "Update Meeting" : "Create Meeting"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {eventsWithMeetings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Video className="w-12 h-12 text-muted-foreground mb-4" />
            <h4 className="text-lg font-medium mb-2">No upcoming meetings</h4>
            <p className="text-muted-foreground text-center mb-6">
              Create your first meeting to get started with virtual collaboration
            </p>
            {showCreateButton && (
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Meeting
                  </Button>
                </DialogTrigger>
              </Dialog>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {eventsWithMeetings.map((event) => (
            <Card key={event._id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">{event.title}</CardTitle>
                    {event.description && (
                      <CardDescription>{event.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {event.meetingPlatform || "meeting"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(event)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Meeting</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this meeting? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(event._id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(event.startTime), "MMM d, yyyy")}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {format(new Date(event.startTime), "h:mm a")} - {format(new Date(event.endTime), "h:mm a")}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </div>
                    )}
                  </div>

                  {event.meetingId && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Meeting ID:</span>
                      <code className="bg-muted px-2 py-1 rounded text-xs">{event.meetingId}</code>
                      {event.meetingPassword && (
                        <>
                          <span className="text-muted-foreground">Password:</span>
                          <code className="bg-muted px-2 py-1 rounded text-xs">{event.meetingPassword}</code>
                        </>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      onClick={() => joinMeeting(event.meetingLink)}
                      className="flex-1"
                    >
                      <Video className="w-4 h-4 mr-2" />
                      Join Meeting
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyMeetingLink(event.meetingLink)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => joinMeeting(event.meetingLink)}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}