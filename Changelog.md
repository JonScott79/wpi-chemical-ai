## [1.0.6] - 2026-08-07

### Added

#### Analytics

- Integrated Google Analytics 4 across the WPI Predict platform.
- Integrated Microsoft Clarity for session recordings, heatmaps, and interaction analysis.
- Added centralized analytics architecture through `js/analytics.js`.
- Added automated event tracking for navigation, publication downloads, DOI links, email links, and external resources.
- Added Workbench analytics covering prediction sessions, model selection, parameter changes, molecule drawing, PubChem lookups, exports, printing, and researcher interactions.
- Added publication visibility tracking using `IntersectionObserver` for accurate engagement metrics.
- Added prediction timing metrics to measure time from page load to first prediction.

#### Accessibility

- Added accessible form labels for researcher input controls.
- Added keyboard shortcut guidance for prediction input (`Enter` to predict, `Shift + Enter` to insert a new line).
- Added accessible labeling for dataset upload controls to improve screen reader compatibility.

#### Search Engine Optimization

- Registered the website with Google Search Console.
- Registered the website with Bing Webmaster Tools.
- Submitted the XML sitemap for search engine indexing.
- Added production web application metadata including `application-name` and `apple-mobile-web-app-title`.
- Updated the web application manifest with WPI Predict branding.

### Changed

#### Privacy & Security

- Updated analytics implementation to prevent chemical names, SMILES strings, prediction values, and other research data from being transmitted to third-party analytics providers.
- Analytics now transmit only interaction metadata required for usage reporting.

#### Accessibility

- Achieved zero WAVE accessibility errors.
- Achieved a perfect Lighthouse Accessibility score through WCAG AA compliance improvements.
- Improved color contrast throughout the interface to meet WCAG AA standards.
- Corrected heading hierarchy to improve screen reader navigation.
- Enhanced keyboard navigation and screen reader compatibility across the Workbench.

#### Infrastructure

- Centralized analytics into a shared implementation to simplify future maintenance.
- Improved SEO consistency across all primary website pages.
- Updated the sitemap to remove obsolete page references.
- Prepared the platform for production analytics reporting and search engine discovery.

### Removed

#### Code Cleanup

- Removed legacy Workbench prediction modal implementation.
- Removed obsolete JavaScript template files no longer used by the application.
- Removed unused About page modal markup and legacy script references.

### Release Summary

Version **1.0.6** prepares WPI Predict for public launch by integrating production analytics, comprehensive accessibility improvements, search engine indexing, privacy-focused telemetry, and infrastructure enhancements. The platform now includes centralized analytics, researcher interaction tracking, WCAG AA-compliant accessibility, improved SEO, production-ready metadata, and privacy-conscious telemetry while ensuring proprietary chemical information remains protected.
## [1.0.5] - 2026-08-05

### Added

#### Research Workbench

- Added backend-powered chemical name resolution using the PubChem PUG REST API.
- Added automatic molecular formula lookup from common chemical names.
- Added compound disambiguation support when multiple matching compounds are returned.
- Added researcher-friendly selection dialog for ambiguous compound names.
- Added loading status overlay with progress feedback while predictions are running.
- Added prediction completion notifications to improve researcher workflow.

#### Research Publications

- Redesigned the Research Publications section using publication cards.
- Added publication preview images using graphical abstracts and representative figures.
- Added publication author listings.
- Added journal and publication year metadata.
- Added dedicated publication action buttons for future online paper pages.
- Added direct PDF download buttons for published papers.
- Prepared publication architecture for future paper detail pages.
- Organized publication assets using reusable preview image structure.

### Changed

#### Research Workbench

- Reorganized the prediction workflow into a guided step-by-step process.
- Moved model selection to the first step of the prediction workflow.
- Added dynamic model-specific parameter panel.
- Improved prediction workflow to better match researcher expectations.
- Moved the primary prediction action adjacent to molecular input.
- Repositioned the molecular drawing tool as a secondary action.
- Added keyboard shortcut support:
  - Enter executes predictions.
  - Shift + Enter inserts a new line within the input area.
- Improved prediction status feedback throughout the application.
- Updated prediction layout to better separate model configuration from prediction results.

#### Research Repository

- Replaced the publication table with responsive publication cards.
- Improved publication presentation using representative graphics instead of document lists.
- Enhanced research repository scalability for future publications.
- Refined publication layout for improved readability and visual consistency.

#### Infrastructure

- Updated frontend communication with the new backend compound resolution service.
- Refactored compound resolution to support multiple returned candidate compounds.
- Improved frontend/backend integration for future chemistry data providers.

