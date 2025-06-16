import { memo } from "react"; // Keep memo for the main component, remove useMemo if not needed elsewhere
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import ShikiHighlighter from "react-shiki";
import type { ComponentProps } from "react";
import type { ExtraProps } from "react-markdown";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTheme } from "next-themes";

type CodeComponentProps = ComponentProps<"code"> & ExtraProps;

const components: Components = {
  img: ({ node, className, ...props }) => (
    <img {...props} className="max-w-2/3 rounded" />
  ),
  code: CodeBlock as Components["code"],
  pre: ({ children }) => <>{children}</>,
};

function CodeBlock({ children, className, ...props }: CodeComponentProps) {
  const match = /language-(\w+)/.exec(className || "");
  const { theme } = useTheme();

  const codeString = String(children);

  if (match) {
    const lang = match[1];
    return (
      <div className="my-6 max-w-full min-w-full shadow">
        <Codebar lang={lang!} codeString={codeString} />
        <ShikiHighlighter
          style={{
            borderRadius: 0,
          }}
          language={lang}
          theme={theme === "light" ? "vitesse-light" : "vitesse-black"}
          className="rounded-none font-mono text-sm"
          showLanguage={false}
        >
          {codeString}
        </ShikiHighlighter>
      </div>
    );
  }

  return (
    <code
      className="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold"
      {...props}
    >
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
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy code to clipboard:", error);
      toast.error("Failed to copy code");
    }
  };

  return (
    <div className="bg-secondary flex items-center justify-between rounded-t px-4 py-2">
      <span className="font-mono text-sm">{lang || "text"}</span>{" "}
      <button
        onClick={copyToClipboard}
        className="hover:bg-accent cursor-pointer rounded p-1 text-sm"
        aria-label={copied ? "Copied" : "Copy code to clipboard"}
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}{" "}
      </button>
    </div>
  );
}
export const MemoizedMarkdown = memo(
  ({ content }: { content: string }) => {
    return (
      <div className="prose prose-neutral dark:prose-invert prose-pre:m-0 prose-pre:bg-transparent prose-pre:p-0 w-full max-w-full">
        <ReactMarkdown
          remarkPlugins={[[remarkGfm, { singleTilde: false }]]}
          components={components}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  },
  (prevProps, nextProps) => prevProps.content === nextProps.content,
);
