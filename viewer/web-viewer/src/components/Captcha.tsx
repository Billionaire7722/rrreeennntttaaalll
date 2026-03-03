"use client";

import { useState, useRef, useEffect } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

interface CaptchaProps {
    onChange: (token: string | null) => void;
    error?: boolean;
}

export default function Captcha({ onChange, error = false }: CaptchaProps) {
    const captchaRef = useRef<ReCAPTCHA>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleChange = (token: string | null) => {
        onChange(token);
    };

    if (!isMounted) {
        return (
            <div className="flex justify-center">
                <div className="h-[78px] w-[300px] bg-gray-100 animate-pulse rounded"></div>
            </div>
        );
    }

    return (
        <div className={`flex justify-center ${error ? 'border-2 border-red-500 rounded' : ''}`}>
            <ReCAPTCHA
                ref={captchaRef}
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"}
                onChange={handleChange}
                theme="light"
                size="normal"
            />
        </div>
    );
}
