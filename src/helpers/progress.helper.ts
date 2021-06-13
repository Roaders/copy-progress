import { Observable } from 'rxjs';
import { scan } from 'rxjs/operators';
import { ITotals, IFilesProgress, IFileStats } from '../contracts';
import { isIFileStats, isITotals } from './type-predicates';

export function streamTotal(scanResults: Observable<IFileStats>): Observable<ITotals> {
    return scanResults.pipe(
        scan<IFileStats, ITotals>(
            (totals, file) => ({
                ...totals,
                files: totals.files + 1,
                bytes: totals.bytes + file.stats.size,
            }),
            { files: 0, bytes: 0 }
        )
    );
}

export function streamProgress(results: Observable<IFileStats | ITotals>): Observable<IFilesProgress> {
    return results.pipe(
        scan<IFileStats | ITotals, IFilesProgress>(updateProgress, {
            type: 'filesProgress',
            totalFiles: 0,
            totalBytes: 0,
            completedFiles: 0,
            completedBytes: 0,
        })
    );
}

function updateProgress(progress: IFilesProgress, result: IFileStats | ITotals): IFilesProgress {
    if (isIFileStats(result)) {
        return {
            ...progress,
            completedBytes: progress.completedBytes + result.stats.size,
            completedFiles: progress.completedFiles + 1,
        };
    } else if (isITotals(result)) {
        return { ...progress, totalBytes: result.bytes, totalFiles: result.files };
    } else {
        return progress;
    }
}
