:wave: **New to our project?** Be sure to review the [OpenMRS 3 Frontend Developer Documentation](https://o3-docs.openmrs.org) :teacher:	

![OpenMRS CI](https://github.com/openmrs/openmrs-esm-patient-chart/actions/workflows/ci.yml/badge.svg)

# OpenMRS ESM Patient Chart

The `openmrs-esm-patient-chart` is a frontend module for the OpenMRS SPA. It contains various microfrontends that constitute widgets in a patient dashboard. These widgets include:

- [Allergies](packages/esm-patient-allergies-app/README.md)
- [Attachments](packages/esm-patient-attachments-app/README.md)
- [Biometrics](packages/esm-patient-biometrics-app/README.md)
- [Conditions](packages/esm-patient-conditions-app/README.md)
- [Forms](packages/esm-patient-forms-app/README.md)
- [Immunizations](packages/esm-patient-immunizations-app/README.md)
- [Medications](packages/esm-patient-medications-app/README.md)
- [Notes](packages/esm-patient-notes-app/README.md)
- [Patient banner](packages/esm-patient-banner-app/README.md)
- [Patient chart](packages/esm-patient-chart-app/README.md)
- [Programs](packages/esm-patient-programs-app/README.md)
- [Tests](packages/esm-patient-tests-app/README.md)
- [Vitals](packages/esm-patient-vitals-app/README.md)

In addition to these widgets, two other microfrontends exist that encapsulate cross-cutting concerns. These are:

- [Common lib](packages/esm-patient-common-lib/README.md)
- [Patient chart](packages/esm-patient-chart-app/README.md)

## Setup

Check out the developer documentation [here](http://o3-dev.docs.openmrs.org).

This monorepo uses [yarn](https://yarnpkg.com).

To install the dependencies, run:

```bash
yarn
```

To start a dev server for a specific microfrontend, run:

```bash
yarn start --sources 'packages/esm-patient-<insert-package-name>-app'
```

This command uses the [openmrs](https://www.npmjs.com/package/openmrs) tooling to fire up a dev server running `esm-patient-chart` as well as the specified microfrontend.

There are two approaches for working on multiple microfrontends simultaneously.

You could run `yarn start` with as many `sources` arguments as you require. For example, to run the biometrics and vitals microfrontends simultaneously, you'd use:

```bash
yarn start --sources 'packages/esm-patient-biometrics-app' --sources 'packages/esm-patient-vitals-app'
```

Alternatively, you could run `yarn serve` from within the individual packages and then use [import map overrides](http://o3-dev.docs.openmrs.org/#/getting_started/setup?id=import-map-overrides).

## Running tests

To run tests for all packages, run:

```bash
yarn turbo run test
```

To run tests in `watch` mode, run:

```bash
yarn turbo run test:watch
```

To run tests for a specific package, pass the package name to the `--filter` flag. For example, to run tests for `esm-patient-conditions-app`, run:

```bash
yarn turbo run test --filter=@openmrs/esm-patient-conditions-app
```

To run a specific test file, run:

```bash
yarn turbo run test -- visit-notes-form
```

The above command will only run tests in the file or files that match the provided string.

You can also run the matching tests from above in watch mode by running:

```bash
yarn turbo run test:watch -- visit-notes-form
```

To generate a `coverage` report, run:

```bash
yarn turbo run coverage
```

By default, `turbo` will cache test runs. This means that re-running tests wihout changing any of the related files will return the cached logs from the last run. To bypass the cache, run tests with the `force` flag, as follows:

```bash
yarn turbo run test --force
```

To run end-to-end tests, run:

```bash
yarn test-e2e
```

Read the [e2e testing guide](https://o3-docs.openmrs.org/docs/frontend-modules/end-to-end-testing) to learn more about End-to-End tests in this project.

### Updating Playwright

The Playwright version in the [Bamboo e2e Dockerfile](e2e/support/bamboo/playwright.Dockerfile#L2) and the `package.json` file must match. If you update the Playwright version in one place, you must update it in the other.

## Troubleshooting

If you notice that your local version of the application is not working or that there's a mismatch between what you see locally versus what's in [dev3](https://dev3.openmrs.org/openmrs/spa), you likely have outdated versions of core libraries. To update core libraries, run the following commands:

```bash
# Upgrade core libraries
yarn up openmrs@next @openmrs/esm-framework@next

# Reset version specifiers to `next`. Don't commit actual version numbers.
git checkout package.json

# Run `yarn` to recreate the lockfile
yarn
```

## Layout

The patient chart consists of the following parts:

- Navigation menu
- Patient header
- Chart review / Dashboards
- Workspace
- Side menu

The **navigation menu** lives on the left side of the screen and provides links to dashboards in the patient chart.

The **patient header** contains the [patient banner](packages/esm-patient-banner-app/README.md). Uninvasive notifications also appear in this area following actions such as form submissions.

The **chart review** area is the main part of the screen. It displays whatever dashboard is active.

A **dashboard** is a collection of widgets.

The **workspace** is where data entry takes place. On mobile devices it covers the screen; on desktop it appears in a sidebar.

The **side menu** provides access to features that do not have their own pages, such as the notifications menu.

## Design Patterns

For documentation about our design patterns, please visit our [design system](https://zeroheight.com/23a080e38/p/880723--introduction) documentation website.

## Configuration

Please see the [Implementer Documentation](https://wiki.openmrs.org/pages/viewpage.action?pageId=224527013) for information about configuring modules.

## Deployment

See [Creating a Distribution](http://o3-dev.docs.openmrs.org/#/main/distribution?id=creating-a-distribution) for information about adding microfrontends to a distribution.











Sure! We need to update the Prisma schema and the PDF generation logic to accommodate the nested "results" structure inside test concepts. Here’s what needs to be changed: ### ✅ **1. Update Prisma Schema** 📄 **File:** `prisma/schema.prisma` You will need to create a new table for storing results, as the structure is nested in your example. We'll create a `Test` and `TestResult` model in the schema: ```prisma model Patient { id Int @id @default(autoincrement()) openmrsId String @unique phone String? @unique firstName String lastName String labResults Test[] createdAt DateTime @default(now()) updatedAt DateTime @updatedAt } model Test { id Int @id @default(autoincrement()) name String status String createdDate DateTime updatedDate DateTime patientId Int patient Patient @relation(fields: [patientId], references: [id]) results TestResult[] } model TestResult { id Int @id @default(autoincrement()) conceptUuid String status String orderUuid String groupMembers GroupMember[] testId Int test Test @relation(fields: [testId], references: [id]) } model GroupMember { id Int @id @default(autoincrement()) conceptUuid String value Float status String display String orderUuid String testResultId Int testResult TestResult @relation(fields: [testResultId], references: [id]) } ``` ### ✅ **2. Update PDF Generation (`pdfGenerator.ts`)** 📄 **File:** `src/utils/pdfGenerator.ts` To render the results in tabular form for each test: ```typescript import puppeteer from 'puppeteer'; import * as fs from 'fs/promises'; export async function generateLabResultsPDF(patient) { const htmlContent = ` <html> <head> <style> body { font-family: Arial, sans-serif; padding: 20px; } h2 { text-align: center; color: #444; } table { width: 100%; border-collapse: collapse; margin-top: 20px; } th, td { border: 1px solid #ddd; padding: 10px; text-align: left; } th { background-color: #f4f4f4; } .test-name { font-size: 18px; font-weight: bold; text-decoration: underline; margin-top: 20px; } </style> </head> <body> <h2>${patient.firstName}, Sizning labaratoriya natijalaringiz</h2> ${patient.labResults .map( (test) => ` <div class="test-name">${test.name}</div> <table> <tr><th>Status</th><td>${test.status}</td></tr> <tr><th>Created Date</th><td>${formatDateUzbekLocale(test.createdDate)}</td></tr> <tr><th>Updated Date</th><td>${formatDateUzbekLocale(test.updatedDate)}</td></tr> <tr><th>Results</th> <td> <table> <tr><th>Concept</th><th>Value</th><th>Status</th><th>Display</th></tr> ${test.results .map( (result) => ` <tr> <td>${result.conceptUuid}</td> <td>${result.value}</td> <td>${result.status}</td> <td>${result.display}</td> </tr> ` ) .join('')} </table> </td></tr> </table> ` ) .join('')} </body> </html> `; const browser = await puppeteer.launch({ headless: true }); const page = await browser.newPage(); await page.setContent(htmlContent); const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true }); await browser.close(); const pdfPath = `./lab_results_${patient.id}.pdf`; await fs.writeFile(pdfPath, Buffer.from(pdfBuffer)); return pdfPath; } // Helper function to format date in Uzbek locale function formatDateUzbekLocale(dateString) { const date = new Date(dateString); return date.toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' }); } ``` ### ✅ **Key Changes:** 1. **Prisma Schema**: - Created `Test`, `TestResult`, and `GroupMember` models to store each test and its nested group members. 2. **PDF Generation**: - Rendered each test’s results as a table. - Grouped test results within each test in columns for clarity: `Concept`, `Value`, `Status`, `Display`. ### ✅ **Restart Your Server** Once you've updated the schema and PDF generator, be sure to restart your server to apply the changes: ```bash npm run start:dev ``` This should now render each test result in individual tables and present the data nicely in the PDFs! 🚀