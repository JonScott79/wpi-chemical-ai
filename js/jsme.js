/* =====================================
   JSME Integration
===================================== */

let jsmeApplet = null;

/*
    JSME requires this callback to exist.

    We intentionally initialize the editor
    AFTER the modal is visible so it can
    correctly determine its size.
*/
function jsmeOnLoad() {}

/* =====================================
   Modal
===================================== */

window.addEventListener("DOMContentLoaded", () => {

    const modal = document.getElementById("jsmeModal");

    // If this page doesn't use JSME, exit quietly.
    if (!modal) {
        return;
    }

    const drawButton = document.getElementById("drawButton");
    const closeButton = document.getElementById("closeJsme");
    const cancelButton = document.getElementById("cancelJsme");
    const applyButton = document.getElementById("applyJsme");

    // Always start hidden
    modal.classList.add("hidden");

    /* ================================
       Open Editor
    ================================= */

    drawButton.addEventListener("click", () => {

        modal.classList.remove("hidden");

        // Only create the editor once
        if (!jsmeApplet) {

            // Wait until the modal has been
            // laid out by the browser.
            requestAnimationFrame(() => {

                jsmeApplet = new JSApplet.JSME(
                    "jsme_container",
                    "700px",
                    "380px"
                );

            });

        }

    });

    /* ================================
       Close Editor
    ================================= */

    function closeModal() {

        modal.classList.add("hidden");

    }

    closeButton.addEventListener("click", closeModal);
    cancelButton.addEventListener("click", closeModal);

    /* ================================
       Apply SMILES
    ================================= */

    applyButton.addEventListener("click", () => {

        if (!jsmeApplet) {

            closeModal();
            return;

        }

        const smiles = jsmeApplet.smiles();

        // Home page (single prediction)
        const singleInput = document.getElementById("smiles");

        if (singleInput) {

            singleInput.value = smiles;

        }

        // Batch page (append to textarea)
        const batchInput = document.getElementById("smilesBatch");

        if (batchInput) {

            if (batchInput.value.trim() !== "") {

                batchInput.value += "\n";

            }

            batchInput.value += smiles;

        }

        closeModal();

    });

});