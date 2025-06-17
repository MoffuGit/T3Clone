import type { Doc } from "../../../../convex/_generated/dataModel";
import { useEffect } from "react";
import { ScrollSideBar } from "~/app/_components/sidebar/scroll";
import { SidebarProvider } from "~/components/ui/sidebar";

interface SideBarProps {
  thread: Doc<"threads"> | undefined | null;
  isOpen: boolean;
  toggleSidebar: () => void;
  scrollToMessage: (id: string, options: ScrollIntoViewOptions) => void;
  scrollToChatArea: (side: "top" | "bottom", behavior: ScrollBehavior) => void;
}

export function SideBar({
  thread,
  isOpen,
  scrollToMessage,
  toggleSidebar,
}: SideBarProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "m" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);
  return (
    <SidebarProvider defaultOpen={false} open={isOpen} className="w-auto">
      <ScrollSideBar thread={thread} scrollTo={scrollToMessage} />
    </SidebarProvider>
  );
}
