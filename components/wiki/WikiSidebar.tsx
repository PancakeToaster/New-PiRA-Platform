'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronRight, FileText, FolderPlus, MoreHorizontal, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import CreatePageDialog from './CreatePageDialog';
import CreateFolderDialog from './CreateFolderDialog';
import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd';

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type Folder = any;
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type Node = any;

interface WikiSidebarProps {
    folders: Folder[];
    nodes: Node[];
    isAdmin: boolean;
}

interface TreeItemProps {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    item: any; // Now item contains type ('folder' | 'node') and children
    depth: number;
    activeId: string | null;
    onCreatePage?: (folderId: string) => void;
    onCreateFolder?: (folderId: string) => void;
    index: number;
    isAdmin: boolean;
}

const TreeItem = ({ item, depth, activeId, onCreatePage, onCreateFolder, index, isAdmin }: TreeItemProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const hasChildren = item.children && item.children.length > 0;
    const isActive = item.type === 'node' && item.id === activeId;
    const draggableId = `${item.type}-${item.id}`;

    if (item.type === 'folder') {
        return (
            <Draggable draggableId={draggableId} index={index} isDragDisabled={!isAdmin}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        style={provided.draggableProps.style}
                        className="select-none"
                    >
                        <div
                            className={cn(
                                "group flex items-center py-1.5 px-2 rounded-md cursor-pointer transition-colors duration-200",
                                "text-sm font-medium text-gray-700",
                                // Standard hover (only if not dragging something else nearby to avoid flicker)
                                !snapshot.isDragging && !snapshot.combineTargetFor && "hover:bg-gray-100/80",
                                // Active Drag State - Minimal: solid line on bottom
                                snapshot.isDragging && "bg-white border-b-2 border-sky-500 shadow-sm opacity-90 z-50",
                                // Drop Target State (Combine)
                                snapshot.combineTargetFor && "bg-sky-50 ring-1 ring-sky-300"
                            )}
                            onClick={() => setIsOpen(!isOpen)}
                            // Combine drag handle into the main element or explicit handle
                            // Using main element for drag but we need to exclude content clicks?
                            // Actually best to have a handle for folders to avoid conflict with click-to-open
                            style={{ paddingLeft: `${depth * 12 + 8}px` }}
                        >
                            {isAdmin && (
                                <div {...provided.dragHandleProps} className="mr-1 text-gray-400 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing">
                                    <GripVertical className="w-3 h-3" />
                                </div>
                            )}
                            {/* Spacer if no admin grip, or just rely on padding */}
                            {!isAdmin && <div className="mr-1 w-3" />}

                            <span className={cn(
                                "mr-1 text-gray-400 transition-transform duration-200",
                                isOpen && "transform rotate-90"
                            )}>
                                {hasChildren ? <ChevronRight className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5" />}
                            </span>
                            <span className="truncate flex-1">{item.name}</span>

                            {/* Context Menu for Folder */}
                            {isAdmin && (
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger className="p-0.5 hover:bg-gray-200 rounded text-gray-500">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start">
                                            <DropdownMenuItem onClick={() => onCreatePage?.(item.id)}>
                                                <FileText className="w-4 h-4 mr-2" />
                                                New Page
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onCreateFolder?.(item.id)}>
                                                <FolderPlus className="w-4 h-4 mr-2" />
                                                New Folder
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            )}
                        </div>

                        {isOpen && (
                            <div className="mt-0.5">
                                {/* Nested Droppable for Folder Children */}
                                <Droppable droppableId={`folder-${item.id}`} type="ITEM" isCombineEnabled={isAdmin}>
                                    {(provided) => (
                                        <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-col gap-0.5">
                                            <WikiTreeList items={item.children} depth={depth + 1} activeId={activeId} onCreatePage={onCreatePage} onCreateFolder={onCreateFolder} isAdmin={isAdmin} />
                                            {provided.placeholder}
                                            {/* Empty placeholder to allow dropping into empty folders */}
                                            {item.children && item.children.length === 0 && (
                                                <div className="py-2 pl-8 text-xs text-gray-400 italic">
                                                    Empty
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        )}
                    </div>
                )}
            </Draggable>
        );
    }

    // Node (File)
    return (
        <Draggable draggableId={draggableId} index={index} isDragDisabled={!isAdmin}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={{ paddingLeft: `${depth * 12 + 8}px`, ...provided.draggableProps.style }}
                    className="outline-none"
                >
                    <Link
                        href={`/wiki/${item.id}`}
                        className={cn(
                            "group flex items-center py-1.5 px-2 rounded-md transition-colors relative",
                            "text-sm font-medium",
                            isActive
                                ? "bg-sky-50 text-sky-700"
                                : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900",
                            // Dragging State - Minimal
                            snapshot.isDragging && "bg-white border-b-2 border-sky-500 shadow-sm opacity-90 z-50"
                        )}
                    >
                        {/* Static Grip to match Folder */}
                        {isAdmin && (
                            <div className="mr-1 text-gray-400 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing">
                                <GripVertical className="w-3 h-3" />
                            </div>
                        )}
                        {!isAdmin && <div className="mr-1 w-3" />}

                        {/* Icon to match Chevron spacing */}
                        <div className="w-3.5 h-3.5 mr-1 flex items-center justify-center text-gray-400">
                            <FileText className="w-3.5 h-3.5" />
                        </div>

                        {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-sky-500 rounded-r-full" />
                        )}
                        <span className="truncate flex-1">{item.title}</span>
                        {!item.isPublished && (
                            <span className="ml-2 w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" title="Draft" />
                        )}
                    </Link>
                </div>
            )}
        </Draggable>
    );
};

