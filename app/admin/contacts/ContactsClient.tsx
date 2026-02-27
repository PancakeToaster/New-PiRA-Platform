'use client';

import { useState } from 'react';
import { ContactSubmission } from '@prisma/client';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Search, Mail, Phone, Calendar as CalendarIcon, Filter, Inbox, MessageSquareReply, Archive, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';


interface ContactsClientProps {
    initialSubmissions: ContactSubmission[];
}

export default function ContactsClient({ initialSubmissions }: ContactsClientProps) {
    const [submissions, setSubmissions] = useState<ContactSubmission[]>(initialSubmissions);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const handleStatusChange = async (id: string, newStatus: string) => {
        setUpdatingId(id);
        try {
            const res = await fetch(`/api/admin/contacts/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) {
                throw new Error('Failed to update status');
            }

            setSubmissions(current =>
                current.map(sub =>
                    sub.id === id ? { ...sub, status: newStatus } : sub
                )
            );
            toast.success('Lead status updated');
        } catch (error) {
            toast.error('Could not update status');
            console.error(error);
        } finally {
            setUpdatingId(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'new':
                return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400 hover:bg-blue-100"><Inbox className="w-3 h-3 mr-1" /> New</Badge>;
            case 'read':
                return <Badge variant="secondary"><Mail className="w-3 h-3 mr-1" /> Read</Badge>;
            case 'replied':
                return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400 hover:bg-emerald-100"><MessageSquareReply className="w-3 h-3 mr-1" /> Replied</Badge>;
            case 'archived':
                return <Badge variant="outline" className="text-muted-foreground"><Archive className="w-3 h-3 mr-1" /> Archived</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const filteredSubmissions = submissions.filter(sub => {
        const matchesSearch =
            sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sub.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sub.message.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            {/* Filters and search */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, email, or message..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-background border-border"
                    />
                </div>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full sm:w-[180px] h-10 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                    <option value="all">All Statuses</option>
                    <option value="new">New</option>
                    <option value="read">Read</option>
                    <option value="replied">Replied</option>
                    <option value="archived">Archived</option>
                </select>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredSubmissions.length === 0 ? (
                    <div className="text-center py-12 border border-dashed rounded-lg bg-card">
                        <Mail className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-medium text-foreground">No leads found</h3>
                        <p className="text-muted-foreground mt-1">Try adjusting your search or filters.</p>
                    </div>
                ) : (
                    filteredSubmissions.map((sub) => (
                        <Card key={sub.id} className={`overflow-hidden transition-colors ${sub.status === 'new' ? 'border-primary/50 border-2' : ''}`}>
                            <div className="absolute top-0 left-0 w-1 h-full" style={{
                                backgroundColor: sub.status === 'new' ? 'hsl(var(--primary))' :
                                    sub.status === 'replied' ? '#10b981' :
                                        sub.status === 'archived' ? 'transparent' : '#64748b'
                            }} />
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row gap-6">

                                    {/* Left column: Contact info */}
                                    <div className="md:w-1/3 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold text-lg">{sub.name}</h3>
                                                <p className="text-sm text-muted-foreground flex items-center mt-1">
                                                    <Mail className="w-3 h-3 mr-2" />
                                                    <a href={`mailto:${sub.email}`} className="hover:underline">{sub.email}</a>
                                                </p>
                                                {sub.phone && (
                                                    <p className="text-sm text-muted-foreground flex items-center mt-1">
                                                        <Phone className="w-3 h-3 mr-2" />
                                                        <a href={`tel:${sub.phone}`} className="hover:underline">{sub.phone}</a>
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="pt-2 border-t border-border">
                                            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Metadata</div>
                                            <p className="text-sm flex items-center mt-1">
                                                <CalendarIcon className="w-3 h-3 mr-2 text-muted-foreground" />
                                                {format(new Date(sub.createdAt), 'MMM d, yyyy • h:mm a')}
                                            </p>
                                            {sub.referralSource && (
                                                <p className="text-sm mt-2 flex items-center">
                                                    <Badge variant="outline" className="text-xs font-normal">
                                                        Source: {sub.referralSource}
                                                    </Badge>
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right column: Message and Actions */}
                                    <div className="md:w-2/3 flex flex-col h-full pl-0 md:pl-6 md:border-l border-border mt-4 md:mt-0">
                                        <div className="flex justify-between items-center mb-4">
                                            {getStatusBadge(sub.status)}

                                            <div className="flex items-center space-x-2">
                                                <select
                                                    value={sub.status}
                                                    onChange={(e) => handleStatusChange(sub.id, e.target.value)}
                                                    disabled={updatingId === sub.id}
                                                    className="h-8 w-[130px] text-xs rounded-md border border-input bg-background px-2"
                                                >
                                                    <option value="new">Mark as New</option>
                                                    <option value="read">Mark as Read</option>
                                                    <option value="replied">Mark as Replied</option>
                                                    <option value="archived">Archive</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="bg-muted/50 rounded-md p-4 flex-1 text-sm whitespace-pre-wrap">
                                            <div className="text-xs text-muted-foreground mb-2 font-medium">MESSAGE:</div>
                                            {sub.message}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
