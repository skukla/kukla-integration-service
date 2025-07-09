/*
 * <license header>
 */

const { loadConfig } = require('./config');

const config = loadConfig();
jest.setTimeout(config.performance.timeouts.testing);

beforeEach(() => {});
afterEach(() => {});
