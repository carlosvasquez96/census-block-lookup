function findCensusBlock() {

    const address = document.getElementById("address").value.trim();
    const message = document.getElementById("message");
    const results = document.getElementById("results");

    if (!address) {
        message.textContent = "Please enter an address.";
        results.style.display = "none";
        return;
    }

    message.textContent = "Searching Census Block Group...";
    results.style.display = "none";

    const callbackName = "censusCallback_" + Date.now();

    window[callbackName] = function(data) {

        try {

            console.log("Census response:", data);

            const matches = data.result.addressMatches;

            if (!matches || matches.length === 0) {

                message.textContent =
                    "Address not found. Please check the address.";

                cleanup();
                return;
            }

            const match = matches[0];

            document.getElementById("matchedAddress").textContent =
                match.matchedAddress || address;

            const addressComponents =
                match.addressComponents || {};

            const geographies =
                match.geographies || {};

            console.log("Geographies returned:", geographies);

            /*
             * Find the Census Block Group layer.
             */

            let blockGroups = null;

            for (const key in geographies) {

                if (key.toLowerCase().includes("census block groups")) {

                    blockGroups = geographies[key];
                    break;
                }
            }

            if (!blockGroups || blockGroups.length === 0) {

                message.textContent =
                    "The address was found, but a Census Block Group was not returned.";

                results.style.display = "none";

                cleanup();
                return;
            }

            const blockGroup = blockGroups[0];

            /*
             * TEA-style Census Block Group GEOID
             */

            const blockGroupGEOID =
                blockGroup["GEOID"] || "Not available";

            document.getElementById("censusBlock").textContent =
                blockGroupGEOID;

            /*
             * Block Group number
             */

            document.getElementById("blockGroup").textContent =
                blockGroup["BLKGRP"] || "Not available";

            /*
             * Census Tract
             */

            document.getElementById("censusTract").textContent =
                blockGroup["TRACT"] || "Not available";

            /*
             * County
             */

            document.getElementById("county").textContent =
                addressComponents.county || "Webb County";

            /*
             * State
             */

            document.getElementById("state").textContent =
                addressComponents.state || "TX";

            message.textContent = "";

            results.style.display = "block";

            cleanup();

        } catch (error) {

            console.error("Census processing error:", error);

            message.textContent =
                "There was a problem processing the Census information.";

            results.style.display = "none";

            cleanup();
        }
    };


    /*
     * Census Geocoder request
     *
     * Benchmark 2020
     * Census 2020 geography
     * Census Block Groups layer
     */

    const url =
        "https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress" +
        "?address=" + encodeURIComponent(address) +
        "&benchmark=2020" +
        "&vintage=Census2020_Census2020" +
        "&layers=Census%20Block%20Groups" +
        "&format=jsonp" +
        "&callback=" + callbackName;


    const script = document.createElement("script");

    script.src = url;

    script.onerror = function() {

        message.textContent =
            "Unable to contact the Census Geocoder.";

        results.style.display = "none";

        cleanup();
    };

    document.body.appendChild(script);


        function cleanup() {

        if (script.parentNode) {
            script.parentNode.removeChild(script);
        }

        delete window[callbackName];
    }
}


// Allow the Enter key to submit the lookup
document.getElementById("lookupForm").addEventListener("submit", function(event) {

    event.preventDefault();

    findCensusBlock();

});


// Copy the TEA Census Block Group
function copyCensusBlock() {

    const censusBlock =
        document.getElementById("censusBlock").textContent.trim();

    if (!censusBlock || censusBlock === "Not available") {
        return;
    }

    const button = document.querySelector(".copy-button");

    // Try the modern clipboard method first
    if (navigator.clipboard && window.isSecureContext) {

        navigator.clipboard.writeText(censusBlock)
            .then(function() {

                button.textContent = "Copied!";

                setTimeout(function() {
                    button.textContent = "Copy";
                }, 1500);

            })
            .catch(function() {

                copyUsingFallback(censusBlock, button);

            });

    } else {

        copyUsingFallback(censusBlock, button);

    }
}


// Clipboard fallback
function copyUsingFallback(text, button) {

    const textArea = document.createElement("textarea");

    textArea.value = text;

    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";

    document.body.appendChild(textArea);

    textArea.focus();
    textArea.select();

    try {

        const successful =
            document.execCommand("copy");

        if (successful) {

            button.textContent = "Copied!";

            setTimeout(function() {
                button.textContent = "Copy";
            }, 1500);

        } else {

            button.textContent = "Copy failed";

            setTimeout(function() {
                button.textContent = "Copy";
            }, 2000);
        }

    } catch (error) {

        console.error("Copy failed:", error);

        button.textContent = "Copy failed";

        setTimeout(function() {
            button.textContent = "Copy";
        }, 2000);
    }

    document.body.removeChild(textArea);
}