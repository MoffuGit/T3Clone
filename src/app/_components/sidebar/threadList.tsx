import type { Doc } from "../../../../convex/_generated/dataModel";
import { isToday, isYesterday, isWithinInterval, subDays } from "date-fns";
import { Separator } from "~/components/ui/separator";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
} from "~/components/ui/sidebar";
import Link from "next/link";
import { GitBranch, Pin, PinOff, Trash2 } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";

interface ThreadListProps {
  title?: string; // Optional title for the list (e.g., "Pinned")
  threads: Doc<"threads">[] | undefined;
  hasSeparator?: boolean;
  group?: boolean;
}

export function ThreadList({
  title,
  threads,
  hasSeparator,
  group,
}: ThreadListProps) {
  const isLoading = threads === undefined;
  const isEmpty = threads && threads.length === 0;

  if (isLoading) {
    return;
  }

  if (group) {
    return <GroupedThreads threads={threads} />;
  }

  return (
    <>
      {title && !isEmpty && <div className="my-1 pl-2 text-xs">{title}</div>}
      <SidebarMenu>
        {threads.map((thread) => (
          <ThreadListItem key={thread._id} thread={thread} />
        ))}
      </SidebarMenu>
      {hasSeparator && !isEmpty && <Separator orientation="horizontal" />}
    </>
  );
}

interface ThreadListItemProps {
  thread: Doc<"threads">;
}

function ThreadListItem({ thread }: ThreadListItemProps) {
  const params = useParams<{ slug: string }>();
  return (
    <SidebarMenuItem key={thread._id}>
      <SidebarMenuButton
        size="default"
        isActive={params.slug === (thread._id as string)}
        className="relative"
        asChild
      >
        <Link href={`/${thread._id}`} className="h-full">
          {thread.branch && <GitBranch className="h-4 w-4" />}
          <div className="max-w-full truncate">{thread.title}</div>
          <ThreadActions thread={thread} />
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

interface ThreadActionsProps {
  thread: Doc<"threads">;
}

export function ThreadActions({ thread }: ThreadActionsProps) {
  const deleteThread = useMutation(api.threads.deleteThread);
  const pinThread = useMutation(api.threads.pinThread);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await deleteThread({ threadId: thread._id });
  };

  const handlePinToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent Link's onClick from firing
    await pinThread({
      thread: thread._id,
      pinned: !thread.pinned,
    });
  };

  return (
    <SidebarMenuAction
      className="aspect-auto h-auto w-auto"
      showOnHover
      asChild
    >
      <div className="absolute right-0 flex">
        <Tooltip>
          <TooltipTrigger className="bg-accent rounded p-1">
            <Trash2 className="h-4 w-4" onClick={handleDelete} />
          </TooltipTrigger>
          <TooltipContent side="bottom">Delete</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            className="bg-accent rounded p-1"
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
      </div>
    </SidebarMenuAction>
  );
}

interface GroupedThreadsProps {
  threads: Doc<"threads">[] | undefined;
}

export function GroupedThreads({ threads }: GroupedThreadsProps) {
  if (!threads) {
    return <div>Loading...</div>; // Or your preferred loading state
  }

  const todayThreads = threads.filter((thread) =>
    isToday(thread.lastMessage ?? thread._creationTime),
  );
  const yesterdayThreads = threads.filter((thread) =>
    isYesterday(thread.lastMessage ?? thread._creationTime),
  );
  const sevenDaysAgo = subDays(new Date(), 7);
  const olderThreads = threads.filter((thread) => {
    return isWithinInterval(thread.lastMessage ?? thread._creationTime, {
      start: sevenDaysAgo,
      end: subDays(new Date(), 2),
    });
  });

  const olderThanSevenDays = threads.filter((thread) => {
    return thread.lastMessage
      ? thread.lastMessage < sevenDaysAgo.getUTCDate()
      : thread._creationTime < sevenDaysAgo.getUTCDate();
  });

  return (
    <>
      {todayThreads.length > 0 && (
        <ThreadList title="Today" threads={todayThreads} />
      )}

      {yesterdayThreads.length > 0 && (
        <ThreadList title="Yesterday" threads={yesterdayThreads} />
      )}

      {olderThreads.length > 0 && (
        <ThreadList title="Last 7 Days" threads={olderThreads} />
      )}

      {olderThanSevenDays.length > 0 && (
        <ThreadList title="Older Than 7 Days" threads={olderThanSevenDays} />
      )}
    </>
  );
}
