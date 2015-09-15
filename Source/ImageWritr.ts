/// <reference path="ImageWritr.d.ts" />

module ImageWritr {
    "use strict";

    export class ImageWritr implements IImageWritr {
        /**
         * 
         */
        private PixelRender: PixelRendr.IPixelRendr;

        /**
         * 
         */
        private palettes: { [i: string]: number[][]; };

        /**
         * 
         */
        private palette: string;

        /**
         * 
         */
        private allowedImages: { [i: string]: boolean; };

        /**
         * 
         */
        private allowedJS: { [i: string]: boolean; };

        /**
         * 
         */
        private output: HTMLElement;

        /**
         * 
         */
        private paletteSection: HTMLElement;

        /**
         * 
         */
        private paletteIdPrefix: string;

        /**
         * 
         */
        private outputImageFormat: string;

        /**
         * 
         */
        private spriteDrawers: SpriteDrawr[];

        /**
         * 
         */
        constructor(settings: IImageWritrSettings) {
            this.palettes = {};
            this.spriteDrawers = [];
            this.paletteIdPrefix = "palette_";
            this.allowedJS = settings.allowedJS;
            this.allowedImages = settings.allowedImages;
            this.palette = settings.paletteDefault;
            this.outputImageFormat = settings.outputImageFormat;

            this.output = <HTMLElement>document.querySelector(
                settings.outputSelector);
            this.paletteSection = <HTMLElement>document.querySelector(
                settings.sectionSelector);

            this.initializePalettes(settings.palettes);
            this.initializeInput(settings.inputSelector);
            this.initializeTextInput(settings.textInputSelector);
        }


        /*
            Internal resets
        */

        /**
         * 
         */
        private initializeTextInput(textInputSelector: string): void {
            var textInput: HTMLElement =
                <HTMLElement>document.querySelector(textInputSelector);
            textInput.onclick = function(e: Event): void {
                e.stopPropagation();
            };
            var self: any = this;
            textInput.onkeypress = function(key: KeyboardEvent): void {
                if (key.which !== 13) { return; }

                try {
                    self.PixelRender = new PixelRendr.PixelRendr({
                        "paletteDefault": self.palettes[self.palette],
                        "library": { "sprite": this.value }
                    });

                    self.processSprite(
                        "sprite",
                        self.PixelRender.getBaseLibrary().sprite.length / 4 );
                } catch (e) {
                    addErrorElement(
                        self.output,
                        "The input string sprite may be incorrect or the palette may have too few colors." );
                }
            };
        }

        /**
         * 
         */
        private initializePalettes(palettes: {[i: string]: number[][]}): void {
            this.paletteSection.appendChild(this.initializePaletteUploader());

            var name: string,
                element: HTMLElement,
                chosen: HTMLElement;

            for (name in palettes) {
                if (!palettes.hasOwnProperty(name)) {
                    continue;
                }

                element = this.initializePalette(name, palettes[name]);
                this.paletteSection.appendChild(element);

                if (name === this.palette) {
                    chosen = element;
                }
            }

            chosen.click();
        }

        /**
         * 
         */
        private initializePalette(name: string, palette: number[][] | Uint8ClampedArray[]): HTMLDivElement {
            var surround: HTMLDivElement = document.createElement("div"),
                label: HTMLHeadingElement = document.createElement("h4"),
                container: HTMLDivElement = document.createElement("div"),
                color: number[],
                boxOut: HTMLDivElement,
                boxIn: HTMLDivElement,
                i: number;

            surround.className = "palette";
            label.className = "palette-label";
            container.className = "palette-container";
            label.textContent = "Palette: " + name;

            for (i = 0; i < palette.length; i += 1) {
                color = <number[]>palette[i];

                boxOut = document.createElement("div");
                boxOut.className = "palette-box";

                boxIn = document.createElement("div");
                boxIn.className = "palette-box-in";
                boxIn.style.background = "rgba(" + color.join(",") + ")";

                boxOut.appendChild(boxIn);
                container.appendChild(boxOut);
            }

            name = generatePaletteId(name, this.palettes);
            this.palettes[name] = <any>palette;

            surround.onclick =
                this.choosePalette.bind(this, surround, name, palette);
            surround.id = this.paletteIdPrefix + name;
            surround.appendChild(label);
            surround.appendChild(container);

            return surround;
        }

