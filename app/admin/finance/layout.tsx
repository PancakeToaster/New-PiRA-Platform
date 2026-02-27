import Link from 'next/link';
import { headers } from 'next/headers';

const NAV = [
    { href: '/admin/finance', label: 'Dashboard' },
    { href: '/admin/finance/expenses', label: 'Expenses' },
    { href: '/admin/finance/payroll', label: 'Payroll' },
    { href: '/admin/finance/salaries', label: 'Salaries' },
    { href: '/admin/finance/inventory', label: 'Inventory' },
    { href: '/admin/finance/invoices', label: 'Invoices' },
];

export default async function FinanceLayout({ children }: { children: React.ReactNode }) {
    const headersList = await headers();
    const pathname = headersList.get('x-pathname') || headersList.get('referer') || '';

    return (
        <div className="min-h-screen space-y-0">
            {/* Tab Navigation */}
            <div className="border-b border-border bg-card sticky top-0 z-10">
                <nav className="flex gap-1 px-6 overflow-x-auto" aria-label="Finance navigation">
                    {NAV.map(({ href, label }) => {
                        // Active detection via pathname match (best effort from headers)
                        const isActive = pathname.includes(href) && href !== '/admin/finance'
                            ? true
                            : href === '/admin/finance' && (pathname.endsWith('/admin/finance') || pathname === href);
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${isActive
                                    ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                                    }`}
                            >
                                {label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
            <div className="p-6">
                {children}
            </div>
        </div>
    );
}
