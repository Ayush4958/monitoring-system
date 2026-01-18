import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  students: defineTable({
    name: v.string(),
    email: v.string(),
    studentId: v.string(),
    enrollmentDate: v.number(),
    currentRiskLevel: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    performanceScore: v.number(),
    lastUpdated: v.number(),
  })
    .index("by_student_id", ["studentId"])
    .index("by_email", ["email"])
    .index("by_risk_level", ["currentRiskLevel"]),

  attendance: defineTable({
    studentId: v.id("students"),
    date: v.string(), // YYYY-MM-DD format
    status: v.union(v.literal("present"), v.literal("absent"), v.literal("late")),
    timestamp: v.number(),
  })
    .index("by_student", ["studentId"])
    .index("by_date", ["date"])
    .index("by_student_and_date", ["studentId", "date"]),

  quizzes: defineTable({
    title: v.string(),
    totalQuestions: v.number(),
    createdAt: v.number(),
    isActive: v.boolean(),
  }),

  quizSubmissions: defineTable({
    studentId: v.id("students"),
    quizId: v.id("quizzes"),
    score: v.number(),
    totalQuestions: v.number(),
    accuracy: v.number(), // percentage
    submittedAt: v.number(),
  })
    .index("by_student", ["studentId"])
    .index("by_quiz", ["quizId"])
    .index("by_student_and_quiz", ["studentId", "quizId"]),

  assignments: defineTable({
    title: v.string(),
    dueDate: v.number(),
    totalPoints: v.number(),
    createdAt: v.number(),
    isActive: v.boolean(),
  }),

  assignmentSubmissions: defineTable({
    studentId: v.id("students"),
    assignmentId: v.id("assignments"),
    score: v.number(),
    totalPoints: v.number(),
    submittedAt: v.number(),
    isLate: v.boolean(),
  })
    .index("by_student", ["studentId"])
    .index("by_assignment", ["assignmentId"])
    .index("by_student_and_assignment", ["studentId", "assignmentId"]),

  performanceHistory: defineTable({
    studentId: v.id("students"),
    attendanceScore: v.number(),
    quizScore: v.number(),
    assignmentScore: v.number(),
    overallScore: v.number(),
    riskLevel: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    calculatedAt: v.number(),
  })
    .index("by_student", ["studentId"])
    .index("by_date", ["calculatedAt"]),

  alerts: defineTable({
    studentId: v.id("students"),
    type: v.union(v.literal("high_risk"), v.literal("performance_drop"), v.literal("attendance_low")),
    message: v.string(),
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_student", ["studentId"])
    .index("by_unread", ["isRead"])
    .index("by_date", ["createdAt"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
