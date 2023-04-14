
1. Create .credentials.sh file in the tests-e2e/ directory with the credentials. 
```
export USER_NAME="EXAMPLE_USER"
export USER_PASSWORD="EXAMPLE_PASSWORD"
# Note: if USER_PASSWORD contains \ or " symbols, please add \ symbol before it.
```

2. Create .env file in the tests-e2e/ directory with an appropriate process.env variables listed below in the table.

| Variable            | description                                        | default                        | possible values                      |
| ------------------: | -------------------------------------------------- | ------------------------------ | ------------------------------------ |
| HEADLESS            | launch browser in headless/headful mode            | true                           | true, false                          |
| BROWSER             | use + as a separator, e.g edge+firefox             | chromium                       | chromium, firefox, webkit, edge      |
| TEST_TIMEOUT        | global timeout for each test                       | 30000                          | [number_in_ms]                       |
| EXPECT_TIMEOUT      | global timeout for each expect                     | 5000                           | [number_in_ms]                       |
| ACTION_TIMEOUT      | global timeout for each PW action, like click()    | 30000                          | [number_in_ms]                       |
| SLOWMO              | slows down the actions by the specified ms         | 0                              | [number_in_ms]                       |
| WORKERS             | number of workers (test threads)                   | 1                              | [number]                             |
| TRACER              | create PW actions trace file per each failed test  | false                          | true, false                          |
| CI                  | used in CI: forbidOnly and maxFailures are applied | false                          | true, false                          |
| SUITE               | used in CI: report file name is created per suite  | TEST-results.xml               | [string]                             |
| ENV                 | invoked auth state environment flag*               | test                           | test, prod                           |
| BASEURL             | auth state is invoked for the provided url*        | -      (required)              | [string]                             |
| REPO_NAME           | creates GH repo link on test in log files          | -                              | [string]                             |

\* If you have several urls to run your tests for, consider the following possible set up in the SETUP_PATH file instead of providing BASEURL in the .env file:
```
const domain = 'some.domain.com';

process.env.BASEURL = `https://test.${domain}`;

if (process.env.ENV) {
  switch (process.env.ENV.toLowerCase()) {
    case 'prod':
      process.env.BASEURL = `https://${domain}`;
      break;
    case 'staging':
      process.env.BASEURL = `https://${domain}/staging`;
      break;
    default:
      process.env.BASEURL = `https://test.${domain}`;
      break;
  }
}
```
It allows to set url for testing via CLI instead of setting it up in .env file. Plus, auth state is invoked only once for test/prod url groups due to ENV logic in the globalSetup.ts file.

> Attention: 
> Start all the decribe block names with # prefix. If not, created screenshots and log files won't be attached to an appropriate test.

### Additional options
If CI is set to true, the forbidOnly and maxFailures options are applied.
- forbidOnly: Fail the build on CI if you accidentally left test.only in the source code
- maxFailures: Stop test suite execution after reaching 8 failed tests and skip any tests that were not executed yet.

### Authentication
When tests are launnhed for the first time, it takes some time for the authentication state to be invoked. If ENV variable is not set, the storageState is created for the test environment, otherwise set ENV to 'prod'. After auth state is invoked, it appears in the results-e2e/auth folder. All the next test runs will use an already created storageState.json file till its TTL. After TTL is reached, the auth state is invoked again. 

### Results
After tests finishes, you can observe test results in the results-e2e/ folder: 
- screenshot folder with screen and trace file (if TRACER=true) for each failed test
- log folder with log file for each test regardless its status
- reports folder with compatible junit xml files (Azure test results friendly format) 
- auth folder with an invoked auth state per ENV

### Tracer
You can observe the PW trace file in 3 ways:
- open a trace file via the terminal CLI: npx playwright show-trace [trace_file_path].zip
- use PW Trace Viewer web app: https://trace.playwright.dev/
- install "Playwright Trace Viewer for VSCode" extension: https://marketplace.visualstudio.com/items?itemName=ryanrosello-og.playwright-vscode-trace-viewer

## Dockerfile
PW provides an official Docker image. These image includes all the dependencies needed to run browsers in a Docker container, and also include the browsers themselves. Here is an example of the Dockerfile:
```
FROM mcr.microsoft.com/playwright:v1.28.0-focal

ARG BROWSER

RUN mkdir e2e
WORKDIR /e2e
COPY . .
RUN yarn
RUN if [ "$BROWSER" = "edge" ]; then npx playwright install msedge; fi
RUN if [ "$BROWSER" = "chrome" ]; then npx playwright install chrome; fi
```
> Attention: 
> Installed Playwright package version must match the Docker image version.
```
docker build -t e2e .
docker run -e USER_NAME -e USER_PASSWORD -it --rm --ipc=host --memory=6g --shm-size=1g e2e 
USER_NAME=[your_email] USER_PASSWORD=[your_pwd] xvfb-run --auto-servernum npm run test
```
> Notes:
> - --ipc=host is used since Chrome can run out of memory without this flag [Docker doc](https://docs.docker.com/engine/reference/run/#ipc-settings---ipc)
> - --shm-size=1g is used since Docker runs a container with a /dev/shm shared memory space 64MB which is typically too small for Chromium and will cause Chromium to crash when rendering large pages
> - --auto-servernum usage is recommended in order to run command with a random display number
> - xvfb-run is used on Linux agents for headed execution since it requires Xvfb to be installed. Playwright official Docker image has Xvfb pre-installed
