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
        <div className={`relative flex items-center ${className}`}>
            <Image
                src="/images/logo.png"
                alt="PiRA Logo"
                width={width}
                height={height}
                className="object-contain"
                priority
            />
        </div>
    );
}
