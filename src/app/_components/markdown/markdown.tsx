import { memo, useMemo } from "react"; // Keep memo for the main component, remove useMemo if not needed elsewhere
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import ShikiHighlighter from "react-shiki";
import type { ComponentProps } from "react";
import type { ExtraProps } from "react-markdown";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTheme } from "next-themes";

// Remove the import for 'marked' as it's no longer needed for lexing.
// import { marked } from "marked"; // <-- Remove this

type CodeComponentProps = ComponentProps<"code"> & ExtraProps;

// Define components outside the main render function if they are static
// This prevents recreating the object on every render.
const components: Components = {
  // Assign our custom CodeBlock to the 'code' component.
  // react-markdown renders fenced code blocks as <pre><code>...</code></pre>.
  // By assigning CodeBlock to 'code', it receives the children (the code string)
  // and the className (like language-js). The parent <pre> is handled by
  // react-markdown's default rendering unless you override 'pre' as well.
  // The original code overrode 'pre' to just render children, which is fine
  // if you want CodeBlock to handle the entire <pre> structure. Let's keep that.
  code: CodeBlock as Components["code"],
  pre: ({ children }) => <>{children}</>, // Let CodeBlock handle the pre/code structure
};

function CodeBlock({ children, className, ...props }: CodeComponentProps) {
  // react-markdown passes the code string as children.
  // It passes the language as a className like "language-js".
  const match = /language-(\w+)/.exec(className || "");
  const { theme } = useTheme();

  // Ensure children is treated as a string for highlighting and copying
  const codeString = String(children);

  if (match) {
    const lang = match[1];
    // Fenced code block
    return (
      <div className="my-6 max-w-full min-w-full shadow">
        {/* Pass the extracted language and code string to Codebar */}
        <Codebar lang={lang!} codeString={codeString} />
        <ShikiHighlighter
          style={{
            borderRadius: 0,
          }}
          language={lang}
          // Use theme from next-themes to pick Shiki theme
          theme={theme === "light" ? "vitesse-light" : "vitesse-black"}
          className="rounded-none font-mono text-sm"
          showLanguage={false}
        >
          {/* Pass the code string to the highlighter */}
          {codeString}
        </ShikiHighlighter>
      </div>
    );
  }

  // Inline code block
  return (
    <code
      className="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold"
      {...props}
    >
      {/* Render children directly for inline code */}
      {children}
    </code>
  );
}

function Codebar({ lang, codeString }: { lang: string; codeString: string }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(codeString);
      setCopied(true);
      toast.success("Copied to clipboard");
      // Reset copied state after a delay
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy code to clipboard:", error);
      // Optionally show an error toast
      toast.error("Failed to copy code");
    }
  };

  return (
    <div className="bg-secondary flex items-center justify-between rounded-t px-4 py-2">
      {/* Display language, default to 'text' if not found? Or just show the found lang. */}
      <span className="font-mono text-sm">{lang || "text"}</span>{" "}
      {/* Added fallback 'text' */}
      <button
        onClick={copyToClipboard}
        className="hover:bg-accent cursor-pointer rounded p-1 text-sm" // Added some padding and hover effect
        aria-label={copied ? "Copied" : "Copy code to clipboard"} // Added accessibility label
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}{" "}
        {/* Added color to checkmark */}
      </button>
    </div>
  );
}

// Remove the block splitting function and related components
// function parseMarkdownIntoBlocks(markdown: string): string[] { ... }
// function PureMarkdownRendererBlock({ content }: { content: string }) { ... }
// const MarkdownRendererBlock = memo(...)

// The main component now renders a single ReactMarkdown instance
export const MemoizedMarkdown = memo(
  ({ content, id }: { content: string; id?: string }) => {
    // Made id optional as it's not used internally now
    // No need to parse into blocks and map over them.
    // Pass the full content directly to ReactMarkdown.

    return (
      // Apply prose classes to the container div
      <div className="prose prose-neutral dark:prose-invert prose-pre:m-0 prose-pre:bg-transparent prose-pre:p-0 w-full max-w-full">
        <ReactMarkdown
          // Pass remark plugins
          remarkPlugins={[[remarkGfm, { singleTilde: false }]]}
          // Pass custom components
          components={components}
        >
          {/* Pass the full markdown content */}
          {content}
        </ReactMarkdown>
      </div>
    );
  },
  // Memoize based on content changing.
  // If id were used for something else that triggers re-renders, include it here.
  (prevProps, nextProps) => prevProps.content === nextProps.content,
);

// Note: The 'id' prop is no longer used internally for keys since we removed the block mapping.
// If 'id' is needed for other purposes by the parent component, keep it in the props.
// I've made it optional in the type definition.
