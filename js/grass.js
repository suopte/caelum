/* Author: Bence Ágg (http://suopte.com/en), 2013*/
define([
	'lib/jrsi',
	'vector3d'
], function (Class, vector3d) {
	var teGrass = Class.extend({
		init: function (aCaelum) {
			this.fCaelum = aCaelum;
			this.fCamera = aCaelum.fCamera;
			
			this.fSideInters = [];
			this.fTopInters = [];
			this.fBotInters = [];
			
			this.fGrassPattern = null;
			this.mLoadGrassPattern();
		},
		
		mLoadGrassPattern: function () {
			var self = this;
			var lCtx = this.fCamera.fCtx;
			var lImg = new Image();
			lImg.onload = function () {
				self.fGrassPattern = lCtx.createPattern(lImg, 'repeat');
			};
			lImg.src = 'img/textures/grass.png';
		},
		
		mDraw: function () {
			var lHalfPi = Math.PI / 2.0;
			var lCamera = this.fCamera;
			var lCtx = lCamera.fGrassCtx;
			var lWidth = lCamera.fCanvas.width;
			var lHeight = lCamera.fCanvas.height;
			var lHalfHeight = lHeight / 2.0;
			
			lCtx.fillStyle = this.fGrassPattern ? this.fGrassPattern : '#374747';
			
			if (lCamera.fDec === lHalfPi) {
				lCtx.fillRect(0, lHalfHeight, lWidth, lHalfHeight);
			} else {				
				var lFront = lCamera.mHorizPolarToEquatCartes(lCamera.fRa + lHalfPi, lHalfPi, 1.0);
				var lRear = lCamera.mHorizPolarToEquatCartes(lCamera.fRa - lHalfPi, lHalfPi, 1.0);
				var lWinFront = lCamera.mProject(lFront);
				var lWinRear = lCamera.mProject(lRear);
				var lSagittRad = lWinFront.sub(lWinRear).scale(0.5);
				var lCenter = lWinRear.add(lSagittRad);
				var lRadius = lSagittRad.len();
				
				
				/*var lSideInters = [];
				if (lRadius * 2  > lWidth) {
					//var lA = 1.0;
					var lB = -2.0 * lCenter.y;
					var lC = lCenter.dot(lCenter) - lRadius * lRadius;
					var lDet = lB * lB - 4 * lC;
					var lT;
					if (lDet === 0) {
						lT = -lB / 2;
						if (lT >= 0 || lT <= lHeight) lSideInters.push(lT);
					} else if (lDet > 0) {
						lT = (-lB + lDet) / 2.0;
						if (lT >= 0 || lT <= lHeight) lSideInters.push(lT);
						lT = (-lB - lDet) / 2.0;
						if (lT >= 0 || lT <= lHeight) lSideInters.push(lT);
					}
				}*/
				
				lCtx.fillRect(0, 0, lWidth, lHeight);
				if (lCamera.fDec > lHalfPi) {
					lCtx.globalCompositeOperation = 'destination-out';
				} else {
					lCtx.globalCompositeOperation = 'source-in';
				}
				lCtx.beginPath();
				lCtx.arc(lCenter.x, lCenter.y, lRadius, 0, Math.PI * 2, true);
				lCtx.fill();
			}
			
			/*var lO = lCamera.mProject(new vector3d(0.0, 0.0, 0.0));
			var lAxisX = lCamera.mProject(new vector3d(1.0, 0.0, 0.0));
			var lAxisY = lCamera.mProject(new vector3d(0.0, 1.0, 0.0));
			var lAxisZ = lCamera.mProject(new vector3d(0.0, 0.0, 1.0));
			
			
			
			lCtx.beginPath();
			lCtx.moveTo(lO.x, lO.y);
			lCtx.lineTo(lAxisX.x, lAxisX.y);
			lCtx.moveTo(lO.x, lO.y);
			lCtx.lineTo(lAxisY.x, lAxisY.y);
			lCtx.moveTo(lO.x, lO.y);
			lCtx.lineTo(lAxisZ.x, lAxisZ.y);
			lCtx.strokeStyle = '#ff0000';
			lCtx.stroke();
			
			
			var lHorizX = lCamera.mProject(lCamera.fHorizX);
			var lHorizY = lCamera.mProject(lCamera.fHorizY);
			var lHorizZ = lCamera.mProject(lCamera.fHorizZ);
			
			lCtx.beginPath();
			lCtx.moveTo(lO.x, lO.y);
			lCtx.lineTo(lHorizX.x, lHorizX.y);
			lCtx.moveTo(lO.x, lO.y);
			lCtx.lineTo(lHorizY.x, lHorizY.y);
			lCtx.moveTo(lO.x, lO.y);
			lCtx.lineTo(lHorizZ.x, lHorizZ.y);
			lCtx.strokeStyle = '#00ff00';
			lCtx.stroke();*/
		}
		
	});
	
	return teGrass;
});