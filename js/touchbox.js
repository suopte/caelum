/* Author: Bence Ágg (http://suopte.com/en), 2013*/
define([
	'lib/jrsi',
	'vector2d'
], function (Class, vector2d) {
	var teTouchBox = Class.extend({
		init: function (aTarget) {
			var self = this;
			var lTarget;
			if (typeof aTarget === 'string') {
				lTarget = this.fTarget = document.getElementById(aTarget);
			} else if (aTarget instanceof HTMLElement) {
				lTarget = this.fTarget = aTarget;
			}
			
			lTarget.addEventListener('touchstart', this, false);
			lTarget.addEventListener('touchmove', this, false);
			lTarget.addEventListener('touchend', this, false);
			
			this.fTarget = lTarget;
			this.fFingerList = [];
			this.fPrevDef = true;
			
			this.fSingleFinger = null;
			this.fFingerPair = null;
			this.fPanning = false;
			this.fPinching = false;
			
			this.ePan = null;
			this.ePinch = null;
			this.eTap = null;
			this.eEndPan = null;
		},
		handleEvent: function (e) {
			if (this.fPrevDef) e.preventDefault();
			if (e.type === 'touchstart') return this.mOnTouchStart(e);
			if (e.type === 'touchmove')  return this.mOnTouchMove(e); 
			if (e.type === 'touchend')   return this.mOnTouchEnd(e); 
		},
		
		mOnTouchStart: function (aEvt) {
			var lTouchList = aEvt.changedTouches;
			var lFingerList = this.fFingerList;
			var i, lPos, lTouch;
			for (i = 0; i < lTouchList.length; i++) {
				lTouch = lTouchList[i];
				lPos = new vector2d(lTouch.clientX, lTouch.clientY);
				lFingerList.push({
					id: lTouch.identifier,
					startPos: lPos,
					currPos: lPos,
					moved: false
				});
			}
			
			if (lFingerList.length === 1) {
				this.fSingleFinger = lFingerList[0];
				
			} else {
				var lFinger1 = lFingerList[0];
				var lFinger2 = lFingerList[1];
				var lDist = lFinger2.startPos.sub(lFinger1.startPos).len();
				
				if (lFingerList.length === 2) {
					this.fFingerPair = {
						finger1: lFinger1,
						finger2: lFinger2,
						startDist: lDist,
						currDist: lDist					
					};
				} else {
					this.fFingerPair = null;
				}
				
				this.fSingleFinger = null;
			}
		},
		
		mOnTouchMove: function (aEvt) {
			var lTouchList = aEvt.changedTouches;
			var i, lTouch, lFinger;
			for (i = 0; i < lTouchList.length; i++) {
				lTouch = lTouchList[i];
				lFinger = this.mGetFinger(lTouch);
				lFinger.currPos = new vector2d(lTouch.clientX, lTouch.clientY);
				lFinger.moved = true;
			}
			
			if (this.fSingleFinger) {
				if (!this.fPanning) {
					if (this.ePanStart) this.ePanStart(this.fSingleFinger);
					this.fPanning = true;
				} else {
					if (this.ePan) this.ePan(this.fSingleFinger);
				}
			} else if (this.fFingerPair) {
				var lFingerPair = this.fFingerPair;
				var lFinger1 = lFingerPair.finger1;
				var lFinger2 = lFingerPair.finger2;
				var lZoomFactor;
				lFingerPair.currDist = lFinger2.currPos.sub(lFinger1.currPos).len();
				
				if (!this.fPinching) {
					if (this.ePinchStart) this.ePinchStart(lFingerPair);
					this.fPinching = true;
				} else {
					if (this.ePinch) this.ePinch(lFingerPair);
					
					if (lFingerPair.startDist !== 0.0) {
						lZoomFactor = lFingerPair.currDist / lFingerPair.startDist;
						if (this.eZoom) this.eZoom(lZoomFactor);
					}
				}
			}
		},
		
		mOnTouchEnd: function (aEvt) {
			var lTouchList = aEvt.changedTouches;
			var i, lTouch, lFingerIdx, lFinger;
			for (i = 0; i < lTouchList.length; i++) {
				lTouch = lTouchList[i];
				lFingerIdx = this.mGetFingerIdx(lTouch);
				lFinger = this.fFingerList[lFingerIdx];
				this.fFingerList.splice(lFingerIdx, 1);
			}
			
			if (this.fFingerList.length === 0) {
				if (this.fSingleFinger) {
					if (!this.fSingleFinger.moved) {
						var lTargetBounds = this.fTarget.getBoundingClientRect();
						var lTargetPos = new vector2d(lTargetBounds.left, lTargetBounds.top);
						if (this.eTap) this.eTap(this.fSingleFinger.currPos.sub(lTargetPos));
					} else {
						if (this.ePanEnd) this.ePanEnd(this.fSingleFinger);
						this.fPanning = false;
					}
					this.fSingleFinger = null;
				}
			} else if (this.fFingerList.length === 1) {
				this.fFingerPair = null;
				this.fPinching = false;
			}
		},
		
		mGetFingerIdx: function (aTouch) {
			for (var i in this.fFingerList)
				if (this.fFingerList[i].id === aTouch.identifier) 
					return i;
		},
		
		mGetFinger: function (aTouch) {
			for (var i in this.fFingerList)
				if (this.fFingerList[i].id === aTouch.identifier) 
					return this.fFingerList[i];
		}
	});
	
	return teTouchBox;
});