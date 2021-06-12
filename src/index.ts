import { empty, Observable } from 'rxjs';
import { IProgress, ICopyDetails } from './contracts';
import { streamScanPathResults } from './helpers';

export * from './helpers';

export function copyFiles(files: Array<ICopyDetails> | Observable<ICopyDetails>): Observable<IProgress> {
    return empty();
}

streamScanPathResults('node_modules').subscribe((path) => console.log(path.source));
