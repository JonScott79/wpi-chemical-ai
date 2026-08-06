/* =====================================
   pubchem.js
   -------------------------------------
   Resolves chemical input into a
   standardized compound object.

   Resolution Provider

   • NCI CACTUS

   Future Providers

   • PubChem
   • OPSIN

   Author: Jon Scott
===================================== */

/* =====================================
   Cache
===================================== */

const compoundCache = new Map();

/* =====================================
   Public API
===================================== */

window.resolveCompound = async function(input){

    const value = input.trim();

    if(value.length === 0){

        return createError("No chemical input provided.");

    }

    const cacheKey = value.toLowerCase();

    if(compoundCache.has(cacheKey)){

        return compoundCache.get(cacheKey);

    }

    const smiles = await resolveSmiles(value);

    if(!smiles.success){

        return smiles;

    }

    const compound = createCompound({

        input: value,

        smiles: smiles.value,

        detectedType: isSmiles(value)
            ? "smiles"
            : "chemical"

    });

    compoundCache.set(cacheKey, compound);

    return compound;

};

/* =====================================
   Detection
===================================== */

function isSmiles(input){

    if(/[=#@+\[\]\(\)\\/%.]/.test(input)){

        return true;

    }

    if(

        input.length <= 12 &&

        /^[BCNOFPSIKclbr0-9]+$/i.test(input)

    ){

        return true;

    }

    return false;

}

/* =====================================
   CACTUS Resolver
===================================== */

async function resolveSmiles(input){

    /*
        Already SMILES.

        No lookup required.
    */

    if(isSmiles(input)){

        return{

            success:true,

            value:input

        };

    }

    try{

        const response = await fetch(

            `https://cactus.nci.nih.gov/chemical/structure/${encodeURIComponent(input)}/smiles`

        );

        if(!response.ok){

            return createError("Compound not found.");

        }

        const smiles = (await response.text()).trim();

        if(smiles.length === 0){

            return createError("Compound not found.");

        }

        return{

            success:true,

            value:smiles

        };

    }
    catch(error){

        console.error(error);

        return createError("Unable to contact resolver.");

    }

}

/* =====================================
   Object Construction
===================================== */

function createCompound(data){

    return{

        success:true,

        input:data.input ?? "",

        smiles:data.smiles ?? "",

        detectedType:data.detectedType ?? "unknown"

    };

}

function createError(message){

    return{

        success:false,

        message

    };

}