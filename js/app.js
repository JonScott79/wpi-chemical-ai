/* =====================================
   Application
===================================== */

document.addEventListener("DOMContentLoaded", () => {

    console.log("WPI Predict Platform Ready");

    const runButton = document.getElementById("runPrediction");

    const predictionModal = document.getElementById("predictionModal");

    const outputContent = document.getElementById("outputContent");

    /* =====================================
       Run Prediction
    ====================================== */

    runButton.addEventListener("click", () => {

        const smiles = document.getElementById("smiles").value;

        const result = validateSmiles(smiles);

        showValidation(result);

        if (!result.valid)
            return;

        predictionModal.classList.remove("hidden");

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

    function closePrediction() {

        predictionModal.classList.add("hidden");

    }

    document
    .getElementById("closePrediction")
    .addEventListener("click", closePrediction);

    document
    .getElementById("closePredictionFooter")
    .addEventListener("click", closePrediction);

});