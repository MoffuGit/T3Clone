import { httpRouter } from "convex/server";
import { streamBreakpoint, streamChat } from "./chat";
import { httpAction } from "./_generated/server";

const http = httpRouter();

http.route({
  path: "/chat-stream",
  method: "POST",
  handler: streamChat,
});

http.route({
  path: "/chat-stream",
  method: "OPTIONS",
  handler: httpAction(async (_, request) => {
    const headers = request.headers;
    if (
      headers.get("Origin") !== null &&
      headers.get("Access-Control-Request-Method") !== null &&
      headers.get("Access-Control-Request-Headers") !== null
    ) {
      return new Response(null, {
        headers: new Headers({
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers":
            "Content-Type, Digest, Authorization, X-ImageGeneration,  X-Thread-Id, X-Model, X-SearchGrounding, X-OpenRouter-API-Key, X-Google-API-Key",
          "Access-Control-Max-Age": "86400",
        }),
      });
    } else {
      return new Response();
    }
  }),
});

http.route({
  path: "/breakpoints-stream",
  method: "POST",
  handler: streamBreakpoint,
});

http.route({
  path: "/breakpoints-stream",
  method: "OPTIONS",
  handler: httpAction(async (_, request) => {
    const headers = request.headers;
    if (
      headers.get("Origin") !== null &&
      headers.get("Access-Control-Request-Method") !== null &&
      headers.get("Access-Control-Request-Headers") !== null
    ) {
      return new Response(null, {
        headers: new Headers({
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers":
            "Content-Type, Digest, Authorization, X-Message-Id, X-Model, X-OpenRouter-API-Key, X-Google-API-Key",
          "Access-Control-Max-Age": "86400",
        }),
      });
    } else {
      return new Response();
    }
  }),
});

export default http;
