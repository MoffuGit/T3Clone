import type { Id } from "../../../../convex/_generated/dataModel";
import {
  useStickToBottom,
  type StickToBottomInstance,
} from "use-stick-to-bottom";
import { SidebarInset } from "~/components/ui/sidebar";

import {
  useCallback,
  useRef,
  useState,
  type ReactNode,
  type SetStateAction,
} from "react";
import { ChatHeader } from "./header";
import { SideBar } from "./sidebar";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { toast } from "sonner";

interface ThreadContainerProps {
  slug: string | undefined;
  children: (chatProps: {
    thread: Id<"threads"> | undefined | null;
    registerRef: (id: string, ref: HTMLDivElement | null) => void;
    stickToBottomInstance: StickToBottomInstance;
  }) => ReactNode;
}

export function TheadContainer({ children, slug }: ThreadContainerProps) {
  const thread = useQuery(api.threads.getThread, {
    threadId: slug ? (slug as Id<"threads">) : undefined,
  });
  const [right, set_right] = useState(false);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const stickToBottomInstance = useStickToBottom({ initial: "instant" });
  const scrollToMessage = useCallback(
    (id: string, options: ScrollIntoViewOptions) => {
      const ref = messageRefs.current[id];
      if (ref) {
        ref.scrollIntoView(options);
      }
    },
    [],
  );

  const registerRef = useCallback((id: string, ref: HTMLDivElement | null) => {
    messageRefs.current[id] = ref;
  }, []);

  const copyMessage = useCallback(
    async (
      message: string,
      setCopied: (value: SetStateAction<boolean>) => void,
    ) => {
      const messageRef = messageRefs.current[message];
      try {
        if (messageRef !== null && messageRef !== undefined) {
          const innerText = messageRef.innerText;
          setCopied(true);
          await navigator.clipboard.writeText(innerText ?? "");
          toast.success("Copied to clipboard");
          setTimeout(() => {
            setCopied(false);
          }, 2000);
        }
      } catch (error) {
        console.error("Failed to copy code to clipboard:", error);
      }
    },
    [],
  );

  const toggleSidebar = useCallback(() => {
    set_right((open) => !open);
  }, [set_right]);
  return (
    <>
      <SidebarInset>
        <div className="flex h-max max-h-screen flex-col">
          <ChatHeader
            thread={slug === undefined ? null : thread}
            toggleSidebar={toggleSidebar}
          />
          {children({
            stickToBottomInstance,
            thread: thread?._id,
            registerRef: registerRef,
          })}
        </div>
      </SidebarInset>
      <SideBar
        copyMessage={copyMessage}
        toggleSidebar={toggleSidebar}
        thread={thread}
        isOpen={right}
        scrollToMessage={scrollToMessage}
      />
    </>
  );
}
