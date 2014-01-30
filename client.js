var nes;
$(function() {
    load_nes_file("Legend of Zelda.nes", function(data) {

        /* decode the file into an array of bytes */
        var data_arr = str_to_ascii(data);

        /* Initialize the data structures that make up the emulator */
        AddressingMode.init();
        Instruction.init();
        Emulator.init();

        /* create a nes object */
        nes = new NES();

        /* connect the nes to the rom */
        nes.load_rom(data_arr);

        /* begin the emulation */
        nes.start();
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
