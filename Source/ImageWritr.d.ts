/// <reference path="References/PixelRendr-0.2.0.ts" />

declare module ImageWritr {
    export interface IImageWritr {
        processInput(
            inputString: string,
            output: HTMLElement,
            spriteDrawers: any[]
        ): void;
    }
}

