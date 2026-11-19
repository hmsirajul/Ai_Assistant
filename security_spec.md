# Firestore Security Specification

## 1. Data Invariants
1. A `UserProfile` document at `/users/{userId}` can only be read, created, or updated by the verified authenticated user whose `request.auth.uid == userId`.
2. Users cannot list `/users` (no cross-user PII enumeration).
3. `uid` and `createdAt` on `/users/{userId}` are immutable after creation, and `createdAt`/`updatedAt` must equal `request.time`.
4. A `CustomAgent` at `/users/{userId}/agents/{agentId}` and a `UserMemory` at `/users/{userId}/memories/{memoryId}` require the parent `/users/{userId}` document to exist and belong to `request.auth.uid`, and `ownerId` must equal `request.auth.uid` and remain immutable on update.
5. Every string field is bounded by `maxLength`, every array is bounded (`tools.size() <= 10`), and document IDs match `^[a-zA-Z0-9_\\-]+$`.

## 2. Adversarial "Dirty Dozen" Payloads
1. Unauthenticated read of `/users/userA` -> `PERMISSION_DENIED`
2. Cross-user read of `/users/userB` by `userA` -> `PERMISSION_DENIED`
3. Unverified email (`email_verified: false`) attempting write to `/users/userA` -> `PERMISSION_DENIED`
4. Identity spoofing: `userA` creating `/users/userA` with `uid: "userB"` -> `PERMISSION_DENIED`
5. Shadow field injection: `userA` writing `{ ...validProfile, isAdmin: true }` -> `PERMISSION_DENIED`
6. Timestamp tampering: `userA` writing `createdAt: "2020-01-01"` instead of `request.time` -> `PERMISSION_DENIED`
7. Oversized string DoS: `userA` writing `customInstructions` > 1000 chars -> `PERMISSION_DENIED`
8. Invalid enum: `userA` setting `plan: "UnlimitedFree"` -> `PERMISSION_DENIED`
9. Immutable field overwrite: `userA` updating `uid` or `createdAt` on `/users/userA` -> `PERMISSION_DENIED`
10. Orphaned agent creation: creating `/users/userA/agents/a1` when `/users/userA` does not exist -> `PERMISSION_DENIED`
11. Unbounded array poisoning: creating agent with 15 tools (`tools.size() > 10`) -> `PERMISSION_DENIED`
12. List scraping attempt: `userA` listing `/users/userB/agents` or `/users` -> `PERMISSION_DENIED`
