/* Author: Bence Ágg (http://suopte.com/en), 2013*/
define(['vector3d'], function (vector3d) {
    var matrix4 = function (am) {
        if (am instanceof Array) this.m = am;
        else this.clear();
    };
    
    matrix4.prototype = {
        toString: function () {
            var m = this.m,
            	d = 2;
            return m[0][0].toFixed(d) + ', ' + m[0][1].toFixed(d) + 
            ', ' + m[0][2].toFixed(d) + ', ' + m[0][3].toFixed(d) +
            "\n" + m[1][0].toFixed(d) + ', ' + m[1][1].toFixed(d) + 
            ', ' + m[1][2].toFixed(d) + ', ' + m[1][3].toFixed(d) +
            "\n" + m[2][0].toFixed(d) + ', ' + m[2][1].toFixed(d) + 
            ', ' + m[2][2].toFixed(d) + ', ' + m[2][3].toFixed(d) + 
            "\n" + m[3][0].toFixed(d) + ', ' + m[3][1].toFixed(d) + 
            ', ' + m[3][2].toFixed(d) + ', ' + m[3][3].toFixed(d);
		},
        
        
        clear: function () {
            this.m = [
				[0.0, 0.0, 0.0, 0.0],
				[0.0, 0.0, 0.0, 0.0],
				[0.0, 0.0, 0.0, 0.0],
				[0.0, 0.0, 0.0, 0.0]
			];
        },
        
        identity: function () {
            this.m = [
				[1.0, 0.0, 0.0, 0.0],
				[0.0, 1.0, 0.0, 0.0],
				[0.0, 0.0, 1.0, 0.0],
				[0.0, 0.0, 0.0, 1.0]
			];
        },
        
        add: function (mat) {
            var res = new matrix4(),
                i, j;
            for (i = 0; i < 4; i++)
                for (j = 0; j < 4; j++)
                    res.m[i][j] = this.m[i][j] + mat.m[i][j];
            return res;
        },
        
        mul: function (mat) {
            var res = new matrix4(),
                i,  j, k;
            for (i = 0; i < 4; i++)
                for (j = 0; j < 4; j++)
                    for (k = 0; k < 4; k++)
                        res.m[i][j] += this.m[i][k] * mat.m[k][j];
            return res;
        },
        
        mulVec: function (vec) {
            var m = this.m,
                xh = m[0][0] * vec.x + m[0][1] * vec.y + m[0][2] * vec.z + m[0][3],
                yh = m[1][0] * vec.x + m[1][1] * vec.y + m[1][2] * vec.z + m[1][3],
                zh = m[2][0] * vec.x + m[2][1] * vec.y + m[2][2] * vec.z + m[2][3],
                h  = m[3][0] * vec.x + m[3][1] * vec.y + m[3][2] * vec.z + m[3][3];
            return new vector3d(xh / h, yh / h, zh / h);
        },
        
        det: function () {
			//Source: https://github.com/toji/gl-matrix
			var m = this.m,
				a00 = m[0][0], a01 = m[0][1], a02 = m[0][2], a03 = m[0][3],
				a10 = m[1][0], a11 = m[1][1], a12 = m[1][2], a13 = m[1][3],
				a20 = m[2][0], a21 = m[2][1], a22 = m[2][2], a23 = m[2][3],
				a30 = m[3][0], a31 = m[3][1], a32 = m[3][2], a33 = m[3][3];
				
			return  a30*a21*a12*a03 - a20*a31*a12*a03 - a30*a11*a22*a03 + a10*a31*a22*a03 +
					a20*a11*a32*a03 - a10*a21*a32*a03 - a30*a21*a02*a13 + a20*a31*a02*a13 +
					a30*a01*a22*a13 - a00*a31*a22*a13 - a20*a01*a32*a13 + a00*a21*a32*a13 +
					a30*a11*a02*a23 - a10*a31*a02*a23 - a30*a01*a12*a23 + a00*a31*a12*a23 +
					a10*a01*a32*a23 - a00*a11*a32*a23 - a20*a11*a02*a33 + a10*a21*a02*a33 +
					a20*a01*a12*a33 - a00*a21*a12*a33 - a10*a01*a22*a33 + a00*a11*a22*a33;
        },
        
        inverse: function () {
        	//Source: https://github.com/toji/gl-matrix
			var m = this.m,
				a00 = m[0][0], a01 = m[0][1], a02 = m[0][2], a03 = m[0][3],
				a10 = m[1][0], a11 = m[1][1], a12 = m[1][2], a13 = m[1][3],
				a20 = m[2][0], a21 = m[2][1], a22 = m[2][2], a23 = m[2][3],
				a30 = m[3][0], a31 = m[3][1], a32 = m[3][2], a33 = m[3][3],
				res = new matrix4()
				
			var b00 = a00*a11 - a01*a10,
				b01 = a00*a12 - a02*a10,
				b02 = a00*a13 - a03*a10,
				b03 = a01*a12 - a02*a11,
				b04 = a01*a13 - a03*a11,
				b05 = a02*a13 - a03*a12,
				b06 = a20*a31 - a21*a30,
				b07 = a20*a32 - a22*a30,
				b08 = a20*a33 - a23*a30,
				b09 = a21*a32 - a22*a31,
				b10 = a21*a33 - a23*a31,
				b11 = a22*a33 - a23*a32;
			
			var invDet = 1/(b00*b11 - b01*b10 + b02*b09 + b03*b08 - b04*b07 + b05*b06);
			
			res.m[0][0] = (a11*b11 - a12*b10 + a13*b09)*invDet;
			res.m[0][1] = (-a01*b11 + a02*b10 - a03*b09)*invDet;
			res.m[0][2] = (a31*b05 - a32*b04 + a33*b03)*invDet;
			res.m[0][3] = (-a21*b05 + a22*b04 - a23*b03)*invDet;
			res.m[1][0] = (-a10*b11 + a12*b08 - a13*b07)*invDet;
			res.m[1][1] = (a00*b11 - a02*b08 + a03*b07)*invDet;
			res.m[1][2] = (-a30*b05 + a32*b02 - a33*b01)*invDet;
			res.m[1][3] = (a20*b05 - a22*b02 + a23*b01)*invDet;
			res.m[2][0] = (a10*b10 - a11*b08 + a13*b06)*invDet;
			res.m[2][1] = (-a00*b10 + a01*b08 - a03*b06)*invDet;
			res.m[2][2] = (a30*b04 - a31*b02 + a33*b00)*invDet;
			res.m[2][3] = (-a20*b04 + a21*b02 - a23*b00)*invDet;
			res.m[3][0] = (-a10*b09 + a11*b07 - a12*b06)*invDet;
			res.m[3][1] = (a00*b09 - a01*b07 + a02*b06)*invDet;
			res.m[3][2] = (-a30*b03 + a31*b01 - a32*b00)*invDet;
			res.m[3][3] = (a20*b03 - a21*b01 + a22*b00)*invDet;
			
			return res;
        }
    };
    
    matrix4.translation = function (vec) {
        return new matrix4([
			[1.0, 0.0, 0.0, 0.0],
			[0.0, 1.0, 0.0, 0.0],
			[0.0, 0.0, 1.0, 0.0],
			[vec.x, vec.y, vec.z, 1.0]
		]);
    };
	
	matrix4.rotateX = function (theta) {
		return new matrix4([
			[1.0, 0.0, 0.0, 0.0],
			[0.0, Math.cos(theta), -Math.sin(theta), 0.0],
			[0.0, Math.sin(theta), Math.cos(theta), 0.0],
			[0.0, 0.0, 0.0, 1.0]
		]);
	};
	
	matrix4.rotateY = function (theta) {
		return new matrix4([
			[Math.cos(theta), 0.0, Math.sin(theta), 0.0],
			[0.0, 1.0, 0.0, 0.0],
			[-Math.sin(theta), 0.0, Math.cos(theta), 0.0],
			[0.0, 0.0, 0.0, 1.0]
		]);
	};
	
	matrix4.rotateZ = function (theta) {
		return new matrix4([
			[Math.cos(theta), -Math.sin(theta), 0.0, 0.0],
			[Math.sin(theta), Math.cos(theta), 0.0, 0.0],
			[0.0, 0.0, 1.0, 0.0],
			[0.0, 0.0, 0.0, 1.0]
		]);
	};
	
	matrix4.rotateAxis = function (axis, theta) {
		var u = axis.unit(),
			sint = Math.sin(theta),
			cost = Math.cos(theta),
			o = 1 - cost;
		return new matrix4([
			[cost + u.x * u.x * o, u.x * u.y * o - u.z * sint, u.x * u.z * o + u.y * sint, 0.0],
			[u.y * u.x * o + u.z * sint, cost + u.y * u.y * o, u.y * u.z * o - u.x * sint, 0.0],
			[u.z * u.x * o - u.y * sint, u.z * u.y * o + u.x * sint, cost + u.z * u.z * o, 0.0],
			[0.0, 0.0, 0.0, 1.0]
		]);
	};
	
    
    matrix4.lookAt = function (eye, target, up) {
        var zaxis = target.sub(eye).unit(),
			xaxis = up.cross(zaxis).unit(),
			yaxis = zaxis.cross(xaxis);
		return new matrix4([
			[xaxis.x, yaxis.x, zaxis.x, -xaxis.dot(eye)],
			[xaxis.y, yaxis.y, zaxis.y, -yaxis.dot(eye)],
			[xaxis.z, yaxis.z, zaxis.z, -zaxis.dot(eye)],
			[0.0, 0.0, 0.0, 1.0]
		]);
    };
    
    matrix4.perspective = function (fov, aspect, fp, bp) {
        var slopey = Math.tan(fov * Math.PI / 360.0),
            m00 = 1.0 / slopey / aspect,
            m11 = 1.0 / slopey,
            m22 = -(fp + bp) / (bp - fp),
            m23 = -2.0 * fp * bp / (bp - fp);
            
		return new matrix4([
			[m00, 0.0, 0.0, 0.0],
			[0.0, m11, 0.0, 0.0],
			[0.0, 0.0, m22, m23],
			[0.0, 0.0, -1.0, 0.0]
		]);
    };
    
    return matrix4;
});