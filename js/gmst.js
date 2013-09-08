/* Author: Bence Ágg (http://suopte.com/en), 2013*/

/*
Sources:
	http://www.cv.nrao.edu/~rfisher/Ephemerides/times.html#GMST
	https://en.wikipedia.org/wiki/Julian_day#Converting_Julian_or_Gregorian_calendar_date_to_Julian_Day_Number
	http://www.cs.utsa.edu/~cs1063/projects/Spring2011/Project1/jdn-explanation.html
	http://aa.usno.navy.mil/faq/docs/GAST.php
	http://stackoverflow.com/a/4228528
Check:
	http://www.dur.ac.uk/john.lucey/users/lst.html
	http://www.jgiesen.de/astro/astroJS/siderealClock/
*/

define([
	'lib/jrsi',
	'vector3d'
], function (Class, vector3d) {
	var teGmst = Class.extend({
		init: function (aCaelum) {
			var self = this;
			
			this.fCaelum = aCaelum;
			this.fCamera = aCaelum.fCamera;
			
			this.fCounter = 0.0;
			this.fRefreshInterval = 5.0;
			
			
			this.fCoords = { lat: 90.0, lng: 0.0 };
			this.mUpdateZenith();
			
			navigator.geolocation.getCurrentPosition(function (aPos) {
				self.fCoords = {
					lat: aPos.coords.latitude, 
					lng: aPos.coords.longitude
				};
				self.mUpdateZenith();
			}, function (aErr) { alert('Geolocation error: ' + aErr.message); },
			{
				maximumAge: Infinity
			});
			
			//this.fCoords = { lat: -33.86, lng:  151.21 }; //Sydney
			//this.fCoords = { lat: 47, lng: 19 };
			
			setInterval(function () { self.mUpdateZenith(); }, 1000);
			
		},
		
		mUpdateZenith: function () {
			//alert(this.fCoords.lat + ';' + this.fCoords.lng);
			var lLmst = this.mLmstUfNow(this.fCoords.lng);
			var lLmstAngle = (lLmst.hourDec * 15.0 + 90.0) * Math.PI / 180.0;
			//document.getElementById('star_info_content').innerHTML = lLmst.str;
			
			if (this.fCounter % this.fRefreshInterval === 0) {
				this.fCamera.mSetZenith(lLmstAngle, this.fCoords.lat * Math.PI / 180.0);
			}
			this.fCounter++;
		},
		
		mUtcToJd: function (aDate) {
			var lYear  = aDate.getUTCFullYear();
			var lMonth = aDate.getUTCMonth() + 1;
			var lDay   = aDate.getUTCDate();
			var lHour  = aDate.getUTCHours();
			var lMin   = aDate.getUTCMinutes();
			var lSec   = aDate.getUTCSeconds();
			
			var lA = (lMonth < 3) ? 1 : 0;
			var lY = lYear + 4800 - lA;
			var lM = lMonth + 12 * lA - 3;
			var lJdn = lDay + ((153 * lM + 2) / 5 | 0) + 365 * lY + 
				(lY / 4 | 0) - (lY / 100 | 0) + (lY / 400 | 0) - 32045;
			var lJd = lJdn + (lHour - 12) / 24 + lMin / 1440 + lSec / 86400;
			return lJd;
		},
		
		mJdToGmstRaw: function (aJd) {
			/*var lD = aJd - 2451545.0;
			var lT = lD / 36525;
			var lT2 = lT * lT;
			var lT3 = lT2 * lT;
			var lGmstFull = 24110.54841 + 8640184.812866 * lT + 0.093104 * lT2 -
				- 0.0000062 * lT3;
			var lGmst = lGmstFull % 86400;
			var lGmstHour = lGmst / 3600 | 0;
			var lGmstMin  = ((lGmst - lGmstHour * 3600) / 60) | 0;
			var lGmstSec  = lGmst - lGmstHour * 3600  - lGmstMin * 60;
			return lGmstHour + ':' + lGmstMin + ':' + lGmstSec;*/
			
			/*var lH = aDate.getUTCHours() + aDate.getUTCMinutes() / 60 + aDate.getUTCSeconds() / 3600;
			var lD   = aJd - 2451545.0;
			var lJd0 = aJd - lH / 24;
			var lD0  = lJd0 - 2451545.0;
			var lT = lD / 36525;
			//var lGmstFull = 6.697374558 + 0.06570982441908 * lD0 + 1.00273790935 * lH + 0.000026 + lT * lT;
			var lGmst = lGmstFull % 24.0;
			var lGmstHour = lGmst | 0;
			var lGmstMin  = (lGmst - lGmstHour) * 60 | 0;
			return lGmstHour + ':' + lGmstMin;*/
			
			
			var lD = aJd - 2451545.0;
			var lGmstRaw = 18.697374558 + 24.06570982441908 * lD;
			//var lGmstHd = lGmstRaw % 24.0;
			return lGmstRaw;
		},
		
		mGmstToLmstRaw: function (aGmstRaw, aLng) {
			var lLngHours = aLng / 15.0;
			return aGmstRaw + lLngHours;
		},
		
		mUnfoldStRaw: function (aStRaw) {
			var lStHourDec = aStRaw % 24.0;
			var lStHour = lStHourDec | 0;
			var lStMinDec = (lStHourDec - lStHour) * 60;
			var lStMin  = lStMinDec | 0;
			var lStSec  = (lStMinDec - lStMin) * 60 | 0;
			var lStStr = lStHour + ':' + lStMin + ':' + lStSec;
			return {
				hourDec: aStRaw,
				hour: lStHour,
				min: lStMin,
				sec: lStSec,
				str: lStStr
			};
		},
		
		mGmstRawNow: function () {
			var lNow = new Date(Date.now());
			var lJdNow =  this.mUtcToJd(lNow);
			var lGmstNowRaw = this.mJdToGmstRaw(lJdNow);
			return lGmstNowRaw;
		},
		
		mLmstRawNow: function (aLng) {
			var lGmstRawNow = this.mGmstRawNow();
			return this.mGmstToLmstRaw(lGmstRawNow, aLng);
		},
		
		mLmstUfNow: function (aLng) {
			var lLmstRawNow = this.mLmstRawNow(aLng);
			return this.mUnfoldStRaw(lLmstRawNow);
		}
	});
	
	return teGmst;
});