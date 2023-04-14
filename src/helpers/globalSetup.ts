import fs from 'fs';
import path from 'path';
import { test } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

// Remove custom sub-folders for test artifacts except auth folder
const resultsFolder = path.join(process.cwd(), 'results-e2e/');
if (fs.existsSync(resultsFolder)) {
    for (const subFolder of fs.readdirSync(resultsFolder)) {
        if (!subFolder.includes('auth')) { fs.rmSync(resultsFolder + subFolder, { recursive: true, force: true }); }
    }
}

let storageFile = path.join(process.cwd(), `results-e2e/auth/storageStateTest.json`);
if (process.env.ENV && process.env.ENV.includes('prod')) {
    storageFile = path.join(process.cwd(), `results-e2e/auth/storageStateProd.json`);
}

const currentTS = new Date().getTime();

// Invoke auth state if needed
(!fs.existsSync(storageFile) ||
    (fs.existsSync(storageFile) &&
        ((JSON.parse(fs.readFileSync(storageFile, 'utf8')).cookies[0].expires - Math.floor(currentTS/1000)) / 60) < 3)
) && test('Global_setup', async ({ browser }) => {
    // Launch browser and log in if storageState.json does not exist OR auth expires soon
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();
    await page.goto(process.env.BASEURL);
    await page.getByPlaceholder('Username').fill(process.env.USER_NAME);
    await page.getByPlaceholder('Password').fill(process.env.USER_PASSWORD);
    await page.locator('#login-button').click();
    await page.waitForURL(`${process.env.BASEURL}/inventory.html`);
    await page.context().storageState({ path: storageFile });
    await browser.close();
});
