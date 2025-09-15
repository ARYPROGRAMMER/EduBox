import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { api } from "./_generated/api";

export const autoFailStalePendingJobs = mutation({
  args: {},
  handler: async (ctx) => {
    try {
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      const stale = await ctx.db
        .query("dataImportExport")
        .filter((q: any) =>
          q.and(
            q.eq(q.field("status"), "pending"),
            q.lt(q.field("startedAt"), oneHourAgo)
          )
        )
        .collect();
      const createdNotificationIds: any[] = [];
      for (const job of stale) {
        try {
          await ctx.db.patch(job._id, {
            status: "failed",
            resultSummary: "Automatically failed after 1 hour of pending",
            completedAt: Date.now(),
            updatedAt: Date.now(),
          });

          // Create an in-app notification for the job owner
          try {
            const id = await ctx.db.insert("notifications", {
              userId: job.userId,
              title: "Import/Export Job Failed",
              message: `Your ${job.operation} of ${job.dataType} was automatically marked failed after 1 hour in pending state.`,
              type: "system",
              priority: "high",
              relatedId: String(job._id),
              relatedType: "dataImportExport",
              isRead: false,
              isArchived: false,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            });
            createdNotificationIds.push(id);
          } catch (notifErr) {
            console.warn(
              "Failed to create notification for auto-failed job",
              job._id,
              notifErr
            );
          }
        } catch (e) {
          console.warn("Failed to auto-fail job", job._id, e);
        }
      }

      return {
        failedCount: stale.length,
        notificationIds: createdNotificationIds,
      };
    } catch (e) {
      console.warn("Error auto-failing stale pending jobs:", e);
    }
  },
});

