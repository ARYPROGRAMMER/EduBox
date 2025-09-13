"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useConvexUser } from "@/hooks/use-convex-user";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  FileText, 
  Calendar, 
  BookOpen, 
  GraduationCap,
  Clock,
  Video,
  Search
} from "lucide-react";

interface SearchSuggestionsProps {
  query: string;
  onSelectSuggestion: (item: any, type: string) => void;
  isVisible: boolean;
  className?: string;
}

export function SearchSuggestions({ 
  query, 
  onSelectSuggestion, 
  isVisible, 
  className 
}: SearchSuggestionsProps) {
  const { user: convexUser } = useConvexUser();
  const [localQuery, setLocalQuery] = useState("");

  // Update local query with a short delay to avoid too many requests
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        setLocalQuery(query);
      } else {
        setLocalQuery("");
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const suggestions = useQuery(
    api.search.globalSearch,
    localQuery.length >= 2 && convexUser?.clerkId ? { 
      query: localQuery, 
      userId: convexUser.clerkId, 
      limit: 8 
    } : "skip"
  );

  if (!isVisible || !localQuery || !suggestions) {
    return null;
  }

  const hasResults = suggestions.files.length > 0 || 
                    suggestions.events.length > 0 || 
                    suggestions.courses.length > 0 ||
                    suggestions.assignments.length > 0;

  if (!hasResults) {
    return (
      <Card className={cn(
        "absolute top-full mt-1 w-full bg-white border shadow-lg z-50 p-4 text-center text-muted-foreground",
        className
      )}>
        <Search className="h-4 w-4 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No results found for "{query}"</p>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "absolute top-full mt-1 w-full bg-white border shadow-lg z-50 max-h-96 overflow-y-auto",
      className
    )}>
      <div className="p-2">
        {/* Files */}
        {suggestions.files.length > 0 && (
          <div className="mb-3">
            <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-2">FILES</h4>
            {suggestions.files.map((file: any) => (
              <div
                key={file._id}
                className="flex items-center gap-3 p-2 hover:bg-muted rounded-md cursor-pointer transition-colors"
                onClick={() => onSelectSuggestion(file, 'file')}
              >
                <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {file.fileName || file.originalName}
                  </p>
                  {file.description && (
                    <p className="text-xs text-muted-foreground truncate">
                      {file.description}
                    </p>
                  )}
                </div>
                {file.category && (
                  <Badge variant="secondary" className="text-xs">
                    {file.category}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Events/Exams */}
        {suggestions.events.length > 0 && (
          <div className="mb-3">
            <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-2">EVENTS & EXAMS</h4>
            {suggestions.events.map((event: any) => (
              <div
                key={event._id}
                className="flex items-center gap-3 p-2 hover:bg-muted rounded-md cursor-pointer transition-colors"
                onClick={() => onSelectSuggestion(event, 'event')}
              >
                <div className="flex-shrink-0">
                  {event.type === 'exam' ? (
                    <GraduationCap className="h-4 w-4 text-red-600" />
                  ) : event.meetingLink ? (
                    <Video className="h-4 w-4 text-green-600" />
                  ) : (
                    <Calendar className="h-4 w-4 text-purple-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{event.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(event.startTime).toLocaleDateString()}</span>
                    {event.meetingLink && (
                      <Badge variant="outline" className="text-xs">Meeting</Badge>
                    )}
                  </div>
                </div>
                <Badge 
                  variant={event.type === 'exam' ? 'destructive' : 'default'} 
                  className="text-xs capitalize"
                >
                  {event.type}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Courses */}
        {suggestions.courses.length > 0 && (
          <div className="mb-3">
            <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-2">COURSES</h4>
            {suggestions.courses.map((course: any) => (
              <div
                key={course._id}
                className="flex items-center gap-3 p-2 hover:bg-muted rounded-md cursor-pointer transition-colors"
                onClick={() => onSelectSuggestion(course, 'course')}
              >
                <BookOpen className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{course.courseName}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {course.courseCode} • {course.credits} credits
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {course.semester}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Assignments */}
        {suggestions.assignments.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-2">ASSIGNMENTS</h4>
            {suggestions.assignments.map((assignment: any) => (
              <div
                key={assignment._id}
                className="flex items-center gap-3 p-2 hover:bg-muted rounded-md cursor-pointer transition-colors"
                onClick={() => onSelectSuggestion(assignment, 'assignment')}
              >
                <FileText className="h-4 w-4 text-orange-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{assignment.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Due {new Date(assignment.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
                <Badge 
                  variant={
                    assignment.status === 'submitted' ? 'default' :
                    assignment.status === 'pending' ? 'secondary' : 'outline'
                  } 
                  className="text-xs capitalize"
                >
                  {assignment.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}