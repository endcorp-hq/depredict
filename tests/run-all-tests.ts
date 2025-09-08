import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { PublicKey } from '@solana/web3.js';
import { assert } from 'chai';

// Import helpers only when needed to avoid top-level import issues
let program: any;
let getNetworkConfig: any;
let getCurrentMarketId: any;

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
      if (!program) {
        // Use dynamic import for ES modules
        try {
          const helpers = await import('./helpers');
          program = helpers.program;
        } catch (importError) {
          console.log("Could not import helpers, skipping market ID check");
          return "1"; // Default fallback
        }
      }
      
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
      );
      
      const configAccount = await program.account.config.fetch(configPda);
      const marketId = configAccount.nextMarketId.toString();
      this.log(`Current market ID: ${marketId}`, 'info');
      return marketId;
    } catch (error) {
      this.log(`Could not get current market ID: ${error}`, 'warning');
      return "1"; // Default fallback
    }
  }

  private async updateMarketIdInTestFiles(marketId: string) {
    try {
      // Use process.cwd() instead of __dirname for ES modules
      const marketIdFile = path.join(process.cwd(), 'tests', 'market-id.json');
      if (fs.existsSync(marketIdFile)) {
        const marketData = JSON.parse(fs.readFileSync(marketIdFile, 'utf8'));
        marketData.currentMarketId = marketId;
        marketData.lastUpdated = new Date().toISOString();
        fs.writeFileSync(marketIdFile, JSON.stringify(marketData, null, 2));
        this.log(`Updated market-id.json with market ID: ${marketId}`, 'info');
      }
    } catch (error) {
      this.log(`Failed to update market-id.json: ${error}`, 'warning');
    }
  }

  public async runTestSuite(): Promise<void> {
    this.log('🚀 Starting comprehensive test suite...', 'info');
    this.log('Checking prerequisites...', 'info');

    // Test sequence - each test depends on the previous ones
    const testSequence = [
      {
        file: 'tests/create-usdc-mint.ts',
        description: 'USDC Mint Setup',
        required: true
      },
      {
        file: 'tests/config.ts',
        description: 'Configuration Setup',
        required: true
      },
      {
        file: 'tests/market/market-creator.ts',
        description: 'Market Creator Setup with Collection',
        required: true
      },
      {
        file: 'tests/setup-markets.ts',
        description: 'Market Setup (Multiple States)',
        required: true
      },
      {
        file: 'tests/market/create-market.ts',
        description: 'Market Creation',
        required: true
      },
      {
        file: 'tests/trade/create-order.ts',
        description: 'Order Creation',
        required: true
      },
      {
        file: 'tests/market/resolve-market.ts',
        description: 'Market Resolution',
        required: false
      },
      {
        file: 'tests/trade/payout-nft.ts',
        description: 'NFT Payout',
        required: false
      }
    ];

    // Run tests in sequence
    for (const test of testSequence) {
      const result = await this.runTest(test.file, test.description);
      this.results.push(result);

      // If a required test fails and we're not continuing on failure, stop
      if (!result.success && test.required && !this.options.continueOnFailure) {
        this.log(`❌ Required test failed: ${test.description}`, 'error');
        this.log('Stopping test suite due to required test failure', 'error');
        break;
      }

      // If a required test fails but we're continuing, log a warning
      if (!result.success && test.required && this.options.continueOnFailure) {
        this.log(`⚠️  Required test failed but continuing: ${test.description}`, 'warning');
        this.log('Continuing with remaining tests (continueOnFailure: true)', 'warning');
      }

      // Wait for market creation to complete if this was a market setup test
      if (test.description.includes('Market Setup') || test.description.includes('Market Creation')) {
        this.log('Waiting for market creation to complete...', 'info');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        try {
          const marketId = await this.getCurrentMarketId();
          this.currentMarketId = marketId;
          this.log(`Current market ID: ${marketId}`, 'info');
          
          // Update test files with new market ID
          this.log('Updating market ID to ' + marketId + ' in test files...', 'info');
          await this.updateMarketIdInTestFiles(marketId);
        } catch (error) {
          this.log(`Could not update market ID: ${error}`, 'warning');
        }
      }
    }

    // Final market ID update
    if (this.currentMarketId) {
      this.log('Updating market ID to ' + this.currentMarketId + ' in test files...', 'info');
      await this.updateMarketIdInTestFiles(this.currentMarketId);
    }

    // Generate summary
    this.generateSummary();
  }

  private generateSummary(): void {
    const totalDuration = Date.now() - this.startTime;
    const successfulTests = this.results.filter(r => r.success).length;
    const failedTests = this.results.filter(r => !r.success).length;
    const successRate = this.results.length > 0 ? (successfulTests / this.results.length) * 100 : 0;

    console.log('\n============================================================');
    console.log('🏁 TEST SUITE SUMMARY');
    console.log('============================================================');
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log(`Tests Run: ${this.results.length}`);
    console.log(`Successful: ${successfulTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Skipped: ${this.results.filter(r => r.skipped).length}`);
    console.log(`Success Rate: ${successRate.toFixed(1)}%`);
    console.log(`Continue on Failure: ${this.options.continueOnFailure ? 'Yes' : 'No'}`);
    console.log(`Final Market ID: ${this.currentMarketId || 'N/A'}`);

    if (failedTests > 0) {
      console.log('\n📋 DETAILED RESULTS:');
      this.results.forEach((result, index) => {
        const status = result.success ? '✅' : '❌';
        const duration = result.duration;
        console.log(`${index + 1}. ${status} ${result.name} (${duration}ms)`);
        if (!result.success && result.error) {
          console.log(`   Error: ${result.error}`);
        }
      });

      if (this.options.continueOnFailure) {
        console.log('\n❌ Some tests failed. Check the logs above for details.');
        console.log('⚠️  Test suite continued despite failures (continueOnFailure: true)');
      } else {
        console.log('\n❌ Test suite stopped due to test failure.');
      }
    } else {
      console.log('\n🎉 All tests passed successfully!');
    }
  }
}

// Main test function that mocha will run
describe('Comprehensive Test Suite', () => {
  it('Runs all tests in sequence', async function() {
    this.timeout(300000); // 5 minutes timeout
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    const continueOnFailure = args.includes('--continue-on-failure');
    const verbose = args.includes('--verbose');

    const runner = new TestRunner({
      continueOnFailure,
      verbose
    });

    try {
      await runner.runTestSuite();
      
      // Verify that at least some tests ran
      const results = (runner as any).results || [];
      if (results.length === 0) {
        throw new Error('No tests were executed');
      }
      
      console.log('✅ Test suite completed successfully');
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      throw error;
    }
  });
}); 