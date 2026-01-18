import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getUnreadAlerts = query({
  args: {},
  handler: async (ctx) => {
    await getAuthUserId(ctx);
    
    return await ctx.db
      .query("alerts")
      .withIndex("by_unread", (q) => q.eq("isRead", false))
      .order("desc")
      .take(50);
  },
});

export const getAllAlerts = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    const limit = args.limit || 100;
    return await ctx.db
      .query("alerts")
      .order("desc")
      .take(limit);
  },
});

export const markAlertAsRead = mutation({
  args: { alertId: v.id("alerts") },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    await ctx.db.patch(args.alertId, {
      isRead: true,
    });
  },
});

export const markAllAlertsAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    await getAuthUserId(ctx);
    
    const unreadAlerts = await ctx.db
      .query("alerts")
      .withIndex("by_unread", (q) => q.eq("isRead", false))
      .collect();

    for (const alert of unreadAlerts) {
      await ctx.db.patch(alert._id, { isRead: true });
    }
  },
});
