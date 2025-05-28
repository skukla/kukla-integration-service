const chalk = require('chalk').default;

// Add delay utility
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function displayMetrics(metrics) {
    console.log('\n📊 Test Metrics:');
    console.log(`• Products processed: ${metrics.products}`);
    console.log(`• Categories processed: ${metrics.categories}`);
    console.log(`• Memory used: ${(metrics.memory / 1024 / 1024).toFixed(1)}MB`);
    console.log(`• Execution time: ${(metrics.executionTime / 1000).toFixed(2)}s`);
    
    if (metrics.compression !== null) {
        console.log(`• Compression: ${metrics.compression}%`);
    }
    
    console.log(); // Empty line for readability
}

function createTestRunner(options = {}) {
    const onProgress = async (step) => {
        if (options.onProgress) {
            await delay(300); // Add delay between steps
            options.onProgress(step);
        }
    };
    
    const executeLocalTestImpl = options.executeLocalTest || defaultExecuteLocalTest;
    const executeDeployedTestImpl = options.executeDeployedTest || defaultExecuteDeployedTest;

    async function runLocalTest(scenario) {
        try {
            console.log(`\n🔄 Running local test for "${scenario.name}"...`);
            const result = await executeLocalTestImpl(scenario, onProgress);
            console.log(chalk.green('✅ Test completed successfully'));
            
            await displayMetrics(result.metrics);
            return result;
        } catch (error) {
            console.error(chalk.red(`❌ Error in local test: ${error.message}`));
            return { success: false, error };
        }
    }

    async function runDeployedTest(scenario) {
        try {
            console.log(`\n🔄 Running deployed test for "${scenario.name}"...`);
            const result = await executeDeployedTestImpl(scenario, onProgress);
            console.log(chalk.green('✅ Test completed successfully'));
            
            await displayMetrics(result.metrics);
            return result;
        } catch (error) {
            console.error(chalk.red(`❌ Error in deployed test: ${error.message}`));
            return { success: false, error };
        }
    }

    async function defaultExecuteLocalTest() {
        throw new Error('executeLocalTest must be implemented');
    }

    async function defaultExecuteDeployedTest() {
        throw new Error('executeDeployedTest must be implemented');
    }

    return {
        runLocalTest,
        runDeployedTest
    };
}

module.exports = createTestRunner; 