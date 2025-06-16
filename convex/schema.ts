import { defineSchema, defineTable } from "convex/server";
import { StreamIdValidator } from "@convex-dev/persistent-text-streaming";
import { v } from "convex/values";

export default defineSchema({
  threads: defineTable({
    title: v.string(),
    pinned: v.boolean(),
    tokenIdentifier: v.string(),
    branch: v.optional(v.id("threads")),
    lastMessage: v.optional(v.number()),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_last_message", ["lastMessage"])
    .index("by_last_message_and_token", ["tokenIdentifier", "lastMessage"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["tokenIdentifier"],
    }),
  messages: defineTable({
    prompt: v.string(),
    thread: v.id("threads"),
    model: v.string(),
    attachments: v.optional(v.array(v.id("_storage"))),
    searchGrounding: v.boolean(),
    imageGeneration: v.boolean(),
    responseStreamId: StreamIdValidator,
  })
    .index("by_stream", ["responseStreamId"])
    .index("by_thread", ["thread"])
    .index("by_stream_and_thread", ["responseStreamId", "thread"]),
  breakPoints: defineTable({
    message: v.id("messages"),
    thread: v.id("threads"),
    model: v.string(),
    responseStreamId: StreamIdValidator,
  })
    .index("by_stream", ["responseStreamId"])
    .index("by_thread", ["thread"])
    .index("by_stream_and_thread", ["responseStreamId", "thread"])
    .index("by_message", ["message"]),
});
