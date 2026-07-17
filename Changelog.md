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