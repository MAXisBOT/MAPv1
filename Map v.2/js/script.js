/////////////
var coloniesOne = L.tileLayer('http://www.trailsofthepast.com/webmapping/Maptiler_2_German_500M/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: 'Colonies One'
}),
	coloniesTwo = L.tileLayer('http://www.trailsofthepast.com/webmapping/Maptiler_1/{z}/{x}/{y}.png', {
		maxZoom: 19,
		attribution: 'Colonies Two'
	});

var overlayLayers = {
	"ColoniesOne": coloniesOne,
	"ColoniesTwo": coloniesTwo
};

// Here maps
var here = {
	apiKey:'H6XyiCT0w1t9GgTjqhRXxDMrVj9h78ya3NuxlwM7XUs'
  }
  var style = 'normal.day';
  ///////////

var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}),
	esriWorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
		attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
	}),
	hereMaps = L.tileLayer('https://1.base.maps.ls.hereapi.com/maptile/2.1/maptile/newest/normal.day/{z}/{x}/{y}/512/png8?apiKey=SfJZvGsEaDqc--e69W8zkw05MOyaNV4laXnIDJI24lo', {
		attribution: '&copy; HERE 2019',
		minZoom: 1,
		maxZoom: 19
	});

// Create a new Leaflet map centered on the continental US
var map = L.map("map",{
	zoomControl: false,
	// layers: [hereMaps, coloniesOne]});
	layers: [hereMaps]});

var baseLayers = {
	"Here": hereMaps,
	"ESRI": esriWorldImagery,
	"OSM": osm	
};

L.control.layers(baseLayers).addTo(map);
// L.control.layers(baseLayers, overlayLayers).addTo(map);
////////////////

// added initial zoom
var zoomHome = L.Control.zoomHome();
zoomHome.setHomeCoordinates([17.156244, 42.670087]);
zoomHome.setHomeZoom(14)
zoomHome.addTo(map);

var attribution = map.attributionControl;
attribution.setPrefix('&copy; <a target="_blank" href="http://geocadder.bg/en/portfolio.html">GEOCADDER</a>');


// These are declared outisde the functions so that the functions can check if they already exist
var polygonLayer;
// var pointGroupLayer;

// here we declare an array just for the polygons from the Google Sheets table
var googleSheetsPolygonsArray = [];

// var googleSheetsAttributesNamesArray = [];
var googleSheetsAttributesArray = [];

// http request to Google Sheets API
var xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function () {
	if (xhttp.readyState == 4 && xhttp.status == 200) {
		googleSheetsData = JSON.parse(xhttp.responseText);

		// here we take all polygons from the Google Sheets table
		googleSheetsData["values"][1].forEach(element => {
			googleSheetsPolygonsArray.push(element);
		});

		// here we take all the names ot attribute data from the Google Sheets table
		googleSheetsData["values"].forEach(element => {
			googleSheetsAttributesArray.push(element);
		});

		(function addPolygons(googleSheetsData) {


			// The polygons are styled slightly differently on mouse hovers
			var poylygonStyle = { "color": "green", "weight": 1, fillOpacity: 0.6 };
			// var polygonHoverStyle = { "color": "#e6250b", "fillColor": "#969393", "weight": 3 };
			var polygonHoverStyle = { "color": "yellow", "weight": 3, fillOpacity: 0.8 };

			$.getJSON("data/saudi-arabia-polygons.geojson", function (data) {
				// add GeoJSON layer to the map once the file is loaded
				var datalayer = L.geoJson(data, {
					style: function (feature) {
						return {
							fillColor: "red",
							color: "yellow",
							weight: 1,
							opacity: 1,
							fillOpacity: 0.6
						}
					},
					onEachFeature: function (feature, layer) {
						layer.on({
							mouseout: function (e) {
								e.target.setStyle(poylygonStyle);
							},
							mouseover: function (e) {
								e.target.setStyle(polygonHoverStyle);
							},
							click: function (e) {
								// This zooms the map to the clicked polygon
								map.fitBounds(e.target.getBounds());

								var currentNameDataIndex;
								for (var i = 0; i < googleSheetsPolygonsArray.length; i++) {
									if (googleSheetsPolygonsArray[i] == feature.properties["Name"]) {
										currentNameDataIndex = i;
									}
								}

								var popupContent = "<b><u>" + feature.properties["Name"] + "</u></b>";

								for (i = 3; i < googleSheetsAttributesArray.length; i++) {
									if (googleSheetsAttributesArray[i][currentNameDataIndex]) {
										popupContent += "</br>" + "<b><i>" + googleSheetsAttributesArray[i][0] + "</i></b>" + ":" + googleSheetsAttributesArray[i][currentNameDataIndex];
									}
								}

								layer.bindPopup(popupContent).openPopup();
							}
						});
					}
				}).addTo(map);
				map.fitBounds(datalayer.getBounds());
			});
		})();
	}
};

xhttp.open("GET", "https://sheets.googleapis.com/v4/spreadsheets/1h2rM0l-iR2iLKENr-Dcls9CPXb3CakyugUGstInbLGo/values/Sheet1?majorDimension=ROWS&key=AIzaSyDlA4RsSOnFtzbS-03GSqjGWgCg2q1jlpU", true);

xhttp.send()

// loading points from GoogleSheets
var point;

var lyrMarkerCluster = L.markerClusterGroup({ showCoverageOnHover: false }).addTo(map);

function drawPoints() {
	$.getJSON('https://sheets.googleapis.com/v4/spreadsheets/1h2rM0l-iR2iLKENr-Dcls9CPXb3CakyugUGstInbLGo/values/Sheet2!A2:E1000?majorDimension=ROWS&key=AIzaSyDlA4RsSOnFtzbS-03GSqjGWgCg2q1jlpU', function (response) {
		lyrMarkerCluster.clearLayers();
		response.values.forEach(drawMarker);

		function drawMarker(element) {
			var pointNumber = element[0];
			var latitude = element[1];
			var longitude = element[2];
			var description = element[3];
			var lastVisit = element[4];

			point = L.marker([latitude, longitude]).bindPopup("<b>Point Number: </b>" + pointNumber + "<br>" + "<b>Description: </b>" + description + "<br>" + "<b>Last Visit: </b>" + lastVisit + "<br>");
			point.setLatLng([latitude, longitude]).update();
			lyrMarkerCluster.addLayer(point);

		}
	});
}
drawPoints();
/////////////////

