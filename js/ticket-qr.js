/* Version 1-L QR encoder for CineVerse booking references. */

function drawTicketQR(canvas, reference) {
    var alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";
    if (!/^[A-Z0-9-]{1,25}$/.test(reference)) return false;

    var bits = [];
    function addBits(value, length) {
        for (var i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1);
    }

    // Alphanumeric mode uses 11 bits per pair of characters.
    addBits(2, 4);
    addBits(reference.length, 9);
    for (var i = 0; i < reference.length; i += 2) {
        var first = alphabet.indexOf(reference[i]);
        if (i + 1 < reference.length) {
            addBits(first * 45 + alphabet.indexOf(reference[i + 1]), 11);
        } else {
            addBits(first, 6);
        }
    }
    addBits(0, Math.min(4, 152 - bits.length));
    while (bits.length % 8) bits.push(0);

    var data = [];
    for (var i = 0; i < bits.length; i += 8) {
        data.push(parseInt(bits.slice(i, i + 8).join(""), 2));
    }
    for (var pad = 0; data.length < 19; pad++) data.push(pad % 2 ? 17 : 236);

    // One Reed-Solomon block protects the 19 data bytes with seven check bytes.
    function multiplyBytes(left, right) {
        var result = 0;
        while (right) {
            if (right & 1) result ^= left;
            left = (left << 1) ^ (left & 128 ? 0x11d : 0);
            right >>>= 1;
        }
        return result;
    }

    var generator = [127, 122, 154, 164, 11, 68, 117];
    var correction = Array(7).fill(0);
    data.forEach(function(byte) {
        var factor = byte ^ correction.shift();
        correction.push(0);
        generator.forEach(function(coefficient, index) {
            correction[index] ^= multiplyBytes(coefficient, factor);
        });
    });
    bits = [];
    data.concat(correction).forEach(function(byte) { addBits(byte, 8); });

    var size = 21;
    var grid = Array.from({ length: size }, function() { return Array(size).fill(null); });
    function set(x, y, dark) {
        if (x >= 0 && y >= 0 && x < size && y < size) grid[y][x] = dark;
    }

    [[3, 3], [17, 3], [3, 17]].forEach(function(center) {
        for (var y = -4; y <= 4; y++) {
            for (var x = -4; x <= 4; x++) {
                var ring = Math.max(Math.abs(x), Math.abs(y));
                set(center[0] + x, center[1] + y, ring !== 2 && ring !== 4);
            }
        }
    });
    for (var i = 8; i <= 12; i++) {
        set(6, i, i % 2 === 0);
        set(i, 6, i % 2 === 0);
    }

    // The format pattern identifies error correction level L and mask zero.
    function formatBit(index) { return Boolean((0x77c4 >>> index) & 1); }
    for (var i = 0; i < 6; i++) set(8, i, formatBit(i));
    set(8, 7, formatBit(6));
    set(8, 8, formatBit(7));
    set(7, 8, formatBit(8));
    for (var i = 9; i < 15; i++) set(14 - i, 8, formatBit(i));
    for (var i = 0; i < 8; i++) set(size - 1 - i, 8, formatBit(i));
    for (var i = 8; i < 15; i++) set(8, size - 15 + i, formatBit(i));
    set(8, size - 8, true);

    var bitIndex = 0;
    var upward = true;
    for (var right = size - 1; right >= 1; right -= 2) {
        if (right === 6) right--;
        for (var row = 0; row < size; row++) {
            var y = upward ? size - 1 - row : row;
            for (var column = right; column >= right - 1; column--) {
                if (grid[y][column] === null) {
                    grid[y][column] = Boolean(bits[bitIndex++]) !== ((column + y) % 2 === 0);
                }
            }
        }
        upward = !upward;
    }

    // Four white modules around the code give scanners a quiet zone.
    var scale = 6;
    var quietZone = 4;
    canvas.width = canvas.height = (size + quietZone * 2) * scale;
    var context = canvas.getContext("2d");
    if (!context) return false;
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#000";
    grid.forEach(function(row, y) {
        row.forEach(function(dark, x) {
            if (dark) context.fillRect((x + quietZone) * scale, (y + quietZone) * scale, scale, scale);
        });
    });
    return true;
}
