var nes;
$(function() {
    load_binary_file("Legend of Zelda.nes", function(data) {

        /* decode the file into an array of bytes */
        var data_arr = str_to_ascii(data);

        /* Initialize the data structures that make up the emulator */
        AddressingMode.init();
        Instruction.init();
        Emulator.init();

        /* initialize the NES specific data structures */
        NES.init();

        /* create a nes object */
        nes = new NES();

        /* connect the nes to the rom */
        if (nes.load_rom(data_arr)) {

            display_rom_bank(nes.rom[1]);

            /* initialize the emulated device */
            nes.init();
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
