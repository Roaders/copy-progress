import {} from 'rxjs/operators';
import { scanPath } from './helpers';

const start = Date.now();

scanPath('node_modules')
    .pipe()
    .subscribe(
        (result) => {
            console.log(result.path);
        },
        (error) => console.error(error),
        () => console.log(`Elapsed: ${Date.now() - start}`)
    );