        /**
         * 
         */
        private initializePaletteUploader(): HTMLElement {
            var surround: HTMLDivElement = document.createElement("div"),
                label: HTMLHeadingElement = document.createElement("h4");

            surround.className = "palette palette-uploader";
            label.className = "palette-label";

            label.textContent = "Drag or upload an image here to generate a palette.";

            this.initializeClickInput(surround);
            this.initializeDragInput(surround);

            (<IWorkerHTMLElement>surround.children[0]).workerCallback = this.workerPaletteUploaderStart.bind(this);

            surround.appendChild(label);

            return surround;
        }

        /**
         * 
         */
        private choosePalette(element: HTMLElement, name: string, palette: number[][], event?: Event): void {
            var elements: HTMLCollection = element.parentElement.children,
                i: number;

            for (i = 0; i < elements.length; i += 1) {
                (<HTMLElement>elements[i]).className = "palette";
            }

            element.className = "palette palette-selected";

            this.PixelRender = new PixelRendr.PixelRendr({
                "paletteDefault": palette
            });

            this.palette = name;
        }


        /*
            Input
        */

        /**
         * 
         */
        private initializeInput(selector: string): void {
            var input: HTMLElement = <HTMLElement>document.querySelector(selector);

            this.initializeClickInput(input);
            this.initializeDragInput(input);
        }

        /**
         * 
         */
        private initializeClickInput(input: HTMLElement): void {
            var dummy: HTMLInputElement = document.createElement("input");

            dummy.type = "file";
            dummy.multiple = true;
            dummy.onchange = this.handleFileDrop.bind(this, dummy);

            input.addEventListener("click", function(): void {
                dummy.click();
            });

            input.appendChild(dummy);
        }

        /**
         * 
         */
        private initializeDragInput(input: HTMLElement): void {
            input.ondragenter = this.handleFileDragEnter.bind(this, input);
            input.ondragover = this.handleFileDragOver.bind(this, input);
            input.ondragleave = input.ondragend = this.handleFileDragLeave.bind(this, input);
            input.ondrop = this.handleFileDrop.bind(this, input);
        }

        /**
         * 
         */
        private handleFileDragEnter(input: HTMLElement, event: DragEvent): void {
            if (event.dataTransfer) {
                event.dataTransfer.dropEffect = "copy";
            }
            input.className += " hovering";
        }

        /**
         * 
         */
        private handleFileDragOver(input: HTMLInputElement, event: DragEvent): boolean {
            event.preventDefault();
            return false;
        }

        /**
         * 
         */
        private handleFileDragLeave(input: HTMLInputElement, event: DragEvent): void {
            if (event.dataTransfer) {
                event.dataTransfer.dropEffect = "none";
            }
            input.className = input.className.replace(" hovering", "");
        }

        /**
         * 
         * 
         * @remarks input.files is when the input[type=file] is the source, while
         *          event.dataTransfer.files is for drag-and-drop.
         */
        private handleFileDrop(input: HTMLInputElement, event: DragEvent): void {
            var files: FileList = input.files || event.dataTransfer.files,
                elements: IWorkerHTMLElement[] = [],
                file: File,
                tag: string,
                element: HTMLDivElement,
                i: number;

            this.handleFileDragLeave(input, event);

            event.preventDefault();
            event.stopPropagation();

            for (i = 0; i < files.length; i += 1) {
                file = files[i];
                tag = file.type.split("/")[1];

                if (this.allowedJS[tag]
                    && !(<IWorkerHTMLElement>event.target).workerCallback ) {
                    this.processSpriteLibrary(file);
                } else if (this.allowedImages[tag]) {
                    elements.push(
                        this.createWorkerElement(
                            files[i], <IWorkerHTMLElement>event.target) );
                } else {
                    element = document.createElement("div");
                    element.className = "output output-failed";
                    element.textContent = "'" + file.name
                        + "' is either a folder or has a non-allowed image or JS filetype...";
                    elements.push(element);
                }

            }

            for (i = 0; i < elements.length; i += 1) {
                insertBeforeChildElements(this.output, elements[i]);
            }
        }

