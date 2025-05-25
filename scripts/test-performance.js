#!/usr/bin/env node

const { main } = require('../actions/backend/get-products');
const { PerformanceMetrics } = require('../actions/core/performance');
const { testDeployedApi } = require('../tests/performance/lib/api-tester');
const createTestRunner = require('../tests/performance/lib/runner/test-runner');
const testConfig = require('../config/test-performance');
const fs = require('fs');
const path = require('path');
const { default: ora } = require('ora');
const chalk = require('chalk').default;
require('dotenv').config();

// Add delay utility
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Add baseline metrics handling
const BASELINE_FILE = path.join(__dirname, '../config/baseline-metrics.json');

function loadBaseline() {
    try {
        return JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8'));
    } catch (error) {
        return {};
    }
}

function saveBaseline(data) {
    fs.writeFileSync(BASELINE_FILE, JSON.stringify(data, null, 2));
}

function compareWithBaseline(current, baseline, thresholds) {
    const comparison = {};
    
    for (const [metric, value] of Object.entries(current)) {
        if (metric in baseline && metric in thresholds) {
            const baselineValue = baseline[metric];
            const threshold = thresholds[metric];
            const diff = value - baselineValue;
            const percentChange = (diff / baselineValue) * 100;
            
            comparison[metric] = {
                current: value,
                baseline: baselineValue,
                diff,
                percentChange,
                threshold: threshold * 100,
                status: Math.abs(percentChange) <= threshold * 100 ? 'within_threshold' : 
                        percentChange > 0 ? 'above_threshold' : 'below_threshold'
            };
        }
    }
    
    return comparison;
}

function formatMetricValue(metric, value) {
    switch (metric) {
        case 'executionTime':
            return `${(value / 1000).toFixed(2)}s`;
        case 'memory':
            return `${(value / 1024 / 1024).toFixed(1)}MB`;
        case 'compression':
            return `${value}%`;
        default:
            return value.toString();
    }
}

// Create a wrapped version of ora that includes delays
function createDelayedSpinner(text) {
    const spinner = ora(text);
    const originalSucceed = spinner.succeed.bind(spinner);
    const originalFail = spinner.fail.bind(spinner);
    const originalWarn = spinner.warn.bind(spinner);

    spinner.succeed = async (text) => {
        await delay(300); // Consistent delay before each message
        originalSucceed(text);
    };

    spinner.fail = async (text) => {
        await delay(300);
        originalFail(text);
    };

    spinner.warn = async (text) => {
        await delay(300);
        originalWarn(text);
    };

    return spinner;
}

function parseCommandLineArgs(args) {
    const options = {
        environment: testConfig.defaults.environment,
        iterations: testConfig.defaults.iterations,
        format: testConfig.defaults.format
    };
    let scenarioName = null;

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        switch (arg) {
            case '--env':
            case '-e':
                options.environment = args[++i];
                break;
            case '--iterations':
            case '-i':
                options.iterations = parseInt(args[++i], 10);
                break;
            case '--format':
            case '-f':
                options.format = args[++i];
                break;
            case '--scenario':
            case '-s':
                scenarioName = args[++i];
                break;
            case '--help':
            case '-h':
                printHelp();
                process.exit(0);
        }
    }

    return { options, scenarioName };
}

function printHelp() {
    console.log(`
Performance Testing Tool

Usage:
  node scripts/test-performance.js [options]

Options:
  -e, --env <environment>    Test environment (local|deployed|both) [default: ${testConfig.defaults.environment}]
  -i, --iterations <number>  Number of test iterations [default: ${testConfig.defaults.iterations}]
  -f, --format <format>     Output format (csv|json) [default: ${testConfig.defaults.format}]
  -s, --scenario <name>     Run a specific scenario (small|medium|large)
  -h, --help               Show this help message

Test Scenarios:
  ${testConfig.scenarios.map(s => `${s.name}: ${s.params.limit} products`).join('\n  ')}

Examples:
  node scripts/test-performance.js --env local --scenario small
  node scripts/test-performance.js --env deployed --iterations 5
  node scripts/test-performance.js --env both --format json
    `);
}

function validateEnvironment(environment) {
    if (!['local', 'deployed', 'both'].includes(environment)) {
        console.error('Error: Environment must be one of: local, deployed, both');
        process.exit(1);
    }
}

function filterScenarios(scenarios, scenarioName) {
    if (!scenarioName) return scenarios;
    
    const filtered = scenarios.filter(s => s.name.toLowerCase().includes(scenarioName.toLowerCase()));
    if (filtered.length === 0) {
        console.error(`No scenario found matching: ${scenarioName}`);
        process.exit(1);
    }
    return filtered;
}

