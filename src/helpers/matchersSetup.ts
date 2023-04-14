import { test } from '@playwright/test';
import withMessage from 'jest-expect-message/dist/withMessage.js';

const expect = withMessage(test.expect);

const matchers = require('jest-extended');
expect.extend(matchers);

export default expect;
