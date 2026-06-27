import React from "react";
import type { UIEvent } from "react";

export interface HorizontalLogScrollerProps {
  readonly title: string;
  readonly scrollLeft: number;
  readonly onScrollLeftChange: (scrollLeft: number) => void;
  readonly children: React.ReactNode;
}

export function HorizontalLogScroller({
  title,
  scrollLeft,
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
      <div style={{ minWidth: "2400px" }}>{children}</div>
    </div>
  );
}
