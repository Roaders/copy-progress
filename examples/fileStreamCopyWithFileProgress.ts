import { join, relative } from 'path';
import prettyBytes from 'pretty-bytes';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import copyFiles, { fileStreamCopy, streamScanPathResults } from '../src';
import { ICopyDetails, IFilesProgress } from '../src/contracts';

const filesToCopy = streamScanPathResults(join(process.cwd(), 'node_modules'));

const copyDetails: Observable<ICopyDetails> = filesToCopy.pipe(
    map((fileStats) => ({
        source: fileStats.source,
        destination: join(process.cwd(), 'tmpOutFolder', relative(process.cwd(), fileStats.source)),
    }))
);

copyFiles(copyDetails, { copyFunction: fileStreamCopy }).subscribe(
    (progress) => {
        switch (progress.type) {
            case 'filesProgress':
                console.log(formatProgressMessage(progress));
                break;
            case 'fileStreamProgress':
                console.log(`${progress.stats.source}: ${progress.percentage}% ${prettyBytes(progress.speed)}/s`);
        }
    },
    (error) => console.log(error),
    () => console.log(`Completed`)
);

function formatProgressMessage(progress: IFilesProgress): string {
    const files = `${progress.completedFiles}/${progress.totalFiles}`;
    const bytes = `${progress.completedBytes}/${progress.totalBytes}`;
    return `Progress: ${files} files ${bytes} Bytes`;
}
