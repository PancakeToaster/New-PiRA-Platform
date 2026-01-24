'use client';

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Card, CardContent } from '@/components/ui/Card';

// Register ChartJS components safely
if (typeof window !== 'undefined') {
    ChartJS.register(
        CategoryScale,
        LinearScale,
        BarElement,
        Title,
        Tooltip,
        Legend
    );
}

interface FinanceDashboardClientProps {
    data: { name: string; income: number; expense: number }[];
}

export default function FinanceDashboardClient({ data }: FinanceDashboardClientProps) {
    const chartData = {
        labels: data.map(d => d.name),
        datasets: [
            {
                label: 'Income',
                data: data.map(d => d.income),
                backgroundColor: 'rgba(16, 185, 129, 0.6)', // Emerald
                borderRadius: 4,
            },
            {
                label: 'Expenses',
                data: data.map(d => d.expense),
                backgroundColor: 'rgba(244, 63, 94, 0.6)', // Rose
                borderRadius: 4,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: '#f3f4f6',
                }
            },
            x: {
                grid: {
                    display: false
                }
            }
        }
    };

    return (
        <Card className="h-full flex flex-col">
            <CardContent className="flex-1 min-h-0 p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-4">Cash Flow History</h3>
                <div className="relative w-full h-72">
                    {data.length > 0 ? (
                        <Bar options={options} data={chartData} />
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400">
                            Insufficient data for charts.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
