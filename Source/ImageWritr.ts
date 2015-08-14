/// <reference path="ImageWritr.d.ts" />

module ImageWritr {
    "use strict";

    interface ISpriteDrawrDomElements {
        container: HTMLDivElement;
        left:   HTMLInputElement;
        right:  HTMLInputElement;
        width:  HTMLInputElement;
        height: HTMLInputElement;
        link:   HTMLAnchorElement;
        canvas: HTMLCanvasElement;
    }

    export class ImageWritr implements IImageWritr {
        processInput(
            inputString: string,
            output: HTMLElement,
            spriteDrawers: any[])
        : void {
            var pr: PixelRendr.IPixelRendr = createPixelRender( inputString );
            var e: ISpriteDrawrDomElements = createDomElements();
            spriteDrawers.push( new SpriteDrawr(
                pr, e.left, e.right, e.width, e.height, e.canvas, e.link) );
            output.insertBefore( e.container, output.firstElementChild );
        }
    }

    function createDomElements(): ISpriteDrawrDomElements {
        var e: ISpriteDrawrDomElements = {
            container : document.createElement( "div" ),
            left   : createInputHelper( "button", "←" ),
            right  : createInputHelper( "button", "→" ),
            width  : createInputHelper( "text" ),
            height : createInputHelper( "text" ),
            link   : document.createElement( "a" ),
            canvas : document.createElement( "canvas" )
        };
        e.container.appendChild( e.left );
        e.container.appendChild( e.right );
        e.container.appendChild( document.createElement("br") );
        e.container.appendChild( e.width );
        e.container.appendChild( e.height );
        e.container.appendChild( document.createElement("br") );
        e.container.appendChild( e.link );
        e.link.appendChild( e.canvas );
        e.container.className = "output";
        return e;
    }

    function createInputHelper(type: string, value?: string)
    : HTMLInputElement {
        var input: HTMLInputElement = document.createElement("input");
        if ( type === "text" ) {
            input.type = "text";
            input.readOnly = true;
        } else if ( type === "button" ) {
            input.type = "button";
            input.value = value;
        }
        return input;
    }

    class SpriteDrawr {
        private pixelRender: PixelRendr.IPixelRendr;
        private dims: number[][];
        private dimIndex: number;
        private canvas: HTMLCanvasElement;
        private widthText: HTMLInputElement;
        private heightText: HTMLInputElement;
        private link: HTMLAnchorElement;
        private leftButton: HTMLInputElement;
        private rightButton: HTMLInputElement;

        constructor(
            pixelRender: PixelRendr.IPixelRendr,
            leftButton: HTMLInputElement,
            rightButton: HTMLInputElement,
            widthText: HTMLInputElement,
            heightText: HTMLInputElement,
            canvas: HTMLCanvasElement,
            link: HTMLAnchorElement
        ) {
            this.pixelRender = pixelRender;
            var nPixels: number =
                this.pixelRender.getBaseLibrary().mySprite.length / 4;
            this.dims = calculatePossibleDimensions(nPixels);
            this.dimIndex = Math.floor( (this.dims.length - 1) / 2 );
            this.canvas = canvas;
            this.widthText  = widthText;
            this.heightText = heightText;
            this.link = link;
            this.leftButton  = leftButton;
            this.rightButton = rightButton;
            var that: any = this;
            this.leftButton.onclick  = function(): void {
                that.updateDim("-");
            };
            this.rightButton.onclick = function(): void {
                that.updateDim("+");
            };
            this.updateDim();
        }

        private updateDim(op?: string): void {
            if ( op === "+" ) {
                var maxInd: number = this.dims.length - 1;
                if ( this.dimIndex >= maxInd ) {
                    this.dimIndex = maxInd;
                } else {
                    ++this.dimIndex;
                }
            } else if ( op === "-" ) {
                if ( this.dimIndex <= 0 ) {
                    this.dimIndex = 0;
                } else {
                    --this.dimIndex;
                }
            }

            this.canvas.width  = this.dims[this.dimIndex][0];
            this.canvas.height = this.dims[this.dimIndex][1];
            this.widthText.value  = String( this.canvas.width );
            this.heightText.value = String( this.canvas.height );

            this.rightButton.readOnly = (this.dimIndex === maxInd);
            this.leftButton .readOnly = (this.dimIndex === 0);

            this.render();
        }

        private render(): void {
            var sizing: any = {
                spriteWidth: this.canvas.width,
                spriteHeight: this.canvas.height
            };
            var sprite: any = this.pixelRender.decode("mySprite", sizing);
            var context: any = this.canvas.getContext("2d");

            var imageData: any = context.getImageData(
                0, 0, this.canvas.width, this.canvas.height);
            this.pixelRender.memcpyU8(sprite, imageData.data);
            context.putImageData(imageData, 0, 0);

            // Work around error TS2339.
            (<any>this.link).download = "mario.png";
            this.link.href = this.canvas.toDataURL("image/png");
        }
    }

    function calculatePossibleDimensions(nPixels: number): number[][] {
        var dims: number[][] = [];
        var upTo: number = Math.sqrt(nPixels);
        for ( var n: number = 2; n <= upTo; ++n ) {
            if ( nPixels % n === 0 ) {
                dims.push( [n, nPixels / n] );
            }
        }

        var iReverseUpTo: number = dims.length - 1;
        if ( dims[iReverseUpTo][0] === dims[iReverseUpTo][1] ) {
            --iReverseUpTo;
        }
        for ( var i: number = iReverseUpTo ; i >= 0 ; --i ) {
            dims.push( [ dims[i][1], dims[i][0] ] );
        }

        return dims;
    }

    function createPixelRender(inputString: string): PixelRendr.IPixelRendr {
        return new PixelRendr.PixelRendr({
            "paletteDefault": [
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
                ],
           "filters": {
                "Underworld": ["palette", {
                    "05": "18",
                    "09": "16"
                }],
                "UnderworldKoopa": ["palette", {
                    "06": "09",
                    "14": "16"
                }],
                "Castle": ["palette", {
                    "02": "04",
                    "05": "01",
                    "09": "03"
                }],
                "Alt": ["palette", {
                    "11": "01"
                }],
                "Alt2": ["palette", {
                    "02": "04",
                    "05": "01",
                    "09": "03",
                    "13": "01",
                    "19": "08"
                }],
                "StarOne": ["palette", {}],
                "StarTwo": ["palette", {
                    "06": "02",
                    "08": "05",
                    "10": "09"
                }],
                "StarThree": ["palette", {
                    "06": "01",
                    "08": "06",
                    "10": "08"
                }],
                "StarFour": ["palette", {
                    "06": "01",
                    "08": "06",
                    "10": "14"
                }],
                "Smart": ["palette", {
                    "14": "08"
                }]
            },

            "library": {
                "mySprite": inputString
            }

        });
    }
}

