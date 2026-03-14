import { Injectable, Logger, BadRequestException, ForbiddenException } from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import * as fs from 'fs/promises';

const execFileAsync = promisify(execFile);

type ServiceAction = 'start' | 'stop' | 'restart' | 'shutdown' | 'free_memory';

@Injectable()
export class SystemService {
    private readonly logger = new Logger(SystemService.name);

    private async runCommand(cmd: string, args: string[], allowStderr = false): Promise<string> {
        const result = await execFileAsync(cmd, args, { timeout: 10000 });
        if (allowStderr && result.stderr) {
            return `${result.stdout}${result.stderr}`.trim();
        }
        return result.stdout.trim();
    }

    private async safeCommand(cmd: string, args: string[], allowStderr = false): Promise<string | null> {
        try {
            return await this.runCommand(cmd, args, allowStderr);
        } catch (error) {
            this.logger.debug(`Command failed: ${cmd} ${args.join(' ')}`);
            return null;
        }
    }

    private async readOsPrettyName(): Promise<string> {
        try {
            const content = await fs.readFile('/etc/os-release', 'utf-8');
            const match = content.match(/^PRETTY_NAME="?([^"\n]+)"?/m);
            if (match?.[1]) return match[1];
        } catch {
            // ignore
        }
        return `${os.type()} ${os.release()}`;
    }

    private async getDiskUsage() {
        const output = await this.safeCommand('df', ['-kP', '/']);
        if (!output) {
            return {
                mount: '/',
                totalBytes: 0,
                usedBytes: 0,
                availableBytes: 0,
                usagePercent: 0,
            };
        }
        const lines = output.split('\n').filter(Boolean);
        if (lines.length < 2) {
            return {
                mount: '/',
                totalBytes: 0,
                usedBytes: 0,
                availableBytes: 0,
                usagePercent: 0,
            };
        }
        const parts = lines[1].split(/\s+/);
        const totalKb = Number(parts[1] || 0);
        const usedKb = Number(parts[2] || 0);
        const availableKb = Number(parts[3] || 0);
        const percent = Number((parts[4] || '0').replace('%', ''));
        return {
            mount: parts[5] || '/',
            totalBytes: totalKb * 1024,
            usedBytes: usedKb * 1024,
            availableBytes: availableKb * 1024,
            usagePercent: Number.isFinite(percent) ? percent : 0,
        };
    }

    private getLoadPercent() {
        const cores = os.cpus().length || 1;
        const [load1, load5, load15] = os.loadavg();
        const loadPercent = Math.min(100, (load1 / cores) * 100);
        return { cores, load1, load5, load15, loadPercent };
    }

    private resolveServiceTargets(target?: string): string[] {
        const map: Record<string, string> = {
            backend: 'rental_backend',
            users: 'rental_users',
            'super-admin': 'rental_super_admin',
            postgres: 'rental_postgres',
            redis: 'rental_redis',
            'prisma-migrate': 'rental_prisma_migrate',
        };

        if (!target || target === 'all') {
            return Object.values(map);
        }

        const resolved = map[target];
        if (!resolved) {
            throw new BadRequestException(`Unknown service target: ${target}`);
        }
        return [resolved];
    }

    private async runDocker(args: string[]) {
        return this.runCommand('docker', args, true);
    }

    async getStatus() {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const usagePercent = totalMem > 0 ? (usedMem / totalMem) * 100 : 0;

        const [osName, dockerVersion, nginxVersion, disk, servicesOutput] = await Promise.all([
            this.readOsPrettyName(),
            this.safeCommand('docker', ['--version'], true),
            this.safeCommand('nginx', ['-v'], true),
            this.getDiskUsage(),
            this.safeCommand('docker', ['ps', '--format', '{{.Names}}|{{.Status}}'], true),
        ]);

        const services = (servicesOutput || '')
            .split('\n')
            .filter(Boolean)
            .map((line) => {
                const [name, ...rest] = line.split('|');
                return { name, status: rest.join('|') || 'unknown' };
            });

        return {
            timestamp: new Date().toISOString(),
            os: {
                name: osName,
                platform: os.platform(),
                release: os.release(),
                arch: os.arch(),
                uptimeSeconds: Math.floor(os.uptime()),
            },
            versions: {
                node: process.version,
                docker: dockerVersion || null,
                nginx: nginxVersion || null,
            },
            cpu: this.getLoadPercent(),
            memory: {
                totalBytes: totalMem,
                freeBytes: freeMem,
                usedBytes: usedMem,
                usagePercent,
            },
            disk,
            services,
        };
    }

    async runAction(action: ServiceAction, target?: string, confirm?: string) {
        if (action === 'shutdown' && confirm !== 'YES') {
            throw new ForbiddenException('Shutdown requires confirmation.');
        }

        if (action === 'free_memory') {
            await this.runDocker(['run', '--rm', '--privileged', '--pid=host', 'alpine', 'sh', '-c', 'sync; echo 3 > /proc/sys/vm/drop_caches']);
            return { ok: true };
        }

        const targets = this.resolveServiceTargets(target);
        const dockerAction = action === 'shutdown' ? 'stop' : action;
        await this.runDocker([dockerAction, ...targets]);
        return { ok: true };
    }
}
