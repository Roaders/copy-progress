import { Stats } from 'fs';

export interface IFileDetails {
    source: string;
}

export interface IFileStats extends IFileDetails {
    stats: Stats;
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

export interface ICopyDetails extends IFileDetails {
    destination: string;
}

export interface ICopyStats extends IFileStats, ICopyDetails {}
