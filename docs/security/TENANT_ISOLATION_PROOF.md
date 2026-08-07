# Multi-Tenant Global Isolation Matrix & Verification Proof (Sprint F-MT.1)

## 1. Executive Summary & Architectural Zero-Trust Principles

This document serves as the formal security proof and architectural matrix for **Global Tenant Isolation** in the Industrial Control 360 platform (Sprint `F-MT.1`).

### Core Rules of Multi-Tenant Security
1. **Server-Side Token Claims Authority**: The authenticated user's `orgId` custom claim, verified server-side by Firebase Admin SDK, is the sole authoritative identity of the tenant.
2. **Untrusted Client Inputs**: Any `orgId` parameter received via request bodies, query strings, URL route parameters, HTTP headers, or client React state is treated as an unverified candidate. It MUST match the verified JWT token `orgId`.
3. **Strict Rejection of Cross-Tenant Manipulation**: Any attempt by a token authorized for `org-A` to access, read, write, export, or consume quotas belonging to `org-B` is immediately blocked and logged with error code `PERMISSION_DENIED` (HTTP 403 / `permission-denied`).
4. **No Global Role Bypasses**: Tenant isolation is enforced across all roles, including `superadmin` within an organization. Platform overrides are restricted strictly to system-level platform administrators (`platformAdmin === true`) when explicitly enabled.

---

## 2. Global Tenant Isolation Matrix

| Layer / Subsystem | Entry Point / Function | Authorization Engine | Tenant Verification Logic | Cross-Tenant Failure Mode (Org-A token -> Org-B resource) |
|---|---|---|---|---|
| **Firestore Security Rules** | Client SDK Firestore Reads/Writes | `firestore.rules` (`belongsToOrg()`, `tokenOrgId()`) | Checks `request.auth.token.orgId == orgId` on all document paths `/organizations/{orgId}/...` | **REJECTED**: `FirebaseError: [firestore/permission-denied]` |
| **Collection Groups** | 21 Subcollections (`match /{path=**}/...`) | `firestore.rules` collection group rules | Enforces `resource.data.orgId == tokenOrgId()` | **REJECTED**: `FirebaseError: [firestore/permission-denied]` |
| **Server-Side Middleware** | `resolveAuthorizedOrgId()` | `functions/src/middleware/authorizer.ts` | Validates JWT token claims against `requestedOrgId` | **REJECTED**: Throws `HttpsError('permission-denied')` |
| **Server-Side Authorizer** | `authorizeServerSideRequest()` | `functions/src/middleware/authorizer.ts` | Resolves tenant via `resolveAuthorizedOrgId`, checks membership status in `/organizations/{orgId}/memberships/{uid}` | **REJECTED**: Throws `HttpsError('permission-denied')` |
| **AI Cloud Functions** | `callGeminiProxy` | `requireAuth` + `resolveAuthorizedOrgId` | Impresses `effectiveOrgId` from JWT claim before Gemini invocation & quota reservation | **REJECTED**: Returns HTTP 403 `PERMISSION_DENIED` |
| **Export Quotas** | `reserveExportQuotaProxy` | `requireAuth` + `resolveAuthorizedOrgId` | Resolves `effectiveOrgId` from token claims; blocks cross-tenant quota consumption | **REJECTED**: Returns HTTP 403 `PERMISSION_DENIED` |
| **Email Gateway** | `sendEmail` | `requireAuth` + `resolveAuthorizedOrgId` | Binds email context and audit logging strictly to token `orgId` | **REJECTED**: Returns HTTP 403 `PERMISSION_DENIED` |
| **FinOps Quota Engine** | `reserveQuota()` | `functions/src/finops/quotaService.ts` | Binds transaction path to `organizations/{effectiveOrgId}/quotaUsage/...` | **REJECTED**: Throws error and blocks quota allocation |
| **Offline Sync Outbox** | `syncOutboxMutation` | `authorizeServerSideRequest` | Validates membership, role, and idempotency key under `/organizations/{orgId}/projects/{projectId}/...` | **REJECTED**: Throws `HttpsError('permission-denied')` |
| **Repository Layer** | `BaseRepository<T>` | `src/lib/repositories/baseRepo.ts` | All collection paths constructed as `organizations/${orgId}/projects/${projectId}/...` | **REJECTED**: Path mismatch blocked by Firestore Rules |

---

## 3. Detailed Verification Scenarios

### Scenario A: Spoofed Request Body (`callGeminiProxy`)
- **Attacker State**: Authenticated with JWT containing claim `orgId: "org-A"`.
- **Payload**: `POST /api/callGeminiProxy` with `{ "orgId": "org-B", "prompt": "..." }`.
- **Enforcement**: `callGeminiProxy` passes `req.user` and `req.body.orgId` to `resolveAuthorizedOrgId`.
- **Outcome**: `resolveAuthorizedOrgId` detects `claimOrgId ("org-A") !== cleanRequested ("org-B")`. Throws `HttpsError("permission-denied")`. Function responds HTTP 403 `PERMISSION_DENIED`.

### Scenario B: Cross-Tenant Quota Draining (`reserveExportQuotaProxy`)
- **Attacker State**: Authenticated with JWT containing claim `orgId: "org-A"`.
- **Payload**: `POST /api/reserveExportQuota` with `{ "orgId": "org-B", "formats": ["pdf", "xlsx"] }`.
- **Enforcement**: `reserveExportQuotaProxy` resolves tenant with `resolveAuthorizedOrgId` before invoking `reserveQuota`.
- **Outcome**: `resolveAuthorizedOrgId` rejects the cross-tenant request. Quota for `org-B` is completely untouched.

### Scenario C: Collection Group Query Pollution
- **Attacker State**: Authenticated with JWT containing claim `orgId: "org-A"`.
- **Action**: Issues a client-side collection group query on `welds` without `orgId` constraint or passing `orgId == "org-B"`.
- **Enforcement**: Firestore Security Rules evaluate `match /{path=**}/welds/{id}` rule: `allow read: if isAuthenticated() && resource.data.orgId == tokenOrgId()`.
- **Outcome**: Firestore backend filters out or rejects any document where `resource.data.orgId != "org-A"`.

---

## 4. Test Execution & Coverage Summary

The test suite in `functions/src/__tests__/tenantIsolation.test.ts` validates all multi-tenant isolation scenarios:
1. `resolveAuthorizedOrgId` claim resolution, matching, and mismatch rejection.
2. `reserveQuota` multi-tenant transaction path alignment and mismatch error handling.
3. HTTP Cloud Functions (`callGeminiProxy`, `reserveExportQuotaProxy`, `sendEmail`) HTTP 403 `PERMISSION_DENIED` responses on tenant spoofing attempts.
4. `authorizeServerSideRequest` cross-tenant access blocking.

---

## 5. Traceability and Compliance
- **Sprint**: `F-MT.1 — Prueba Tenant Global`
- **Architectural Reference**: `AGENTS.md` (Section 1 & 5), `DECISIONS.md` (ADR-001)
- **Status**: **VERIFIED & COMPLIANT**
