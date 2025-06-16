"use client";

import type { Doc, Id } from "convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar";
// import { getConvexSiteUrl } from "../server";
import { useAPIKeyStore } from "~/stores/userKeys";
import { MODEL_CONFIGS, type AIModel } from "~/lib/llmProviders";
import { useStreamingStore } from "~/stores/stream";
import { useStream } from "@convex-dev/persistent-text-streaming/react";
import type { StreamId } from "@convex-dev/persistent-text-streaming";
import { useEffect, useMemo } from "react";

export function BreakPoints({
  thread,
  scrollTo,
}: {
  thread: Id<"threads">;
  scrollTo: (id: string, options: ScrollIntoViewOptions) => void;
}) {
  const breakPoints = useQuery(api.breakpoint.listBreakPoints, {
    thread: thread,
  });
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        {breakPoints
          ? breakPoints.map((point) => (
              <BreakPoint
                breakPoint={point}
                key={point._id}
                scrollTo={scrollTo}
              />
            ))
          : "Loading"}
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function BreakPoint({
  breakPoint,
  scrollTo,
}: {
  breakPoint: Doc<"breakPoints">;
  scrollTo: (id: string, options: ScrollIntoViewOptions) => void;
}) {
  // const url = getConvexSiteUrl();
  const { keys } = useAPIKeyStore();
  const config = MODEL_CONFIGS[breakPoint.model as AIModel];
  let header_key = config.headerKey;
  let headers = {
    "X-Model": breakPoint.model,
    "X-Message-Id": breakPoint.message,
    [header_key]: keys[config.provider] ?? "",
  };
  const { removeDrivenId, drivenIds } = useStreamingStore();
  const isDriven = drivenIds.has(breakPoint._id);
  const { text, status } = useStream(
    api.streaming.getStreamBody,
    new URL(`${process.env.NEXT_PUBLIC_CONVEX_SITE_URL}/breakpoints-stream`),
    isDriven,
    breakPoint.responseStreamId as StreamId,
    {
      headers: headers,
    },
  );
  const isDone = useMemo(() => {
    return status === "done";
  }, [status]);

  useEffect(() => {
    if (isDriven || isDone) {
      removeDrivenId(breakPoint._id);
    }
  }, [isDriven, isDone]);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="default"
          onClick={() => {
            scrollTo(breakPoint.message, { behavior: "smooth" });
          }}
        >
          <div className="max-w-full min-w-0 truncate">{text}</div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
