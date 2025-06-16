import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { type StreamId } from "@convex-dev/persistent-text-streaming";
import { streamText, generateText } from "ai";
import { streamingComponent } from "./streaming";
import type { Id } from "./_generated/dataModel";
import { MODEL_CONFIGS, type AIModel } from "~/lib/llmProviders";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { api } from "./_generated/api";

export const streamChat = httpAction(async (ctx, request) => {
  const threadIdHeader = request.headers.get("X-Thread-Id");
  const modelHeader = request.headers.get("X-Model");
  if (!threadIdHeader || !modelHeader) {
    return new Response("Missing header", { status: 400 });
  }
  const modelConfig = MODEL_CONFIGS[modelHeader as AIModel];
  let key = request.headers.get(modelConfig.headerKey);
  if (!key) {
    return new Response("Missing key", { status: 400 });
  }
  const searchHeader = request.headers.get("X-SearchGrounding");
  const search = searchHeader === "true" && modelConfig.searchGrounding;
  const imageGenerationHeader = request.headers.get("X-ImageGeneration");
  const imageGeneration =
    imageGenerationHeader === "true" && modelConfig.imageGeneration;
  if (search && imageGeneration) {
    return new Response(
      "You should not search and generate image at the same time",
      {
        status: 400,
      },
    );
  }
  let model;
  switch (modelConfig.provider) {
    case "openrouter":
      const openRouter = createOpenRouter({ apiKey: key });
      model = openRouter(modelConfig.modelId);
      break;
    case "google":
      const google = createGoogleGenerativeAI({ apiKey: key });
      model = google(
        modelConfig.modelId,
        search ? { useSearchGrounding: true } : {},
      );
      break;
    default:
      return new Response("Unsupported provider", { status: 400 });
  }

  const threadId = threadIdHeader as Id<"threads">;
  const body = (await request.json()) as {
    streamId: string;
  };

  let fullResponseContent = "";

  const history = await ctx.runQuery(internal.messages.getHistory, {
    thread: threadId as Id<"threads">,
  });

  if (history.length === 1) {
    void (async () => {
      try {
        const titleResult = await generateText({
          model,
          system: `
               generate a short title based on the first message a user send
               ensure the title it is no more than 7 words long
               the title should be a summary of the user message
               you should Not answer the user message, only generate the title
               do not use quotes or colons
          `,
          messages: history,
        });
        ctx.runMutation(api.threads.updateThread, {
          title: titleResult.text.trim(),
          id: threadId,
        });
      } catch (error) {
        console.error("Error generating or updating thread title:", error);
      }
    })();
  }

  const response = await streamingComponent.stream(
    ctx,
    request,
    body.streamId as StreamId,
    async (ctx, _request, _streamId, append) => {
      const appendAndAccumulate = async (text: string) => {
        await append(text);
        fullResponseContent = fullResponseContent.concat(text);
      };
      if (imageGeneration) {
        const result = await generateText({
          model: model,
          providerOptions: {
            google: { responseModalities: ["TEXT", "IMAGE"] },
          },
          messages: history,
        });

        await appendAndAccumulate(result.text);

        for (const file of result.files) {
          if (file.mimeType.startsWith("image/")) {
            try {
              const postUrl = await ctx.storage.generateUploadUrl();
              const uploadResult = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.mimeType },
                body: file.uint8Array,
              });

              if (!uploadResult.ok) {
                console.error(
                  "File upload failed:",
                  uploadResult.status,
                  uploadResult.statusText,
                );
                await appendAndAccumulate(
                  `\nError uploading image: ${uploadResult.statusText}`,
                );
                continue;
              }
              const data = await uploadResult.json();
              const storageId = data.storageId;

              if (!storageId) {
                console.error(
                  "storageId is missing in the upload response:",
                  data,
                );
                await appendAndAccumulate(
                  `\nError: Could not get storage ID for image.`,
                );
                continue;
              }

              const url = await ctx.storage.getUrl(storageId as Id<"_storage">);
              if (url) {
                await appendAndAccumulate("\n");
                await appendAndAccumulate(`![](${url})`);
                console.log(`Appended image URL: ${url}`);
              } else {
                console.error("Could not get URL for storageId:", storageId);
                await appendAndAccumulate(
                  `\nError: Could not get URL for image.`,
                );
              }
            } catch (error) {
              console.error("Error processing image file:", error);
              await appendAndAccumulate(
                `\nAn error occurred while processing an image.`,
              );
            }
          }
        }
      } else {
        const result = streamText({
          model,
          system: `
              You are an ai assistant that can answer questions and help with tasks.
              Be as helpful as you can and provide really relevant information.
              You are continuing a conversation. The conversation history is JSON-formatted.
              Provide your response in markdown format.
              When generating images, just mention that you are generating them.
          `,
          messages: history,
        });

        // 1. Stream the text content first
        for await (const textPart of result.textStream) {
          await appendAndAccumulate(textPart);
        }

        // 2. After text streaming is complete, handle search sources if applicable
        if (search) {
          // Wait for sources if search is enabled.
          const sources = await result.sources;
          if (sources && sources.length > 0) {
            await appendAndAccumulate("\n");
            await appendAndAccumulate("**Sources**");
            for (const source of sources) {
              await appendAndAccumulate(`\n- [${source.title}](${source.url})`); // Unordered list item with a link
            }
          }
        }
      }

      console.log("Streaming complete.");

      await ctx.runMutation(api.messages.setResponse, {
        streamId: body.streamId as StreamId,
        response: fullResponseContent,
      });
    },
  );

  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Vary", "Origin");

  return response;
});

export const streamBreakpoint = httpAction(async (ctx, request) => {
  const messageHeader = request.headers.get("X-Message-Id");
  const modelHeader = request.headers.get("X-Model");
  if (!messageHeader || !modelHeader) {
    return new Response("Missing header", { status: 400 });
  }
  const modelConfig = MODEL_CONFIGS[modelHeader as AIModel];
  let key = request.headers.get(modelConfig.headerKey);
  if (!key) {
    return new Response("Missing key", { status: 400 });
  }
  const messageId = messageHeader as Id<"messages">;
  let model;
  switch (modelConfig.provider) {
    case "openrouter":
      const openRouter = createOpenRouter({ apiKey: key });
      model = openRouter(modelConfig.modelId);
      break;
    case "google":
      const google = createGoogleGenerativeAI({ apiKey: key });
      model = google(modelConfig.modelId);
      break;
    default:
      return new Response("Unsupported provider", { status: 400 });
  }
  const body = (await request.json()) as {
    streamId: string;
  };

  const response = await streamingComponent.stream(
    ctx,
    request,
    body.streamId as StreamId,
    async (ctx, _request, _streamId, append) => {
      const message = await ctx.runQuery(api.messages.getMessage, {
        message: messageId,
      });
      if (message) {
        const result = streamText({
          model,
          system: `
                   generate a short title based on the provided user message
                   ensure the title it is no more than 10 words long
                   the title should be a summary of the user message
                   you should Not answer the user message, only generate the title
                   do not use quotes or colons
            `,
          prompt: message.prompt,
        });
        for await (const textPart of result.textStream) {
          await append(textPart);
        }
      }
    },
  );

  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Vary", "Origin");

  return response;
});
