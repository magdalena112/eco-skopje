# Security Specification - EcoSkopje

## 1. Data Invariants
- A report must have a valid type (`dump`, `container`, `air`).
- A report's `userId` must match the creator's UID.
- A user's `points` cannot be negative.
- Users can only update their own `points`, `displayName`, and `photoURL`.
- Events can only be created by signed-in users.
- Participants in an event can only be added (never removed by users themselves via simple update).

## 2. The "Dirty Dozen" Payloads (Denial Tests)

1. **Identity Spoofing (Report)**: Create report with `userId` of another user.
2. **Identity Spoofing (User)**: Update another user's profile.
3. **Privilege Escalation**: Update own `points` by 1,000,000.
4. **Invalid State (Report)**: Create report with invalid type `volcano`.
5. **ID Poisoning**: Create report with a 2KB document ID.
6. **Relational Orphan**: Create report referencing a non-existent category (if applicable).
7. **PII Leak**: List users and expect to see their email addresses (vulnerability to address).
8. **Shadow Field**: Update user profile with `isAdmin: true`.
9. **Negative Points**: Update user profile with `points: -100`.
10. **Event Manipulation**: Delete an event created by someone else.
11. **Mass Participants**: Add 10,000 bogus participants to an event.
12. **System Field Injection**: Inject `verified: true` into a report.

## 3. Implementation Plan
- Users: Split into public/private or handle email restriction. Since I cannot easily split without significant code changes, I will restrict `email` read to owners.
- Reports: Allow listing for global stats, but keep it protected by `isSignedIn()`.
- Global Deny: Ensure the catch-all is working.
- Validation Helpers: Implement `isValidUser`, `isValidReport`, etc.
