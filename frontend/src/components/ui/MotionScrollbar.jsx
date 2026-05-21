import React, { useCallback, useEffect, useRef, useState } from 'react';

const MotionScrollbar = ({ targetRef, className = '', orientation = 'vertical', style = undefined, showRail = true }) => {
    const isHorizontal = orientation === 'horizontal';
    const [metrics, setMetrics] = useState({ visible: false, position: 10 });
    const railRef = useRef(null);
    const dragStateRef = useRef(null);
    const thumbSize = 18;
    const railPadding = 10;

    const scrollToThumbPosition = useCallback((nextPosition) => {
        const target = targetRef.current;
        const rail = railRef.current;
        if (!target || !rail) return;

        const maxScroll = isHorizontal
            ? target.scrollWidth - target.clientWidth
            : target.scrollHeight - target.clientHeight;
        const railRect = rail.getBoundingClientRect();
        const railSize = isHorizontal ? railRect.width : railRect.height;
        const travel = Math.max(railSize - (railPadding * 2), 0);
        if (maxScroll <= 1 || travel <= 0) return;

        const clampedPosition = Math.min(Math.max(nextPosition, railPadding), railPadding + travel);
        const nextScroll = ((clampedPosition - railPadding) / travel) * maxScroll;
        if (isHorizontal) {
            target.scrollLeft = nextScroll;
        } else {
            target.scrollTop = nextScroll;
        }
    }, [isHorizontal, targetRef]);

    const handleRailPointerDown = useCallback((event) => {
        if (event.button !== 0) return;
        const target = targetRef.current;
        const rail = railRef.current;
        if (!target || !rail) return;

        event.preventDefault();
        const rect = rail.getBoundingClientRect();
        const pointerPosition = isHorizontal ? event.clientX - rect.left : event.clientY - rect.top;
        scrollToThumbPosition(pointerPosition - (thumbSize / 2));
    }, [isHorizontal, scrollToThumbPosition, targetRef]);

    const handleThumbPointerDown = useCallback((event) => {
        if (event.button !== 0) return;

        event.preventDefault();
        event.stopPropagation();
        dragStateRef.current = {
            startPointer: isHorizontal ? event.clientX : event.clientY,
            startPosition: metrics.position,
        };

        const handlePointerMove = (moveEvent) => {
            const dragState = dragStateRef.current;
            if (!dragState) return;
            const pointer = isHorizontal ? moveEvent.clientX : moveEvent.clientY;
            scrollToThumbPosition(dragState.startPosition + (pointer - dragState.startPointer));
        };

        const handlePointerUp = () => {
            dragStateRef.current = null;
            window.removeEventListener('mousemove', handlePointerMove);
            window.removeEventListener('mouseup', handlePointerUp);
        };

        window.addEventListener('mousemove', handlePointerMove);
        window.addEventListener('mouseup', handlePointerUp);
    }, [isHorizontal, metrics.position, scrollToThumbPosition]);

    const handleWheel = useCallback((event) => {
        const target = targetRef.current;
        if (!target) return;
        event.preventDefault();
        if (isHorizontal) {
            target.scrollBy({ left: event.deltaX || event.deltaY, behavior: 'auto' });
        } else {
            target.scrollBy({ top: event.deltaY, behavior: 'auto' });
        }
    }, [isHorizontal, targetRef]);

    const handleKeyDown = useCallback((event) => {
        const target = targetRef.current;
        if (!target) return;

        const visibleSize = isHorizontal ? target.clientWidth : target.clientHeight;
        const totalSize = isHorizontal ? target.scrollWidth : target.scrollHeight;
        const pageStep = Math.max(visibleSize * 0.8, 120);
        const keySteps = isHorizontal
            ? {
                ArrowLeft: -44,
                ArrowRight: 44,
                PageUp: -pageStep,
                PageDown: pageStep,
                Home: -totalSize,
                End: totalSize,
            }
            : {
                ArrowUp: -44,
                ArrowDown: 44,
                PageUp: -pageStep,
                PageDown: pageStep,
                Home: -totalSize,
                End: totalSize,
            };

        if (!(event.key in keySteps)) return;
        event.preventDefault();
        if (isHorizontal) {
            target.scrollBy({ left: keySteps[event.key], behavior: 'smooth' });
        } else {
            target.scrollBy({ top: keySteps[event.key], behavior: 'smooth' });
        }
    }, [isHorizontal, targetRef]);

    useEffect(() => {
        const target = targetRef.current;
        if (!target) return undefined;

        const updateMetrics = () => {
            const rail = railRef.current;
            const maxScroll = isHorizontal
                ? target.scrollWidth - target.clientWidth
                : target.scrollHeight - target.clientHeight;
            if (maxScroll <= 1) {
                setMetrics({ visible: false, position: railPadding });
                return;
            }

            const railRect = rail?.getBoundingClientRect();
            const railSize = railRect
                ? (isHorizontal ? railRect.width : railRect.height)
                : (isHorizontal ? target.clientWidth : target.clientHeight);
            const travel = Math.max(railSize - (railPadding * 2), 0);
            const ratio = (isHorizontal ? target.scrollLeft : target.scrollTop) / maxScroll;
            setMetrics({
                visible: true,
                position: railPadding + (travel * ratio),
            });
        };

        updateMetrics();
        target.addEventListener('scroll', updateMetrics, { passive: true });
        window.addEventListener('resize', updateMetrics);

        const resizeObserver = typeof ResizeObserver !== 'undefined'
            ? new ResizeObserver(updateMetrics)
            : null;
        resizeObserver?.observe(target);
        if (target.firstElementChild instanceof HTMLElement) {
            resizeObserver?.observe(target.firstElementChild);
        }

        const mutationObserver = typeof MutationObserver !== 'undefined'
            ? new MutationObserver(() => updateMetrics())
            : null;
        mutationObserver?.observe(target, {
            childList: true,
            subtree: true,
            attributes: true,
        });

        const rafOne = window.requestAnimationFrame(() => updateMetrics());
        const rafTwo = window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => updateMetrics());
        });

        return () => {
            target.removeEventListener('scroll', updateMetrics);
            window.removeEventListener('resize', updateMetrics);
            resizeObserver?.disconnect();
            mutationObserver?.disconnect();
            window.cancelAnimationFrame(rafOne);
            window.cancelAnimationFrame(rafTwo);
        };
    }, [isHorizontal, targetRef]);

    if (!metrics.visible) return null;

    return (
        <div
            ref={railRef}
            role="scrollbar"
            aria-orientation={isHorizontal ? 'horizontal' : 'vertical'}
            data-motion-scrollbar="true"
            data-motion-scrollbar-orientation={isHorizontal ? 'horizontal' : 'vertical'}
            data-motion-scrollbar-rail={showRail ? 'visible' : 'hidden'}
            tabIndex={0}
            onMouseDown={handleRailPointerDown}
            onWheel={handleWheel}
            onKeyDown={handleKeyDown}
            className={`absolute z-20 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#F39200]/25 ${
                isHorizontal ? 'left-2 right-2 h-5' : 'bottom-2 top-2 w-5'
            } ${className}`}
            style={style}
        >
            {showRail ? (
                <div data-motion-scrollbar-rail-node="true" className={`pointer-events-none absolute rounded-full bg-[#B7BEC5] shadow-[inset_0_1px_1px_rgba(15,23,42,0.16)] ${
                    isHorizontal
                        ? 'left-2 right-2 top-1/2 h-[2px] -translate-y-1/2'
                        : 'bottom-2 left-1/2 top-2 w-[2px] -translate-x-1/2'
                }`} />
            ) : null}
            <div
                onMouseDown={handleThumbPointerDown}
                className="absolute left-1/2 flex h-[18px] w-[18px] -translate-x-1/2 cursor-grab items-center justify-center rounded-full border border-[#848D96]/70 bg-gradient-to-b from-white to-[#eef1f4] shadow-[0_1px_3px_rgba(15,23,42,0.14)] active:cursor-grabbing"
                style={isHorizontal
                    ? { left: `${metrics.position}px`, top: '50%', transform: 'translate(-50%, -50%)' }
                    : { top: `${metrics.position}px` }}
            >
                <span className="h-1 w-1 rounded-full bg-[#F39200]" />
            </div>
        </div>
    );
};

export default MotionScrollbar;
