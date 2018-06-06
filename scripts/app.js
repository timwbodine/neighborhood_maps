var Location = function(data) {
	this.lat = ko.observable(data.lat);
	this.lng = ko.observable(data.lng);
	this.name = ko.observable(data.name);
	this.foursquare_id = ko.observable(data.foursquare_id);
	this.id = ko.observable(data.id);
	this.verified = ko.observable(data.verified);
};
placesData = [];	
locations = [];
var infowindows = [];
var markers = [];
var initialCity = "Portland";
var initialFood = "Coffee";
var latlng = "";
function getLocations(viewExists) {
	data =   {  client_id:'OXNW4UZLYBR2O0E521ASAMCY10TVAJ35CR0F1ABUDCIH1IPN',
			client_secret:'FPYUNFVQ5KTJCMXGPGN0H4IUINNOD2KXU4R3FPXVZF52NOPI',
			v:'20180323',
			near: viewExists ? appInstance.city : initialCity, 
			intent:'browse',
			radius:10000,
			query: viewExists ? appInstance.food : initialFood,
			limit:25}
	$.getJSON('https://api.foursquare.com/v2/venues/search', data, function(response){
		infowindows = [];
		markers = [];
	  latlng = response['response']['geocode']['feature']['geometry']['center'];
	venueData = response['response']['venues'];
		placesData = [];
		for (x in venueData){
				placeData = {};
				placeData.verified = venueData[x]['verified']
				placeData.lat = venueData[x]['location']['lat'];
				placeData.lng = venueData[x]['location']['lng'];
				placeData.name = venueData[x]['name']
				placeData.foursquare_id = venueData[x]['id']
				placeData.id = x;
				placesData.push(placeData);
		}
		if (viewExists == undefined ) {
			appInstance = new appViewModel;
			ko.applyBindings(appInstance);
			initMap(latlng, placesData);
		} else {
			appInstance.verified(!appInstance.verified());
			appInstance.verified(!appInstance.verified());
			initMap(latlng, placesData);
		}
	})
}
function windowViewModel(id) {
	var self = this;
	addressArray = ko.observableArray();

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
		addressArray([]);
		console.log(addressArray());
		address = data['response']['venue']['location']['formattedAddress']
		for (x in address) {
			console.log(address[x]);
			addressArray.push(ko.observable(address[x]));
		}
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

	self.filterByVerified = function(placesData) {
		filtered = [];
		for (x in placesData) {
			if (placesData[x]['verified']) {
					filtered.push(placesData[x])
					google.maps.event.trigger(markers[placesData[x]['id']], 'undrop');
			} else {
				google.maps.event.trigger(markers[placesData[x]['id']], 'drop');
			}
		}
		return filtered;
	}
	self.filterByText = function(placesData, filtertext) {
			filtered = [];
			filtertext = filtertext.toLowerCase();
		for (x in placesData) {
			if (placesData[x]['name'].toLowerCase().includes(filtertext)) {
					filtered.push(placesData[x])
					google.maps.event.trigger(markers[placesData[x]['id']], 'undrop');
			} else {
				google.maps.event.trigger(markers[placesData[x]['id']], 'drop');
			}
		}
		return filtered;
	}
	self.food= "";
	self.city = "";
	self.filtertext = ko.observable("");
	self.verified = ko.observable(false); 
	self.test = ko.observable(false);
	self.placesData = ko.computed(function() {
		if (self.verified() == false) {
				return self.filterByText(placesData, self.filtertext()); 
		} else {
			return self.filterByText(self.filterByVerified(placesData), self.filtertext()); 
		}

	});

	
	this.places = ko.computed(function() {
		var placesArray = [];
		for (place in self.placesData()) {
			placesArray.push(new Location(self.placesData()[place]));
		}
		return placesArray;
	})
	
	openWindow = function(isInitial) {
		index = this['id']();
		google.maps.event.trigger(markers[index], 'click');

	};
}
var map;
function initMap(latlng, placesData) {
	map = new google.maps.Map(document.getElementById('map'), {
		center: {lat: latlng['lat'], lng: latlng['lng']},
		zoom: 12 
	});
	for (place in placesData){(function(place){

		var marker = new google.maps.Marker({position: {lat: placesData[place]['lat'], lng: placesData[place]['lng']}, map:map});
		var id = placesData[place]['foursquare_id'];
		var infowindow = new google.maps.InfoWindow({
	    content: 
'<h1 data-bind="text:namestring"></h1> <ul style="list-style:none; margin:0; padding:0;"data-bind="foreach:addressArray"> <li style="margin:0;padding:0;"> <h3 data-bind="text:$data"></h3> </li>	</ul> <a data-bind="attr: {href: reviewsurl}">Reviews</a> <img style="height:100px;" data-bind="attr: {src: imgurl}"</img>'
  	});
		infowindows.push(infowindow);
		marker.addListener('drop', function() {
			marker.setVisible(false);
		});

		marker.addListener('undrop', function() {
			marker.setVisible(true);
		});
	  marker.addListener('click', function() {
			for (item in infowindows) {
				if ($(".gm-style-iw")[0])	{	
			  	$(".gm-style-iw")[0].innerHTML = '';		
					ko.cleanNode($(".gm-style-iw")[0]);
				}
				infowindows[item].close()
			}		
			infowindow.open(map, marker);

		map.setCenter(marker.getPosition());
			try{ko.applyBindings(new windowViewModel(id), $(".gm-style-iw")[0]);
		} catch {console.log("oops")}
	});	
		markers.push(marker);
	})(place);
		if (placesData[place].verified == false && appInstance.verified()) {

					google.maps.event.trigger(markers[placesData[place]['id']], 'drop');
		}
	};
}
