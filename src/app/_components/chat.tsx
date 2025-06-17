"use client";
import React, { useState } from "react";
import { type Id } from "../../../convex/_generated/dataModel";
import { ChatInput } from "./chatInput";
import { Messages } from "./messages";
import type { StickToBottomInstance } from "use-stick-to-bottom";
import { useUser } from "@clerk/nextjs";

export function ChatWindow({
  thread,
  registerRef,
  stickToBottomInstance,
}: {
  thread: Id<"threads"> | null | undefined;
  registerRef: (id: string, ref: HTMLDivElement | null) => void;
  stickToBottomInstance: StickToBottomInstance;
}) {
  const [isStreaming, setIsStreaming] = useState(false);
  const { user } = useUser();

  return (
    <div className="absolute top-0 bottom-0 w-full">
      {thread === null ? (
        <div
          className="absolute inset-0 mt-16 overflow-y-scroll pt-2 pb-52"
          style={{
            scrollbarGutter: "stable both-edges",
          }}
        >
          <div className="mx-auto flex w-full max-w-3xl flex-col-reverse space-y-12">
            <div className="prose prose-neutral dark:prose-invert prose-pre:m-0 prose-pre:bg-transparent prose-pre:p-0 w-full max-w-full">
              <div className="mx-8 mt-46 h-auto w-full">
                <h2>How can I help you, {user?.firstName?.split(" ")[0]}?</h2>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <Messages
          thread={thread}
          registerRef={registerRef}
          stickToBottomInstance={stickToBottomInstance}
          setIsStreaming={setIsStreaming}
        />
      )}

      <ChatInput
        stickToBottomInstance={stickToBottomInstance}
        setIsStreaming={setIsStreaming}
        isStreaming={isStreaming}
        thread={thread}
      />
    </div>
  );
}
