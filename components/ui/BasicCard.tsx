import { cn } from '@/lib/utils';
import React from 'react';

interface BasicCardProps {
    title: string;
    description?: string;
    children?: React.ReactNode;
    className?: string;
    hoverEffect?: boolean;
}

export default function BasicCard({ title, description, children, className, hoverEffect }: BasicCardProps) {
    return (
        <div className={cn(
            "bg-white rounded-xl p-6 transition-all duration-300",
            hoverEffect && "hover:shadow-lg hover:-translate-y-1",
            className
        )}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
            {description && <p className="text-gray-500 text-sm mb-4">{description}</p>}
            {children}
        </div>
    );
}
