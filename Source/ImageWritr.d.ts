/// <reference path="References/PixelRendr-0.2.0.ts" />

declare module ImageWritr {
    export interface IImageWritr {}

    export function processInput(
        inputString: string,
        output: HTMLElement,
        imageWriters: IImageWritr[]
    ): void;
}

