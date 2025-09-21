"use client";

import { useState, useEffect } from "react";
import { useConvexUser } from "@/hooks/use-convex-user";
import { useUserPlan } from "@/hooks/use-user-plan";
import Usage from "@/components/usage";
import { FeatureFlag } from "@/features/flag";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Crown,
  Zap,
  Star,
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
  { value: "Asia/Kolkata", label: "India Standard Time (IST)" },
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
  const { plan, planInfo, isLoading: planLoading } = useUserPlan();
  const router = useRouter();
  const { setTheme } = useTheme();
  // controlled tab state so we can respond to URL hash fragments
  const [activeTab, setActiveTab] = useState<string>("personal");
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Schedule management state
  const [showScheduleCompletionModal, setShowScheduleCompletionModal] =
    useState(false);
  const [pdfProcessingResult, setPdfProcessingResult] = useState<any>(null);
  const [scheduleType, setScheduleType] = useState<"college" | "dining" | null>(
    null
  );
  const [incompleteScheduleItems, setIncompleteScheduleItems] = useState<any[]>(
    []
  );

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
        email:
          convexUser.email || clerkUser.emailAddresses[0]?.emailAddress || "",
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
      formData.notificationsEnabled !==
        (convexUser.notificationsEnabled ?? true) ||
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

      // Update global theme
      setTheme(formData.theme || "system");

      setLastSaved(new Date());
    } catch (error) {
      console.error("Auto-save failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProfileFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    await handleAutoSave();
    if (lastSaved) {
      toast.success("Profile saved successfully!");
    }
  };

  const isProfileComplete = () => {
    return (
      formData.studentId &&
      formData.institution &&
      formData.major &&
      formData.year
    );
  };

  const getInitials = () => {
    return `${formData.firstName?.[0] || ""}${
      formData.lastName?.[0] || ""
    }`.toUpperCase();
  };

  const getPlanIcon = () => {
    switch (plan) {
      case "PRO":
        return <Crown className="w-4 h-4" />;
      case "STARTER":
        return <Zap className="w-4 h-4" />;
      default:
        return <Star className="w-4 h-4" />;
    }
  };

  // Schedule management functions
  const handlePdfScheduleUpload = async (
    file: File,
    type: "college" | "dining"
  ) => {
    if (!convexUser?.clerkId) return;

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("pdf", file);
      formData.append("type", type);

      const response = await fetch("/api/process-pdf-schedule", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to process PDF");
      }

      const result = await response.json();

      if (result.success && result.scheduleItems?.length > 0) {
        // Check for incomplete items (missing required fields)
        const incompleteItems = result.scheduleItems.filter((item: any) => {
          if (type === "college") {
            return (
              !item.subject ||
              !item.dayOfWeek ||
              !item.startTime ||
              !item.endTime
            );
          } else {
            return (
              !item.mealType ||
              !item.dayOfWeek ||
              !item.startTime ||
              !item.endTime
            );
          }
        });

        if (incompleteItems.length > 0) {
          // Show completion modal for incomplete items
          setIncompleteScheduleItems(incompleteItems);
          setScheduleType(type);
          setPdfProcessingResult(result);
          setShowScheduleCompletionModal(true);
        } else {
          // All items are complete, save directly
          await saveScheduleItems(result.scheduleItems, type);
        }
      } else {
        toast.error("No schedule items could be extracted from the PDF");
      }
    } catch (error) {
      console.error("PDF processing error:", error);
      toast.error("Failed to process PDF. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const saveScheduleItems = async (
    scheduleItems: any[],
    type: "college" | "dining"
  ) => {
    if (!convexUser?.clerkId) return;

    try {
      if (type === "college") {
        // Save college schedule items
        // Note: You would need to create these mutations in your Convex functions
        // await batchCreateCollegeSchedule({ userId: convexUser.clerkId, scheduleItems });
      } else {
        // Save dining schedule items
        // await batchCreateDiningSchedule({ userId: convexUser.clerkId, scheduleItems });
      }

      toast.success(
        `${
          type === "college" ? "Class" : "Dining"
        } schedule saved successfully!`
      );
      setShowScheduleCompletionModal(false);
      setIncompleteScheduleItems([]);
      setPdfProcessingResult(null);
      setScheduleType(null);
    } catch (error) {
      console.error("Error saving schedule:", error);
      toast.error("Failed to save schedule. Please try again.");
    }
  };

  const handleCompleteScheduleItem = (index: number, updates: any) => {
    const updatedItems = [...incompleteScheduleItems];
    updatedItems[index] = { ...updatedItems[index], ...updates };
    setIncompleteScheduleItems(updatedItems);
  };

  const handleSaveCompletedSchedule = async () => {
    if (!pdfProcessingResult) return;

    // Combine completed items with already complete items
    const allItems = [
      ...pdfProcessingResult.scheduleItems.filter((item: any) => {
        if (scheduleType === "college") {
          return (
            item.subject && item.dayOfWeek && item.startTime && item.endTime
          );
        } else {
          return (
            item.mealType && item.dayOfWeek && item.startTime && item.endTime
          );
        }
      }),
      ...incompleteScheduleItems,
    ];

    await saveScheduleItems(allItems, scheduleType!);
  };

  const getPlanBadgeVariant = () => {
    switch (plan) {
      case "PRO":
        return "default" as const;
      case "STARTER":
        return "secondary" as const;
      default:
        return "outline" as const;
    }
  };

  if (!convexUser || !clerkUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Keep tabs in sync with URL hash like #personal, #academic, #schedules, #plan, #notifications, #preferences
  useEffect(() => {
    const applyHash = () => {
      const hash =
        typeof window !== "undefined"
          ? window.location.hash.replace("#", "")
          : "";
      if (hash) setActiveTab(hash);
    };

    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  return (
    <div className="container mx-auto py-6 sm:py-8 space-y-6 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Profile Settings
          </h1>
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
        <div className="w-full sm:w-auto">
          <Button
            onClick={handleSaveProfile}
            disabled={isLoading}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? "Saving..." : "Save Now"}
          </Button>
        </div>
      </div>

      {!isProfileComplete() && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <CardHeader>
            <CardTitle className="text-orange-800 dark:text-orange-200">
              Complete Your Profile
            </CardTitle>
            <CardDescription className="text-orange-700 dark:text-orange-300">
              Please fill in your academic information to get the most out of
              EduBox. Changes are automatically saved.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v);
          // update the URL hash without scrolling (history API)
          if (typeof window !== "undefined") {
            history.replaceState(null, "", `#${v}`);
          }
        }}
        className="space-y-6"
      >
        <TabsList className="flex flex-wrap gap-2 w-full">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
          <TabsTrigger value="plan">Plan & Usage</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent id="personal" value="personal" className="space-y-6">
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
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
                  <Badge
                    variant={isProfileComplete() ? "default" : "secondary"}
                  >
                    {isProfileComplete()
                      ? "Profile Complete"
                      : "Profile Incomplete"}
                  </Badge>
                  <Badge
                    variant={getPlanBadgeVariant()}
                    className="flex items-center gap-1"
                  >
                    {planLoading ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
                    ) : (
                      getPlanIcon()
                    )}
                    {planLoading ? "Loading Plan..." : `${planInfo.name} Plan`}
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
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    placeholder="Enter your first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
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

        <TabsContent id="plan" value="plan" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {planLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                ) : (
                  getPlanIcon()
                )}
                Current Plan
              </CardTitle>
              <CardDescription>
                Manage your subscription and view feature usage.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {planLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2 text-gray-600">
                    Loading plan details...
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">
                          {planInfo.name} Plan
                        </h3>
                        <Badge
                          variant={getPlanBadgeVariant()}
                          className="flex items-center gap-1"
                        >
                          {getPlanIcon()}
                          Active
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {planInfo.description}
                      </p>
                    </div>
                    <Button onClick={() => router.push("/manage-plan")}>
                      {plan === "FREE" ? "Upgrade Plan" : "Manage Plan"}
                    </Button>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="text-md font-medium">Available Features</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {planInfo.features.map((feature) => (
                        <div
                          key={feature}
                          className="flex items-center gap-2 p-2 rounded-md bg-muted/50"
                        >
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm capitalize">
                            {feature.replace(/-/g, " ")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {plan !== "PRO" && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <h4 className="text-md font-medium">
                          Upgrade Benefits
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {plan === "FREE" && (
                            <>
                              <div className="flex items-center gap-2 p-2 rounded-md">
                                <Zap className="w-4 h-4 text-orange-500" />
                                <span className="text-sm">
                                  10x more AI interactions
                                </span>
                              </div>
                              <div className="flex items-center gap-2 p-2 rounded-md">
                                <BookOpen className="w-4 h-4 text-blue-500" />
                                <span className="text-sm">
                                  Advanced analytics
                                </span>
                              </div>
                            </>
                          )}
                          {(plan === "FREE" || plan === "STARTER") && (
                            <>
                              <div className="flex items-center gap-2 p-2 rounded-md">
                                <Crown className="w-4 h-4 text-purple-500" />
                                <span className="text-sm">
                                  Unlimited storage
                                </span>
                              </div>
                              <div className="flex items-center gap-2 p-2 rounded-md">
                                <Shield className="w-4 h-4 text-green-500" />
                                <span className="text-sm">
                                  Priority support
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="text-md font-medium">Feature Usage</h4>
                    <div className="space-y-4">
                      <Usage
                        featureFlag={FeatureFlag.AI_CHAT_ASSISTANT}
                        title="AI Chat Assistant"
                      />
                      <Usage
                        featureFlag={FeatureFlag.FILE_MANAGEMENT}
                        title="File Storage"
                      />
                      {plan !== "FREE" && (
                        <>
                          <Usage
                            featureFlag={FeatureFlag.ADVANCED_SEARCH}
                            title="Advanced Search"
                          />
                          <Usage
                            featureFlag={FeatureFlag.COURSE_ANALYTICS}
                            title="Course Analytics"
                          />
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent id="academic" value="academic" className="space-y-6">
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
                    onChange={(e) =>
                      handleInputChange("studentId", e.target.value)
                    }
                    placeholder="Enter your student ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="institution">Institution *</Label>
                  <Input
                    id="institution"
                    value={formData.institution || ""}
                    onChange={(e) =>
                      handleInputChange("institution", e.target.value)
                    }
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
                    onChange={(e) =>
                      handleInputChange(
                        "gpa",
                        parseFloat(e.target.value) || undefined
                      )
                    }
                    placeholder="Enter your GPA"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          id="notifications"
          value="notifications"
          className="space-y-6"
        >
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
                  onCheckedChange={(checked) =>
                    handleInputChange("notificationsEnabled", checked)
                  }
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
                  onCheckedChange={(checked) =>
                    handleInputChange("emailNotifications", checked)
                  }
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
                      onCheckedChange={(checked) =>
                        handleInputChange("assignmentReminders", checked)
                      }
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
                      onCheckedChange={(checked) =>
                        handleInputChange("classReminders", checked)
                      }
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
                      onCheckedChange={(checked) =>
                        handleInputChange("campusEventReminders", checked)
                      }
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
                      onCheckedChange={(checked) =>
                        handleInputChange("studyReminders", checked)
                      }
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
                      onCheckedChange={(checked) =>
                        handleInputChange("weeklyDigest", checked)
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent id="preferences" value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                App Preferences
              </CardTitle>
              <CardDescription>Customize your app experience.</CardDescription>
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
                  onValueChange={(value) =>
                    handleInputChange("timezone", value)
                  }
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

        <TabsContent id="schedules" value="schedules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule Management
              </CardTitle>
              <CardDescription>
                Manage your dining times and college class schedules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs defaultValue="dining" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="dining">Dining Schedule</TabsTrigger>
                  <TabsTrigger value="college">College Schedule</TabsTrigger>
                </TabsList>

                <TabsContent value="dining" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Dining Schedule & Preferences
                      </CardTitle>
                      <CardDescription>
                        Set your meal times and upload dining hall schedules
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Meal Count Selection */}
                      <div className="space-y-2">
                        <Label htmlFor="mealCount">
                          Number of meals per day
                        </Label>
                        <Select>
                          <SelectTrigger id="mealCount">
                            <SelectValue placeholder="Select meal count" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2">
                              2 meals (Breakfast & Dinner)
                            </SelectItem>
                            <SelectItem value="3">
                              3 meals (Breakfast, Lunch & Dinner)
                            </SelectItem>
                            <SelectItem value="4">
                              4 meals (Breakfast, Lunch, Snack & Dinner)
                            </SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Meal Types Selection */}
                      <div className="space-y-2">
                        <Label>Select your meal types</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {[
                            "Breakfast",
                            "Lunch",
                            "Dinner",
                            "Brunch",
                            "Snack",
                            "Late Night",
                          ].map((meal) => (
                            <label
                              key={meal}
                              className="flex items-center space-x-2"
                            >
                              <input type="checkbox" className="rounded" />
                              <span className="text-sm">{meal}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* PDF Upload */}
                      <div className="space-y-2">
                        <Label>Upload Dining Schedule (PDF)</Label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <input
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            id="dining-pdf-upload"
                          />
                          <label
                            htmlFor="dining-pdf-upload"
                            className="cursor-pointer"
                          >
                            <div className="space-y-2">
                              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Calendar className="h-6 w-6 text-gray-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">
                                  Upload dining schedule PDF
                                </p>
                                <p className="text-xs text-gray-500">
                                  AI will extract meal times and locations
                                </p>
                              </div>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Manual Time Entry */}
                      <div className="space-y-4">
                        <Label>Or set meal times manually</Label>
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <Label className="text-sm">Breakfast</Label>
                              <div className="flex gap-2">
                                <Input
                                  placeholder="07:00"
                                  className="text-sm"
                                />
                                <span className="flex items-center text-sm text-gray-500">
                                  to
                                </span>
                                <Input
                                  placeholder="09:00"
                                  className="text-sm"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm">Lunch</Label>
                              <div className="flex gap-2">
                                <Input
                                  placeholder="12:00"
                                  className="text-sm"
                                />
                                <span className="flex items-center text-sm text-gray-500">
                                  to
                                </span>
                                <Input
                                  placeholder="14:00"
                                  className="text-sm"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm">Dinner</Label>
                              <div className="flex gap-2">
                                <Input
                                  placeholder="18:00"
                                  className="text-sm"
                                />
                                <span className="flex items-center text-sm text-gray-500">
                                  to
                                </span>
                                <Input
                                  placeholder="20:00"
                                  className="text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Dining Preferences */}
                      <div className="space-y-4">
                        <Label>Dining Preferences</Label>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-sm font-medium">
                                Show in calendar
                              </Label>
                              <p className="text-xs text-gray-500">
                                Display meal times in your calendar
                              </p>
                            </div>
                            <Switch />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-sm font-medium">
                                Meal reminders
                              </Label>
                              <p className="text-xs text-gray-500">
                                Get notified before meal times
                              </p>
                            </div>
                            <Switch />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">
                              Reminder time (minutes before)
                            </Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select reminder time" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="5">5 minutes</SelectItem>
                                <SelectItem value="10">10 minutes</SelectItem>
                                <SelectItem value="15">15 minutes</SelectItem>
                                <SelectItem value="30">30 minutes</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <Button className="w-full">Save Dining Schedule</Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="college" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        College Class Schedule
                      </CardTitle>
                      <CardDescription>
                        Manage your class timetable and course information
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* PDF Upload */}
                      <div className="space-y-2">
                        <Label>Upload Class Schedule (PDF)</Label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <input
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            id="college-pdf-upload"
                          />
                          <label
                            htmlFor="college-pdf-upload"
                            className="cursor-pointer"
                          >
                            <div className="space-y-2">
                              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                <BookOpen className="h-6 w-6 text-gray-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">
                                  Upload class schedule PDF
                                </p>
                                <p className="text-xs text-gray-500">
                                  AI will extract classes, times, and locations
                                </p>
                              </div>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Manual Class Entry */}
                      <div className="space-y-4">
                        <Label>Or add classes manually</Label>
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm">Subject/Course</Label>
                              <Input placeholder="e.g., Computer Science" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm">Course Code</Label>
                              <Input placeholder="e.g., CS101" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm">Instructor</Label>
                              <Input placeholder="Professor name" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm">Location</Label>
                              <Input placeholder="Room/Building" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm">Day of Week</Label>
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select day" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Monday">Monday</SelectItem>
                                  <SelectItem value="Tuesday">
                                    Tuesday
                                  </SelectItem>
                                  <SelectItem value="Wednesday">
                                    Wednesday
                                  </SelectItem>
                                  <SelectItem value="Thursday">
                                    Thursday
                                  </SelectItem>
                                  <SelectItem value="Friday">Friday</SelectItem>
                                  <SelectItem value="Saturday">
                                    Saturday
                                  </SelectItem>
                                  <SelectItem value="Sunday">Sunday</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm">Time</Label>
                              <div className="flex gap-2">
                                <Input placeholder="09:00" />
                                <span className="flex items-center text-sm text-gray-500">
                                  to
                                </span>
                                <Input placeholder="10:30" />
                              </div>
                            </div>
                          </div>
                          <Button variant="outline" className="w-full">
                            Add Class
                          </Button>
                        </div>
                      </div>

                      {/* Schedule Preferences */}
                      <div className="space-y-4">
                        <Label>Schedule Preferences</Label>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-sm font-medium">
                                Show in calendar
                              </Label>
                              <p className="text-xs text-gray-500">
                                Display classes in your calendar
                              </p>
                            </div>
                            <Switch />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-sm font-medium">
                                Class reminders
                              </Label>
                              <p className="text-xs text-gray-500">
                                Get notified before classes start
                              </p>
                            </div>
                            <Switch />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">
                              Reminder time (minutes before)
                            </Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select reminder time" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="5">5 minutes</SelectItem>
                                <SelectItem value="10">10 minutes</SelectItem>
                                <SelectItem value="15">15 minutes</SelectItem>
                                <SelectItem value="30">30 minutes</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <Button className="w-full">Save Class Schedule</Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Schedule Completion Modal */}
      <Dialog
        open={showScheduleCompletionModal}
        onOpenChange={setShowScheduleCompletionModal}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Complete {scheduleType === "college" ? "Class" : "Dining"}{" "}
              Schedule
            </DialogTitle>
            <DialogDescription>
              Some information was missing from the PDF. Please complete the
              following items before saving.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {incompleteScheduleItems.map((item, index) => (
              <Card key={index} className="border-amber-200 bg-amber-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    {scheduleType === "college" ? "Class" : "Meal"} {index + 1}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {scheduleType === "college" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Subject/Course *</Label>
                        <Input
                          value={item.subject || ""}
                          onChange={(e) =>
                            handleCompleteScheduleItem(index, {
                              subject: e.target.value,
                            })
                          }
                          placeholder="e.g., Computer Science"
                          className={!item.subject ? "border-red-300" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Course Code</Label>
                        <Input
                          value={item.code || ""}
                          onChange={(e) =>
                            handleCompleteScheduleItem(index, {
                              code: e.target.value,
                            })
                          }
                          placeholder="e.g., CS101"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Instructor</Label>
                        <Input
                          value={item.instructor || ""}
                          onChange={(e) =>
                            handleCompleteScheduleItem(index, {
                              instructor: e.target.value,
                            })
                          }
                          placeholder="Professor name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Location</Label>
                        <Input
                          value={item.location || ""}
                          onChange={(e) =>
                            handleCompleteScheduleItem(index, {
                              location: e.target.value,
                            })
                          }
                          placeholder="Room/Building"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Day of Week *</Label>
                        <Select
                          value={item.dayOfWeek || ""}
                          onValueChange={(value) =>
                            handleCompleteScheduleItem(index, {
                              dayOfWeek: value,
                            })
                          }
                        >
                          <SelectTrigger
                            className={!item.dayOfWeek ? "border-red-300" : ""}
                          >
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Monday">Monday</SelectItem>
                            <SelectItem value="Tuesday">Tuesday</SelectItem>
                            <SelectItem value="Wednesday">Wednesday</SelectItem>
                            <SelectItem value="Thursday">Thursday</SelectItem>
                            <SelectItem value="Friday">Friday</SelectItem>
                            <SelectItem value="Saturday">Saturday</SelectItem>
                            <SelectItem value="Sunday">Sunday</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Time *</Label>
                        <div className="flex gap-2">
                          <Input
                            value={item.startTime || ""}
                            onChange={(e) =>
                              handleCompleteScheduleItem(index, {
                                startTime: e.target.value,
                              })
                            }
                            placeholder="09:00"
                            className={!item.startTime ? "border-red-300" : ""}
                          />
                          <span className="flex items-center text-sm text-gray-500">
                            to
                          </span>
                          <Input
                            value={item.endTime || ""}
                            onChange={(e) =>
                              handleCompleteScheduleItem(index, {
                                endTime: e.target.value,
                              })
                            }
                            placeholder="10:30"
                            className={!item.endTime ? "border-red-300" : ""}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Meal Type *</Label>
                        <Select
                          value={item.mealType || ""}
                          onValueChange={(value) =>
                            handleCompleteScheduleItem(index, {
                              mealType: value,
                            })
                          }
                        >
                          <SelectTrigger
                            className={!item.mealType ? "border-red-300" : ""}
                          >
                            <SelectValue placeholder="Select meal type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="breakfast">Breakfast</SelectItem>
                            <SelectItem value="lunch">Lunch</SelectItem>
                            <SelectItem value="dinner">Dinner</SelectItem>
                            <SelectItem value="brunch">Brunch</SelectItem>
                            <SelectItem value="snack">Snack</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Location</Label>
                        <Input
                          value={item.location || ""}
                          onChange={(e) =>
                            handleCompleteScheduleItem(index, {
                              location: e.target.value,
                            })
                          }
                          placeholder="Dining hall name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Day of Week *</Label>
                        <Select
                          value={item.dayOfWeek || ""}
                          onValueChange={(value) =>
                            handleCompleteScheduleItem(index, {
                              dayOfWeek: value,
                            })
                          }
                        >
                          <SelectTrigger
                            className={!item.dayOfWeek ? "border-red-300" : ""}
                          >
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Monday">Monday</SelectItem>
                            <SelectItem value="Tuesday">Tuesday</SelectItem>
                            <SelectItem value="Wednesday">Wednesday</SelectItem>
                            <SelectItem value="Thursday">Thursday</SelectItem>
                            <SelectItem value="Friday">Friday</SelectItem>
                            <SelectItem value="Saturday">Saturday</SelectItem>
                            <SelectItem value="Sunday">Sunday</SelectItem>
                            <SelectItem value="Daily">Daily</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Time *</Label>
                        <div className="flex gap-2">
                          <Input
                            value={item.startTime || ""}
                            onChange={(e) =>
                              handleCompleteScheduleItem(index, {
                                startTime: e.target.value,
                              })
                            }
                            placeholder="07:00"
                            className={!item.startTime ? "border-red-300" : ""}
                          />
                          <span className="flex items-center text-sm text-gray-500">
                            to
                          </span>
                          <Input
                            value={item.endTime || ""}
                            onChange={(e) =>
                              handleCompleteScheduleItem(index, {
                                endTime: e.target.value,
                              })
                            }
                            placeholder="09:00"
                            className={!item.endTime ? "border-red-300" : ""}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Special Notes</Label>
                        <Input
                          value={item.specialNotes || ""}
                          onChange={(e) =>
                            handleCompleteScheduleItem(index, {
                              specialNotes: e.target.value,
                            })
                          }
                          placeholder="Weekend special, etc."
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setShowScheduleCompletionModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveCompletedSchedule}
              disabled={incompleteScheduleItems.some((item) => {
                if (scheduleType === "college") {
                  return (
                    !item.subject ||
                    !item.dayOfWeek ||
                    !item.startTime ||
                    !item.endTime
                  );
                } else {
                  return (
                    !item.mealType ||
                    !item.dayOfWeek ||
                    !item.startTime ||
                    !item.endTime
                  );
                }
              })}
            >
              Save {scheduleType === "college" ? "Class" : "Dining"} Schedule
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
