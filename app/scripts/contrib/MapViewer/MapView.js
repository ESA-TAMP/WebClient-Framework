define(['backbone.marionette',
		'communicator',
		'app',
		'models/MapModel',
		'globals',
		'openlayers',
		'filesaver'
	],
	function(Marionette, Communicator, App, MapModel, globals) {

		var MapView = Marionette.View.extend({

			model: new MapModel.MapModel(),

			initialize: function(options) {
				this.map = undefined;
				this.isClosed = true;
				this.tileManager = options.tileManager;

				$(window).resize(function() {
					if (this.map) {
						this.onResize();
					}
				}.bind(this));
			},

			createMap: function() {
				// FIXXME: MH: For some reason the map is only displayed if the div's id is "map". Removing the next line
				// causes the map not to be displayed...
				this.$el.attr('id', 'map');
				this.map = new OpenLayers.Map({
					div: this.el,
					fallThrough: true,
					tileManager: this.tileManager
				});

				/*this.map.events.register("moveend", this.map, function(data) {
					this.model.set({
						'center': [data.object.center.lon, data.object.center.lat],
						'zoom': data.object.zoom
					});
				}.bind(this));*/

				this.colors = d3.scale.category10();

				this.map.events.register("move", this.map, function(data) {
					//console.log(data.object.getCenter());
					var center = data.object.getCenter();
					this.model.set({
						'center': [center.lon, center.lat],
						'zoom': data.object.zoom
					});
				}.bind(this));

				
				this.map.events.register("moveend", this.map, function(data) {
					Communicator.mediator.trigger("map:position:change", this.map.getExtent());
				}.bind(this));

				// Add layers for different selection methods
				this.vectorLayer = new OpenLayers.Layer.Vector("Vector Layer");
				
				this.map.addLayers([this.vectorLayer]);
				this.map.addControl(new OpenLayers.Control.MousePosition());

				this.drawControls = {
					pointSelection: new OpenLayers.Control.DrawFeature(this.vectorLayer,
						OpenLayers.Handler.Point),
					lineSelection: new OpenLayers.Control.DrawFeature(this.vectorLayer,
						OpenLayers.Handler.Path),
					polygonSelection: new OpenLayers.Control.DrawFeature(this.vectorLayer,
						OpenLayers.Handler.Polygon),
					bboxSelection: new OpenLayers.Control.DrawFeature(this.vectorLayer,
						OpenLayers.Handler.RegularPolygon, {
							handlerOptions: {
								sides: 4,
								irregular: true
							}
						}
					)
				};

				for (var key in this.drawControls) {
					this.map.addControl(this.drawControls[key]);
					this.drawControls[key].events.register("featureadded", this, this.onDone);
				}

				//Go through all defined baselayer and add them to the map
				globals.baseLayers.each(function(baselayer) {
					this.map.addLayer(this.createLayer(baselayer));
				}, this);

				// Go through all products and add them to the map
				globals.products.each(function(product) {
					// FIXXME: quick hack to not include W3DS layers:
					//if (this.isModelCompatible(product)) {
						this.map.addLayer(this.createLayer(product));
					//}
				}, this);

				// Go through all products and add them to the map
                globals.overlays.each(function(overlay){
					// FIXXME: quick hack to not include W3DS layers:
					//if (this.isModelCompatible(overlay)) {
						console.log('protocol: ' + overlay.get('view').protocol);
						this.map.addLayer(this.createLayer(overlay));
					//}
                }, this);

				// Order (sort) the product layers based on collection order
				this.onSortProducts();

				// Openlayers format readers for loading geojson selections
				var io_options = {
					'internalProjection': this.map.baseLayer.projection,
					'externalProjection': new OpenLayers.Projection('EPSG:4326')
				};

				this.geojson = new OpenLayers.Format.GeoJSON(io_options);


				//Set attributes of map based on mapmodel attributes
				var mapmodel = globals.objects.get('mapmodel');
				this.map.setCenter(new OpenLayers.LonLat(mapmodel.get("center")), mapmodel.get("zoom"));
			},

			onShow: function() {
				if (!this.map) {
					this.createMap();
				}
				this.isClosed = false;
				this.onResize();
				return this;
			},

			onResize: function() {
				this.map.updateSize();
			},

			//method to create layer depending on protocol
            //setting possible description attributes
            createLayer: function (layerdesc) {
                var return_layer = null;
                var layer = layerdesc.get('view');
                var used_protocol = layer.protocol;
                var used_id = layer.id;

                if (layer.protocol instanceof Array){
                	// Check if it is a 3d layer
                	var w3ds = _.find(layer.protocol, function(prot){ return prot == "W3DS"; });
                	if(w3ds){
                		// For now only WMS 2D visualization is supported
                		// TODO: Check if there will be another case (e.g. WMTS)
                		var wms = _.find(layer.protocol, function(prot){ return prot == "WMS"; });
                		if(wms){
                			used_protocol = "WMS";
                			used_id = layer.id + "_outlines";

                		}else{
                			// Something was defined wrong in the config
                			used_protocol = null;
                		}
                	}

                }

                switch(used_protocol){
                    case "WMTS":
                        return_layer = new OpenLayers.Layer.WMTS({
                            name: layerdesc.get("name"),
	                        layer: used_id,
	                        protocol: used_protocol,
	                        url: layer.urls,
	                        matrixSet: layer.matrixSet,
	                        style: layer.style,
	                        format: layer.format,
	                        maxExtent: layer.maxExtent,
	                        resolutions: layer.resolutions,
	                        projection: layer.projection,
	                        gutter: layer.gutter,
	                        buffer: layer.buffer,
	                        units: layer.units,
	                        transitionEffect: layer.transitionEffect,
	                        isphericalMercator: layer.isphericalMercator,
	                        isBaseLayer: layer.isBaseLayer,
	                        wrapDateLine: layer.wrapDateLine,
	                        zoomOffset: layer.zoomOffset,
	                        visible: layerdesc.get("visible"),
	                        time: layerdesc.get('time')
                        });
                    break;

                    case "WMS":
                        return_layer = new OpenLayers.Layer.WMS(
                            layerdesc.get("name"),
                            layer.urls[0],
                            {
                                layers: used_id,
                                transparent: "true",
                                format: "image/png",
                                time: layerdesc.get('time')
                            },
                            {
                                format: 'image/png',
                                matrixSet: layer.matrixSet,
                                style: layer.style,
                                format: layer.format,
                                maxExtent: layer.maxExtent,
                                resolutions: layer.resolutions,
                                projection: layer.projection,
                                gutter: layer.gutter,
                                buffer: layer.buffer,
                                units: layer.units,
                                transitionEffect: layer.transitionEffect,
                                isphericalMercator: layer.isphericalMercator,
                                isBaseLayer: layer.isBaseLayer,
                                wrapDateLine: layer.wrapDateLine,
                                zoomOffset: layer.zoomOffset,
                                visibility: layerdesc.get("visible")
                            }
                        );
                    break;

                };

                return_layer.events.register("loadstart", this, function() {
                  	Communicator.mediator.trigger("progress:change", true);
                });
                
                return_layer.events.register("loadend", this, function() {
                  	Communicator.mediator.trigger("progress:change", false);
                });
                return return_layer;                
            },

			centerMap: function(data) {
				this.map.setCenter(new OpenLayers.LonLat(data.x, data.y), data.l);

				this.model.set({
					'center': [data.x, data.y],
					'zoom': data.l
				});
			},

			onSortProducts: function(productLayers) {
				globals.products.each(function(product) {
					//if (this.isModelCompatible(product)) {
						var productLayer = this.map.getLayersByName(product.get("name"))[0];
						var index = globals.products.indexOf(productLayer);
						this.map.setLayerIndex(productLayer, index);
					//}
				}, this);
				console.log("Map products sorted");
			},

			onUpdateOpacity: function(options) {
                var layer = this.map.getLayersByName(options.model.get("name"))[0];
                if (layer){
                        layer.setOpacity(options.value);
                }
            },

            changeLayer: function(options) {
				if (options.isBaseLayer){
	                this.map.setBaseLayer(this.map.getLayersByName(options.name)[0]);
                } else {
                    var layers = this.map.getLayersByName(options.name);
                    if (layers.length) {
                    	layers[0].setVisibility(options.visible);
                    }
                }
            },

			onSelectionActivated: function(arg) {
				if (arg.active) {
					for (key in this.drawControls) {
						var control = this.drawControls[key];
						if (arg.id == key) {
							control.activate();
						} else {
							control.layer.removeAllFeatures();
							control.deactivate();
							Communicator.mediator.trigger("selection:changed", null);
						}
					}
				} else {
					for (key in this.drawControls) {
						var control = this.drawControls[key];
						control.layer.removeAllFeatures();
						control.deactivate();
						Communicator.mediator.trigger("selection:changed", null);

					}
				}
			},

			onLoadGeoJSON: function(data) {
				this.vectorLayer.removeAllFeatures();
				var features = this.geojson.read(data);
				var bounds;
				if (features) {
					if (features.constructor != Array) {
						features = [features];
					}
					for (var i = 0; i < features.length; ++i) {
						if (!bounds) {
							bounds = features[i].geometry.getBounds();
						} else {
							bounds.extend(features[i].geometry.getBounds());
						}

					}
					this.vectorLayer.addFeatures(features);
					this.map.zoomToExtent(bounds);
				}
			},

			onExportGeoJSON: function() {
				var geojsonstring = this.geojson.write(this.vectorLayer.features, true);

				var blob = new Blob([geojsonstring], {
					type: "text/plain;charset=utf-8"
				});
				saveAs(blob, "selection.geojson");
			},

			onGetGeoJSON: function () {
                return this.geojson.write(this.vectorLayer.features, true);
            },

			onDone: function(evt) {
				
				// TODO: How to handle multiple draws etc has to be thought of
				// as well as what exactly is comunicated out
				//console.log(colors(evt.feature.layer.features.length-1),evt.feature.layer.features.length-1);
				color = this.colors(evt.feature.layer.features.length-1);
				evt.feature.style = {fillColor: color, pointRadius: 6, strokeColor: color, fillOpacity: 0.5};
				evt.feature.layer.drawFeature(evt.feature);
				Communicator.mediator.trigger("selection:changed", evt.feature.geometry);
			},

			onTimeChange: function (time) {

				var string = getISODateTimeString(time.start) + "/"+ getISODateTimeString(time.end);
                                        
	            globals.products.each(function(product) {
                    if(product.get("timeSlider")){
                    	product.set("time",string);
                        var productLayer = this.map.getLayersByName(product.get("name"))[0];
                      	productLayer.mergeNewParams({'time':string});
                    }
	            }, this);
            },

            onSetExtent: function(bbox) {
            	this.map.zoomToExtent(bbox);

            },

			onClose: function(){
				this.isClosed = true;
			},

			isModelCompatible: function(model) {
				var protocol = model.get('view').protocol;
				if (protocol === 'WMS' || protocol === 'WMTS') {
					return true;
				}
				return false;
			}
		});

		return MapView;
	});