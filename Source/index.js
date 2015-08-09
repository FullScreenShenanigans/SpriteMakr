/// <reference path="ImageWritr.js" />

document.onreadystatechange = function (event) {
    if (event.target.readyState != "complete") {
        return;
    }

    var imageDrawers = [];

    var input = document.getElementById("text-input");
    var output = document.getElementById("output");

    input.onkeypress = function(key) {
        if(key.which == 13) {
            ImageWritr.processInput(input.value, output, imageDrawers);
        }
    };

    // Change input's class name when its value has changed.
    // For page reload: soft checking for the original input value (no digit).
    if( /[0-9]/.test( input.value ) ) {
        input.className = "";
    } else {
        input.oninput = function() {
            input.className = "";
            input.oninput = null;
        };
    }
};

