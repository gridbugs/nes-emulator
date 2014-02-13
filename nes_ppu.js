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

    this.palette_ram = new Array(0x20);
    for (var i = 0;i!=0x20;++i) {
        this.palette_ram[i] = 0;
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

/* methods by which the ppu accesses its lower 0x2000 bytes
 * of memory */
NESPPU.VRAM_Mapper = function() {
    this.vram = new Array(0x2000);
    for (var i = 0;i!=0x2000;++i) {
        this.vram[i] = 0;
    }
}
NESPPU.VRAM_Mapper.prototype.read = function(addr) {
    return this.vram[addr];
}
NESPPU.VRAM_Mapper.prototype.write = function(addr, data) {
    this.vram[addr] = data;
}
NESPPU.CHRROM_Mapper = function(chrrom) {
    this.chrrom = chrrom;
}
NESPPU.CHRROM_Mapper.prototype.read = function(addr) {
    return this.chrrom[addr];
}
NESPPU.CHRROM_Mapper.prototype.write = function(addr, data) {
    console.debug("Trying to write to CHR ROM");
}

NESPPU.prototype.connect_cartridge_memory = function(chrrom) {
    if (chrrom.length == 0) {
        this.cartridge_memory = new NESPPU.VRAM_Mapper();
    } else if (chrrom.length == 1) {
        this.cartridge_memory = new NESPPU.CHRROM_Mapper(chrrom);
    } else {
        alert("This PPU memory configuration is not implemented");
        crash();
    }
}

/* methods by which the ppu accesses nametables */
NESPPU.NameTableVertical = function() {
    this.vram = new Array(0x800); // 2kb of vram
    for (var i = 0;i!=0x800;++i) {
        this.vram[i] = 0;
    }
}
NESPPU.NameTableVertical.prototype.read = function(addr) {
    if (addr >= 0x2800) {
        addr -= 0x800;
    }
    return this.vram[addr - 0x2000];
}
NESPPU.NameTableVertical.prototype.write = function(addr, data) {
    if (addr >= 0x2800) {
        addr -= 0x800;
    }
    this.vram[addr - 0x2000] = data;
}
NESPPU.NameTableHorizontal = function() {
    this.vram = new Array(0x800); // 2kb of vram
    for (var i = 0;i!=0x800;++i) {
        this.vram[i] = 0;
    }
}
NESPPU.NameTableHorizontal.prototype.read = function(addr) {
    if ((addr >= 0x2400 && addr < 0x2800) || (addr >= 0x2c00)) {
        addr -= 0x400;
    }
    return this.vram[addr - 0x2000];
}
NESPPU.NameTableHorizontal.prototype.write = function(addr, data) {
    if ((addr >= 0x2400 && addr < 0x2800) || (addr >= 0x2c00)) {
        addr -= 0x400;
    }
    this.vram[addr - 0x2000] = data;
}

NESPPU.HORIZONTAL = 0;
NESPPU.VERTICAL = 1;

NESPPU.prototype.set_mirroring = function(mirroring) {
    switch(mirroring) {
    case NESPPU.HORIZONTAL:
        this.name_table = new NESPPU.NameTableHorizontal();
        break;
    case NESPPU.VERTICAL:
        this.name_table = new NESPPU.NameTableVertical();
    }
}

NESPPU.prototype.memory_read = function(addr) {
    if (addr >= 0 && addr < 0x2000) {
        return this.cartridge_memory.read(addr);
    } else if (addr >= 0x2000 && addr < 0x3000) {
        return this.name_table.read(addr);
    } else if (addr >= 0x3000 && addr < 0x3f00) {
        return this.name_table.read(addr-0x1000);
    } else if (addr >= 0x3f00 && addr < 0x3f20) {
        return this.palette_ram[addr-0x3f00];
    } else if (addr >= 0x3f20 && addr <= 0x3fff) {
        return this.palette_ram[(addr%0x20) + 0x3f20];
    } else {
        alert("invalid address for ppu memory");
        crash();
    }
}
NESPPU.prototype.memory_write = function(addr, data) {
    if (addr >= 0 && addr < 0x2000) {
        this.cartridge_memory.write(addr, data);
    } else if (addr >= 0x2000 && addr < 0x3000) {
        this.name_table.write(addr, data);
    } else if (addr >= 0x3000 && addr < 0x3f00) {
        this.name_table.write(addr-0x1000, data);
    } else if (addr >= 0x3f00 && addr < 0x3f20) {
        this.palette_ram[addr-0x3f00] = data;
    } else if (addr >= 0x3f20 && addr <= 0x3fff) {
        this.palette_ram[(addr%0x20) + 0x3f20] = data;
    } else {
        alert("invalid address for ppu memory");
        crash();
    }
}


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
            this.memory_write(this.addr_latch, data);
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

            /* clear the memory address latch */
            this.addr_latch = -1;

            /* clear the scroll latch */
            this.scroll_latch = -1;

            return (0xe0 & value) | (0x1f & this.prev_write);
        }

        r[PPUDATA] = function() {
            var ret = this.memory_read(this.addr_latch, addr);
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

/* allocates an 8x8 array */
NESPPU.new_sprite = function() {
    var sprite = new Array(8);
    for (var i = 0;i!=8;++i) {
        sprite[i] = new Array(8);
    }
    return sprite;
}
/* returns an 8x8 sprite stored in vram starting at start_address */
NESPPU.retrieve_sprite_8x8 = function(start_address, memory) {
    var sprite = NESPPU.new_sprite();
    /* first 8 bytes store the low bit of each pixel */
    for (var i = 0;i!=8;++i) {
        var current_byte = memory[start_address+i];
        /* each byte is one 8-long row */
        for (var j = 0;j!=8;++j) {
            //var bit = (current_byte & (1<<(7-j))) ? 1 : 0;
            var bit = (current_byte & (1<<(7-j))) ? 1 : 0;
            sprite[i][j] = bit;
        }
    }
    /* second 8 bytes store the high bit of each pixel */
    for (var i = 8;i!=16;++i) {
        var current_byte = memory[start_address+i];
        /* each byte is one 8-long row */
        for (var j = 0;j!=8;++j) {
            var bit = (current_byte & (1<<(7-j))) ? 2 : 0;
            sprite[i%8][j] |= bit;
        }
    }
    return sprite;
}

/* takes an 8x8 array of pixel colours and draws it */
NESPPU.draw_sprite = function(ctx, sprite, palette, tlx, tly) {
    const pixel_size = 4;
    ctx.beginPath();
    for (var i = 0;i!=8;++i) {
        for (var j = 0;j!=8;++j) {
            var x = tlx + j;
            var y = tly + i;
            var col = palette[sprite[i][j]];
            ctx.fillStyle = col;
            ctx.fillRect(x*pixel_size, y*pixel_size, pixel_size, pixel_size);
        }
    }
    ctx.fill();
}

NESPPU.debug_display_pattern_tables = function(ctx, memory, tlx, tly) {

    /* The pattern tables are stored in 0x0000 - 0x1fff of VRAM.
     * Each tile is 16 bytes long, and is 8x8 pixels;
     * 2 bytes per pixel encode the colour of the pixel.
     * The firts 8 bytes of a sprite are the low bits of each pixel.
     * The second 8 bytes are the high bits of each pixel.*/

    /* There are 2x256 tile sections in the pattern table */
    for (var i = 0;i!=10000;++i) {
        var sprite = NESPPU.retrieve_sprite_8x8(i*16, memory);
        if (i == 0) {
            console.debug(sprite);
        }
        NESPPU.draw_sprite(ctx, sprite, ["rgba(0, 0, 0, 0)", "red", "green", "blue"], tlx+(i%32)*10, tly+(Math.floor(i/32))*10);
    }



}
