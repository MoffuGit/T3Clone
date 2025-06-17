import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { useQuery } from "convex/react";

export function UserMessage({ message }: { message: Doc<"messages"> }) {
  return (
    <div className="flex w-full justify-end">
      <div className="flex w-full flex-row-reverse items-start gap-2 px-4 py-2">
        <div className="flex w-full flex-col items-end">
          <div className="bg-accent text-accent-foreground max-w-[80%] rounded-lg px-4 py-3 break-words">
            {message.prompt}
          </div>
          {message.attachments && (
            <MessageAttachments attachments={message.attachments} />
          )}
        </div>
      </div>
    </div>
  );
}

function MessageAttachments({
  attachments,
}: {
  attachments: Id<"_storage">[];
}) {
  const messageAttachments = useQuery(api.messages.getMessageAttachments, {
    attachments: attachments,
  });

  if (!messageAttachments) {
    return (
      <div className="text-sm text-gray-500 italic">Loading attachments...</div>
    );
  }

  return (
    <div className="mt-2 flex w-max max-w-2/3 justify-end">
      {messageAttachments.map((attachment) => {
        if (!attachment || !attachment.url || !attachment.metadata) {
          return (
            <div className="text-sm text-gray-500 italic">
              Attachment missing.
            </div>
          );
        }

        let attachmentDisplay;
        const attachmentId = attachment.metadata._id;

        if (attachment.metadata?.contentType?.startsWith("image/")) {
          attachmentDisplay = (
            <img
              key={attachmentId}
              src={attachment.url}
              alt={`Attachment ${attachmentId}`}
              className="w-full rounded-lg object-cover shadow-md transition-shadow duration-200 hover:shadow-lg"
            />
          );
        } else {
          // Generic display for other file types (e.g., link to download)
          const fileName =
            `${attachment.metadata._creationTime}-${attachment.metadata._id}` ||
            `attachment_${attachmentId}`; // Provide a default name

          attachmentDisplay = (
            <div key={attachmentId} className="flex flex-col items-end">
              <a
                href={attachment.url}
                download={fileName}
                className="text-sm text-blue-500 underline transition-colors duration-200 hover:text-blue-700"
              >
                Download {fileName}
              </a>
              <span className="text-xs text-gray-500">
                Type: {attachment.metadata.contentType || "Unknown"}
                <br />
                Size: {formatBytes(attachment.metadata.size)}
              </span>
            </div>
          );
        }

        return attachmentDisplay;
      })}
    </div>
  );
}

// Helper function to format bytes into human-readable format
function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
