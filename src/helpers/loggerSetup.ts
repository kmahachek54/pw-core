import fs from 'fs';
import path from 'path';
import { Page } from '@playwright/test';

let access: fs.WriteStream;

export async function enableLogger(file: string[], page: Page): Promise<void> {
    // file:
    // [
    //     '1.Acceptance/HealthCheckFlow.test.ts',
    //     'Preconditions_block',  // optional
    //     'HealthCheckFlow',
    //     'Transactions_tab_is_opened_with_loaded_list_content'
    // ]
    const suite = file[1];
    const test = file.reverse()[0];
    const testName = `${suite} ${test}`;
    const logPathPerSuite = path.join(process.cwd(), 'results-e2e/logs');

    // Create folder per suite for error files	
    fs.mkdirSync(logPathPerSuite, { recursive: true });

    // Create a writable stream for each file per test
    access = fs.createWriteStream(`${logPathPerSuite}/${testName}.log`)
    process.stdout.write = process.stderr.write = access.write.bind(access);

    // Write the GitHub link of the currently running test to the beginning of each log file
    console.log(`
    https://github.com/kmahachek54/${process.env.REPO_NAME}/search?q=${test}`);

    // Listen for errors
    page
        .on('console', async message => {
            if (message.type() === 'error') {
                if (message.text() === 'JSHandle@error') {
                    for (const arg of message.args())
                        console.log(await arg.jsonValue());
                }
                console.log(`--Console-msg--${message.type()}: ${message.text()}`);
            }
        })
        .on('requestfailed', request =>
            console.log(`--Failed-request--${request.failure().errorText}: ${request.url()}`))
        .on("pageerror", (err) => {
            console.log(`--Page-error--${JSON.stringify(err.message)}`)
        })
        .on('response', (response) => {
            if (response.status() >= 400) {
                console.log(`--4XX/5XX-response--${response.status()}: ${response.url()}`);
            }
        })
    return;
}

export async function disableLogger(): Promise<void> {
    // Finish error writing
    access && access.end();
    return;
}

export const log = console.log.bind(console);
