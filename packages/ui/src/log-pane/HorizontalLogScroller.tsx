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
  const [scrollportWidth, setScrollportWidth] = React.useState(0);
  const [effectiveScrollLeft, setEffectiveScrollLeft] = React.useState(scrollLeft);
  const pendingScrollLeftRef = React.useRef<number | null>(null);
  const cancelScrollFrameRef = React.useRef<(() => void) | null>(null);
  const onScrollLeftChangeRef = React.useRef(onScrollLeftChange);
  const effectiveContentWidth = Math.max(
    Math.round(contentWidth ?? 0),
    scrollportWidth,
  );

  onScrollLeftChangeRef.current = onScrollLeftChange;

  const queueScrollLeftUpdate = React.useCallback((nextScrollLeft: number) => {
    const scroller = scrollRef.current;

    if (!scroller) {
      return;
    }

    applyHorizontalScrollVisualOffset(scroller, nextScrollLeft);
    pendingScrollLeftRef.current = nextScrollLeft;

    if (cancelScrollFrameRef.current !== null) {
      return;
    }

    cancelScrollFrameRef.current = scheduleAnimationFrame(() => {
      cancelScrollFrameRef.current = null;
      const pendingScrollLeft = pendingScrollLeftRef.current;

      if (pendingScrollLeft === null) {
        return;
      }

      pendingScrollLeftRef.current = null;
      setEffectiveScrollLeft((currentScrollLeft) =>
        currentScrollLeft === pendingScrollLeft ? currentScrollLeft : pendingScrollLeft,
      );
      onScrollLeftChangeRef.current(pendingScrollLeft);
    });
  }, []);

  React.useLayoutEffect(() => {
    const scroller = scrollRef.current;

    if (!scroller) {
      return;
    }

    if (scroller.scrollLeft !== scrollLeft) {
      scroller.scrollLeft = scrollLeft;
    }
    pendingScrollLeftRef.current = null;
    cancelScrollFrameRef.current?.();
    cancelScrollFrameRef.current = null;
    applyHorizontalScrollVisualOffset(scroller, scrollLeft);
    setEffectiveScrollLeft((currentScrollLeft) =>
      currentScrollLeft === scrollLeft ? currentScrollLeft : scrollLeft,
    );
  }, [scrollLeft]);

  React.useEffect(
    () => () => {
      cancelScrollFrameRef.current?.();
      cancelScrollFrameRef.current = null;
      pendingScrollLeftRef.current = null;
    },
    [],
  );

  React.useLayoutEffect(() => {
    const scroller = scrollRef.current;

    if (!scroller) {
      return undefined;
    }

    const measure = () => {
      const nextWidth = Math.round(scroller.clientWidth || 0);

      setScrollportWidth((currentWidth) => (currentWidth === nextWidth ? currentWidth : nextWidth));
    };

    measure();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(measure);
      observer.observe(scroller);

      return () => observer.disconnect();
    }

    globalThis.addEventListener("resize", measure);

    return () => globalThis.removeEventListener("resize", measure);
  }, []);

  const handleHorizontalWheel = React.useCallback((event: WheelEvent) => {
    const horizontalDelta = getHorizontalWheelDelta(event);

    if (horizontalDelta === 0 || !scrollRef.current) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const scroller = scrollRef.current;
    const maxScrollLeft = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
    const nextScrollLeft = Math.max(0, Math.min(maxScrollLeft, scroller.scrollLeft + horizontalDelta));

    if (nextScrollLeft === scroller.scrollLeft) {
      return;
    }

    scroller.scrollLeft = nextScrollLeft;
    queueScrollLeftUpdate(nextScrollLeft);
  }, [queueScrollLeftUpdate]);

  React.useEffect(() => {
    const scroller = scrollRef.current;

    if (!scroller) {
      return undefined;
    }

    scroller.addEventListener("wheel", handleHorizontalWheel, { passive: false });

    return () => scroller.removeEventListener("wheel", handleHorizontalWheel);
  }, [handleHorizontalWheel]);

  const handleScroll = React.useCallback((event: UIEvent<HTMLDivElement>) => {
    queueScrollLeftUpdate(event.currentTarget.scrollLeft);
  }, [queueScrollLeftUpdate]);

  return (
    <div
      ref={scrollRef}
      className="crosslog-log-scroller"
      role="region"
      aria-label={`Horizontal log scroller for ${title}`}
      onScroll={handleScroll}
      style={
        {
          overflowX: "auto",
          "--crosslog-horizontal-scroll-left": `${effectiveScrollLeft}px`,
        } as React.CSSProperties
      }
    >
      <div className="crosslog-log-scroller__content" style={getContentStyle(effectiveContentWidth)}>
        <div
          className="crosslog-log-scroller__viewport-frame"
          style={getViewportFrameStyle(scrollportWidth)}
        >
          {renderChildrenWithHorizontalScroll(
            children,
            effectiveScrollLeft,
            effectiveContentWidth,
          )}
        </div>
      </div>
    </div>
  );
}

function getHorizontalWheelDelta(event: WheelEvent): number {
  if (event.deltaX !== 0) {
    return event.deltaX;
  }

  return event.shiftKey ? event.deltaY : 0;
}

function applyHorizontalScrollVisualOffset(scroller: HTMLElement, scrollLeft: number): void {
  const value = `${Math.max(0, Math.round(scrollLeft))}px`;

  scroller.style.setProperty("--crosslog-horizontal-scroll-left", value);
  scroller
    .querySelector<HTMLElement>(".crosslog-log-viewport")
    ?.style.setProperty("--crosslog-horizontal-scroll-left", value);
}

function scheduleAnimationFrame(callback: () => void): () => void {
  if (typeof globalThis.requestAnimationFrame === "function") {
    const frameId = globalThis.requestAnimationFrame(() => callback());

    return () => globalThis.cancelAnimationFrame(frameId);
  }

  const timeoutId = globalThis.setTimeout(callback, 0);

  return () => globalThis.clearTimeout(timeoutId);
}

function getContentStyle(contentWidth: number): React.CSSProperties | undefined {
  if (!Number.isFinite(contentWidth) || !contentWidth || contentWidth <= 0) {
    return undefined;
  }

  return { inlineSize: `${Math.round(contentWidth)}px` };
}

function getViewportFrameStyle(scrollportWidth: number): React.CSSProperties | undefined {
  if (!Number.isFinite(scrollportWidth) || scrollportWidth <= 0) {
    return undefined;
  }

  return { inlineSize: `${scrollportWidth}px` };
}

function renderChildrenWithHorizontalScroll(
  children: React.ReactNode,
  horizontalScrollLeft: number,
  horizontalContentWidth: number,
): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (!React.isValidElement(child) || typeof child.type === "string") {
      return child;
    }

    return React.cloneElement(
      child as React.ReactElement<{
        horizontalScrollLeft?: number;
        horizontalContentWidth?: number;
      }>,
      {
        horizontalScrollLeft,
        horizontalContentWidth,
      },
    );
  });
}
