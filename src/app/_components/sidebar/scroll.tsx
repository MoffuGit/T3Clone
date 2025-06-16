"use client";
import type { Doc } from "convex/_generated/dataModel";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "~/components/ui/sidebar";
import dynamic from "next/dynamic";

const BreakPoints = dynamic(
  () => import("./breakpoint").then((mode) => mode.BreakPoints),
  { ssr: false },
);

export function ScrollSideBar({
  thread,
  scrollTo,
}: {
  thread: Doc<"threads"> | null | undefined;
  scrollTo: (id: string, options: ScrollIntoViewOptions) => void;
}) {
  return (
    <Sidebar side="right">
      <SidebarHeader>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem className="text-base font-medium">
                Messages History
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarHeader>
      <SidebarContent className="pt-0">
        {thread && <BreakPoints thread={thread._id} scrollTo={scrollTo} />}
      </SidebarContent>
      <SidebarFooter></SidebarFooter>
    </Sidebar>
  );
}
