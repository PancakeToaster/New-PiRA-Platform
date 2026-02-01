'use client';

import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { cn } from '@/lib/utils';
import { Fragment } from 'react';

export const DropdownMenu = Menu;

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export const DropdownMenuTrigger = ({ asChild, children, ...props }: any) => {
    if (asChild) {
        return (
            <MenuButton as={Fragment} {...props}>
                {children}
            </MenuButton>
        );
    }
    return <MenuButton {...props}>{children}</MenuButton>;
};

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export const DropdownMenuContent = ({ children, className, align = 'start', side = 'bottom' }: any) => {
    return (
        <MenuItems
            transition
            anchor={`${side} ${align}` as any}
            className={cn(
                "mt-1 w-52 origin-top-right rounded-md border border-border bg-card p-1 text-sm text-foreground shadow-lg ring-1 ring-black/5 focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0 transition duration-100 ease-in-out z-50",
                className
            )}
        >
            {children}
        </MenuItems>
    );
};

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export const DropdownMenuItem = ({ children, onClick, className }: any) => {
    return (
        <MenuItem>
            {({ focus }) => (
                <button
                    type="button"
                    className={cn(
                        "group flex w-full items-center gap-2 rounded-md py-2 px-3 text-sm text-foreground",
                        focus && "bg-accent text-foreground",
                        className
                    )}
                    onClick={onClick}
                >
                    {children}
                </button>
            )}
        </MenuItem>
    );
};

export const DropdownMenuLabel = ({ children, className }: { children: React.ReactNode; className?: string }) => {
    return <div className={cn("px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider", className)}>{children}</div>;
};

export const DropdownMenuSeparator = ({ className }: { className?: string }) => {
    return <div className={cn("-mx-1 my-1 h-px bg-border", className)} />;
};
