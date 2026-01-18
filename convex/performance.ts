import { internalMutation, internalQuery, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const calculateStudentPerformance = internalMutation({
  args: { studentId: v.id("students") },
  handler: async (ctx, args): Promise<{ overallScore: number; riskLevel: "low" | "medium" | "high" } | undefined> => {
    const student = await ctx.db.get(args.studentId);
    if (!student) return;

    // Calculate attendance score (30% weight)
    const attendanceStats: number = await ctx.runQuery(internal.performance.getAttendanceScore, {
      studentId: args.studentId,
    });

    // Calculate quiz score (40% weight)
    const quizStats: number = await ctx.runQuery(internal.performance.getQuizScore, {
      studentId: args.studentId,
    });

    // Calculate assignment score (30% weight)
    const assignmentStats: number = await ctx.runQuery(internal.performance.getAssignmentScore, {
      studentId: args.studentId,
    });

    // Calculate weighted overall score
    const overallScore: number = 
      (attendanceStats * 0.3) + 
      (quizStats * 0.4) + 
      (assignmentStats * 0.3);

    // Determine risk level
    let riskLevel: "low" | "medium" | "high";
    if (overallScore >= 80) {
      riskLevel = "low";
    } else if (overallScore >= 50) {
      riskLevel = "medium";
    } else {
      riskLevel = "high";
    }

    // Update student record
    await ctx.db.patch(args.studentId, {
      performanceScore: overallScore,
      currentRiskLevel: riskLevel,
      lastUpdated: Date.now(),
    });

    // Save performance history
    await ctx.db.insert("performanceHistory", {
      studentId: args.studentId,
      attendanceScore: attendanceStats,
      quizScore: quizStats,
      assignmentScore: assignmentStats,
      overallScore,
      riskLevel,
      calculatedAt: Date.now(),
    });

    // Create alert if high risk
    if (riskLevel === "high" && student.currentRiskLevel !== "high") {
      await ctx.db.insert("alerts", {
        studentId: args.studentId,
        type: "high_risk",
        message: `Student ${student.name} has entered HIGH RISK status with a performance score of ${overallScore.toFixed(1)}%`,
        isRead: false,
        createdAt: Date.now(),
      });
    }

    return { overallScore, riskLevel };
  },
});

export const getAttendanceScore = internalQuery({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    
    const attendance = await ctx.db
      .query("attendance")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .filter((q) => q.gte(q.field("timestamp"), last30Days.getTime()))
      .collect();

    if (attendance.length === 0) return 100; // No data = perfect score

    const present = attendance.filter(a => a.status === "present").length;
    const late = attendance.filter(a => a.status === "late").length;
    
    // Present = 100%, Late = 50%, Absent = 0%
    const score = ((present * 100) + (late * 50)) / (attendance.length * 100) * 100;
    return Math.max(0, Math.min(100, score));
  },
});

export const getQuizScore = internalQuery({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const submissions = await ctx.db
      .query("quizSubmissions")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();

    if (submissions.length === 0) return 0; // No quizzes taken

    const totalAccuracy = submissions.reduce((sum, sub) => sum + sub.accuracy, 0);
    return totalAccuracy / submissions.length;
  },
});

export const getAssignmentScore = internalQuery({
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

    if (totalAssignments.length === 0) return 100; // No assignments = perfect score
    if (submissions.length === 0) return 0; // No submissions

    // Calculate completion rate and average score
    const completionRate = (submissions.length / totalAssignments.length) * 100;
    const totalScore = submissions.reduce((sum, sub) => sum + (sub.score / sub.totalPoints) * 100, 0);
    const averageScore = submissions.length > 0 ? totalScore / submissions.length : 0;

    // Weight completion (60%) and quality (40%)
    return (completionRate * 0.6) + (averageScore * 0.4);
  },
});

export const getPerformanceHistory = query({
  args: { 
    studentId: v.id("students"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return await ctx.db
      .query("performanceHistory")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .filter((q) => q.gte(q.field("calculatedAt"), startDate.getTime()))
      .order("desc")
      .collect();
  },
});

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const students = await ctx.db.query("students").collect();
    
    const riskCounts = {
      low: students.filter(s => s.currentRiskLevel === "low").length,
      medium: students.filter(s => s.currentRiskLevel === "medium").length,
      high: students.filter(s => s.currentRiskLevel === "high").length,
    };

    const averageScore = students.length > 0 
      ? students.reduce((sum, s) => sum + s.performanceScore, 0) / students.length 
      : 0;

    const unreadAlerts = await ctx.db
      .query("alerts")
      .withIndex("by_unread", (q) => q.eq("isRead", false))
      .collect();

    return {
      totalStudents: students.length,
      riskCounts,
      averageScore,
      unreadAlertsCount: unreadAlerts.length,
    };
  },
});
