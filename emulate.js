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
            return this.ram[this.cpu.pc++];
        }
        r[ABS] = function() {
            /* Absolute:
             * The two bytes following the instruction represent
             * a little endian address. Read the byte at that
             * address.
             */
            var addr = this.little_endian_2_byte_at(this.cpu.pc);
            this.cpu.pc += 2;
            return this.ram[addr];
        }
        r[REL] = function() {
            /* Relative:
             * 2's complement add the 1 byte following the instruction
             * to the PC (don't set the PC to this value, just return it).
             */
            var offset = this.ram[this.cpu.pc++];
            return twos_complement_8(offset) + this.cpu.pc;
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
            var addr = this.little_endian_2_byte_at(this.cpu.pc);
            this.cpu.pc += 2;
            this.ram[addr] = data;
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
            this.cpu.ac = r[am].call(this);
            this.cpu.sr_respond(this.cpu.ac);
        }

        e[SEI] = function(am) {
            /* SEI: Set Interrupt-disable bit in SR */
            this.cpu.sr |= 1<<CPU.SR_INTERRUPT_DISABLE;
        }

        e[CLD] = function(am) {
            /* CLD: Clear the Decimal-mode bit in SR */
            this.cpu.sr &= (~(1<<CPU.SR_DECIMAL));
        }

        e[STA] = function(am) {
            /* STA: Store the Accumulator in memory */
            w[am].call(this, this.cpu.ac);
        }

        e[LDX] = function(am) {
            /* LDX: Load a value into X */
            this.cpu.x = r[am].call(this);
            this.cpu.sr_respond(this.cpu.x);
        }

        e[TXS] = function(am) {
            /* TXS: Transfer the value in X to SR */
            this.cpu.sp = this.cpu.x;
            this.cpu.sr_respond(this.cpu.sp);
        }

        e[AND] = function(am) {
            /* AND: Bitwise and the accumulator with a value
             * and store the result in the accumulator
             */
            this.cpu.ac &= r[am].call(this);
            this.cpu.sr_respond(this.cpu.ac);
        }

        e[BEQ] = function(am) {
            /* BEQ: Jump to the relative address if the zero
             * bit of SR is set
             */
            var addr = r[am].call(this);
            if (this.cpu.sr & 1<<CPU.SR_ZERO) {
                this.cpu.pc = addr;
            }
        }
    }
}
