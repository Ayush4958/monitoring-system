import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const markAttendance = mutation({
  args: {
    studentId: v.string(),
    status: v.union(v.literal("present"), v.literal("absent"), v.literal("late")),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db
      .query("students")
      .withIndex("by_student_id", (q) => q.eq("studentId", args.studentId))
      .unique();
    
    if (!student) {
      throw new Error("Student not found");
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Check if attendance already marked for today
    const existingAttendance = await ctx.db
      .query("attendance")
      .withIndex("by_student_and_date", (q) => 
        q.eq("studentId", student._id).eq("date", today)
      )
      .unique();

    if (existingAttendance) {
      // Update existing attendance
      await ctx.db.patch(existingAttendance._id, {
        status: args.status,
        timestamp: Date.now(),
      });
    } else {
      // Create new attendance record
      await ctx.db.insert("attendance", {
        studentId: student._id,
        date: today,
        status: args.status,
        timestamp: Date.now(),
      });
    }

    // Trigger performance recalculation
    await ctx.scheduler.runAfter(0, internal.performance.calculateStudentPerformance, {
      studentId: student._id,
    });

    return { success: true };
  },
});

export const getStudentAttendance = query({
  args: { 
    studentId: v.id("students"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return await ctx.db
      .query("attendance")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .filter((q) => q.gte(q.field("timestamp"), startDate.getTime()))
      .collect();
  },
});

export const getAttendanceStats = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    
    const attendance = await ctx.db
      .query("attendance")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .filter((q) => q.gte(q.field("timestamp"), last30Days.getTime()))
      .collect();

    const total = attendance.length;
    const present = attendance.filter(a => a.status === "present").length;
    const late = attendance.filter(a => a.status === "late").length;
    const absent = attendance.filter(a => a.status === "absent").length;

    return {
      total,
      present,
      late,
      absent,
      attendanceRate: total > 0 ? ((present + late) / total) * 100 : 0,
    };
  },
});
