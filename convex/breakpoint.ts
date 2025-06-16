import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { streamingComponent } from "./streaming";

export const listBreakPoints = query({
  args: { thread: v.id("threads") },
  handler: async (ctx, { thread }) => {
    return await ctx.db
      .query("breakPoints")
      .withIndex("by_thread", (q) => q.eq("thread", thread))
      .collect();
  },
});

export const createBreakPoint = mutation({
  args: {
    thread: v.id("threads"),
    message: v.id("messages"),
    model: v.string(),
  },
  handler: async (ctx, { thread, message, model }) => {
    const responseStreamId = await streamingComponent.createStream(ctx);
    const breakPointId = await ctx.db.insert("breakPoints", {
      thread,
      message,
      responseStreamId,
      model,
    });
    return breakPointId;
  },
});
