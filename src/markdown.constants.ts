import { UsageGuideConfig } from 'ts-command-line-args';

export type ICommandLineArgs = {
    sourceDir?: string;
    glob?: string;
    outDir: string;
    help: boolean;
    concurrentCopy: number;
    eta: boolean;
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
    },
    parseOptions: {
        helpArg: 'help',
    },
};
