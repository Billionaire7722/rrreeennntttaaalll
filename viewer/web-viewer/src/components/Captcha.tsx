"use client";

import { useEffect, useRef, useState } from 'react';

interface CaptchaProps {
    onChange: (token: string | null) => void;
    error?: boolean;
}

declare global {
    interface Window {
        turnstile?: {
            render: (container: HTMLElement, options: Record<string, unknown>) => string;
            reset: (widgetId: string) => void;
            remove: (widgetId: string) => void;
        };
    }
}

export default function Captcha({ onChange, error = false }: CaptchaProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const [isRendered, setIsRendered] = useState(false);
    const [renderKey, setRenderKey] = useState(0);
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    useEffect(() => {
        if (!siteKey || !containerRef.current) return;

        let cancelled = false;
        let retryTimer: ReturnType<typeof setTimeout> | null = null;

        const renderWidget = () => {
            if (cancelled || !containerRef.current) return;
            if (!window.turnstile?.render) {
                retryTimer = setTimeout(() => setRenderKey((prev) => prev + 1), 200);
                return;
            }

            if (widgetIdRef.current) {
                window.turnstile.remove(widgetIdRef.current);
                widgetIdRef.current = null;
            }

            widgetIdRef.current = window.turnstile.render(containerRef.current, {
                sitekey: siteKey,
                callback: (token: string) => onChange(token),
                'expired-callback': () => onChange(null),
                'error-callback': () => onChange(null),
            });
            setIsRendered(true);
        };

        renderWidget();

        return () => {
            cancelled = true;
            if (retryTimer) clearTimeout(retryTimer);
            if (widgetIdRef.current && window.turnstile?.remove) {
                window.turnstile.remove(widgetIdRef.current);
                widgetIdRef.current = null;
            }
        };
    }, [onChange, renderKey, siteKey]);

    return (
        <div className={`flex justify-center overflow-hidden ${error ? 'rounded-lg border-2 border-red-400 p-1' : ''}`}>
            {!siteKey && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                    Missing `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
                </p>
            )}
            <div className="turnstile-widget w-full max-w-full">
                <div ref={containerRef} className="cf-turnstile max-w-full" data-sitekey={siteKey}></div>
                {!isRendered && siteKey && <div className="h-[65px] w-[300px] animate-pulse rounded bg-gray-100"></div>}
            </div>
        </div>
    );
}
