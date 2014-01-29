/* This encapsulates the memory configuration of the NES console.
 * The 6502 doesn't care about how its connected memory is configured,
 * it just uses its address bus and data bus pins to read/write
 * bytes of data to "memory addresses". What the processor "thinks"
 * are memory addresses may in fact be registers of connected
 * devices or just addresses in the connected ROM. */

function NESMemoryConfiguration() {
    /* NES Memory Map
     * 0x0000 - 0x07ff: Working RAM */
    this.ram = new Array(0x800);

    /* 0x0800 - 0x0fff: Mirror of 0x0000 - 0x07ff
     * 0x1000 - 0x17ff: Mirror of 0x0000 - 0x07ff
     * 0x1800 - 0x1fff: Mirror of 0x0000 - 0x07ff
     * 0x2000 - 0x2007: PPU Control Registers */


}

//NESMemoryConfiguration.prototype.