// Create import/export job
export const createImportExportJob = mutation({
  args: {
    userId: v.string(),
    operation: v.string(), // "import", "export"
    dataType: v.string(), // "courses", "assignments", "grades", "analytics", "dining"
    format: v.string(), // "csv", "json", "pdf"
    fileName: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    storageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("dataImportExport", {
      userId: args.userId,
      operation: args.operation,
      dataType: args.dataType,
      format: args.format,
      fileName: args.fileName,
      fileSize: args.fileSize,
      storageId: args.storageId,
      status: "pending",
      progress: 0,
      recordsProcessed: 0,
      recordsTotal: 0,
      recordsSuccessful: 0,
      recordsFailed: 0,
      errors: [],
      warnings: [],
      startedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update import/export job status
export const updateImportExportJob = mutation({
  args: {
    jobId: v.id("dataImportExport"),
    status: v.optional(v.string()),
    progress: v.optional(v.number()),
    recordsProcessed: v.optional(v.number()),
    recordsTotal: v.optional(v.number()),
    recordsSuccessful: v.optional(v.number()),
    recordsFailed: v.optional(v.number()),
    errors: v.optional(v.array(v.string())),
    warnings: v.optional(v.array(v.string())),
    aiProcessingUsed: v.optional(v.boolean()),
    aiModel: v.optional(v.string()),
    extractedData: v.optional(v.string()),
    resultSummary: v.optional(v.string()),
    outputFileId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const { jobId, ...updateData } = args;
    const updates: any = {
      ...updateData,
      updatedAt: Date.now(),
    };
    const existing = await ctx.db.get(jobId);

    if (args.status === "completed" || args.status === "failed") {
      updates.completedAt = Date.now();
    }

    const patched = await ctx.db.patch(jobId, updates);

    try {
      const newStatus = args.status || existing?.status;
      const oldStatus = existing?.status;

      if (existing && existing.userId) {
        const now = Date.now();

        if (oldStatus !== "processing" && newStatus === "processing") {
          await ctx.db.insert("notifications", {
            userId: existing.userId,
            title: "Import/Export Started",
            message: `Your ${existing.operation} of ${existing.dataType} has started processing.`,
            type: "system",
            priority: "medium",
            relatedId: String(jobId),
            relatedType: "dataImportExport",
            isRead: false,
            isArchived: false,
            createdAt: now,
            updatedAt: now,
          });
        }

        if (oldStatus !== "completed" && newStatus === "completed") {
          await ctx.db.insert("notifications", {
            userId: existing.userId,
            title: "Import/Export Completed",
            message: `Your ${existing.operation} of ${
              existing.dataType
            } has completed. ${updateData.resultSummary || ""}`,
            type: "system",
            priority: "high",
            relatedId: String(jobId),
            relatedType: "dataImportExport",
            isRead: false,
            isArchived: false,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    } catch (notifErr) {
      console.warn(
        "Failed to create notification on job update",
        jobId,
        notifErr
      );
    }

    return patched;
  },
});

// Get import/export jobs for a user
export const getImportExportJobs = query({
  args: {
    userId: v.string(),
    operation: v.optional(v.string()),
    dataType: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("dataImportExport")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId));

    if (args.operation) {
      query = query.filter((q) => q.eq(q.field("operation"), args.operation));
    }

    if (args.dataType) {
      query = query.filter((q) => q.eq(q.field("dataType"), args.dataType));
    }

    return await query.order("desc").take(args.limit || 50);
  },
});

// Get single import/export job (internal)
export const getJob = query({
  args: {
    jobId: v.id("dataImportExport"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.jobId);
  },
});

// Internal function to access getJob
export const internal_getJob = query({
  args: {
    jobId: v.id("dataImportExport"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.jobId);
  },
});

// Process CSV import (action to handle file processing)
export const processCsvImport = action({
  args: {
    jobId: v.id("dataImportExport"),
    csvData: v.string(),
  },
  handler: async (ctx, args) => {
    // Get the job details
    const job = await ctx.runQuery(api.dataImportExport.internal_getJob, {
      jobId: args.jobId,
    });
    if (!job) {
      throw new Error("Job not found");
    }

    // Update status to processing
    await ctx.runMutation(api.dataImportExport.updateImportExportJob, {
      jobId: args.jobId,
      status: "processing",
    });

    try {
      // Parse CSV based on data type
      let records: any[] = [];
      let errors: string[] = [];
      let warnings: string[] = [];

      switch (job.dataType) {
        case "courses":
          ({ records, errors, warnings } = await parseCoursesCsv(args.csvData));
          break;
        case "assignments":
          ({ records, errors, warnings } = await parseAssignmentsCsv(
            args.csvData
          ));
          break;
        case "grades":
          ({ records, errors, warnings } = await parseGradesCsv(args.csvData));
          break;
        default:
          throw new Error(`Unsupported data type: ${job.dataType}`);
      }

      // Update job with total records
      await ctx.runMutation(api.dataImportExport.updateImportExportJob, {
        jobId: args.jobId,
        recordsTotal: records.length,
        errors,
        warnings,
      });

      // Process records in batches
      let successCount = 0;
      let failCount = 0;
      const batchSize = 10;

      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);

        for (const record of batch) {
          try {
            // Import record based on data type
            switch (job.dataType) {
              case "courses":
                await ctx.runMutation(api.courses.createCourse, {
                  ...record,
                  userId: job.userId,
                });
                break;
              case "assignments":
                await ctx.runMutation(api.assignments.createAssignment, {
                  ...record,
                  userId: job.userId,
                });
                break;
              case "grades":
                await ctx.runMutation(api.analytics.addGradeRecord, {
                  ...record,
                  userId: job.userId,
                });
                break;
            }
            successCount++;
          } catch (error) {
            failCount++;
            errors.push(`Row ${i + batch.indexOf(record) + 1}: ${error}`);
          }
        }

        // Update progress
        const processed = i + batch.length;
        const progress = Math.round((processed / records.length) * 100);
        await ctx.runMutation(api.dataImportExport.updateImportExportJob, {
          jobId: args.jobId,
          progress,
          recordsProcessed: processed,
          recordsSuccessful: successCount,
          recordsFailed: failCount,
          errors,
        });
      }

      // Mark as completed
      await ctx.runMutation(api.dataImportExport.updateImportExportJob, {
        jobId: args.jobId,
        status: "completed",
        resultSummary: `Import completed: ${successCount} successful, ${failCount} failed`,
      });
    } catch (error) {
      // Mark as failed
      await ctx.runMutation(api.dataImportExport.updateImportExportJob, {
        jobId: args.jobId,
        status: "failed",
        errors: [error instanceof Error ? error.message : "Unknown error"],
      });
    }
  },
});

// Export data immediately and return CSV content to client.
export const exportDataNow = mutation({
  args: {
    userId: v.string(),
    dataType: v.string(),
    format: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, dataType, format } = args;

    // Helper to convert array of objects to CSV (simple implementation)
    const toCsv = (rows: any[], headers: string[]) => {
      const esc = (v: any) => {
        if (v === null || v === undefined) return "";
        const s = typeof v === "string" ? v : String(v);
        if (s.includes(",") || s.includes('"') || s.includes("\n")) {
          return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
      };
      const headerRow = headers.join(",");
      const lines = rows.map((r) => headers.map((h) => esc(r[h])).join(","));
      return [headerRow, ...lines].join("\n");
    };

    let rows: any[] = [];
    let headers: string[] = [];
    let fileName = `${dataType}-${userId}-${Date.now()}.csv`;

    switch (dataType) {
      case "courses": {
        const records = await ctx.db
          .query("courses")
          .withIndex("by_user_id", (q: any) => q.eq("userId", userId))
          .collect();
        rows = records.map((r: any) => ({
          courseCode: r.courseCode,
          courseName: r.courseName,
          instructor: r.instructor || "",
          semester: r.semester || "",
          credits: r.credits || "",
          schedule: r.schedule ? JSON.stringify(r.schedule) : "",
        }));
        headers = [
          "courseCode",
          "courseName",
          "instructor",
          "semester",
          "credits",
          "schedule",
        ];
        break;
      }
      case "assignments": {
        const records = await ctx.db
          .query("assignments")
          .withIndex("by_user_id", (q: any) => q.eq("userId", userId))
          .collect();
        rows = records.map((r: any) => ({
          title: r.title,
          description: r.description || "",
          courseId: r.courseId || "",
          dueDate: r.dueDate || "",
          status: r.status || "",
          priority: r.priority || "",
          maxPoints: r.maxPoints || "",
        }));
        headers = [
          "title",
          "description",
          "courseId",
          "dueDate",
          "status",
          "priority",
          "maxPoints",
        ];
        break;
      }
      case "detailed_grades":
      case "transcript":
      case "grades": {
        const records = await ctx.db
          .query("gradeHistory")
          .withIndex("by_user_id", (q: any) => q.eq("userId", userId))
          .collect();
        rows = records.map((r: any) => ({
          courseId: r.courseId || "",
          assignmentId: r.assignmentId || "",
          grade: r.grade || "",
          numericGrade: r.numericGrade || "",
          maxPoints: r.maxPoints || "",
          earnedPoints: r.earnedPoints || "",
          dateGraded: r.dateGraded || "",
        }));
        headers = [
          "courseId",
          "assignmentId",
          "grade",
          "numericGrade",
          "maxPoints",
          "earnedPoints",
          "dateGraded",
        ];
        break;
      }
      case "study_sessions": {
        const records = await ctx.db
          .query("studySessions")
          .withIndex("by_user_id", (q: any) => q.eq("userId", userId))
          .collect();
        rows = records.map((r: any) => ({
          startTime: r.startTime || "",
          endTime: r.endTime || "",
          duration: r.duration || "",
          courseId: r.courseId || "",
          title: r.title || "",
          sessionType: r.sessionType || "",
          focusScore: r.focusScore || "",
          productivityRating: r.productivityRating || "",
          notes: r.notes || "",
        }));
        headers = [
          "startTime",
          "endTime",
          "duration",
          "courseId",
          "title",
          "sessionType",
          "focusScore",
          "productivityRating",
          "notes",
        ];
        break;
      }
      case "schedule":
      case "course_schedule": {
        const records = await ctx.db
          .query("collegeSchedule")
          .withIndex("by_user_id", (q: any) => q.eq("userId", userId))
          .collect();
        rows = records.map((r: any) => ({
          subject: r.subject || "",
          code: r.code || "",
          instructor: r.instructor || "",
          location: r.location || "",
          dayOfWeek: r.dayOfWeek || "",
          startTime: r.startTime || "",
          endTime: r.endTime || "",
          semester: r.semester || "",
        }));
        headers = [
          "subject",
          "code",
          "instructor",
          "location",
          "dayOfWeek",
          "startTime",
          "endTime",
          "semester",
        ];
        break;
      }
      default: {
        throw new Error(`Unsupported data type for export: ${dataType}`);
      }
    }

    const csv = toCsv(rows, headers);

    // Insert a completed job record for history
    const now = Date.now();
    const jobIdInserted = await ctx.db.insert("dataImportExport", {
      userId,
      operation: "export",
      dataType,
      format,
      fileName,
      fileSize: csv.length,
      status: "completed",
      progress: 100,
      recordsProcessed: rows.length,
      recordsTotal: rows.length,
      recordsSuccessful: rows.length,
      recordsFailed: 0,
      errors: [],
      warnings: [],
      startedAt: now,
      completedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    try {
      await ctx.db.insert("notifications", {
        userId,
        title: "Export Completed",
        message: `Your export of ${dataType} is ready: ${fileName}`,
        type: "system",
        priority: "medium",
        relatedId: String(jobIdInserted),
        relatedType: "dataImportExport",
        isRead: false,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      });
    } catch (e) {
      console.warn("Failed to create export notification", e);
    }

    return { csv, fileName };
  },
});

// Return counts (or availability) of exportable data for a user per dataType
export const getAvailableExportData = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = args;

    // For each supported export type, run a count query (cheap)
    const counts: Record<string, number> = {};

    // courses
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .take(1);
    counts.courses = courses.length;

    // assignments
    const assignments = await ctx.db
      .query("assignments")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .take(1);
    counts.assignments = assignments.length;

    // grades (gradeHistory)
    const grades = await ctx.db
      .query("gradeHistory")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .take(1);
    counts.grades = grades.length;

    // study_sessions
    const study_sessions = await ctx.db
      .query("studySessions")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .take(1);
    counts.study_sessions = study_sessions.length;

    // schedule / course_schedule -> use collegeSchedule from schema
    const schedule = await ctx.db
      .query("collegeSchedule")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .take(1);
    counts.schedule = schedule.length;

    // detailed_grades / transcript -> use gradeHistory as well
    counts.detailed_grades = counts.grades;
    counts.transcript = counts.grades;

    return counts;
  },
});

// Request export but validate that data exists first. Throws if no data to export.
export const requestExport = mutation({
  args: {
    userId: v.string(),
    dataType: v.string(),
    format: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, dataType, format } = args;

    // Inline availability checks to avoid cross-query circular typing
    const counts: Record<string, number> = {};

    const courses = await ctx.db
      .query("courses")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .take(1);
    counts.courses = courses.length;

    const assignments = await ctx.db
      .query("assignments")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .take(1);
    counts.assignments = assignments.length;

    const grades = await ctx.db
      .query("gradeHistory")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .take(1);
    counts.grades = grades.length;

    const study_sessions = await ctx.db
      .query("studySessions")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .take(1);
    counts.study_sessions = study_sessions.length;

    const schedule = await ctx.db
      .query("collegeSchedule")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .take(1);
    counts.schedule = schedule.length;

    counts.detailed_grades = counts.grades;
    counts.transcript = counts.grades;

    const availableCount = (counts && counts[dataType]) || 0;
    if (!availableCount || availableCount <= 0) {
      throw new Error(`No ${dataType} data available to export`);
    }

    // Create export job directly in DB
    const now = Date.now();
    return await ctx.db.insert("dataImportExport", {
      userId,
      operation: "export",
      dataType,
      format,
      status: "pending",
      progress: 0,
      recordsProcessed: 0,
      recordsTotal: 0,
      recordsSuccessful: 0,
      recordsFailed: 0,
      errors: [],
      warnings: [],
      startedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Helper function to parse courses CSV
async function parseCoursesCsv(csvText: string) {
  const lines = csvText.split("\n");
  const headers = lines[0].split(",").map((h) => h.trim());
  const records: any[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(",").map((v) => v.trim());
    if (values.length !== headers.length) {
      errors.push(`Row ${i + 1}: Column count mismatch`);
      continue;
    }

    const record: any = {};
    headers.forEach((header, index) => {
      const value = values[index];

      switch (header.toLowerCase()) {
        case "coursecode":
        case "course_code":
          record.courseCode = value;
          break;
        case "coursename":
        case "course_name":
          record.courseName = value;
          break;
        case "instructor":
          record.instructor = value;
          break;
        case "semester":
          record.semester = value;
          break;
        case "credits":
          record.credits = parseFloat(value) || 0;
          break;
        case "status":
          record.status = value || "active";
          break;
        case "grade":
          record.grade = value;
          break;
      }
    });

    if (!record.courseCode || !record.courseName) {
      errors.push(
        `Row ${i + 1}: Missing required fields (courseCode, courseName)`
      );
      continue;
    }

    records.push(record);
  }

  return { records, errors, warnings };
}

// Helper function to parse assignments CSV
async function parseAssignmentsCsv(csvText: string) {
  const lines = csvText.split("\n");
  const headers = lines[0].split(",").map((h) => h.trim());
  const records: any[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(",").map((v) => v.trim());
    if (values.length !== headers.length) {
      errors.push(`Row ${i + 1}: Column count mismatch`);
      continue;
    }

    const record: any = {};
    headers.forEach((header, index) => {
      const value = values[index];

      switch (header.toLowerCase()) {
        case "title":
          record.title = value;
          break;
        case "description":
          record.description = value;
          break;
        case "coursecode":
        case "course_code":
          record.courseCode = value;
          break;
        case "duedate":
        case "due_date":
          record.dueDate = new Date(value).getTime();
          break;
        case "status":
          record.status = value || "pending";
          break;
        case "priority":
          record.priority = value || "medium";
          break;
        case "maxpoints":
        case "max_points":
          record.maxPoints = parseFloat(value) || 0;
          break;
      }
    });

    if (!record.title) {
      errors.push(`Row ${i + 1}: Missing required field (title)`);
      continue;
    }

    records.push(record);
  }

  return { records, errors, warnings };
}

// Helper function to parse grades CSV
async function parseGradesCsv(csvText: string) {
  const lines = csvText.split("\n");
  const headers = lines[0].split(",").map((h) => h.trim());
  const records: any[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(",").map((v) => v.trim());
    if (values.length !== headers.length) {
      errors.push(`Row ${i + 1}: Column count mismatch`);
      continue;
    }

    const record: any = {};
    headers.forEach((header, index) => {
      const value = values[index];

      switch (header.toLowerCase()) {
        case "coursecode":
        case "course_code":
          record.courseCode = value;
          break;
        case "assignment":
        case "title":
          record.assignmentTitle = value;
          break;
        case "grade":
          record.grade = value;
          break;
        case "numericgrade":
        case "numeric_grade":
          record.numericGrade = parseFloat(value) || 0;
          break;
        case "maxpoints":
        case "max_points":
          record.maxPoints = parseFloat(value) || 0;
          break;
        case "earnedpoints":
        case "earned_points":
          record.earnedPoints = parseFloat(value) || 0;
          break;
        case "gradetype":
        case "grade_type":
          record.gradeType = value || "assignment";
          break;
        case "dategraded":
        case "date_graded":
          record.dateGraded = new Date(value).getTime();
          break;
      }
    });

    if (!record.courseCode || !record.grade) {
      errors.push(`Row ${i + 1}: Missing required fields (courseCode, grade)`);
      continue;
    }

    record.dateGraded = record.dateGraded || Date.now();
    records.push(record);
  }

  return { records, errors, warnings };
}

// Helper function to parse detailed grade sheets with comprehensive data
async function parseDetailedGradeSheet(csvText: string) {
  const lines = csvText.split("\n");
  const headers = lines[0].split(",").map((h) => h.trim());
  const records: any[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(",").map((v) => v.trim());
    if (values.length !== headers.length) {
      errors.push(`Row ${i + 1}: Column count mismatch`);
      continue;
    }

    const record: any = {};
    headers.forEach((header, index) => {
      const value = values[index];

      switch (header.toLowerCase()) {
        case "semester":
        case "term":
          record.semester = value;
          break;
        case "year":
          record.year = value;
          break;
        case "coursecode":
        case "course_code":
        case "course":
          record.courseCode = value;
          break;
        case "coursename":
        case "course_name":
        case "course_title":
          record.courseName = value;
          break;
        case "instructor":
        case "professor":
          record.instructor = value;
          break;
        case "credits":
        case "credit_hours":
          record.credits = parseFloat(value) || 0;
          break;
        case "finalgrade":
        case "final_grade":
        case "letter_grade":
          record.finalGrade = value;
          break;
        case "gpa":
        case "grade_points":
          record.gradePoints = parseFloat(value) || 0;
          break;
        case "percentage":
        case "final_percentage":
          record.percentage = parseFloat(value) || 0;
          break;
        case "assignment1":
        case "quiz1":
        case "midterm":
        case "final":
          // Handle individual assignment grades
          const assignmentName = header;
          const grade = parseFloat(value) || 0;
          if (!record.assignments) record.assignments = [];
          record.assignments.push({
            name: assignmentName,
            grade: grade,
            type: getAssignmentType(assignmentName),
          });
          break;
        case "attendance":
        case "attendance_rate":
          record.attendanceRate = parseFloat(value) || 0;
          break;
        case "participationgrade":
        case "participation":
          record.participationGrade = parseFloat(value) || 0;
          break;
      }
    });

    if (!record.courseCode) {
      errors.push(`Row ${i + 1}: Missing required field (courseCode)`);
      continue;
    }

    records.push(record);
  }

  return { records, errors, warnings };
}

// Helper function to parse course schedules with detailed timing
async function parseCourseSchedule(csvText: string) {
  const lines = csvText.split("\n");
  const headers = lines[0].split(",").map((h) => h.trim());
  const records: any[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(",").map((v) => v.trim());
    if (values.length !== headers.length) {
      errors.push(`Row ${i + 1}: Column count mismatch`);
      continue;
    }

    const record: any = { schedule: [] };
    headers.forEach((header, index) => {
      const value = values[index];

      switch (header.toLowerCase()) {
        case "coursecode":
        case "course_code":
          record.courseCode = value;
          break;
        case "coursename":
        case "course_name":
          record.courseName = value;
          break;
        case "instructor":
          record.instructor = value;
          break;
        case "semester":
          record.semester = value;
          break;
        case "credits":
          record.credits = parseFloat(value) || 0;
          break;
        case "monday":
        case "tuesday":
        case "wednesday":
        case "thursday":
        case "friday":
        case "saturday":
        case "sunday":
          if (value && value !== "N/A") {
            const [startTime, endTime, location] = value
              .split("|")
              .map((s) => s.trim());
            record.schedule.push({
              dayOfWeek: header.toLowerCase(),
              startTime: startTime || "",
              endTime: endTime || "",
              location: location || "",
            });
          }
          break;
        case "room":
        case "location":
        case "building":
          record.defaultLocation = value;
          break;
      }
    });

    if (!record.courseCode || !record.courseName) {
      errors.push(
        `Row ${i + 1}: Missing required fields (courseCode, courseName)`
      );
      continue;
    }

    records.push(record);
  }

  return { records, errors, warnings };
}

// Helper function to parse study session logs
async function parseStudySessionLogs(csvText: string) {
  const lines = csvText.split("\n");
  const headers = lines[0].split(",").map((h) => h.trim());
  const records: any[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(",").map((v) => v.trim());
    if (values.length !== headers.length) {
      errors.push(`Row ${i + 1}: Column count mismatch`);
      continue;
    }

    const record: any = {};
    headers.forEach((header, index) => {
      const value = values[index];

      switch (header.toLowerCase()) {
        case "date":
        case "session_date":
          record.startTime = new Date(value).getTime();
          break;
        case "coursecode":
        case "course_code":
        case "subject":
          record.courseCode = value;
          break;
        case "title":
        case "session_title":
          record.title = value;
          break;
        case "duration":
        case "duration_minutes":
          record.duration = parseInt(value) || 0;
          break;
        case "sessiontype":
        case "session_type":
        case "type":
          record.sessionType = value || "focused";
          break;
        case "focus_score":
        case "focusscore":
          record.focusScore = parseInt(value) || 0;
          break;
        case "productivity":
        case "productivity_rating":
          record.productivityRating = parseInt(value) || 0;
          break;
        case "location":
          record.location = value;
          break;
        case "notes":
        case "session_notes":
          record.notes = value;
          break;
      }
    });

    if (!record.startTime) {
      errors.push(`Row ${i + 1}: Missing required field (date)`);
      continue;
    }

    // Set end time based on duration
    if (record.duration) {
      record.endTime = record.startTime + record.duration * 60 * 1000;
    }

    records.push(record);
  }

  return { records, errors, warnings };
}

// Helper function to determine assignment type from name
function getAssignmentType(name: string): string {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("quiz")) return "quiz";
  if (
    lowerName.includes("exam") ||
    lowerName.includes("midterm") ||
    lowerName.includes("final")
  )
    return "exam";
  if (lowerName.includes("project")) return "project";
  if (lowerName.includes("homework") || lowerName.includes("hw"))
    return "homework";
  if (lowerName.includes("lab")) return "lab";
  if (lowerName.includes("discussion") || lowerName.includes("participation"))
    return "participation";
  return "assignment";
}

// Enhanced CSV parsing with support for multiple data types
async function parseCSVData(csvText: string, dataType: string) {
  switch (dataType) {
    case "courses":
      return await parseCoursesCsv(csvText);
    case "assignments":
      return await parseAssignmentsCsv(csvText);
    case "grades":
      return await parseGradesCsv(csvText);
    case "detailed_grades":
    case "transcript":
      return await parseDetailedGradeSheet(csvText);
    case "schedule":
    case "course_schedule":
      return await parseCourseSchedule(csvText);
    case "study_sessions":
    case "study_logs":
      return await parseStudySessionLogs(csvText);
    default:
      throw new Error(`Unsupported data type: ${dataType}`);
  }
}
