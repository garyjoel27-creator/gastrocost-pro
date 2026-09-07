#!/usr/bin/env node
/**
 * GastroCost PRO — Master E2E Test Suite Runner
 * Lightweight, zero-dependency Node.js test runner across 4 systematic tiers.
 *
 * Usage:
 *   node tests/run_tests.js
 */

const path = require('path');
const { runTier1Tests } = require('./tier1_features');
const { runTier2Tests } = require('./tier2_boundaries');
const { runTier3Tests } = require('./tier3_cross_features');
const { runTier4Tests } = require('./tier4_real_world');

// ANSI Terminal Colors
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  white: '\x1b[37m',
  bgGreen: '\x1b[42m\x1b[30m',
  bgRed: '\x1b[41m\x1b[37m'
};

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  failures: [],
  tiers: {}
};

let currentTierName = '';

function setTier(tierName) {
  currentTierName = tierName;
  if (!results.tiers[tierName]) {
    results.tiers[tierName] = { passed: 0, failed: 0, tests: [] };
  }
}

function registerTest(name, testFn) {
  results.total++;
  const tier = currentTierName;
  const startTime = Date.now();

  try {
    testFn();
    const duration = Date.now() - startTime;
    results.passed++;
    results.tiers[tier].passed++;
    results.tiers[tier].tests.push({ name, status: 'pass', duration });
    console.log(`  ${C.green}✓${C.reset} ${C.white}${name}${C.reset} ${C.dim}(${duration}ms)${C.reset}`);
  } catch (err) {
    const duration = Date.now() - startTime;
    results.failed++;
    results.tiers[tier].failed++;
    results.tiers[tier].tests.push({ name, status: 'fail', duration, error: err });
    results.failures.push({ tier, name, error: err });
    console.log(`  ${C.red}✗${C.reset} ${C.bold}${C.red}${name}${C.reset} ${C.dim}(${duration}ms)${C.reset}`);
    console.log(`    ${C.red}Error: ${err.message}${C.reset}`);
  }
}

async function main() {
  const suiteStartTime = Date.now();

  console.log(`\n${C.bold}${C.cyan}╔══════════════════════════════════════════════════════════════════════╗${C.reset}`);
  console.log(`${C.bold}${C.cyan}║             GASTROCOST PRO — E2E TEST SUITE RUNNER                   ║${C.reset}`);
  console.log(`${C.bold}${C.cyan}║   Opaque-box Verification Engine (Tiers 1–4: R1 to R6)               ║${C.reset}`);
  console.log(`${C.bold}${C.cyan}╚══════════════════════════════════════════════════════════════════════╝${C.reset}\n`);

  // Tier 1
  console.log(`${C.bold}${C.yellow}► TIER 1: FEATURE COVERAGE (R1 to R6)${C.reset}`);
  setTier('Tier 1: Feature Coverage');
  runTier1Tests(registerTest);
  console.log('');

  // Tier 2
  console.log(`${C.bold}${C.yellow}► TIER 2: BOUNDARY & CORNER CASES${C.reset}`);
  setTier('Tier 2: Boundary & Corner Cases');
  runTier2Tests(registerTest);
  console.log('');

  // Tier 3
  console.log(`${C.bold}${C.yellow}► TIER 3: CROSS-FEATURE COMBINATIONS${C.reset}`);
  setTier('Tier 3: Cross-Feature Combinations');
  runTier3Tests(registerTest);
  console.log('');

  // Tier 4
  console.log(`${C.bold}${C.yellow}► TIER 4: REAL-WORLD SCENARIOS${C.reset}`);
  setTier('Tier 4: Real-World Scenarios');
  runTier4Tests(registerTest);
  console.log('');

  const totalDuration = Date.now() - suiteStartTime;

  // Print Summary Table
  console.log(`${C.bold}${C.cyan}──────────────────────────────────────────────────────────────────────${C.reset}`);
  console.log(`${C.bold}TEST EXECUTION SUMMARY${C.reset}\n`);

  Object.entries(results.tiers).forEach(([tierName, data]) => {
    const totalTier = data.passed + data.failed;
    const pct = totalTier > 0 ? Math.round((data.passed / totalTier) * 100) : 0;
    const color = data.failed === 0 ? C.green : C.red;
    console.log(`  ${tierName.padEnd(38)} : ${color}${data.passed}/${totalTier} passed (${pct}%)${C.reset}`);
  });

  console.log(`\n  ${C.bold}Total Tests : ${results.total}${C.reset}`);
  console.log(`  ${C.green}Passed      : ${results.passed}${C.reset}`);
  console.log(`  ${results.failed > 0 ? C.red : C.dim}Failed      : ${results.failed}${C.reset}`);
  console.log(`  ${C.dim}Duration    : ${totalDuration}ms${C.reset}\n`);

  if (results.failures.length > 0) {
    console.log(`${C.bold}${C.red}FAILURES BREAKDOWN:${C.reset}`);
    results.failures.forEach((f, idx) => {
      console.log(`\n${C.bold}${idx + 1}) [${f.tier}] ${f.name}${C.reset}`);
      console.log(`${C.red}${f.error.stack || f.error.message}${C.reset}`);
    });
    console.log(`\n${C.bgRed} RESULT: FAILED (${results.failed} tests failed) ${C.reset}\n`);
    process.exit(1);
  } else {
    console.log(`${C.bgGreen} RESULT: 100% PASSED (${results.passed}/${results.total} tests) ${C.reset}\n`);
    process.exit(0);
  }
}

main();
