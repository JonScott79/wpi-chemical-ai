/* =====================================
   analytics.js
   -------------------------------------
   Production Analytics Integration for WPI Predict.
   Provides unified tracking for Google Analytics 4 (GA4)
   and Microsoft Clarity.

   Loaded exactly once per page load.
   ===================================== */

(function() {
    // 1. Google Analytics 4 (gtag.js) Integration
    const GA_MEASUREMENT_ID = "G-46D1RXLCJL";
    
    // Inject GA4 Script
    const gaScript = document.createElement("script");
    gaScript.async = true;
    gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(gaScript);

    window.dataLayer = window.dataLayer || [];
    function gtag() {
        dataLayer.push(arguments);
    }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, {
        send_page_view: true
    });

    // 2. Microsoft Clarity Integration
    const CLARITY_PROJECT_ID = "xypwnzq28l";
    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", CLARITY_PROJECT_ID);

    // 3. Centralized Analytics namespace
    const pageLoadTime = Date.now();
    let firstInteractionTracked = false;
    let predictionSessionStarted = false;

    window.WPI_Analytics = {
        // Track raw event to GA4 and Clarity
        track(eventName, params = {}) {
            // Log to console in development
            if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
                console.log(`[Analytics Event] ${eventName}`, params);
            }
            
            // GA4 track
            if (typeof gtag === "function") {
                gtag('event', eventName, params);
            }
            
            // Clarity custom event track
            if (typeof clarity === "function") {
                clarity("event", eventName, params);
            }
        },

        // Helper to mark first interaction
        trackFirstInteraction() {
            if (firstInteractionTracked) return;
            firstInteractionTracked = true;
            const timeSinceLoad = (Date.now() - pageLoadTime) / 1000;
            this.track("first_user_interaction", {
                time_since_load_seconds: Number(timeSinceLoad.toFixed(2))
            });
        },

        // Navigation Events
        Navigation: {
            pageView(path, title) {
                window.WPI_Analytics.track("nav_page_view", {
                    page_path: path,
                    page_title: title
                });
            },
            internalClick(linkText, linkUrl) {
                window.WPI_Analytics.track("nav_internal_click", {
                    link_text: linkText,
                    link_url: linkUrl
                });
            },
            menuClick(menuItem) {
                window.WPI_Analytics.track("nav_menu_click", {
                    menu_item: menuItem
                });
            },
            footerClick(linkText, linkUrl) {
                window.WPI_Analytics.track("nav_footer_click", {
                    link_text: linkText,
                    link_url: linkUrl
                });
            },
            externalClick(linkText, linkUrl) {
                window.WPI_Analytics.track("nav_external_click", {
                    link_text: linkText,
                    link_url: linkUrl
                });
            }
        },

        // Homepage/Workbench Events
        Homepage: {
            loaded() {
                window.WPI_Analytics.track("homepage_loaded");
            },
            predictionSessionStarted() {
                if (predictionSessionStarted) return;
                predictionSessionStarted = true;
                const timeUntilPred = (Date.now() - pageLoadTime) / 1000;
                window.WPI_Analytics.track("prediction_session_started", {
                    time_until_prediction_seconds: Number(timeUntilPred.toFixed(2))
                });
            }
        },

        // Workbench specific actions
        Workbench: {
            predictionSubmitted(modelId, modelName, inputType, tempK) {
                window.WPI_Analytics.Homepage.predictionSessionStarted();
                window.WPI_Analytics.track("prediction_submitted", {
                    model_id: modelId,
                    model_name: modelName,
                    input_type: inputType, // 'smiles', 'file', 'drawing'
                    temperature_k: tempK
                });
            },
            predictionCompleted(modelId, modelName, moleculeCount) {
                window.WPI_Analytics.track("prediction_completed", {
                    model_id: modelId,
                    model_name: modelName,
                    molecule_count: moleculeCount
                });
            },
            predictionFailed(modelId, modelName, errorMessage) {
                window.WPI_Analytics.track("prediction_failed", {
                    model_id: modelId,
                    model_name: modelName,
                    error_message: errorMessage
                });
            },
            predictionCancelled(modelId, modelName) {
                window.WPI_Analytics.track("prediction_cancelled", {
                    model_id: modelId,
                    model_name: modelName
                });
            },
            modelSelected(modelId, modelName) {
                window.WPI_Analytics.track("model_selected", {
                    model_id: modelId,
                    model_name: modelName
                });
            },
            modelChanged(oldModelId, newModelId) {
                window.WPI_Analytics.track("model_changed", {
                    old_model_id: oldModelId,
                    new_model_id: newModelId
                });
            },
            chemicalInputMethod(method) {
                window.WPI_Analytics.track("chemical_input_method", {
                    method: method // 'smiles', 'file', 'drawing'
                });
            },
            pubchemLookup(queryLength, status) {
                window.WPI_Analytics.track("pubchem_lookup", {
                    query_length: queryLength,
                    status: status // 'success', 'fail', 'ambiguous'
                });
            },
            compoundSelected(compoundName) {
                window.WPI_Analytics.track("compound_selected", {
                    compound_name: compoundName
                });
            },
            ambiguousCompoundPopup(query, resultsCount) {
                window.WPI_Analytics.track("ambiguous_compound_popup", {
                    query: query,
                    results_count: resultsCount
                });
            },
            parameterChanged(parameterName, value) {
                window.WPI_Analytics.track("parameter_changed", {
                    parameter_name: parameterName,
                    value: value
                });
            },
            resultsCopied(format) {
                window.WPI_Analytics.track("results_copied", {
                    format: format // 'csv', 'json', 'table'
                });
            },
            resultsPrinted() {
                window.WPI_Analytics.track("results_printed");
            },
            drawMoleculeClicked() {
                window.WPI_Analytics.track("draw_molecule_clicked");
            },
            moleculeDrawn() {
                window.WPI_Analytics.track("molecule_drawn");
            },
            moleculeApplied() {
                window.WPI_Analytics.track("molecule_applied");
            }
        },

        // Research Page Events
        Research: {
            publicationViewed(title) {
                window.WPI_Analytics.track("publication_viewed", {
                    publication_title: title
                });
            },
            pdfDownloaded(title, filename) {
                window.WPI_Analytics.track("pdf_downloaded", {
                    publication_title: title,
                    file_name: filename
                });
            },
            doiClicked(title, doi) {
                window.WPI_Analytics.track("doi_clicked", {
                    publication_title: title,
                    doi: doi
                });
            }
        },

        // Team Page Events
        Team: {
            emailClicked(name, email) {
                window.WPI_Analytics.track("team_email_clicked", {
                    member_name: name,
                    email: email
                });
            },
            profileClicked(name, url) {
                window.WPI_Analytics.track("team_profile_clicked", {
                    member_name: name,
                    url: url
                });
            },
            portfolioClicked(name, url) {
                window.WPI_Analytics.track("team_portfolio_clicked", {
                    member_name: name,
                    url: url
                });
            }
        },

        // General Events
        General: {
            importantButtonClicked(buttonId, buttonText) {
                window.WPI_Analytics.track("important_button_clicked", {
                    button_id: buttonId,
                    button_text: buttonText
                });
            }
        }
    };

    // Track first user interaction globally
    window.addEventListener("click", () => window.WPI_Analytics.trackFirstInteraction(), { once: true });
    window.addEventListener("keydown", () => window.WPI_Analytics.trackFirstInteraction(), { once: true });
    window.addEventListener("mousedown", () => window.WPI_Analytics.trackFirstInteraction(), { once: true });

    // Track page load and links
    document.addEventListener("DOMContentLoaded", () => {
        // Log page view event
        const path = window.location.pathname;
        const title = document.title;
        window.WPI_Analytics.Navigation.pageView(path, title);

        // Auto intercept link clicks
        document.body.addEventListener("click", (event) => {
            const anchor = event.target.closest("a");
            if (!anchor) return;

            const href = anchor.getAttribute("href") || "";
            const text = anchor.textContent.trim() || anchor.getAttribute("aria-label") || "Link";

            // 1. External Links
            if (href.startsWith("http://") || href.startsWith("https://")) {
                const isInternalDomain = href.includes("predict.wpi.edu") || href.includes("localhost") || href.includes("127.0.0.1");
                if (!isInternalDomain) {
                    // Check if it's DOI
                    if (href.includes("doi.org")) {
                        const card = anchor.closest(".publication-card");
                        const pubTitle = card ? card.querySelector("h3")?.textContent?.trim() : "Unknown";
                        window.WPI_Analytics.Research.doiClicked(pubTitle, href);
                    } else if (anchor.closest(".team-card")) {
                        const card = anchor.closest(".team-card");
                        const memberName = card ? card.querySelector("h3")?.textContent?.trim() : "Unknown";
                        if (text.toLowerCase().includes("profile") || href.includes("/people/")) {
                            window.WPI_Analytics.Team.profileClicked(memberName, href);
                        } else if (text.toLowerCase().includes("portfolio") || href.includes("lanzar.me")) {
                            window.WPI_Analytics.Team.portfolioClicked(memberName, href);
                        }
                    } else {
                        window.WPI_Analytics.Navigation.externalClick(text, href);
                    }
                    return;
                }
            }

            // 2. PDF Downloads
            if (href.endsWith(".pdf") || href.includes("/papers/")) {
                const card = anchor.closest(".publication-card");
                const pubTitle = card ? card.querySelector("h3")?.textContent?.trim() : "Unknown";
                window.WPI_Analytics.Research.pdfDownloaded(pubTitle, href.split("/").pop());
                return;
            }

            // 3. Mailto Links
            if (href.startsWith("mailto:")) {
                const email = href.replace("mailto:", "");
                const card = anchor.closest(".team-card");
                const memberName = card ? card.querySelector("h3")?.textContent?.trim() : "Unknown";
                window.WPI_Analytics.Team.emailClicked(memberName, email);
                return;
            }

            // 4. Menu Clicks (Header)
            if (anchor.closest("header") || anchor.closest("nav") || anchor.closest(".nav-dropdown")) {
                window.WPI_Analytics.Navigation.menuClick(text);
                return;
            }

            // 5. Footer Clicks
            if (anchor.closest("footer")) {
                window.WPI_Analytics.Navigation.footerClick(text, href);
                return;
            }

            // 6. Generic Internal clicks
            window.WPI_Analytics.Navigation.internalClick(text, href);
        });

        // Track when publication cards come into view
        const cards = document.querySelectorAll(".publication-card");
        if (cards.length > 0 && typeof IntersectionObserver !== "undefined") {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const pubTitle = entry.target.querySelector("h3")?.textContent?.trim() || "Unknown";
                        window.WPI_Analytics.Research.publicationViewed(pubTitle);
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.2 });
            cards.forEach(card => observer.observe(card));
        }
    });
})();
