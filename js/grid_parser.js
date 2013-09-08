/* Author: Bence Ágg (http://suopte.com/en), 2013*/
define([
	'lib/jrsi',
	'vector3d',
	'camera',
	'caelum'
], function (Class, vector3d, camera, caelum) {
	var teGridParser = Class.extend({
		fSphere: null,
		fCamera: null,
		fFrustVerts: null,
		fProjNodes: null,
		
		init: function (aSphere) {
			this.fSphere = aSphere;
			this.fCamera = aSphere.fCamera;
			this.mFlushProjNodes();
		},
		
		mFlushProjNodes: function () {
			var lLune, i, j;
			this.fProjNodes = [];
			for (i = 0; i <= this.fSphere.fRaLunes; i++) {
				lLune = [];
				for (j = 0; j < this.fSphere.fDecRings; j++) {
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
			if (lProjNode != null)  {
				return lProjNode;
			} else {
				var lRa = aRaId * lSphere.fRaStep,
					lDec = aDecId * lSphere.fDecStep,
					lDir = vector3d.spher(lRa, lDec, 1.0),
					lNormal = this.fFrustVerts.j,
					t = lNormal.dot(this.fFrustVerts.lu) / lDir.dot(lNormal);
				
				if (t < 0.0) {
					this.fProjNodes[aRaId][aDecId] = false;
					return false;
				} else {
					lProjNode = lDir.scale(t);
					this.fProjNodes[aRaId][aDecId] = lProjNode;
					return lProjNode;
				}
			}
		},
		
		mNodeInView: function (aRaId, aDecId) {
			var lNode = this.mGetProjNode(aRaId, aDecId);
			if (!lNode) return false;
			var	lNodeVec = lNode.sub(this.fFrustVerts.lu),
				lCompX = this.fFrustVerts.i.dot(lNodeVec),
				lCompY = this.fFrustVerts.k.dot(lNodeVec);
			if (lCompX >= 0 && lCompX <= this.fFrustVerts.width &&
				lCompY >= 0 && lCompY <= this.fFrustVerts.height) return true;
			return false;
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
				
				lCompX = lCellTop.dot(this.fFrustVerts.lu.sub(lNode1));
				lCompY = lCellSide.dot(this.fFrustVerts.lu.sub(lNode1));
				if (lCompX >= 0 && lCompX <= lCellWidth && 
					lCompY >= 0 && lCompY <= lCellHeight) return true;
				lCompX = lCellTop.dot(this.fFrustVerts.ll.sub(lNode1));
				lCompY = lCellSide.dot(this.fFrustVerts.ll.sub(lNode1));
				if (lCompX >= 0 && lCompX <= lCellWidth && 
					lCompY >= 0 && lCompY <= lCellHeight) return true;
				lCompX = lCellTop.dot(this.fFrustVerts.ru.sub(lNode1));
				lCompY = lCellSide.dot(this.fFrustVerts.ru.sub(lNode1));
				if (lCompX >= 0 && lCompX <= lCellWidth && 
					lCompY >= 0 && lCompY <= lCellHeight) return true;
				lCompX = lCellTop.dot(this.fFrustVerts.rl.sub(lNode1));
				lCompY = lCellSide.dot(this.fFrustVerts.rl.sub(lNode1));
				if (lCompX >= 0 && lCompX <= lCellWidth && 
					lCompY >= 0 && lCompY <= lCellHeight) return true;
			}
			
			return false;
		},
		
		mParse: function () {
			this.fSphere.fCellsToDraw = [];
			this.fSphere.mResetCells();
			this.mFlushProjNodes();
			this.fFrustVerts = this.fCamera.mGetFrustum();
			var lLeftUpperSpher = this.fFrustVerts.lu.toSpher(),
				lRaId = Math.floor(lLeftUpperSpher.phi / this.fSphere.fRaStep),
				lDecId = Math.floor(lLeftUpperSpher.theta / this.fSphere.fDecStep);
			if (lRaId < 0) lRaId += this.fSphere.fRaLunes;
			this.mFloodFill(lRaId, lDecId, true);
		},
		
		mFloodFill: function (aRaId, aDecId, aFirst) {
			var lCells = this.fSphere.fCells,
				lThisCell = lCells[aRaId][aDecId],
				i, j, lCurrRaId, lCurrDecId;
			
			lThisCell.fToDraw = this.mCellInView(aRaId, aDecId);
			if (lThisCell.fToDraw) this.fSphere.fCellsToDraw.push(lThisCell);
			
			if (lThisCell.fToDraw || aFirst) {
				for (i = aRaId - 1; i <= aRaId + 1; i++) {
					for (j = aDecId - 1; j <= aDecId + 1; j++) {
						lCurrRaId = i; lCurrDecId = j;
						if (lCurrRaId == aRaId && lCurrDecId == aDecId) continue;
						if (lCurrRaId < 0) lCurrRaId += this.fSphere.fRaLunes;
						if (lCurrRaId >= this.fSphere.fRaLunes) lCurrRaId -= this.fSphere.fRaLunes;
						if (lCurrDecId >= 0 && lCurrDecId < this.fSphere.fDecRings) {
							if (lCells[lCurrRaId][lCurrDecId].fToDraw == null)
								this.mFloodFill(lCurrRaId, lCurrDecId, false);
						}
					}
				}
			}
		}
	});
	
	return teGridParser;
});