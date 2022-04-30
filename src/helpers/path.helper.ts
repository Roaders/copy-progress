import { join, relative } from 'path';
import { ICopyStats, IFileStats } from '../contracts';

export function getDestinationPath(sourceRoot: string, sourcePath: string, destinationRoot: string): string {
    return join(destinationRoot, relative(sourceRoot, sourcePath));
}

export function mapFileStats(args: { file: IFileStats; sourceDir: string; outDir: string }): ICopyStats {
    return {
        ...args.file,
        destination: getDestinationPath(args.sourceDir, args.file.source, args.outDir),
    };
}
