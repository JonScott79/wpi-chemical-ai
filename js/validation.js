/* =====================================
   SMILES Validation
===================================== */

const SMILES_MAX_LENGTH = 500;

/* =====================================
   Public Validation
===================================== */

function validateSmiles(smiles) {

    smiles = smiles.trim();

    if (!smiles)
        return invalid("Please enter a SMILES formula.");

    if (smiles.length > SMILES_MAX_LENGTH)
        return invalid("SMILES formula is too long.");

    if (!hasAllowedCharacters(smiles))
        return invalid("SMILES contains invalid characters.");

    if (!hasBalancedParentheses(smiles))
        return invalid("Parentheses are not balanced.");

    if (!hasBalancedBrackets(smiles))
        return invalid("Brackets are not balanced.");

    return valid();

}

/* =====================================
   Character Validation
===================================== */

function hasAllowedCharacters(smiles) {

    return /^[A-Za-z0-9@+\-\[\]\(\)=#$:\\/.%*,]+$/.test(smiles);

}

/* =====================================
   Parentheses
===================================== */

function hasBalancedParentheses(smiles) {

    let count = 0;

    for (const ch of smiles) {

        if (ch === "(") count++;

        if (ch === ")") count--;

        if (count < 0)
            return false;

    }

    return count === 0;

}

/* =====================================
   Brackets
===================================== */

function hasBalancedBrackets(smiles) {

    let count = 0;

    for (const ch of smiles) {

        if (ch === "[") count++;

        if (ch === "]") count--;

        if (count < 0)
            return false;

    }

    return count === 0;

}

/* =====================================
   Helpers
===================================== */

function valid() {

    return {

        valid: true,

        message: "✓ Valid SMILES format"

    };

}

function invalid(message) {

    return {

        valid: false,

        message

    };

}

/* =====================================
   UI
===================================== */

function showValidation(result) {

    const box = document.getElementById("smilesValidation");

    if (!box)
        return;

    box.textContent = result.message;

    box.className = result.valid
        ? "validation success"
        : "validation error";

}