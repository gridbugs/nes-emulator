/* This file contains the definition of the instructions
 * and addressing modes used by the 6502. It contains functions
 * and data structures relating to decoding instructions
 * and addressing modes from opcodes.
 */

/* These are really just namespaces */
function Instruction() {}
function AddressingMode() {}

Instruction.init = function() {
    enumerate("Instruction", [
        // aaabbbcc Instructions
        "ORA",
        "AND",
        "EOR",
        "ADC",
        "STA",
        "LDA",
        "CMP",
        "SBC",
        "ASL",
        "ROL",
        "LSR",
        "ROR",
        "STX",
        "LDX",
        "DEC",
        "INC",
        "BIT",
        "JMP",
        "JMPA", // special case for absolute jump
        "STY",
        "LDY",
        "CPY",
        "CPX",
        "NUM_AAABBBCC_INSTRS", // nice to know how many there are

        // Conditional Branch Instructions
        "BPL",
        "BMI",
        "BVC",
        "BVS",
        "BCC",
        "BCS",
        "BNE",
        "BEQ",

        // Interrupt and Subroutine Instructions
        "BRK",
        "JSR",
        "RTI",
        "RTS",

        // Other Instructions
        "PHP",
        "PLP",
        "PHA",
        "PLA",
        "DEY",
        "TAY",
        "INY",
        "INX",
        "CLC",
        "SEC",
        "CLI",
        "SEI",
        "TYA",
        "CLV",
        "CLD",
        "SED",
        "TXA",
        "TXS",
        "TAX",
        "TSX",
        "DEX",
        "NOP"
    ]);

    with (Instruction) {
        /* Instructions in the form aaabbbcc.
         * The table is referenced aaabbbcc[cc][aaa] to find an instruction. */
        Instruction.aaabbbcc = {
            1: {
                0: ORA,
                1: AND,
                2: EOR,
                3: ADC,
                4: STA,
                5: LDA,
                6: CMP,
                7: SBC
            },
            2: {
                0: ASL,
                1: ROL,
                2: LSR,
                3: ROR,
                4: STX,
                5: LDX,
                6: DEC,
                7: INC
            },
            0: {
                1: BIT,
                2: JMP,
                3: JMPA,
                4: STY,
                5: LDY,
                6: CPY,
                7: CPX
            }
        };

        with (AddressingMode) {
            /* a table of (aaabbbcc instructions x addressing modes) booleans
             * with "true" in a cell iff that instruction is defined for that
             * addressing mode
             * http://www.llx.com/~nparker/a2/opcodes.html */
            Instruction.well_defined_aaabbbcc = new Array(NUM_AAABBBCC_INSTRS);
            for (var i = 0;i!=NUM_AAABBBCC_INSTRS;++i) {
                well_defined_aaabbbcc[i] = new Array(NUM_ADDRESSING_MODES);
                for (var j = 0;j!=NUM_ADDRESSING_MODES;++j) {
                    well_defined_aaabbbcc[i][j] = true;
                }
            }
            /* the table is initialized to true, so now cross off all the
             * invalid combinations */
            var w = well_defined_aaabbbcc; // get a shorter variable name
            w[STA][IMM] = false;
            var tmp = [ASL, ROL, LSR, ROR, STX, DEC, INC];
            for (var i in tmp) {
                w[tmp[i]][IMM] = false;
            }
            tmp = [STX, LDX, DEC, INC];
            for (var i in tmp) {
                w[tmp[i]][ACC] = false;
            }
            w[STX][ABS_X] = false;
            w[BIT][IMM] = false
            w[BIT][ZP_X] = false;
            w[BIT][ABS_X] = false;
            tmp = [IMM, ZP, ZP_X, ABS_X];
            for (var i in tmp) {
                w[JMP][tmp[i]] = false;
                w[JMPA][tmp[i]] = false;
            }
            w[STY][IMM] = false;
            w[STY][ABS_X] = false;
            w[CPY][ZP_X] = false;
            w[CPY][ABS_X] = false;
            w[CPX][ZP_X] = false;
            w[CPX][ABS_X] = false;
        }

        /* Instructions in the from xxy10000.
         * The table is referenced branch[y][xx] */
        Instruction.branch = {
            0: {
                0: BPL,
                1: BVC,
                2: BCC,
                3: BNE
            },
            1: {
                0: BMI,
                1: BVS,
                2: BCS,
                3: BEQ
            }
        };

        /* One last table with all remaining instructions.
         * These are all single byte instructions, and don't
         * require an addressing mode to operate. */
        Instruction.single_byte = {
            0x00: BRK,
            0x40: RTI,
            0x60: RTS,
            0x08: PHP,
            0x28: PLP,
            0x48: PHA,
            0x68: PLA,
            0x88: DEY,
            0xA8: TAY,
            0xC8: INY,
            0xE8: INX,
            0x18: CLC,
            0x38: SEC,
            0x58: CLI,
            0x78: SEI,
            0x98: TYA,
            0xB8: CLV,
            0xD8: CLD,
            0xF8: SED,
            0x8A: TXA,
            0x9A: TXS,
            0xAA: TAX,
            0xBA: TSX,
            0xCA: DEX,
            0xEA: NOP
        };

        /* array of all the different instruction
         * decoding methods we have in the order
         * they should be attempted */
        Instruction.decoders = [
            decode_aaabbbcc,
            decode_other,
            decode_branch,
            decode_JSR
        ];
    }
}

