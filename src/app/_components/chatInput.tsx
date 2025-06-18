import { useMutation } from "convex/react";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
} from "react";
import { api } from "../../../convex/_generated/api";
import { type Id } from "../../../convex/_generated/dataModel";
import useAutoResizeTextarea from "~/hooks/useAutoResizeTextArea";
import { useLLMProviderStore } from "~/stores/llmProviders";
import { useParams, useRouter } from "next/navigation";
import { useStreamingStore } from "~/stores/stream";
import { create } from "zustand";
import { persist } from "zustand/middleware";

// Import the new smaller components
import { ChatTextarea } from "./chatTexarea";
// import { ChatBottomBar } from "./chatBottomBar";

// Define the form state type
interface ChatInputFormState {
  prompt: string;
}

// Define the action type for the reducer
type ChatInputFormAction =
  | { type: "INPUT_CHANGE"; payload: string }
  | { type: "RESET_INPUT" };

// Define the reducer function
const chatInputFormReducer = (
  state: ChatInputFormState,
  action: ChatInputFormAction,
): ChatInputFormState => {
  switch (action.type) {
    case "INPUT_CHANGE":
      return { ...state, prompt: action.payload };
    case "RESET_INPUT":
      return { prompt: "" };
    default:
      return state;
  }
};

// Define the useChatInputForm hook
const useChatInputForm = () => {
  const [state, dispatch] = React.useReducer(chatInputFormReducer, {
    prompt: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch({ type: "INPUT_CHANGE", payload: e.target.value });
  };

  const resetInput = () => {
    dispatch({ type: "RESET_INPUT" });
  };

  return {
    input: state, // 'input' now contains only prompt
    handleInputChange,
    resetInput,
  };
};

// Zustand store for searchGrounding and imageGeneration
interface messageConfiguration {
  searchGrounding: boolean;
  imageGeneration: boolean;
  setSearchGrounding: (searchGrounding: boolean) => void;
  setImageGeneration: (imageGeneration: boolean) => void;
}

const useSearchImageStore = create<messageConfiguration>()(
  persist(
    (set) => ({
      searchGrounding: false,
      imageGeneration: false,
      setSearchGrounding: (searchGrounding) => set({ searchGrounding }),
      setImageGeneration: (imageGeneration) => set({ imageGeneration }),
    }),
    {
      name: "search-image-storage", // unique name
    },
  ),
);

export function ChatInput({
  isStreaming,
  setIsStreaming,
  thread,
  stickToBottomInstance,
}: {
  isStreaming: boolean;
  setIsStreaming: Dispatch<React.SetStateAction<boolean>>;
  thread: Id<"threads"> | null | undefined;
  stickToBottomInstance: StickToBottomInstance;
}) {
  const { input, handleInputChange, resetInput } = useChatInputForm();
  const [isProcessing, setIsProcessing] = useState(false);
  const {
    searchGrounding,
    setSearchGrounding,
    imageGeneration,
    setImageGeneration,
  } = useSearchImageStore();
  const router = useRouter();
  const { addDrivenId } = useStreamingStore();

  const generateUploadUrl = useMutation(api.messages.generateUploadUrl);

  const sendMessage = useMutation(api.messages.createMessage);
  const createBreakPoint = useMutation(api.breakpoint.createBreakPoint);
  const createNewThread = useMutation(api.threads.createThread); // Renamed for clarity
  const { selectedModel, setSelectedModel } = useLLMProviderStore();
  const imageInput = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]); // Use an array to store multiple files
  const addAttachments = useMutation(api.messages.addAttachments);

  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 72,
    maxHeight: 200,
  });

  const params = useParams<{ slug: string }>();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [params, textareaRef]);

  const { scrollToBottom } = stickToBottomInstance;

  // Main submit logic remains here as it orchestrates mutations and state updates
  const handleSubmit = useCallback(async () => {
    if (!input.prompt.trim() || isStreaming || isProcessing) {
      return;
    }

    setIsProcessing(true);

    let threadId: Id<"threads">;
    let isNewThread = false;

    if (!thread) {
      threadId = await createNewThread({ title: "..." });
      isNewThread = true;
    } else {
      threadId = thread;
    }

    const modelConfig = MODEL_CONFIGS[selectedModel];

    const uploadPromises = selectedFiles.map(async (file) => {
      try {
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!result.ok) {
          console.error(
            "File upload failed:",
            result.status,
            result.statusText,
          );
          return null;
        }

        const data = (await result.json()) as { storageId: string };
        const storageId = data.storageId;

        if (!storageId) {
          console.error("storageId is missing in the response:", data);
          return null;
        }

        return storageId as Id<"_storage">;
      } catch (error) {
        console.error("Error uploading file:", error);
        return null;
      }
    });

    setSelectedFiles([]);

    const chatId = await sendMessage({
      prompt: input.prompt,
      thread: threadId,
      model: selectedModel as string,
      search: searchGrounding && modelConfig.searchGrounding,
      image: imageGeneration && modelConfig.imageGeneration,
    });

    const attachmentPromise = Promise.all(uploadPromises).then(
      async (storageIds) => {
        const validStorageIds = storageIds.filter(
          (id): id is Id<"_storage"> => id !== null,
        );

        if (validStorageIds.length > 0) {
          await addAttachments({ message: chatId, files: validStorageIds });
        }
      },
    );

    resetInput();

    await attachmentPromise;

    addDrivenId(chatId);

    adjustHeight(true);
    setIsProcessing(false);
    setIsStreaming(true);
    void (async () => {
      const breakPointId = await createBreakPoint({
        thread: threadId,
        message: chatId,
        model: selectedModel as string,
      });
      addDrivenId(breakPointId);
    })();

    await scrollToBottom();

    if (isNewThread) {
      router.push(`/${threadId}`);
    }
  }, [
    input.prompt,
    isStreaming,
    isProcessing,
    thread,
    selectedModel,
    selectedFiles,
    sendMessage,
    searchGrounding,
    imageGeneration,
    resetInput,
    addDrivenId,
    adjustHeight,
    setIsStreaming,
    scrollToBottom,
    createNewThread,
    generateUploadUrl,
    addAttachments,
    createBreakPoint,
    router,
  ]);

  // Handle Enter key press in the textarea
  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      await handleSubmit();
    }
  };

  return (
    <div className="pointer-events-none absolute bottom-0 z-10 w-full px-2">
      <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center">
        <ScrollToBottomButton stickToBottomInstance={stickToBottomInstance} />

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await handleSubmit();
          }}
          className="border-input pointer-events-auto relative w-full flex-col items-stretch rounded-t-2xl border p-2 backdrop-blur-sm"
        >
          {selectedFiles.length > 0 && (
            <div className="flex space-x-2 overflow-x-auto border border-transparent pb-2">
              {selectedFiles.map((file, index) => (
                <FilePreview
                  key={index}
                  file={file}
                  onRemove={() => {
                    setSelectedFiles((prevFiles) =>
                      prevFiles.filter((_, i) => i !== index),
                    );
                  }}
                />
              ))}
            </div>
          )}

          <ChatTextarea
            input={input.prompt}
            setInput={handleInputChange} // Pass the handler from the hook
            isStreaming={isStreaming}
            textareaRef={textareaRef}
            adjustHeight={adjustHeight}
            onKeyDown={handleKeyDown}
            onChange={handleInputChange} // Pass the handler from the hook
          />

          <ChatBottomBar
            isProcessing={isProcessing}
            selectedFiles={selectedFiles}
            setSelectedFiles={setSelectedFiles}
            imageInputRef={imageInput}
            input={input}
            isStreaming={isStreaming}
            selectedModel={selectedModel}
            searchGrounding={searchGrounding}
            setSearchGrounding={setSearchGrounding}
            imageGeneration={imageGeneration}
            setImageGeneration={setImageGeneration}
            setSelectedModel={(model) => {
              setSelectedModel(model);
              setSearchGrounding(false);
              setImageGeneration(false);
            }}
          />
        </form>
      </div>
    </div>
  );
}

