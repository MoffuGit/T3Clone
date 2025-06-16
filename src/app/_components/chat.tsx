"use client";
import React, { useState, type RefObject } from "react";
import { type Id } from "../../../convex/_generated/dataModel";
import { ChatInput } from "./chatInput";
import { Messages } from "./messages";

export function ChatWindow({
  thread,
  registerRef,
  scrollRef,
}: {
  thread: Id<"threads"> | null | undefined;
  registerRef: (id: string, ref: HTMLDivElement | null) => void;
  scrollRef: RefObject<HTMLDivElement | null>;
}) {
  if (thread === null) {
    return;
  }
  const [isStreaming, setIsStreaming] = useState(false);

  return (
    <div className="absolute top-0 bottom-0 w-full">
      <Messages
        thread={thread}
        registerRef={registerRef}
        scrollRef={scrollRef}
        setIsStreaming={setIsStreaming}
      />

      <ChatInput
        scrollRef={scrollRef}
        setIsStreaming={setIsStreaming}
        isStreaming={isStreaming}
        thread={thread}
      />
    </div>
  );
}
