import { Observable } from 'rxjs';
import { scan } from 'rxjs/operators';
import { TotalItems, ScanResult, ItemProgress } from '../contracts';

export function streamTotal(scanResults: Observable<ScanResult>): Observable<TotalItems> {
    return scanResults.pipe(
        scan<ScanResult, TotalItems>(
            (totals, file) => ({
                ...totals,
                files: file.isDirectory ? totals.files : totals.files + 1,
                bytes: totals.bytes + file.stats.size,
            }),
            { type: 'progressTotal', files: 0, bytes: 0 }
        )
    );
}

export function streamProgress(results: Observable<ScanResult | TotalItems>): Observable<ItemProgress> {
    return results.pipe(
        scan<ScanResult | TotalItems, ItemProgress>(updateProgress, {
            type: 'itemProgress',
            totalFiles: 0,
            totalBytes: 0,
            completedFiles: 0,
            completedBytes: 0,
        })
    );
}

function updateProgress(progress: ItemProgress, result: ScanResult | TotalItems): ItemProgress {
    switch (result.type) {
        case 'progressTotal':
            return { ...progress, totalBytes: result.bytes, totalFiles: result.files };
        case 'scanResult':
            return {
                ...progress,
                completedBytes: progress.completedBytes + result.stats.size,
                completedFiles: result.isDirectory ? progress.completedFiles : progress.completedFiles + 1,
            };
    }
}
