import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

export default function WikiNotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
            <div className="bg-gray-100 p-4 rounded-full mb-6">
                <FileQuestion className="w-10 h-10 text-gray-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Wiki Page Not Found</h2>
            <p className="text-gray-500 max-w-md mb-8">
                The wiki page you are looking for does not exist, has been moved, or you do not have permission to view it.
            </p>
            <Link href="/wiki">
                <button className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors">
                    Back to Wiki Overview
                </button>
            </Link>
        </div>
    );
}
