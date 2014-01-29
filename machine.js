function CPU() {
    this.pc = 0;    // Program Counter (16 bit register)
    this.sr = 0;    // Status Register
    this.sp = 0;    // Stack Pointer
    this.x = 0;     // X Register
    this.y = 0;     // Y Register
    this.ac = 0;    // Accumulator

}
// convenient functions for setting program counter
CPU.prototype.set_pcl = function(val) {
    this.pc |= val;
}
CPU.prototype.set_pch = function(val) {
    this.pc |= (val << 8);
}

CPU.prototype.sr_set = function(bit_no) {
    this.sr |= 1<<bit_no;
}
CPU.prototype.sr_clear = function(bit_no) {
    this.sr &= (~(1<<bit_no));
}

// Sets/Clears bits in the SR in response to the value of x
CPU.prototype.sr_respond = function(x) {
    if (x & 1<<7) {
        this.sr_set(CPU.SR_NEGATIVE);
    } else {
        this.sr_clear(CPU.SR_NEGATIVE);
    }

    if (x == 0) {
        this.sr_set(CPU.SR_ZERO);
    } else {
        this.sr_clear(CPU.SR_ZERO);
    }
}

// Masks for the Status Register
CPU.SR_NEGATIVE = 7;
CPU.SR_OVERFLOW = 6;
CPU.SR_BREAK = 4;
CPU.SR_DECIMAL = 3;
CPU.SR_INTERRUPT_DISABLE = 2;
CPU.SR_ZERO = 1;
CPU.SR_CARRY = 0;

function Machine() {
    this.ram = new Array(0x10000);
    this.cpu = new CPU();
}


/* loads a rom bank into memory, where the rom bank is represented
 * as an array of numbers */
Machine.prototype.load_rom_bank = function(bank, start_address) {
    for (var i = 0;i!=bank.length;++i) {
        if (start_address+i > 0xffff) {
            console.debug("address higher than 0xffff");
        }
        this.ram[start_address+i] = bank[i];
    }
}

/* takes the lower of the 2 bytes */
Machine.prototype.little_endian_2_byte_at = function(addr) {
    var lo = this.ram[addr];
    var hi = this.ram[addr+1];
    return lo | (hi << 8);
}

Machine.prototype.byte_at = function(addr) {
    return this.ram[addr];
}

Machine.prototype.push = function(value) {
    this.ram[this.cpu.sp++] = value;
}

Machine.prototype.pop = function() {
    return this.ram[--this.cpu.sp];
}

/* Initializes the machine executing the code in its memory.
 * This involves transfering the value from 0xfffc to the low
 * byte of the program counter and 0xfffd to the high byte of
 * the program counter.
 */
Machine.prototype.start = function() {
    this.cpu.pc = this.little_endian_2_byte_at(0xfffc);

}

Machine.prototype.step = function() {
    console.debug(this.cpu.pc);
    var opcode = this.ram[this.cpu.pc++];
    console.debug(hex(opcode));
    var instr = Instruction.decode(opcode);
    console.debug(itos(instr));
    Instruction.emulate[instr.instruction].call(this, instr.addressing_mode);
}
