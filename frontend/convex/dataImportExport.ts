import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { api } from "./_generated/api";

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

    if (args.status === "completed" || args.status === "failed") {
      updates.completedAt = Date.now();
    }

    return await ctx.db.patch(jobId, updates);
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

    return await query
      .order("desc")
      .take(args.limit || 50);
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
    const job = await ctx.runQuery(api.dataImportExport.internal_getJob, { jobId: args.jobId });
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
          ({ records, errors, warnings } = await parseAssignmentsCsv(args.csvData));
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

// Helper function to parse courses CSV
async function parseCoursesCsv(csvText: string) {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const records: any[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',').map(v => v.trim());
    if (values.length !== headers.length) {
      errors.push(`Row ${i + 1}: Column count mismatch`);
      continue;
    }

    const record: any = {};
    headers.forEach((header, index) => {
      const value = values[index];
      
      switch (header.toLowerCase()) {
        case 'coursecode':
        case 'course_code':
          record.courseCode = value;
          break;
        case 'coursename':
        case 'course_name':
          record.courseName = value;
          break;
        case 'instructor':
          record.instructor = value;
          break;
        case 'semester':
          record.semester = value;
          break;
        case 'credits':
          record.credits = parseFloat(value) || 0;
          break;
        case 'status':
          record.status = value || "active";
          break;
        case 'grade':
          record.grade = value;
          break;
      }
    });

    if (!record.courseCode || !record.courseName) {
      errors.push(`Row ${i + 1}: Missing required fields (courseCode, courseName)`);
      continue;
    }

    records.push(record);
  }

  return { records, errors, warnings };
}