### Fixed

#### Research Workbench

- Fixed compound resolution failures caused by ambiguous chemical names.
- Improved handling of multiple PubChem search results.
- Improved prediction feedback during long-running inference requests.
- Corrected Workbench layout alignment following workflow redesign.
- Improved responsiveness of publication and Workbench layouts.

### Release Summary

Version **1.0.5** significantly improves both the WPI Predict Research Workbench and Research Repository. Researchers now receive real-time prediction feedback, improved compound resolution with ambiguity handling, and a redesigned guided prediction workflow. The Research page has been transformed into a publication-centered repository featuring graphical abstracts, publication metadata, and a scalable architecture for future research outputs.

## [1.0.4] - 2026-08-04

### Changed

#### Research Workbench

- Redesigned the molecular input workflow based on researcher usability feedback.
- Updated the Workbench layout to prioritize SMILES entry as the primary input method.
- Improved separation between individual molecule prediction and batch dataset processing workflows.
- Replaced the previous upload input presentation with a dedicated drag-and-drop dataset upload area.
- Added clearer visual separation between SMILES input and dataset upload options.
- Updated SMILES input controls with improved grouping, spacing, and visual consistency.
- Refined Workbench component hierarchy and spacing for improved usability.

#### Research Repository

- Updated the Research page layout to better support future publication growth.
- Removed placeholder research category panels and simplified the publication repository presentation.
- Improved publication table formatting and document organization.
- Added clearer document type presentation for downloadable research papers.

#### Team

- Added researcher profile information and photo support for project contributors.
- Expanded team presentation for faculty, researchers, and student contributors.

#### Version Management

- Added version number linking from the website footer to release documentation.
- Updated centralized version configuration to include changelog location.

### Fixed

#### User Experience

- Fixed confusion between SMILES input fields and dataset upload controls.
- Improved first-time user understanding of available input workflows.
- Corrected inconsistent spacing and alignment within Workbench input components.
- Improved connected input/button styling for SMILES entry controls.
- Refined hover and focus behavior for custom Workbench controls.

### Release Summary

Version **1.0.4** improves the WPI Predict user experience by refining the Research Workbench workflow, clarifying molecular input options, and improving research documentation presentation. This release incorporates usability improvements based on researcher interaction and prepares the platform for future expansion with additional datasets, publications, and computational tools.

## [1.0.3] - 2026-08-03

### Added

#### Research Workbench

- CSV prediction import support.
- Improved JSON prediction import support.
- Automatic extraction of SMILES structures from exported prediction files.
- Full round-trip workflow support (Export → Import → Predict).

### Changed

- Improved batch file parsing for CSV, JSON, and TXT formats.
- Enhanced import compatibility with exported WPI Predict result files.
- Refined automatic batch prediction workflow after importing files.

### Fixed

- Fixed JSON imports displaying `[object Object]` when loading exported prediction files.
- Fixed CSV imports incorrectly pasting entire rows instead of extracting SMILES structures.
- Improved validation and parsing of imported molecular datasets.
- Corrected import behavior for previously exported prediction results.

### Release Summary

Version **1.0.3** completes the Workbench import/export workflow, allowing researchers to seamlessly import previously exported prediction files, continue batch analyses, and work with CSV, JSON, and TXT molecular datasets using a consistent interface.

## [1.0.2] - 2026-08-03

### Fixed

#### Fusion GNN

- Restored the missing `raw_features_tuned.pkl` model artifact required for inference.
- Re-enabled Enthalpy of Fusion predictions.
- Corrected Fusion model initialization during backend startup.
- Added defensive backend error handling for unavailable prediction models.
- Replaced an unhandled `IndexError` with meaningful API responses when model artifacts are unavailable.

### Changed

- Improved deployment validation for machine learning model artifacts.
- Updated backend initialization diagnostics for prediction models.

### Infrastructure

- Verified complete deployment of all Fusion GNN model artifacts to the production server.
- Confirmed successful production inference for both available prediction models.

### Release Summary

Version **1.0.2** restores full production functionality for the Fusion GNN predictor by deploying the missing model artifact required during initialization. Both the MFLOGP and Fusion GNN models are now fully operational on the production WPI Predict platform.

## [1.0.1] - 2026-08-03

### Added

#### Research Workbench

- Drag-and-drop file import support.
- JSON import support.
- TXT import support.
- Automatic prediction execution after file import.
- Molecule count displayed after importing batch files.
- Improved batch import validation and error handling.

