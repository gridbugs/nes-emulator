/* Encapsulates the entire nes console including CPU, Memory Configuration
 * and Picture Processing Unit
 */

function NES() {
    this.cpu = new CPU();
    this.cpu.connect_memory_map(new NESMemoryConfiguration());
    this.cpu.memory.connect_ppu(new NESPPU());
}

/* Initialize data structures to do with the NES */
NES.init = function() {
    NESPPU.init();
}

/* takes an array of numbers representing the bytes in the .nes
 * ROM file */
NES.prototype.load_rom = function(data_arr) {

    /* parse the nes header */
    this.header = get_header(data_arr);

    if (!this.header.valid) {
        return false;
    }

    /* copy each rom bank into its own array */
    this.rom = get_rom_banks(this.header, data_arr);

    /* connect the rom to the memory manager */
    this.cpu.memory.connect_prgrom0(this.rom[0]);
    this.cpu.memory.connect_prgrom1(this.rom[1]);
}

NES.prototype.init = function() {
    this.cpu.init();
}

NES.prototype.start = function() {
    this.cpu.memory.ppu.stabalize(400);
    this.cpu.start();
}

NES.prototype.step = function() {
    this.cpu.step();
}
