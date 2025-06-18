"use client";
import { type Doc } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { useStream } from "@convex-dev/persistent-text-streaming/react";
import { type StreamId } from "@convex-dev/persistent-text-streaming";
import { useMemo, useEffect } from "react";
import { useAPIKeyStore } from "~/stores/userKeys";
import { MODEL_CONFIGS, type AIModel } from "~/lib/llmProviders";
import { useStreamingStore } from "~/stores/stream";
import { UserMessage } from "./userMessage";
import { ModelMessage } from "./modelMessage";

type Props = {
  message: Doc<"messages">;
  registerRef: (id: string, ref: HTMLDivElement | null) => void;
  stopStreaming: () => void;
};

export default function MessageItem({
  message,
  registerRef,
  stopStreaming,
}: Props) {
  const { keys } = useAPIKeyStore();
  const config = MODEL_CONFIGS[message.model as AIModel];
  const apiKey = keys[config.provider] ?? "";
  const headers = useMemo(
    () => ({
      "X-SearchGrounding": message.searchGrounding.toString(),
      "X-ImageGeneration": message.imageGeneration.toString(),
      "X-Model": message.model,
      "X-Thread-Id": message.thread,
      [config.headerKey]: apiKey,
    }),
    [
      message.searchGrounding,
      message.imageGeneration,
      message.model,
      message.thread,
      config.headerKey,
      apiKey,
    ],
  );

  const { removeDrivenId, drivenIds } = useStreamingStore();
  const isDriven = drivenIds.has(message._id);

  const { text, status } = useStream(
    api.streaming.getStreamBody,
    new URL(`${process.env.NEXT_PUBLIC_CONVEX_SITE_URL}/chat-stream`),
    isDriven,
    message.responseStreamId as StreamId,
    {
      headers: headers,
    },
  );

  const isCurrentlyStreaming = useMemo(
    () => isDriven && (status === "pending" || status === "streaming"),
    [isDriven, status],
  );

  const isDone = useMemo(() => status === "done", [status]);

  useEffect(() => {
    if (isDriven || isDone) {
      removeDrivenId(message._id);
      stopStreaming();
    }
  }, [isDriven, isDone, removeDrivenId, stopStreaming, message._id]);

  useEffect(() => {
    if (isDriven && !isCurrentlyStreaming) {
      stopStreaming();
    }
  }, [isDriven, isCurrentlyStreaming, stopStreaming]);

  return (
    <>
      <UserMessage message={message} />
      <ModelMessage
        text={text}
        status={status}
        registerRef={registerRef}
        message={message}
      />
    </>
  );
}
