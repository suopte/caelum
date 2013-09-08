/* Author: Bence Ágg (http://suopte.com/en), 2013*/
require([
	'vector3d', 
	'matrix4',
	'camera',
	'caelum',
	'grid_parser2'/*,
	'compass'*/
	], function (vector3d, matrix4, teCamera, teCaelum, teGridParser, teCompass) {		
	var lCamera = new teCamera('canv2d'),
		lCaelum = new teCaelum(lCamera),
		lParser = new teGridParser(lCaelum);
	
	lCamera.mSetProjection(
		new vector3d(0.0, 0.0, 0.0),
		new vector3d(0.0, 1.0, 0.0),
		new vector3d(0.0, 0.0, 1.0),
		70.0
	);
		
	lCaelum.mLoadStars();
	
	//lCamera.mSetZenith(127.5 * Math.PI / 180.0 + Math.PI / 2, 42.5 * Math.PI / 180.0);
	
	function pReqAnimFramePoly() {
		window.requestAnimationFrame = window.requestAnimationFrame || 
			window.mozRequestAnimationFrame ||
			window.webkitRequestAnimationFrame || 
			window.msRequestAnimationFrame;
	}
	
	function pDraw() {
		if (lCamera.fChanged) {
			lCamera.mFlush();
			var lOrient = matrix4.rotateX(lCamera.fDec - Math.PI / 2).mul(matrix4.rotateZ(-lCamera.fRa)).mul(matrix4.rotateX(lCamera.fZenDec - Math.PI / 2)).mul(matrix4.rotateZ(-lCamera.fZenRa));
			lCaelum.fPos = lOrient;
			lCamera.mSetModelTrafo(lCaelum.fPos);

			lParser.mParse();
			lCaelum.mDraw();
			lCamera.fChanged = false;
		}
		//setTimeout(pDraw, 1000 / 20);
		window.requestAnimationFrame(pDraw);
	}
	pReqAnimFramePoly();
	pDraw();
	
	var lFlag = document.getElementById('flag');
	var lFlagImg = lFlag.querySelector('img');
	lFlag.onclick = function (aEvt) {
		if (lCaelum.fLang === 'en') {
			lCaelum.mSetLang('hu');
			lFlagImg.src = 'img/flags/hu.png';
		} else if (lCaelum.fLang === 'hu') {
			lCaelum.mSetLang('en');
			lFlagImg.src = 'img/flags/en.png';
		}
	};
	
	var lAboutBut = document.getElementById('aboutbutton');
	var lAboutEn = document.getElementById('about_en');
	var lAboutHu = document.getElementById('about_hu');
	var lShownAbout = null;
	lAboutBut.onclick = function (aEvt) {
		if (lCaelum.fLang === 'en') {
			lAboutEn.style.display = 'block';
			lShownAbout = lAboutEn;
		} else if (lCaelum.fLang === 'hu') {
			lAboutHu.style.display = 'block';
			lShownAbout = lAboutHu;
		}
		document.getElementById('star_info').style.display = 'none';
	};

	var eOnAboutBoxClick = function (aEvt) {
		lShownAbout.style.display = 'none';
		lShownAbout = null;
		lCaelum.mUpdateStarInfoCont();
	};
	
	lAboutEn.onclick = eOnAboutBoxClick;
	lAboutHu.onclick = eOnAboutBoxClick;
	
	
	
	/*var lCompass = new teCompass('compass');
	lCompass.mDraw();

	var pOnDevOri = function (aEvt) {
		console.log(aEvt.alpha.toFixed(2));
		lCamera.fRa = ((aEvt.alpha + 180.0) % 360.0) * Math.PI / 180.0;
		lCamera.fChanged = true;
	};

	window.addEventListener('deviceorientation', pOnDevOri, false);*/
});