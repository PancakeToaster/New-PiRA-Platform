'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Search, Filter, Box, MapPin, AlertCircle } from 'lucide-react';

interface InventoryItem {
    id: string;
    name: string;
    sku: string | null;
    category: string | null;
    description: string | null;
    quantity: number;
    location: string | null;
    imageUrl: string | null;
}

interface InventoryViewerProps {
    initialItems: InventoryItem[];
}

export default function InventoryViewer({ initialItems }: InventoryViewerProps) {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');

    // extract unique categories
    const categories = ['All', ...Array.from(new Set(initialItems.map(i => i.category).filter(Boolean))) as string[]];

    const filteredItems = initialItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.description?.toLowerCase().includes(search.toLowerCase()) ||
            item.sku?.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-6">
            {/* Search & Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                        placeholder="Search items, SKU, or description..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${selectedCategory === cat
                                    ? 'bg-sky-500 text-white font-medium'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid View */}
            {filteredItems.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed text-gray-500">
                    <Box className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No items found matching your filter.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredItems.map(item => (
                        <Card key={item.id} className="hover:shadow-md transition-shadow flex flex-col overflow-hidden h-full">
                            <div className="aspect-video bg-gray-100 relative">
                                {item.imageUrl ? (
                                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-300">
                                        <Box className="w-12 h-12" />
                                    </div>
                                )}
                                {item.quantity <= 0 && (
                                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                        <Badge variant="destructive" className="text-lg">Out of Stock</Badge>
                                    </div>
                                )}
                            </div>
                            <CardContent className="p-4 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 line-clamp-1" title={item.name}>{item.name}</h3>
                                        <p className="text-xs text-gray-500">{item.sku || 'No SKU'}</p>
                                    </div>
                                </div>

                                {item.description && (
                                    <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1">{item.description}</p>
                                )}

                                <div className="mt-auto space-y-2 text-sm">
                                    <div className="flex items-center justify-between py-1 border-t">
                                        <span className="text-gray-500">Category</span>
                                        <span className="font-medium text-gray-900">{item.category || '-'}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-1 border-t">
                                        <span className="text-gray-500 flex items-center gap-1">
                                            <MapPin className="w-3 h-3" /> Location
                                        </span>
                                        <span className="font-medium text-gray-900">{item.location || 'Unknown'}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-1 border-t bg-gray-50 -mx-4 px-4 pt-2 -mb-2">
                                        <span className="font-medium text-gray-700">Stock Available</span>
                                        <span className={`font-bold ${item.quantity < 5 ? 'text-red-500' : 'text-green-600'}`}>
                                            {item.quantity}
                                        </span>
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
