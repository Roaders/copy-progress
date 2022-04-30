import { ICopyStats, IFilesProgress, IFileStats, IStreamProgress, ITotals } from '../contracts';

export function isIFileStats(value: unknown): value is IFileStats {
    const stats = value as IFileStats;
    return stats != null && typeof stats.source === 'string' && typeof stats.stats === 'object';
}

export function isITotals(value: unknown): value is ITotals {
    const stats = value as ITotals;
    return stats != null && typeof stats.files === 'number' && typeof stats.bytes === 'number';
}

export function isICopyStats(value: unknown): value is ICopyStats {
    const stats = value as ICopyStats;
    return isIFileStats(value) && typeof stats.source === 'string';
}

export function isDefined<T>(value: T | null | undefined): value is T {
    return value != null;
}

export function isIStreamProgress(value: unknown): value is IStreamProgress {
    const streamProgress = value as IStreamProgress;
    return (
        streamProgress.type === 'fileStreamProgress' &&
        typeof streamProgress.stats === 'object' &&
        new Array<keyof IStreamProgress>(
            'percentage',
            'transferred',
            'length',
            'remaining',
            'eta',
            'runtime',
            'delta',
            'speed'
        ).every((key) => typeof streamProgress[key] === 'number')
    );
}

export function isIFilesProgress(value: unknown): value is IFilesProgress {
    const fileProgress = value as IFilesProgress;
    return (
        fileProgress.type === 'filesProgress' &&
        new Array<keyof IFilesProgress>(
            'totalFiles',
            'completedFiles',
            'totalBytes',
            'completedBytes',
            'started',
            'elapsed'
        ).every((key) => typeof fileProgress[key] === 'number')
    );
}
