/* =====================================
   API Configuration
===================================== */

const isDevelopment =

    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost";

const API = {

    base: isDevelopment

        ? "http://127.0.0.1:8000"

        : "",

    /* =====================================
       Model Discovery
    ===================================== */

    async getModels() {

        const response = await fetch(
            `${this.base}/api/models`
        );

        if (!response.ok)
            throw new Error(
                "Unable to load prediction models."
            );

        return await response.json();

    },

    /* =====================================
       LogP Prediction
    ===================================== */

    async predictLogP(smiles) {

        const response = await fetch(

            `${this.base}/api/predict/logp`,

            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    smiles
                })
            }

        );

        if (!response.ok) {

            const error = await response.json();

            throw new Error(
                error.detail || "Prediction failed."
            );

        }

        return await response.json();

    },

    /* =====================================
       Enthalpy of Fusion Prediction
    ===================================== */

    async predictEnthalpyFusion(smiles, temperature = 298.15) {

        const response = await fetch(

            `${this.base}/api/predict/enthalpy-fusion`,

            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    smiles,
                    temperature
                })
            }

        );

        if (!response.ok) {

            const error = await response.json();

            throw new Error(
                error.detail || "Prediction failed."
            );

        }

        return await response.json();

    }

};