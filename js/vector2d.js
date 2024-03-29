/* Author: Bence Ágg (http://suopte.com/en), 2013*/
define([], function () {
    var vector2d = function (ax, ay) {
        this.x = ax;
        this.y = ay;
    };
       
	vector2d.prototype = {
        toString: function () {
            return '(' + this.x.toFixed(3) + ', ' + this.y.toFixed(3) + ')';
        },
        add: function (vec) {
            return new vector2d(this.x + vec.x, this.y + vec.y);
        },
        sub: function (vec) {
            return new vector2d(this.x - vec.x, this.y - vec.y);
        },
        dot: function (vec) {
            return this.x * vec.x + this.y * vec.y;
        },
        scale: function (scalar) {
            return new vector2d(this.x * scalar, this.y * scalar);
        },
        unit: function () {
            var len = Math.sqrt(this.x * this.x + this.y * this.y);
            if (len > 0.0)
                return new vector2d(this.x / len, this.y / len);
            else
                return new vector2d(0.0, 0.0);
        },
        len: function () {
            return Math.sqrt(this.x * this.x + this.y * this.y);
        },
        
        sadd: function (vec) {
            this.x += vec.x;
            this.y += vec.y;
        },
        ssub: function (vec) {
            this.x -= vec.x;
            this.y -= vec.y;
        },
        sscale: function (scalar) {
            this.x *= scalar;
            this.y *= scalar;
        },
        sunit: function () {
            var len = Math.sqrt(this.x * this.x + this.y * this.y);
            if (len > 0.0) {    
                this.x /= len;
                this.y /= len;
            }
        }
    };
    
    return vector2d;
});