function getConfig() {
    return {
        deployed: {
            baseUrl: process.env.API_BASE_URL || 'https://285361-188maroonwallaby-stage.adobeio-static.net/api/v1/web/kukla-integration-service',
            auth: {
                commerceUrl: process.env.COMMERCE_URL,
                commerceAdminUsername: process.env.COMMERCE_ADMIN_USERNAME,
                commerceAdminPassword: process.env.COMMERCE_ADMIN_PASSWORD
            }
        }
    };
}

function createGetProductsTestRunner(options) {
    async function executeLocalTest(scenario) {
        const startTime = performance.now();
        const startMemory = process.memoryUsage().heapUsed;

        const rawParams = {
            __ow_query: { env: 'dev' },
            ...scenario.params,
            LOG_LEVEL: 'info',
            COMMERCE_URL: process.env.COMMERCE_URL,
            COMMERCE_ADMIN_USERNAME: process.env.COMMERCE_ADMIN_USERNAME,
            COMMERCE_ADMIN_PASSWORD: process.env.COMMERCE_ADMIN_PASSWORD
        };

        // Override ora for this test run
        const originalOra = global.ora;
        global.ora = createDelayedSpinner;

        try {
            const result = await main(rawParams);
            
            // Restore original ora
            global.ora = originalOra;

            if (result.statusCode >= 400) {
                throw new Error(result.body.error || 'Unknown error occurred');
            }

            const endTime = performance.now();
            const endMemory = process.memoryUsage().heapUsed;
            const perf = result.body.performance || {};
            
            return {
                success: true,
                metrics: {
                    executionTime: endTime - startTime,
                    memory: endMemory - startMemory,
                    products: perf.productCount || 0,
                    categories: perf.categoryCount || 0,
                    compression: perf.compression?.savingsPercent || null
                }
            };
        } catch (error) {
            // Restore original ora
            global.ora = originalOra;
            throw error;
        }
    }

    async function executeDeployedTest(scenario) {
        // Override ora for this test run
        const originalOra = global.ora;
        global.ora = createDelayedSpinner;

        try {
            const result = await testDeployedApi({
                baseUrl: options.config.deployed.baseUrl,
                auth: options.config.deployed.auth,
                limit: scenario.params.limit,
                onProgress: async (step) => {
                    const spinner = ora(step).start();
                    await delay(300);
                    spinner.succeed();
                }
            });

            // Restore original ora
            global.ora = originalOra;

            if (!result.success) {
                throw new Error(result.error);
            }

            const perf = result.metrics.performance || {};
            const metrics = {
                executionTime: perf.executionTime ? parseFloat(perf.executionTime) * 1000 : result.metrics.executionTime * 1000,
                memory: perf.memory?.peak ? Math.abs(perf.memory.peak * 1024 * 1024) : Math.abs(result.metrics.memoryUsed * 1024 * 1024),
                products: perf.productCount || 0,
                categories: perf.categoryCount || 0,
                compression: null // Initialize compression as null
            };

            // Only set compression if it's a valid number
            if (perf.compression?.savingsPercent && !isNaN(perf.compression.savingsPercent)) {
                metrics.compression = parseFloat(perf.compression.savingsPercent);
            }

            return {
                success: true,
                metrics
            };
        } catch (error) {
            // Restore original ora
            global.ora = originalOra;
            throw error;
        }
    }

    return createTestRunner({
        ...options,
        baseline: {
            maxAgeDays: 7,
            thresholds: {
                executionTime: 0.10,
                memory: 0.10,
                products: 0.01,
                categories: 0.01,
                compression: 0.10
            }
        },
        executeLocalTest,
        executeDeployedTest
    });
}

function printTestConfiguration(options) {
    console.log('\n🔍 Test Configuration:');
    console.log(`Environment: ${options.environment}`);
    console.log(`Iterations: ${options.iterations}`);
    console.log(`Format: ${options.format}\n`);
}

