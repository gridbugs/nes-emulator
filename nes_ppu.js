/* This encapsulates the Picture Processing Unit used
 * in the NES.
 */
function NESPPU() {
    this.registers = new Array(8);
    for (var i = 0;i!=8;++i) {
        this.registers[i] = 0;
    }
}

NESPPU.PPUCTRL = 0;
NESPPU.PPUMASK = 1;
NESPPU.PPUSTATUS = 2;
NESPPU.OAMADDR = 3;
NESPPU.OAMDATA = 4;
NESPPU.PPUSCROLL = 5;
NESPPU.PPUADDR = 6;
NESPPU.PPUDATA = 7;

NESPPU.init = function() {
    with (NESPPU) {
        /* any special things that need to happen when
         * a register is written to */
        NESPPU.post_write = [];
        var w = NESPPU.post_write;

        /* any special things that need to happen when
         * a register is read from */
        NESPPU.read = [];
        var r = NESPPU.read;
        r[PPUSTATUS] = function() {
            var value = this.registers[PPUSTATUS];

            /* clear bit 7 */
            this.registers[PPUSTATUS] &= (~(1<<7));

            return value;
        }
    }
}

NESPPU.prototype.write = function(offset, data) {
    buffer_instr("=======================================[ PPU WRITE ]===================================");
    this.registers[offset] = data;
    if (NESPPU.post_write[offset]) {
        NESPPU.post_write[offset].call(this, data);
    }
}

NESPPU.prototype.read = function(offset) {
    buffer_instr("=======================================[ PPU READ ]===================================");
    return NESPPU.read[offset].call(this);
}

NESPPU.prototype.set_status_bit_7 = function() {
    this.registers[NESPPU.PPUSTATUS] |= 1<<7;
}

NESPPU.prototype.stabalize = function(time, then) {
    var ppu = this;
    var set_status_bit_7 = function() {
        ppu.registers[NESPPU.PPUSTATUS] |= 1<<7;
    }

    var delayed_pulse = function(rem) {

        switch(rem) {
        case 2:
            setTimeout(delayed_pulse, time, 1);
            break;
        case 1:
            set_status_bit_7();
            setTimeout(delayed_pulse, time, 0);
            break;
        case 0:
            set_status_bit_7();
            if (then) {
                then();
            }
        }
    }

    delayed_pulse(2);
}
