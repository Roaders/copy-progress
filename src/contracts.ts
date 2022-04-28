import { Stats } from 'fs';
import { Observable } from 'rxjs';

export type ProgressCopyFileFunction<T> = (
    source: string,
    destination: string,
    fileStats: Stats,
    force?: boolean
) => Observable<T>;
export type AsyncCopyFileFunction = (
    source: string,
    destination: string,
    fileStats: Stats,
    force?: boolean
) => Promise<unknown>;

export interface ICopyOptions {
    concurrentCopy?: number;
    force?: boolean;
    copyFunction?: AsyncCopyFileFunction;
}

export interface ICopyFileProgressOptions<T> {
    concurrentCopy?: number;
    force?: boolean;
    copyFunction: ProgressCopyFileFunction<T>;
}

export type RequiredOptions<
    TProgress,
    TOptions extends ICopyOptions | ICopyFileProgressOptions<TProgress>
> = TOptions extends ICopyOptions ? Required<ICopyOptions> : Required<ICopyFileProgressOptions<TProgress>>;

export type ScanOptions = {
    concurrency?: number;
};

export type ITotals = {
    files: number;
    bytes: number;
};

/**
 * Mostly copied from progress-stream types
 */
export interface IStreamProgress {
    type: 'fileStreamProgress';
    stats: IFileStats;
    percentage: number;
    transferred: number;
    length: number;
    remaining: number;
    eta: number;
    runtime: number;
    delta: number;
    speed: number;
}

export interface IFilesProgress {
    type: 'filesProgress';
    totalFiles: number;
    completedFiles: number;
    totalBytes: number;
    completedBytes: number;
    started: number;
    elapsed: number;
}

export interface IFileDetails {
    source: string;
}

export interface IFileStats extends IFileDetails {
    stats: Stats;
}

export interface ICopyDetails extends IFileDetails {
    destination: string;
    force?: boolean;
}

export interface ICopyStats extends IFileStats, ICopyDetails {}

export type CopyDetails = ICopyStats | ICopyDetails;
