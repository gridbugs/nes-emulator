var get_header = function(arr) {
    var header = new Object();
    var checksum = take(arr, 4).map(function(c){return String.fromCharCode(c)}).join('');
    if (checksum !== "NES\x1a") {
        console.debug("Invalid .nes file");
        header.valid = false;
    } else {
        header.valid = true;
    }

    header.num_rom_banks = arr[4];
    header.num_vrom_banks = arr[5];
    var byte6 = to_binary_8(arr[6]);
    header.vertical_mirroring = byte6[0] === 1; // 0 for horizontal mirroring
    header.battery_backed_ram = byte6[1] === 1;
    header.trainer = byte6[2] === 1;
    header.four_screen_vram = byte6[3] === 1;
    var rom_mapper_type_lo = byte6.slice(4, 8);
    var byte7 = to_binary_8(arr[7]);
    header.vs = byte7[0] === 1;
    if (!all_zeroes(byte7.slice(1, 4))) {
        console.debug("Error in .nes file");
    }
    var rom_mapper_type_hi = byte7.slice(4, 8);
    header.rom_mapper_type = from_binary_8(rom_mapper_type_lo.concat(rom_mapper_type_hi));
    header.num_ram_banks = arr[8];
    var byte9 = to_binary_8(arr[9]);
    header.pal = byte9[0] === 1; // 0 for ntsc
    if (!all_zeroes(byte7.slice(1, 8))) {
        console.debug("Error in .nes file");
    }
    if (!all_zeroes(arr.slice(10, 16))) {
        console.debug("Error in .nes file");
    }
    return header;
}

var get_rom_banks = function(header, arr) {
    const BANK_SIZE = 16384; // 16Kb
    const ROM_START = 16;
    var ret = [];
    for (var i = 0;i!==header.num_rom_banks;++i) {
        var idx = ROM_START + i * BANK_SIZE;
        ret[i] = [];
        for (var j = 0;j!==BANK_SIZE;++j) {
            ret[i][j] = arr[idx + j];
        }
    }
    return ret;
}
var d;

var load_nes_file = function(name, f) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onload = function() {
        f(this.response);
    };
    xmlhttp.open("GET", name, true);
    xmlhttp.overrideMimeType("text/plain; charset=x-user-defined");
    xmlhttp.send();
}

/* converts a string into an array of ascii codes. For non-ascii
 * characters it appears they get |'d with 0xf700, so just & with
 * 0xff to get rid of the high byte.
 */
var str_to_ascii = function(str) {
    var chars = str.split('');
    var codes = [];
    for (var i in chars) {
        var code = ascii(chars[i]);
        codes.push(code & 0xff);
    }
    return codes;
}