import { ensureWorkflowsRegistered } from '../src/workflows/index';
import { WorkflowRegistry } from '../src/lib/workflows/registry';
import fs from 'fs';
import path from 'path';

console.log('🔍 Executing Workflow Conformance Mechanical Audit (Sprint F-QA.1)...');

let violations: Array<{ workflowId: string; rule: string; detail: string }> = [];

// 1. Ensure workflows register properly and test idempotency
try {
  ensureWorkflowsRegistered();
  ensureWorkflowsRegistered(); // Call twice to verify idempotency
} catch (err: any) {
  violations.push({
    workflowId: 'GENERAL',
    rule: 'REGISTRATION_FAILURE',
    detail: `ensureWorkflowsRegistered failed or is not idempotent: ${err.message}`
  });
}

const allWorkflows = WorkflowRegistry.listWorkflows();
const EXPECTED_WORKFLOW_COUNT = 13;

console.log(`Registered workflows count: ${allWorkflows.length}`);

if (allWorkflows.length < EXPECTED_WORKFLOW_COUNT) {
  violations.push({
    workflowId: 'REGISTRY',
    rule: 'INCOMPLETE_WORKFLOW_REGISTRY',
    detail: `Expected at least ${EXPECTED_WORKFLOW_COUNT} canonical workflows, found ${allWorkflows.length}`
  });
}

// Map of seen IDs to verify uniqueness
const seenIds = new Set<string>();

allWorkflows.forEach((wf) => {
  // Check ID
  if (!wf.id || typeof wf.id !== 'string') {
    violations.push({ workflowId: 'UNKNOWN', rule: 'MISSING_ID', detail: 'Workflow missing valid ID string' });
    return;
  }

  if (seenIds.has(wf.id)) {
    violations.push({ workflowId: wf.id, rule: 'DUPLICATE_ID', detail: `Duplicate workflow ID found: ${wf.id}` });
  }
  seenIds.add(wf.id);

  // Check Title
  if (!wf.title || typeof wf.title !== 'string' || wf.title.trim().length < 5) {
    violations.push({ workflowId: wf.id, rule: 'INVALID_TITLE', detail: `Title must be at least 5 chars, got: "${wf.title}"` });
  }

  // Check Phase 1-7
  if (typeof wf.phase !== 'number' || wf.phase < 1 || wf.phase > 7) {
    violations.push({ workflowId: wf.id, rule: 'INVALID_PHASE', detail: `Phase must be 1..7, got: ${wf.phase}` });
  }

  // Check rolesAllowed
  if (!Array.isArray(wf.rolesAllowed) || wf.rolesAllowed.length === 0) {
    violations.push({ workflowId: wf.id, rule: 'EMPTY_ROLES_ALLOWED', detail: 'rolesAllowed must be non-empty array' });
  }

  // Check Zod schema
  if (!wf.schema) {
    violations.push({ workflowId: wf.id, rule: 'MISSING_ZOD_SCHEMA', detail: 'Zod schema is required' });
  }

  // Check hardGates array
  if (!Array.isArray(wf.hardGates)) {
    violations.push({ workflowId: wf.id, rule: 'MISSING_HARD_GATES', detail: 'hardGates must be an array' });
  }

  // Check deliverable factory
  if (!wf.deliverable || typeof wf.deliverable.factory !== 'function') {
    violations.push({ workflowId: wf.id, rule: 'MISSING_DELIVERABLE_FACTORY', detail: 'deliverable factory function is required' });
  }

  // Check initialState
  if (wf.initialState && typeof wf.initialState !== 'string') {
    violations.push({ workflowId: wf.id, rule: 'INVALID_INITIAL_STATE', detail: 'initialState must be string' });
  }
});

// 2. Audit static imports / synchronous auto-registration in phaseNavigation
const phaseNavPath = path.join(process.cwd(), 'src/components/navigation/phaseNavigation.ts');
if (fs.existsSync(phaseNavPath)) {
  const content = fs.readFileSync(phaseNavPath, 'utf8');
  if (content.includes('ensureWorkflowsRegistered()') && !content.includes('ensureWorkflowsRegisteredAsync') && !content.includes('async')) {
    violations.push({
      workflowId: 'PHASE_NAVIGATION',
      rule: 'SYNCHRONOUS_MODULE_REGISTRATION',
      detail: 'phaseNavigation.ts executes ensureWorkflowsRegistered synchronously at module import time, breaking bundle lazy loading'
    });
  }
}

console.log(`\n--- WORKFLOW CONFORMANCE AUDIT REPORT ---`);
if (violations.length > 0) {
  console.error(`❌ FAILED: Found ${violations.length} workflow conformance violations:\n`);
  violations.forEach(v => {
    console.error(`  - [${v.rule}] Workflow "${v.workflowId}": ${v.detail}`);
  });
  process.exit(1);
} else {
  console.log(`✅ PASSED: All ${allWorkflows.length} workflows satisfy the canonical WorkflowDefinition contract & registry rules.`);
  process.exit(0);
}
