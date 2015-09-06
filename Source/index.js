/// <reference path="ImageWritr.js" />

document.onreadystatechange = function (event) {
    if (event.target.readyState != "complete") {
        return;
    }

    window.ImageWriter = new ImageWritr.ImageWritr({
        "allowedJS": {
            "javascript": true
        },
        "allowedImages": {
            "gif": true,
            "png": true,
            "jpeg": true,
            "jpg": true
        },
        "sectionSelector": "#palettes",
        "inputSelector": "#input",
        "outputSelector": "#output",
        "textInputSelector": "#text-input",
        "paletteDefault": "Mario",
        "palettes": {
            "Black & White": [
              [0, 0, 0, 0],
              [255, 255, 255, 255],
              [0, 0, 0, 255]
            ],
            "GameBoy": [
              [0, 0, 0, 0],
              [255, 255, 255, 255],
              [0, 0, 0, 255],
              [199, 199, 192, 255],
              [128, 128, 128, 255]
            ],
            "Mario": [
                [0, 0, 0, 0],
                // Grayscales (1-4)
                [255, 255, 255, 255],
                [0, 0, 0, 255],
                [188, 188, 188, 255],
                [116, 116, 116, 255],
                // Reds & Browns (5-11)
                [252, 216, 168, 255],
                [252, 152, 56, 255],
                [252, 116, 180, 255],
                [216, 40, 0, 255],
                [200, 76, 12, 255],
                [136, 112, 0, 255],
                [124, 7, 0, 255],
                // Greens (12-14, and 21)
                [168, 250, 188, 255],
                [128, 208, 16, 255],
                [0, 168, 0, 255],
                // Blues (15-20)
                [24, 60, 92, 255],
                [0, 128, 136, 255],
                [32, 56, 236, 255],
                [156, 252, 240, 255],
                [60, 188, 252, 255],
                [92, 148, 252, 255],
                // Green (21) for Luigi
                [0, 130, 0, 255],
                // Pinkish tan (22) for large decorative text
                [252, 188, 176, 255]
            ]
        }
    });
};
