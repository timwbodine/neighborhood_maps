var Location = function(data) {
	this.lat = ko.observable(data.lat);
	this.lng = ko.observable(data.lng);
	this.name = ko.observable(data.name);
	this.foursquare_id = ko.observable(data.foursquare_id);
};
placesData = [];	
locations = [];
city = "Portland";
function getVenueData(venueID) {
	data = {
		client_id:'OXNW4UZLYBR2O0E521ASAMCY10TVAJ35CR0F1ABUDCIH1IPN',
		client_secret:'FPYUNFVQ5KTJCMXGPGN0H4IUINNOD2KXU4R3FPXVZF52NOPI',
		v: '20180525'
	} 
	$.getJSON('https://api.foursquare.com/v2/venues/' + venueID, data, function(response){
		return response['response']['venue']['contact']['addressArray'];
	})
}
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
function windowViewModel(id) {
	var self = this;
	addressArray = ko.observable();
	namestring = ko.observable();
	reviewsurl = ko.observable();
	imgurl = ko.observable();
	ko.computed(function(){
		data = {
		client_id:'OXNW4UZLYBR2O0E521ASAMCY10TVAJ35CR0F1ABUDCIH1IPN',
		client_secret:'FPYUNFVQ5KTJCMXGPGN0H4IUINNOD2KXU4R3FPXVZF52NOPI',
		v: '20180525'
	} 
	$.ajax('https://api.foursquare.com/v2/venues/' + id, {data:data, success:function(data){
		addressArray(data['response']['venue']['location']['formattedAddress']);
		namestring(data['response']['venue']['name']);
		reviewsurl(data['response']['venue']['canonicalUrl']);
		prefix = data['response']['venue']['bestPhoto']['prefix'];
		size = "200x100"; 
		suffix =  data['response']['venue']['bestPhoto']['suffix'] 
		imgurl(prefix + size + suffix);
	}});
	})
}
function appViewModel() {
	var self = this;
	this.places = ko.observableArray([]);
	for (place in placesData) {
		self.places().push(new Location(placesData[place]));
	}
}
getVenueData('49eeaf08f964a52078681fe3');
var map;
function initMap(latlng, placesData) {
	map = new google.maps.Map(document.getElementById('map'), {
		center: {lat: latlng['lat'], lng: latlng['lng']},
		zoom: 12 
	});
	var infowindows = [];
	for (place in placesData){(function(place){
		var marker = new google.maps.Marker({position: {lat: placesData[place]['lat'], lng: placesData[place]['lng']}, map:map});
		var id = placesData[place]['foursquare_id'];
		var infowindow = new google.maps.InfoWindow({
	    content: 
'<h1 data-bind="text:namestring"></h1> <h3 data-bind="text:addressArray"></h3> <a data-bind="attr: {href: reviewsurl}">Reviews</a> <img data-bind="attr: {src: imgurl}"</img>'


  	});
		infowindows.push(infowindow);
		
	  marker.addListener('click', function() {
			for (item in infowindows) {
				infowindows[item].close()
			}		
			infowindow.open(map, marker);
			ko.cleanNode($(".gm-style-iw")[0]);
			ko.applyBindings(new windowViewModel(id), $(".gm-style-iw")[0]);
		});	
	})(place);
	};
}
