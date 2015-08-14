/// <reference path="ImageWritr.js" />

document.onreadystatechange = function (event) {
    if (event.target.readyState != "complete") {
        return;
    }

    var spriteDrawers = [];

    var input = document.getElementById("text-input");
    var output = document.getElementById("output");

    var o = new ImageWritr.ImageWritr();
    input.onkeypress = function(key) {
        if(key.which == 13) {
            o.processInput(input.value, output, spriteDrawers);
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

