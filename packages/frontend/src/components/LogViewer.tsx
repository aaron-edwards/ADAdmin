import { type ReactNode, useEffect, useRef } from "react";

interface LogViewerProps {
  children: ReactNode;
  // Scrolls to the bottom whenever this changes.
  scrollKey: unknown;
}

export function LogViewer({ children, scrollKey }: LogViewerProps) {
  const scroller = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scrollKey is the trigger
  useEffect(() => {
    if (scroller.current) {
      scroller.current.scrollTop = scroller.current.scrollHeight;
    }
  }, [scrollKey]);

  return (
    <div
      ref={scroller}
      className="max-h-96 overflow-auto bg-gray-900 p-3 font-mono text-xs leading-relaxed text-gray-100"
    >
      {children}
    </div>
  );
}
