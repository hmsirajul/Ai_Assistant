# Firestore Security Specification

## 1. Data Invariants
1. A `UserProfile` document at `/users/{userId}` can only be read, created, or updated by the verified authenticated user whose `request.auth.uid == userId`.
2. Users cannot list `/users` (no cross-user PII enumeration).
3. `uid` and `createdAt` on `/users/{userId}` are immutable after creation, and `createdAt`/`updatedAt` must equal `request.time`.
4. All user workspace subcollections under `/users/{userId}` (`agents`, `memories`, `conversations`, `notebooks`, `notes`, `tasks`, `activityLogs`) require `isOwner(userId)` (`request.auth != null && request.auth.uid == userId`) on `get`/`list`, and require `isVerifiedUser()`, valid `isValidId()`, parent `/users/{userId}` existence (`exists` / `get`), `ownerId == request.auth.uid` (immutable on update), and `request.time` timestamp integrity on writes.
5. Every `allow list` rule enforces `isOwner(userId) && existing().ownerId == request.auth.uid` so cross-user scraping is impossible even if the client is bypassed.
6. Every string field is bounded by `maxLength`, every array is bounded (`tools.size() <= 10`, `tags.size() <= 10`, `checklist.size() <= 50`, `messages.size() <= 150`) with first-element type validation, and document IDs match `^[a-zA-Z0-9_\\-]+$`.

## 2. Adversarial "Dirty Dozen" Payloads
1. Unauthenticated read of `/users/userA` or `/users/userA/conversations/c1` -> `PERMISSION_DENIED`
2. Cross-user read or list of `/users/userB/conversations` or `/users/userB/notebooks` by `userA` -> `PERMISSION_DENIED`
3. Unverified email (`email_verified: false`) attempting write to `/users/userA` or any subcollection -> `PERMISSION_DENIED`
4. Identity spoofing: `userA` creating `/users/userA/conversations/c1` with `ownerId: "userB"` -> `PERMISSION_DENIED`
5. Shadow field injection: `userA` writing `{ ...validProfile, isAdmin: true }` or `{ ...validConversation, extra: "x" }` -> `PERMISSION_DENIED`
6. Timestamp tampering: `userA` writing `createdAt: "2020-01-01"` instead of `request.time` -> `PERMISSION_DENIED`
7. Oversized string DoS: `userA` writing `content` > 25,000 chars in notebook or `customInstructions` > 1,000 chars -> `PERMISSION_DENIED`
8. Invalid enum: `userA` setting `plan: "UnlimitedFree"` or `mode: "InvalidMode"` -> `PERMISSION_DENIED`
9. Immutable field overwrite: `userA` updating `uid`, `ownerId`, or `createdAt` -> `PERMISSION_DENIED`
10. Orphaned subcollection creation: creating `/users/userA/conversations/c1` when `/users/userA` does not exist -> `PERMISSION_DENIED`
11. Unbounded array poisoning: creating conversation with > 150 messages or agent with > 10 tools -> `PERMISSION_DENIED`
12. List scraping attempt: `userA` listing `/users` or listing `/users/userA/conversations` without `where("ownerId", "==", userA)` -> `PERMISSION_DENIED`
