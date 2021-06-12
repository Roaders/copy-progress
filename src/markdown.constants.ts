import chalk from 'chalk';
import { UsageGuideConfig } from 'ts-command-line-args';

export type BarMode = 'files' | 'bytes' | 'both';

export type ICommandLineArgs = {
    sourceDir?: string;
    glob?: string;
    outDir: string;
    help: boolean;
    concurrentCopy: number;
    eta: boolean;
    bar: BarMode;
};

export const commandName = 'copy-progress';
const defaultConcurrentCopy = 1;

export const usageGuideInfo: UsageGuideConfig<ICommandLineArgs> = {
    arguments: {
        sourceDir: { type: String, alias: 's', optional: true },
        glob: { type: String, alias: 'g', optional: true },
        outDir: { type: String, alias: 'o' },
        concurrentCopy: { type: Number, defaultValue: defaultConcurrentCopy },
        help: { type: Boolean, alias: 'h' },
        eta: { type: Boolean, alias: 'e' },
        bar: { type: parseBar, alias: 'b', defaultValue: 'both' },
    },
    parseOptions: {
        helpArg: 'help',
    },
};

function parseBar(input: string): BarMode {
    const barMode = input as BarMode;
    switch (input as BarMode) {
        case 'bytes':
        case 'files':
            return barMode;

        default:
            console.log(`${chalk.red('Error: ')} 'bar' must be either 'files' or 'bytes'`);
            process.exit(1);
    }
}
