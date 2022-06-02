import { join, resolve, parse } from 'path';
import copyFiles from '../src';
import { ICopyDetails } from '../src/contracts';

const filesToCopy = process.argv.slice(2);

const copyDetails: ICopyDetails[] = filesToCopy.map((source) => ({
    source: resolve(source),
    destination: join('outputFolder', parse(source).base),
}));

console.log(`Copying files: ${copyDetails.map((detail) => `${detail.source} => ${detail.destination}`)}`);

copyFiles(copyDetails).subscribe({
    next: (progress) => console.log(`Progress: ${progress.completedBytes}/${progress.totalBytes} Bytes`),
    error: (error) => console.log(`Error during copy:`, error),
    complete: () => console.log(`Completed`),
});
