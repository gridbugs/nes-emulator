function CPU() {
    this.pc = 0;    // Program Counter (16 bit register)
    this.sr = 0;    // Status Register
    this.sp = 0;    // Stack Pointer
    this.x = 0;     // X Register
    this.y = 0;     // Y Register
    this.ac = 0;    // Accumulator


    this.frequency = 1790000; // hertz

    // ms delay
    this.delay = 20;
}

/* Notes about the 6502 stack:
 * The stack must occur in the range 0x0100 - 0x01ff.
 * The stack pointer provides the low byte of the current
 * stack address.
 * The 6502 stack pointer is "post decrement" - "pushing"
 * in this case means write a value to 0x01<SP> and then
 * the stack pointer is decremented. Thus popping
 * decreases the stack pointer before accessing the
 * byte it points to.
 */
CPU.prototype.stack_push = function(data) {
    this.memory.write(this.sp | 0x0100, data);
    this.sp--;
}

// this operation is currently refered to as "popping"
CPU.prototype.stack_pull = function() {
    this.sp++;
    return this.memory.read(this.sp | 0x0100);
}

/* analagous to connecting a memory configuration to the
 * address and data busses on the 6502 */
CPU.prototype.connect_memory_map = function(mm) {
    this.memory = mm;
}

// convenient functions for setting program counter
CPU.prototype.set_pcl = function(val) {
    this.pc = (this.pc & 0xff00) | val;
}
CPU.prototype.set_pch = function(val) {
    this.pc = (this.pc & 0x00ff) | (val << 8);
}
CPU.prototype.get_pcl = function() {
    return this.pc & 0xff;
}
CPU.prototype.get_pch = function() {
    return  this.pc >> 8;
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

/* takes the address of the lower of the 2 bytes */
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
CPU.prototype.init = function() {
    this.pc = this.little_endian_2_byte_at(0xfffc);
}

CPU.prototype.debug_step = function() {
    console.debug(this.pc);
    var opcode = this.memory.read(this.pc++);
    console.debug(hex(opcode));
    var instr = Instruction.decode(opcode);
    console.debug(itos(instr));
    Instruction.emulate[instr.instruction].call(this, instr.addressing_mode);
}


CPU.prototype.step = function() {
    var opcode = this.memory.read(this.pc++);
    var instr = Instruction.decode(opcode);
    Instruction.emulate[instr.instruction].call(this, instr.addressing_mode);
}

CPU.prototype.start = function() {
    var cpu = this;
    var tick = function() {
        cpu.debug_step();
        setTimeout(tick, cpu.delay);
    }
    tick();
}
