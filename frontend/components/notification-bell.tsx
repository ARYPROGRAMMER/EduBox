"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useConvexUser } from "@/hooks/use-convex-user";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Bell, 
  BellRing, 
  Clock, 
  BookOpen, 
  Calendar, 
  AlertTriangle,
  Check,
  Archive,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useFeatureGate } from "@/components/feature-gate";
import { LockedFeature } from "@/components/locked-feature";
import { FeatureFlag } from "@/features/flag";

interface NotificationItemProps {
  notification: any;
  onMarkAsRead: (id: any) => void;
  onArchive: (id: any) => void;
  onDelete: (id: any) => void;
  onAction: (url: string) => void;
}

function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onArchive, 
  onDelete, 
  onAction 
}: NotificationItemProps) {
  const getIcon = () => {
    switch (notification.type) {
      case "assignment":
        return <BookOpen className="w-4 h-4 text-blue-600" />;
      case "class":
        return <Calendar className="w-4 h-4 text-green-600" />;
      case "exam":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case "study":
        return <Clock className="w-4 h-4 text-purple-600" />;
      case "system":
        return <Bell className="w-4 h-4 text-gray-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityColor = () => {
    switch (notification.priority) {
      case "high":
        return "border-l-red-500 bg-red-50/50";
      case "medium":
        return "border-l-yellow-500 bg-yellow-50/50";
      case "low":
        return "border-l-blue-500 bg-blue-50/50";
      default:
        return "border-l-gray-500 bg-gray-50/50";
    }
  };

  return (
    <div
      className={cn(
        "p-3 border-l-2 rounded-r-lg transition-all hover:shadow-sm",
        getPriorityColor(),
        !notification.isRead && "bg-opacity-100"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className={cn(
              "text-sm",
              !notification.isRead ? "font-semibold" : "font-medium"
            )}>
              {notification.title}
            </h4>
            {!notification.isRead && (
              <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {notification.message}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </span>
            <div className="flex items-center gap-1">
              {!notification.isRead && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsRead(notification._id);
                  }}
                  className="h-6 w-6 p-0"
                  title="Mark as read"
                >
                  <Check className="w-3 h-3" />
                </Button>
              )}
              {notification.actionUrl && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction(notification.actionUrl);
                  }}
                  className="h-6 w-6 p-0"
                  title={notification.actionLabel || "View"}
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onArchive(notification._id);
                }}
                className="h-6 w-6 p-0"
                title="Archive"
              >
                <Archive className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notification._id);
                }}
                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotificationBell() {
  const { user: convexUser } = useConvexUser();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { canUse } = useFeatureGate(FeatureFlag.STUDY_REMINDERS);

  // Queries
  const notifications = useQuery(
    api.notifications.getUserNotifications,
    convexUser ? { userId: convexUser.clerkId, limit: 10 } : "skip"
  );

  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    convexUser ? { userId: convexUser.clerkId } : "skip"
  );

  // Mutations
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const archiveNotification = useMutation(api.notifications.archiveNotification);
  const deleteNotification = useMutation(api.notifications.deleteNotification);

  // Auto-generate reminders
  const generateAssignmentReminders = useMutation(api.notifications.generateAssignmentReminders);
  const generateStudyReminders = useMutation(api.notifications.generateStudyReminders);

  // Auto-generate reminders on mount
  useEffect(() => {
    if (convexUser && canUse) {
      generateAssignmentReminders({ userId: convexUser.clerkId });
      generateStudyReminders({ userId: convexUser.clerkId });
    }
  }, [convexUser, canUse, generateAssignmentReminders, generateStudyReminders]);

  const handleMarkAsRead = async (notificationId: any) => {
    if (!convexUser) return;
    await markAsRead({ notificationId, userId: convexUser.clerkId });
  };

  const handleMarkAllAsRead = async () => {
    if (!convexUser) return;
    await markAllAsRead({ userId: convexUser.clerkId });
  };

  const handleArchive = async (notificationId: any) => {
    if (!convexUser) return;
    await archiveNotification({ notificationId, userId: convexUser.clerkId });
  };

  const handleDelete = async (notificationId: any) => {
    if (!convexUser) return;
    await deleteNotification({ notificationId, userId: convexUser.clerkId });
  };

  const handleAction = (url: string) => {
    setIsOpen(false);
    router.push(url);
  };

  if (!canUse) {
    return null;
  }

  return (
    <LockedFeature feature={FeatureFlag.STUDY_REMINDERS} requiredPlan="STARTER">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="relative p-2 rounded-lg"
            aria-label="Notifications"
          >
            {unreadCount && unreadCount > 0 ? (
              <BellRing className="w-5 h-5" />
            ) : (
              <Bell className="w-5 h-5" />
            )}
            {unreadCount && unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-80 p-0" 
          align="end" 
          sideOffset={5}
        >
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Notifications</h3>
              {unreadCount && unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-xs"
                >
                  Mark all read
                </Button>
              )}
            </div>
            {unreadCount && unreadCount > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          <ScrollArea className="h-[400px]">
            {notifications && notifications.length > 0 ? (
              <div className="space-y-2 p-2">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification._id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onArchive={handleArchive}
                    onDelete={handleDelete}
                    onAction={handleAction}
                  />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No notifications</h3>
                <p className="text-sm text-muted-foreground">
                  You're all caught up! Notifications will appear here.
                </p>
              </div>
            )}
          </ScrollArea>

          <Separator />
          
          <div className="p-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsOpen(false);
                router.push("/dashboard/profile");
              }}
              className="w-full justify-start text-sm"
            >
              <Bell className="w-4 h-4 mr-2" />
              Notification Settings
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </LockedFeature>
  );
}