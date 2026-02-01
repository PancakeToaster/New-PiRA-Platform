'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
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
    UploadCloud
} from 'lucide-react';
import { formatBytes } from '@/lib/utils'; // Assuming this utility exists or I'll implement simple one inline

interface ProjectFile {
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

export default function ProjectFilesPage({ params }: { params: { teamSlug: string; projectSlug: string } }) {
    const { teamSlug, projectSlug } = params;
    const [files, setFiles] = useState<ProjectFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    useEffect(() => {
        fetchFiles();
    }, []);

    async function fetchFiles() {
        try {
            const res = await fetch(`/api/projects/${teamSlug}/${projectSlug}/files`);
            if (res.ok) {
                const data = await res.json();
                setFiles(data.files);
            }
        } catch (error) {
            console.error('Failed to fetch files:', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleUpload() {
        if (!selectedFile) return;
        setIsUploading(true);

        try {
            // 1. Upload to generic generic upload API
            const formData = new FormData();
            formData.append('file', selectedFile);

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!uploadRes.ok) {
                const err = await uploadRes.json();
                throw new Error(err.error || 'Upload failed');
            }

            const uploadData = await uploadRes.json();

            // 2. create ProjectFile record
            const createRes = await fetch(`/api/projects/${teamSlug}/${projectSlug}/files`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: selectedFile.name,
                    url: uploadData.url,
                    type: selectedFile.type,
                    size: selectedFile.size
                })
            });

            if (createRes.ok) {
                setIsUploadDialogOpen(false);
                setSelectedFile(null);
                fetchFiles();
            } else {
                alert('Failed to save file info');
            }

        } catch (error: any) {
            alert(error.message || 'Failed to upload');
        } finally {
            setIsUploading(false);
        }
    }

    async function handleDelete(fileId: string) {
        if (!confirm('Are you sure you want to delete this file?')) return;

        try {
            const res = await fetch(`/api/projects/${teamSlug}/${projectSlug}/files?fileId=${fileId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setFiles(files.filter(f => f.id !== fileId));
            } else {
                alert('Failed to delete file');
            }
        } catch (error) {
            console.error('Failed to delete file:', error);
        }
    }

    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith('image/')) return <ImageIcon className="w-8 h-8 text-purple-500" />;
        if (mimeType.startsWith('video/')) return <Film className="w-8 h-8 text-red-500" />;
        if (mimeType.startsWith('audio/')) return <Music className="w-8 h-8 text-pink-500" />;
        if (mimeType.includes('pdf')) return <FileText className="w-8 h-8 text-orange-500" />;
        return <FileIcon className="w-8 h-8 text-blue-500" />;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Project Files</h2>
                <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Upload File
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Upload File</DialogTitle>
                        </DialogHeader>
                        <div className="py-6">
                            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
                                <Input
                                    type="file"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                />
                                <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                                    <UploadCloud className="w-10 h-10 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground font-medium">
                                        {selectedFile ? selectedFile.name : 'Click to select or drag file here'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Max 50MB</p>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
                                {isUploading ? 'Uploading...' : 'Upload'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {files.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-lg border border-dashed border-border">
                    <FileIcon className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">No files yet</p>
                    <p className="text-sm text-muted-foreground">Upload documents to share with the team</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {files.map((file) => (
                        <Card key={file.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-3 overflow-hidden">
                                        <div className="bg-muted/50 p-2 rounded-lg shrink-0">
                                            {getFileIcon(file.type)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-foreground truncate" title={file.name}>
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {formatFileSize(file.size)} • {new Date(file.createdAt).toLocaleDateString()}
                                            </p>
                                            <div className="flex items-center mt-2 space-x-2">
                                                <div className="flex items-center text-xs text-muted-foreground">
                                                    <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center mr-1 text-xs font-bold">
                                                        {file.uploader.avatar ? (
                                                            <img src={file.uploader.avatar} className="w-full h-full rounded-full" />
                                                        ) : (
                                                            file.uploader.firstName[0]
                                                        )}
                                                    </div>
                                                    {file.uploader.firstName}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex space-x-1">
                                        <a href={file.url} download target="_blank" rel="noopener noreferrer">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-sky-600">
                                                <Download className="w-4 h-4" />
                                            </Button>
                                        </a>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => handleDelete(file.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
