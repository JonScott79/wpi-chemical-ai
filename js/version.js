/*
    version.js

    WPI Predict Version Information

    Centralized application version data used
    throughout the website.

*/


// =====================================
// Version Information
// =====================================

const VERSION = {

    stage: "Production",

    version: "1.0.5",

    codename: "WPI-Predict",

    changelog: "CHANGELOG.md"

};


// =====================================
// Footer Version Display
// =====================================

document.addEventListener("DOMContentLoaded", () => {

    const versionElement = document.getElementById("version");


    if (!versionElement) {

        return;

    }


    versionElement.innerHTML = `

        <a
            href="${VERSION.changelog}"
            target="_blank"
            rel="noopener noreferrer"
            title="View release notes">

            v${VERSION.version}

        </a>

    `;

});