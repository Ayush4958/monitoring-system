import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createStudent = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    studentId: v.string(),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    const existingStudent = await ctx.db
      .query("students")
      .withIndex("by_student_id", (q) => q.eq("studentId", args.studentId))
      .unique();
    
    if (existingStudent) {
      throw new Error("Student ID already exists");
    }

    return await ctx.db.insert("students", {
      name: args.name,
      email: args.email,
      studentId: args.studentId,
      enrollmentDate: Date.now(),
      currentRiskLevel: "low",
      performanceScore: 100,
      lastUpdated: Date.now(),
    });
  },
});

export const getAllStudents = query({
  args: {},
  handler: async (ctx) => {
    await getAuthUserId(ctx);
    return await ctx.db.query("students").collect();
  },
});

export const getStudentsByRiskLevel = query({
  args: {
    riskLevel: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    return await ctx.db
      .query("students")
      .withIndex("by_risk_level", (q) => q.eq("currentRiskLevel", args.riskLevel))
      .collect();
  },
});

export const getStudentById = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    return await ctx.db.get(args.studentId);
  },
});

export const getStudentByStudentId = query({
  args: { studentId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("students")
      .withIndex("by_student_id", (q) => q.eq("studentId", args.studentId))
      .unique();
  },
});
