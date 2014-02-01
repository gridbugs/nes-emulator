
function display_rom_bank(bank, offset) {
    var buf = "<tr><td>"+hex(offset)+":</td>";
    for (var i in bank) {
        if (i > 0 && i % 20 == 0) {
            buf=buf.concat("<tr/><tr><td>" + hex(parseInt(i) + offset) + ":</td>");
        }
        buf=buf.concat("<td>" + hex(bank[i]) + "</td>");
    }
    buf=buf.concat("<tr/>");
    $('#memory').html(buf);
}

/* local namespace */
function Debug(){}
Debug.instr_buffer = "";
Debug.pc = "";
Debug.encoded = "";

function buffer_encoded_instr(str) {
    Debug.encoded = str;
}
function buffer_pc(pc) {
    Debug.pc = pc;
}
function buffer_instr(str) {
    Debug.instr_buffer += str;
}
function buffer_args(cpu, am) {
    if (Debug.r[am]) {
        Debug.instr_buffer += " ";
        Debug.r[am](cpu);
    }
}
function print_instr() {
    console.debug(pad_str(hex(Debug.pc), 4) + ": (" + 
        pad_str(Debug.encoded + ")", 12) + Debug.instr_buffer);
    
    Debug.instr_buffer = "";
    Debug.pc = "";
    Debug.encoded = "";
}
Debug.init = function() {
    /* Has to be called before emulating the instruction */
    Debug.r = [];
    Debug.r[AddressingMode.IMM] = function(cpu) {
        Debug.instr_buffer += ("#" + hex(cpu.memory.read(cpu.pc)));
        Debug.encoded += (" " + hex(cpu.memory.read(cpu.pc)));
    }
    Debug.r[AddressingMode.ABS] = function(cpu) {
        Debug.instr_buffer += ("$" + hex(cpu.memory.read(cpu.pc+1)));
        Debug.instr_buffer += (hex(cpu.memory.read(cpu.pc)));
        Debug.encoded += (" " + hex(cpu.memory.read(cpu.pc)));
        Debug.encoded += (" " + hex(cpu.memory.read(cpu.pc+1)));
    }
    Debug.r[AddressingMode.REL] = function(cpu) {
        Debug.instr_buffer += ("$" + hex(cpu.memory.read(cpu.pc)+2));
        Debug.encoded += (" " + hex(cpu.memory.read(cpu.pc)));
    }
    Debug.r[AddressingMode.ACC] = function(cpu) {
    }
    Debug.r[AddressingMode.IMP] = function(cpu) {
    }
    Debug.r[AddressingMode.ZP] = function(cpu) {
        Debug.instr_buffer += ("$" + hex(cpu.memory.read(cpu.pc)));
        Debug.encoded += (" " + hex(cpu.memory.read(cpu.pc)));
    }
    Debug.r[AddressingMode.ZP_Y] = function(cpu) {
        Debug.instr_buffer += ("$" + hex(cpu.memory.read(cpu.pc)) + ",Y");
        Debug.encoded += (" " + hex(cpu.memory.read(cpu.pc)));
    }

    Debug.r[AddressingMode.ZP_I_Y] = function(cpu) {
        Debug.instr_buffer += ("($" + hex(cpu.memory.read(cpu.pc)) + "),Y");
        Debug.encoded += (" " + hex(cpu.memory.read(cpu.pc)));
    }
    Debug.r[AddressingMode.ZP_I_X] = function(cpu) {
        Debug.instr_buffer += ("($" + hex(cpu.memory.read(cpu.pc)) + ",X)");
        Debug.encoded += (" " + hex(cpu.memory.read(cpu.pc)));
    }

}
