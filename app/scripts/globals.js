
// globals
define(['backbone', 'objectStore', 'underscore', 'd3'], function(Backbone, ObjectStore) {

    var refreshtime = 50000000000; // 5 seconds
    var autoColor = {
        colors : d3.scale.category10(),
        index : 0,
        getColor: function () { return this.colors(this.index++) }
    };

    var clientInterfaceHost = 'https://amida.adamplatform.eu/en';
    var Products = Backbone.Collection.extend({
        url: clientInterfaceHost+'/api/v2/dave/collections/',
        fetchCollection: function() {
            var self = this;
            self.fetch();
            this.timeout = setTimeout(function() {
                self.fetchCollection();
            }, refreshtime );
        },
        parse: function(response) {
            var self = this;

            // First check if any items were removed from the collection
            _.each(this.models, function(model){
                if (typeof response.find(function(item){
                    return item.identifier === model.get('id');
                }) === 'undefined'){
                    // Model no longer there, remove it
                    self.remove(model);
                }
            });

            // Now check if we need to add something
            _.each(response, function(item, index) {
                if(self.where({id: item.identifier}).length === 0){
                    var member = new self.model();
                    member.set('_id', index);
                    // Set the defaul attributes.
                    member.set('id', item.identifier);
                    member.set('name', item.name);
                    member.set('provider', item.provider);
                    member.set('description', item.description);
                    member.set('timeRange', [
                        new Date(item.start),
                        new Date(item.end),
                    ]);
                    member.set('groundMeasurements', item.groundMeasurement);

                    member.set('views', [{
                        'id': item.identifier,
                        'protocol': 'WCS',
                        'urls': [item.provider]
                    }]);
                    member.set('parameters', {
                        'Parameter': {
                            'selected': true,
                            'range': item.range.map(Number),
                            'uom': item.measurement_unit,
                            'clamp_max':true,
                            'clamp_min':true,
                            'nullValue': item.nullValues.map(Number),
                            'colorscale': 'viridis'
                        }
                    });
                    member.set('download', {
                        id: item.identifier,
                        protocol: 'WCS',
                        url: item.provider
                    });

                    // Other fields with default values
                    member.set('timeSlider', true);
                    if (item.hasOwnProperty('groundMeasurement') && item.groundMeasurement) {
                        member.set('timeSliderProtocol', 'KVP');
                    } else {
                        member.set('timeSliderProtocol', 'WPS');
                    }
                    member.set('color', autoColor.getColor());
                    member.set('opacity', 0.99);
                    member.set('nullValues', item.nullValues);
                    member.set('processes', []);
                    member.set('view', {isBaseLayer: false});
                    member.set('favourite', true);
                    member.set('coveragesCollection',{});
                    member.set('scaleFactor',0.5);

                    self.add(member);
                } else {
                    // TODO: Something could have changed in the product
                }
            });
            return this.models;
        },
        favourites: function () {
            filtered = this.filter(function (p) {
                return p.get('favourite');
            });
            return new Products(filtered);
        },
        filterElements: function(keyword){
            filtered = this.filter(function (p) {
                return (
                    p.get('name').toLowerCase().indexOf(keyword.toLowerCase()) !== -1 ||
                    p.get('description').toLowerCase().indexOf(keyword.toLowerCase()) !== -1
                );
            });
            return new Products(filtered);
        }
    });

    var Jobs  = Backbone.Collection.extend({
        url: clientInterfaceHost+'/api/dave/jobs/',
        fetchCollection: function() {
            var self = this;
            self.fetch();
            this.timeout = setTimeout(function() {
                self.fetchCollection();
            }, refreshtime );
        },
        parse: function(response) {
            var self = this;

            // First check if any items were removed from the collection
            _.each(this.models, function(model){
                if (typeof response.find(function(item){
                    return item.identifier === model.get('identifier');
                }) === 'undefined'){
                    // Model no longer there, remove it
                    self.remove(model);
                }
            });

            // Now check if we need to add something
            _.each(response, function(item, index) {
                var matches = self.where({identifier: item.identifier});
                if(matches.length === 0){
                    var member = new self.model();
                    member.set('_id', index);
                    // Set the defaul attributes.
                    for (var key in item){
                        member.set(key, item[key]);
                    }
                    self.add(member);
                } else if (matches.length === 1){
                    var match = matches[0];
                    for (var mkey in item){
                        // check if there was a change
                        if(match.get(mkey) !== item[mkey]){
                            match.set(mkey, item[mkey]);
                            //self.set({match},{remove: false});
                        }
                    }
                    if(match.hasChanged()){
                        self.remove(match);
                        self.add(match);
                    }
                }
            });
            return this.models;
        },
    });

    var swarm_model = Backbone.Model.extend({data:[]});
    return {
        version: '1.0.0-rc.0',
        objects: new ObjectStore(),
        selections: new ObjectStore(),
        baseLayers: new Backbone.Collection(),
        products: new Products(),
        jobs: new Jobs(),
        overlays: new Backbone.Collection(),
        swarm: new swarm_model(),
        clientInterfaceHost: clientInterfaceHost
    };
});



