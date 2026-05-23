import autocannon from 'autocannon';
import * as dotenv from 'dotenv';

dotenv.config();

const TARGET_ELECTION_ID = 1; 
// Target your live local VPS deployment port or proxy domain URL
const URL = `http://localhost:3000/api/election-results?electionId=${TARGET_ELECTION_ID}`;

async function runBenchmark() {
  console.log(`🚀 Starting high-concurrency stress test against: ${URL}`);
  console.log('📊 Simulating 500 concurrent connections over a 15-second duration...');

  const instance = autocannon({
    url: URL,
    connections: 500, // Number of concurrent virtual users hitting the route
    duration: 15,     // Test duration in seconds
    pipelining: 1,    // Single pipeline tracking per connection
    method: 'GET',
  }, (err: any, result: any) => {
    if (err) {
      console.error('❌ Benchmark ran into a critical execution crash:', err);
      return;
    }
    console.log('✅ Stress test completed successfully. Analyzing results...\n');
  });

  // Print progress bars directly inside the running terminal screen
  autocannon.track(instance, { renderProgressBar: true });
}

runBenchmark();
