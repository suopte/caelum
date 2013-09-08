/* Author: Bence Ágg (http://suopte.com/en), 2013*/
define([
	'lib/jrsi',
	'vector2d',
	'vector3d',
	'camera',
	'caelum'
], function (Class, vector2d, vector3d, camera, caelum) {
	var teGridParser = Class.extend({
		init: function (aSphere) {
			this.fSphere = aSphere;
			this.fCamera = aSphere.fCamera;
			this.mFlushProjNodes();
			
			this.fCameraPlaneLU = new vector2d(-1.0, 1.0);
			this.fCameraPlaneLL = new vector2d(-1.0, -1.0);
			this.fCameraPlaneRU = new vector2d(1.0, 1.0);
			this.fCameraPlaneRL = new vector2d(1.0, -1.0);
			this.fCellsToDraw = [];
		},
		
		mFlushProjNodes: function () {
			var lLune, i, j;
			this.fProjNodes = [];
			for (i = 0; i <= this.fSphere.fRaLunes; i++) {
				lLune = [];
				for (j = 0; j <= this.fSphere.fDecRings; j++) {
					lLune.push(null);
				}
				this.fProjNodes.push(lLune);
			}
		},
		
		mGetProjNode: function (aRaId, aDecId) {
			var lSphere = this.fSphere;
			if (aRaId < 0) aRaId += lSphere.fRaLunes;
			if (aRaId >= lSphere.fRaLunes) aRaId -= lSphere.fRaLunes;
			var	lProjNode = this.fProjNodes[aRaId][aDecId];
			if (lProjNode)  {
				return lProjNode;
			} else {
				var lRa = aRaId * lSphere.fRaStep;
				var lDec = aDecId * lSphere.fDecStep;
				var lNodeVec = vector3d.spher(lRa, lDec, 1.0);
				var lProjNode = this.fCamera.mProjectToCamera(lNodeVec);
				this.fProjNodes[aRaId][aDecId] = lProjNode;
				return lProjNode;
			}
		},
		
		mNodeInView: function (aRaId, aDecId) {
			var lNode = this.mGetProjNode(aRaId, aDecId);
			if (!lNode) return false;
			if (lNode.x >= -1.0 && lNode.x <= 1.0 &&
				lNode.y >= -1.0 && lNode.y <= 1.0) {
				return true;
			} else {
				return false;
			}
		},
		
		mCellInView: function (aRaId, aDecId) {
			if (this.mNodeInView(aRaId, aDecId)) return true;
			if (this.mNodeInView(aRaId + 1, aDecId)) return true;
			if (this.mNodeInView(aRaId, aDecId + 1)) return true;
			if (this.mNodeInView(aRaId + 1, aDecId + 1)) return true;
			
			var lNode1 = this.mGetProjNode(aRaId, aDecId),
				lNode2 = this.mGetProjNode(aRaId + 1, aDecId),
				lNode3 = this.mGetProjNode(aRaId, aDecId + 1);
			if (lNode1 && lNode2 && lNode3) {
				var lCellTop = lNode2.sub(lNode1),
					lCellSide = lNode3.sub(lNode1),
					lCellWidth = lCellTop.len(),
					lCellHeight = lCellSide.len(),
					lCompX, lCompY;
				lCellTop.sunit();
				lCellSide.sunit();
				
				lCompX = lCellTop.dot(this.fCameraPlaneLU.sub(lNode1));
				lCompY = lCellSide.dot(this.fCameraPlaneLU.sub(lNode1));
				if (lCompX >= 0 && lCompX <= lCellWidth && 
					lCompY >= 0 && lCompY <= lCellHeight) return true;
				lCompX = lCellTop.dot(this.fCameraPlaneLL.sub(lNode1));
				lCompY = lCellSide.dot(this.fCameraPlaneLL.sub(lNode1));
				if (lCompX >= 0 && lCompX <= lCellWidth && 
					lCompY >= 0 && lCompY <= lCellHeight) return true;
				lCompX = lCellTop.dot(this.fCameraPlaneRU.sub(lNode1));
				lCompY = lCellSide.dot(this.fCameraPlaneRU.sub(lNode1));
				if (lCompX >= 0 && lCompX <= lCellWidth && 
					lCompY >= 0 && lCompY <= lCellHeight) return true;
				lCompX = lCellTop.dot(this.fCameraPlaneRL.sub(lNode1));
				lCompY = lCellSide.dot(this.fCameraPlaneRL.sub(lNode1));
				if (lCompX >= 0 && lCompX <= lCellWidth && 
					lCompY >= 0 && lCompY <= lCellHeight) return true;
			}
			
			return false;
		},
		
		mFloodFill: function (aRaId, aDecId, aFirst) {
			//console.log(aRaId + '; ' + aDecId);
			if (aDecId < 0 || aDecId >= this.fSphere.fDecRings) return;
			if (aRaId < 0) aRaId += this.fSphere.fRaLunes;
			if (aRaId >= this.fSphere.fRaLunes) aRaId -= this.fSphere.fRaLunes;
			
			var lThisCell = this.fSphere.fCells[aRaId][aDecId];
			if (lThisCell.fToDraw === null) {
				lThisCell.fToDraw = (this.mCellInView(aRaId, aDecId) || aFirst);
				if (lThisCell.fToDraw) this.fCellsToDraw.push(lThisCell);
				if (lThisCell.fToDraw || aFirst) {
					this.mFloodFill(aRaId - 1, aDecId - 1, false);
					this.mFloodFill(aRaId,     aDecId - 1, false);
					this.mFloodFill(aRaId + 1, aDecId - 1, false);
					this.mFloodFill(aRaId - 1, aDecId,     false);
					this.mFloodFill(aRaId + 1, aDecId,     false);
					this.mFloodFill(aRaId - 1, aDecId + 1, false);
					this.mFloodFill(aRaId,     aDecId + 1, false);
					this.mFloodFill(aRaId + 1, aDecId + 1, false);
				}
			}
		},
		
		mCopyCellsToDraw: function () {
			var i, lCell;
			this.fSphere.fCellsToDraw = [];
			for (i in this.fCellsToDraw) {
				lCell = this.fCellsToDraw[i];
				if (!lCell.fUnderGrass) {
					this.fSphere.fCellsToDraw.push(lCell);
				}
			}
		},
		
		mParse: function () {
			this.fCellsToDraw = [];
			this.fSphere.mResetCells();
			this.mFlushProjNodes();
			var lLook = this.fCamera.mHorizPolarToEquatPolar(
				this.fCamera.fRa - Math.PI / 2.0,
				Math.PI - this.fCamera.fDec,
				1.0
			);			
			var lCenterCell = this.fSphere.mGetCellIds({
				ra: lLook.phi,
				dec: lLook.theta
			});
			this.mFloodFill(lCenterCell.raId, lCenterCell.decId, true);			
			this.mCopyCellsToDraw();
		}
	});
	
	return teGridParser;
});