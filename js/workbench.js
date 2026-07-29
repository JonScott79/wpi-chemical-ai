console.log("1 - workbench.js loaded");

/* =====================================
   Session
===================================== */

const sessionResults = [];

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

	document
		.getElementById("exportCSV")
		?.addEventListener("click", () => {

			Export.downloadCSV(sessionResults);

		});

	document
		.getElementById("exportJSON")
		?.addEventListener("click", () => {

			Export.downloadJSON(sessionResults);

		});

	document
		.getElementById("printResults")
		?.addEventListener("click", printResults);

	document
		.getElementById("clearResults")
		?.addEventListener("click", () => {

			if (!confirm("Clear all prediction results?"))
				return;

			sessionResults.length = 0;

			clearResults();

		});

    console.log("4 - Click handler attached");

    console.log("5 - Loading models...");

	await loadModels();

	initializeModelParameters();

	/* =====================================
	   SMILES Input
	===================================== */

	const textarea = document.getElementById("smilesBatch");

	if (textarea) {

		textarea.addEventListener("mousedown", (event) => {

			if (textarea.value.length === 0) {

				event.preventDefault();

				textarea.focus();

				textarea.setSelectionRange(0, 0);

			}

		});

	}

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
   Model Parameters
===================================== */

function initializeModelParameters() {

    const model =
        document.getElementById("predictionModel");

    if (!model)
        return;

    model.addEventListener(
        "change",
        updateModelParameters
    );

    updateModelParameters();

}

function updateModelParameters() {

    const model =
        document.getElementById("predictionModel");

    const parameters =
        document.getElementById("modelParameters");

    if (!model || !parameters)
        return;

    parameters.classList.toggle(

        "hidden",

        model.value !== "enthalpy-fusion"

    );

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

    const modelSelect =
        document.getElementById("predictionModel");

    const selectedOption =
        modelSelect.options[modelSelect.selectedIndex];

	const selectedModel = {

		id: selectedOption.value,
		name: selectedOption.text

	};

	const temperature = Number(

		document.getElementById(
			"predictionTemperature"
		)?.value || 298.15

	);

    for (const smiles of smilesList) {

        const validation = validateSmiles(smiles);

        console.log("16 - Validation:", validation);

        if (!validation.valid) {

            addResultRow({

                smiles,
                formula: "—",
                model: selectedModel.name,
                property: "—",
                value: "—",
                units: "—",
                status: validation.message

            });

            continue;

        }

        try {

            console.log("17 - Predicting:", smiles);

            let result;

            switch (selectedModel.id) {

                case "mflogp": {

                    const response =
                        await API.predictLogP(smiles);

                    console.log("18 - LogP Prediction:", response);

                    result = {

                        smiles,

                        formula: response.prediction.formula,

                        model: selectedModel.name,

                        property: "LogP",

                        value: Number(
                            response.prediction.logP
                        ).toFixed(3),

                        units: "—",

                        confidence: "—",

                        status: "Complete"

                    };

                    break;

                }

                case "enthalpy-fusion": {

					const response =
						await API.predictEnthalpyFusion(

							smiles,

							temperature

						);

                    console.log("18 - Fusion Prediction:", response);

                    result = {

                        smiles,

                        formula: response.prediction.formula,

                        model: selectedModel.name,

                        property: "ΔHfus",
						temperature: temperature,
						value: Number(
							response.prediction.value
						).toFixed(2),

                        units: "kJ/mol",

                        confidence:
                            `± ${Number(response.prediction.uncertainty).toFixed(2)}`,

                        status: "Complete"

                    };

                    break;

                }

                default:

                    throw new Error(
                        `Unsupported model: ${selectedModel.id}`
                    );

            }

            sessionResults.push(result);

            addResultRow(result);

        }

        catch (error) {

            console.error("Prediction failed:", error);

            addResultRow({

                smiles,
                formula: "—",
                model: selectedModel.name,
                property: "—",
                value: "—",
                units: "—",
                status: error.message

            });

        }

    }
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
        <td>${result.model}</td>
        <td>${result.property}</td>
        <td>${result.temperature != null ? `${Number(result.temperature).toFixed(2)} K` : "—"}</td>
        <td>${result.value}</td>
        <td>${result.units}</td>
        <td>${result.status}</td>

    `;

    table.appendChild(row);

}

/* =====================================
   Print
===================================== */

function printResults() {

    const table =
        document.querySelector(".downloads-table");

    if (!table)
        return;

    const model =
        document.getElementById("predictionModel")
        ?.selectedOptions[0]?.text ?? "Unknown";

    const temperature =
        document.getElementById("predictionTemperature")
        ?.value ?? "N/A";

    const now = new Date().toLocaleString();

    const printWindow = window.open("", "_blank");

    printWindow.document.write(`

<!DOCTYPE html>

<html>

<head>

<title>WPI Predict Report</title>

<style>

body{

    font-family:Arial, Helvetica, sans-serif;

    margin:40px;

    color:#222;

}

h1{

    margin-bottom:6px;

}

.info{

    margin-bottom:24px;

    line-height:1.7;

}

table{

    width:100%;

    border-collapse:collapse;

}

th,
td{

    border:1px solid #999;

    padding:8px;

    text-align:left;

}

th{

    background:#eeeeee;

}

</style>

</head>

<body>

<h1>WPI Predict</h1>

<div class="info">

<strong>Prediction Report</strong><br>

Generated: ${now}<br>

Model: ${model}<br>

Temperature: ${temperature} K

</div>

${table.outerHTML}

</body>

</html>

`);

    printWindow.document.close();

    printWindow.focus();

    printWindow.print();

    printWindow.close();

}