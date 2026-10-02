# PRODUCT SENSE — Functional Common Sense & Product Completeness

## 1. Purpose

This skill gives agents functional product judgment.

Its purpose is to prevent technically correct but product-incomplete implementations caused by literal interpretation of a request.

The agent must understand that a feature is not complete merely because its primary CRUD path works. It must evaluate the feature as a real user-facing capability: lifecycle, actors, permissions, expected interactions, edge cases, feedback, failure states, and domain conventions.

This skill does **not** authorize inventing business requirements.
It authorizes the agent to:

- detect obvious functional omissions;
- infer domain-standard behavior when the inference is low-risk and conventional;
- surface assumptions explicitly;
- propose unresolved product decisions before implementation;
- reject incomplete designs that contradict the semantic meaning of the requested feature;
- keep implementation scope proportional to the requested capability.

---

## 2. Governing Principle

> **Do not implement the smallest literal interpretation of the request. Implement the smallest coherent interpretation of the feature.**

A request such as:

> “Create a review system.”

must not be interpreted as merely:

- create a `Review` table;
- create an endpoint to submit a rating;
- render five stars;
- save a number.

The agent must first determine what a review system means in the product context and verify that the design supports the expected lifecycle and interactions.

---

## 3. Relationship With Project Governance

This skill is subordinate to the project Constitution, security policies, data-integrity rules, architecture rules, and explicit business requirements.

Priority:

1. Platform/system safety.
2. Project Constitution.
3. Critical security/data/business policies.
4. Explicit project architecture and documented business rules.
5. This skill's product-sense analysis.
6. User request where compatible with the above.
7. Framework/library conventions.
8. Agent preferences.

This skill **MUST NOT** override a documented business rule merely because another behavior is more common.

---

## 4. Core Distinction: Common Sense vs Invented Requirements

Every inferred requirement must be classified before implementation.

### 4.1 OBSERVED

Explicitly stated by the user, project documentation, existing code, schema, API contract, or product specification.

Action: implement when applicable.

### 4.2 DOMAIN-CONVENTIONAL

A low-risk behavior that is normally expected for the type of feature and is necessary for a coherent implementation.

Examples:

- star ratings normally expose the complete declared scale;
- a like normally belongs to a user and should not be infinitely duplicated by the same user;
- a review response normally belongs to the review and has an author;
- an average rating must reflect the actual ratings stored rather than arbitrary fixed values.

Action: may be proposed or implemented when the convention is unambiguous, but the assumption must be visible in the plan.

### 4.3 BUSINESS-SPECIFIC

A rule whose correctness depends on the product's policy.

Examples:

- whether one customer may review the same professional multiple times;
- whether a professional can answer only once or multiple times;
- whether a deleted review remains visible in aggregate statistics;
- whether likes are public;
- whether reviews can be edited after order completion;
- whether a review is allowed before payment is finalized.

Action: do not silently invent. Mark as an explicit decision or derive only from existing project evidence.

### 4.4 OPTIONAL ENHANCEMENT

A useful but non-essential improvement.

Examples:

- photos in reviews;
- video reviews;
- review sentiment analysis;
- badges;
- advanced sorting;
- gamification.

Action: keep out of the implementation unless requested or clearly justified by the current task.

---

## 5. Mandatory Product-Sense Pass

Before implementation, run a **Product Completeness Pass**.

### PASS A — Identify the capability

Answer:

- What is the real user capability being created?
- What object or concept does it represent?
- Which actors interact with it?
- What problem does it solve?
- What is the normal happy path?
- What does success look like for the user?

Do not start implementation until the feature can be described in one coherent sentence.

### PASS B — Lifecycle analysis

Determine whether the feature has:

- creation;
- retrieval;
- presentation;
- interaction;
- modification;
- deletion or deactivation where semantically relevant;
- derived state or aggregates;
- failure states;
- empty states;
- permission states;
- moderation/abuse handling where relevant.

The agent must not mechanically add CRUD to every feature. It must determine which lifecycle operations actually make sense.

### PASS C — Actor and permission analysis

For every relevant action, identify:

| Action | Actor | Allowed? | Conditions | Result |
|---|---|---|---|---|
| Create | ? | ? | ? | ? |
| Read | ? | ? | ? | ? |
| Update | ? | ? | ? | ? |
| Delete | ? | ? | ? | ? |
| Interact | ? | ? | ? | ? |
| Moderate | ? | ? | ? | ? |
| Respond | ? | ? | ? | ? |

A feature is incomplete when an important user action exists visually but has no authoritative backend rule.

### PASS D — Interaction symmetry

For any user-generated content, ask:

- Can the author see it after creation?
- Can the author correct an obvious mistake when appropriate?
- Can an authorized party respond when the domain naturally calls for a response?
- Can users perform the obvious interaction associated with the object?
- Are counts and state synchronized correctly?
- Is there a way to undo/toggle reversible interactions?
- What happens after deletion?
- What happens when the content is reported or moderated?

Do not assume every content type needs every interaction. The point is to test semantic completeness.

---

## 6. Domain Completeness Heuristics

