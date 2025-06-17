import { api } from "../../../../convex/_generated/api";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { GitBranch, PanelRight, Pin, PinOff } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "~/components/ui/breadcrumb";
import { Separator } from "~/components/ui/separator";
import { SidebarTrigger } from "~/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";

interface ChatHeaderProps {
  thread: Doc<"threads"> | null | undefined;
  toggleSidebar: () => void;
}

export function ChatHeader({ thread, toggleSidebar }: ChatHeaderProps) {
  const pinThread = useMutation(api.threads.pinThread);
  const router = useRouter();
  const handlePinToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (thread) {
      pinThread({
        thread: thread._id,
        pinned: !thread.pinned,
      });
    }
  };
  return (
    <header className="bg-background z-10 flex h-16 w-full shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mr-2 data-[orientation=vertical]:h-4"
      />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="line-clamp-1">
              {thread?.branch && (
                <GitBranch
                  className="hover:bg-accent h-6.5 w-6.5 rounded-md p-1"
                  onClick={() => router.push(`/${thread.branch}`)}
                />
              )}
            </BreadcrumbPage>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbPage className="line-clamp-1">
              {thread?.title}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto flex items-center space-x-2">
        {thread && (
          <>
            <Tooltip>
              <TooltipTrigger
                className="hover:bg-accent rounded p-1"
                onClick={handlePinToggle}
              >
                {thread.pinned ? (
                  <PinOff className="bg-accent h-4 w-4 rounded" />
                ) : (
                  <Pin className="bg-accent h-4 w-4 rounded" />
                )}
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {thread.pinned ? "Unpin" : "Pin"}
              </TooltipContent>
            </Tooltip>
            <div
              className="hover:bg-accent flex items-center justify-center rounded-md p-1.5"
              onClick={toggleSidebar}
            >
              <PanelRight className="h-4 w-4" />
            </div>
          </>
        )}
      </div>
    </header>
  );
}
