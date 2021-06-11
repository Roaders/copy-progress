import { Stats } from 'fs';

export type PathType = 'file' | 'directory';

export type ScanResult = {
    type: 'scanResult';
    sourcePath: string;
    pathType: PathType;
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
