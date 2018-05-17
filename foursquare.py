import json, requests
url = 'https://api.foursquare.com/v2/venues/search'

params = dict(
    client_id='OXNW4UZLYBR2O0E521ASAMCY10TVAJ35CR0F1ABUDCIH1IPN',
    client_secret='FPYUNFVQ5KTJCMXGPGN0H4IUINNOD2KXU4R3FPXVZF52NOPI',
    v='20180323',
    near='New York, NY',
    intent='browse',
    radius=250,
    query="coffee",
    limit=5
)
resp = requests.get(url=url, params=params)
data = json.loads(resp.text)
venueData =  data['response']['venues']
geoData = data['response']['geocode']
for x in venueData:
    print x['location']['labeledLatLngs']
    print(x['name'])
    print(x['id'])
print(geoData['feature']['geometry']['center'])