// Helper function to parse assignments CSV
async function parseAssignmentsCsv(csvText: string) {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const records: any[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',').map(v => v.trim());
    if (values.length !== headers.length) {
      errors.push(`Row ${i + 1}: Column count mismatch`);
      continue;
    }

    const record: any = {};
    headers.forEach((header, index) => {
      const value = values[index];
      
      switch (header.toLowerCase()) {
        case 'title':
          record.title = value;
          break;
        case 'description':
          record.description = value;
          break;
        case 'coursecode':
        case 'course_code':
          record.courseCode = value;
          break;
        case 'duedate':
        case 'due_date':
          record.dueDate = new Date(value).getTime();
          break;
        case 'status':
          record.status = value || "pending";
          break;
        case 'priority':
          record.priority = value || "medium";
          break;
        case 'maxpoints':
        case 'max_points':
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
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const records: any[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',').map(v => v.trim());
    if (values.length !== headers.length) {
      errors.push(`Row ${i + 1}: Column count mismatch`);
      continue;
    }

    const record: any = {};
    headers.forEach((header, index) => {
      const value = values[index];
      
      switch (header.toLowerCase()) {
        case 'coursecode':
        case 'course_code':
          record.courseCode = value;
          break;
        case 'assignment':
        case 'title':
          record.assignmentTitle = value;
          break;
        case 'grade':
          record.grade = value;
          break;
        case 'numericgrade':
        case 'numeric_grade':
          record.numericGrade = parseFloat(value) || 0;
          break;
        case 'maxpoints':
        case 'max_points':
          record.maxPoints = parseFloat(value) || 0;
          break;
        case 'earnedpoints':
        case 'earned_points':
          record.earnedPoints = parseFloat(value) || 0;
          break;
        case 'gradetype':
        case 'grade_type':
          record.gradeType = value || "assignment";
          break;
        case 'dategraded':
        case 'date_graded':
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
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const records: any[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',').map(v => v.trim());
    if (values.length !== headers.length) {
      errors.push(`Row ${i + 1}: Column count mismatch`);
      continue;
    }

    const record: any = {};
    headers.forEach((header, index) => {
      const value = values[index];
      
      switch (header.toLowerCase()) {
        case 'semester':
        case 'term':
          record.semester = value;
          break;
        case 'year':
          record.year = value;
          break;
        case 'coursecode':
        case 'course_code':
        case 'course':
          record.courseCode = value;
          break;
        case 'coursename':
        case 'course_name':
        case 'course_title':
          record.courseName = value;
          break;
        case 'instructor':
        case 'professor':
          record.instructor = value;
          break;
        case 'credits':
        case 'credit_hours':
          record.credits = parseFloat(value) || 0;
          break;
        case 'finalgrade':
        case 'final_grade':
        case 'letter_grade':
          record.finalGrade = value;
          break;
        case 'gpa':
        case 'grade_points':
          record.gradePoints = parseFloat(value) || 0;
          break;
        case 'percentage':
        case 'final_percentage':
          record.percentage = parseFloat(value) || 0;
          break;
        case 'assignment1':
        case 'quiz1':
        case 'midterm':
        case 'final':
          // Handle individual assignment grades
          const assignmentName = header;
          const grade = parseFloat(value) || 0;
          if (!record.assignments) record.assignments = [];
          record.assignments.push({
            name: assignmentName,
            grade: grade,
            type: getAssignmentType(assignmentName)
          });
          break;
        case 'attendance':
        case 'attendance_rate':
          record.attendanceRate = parseFloat(value) || 0;
          break;
        case 'participationgrade':
        case 'participation':
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
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const records: any[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',').map(v => v.trim());
    if (values.length !== headers.length) {
      errors.push(`Row ${i + 1}: Column count mismatch`);
      continue;
    }

    const record: any = { schedule: [] };
    headers.forEach((header, index) => {
      const value = values[index];
      
      switch (header.toLowerCase()) {
        case 'coursecode':
        case 'course_code':
          record.courseCode = value;
          break;
        case 'coursename':
        case 'course_name':
          record.courseName = value;
          break;
        case 'instructor':
          record.instructor = value;
          break;
        case 'semester':
          record.semester = value;
          break;
        case 'credits':
          record.credits = parseFloat(value) || 0;
          break;
        case 'monday':
        case 'tuesday':
        case 'wednesday':
        case 'thursday':
        case 'friday':
        case 'saturday':
        case 'sunday':
          if (value && value !== 'N/A') {
            const [startTime, endTime, location] = value.split('|').map(s => s.trim());
            record.schedule.push({
              dayOfWeek: header.toLowerCase(),
              startTime: startTime || '',
              endTime: endTime || '',
              location: location || ''
            });
          }
          break;
        case 'room':
        case 'location':
        case 'building':
          record.defaultLocation = value;
          break;
      }
    });

    if (!record.courseCode || !record.courseName) {
      errors.push(`Row ${i + 1}: Missing required fields (courseCode, courseName)`);
      continue;
    }

    records.push(record);
  }

  return { records, errors, warnings };
}

// Helper function to parse study session logs
async function parseStudySessionLogs(csvText: string) {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const records: any[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',').map(v => v.trim());
    if (values.length !== headers.length) {
      errors.push(`Row ${i + 1}: Column count mismatch`);
      continue;
    }

    const record: any = {};
    headers.forEach((header, index) => {
      const value = values[index];
      
      switch (header.toLowerCase()) {
        case 'date':
        case 'session_date':
          record.startTime = new Date(value).getTime();
          break;
        case 'coursecode':
        case 'course_code':
        case 'subject':
          record.courseCode = value;
          break;
        case 'title':
        case 'session_title':
          record.title = value;
          break;
        case 'duration':
        case 'duration_minutes':
          record.duration = parseInt(value) || 0;
          break;
        case 'sessiontype':
        case 'session_type':
        case 'type':
          record.sessionType = value || 'focused';
          break;
        case 'focus_score':
        case 'focusscore':
          record.focusScore = parseInt(value) || 0;
          break;
        case 'productivity':
        case 'productivity_rating':
          record.productivityRating = parseInt(value) || 0;
          break;
        case 'location':
          record.location = value;
          break;
        case 'notes':
        case 'session_notes':
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
      record.endTime = record.startTime + (record.duration * 60 * 1000);
    }

    records.push(record);
  }

  return { records, errors, warnings };
}

// Helper function to determine assignment type from name
function getAssignmentType(name: string): string {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('quiz')) return 'quiz';
  if (lowerName.includes('exam') || lowerName.includes('midterm') || lowerName.includes('final')) return 'exam';
  if (lowerName.includes('project')) return 'project';
  if (lowerName.includes('homework') || lowerName.includes('hw')) return 'homework';
  if (lowerName.includes('lab')) return 'lab';
  if (lowerName.includes('discussion') || lowerName.includes('participation')) return 'participation';
  return 'assignment';
}

// Enhanced CSV parsing with support for multiple data types
async function parseCSVData(csvText: string, dataType: string) {
  switch (dataType) {
    case 'courses':
      return await parseCoursesCsv(csvText);
    case 'assignments':
      return await parseAssignmentsCsv(csvText);
    case 'grades':
      return await parseGradesCsv(csvText);
    case 'detailed_grades':
    case 'transcript':
      return await parseDetailedGradeSheet(csvText);
    case 'schedule':
    case 'course_schedule':
      return await parseCourseSchedule(csvText);
    case 'study_sessions':
    case 'study_logs':
      return await parseStudySessionLogs(csvText);
    default:
      throw new Error(`Unsupported data type: ${dataType}`);
  }
}