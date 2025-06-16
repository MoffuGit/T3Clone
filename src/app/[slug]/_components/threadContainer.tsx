import type { Id } from "convex/_generated/dataModel";
import { SidebarInset } from "~/components/ui/sidebar";

import {
  useCallback,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { ChatHeader } from "./header";
import { SideBar } from "./sidebar";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";

interface ThreadContainerProps {
  slug: String | undefined;
  children: (chatProps: {
    thread: Id<"threads"> | undefined | null;
    registerRef: (id: string, ref: HTMLDivElement | null) => void;
    scrollRef: RefObject<HTMLDivElement | null>;
  }) => ReactNode;
}

export function TheadContainer({ children, slug }: ThreadContainerProps) {
  const thread = useQuery(api.threads.getThread, {
    threadId: slug ? (slug as Id<"threads">) : undefined,
  });
  let [right, set_right] = useState(false);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
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
  const scrollTo = useCallback(
    (side: "top" | "bottom", behavior: ScrollBehavior) => {
      if (scrollRef.current) {
        switch (side) {
          case "top":
            scrollRef.current.scroll({ top: 0, left: 0, behavior });
            break;
          case "bottom":
            scrollRef.current.scroll({
              top: scrollRef.current.scrollHeight,
              left: 0,
              behavior,
            });
            break;
        }
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
          <ChatHeader thread={thread} toggleSidebar={toggleSidebar} />
          {children({
            scrollRef: scrollRef,
            thread: thread?._id,
            registerRef: registerRef,
          })}
        </div>
      </SidebarInset>
      <SideBar
        toggleSidebar={toggleSidebar}
        thread={thread}
        isOpen={right}
        scrollToMessage={scrollToMessage}
        scrollToChatArea={scrollTo}
      />
    </>
  );
}
