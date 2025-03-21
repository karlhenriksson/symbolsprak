"use strict";
/**
 * 
 * Encodes and decodes patterns to hex strings, used for the pattern "conlang" as
 * a standardized symbol storage system
 * 
 * TODO:
 * - Load from hex code?
 * - Add a "random" input option to newPattern, randomly clicking new elements when they're made
 */

// The size of the symbol
let width, height;
// Symbol data stores the bits for the current symbol
let symbolData;

const symbolContainer = document.getElementById("symbolContainer");

/**
 * Create a pattern with width and height values from the form
 */
function newFromForm() {
    const w = document.getElementById("wIn").value;
    const h = document.getElementById("hIn").value;
    newPattern(parseInt(w), parseInt(h));
}

/**
 * Create a new pattern with the specified width and height
 */
function newPattern(w, h) {
    // Reset the old symbol
    symbolData = [];
    symbolContainer.innerHTML = "";
    width = w;
    height = h;

    // Resize the symbol container
    symbolContainer.setAttribute("width", 100 * w);
    symbolContainer.setAttribute("height", 100 * h);

    // Figure out the necessary size for the symbol data list, set the list size here (fill with false:s)
    let length = (2 * w) * (2 * h) * 5 - 4 * (w + h) + 1;
    symbolData = new Array(length).fill(false);
    let i = 0;

    // Add lines (grayed out)
    function addLine(x1, y1, x2, y2) {
        const el = document.createElementNS("http://www.w3.org/2000/svg", "line");
        el.setAttribute("x1", x1);
        el.setAttribute("y1", y1);
        el.setAttribute("x2", x2);
        el.setAttribute("y2", y2);
        el.setAttribute("stroke", "lightgray");
        el.setAttribute("stroke-width", 5);
        // Add data about the index that this object corresponds to
        el.dataset.index = i++;
        el.onclick = symbolElementClicked;
        symbolContainer.appendChild(el);
    }
    for(let x = 0; x < 2 * w; x++) {
        for(let y = 0; y < 2 * h; y++) {
            if(x != 0) addLine(50 * x, 50 * y, 50 * x, 50 * y + 50);
            if(y != 0) addLine(50 * x, 50 * y, 50 * x + 50, 50 * y);
            addLine(50 * x, 50 * y, 50 * x + 50, 50 * y  + 50)
            addLine(50 * x + 50, 50 * y, 50 * x, 50 * y  + 50)
        }
    }

    // Add circles (off by default)
    for(let x = 0; x < 2 * w - 1; x++) {
        for(let y = 0; y < 2 * h - 1; y++) {
            const el = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            el.setAttribute("cx", 50 + 50 * x);
            el.setAttribute("cy", 50 + 50 * y);
            el.setAttribute("r", 10);
            el.setAttribute("stroke", "lightgray");
            el.setAttribute("stroke-width", 5);
            el.setAttribute("fill", "white");
            // Add data about the index that this object corresponds to
            el.dataset.index = i++;
            el.onclick = symbolElementClicked;
            symbolContainer.appendChild(el);
        }
    }
}

/**
 * Export to SVG
 */
function exportSVG() {
    // Create a dummy "output" SVG tag
    const output = document.createElementNS("http://www.w3.org/2000/svg", "svg");

    // Go through all the atoms of the SVG tag. If they're filled in, copy them to the output tag
    for(const atom of symbolContainer.children) {
        if(atom.getAttribute("stroke") === "black") {
            output.appendChild(atom.cloneNode(true));
        }
    }

    console.log(output);

    // Construct a URL with the SVG data for exporting
    const serializer = new XMLSerializer();
    const svgBlob = new Blob([serializer.serializeToString(output)], { type: "image/svg+xml" });
    const url = URL.createObjectURL(svgBlob);

    // Click the download link automatically to export
    const a = document.createElement('a');
    const e = new MouseEvent('click');
    a.download = 'symbol.svg';
    a.href = url;
    a.dispatchEvent(e);
}

/**
 * Export the current symbol as a PNG
 */
function exportPNG() {
    // Create a new canvas
    const output = document.createElement("canvas");

    // Set values and get context
    const ctx = output.getContext("2d");
    output.width = width * 100;
    output.height = height * 100;

    ctx.lineWidth = 5;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, output.width, output.height);

    // Go through all the atoms of the SVG tag. If they're filled in, copy them to the output tag
    for(const atom of symbolContainer.children) {
        if(atom.getAttribute("stroke") === "black") {
            // Depending on what type of atom this is, add it in different ways
            if(atom.hasAttribute("r")) {
                // Circle
                ctx.beginPath();
                ctx.arc(
                    atom.getAttribute("cx"),
                    atom.getAttribute("cy"),
                    atom.getAttribute("r"),
                    0,
                    6.3
                );
                ctx.fill();
                ctx.beginPath();
                ctx.arc(
                    atom.getAttribute("cx"),
                    atom.getAttribute("cy"),
                    atom.getAttribute("r"),
                    0,
                    6.3
                );
                ctx.stroke();
            } else {
                // Line
                ctx.beginPath();
                ctx.moveTo(atom.getAttribute("x1"), atom.getAttribute("y1"));
                ctx.lineTo(atom.getAttribute("x2"), atom.getAttribute("y2"));
                ctx.stroke();
            }
        }
    }

    // Export the content as a PNG
    const url = output.toDataURL("image/png");
    const a = document.createElement('a');
    const e = new MouseEvent('click');
    a.download = 'symbol.png';
    a.href = url;
    a.dispatchEvent(e);
}

/**
 * Export the current symbol as a hex string, copy it to clipboard
 */
function copyHex() {
    navigator.clipboard.writeText(width + "," + height + ":" + boolArrayToHex(symbolData));
}

// Yoinked from CGPT
function boolArrayToHex(arr) {
    if (!arr.length) return "";
    // Convert booleans to bit string
    let bits = arr.map(b => b ? "1" : "0").join("");
    // Pad to a multiple of 4
    const pad = (4 - bits.length % 4) % 4;
    bits = "0".repeat(pad) + bits;
    let hex = "";
    // Convert every 4 bits to a hex digit
    for (let i = 0; i < bits.length; i += 4) {
      hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
    }
    return hex;
}

/**
 * Listener function for when a symbol element is clicked. Toggles the active state and changes the data
 */
function symbolElementClicked(e) {
    const t = e.target;
    const wasOn = t.getAttribute("stroke") === "black";

    // Set style correctly
    t.setAttribute("stroke", wasOn ? "lightgray" : "black");

    // Change data bit
    symbolData[t.dataset.index] = !wasOn;
}

// Create a new symbol
newPattern(1, 2);