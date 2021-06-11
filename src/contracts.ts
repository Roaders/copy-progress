import { Stats } from 'fs';

export type ICommandLineArgs = {
    sourceDir?: string;
    glob?: string;
    help: boolean;
};

export type ScanResult = {
    type: 'scanResult';
    path: string;
    isFile: boolean;
    isDirectory: boolean;
    stats: Stats;
};

export type ScanOptions = {
    concurrency?: number;
};

export type TotalItems = {
    type: 'progressTotal';
    files: number;
    bytes: number;
};

export type ItemProgress = {
    type: 'itemProgress';
    totalFiles: number;
    totalBytes: number;
    completedFiles: number;
    completedBytes: number;
};
