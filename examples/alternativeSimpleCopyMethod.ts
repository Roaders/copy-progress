import { join } from 'path';
import { Observable } from 'rxjs';
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

function myCopyFunction(source: string, destination: string): Promise<boolean> {
    console.log(`Copying`, { source, destination });
    return Promise.resolve(true);
}

copyFiles(copyDetails, { copyFunction: myCopyFunction }).subscribe(
    (progress) => console.log(`Progress: ${progress.completedBytes}/${progress.totalBytes} Bytes`),
    (error) => console.log(error),
    () => console.log(`Completed`)
);
