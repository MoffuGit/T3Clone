import { HydrateClient } from "~/trpc/server";
import Thread from "./[slug]/thread";

export default async function Page() {
  return (
    <HydrateClient>
      <Thread slug={undefined} />
    </HydrateClient>
  );
}
