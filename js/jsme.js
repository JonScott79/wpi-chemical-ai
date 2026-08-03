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
    if (!drawButton) {
        return;
    }

    const closeButton = document.getElementById("closeJsme");
    const cancelButton = document.getElementById("cancelJsme");
    const applyButton = document.getElementById("applyJsme");

    let focusedElementBeforeModal = null;

    // Always start hidden
    modal.classList.add("hidden");

    /* ================================
       Keyboard / Focus Trap
    ================================= */

    function trapFocus(e) {
        const isTabPressed = e.key === "Tab";
        const isEscPressed = e.key === "Escape";

        if (isEscPressed) {
            closeModal();
            return;
        }

        if (!isTabPressed) {
            return;
        }

        const focusableElements = modal.querySelectorAll('button, [tabindex="0"]');
        const firstFocusableElement = focusableElements[0];
        const lastFocusableElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) { // Shift + Tab
            if (document.activeElement === firstFocusableElement) {
                lastFocusableElement.focus();
                e.preventDefault();
            }
        } else { // Tab
            if (document.activeElement === lastFocusableElement) {
                firstFocusableElement.focus();
                e.preventDefault();
            }
        }
    }

    /* ================================
       Open Editor
    ================================= */

    drawButton.addEventListener("click", () => {

        focusedElementBeforeModal = document.activeElement;
        modal.classList.remove("hidden");

        requestAnimationFrame(() => {
            closeButton.focus();
        });

        modal.addEventListener("keydown", trapFocus);

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
        modal.removeEventListener("keydown", trapFocus);

        if (focusedElementBeforeModal) {
            focusedElementBeforeModal.focus();
        }

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