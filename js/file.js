/* Author: Bence Ágg (http://suopte.com/en), 2013*/
define([
	'lib/jrsi'
], function (Class) {
	var teFile = Class.extend({
		fSource: null,
		fLength: 0,
		fCursor: 0,
		init: function (aSource) {
			this.fSource = aSource;
			this.fLength = aSource.length;
		},
		
		mEof: function () {
			return (this.fCursor >= this.fLength);
		},
		
		mRead: function (aCount) {
			var lRes = this.fSource.substr(this.fCursor, aCount);
			this.fCursor += aCount;
			return lRes;
		},
		
		mScan: function (aUntilNewLine) {
			var lSpecs = "\n\t ,;", 
				lPos = this.fCursor,
				lRes = '';
			while (lPos < this.fLength && lSpecs.indexOf(this.fSource.charAt(lPos)) > -1) lPos++;
			if (aUntilNewLine) {
				while (lPos < this.fLength && this.fSource.charAt(lPos) != "\n") {
					lRes += this.fSource.charAt(lPos);
					lPos++;
				}
			} else {
				while (lPos < this.fLength && lSpecs.indexOf(this.fSource.charAt(lPos)) == -1) {
					lRes += this.fSource.charAt(lPos);
					lPos++;
				}
			}
			this.fCursor = lPos;
			return lRes;
		}
	});
	
	return teFile;
});