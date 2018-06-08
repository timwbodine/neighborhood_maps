//Define Location object constructor 
var Location = function(data) {
    this.lat = data.lat
    this.lng = data.lng
    this.name = data.name
    this.foursquare_id = data.foursquare_id;
    this.id = data.id;
    this.verified = ko.observable(data.verified);
};


//Define global variables
placesData = [];
locations = [];
var map;
var infowindows = [];
var infowindow = null;
var markers = [];
var initialCity = "Portland";
var initialFood = "Coffee";
var latlng = "";
var content = '<div id="windowtext"><h1 data-bind="text:namestring"></h1> <ul style="list-style:none; margin:0; padding:0;"data-bind="foreach:addressArray"> <li style="margin:0;padding:0;"> <h3 data-bind="text:$data"></h3> </li>	</ul> <a data-bind="attr: {href: reviewsurl}">see on Foursquare</a> <img style="height:100px;" data-bind="attr: {src: imgurl}"</img></div>'; 


//this function is called when the page is loaded as the callback for the google maps API call and whenever the foursquare API is queried for a new city location.  if the app view already exists, it queries based on the information provided to the app view by the form.  If the view does not exist it queries for info about coffee in portland by default.  Then, depending on whether the view exists it either creates the app viewmodel and calls the initMap function, or just calls the initMap function. 
function getLocations(viewExists) {
    data = {
        client_id: 'OXNW4UZLYBR2O0E521ASAMCY10TVAJ35CR0F1ABUDCIH1IPN',
        client_secret: 'FPYUNFVQ5KTJCMXGPGN0H4IUINNOD2KXU4R3FPXVZF52NOPI',
        v: '20180323',
        near: viewExists ? appInstance.city : initialCity,
        intent: 'browse',
        radius: 10000,
        query: viewExists ? appInstance.food : initialFood,
        limit: 25
    }

    if (viewExists && appInstance.city == "") {
        return;
    }
    $.getJSON('https://api.foursquare.com/v2/venues/search', data, function(response) {
            infowindows = [];
            markers = [];
            latlng = response['response']['geocode']['feature']['geometry']['center'];
            venueData = response['response']['venues'];
            placesData = [];
            for (x in venueData) {
                placeData = {};
                placeData.verified = venueData[x]['verified']
                placeData.lat = venueData[x]['location']['lat'];
                placeData.lng = venueData[x]['location']['lng'];
                placeData.name = venueData[x]['name']
                placeData.foursquare_id = venueData[x]['id']
                placeData.id = x;
                placesData.push(placeData);
            }
            if (viewExists == undefined) {
                appInstance = new appViewModel;
                ko.applyBindings(appInstance);
                initMap(latlng, placesData);
            } else {
                appInstance.verified(!appInstance.verified());
                appInstance.verified(!appInstance.verified());
                initMap(latlng, placesData);
            }
        })
        .done(function() {
            console.log('getJSON request succeeded!');
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
            alert('getJSON request failed! Could not get locations from foursquare API: ' + textStatus);
        })
        .always(function() {
            console.log('getJSON request ended!');
        });
}


//this is the view model for the infowindows in google maps.  It doesn't really need to be a knockout view but I wanted to experiment with having multiple views in one project.  Whenever an infowindow is opened, foursquare API is queried for more info on the selected location. and the observables for the window view are updated.
function windowViewModel(id) {
    var self = this;
    addressArray = ko.observableArray();
    namestring = ko.observable();
    reviewsurl = ko.observable();
    imgurl = ko.observable();
    ko.computed(function() {
        data = {
            client_id: 'OXNW4UZLYBR2O0E521ASAMCY10TVAJ35CR0F1ABUDCIH1IPN',
            client_secret: 'FPYUNFVQ5KTJCMXGPGN0H4IUINNOD2KXU4R3FPXVZF52NOPI',
            v: '20180525'
        }
        $.ajax('https://api.foursquare.com/v2/venues/' + id, {
            data: data,
            success: function(data) {
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
                suffix = data['response']['venue']['bestPhoto']['suffix']
                imgurl(prefix + size + suffix);
            },
            error: function() {
                alert('An error occurred - Problems connecting with squarespace API!');
            },
        });
    })
}


// this is the main app view model.  it populates the placesData computed observable with the appropriate location objects depending on the filter being applied. This allows the list to be dynamically updated based on user input. It also calls the maps API to hide or display map marker DOM elements dynamically. It also links click events on the list elements to google maps API triggers to simulate click events on markers associated with a location
function appViewModel() {
    var self = this;
    self.filterByVerified = function(placesData) {
        filtered = [];
        for (x in placesData) {
            if (placesData[x]['verified']) {
                filtered.push(placesData[x]);
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
    self.food = "";
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
        index = this['id'];
        google.maps.event.trigger(markers[index], 'click');

    };
}

function throwGoogleError() {
    alert("There was an error connecting with the google API!");
}
//this function calls the google maps API, using the data earlier pulled from foursquare.  It then sets up markers using the location data passed to it from the getLocations function.  it then adds click event handlers to each marker to trigger a second call to the foursquare API to get more detailed info on that location to populate the info window.  The infowindow is defined by a windowView knockout viewmodel.

function initMap(latlng, placesData) {
    try {
        map = new google.maps.Map(document.getElementById('map'), {
            center: {
                lat: latlng['lat'],
                lng: latlng['lng']
            },
            zoom: 12
        });
    } catch {
        alert("could not load map!")
    }

    infowindow = new google.maps.InfoWindow({
        content: "",
        map: map
    });
    for (place in placesData) {
        (function(place) {

            var marker = new google.maps.Marker({
                position: {
                    lat: placesData[place]['lat'],
                    lng: placesData[place]['lng']
                },
                map: map
            });
            var id = placesData[place]['foursquare_id'];
            infowindows.push(infowindow);
            marker.addListener('drop', function() {
                marker.setVisible(false);
            });

            marker.addListener('undrop', function() {
                marker.setVisible(true);
            }); 
            marker.addListener('click', function() {
                marker.setAnimation(google.maps.Animation.BOUNCE);
                setTimeout(function() {
                    marker.setAnimation(null);
                }, 375);
                infowindow.close();

                infowindow.setContent(content);
                infowindow.open(map, marker);

                map.setCenter(marker.getPosition());
                try {
                    ko.applyBindings(new windowViewModel(id), $(".gm-style-iw")[0]);
                } catch {}
            });
            markers.push(marker);
        })(place);
        if (placesData[place].verified == false && appInstance.verified()) {

            google.maps.event.trigger(markers[placesData[place]['id']], 'drop');
        }
    };
}
