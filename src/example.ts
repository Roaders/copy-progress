import { streamScanPathResults, scanPathAsync } from './helpers';

async function runExample() {
    const promiseStart = Date.now();

    const promiseResult = await scanPathAsync('node_modules');

    console.log(`Promise result in ${Date.now() - promiseStart} - ${promiseResult.length}`);
    const start = Date.now();

    streamScanPathResults('node_modules')
        .pipe()
        .subscribe(
            (result) => {
                //console.log(result.path);
            },
            (error) => console.error(error),
            () => console.log(`Stream Elapsed: ${Date.now() - start}`)
        );
}

runExample();
