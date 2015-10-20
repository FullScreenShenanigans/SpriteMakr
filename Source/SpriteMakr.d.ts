/// <reference path="References/PixelRendr-0.2.0.ts" />

declare module SpriteMakr {
    export interface IWorkerHTMLElement extends HTMLElement {
        workerCallback?: (...args: any[]) => void;
    }

    type Palette = { [i: string]: number[][] };

    export interface ISpriteMakrSettings {
        outputImageFormat: string,
        allowedImages: { [i: string]: boolean; };
        allowedJS: { [i: string]: boolean; };
        sectionSelector: string;
        inputSelector: string;
        outputSelector: string;
        textInputSelector: string;
        paletteDefault: string;
        palettes: Palette;
    }

    export interface ISpriteMakr {

    }
}
