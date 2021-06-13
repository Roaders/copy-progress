import { Stats } from 'fs';
import { Observable } from 'rxjs';

export type ProgressCopyFileFunction<T> = (source: string, destination: string) => Observable<T>;
export type AsyncCopyFileFunction = (source: string, destination: string) => Promise<unknown>;

export interface ICopyOptions {
    concurrentCopy?: number;
    copyFunction?: ProgressCopyFileFunction<unknown> | AsyncCopyFileFunction;
}

export type ScanOptions = {
    concurrency?: number;
};

export type ITotals = {
    files: number;
    bytes: number;
};

export type IProgress = {
    totalFiles: number;
    totalBytes: number;
    completedFiles: number;
    completedBytes: number;
};

export interface IFileDetails {
    source: string;
}

export interface IFileStats extends IFileDetails {
    stats: Stats;
}

export interface ICopyDetails extends IFileDetails {
    destination: string;
}

export interface ICopyStats extends IFileStats, ICopyDetails {}

export type CopyDetails = ICopyStats | ICopyDetails;
