function CPU() {
    this.pc = 0;    // Program Counter (16 bit register)
    this.sr = 0;    // Status Register
    this.sp = 0;    // Stack Pointer
    this.x = 0;     // X Register
    this.y = 0;     // Y Register
    this.ac = 0;    // Accumulator

    this.break_points = [];

    this.break_counts = []; // values of this.num_instr on which to break
    this.num_instr = 0; // the number of instructions executed

    /* cycles remaining for current instruction */
    this.rem_cycles = -1;
}

CPU.prototype.add_breakpoint = function(p) {
    this.break_points.push(p);
}

CPU.prototype.add_break_count = function(p) {
    this.break_counts.push(p);
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

CPU.prototype.sr_assign = function(value, bit) {
    if (value) {
        this.sr_set(bit);
    } else {
        this.sr_clear(bit);
    }
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
    buffer_pc(pad_str(this.num_instr, 7) + pad_str(hex(this.pc), 4));
    var opcode = this.memory.read(this.pc++);
    buffer_encoded_instr(hex(opcode));
    //console.debug(opcode);
    var instr = Instruction.decode(opcode);
    //console.debug(instr);
    buffer_instr(pad_str(AddressingMode.names[instr.addressing_mode], 6) + "   " + Instruction.names[instr.instruction]);
    buffer_args(this, instr.addressing_mode);

    if (!Instruction.emulate[instr.instruction]) {
        print_instr();
    }

    Instruction.emulate[instr.instruction].call(this, instr.addressing_mode);
    print_instr_to_buffer();
    this.num_instr++;
}


CPU.prototype.step = function() {
    var opcode = this.memory.read(this.pc++);
    var instr = Instruction.decode(opcode);
    Instruction.emulate[instr.instruction].call(this, instr.addressing_mode);
}

/* Returns the number of cycles that will be consumed executing the instruction
 * currently pointed to by the pc (doesn't increment the pc) */
CPU.prototype.peek_cycle_count = function() {
    return 3;
}


/* run the cpu for a number of cycles (not instructions) */
CPU.prototype.run = function(n) {
    while(true) {
        /* if the remaining cycles in unknown, set it to the cycles
         * of the current instruction */
        if (this.rem_cycles == -1) {
            this.rem_cycles = this.peek_cycle_count();
        }

        /* the appropriate number of cycles have occured (note
         * that the instruction hasn't been emulated at this point
         * but we need to do this first in case the instruction
         * wouldn't have finished in the remaining number of
         * cycles (and so won't be started in the first place))
         */
        if (n >= this.rem_cycles) {
            n -= this.rem_cycles;
            this.rem_cycles = -1;
        } else {
            this.rem_cycles -= n;
            break;
        }

        /* emulate the instruction */
        this.debug_step();

        if (!(this.break_points.indexOf(this.pc) == -1 &&
            this.break_counts.indexOf(this.num_instr) == -1)) {
            print_buffer();
            console.debug("breakpoint: " + hex(this.pc) + " after " + this.num_instr + " instructions");
            return false;
        }
    }
    return true;
}
