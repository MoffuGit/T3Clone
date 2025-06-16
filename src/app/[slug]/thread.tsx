"use client";

const Chat = dynamic(
  () => import("./../_components/chat").then((mode) => mode.ChatWindow),
  { ssr: false },
);

import { Authenticated } from "convex/react";
import { TheadContainer } from "./_components/threadContainer";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Thread({ slug }: { slug: String | undefined }) {
  const router = useRouter();
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "t" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        router.push("/");
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);
  return (
    <Authenticated>
      <TheadContainer slug={slug}>
        {(chatProps) => <Chat {...chatProps} />}
      </TheadContainer>
    </Authenticated>
  );
}
