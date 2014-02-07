function NESDisplay(name, pixel_size) {
    this.canvas = $("#"+name)[0];

    this.pixel_size = pixel_size == undefined ? 1 : pixel_size;

    this.canvas.width = NESDisplay.WIDTH * this.pixel_size;
    this.canvas.height = NESDisplay.HEIGHT * this.pixel_size;

    this.ctx = this.canvas.getContext("2d");
}

NESDisplay.HEIGHT = 240;
NESDisplay.WIDTH = 256;

NESDisplay.prototype.set_pixel = function(x, y, colour) {
    this.ctx.fillStyle = colour;
    this.ctx.beginPath();
    this.ctx.fillRect(x * this.pixel_size, y * this.pixel_size, this.pixel_size, this.pixel_size);
    this.ctx.fill();
}

NESDisplay.prototype.clear = function() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
}
