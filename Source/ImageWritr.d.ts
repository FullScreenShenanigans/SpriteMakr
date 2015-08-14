/// <reference path="References/PixelRendr-0.2.0.ts" />

declare module ImageReadr {
    export interface IWorkerHTMLElement extends HTMLElement {
        workerCallback?: (...args: any[]) => void;
    }

    export interface IImageReadrSettings {
        allowedFiles: { [i: string]: boolean; };
        sectionSelector: string;
        inputSelector: string;
        outputSelector: string;
        paletteDefault: string;
        palettes: { [i: string]: number[][] };
    }

    export interface IImageReadr {

    }
}