        /**
         * 
         */
        private processSpriteLibrary(file: File): void {
            var self: any = this;
            var reader: FileReader = new FileReader();
            reader.onloadend = function(): void {
                var fileContents: string = this.result
                    .replace(/^[^=]*=/, "return")
                    .replace(/[^ ]*FullScreen[^ ,;]*/g, "'_'");
                var settings: PixelRendr.IPixelRendrSettings;
                try {
                    settings = new Function(fileContents)();
                } catch (e) {
                    addErrorElement(
                        self.output,
                        "'" + file.name
                            + "' is not a correct Javascript file." );
                    return;
                }
                var element: HTMLElement = document.createElement("div");
                element.className = "output output-uploading";
                element.textContent = "Generating '" + file.name + "'...";
                insertBeforeChildElements(self.output, element);
                self.workerPaletteFinish(
                    settings.paletteDefault, file.name, element, "" );
                // Leave default values to make sure we can draw the sprites.
                settings.spriteWidth = settings.spriteHeight = "";
                settings.scale = 1;
                try {
                    self.PixelRender = new PixelRendr.PixelRendr(settings);
                    self.traverseSpriteLibrary(
                        self.PixelRender.getBaseLibrary() );
                } catch (e) {
                    addErrorElement(
                        self.output,
                        "A string sprite in '" + file.name
                            + "' may be incorrect or the palette may have too few colors." );
                }
            };
            reader.readAsText(file);
        }

        /**
         * 
         */
        private createWorkerElement(file: File, target: IWorkerHTMLElement): IWorkerHTMLElement {
            var element: IWorkerHTMLElement = <IWorkerHTMLElement>document.createElement("div"),
                reader: FileReader = new FileReader();

            element.workerCallback = target.workerCallback;
            element.className = "output output-uploading";
            element.setAttribute("palette", this.palette);
            element.textContent = "Uploading '" + file.name + "'...";

            reader.onprogress = this.workerUpdateProgress.bind(this, file.name, element);
            reader.onloadend = this.workerTryStartWorking.bind(this, file.name, element);
            reader.readAsDataURL(file);

            return element;
        }

        /**
         * 
         */
        private workerUpdateProgress(filename: string, element: HTMLElement, event: ProgressEvent): void {
            if (!event.lengthComputable) {
                return;
            }

            var percent: number = Math.min(Math.round((event.loaded / event.total) * 100), 100);

            element.textContent = "Uploading '" + filename + "' (" + percent + "%)...";
        }

        /**
         * 
         */
        private workerTryStartWorking(filename: string, element: IWorkerHTMLElement, event: ProgressEvent): void {
            var result: string = (<any>event.currentTarget).result;

            if (element.workerCallback) {
                element.workerCallback(result, filename, element, event);
            } else {
                this.workerTryStartWorkingDefault(result, filename, element, event);
            }
        }

        /**
         * 
         */
        private workerTryStartWorkingDefault(result: string, filename: string, element: HTMLElement, event: Event): void {
            if (result.length > 100000) {
                this.workerCannotStartWorking(result, filename, element, event);
            } else {
                this.workerStartWorking(result, filename, element, event);
            }
        }

        /**
         * 
         */
        private processSprite(key: string, value: number): void {
            var e: any = createDomElements();
            this.spriteDrawers.push( new SpriteDrawr(
                this.PixelRender, key, value, this.outputImageFormat,
                e.left, e.right, e.width, e.height, e.canvas, e.link) );
            e.container.setAttribute("palette", this.palette);
            e.container.className = "output output-complete";
            insertBeforeChildElements(this.output, e.container);
            insertBeforeChildElements(
                e.container, document.createElement("br") );
            insertBeforeChildElements(
                e.container, document.createTextNode(
                    "Finished '" + key + "' ('" + this.palette
                    + "' palette)." ) );
        }

        /**
         * 
         */
        private traverseSpriteLibrary(o: Object, prevKey: string = ""): void {
            var i: any;
            for (i in o) {
                if (o[i] !== null && typeof(o[i]) === "object") {
                    if ( o[i].constructor !== Uint8ClampedArray ) {
                        this.traverseSpriteLibrary( o[i], prevKey + i + " " );
                    } else if ( o[i].length > 0 ) {
                        this.processSprite(
                            (i !== "normal" ? prevKey + i : prevKey),
                            o[i].length / 4 );
                    }
                }
            }
        }

        /**
         * 
         */
        private workerCannotStartWorking(result: string, filename: string, element: HTMLElement, event: Event): void {
            element.textContent = "'" + filename + "' is too big! Use a smaller file.";
            element.className = "output output-failed";
        }

