/* Here is where all the instruction emulation is implemented */
function Emulator(){}

Emulator.init = function() {
    with (AddressingMode) {

        /* This array will hold functions emulating the getting of data
         * for the various addressing modes. These will be called with
         * "this" refering to a machine. */
        AddressingMode.read_data = [];
        var r = AddressingMode.read_data;
        r[IMM] = function() {
            /* Immediate:
             * The byte following the instruction contains
             * the data.
             */
            return this.memory.read(this.pc++);
        }
        r[ABS] = function() {
            /* Absolute:
             * The two bytes following the instruction represent
             * a little endian address. Read the byte at that
             * address.
             */
            var addr = this.little_endian_2_byte_at(this.pc);
            this.pc += 2;
            return this.memory.read(addr);
        }
        r[REL] = function() {
            /* Relative:
             * 2's complement add the 1 byte following the instruction
             * to the PC (don't set the PC to this value, just return it).
             */
            var offset = this.memory.read(this.pc++);
            return twos_complement_8(offset) + this.pc;
        }

        /* This array will hold functions emulating storing data
         * in memory. */
        AddressingMode.write_data = [];
        var w = AddressingMode.write_data;
        w[ABS] = function(data) {
            /* Absolute:
             * The two bytes following the instruction represent
             * a little endian address. Store the data there.
             */
            var addr = this.little_endian_2_byte_at(this.pc);
            this.pc += 2;
            this.memory.write(addr, data);
        }
    }

    with (Instruction) {
        /* This array will hold functions emulating the execution
         * of various instructions. These will be called with
         * "this" refering to a machine. Each function takes an
         * argument "am" which contains the addressing mode. */
        Instruction.emulate = [];
        var e = Instruction.emulate;
        e[LDA] = function(am) {
            /* LDA: Load Accumulator
             * Stores a value in the accumulator
             */
            this.ac = r[am].call(this);
            this.sr_respond(this.ac);
        }

        e[SEI] = function(am) {
            /* SEI: Set Interrupt-disable bit in SR */
            this.sr |= 1<<CPU.SR_INTERRUPT_DISABLE;
        }

        e[CLD] = function(am) {
            /* CLD: Clear the Decimal-mode bit in SR */
            this.sr &= (~(1<<CPU.SR_DECIMAL));
        }

        e[STA] = function(am) {
            /* STA: Store the Accumulator in memory */
            w[am].call(this, this.ac);
        }

        e[LDX] = function(am) {
            /* LDX: Load a value into X */
            this.x = r[am].call(this);
            this.sr_respond(this.x);
        }

        e[TXS] = function(am) {
            /* TXS: Transfer the value in X to SR */
            this.sp = this.x;
            this.sr_respond(this.sp);
        }

        e[AND] = function(am) {
            /* AND: Bitwise and the accumulator with a value
             * and store the result in the accumulator
             */
            this.ac &= r[am].call(this);
            this.sr_respond(this.ac);
        }

        e[BEQ] = function(am) {
            /* BEQ: Jump to the relative address if the zero
             * bit of SR is set
             */
            var addr = r[am].call(this);
            if (this.sr & 1<<CPU.SR_ZERO) {
                this.pc = addr;
            }
        }
    }
}
