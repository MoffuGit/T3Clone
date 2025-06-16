import React, { type RefObject, type Dispatch } from "react";

interface ChatTextareaProps {
  input: string;
  setInput: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  isStreaming: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  adjustHeight: (reset?: boolean) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; // Added onChange prop
}

export function ChatTextarea({
  input,
  isStreaming,
  textareaRef,
  onKeyDown,
  onChange, // Use the passed onChange
}: ChatTextareaProps) {
  return (
    <div className="flex grow flex-col overflow-y-auto p-2">
      <textarea
        ref={textareaRef}
        value={input}
        placeholder={
          isStreaming ? "Generating response..." : "Type your message..."
        }
        onKeyDown={onKeyDown}
        disabled={isStreaming}
        onChange={onChange} // Use the passed onChange handler
        aria-label="Message input"
        className="min-h-[72px] w-full resize-none overflow-y-auto outline-0"
      />
    </div>
  );
}
