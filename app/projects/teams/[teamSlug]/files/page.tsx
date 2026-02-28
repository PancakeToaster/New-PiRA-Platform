'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/Dialog';
import {
    FileText,
    Image as ImageIcon,
    Film,
    Music,
    File as FileIcon,
    Download,
    Trash2,
    Loader2,
    Plus,
    UploadCloud,
    FolderPlus,
    Folder as FolderIcon,
    ArrowLeft,
    LayoutGrid,
    List as ListIcon,
    MoreHorizontal
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TeamFile {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
    createdAt: string;
    uploader: {
        firstName: string;
        lastName: string;
        avatar: string | null;
    };
}

interface TeamFolder {
    id: string;
    name: string;
    parentId: string | null;
}

// Helper type
interface FileUploadStatus {
    name: string;
    status: 'uploading' | 'success' | 'error';
}

export default function TeamFilesPage({ params }: { params: { teamSlug: string } }) {
    const { teamSlug } = params;
    const [teamId, setTeamId] = useState<string | null>(null);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

    // View Mode
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Load persisted view mode
    useEffect(() => {
        const savedMode = localStorage.getItem('teamFilesViewMode') as 'grid' | 'list';
        if (savedMode) setViewMode(savedMode);
    }, []);

    // Save view mode
    const changeViewMode = (mode: 'grid' | 'list') => {
        setViewMode(mode);
        localStorage.setItem('teamFilesViewMode', mode);
    };

    const [files, setFiles] = useState<TeamFile[]>([]);
    const [folders, setFolders] = useState<TeamFolder[]>([]);
    const [currentFolder, setCurrentFolder] = useState<TeamFolder & { parentId: string | null } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // DnD State
    const [isDragging, setIsDragging] = useState(false);
    const [dragTargetId, setDragTargetId] = useState<string | null>(null);

    // Upload State
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false); // Can keep for manual button
    const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [uploadQueue, setUploadQueue] = useState<FileUploadStatus[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null); // For manual dialog

    useEffect(() => {
        fetchTeamAndFiles();
    }, [teamSlug]);

    useEffect(() => {
        if (teamId) {
            fetchFiles(currentFolderId);
        }
    }, [currentFolderId, teamId]);

    async function fetchTeamAndFiles() {
        try {
            const teamRes = await fetch(`/api/projects/teams/${teamSlug}`);
            if (teamRes.ok) {
                const data = await teamRes.json();
                setTeamId(data.team.id);
            }
        } catch (e) {
            console.error(e);
        }
    }

    async function fetchFiles(folderId: string | null) {
        setIsLoading(true);
        try {
            const query = folderId ? `?folderId=${folderId}` : '';
            const res = await fetch(`/api/projects/teams/${teamId}/files${query}`);
            if (res.ok) {
                const data = await res.json();
                setFiles(data.files);
                setFolders(data.folders);
                setCurrentFolder(data.currentFolder || null);
            }
        } catch (error) {
            console.error('Failed to fetch files:', error);
        } finally {
            setIsLoading(false);
        }
    }

    // --- Drag and Drop Handlers ---
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // allow drop
        // Check if dragging external files
        if (e.dataTransfer.types.includes('Files')) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        // Only prevent if leaving the main container
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        setDragTargetId(null);  // Clear highlight on drop

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            await processUploads(Array.from(e.dataTransfer.files));
        }
    };

    // Item Dragging (Move)
    const handleItemDragStart = (e: React.DragEvent, id: string, type: 'file' | 'folder') => {
        e.dataTransfer.setData('application/x-team-item-id', id);
        e.dataTransfer.setData('application/x-team-item-type', type);
    };

    // Target Highlight Helpers
    const handleTargetDragEnter = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setDragTargetId(targetId);
    };

    const handleTargetDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        // Prevent clearing if moving into a child element
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setDragTargetId(null);
    };

    const handleFolderDrop = async (e: React.DragEvent, targetFolderId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setDragTargetId(null);

        const itemId = e.dataTransfer.getData('application/x-team-item-id');
        const itemType = e.dataTransfer.getData('application/x-team-item-type');

        if (!itemId || !teamId) return;

        // If dropping on "Back to Previous" (targetFolderId === ''),
        // We want to move it to the parent of the current folder.
        // If currentFolderId is null, we are at root, disable drop? Or move to root?
        // If targetFolderId is specific ID, move to that folder.

        let destinationId: string | null = null;
        if (targetFolderId === '') {
            // "Back to Previous" was dropped on.
            // Move to currentFolder.parentId
            destinationId = currentFolder?.parentId || null;
        } else {
            destinationId = targetFolderId;
        }

        // Anti-recursion check if moving folder into itself (handled by API too but good UI UX)
        if (itemId === destinationId) return;

        if (itemType === 'file') {
            await fetch(`/api/projects/teams/${teamId}/files`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileId: itemId, folderId: destinationId })
            });
            fetchFiles(currentFolderId);
        } else if (itemType === 'folder') {
            await fetch(`/api/projects/teams/${teamId}/folders`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ folderId: itemId, parentId: destinationId })
            });
            fetchFiles(currentFolderId);
        }
    };

    const handleContainerDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleManualUpload = async () => {
        if (selectedFile) {
            await processUploads([selectedFile]);
            setIsUploadDialogOpen(false);
            setSelectedFile(null);
        }
    };

    // Core Upload Logic
    const processUploads = async (fileList: File[]) => {
        if (!teamId) return;

        // Initialize queue status
        const newQueue = fileList.map(f => ({ name: f.name, status: 'uploading' as const }));
        setUploadQueue(prev => [...prev, ...newQueue]);

        for (const file of fileList) {
            try {
                const formData = new FormData();
                formData.append('file', file);
                const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
                if (!uploadRes.ok) throw new Error('Upload failed');
                const uploadData = await uploadRes.json();

                const createRes = await fetch(`/api/projects/teams/${teamId}/files`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: file.name,
                        url: uploadData.url,
                        type: file.type,
                        size: file.size,
                        folderId: currentFolderId
                    })
                });

                if (!createRes.ok) throw new Error('Failed to save metadata');
                setUploadQueue(prev => prev.map(item => item.name === file.name ? { ...item, status: 'success' } : item));
            } catch (error) {
                console.error(error);
                setUploadQueue(prev => prev.map(item => item.name === file.name ? { ...item, status: 'error' } : item));
            }
        }
        fetchFiles(currentFolderId);
        setTimeout(() => setUploadQueue([]), 3000);
    };

    async function handleCreateFolder() {
        if (!newFolderName || !teamId) return;
        const res = await fetch(`/api/projects/teams/${teamId}/folders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newFolderName, parentId: currentFolderId })
        });
        if (res.ok) {
            setIsNewFolderDialogOpen(false);
            setNewFolderName('');
            fetchFiles(currentFolderId);
        }
    }

    async function handleDeleteFile(fileId: string) {
        if (!confirm('Delete file?') || !teamId) return;
        await fetch(`/api/projects/teams/${teamId}/files?fileId=${fileId}`, { method: 'DELETE' });
        fetchFiles(currentFolderId);
    }

    async function handleDeleteFolder(folderId: string) {
        if (!confirm('Delete folder and all contents?') || !teamId) return;
        await fetch(`/api/projects/teams/${teamId}/folders?folderId=${folderId}`, { method: 'DELETE' });
        fetchFiles(currentFolderId);
    }

    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith('image/')) return <ImageIcon className="w-8 h-8 text-purple-500" />;
        if (mimeType.startsWith('video/')) return <Film className="w-8 h-8 text-red-500" />;
        if (mimeType.startsWith('audio/')) return <Music className="w-8 h-8 text-pink-500" />;
        if (mimeType.includes('pdf')) return <FileText className="w-8 h-8 text-orange-500" />;
        return <FileIcon className="w-8 h-8 text-blue-500" />;
    };

    const getSmallIcon = (mimeType: string) => {
        if (mimeType.startsWith('image/')) return <ImageIcon className="w-4 h-4 text-purple-500" />;
        return <FileIcon className="w-4 h-4 text-blue-500" />;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div
            className="space-y-6 relative min-h-[500px]"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Drop Overlay */}
            {isDragging && (
                <div className="absolute inset-0 bg-sky-500/10 border-4 border-dashed border-sky-500 rounded-xl z-50 flex items-center justify-center backdrop-blur-sm pointer-events-none">
                    <div className="bg-white p-6 rounded-full shadow-xl">
                        <UploadCloud className="w-12 h-12 text-sky-600 animate-bounce" />
                    </div>
                </div>
            )}

            {/* Upload Queue Toast */}
            {uploadQueue.length > 0 && (
                <div className="fixed bottom-6 right-6 bg-white shadow-xl rounded-lg border border-gray-200 p-4 z-50 w-80">
                    <h4 className="font-semibold mb-2">Uploading {uploadQueue.filter(q => q.status === 'uploading').length} files...</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {uploadQueue.map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                                <span className="truncate max-w-[180px]">{item.name}</span>
                                {item.status === 'uploading' && <Loader2 className="w-4 h-4 animate-spin text-sky-500" />}
                                {item.status === 'success' && <span className="text-green-500">Done</span>}
                                {item.status === 'error' && <span className="text-red-500">Error</span>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    {currentFolderId && (
                        <Button
                            variant="ghost"
                            onClick={() => setCurrentFolderId(currentFolder?.parentId || null)}
                            onDragOver={handleContainerDragOver}
                            onDragEnter={(e) => handleTargetDragEnter(e, 'root')}
                            onDragLeave={handleTargetDragLeave}
                            onDrop={(e) => handleFolderDrop(e, '')}
                            className={`transition-all border-2 ${dragTargetId === 'root'
                                ? 'bg-sky-200 border-sky-500 text-sky-900 border-dashed'
                                : isDragging
                                    ? 'border-dashed border-sky-400 bg-sky-50'
                                    : 'border-transparent'
                                }`}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Previous
                        </Button>
                    )}
                    <h2 className="text-2xl font-bold text-gray-900">
                        {currentFolderId ? 'Folder Contents' : 'Team Files (v2)'}
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-gray-100 rounded-lg p-1 mr-2">
                        <button
                            onClick={() => changeViewMode('grid')}
                            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow text-sky-600' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => changeViewMode('list')}
                            className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow text-sky-600' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            <ListIcon className="w-4 h-4" />
                        </button>
                    </div>

                    <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline"><FolderPlus className="w-4 h-4 mr-2" />New Folder</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>New Folder</DialogTitle></DialogHeader>
                            <Input placeholder="Folder Name" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} />
                            <DialogFooter><Button onClick={handleCreateFolder}>Create</Button></DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                        <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Upload</Button></DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Upload File</DialogTitle></DialogHeader>
                            <div className="py-6 text-center border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 relative">
                                <Input type="file" className="absolute inset-0 opacity-0 cursor-pointer h-full" onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
                                <div className="pointer-events-none text-center w-full"><UploadCloud className="w-10 h-10 text-gray-400 mx-auto mb-2" /><p>{selectedFile ? selectedFile.name : 'Click to Browse'}</p></div>
                            </div>
                            <DialogFooter><Button onClick={handleManualUpload} disabled={!selectedFile}>Upload</Button></DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center h-64 items-center"><Loader2 className="animate-spin text-sky-600" /></div>
            ) : (
                <>
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {folders.map(folder => (
                                <Card
                                    key={folder.id}
                                    className={`cursor-pointer transition-all ${dragTargetId === folder.id ? 'bg-sky-200 border-sky-500 border-2 border-dashed scale-105 shadow-lg' : 'bg-sky-50 border-sky-100 hover:shadow-md'}`}
                                    onClick={() => setCurrentFolderId(folder.id)}
                                    draggable
                                    onDragStart={(e) => handleItemDragStart(e, folder.id, 'folder')}
                                    onDragOver={handleContainerDragOver}
                                    onDragEnter={(e) => handleTargetDragEnter(e, folder.id)}
                                    onDragLeave={handleTargetDragLeave}
                                    onDrop={(e) => handleFolderDrop(e, folder.id)}
                                >
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <FolderIcon className={`w-8 h-8 ${dragTargetId === folder.id ? 'text-sky-700' : 'text-sky-500'}`} />
                                            <span className="font-medium text-sky-900 truncate">{folder.name}</span>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-sky-400 hover:text-red-500" onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                            {files.map(file => (
                                <Card
                                    key={file.id}
                                    className="hover:shadow-md transition-all cursor-move active:opacity-50"
                                    draggable
                                    onDragStart={(e) => handleItemDragStart(e, file.id, 'file')}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="bg-gray-100 p-2 rounded">{getFileIcon(file.type)}</div>
                                            <div className="flex">
                                                <a href={file.url} download target="_blank">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-sky-600"><Download className="w-4 h-4" /></Button>
                                                </a>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600" onClick={() => handleDeleteFile(file.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <p className="font-medium text-sm truncate mb-1" title={file.name}>{file.name}</p>
                                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                        <div className="flex items-center mt-2 text-xs text-gray-400">
                                            {file.uploader.avatar ? <img src={file.uploader.avatar} className="w-4 h-4 rounded-full mr-1" /> : <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center mr-1 text-[10px]">{file.uploader.firstName[0]}</div>}
                                            {file.uploader.firstName}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="border rounded-lg overflow-hidden bg-white">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Size</TableHead>
                                        <TableHead>Uploaded By</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="w-[100px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {folders.map(folder => (
                                        <TableRow
                                            key={folder.id}
                                            className={`cursor-pointer transition-colors ${dragTargetId === folder.id ? 'border-sky-500' : 'hover:bg-sky-50'}`}
                                            style={dragTargetId === folder.id ? { backgroundColor: '#bae6fd' } : undefined}
                                            onClick={() => setCurrentFolderId(folder.id)}
                                            draggable
                                            onDragStart={(e) => handleItemDragStart(e, folder.id, 'folder')}
                                            onDragOver={handleContainerDragOver}
                                            onDragEnter={(e) => handleTargetDragEnter(e, folder.id)}
                                            onDragLeave={handleTargetDragLeave}
                                            onDrop={(e) => handleFolderDrop(e, folder.id)}
                                        >
                                            <TableCell className="font-medium flex items-center gap-3">
                                                <FolderIcon className={`w-4 h-4 ${dragTargetId === folder.id ? 'text-sky-700' : 'text-sky-500'}`} />
                                                {folder.name}
                                            </TableCell>
                                            <TableCell>-</TableCell>
                                            <TableCell>-</TableCell>
                                            <TableCell>-</TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}>
                                                    <Trash2 className="w-4 h-4 text-red-400" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {files.map(file => (
                                        <TableRow
                                            key={file.id}
                                            draggable
                                            onDragStart={(e) => handleItemDragStart(e, file.id, 'file')}
                                            className="cursor-move"
                                        >
                                            <TableCell className="flex items-center gap-3 font-medium">
                                                {getSmallIcon(file.type)}
                                                {file.name}
                                            </TableCell>
                                            <TableCell>{formatFileSize(file.size)}</TableCell>
                                            <TableCell>{file.uploader.firstName}</TableCell>
                                            <TableCell>{new Date(file.createdAt).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <a href={file.url} download target="_blank"><Button variant="ghost" size="icon"><Download className="w-4 h-4" /></Button></a>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteFile(file.id)}><Trash2 className="w-4 h-4 text-red-400" /></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {files.length === 0 && folders.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-gray-500">Folder is empty</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </>
            )}

            {!isLoading && files.length === 0 && folders.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed rounded-lg text-gray-400">
                    <p>Folder is empty. Drag files here to upload.</p>
                </div>
            )}
        </div>
    );
}
