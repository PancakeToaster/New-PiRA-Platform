'use client';

import { useState, useMemo, useEffect, useRef, Fragment } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronRight, FileText, FolderPlus, MoreHorizontal, GripVertical, Folder as FolderIcon, File, Edit2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import CreatePageDialog from './CreatePageDialog';
import CreateFolderDialog from './CreateFolderDialog';

// Types
type ItemType = 'folder' | 'node';

interface TreeItemData {
    id: string;
    type: ItemType;
    title: string; // or name
    children?: TreeItemData[];
    isOpen?: boolean;
    folderId?: string | null; // specific to nodes
    parentId?: string | null; // specific to nodes
    order?: number;
    isPublished?: boolean;
}

interface WikiSidebarProps {
    folders: any[];
    nodes: any[];
    isAdmin: boolean;
}

// Drag State Interface
interface DragState {
    id: string;
    type: ItemType;
    originalIndex: number; // for reverting?
}

// Helper specific to this component's data reshaping
const transformToTree = (folders: any[], nodes: any[]) => {
    const folderMap = new Map();
    const nodeMap = new Map();

    // Initialize maps
    folders.forEach(f => folderMap.set(f.id, { ...f, title: f.name, type: 'folder', children: [] }));
    nodes.forEach(n => nodeMap.set(n.id, { ...n, type: 'node', children: [] }));

    const roots: TreeItemData[] = [];

    // Add folders to roots (these will appear first)
    folders.forEach(f => {
        roots.push(folderMap.get(f.id));
    });

    // Collect root-level nodes separately
    const rootNodes: TreeItemData[] = [];

    // Distribute nodes
    nodes.forEach(n => {
        const node = nodeMap.get(n.id);
        if (n.parentId && nodeMap.has(n.parentId)) {
            nodeMap.get(n.parentId).children.push(node);
        } else if (n.folderId && folderMap.has(n.folderId)) {
            folderMap.get(n.folderId).children.push(node);
        } else if (!n.folderId && !n.parentId) {
            rootNodes.push(node);
        }
    });

    // Sort folders by their order
    const sortByOrder = (items: TreeItemData[]) => {
        items.sort((a, b) => {
            if ((a.order ?? 0) !== (b.order ?? 0)) return (a.order ?? 0) - (b.order ?? 0);
            return a.title.localeCompare(b.title);
        });
    };

    // Recursively sort children
    const sortChildrenRecursively = (items: TreeItemData[]) => {
        items.forEach(item => {
            if (item.children && item.children.length > 0) {
                sortByOrder(item.children);
                sortChildrenRecursively(item.children);
            }
        });
    };

    // Sort folders at root
    sortByOrder(roots);
    sortChildrenRecursively(roots);

    // Sort root nodes
    sortByOrder(rootNodes);
    sortChildrenRecursively(rootNodes);

    // Combine: folders first, then nodes
    return [...roots, ...rootNodes];
};

