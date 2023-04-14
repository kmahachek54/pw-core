import { test, expect } from '@playwright/test';
import expectExt from '../helpers/matchersSetup';
import { enableLogger, disableLogger } from '../helpers/loggerSetup';

test.describe('00_Example', () => {

  test.beforeEach(async ({ page }, testInfo) => {
    process.env.CI && await enableLogger(testInfo.titlePath, page);
    await page.goto(`${process.env.BASEURL}`);
  });

  test.afterEach(async () => {
    process.env.CI && await disableLogger();
  });

  test('First_test', async ({ page }) => {
    // Use PW async expect: https://playwright.dev/docs/test-assertions
    await expect(
      page,
      `Custom error message.`
    ).toHaveURL(`${process.env.BASEURL}`);
    // Use basic Jest expect: https://jestjs.io/docs/using-matchers
    expect(
      true,
      `Custom error message.`
    ).toBeTruthy();
    // Use extended Jest expect: https://jest-extended.jestcommunity.dev/docs/matchers
    expectExt(
      [1, 2, 3, 4],
      `Custom error message.`
    ).toIncludeAllMembers([1, 6, 3]);  // false
  });
});