/* returns undefined or a {instruction, addressing_mode} tuple */
Instruction.decode_aaabbbcc = function(opcode) {
    var aaa = opcode >> 5;
    var bbb = (opcode >> 2) & 7;
    var cc = opcode & 3;

    var attempt_table = Instruction.aaabbbcc[cc];
    if (attempt_table == undefined) {
        return undefined;
    }
    var attempt_instr = attempt_table[aaa];
    if (attempt_instr == undefined) {
        return undefined;
    }

    /* here we got an instruction, but it might not be defined
     * for the particular addressing mode specified by bbb,
     * so we have to check if it makes sense as its opcode may
     * be used for a different, well defined instruction */
    var addressing_mode = AddressingMode.aaabbbcc[cc][bbb];

    if (!Instruction.well_defined_aaabbbcc[attempt_instr][addressing_mode]) {
        return undefined;
    }

    /* it's survived this far, but now there are more special rules
     * we need to apply
     * http://www.llx.com/~nparker/a2/opcodes.html */
    if ((attempt_instr == Instruction.STX || attempt_instr == Instruction.LDX)
        && addressing_mode == AddressingMode.ZP_X) {
        addressing_mode = AddressingMode.ZP_Y;
    }

    if (attempt_instr == Instruction.LDX && addressing_mode == AddressingMode.ABS_X) {
        addressing_mode = AddressingMode.ABS_Y;
    }

    return {
        instruction: attempt_instr,
        addressing_mode: addressing_mode
    };

}

Instruction.decode_branch = function(opcode) {
    /* all branch instructions end in 0x10 as the
     * least significant 5 bits */
    if ((opcode & 0x1f) != 0x10) {
        return undefined;
    }

    /* now since the branch table is full, we can just index
     * into it and be done */
    var xx = opcode >> 6;
    var y = (opcode >> 5) & 1;
    return {
        instruction: Instruction.branch[y][xx],
        addressing_mode: AddressingMode.REL
    };
}

/* this instruction gets its own decoder because it uses
 * absolute addressing and doesn't fit the aaabbbcc pattern */
Instruction.decode_JSR = function(opcode) {
    if (opcode != 0x20) {
        return undefined;
    }
    return {
        instruction: Instruction.JSR,
        addressing_mode: AddressingMode.ABS
    };
}

/* decode any instruction not handled by one of the
 * other decoding functions. These are all 1 byte
 * and thus have "implied" as their addressing mode. */
Instruction.decode_other = function(opcode) {
    var instr = Instruction.single_byte[opcode];
    if (instr == undefined) {
        return undefined;
    }
    return {
        instruction: instr,
        addressing_mode: AddressingMode.IMP
    };
}

/* decode an opcode, returning the instruction and addressing mode */
Instruction.decode = function(opcode) {
    for (var i in Instruction.decoders) {
        var instr = Instruction.decoders[i](opcode);
        if (instr != undefined) {
            return instr;
        }
    }
    return undefined;
}

AddressingMode.init = function() {
    enumerate("AddressingMode", [
        "ACC",      // Accumulator
        "IMP",      // Implied
        "IMM",      // Immediate
        "ABS",      // Absolute
        "ZP",       // Zero Page
        "REL",      // Relative
        "ABS_X",    // Absolute Indexed with X
        "ABS_Y",    // Absolute Indexed with Y
        "ZP_X",     // Zero Page Indexed with X
        "ZP_Y",     // Zero Page Indexed with Y
        "ZP_I_X",   // Zero Page Indirect Indexed with X
        "ZP_I_Y",   // Zero Page Indirect Indexed with Y
        "NUM_ADDRESSING_MODES",
    ]);

    with (AddressingMode) {
        /* this table is referenced addressing_modes[cc][bbb] to find an addressing mode */
        AddressingMode.aaabbbcc = {
            1: {
                0: ZP_I_X,
                1: ZP,
                2: IMM,
                3: ABS,
                4: ZP_I_Y,
                5: ZP_X,
                6: ABS_Y,
                7: ABS_X
            },
            2: {
                0: IMM,
                1: ZP,
                2: ACC,
                3: ABS,
                5: ZP_X,
                7: ABS_X
            },
            0: {
                0: IMM,
                1: ZP,
                3: ABS,
                5: ZP_X,
                7: ABS_X
            }
        }

    }

}



var itos = function(i) {
    return Instruction.names[i.instruction] + ", " +
           AddressingMode.names[i.addressing_mode];
}
