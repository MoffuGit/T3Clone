import {
  query,
  mutation,
  internalQuery,
  internalMutation,
} from "./_generated/server";
import { type StreamId } from "@convex-dev/persistent-text-streaming";
import { v } from "convex/values";
import { streamingComponent } from "./streaming";

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const listMessages = query({
  args: { thread: v.optional(v.id("threads")) },
  handler: async (ctx, { thread }) => {
    if (thread) {
      return await ctx.db
        .query("messages")
        .withIndex("by_thread", (q) => q.eq("thread", thread))
        .collect();
    }
    return [];
  },
});

export const getMessage = query({
  args: { message: v.id("messages") },
  handler: async (ctx, { message }) => {
    return await ctx.db.get(message);
  },
});

export const getMessageAttachments = query({
  args: { attachments: v.array(v.id("_storage")) },
  handler: async (ctx, { attachments }) => {
    const joinedResponses = Promise.all(
      attachments.map(async (attachment) => {
        const metadata = await ctx.db.system.get(attachment);
        const url = await ctx.storage.getUrl(attachment);
        return {
          metadata,
          url,
        };
      }),
    );
    return await joinedResponses;
  },
});

export const createMessage = mutation({
  args: {
    prompt: v.string(),
    thread: v.id("threads"),
    model: v.string(),
    search: v.boolean(),
    image: v.boolean(),
  },
  handler: async (ctx, args) => {
    const responseStreamId = await streamingComponent.createStream(ctx);
    const chatId = await ctx.db.insert("messages", {
      prompt: args.prompt,
      thread: args.thread,
      model: args.model,
      responseStreamId,
      searchGrounding: args.search,
      imageGeneration: args.image,
    });
    const message = await ctx.db.get(chatId);

    await ctx.db.patch(args.thread, { lastMessage: message?._creationTime });
    return chatId;
  },
});

export const addAttachments = mutation({
  args: {
    message: v.id("messages"),
    files: v.array(v.id("_storage")),
  },
  handler: async (ctx, { message, files }) => {
    const currentMessage = await ctx.db.get(message);
    if (currentMessage) {
      const attachments = currentMessage.attachments || [];
      const updatedAttachments = [...attachments, ...files]; // Use spread operator to create a new array
      await ctx.db.patch(message, { attachments: updatedAttachments }); // Patch with the new array
    }
  },
});
export const getHistory = internalQuery({
  args: { thread: v.id("threads") },
  handler: async (ctx, args) => {
    // Grab all the user messages
    const allMessages = await ctx.db
      .query("messages")
      .withIndex("by_thread", (q) => q.eq("thread", args.thread))
      .collect();

    const joinedResponses = await Promise.all(
      allMessages.map(async (userMessage) => {
        return {
          userMessage,
          attachments: await Promise.all(
            // Use Promise.all here to await all attachment processing
            (userMessage.attachments || []).map(async (attachment) => {
              const metadata = await ctx.db.system.get(attachment);
              const url = await ctx.storage.getUrl(attachment);

              if (metadata && url) {
                // Determine attachment type based on metadata or other criteria
                // This is an example, you might have a 'type' field in your metadata
                if (metadata.contentType?.startsWith("image/")) {
                  return {
                    type: "image",
                    image: url,
                  };
                } else if (metadata.contentType?.startsWith("application/")) {
                  return {
                    type: "file",
                    mimeType: metadata.contentType, // Or metadata.mimeType if more general
                    data: url,
                  };
                }
              }
              return null;
            }),
          ),
          responseMessage: await streamingComponent.getStreamBody(
            ctx,
            userMessage.responseStreamId as StreamId,
          ),
        };
      }),
    );

    return joinedResponses.flatMap((joined) => {
      let userMessageContent = joined.userMessage.prompt; // Start with the main prompt

      // Filter out any null attachments
      const validAttachments = joined.attachments.filter(
        (attachment) => attachment !== null,
      );

      // If there are attachments, append their information to the string
      if (validAttachments.length > 0) {
        const attachmentStrings = validAttachments.map((attachment) => {
          if (attachment.type === "image" && attachment.image) {
            return `[Image: ${attachment.image}]`; // Or just ${attachment.image} if the URL is enough
          } else if (attachment.type === "file" && attachment.data) {
            // You might want to include mimeType or name if available in the metadata
            const fileName = (attachment as any).name || "file"; // Assuming 'name' might exist on file attachments
            return `[File: ${fileName} (${attachment.mimeType}): ${attachment.data}]`;
          }
          return "[Unknown Attachment]";
        });
        userMessageContent += "\n\n" + attachmentStrings.join("\n"); // Append as new lines
      }

      const user = {
        role: "user" as const,
        content: userMessageContent, // Now this is a single string
      };

      const assistant = {
        role: "assistant" as const,
        content: joined.responseMessage.text,
      };

      // If the assistant message is empty, its probably because we have not
      // started streaming yet so lets not include it in the history
      if (!assistant.content) return [user];

      return [user, assistant];
    });
  },
});

export const deleteMessages = internalMutation({
  args: { thread: v.id("threads") },
  handler: async (ctx, args) => {
    // Grab all the user messages
    const allMessages = await ctx.db
      .query("messages")
      .withIndex("by_thread", (q) => q.eq("thread", args.thread))
      .collect();

    allMessages.map((message) => {
      ctx.db.delete(message._id);
    });
  },
});
