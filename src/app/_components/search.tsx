import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
} from "~/components/ui/command";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { type Id } from "../../../convex/_generated/dataModel";
import { useDebounce } from "@uidotdev/usehooks";
import { GitBranch } from "lucide-react";

interface ThreadSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectThread: (threadId: Id<"threads">) => void;
}

export function ThreadSearch({
  open,
  onOpenChange,
  onSelectThread,
}: ThreadSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const threads = useQuery(api.threads.searchThreads, {
    title: debouncedSearchQuery,
  });

  const recentThreads = useQuery(api.threads.getRecentThreads, {});

  const handleSelect = (threadId: Id<"threads">) => {
    onSelectThread(threadId);
    onOpenChange(false);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      className="top-1/4 translate-y-0"
    >
      <CommandInput
        placeholder="Search threads..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        {threads && threads.length > 0 && (
          <CommandGroup heading="Threads">
            {threads.map((thread) => (
              <CommandItem
                value={`${thread.title}-${thread._id}`}
                key={thread._id}
                onSelect={() => handleSelect(thread._id)}
              >
                {thread.branch && <GitBranch />}
                {thread.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {((threads && threads.length === 0) ?? !threads) && (
          <CommandGroup heading="Recent Threads">
            {recentThreads?.map((thread) => (
              <CommandItem
                value={`${thread.title}-${thread._id}`}
                key={thread._id}
                onSelect={() => handleSelect(thread._id)}
              >
                {thread.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
