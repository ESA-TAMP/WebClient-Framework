(function() {
	'use strict';

	var root = this;

	root.define([
			'backbone',
			'globals',
			'regions/DialogRegion', 'regions/UIRegion',
			'layouts/LayerControlLayout',
            'layouts/DataManagementLayout',
            'layouts/ProcessManagementLayout',
			'layouts/ToolControlLayout',
			'layouts/OptionsLayout',
			'core/SplitView/WindowView',
			'communicator',
			'jquery', 'backbone.marionette',
			'controller/ContentController',
			'controller/DownloadController',
			'controller/SelectionManagerController',
			'controller/LoadingController',
			'controller/LayerController',
			'controller/SelectionController',
			'controller/DifferenceController'
		],

		function(Backbone, globals, DialogRegion,
			UIRegion, LayerControlLayout, DataManagementLayout, ProcessManagementLayout,
			ToolControlLayout, OptionsLayout, WindowView, Communicator) {

		var Application = Backbone.Marionette.Application.extend({
			initialize: function(options) {
			},

			configure: function(config) {


				// Load jquery ui tooltip tool

				/*$(document).ready(function() {
				    $("body").tooltip({ 
				    	selector: '[data-toggle=tooltip]',
				    	position: { my: "left+5 center", at: "right center" },
						hide: { effect: false, duration: 0 },
						show:{ effect: false, delay: 700}
				    });

				});*/
				var imagerenderercanvas = $('<canvas/>',{id: 'imagerenderercanvas'});
                $('body').append(imagerenderercanvas);

				$("body").tooltip({ 
			    	selector: '[data-toggle=tooltip]',
			    	position: { my: "left+5 center", at: "right center" },
					hide: { effect: false, duration: 0 },
					show:{ effect: false, delay: 700}
			    });

			    $("body").append('<div id="volumecontrols">');
			    $('#volumecontrols').hide();


				var v = {}; //views
				var m = {};	//models
				var t = {};	//templates

				// Application regions are loaded and added to the Marionette Application
				_.each(config.regions, function(region) {
					var obj = {};
					obj[region.name] = "#" + region.name;
					this.addRegions(obj);
					console.log("Added region " + obj[region.name]);
				}, this);

				//Load all configured views
				_.each(config.views, function(viewDef) {
					var View = require(viewDef);
					$.extend(v, View);
				}, this);

				//Load all configured models
				_.each(config.models, function(modelDef) {
					var Model = require(modelDef);
					$.extend(m, Model);
				}, this);

				//Load all configured templates
				_.each(config.templates, function(tmplDef) {
					var Tmpl = require(tmplDef.template);
					t[tmplDef.id] = Tmpl;
				}, this);

				this.templates = t;
				this.views = v;


				//Map attributes are loaded and added to the global map model
				globals.objects.add('mapmodel', new m.MapModel({
						visualizationLibs : config.mapConfig.visualizationLibs,
						center: config.mapConfig.center,
						zoom: config.mapConfig.zoom,
						sun: _.has(config.mapConfig, 'showSun') ? config.mapConfig.showSun: true,
						moon: _.has(config.mapConfig, 'showMoon') ? config.mapConfig.showMoon: true,
						skyBox: _.has(config.mapConfig, 'showSkyBox') ? config.mapConfig.showSkyBox: true,
						skyAtmosphere: _.has(config.mapConfig, 'skyAtmosphere') ? config.mapConfig.skyAtmosphere: true,
						backgroundColor: _.has(config.mapConfig, 'backgroundColor') ? config.mapConfig.backgroundColor: "#000"
					})
				);


				//Base Layers are loaded and added to the global collection
				_.each(config.mapConfig.baseLayers, function(baselayer) {

					globals.baseLayers.add(
						new m.LayerModel({
							name: baselayer.name,
							visible: baselayer.visible,
							view: {
								id : baselayer.id,
								urls : baselayer.urls,
								protocol: baselayer.protocol,
								projection: baselayer.projection,
								attribution: baselayer.attribution,
								matrixSet: baselayer.matrixSet,
								style: baselayer.style,
								format: baselayer.format,
								resolutions: baselayer.resolutions,
								maxExtent: baselayer.maxExtent,
								gutter: baselayer.gutter,
								buffer: baselayer.buffer,
								units: baselayer.units,
								transitionEffect: baselayer.transitionEffect,
								isphericalMercator: baselayer.isphericalMercator,
								isBaseLayer: true,
								wrapDateLine: baselayer.wrapDateLine,
								zoomOffset: baselayer.zoomOffset,
									//time: baselayer.time // Is set in TimeSliderView on time change.
							},
							views: baselayer.views
						})
					);
					console.log("Added baselayer " + baselayer.id );
				}, this);
				
				var autoColor = {
		            colors : d3.scale.category10(),
		            index : 0,
		            getColor: function () { return this.colors(this.index++) }
		        }


				//Productsare loaded and added to the global collection
                var ordinal = 0;
                var domain = [];
                var range = [];


                if (localStorage.getItem('favourite') === null) {

                    localStorage.setItem('favourite', JSON.stringify([
                        'MYD04_Image_Optical_Depth_Land_And_Ocean',
                        'MOD04_Image_Optical_Depth_Land_And_Ocean',
                        'WRFCHEM_AOD550',
                        'WRFCHEM_DUSTcol',
                        'WRFCHEM_PM25surf',
                        'WRFCHEM_PM10surf'
                    ]));
                }

                var favourites = JSON.parse(localStorage.getItem('favourite'));

                globals.products.fetchCollection();

				//Overlays are loaded and added to the global collection
				_.each(config.mapConfig.overlays, function(overlay) {

						globals.overlays.add(
							new m.LayerModel({
								name: overlay.name,
								visible: overlay.visible,
								ordinal: ordinal,
								view: {
									id: overlay.id,
									urls: overlay.urls,
									protocol: overlay.protocol,
									projection: overlay.projection,
									attribution: overlay.attribution,
									matrixSet: overlay.matrixSet,
									style: overlay.style,
									format: overlay.format,
									resolutions: overlay.resolutions,
									maxExtent: overlay.maxExtent,
									gutter: overlay.gutter,
									buffer: overlay.buffer,
									units: overlay.units,
									transitionEffect: overlay.transitionEffect,
									isphericalMercator: overlay.isphericalMercator,
									isBaseLayer: false,
									wrapDateLine: overlay.wrapDateLine,
									zoomOffset: overlay.zoomOffset,
									//time: overlay.time // Is set in TimeSliderView on time change.
								}
							})
						);
						console.log("Added overlay " + overlay.id);
					}, this);



				// If Navigation Bar is set in configuration go trhough the 
				// defined elements creating a item collection to rendered
				// by the marionette collection view
				if (config.navBarConfig) {

					var addNavBarItems = defaultFor(self.NAVBARITEMS, []);
					config.navBarConfig.items = config.navBarConfig.items.concat(addNavBarItems);
					var navBarItemCollection = new m.NavBarCollection;

					_.each(config.navBarConfig.items, function(list_item){
						navBarItemCollection.add(
							new m.NavBarItemModel(list_item)
						);
					}, this);

					this.topBar.show(new v.NavBarCollectionView(
						{template: t.NavBar({
							title: config.navBarConfig.title,
							url: config.navBarConfig.url}),
						className:"navbar navbar-inverse navbar-fixed-top not-selectable",
						itemView: v.NavBarItemView, tag: "div",
						collection: navBarItemCollection}));

				};

				// Add animation cube to navigation bar to display when loading, such as pending requests
				$("#topBar").append(
					'<div id="loading-display">'+
						'<div class="sk-folding-cube">'+
			              '<div class="sk-cube1 sk-cube"></div>'+
			              '<div class="sk-cube2 sk-cube"></div>'+
			              '<div class="sk-cube4 sk-cube"></div>'+
			              '<div class="sk-cube3 sk-cube"></div>'+
			            '</div>'+
			        '</div>'
	            );


				// Added region to test combination of backbone
				// functionality combined with jQuery UI
				this.addRegions({dialogRegion: DialogRegion.extend({el: "#viewContent"})});
				this.DialogContentView = new v.ContentView({
					template: {type: 'handlebars', template: t.Info},
                    id: "about",
                    className: "modal fade",
                    attributes: {
                        role: "dialog",
                        tabindex: "-1",
                        "aria-labelledby": "about-title",
                        "aria-hidden": true,
                        "data-keyboard": true,
                        "data-backdrop": "static"
                    }
				});

				// Create the views - these are Marionette.CollectionViews that render ItemViews
                this.baseLayerView = new v.BaseLayerSelectionView({
                	collection:globals.baseLayers,
                	itemView: v.LayerItemView.extend({
                		template: {
                			type:'handlebars',
                			template: t.BulletLayer},
                		className: "radio"
                	})
                });

                this.productsView = new v.LayerSelectionView({
                	collection:globals.products,
                	itemView: v.LayerItemView.extend({
                		template: {
                			type:'handlebars',
                			template: t.DataItem},
                		className: "sortable-layer"
                	}),
                    
                	className: "sortable"
                });

                globals.jobs.fetchCollection();

                this.processesView = new v.LayerSelectionView({
                	collection: globals.jobs,
                	itemView: v.LayerItemView.extend({
                		template: {
                			type:'handlebars',
                			template: t.ProcessItem},
                		className: "sortable-layer"
                	}),
                	className: "sortable"
                });

                this.favouritesView = new v.LayerSelectionView({
                    collection: globals.products,
                    itemView: v.LayerItemView.extend({
                        template: {
                            type:'handlebars',
                            template: t.CheckBoxLayer},
                        className: "sortable-layer"
                    }),
                    filter: function (child, index, collection) {
                      return child.get('favourite');
                    },
                    className: "sortable"
                });

                globals.favouritesView = this.favouritesView;

                /*this.favouritesView.setFilter(function (child, index, collection) {
                  return false;
                });*/

                this.overlaysView = new v.BaseLayerSelectionView({
                	collection: globals.overlays,
                	itemView: v.LayerItemView.extend({
                		template: {
                			type: 'handlebars',
                			template: t.CheckBoxOverlayLayer},
                		className: "checkbox"
                	}),
                	className: "check"
                });



                // Create layout that will hold the child views
                this.layout = new LayerControlLayout();

                // Create layout that will hold the child views
                this.dataManagementLayout = new DataManagementLayout();
                this.processManagementLayout = new ProcessManagementLayout();


                // Define collection of selection tools
                var selectionToolsCollection = new m.ToolCollection();
                _.each(config.selectionTools, function(selTool) {
					selectionToolsCollection.add(
							new m.ToolModel({
								id: selTool.id,
								description: selTool.description,
								icon:selTool.icon,
								enabled: true,
								active: false,
								type: "selection",
								selectionType: selTool.selectionType
							}));
				}, this);

                // Define collection of visualization tools
                var visualizationToolsCollection = new m.ToolCollection();
                _.each(config.visualizationTools, function(visTool) {
					visualizationToolsCollection.add(
							new m.ToolModel({
								id: visTool.id,
								eventToRaise: visTool.eventToRaise,
								description: visTool.description,
								disabledDescription: visTool.disabledDescription,
								icon:visTool.icon,
								enabled: visTool.enabled,
								active: visTool.active,
								type: "tool"
							}));
				}, this);

				// Define collection of visualization modes
                var visualizationModesCollection = new m.ToolCollection();
                _.each(config.visualizationModes, function(visMode) {
                    visualizationModesCollection.add(
                        new m.ToolModel({
                            id: visMode.id,
                            eventToRaise: visMode.eventToRaise,
                            description: visMode.description,
                            icon: visMode.icon,
                            enabled: visMode.enabled,
                            active: visMode.active,
                            type: "vis_mode"
                        }));
                }, this);	
                
                // Create Collection Views to hold set of views for selection tools
                this.visualizationToolsView = new v.ToolSelectionView({
                	collection:visualizationToolsCollection,
                	itemView: v.ToolItemView.extend({
                		template: {
                			type:'handlebars',
                			template: t.ToolIcon}
                	})
                });

                // Create Collection Views to hold set of views for visualization tools
                this.selectionToolsView = new v.ToolSelectionView({
                	collection:selectionToolsCollection,
                	itemView: v.ToolItemView.extend({
                		template: {
                			type:'handlebars',
                			template: t.ToolIcon}
                	})
                });


                // Create Collection Views to hold set of views for visualization modes
                this.visualizationModesView = new v.ToolSelectionView({
                    collection: visualizationModesCollection,
                    itemView: v.ToolItemView.extend({
                        template: {
                            type: 'handlebars',
                            template: t.ToolIcon
                        }
                    })
                });


                this.layerSettings = new v.LayerSettings();

                // Create layout to hold collection views
                this.toolLayout = new ToolControlLayout();
                this.optionsLayout = new OptionsLayout();

                

                // Instance timeslider view
                this.timeSliderView = new v.TimeSliderView(config.timeSlider);


                //this.processesView = new v.ProcessesView();

                // Open layers panel as it is basically always used when opening client
                Communicator.mediator.trigger("ui:open:layercontrol");


			},

			// The GUI is setup after the application is started. Therefore all modules
			// are already registered and can be requested to populate the GUI.
			setupGui: function() {

				// Starts the SplitView module and registers it with the Communicator.
				this.module('SplitView').start();
				var splitview = this.module('SplitView').createController();
				this.main.show(splitview.getView());

				splitview.setSinglescreen();

				// Show Timsliderview after creating modules to
				// set the selected time correctly to the products
				this.bottomBar.show(this.timeSliderView);

				// Show storybanner
				/*if(this.storyBanner){
					this.storyView.show(this.storyBanner);
				}*/


				// Try to get CSRF token, if available set it for necesary ajax requests
				function getCookie(name) {
				    var cookieValue = null;
				    if (document.cookie && document.cookie != '') {
				        var cookies = document.cookie.split(';');
				        for (var i = 0; i < cookies.length; i++) {
				            var cookie = jQuery.trim(cookies[i]);
				            // Does this cookie string begin with the name we want?
				            if (cookie.substring(0, name.length + 1) == (name + '=')) {
				                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
				                break;
				            }
				        }
				    }
				    return cookieValue;
				}
				var csrftoken = getCookie('csrftoken');

				function csrfSafeMethod(method) {
				    // these HTTP methods do not require CSRF protection
				    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
				}

				if(csrftoken){
					$.ajaxSetup({
					    beforeSend: function(xhr, settings) {
					        if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
					            xhr.setRequestHeader("X-CSRFToken", csrftoken);
					        }
					    }
					});
				}

			    // Add a trigger for ajax calls in order to display loading state
                // in mouse cursor to give feedback to the user the client is busy
                $(document).ajaxStart(function() {
                  	Communicator.mediator.trigger("progress:change", true);
                });

                $(document).ajaxStop(function() {
                  	Communicator.mediator.trigger("progress:change", false);
                });

                $(document).ajaxError(function( event, request, settings ) {
                	if(settings.suppressErrors || request.statusText == 'abort' || request.status == 404) {
				        return;
				    }

                    $("#error-messages").append(
                              '<div class="alert alert-warning alert-danger">'+
                              '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>'+
                              '<strong>Warning!</strong> Error response on HTTP ' + settings.type + ' to '+ settings.url.split("?")[0] +
                            '</div>'
                    );
                });

                // The tooltip is called twice at beginning and end, it seems to show the style of the
                // tooltips more consistently, there is some problem where sometimes no style is shown for tooltips
                $("body").tooltip({ 
			    	selector: '[data-toggle=tooltip]',
			    	position: { my: "left+5 center", at: "right center" },
					hide: { effect: false, duration: 0 },
					show:{ effect: false, delay: 700}
			    });

			    globals.products.each(function(product){
					if(product.get("visible")){
						Communicator.mediator.trigger("map:layer:change", {
							name: product.get('name'),
							isBaseLayer: false,
							visible: true
						})
					}
				}, this);



			   
			    (function($){
				    /**
				     * Register ajax transports for blob send/recieve and array buffer send/receive via XMLHttpRequest Level 2
				     * within the comfortable framework of the jquery ajax request, with full support for promises.
				     *
				     * Notice the +* in the dataType string? The + indicates we want this transport to be prepended to the list
				     * of potential transports (so it gets first dibs if the request passes the conditions within to provide the
				     * ajax transport, preventing the standard transport from hogging the request), and the * indicates that
				     * potentially any request with any dataType might want to use the transports provided herein.
				     *
				     * Remember to specify 'processData:false' in the ajax options when attempting to send a blob or arraybuffer -
				     * otherwise jquery will try (and fail) to convert the blob or buffer into a query string.
				     *
				     * This revision now includes sending headers, resolves the stack overflow in abort(), and sets the status text
				     * into the response if the request is unsuccessful.
				     */
				    $.ajaxTransport("+*", function(options, originalOptions, jqXHR){
				        // Test for the conditions that mean we can/want to send/receive blobs or arraybuffers - we need XMLHttpRequest
				        // level 2 (so feature-detect against window.FormData), feature detect against window.Blob or window.ArrayBuffer,
				        // and then check to see if the dataType is blob/arraybuffer or the data itself is a Blob/ArrayBuffer
				        if (window.FormData && ((options.dataType && (options.dataType == 'blob' || options.dataType == 'arraybuffer'))
				            || (options.data && ((window.Blob && options.data instanceof Blob)
				                || (window.ArrayBuffer && options.data instanceof ArrayBuffer)))
				            ))
				        {
				            var xhr;

				            return {
				                /**
				                 * Return a transport capable of sending and/or receiving blobs - in this case, we instantiate
				                 * a new XMLHttpRequest and use it to actually perform the request, and funnel the result back
				                 * into the jquery complete callback (such as the success function, done blocks, etc.)
				                 *
				                 * @param headers
				                 * @param completeCallback
				                 */
				                send: function(headers, completeCallback){
				                    var url = options.url || window.location.href,
				                        type = options.type || 'GET',
				                        dataType = options.dataType || 'text',
				                        data = options.data || null,
				                        async = options.async || true;

				                    xhr = new XMLHttpRequest();
				                    xhr.addEventListener('load', function(){
				                        var res = {},
				                            success = xhr.status >= 200 && xhr.status < 300 || xhr.status === 304;

				                        if (success){
				                            res[dataType] = xhr.response;
				                        } else {
				                            res.text = xhr.statusText;
				                        }

				                        completeCallback(xhr.status, xhr.statusText, res, xhr.getAllResponseHeaders());
				                    });

				                    xhr.open(type, url, async);
				                    xhr.responseType = dataType;

				                    for (var key in headers){
				                        if (headers.hasOwnProperty(key)){
				                            xhr.setRequestHeader(key, headers[key]);
				                        }
				                    }

				                    xhr.send(data);
				                },
				                abort: function(){
				                    if (xhr){
				                        xhr.abort();
				                    }
				                }
				            };
				        }
				    });
				})(jQuery);

                // Remove loading screen when this point is reached in the script
                $('#loadscreen').fadeOut('slow');
                $('.prodLoadContainer').show();

			}



		});

		return new Application();
	});
}).call( this );