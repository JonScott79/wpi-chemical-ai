/* =====================================
   API Configuration
===================================== */

const API = {

    base: "",


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
    ====================================== */
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

    }

};