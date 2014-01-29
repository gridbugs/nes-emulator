function CPU() {
    this.pc = 0;    // Program Counter (16 bit register)
    this.sr = 0;    // Status Register
    this.sp = 0;    // Stack Pointer
    this.x = 0;     // X Register
    this.y = 0;     // Y Register
    this.ac = 0;    // Accumulator

    // convenient functions for setting program counter
    this.set_pcl = function(val) {
        this.pc |= val;
    }
    this.set_pch = function(val) {
        this.pc |= (val << 8);
    }
}

// Masks for the Status Register
CPU.SR_NEGATIVE = 1<<7;
CPU.SR_OVERFLOW = 1<<6;
CPU.SR_BREAK = 1<<4;
CPU.SR_DECIMAL = 1<<3;
CPU.SR_INTERRUPT = 1<<2;
CPU.SR_ZERO = 1<<1;
CPU.SR_CARRY = 1<<0;

function Machine() {
    this.ram = new Array(0x10000);
    this.cpu = new CPU();

    /* loads a rom bank into memory, where the rom bank is represented
     * as an array of numbers */
    this.load_rom_bank = function(bank, start_address) {
        for (var i = 0;i!=bank.length;++i) {
            if (start_address+i > 0xffff) {
                console.debug("address higher than 0xffff");
            }
            this.ram[start_address+i] = bank[i];
        }
    }

    /* takes the lower of the 2 bytes */
    this.little_endian_2_byte_at = function(addr) {
        var lo = this.ram[addr];
        var hi = this.ram[addr+1];
        return lo | (hi << 8);
    }

    this.byte_at = function(addr) {
        return this.ram[addr];
    }

    /* Initializes the machine executing the code in its memory.
     * This involves transfering the value from 0xfffc to the low
     * byte of the program counter and 0xfffd to the high byte of
     * the program counter.
     */
    this.start = function() {
        this.cpu.pc = this.little_endian_2_byte_at(0xfffc);

    }

    this.step = function() {
        var instruction = this.ram[this.cpu.pc];
        ++this.cpu.pc;
        console.debug(instruction);
    }
}
