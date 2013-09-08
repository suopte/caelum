/* Author: Bence Ágg (http://suopte.com/en), 2013*/
define([
	'lib/jrsi',
	'ajax',
	'vector3d', 
	'matrix4',
	'file',
	'cell',
	'grass',
	'gmst'
], function (Class, teAjax, vector3d, matrix4, teFile, teCell, teGrass, teGmst) {
	gPutCount = 0;
	var teCaelum = Class.extend({
		fCamera: null,
		fRaLunes: 24,
		fDecRings: 12,
		fDecStep: 0,
		fRaStep: 0,
		fPoints: null,
		fPos: null,
		fCells: [],
		fStars: [],
		fCellsToDraw: [],
		fMagnTreshold: 6.1,
		
		fStarCaptDist: { x: 3.5, y: 3.5 },
		fStarCaptHalter: null,
		
		fPickedStar: null,
		
		fDict: {
			en: {
				_wikiUrl: 'http://en.wikipedia.org/wiki/',
				_wikiUrlMob: 'http://en.m.wikipedia.org/wiki/',
				Mag: 'Magnitude',
				Dist: 'Distance',
				ly: 'light-years'
			},
			hu: {
				_wikiUrl: 'http://hu.wikipedia.org/wiki/',
				_wikiUrlMob: 'http://hu.m.wikipedia.org/wiki/',
				Mag: 'Fényrend',
				Dist: 'Távolság',
				ly: 'fényév'
			}
		},
		
		init: function (aCamera) {
			var self = this;
			this.fCamera = aCamera;
			this.fCamera.eOnClick = function (aEvt, aPoint) { self.mOnClick(aEvt, aPoint); };
			this.fCamera.eZenithChanged = function () { self.mFindCellsUnderGrass(); };
			this.fGmst = new teGmst(this);
			this.fPos = new matrix4();
			this.fPos.identity();
			
			this.fRaStep = Math.PI * 2 / this.fRaLunes;
			this.fDecStep = Math.PI / this.fDecRings;
			this.mInitCells();
			
			this.fDrawnObjs = [];
			
			this.fConstAlt = {
				name: 'Aql',
				segms: []
			};
			this.fConstAltLast = null;
			
			this.mCreateStarPlateImgs();
			this.fGrass = new teGrass(this);
			
			this.fWikiUrl = 'about:blank';
			this.fWikiBut = document.getElementById('wikibutton');
			this.fWikiBut.onclick = function (e) { self.mWikiButClick(e); };
			//this.fWikiBut.ontouchstart = function (e) { self.mWikiButClick(e); };
			
			this.fLang = 'en';
		},
		
		mCreateStarPlateImgs: function () {
			this.fStarPlateImg10 = document.createElement('canvas');
			this.fStarPlateImg25 = document.createElement('canvas');
			this.fStarPlateImg50 = document.createElement('canvas');
			this.fStarPlateImg100 = document.createElement('canvas');
			
			var lCtx = this.fStarPlateImg10.getContext('2d');
			//var lStarColor = '#f4e9db';
			//var lStarColor = '#ffd3b3';
			var lStarColor = '#e6d6f6';
			//var lStarColor = '#e1ccf6';
			//var lStarColor = '#d7b9f6';
			//var lStarColor = '#dad4ef';
			lCtx.width = lCtx.height = 11;
			lCtx.beginPath();
			lCtx.arc(5, 5, 5, 0.0, Math.PI * 2, true);
			lCtx.fillStyle = lStarColor;
			lCtx.fill();
			
			lCtx = this.fStarPlateImg25.getContext('2d');
			lCtx.width = lCtx.height = 25;
			lCtx.beginPath();
			lCtx.arc(12, 12, 12, 0.0, Math.PI * 2, true);
			lCtx.fillStyle = lStarColor;
			lCtx.fill();
			
			lCtx = this.fStarPlateImg50.getContext('2d');
			lCtx.width = lCtx.height = 50;
			lCtx.beginPath();
			lCtx.arc(25, 25, 25, 0.0, Math.PI * 2, true);
			lCtx.fillStyle = lStarColor;
			lCtx.fill();
			
			lCtx = this.fStarPlateImg100.getContext('2d');
			lCtx.width = lCtx.height = 100;
			lCtx.beginPath();
			lCtx.arc(50, 50, 50, 0.0, Math.PI * 2, true);
			lCtx.fillStyle = lStarColor;
			lCtx.fill();
		},
				
		mCartesToEquat: function (aVec) {
			var lSpher = aVec.toSpher();
			if (lSpher.phi < 0) lSpher.phi += Math.PI * 2;
			return {
				ra: lSpher.phi,
				dec: lSpher.theta
			};
		},
		
		mInitCells: function () {
			var lCell, lLune, i, j;
			var lRaLeft, lRaRight, lDecTop, lDecBot;
			this.fCells = [];
			for (i = 0; i < this.fRaLunes; i++) {
				lLune = [];
				for (j = 0; j < this.fDecRings; j++) {
					lCell = new teCell(this);
					lCell.fRaId = i;
					lCell.fDecId = j;
					
					lRaLeft = i * this.fRaStep;
					lRaRight = (i + 1) * this.fRaStep;
					lDecTop = j * this.fDecStep;
					lDecBot = (j + 1) * this.fDecStep;
					
					lCell.fTopLeft = vector3d.spher(lRaLeft, lDecTop, 1.0);
					lCell.fTopRight = vector3d.spher(lRaRight, lDecTop, 1.0);
					lCell.fBotLeft = vector3d.spher(lRaLeft, lDecBot, 1.0);
					lCell.fBotRight = vector3d.spher(lRaRight, lDecBot, 1.0);
					
					lLune.push(lCell);
				}
				this.fCells.push(lLune);
			}
		},
		
		mFindCellsUnderGrass: function () {
			if (this.fCells && this.fCells.length > 0 ) {
				var lHorizZ = this.fCamera.fHorizZ;
				var i, j, lCell;
				for (i = 0; i < this.fRaLunes; i++) {
					for (j = 0; j < this.fDecRings; j++) {
						if (!this.fCells[i]) alert('Wrong RaId' + i);
						lCell = this.fCells[i][j];
						lCell.fUnderGrass = (
							lHorizZ.dot(lCell.fTopLeft) < 0.0 &&
							lHorizZ.dot(lCell.fTopRight) < 0.0 && 
							lHorizZ.dot(lCell.fBotLeft) < 0.0 &&
							lHorizZ.dot(lCell.fBotRight) < 0.0
						);
					}
				}
			}
		},
		
		mGetCell: function (aRa, aDec) {
			var lRaId = Math.floor(aRa / this.fRaStep);
			var lDecId = Math.floor(aDec / this.fDecStep);
			return this.fCells[lRaId][lDecId];
		},
		
		mGetCellIds: function (aEquat) {
			if (aEquat.ra < 0.0) aEquat.ra += 2.0 * Math.PI;
			var lRaId = Math.floor(aEquat.ra / this.fRaStep) % this.fRaLunes;
			var lDecId = Math.floor(aEquat.dec / this.fDecStep);
			if (lDecId >= this.fDecRings) lDecId = this.fDecRings - 1;
			return {
				raId: lRaId,
				decId: lDecId
			};
		},
		
		mResetCells: function () {
			var i, j;
			for (i = 0; i < this.fRaLunes; i++) {
				for (j = 0; j < this.fDecRings; j++) {
					this.fCells[i][j].fToDraw = null;
				}
			}
		},
		
		mInversePropByPair: function (x1, y1, x2, y2) {
			var a = (x1 * y1 - x2 * y2) / (y1 - y2);
			var b = x2 * y2 - a * y2;
			return a + b / this.fCamera.fFov;
		},
		
		mDrawCellChart: function () {
			var lChartWidth = 150;
			var lChartHeight = 150;
			
			
			var lCtx = this.fCamera.fCtx;
			var lHorizStep = lChartWidth / this.fRaLunes;
			var lVertStep = lChartHeight / this.fDecRings;
			var lCurrX, lCurrY;
			var i, j, lCell;
			
			lCtx.fillStyle = '#aaaa00';
			for (i = 0; i < this.fRaLunes; i++) {
				for (j = 0; j < this.fDecRings; j++) {
					lCell = this.fCells[i][j];
					if (lCell.fUnderGrass) {
						lCtx.fillRect((this.fRaLunes - lCell.fRaId - 1) * lHorizStep, lCell.fDecId * lVertStep,
							lHorizStep, lVertStep);
					}
				}
			}
			
			lCtx.fillStyle = '#ff0000';
			for (i in this.fCellsToDraw) {
				lCell = this.fCellsToDraw[i];
				lCtx.fillRect((this.fRaLunes - lCell.fRaId - 1) * lHorizStep + 1, lCell.fDecId * lVertStep + 1,
					lHorizStep - 1, lVertStep - 1);
			}
			
			
			lCtx.beginPath();
			for (j = 0; j <= this.fDecRings; j++) {
				lCurrY = j * lVertStep;
				lCtx.moveTo(0.0, lCurrY);
				lCtx.lineTo(lChartWidth, lCurrY);
			}
			
			for (i = 0; i <= this.fRaLunes; i++) {
				lCurrX = i * lHorizStep;
				lCtx.moveTo(lCurrX, 0);
				lCtx.lineTo(lCurrX, lChartHeight);
			}
			lCtx.lineWidth = 0.5;
			lCtx.stroke();
		},
		
		mDrawCellBorders: function () {
			var lCtx = this.fCamera.fCtx;
			lCtx.beginPath();
			for (var i in this.fCellsToDraw) {
				this.fCellsToDraw[i].mDrawCellBorders();
			}
			lCtx.strokeStyle = '#006666';
			lCtx.lineWidth = 0.5;
			lCtx.stroke();
		},
		
		mDrawBoundaries: function () {
			var lCtx = this.fCamera.fCtx;
			lCtx.beginPath();
			for (var i in this.fCellsToDraw) {
				this.fCellsToDraw[i].mDrawBoundaries();
			}
			lCtx.strokeStyle = '#aaaaaa';
			lCtx.lineWidth = 0.5;
			//lCtx.mozDash = [5.0, 3.0];
			lCtx.stroke();
			//lCtx.mozDash = [];
		},
		
		mDrawOutlines: function () {
			var lCtx = this.fCamera.fCtx;
			lCtx.beginPath();
			for (var i in this.fCellsToDraw) {
				this.fCellsToDraw[i].mDrawOutlines();
			}
			lCtx.strokeStyle = '#ffffff';
			lCtx.lineWidth = 1.0;
			lCtx.stroke();
		},
		
		mDrawStars: function () {
			var lCtx = this.fCamera.fCtx;
			lCtx.lineWidth = 1.0;
			lCtx.fillStyle = '#ffff00';
			for (var i in this.fCellsToDraw) {
				this.fCellsToDraw[i].mDrawStars();
			}
		},
		
		mDrawStarNames: function () {
			for (var i in this.fCellsToDraw) {
				this.fCellsToDraw[i].mDrawStarNames();
			}
		},
		
		mDrawConstNames: function () {
			for (var i in this.fCellsToDraw) {
				this.fCellsToDraw[i].mDrawConstNames();
			}
		},
		
		mDrawGrass: function () {
			this.fGrass.mDraw();
		},
		
		mDrawPickedStar: function () {
			var lStar = this.fPickedStar;
			if (lStar) {
				var lCtx = this.fCamera.fCtx;
				var lWinPos = this.fCamera.mProject(lStar.pos);
				var lWinRadius = this.mGetCell(0, 0).mCalcStarWinRadius(lStar) * 1.2 + 2.0;
				lCtx.beginPath();
				lCtx.arc(lWinPos.x, lWinPos.y, lWinRadius, 0, Math.PI * 2.0, true);
				lCtx.strokeStyle = '#ff0000';
				lCtx.lineWidth = 2.0;
				lCtx.stroke();
			}
		},
		
		mDraw: function () {
			var i;
			this.fDrawnObjs = [];
			
			this.fMagnTreshold = this.mInversePropByPair(7.0, 50.0, 4.0, 150.0, this.fCamera.fFov);
			
			this.mDrawCellBorders();			
			this.mDrawBoundaries();		
			this.mDrawOutlines();
			this.mDrawStars();
			this.mDrawGrass();
			this.mDrawStarNames();
			this.mDrawConstNames();
			this.mDrawPickedStar();
			
			for (i in this.fDrawnObjs) {
				this.fDrawnObjs[i].drawn = false;
			}
			
			//this.mDrawCellChart();
			//this.mDrawConstAlt();
			
			/*var lCtx = this.fCamera.fCtx;
			var lWidth = this.fCamera.fCanvas.width;
			var lHeight = this.fCamera.fCanvas.height;
			var lRadius = Math.sqrt(lWidth * lWidth / 4 + (lHeight + 1300)  * (lHeight + 1300));
			var lAngle = Math.asin(lWidth / 2 / lRadius);
			lCtx.beginPath();
			lCtx.moveTo(0, lHeight - 200);
			lCtx.lineTo(0, lHeight);
			lCtx.lineTo(lWidth, lHeight);
			lCtx.arc(lWidth / 2, -1500, lRadius, Math.PI / 2 - lAngle, Math.PI / 2 + lAngle , false);
			lCtx.fillStyle = this.fGrassPattern;
			lCtx.fill();*/
		},
		
		mLoadStars: function () {
			var self = this;
			teAjax.mGetPlain('data/hipp_mag7p.dat', '', function (aData) {
				var lFile = new teFile(aData),
					lRec, lHipp, lRa, lDec, lPar, lMag, lPos, lRadius, lStarPlate;
				while (!lFile.mEof()) {
					lRec = lFile.mRead(52);
					lHipp = parseInt(lRec.substr(0, 6));
					lRa = (360.0 - parseFloat(lRec.substr(7, 14))) * Math.PI / 180.0;
					lDec = parseFloat(lRec.substr(22, 14)) * Math.PI / 180.0;
					lPar = parseFloat(lRec.substr(37, 8));
					lMag = parseFloat(lRec.substr(46, 5));
					lPos = vector3d.spher(lRa, lDec, 1.0);
					//lRadius = (7.1 - lMag) / 1.2;
					lRadius = Math.pow(1.5, -lMag) * 10;
					lStarPlate = {
						hipid: lHipp,
						mag: lMag,
						pos: lPos,
						rad: lRadius,
						par: lPar
					};
					
					
					self.mGetCell(lRa, lDec).mAddStar(lStarPlate);
					self.fStars[lHipp] = lStarPlate;
					if (lMag >= 7.1) break;
				}
				self.fCamera.fChanged = true;
				self.mLoadWikiStarNames();
			});
		},
		
		mCreateStarNameImg: function (aName) {
			var lNameWidth = this.fCamera.fCtx.measureText(aName).width;
			var lNameCanvas = document.createElement('canvas');
			var lNameCtx = lNameCanvas.getContext('2d');
			var lCaptY = 10.0;
			lNameCanvas.width = lNameWidth + 1.0;
			lNameCanvas.height = 12;
			lNameCtx.font = this.fCamera.fCtx.font;
			
			lNameCtx.beginPath();
			lNameCtx.moveTo(0.0, lCaptY + 2.0);
			lNameCtx.lineTo(lNameWidth, lCaptY + 2.0);
			lNameCtx.strokeStyle = '#000000';
			lNameCtx.lineWidth = 2.0;
			lNameCtx.stroke();
			
			lNameCtx.beginPath();
			lNameCtx.moveTo(0.0, lCaptY + 2.0);
			lNameCtx.lineTo(lNameWidth, lCaptY + 2.0);
			lNameCtx.strokeStyle = '#ffffff';
			lNameCtx.lineWidth = 1.0;
			lNameCtx.stroke();
			
			lNameCtx.strokeStyle = '#000000';
			lNameCtx.strokeText(aName, 0.0, lCaptY);
			lNameCtx.fillStyle = '#ffffff';
			lNameCtx.fillText(aName, 0.0, lCaptY);
			
			return lNameCanvas;
		},
		
		mLoadStarNames: function () {
			var self = this;
			teAjax.mGetPlain('data/starnames.dat', '', function (aData) {
				var lFile = new teFile(aData),
					lHipp, lName, lNameRa, lNameDec, lNamePos, lStarPlate;
				while (!lFile.mEof()) {
					lHipp = parseInt(lFile.mScan());
					lNameRa = (360.0 - parseFloat(lFile.mScan())) * Math.PI / 180.0;
					lNameDec = parseFloat(lFile.mScan()) * Math.PI / 180.0;
					lName = lFile.mScan(true);
					lNamePos = vector3d.spher(lNameRa, lNameDec, 1.0);
					lStarPlate = self.fStars[lHipp];
					if (lStarPlate) {
						
						lStarPlate.name = lName;
						lStarPlate.namePos = lNamePos;
						lStarPlate.nameImg = self.mCreateStarNameImg(lName);
					}
				}
				self.mLoadWikiStarNames();
			});
		},
		
		mLoadWikiStarNames: function () {
			var self = this;
			teAjax.mGetJson('data/starnames.json', '', function (aData) {
				var lWikiStarNames = aData.starnames;
				var lStar, lName, lHipp;
				for (var i in lWikiStarNames) {
					lStar = lWikiStarNames[i];
					lName = lStar.name;
					lHipp = parseInt(lStar.hip);
					var lStarPlate = self.fStars[lHipp];
					if (lStarPlate) {
						lStarPlate.name = lName;
						lStarPlate.nameImg = self.mCreateStarNameImg(lName);
						lStarPlate.wiki = lStar.wiki;
					}
				}
				self.mLoadOutlines();
			});
		},
		
		mLoadOutlines: function () {
			var self = this;
			teAjax.mGetPlain(
				//'data/const_hipp.dat',
				'data/const_outline.dat', 
				'',
				function (aData) {
					var lFile = new teFile(aData), 
						lConst, lCount, i, j, lBegHipp, lEndHipp, lBegStar, lEndStar, lCellList, lCell;
					
					while (!lFile.mEof()) {
						lConst = lFile.mScan();
						lCount = parseInt(lFile.mScan());
						for (i = 0; i < lCount; i++) {
							lBegHipp = parseInt(lFile.mScan());
							lEndHipp = parseInt(lFile.mScan());
							lBegStar = self.fStars[lBegHipp];
							lEndStar = self.fStars[lEndHipp];
							if (lBegStar && lEndStar) {
								lCellList = self.mPutLine(lBegStar.pos, lEndStar.pos);
								
								for (j in lCellList) {
									lCell = lCellList[j];
									self.fCells[lCell.raId][lCell.decId].mAddOutline({
										beg: lBegStar.pos,
										end: lEndStar.pos,
										drawn: false
									});
								}
							}
						}
					}
					self.mLoadBoundaries();
				});
		},
		
		mLoadBoundaries: function () {
			var self = this;
			teAjax.mGetPlain('data/bounds.dat', '', function (aData) {
				var lFile = new teFile(aData), 
					lConst, i, lBegRa, lBegDec, lEndRa, lEndDec, lBeg, lEnd,  lCellList, lCell;
				
				while (!lFile.mEof()) {
					lBegRa  = (360.0 - parseFloat(lFile.mRead(12))) * Math.PI / 180.0;
					lBegDec = parseFloat(lFile.mRead(12)) * Math.PI / 180.0;
					lEndRa  = (360.0 - parseFloat(lFile.mRead(12))) * Math.PI / 180.0;
					lEndDec = parseFloat(lFile.mRead(12)) * Math.PI / 180.0;
					lCosnt  = lFile.mRead(4);
					
					lBeg = vector3d.spher(lBegRa, lBegDec, 1.0);
					lEnd = vector3d.spher(lEndRa, lEndDec, 1.0);
												
					lCellList = self.mPutLine(lBeg, lEnd);
					
					for (i in lCellList) {
						lCell = lCellList[i];
						self.fCells[lCell.raId][lCell.decId].mAddBoundary({
							beg: lBeg,
							end: lEnd,
							drawn: false
						});
					}
				}
				self.mLoadConstNames();
			});
		},
		
		mLoadConstNames: function () {
			var self = this;
			teAjax.mGetPlain('data/const.dat', '', function (aData) {
				var lFile = new teFile(aData);
				var i, lAbbrRa, lAbbrDec, lNameRa, lNameDec, lAbbr, lName, lAbbrPos, lNamePos;
				var lNameWidth, lNameCanvas, lNameCtx, lConstNameObj;
				var lCtx = self.fCamera.fCtx;
				var lFontSize = 12;
				lCtx.font = lFontSize + 'px DejaVu Sans';
				
				while (!lFile.mEof()) {
					lAbbrRa = (360.0 - parseFloat(lFile.mRead(15))) * Math.PI / 180.0;
					lAbbrDec = parseFloat(lFile.mRead(15)) * Math.PI / 180.0;
					lAbbr = lFile.mRead(5);
					lNameRa = (360.0 - parseFloat(lFile.mRead(15))) * Math.PI / 180.0;
					lNameDec = parseFloat(lFile.mRead(15)) * Math.PI / 180.0;
					lName  = lFile.mScan(true);
					lAbbrPos = vector3d.spher(lAbbrRa, lAbbrDec, 1.0);
					lNamePos = vector3d.spher(lNameRa, lNameDec, 1.0);
					
					
					lNameWidth = lCtx.measureText(lName).width;
					lNameCanvas = document.createElement('canvas');
					lNameCanvas.width = lNameWidth + 2;
					lNameCanvas.height = lFontSize + 4;
					lNameCtx = lNameCanvas.getContext('2d');
					lNameCtx.font = lFontSize + 'px DejaVu Sans';
					
					lNameCtx.strokeStyle = '#000000';
					lNameCtx.strokeText(lName, 0.0, lFontSize);
					lNameCtx.fillStyle = '#ffcc88';
					lNameCtx.fillText(lName, 0.0, lFontSize);
					
					lConstNameObj = {
						name: lName,
						width: lNameWidth,
						pos: lAbbrPos,
						img: lNameCanvas
					};
					
					self.mGetCell(lNameRa, lNameDec).mAddConstName(lConstNameObj);
				}
				lCtx.font = '12px DejaVu Sans';
				self.fCamera.fChanged = true;
			});
		},
		
		mPutLine: function (lBeg, lEnd) {
			gPutCount++;
			var self = this;
			var lCells = [];
			var lBegEquat = this.mCartesToEquat(lBeg);
			var lEndEquat = this.mCartesToEquat(lEnd);
			var lBegCell = this.mGetCellIds(lBegEquat);
			var lEndCell = this.mGetCellIds(lEndEquat);
			var lEqualRaIds = (lBegCell.raId == lEndCell.raId);
			var lEqualDecIds = (lBegCell.decId == lEndCell.decId);
			var eAddCell = function(aCell) {
				var i;
				for (i in lCells) {
					if (lCells[i].raId  == aCell.raId &&
						lCells[i].decId == aCell.decId) {
						return;
					}
				}
				lCells.push({
					raId: aCell.raId,
					decId: aCell.decId
				});
			};
			
			if (lEqualRaIds && lEqualDecIds) {
				eAddCell(lBegCell);
			} else {
				if (!lEqualRaIds) {
					var lCurrRaId, lLastRaId;
					var lCurrRa, lRaNormal;
					var lDenom, lT;
					var lIntersect, lIntersEquat, lIntersCell;	
					var lDir = lEnd.sub(lBeg);
					var lLen = lDir.len();
					var lOrigo = new vector3d(0.0, 0.0, 0.0);
					lDir.sunit();
					
					if (lBegCell.raId < lEndCell.raId) {
						lCurrRaId = lBegCell.raId;
						lLastRaId = lEndCell.raId;
					} else {
						lCurrRaId = lEndCell.raId;
						lLastRaId = lBegCell.raId;
					}
					if (Math.abs(lEndEquat.ra - lBegEquat.ra) > Math.PI) {
						var lTmp = lCurrRaId;
						lCurrRaId = lLastRaId;
						lLastRaId = lTmp;
						//It would be nicer, but also slower: [lCurrRa, lLastRa] = [lLastRa, lCurrRa];
					}
					
					lLastRaId = (lLastRaId + 1) % this.fRaLunes;
					
					while ((lCurrRaId % this.fRaLunes) != lLastRaId) {
						lCurrRa = (lCurrRaId % this.fRaLunes) * this.fRaStep;
						lRaNormal = new vector3d(Math.sin(lCurrRa),  -Math.cos(lCurrRa), 0.0);
						
						lDenom = lDir.dot(lRaNormal);
						if (lDenom !== 0.0) {
							lT = lOrigo.sub(lBeg).dot(lRaNormal) / lDenom;
							if (lT >= 0.0 && lT <= lLen) {
								lIntersect = lBeg.add(lDir.scale(lT));
								lIntersEquat = this.mCartesToEquat(lIntersect);
								lIntersCell  = this.mGetCellIds(lIntersEquat);
								
								/*this.fCells[lIntersCell.raId][lIntersCell.decId].mAddStar({
									pos: lIntersect,
									rad: 4.0,
									mag: 1.0,
									is: true
								});*/
								
								eAddCell(lIntersCell);
								if (--lIntersCell.raId < 0) lIntersCell.raId += this.fRaLunes;
								eAddCell(lIntersCell);
							}							
						}
						
						lCurrRaId++;
					}
				}
				
				//http://en.wikipedia.org/wiki/Plane_%28geometry%29#Line_of_intersection_between_two_planes
				if (!lEqualDecIds) {
					var lCurrDecId, lLastDecId;
					var lCurrDec;
					var lDecRingNormal = new vector3d(0.0, 0.0, 1.0);
					var lDecRingOrigin;
					var lDecRingRadius;
					var lDecPlaneH;
					var lPieNormal = lBeg.cross(lEnd).unit();
					// lPiePlaneH = 0.0; as lPieOrigin = new vector3d(0.0, 0.0, 0.0);
					var lNormalDotProd = lPieNormal.dot(lDecRingNormal);
					var lC1, lC2;
					var lDenom = 1.0 - lNormalDotProd * lNormalDotProd;
					if (lDenom === 0.0)	return lCells;
					var lIntersLineOrig, lIntersLineDir;
					var lA, lB, lC, lDiscr;
					var lT1, lT2;
					var lIntersect1, lIntersect2;
					var lBegPerp = lBeg.cross(lPieNormal);
					var lEndPerp = lEnd.cross(lPieNormal);
					var lBegCompOfEnd = (lBegPerp.dot(lEnd) > 0);
					
					var eCondAddCellByInters = function (aIntersect, aCurrDecId) {
						var lBegCompOfInters = (lBegPerp.dot(aIntersect) >= 0);
						var lEndCompOfInters = (lEndPerp.dot(aIntersect) >= 0);
						if ((lBegCompOfEnd && lBegCompOfInters && !lEndCompOfInters) ||
							(!lBegCompOfEnd && !lBegCompOfInters && lEndCompOfInters)) {
							var lIntersEquat = self.mCartesToEquat(aIntersect);
							var lIntersCell = self.mGetCellIds(lIntersEquat);
							
							/*self.fCells[lIntersCell.raId][lIntersCell.decId].mAddStar({
								pos: aIntersect,
								rad: 4.0,
								mag: 1.0,
								is: true
							});*/
							
							eAddCell({
								raId: lIntersCell.raId,
								decId: aCurrDecId
							});
							eAddCell({
								raId: lIntersCell.raId,
								decId: aCurrDecId - 1
							});
						}
					};
					
					if (lBegCell.decId < lEndCell.decId) {
						lCurrDecId = lBegCell.decId;
						lLastDecId = lEndCell.decId;
					} else {
						lCurrDecId = lEndCell.decId;
						lLastDecId = lBegCell.decId;
					}
					
					while (lCurrDecId++ < lLastDecId) {
						lCurrDec = lCurrDecId * this.fDecStep;
						lDecRingOrigin = new vector3d(0.0, 0.0, Math.cos(lCurrDec));
						lDecPlaneH = lDecRingNormal.dot(lDecRingOrigin);					
						
						lC1 = -lDecPlaneH * lNormalDotProd / lDenom;
						lC2 = lDecPlaneH / lDenom;
						lIntersLineOrig = lPieNormal.scale(lC1).add(lDecRingNormal.scale(lC2));
						lIntersLineDir  = lPieNormal.cross(lDecRingNormal).unit();
						lIntersLineDirLen = lIntersLineDir.len();
						if (lIntersLineDirLen === 0.0) continue;
						lIntersLineDir.sscale(1.0 / lIntersLineDirLen);
						
						lDecRingRadius = Math.sin(lCurrDec);
						
						lA = lIntersLineDir.x * lIntersLineDir.x + lIntersLineDir.y * lIntersLineDir.y;
						if (lA === 0.0) continue;
						lB = 2 * (lIntersLineOrig.x * lIntersLineDir.x + lIntersLineOrig.y * lIntersLineDir.y);
						lC = lIntersLineOrig.x * lIntersLineOrig.x + lIntersLineOrig.y * lIntersLineOrig.y - lDecRingRadius * lDecRingRadius;
						lDiscr = lB * lB - 4 * lA * lC;
						
						if (lDiscr < 0.0) {
							continue;
						} else if (lDiscr === 0.0) {
							lT1 = -lB / 2.0 / lA;
							lIntersect1 = lIntersLineOrig.add(lIntersLineDir.scale(lT1));
							eCondAddCellByInters(lIntersect1, lCurrDecId);
						} else {
							lT1 = (-lB + Math.sqrt(lDiscr)) / 2.0 / lA;
							lT2 = (-lB - Math.sqrt(lDiscr)) / 2.0 / lA;
							lIntersect1 = lIntersLineOrig.add(lIntersLineDir.scale(lT1));
							lIntersect2 = lIntersLineOrig.add(lIntersLineDir.scale(lT2));
							eCondAddCellByInters(lIntersect1, lCurrDecId);
							eCondAddCellByInters(lIntersect2, lCurrDecId);
						}
					}
				}
			}
			return lCells;
		},
		
		mDrawConstAlt: function () {
			var lCtx = this.fCamera.fCtx;
			var i, lSegm, lBeg, lEnd, lBegWin, lEndWin;
			lCtx.strokeStyle = '#00aaff';
			lCtx.lineWidth = 2;
			for (i in this.fConstAlt.segms) {
				lSegm = this.fConstAlt.segms[i];
				
				lBeg = this.fStars[lSegm.beg].pos;
				lEnd = this.fStars[lSegm.end].pos;
				lBegWin = this.fCamera.mProject(lBeg);
				lEndWin = this.fCamera.mProject(lEnd);
				
				lCtx.beginPath();
				lCtx.moveTo(lBegWin.x, lBegWin.y);
				lCtx.lineTo(lEndWin.x, lEndWin.y);
				lCtx.stroke();
			}
			lCtx.strokeStyle = '#ffffff';
		},
		
		mUpdateStarInfoCont: function () {
			var lStar = this.fPickedStar;
			if (lStar) {
				var lHtml = '';
				var lDict = this.fDict[this.fLang];
				var lParsec = 1.0 / lStar.par * 1000;
				var lLy = 3.262 * lParsec;
				if (lStar.name) {
					lHtml += '<div class="star_head"><b>' + lStar.name + '</b>';
					lHtml += ' (HIP ' + lStar.hipid + ')</div>';
				} else {
					lHtml += '<div class="star_head"><b>HIP ' + lStar.hipid + '</div>';
				}
				lHtml += '<div class="star_data"><b>' + lDict.Mag + ':</b> ' + lStar.mag + '</div>';
				//lHtml += '<div class="star_data"><b>' + lDict.Dist + ':</b> '  + lLy.toFixed(2) + ' ' +  lDict.ly + ' (' +  lParsec.toFixed(2) + 'pc)</div>';
				lHtml += '<div class="star_data"><b>' + lDict.Dist + ':</b> '  + Math.round(lLy) + ' ' +  lDict.ly + '</div>';
				
				if (lStar.wiki && lStar.wiki[this.fLang]) {
					if (this.fCamera.fScreenFactor < 0.4) {
						this.fWikiUrl = lDict._wikiUrlMob + lStar.wiki[this.fLang];
					} else {
						this.fWikiUrl = lDict._wikiUrl + lStar.wiki[this.fLang];
					}
					this.fWikiBut.src = 'img/wikipedia_icon.png';
					this.fWikiBut.style.display = 'block';
				} else {
					this.fWikiBut.style.display = 'none';
				}
				document.getElementById('star_info_content').innerHTML = lHtml;
				document.getElementById('star_info').style.display = 'block';
				this.fCamera.fChanged = true;
			}
		},
		
		mOnClick: function (aEvt, aPoint) {
			/*if (aEvt.button == 2) {
				var lStarList = this.fConstAlt.segms.length;
				var i, lSegm;
				for (i in this.fConstAlt.segms) {
					lSegm = this.fConstAlt.segms[i];
					lStarList += ' ' + lSegm.beg + ' ' + lSegm.end;
				}
				alert(lStarList);
			}
			var lCtx = this.fCamera.fCtx;
			var lWinPoint = this.fCamera.mProject(aPoint);
			lCtx.beginPath();
			lCtx.arc(lWinPoint.x, lWinPoint.y, 4.0, 0.0, Math.PI * 2, true);
			lCtx.closePath();
			lCtx.fillStyle = '#ff0000';
			lCtx.fill();*/
			
			var lSpher = aPoint.toSpher();
			if (lSpher.phi < 0) lSpher.phi += Math.PI * 2;
			var lClosest = this.mGetCell(lSpher.phi, lSpher.theta).mGetClosestStar(aPoint);
			if (lClosest) {
				this.fPickedStar = lClosest;
				this.mUpdateStarInfoCont();
								
				/*var lCtx = this.fCamera.fCtx;
				var lWinPoint = this.fCamera.mProject(lClosest.pos);
				lCtx.beginPath();
				lCtx.arc(lWinPoint.x, lWinPoint.y, lClosest.rad + 4.0, 0.0, Math.PI * 2, true);
				lCtx.closePath();
				lCtx.strokeStyle = '#ff0000';
				lCtx.stroke();
				
				if (lClosest.name) {
					document.getElementById('star_info').style.display = 'block';
					//document.getElementById('wikiframe').src = "http://en.m.wikipedia.org/wiki/" + lClosest.name;
				}
				
				if (this.fConstAltLast === null) {
					this.fConstAltLast = parseInt(lClosest.hipid);
				} else {
					var lEndStarId = parseInt(lClosest.hipid);
					if (lEndStarId != this.fConstAltLast) {
						this.fConstAlt.segms.push({
							beg: this.fConstAltLast,
							end: lEndStarId
						});
						this.fChaged = true;
						this.mDraw();
						this.fConstAltLast = null;
					}
				}*/
			} else {
				document.getElementById('star_info').style.display = 'none';
				this.fPickedStar = null;
				this.fCamera.fChanged = true;
			}
		},
		
		mWikiButClick: function (aEvt) {
			var self = this;
			var lWikiFrame = this.fCamera.fWikiFrame;
			if (lWikiFrame.style.display === 'block') {
				lWikiFrame.style.display = 'none';
				self.fWikiBut.src = 'img/wikipedia_icon.png';
			} else {
				lWikiFrame.src = this.fWikiUrl;
				this.fWikiBut.src = 'img/wikipedia_icon_wait.png';
				lWikiFrame.onload = function (aEvt) {
					lWikiFrame.style.display = 'block';
					self.fWikiBut.src = 'img/wikipedia_icon_exit.png';
				};
			}
		},
		
		mSetLang: function (aLang) {
			this.fLang = aLang;
			this.mUpdateStarInfoCont();
		}
	});
	
	return teCaelum;
});