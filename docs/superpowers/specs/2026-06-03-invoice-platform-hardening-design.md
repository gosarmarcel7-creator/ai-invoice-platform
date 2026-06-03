# Invoice Platform Hardening Design

Date: 2026-06-03
Project: `ai-invoice-platform`
Primary surface: Next.js app and App Router API routes

## Goal

Turn the current invoice platform from a polished demo into a production-ready workflow by hardening extraction, validation, review, exports, and observability without destabilizing the existing user experience.

## Why This Work

The current codebase already supports auth, uploads, extraction, invoice review, analytics, and demo fallback. The largest risks are now operational:

- extraction failures can leave invoices stuck in `processing`
- AI failures can fall back to fabricated invoice data
- upload endpoints lack clear type and size enforcement
- there is no durable audit trail for review decisions
- there are no bulk actions or export path for reviewed documents
- tests are minimal, so regressions would be easy to ship
- both Next API routes and FastAPI expose overlapping invoice behavior

This design focuses on making the existing product trustworthy before adding broader integrations.

## Product Decision

The Next.js application becomes the product source of truth for invoice processing and review.

The FastAPI backend will remain in the repository for compatibility and reference, but this project will not extend both stacks in parallel. New production workflow behavior will be added only to the Next.js App Router API layer unless a later migration plan explicitly consolidates the Python service.

This keeps authentication, Supabase access, UI behavior, and extraction orchestration in one path that already matches the frontend.

## Scope

This implementation includes:

- explicit processing lifecycle and retry support
- structured extraction validation and low-confidence flagging
- upload limits and duplicate detection
- invoice review audit history
- bulk review actions
- CSV export
- webhook delivery hooks via an outbox/event model
- test coverage for critical backend and UI flows
- a new generated logo integrated into the frontend

This implementation does not include:

- full ERP/accounting integrations
- asynchronous worker infrastructure outside the app runtime
- OCR for image-heavy or scanned files beyond current text extraction capability
- replacing the FastAPI service
- multi-step approval chains or role-based review permissions

## Success Criteria

- failed extractions surface as `failed` with actionable retry behavior
- no extraction path inserts invented invoice data on model or parse failure
- invalid or inconsistent extraction results are flagged for human review
- uploads reject unsupported files and oversize payloads early
- duplicate uploads are identified consistently
- every meaningful user review action is written to an audit trail
- users can apply bulk status changes and export reviewed data
- webhook events are generated deterministically for downstream integration
- automated tests cover the core routes and state transitions
- frontend branding consistently uses the new logo

## Data Model Changes

### Invoice

Extend the invoice record with processing and validation fields:

- `status`: add `failed`
- `processing_started_at`
- `processed_at`
- `last_error`
- `retry_count`
- `file_size_bytes`
- `mime_type`
- `file_hash`
- `duplicate_of_invoice_id`
- `needs_attention`
- `attention_reasons` as JSON/text array
- `reviewed_by`
- `reviewed_at`

Status meanings:

- `processing`: extraction job accepted and running
- `review`: extraction finished and awaits review
- `approved`: reviewed and accepted
- `rejected`: reviewed and rejected
- `failed`: extraction failed and can be retried

### Invoice Audit Log

Add a new table for immutable workflow history:

- `id`
- `invoice_id`
- `user_id`
- `action`
- `from_status`
- `to_status`
- `details` as JSON
- `created_at`

Actions include:

- `uploaded`
- `processing_started`
- `processing_failed`
- `processing_retried`
- `extraction_completed`
- `review_saved`
- `approved`
- `rejected`
- `deleted`
- `bulk_updated`
- `exported`

### Webhook Event Outbox

Add a lightweight outbox table:

- `id`
- `invoice_id`
- `event_type`
- `payload`
- `delivery_status`
- `delivery_attempts`
- `last_error`
- `created_at`
- `delivered_at`

The initial implementation only guarantees event creation and a simple delivery mechanism from the app runtime. It does not promise fully durable external queue semantics.

## API Design

### Existing Routes to Harden

`/api/invoices`

- enforce file type allowlist: PDF, PNG, JPG, JPEG
- enforce file size limit
- compute file hash before insert
- detect duplicates by `(user_id, file_hash)`
- return duplicate metadata when applicable
- create audit log entry on upload
- create invoice with processing metadata

`/api/invoices/[id]`

- validate editable fields
- write audit entries for status changes and review edits
- ensure bulk and single-item updates share validation logic

`/api/analytics`

- include failed count if surfaced in UI
- optionally expose attention counts for low-confidence/inconsistent records

### New Routes

`POST /api/invoices/[id]/retry`

- allowed only for invoice owner
- allowed only when status is `failed`
- resets processing metadata
- writes audit entry
- re-runs extraction

`POST /api/invoices/bulk`

- accepts invoice ids plus action
- supports approve, reject, and mark review
- validates ownership and allowed transitions
- writes audit entries per invoice

`GET /api/invoices/export`

- returns CSV for current filtered result set
- includes invoice fields and optionally flattened line items
- writes export audit entries

`GET /api/invoices/[id]/history`

- returns audit trail for the selected invoice

`POST /api/webhooks/dispatch`

- internal or protected route to deliver pending outbox events
- can be triggered manually or by scheduled execution later

## Extraction and Validation Design

### Current Risk

The current extraction layer falls back to mock invoice data when the model is unavailable or output parsing fails. That behavior is acceptable for demos but unsafe for production because it creates believable but false accounting records.

### New Behavior

Extraction failures will never create fabricated invoice values.

The extraction flow will:

1. extract text from the uploaded file
2. call the model when configured
3. parse the response into a typed schema
4. validate field shape and business consistency
5. either persist structured results or mark the invoice `failed`

### Validation Rules

Validation will check:

