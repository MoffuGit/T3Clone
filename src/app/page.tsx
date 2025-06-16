import { HydrateClient } from "~/trpc/server";
import Thread from "./[slug]/thread";

export default async function () {
  return (
    <HydrateClient>
      <Thread slug={undefined} />
    </HydrateClient>
  );
}