import { ArrowDown, PaperclipIcon } from "lucide-react";

interface ScrollToBottomButtonProps {
  stickToBottomInstance: StickToBottomInstance;
}

export function ScrollToBottomButton({
  stickToBottomInstance,
}: ScrollToBottomButtonProps) {
  if (stickToBottomInstance.isNearBottom) {
    return;
  }

  return (
    <button
      onClick={async () => stickToBottomInstance.scrollToBottom()}
      className="hover:bg-primary/20 pointer-events-auto mb-4 cursor-pointer gap-0 rounded-full p-2 shadow backdrop-blur-md disabled:cursor-not-allowed disabled:bg-transparent"
      aria-label="Scroll to bottom"
    >
      <ArrowDown className="h-4 w-4" />
    </button>
  );
}
import { ChevronUp, Globe, Image, X } from "lucide-react";

import { Send } from "lucide-react";

interface SendButtonProps {
  disabled: boolean;
  // No explicit onClick needed here if it's a submit button within a form
}

export function SendButton({ disabled }: SendButtonProps) {
  return (
    <button
      type="submit" // This makes it trigger the parent form's onSubmit
      disabled={disabled}
      className="bg-primary/10 hover:bg-primary/30 cursor-pointer rounded-md p-2 shadow backdrop-blur-md disabled:cursor-not-allowed disabled:bg-transparent"
      aria-label="Send message"
    >
      <Send className="h-5 w-5" />
    </button>
  );
}

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import { AI_MODELS, MODEL_CONFIGS, type AIModel } from "~/lib/llmProviders"; // Assuming AI_MODELS is needed here
import type { StickToBottomInstance } from "use-stick-to-bottom";

