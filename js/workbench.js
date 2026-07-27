console.log("1 - workbench.js loaded");

/* =====================================
   Research Workbench
===================================== */

document.addEventListener("DOMContentLoaded", async () => {

    console.log("2 - DOMContentLoaded");

    const runButton = document.getElementById("runBatchPrediction");

    console.log("3 - Run Button:", runButton);

    if (!runButton) {

        console.error("Run button not found.");

        return;

    }

    runButton.addEventListener("click", runPrediction);

    console.log("4 - Click handler attached");

    console.log("5 - Loading models...");

    await loadModels();

    console.log("6 - Models loaded");

});

/* =====================================
   Prediction Models
===================================== */

async function loadModels() {

    console.log("7 - Entered loadModels()");

    const select = document.getElementById("predictionModel");

    console.log("8 - Select:", select);

    if (!select) {

        console.error("predictionModel select not found.");

        return;

    }

    try {

        console.log("9 - Calling API.getModels()");

        const models = await API.getModels();

        console.log("10 - Models returned:", models);

        select.innerHTML = "";

        for (const model of models) {

            console.log("11 - Adding:", model);

            const option = document.createElement("option");

            option.value = model.id;

            option.textContent =
                `${model.name} (${model.property})`;

            select.appendChild(option);

        }

        console.log("12 - Finished populating dropdown");

    }

    catch (error) {

        console.error("loadModels() failed:", error);

        select.innerHTML = "";

        const option = document.createElement("option");

        option.textContent = "Unable to load models";

        select.appendChild(option);

    }

}

/* =====================================
   Prediction
===================================== */

async function runPrediction() {

    console.log("13 - runPrediction()");

    const textarea = document.getElementById("smilesBatch");

    console.log("14 - Textarea:", textarea);

    if (!textarea)
        return;

    const smilesList = textarea.value
        .split("\n")
        .map(smiles => smiles.trim())
        .filter(smiles => smiles.length > 0);

    console.log("15 - SMILES:", smilesList);

    if (smilesList.length === 0) {

        alert("Please enter at least one SMILES structure.");

        return;

    }

    clearResults();

    const results = [];

    const modelSelect =
        document.getElementById("predictionModel");

    const selectedModel =
        modelSelect.options[modelSelect.selectedIndex].text;

    for (const smiles of smilesList) {

        const validation = validateSmiles(smiles);

        console.log("16 - Validation:", validation);

        if (!validation.valid) {

            addResultRow({

                smiles,
                formula: "—",
                logP: "—",
                status: validation.message

            });

            continue;

        }

        try {

            console.log("17 - Predicting:", smiles);

            const response = await API.predictLogP(smiles);

            console.log("18 - Prediction:", response);

            const result = {

                smiles,

                formula: response.prediction.formula,

                model: selectedModel,

                property: "LogP",

                value: Number(response.prediction.logP).toFixed(3),

                units: "",

                confidence: "",

                status: "Complete"

            };

            results.push(result);

            addResultRow({

                smiles: result.smiles,

                formula: result.formula,

                logP: result.value,

                status: result.status

            });

        }

        catch (error) {

            console.error("Prediction failed:", error);

            addResultRow({

                smiles,
                formula: "—",
                logP: "—",
                status: error.message

            });

        }

    }

	const exportCSV =
		document.getElementById("exportCSV").checked;

	const exportJSON =
		document.getElementById("exportJSON").checked;

    if (exportCSV)
        Export.downloadCSV(results);

    if (exportJSON)
        Export.downloadJSON(results);

}

/* =====================================
   Results
===================================== */

function clearResults() {

    console.log("19 - Clearing results");

    const table = document.getElementById("resultsTable");

    if (!table)
        return;

    table.innerHTML = "";

}

function addResultRow(result) {

    console.log("20 - Adding row:", result);

    const table = document.getElementById("resultsTable");

    if (!table)
        return;

    const row = document.createElement("tr");

    row.innerHTML = `

        <td>${result.smiles}</td>
        <td>${result.formula}</td>
        <td>${result.logP}</td>
        <td>${result.status}</td>

    `;

    table.appendChild(row);

}