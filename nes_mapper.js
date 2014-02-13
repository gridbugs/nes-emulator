function NO_MAPPER(rom_banks) {
    this.rom_frames = {
        0: rom_banks[0],
        1: rom_banks.length == 1 ? rom_banks[0] : rom_banks[1]
    };
}

NO_MAPPER.prototype.write = function(addr, data) {}
NO_MAPPER.init = function() {}

NO_MAPPER.prototype.read = function(addr) {
    if (addr >= 0x8000 && addr < 0xc000) {
        return this.rom_frames[0][addr - 0x8000];
    } else if (addr >= 0xc000 && addr <= 0xffff) {
        return this.rom_frames[1][addr - 0xc000];
    }
}

function Mapper(){};
Mapper.types = {
    0: NO_MAPPER,
    1: MMC1
};
