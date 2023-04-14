import { defineConfig, devices, Project } from '@playwright/test';
import path from 'path';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
require('dotenv').config();

const reportName = process.env.SUITE ? `${process.env.SUITE}.xml` : `TEST-result.xml`;

let browserProject: Project[] = [
    {
        name: 'setup',
        testMatch: /globalSetup\.ts/,
    }
];

switch (process.env.BROWSER) {
    case 'firefox':
        browserProject.push({
            name: 'firefox',
            dependencies: ['setup'],
            testMatch: /.*(test|spec)\.(js|ts|mjs)/,
            use: {
                ...devices['Desktop Firefox'],
                userAgent: devices['Desktop Firefox'].userAgent + ' SPS auto test run',
                contextOptions: {
                    setIgnoreHTTPSErrors: true
                },
            },
        });
        break;
    case 'webkit':
        browserProject.push({
            name: 'webkit',
            dependencies: ['setup'],
            testMatch: /.*(test|spec)\.(js|ts|mjs)/,
            use: {
                ...devices['Desktop Safari'],
                userAgent: devices['Desktop Safari'].userAgent + ' SPS auto test run',
                contextOptions: {
                    setIgnoreHTTPSErrors: true
                },
            },
        });
        break;
    case 'edge':
        browserProject.push({
            name: 'msedge',
            dependencies: ['setup'],
            testMatch: /.*(test|spec)\.(js|ts|mjs)/,
            use: {
                channel: 'msedge',
                ...devices['Desktop Edge'],
                userAgent: devices['Desktop Edge'].userAgent + ' SPS auto test run',
                contextOptions: {
                    setIgnoreHTTPSErrors: true
                },
            },
        });
        break;
    default:
        browserProject.push({
            name: 'chromium',
            dependencies: ['setup'],
            testMatch: /.*(test|spec)\.(js|ts|mjs)/,
            use: {
                channel: 'chrome',
                ...devices['Desktop Chrome'],
                userAgent: devices['Desktop Chrome'].userAgent + ' SPS auto test run',
                contextOptions: {
                    // bypassCSP: true,
                    setIgnoreHTTPSErrors: true
                },
                // launchOptions: {
                //     args: [
                //         "--disable-web-security",
                //         "--allow-insecure-localhost",
                //         "--ignore-certificate-errors",
                //         "--allow-running-insecure-content"
                //     ]
                // }
            },
        });
        break;
}

const storageStatePath = process.env.ENV && process.env.ENV.includes('prod')
    ? path.join(process.cwd(), 'results-e2e/auth/storageStateProd.json')
    : path.join(process.cwd(), 'results-e2e/auth/storageStateTest.json');

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    /*  Directory that will be recursively scanned for test files */
    /* Maximum time one test can run for. */
    timeout: process.env.TEST_TIMEOUT ?  +process.env.TEST_TIMEOUT : 30000,
    /* Maximum time expect() should wait for the condition to be met */
    expect: {
        timeout: process.env.EXPECT_TIMEOUT ? +process.env.EXPECT_TIMEOUT : 5000,
    },
    /* Fail the build on CI if you accidentally left test.only in the source code */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: process.env.RETRIES ? +process.env.RETRIES : 0,
    /* Opt out of parallel tests on CI */
    workers: process.env.WORKERS ? +process.env.WORKERS : 1,
    /* Stop test suite execution after reaching this number of failed tests and skip any tests that were not executed yet */
    maxFailures: process.env.CI ? 8 : 0,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: [
        ['junit', { outputFile: path.join(process.cwd(), `results-e2e/reports/${reportName}`) }],
        ['list']
    ],
    /* Similarly, run something once after all the tests. */
    globalTeardown: require.resolve('./src/helpers/globalTeardown'),
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions */
    use: {
        storageState: !process.env.SKIP_AUTH ? storageStatePath : undefined,
        /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit) */
        actionTimeout: process.env.ACTION_TIMEOUT ? +process.env.ACTION_TIMEOUT : 30000,
        /* Collect screenshot after each test failure. See https://playwright.dev/docs/test-configuration#automatic-screenshots */
        screenshot: 'only-on-failure',
        /* Record video only when retrying a test for the first time. See https://playwright.dev/docs/test-configuration#automatic-screenshots */
        video: 'on-first-retry',
        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: process.env.TRACER && (process.env.TRACER.toString().toLowerCase() === 'true') ? 'retain-on-failure' : 'off',
        /* Run in headless mode by default (if process.env.HEADLESS is not specified) */
        headless: !process.env.HEADLESS || process.env.HEADLESS === 'true' ? true : false,
        /* Whether to ignore HTTPS errors when sending network requests */
        ignoreHTTPSErrors: true,
        /* Slow down Playwright operations by the specified amount of milliseconds */
        launchOptions: {
            slowMo: process.env.SLOWMO ? +process.env.SLOWMO : 0,
        }
        /* Base URL to use in actions like `await page.goto('/')` */
        // baseURL: 'http://localhost:3000',
    },
    /* Configure projects for major browsers */
    projects: browserProject,
    /* Folder for test artifacts such as screenshots, videos, traces, etc. (cleaned at the start) */
    outputDir: path.join(process.cwd(), 'results-e2e-raw/')
});
