function CPU() {
    this.pc = 0;    // Program Counter (16 bit register)
    this.sr = 0;    // Status Register
    this.sp = 0;    // Stack Pointer
    this.x = 0;     // X Register
    this.y = 0;     // Y Register
    this.ac = 0;    // Accumulator

}

/* analagous to connecting a memory configuration to the
 * address and data busses on the 6502 */
CPU.prototype.connect_memory_map = function(mm) {
    this.memory = mm;
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

/* takes the lower of the 2 bytes */
CPU.prototype.little_endian_2_byte_at = function(addr) {
    var lo = this.memory.read(addr);
    var hi = this.memory.read(addr+1);
    return lo | (hi << 8);
}

/* Initializes the machine executing the code in its memory.
 * This involves transfering the value from 0xfffc to the low
 * byte of the program counter and 0xfffd to the high byte of
 * the program counter.
 */
CPU.prototype.start = function() {
    this.pc = this.little_endian_2_byte_at(0xfffc);

}

CPU.prototype.step = function() {
    console.debug(this.pc);
    var opcode = this.memory.read(this.pc++);
    console.debug(hex(opcode));
    var instr = Instruction.decode(opcode);
    console.debug(itos(instr));
    Instruction.emulate[instr.instruction].call(this, instr.addressing_mode);
}
