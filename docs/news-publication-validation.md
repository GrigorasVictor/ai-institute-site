# News publication requirements (issue #173)

News Item requires a title, summary, publication date, hero image, at least one
related department, at least one related project, at least one featured person,
and an author before it can be published. Incomplete drafts can still be saved.
The localized title and summary must be completed for each published translation.
Title and summary must contain at least one non-whitespace character. Empty
strings, spaces, tabs, newlines and whitespace-only Unicode text are rejected
when publishing or republishing, including through the API.

The homepage requests the six latest published articles in the selected locale,
ordered by `publishedDate` descending. If fewer than six exist, it shows the
available articles; drafts are excluded by Strapi's public API.

`config/api.ts` enables Strapi's native `documents.strictRelations` validation.
This is necessary for required media and relations to be enforced by the Document
Service, including publishing through the admin UI and API. It is supported by
the Strapi 5.59.0 version in the lockfile. This flag applies to any content type
with required relations/media; currently the new requirements apply to News Item.

The News Item `beforeCreate` lifecycle validates text when Strapi creates a
published row (`publishedAt` is set). Strapi uses this path for publication,
republication and writes with `status: 'published'`. Draft rows skip this check,
so incomplete drafts remain saveable in both the admin UI and the API. Validation
reports the affected field without trimming or rewriting valid stored text.
Schema regex validation is deliberately avoided: Strapi's admin UI also applies
it while saving drafts, which would prevent saving incomplete text.

## Local verification

Use Node.js 22 and install dependencies with `npm ci` in `server` and `web`.

```sh
cd server
npm run test:news
```

The integration suite compiles and loads the real Strapi application with a fresh
SQLite database under `.tmp/`, independent of the developer's database settings.
It deletes that database after the tests. It checks missing required fields,
complete publication, direct publish requests, partial updates, removal of the
last related project, preservation of the existing published version after a
failed republication, and Romanian translation validation.
It also checks blank/whitespace-only text on publication and republication,
preservation of the complete public record after a rejected publication, and
successful publication after repairing the draft.
An authenticated REST test starts the isolated app on an ephemeral localhost
port: draft POST succeeds, invalid published POST/PUT returns HTTP 400 with a
field-specific error, valid publication succeeds, and rejected republication
preserves the complete public API response. Its token lives only in the
temporary test database and is never written to the repository.

For manual review, start Strapi and Next.js against a local database. In Strapi,
create or use a local admin account and open Content Manager > News Item:

1. Save a draft with just a title. Saving should succeed.
2. Attempt to publish it. Required fields should be reported.
3. Complete all eight required fields, using published relation targets, and
   publish. The article should be accessible from the public website.
4. With at least eight published news items and one draft, open the homepage.
   Confirm exactly six cards, newest first; the oldest two and the draft must
   not appear. Check desktop and narrow screens.
5. Remove the last related project from an existing article's draft. Save, then
   try publishing. Publication should fail and the current public article should
   retain its original project.

## Before production rollout

Coordinate with the maintainers as required by CONTRIBUTING.md for schema changes.
Back up the database, and audit all existing News Items and their translations.
Populate missing fields with editorially verified data, including real authors
and project/department associations; do not invent values for old articles.
The patch does not rename fields, remove records, or backfill content. Existing
published records remain readable, but incomplete ones must be completed before
they can be republished. Rebuild Strapi after deploying the schema and generated
types. Only roll out after reviewing the data and validating on staging.
