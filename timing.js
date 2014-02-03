/* This represents the abstract notion of the passing of time. A
 * machine may have multiple processors or application specific processors
 * running independantly of the main cpu. Since javascript doesn't provide
 * mechanisms for calling functions at the frequency high enough to meet the
 * requirements of emulation, several processor cycles happen sequentially
 * (at the speed of the host machine) in each tick (which may only be in the
 * 10s of hertz). */

/* The function f is called with frequency freq */
function TimedEvent(f, freq) {
    this.f = f;
    this.freq = freq; // frequency in hertz
    this.period = 1000/freq; // period in milliseconds
};


/* A timer that ticks every 'resolution' milliseconds */
function Timer(resolution) {
    this.resolution = resolution;
    this.events = [];
    this.heap = new Heap(Timer.le);
    this.running = false;
}

Timer.le = function(a, b) {
    return a.progress <= b.progress;
}

Timer.prototype.add_event = function(e) {
    var cycles_per_tick = (e.freq*this.resolution)/1000;
    var ev = {
        f: e.f,

        cycles: Math.floor(cycles_per_tick),

        /* progress in milliseconds */
        progress: 0,

        /* a number 0<=x<1 representing the fraction of a cycle that
         * was omitted due to the frequency of the event not being
         * evenly divisible by the frequency of the timer. This
         * should be incremented each tick by the decimal component
         * of (e.freq/this.freq) and an extra "leap" cycle should
         * occur when it gets greater than 1, at which point it should
         * be decremented. */
        cycle_error: 0,

        cycle_remainder: cycles_per_tick - Math.floor(cycles_per_tick),

        // number of milliseconds per cycle
        period: e.period
    };
    this.events.push(ev);
    this.heap.insert(ev);
}

/* Run the first event as much as it should run, then run the second,
 * then third, etc */
Timer.prototype.tick_sequential = function() {
    for (var i = 0;i!=this.events.length;++i) {
        var e = this.events[i];
        for (var j = 0;j!=e.cycles;++j) {
            e.f();
        }

        e.cycle_error += e.cycle_remainder;
        if (e.cycle_error >= 1) {
            e.f();
            e.cycle_error -= 1;
        }
    }
}



/* This will repeatedly progress the least progressed event until
 * it becomes the most or equal progressed event until all
 * events are fully progressed. It will use a heap to easily access
 * the least progressed event */
Timer.prototype.run_interleaved = function() {
    this.running = true;
    _this = this;
    var tick = function() {
        _this.tick_interleaved();
        if (_this.running) {
            setTimeout(tick, _this.resolution);
        }
    }
    tick();
}

Timer.prototype.tick_interleaved = function() {
    // stores the progress of each event
    var progress = this.heap.clone();

    // set each event's remaining cycles
    this.events.map(function(e){
        e.rem_cycles = e.cycles
        if (e.cycle_error >= 1) {
            e.rem_cycles++;
            e.cycle_error -= 1;
        }
    });

    // measured in milliseconds
    var max_progress = 0;

    while(!progress.is_empty() && this.running) {

        // get the least progressed event
        var least_progressed = progress.remove();

        // repeat until least_progressed is greater than the previous max progressed
        while (least_progressed.progress <= max_progress) {
            least_progressed.f();
            least_progressed.progress += least_progressed.period;
            least_progressed.rem_cycles--;
        }

        max_progress = least_progressed.progress;
        // if the event isn't complete, re-insert it
        if (least_progressed.rem_cycles > 0) {
            progress.insert(least_progressed);
        } else {
            /* last_progressed is finished, so set its cycle_error */
            least_progressed.cycle_error += least_progressed.cycle_remainder;
        }

    }

}