Use these heuristics according to the domain. They are prompts for reasoning, not a mandatory feature checklist.

### 6.1 Ratings / Reviews

When a task involves ratings or reviews, evaluate at minimum:

- rating scale and whether the full valid range is represented;
- actual user selection of the rating rather than hardcoded examples;
- review text requirements and constraints;
- author identity and ownership;
- target entity being reviewed;
- source/context of the review where the product needs verified provenance;
- aggregate rating calculation;
- rating count;
- distribution when useful;
- response/reply capability when the domain has a natural recipient/business side;
- interaction such as likes/helpful where requested or domain-standard;
- duplicate/eligibility rules;
- edit/delete policy;
- report/moderation path where public content exists;
- pagination and ordering for non-trivial lists;
- empty/loading/error states;
- authorization and anti-abuse considerations;
- effect of deletion/moderation on aggregates.

#### Example: review system

A technically minimal but semantically weak design might allow only:

```text
POST /reviews
rating = 5
rating = 4
```

That is not enough to establish a coherent review feature.

A coherent design should at least reason through:

```text
Customer
  -> creates review
      -> chooses a valid rating in the declared range
      -> writes optional/required text according to product rules
      -> review belongs to customer + target
      -> aggregate rating is recalculated from real data
      -> review appears in the target's review list

Target / Professional
  -> may respond when product rules allow it

Other users
  -> may perform supported interaction such as helpful/like
  -> interaction is attributable to the user
  -> duplicate interaction behavior is defined

Author / Moderator
  -> may edit, delete, report, or moderate according to permissions

System
  -> handles empty/loading/error states
  -> keeps aggregate counts consistent
  -> prevents client-controlled privilege escalation
```

The exact rules still depend on the product. Do not silently invent them.

### 6.2 Social / User-generated content

Ask about:

- author;
- audience/visibility;
- reactions/interactions;
- comments/replies;
- edit/delete;
- report/moderation;
- blocking/muting where relevant;
- pagination;
- notification implications;
- ownership and authorization.

### 6.3 Marketplace features

Ask about:

- actor roles;
- eligibility;
- ownership;
- lifecycle states;
- pricing/payment state;
- cancellation;
- verification;
- disputes/refunds where relevant;
- notifications;
- fraud/abuse surfaces;
- irreversible actions.

### 6.4 Messaging / Chat

Ask about:

- sender/recipient ownership;
- delivery state;
- unread state;
- retries/reconnection;
- ordering;
- duplicates;
- blocked users;
- deletion/edit semantics;
- attachments where applicable;
- authorization at message and conversation level.

### 6.5 Booking / Orders / Transactions

Ask about:

- explicit state machine;
- valid transitions;
- idempotency;
- concurrency/race conditions;
- cancellation;
- retries;
- payment state;
- authorization;
- auditability;
- failure/recovery paths.

---

## 7. State Completeness

For every user-facing feature, evaluate at least these UI/system states when applicable:

```text
Initial
Loading
Empty
Success
Partial
Validation error
Authorization denied
Not found
Conflict
Network failure
Server failure
Retry
Disabled/ineligible
Completed
```

Do not implement all states blindly. Include the states that can actually occur for the feature.

A feature is not complete because the success state works.

---

## 8. Data Semantics Check

Before creating or modifying a data model, verify:

- What does each field semantically mean?
- Is the value user-provided, system-derived, or externally verified?
- Who is authoritative for the value?
- Can the same logical action occur twice?
- What identifies the owner?
- What identifies the target?
- Which relationships are mandatory?
- Which values are aggregates?
- Which values must be calculated instead of duplicated?
- What happens when the source entity is deleted or becomes unavailable?
- What constraints prevent impossible states?

Do not create fields merely because they might be useful later.

---

## 9. Common-Sense Invariants

The agent must actively search for obvious invariants.

Examples:

### Ratings

- A rating outside the supported scale must be rejected.
- The UI and backend must agree on the same valid range.
- Aggregates must use actual stored ratings.
- A rating count must reflect the actual eligible records.
- A user interaction must not become another user's identity or privilege.

### Likes / Helpful

- A user's interaction should be attributable to that user.
- Repeating a toggle must have deterministic behavior.
- Counts must remain consistent with underlying interaction records.
- The client must not be trusted as the source of truth for totals or ownership.

### Replies

- A reply must reference the parent review/content item.
- The responder must be authorized for that action.
- Deleting or moderating the parent must have a defined effect on replies.

### Aggregates

- Derived values must have one authoritative calculation path.
- Concurrent writes must not leave impossible totals.
- Cached aggregates must have a known invalidation/update strategy when the architecture uses caching.

These are semantic invariants, not invitations to over-engineer.

---

## 10. “Would a Real User Be Surprised?” Test

Before declaring a feature complete, ask:

1. Can the user perform the action they naturally expect from the object?
2. Can the user understand what the displayed numbers mean?
3. Do the visible controls correspond to real backend capabilities?
4. Can an obvious invalid action create inconsistent data?
5. Are ownership and permissions coherent?
6. What happens when there is no data?
7. What happens when something fails?
8. What happens when the object is changed or deleted?
9. Can the feature be abused in an obvious way?
10. Would a competent product engineer consider the feature semantically incomplete?

