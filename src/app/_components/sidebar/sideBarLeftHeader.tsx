import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
} from "~/components/ui/sidebar";

import { useRouter } from "next/navigation"; // If not already imported
import { Plus, Search, Command } from "lucide-react";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ThreadSearch } from "../search";
import {
  TooltipContent,
  Tooltip,
  TooltipTrigger,
} from "~/components/ui/tooltip";
export function SidebarLeftHeader() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);
  return (
    <>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="relative py-5 hover:bg-transparent active:bg-transparent"
            >
              🧵
              <span className="text-base font-medium">Threads</span>
              <div className="absolute right-1 flex items-center justify-center space-x-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="hover:bg-accent rounded-md p-1"
                      onClick={() => setOpen(true)}
                    >
                      <Search className="h-4 w-4" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Search</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href="/" className="hover:bg-accent rounded-md p-1">
                      <Plus className="h-4 w-4" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>New Thread</TooltipContent>
                </Tooltip>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <ThreadSearch
        open={open}
        onOpenChange={(value: boolean) => setOpen(value)}
        onSelectThread={(thread) => {
          router.push(`/${thread}`);
        }}
      />
    </>
  );
}