interface ChatBottomBarProps {
  input: {
    prompt: string;
  };
  isStreaming: boolean;
  isProcessing: boolean;
  selectedModel: string;
  searchGrounding: boolean;
  setSearchGrounding: (searchGrounding: boolean) => void;
  imageGeneration: boolean;
  setImageGeneration: (imageGeneration: boolean) => void;
  setSelectedModel: (model: AIModel) => void;
  imageInputRef: React.RefObject<HTMLInputElement | null>;
  selectedFiles: File[];
  setSelectedFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

export function ChatBottomBar({
  input,
  isProcessing,
  isStreaming,
  selectedModel,
  searchGrounding,
  setSearchGrounding,
  imageGeneration,
  setImageGeneration,
  setSelectedModel,
  imageInputRef,
  selectedFiles,
  setSelectedFiles,
}: ChatBottomBarProps) {
  const modelConfig = () => MODEL_CONFIGS[selectedModel as AIModel];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      // Limit to 5 files
      if (fileArray.length + selectedFiles.length > 5) {
        alert("You can only upload a maximum of 5 files.");
        return;
      }
      setSelectedFiles([...selectedFiles, ...fileArray]);
    }
  };

  return (
    <div className="mt-2 flex h-10 items-end justify-between">
      {/* Render the Model Selector */}
      <div className="flex">
        <ModelSelector
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          disabled={isStreaming} // Disable model selection while streaming
        />
        <div className="flex items-center justify-center space-x-1">
          {modelConfig().searchGrounding && (
            <button
              type="button"
              className={`${searchGrounding && "bg-primary/20"} hover:bg-primary/20 text-foreground/80 flex cursor-pointer items-center rounded-md p-1 text-sm shadow backdrop-blur-md disabled:cursor-not-allowed disabled:bg-transparent`}
              aria-label="Toggle search grounding"
              onClick={() => setSearchGrounding(!searchGrounding)}
              disabled={imageGeneration}
            >
              <Globe className="mr-1 h-4 w-4" /> {/* Smaller icon */}
              Search
            </button>
          )}
          {modelConfig().imageGeneration && (
            <button
              type="button"
              className={`${imageGeneration && "bg-primary/20"} hover:bg-primary/20 text-foreground/80 flex cursor-pointer items-center rounded-md p-1 text-sm shadow backdrop-blur-md disabled:cursor-not-allowed disabled:bg-transparent`}
              aria-label="Generate image"
              onClick={() => setImageGeneration(!imageGeneration)}
              disabled={searchGrounding}
            >
              <Image className="mr-1 h-4 w-4" /> {/* Smaller icon */}
              Image Generation
            </button>
          )}
          {modelConfig().fileInput && (
            <label
              htmlFor="file-upload"
              className="hover:bg-primary/10 text-foreground/80 relative flex cursor-pointer rounded-md p-1 shadow backdrop-blur-md disabled:cursor-not-allowed disabled:bg-transparent"
              aria-label="Attach file"
            >
              <PaperclipIcon className="mr-1 h-4 w-4" />
              <input
                id="file-upload"
                type="file"
                multiple // Enable multiple file selection
                accept=".png,.jpg,.jpeg,.gif,.pdf,.txt,.docx" // Define accepted file types
                ref={imageInputRef}
                onChange={handleFileSelect}
                className="sr-only" // Hide the input
                disabled={selectedFiles.length >= 5} // Disable if already 5 files
              />
            </label>
          )}
        </div>
      </div>

      {/* Render the Send Button */}
      <SendButton
        disabled={
          isStreaming || isProcessing || input.prompt.trim().length === 0
        } // Disable if streaming or input is empty/whitespace
        // Note: The actual form submission is handled by the parent form's onSubmit
        // This button is type="submit" by default, triggering the form handler.
      />
    </div>
  );
}

interface ModelSelectorProps {
  selectedModel: string;
  setSelectedModel: (model: AIModel) => void;
  disabled: boolean;
}

export function ModelSelector({
  selectedModel,
  setSelectedModel,
  disabled,
}: ModelSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="hover:bg-primary/10 text-foreground/80 h-auto rounded-sm py-1 text-sm tracking-wide hover:backdrop-blur-md active:outline-0"
          disabled={disabled}
        >
          {selectedModel}
          <ChevronUp className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent side="left" align="end">
          {AI_MODELS.map((model) => {
            return (
              <DropdownMenuItem
                key={model}
                onClick={() => {
                  setSelectedModel(model);
                }}
                className={selectedModel === model ? "bg-accent" : ""} // Highlight selected
              >
                {model}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
}

function FilePreview({ file, onRemove }: FilePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      const reader = new FileReader();

      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };

      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  }, [file]);

  return (
    <div className="group relative h-12 w-24 overflow-hidden rounded-lg border">
      {previewUrl &&
      ["image/png", "image/jpeg", "image/gif"].includes(file.type) ? (
        <img
          src={previewUrl}
          alt={file.name}
          className="h-full w-full object-fill"
        />
      ) : (
        <div className="border-input flex h-full w-full items-center justify-center border">
          <span className="ml-1 w-full truncate text-xs">{file.name}</span>
        </div>
      )}
      <button
        onClick={onRemove}
        className="absolute top-1 right-1 rounded-full p-0.5"
      >
        <X className="fill-primary h-4 w-4 opacity-0 group-hover:opacity-100" />
      </button>
    </div>
  );
}
