'use client';

import { useNode } from '@craftjs/core';
import { useState } from 'react';

interface ImageProps {
    src?: string;
    alt?: string;
    width?: string;
    height?: string;
    objectFit?: 'cover' | 'contain' | 'fill' | 'none';
    borderRadius?: string;
}

export const Image = ({
    src = 'https://via.placeholder.com/400x300',
    alt = 'Image',
    width = '100%',
    height = 'auto',
    objectFit = 'cover',
    borderRadius = '0px',
}: ImageProps) => {
    const {
        connectors: { connect, drag },
        selected,
    } = useNode((state) => ({
        selected: state.events.selected,
    }));

    return (
        <div
            ref={(ref) => { if (ref) connect(drag(ref)); }}
            style={{
                border: selected ? '2px solid #0891b2' : '2px solid transparent',
                cursor: 'move',
                display: 'inline-block',
                width,
            }}
        >
            <img
                src={src}
                alt={alt}
                style={{
                    width: '100%',
                    height,
                    objectFit,
                    borderRadius,
                    display: 'block',
                }}
            />
        </div>
    );
};

export const ImageSettings = () => {
    const {
        actions: { setProp },
        src,
        alt,
        width,
        height,
        objectFit,
        borderRadius,
    } = useNode((node) => ({
        src: node.data.props.src,
        alt: node.data.props.alt,
        width: node.data.props.width,
        height: node.data.props.height,
        objectFit: node.data.props.objectFit,
        borderRadius: node.data.props.borderRadius,
    }));

    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setUploadError('');

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', 'image');

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Upload failed');
            }

            const data = await response.json();
            setProp((props: ImageProps) => (props.src = data.url));
        } catch (error) {
            console.error('Upload error:', error);
            setUploadError(error instanceof Error ? error.message : 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload Image
                </label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
                />
                {uploading && (
                    <p className="text-xs text-sky-600 mt-1">Uploading...</p>
                )}
                {uploadError && (
                    <p className="text-xs text-red-600 mt-1">{uploadError}</p>
                )}
            </div>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white text-gray-500">or</span>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image URL
                </label>
                <input
                    type="text"
                    value={src}
                    onChange={(e) => setProp((props: ImageProps) => (props.src = e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="https://example.com/image.jpg"
                />
                <p className="text-xs text-gray-500 mt-1">
                    Paste an image URL
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alt Text
                </label>
                <input
                    type="text"
                    value={alt}
                    onChange={(e) => setProp((props: ImageProps) => (props.alt = e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Description of image"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Width
                </label>
                <input
                    type="text"
                    value={width}
                    onChange={(e) => setProp((props: ImageProps) => (props.width = e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="100%"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Height
                </label>
                <input
                    type="text"
                    value={height}
                    onChange={(e) => setProp((props: ImageProps) => (props.height = e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="auto"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Object Fit
                </label>
                <select
                    value={objectFit}
                    onChange={(e) =>
                        setProp((props: ImageProps) => (props.objectFit = e.target.value as any))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                    <option value="cover">Cover</option>
                    <option value="contain">Contain</option>
                    <option value="fill">Fill</option>
                    <option value="none">None</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Border Radius
                </label>
                <input
                    type="text"
                    value={borderRadius}
                    onChange={(e) => setProp((props: ImageProps) => (props.borderRadius = e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="0px"
                />
            </div>
        </div>
    );
};

Image.craft = {
    props: {
        src: 'https://via.placeholder.com/400x300',
        alt: 'Image',
        width: '100%',
        height: 'auto',
        objectFit: 'cover',
        borderRadius: '0px',
    },
    related: {
        settings: ImageSettings,
    },
};
