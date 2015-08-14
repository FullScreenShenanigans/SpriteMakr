/// <reference path="ImageReadr.d.ts" />

module ImageReadr {
    "use strict";

    export class ImageReadr implements IImageReadr {
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
        private paletteDefault: string;

        /**
         * 
         */
        private allowedFiles: { [i: string]: boolean; };

        /**
         * 
         */
        private sectionSelector: string;

        /**
         * 
         */
        private inputSelector: string;

        /**
         * 
         */
        private outputSelector: string;

        /**
         * 
         */
        constructor(settings: IImageReadrSettings) {
            this.allowedFiles = settings.allowedFiles;
            this.sectionSelector = settings.sectionSelector;
            this.inputSelector = settings.inputSelector;
            this.outputSelector = settings.outputSelector;
            this.paletteDefault = settings.paletteDefault;
            this.palettes = settings.palettes;

            this.palette = settings.paletteDefault;

            this.initializePalettes();

            this.initializeInput(this.inputSelector);
        }


        /* Internal resets
        */

        /**
         * 
         */
        private initializePalettes(): void {
            var section: HTMLElement = <HTMLElement>document.querySelector(this.sectionSelector),
                name: string,
                element: HTMLElement,
                chosen: HTMLElement;

            section.appendChild(this.initializePaletteUploader());

            for (name in this.palettes) {
                if (!this.palettes.hasOwnProperty(name)) {
                    continue;
                }

                element = this.initializePalette(name, this.palettes[name]);
                section.appendChild(element);

                if (name === this.paletteDefault) {
                    chosen = element;
                }
            }

            chosen.click();
        }

        /**
         * 
         */
        private initializePalette(name: string, palette: number[][]| Uint8ClampedArray[]): HTMLDivElement {
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

            surround.onclick = this.choosePalette.bind(this, surround, name, palette);

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
        private choosePalette(element: HTMLElement, name: string, palette: number[][], event: Event): void {
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


        /* Input
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

            input.addEventListener("click", function (): void {
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
                output: HTMLElement = <HTMLElement>document.querySelector(this.outputSelector),
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

                if (!this.allowedFiles[tag]) {
                    element = document.createElement("div");
                    element.className = "output output-failed";
                    element.textContent = "'" + file.name + "' is either a folder or has a non-image type...";
                    elements.push(element);
                    continue;
                }

                elements.push(this.createWorkerElement(files[i], <IWorkerHTMLElement>event.target));
            }

            for (i = 0; i < elements.length; i += 1) {
                output.insertBefore(elements[i], output.firstElementChild);
            }
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
            element.innerText = "Uploading '" + file.name + "'...";

            reader.onprogress = this.workerUpdateProgress.bind(this, file, element);
            reader.onloadend = this.workerTryStartWorking.bind(this, file, element);
            reader.readAsDataURL(file);

            return element;
        }

        /**
         * 
         */
        private workerUpdateProgress(file: File, element: HTMLElement, event: ProgressEvent): void {
            if (!event.lengthComputable) {
                return;
            }

            var percent: number = Math.min(Math.round((event.loaded / event.total) * 100), 100);

            element.innerText = "Uploading '" + file.name + "' (" + percent + "%)...";
        }

        /**
         * 
         * 
         * 
         */
        private workerTryStartWorking(file: File, element: IWorkerHTMLElement, event: ProgressEvent): void {
            var result: string = (<any>event.currentTarget).result;

            if (element.workerCallback) {
                element.workerCallback(result, file, element, event);
            } else {
                this.workerTryStartWorkingDefault(result, file, element, event);
            }
        }

        /**
         * 
         */
        private workerTryStartWorkingDefault(result: string, file: File, element: HTMLElement, event: Event): void {
            if (result.length > 100000) {
                this.workerCannotStartWorking(result, file, element, event);
            } else {
                this.workerStartWorking(result, file, element, event);
            }
        }

        /**
         * 
         */
        private workerCannotStartWorking(result: string, file: File, element: HTMLElement, event: Event): void {
            element.innerText = "'" + file.name + "' is too big! Use a smaller file.";
            element.className = "output output-failed";
        }

        /**
         * 
         */
        private workerStartWorking(result: string, file: File, element: HTMLElement, event: Event): void {
            var displayBase64: HTMLInputElement = document.createElement("input");

            element.className = "output output-working";
            element.innerText = "Working on " + file.name + "...";

            displayBase64.spellcheck = false;
            displayBase64.className = "selectable";
            displayBase64.type = "text";
            displayBase64.setAttribute("value", result);

            element.appendChild(document.createElement("br"));
            element.appendChild(displayBase64);

            this.parseBase64Image(file, result, this.workerFinishRender.bind(this, file, element));
        }

        /**
         * 
         */
        private parseBase64Image(file: File, src: string, callback: PixelRendr.IPixelRendrEncodeCallback): void {
            var image: HTMLImageElement = document.createElement("img");
            image.onload = this.PixelRender.encode.bind(this.PixelRender, image, callback);
            image.src = src;
        }

        /**
         * 
         */
        private workerFinishRender(file: File, element: HTMLElement, result: string, image: HTMLImageElement): void {
            var displayResult: HTMLInputElement = document.createElement("input");

            displayResult.spellcheck = false;
            displayResult.className = "selectable";
            displayResult.type = "text";
            displayResult.setAttribute("value", result);

            element.firstChild.textContent = "Finished '" + file.name + "' ('" + element.getAttribute("palette") + "' palette).";
            element.className = "output output-complete";
            element.style.backgroundImage = "url('" + image.src + "')";

            element.appendChild(displayResult);
        }

        /**
         * 
         */
        private workerPaletteUploaderStart(result: string, file: File, element: HTMLElement, event: Event): void {
            var image: HTMLImageElement = document.createElement("img");
            image.onload = this.workerPaletteCollect.bind(this, image, file, element, result);
            image.src = result;

            element.className = "output output-working";
            element.innerText = "Working on " + file.name + "...";
        }

        /**
         * 
         */
        private workerPaletteCollect(image: HTMLImageElement, file: File, element: HTMLElement, src: string, event: Event): void {
            var canvas: HTMLCanvasElement = document.createElement("canvas"),
                context: CanvasRenderingContext2D = <CanvasRenderingContext2D>canvas.getContext("2d"),
                data: Uint8ClampedArray;

            canvas.width = image.width;
            canvas.height = image.height;

            context.drawImage(image, 0, 0);

            data = <Uint8ClampedArray><any>context.getImageData(0, 0, canvas.width, canvas.height).data;

            this.workerPaletteFinish(
                this.PixelRender.generatePaletteFromRawData(<Uint8ClampedArray>data, true, true),
                file,
                element,
                src);
        }

        /**
         * 
         */
        private workerPaletteFinish(colors: Uint8ClampedArray[], file: File, element: HTMLElement, src: string): void {
            var chooser: HTMLDivElement = this.initializePalette(file.name, colors),
                displayResult: HTMLInputElement = document.createElement("input");

            chooser.style.backgroundImage = "url('" + src + "')";

            displayResult.spellcheck = false;
            displayResult.className = "selectable";
            displayResult.type = "text";
            displayResult.setAttribute("value", "[ [" + colors.join("], [") + "] ]");

            if (colors.length > 999) {
                element.className = "output output-failed";
                element.innerText = "Too many colors (>999) in " + file.name + " palette.";
            }

            element.className = "output output-complete";
            element.innerText = "Created " + file.name + " palette (" + colors.length + " colors).";

            document.querySelector("#palettes").appendChild(chooser);

            element.appendChild(displayResult);

            chooser.click();
        }
    }
}
