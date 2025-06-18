import { type Id } from "../../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import MessageItem from "./message";
import { api } from "../../../convex/_generated/api";
import type { Dispatch } from "react";
import { useCallback } from "react";
import type { StickToBottomInstance } from "use-stick-to-bottom";

interface MessagesProps {
  thread: Id<"threads"> | undefined;
  registerRef: (id: string, ref: HTMLDivElement | null) => void;
  stickToBottomInstance: StickToBottomInstance;
  setIsStreaming: Dispatch<React.SetStateAction<boolean>>;
}

export function Messages({
  thread,
  registerRef,
  stickToBottomInstance,
  setIsStreaming,
}: MessagesProps) {
  const messages = useQuery(api.messages.listMessages, { thread });

  const { scrollRef, contentRef } = stickToBottomInstance;
  const renderMessages = useCallback(() => {
    if (!messages) {
      return null;
    }
    return (
      <div
        ref={contentRef}
        className="mx-auto flex w-full max-w-3xl flex-col space-y-12 opacity-100 transition-opacity starting:opacity-0"
      >
        {messages.map((message) => (
          <MessageItem
            stopStreaming={() => {
              setIsStreaming(false);
            }}
            registerRef={registerRef}
            key={message._id}
            message={message}
          />
        ))}
      </div>
    );
  }, [contentRef, messages, registerRef, setIsStreaming]);

  return (
    <div
      className="absolute inset-0 mt-16 overflow-y-scroll pt-2 pb-52"
      ref={scrollRef}
      style={{
        scrollbarGutter: "stable both-edges",
      }}
    >
      {renderMessages()}
    </div>
  );
}
