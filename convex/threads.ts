import { subDays } from "date-fns";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getThreads = query({
  args: { pinned: v.boolean() },
  handler: async (ctx, { pinned }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const tokenIdentifier = identity.tokenIdentifier;

    const threads = ctx.db
      .query("threads")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
      .filter((q) => q.eq(q.field("pinned"), pinned))
      .collect();
    return (await threads).sort((a, b) => {
      const aLastMessage = a.lastMessage ? a.lastMessage : 0;
      const bLastMessage = b.lastMessage ? b.lastMessage : 0;

      if (aLastMessage === bLastMessage) {
        return b._creationTime - a._creationTime; // Assuming _creationTime exists
      }
      return bLastMessage - aLastMessage; // Sort by lastMessage if different
    });
  },
});

export const getRecentThreads = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const tokenIdentifier = identity.tokenIdentifier;

    return (
      await ctx.db
        .query("threads")
        .withIndex("by_last_message_and_token", (q) =>
          q
            .eq("tokenIdentifier", tokenIdentifier)
            .gte("lastMessage", subDays(new Date(), 7).getTime()),
        )
        .take(10)
    ).sort((a, b) => {
      const aTime = a.lastMessage ? a.lastMessage : 0;
      const bTime = b.lastMessage ? b.lastMessage : 0;

      return bTime - aTime;
    });
  },
});

export const searchThreads = query({
  args: { title: v.string() },
  handler: async (ctx, { title }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const tokenIdentifier = identity.tokenIdentifier;

    return await ctx.db
      .query("threads")
      .withSearchIndex("search_title", (q) =>
        q.search("title", title).eq("tokenIdentifier", tokenIdentifier),
      )
      .take(10);
  },
});

export const branchThread = mutation({
  args: { thread: v.id("threads"), message: v.id("messages") },
  handler: async (ctx, { thread, message }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const mainThread = await ctx.db.get(thread);

    if (!mainThread) {
      throw new Error("This thread not exist");
    }

    const newThread = await ctx.db.insert("threads", {
      title: mainThread.title,
      pinned: false,
      branch: mainThread._id,
      tokenIdentifier: identity.tokenIdentifier,
    });

    const historyMessages = await ctx.db
      .query("messages")
      .withIndex("by_thread", (q) => q.eq("thread", thread))
      .collect();

    for (const msg of historyMessages) {
      const breakPoint = await ctx.db
        .query("breakPoints")
        .withIndex("by_message", (q) => q.eq("message", msg._id))
        .unique();
      const newMessage = await ctx.db.insert("messages", {
        prompt: msg.prompt,
        thread: newThread,
        model: msg.model,
        responseStreamId: msg.responseStreamId,
      });

      if (breakPoint) {
        await ctx.db.insert("breakPoints", {
          thread: newThread,
          message: newMessage,
          model: breakPoint.model,
          responseStreamId: breakPoint.responseStreamId,
        });
      }

      if (msg._id === message) {
        const message = await ctx.db.get(newMessage);

        await ctx.db.patch(newThread, { lastMessage: message?._creationTime });
        break;
      }
    }
    return newThread;
  },
});

export const getThread = query({
  args: {
    threadId: v.optional(v.id("threads")),
  },
  handler: async (ctx, { threadId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    if (threadId) {
      return ctx.db.get(threadId);
    }
    return undefined;
  },
});

export const createThread = mutation({
  args: {
    title: v.string(),
    branch: v.optional(v.id("threads")),
  },
  handler: async (ctx, { title, branch }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const tokenIdentifier = identity.tokenIdentifier;

    return ctx.db.insert("threads", {
      title,
      pinned: false,
      branch,
      tokenIdentifier,
    });
  },
});

export const deleteThread = mutation({
  args: {
    threadId: v.id("threads"),
  },
  handler: async (ctx, { threadId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    await ctx.runMutation(internal.messages.deleteMessages, {
      thread: threadId,
    });

    await ctx.db.delete(threadId);
  },
});

export const pinThread = mutation({
  args: { thread: v.id("threads"), pinned: v.boolean() },
  handler: async (ctx, { thread, pinned }) => {
    ctx.db.patch(thread, { pinned });
  },
});

export const updateThread = mutation({
  args: {
    title: v.string(),
    id: v.id("threads"),
  },
  handler: async (ctx, { title, id }) => {
    await ctx.db.patch(id, { title: title });
  },
});
