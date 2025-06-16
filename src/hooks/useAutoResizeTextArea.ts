"use client";
import { useCallback, useEffect, useRef } from "react";

interface UseAutoResizeTextareaProps {
  minHeight: number;
  maxHeight?: number;
}

export default function useAutoResizeTextarea({
  minHeight,
  maxHeight,
}: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Keep track of the request ID to cancel if needed (e.g., component unmounts)
  const animationFrameId = useRef<number | null>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      // Cancel any pending animation frame request
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }

      // Schedule the DOM updates for the next animation frame
      animationFrameId.current = requestAnimationFrame(() => {
        if (!textareaRef.current) return; // Check ref again inside the callback

        if (reset) {
          textarea.style.height = `${minHeight}px`;
          return;
        }

        // Reset height to get the true scrollHeight without scrollbars
        textarea.style.height = "auto";

        const newHeight = Math.max(
          minHeight,
          Math.min(
            textarea.scrollHeight,
            maxHeight ?? Number.POSITIVE_INFINITY,
          ),
        );

        textarea.style.height = `${newHeight}px`;
      });
    },
    [minHeight, maxHeight],
  );

  // Initial height adjustment on mount
  useEffect(() => {
    // Use requestAnimationFrame here too for consistency and initial render
    animationFrameId.current = requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = `${minHeight}px`;
      }
    });

    // Cleanup animation frame on unmount
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [minHeight]); // Depend on minHeight

  // Adjust height on window resize
  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [adjustHeight]); // Depend on adjustHeight

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  return { textareaRef, adjustHeight };
}
