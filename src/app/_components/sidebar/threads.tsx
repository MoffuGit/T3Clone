"use client";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarContent,
  Sidebar,
  SidebarFooter,
} from "~/components/ui/sidebar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

import { useTheme } from "next-themes";

import { api } from "../../../../convex/_generated/api";
import { useQuery } from "convex/react";
import { Settings } from "lucide-react";
import { UserKeysModal } from "../keys/keys";
import { SidebarLeftHeader } from "./sideBarLeftHeader";
import { ThreadList } from "./threadList";
import { SignOutButton } from "@clerk/nextjs";
import { useAPIKeyStore } from "~/stores/userKeys";

export function ThreadsSideBar() {
  const threads = useQuery(api.threads.getThreads, { pinned: false });
  const pinned_threads = useQuery(api.threads.getThreads, { pinned: true });
  const { cleanKeys } = useAPIKeyStore();
  const { setTheme } = useTheme();

  return (
    <Sidebar side="left">
      <SidebarLeftHeader />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <ThreadList
              title="📌 Pinned"
              threads={pinned_threads}
              hasSeparator
            />
            <ThreadList threads={threads} group />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center justify-between">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="hover:bg-accent rounded p-1.5">
                <Settings className="h-4 w-4" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Theme</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    Light
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    Dark
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")}>
                    System
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem onClick={cleanKeys}>
                <SignOutButton />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <UserKeysModal />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