- object shape matches the expected schema
- numeric fields are valid numbers
- dates match `YYYY-MM-DD` when present
- confidence score is between `0` and `1`
- line item totals are internally coherent within a tolerance
- header total approximately matches line item sum when both exist

Attention flags will be set when:

- confidence is below threshold
- header total and line items diverge
- required commercial fields are missing
- extraction returns empty or near-empty content

Invoices with validation concerns still move to `review` when the data is structurally usable, but they are marked `needs_attention` with specific reasons shown in the UI.

If the extraction result is unusable, the invoice moves to `failed` and stores `last_error`.

## File Handling Design

Uploads will be validated before insertion:

- extension and MIME type must be allowed
- file size must remain under a configurable limit
- empty files are rejected

File hash behavior:

- compute a stable hash of the upload buffer
- if an invoice by the same user already has the same hash, mark the new one as duplicate and link `duplicate_of_invoice_id`
- the duplicate may still be stored for traceability, but the UI should surface that it duplicates an existing invoice

The first iteration will not add antivirus scanning or object storage; instead it will expose a clear insertion point for those later.

## Review Workflow Design

### Single Invoice Review

The drawer remains the main review surface, but it gains:

- attention badge and reasons
- failure message when applicable
- retry action for failed invoices
- audit timeline/history panel

Approving or rejecting an invoice records:

- reviewer identity
- review timestamp
- previous status
- new status
- changed fields, where relevant

### Bulk Actions

The invoice table gains multi-select with bulk actions:

- approve selected
- reject selected
- move selected back to review

Bulk actions should optimistically update the UI only after server acceptance for the whole request or per-item server responses are reconciled.

## Export Design

CSV export will support the same visible filters as the invoice table:

- status
- search
- current user scope

Default columns:

- filename
- vendor_name
- invoice_number
- total_amount
- date
- due_date
- confidence_score
- status
- needs_attention
- attention_reasons
- reviewed_at

Line items will be exported in a flattened row-per-line-item format or as repeated invoice rows with line item columns. The first implementation will use flattened rows because it is easier to import into spreadsheets and downstream systems.

## Webhook Event Design

Events will be created when invoices:

- enter `review`
- are approved
- are rejected
- fail extraction

The event payload will contain stable invoice metadata and workflow state, not raw document text by default.

Delivery rules:

- create event rows in the same request/processing flow as the status transition
- mark delivery attempts and failures
- allow re-dispatch of pending or failed events

The first version is meant to enable future integrations, not serve as a complete external eventing platform.

## UI Design

### Dashboard

Add:

- failed count card or status visibility
- attention indicators
- retry button for failed invoices
- multi-select and bulk actions
- CSV export button
- invoice history panel

### Demo Mode

Demo mode should remain visually functional, but it must clearly distinguish synthetic data from real production behavior. Demo invoices may still simulate state changes, but they should not masquerade as failed production retries or webhook deliveries.

### Branding

Create a new product logo using GPT image generation with these goals:

- modern, trustworthy B2B visual tone
- suitable for invoice automation and document intelligence
- readable on both light and dark-adjacent surfaces already present in the app
- usable as a small navbar mark and a larger hero lockup

The logo should be exported into repository assets and integrated into the existing `Logo` component or a closely related branding component.

## Testing Strategy

### Tooling

Introduce test tooling appropriate to the frontend-centric architecture:

- route/unit tests for App Router handlers and shared invoice logic
- focused component tests for dashboard review interactions

The exact framework should align with the current Next/TypeScript setup. Vitest is the likely choice because it is lightweight and fits the existing frontend stack.

### Required Coverage

Tests will cover:

- upload rejection for bad file types
- upload rejection for oversize files
- duplicate detection
- successful upload creates processing invoice and audit event
- extraction success transitions to `review`
- extraction parse/model failure transitions to `failed`
- retry route only works from `failed`
- validation flags low-confidence and inconsistent totals
- invoice ownership enforced on read, update, delete, retry, history, and bulk routes
- bulk actions update only owned invoices
- export route respects filters and auth scope
- review updates create audit history

### TDD Approach

Implementation will start by adding failing tests around the extracted shared logic and route handlers, then adding the minimal code to satisfy them before broad refactoring.

## Implementation Sequence

1. Add test scaffolding and first failing tests for invoice processing lifecycle
2. Extract shared invoice-processing helpers from the current routes
3. Add processing lifecycle fields, validation, and failed/retry behavior
4. Add upload restrictions and duplicate detection
5. Add audit log model and history route
6. Add bulk actions and export route
7. Add webhook outbox and dispatch hook
8. Update dashboard UI for failed states, attention, bulk actions, export, and history
9. Generate and integrate logo assets
10. Run verification: tests, lint, and build

## Risks and Mitigations

### Dirty Worktree

The repository already contains unrelated or partially staged frontend work. Edits must remain scoped and additive, avoiding resets or broad file rewrites where possible.

### Supabase Schema Drift

Schema additions in code will fail without matching database changes. The implementation should centralize schema assumptions and document required SQL or migration steps clearly.

### Dual Backend Confusion

Because FastAPI remains in the repo, new contributors may assume both backends are equally current. The implementation should update docs to state that the Next.js routes are the active product path.

### Runtime Limits

App runtime “fire and forget” extraction is still less durable than a true worker queue. This design improves correctness and recoverability now, while leaving a clean seam for a future queue-backed worker.

## Acceptance Checklist

- invoices can enter and recover from `failed`
- extraction never writes fabricated mock invoice data in production paths
- structured validation and attention flags exist
- upload constraints and duplicates are enforced
- audit history is recorded and viewable
- bulk actions work
- CSV export works
- webhook outbox records are created
- tests cover critical state transitions
- logo is generated and integrated
