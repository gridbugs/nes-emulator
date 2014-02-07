/* This encapsulates the Picture Processing Unit used
 * in the NES.
 */
function NESPPU() {
    this.registers = new Array(8);
    for (var i = 0;i!=8;++i) {
        this.registers[i] = 0;
    }

    this.addr_latch = -1;
    this.scroll_x = -1;
    this.scroll_y = -1;

    this.prev_write = 0;

    this.vram = new Array(0x4000);
}

NESPPU.PPUCTRL = 0;
NESPPU.PPUMASK = 1;
NESPPU.PPUSTATUS = 2;
NESPPU.OAMADDR = 3;
NESPPU.OAMDATA = 4;
NESPPU.PPUSCROLL = 5;
NESPPU.PPUADDR = 6;
NESPPU.PPUDATA = 7;

NESPPU.prototype.incr_addr = function() {
    if (this.registers[NESPPU.CTRL] & 1<<2) {
        this.addr_latch = (this.addr_latch + 1) & 0xff;
    } else {
        this.addr_latch = (this.addr_latch + 32) & 0xff;
    }
}

NESPPU.init = function() {
    with (NESPPU) {
        /* any special things that need to happen when
         * a register is written to */
        NESPPU.write = [];
        var w = NESPPU.write;
        w[PPUCTRL] = function(data) {
            ppuctrl_debug(data);
            this.registers[PPUCTRL] = data;
        }
        w[PPUMASK] = function(data) {
            ppumask_debug(data);
            this.registers[PPUMASK] = data;
        }
        w[PPUADDR] = function(data) {
            if (this.addr_latch == -1) {
                this.addr_latch = data << 8;
            } else {
                this.addr_latch |= data;
            }
        }
        w[PPUDATA] = function(data) {
            this.vram[this.addr_latch] = data;
            this.incr_addr();
        }
 
        w[PPUSCROLL] = function(data) {
            this.registers[PPUSCROLL] = data;

            if (this.scroll_x == -1) {
                this.scroll_x = data;
            } else {
                this.scroll_y = data;
            }
        }

        w[OAMADDR] = function(data) {
            this.registers[OAMADDR] = data;
        }

        w[OAMDATA] = function(data) {
            this.registers[OAMDATA] = data;
        }
        

        /* any special things that need to happen when
         * a register is read from */
        NESPPU.read = [];
        var r = NESPPU.read;
        r[PPUSTATUS] = function() {
            var value = this.registers[PPUSTATUS];

            /* clear bit 7 */
            this.registers[PPUSTATUS] &= (~(1<<7));

            /* clear the vram address latch */
            this.addr_latch = -1;
            
            /* clear the scroll latch */
            this.scroll_latch = -1;

            return (0xe0 & value) | (0x1f & this.prev_write);
        }

        r[PPUDATA] = function() {
            var ret = this.vram[this.addr_latch];
            this.incr_addr();
            return ret;
        }

    }
}

function ppumask_debug(data) {
    
    buffer_instr("\n\n==============================[ PPUMASK Write ]==================================");
    buffer_instr("\nGreyscale: ");
    if (data & 1<<0) {
        buffer_instr("Monochrome Display");
    } else {
        buffer_instr("Normal Colour");
    } 

    buffer_instr("\nBackground in left-most 8 pixels: ");
    if (data & 1<<1) {  
        buffer_instr("Show");
    } else {
        buffer_instr("Hide");
    }

    buffer_instr("\nSprites in left-most 8 pixels: ");
    if (data & 1<<2) {
        buffer_instr("Show");
    } else {
        buffer_instr("Hide");
    }

    buffer_instr("\nShow Background: ");
    if (data & 1<<3) {
        buffer_instr("Yes");
    } else {
        buffer_instr("No");
    }

    buffer_instr("\nShow Sprites: ");
    if (data & 1<<4) {
        buffer_instr("Yes");
    } else {
        buffer_instr("No");
    }

    buffer_instr("\nIntensify Reds: ");
    if (data & 1<<5) {
        buffer_instr("Yes");
    } else {
        buffer_instr("No");
    }

    buffer_instr("\nIntensify Greens: ");
    if (data & 1<<6) {
        buffer_instr("Yes");
    } else {
        buffer_instr("No");
    }

    buffer_instr("\nIntensify Blues: ");
    if (data & 1<<7) {
        buffer_instr("Yes");
    } else {
        buffer_instr("No");
    }
}

function ppuctrl_debug(data) {
    buffer_instr("\n\n==============================[ PPUCTRL Write ]==================================");
    buffer_instr("\nBase Nametable Address: ");
    switch(data & 3) {
    case 0:
        buffer_instr("0x2000");
        break;
    case 1:
        buffer_instr("0x2400");
        break;
    case 2:
        buffer_instr("0x2800");
        break;
    case 3:
        buffer_intsr("0x2C00");
    }
    buffer_instr("\nVRAM address increment on read/write of PPUDATA: ");
    if (data & 1<<2) {
        buffer_instr("32 (down)");
    } else {
        buffer_instr("1 (accross)");
    }
    buffer_instr("\nSprite Pattern Table Address (for 8x8 sprites): ")
    if (data & 1<<3) {
        buffer_instr("0x1000");
    } else {
        buffer_instr("0x0000");
    }

    buffer_instr("\nBackground Pattern Table Address: ")
    if (data & 1<<4) {
        buffer_instr("0x1000");
    } else {
        buffer_instr("0x0000");
    }
    buffer_instr("\nSprite Size: ");
    if (data & 1<<5) {
        buffer_instr("8x16");
    } else {
        buffer_instr("8x8");
    }
    buffer_instr("\nPPU Master/Slave Select: ");
    if (data & 1<<6) {
        buffer_instr("Output colour on EXT pins");
    } else {
        buffer_instr("Read backdrop from EXT pins");
    }
    buffer_instr("\nGenerate NMI at start of vblank interval: ");
    if (data & 1<<7) {
        buffer_instr("on");
    } else {
        buffer_instr("off");
    }
    buffer_instr("\n");
}

NESPPU.prototype.write = function(offset, data) {
    buffer_instr("\n=======================================[ PPU WRITE ]===================================\n");
    NESPPU.write[offset].call(this, data);
    this.prev_write = data;
}

NESPPU.prototype.read = function(offset) {
    buffer_instr("\n=======================================[ PPU READ ]===================================\n");
    return NESPPU.read[offset].call(this);
}

NESPPU.prototype.set_status_bit_7 = function() {
    this.registers[NESPPU.PPUSTATUS] |= 1<<7;
}