If any answer exposes a material gap, the agent must address it, propose it, or explicitly mark it as an unresolved product decision.

---

## 11. Avoiding Literalism

When the user says:

> “Create reviews.”

The agent must **not** interpret the request as permission to build only the minimum database record.

When the user says:

> “Add likes.”

The agent must **not** assume that a client-side counter is sufficient.

When the user says:

> “Allow professionals to reply.”

The agent must **not** merely add a button. It must connect the action to authorization, persistence, retrieval, UI state, and the review lifecycle.

When the user says:

> “Use ratings from 1 to 5.”

The agent must **not** hardcode only example values such as 4 and 5.
The valid domain is the declared range, and the system must support actual user selection within that range.

---

## 12. Avoiding Overengineering

Product sense does not mean adding every plausible feature.

Do not automatically add:

- photos;
- video;
- reactions beyond the requested interaction;
- AI moderation;
- advanced analytics;
- badges;
- gamification;
- complex event buses;
- microservices;
- separate repositories;
- extra abstractions;
- background jobs;
- notification systems;
- search infrastructure.

First establish the **minimum coherent feature**.

Only then consider enhancements.

### Scope ladder

**Level 1 — Semantic correctness**

The feature means what it claims to mean.

**Level 2 — Core lifecycle completeness**

Users can perform the expected core actions and the system handles the relevant states.

**Level 3 — Interaction completeness**

Natural interactions, ownership, permissions, and reversibility are covered where applicable.

**Level 4 — Operational robustness**

Concurrency, idempotency, caching, notifications, moderation, analytics, and other concerns are added only when the architecture or feature actually requires them.

Never jump to Level 4 simply because it is possible.

---

## 13. Product-Sense Plan Gate

Before implementation, the agent must produce an internal or visible checklist with:

```text
FEATURE:

OBJECT:

ACTORS:

OBSERVED REQUIREMENTS:

DOMAIN-CONVENTIONAL ASSUMPTIONS:

BUSINESS-SPECIFIC DECISIONS:

CORE LIFECYCLE:

EXPECTED INTERACTIONS:

PERMISSIONS:

STATES:

DATA INVARIANTS:

MATERIAL EDGE CASES:

OUT-OF-SCOPE ENHANCEMENTS:

MINIMUM COHERENT IMPLEMENTATION:
```

The plan is not allowed to proceed when a material semantic contradiction remains unresolved.

---

## 14. Product-Sense Review After Implementation

After implementation, inspect the result against the plan.

Check:

- Does the feature behave like the concept described by the user?
- Are declared ranges complete?
- Are the obvious interactions wired end-to-end?
- Are ownership and permissions enforced server-side where required?
- Are aggregate values derived from real data?
- Are invalid and empty states handled?
- Does deletion/moderation leave coherent state?
- Did the implementation introduce a feature that was never requested?
- Did the agent solve a real omission or merely add complexity?

### Review statuses

- `PASS` — coherent and complete for the requested scope.
- `PASS_WITH_ASSUMPTIONS` — coherent, with explicit low-risk assumptions.
- `BLOCKED_BY_PRODUCT_DECISION` — a business-specific rule is required.
- `INCOMPLETE` — a material semantic gap remains.
- `OVERBUILT` — implementation exceeds justified scope.

---

## 15. Required Behavior for Agents

When this skill is active, the agent MUST:

1. Think in user journeys, not only files and endpoints.
2. Check the semantic meaning of the requested feature.
3. Search for obvious domain-standard omissions.
4. Distinguish inference from documented requirements.
5. Make low-risk assumptions explicit.
6. Flag business-specific decisions instead of inventing them.
7. Validate lifecycle, permissions, interactions, state, and data semantics.
8. Prefer a minimum coherent product over a minimum literal implementation.
9. Re-check the feature after implementation.
10. Stop once the requested feature is coherent, verified, and within scope.

---

## 16. Anti-Patterns This Skill Exists to Prevent

### Literal CRUD

“User asked for reviews, so I created a table and POST endpoint.”

### Demo-only behavior

“Ratings are supported, so the UI shows examples 4 and 5.”

### UI-only interaction

“I added a Like button; the backend can be added later.”

### Counter without semantics

“The review has `likes = 10`.”

The system must know what those ten likes represent.

### Missing lifecycle

“Users can create reviews, but there is no defined behavior for edit, delete, moderation, or invalid state where those actions are applicable.”

### Feature leakage

“While implementing reviews, I also redesigned the profile, added notifications, and replaced the data layer.”

### False completeness

“The feature is complete” when only the happy path was implemented and material edge cases were ignored.

---

## 17. Compact Trigger Phrase

Agents can use this mental trigger before implementing a feature:

> **“What would a real user reasonably expect this object to do, and what would make the feature obviously incomplete?”**

Then verify that expectation against project evidence, domain conventions, security constraints, and scope.