export default function WikiSidebar({ folders, nodes, isAdmin }: WikiSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const activeId = pathname?.split('/wiki/')?.[1] || null;

    const [tree, setTree] = useState<TreeItemData[]>([]);
    const [collapsedState, setCollapsedState] = useState<Record<string, boolean>>({}); // id -> isCollapsed (default open)

    // Dialog States
    const [isPageDialogOpen, setIsPageDialogOpen] = useState(false);
    const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
    const [targetFolderId, setTargetFolderId] = useState<string | null>(null);
    const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
    const [renameFolderName, setRenameFolderName] = useState('');
    const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);
    const [deletingPageId, setDeletingPageId] = useState<string | null>(null);

    // DnD State
    const [draggedItem, setDraggedItem] = useState<DragState | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);
    const [dropPosition, setDropPosition] = useState<'top' | 'bottom' | 'inside' | null>(null);

    // Auto-refresh tree when props change, but try to preserve local collapsed state if IDs match
    useEffect(() => {
        setTree(transformToTree(folders, nodes));
    }, [folders, nodes]);

    // Handlers
    const toggleCollapse = (id: string) => {
        setCollapsedState(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const isCollapsed = (id: string) => !!collapsedState[id];

    // --- Drag & Drop Handlers ---

    const handleDragStart = (e: React.DragEvent, item: TreeItemData, index: number) => {
        if (!isAdmin) return;
        e.stopPropagation();
        setDraggedItem({ id: item.id, type: item.type, originalIndex: index });
        e.dataTransfer.setData('application/json', JSON.stringify({ id: item.id, type: item.type }));
        e.dataTransfer.effectAllowed = 'move';

        // Hide default ghost image if possible or style it
        // let img = new Image(); img.src = ''; e.dataTransfer.setDragImage(img, 0, 0); 
    };

    const handleDragOver = (e: React.DragEvent, targetItem: TreeItemData, depth: number) => {
        e.preventDefault();
        e.stopPropagation();
        if (!draggedItem || draggedItem.id === targetItem.id) return;

        // Logic to determine if dropping above, below, or inside
        // Folders cannot nest inside folders.
        // Nodes can go inside Folders or Nodes.

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const offsetY = e.clientY - rect.top;
        const height = rect.height;

        // Thresholds
        const edgeThreshold = height * 0.25; // Top 25% and Bottom 25% are for reordering

        // If target is a Folder and we are hovering 'inside' (middle 50%)
        // We can drop 'inside' ONLY IF dragged item is a NODE. (User rule: no folder nesting)
        const canDropInside = (targetItem.type === 'folder' || targetItem.type === 'node') && draggedItem.type === 'node';

        // Can dragging folder reorder with node? 
        // Ideally keep roots as mixture, but folders usually stay at root. 
        // Let's assume reordering works freely at the same level.

        if (offsetY < edgeThreshold) {
            setDragOverId(targetItem.id);
            setDropPosition('top');
        } else if (offsetY > height - edgeThreshold) {
            setDragOverId(targetItem.id);
            setDropPosition('bottom');
        } else if (canDropInside) {
            setDragOverId(targetItem.id);
            setDropPosition('inside');
        } else {
            // Fallback to closest edge if inside disallowed
            if (offsetY < height / 2) {
                setDragOverId(targetItem.id);
                setDropPosition('top');
            } else {
                setDragOverId(targetItem.id);
                setDropPosition('bottom');
            }
        }
    };

    const handleDragLeave = () => {
        // Debounce clearing to prevent flicker? relying on next dragOver to overwrite
        //  setDragOverId(null);
        //  setDropPosition(null);
    };

    // Clear state on root drop leave or global end
    const handleGlobalDragEnd = () => {
        setDraggedItem(null);
        setDragOverId(null);
        setDropPosition(null);
    };

    const handleDrop = async (e: React.DragEvent, targetItem: TreeItemData) => {
        e.preventDefault();
        e.stopPropagation();

        const source = draggedItem;
        if (!source || !dragOverId || !dropPosition) return;

        if (source.id === targetItem.id) {
            handleGlobalDragEnd();
            return;
        }

        console.log(`Dropping ${source.type}:${source.id} ${dropPosition} of ${targetItem.type}:${targetItem.id}`);

        // Prepare API payload
        let destinationFolderId: string | null = null;
        let parentId: string | null = null;
        let destinationIndex: number | null = null;

        // Determine Destination Context
        // 1. If dropping 'inside', target is the new parent/folder
        if (dropPosition === 'inside') {
            if (targetItem.type === 'folder') {
                destinationFolderId = targetItem.id;
                destinationIndex = 0; // Prepend to folder
            } else {
                // Target is Node -> Source becomes subpage
                parentId = targetItem.id;
                destinationFolderId = null; // Cleared if using parentId
                // Inherit folderId of parent? Currently model says folderId is null if parentId set? 
                // Schema: folderId String?, parentId String?
                // Usually subpages don't have folderId explicit, they follow parent. 
            }
        }
        // 2. If dropping 'top' or 'bottom', we are moving to be a SIBLING of target
        else {
            // We need to know target's parent/folder to become its sibling
            destinationFolderId = targetItem.folderId || null;
            parentId = targetItem.parentId || null;

            // Find target's index in the tree
            const findItemInTree = (items: TreeItemData[]): { list: TreeItemData[], index: number } | null => {
                for (let i = 0; i < items.length; i++) {
                    if (items[i].id === targetItem.id) return { list: items, index: i };
                    if (items[i].children) {
                        const found = findItemInTree(items[i].children!);
                        if (found) return found;
                    }
                }
                return null;
            };

            const location = findItemInTree(tree);
            if (location) {
                let targetIndex = dropPosition === 'top' ? location.index : location.index + 1;

                // CRITICAL: At root level, folders and nodes have SEPARATE order sequences
                // We need to count only items of the SAME TYPE when calculating the index
                const isRootLevel = !destinationFolderId && !parentId;

                if (isRootLevel) {
                    // Filter the list to only items of the same type as the source
                    const sameTypeItems = location.list.filter(item => item.type === source.type);

                    // Find where the target falls within its type's sequence
                    const targetIndexInTypeList = sameTypeItems.findIndex(item => item.id === targetItem.id);

                    if (targetIndexInTypeList !== -1) {
                        // Target is the same type as source
                        targetIndex = dropPosition === 'top' ? targetIndexInTypeList : targetIndexInTypeList + 1;

                        // Adjust if dragged item is before target in the same-type list
                        const draggedIndexInTypeList = sameTypeItems.findIndex(item => item.id === source.id);
                        if (draggedIndexInTypeList !== -1 && draggedIndexInTypeList < targetIndex) {
                            targetIndex--;
                        }
                    } else {
                        // Target is a different type - count items of source's type that appear before target in visual list
                        targetIndex = location.list
                            .slice(0, dropPosition === 'top' ? location.index : location.index + 1)
                            .filter(item => item.type === source.type)
                            .length;

                        // Adjust for dragged item if it's already in the list
                        const dragIndex = location.list.findIndex(item => item.id === source.id);
                        if (dragIndex !== -1 && dragIndex < location.index) {
                            targetIndex--;
                        }
                    }
                } else {
                    // Non-root: all items in the same list share one order sequence
                    const draggedIndex = location.list.findIndex(item => item.id === source.id);
                    if (draggedIndex !== -1 && draggedIndex < targetIndex) {
                        targetIndex--;
                    }
                }

                destinationIndex = targetIndex;
            }
        }

        // Perform Fetch
        console.log('--- DROP DEBUG ---');
        console.log('Source:', source);
        console.log('Target:', targetItem);
        console.log('DropPosition:', dropPosition);
        console.log('Calculated:', { destinationFolderId, parentId, destinationIndex });

        try {
            const response = await fetch('/api/wiki/move', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: source.type,
                    id: source.id,
                    destinationFolderId,
                    parentId,
                    destinationIndex
                })
            });
            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);

            router.refresh();
        } catch (error) {
            console.error("Drop failed", error);
        }

        handleGlobalDragEnd();
    };

    // Rename folder handler
    const handleRenameFolder = async () => {
        if (!renamingFolderId || !renameFolderName.trim()) return;

        try {
            const response = await fetch(`/api/wiki/folders/${renamingFolderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: renameFolderName.trim() }),
            });

            if (!response.ok) {
                const data = await response.json();
                alert(data.error || 'Failed to rename folder');
                return;
            }

            router.refresh();
            setRenamingFolderId(null);
            setRenameFolderName('');
        } catch (error) {
            console.error('Failed to rename folder:', error);
            alert('Failed to rename folder');
        }
    };

    // Delete folder handler
    const handleDeleteFolder = async () => {
        if (!deletingFolderId) return;

        try {
            const response = await fetch(`/api/wiki/folders/${deletingFolderId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const data = await response.json();
                alert(data.error || 'Failed to delete folder');
                return;
            }

            router.refresh();
            setDeletingFolderId(null);
        } catch (error) {
            console.error('Failed to delete folder:', error);
            alert('Failed to delete folder');
        }
    };

    // Delete page handler
    const handleDeletePage = async () => {
        if (!deletingPageId) return;

        try {
            const response = await fetch(`/api/wiki/nodes/${deletingPageId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const data = await response.json();
                alert(data.error || 'Failed to delete page');
                return;
            }

            router.refresh();
            setDeletingPageId(null);
        } catch (error) {
            console.error('Failed to delete page:', error);
            alert('Failed to delete page');
        }
    };


    // --- Renderers ---

    const renderTreeItem = (item: TreeItemData, depth: number, index: number, siblings: TreeItemData[]) => {
        const isCollapsedItem = isCollapsed(item.id);
        const hasChildren = item.children && item.children.length > 0;
        const isActive = activeId === item.id;

        const isBeingDragged = draggedItem?.id === item.id;
        const isDropTarget = dragOverId === item.id;

        // Spacer Logic
        const showSpacerTop = isDropTarget && dropPosition === 'top';
        const showSpacerBottom = isDropTarget && dropPosition === 'bottom';
        const showHighlightInside = isDropTarget && dropPosition === 'inside';

        return (
            <div key={item.id} className="relative">
                {/* Top Spacer */}
                <div
                    onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (dragOverId !== item.id || dropPosition !== 'top') {
                            setDragOverId(item.id);
                            setDropPosition('top');
                        }
                    }}
                    onDrop={(e) => handleDrop(e, item)}
                    className={cn(
                        "transition-all duration-200 ease-in-out relative pl-2",
                        showSpacerTop ? "h-12 opacity-100" : "h-0 opacity-0 overflow-hidden"
                    )}
                >
                    <div className="absolute inset-y-1 left-2 ring-0 right-0 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50/50" />
                </div>

                <div
                    draggable={isAdmin}
                    onDragStart={(e) => handleDragStart(e, item, index)}
                    onDragOver={(e) => handleDragOver(e, item, depth)}
                    // onDragLeave={handleDragLeave} // tricky with children
                    onDrop={(e) => handleDrop(e, item)}
                    onDragEnd={handleGlobalDragEnd}
                    className={cn(
                        "group flex items-center py-1 px-2 rounded-md transition-colors relative select-none",
                        // Base Styles
                        item.type === 'node' ? (isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-accent font-medium") : "text-foreground font-bold hover:bg-accent",
                        // Dragging Style
                        isBeingDragged && "opacity-40",
                        // Accept Inside items (Highlight background)
                        showHighlightInside && "bg-primary/20 ring-1 ring-primary/30 z-10",
                        // Text Size
                        "text-sm"
                    )}
                    style={{ paddingLeft: `${depth * 14 + 8}px` }}
                >
                    {/* Inside Drop Overlay Border */}
                    {showHighlightInside && (
                        <div className="absolute inset-0 border-2 border-primary rounded-md pointer-events-none" />
                    )}

                    {/* Link / Title */}
                    {item.type === 'node' ? (
                        <Link href={`/wiki/${item.id}`} className="flex-1 truncate block outline-none" draggable={false}>
                            {item.title}
                            {!item.isPublished && <span className="ml-2 w-1.5 h-1.5 inline-block rounded-full bg-yellow-400 align-middle" title="Draft" />}
                        </Link>
                    ) : (
                        renamingFolderId === item.id ? (
                            <input
                                type="text"
                                value={renameFolderName}
                                onChange={(e) => setRenameFolderName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleRenameFolder();
                                    }
                                    if (e.key === 'Escape') {
                                        setRenamingFolderId(null);
                                        setRenameFolderName('');
                                    }
                                }}
                                onBlur={handleRenameFolder}
                                onClick={(e) => e.stopPropagation()}
                                className="flex-1 px-2 py-0.5 bg-background border border-primary rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                autoFocus
                            />
                        ) : (
                            <span
                                className="flex-1 truncate block cursor-pointer"
                                onClick={() => toggleCollapse(item.id)}
                            >
                                {item.title}
                            </span>
                        )
                    )}

                    {/* Chevron Expander - Now on the right */}
                    <div
                        className={cn("ml-1 shrink-0 text-muted-foreground cursor-pointer transition-transform duration-200", !hasChildren && "invisible")}
                        onClick={(e) => { e.stopPropagation(); toggleCollapse(item.id); }}
                    >
                        <ChevronRight className={cn("w-3 h-3", !isCollapsedItem && "rotate-90")} />
                    </div>

                    {/* Active Marker */}
                    {item.type === 'node' && isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-3 bg-primary rounded-r-full" />
                    )}

                    {/* Admin Actions Dropdown (stop prop to prevent drag/nav) */}
                    {isAdmin && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div role="button" className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-muted rounded ml-auto text-muted-foreground" onClick={(e) => e.stopPropagation()}>
                                    <MoreHorizontal className="w-4 h-4" />
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => { setTargetFolderId(item.type === 'folder' ? item.id : (item.folderId || null)); setIsPageDialogOpen(true); }}>
                                    <FileText className="w-4 h-4 mr-2" />
                                    New Page
                                </DropdownMenuItem>
                                {item.type === 'folder' && (
                                    <>
                                        <DropdownMenuItem onClick={() => { setRenamingFolderId(item.id); setRenameFolderName(item.title); }}>
                                            <Edit2 className="w-4 h-4 mr-2" />
                                            Rename Folder
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setDeletingFolderId(item.id)} className="text-red-600 focus:text-red-600">
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete Folder
                                        </DropdownMenuItem>
                                    </>
                                )}
                                {item.type === 'node' && (
                                    <DropdownMenuItem onClick={() => setDeletingPageId(item.id)} className="text-red-600 focus:text-red-600">
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete Page
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                {/* Bottom Spacer */}
                <div
                    onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (dragOverId !== item.id || dropPosition !== 'bottom') {
                            setDragOverId(item.id);
                            setDropPosition('bottom');
                        }
                    }}
                    onDrop={(e) => handleDrop(e, item)}
                    className={cn(
                        "transition-all duration-200 ease-in-out relative pl-2",
                        showSpacerBottom ? "h-12 opacity-100" : "h-0 opacity-0 overflow-hidden"
                    )}
                >
                    <div className="absolute inset-y-1 left-2 right-0 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50/50" />
                </div>

                {/* Children */}
                {!isCollapsedItem && item.children && item.children.length > 0 && (
                    <div className="mt-0.5">
                        {item.children.map((child, idx) => renderTreeItem(child, depth + 1, idx, item.children!))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <Fragment>
            <div className="flex flex-col h-full overflow-y-auto" onDragOver={(e) => e.preventDefault()} onDrop={handleGlobalDragEnd}>
                <div className="p-2 space-y-0.5 min-h-[500px]"> {/* Min height for drop area */}
                    {tree.map((item, index) => renderTreeItem(item, 0, index, tree))}

                    {tree.length === 0 && (
                        <div className="text-gray-400 text-sm text-center py-8">
                            No pages yet. Create one!
                        </div>
                    )}

                    {/* Empty Space Drop Target for bottom of list */}
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
                parentId={targetFolderId} // If null, creates at root
            />



            {/* Delete Folder Confirmation */}
            {deletingFolderId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setDeletingFolderId(null)}>
                    <div className="bg-card border border-border rounded-lg p-6 w-96 shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Delete Folder</h3>
                        <p className="text-muted-foreground mb-4">
                            Are you sure you want to delete this folder? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setDeletingFolderId(null)}
                                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteFolder}
                                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Page Confirmation */}
            {deletingPageId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setDeletingPageId(null)}>
                    <div className="bg-card border border-border rounded-lg p-6 w-96 shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Delete Page</h3>
                        <p className="text-muted-foreground mb-4">
                            Are you sure you want to delete this page? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setDeletingPageId(null)}
                                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeletePage}
                                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Fragment>
    );
}