        /**
         * 
         */
        private workerStartWorking(resultBase64: string, filename: string, element: HTMLElement, event: Event): void {
            element.className = "output output-working";
            element.textContent = "Working on " + filename + "...";
            element.appendChild(document.createElement("br"));
            element.appendChild( setupTextInput(resultBase64) );

            this.parseBase64Image(resultBase64, this.workerFinishRender.bind(this, filename, element));
        }

        /**
         * 
         */
        private parseBase64Image(src: string, callback: PixelRendr.IPixelRendrEncodeCallback): void {
            var image: HTMLImageElement = document.createElement("img");
            image.onload = this.PixelRender.encode.bind(this.PixelRender, image, callback);
            image.src = src;
        }

        /**
         * 
         */
        private workerFinishRender(filename: string, element: HTMLElement, result: string, image: HTMLImageElement): void {
            element.firstChild.textContent = "Finished '" + filename + "' ('" + element.getAttribute("palette") + "' palette).";
            element.className = "output output-complete";
            element.style.backgroundImage = "url('" + image.src + "')";
            element.appendChild( setupTextInput(result) );
        }

        /**
         * 
         */
        private workerPaletteUploaderStart(result: string, filename: string, element: HTMLElement, event: Event): void {
            var image: HTMLImageElement = document.createElement("img");
            image.onload = this.workerPaletteCollect.bind(this, image, filename, element, result);
            image.src = result;

            element.className = "output output-working";
            element.textContent = "Working on " + filename + "...";
        }

        /**
         * 
         */
        private workerPaletteCollect(image: HTMLImageElement, filename: string, element: HTMLElement, src: string, event: Event): void {
            var canvas: HTMLCanvasElement = document.createElement("canvas"),
                context: CanvasRenderingContext2D = <CanvasRenderingContext2D>canvas.getContext("2d"),
                data: Uint8ClampedArray;

            canvas.width = image.width;
            canvas.height = image.height;

            context.drawImage(image, 0, 0);

            data = <Uint8ClampedArray><any>context.getImageData(0, 0, canvas.width, canvas.height).data;

            this.workerPaletteFinish(
                this.PixelRender.generatePaletteFromRawData(<Uint8ClampedArray>data, true, true),
                filename,
                element,
                src);
        }

        /**
         * 
         */
        private selectExistingPalette(palette: Uint8ClampedArray[]): boolean {
            var key: string = findPaletteKey(palette, this.palettes);
            if (key) {
                this.choosePalette(
                    <HTMLElement>document.querySelector(
                        "#" + this.paletteIdPrefix + key),
                    key, this.palettes[key] );
                return true;
            } else {
                return false;
            }
        }

        /**
         * 
         */
        private workerPaletteFinish(colors: Uint8ClampedArray[], filename: string, element: HTMLElement, src: string): void {
            if (this.selectExistingPalette(colors)) {
                element.className = "output output-info";
                element.setAttribute("palette", this.palette);
                element.textContent =
                    "This palette is already loaded. It is now selected.";
                return;
            }

            var chooser: HTMLDivElement =
                this.initializePalette(filename, colors);
            chooser.style.backgroundImage = "url('" + src + "')";

            if (colors.length > 999) {
                element.className = "output output-failed";
                element.textContent = "Too many colors (>999) in "
                    + filename + " palette.";
            }

            element.className = "output output-complete";
            element.textContent = "Created " + filename + " palette ("
                + colors.length + " colors).";

            this.paletteSection.appendChild(chooser);

            element.appendChild(
                setupTextInput("[ [" + colors.join("], [") + "] ]") );

            chooser.click();
            element.setAttribute("palette", this.palette);
        }
    }

    function setupTextInput(value: string): HTMLInputElement {
        var textInput: HTMLInputElement = document.createElement("input");
        textInput.spellcheck = false;
        textInput.className = "selectable";
        textInput.type = "text";
        textInput.setAttribute("value", value);
        return textInput;
    }