function printTestSummary(results) {
    console.log('\n📋 Test Summary:');
    
    const baseline = loadBaseline();
    
    for (const env of ['local', 'deployed']) {
        if (results[env].length > 0) {
            console.log(`\n${env.charAt(0).toUpperCase() + env.slice(1)} Environment:`);
            
            for (const { scenario, result } of results[env]) {
                console.log(`\n  ${scenario.name}:`);
                console.log(`  ${result.success ? chalk.green('✓ Passed') : chalk.red('✗ Failed')}`);
                
                if (result.success) {
                    const baselineData = baseline[env]?.[scenario.name];
                    if (baselineData) {
                        const comparison = compareWithBaseline(
                            result.metrics,
                            baselineData.metrics,
                            testConfig.thresholds
                        );
                        
                        let scenarioStatus = 'stable';
                        let significantChanges = [];
                        
                        for (const [metric, data] of Object.entries(comparison)) {
                            // Skip compression metric for local tests
                            if (env === 'local' && metric === 'compression') {
                                continue;
                            }
                            
                            // Skip metrics with invalid values
                            if (isNaN(data.percentChange) || !isFinite(data.percentChange)) {
                                continue;
                            }
                            
                            if (data.status !== 'within_threshold') {
                                significantChanges.push({
                                    metric,
                                    change: data.percentChange,
                                    isPositive: (metric === 'executionTime' || metric === 'memory') ? 
                                        data.percentChange < 0 : data.percentChange > 0
                                });
                                
                                if (scenarioStatus === 'stable') {
                                    scenarioStatus = significantChanges[0].isPositive ? 'improved' : 'degraded';
                                }
                            }
                        }
                        
                        // Print scenario summary
                        if (significantChanges.length > 0) {
                            const mostSignificant = significantChanges.reduce((prev, curr) => 
                                Math.abs(curr.change) > Math.abs(prev.change) ? curr : prev
                            );
                            
                            const summaryColor = scenarioStatus === 'improved' ? 'green' : 
                                               scenarioStatus === 'degraded' ? 'red' : 'blue';
                            
                            const changeValue = Math.abs(mostSignificant.change).toFixed(1);
                            console.log(chalk[summaryColor](
                                `  Summary: Performance ${scenarioStatus}. Most significant change: ` +
                                `${mostSignificant.metric} ${mostSignificant.change > 0 ? 'increased' : 'decreased'} ` +
                                `by ${changeValue}%`
                            ));
                        } else {
                            console.log(chalk.green('  Summary: Performance stable within thresholds'));
                        }
                        
                        // Update baseline if it's significantly better
                        let shouldUpdateBaseline = false;
                        for (const [metric, data] of Object.entries(comparison)) {
                            // Skip compression metric for local tests when considering baseline updates
                            if (env === 'local' && metric === 'compression') {
                                continue;
                            }
                            
                            if (!isNaN(data.percentChange) && isFinite(data.percentChange) &&
                                data.percentChange < 0 && Math.abs(data.percentChange) > data.threshold) {
                                shouldUpdateBaseline = true;
                                break;
                            }
                        }
                        
                        if (shouldUpdateBaseline) {
                            baseline[env] = baseline[env] || {};
                            baseline[env][scenario.name] = {
                                timestamp: new Date().toISOString(),
                                metrics: result.metrics
                            };
                            saveBaseline(baseline);
                            console.log(chalk.green('  ℹ New baseline set due to significant improvement'));
                        }
                    } else {
                        // No baseline exists, create one
                        baseline[env] = baseline[env] || {};
                        baseline[env][scenario.name] = {
                            timestamp: new Date().toISOString(),
                            metrics: result.metrics
                        };
                        saveBaseline(baseline);
                        console.log(chalk.blue('  ℹ Initial baseline set'));
                    }
                }
            }
        }
    }
}

async function runEnvironmentTests(testRunner, scenarios, environment, results) {
    console.log(`📊 ${environment.charAt(0).toUpperCase() + environment.slice(1)} Environment Tests:`);
    
    for (const scenario of scenarios) {
        const runMethod = environment === 'local' ? 'runLocalTest' : 'runDeployedTest';
        
        const testResult = await testRunner[runMethod](scenario);
        
        if (testResult.success) {
            results[environment].push({ scenario, result: testResult });
        }
    }
}

async function runAllTests() {
    const { options, scenarioName } = parseCommandLineArgs(process.argv.slice(2));
    validateEnvironment(options.environment);
    
    const spinner = ora('Loading test configuration...').start();
    const config = getConfig();
    const scenarios = filterScenarios(testConfig.scenarios, scenarioName);
    spinner.succeed('Test configuration loaded');
    
    printTestConfiguration({
        ...options,
        scenarios: scenarios.map(s => s.name).join(', ')
    });
    
    const results = {
        local: [],
        deployed: []
    };
    
    const testRunner = createGetProductsTestRunner({
        config,
        iterations: options.iterations,
        format: options.format
    });
    
    if (['local', 'both'].includes(options.environment)) {
        await runEnvironmentTests(testRunner, scenarios, 'local', results);
    }
    
    if (['deployed', 'both'].includes(options.environment)) {
        await runEnvironmentTests(testRunner, scenarios, 'deployed', results);
    }
    
    printTestSummary(results);
}

// Run the tests
runAllTests().catch(error => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
}); 