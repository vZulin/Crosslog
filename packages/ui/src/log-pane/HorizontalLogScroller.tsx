import React from "react";
import type { UIEvent } from "react";

export interface HorizontalLogScrollerProps {
  readonly title: string;
  readonly scrollLeft: number;
  readonly contentWidth?: number;
  readonly onScrollLeftChange: (scrollLeft: number) => void;
  readonly children: React.ReactNode;
}

export function HorizontalLogScroller({
  title,
  scrollLeft,
  contentWidth,
  onScrollLeftChange,
  children,
}: HorizontalLogScrollerProps) {
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  React.useLayoutEffect(() => {
    if (scrollRef.current && scrollRef.current.scrollLeft !== scrollLeft) {
      scrollRef.current.scrollLeft = scrollLeft;
    }
  }, [scrollLeft]);

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    onScrollLeftChange(event.currentTarget.scrollLeft);
  };

  return (
    <div
      ref={scrollRef}
      className="crosslog-log-scroller"
      role="region"
      aria-label={`Horizontal log scroller for ${title}`}
      onScroll={handleScroll}
      style={{ overflowX: "auto" }}
    >
      <div style={getContentStyle(contentWidth)}>{children}</div>
    </div>
  );
}

function getContentStyle(contentWidth: number | undefined): React.CSSProperties | undefined {
  if (!Number.isFinite(contentWidth) || !contentWidth || contentWidth <= 0) {
    return undefined;
  }

  return { minWidth: `${Math.round(contentWidth)}px` };
}