    function createDomElements(): any {
        var e: any = {
            container : document.createElement( "div" ),
            left   : createInputHelper( "button", "←" ),
            right  : createInputHelper( "button", "→" ),
            width  : createInputHelper( "text" ),
            height : createInputHelper( "text" ),
            link   : document.createElement( "a" ),
            canvas : document.createElement( "canvas" )
        };
        e.width.className = e.height.className = "size-display";
        e.container.appendChild( e.left );
        e.container.appendChild( e.right );
        e.container.appendChild( document.createElement("br") );
        e.container.appendChild( e.width );
        e.container.appendChild( e.height );
        e.container.appendChild( document.createElement("br") );
        e.container.appendChild( e.link );
        e.link.appendChild( e.canvas );
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
        private spriteKey: string;
        private dims: number[][];
        private outputFormat: string;
        private dimIndex: number;
        private canvas: HTMLCanvasElement;
        private widthText: HTMLInputElement;
        private heightText: HTMLInputElement;
        private link: HTMLAnchorElement;
        private leftButton: HTMLInputElement;
        private rightButton: HTMLInputElement;

        constructor(
            pixelRender: PixelRendr.IPixelRendr,
            spriteKey: string,
            nPixels: number,
            outputFormat: string,
            leftButton: HTMLInputElement,
            rightButton: HTMLInputElement,
            widthText: HTMLInputElement,
            heightText: HTMLInputElement,
            canvas: HTMLCanvasElement,
            link: HTMLAnchorElement
        ) {
            this.pixelRender = pixelRender;
            this.spriteKey = spriteKey;
            this.outputFormat = outputFormat;
            this.dims = calculatePossibleDimensions(nPixels);
            this.dimIndex = Math.floor( (this.dims.length - 1) / 2 );
            this.canvas = canvas;
            this.widthText  = widthText;
            this.heightText = heightText;
            this.link = link;
            this.leftButton  = leftButton;
            this.rightButton = rightButton;
            var self: any = this;
            this.leftButton.onclick  = function(): void {
                self.updateDim("-");
            };
            this.rightButton.onclick = function(): void {
                self.updateDim("+");
            };
            this.updateDim();
        }

        private updateDim(op?: string): void {
            var maxInd: number = this.dims.length - 1;
            if ( op === "+" ) {
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

            this.rightButton.disabled = (this.dimIndex === maxInd);
            this.leftButton .disabled = (this.dimIndex === 0);

            this.render();
        }

        private render(): void {
            var sizing: any = {
                spriteWidth: this.canvas.width,
                spriteHeight: this.canvas.height
            };
            var sprite: any = this.pixelRender.decode(this.spriteKey, sizing);
            var context: any = this.canvas.getContext("2d");

            var imageData: any = context.getImageData(
                0, 0, this.canvas.width, this.canvas.height);
            this.pixelRender.memcpyU8(sprite, imageData.data);
            context.putImageData(imageData, 0, 0);

            (<any>this.link).download =
                this.spriteKey.replace(/ /g, "_") + "." + this.outputFormat;
            this.link.href = this.canvas.toDataURL(
                "image/" + this.outputFormat );
        }
    }

    function calculatePossibleDimensions(nPixels: number): number[][] {
        if ( nPixels === 0 ) { return null; }

        var dims: number[][] = [ [1, nPixels] ];
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

    function arraysEqual(a: number[], b: Uint8ClampedArray): boolean {
        var i: number = a.length;
        if (i !== b.length) { return false; }
        while (i--) {
            if (a[i] !== b[i]) { return false; }
        }
        return true;
    }

    function generatePaletteId(
        basename: string,
        palettes: {[i: string]: number[][]})
    : string {
        var name: string = basename.replace(/[^a-zA-Z0-9_\-]/g, "");
        for (var n: number = 2; palettes[name]; ++n) {
            if (n === 2) {
                name += "_2";
            } else {
                name = name.substring( 0, name.lastIndexOf("_") + 1 ) + n;
            }
        }
        return name;
    }

    function findPaletteKey(
        palette: Uint8ClampedArray[],
        palettes: {[i: string]: number[][]})
    : string {
        var key: string;
        for (key in palettes) {
            if ( palettes[key].constructor === Array
                && palettes[key].length === palette.length
            ) {
                var equal: boolean = true;
                for (var i: number = 0; i < palette.length; ++i) {
                    if ( !arraysEqual(palettes[key][i], palette[i]) ) {
                        equal = false;
                        break;
                    }
                }
                if (equal) { return key; }
            }
        }
        return "";
    }

    function insertBeforeChildElements(parent: HTMLElement, child: Node)
    : HTMLElement {
        parent.insertBefore(child, parent.firstElementChild);
        return parent;
    }

    function addErrorElement(output: HTMLElement, message: string): void {
        var error: HTMLElement = document.createElement("div");
        error.className = "output output-failed";
        error.textContent = message;
        insertBeforeChildElements(output, error);
    }
}

