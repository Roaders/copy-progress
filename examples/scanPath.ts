import { streamScanPathResults } from '../src';
import { resolve } from 'path';
import { shareReplay } from 'rxjs';

async function scanPath(): Promise<void> {
    const rawPath = process.argv[2];
    const path = rawPath != null ? resolve(rawPath) : undefined;

    if (path == null) {
        console.log(`No path specified. Exiting.`);
        return process.exit(1);
    }

    console.log(`Scanning '${path}'`);

    const stream = streamScanPathResults(path).pipe(shareReplay());

    stream.subscribe({ next: (stats) => console.log(stats.source) });
}

scanPath();
