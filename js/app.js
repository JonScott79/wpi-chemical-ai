/* =====================================
   Application
===================================== */

document.addEventListener("DOMContentLoaded", () => {

    console.log("WPI Predict Platform Ready");

    const runButton = document.getElementById("runPrediction");
    const predictionModal = document.getElementById("predictionModal");
    const outputContent = document.getElementById("outputContent");

    if (!runButton) {
        console.log("Prediction elements not found on this page.");
        return;
    }

    let focusedElementBeforeModal = null;

    function trapFocus(e) {
        const isTabPressed = e.key === "Tab";
        const isEscPressed = e.key === "Escape";

        if (isEscPressed) {
            closePrediction();
            return;
        }

        if (!isTabPressed) {
            return;
        }

        const focusableElements = predictionModal.querySelectorAll('button, [tabindex="0"]');
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

    function openPrediction() {
        focusedElementBeforeModal = document.activeElement;
        predictionModal.classList.remove("hidden");

        requestAnimationFrame(() => {
            const closeBtn = document.getElementById("closePrediction");
            if (closeBtn) closeBtn.focus();
        });

        predictionModal.addEventListener("keydown", trapFocus);
    }

    function closePrediction() {
        predictionModal.classList.add("hidden");
        predictionModal.removeEventListener("keydown", trapFocus);
        if (focusedElementBeforeModal) {
            focusedElementBeforeModal.focus();
        }
    }

    runButton.addEventListener("click", () => {

        const smiles = document.getElementById("smiles").value;

        const result = validateSmiles(smiles);

        showValidation(result);

        if (!result.valid)
            return;

        openPrediction();

        outputContent.innerHTML = `

<b>Status</b>

Prototype Mode

────────────────────────────

<b>SMILES</b>

${smiles}

────────────────────────────

Prediction models have not yet been connected.

Waiting for backend prediction models.

`;

    });

    /* =====================================
       Copy Output
    ====================================== */

    document
    .getElementById("copyOutput")
    .addEventListener("click", () => {

        navigator.clipboard.writeText(
            outputContent.innerText
        );

    });

    /* =====================================
       Print Output
    ====================================== */

    document
    .getElementById("printOutput")
    .addEventListener("click", () => {

        window.print();

    });

    /* =====================================
       Close Prediction Modal
    ====================================== */

    document
    .getElementById("closePrediction")
    .addEventListener("click", closePrediction);

    document
    .getElementById("closePredictionFooter")
    .addEventListener("click", closePrediction);

});