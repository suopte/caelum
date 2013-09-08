/* Author: Bence Ágg (http://suopte.com/en), 2013*/
define([
	'lib/jrsi'
], function (Class) {
	var teAjax = Class.extend({});
	
	teAjax.mPostJson = function (aUrl, aParams, aCallback) {
		var lXhr = new XMLHttpRequest();
		lXhr.onreadystatechange = function () {
			if (lXhr.readyState === 4) {
				if (lXhr.status === 200) {
					aCallback(JSON.parse(lXhr.response));
				}
			}
		};
		lXhr.open('POST', aUrl, true);
		lXhr.setRequestHeader('Content-Type', 'application/json');
		lXhr.send(JSON.stringify(aParams));
	};
	
	teAjax.mPostPlain = function (aUrl, aParams, aCallback) {
		var lXhr = new XMLHttpRequest();
		lXhr.onreadystatechange = function () {
			if (lXhr.readyState === 4) {
				if (lXhr.status === 200) {
					aCallback(lXhr.response);
				}
			}
		};
		lXhr.open('POST', aUrl, true);
		lXhr.setRequestHeader('Content-Type', 'text/plain');
		lXhr.send(aParams);
	};
	
	teAjax.mGetJson = function (aUrl, aParams, aCallback) {
		var lXhr = new XMLHttpRequest();
		lXhr.onreadystatechange = function () {
			if (lXhr.readyState === 4) {
				if (lXhr.status === 200) {
					aCallback(JSON.parse(lXhr.response));
				}
			}
		};
		lXhr.open('GET', aUrl, true);
		lXhr.setRequestHeader('Content-Type', 'application/json');
		lXhr.send(JSON.stringify(aParams));
	};
	
	teAjax.mGetPlain = function (aUrl, aParams, aCallback) {
		var lXhr = new XMLHttpRequest();
		lXhr.onreadystatechange = function () {
			if (lXhr.readyState === 4) {
				if (lXhr.status === 200) {
					aCallback(lXhr.response);
				}
			}
		};
		lXhr.open('GET', aUrl, true);
		lXhr.setRequestHeader('Content-Type', 'text/plain');
		lXhr.send(aParams);
	};
	
	return teAjax;
});