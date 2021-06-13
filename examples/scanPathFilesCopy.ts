import { join } from 'path';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import copyFiles, { streamScanPathResults } from '../src';
import { ICopyDetails } from '../src/contracts';

/**
 * scans the provided path for all files in all sub directories
 */
const filesToCopy = streamScanPathResults('../node_modules');

const copyDetails: Observable<ICopyDetails> = filesToCopy.pipe(
    map((fileStats) => ({
        source: fileStats.source,
        destination: join('outputFolder', fileStats.source),
    }))
);

copyFiles(copyDetails).subscribe(
    (progress) => console.log(`Progress: ${progress.completedBytes}/${progress.totalBytes} Bytes`),
    (error) => console.log(error),
    () => console.log(`Completed`)
);
