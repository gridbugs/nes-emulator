/* This emulates the MMC1 memory mapper used in some
 * NES games
 */

function MMC1(rom_banks) {
    this.registers = new Array(4);

    this.shift_reg = 0x10; // internal shift register

    this.rom_banks = rom_banks;

    this.rom_frames = {
        0: rom_banks[0],
        1: rom_banks[7]
    };
}

// Registers
MMC1.CTRL = 0;
MMC1.CHRRAM_PAGESELECT = 1;
MMC1.CHRRAM_4K_PAGESELECT = 2;
MMC1.PRGROM_16K_PAGESELECT = 3;

// CTRL Register Bits
MMC1.LOW_PRGROM_AREA = 2;
MMC1.PRGROM_16K_SWITCHING = 3;

MMC1.prototype.write = function(addr, data) {
    if (data & 1<<7) {
        var idx = (addr>>13)&3;
        this.registers[idx] = 0;
    } else {

        /* this means the shift register is full */
        if (this.shift_reg & 1) {
            var idx = (addr>>13)&3;
            this.registers[idx] = (this.shift_reg >> 1) | ((data&1) << 4);
            this.shift_reg = 0x10;
            MMC1.apply[idx].call(this, this.registers[idx]);
        } else {
            this.shift_reg >>= 1;
            this.shift_reg |= ((data&1) << 4);
        }

    }
}

MMC1.prototype.read = function(addr) {
    if (addr >= 0x8000 && addr < 0xc000) {
        return this.rom_frames[0][addr - 0x8000];
    } else if (addr >= 0xc000 && addr <= 0xffff) {
        return this.rom_frames[1][addr - 0xc000];
    }
}

MMC1.init = function() {
    MMC1.apply = [];

    MMC1.apply[MMC1.CTRL] = function(data) {
    }
    MMC1.apply[MMC1.CHRRAM_PAGESELECT] = function(data) {
    }
    MMC1.apply[MMC1.CHRRAM_4K_PAGESELECT] = function(data) {
    }
    MMC1.apply[MMC1.PRGROM_16K_PAGESELECT] = function(data) {
        var low = this.registers[MMC1.CTRL] & (1<<MMC1.LOW_PRGROM_AREA);
        var prgrom_16k = this.registers[MMC1.CTRL] & (1<<MMC1.PRGROM_16K_SWITCHING);

        var frame_idx = low ? 0 : 1;
        this.rom_frames[frame_idx] = this.rom_banks[data];
    }
}
