import { join } from 'path';
import copyFiles from '../src';
import { ICopyDetails } from '../src/contracts';

const filesToCopy = ['fileOne.txt', 'fileTwo.txt'];

const copyDetails: ICopyDetails[] = filesToCopy.map((source) => ({
    source,
    destination: join('outputFolder', source),
}));

copyFiles(copyDetails).subscribe(
    (progress) => console.log(`Progress: ${progress.completedBytes}/${progress.totalBytes} Bytes`),
    (error) => console.log(error),
    () => console.log(`Completed`)
);
