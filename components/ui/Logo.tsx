import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
    className?: string;
    width?: number;
    height?: number;
    showText?: boolean;
}

export function Logo({ className = '', width = 150, height = 40, showText = true }: LogoProps) {
    return (
        <div style={{ width, height }} className={`relative ${className}`}>
            <Image
                src="/images/logo.png"
                alt="PiRA Logo"
                fill
                className="object-contain"
                priority
                sizes={`${width}px`}
            />
        </div>
    );
}
