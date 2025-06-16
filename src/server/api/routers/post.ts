import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",

  apiKey:
    "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",
});

interface Message {
  content: string;
}

export const postRouter = createTRPCRouter({
  create: publicProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async (opts) => {
      try {
        const response = await openai.chat.completions.create({
          model: "deepseek/deepseek-chat-v3-0324:free",
          messages: [{ role: "user", content: opts.input.name }],
        });

        return {
          text: response.choices[0]?.message?.content || "No text generated.",
        };
      } catch (error) {
        console.error("Error generating text with OpenRouter:", error);
        throw new Error("Failed to generate text with OpenRouter.");
      }
    }),
});
