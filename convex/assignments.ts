import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const createAssignment = mutation({
  args: {
    title: v.string(),
    dueDate: v.number(),
    totalPoints: v.number(),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    return await ctx.db.insert("assignments", {
      title: args.title,
      dueDate: args.dueDate,
      totalPoints: args.totalPoints,
      createdAt: Date.now(),
      isActive: true,
    });
  },
});

export const submitAssignment = mutation({
  args: {
    studentId: v.string(),
    assignmentId: v.id("assignments"),
    score: v.number(),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db
      .query("students")
      .withIndex("by_student_id", (q) => q.eq("studentId", args.studentId))
      .unique();
    
    if (!student) {
      throw new Error("Student not found");
    }

    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) {
      throw new Error("Assignment not found");
    }

    const submittedAt = Date.now();
    const isLate = submittedAt > assignment.dueDate;

    // Check if student already submitted this assignment
    const existingSubmission = await ctx.db
      .query("assignmentSubmissions")
      .withIndex("by_student_and_assignment", (q) => 
        q.eq("studentId", student._id).eq("assignmentId", args.assignmentId)
      )
      .unique();

    if (existingSubmission) {
      throw new Error("Assignment already submitted");
    }

    // Create new submission
    await ctx.db.insert("assignmentSubmissions", {
      studentId: student._id,
      assignmentId: args.assignmentId,
      score: args.score,
      totalPoints: assignment.totalPoints,
      submittedAt,
      isLate,
    });

    // Trigger performance recalculation
    await ctx.scheduler.runAfter(0, internal.performance.calculateStudentPerformance, {
      studentId: student._id,
    });

    return { success: true, isLate };
  },
});

export const getActiveAssignments = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("assignments")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const getStudentAssignments = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assignmentSubmissions")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();
  },
});

export const getAssignmentStats = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const submissions = await ctx.db
      .query("assignmentSubmissions")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();

    const totalAssignments = await ctx.db
      .query("assignments")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    if (submissions.length === 0) {
      return { 
        completionRate: 0, 
        averageScore: 0, 
        onTimeSubmissions: 0,
        totalSubmissions: 0,
        totalAssignments: totalAssignments.length,
      };
    }

    const totalScore = submissions.reduce((sum, sub) => sum + (sub.score / sub.totalPoints) * 100, 0);
    const averageScore = totalScore / submissions.length;
    const onTimeSubmissions = submissions.filter(sub => !sub.isLate).length;
    const completionRate = (submissions.length / totalAssignments.length) * 100;

    return {
      completionRate,
      averageScore,
      onTimeSubmissions,
      totalSubmissions: submissions.length,
      totalAssignments: totalAssignments.length,
    };
  },
});
