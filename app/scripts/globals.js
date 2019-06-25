
// globals
define(['backbone', 'objectStore'], function(Backbone, ObjectStore) {

	var Products = Backbone.Collection.extend({
	    favourites: function () {
	        filtered = this.filter(function (p) {
	            return p.get("favourite");
	        });
	        return new Products(filtered);
	    },
	    filterElements: function(keyword){
	    	filtered = this.filter(function (p) {
	            return (
	            	p.get("name").toLowerCase().indexOf(keyword.toLowerCase()) !== -1 ||
	            	p.get("description").toLowerCase().indexOf(keyword.toLowerCase()) !== -1
	            );
	        });
	        return new Products(filtered);
	    }
	});

	var swarm_model = Backbone.Model.extend({data:[]});
	return {
		version: "1.0.0-rc.0",
		objects: new ObjectStore(),
		selections: new ObjectStore(),
		baseLayers: new Backbone.Collection(),
		products: new Products(),
		overlays: new Backbone.Collection(),
		swarm: new swarm_model()
	}
});



