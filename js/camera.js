/* Author: Bence Ágg (http://suopte.com/en), 2013*/
define([
	'lib/jrsi',
	'vector2d',
	'vector3d',
	'matrix4',
	'touchbox'
], function (Class, vector2d, vector3d, matrix4, teTouchBox) {
	var teCamera = Class.extend({
		fCanvas: null,
		fCtx: null,
		fRa: 0.0, 
		fDec: Math.PI / 2,
		fZenRa: 0,
		fZenDec: 0,
		fHorizX: null,
		fHorizY: null,
		fHorizZ: null,
		fEye: null,
		fUp: null,
		fUpAngle: 0,
		fLookAt: null,
		fFov: 70,
		fZoomFactor: 1.0,
		fAspect: 4/3,	
		fProjectMat: null,
		fWorldMat: null,
		
		fScreenFactor: 0.0,
		
		fRaStep: 0.002,
		fDecStep: 0.002,
		fUpAngleStep: 0.005,
		fFovStep: 1.07,
		fFovMin: 5.0,
		fFovMax: 220.0,
		fMousePos: null,
		fMouseBut: 0,
		fMouseDrag: false,
		
		fTouchBox: null,
		fRaStart: 0.0,
		fDecStart: 0.0,
		fFovStart: 0.0,
		
		fChanged: false,
		
		eOnClick: null,
		
		init: function (aCanvasId) {
			var self = this;
			var lCanvas = document.getElementById(aCanvasId);
			lCanvas.width = window.innerWidth;
			lCanvas.height = window.innerHeight;
			this.fCanvas = lCanvas;
			this.fCtx = lCanvas.getContext('2d');
			this.fCtx.font = '12px DejaVu Sans';
			this.fCtx.lineCap = 'round';
			
			var lGrassCanvas = document.getElementById('grass');
			this.fGrassCanvas = lGrassCanvas;
			this.fGrassCtx = lGrassCanvas.getContext('2d');
			
			this.fUp = new vector3d(0.0, 0.0, 1.0);
			
			lGrassCanvas.onmousedown = function (e) { self.mMouseDown(e); };
			lGrassCanvas.onmousemove = function (e) { self.mMouseMove(e); };
			lGrassCanvas.onmouseup = function (e) {  self.mMouseUp(e); };
			lGrassCanvas.onwheel = function (e) { self.mMouseWheel(e); };
			lGrassCanvas.oncontextmenu = function (e) { e.preventDefault(); };
			
			this.fTouchBox = new teTouchBox(lGrassCanvas);
			this.fTouchBox.ePanStart = function (f) { self.mPanStart(f); };
			this.fTouchBox.ePan = function (f) { self.mPan(f); };
			this.fTouchBox.ePinchStart = function (f) { self.mZoomStart(f); };
			this.fTouchBox.eZoom = function (z)  { self.mZoom(z); };
			this.fTouchBox.eTap = function (p) { self.mTap(p)};
			
			this.fWikiFrame = document.getElementById('wikiframe');
			this.mUpdateSizes();
			window.onresize = function () { self.mResize(); };
		},
		
		mMouseDown: function (aEvt) {
			this.fMousePos = new vector2d(aEvt.pageX, aEvt.pageY);
			this.fMouseBut = aEvt.which;
		},
		
		mMouseMove: function (aEvt) {
			if (this.fMousePos) {
				var lNewPos = new vector2d(aEvt.pageX, aEvt.pageY),
					lDelta = lNewPos.sub(this.fMousePos);
				if (this.fMouseBut == 1) {
					this.fRa += lDelta.x * this.fRaStep / this.fZoomFactor / this.fScreenFactor;
					this.fDec += lDelta.y * this.fDecStep / this.fZoomFactor / this.fScreenFactor;
					if (this.fRa > 2 * Math.PI) this.fRa -= Math.PI * 2;
					if (this.fRa < 0) this.fRa += Math.PI * 2;
					if (this.fDec > Math.PI) this.fDec = Math.PI;
					if (this.fDec < 0) this.fDec = 0.0;
					this.fChanged = true;
				} else if (this.fMouseBut == 3) {
					this.fUpAngle += lDelta.y * this.fUpAngleStep;
				}
				this.fMousePos = lNewPos;
				this.fMouseDrag = true;
			}
		},
	
		mMouseUp: function (aEvt) {
			if (this.fMouseDrag) {
				this.fMouseDrag = false;
			} else {
				if (this.eOnClick) {
					this.eOnClick(aEvt, this.mScreenToSphere(this.fMousePos));
				}
			}
			this.fMousePos = null;
		},
		
		mMouseWheel: function (aEvt) {
			if (aEvt.deltaY > 0) {
				 this.fFov *= this.fFovStep;
				 if (this.fFov > this.fFovMax) this.fFov = this.fFovMax;
			} else {
				this.fFov /= this.fFovStep;
				if (this.fFov < this.fFovMin) this.fFov = this.fFovMin;
			}
			this.mUpdateProjection() ;
			this.fChanged = true;
		},
		
		mPanStart: function () {
			this.fStartRa = this.fRa;
			this.fStartDec = this.fDec;
		},
		
		mPan: function (aFinger) {
			var lDelta = aFinger.currPos.sub(aFinger.startPos);
			this.fRa = this.fStartRa + lDelta.x * this.fRaStep / this.fZoomFactor / this.fScreenFactor;
			this.fDec = this.fStartDec + lDelta.y * this.fDecStep / this.fZoomFactor / this.fScreenFactor;
			if (this.fRa > 2 * Math.PI) this.fRa -= Math.PI * 2;
			if (this.fRa < 0) this.fRa += Math.PI * 2;
			if (this.fDec > Math.PI) this.fDec = Math.PI;
			if (this.fDec < 0) this.fDec = 0.0;
			this.fChanged = true;
		},
		
		mZoomStart: function (aFingerPair) {
			this.fFovStart = this.fFov;
		},
		
		mZoom: function (aZoomFactor) {
			this.fFov = this.fFovStart / aZoomFactor;
			if (this.fFov < this.fFovMin) this.fFov = this.fFovMin;
			if (this.fFov > this.fFovMax) this.fFov = this.fFovMax;
			this.mUpdateProjection() ;
			this.fChanged = true;
		},
		
		mTap: function (aPos) {
			if (this.eOnClick) {
				this.eOnClick({ button: 1 }, this.mScreenToSphere(aPos));
			}
		},
		
		mUpdateSizes: function () {
			var lWidth = window.innerWidth;
			var lHeight = window.innerHeight;
			this.fCanvas.width = lWidth;
			this.fCanvas.height = lHeight;
			this.fGrassCanvas.width = lWidth;
			this.fGrassCanvas.height = lHeight;
			this.fWikiFrame.style.width = lWidth + 'px';
			this.fWikiFrame.style.height = (lHeight - 84) + 'px';
			
			this.fScreenFactor = Math.pow(lWidth * lHeight, 1 / 1.5) / 14000;
			console.log(this.fScreenFactor);
		},
		
		mResize: function () {
			this.mUpdateSizes();
			this.mUpdateProjection();
			this.fChanged = true;
		},
		
		mSetProjection: function (aEye, aLookAt, aUp, aFov) {
			this.fEye = aEye;
			this.fLookAt = aLookAt;
			this.fUp = aUp;
			this.fFov = aFov;
			this.fAspect = this.fCanvas.width / this.fCanvas.height;
			
			var lFovHalfRad = this.fFov * Math.PI / 360.0;
			this.fZoomFactor = (1.0 + Math.cos(lFovHalfRad)) / Math.sin(lFovHalfRad);
			
			var lLookMat = matrix4.lookAt(aEye, aLookAt, aUp),
				lPerspMat = matrix4.perspective(aFov, this.fAspect, 0.01, 100.0);
			this.fProjectMat = lPerspMat.mul(lLookMat);
		},
		
		mUpdateProjection: function () {
			this.fAspect = this.fCanvas.width / this.fCanvas.height;
			
			var lFovHalfRad = this.fFov * Math.PI / 360.0;
			this.fZoomFactor = (1.0 + Math.cos(lFovHalfRad)) / Math.sin(lFovHalfRad);
			
			var lLookMat = matrix4.lookAt(this.fEye, this.fLookAt, this.fUp),
				lPerspMat = matrix4.perspective(this.fFov, this.fAspect, 0.01, 100.0);
			this.fProjectMat = lPerspMat.mul(lLookMat);
		},
		
		mSetModelTrafo: function (aModelTrafo) {
			this.fModelTrafo = aModelTrafo;
			this.fWorldMat = this.fProjectMat.mul(aModelTrafo);
			//alert(this.fWorldMat.mul(this.fWorldMat.inverse()));
		},
		
		mProjectToCamera: function (aVec) {
			var lPoint = this.fModelTrafo.mulVec(aVec);
			return new vector2d(
				lPoint.x / (lPoint.y - 1.0) * this.fZoomFactor,
				lPoint.z / (1.0 - lPoint.y) * this.fZoomFactor * this.fAspect
			);
		},
		
		mProject: function (aVec) {
			var lPoint = this.fModelTrafo.mulVec(aVec);
			var lProjX = lPoint.x / (lPoint.y - 1.0) * this.fZoomFactor;
			var lProjY = lPoint.z / (1.0 - lPoint.y) * this.fZoomFactor * this.fAspect;
			return new vector2d(
				Math.round((lProjX + 1.0) / 2.0 * this.fCanvas.width),
				Math.round((1.0 - lProjY) / 2.0 * this.fCanvas.height)
			);
		},
		
		mUnproject: function (aPoint) {
			var lX = (aPoint.x * 2.0 / this.fCanvas.width - 1.0) / -this.fZoomFactor;
			var lY = (1.0 - aPoint.y * 2.0 / this.fCanvas.height) / this.fZoomFactor / this.fAspect;
			var lSumX2Y2 = lX * lX + lY * lY;
			var lDenom = lSumX2Y2 + 1.0;
			
			var lPoint3d = new vector3d(
				2.0 * lX / lDenom,
				(lSumX2Y2 - 1.0) / lDenom,
				2.0 * lY / lDenom
			);
			
			return this.fModelTrafo.inverse().mulVec(lPoint3d);
		},
		
		mScreenToSphere: function (aPoint2d) {
			var lPoint3d = new vector3d(aPoint2d.x, aPoint2d.y, 1.0);
			return this.mUnproject(lPoint3d).unit();
		},
		
		mSetZenith: function (aZenRa, aZenDec) {
			this.fZenRa = aZenRa;
			this.fZenDec = aZenDec;
			this.fHorizZ = vector3d.spher(aZenRa + Math.PI / 2.0, aZenDec - Math.PI / 2.0, 1.0);
			this.fHorizX = vector3d.spher(aZenRa, Math.PI / 2.0, 1.0);
			this.fHorizY = this.fHorizZ.cross(this.fHorizX);
			this.fChanged = true;
			
			if (this.eZenithChanged) this.eZenithChanged();
		},
		
		mHorizPolarToEquatCartes: function (aPhi, aTheta, aR) {
			var lHorizCartes = vector3d.spher(aPhi, aTheta, aR);
			var lCompX = this.fHorizX.scale(lHorizCartes.x);
			var lCompY = this.fHorizY.scale(lHorizCartes.y);
			var lCompZ = this.fHorizZ.scale(lHorizCartes.z);
			return lCompX.add(lCompY).add(lCompZ);
		},
		
		mHorizPolarToEquatPolar: function (aPhi, aTheta, aR) {
			var lHorizCartes = vector3d.spher(aPhi, aTheta, aR);
			var lCompX = this.fHorizX.scale(lHorizCartes.x);
			var lCompY = this.fHorizY.scale(lHorizCartes.y);
			var lCompZ = this.fHorizZ.scale(lHorizCartes.z);
			var lCartes = lCompX.add(lCompY).add(lCompZ);
			return lCartes.toSpher();
		},
		
		mFlush: function () {
			var lCtx = this.fCtx;
			var lGrassCanvas = this.fGrassCanvas;
			var lCanvas = this.fCanvas;
			var lWidth = lCanvas.width;
			var lHeight = lCanvas.height;
			lCtx.clearRect(0, 0, lWidth, lHeight);
			lGrassCanvas.width = lWidth;
			lGrassCanvas.height = lHeight;
		}
	});
	return teCamera;
});