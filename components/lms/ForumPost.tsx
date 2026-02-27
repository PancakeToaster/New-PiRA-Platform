import { Card, CardContent } from '@/components/ui/Card';
import { User } from 'lucide-react';

interface ForumPostProps {
    post: {
        id: string;
        content: string;
        createdAt: Date;
        author: {
            id: string;
            firstName: string;
            lastName: string;
            avatar: string | null;
        };
    };
    currentUserId: string;
    canManage: boolean;
}

export default function ForumPost({ post, currentUserId, canManage }: ForumPostProps) {
    const isAuthor = post.author.id === currentUserId;

    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex gap-4">
                    <div className="flex-shrink-0">
                        {post.author.avatar ? (
                            <img
                                src={post.author.avatar}
                                alt={`${post.author.firstName} ${post.author.lastName}`}
                                className="w-10 h-10 rounded-full"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center">
                                <User className="w-5 h-5 text-sky-600" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <span className="font-semibold text-foreground">
                                    {post.author.firstName} {post.author.lastName}
                                </span>
                                {isAuthor && (
                                    <span className="ml-2 px-2 py-0.5 bg-sky-100 text-sky-700 text-xs font-medium rounded">
                                        You
                                    </span>
                                )}
                            </div>
                            <span className="text-sm text-muted-foreground">
                                {new Date(post.createdAt).toLocaleString()}
                            </span>
                        </div>
                        <div className="prose prose-sm max-w-none">
                            <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
