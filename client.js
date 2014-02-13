var nes;
$(function() {
    //load_binary_file("Legend of Zelda.nes", function(data) {
    load_binary_file("Donkey Kong.nes", function(data) {

        /* decode the file into an array of bytes */
        var data_arr = str_to_ascii(data);

        /* Initialize the data structures that make up the emulator */
        AddressingMode.init();
        Instruction.init();
        Emulator.init();

        Debug.init();

        /* initialize the NES specific data structures */
        NES.init();

        /* create a nes object */
        nes = new NES();

//        nes.cpu.add_breakpoint(0xe60e);
//       nes.cpu.add_break_count(100000);

        /* connect the nes to the rom */
        if (nes.load_rom(data_arr)) {

            /* initialize the emulated device */
            nes.init();
            
            NESPPU.debug_display_pattern_tables(debug_display.ctx, nes.chrrom[0], 0, 0);
            
        }
    });
});

