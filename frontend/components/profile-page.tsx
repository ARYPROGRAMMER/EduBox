"use client";

import { useState, useEffect } from "react";
import { useConvexUser } from "@/hooks/use-convex-user";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  User,
  GraduationCap,
  Bell,
  Shield,
  Save,
  Calendar,
  MapPin,
  Mail,
  Phone,
  BookOpen,
  Award,
  Settings,
} from "lucide-react";

const yearOptions = [
  { value: "freshman", label: "Freshman" },
  { value: "sophomore", label: "Sophomore" },
  { value: "junior", label: "Junior" },
  { value: "senior", label: "Senior" },
  { value: "graduate", label: "Graduate Student" },
  { value: "postgrad", label: "Postgraduate" },
];

const themeOptions = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

const timezoneOptions = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HST)" },
  { value: "Europe/London", label: "Greenwich Mean Time (GMT)" },
  { value: "Europe/Paris", label: "Central European Time (CET)" },
  { value: "Europe/Moscow", label: "Moscow Time (MSK)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
  { value: "Asia/Shanghai", label: "China Standard Time (CST)" },
  { value: "Asia/Kolkata", label: "India Standard Time (IST)" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (AET)" },
  { value: "UTC", label: "Coordinated Universal Time (UTC)" },
];

interface ProfileFormData {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  bio?: string;

  // Academic Information
  studentId?: string;
  institution?: string;
  major?: string;
  minor?: string;
  year?: string;
  gpa?: number;
  expectedGraduation?: string;

  // Preferences
  theme?: string;
  timezone?: string;
  notificationsEnabled?: boolean;
  emailNotifications?: boolean;
  
  // Notification Settings
  assignmentReminders?: boolean;
  classReminders?: boolean;
  campusEventReminders?: boolean;
  weeklyDigest?: boolean;
  studyReminders?: boolean;
}

export function ProfilePage() {
  const { user: convexUser, clerkUser } = useConvexUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: "",
    lastName: "",
    email: "",
  });

  const updateAcademicInfo = useMutation(api.users.updateAcademicInfo);
  const updatePersonalInfo = useMutation(api.users.updatePersonalInfo);
  const updateUserPreferences = useMutation(api.users.updateUserPreferences);

  useEffect(() => {
    if (convexUser && clerkUser) {
      setFormData({
        firstName: convexUser.firstName || clerkUser.firstName || "",
        lastName: convexUser.lastName || clerkUser.lastName || "",
        email: convexUser.email || clerkUser.emailAddresses[0]?.emailAddress || "",
        phone: convexUser.phone || "",
        bio: convexUser.bio || "",
        studentId: convexUser.studentId || "",
        institution: convexUser.institution || "",
        major: convexUser.major || "",
        minor: convexUser.minor || "",
        year: convexUser.year || "",
        gpa: convexUser.gpa || undefined,
        theme: convexUser.theme || "system",
        timezone: convexUser.timezone || "America/New_York",
        notificationsEnabled: convexUser.notificationsEnabled ?? true,
        emailNotifications: convexUser.emailNotifications ?? true,
      });
    }
  }, [convexUser, clerkUser]);

  // Autosave functionality - debounced save
  useEffect(() => {
    if (!convexUser) return;
    
    const timer = setTimeout(async () => {
      if (formData.firstName && isFormDataChanged()) {
        await handleAutoSave();
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timer);
  }, [formData]);

  const isFormDataChanged = () => {
    if (!convexUser) return false;
    
    return (
      formData.firstName !== (convexUser.firstName || "") ||
      formData.lastName !== (convexUser.lastName || "") ||
      formData.phone !== (convexUser.phone || "") ||
      formData.bio !== (convexUser.bio || "") ||
      formData.studentId !== (convexUser.studentId || "") ||
      formData.institution !== (convexUser.institution || "") ||
      formData.major !== (convexUser.major || "") ||
      formData.minor !== (convexUser.minor || "") ||
      formData.year !== (convexUser.year || "") ||
      formData.gpa !== convexUser.gpa ||
      formData.theme !== (convexUser.theme || "system") ||
      formData.timezone !== (convexUser.timezone || "America/New_York") ||
      formData.notificationsEnabled !== (convexUser.notificationsEnabled ?? true) ||
      formData.emailNotifications !== (convexUser.emailNotifications ?? true)
    );
  };

  const handleAutoSave = async () => {
    if (!convexUser || isLoading) return;

    setIsLoading(true);
    try {
      // Update personal information
      await updatePersonalInfo({
        userId: convexUser._id,
        firstName: formData.firstName,
        lastName: formData.lastName,
        bio: formData.bio,
        phone: formData.phone,
      });

      // Update academic information
      await updateAcademicInfo({
        userId: convexUser._id,
        studentId: formData.studentId,
        institution: formData.institution,
        major: formData.major,
        minor: formData.minor,
        year: formData.year,
        gpa: formData.gpa,
      });

      // Update user preferences
      await updateUserPreferences({
        userId: convexUser._id,
        preferences: {
          theme: formData.theme,
          timezone: formData.timezone,
          notificationsEnabled: formData.notificationsEnabled,
          emailNotifications: formData.emailNotifications,
        },
      });

      setLastSaved(new Date());
    } catch (error) {
      console.error("Auto-save failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProfileFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    await handleAutoSave();
    if (lastSaved) {
      toast.success("Profile saved successfully!");
    }
  };

  const isProfileComplete = () => {
    return formData.studentId && formData.institution && formData.major && formData.year;
  };

  const getInitials = () => {
    return `${formData.firstName?.[0] || ""}${formData.lastName?.[0] || ""}`.toUpperCase();
  };

  if (!convexUser || !clerkUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
          <div className="flex items-center gap-4">
            <p className="text-muted-foreground">
              Manage your account settings and academic information
            </p>
            {lastSaved && (
              <div className="flex items-center gap-1 text-sm text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Saved {lastSaved.toLocaleTimeString()}
              </div>
            )}
            {isLoading && (
              <div className="flex items-center gap-1 text-sm text-blue-600">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                Saving...
              </div>
            )}
          </div>
        </div>
        <Button onClick={handleSaveProfile} disabled={isLoading} variant="outline">
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? "Saving..." : "Save Now"}
        </Button>
      </div>

      {!isProfileComplete() && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <CardHeader>
            <CardTitle className="text-orange-800 dark:text-orange-200">
              Complete Your Profile
            </CardTitle>
            <CardDescription className="text-orange-700 dark:text-orange-300">
              Please fill in your academic information to get the most out of EduBox. Changes are automatically saved.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Your basic personal details and contact information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={clerkUser.imageUrl} />
                  <AvatarFallback className="text-lg">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="text-lg font-medium">
                    {formData.firstName} {formData.lastName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {formData.email}
                  </p>
                  <Badge variant={isProfileComplete() ? "default" : "secondary"}>
                    {isProfileComplete() ? "Profile Complete" : "Profile Incomplete"}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    placeholder="Enter your first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    placeholder="Enter your last name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email is managed by your account provider
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (Optional)</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ""}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio (Optional)</Label>
                <Textarea
                  id="bio"
                  value={formData.bio || ""}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="academic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Academic Information
              </CardTitle>
              <CardDescription>
                Your academic details and educational background.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="studentId">Student ID *</Label>
                  <Input
                    id="studentId"
                    value={formData.studentId || ""}
                    onChange={(e) => handleInputChange("studentId", e.target.value)}
                    placeholder="Enter your student ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="institution">Institution *</Label>
                  <Input
                    id="institution"
                    value={formData.institution || ""}
                    onChange={(e) => handleInputChange("institution", e.target.value)}
                    placeholder="Enter your institution name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="major">Major *</Label>
                  <Input
                    id="major"
                    value={formData.major || ""}
                    onChange={(e) => handleInputChange("major", e.target.value)}
                    placeholder="Enter your major"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minor">Minor (Optional)</Label>
                  <Input
                    id="minor"
                    value={formData.minor || ""}
                    onChange={(e) => handleInputChange("minor", e.target.value)}
                    placeholder="Enter your minor"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Academic Year *</Label>
                  <Select
                    value={formData.year || ""}
                    onValueChange={(value) => handleInputChange("year", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your year" />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gpa">GPA (Optional)</Label>
                  <Input
                    id="gpa"
                    type="number"
                    step="0.01"
                    min="0"
                    max="4"
                    value={formData.gpa || ""}
                    onChange={(e) => handleInputChange("gpa", parseFloat(e.target.value) || undefined)}
                    placeholder="Enter your GPA"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Choose what notifications you want to receive.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications in your browser
                  </p>
                </div>
                <Switch
                  checked={formData.notificationsEnabled ?? true}
                  onCheckedChange={(checked) => handleInputChange("notificationsEnabled", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  checked={formData.emailNotifications ?? true}
                  onCheckedChange={(checked) => handleInputChange("emailNotifications", checked)}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="text-base">Notification Types</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Assignment Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Get reminded about upcoming assignments
                      </p>
                    </div>
                    <Switch
                      checked={formData.assignmentReminders ?? true}
                      onCheckedChange={(checked) => handleInputChange("assignmentReminders", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Class Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Get reminded about your classes
                      </p>
                    </div>
                    <Switch
                      checked={formData.classReminders ?? true}
                      onCheckedChange={(checked) => handleInputChange("classReminders", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Campus Events</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified about campus events
                      </p>
                    </div>
                    <Switch
                      checked={formData.campusEventReminders ?? true}
                      onCheckedChange={(checked) => handleInputChange("campusEventReminders", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Study Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Get reminded to study
                      </p>
                    </div>
                    <Switch
                      checked={formData.studyReminders ?? true}
                      onCheckedChange={(checked) => handleInputChange("studyReminders", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Weekly Digest</Label>
                      <p className="text-sm text-muted-foreground">
                        Get a weekly summary of your activities
                      </p>
                    </div>
                    <Switch
                      checked={formData.weeklyDigest ?? true}
                      onCheckedChange={(checked) => handleInputChange("weeklyDigest", checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                App Preferences
              </CardTitle>
              <CardDescription>
                Customize your app experience.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select
                  value={formData.theme || "system"}
                  onValueChange={(value) => handleInputChange("theme", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    {themeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={formData.timezone || ""}
                  onValueChange={(value) => handleInputChange("timezone", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {timezoneOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}