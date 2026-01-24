import { NextResponse } from 'next/server';
import { getCurrentUser, isAdmin } from '@/lib/permissions';
import si from 'systeminformation';
import { promises as fs } from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';

// Native folder size calculation (more reliable than fast-folder-size on Windows)
async function calculateFolderSize(dirPath: string): Promise<number> {
    let totalSize = 0;

    try {
        const items = await fs.readdir(dirPath, { withFileTypes: true });

        for (const item of items) {
            const itemPath = path.join(dirPath, item.name);

            // Skip node_modules and .next to speed up calculation
            if (item.name === 'node_modules' || item.name === '.next' || item.name === '.git') {
                continue;
            }

            try {
                if (item.isDirectory()) {
                    totalSize += await calculateFolderSize(itemPath);
                } else if (item.isFile()) {
                    const stats = await fs.stat(itemPath);
                    totalSize += stats.size;
                }
            } catch (err) {
                // Skip files/folders we can't access
                continue;
            }
        }
    } catch (err) {
        console.error(`Error reading directory ${dirPath}:`, err);
    }

    return totalSize;
}

export async function GET() {
    const user = await getCurrentUser();
    const userIsAdmin = await isAdmin();

    if (!user || !userIsAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Fetch system data in parallel
        const [cpu, mem, currentLoad, disk, osInfo] = await Promise.all([
            si.cpu(),
            si.mem(),
            si.currentLoad(),
            si.fsSize(),
            si.osInfo(),
        ]);

        let appSize = 0;
        try {
            console.log('[System Health] Starting app size calculation for:', process.cwd());
            const startTime = Date.now();

            // Calculate with 10 second timeout
            const sizePromise = calculateFolderSize(process.cwd());
            const timeoutPromise = new Promise<number>((_, reject) =>
                setTimeout(() => reject(new Error('Timeout after 10s')), 10000)
            );

            appSize = await Promise.race([sizePromise, timeoutPromise]);

            const duration = Date.now() - startTime;
            console.log(`[System Health] App size calculated: ${(appSize / 1024 / 1024).toFixed(2)} MB in ${duration}ms`);
        } catch (e) {
            console.error('[System Health] Failed to calculate app size:', e);
        }

        // Get database size
        let dbSize = 0;
        try {
            const result = await prisma.$queryRaw<{ size: bigint }[]>`
                SELECT pg_database_size(current_database()) as size
            `;
            if (result && result[0]) {
                dbSize = Number(result[0].size);
                console.log(`[System Health] Database size: ${(dbSize / 1024 / 1024).toFixed(2)} MB`);
            }
        } catch (e) {
            console.error('[System Health] Failed to calculate database size:', e);
        }

        // Calculate main disk usage (usually the one mounted on /)
        const mainDisk = disk.length > 0 ? disk[0] : null;

        const data = {
            cpu: {
                manufacturer: cpu.manufacturer,
                brand: cpu.brand,
                speed: cpu.speed,
                cores: cpu.cores,
                load: Math.round(currentLoad.currentLoad),
                loadUser: Math.round(currentLoad.currentLoadUser),
                loadSystem: Math.round(currentLoad.currentLoadSystem),
            },
            memory: {
                total: mem.total,
                free: mem.free,
                used: mem.used,
                active: mem.active,
                available: mem.available,
            },
            disk: mainDisk ? {
                fs: mainDisk.fs,
                type: mainDisk.type,
                size: mainDisk.size,
                used: mainDisk.used,
                use: Math.round(mainDisk.use),
                mount: mainDisk.mount,
                appSize: appSize,
                dbSize: dbSize,
            } : null,
            os: {
                platform: osInfo.platform,
                distro: osInfo.distro,
                release: osInfo.release,
                arch: osInfo.arch,
                hostname: osInfo.hostname,
                uptime: si.time().uptime,
            },
            nodeVersion: process.version,
        };

        return NextResponse.json(data);
    } catch (error) {
        console.error('Failed to fetch system health:', error);
        return NextResponse.json({ error: 'Failed to fetch system health' }, { status: 500 });
    }
}
