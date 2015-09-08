/// <reference path="References/PixelRendr-0.2.0.ts" />

declare module ImageWritr {
    export interface IWorkerHTMLElement extends HTMLElement {
        workerCallback?: (...args: any[]) => void;
    }

    export interface IImageWritrSettings {
        outputImageFormat: string,
        allowedImages: { [i: string]: boolean; };
        allowedJS: { [i: string]: boolean; };
        sectionSelector: string;
        inputSelector: string;
        outputSelector: string;
        textInputSelector: string;
        paletteDefault: string;
        palettes: { [i: string]: number[][] };
    }

    export interface IImageWritr {

    }
}
