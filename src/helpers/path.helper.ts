import { join, relative } from 'path';
import { ICopyStats, IFileStats } from '../contracts';

export function getDestinationPath(sourceRoot: string, sourcePath: string, destinationRoot: string): string {
    return join(destinationRoot, relative(sourceRoot, sourcePath));
}

export function mapFileStats(args: {
    file: IFileStats;
    sourceDir: string;
    outDir: string;
    force?: boolean;
}): ICopyStats {
    return {
        ...args.file,
        force: args.force,
        destination: getDestinationPath(args.sourceDir, args.file.source, args.outDir),
    };
}
