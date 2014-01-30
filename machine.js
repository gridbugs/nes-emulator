function Machine() {
    this.ram = new Array(0x10000);
    this.cpu = new CPU();
}

