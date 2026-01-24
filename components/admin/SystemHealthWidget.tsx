'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Activity } from 'lucide-react';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

// Register ChartJS components
if (typeof window !== 'undefined') {
    ChartJS.register(
        ArcElement,
        Tooltip,
        Legend
    );
}

interface SystemData {
    cpu: { load: number };
    memory: { total: number; used: number; active: number };
}

export default function SystemHealthWidget() {
    const [data, setData] = useState<SystemData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/admin/system/health');
                if (response.ok) {
                    const result = await response.json();
                    setData(result);
                }
            } catch (e) {
                console.error('Failed to fetch health', e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    if (loading || !data) {
        return (
            <Card className="h-full min-h-[200px]">
                <CardHeader className="pb-2">
                    <CardTitle className="text-gray-900 flex items-center gap-2 text-base">
                        <Activity className="w-4 h-4 text-sky-500" />
                        System Live
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[140px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
                </CardContent>
            </Card>
        );
    }

    const cpuLoad = Math.round(data.cpu.load);
    // Use 'active' memory if available for accuracy, else 'used'
    const memUsed = data.memory.active > 0 ? data.memory.active : data.memory.used;
    const memPercent = Math.min(100, Math.round((memUsed / data.memory.total) * 100));

    const cpuChartData = {
        labels: ['Used', 'Free'],
        datasets: [
            {
                data: [cpuLoad, 100 - cpuLoad],
                backgroundColor: [
                    'rgb(124, 58, 237)', // Violet
                    'rgba(229, 231, 235, 0.5)', // Gray-200
                ],
                borderWidth: 0,
                cutout: '75%', // Thickness of doughnut
            },
        ],
    };

    const cpuOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false }, // Disable tooltip for clean look
        },
        animation: { duration: 500 },
    };

    return (
        <Card className="h-full">
            <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-gray-900 flex items-center gap-2 text-base">
                    <Activity className="w-4 h-4 text-sky-500" />
                    System Live
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-6 pb-12 pt-2 h-full">

                {/* CPU Circle Graph */}
                <div className="relative w-32 h-32">
                    <Doughnut data={cpuChartData} options={cpuOptions} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-bold text-gray-900">{cpuLoad}%</span>
                        <span className="text-xs text-gray-500 font-medium">CPU</span>
                    </div>
                </div>

                {/* Memory Bar */}
                <div className="w-full px-2">
                    <div className="flex justify-between items-end mb-1">
                        <span className="text-xs font-semibold text-emerald-600">Memory</span>
                        <span className="text-xs font-bold text-gray-700">{memPercent}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div
                            className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${memPercent}%` }}
                        ></div>
                    </div>
                </div>

            </CardContent>
        </Card>
    );
}
