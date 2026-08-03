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

- Fusion predictor currently reports **Ready: False** because the required artifact:

  `models/EnthalpyOfFusion/raw_features_tuned.pkl`

  has not yet been deployed.

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