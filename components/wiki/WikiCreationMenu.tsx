'use client';

import { useState } from 'react';
import { Plus, FileText, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import CreatePageDialog from './CreatePageDialog';
import CreateFolderDialog from './CreateFolderDialog';

import Link from 'next/link';

// ...

export default function WikiCreationMenu({ isAdmin }: { isAdmin: boolean }) {
    const [isPageDialogOpen, setIsPageDialogOpen] = useState(false);
    const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);

    if (!isAdmin) return (
        <div className="flex items-center justify-between px-2 mb-2 group">
            <Link href="/wiki" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
                Documentation
            </Link>
        </div>
    );

    return (
        <div className="flex items-center justify-between px-2 mb-2 group">
            <Link href="/wiki" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
                Documentation
            </Link>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="text-gray-400 hover:text-sky-600 hover:bg-sky-50 p-0.5 rounded transition-colors">
                        <Plus className="w-4 h-4" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setIsPageDialogOpen(true)}>
                        <FileText className="w-4 h-4 mr-2" />
                        New Page
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsFolderDialogOpen(true)}>
                        <FolderPlus className="w-4 h-4 mr-2" />
                        New Folder
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <CreatePageDialog isOpen={isPageDialogOpen} onClose={() => setIsPageDialogOpen(false)} />
            <CreateFolderDialog isOpen={isFolderDialogOpen} onClose={() => setIsFolderDialogOpen(false)} />
        </div>
    );
}
