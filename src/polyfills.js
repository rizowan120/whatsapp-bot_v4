/**
 * DOM polyfills for environments without canvas support (e.g., Termux, Alpine).
 * Must be imported BEFORE any module that uses pdfjs-dist (pdf-parse v2).
 *
 * pdfjs-dist expects browser DOM classes like DOMMatrix, Path2D, ImageData.
 * Since we only do text extraction (no rendering), empty stubs are safe.
 */

if (typeof globalThis.DOMMatrix === "undefined") {
    globalThis.DOMMatrix = class DOMMatrix {
        constructor() {
            this.a = 1; this.b = 0; this.c = 0;
            this.d = 1; this.e = 0; this.f = 0;
        }
        isIdentity = true;
        is2D = true;
        inverse() { return new DOMMatrix(); }
        multiply() { return new DOMMatrix(); }
        translate() { return new DOMMatrix(); }
        scale() { return new DOMMatrix(); }
        rotate() { return new DOMMatrix(); }
        transformPoint(p) { return p || {}; }
    };
}

if (typeof globalThis.Path2D === "undefined") {
    globalThis.Path2D = class Path2D {
        constructor() { }
        addPath() { }
        moveTo() { }
        lineTo() { }
        bezierCurveTo() { }
        quadraticCurveTo() { }
        arc() { }
        arcTo() { }
        rect() { }
        closePath() { }
    };
}

if (typeof globalThis.ImageData === "undefined") {
    globalThis.ImageData = class ImageData {
        constructor(sw, sh) {
            this.width = sw;
            this.height = sh;
            this.data = new Uint8ClampedArray(sw * sh * 4);
        }
    };
}