const WikiTreeList = ({ items, depth, activeId, onCreatePage, onCreateFolder, isAdmin }: { items: any[], depth: number, activeId: string | null, onCreatePage: any, onCreateFolder: any, isAdmin: boolean }) => {
    return items.map((item, index) => (
        <TreeItem
            key={`${item.type}-${item.id}`}
            item={item}
            depth={depth}
            activeId={activeId}
            onCreatePage={onCreatePage}
            onCreateFolder={onCreateFolder}
            index={index}
            isAdmin={isAdmin}
        />
    ));
};

export default function WikiSidebar({ folders, nodes, isAdmin }: WikiSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const activeId = pathname?.split('/wiki/')?.[1] || null;

    // State for Dialogs
    const [isPageDialogOpen, setIsPageDialogOpen] = useState(false);
    const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
    const [targetFolderId, setTargetFolderId] = useState<string | null>(null);

    const handleCreatePage = (folderId: string) => {
        setTargetFolderId(folderId);
        setIsPageDialogOpen(true);
    };

    const handleCreateFolder = (folderId: string) => {
        setTargetFolderId(folderId);
        setIsFolderDialogOpen(true);
    };

    // Construct Tree
    const tree = useMemo(() => {
        const folderMap = new Map();
        // Initialize folder map with type='folder'
        folders.forEach(f => folderMap.set(f.id, { ...f, type: 'folder', children: [] }));

        const roots: any[] = [];

        // Build folder hierarchy
        folders.forEach(f => {
            if (f.parentId && folderMap.has(f.parentId)) {
                folderMap.get(f.parentId).children.push(folderMap.get(f.id));
            } else {
                roots.push(folderMap.get(f.id));
            }
        });

        // Add nodes to folders (mix in nodes)
        nodes.forEach(n => {
            const nodeWithType = { ...n, type: 'node' };
            if (n.folderId && folderMap.has(n.folderId)) {
                folderMap.get(n.folderId).children.push(nodeWithType);
            } else if (!n.folderId) {
                roots.push(nodeWithType);
            }
        });

        // Sort roots and children
        // Sort by order (asc), then by name (alpha)
        const sortItems = (items: any[]) => {
            items.sort((a, b) => {
                // If order is different, sort by order
                if ((a.order ?? 0) !== (b.order ?? 0)) {
                    return (a.order ?? 0) - (b.order ?? 0);
                }
                // Fallback to alphabetical
                const nameA = a.name || a.title;
                const nameB = b.name || b.title;
                return nameA.localeCompare(nameB);
            });
            // Recursively sort children
            items.forEach(item => {
                if (item.children) sortItems(item.children);
            });
        };

        sortItems(roots);

        return roots;
    }, [folders, nodes]);

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId, combine } = result;

        // Verify if we have a destination OR a combine target
        if (!destination && !combine) return;

        // If simple reorder in same place, do nothing
        if (
            !combine &&
            destination &&
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        // Parse Source IDs
        const [rawType, ...idParts] = draggableId.split('-');
        let type = rawType;
        const id = idParts.join('-');

        // Normalize legacy types if needed
        if (type === 'file') type = 'node';

        // Determine Destination Folder ID
        let destinationFolderId: string | null = null;

        if (combine) {
            // User dropped item ONTO another item
            // combine.draggableId is the ID of the item being dropped ON
            const [targetType, ...targetIdParts] = combine.draggableId.split('-');
            const targetId = targetIdParts.join('-');

            if (targetType === 'folder') {
                destinationFolderId = targetId;
            } else {
                // Dropping on a file usually doesn't mean "put inside file", generally "put next to file"
                // But combine means "merge". We can treat it as "put in same folder as target".
                // However, getting the parent ID of the target from here is hard without the full tree lookup.
                // For now, let's only support dropping ON folders.
                console.log('Dropped on a file, ignoring combine');
                return;
            }
        } else if (destination) {
            // Standard list drop
            destinationFolderId = destination.droppableId === 'root' ? null : destination.droppableId.replace('folder-', '');
        }

        const destinationIndex = destination ? destination.index : 0; // Default to 0 if combine (though combine usually appends)

        console.log(`Moving ${type} ${id} to folder ${destinationFolderId} at index ${destinationIndex}`);

        // Optimistic UI update could happen here, but triggering refresh is safer for tree consistency

        try {
            const res = await fetch('/api/wiki/move', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type,
                    id,
                    destinationFolderId,
                    destinationIndex
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(`Failed: ${JSON.stringify(errData)}`);
            }

            router.refresh();

        } catch (error: any) {
            console.error(error);
            alert(error.message || 'Failed to move item');
        }
    };

    return (
        <>
            <div className="flex flex-col h-full">
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="h-full flex flex-col">
                        {/* Root Droppable - Enable Combine */}
                        <Droppable droppableId="root" type="ITEM" isCombineEnabled={isAdmin} isDropDisabled={!isAdmin}>
                            {(provided) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className="min-h-[200px] flex flex-col gap-0.5 pb-20"
                                >
                                    <WikiTreeList items={tree} depth={0} activeId={activeId} onCreatePage={handleCreatePage} onCreateFolder={handleCreateFolder} isAdmin={isAdmin} />
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>

                        {tree.length === 0 && (
                            <p className="text-sm text-gray-400 text-center py-4">No content yet.</p>
                        )}
                    </div>
                </DragDropContext>

                <div className="pt-4 mt-auto border-t border-gray-100">
                    {/* Button moved to header */}
                </div>
            </div>

            <CreatePageDialog
                isOpen={isPageDialogOpen}
                onClose={() => setIsPageDialogOpen(false)}
                parentId={targetFolderId}
            />
            <CreateFolderDialog
                isOpen={isFolderDialogOpen}
                onClose={() => setIsFolderDialogOpen(false)}
                parentId={targetFolderId}
            />
        </>
    );
}
