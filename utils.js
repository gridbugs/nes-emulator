
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
    if (n.constructor == String) {
        return parseInt(n).toString(16);
    } else {
        return n.toString(16);
    }
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

var from_binary_8 = function(arr) {
    var ret = 0;
    for (var i = 0;i!==8;++i) {
        if (arr[i] === 1) {
            ret |= (1<<i);
        }
    }
    return ret;
}

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
