import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const createQuiz = mutation({
  args: {
    title: v.string(),
    totalQuestions: v.number(),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    return await ctx.db.insert("quizzes", {
      title: args.title,
      totalQuestions: args.totalQuestions,
      createdAt: Date.now(),
      isActive: true,
    });
  },
});

export const submitQuiz = mutation({
  args: {
    studentId: v.string(),
    quizId: v.id("quizzes"),
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

    const quiz = await ctx.db.get(args.quizId);
    if (!quiz) {
      throw new Error("Quiz not found");
    }

    const accuracy = (args.score / quiz.totalQuestions) * 100;

    // Check if student already submitted this quiz
    const existingSubmission = await ctx.db
      .query("quizSubmissions")
      .withIndex("by_student_and_quiz", (q) => 
        q.eq("studentId", student._id).eq("quizId", args.quizId)
      )
      .unique();

    if (existingSubmission) {
      // Update existing submission with better score
      if (args.score > existingSubmission.score) {
        await ctx.db.patch(existingSubmission._id, {
          score: args.score,
          accuracy,
          submittedAt: Date.now(),
        });
      }
    } else {
      // Create new submission
      await ctx.db.insert("quizSubmissions", {
        studentId: student._id,
        quizId: args.quizId,
        score: args.score,
        totalQuestions: quiz.totalQuestions,
        accuracy,
        submittedAt: Date.now(),
      });
    }

    // Trigger performance recalculation
    await ctx.scheduler.runAfter(0, internal.performance.calculateStudentPerformance, {
      studentId: student._id,
    });

    return { success: true, accuracy };
  },
});

export const getActiveQuizzes = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("quizzes")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const getStudentQuizzes = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("quizSubmissions")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();
  },
});

export const getQuizStats = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const submissions = await ctx.db
      .query("quizSubmissions")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();

    if (submissions.length === 0) {
      return { averageAccuracy: 0, totalQuizzes: 0, bestScore: 0 };
    }

    const totalAccuracy = submissions.reduce((sum, sub) => sum + sub.accuracy, 0);
    const averageAccuracy = totalAccuracy / submissions.length;
    const bestScore = Math.max(...submissions.map(sub => sub.accuracy));

    return {
      averageAccuracy,
      totalQuizzes: submissions.length,
      bestScore,
    };
  },
});
