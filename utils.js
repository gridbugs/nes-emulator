var pad_str = function(str, len) {
    var padding = "";
    for (var i = 0;i<len - str.length;++i) {
        padding += " ";
    }
    return str + padding;
}

/* converts a string into an array of ascii codes. For non-ascii
 * characters it appears they get |'d with 0xf700, so just & with
 * 0xff to get rid of the high byte.
 */
var str_to_ascii = function(str) {
    var chars = str.split('');
    var codes = [];
    for (var i in chars) {
        var code = ascii(chars[i]);
        codes.push(code & 0xff);
    }
    return codes;
}

var to_twos_complement_8 = function(x) {
    if (x < 0) {
        x = (0xffff + x) + 1;
    }
    return x & 0xff;
}
/* computes the two's compliment of an 8 bit integer
 * e.g. twos_compliment_8(255) == -1
 */
var twos_complement_8 = function(x) {
    if (x & 1<<7) {
        x = -((255 - x) + 1); // flip bits, add 1 and negate
    }
    return x;
}

/* convert a number to a hex string */
var hex = function(n) {
    var str;
    if (n.constructor == String) {
        str = parseInt(n).toString(16);
    } else {
        str = n.toString(16);
    }
    if (str.length == 1) {
        str = "0" + str;
    }
    return str;
}

/* for characters that aren't in the ascii table, this returns
 * unicode codes */
var ascii = function(c) {
    return c.charCodeAt(0);
}


/* apply function to string as if it was a char array */
var strarr = function(f, str) {
    return f(str.split('')).join('');
}

/* returns an array with the first n elements of arr */
var take = function(arr, n) {
    var ret = new Array(n);
    for (var i = 0;i!=n;++i) {
        ret[i] = arr[i];
    }
    return ret;
}

/* takes a 1 byte unsigned integer and returns
 * its binary representation as an array of 1s and 0s */
var to_binary_8 = function(n) {
    var ret = new Array(8);
    for (var i = 0;i!==8;++i) {
        if ((1<<i & n) === 0) {
            ret[i] = 0;
        } else {
            ret[i] = 1;
        }
    }
    return ret;
}

/* takes an array of 1s and 0s and returns
 * the number they represented in binary */
var from_binary_8 = function(arr) {
    var ret = 0;
    for (var i = 0;i!==8;++i) {
        if (arr[i] === 1) {
            ret |= (1<<i);
        }
    }
    return ret;
}

/* returns true iff the array has only
 * elements whose values are 0 */
var all_zeroes = function(arr) {
    for (var i in arr) {
        if (arr[i] != 0) {
            return false;
        }
    }
    return true;
}

/* pass the namespace in as a string */
var enumerate = function(namespace, values) {
    eval(namespace + ".count = 0;");
        eval(namespace + ".names = [];");
    for (var i in values) {
        var value = values[i];
        eval(namespace + "." + value + "=" + i + ";");
        eval(namespace + ".names[" + i + "] = '" + value + "';");
    }
}

/* loads a file asynchronously without the constraint of characters being encoded
 * in unicode as this disallows certain values to appear in bytes
 * in the file */
var load_binary_file = function(name, f) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onload = function() {
        f(this.response);
    };
    xmlhttp.open("GET", name, true);
    xmlhttp.overrideMimeType("text/plain; charset=x-user-defined");
    xmlhttp.send();
}


