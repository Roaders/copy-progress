import { join } from 'path';
import { Observable, EMPTY } from 'rxjs';
import { map } from 'rxjs/operators';
import copyFiles, { streamScanPathResults } from '../src';
import { ICopyDetails } from '../src/contracts';

const filesToCopy = streamScanPathResults('../node_modules');

const copyDetails: Observable<ICopyDetails> = filesToCopy.pipe(
    map((fileStats) => ({
        source: fileStats.source,
        destination: join('outputFolder', fileStats.source),
    }))
);

type MyProgressInfo = {
    bytesComplete: number;
    bytesLeft: number;
    bytesPerSecond: number;
};

function myCopyFunction(source: string, destination: string): Observable<MyProgressInfo> {
    console.log(`Copying`, { source, destination });
    return EMPTY;
}

copyFiles(copyDetails, { copyFunction: myCopyFunction }).subscribe(
    (progress) => console.log(`Progress: ${progress.completedBytes}/${progress.totalBytes} Bytes`),
    (error) => console.log(error),
    () => console.log(`Completed`)
);
