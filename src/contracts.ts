import { Stats } from 'fs';

export type ScanResult = {
    path: string;
    isFile: boolean;
    isDirectory: boolean;
    stats: Stats;
};