#### Accessibility

- Improved WCAG accessibility compliance across the website.
- Enhanced keyboard navigation.
- Improved screen reader compatibility.
- Added accessibility metadata and ARIA enhancements where appropriate.
- Improved focus handling for interactive controls.

### Changed

- Updated Workbench upload interface to support multiple input formats.
- Improved batch import workflow by reducing manual steps.
- Refined user feedback during file import.
- General accessibility and usability improvements throughout the site.

### Fixed

- Various accessibility issues identified during compliance review.
- Minor interface consistency improvements.

## [1.0.0] - 2026-08-03

### 🎉 Initial Production Release

The WPI Predict platform has reached its first production-ready release and has been successfully deployed to the WPI production server.

### Added

#### Production Deployment

- Successfully deployed WPI Predict to the WPI production server.
- Configured Apache HTTPS hosting.
- Deployed FastAPI backend.
- Configured Apache reverse proxy for backend API endpoints.
- Enabled live API communication between the frontend and backend.
- Added production Python virtual environment.
- Added deployment-ready Python dependency management.
- Enabled Swagger/OpenAPI documentation.
- Configured GitHub-based production deployment workflow.

#### Research Workbench

- Live model discovery through the backend API.
- Automatic loading of available prediction models.
- Backend model registry support.
- REST API endpoint for model enumeration.
- End-to-end frontend/backend communication.

#### Infrastructure

- SSH key authentication for production deployment.
- Git-based deployment workflow.
- Linux production environment configuration.
- Python virtual environment support.
- Production dependency installation.
- HTTPS API support.
- Server-side model loading.
- Version 1.0 deployment pipeline established.

### Changed

- Refactored backend deployment to use a dedicated FastAPI service.
- Simplified and cleaned Python dependency management.
- Updated Workbench to retrieve prediction models dynamically from the backend.
- Improved deployment reliability and reproducibility.

### Fixed

- Resolved Python virtual environment configuration.
- Corrected backend dependency conflicts.
- Configured Apache reverse proxy for `/api/*`.
- Fixed production API routing.
- Fixed frontend communication with backend services.
- Verified public API endpoints over HTTPS.

### Known Issues

- The Fusion predictor is currently unavailable because the required model artifact
  `models/EnthalpyOfFusion/raw_features_tuned.pkl`
  was omitted from the original model package. The artifact has been identified and will be restored in the next maintenance release.
  **Resolved in Version 1.0.2**

- Existing serialized machine learning models generate scikit-learn version compatibility warnings and should be regenerated using the finalized production training environment.

### Release Summary

Version **1.0.0** marks the first complete production deployment of WPI Predict, including the public website, FastAPI backend, HTTPS API, production deployment workflow, and live model discovery.

# CHANGELOG

All notable changes to the WPI Predict website will be documented in this file.

The format is based on Keep a Changelog and follows Semantic Versioning.

---

## [0.1.0] - 2026-07-17

### Added

- Initial multi-page website architecture.
- Shared header and footer component loading.
- Responsive navigation layout.
- Shared CSS architecture using:
  - reset.css
  - theme.css
  - layout.css
  - components.css
  - utilities.css
  - style.css
- Homepage introducing the WPI Predict research platform.
- Research page for publications, downloads, and project resources.
- Team page featuring faculty, researchers, graduate students, and student contributors.
- About page describing the platform, mission, technology, and research goals.
- Responsive footer with version information.
- Shared version management script.
- Chemical background artwork across the site.

### Research Workbench

- Added dedicated Research Workbench page.
- CSV upload interface.
- Batch SMILES input area.
- JSME molecular editor integration.
- "Draw Molecule" modal.
- Automatic insertion of drawn SMILES into batch input.
- Prediction model selection interface.
- Batch prediction configuration options.
- Output format selection.
- Molecular descriptor and confidence score options.
- Job Queue placeholder.
- Recent Results placeholder.

### User Interface

- Improved Workbench layout using responsive flexbox.
- Standardized button styling across the application.
- Full-width action buttons for Workbench operations.
- Improved spacing and typography throughout the site.
- Updated textarea sizing for improved usability.
- Added grouped Prediction Settings sections.
- Refined component spacing and alignment.
- Improved visual consistency between application pages.

### Team

- Added student developer profile.
- Added profile photo.
- Added WPI profile link.
- Added WPI contact information.

### Infrastructure

- Reused shared JSME implementation across multiple pages.
- Reduced duplicate JavaScript by centralizing editor logic.
- Prepared frontend structure for future backend API integration.