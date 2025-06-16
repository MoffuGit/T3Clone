import type { Doc } from "convex/_generated/dataModel";
import { MemoizedMarkdown } from "./markdown/markdown";
import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GitBranch, Check, Copy } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";

export function ModelMessage({
  text,
  status,
  registerRef,
  message,
}: {
  text: string;
  status: "pending" | "streaming" | "done" | "error" | "timeout";
  registerRef: (id: string, ref: HTMLDivElement | null) => void;
  message: Doc<"messages">;
}) {
  const [copied, setCopied] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);
  const branchThread = useMutation(api.threads.branchThread);
  const router = useRouter();
  const copyToClipboard = async () => {
    try {
      if (messageRef !== null) {
        const innerText = messageRef.current?.innerText;
        await navigator.clipboard.writeText(innerText ? innerText : "");
        setCopied(true);
        toast.success("Copied to clipboard");
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      }
    } catch (error) {
      console.error("Failed to copy code to clipboard:", error);
    }
  };
  const onClick = async () => {
    try {
      const newBranch = await branchThread({
        thread: message.thread,
        message: message._id,
      });
      router.push(`/${newBranch}`);
    } catch (error) {
      console.error("Failed to branch:", error);
    }
  };
  return (
    <div className="flex w-full">
      <div
        className="group flex w-full flex-col px-4 py-4"
        ref={(el) => registerRef(message._id, el)}
      >
        <div
          ref={messageRef}
          className="flex max-w-full min-w-0 flex-col items-start"
        >
          <MemoizedMarkdown content={text} id={message._id} />
          {status === "pending" && (
            <div className="mt-2 flex animate-pulse items-center justify-center space-x-1.5">
              <div className="bg-accent h-3 w-3 rounded-full" />
              <div className="bg-accent h-3 w-3 rounded-full" />
              <div className="bg-accent h-3 w-3 rounded-full" />
            </div>
          )}
          {status === "error" && (
            <div className="mt-2 text-red-500">Error loading response</div>
          )}
        </div>
        <div className="flex w-full items-center justify-start space-x-2 pt-4 pl-2 opacity-0 group-hover:opacity-100">
          <Tooltip>
            <TooltipTrigger
              onClick={copyToClipboard}
              className="hover:bg-accent cursor-pointer rounded-md p-1.5 text-sm"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </TooltipTrigger>
            <TooltipContent side="bottom">Copy message</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              onClick={onClick}
              className="hover:bg-accent cursor-pointer rounded-md p-1.5 text-sm"
            >
              <GitBranch className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent side="bottom">Branch off</TooltipContent>
          </Tooltip>
          <span className="text-accent-foreground text-xs">
            {message.model}
          </span>
        </div>
      </div>
    </div>
  );
}
