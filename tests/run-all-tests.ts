import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { PublicKey } from '@solana/web3.js';
import { program, getNetworkConfig, getCurrentMarketId } from './helpers';

interface TestResult {
  name: string;
  success: boolean;
  error?: string;
  duration: number;
  marketId?: string;
  skipped?: boolean;
}

interface TestRunnerOptions {
  continueOnFailure?: boolean;
  verbose?: boolean;
}

class TestRunner {
  private results: TestResult[] = [];
  private currentMarketId: string | null = null;
  private startTime: number;
  private options: TestRunnerOptions;

  constructor(options: TestRunnerOptions = {}) {
    this.startTime = Date.now();
    this.options = {
      continueOnFailure: true, // Default to continuing on failure
      verbose: false,
      ...options
    };
  }

  private log(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    }[type];
    
    console.log(`${prefix} [${timestamp}] ${message}`);
    
    // Add verbose logging for errors
    if (type === 'error' && this.options.verbose) {
      console.log(`   [VERBOSE] Error details logged above`);
    }
  }

  private async runTest(testFile: string, description: string): Promise<TestResult> {
    const testStartTime = Date.now();
    this.log(`Starting: ${description}`, 'info');
    
    try {
      // Run the test using ts-mocha
      const command = `yarn run ts-mocha -p ./tsconfig.json -t 1000000 ${testFile}`;
      this.log(`Executing: ${command}`, 'info');
      
      execSync(command, { 
        stdio: 'inherit',
        cwd: process.cwd(),
        env: { ...process.env }
      });

      const duration = Date.now() - testStartTime;
      this.log(`Completed: ${description} (${duration}ms)`, 'success');
      
      return {
        name: description,
        success: true,
        duration
      };
    } catch (error) {
      const duration = Date.now() - testStartTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(`Failed: ${description} - ${errorMessage}`, 'error');
      
      return {
        name: description,
        success: false,
        error: errorMessage,
        duration
      };
    }
  }

  private async getCurrentMarketId(): Promise<string> {
    try {
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
      );
      
      const configAccount = await program.account.config.fetch(configPda);
      const marketId = configAccount.nextMarketId.toString();
      this.log(`Current market ID: ${marketId}`, 'info');
      return marketId;
    } catch (error) {
      this.log(`Failed to get market ID: ${error}`, 'error');
      throw error;
    }
  }

  private async waitForMarketCreation(): Promise<void> {
    this.log('Waiting for market creation to complete...', 'info');
    
    // Wait a bit for the transaction to be processed
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    try {
      const newMarketId = await this.getCurrentMarketId();
      if (newMarketId !== this.currentMarketId) {
        this.currentMarketId = newMarketId;
        this.log(`Market created with ID: ${this.currentMarketId}`, 'success');
      }
    } catch (error) {
      this.log(`Warning: Could not verify market creation: ${error}`, 'warning');
    }
  }

  private async updateMarketIdInTests(): Promise<void> {
    if (!this.currentMarketId) {
      this.log('No market ID available to update', 'warning');
      return;
    }

    this.log(`Updating market ID to ${this.currentMarketId} in test files...`, 'info');
    
    // Read existing market data or create new structure
    const marketIdPath = path.join(__dirname, 'market-id.json');
    let existingData: any = {};
    
    try {
      if (fs.existsSync(marketIdPath)) {
        existingData = JSON.parse(fs.readFileSync(marketIdPath, 'utf-8'));
      }
    } catch (error) {
      this.log('Could not read existing market-id.json, creating new structure', 'warning');
    }

    // Preserve existing markets structure or create new one
    const marketIdData = {
      markets: existingData.markets || {
        active: {
          id: this.currentMarketId,
          description: "Active market open for betting"
        }
      },
      currentActive: this.currentMarketId,
      timestamp: new Date().toISOString()
    };
    
    // If we don't have markets structure, create it with the current market as active
    if (!existingData.markets) {
      marketIdData.markets = {
        active: {
          id: this.currentMarketId,
          description: "Active market open for betting"
        }
      };
    } else {
      // Update the currentActive to the new market ID
      marketIdData.markets.active = {
        id: this.currentMarketId,
        description: "Active market open for betting"
      };
    }
    
    fs.writeFileSync(marketIdPath, JSON.stringify(marketIdData, null, 2));
    this.log('Updated market-id.json file with new format', 'success');
  }

  private async checkPrerequisites(): Promise<void> {
    this.log('Checking prerequisites...', 'info');
    
    // Check network connection
    try {
      const { isDevnet } = await getNetworkConfig();
      await program.provider.connection.getVersion();
      this.log(`${isDevnet ? 'Devnet' : 'Local'} connection is working`, 'success');
    } catch (error) {
      const { isDevnet } = await getNetworkConfig();
      if (isDevnet) {
        this.log('Devnet connection failed. Please check your internet connection.', 'error');
      } else {
        this.log('Local validator is not running. Please start it with: solana-test-validator', 'error');
      }
      throw new Error('Network connection not available');
    }

    // Check if key files exist
    const requiredKeys = [
      'tests/keys/keypair.json',
      'tests/keys/fee-vault.json',
      'tests/keys/user.json',
      'tests/keys/local-mint.json'
    ];

    for (const keyFile of requiredKeys) {
      if (!fs.existsSync(keyFile)) {
        this.log(`Missing required key file: ${keyFile}`, 'error');
        throw new Error(`Missing key file: ${keyFile}`);
      }
    }
    this.log('All required key files found', 'success');
  }

  private async runTestSuite(): Promise<void> {
    const { isDevnet } = await getNetworkConfig();
    const isLocalnet = !isDevnet;
    
    this.log(`Running test suite on ${isDevnet ? 'devnet' : 'localnet'}`, 'info');
    
    const tests = [
      {
        file: 'tests/create-usdc-mint.ts',
        description: 'USDC Mint Setup',
        waitForMarketId: false,
        skipOnLocalnet: false
      },
      {
        file: 'tests/config.ts',
        description: 'Configuration Setup',
        waitForMarketId: false,
        skipOnLocalnet: false
      },
      {
        file: 'tests/setup-markets.ts',
        description: 'Market Setup (Multiple States)',
        waitForMarketId: true, // Wait for market IDs since we can create markets on localnet
        skipOnLocalnet: false // Enable on localnet since we're using manual resolution
      },
      {
        file: 'tests/market/create-market.ts',
        description: 'Market Creation',
        waitForMarketId: true, // Wait for market ID since creation should succeed
        skipOnLocalnet: false
      },
      {
        file: 'tests/trade/create-order.ts',
        description: 'Order Creation',
        waitForMarketId: false,
        skipOnLocalnet: false // Enable on localnet - MPL Core will be available
      },
      {
        file: 'tests/trade/cnft-verification.ts',
        description: 'cNFT Verification (DAS)',
        waitForMarketId: false,
        skipOnLocalnet: false
      },
      {
        file: 'tests/market/resolve-market.ts',
        description: 'Market Resolution',
        waitForMarketId: false,
        skipOnLocalnet: false // Enable on localnet since we're using manual resolution
      },
      {
        file: 'tests/trade/payout-nft.ts',
        description: 'NFT Payout',
        waitForMarketId: false,
        skipOnLocalnet: false // Enable on localnet - MPL Core will be available
      }
    ];

    for (const test of tests) {
      // Check if we should skip this test on localnet
      if (test.skipOnLocalnet && isLocalnet) {
        this.log(`Skipping ${test.description} on localnet`, 'warning');
        this.results.push({
          name: test.description,
          success: true,
          duration: 0,
          skipped: true
        });
        continue;
      }

      const result = await this.runTest(test.file, test.description);
      this.results.push(result);

      if (!result.success) {
        this.log(`Test failed: ${test.description}`, 'error');
        
        if (!this.options.continueOnFailure) {
          this.log(`Stopping test suite due to failure (continueOnFailure: false)`, 'warning');
          break;
        } else {
          this.log(`Continuing with remaining tests (continueOnFailure: true)`, 'warning');
        }
      }

      if (test.waitForMarketId) {
        await this.waitForMarketCreation();
        await this.updateMarketIdInTests();
      }
    }
  }

  private printSummary(): void {
    const totalDuration = Date.now() - this.startTime;
    const successfulTests = this.results.filter(r => r.success).length;
    const failedTests = this.results.filter(r => !r.success).length;
    const skippedTests = this.results.filter(r => r.skipped).length;

    console.log('\n' + '='.repeat(60));
    console.log('🏁 TEST SUITE SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log(`Tests Run: ${this.results.length}`);
    console.log(`Successful: ${successfulTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Skipped: ${skippedTests}`);
    console.log(`Success Rate: ${((successfulTests / this.results.length) * 100).toFixed(1)}%`);
    console.log(`Continue on Failure: ${this.options.continueOnFailure ? 'Yes' : 'No'}`);

    if (this.currentMarketId) {
      console.log(`Final Market ID: ${this.currentMarketId}`);
    }

    console.log('\n📋 DETAILED RESULTS:');
    this.results.forEach((result, index) => {
      const status = result.skipped ? '⏭️' : (result.success ? '✅' : '❌');
      const duration = result.skipped ? 'skipped' : `${result.duration}ms`;
      console.log(`${index + 1}. ${status} ${result.name} (${duration})`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    if (failedTests > 0) {
      console.log('\n❌ Some tests failed. Check the logs above for details.');
      if (this.options.continueOnFailure) {
        console.log('⚠️  Test suite continued despite failures (continueOnFailure: true)');
      }
      process.exit(1);
    } else {
      console.log('\n✅ All tests passed successfully!');
    }
  }

  async run(): Promise<void> {
    try {
      this.log('🚀 Starting comprehensive test suite...', 'info');
      
      await this.checkPrerequisites();
      await this.runTestSuite();
      this.printSummary();
      
    } catch (error) {
      this.log(`Test suite failed: ${error}`, 'error');
      process.exit(1);
    }
  }
}

// Parse command line arguments
function parseArgs(): TestRunnerOptions {
  const args = process.argv.slice(2);
  const options: TestRunnerOptions = {};
  
  for (const arg of args) {
    if (arg === '--continue-on-failure' || arg === '-c') {
      options.continueOnFailure = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Test Runner Usage:
  yarn test:runner [options]

Options:
  --continue-on-failure, -c    Continue running tests even if one fails
  --verbose, -v                Enable verbose error logging
  --help, -h                   Show this help message

Examples:
  yarn test:runner                    # Stop on first failure (default)
  yarn test:runner --continue-on-failure  # Continue despite failures
  yarn test:runner -c -v              # Continue with verbose logging
`);
      process.exit(0);
    }
  }
  
  return options;
}

// Run the test suite
const options = parseArgs();
const runner = new TestRunner(options);

console.log(`🚀 Test Runner Configuration:`);
console.log(`   Continue on Failure: ${options.continueOnFailure ? 'Yes' : 'No'}`);
console.log(`   Verbose Logging: ${options.verbose ? 'Yes' : 'No'}`);
console.log('');

runner.run().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 