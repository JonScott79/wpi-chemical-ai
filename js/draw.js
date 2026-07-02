/* =====================================
   Molecule Editor
===================================== */

/* --- Initialize --- */

document.addEventListener("DOMContentLoaded",()=>{

    document
        .getElementById("drawButton")
        .addEventListener("click",openMoleculeEditor);

});

/* --- Open Editor --- */

function openMoleculeEditor(){

    window.open(
        API.ketcher,
        "ketcher",
        "width=1400,height=900,resizable=yes"

    );

}