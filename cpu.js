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

    this.interrupt = -1;
}

/* initialize data structures required to emualte the 6502 */
CPU.init = function() {
    enumerate("CPU", [
        "RESET",
        "NMI",
        "BRK",
        "ABORT",
        "NUM_INTERRUPTS"
    ]);

    CPU.interrupt_vector = [];
    CPU.interrupt_vector[CPU.RESET] = 0xfffc;
    CPU.interrupt_vector[CPU.NMI] = 0xfffa;
    CPU.interrupt_vector[CPU.BRK] = 0xfffe;
    CPU.interrupt_vector[CPU.ABORT] = 0xfff8;
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

    /* contains a flag for each type of interrupt which is
     * set to true when that interrupt occurs */
    this.interrupts = new Array(CPU.NUM_INTERRUPTS);
    for (var i in this.interrupts) {
        this.interrupts[i] = false;
    }

    this.pc = this.little_endian_2_byte_at(CPU.interrupt_vector[CPU.RESET]);
}

CPU.prototype.cond_branch = function(am, cond) {
    var addr = AddressingMode.read_data[am].call(this);
    if (cond) {
        this.pc = addr;
    } else {
        this.pc += AddressingMode.pc_incr[am];
    }
}


CPU.prototype.instr_step = function() {
    buffer_pc(pad_str(this.num_instr, 7) + pad_str(hex(this.pc), 4));
    var opcode = this.memory.read(this.pc++);
    buffer_encoded_instr(hex(opcode));
    //console.debug(opcode);
    var instr = Instruction.decode(opcode);
    buffer_instr(pad_str(AddressingMode.names[instr.addressing_mode], 6) + "   " + Instruction.names[instr.instruction]);
    buffer_args(this, instr.addressing_mode);

    if (!Instruction.emulate[instr.instruction]) {
        print_instr_to_buffer();
        print_buffer();
    }

    Instruction.emulate[instr.instruction].call(this, instr.addressing_mode);
    buffer_state(
        "ac: " + this.ac +
        ", *0: " + hex(this.little_endian_2_byte_at(0)) +
        ", x: " + this.x +
        ", y: " + this.y +
        ", carry: " + ((this.sr&(1<<CPU.SR_CARRY))!=0) +
        ", zero: " + ((this.sr&(1<<CPU.SR_ZERO))!=0) +
        ", negative: " + ((this.sr&(1<<CPU.SR_NEGATIVE))!=0) +
        ", int disable: " + ((this.sr&(1<<CPU.SR_INTERRUPT_DISABLE))!=0)
    );
    print_instr_to_buffer();
    this.num_instr++;
}

CPU.prototype.interrupt_sequence = function(interrupt) {
    if (interrupt != CPU.NMI && this.sr & (1<<CPU.SR_INTERRUPT_DISABLE)) {
        console.debug("ignoring interrupt");
        return;
    }

    buffer_instr("\n\nINTERRUPT RECEIVED\n");
    buffer_instr("Pushing state onto stack:\n");
    this.stack_push(this.get_pch());
    this.stack_push(this.get_pcl());
    this.stack_push(this.sr);
    this.pc = this.little_endian_2_byte_at(CPU.interrupt_vector[interrupt]);
    buffer_instr("\nChanged pc to ");
    buffer_instr(hex(this.pc));
    buffer_instr("\nDisabling interrupts\n\n")
    this.sr_set(CPU.SR_INTERRUPT_DISABLE);
}

CPU.prototype.debug_step = function() {
    if (this.interrupt == -1) {
        this.instr_step();
    } else {
        this.interrupt_sequence(this.interrupt);
    }

    /* after each instruction, check for interrupts. This is done
     * here rather than at the start of instructions to make
     * it possible to peek to see the number of cycles the next
     * instruction/interrupt will take */
    this.check_for_interrupt();
}



/* Returns the number of cycles that will be consumed executing the instruction
 * currently pointed to by the pc (doesn't increment the pc) */
CPU.prototype.peek_cycle_count = function() {
    if (this.interrupt == -1) {
        return 3; // TODO: make a table of cycles per instruction
    } else {
        return 7; // the interrupt sequency is 7 cycles long
    }
}

/* Clears one of the interrupts if there are any and sets
 * 'this.interrupt' to be its index */
CPU.prototype.check_for_interrupt = function() {
    /* check for interrupts */

    for (var i = 0;i!=CPU.NUM_INTERRUPTS;++i) {
        if (this.interrupts[i]) {
            this.interrupts[i] = false;
            this.interrupt = i;
            return;
        }
    }

    this.interrupt = -1;
}

/* run the cpu for a number of cycles (not instructions) */
CPU.prototype.run = function(n) {
    while(true) {

        /* if the remaining cycles is unknown, set it to the cycles
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
