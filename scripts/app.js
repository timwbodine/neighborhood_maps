var Location = function(data) {
	this.lat = ko.observable(data.lat);
	this.lng = ko.observable(data.lng);
	this.name = ko.observable(data.name);
	this.foursquare_id = ko.observable(data.foursquare_id);
};
placesData = [];	
locations = [];
city = "New York";
function getLocalCoffee() {
	data =   {  client_id:'OXNW4UZLYBR2O0E521ASAMCY10TVAJ35CR0F1ABUDCIH1IPN',
			client_secret:'FPYUNFVQ5KTJCMXGPGN0H4IUINNOD2KXU4R3FPXVZF52NOPI',
			v:'20180323',
			near: city,
			intent:'browse',
			radius:2000,
			query:"coffee",
			limit:5}
	$.getJSON('https://api.foursquare.com/v2/venues/search', data, function(response){
	console.log(response);
	latlng = response['response']['geocode']['feature']['geometry']['center'];
	venueData = response['response']['venues'];
		console.log(venueData[0]['location'])
		for (x in venueData){
				placeData = {};
				placeData.lat = venueData[x]['location']['lat'];
				placeData.lng = venueData[x]['location']['lng'];
				console.log(placeData.lat);
				placeData.name = venueData[x]['name']
				placeData.foursquare_id = venueData[x]['id']
				placesData.push(placeData);
		}
		ko.applyBindings(new appViewModel);
		initMap(latlng, placesData);
	})
}

function appViewModel() {
	var self = this;
	this.places = ko.observableArray([]);
	for (place in placesData) {
		self.places().push(new Location(placesData[place]));
	}
}

var map;
function initMap(latlng, placesData) {
	map = new google.maps.Map(document.getElementById('map'), {
		center: {lat: latlng['lat'], lng: latlng['lng']},
		zoom: 12 
	});
	var places = [];
	for (place in placesData){
		places.push(new google.maps.Marker({position: {lat: placesData[place]['lat'], lng: placesData[place]['lng']}, map:map}))
	}
}
