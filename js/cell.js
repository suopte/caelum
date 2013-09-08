/* Author: Bence Ágg (http://suopte.com/en), 2013*/
define([
	'lib/jrsi',
	'vector3d'
], function (Class, vector3d) {
	var teCell = Class.extend({
		fCaptDistX: 3.5,
		fCaptDistY: 3.5,
		fDistTresh: 0.02,
		
		init: function (aCaelum) {
			this.fCaelum = aCaelum;
			this.fCamera = aCaelum.fCamera;
			this.fStars = [];
			this.fOutlines = [];
			this.fBoundaries = [];
			this.fConstNames = [];
			this.fUnderGrass = false;
		},
		
		mAddStar: function (aStar) {
			this.fStars.push(aStar);
		},
		
		mAddOutline: function (aOutline) {
			this.fOutlines.push(aOutline);
		},
		
		mAddBoundary: function (aBoundary) {
			this.fBoundaries.push(aBoundary);
		},
		
		mAddConstName: function (aConstName) {
			this.fConstNames.push(aConstName);
		},
		
		mDrawCellBorders: function() {
			//if (this.fDecId >= this.fCaelum.fDecRings / 2) return;
			var lCamera = this.fCamera;
			var lCtx = lCamera.fCtx;
						
			var lWinTL = lCamera.mProject(this.fTopLeft);
			var lWinTR = lCamera.mProject(this.fTopRight);
			var lWinBL = lCamera.mProject(this.fBotLeft);
			var lWinBR = lCamera.mProject(this.fBotRight);
			
			lCtx.moveTo(lWinTL.x, lWinTL.y);
			lCtx.lineTo(lWinTR.x, lWinTR.y);
		
			lCtx.moveTo(lWinTR.x, lWinTR.y);
			lCtx.lineTo(lWinBR.x, lWinBR.y);
		
			lCtx.moveTo(lWinBR.x, lWinBR.y);
			lCtx.lineTo(lWinBL.x, lWinBL.y);
		
			lCtx.moveTo(lWinBL.x, lWinBL.y);
			lCtx.lineTo(lWinTL.x, lWinTL.y);
		},
		
		mDrawBoundaries: function () {
			//if (this.fDecId >= this.fCaelum.fDecRings / 2) return;
			
			var lCtx = this.fCamera.fCtx;
			var lLine, lBegWin, lEndWin, i;
			for (i in this.fBoundaries) {
				lLine = this.fBoundaries[i];
				if (!lLine.drawn) {
					lBegWin = this.fCamera.mProject(lLine.beg);
					lEndWin = this.fCamera.mProject(lLine.end);
					lCtx.moveTo(lBegWin.x, lBegWin.y);
					lCtx.lineTo(lEndWin.x, lEndWin.y);
					lLine.drawn = true;
					this.fCaelum.fDrawnObjs.push(lLine);
				}
			}
		},
		
		mDrawOutlines: function () {
			//if (this.fDecId >= this.fCaelum.fDecRings / 2) return;
			
			var lCtx = this.fCamera.fCtx;
			var lLine, lBegWin, lEndWin, i;
			for (i in this.fOutlines) {
				lLine = this.fOutlines[i];
				if (!lLine.drawn) {
					lBegWin = this.fCamera.mProject(lLine.beg);
					lEndWin = this.fCamera.mProject(lLine.end);
					lCtx.moveTo(lBegWin.x, lBegWin.y);
					lCtx.lineTo(lEndWin.x, lEndWin.y);
					lLine.drawn = true;
					this.fCaelum.fDrawnObjs.push(lLine);
				}
			}
		},
		
		mCalcStarWinRadius: function (aStar) {
			return aStar.rad * this.fCamera.fZoomFactor / 2.0 * this.fCamera.fScreenFactor;
		},
		
		mDrawStars: function () {
			//if (this.fDecId >= this.fCaelum.fDecRings / 2) return;
			
			var lCtx = this.fCamera.fCtx,
				i, lStar, lWinPos, lWinRadius;
			for (i in this.fStars) {
				lStar = this.fStars[i];
				if (lStar.mag < this.fCaelum.fMagnTreshold) {
					lStar.winPos = lWinPos = this.fCamera.mProject(lStar.pos);
					lStar.winRad = lWinRadius = this.mCalcStarWinRadius(lStar);
					
					/*lCtx.beginPath();
					lCtx.arc(lWinPos.x, lWinPos.y, lWinRadius, 0.0, Math.PI * 2, true);
					lCtx.fill();*/
					
					if (lWinRadius <= 10) {
						lCtx.drawImage(this.fCaelum.fStarPlateImg10, 
							0, 0, 11, 11,
							lWinPos.x - lWinRadius, lWinPos.y - lWinRadius, 
							lWinRadius * 2, lWinRadius * 2);
					} else if (lWinRadius <= 25) {
						lCtx.drawImage(this.fCaelum.fStarPlateImg25, 
							0, 0, 25, 25,
							lWinPos.x - lWinRadius, lWinPos.y - lWinRadius, 
							lWinRadius * 2, lWinRadius * 2);
					} else if (lWinRadius <= 50) {
						lCtx.drawImage(this.fCaelum.fStarPlateImg50, 
							0, 0, 50, 50,
							lWinPos.x - lWinRadius, lWinPos.y - lWinRadius, 
							lWinRadius * 2, lWinRadius * 2);
					} else {
						lCtx.drawImage(this.fCaelum.fStarPlateImg100, 
							0, 0, 100, 100,
							lWinPos.x - lWinRadius, lWinPos.y - lWinRadius, 
							lWinRadius * 2, lWinRadius * 2);
					}
				}
			}
		},
		
		mDrawStarNames: function () {
			//if (this.fDecId >= this.fCaelum.fDecRings / 2) return;
			
			var lCtx = this.fCamera.fCtx,
				i, lStar, lWinPos, lWinRadius, lCaptX, lCaptY;
			for (i in this.fStars) {
				lStar = this.fStars[i];
				if (lStar.name && lStar.mag < (this.fCaelum.fMagnTreshold - 2)) {
					lWinPos = lStar.winPos;
					lWinRadius = lStar.winRad;
					lCaptX = Math.round(lWinPos.x + lWinRadius + this.fCaelum.fStarCaptDist.x);
					lCaptY = Math.round(lWinPos.y + lWinRadius + this.fCaelum.fStarCaptDist.y + 2.0);
					lCtx.beginPath();
					lCtx.moveTo(lWinPos.x, lWinPos.y);
					lCtx.lineTo(lCaptX, lCaptY);
					lCtx.strokeStyle = '#000000';
					lCtx.lineWidth = 2.0;
					lCtx.stroke();
					
					lCtx.beginPath();
					lCtx.moveTo(lWinPos.x, lWinPos.y);
					lCtx.lineTo(lCaptX, lCaptY);
					lCtx.strokeStyle = '#ffffff';
					lCtx.lineWidth = 1.0;
					lCtx.stroke();
					
					lCtx.drawImage(lStar.nameImg, lCaptX, lCaptY - 12.0);
				}
			}
		},
		
		mDrawConstNames: function () {
			var lCtx = this.fCamera.fCtx;
			var i, lConstName, lWinPos;
			for (i in this.fConstNames) {
				lConstName = this.fConstNames[i];
				lWinPos = this.fCamera.mProject(lConstName.pos);
				lWinPos.x -= lConstName.width;
				lCtx.drawImage(lConstName.img, lWinPos.x, lWinPos.y);
			}
		},
		
		mDrawGrass: function () {
			if (this.fDecId < this.fCaelum.fDecRings / 2) return;
			var lCtx = this.fCamera.fCtx;
			var lRaLeft, lRaRight, lDecTop, lDecBottom;
			var lTopLeft, lTopRight, lBottomLeft, lBottomRight;
			var lWinTL, lWinTR, lWinBL, lWinBr;
			lRaLeft = this.fRaId * this.fCaelum.fRaStep;
			lRaRight = (this.fRaId + 1) * this.fCaelum.fRaStep;
			lDecTop = this.fDecId * this.fCaelum.fDecStep;
			lDecBottom = (this.fDecId + 1) * this.fCaelum.fDecStep;
			
			lTopLeft = vector3d.spher(lRaLeft, lDecTop, 1.0);
			lTopRight = vector3d.spher(lRaRight, lDecTop, 1.0);
			lBottomLeft = vector3d.spher(lRaLeft, lDecBottom, 1.0);
			lBottomRight = vector3d.spher(lRaRight, lDecBottom, 1.0);
			
			lWinTL = this.fCamera.mProject(lTopLeft);
			lWinTR = this.fCamera.mProject(lTopRight);
			lWinBL = this.fCamera.mProject(lBottomLeft);
			lWinBR = this.fCamera.mProject(lBottomRight);
			
			lCtx.moveTo(lWinTL.x, lWinTL.y);
			lCtx.lineTo(lWinTR.x, lWinTR.y);
			lCtx.lineTo(lWinBR.x, lWinBR.y);
			lCtx.lineTo(lWinBL.x, lWinBL.y);
			lCtx.lineTo(lWinTL.x, lWinTL.y);
		},
		
		mGetClosestStar: function (aPoint) {
			var lMinDist = this.fDistTresh;
			var lClosest = null;
			var lStar, i, lDist, lWinRadius;
			for (i in this.fStars) {
				lStar = this.fStars[i];
				lWinRadius = this.mCalcStarWinRadius(lStar);
				lDist = aPoint.sub(lStar.pos).len();
				if (lWinRadius !== 0.0) lDist /= lWinRadius / 2.0;
				if (lDist < lMinDist) {
					lMinDist = lDist;
					lClosest = lStar;
					lClosest.pos.len();
				}
			}
			return lClosest;
		}
	});
	
	return teCell;
});