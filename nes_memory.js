/* This encapsulates the memory configuration of the NES console.
 * The 6502 doesn't care about how its connected memory is configured,
 * it just uses its address bus and data bus pins to read/write
 * bytes of data to "memory addresses". What the processor "thinks"
 * are memory addresses may in fact be registers of connected
 * devices or just addresses in the connected ROM. */

function NESMemoryConfiguration() {
    /* NES Memory Map
     * 0x0000 - 0x07ff: Work RAM */
    this.work_ram = new Array(0x0800);
    for (var i = 0;i!=0x0800;++i) {
        this.work_ram[i] = 0;
    }

    /* 0x0800 - 0x0fff: Mirror of 0x0000 - 0x07ff
     * 0x1000 - 0x17ff: Mirror of 0x0000 - 0x07ff
     * 0x1800 - 0x1fff: Mirror of 0x0000 - 0x07ff
     * 0x2000 - 0x2007: PPU Control Registers
     * 0x2008 - 0x3fff: Mirror of 0x2000 - 0x2007 (1023 times)
     * 0x4000 - 0x401f: Registers
     * 0x4020 - 0x5fff: Cartridge Expansion ROM
     * 0x6000 - 0x7fff: SRAM */
    this.sram = new Array(0x2000);
    for (var i = 0;i!=0x2000;++i) {
        this.sram[i] = 0;
    }

    /* 0x8000 - 0xbfff: PRG-ROM 0
     * 0xc000 - 0xffff: PRG-ROM 1
     * */
}

NESMemoryConfiguration.prototype.connect_prgrom0 = function(rom) {
    this.prg_rom0 = rom;
}
NESMemoryConfiguration.prototype.connect_prgrom1 = function(rom) {
    this.prg_rom1 = rom;
}
NESMemoryConfiguration.prototype.connect_ppu = function(ppu) {
    this.ppu = ppu;
}


NESMemoryConfiguration.prototype.write = function(address, data) {
    /* Write to RAM */
    if (address >= 0x0000 && address < 0x2000) {
        this.work_ram[address % 0x0800] = data;
    } else if (address >= 0x6000 && address < 0x8000) {
        this.sram[address - 0x6000] = data;
    } else if (address >= 0x2000 && address < 0x2008) {
        /* interface with the ppu */
        this.ppu.write(address - 0x2000, data);
    }
}

NESMemoryConfiguration.prototype.read = function(address) {
    /* Work RAM or one of its mirrors */
    if (address >= 0x0000 && address < 0x2000) {
        return this.work_ram[address % 0x0800];
    }

    /* SRAM */
    if (address >= 0x6000 && address < 0x8000) {
        return this.sram[address - 0x6000];
    }

    /* ROM */
    if (address >= 0x8000 && address < 0xc000) {
        return this.prg_rom0[address - 0x8000];
    }
    if (address >= 0xc000 && address <= 0xffff) {
        return this.prg_rom1[address - 0xc000];
    }

    /* PPU */
    if (address >= 0x2000 && address < 0x4000) {
        return this.ppu.read((address - 0x2000) % 8);
    }
}
