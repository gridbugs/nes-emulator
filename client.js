
var rom;
var machine;
$(function() {
    load_nes_file("Legend of Zelda.nes", function(data) {

        /* decode the file into an array of bytes */
        var data_arr = str_to_ascii(data);

        /* parse the nes header */
        var header = get_header(data_arr);

        if (header.valid) {

            /* initialize the ISA data structures */
            AddressingMode.init();
            Instruction.init();
            Emulator.init();

            /* copy each rom bank into its own array */
            rom = get_rom_banks(header, data_arr);

            /* print out the first rom's contents */
            display_rom_bank(rom[0]);

            /* initialize the emulated machine */
            machine = new CPU();
            machine.connect_memory_map(new NESMemoryConfiguration());
            machine.memory.connect_prgrom0(rom[0]);
            machine.memory.connect_prgrom1(rom[1]);

            /* begin the emulation */
            machine.start();
        }
    });
});

function display_rom_bank(bank) {
    var buf = "<tr><td>0:</td>";
    for (var i in bank) {
        if (i > 0 && i % 20 == 0) {
            buf=buf.concat("<tr/><tr><td>" + i + ":</td>");
        }
        buf=buf.concat("<td>" + hex(bank[i]) + "</td>");
    }
    buf=buf.concat("<tr/>");
    $('#memory').html(buf);
}
