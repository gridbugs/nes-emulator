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

NESMemoryConfiguration.prototype.connect_ppu = function(ppu) {
    this.ppu = ppu;
}
NESMemoryConfiguration.prototype.connect_mapper = function(mapper) {
    this.mapper = mapper;

    /* initialize any mapper-specific data structures */
    this.mapper.constructor.init();
}

NESMemoryConfiguration.prototype.write = function(address, data) {

    buffer_instr("     *(0x" + hex(address) + ") = 0x" + hex(data));

    /* Write to RAM */
    if (address >= 0x0000 && address < 0x2000) {
        this.work_ram[address % 0x0800] = data;
    } else if (address >= 0x6000 && address < 0x8000) {
        this.sram[address - 0x6000] = data;
    } else if (address >= 0x2000 && address < 0x2008) {
        /* interface with the ppu */
        this.ppu.write(address - 0x2000, data);
    } else if (address >= 0x8000 && address <= 0xffff) {
        /* writing to mapper chip */
        this.mapper.write(address, data);
    } else {
//        console.debug("invalid address: " + hex(address));
    }
}

NESMemoryConfiguration.prototype.read = function(address) {
    var data;
    /* Work RAM or one of its mirrors */
    if (address >= 0x0000 && address < 0x2000) {
        data = this.work_ram[address % 0x0800];
    } else if (address >= 0x6000 && address < 0x8000) {
        /* SRAM */
        data = this.sram[address - 0x6000];
    } else if (address >= 0x8000 && address <= 0xffff) {
        /* ROM */
        data = this.mapper.read(address);
    } else if (address >= 0x2000 && address < 0x4000) {
        /* PPU */
        data = this.ppu.read((address - 0x2000) % 8);
    } else {
//        console.debug("invalid address: " + hex(address));
        data = 0;
    }
//    buffer_instr("   <-  *(0x" + hex(address) + ") == " + hex(data));
    return data;
}
