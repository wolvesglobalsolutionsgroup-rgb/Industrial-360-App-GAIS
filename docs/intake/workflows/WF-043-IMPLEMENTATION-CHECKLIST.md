# Implementation Checklist — WF-043: Permiso de Trabajo Seguro PTW (PDVSA IR-S-04)

- [x] **Schema & Types Defined**: `PtwApprovalSchema` and `PtwApprovalData` in `types.ts`
- [x] **Workflow Definition**: `wf043Definition` in `definition.ts` with state transitions and hard gates
- [x] **UI Component**: `PtwApprovalCapture.tsx` with tabbed capture sections, validation feedback, and safe default initialization
- [x] **Hard Gates Validation**:
  - [x] Contractor APTA status check
  - [x] Approved ART (IR-S-17) and Procedure (SI-S-20)
  - [x] Gas test 0.0% LEL for hot work
  - [x] Start time == Gas test time match
  - [x] Tripartite signers check
  - [x] Closeout order & cleanliness check
- [x] **Deliverable Document Generator**: `deliv-043-ptw-ir-s-04` DocumentViewModel factory
- [x] **Automated Tests**: Unit and integration test suite passing in `wf043Ptw.test.ts`
