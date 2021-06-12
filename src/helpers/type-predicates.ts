import { IFileStats, ITotals } from '../contracts';

export function isIFileStats(value: unknown): value is IFileStats {
    const stats = value as IFileStats;
    return stats != null && typeof stats.source === 'string' && typeof stats.stats === 'object';
}

export function isITotals(value: unknown): value is ITotals {
    const stats = value as ITotals;
    return stats != null && typeof stats.files === 'number' && typeof stats.bytes === 'number';
}
