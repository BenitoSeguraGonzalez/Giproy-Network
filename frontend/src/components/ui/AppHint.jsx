import React, { createElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const joinClasses = (...values) => values.filter(Boolean).join(' ');

const HINT_TONES = {
    dark: {
        shell: 'rounded-[0.7rem] border border-white/20 bg-[#0b0d11] shadow-[0_14px_30px_rgba(0,0,0,0.34)] ring-1 ring-black/25',
        text: 'text-[9px] font-bold leading-snug text-white/88 break-words whitespace-pre-line',
        padding: 'px-2.5 py-1.5',
        structuredPadding: 'px-2.5 py-2',
    },
    light: {
        shell: 'rounded-[1.05rem] border border-zinc-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.14)]',
        text: 'text-[11px] font-bold leading-snug text-zinc-700 break-words whitespace-pre-line',
        padding: 'px-3 py-2',
        structuredPadding: 'px-2.5 py-2',
    },
};

const AppHint = ({
    content,
    children,
    disabled = false,
    tone = 'light',
    className = '',
    triggerClassName = 'inline-flex',
    contentClassName = '',
    as = 'span',
    zIndex = 320,
    minWidth = 160,
    maxWidth,
    widthOffset = 52,
    viewportPadding = 12,
    offset = 12,
    followCursor = true,
    hoverDelay = 0,
    hideOnMove = false,
    shouldShow = null,
}) => {
    const triggerRef = useRef(null);
    const hoverTimerRef = useRef(null);
    const [visible, setVisible] = useState(false);
    const [style, setStyle] = useState(null);
    const isStructuredContent = React.isValidElement(content);
    const toneConfig = HINT_TONES[tone] || HINT_TONES.light;

    const resolveTooltipWidth = useCallback((rect) => {
        const safeWindowWidth = typeof window === 'undefined' ? 1024 : window.innerWidth;
        const maxViewportWidth = Math.max(minWidth, safeWindowWidth - (viewportPadding * 2));
        const resolvedMaxWidth = maxWidth || (isStructuredContent ? 240 : (tone === 'dark' ? 224 : 260));
        const baselineWidth = isStructuredContent
            ? resolvedMaxWidth
            : Math.max(minWidth, (rect?.width || minWidth) + widthOffset);
        return Math.min(Math.min(resolvedMaxWidth, maxViewportWidth), baselineWidth);
    }, [isStructuredContent, maxWidth, minWidth, tone, viewportPadding, widthOffset]);

    const updateHintPosition = useCallback((event) => {
        const node = triggerRef.current;
        if (!node || typeof window === 'undefined') return;
        const rect = node.getBoundingClientRect();
        const tooltipWidth = resolveTooltipWidth(rect);
        const anchorX = followCursor && event?.clientX
            ? event.clientX
            : rect.left + (rect.width / 2);
        const anchorY = followCursor && event?.clientY
            ? event.clientY
            : rect.top;
        const left = Math.min(
            window.innerWidth - tooltipWidth - viewportPadding,
            Math.max(viewportPadding, anchorX - (tooltipWidth / 2)),
        );
        const top = Math.max(viewportPadding, anchorY - offset);

        setStyle({
            width: `${tooltipWidth}px`,
            left: `${left}px`,
            top: `${top}px`,
            transform: 'translateY(-100%)',
        });
    }, [followCursor, offset, resolveTooltipWidth, viewportPadding]);

    const hideHint = useCallback(() => {
        if (hoverTimerRef.current) {
            window.clearTimeout(hoverTimerRef.current);
            hoverTimerRef.current = null;
        }
        setVisible(false);
    }, []);

    const showHint = useCallback((event) => {
        if (disabled || !content || Number(event?.buttons || 0) > 0 || (shouldShow && !shouldShow())) {
            hideHint();
            return;
        }
        updateHintPosition(event);
        setVisible(true);
    }, [content, disabled, hideHint, shouldShow, updateHintPosition]);

    const requestHint = useCallback((event) => {
        if (!hoverDelay) {
            showHint(event);
            return;
        }
        if (hoverTimerRef.current) {
            window.clearTimeout(hoverTimerRef.current);
        }
        const eventSnapshot = event
            ? {
                clientX: event.clientX,
                clientY: event.clientY,
                buttons: event.buttons,
            }
            : null;
        hoverTimerRef.current = window.setTimeout(() => {
            hoverTimerRef.current = null;
            showHint(eventSnapshot);
        }, hoverDelay);
    }, [hoverDelay, showHint]);

    const handleMouseMove = useCallback((event) => {
        if (hideOnMove && visible) {
            hideHint();
            return;
        }
        if (hideOnMove && !visible) {
            requestHint(event);
            return;
        }
        if (visible) {
            showHint(event);
        }
    }, [hideHint, hideOnMove, requestHint, showHint, visible]);

    useEffect(() => () => {
        if (hoverTimerRef.current) {
            window.clearTimeout(hoverTimerRef.current);
        }
    }, []);

    useEffect(() => {
        if (disabled && visible) {
            queueMicrotask(() => setVisible(false));
        }
    }, [disabled, visible]);

    useEffect(() => {
        if (!visible) return undefined;
        const handleViewportChange = () => updateHintPosition();
        window.addEventListener('scroll', handleViewportChange, true);
        window.addEventListener('resize', handleViewportChange);
        return () => {
            window.removeEventListener('scroll', handleViewportChange, true);
            window.removeEventListener('resize', handleViewportChange);
        };
    }, [updateHintPosition, visible]);

    useEffect(() => {
        if (!visible || typeof document === 'undefined') return undefined;
        const handleGlobalDismiss = () => setVisible(false);
        document.addEventListener('pointerdown', handleGlobalDismiss, true);
        document.addEventListener('keydown', handleGlobalDismiss, true);
        return () => {
            document.removeEventListener('pointerdown', handleGlobalDismiss, true);
            document.removeEventListener('keydown', handleGlobalDismiss, true);
        };
    }, [visible]);

    const hintNode = useMemo(() => {
        if (!visible || !content || !style || typeof document === 'undefined') return null;
        return createPortal(
            <div
                aria-hidden="true"
                className="pointer-events-none fixed opacity-100 transition-opacity duration-150 ease-out"
                style={{ ...style, zIndex }}
            >
                <div
                    className={joinClasses(
                        'overflow-hidden',
                        toneConfig.shell,
                        isStructuredContent ? toneConfig.structuredPadding : toneConfig.padding,
                        contentClassName,
                    )}
                >
                    {typeof content === 'string'
                        ? <p className={toneConfig.text}>{content}</p>
                        : content}
                </div>
            </div>,
            document.body,
        );
    }, [content, contentClassName, isStructuredContent, style, toneConfig, visible, zIndex]);

    return (
        <>
            {createElement(
                as,
                {
                    ref: triggerRef,
                    className: joinClasses(triggerClassName, className),
                    onMouseEnter: requestHint,
                    onMouseMove: handleMouseMove,
                    onMouseLeave: hideHint,
                    onFocus: showHint,
                    onBlur: hideHint,
                    onPointerDown: hideHint,
                },
                children,
            )}
            {hintNode}
        </>
    );
};

export default AppHint;
