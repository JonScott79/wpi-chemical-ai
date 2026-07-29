/* =====================================
   Export Engine
===================================== */

const Export = {

    /* =====================================
       CSV
    ====================================== */

    downloadCSV(results) {

        if (!results.length)
            return;

        const headers = [

            "SMILES",
            "Formula",
            "Model",
            "Property",
            "Temperature",
            "Value",
            "Units",
            "Confidence",
            "Status"

        ];

        const rows = results.map(result => [

            result.smiles,
            result.formula,
            result.model,
            result.property,
            result.temperature != null
                ? `${Number(result.temperature).toFixed(2)} K`
                : "—",
            result.value,
            result.units,
            result.confidence,
            result.status

        ]);

        const csv = [

            headers.join(","),

            ...rows.map(row =>
                row.map(value =>
                    `"${String(value ?? "").replace(/"/g, '""')}"`
                ).join(",")
            )

        ].join("\n");

        this.download(

            csv,
            "predictions.csv",
            "text/csv"

        );

    },

    /* =====================================
       JSON
    ====================================== */

    downloadJSON(results) {

        if (!results.length)
            return;

        this.download(

            JSON.stringify(results, null, 4),

            "predictions.json",

            "application/json"

        );

    },

    /* =====================================
       Download Helper
    ====================================== */

    download(content, filename, type) {

        const blob = new Blob(

            [content],

            { type }

        );

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;

        link.download = filename;

        document.body.appendChild(link);

        link.click();

        link.remove();

        URL.revokeObjectURL(url);

    }

};