const xlsx = require('better-xlsx');

module.exports = function (RED) {
    function BufferXlsx(config) {
        RED.nodes.createNode(this, config);
        this.complex = config.complex;
        var node = this;
        node.on('input', function (msg) {
            if (node.complex) {
                ComplexToXlsx(node, msg);
            } else {
                SimpleToXlsx(node, msg);
            }
        });
    }

    function ComplexToXlsx(node, msg) {
        msg.payload = "TBD";
        node.send(msg);
    }

    function SimpleToXlsx(node, msg) {
        const file = new xlsx.File();
        console.log(node.complex);
        msg.payload.forEach(sheet => {
            readSheet(sheet, file);
        });
        let type = "base64"
        // Convert to buffer before continueing node.
        file
            .saveAs(type).then(b64 => {
                msg.payload = Buffer.from(b64, 'base64');
                msg.send(msg);
            }).catch(err => {
                console.log(err);
                node.send(msg);
            })
    }

    function readSheet(sheet, file) {
        let sheetStyling = null;
        let headerStyling = null;
        let add_sheet;
        Object.entries(sheet).forEach(([keyS, valueS]) => {
            switch (keyS) {
                case 'sheet_name':
                    add_sheet = file.addSheet(valueS);
                    break;
                case 'sheet_styling':
                    sheetStyling = valueS;
                    break;
                case 'header_styling':
                    headerStyling = valueS;
                    break;
                case 'rows':
                    valueS.forEach((row, index) => {
                        readRow(add_sheet, row, index, sheetStyling, headerStyling)
                    });
                    break;
                default:
                    break;
            }
        })
    }

    // Row JSON Reading
    function readRow(add_sheet, row, index, sheetStyling, headerStyling) {
        const add_row = add_sheet.addRow();
        let rowStyling = null;

        Object.entries(row).forEach(([keyC, valueC]) => {
            switch (keyC) {
                case 'row_styling':
                    rowStyling = valueC;
                    break;
                case 'cells':
                    valueC.forEach((cell) => {
                        readCell(add_row, cell, index, sheetStyling, headerStyling, rowStyling)
                    });
                    break;
                default:
                    break;
            }
        })
    }

    // Cell JSON Reading
    function readCell(add_row, cell, index, sheetStyling, headerStyling, rowStyling) {
        const add_cell = add_row.addCell();
        let cellStyling = null;

        Object.entries(cell).forEach(([keyL, valueL]) => {
            switch (keyL) {
                case 'cell_value':
                    add_cell.value = valueL;
                    break;
                case 'cell_format':
                    add_cell.numFmt = valueL;
                    break;
                case 'cell_formula':
                    add_cell.setFormula = valueL;
                    break;
                case 'cell_styling':
                    cellStyling = valueL;
                    break;
                default:
                    break;
            }
        })
        styleCell(add_cell, index, sheetStyling, headerStyling, rowStyling, cellStyling);
    }

    // Cell Styling
    function styleCell(add_cell, index, sheetStyling, headerStyling, rowStyling, cellStyling) {

        // Based on following priority styling is chosen:
        // 1. Header
        // 2. Cell
        // 3. Row
        // 4. Sheet
        let stylePriority = null;
        const style = new xlsx.Style();
        if (index === 0) {
            stylePriority = headerStyling;
        } else if (cellStyling) {
            stylePriority = cellStyling;
        } else if (rowStyling) {
            stylePriority = rowStyling;
        } else if (sheetStyling) {
            stylePriority = sheetStyling;
        }

        Object.entries(stylePriority).forEach(([keySt, valueSt]) => {

            // Styling parameters
            switch (keySt) {
                case 'pattern_type':
                    // Fill Parameters
                    style.fill.patternType = valueSt;
                    break;
                case 'fgColor':
                    style.fill.fgColor = valueSt;
                    break;
                case 'bgColor':
                    style.fill.bgColor = valueSt;
                    break;
                case 'hAlign':
                    // Align Parameters
                    style.align.h = valueSt;
                    break;
                case 'vAlign':
                    style.align.v = valueSt;
                    break;
                case 'indent':
                    style.align.indent = valueSt;
                    break;
                case 'shrinkToFit':
                    style.align.shrinkToFit = valueSt;
                    break;
                case 'textRotation':
                    style.align.textRotation = valueSt;
                    break;
                case 'wrapText':
                    style.align.wrapText = valueSt;
                    break;
                case 'fSize':
                    // Font parameters
                    style.font.sz = valueSt;
                    break;
                case 'fName':
                    style.font.name = valueSt;
                    break;
                case 'fFamily':
                    style.font.family = valueSt;
                    break;
                case 'fCharset':
                    style.font.charset = valueSt;
                    break;
                case 'fColor':
                    style.font.color = valueSt;
                    break;
                case 'fBold':
                    style.font.bold = valueSt;
                    break;
                case 'fItalic':
                    style.font.italic = valueSt;
                    break;
                case 'fUnderline':
                    style.font.underline = valueSt;
                    break;

                default:
                    break;
            }

            // Border parameters
            // TODO: Add border styling
        })
        add_cell.style = style;
    }

    RED.nodes.registerType("buffer-xlsx", BufferXlsx);
}