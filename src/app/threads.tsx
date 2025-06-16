"use client";
import { Authenticated } from "convex/react";
import { ThreadsSideBar } from "./_components/sidebar/threads";
export function Threads() {
  return (
    <Authenticated>
      <ThreadsSideBar />
    </Authenticated>
  );
}
