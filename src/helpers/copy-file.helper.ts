import { Observable, interval } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { ScanResult } from '../contracts';

export function copyFile(file: ScanResult): Observable<ScanResult> {
    return interval(10).pipe(
        take(1),
        map(() => file)
    );
}
