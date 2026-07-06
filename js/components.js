/* =====================================
   Components
===================================== */

async function loadComponent(id, file){

    const response = await fetch(file);

    const html = await response.text();

    document
        .getElementById(id)
        .innerHTML = html;

}

document.addEventListener("DOMContentLoaded", async () => {

    await loadComponent(
        "header-placeholder",
        "components/header.html"
    );

    await loadComponent(
        "footer-placeholder",
        "components/footer.html"
    );

    initializeNavigation();

    initializeVersion();

});

/* =====================================
   Navigation
===================================== */

function initializeNavigation(){

    const modelsButton =
        document.getElementById("modelsButton");

    const modelsMenu =
        document.getElementById("modelsMenu");

    if(!modelsButton || !modelsMenu)
        return;

    modelsButton.addEventListener("click", e => {

        e.stopPropagation();

        modelsMenu.classList.toggle("hidden");

    });

    document.addEventListener("click", () => {

        modelsMenu.classList.add("hidden");

    });

}

/* =====================================
   Version
===================================== */

function initializeVersion(){

    const version =
        document.getElementById("version");

    if(!version)
        return;

    version.textContent =
        `${VERSION.stage} • ${VERSION.version}`;

}