const { execSync } = require('child_process');

const TOTAL_RUNS = 10000;
console.log(
  `🚀 Starting stress-test loop: Running 'npm run test' ${TOTAL_RUNS} times.\n`,
);

for (let i = 1; i <= TOTAL_RUNS; i++) {
  console.log(`[Run ${i}/${TOTAL_RUNS}] Executing...`);
  try {
    // inherits allows you to see the real-time jest terminal output
    execSync('npm run test', { stdio: 'inherit' });
    console.log(`✅ Run ${i} passed.\n-----------------------------------\n`);
  } catch (error) {
    console.error(`\n❌ Flaky test detected! Failed on run #${i}.`);
    process.exit(1); // Stop execution immediately
  }
}

console.log(
  `🎉 Success! All ${TOTAL_RUNS} test runs passed with zero failures.`,
);
