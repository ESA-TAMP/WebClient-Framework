(function() {
	'use strict';

	var root = this;

	root.define([
		'backbone',
		'communicator',
		'globals',
		'hbs!tmpl/LayerSettings',
		'underscore',
		'plotty'
	],

	function( Backbone, Communicator, globals, LayerSettingsTmpl ) {

		var LayerSettings = Backbone.Marionette.Layout.extend({

			template: {type: 'handlebars', template: LayerSettingsTmpl},
			className: "panel panel-default optionscontrol not-selectable",
			colorscaletypes : _.keys(plotty.colorscales),

			initialize: function(options) {
				this.selected = null;
				this.plot = new plotty.plot({
					colorScale: 'jet',
					domain: [0,1]
				});
			},
			onShow: function(view){

				// Unbind first to make sure we are not binding to many times
				this.stopListening(Communicator.mediator, "layer:settings:changed", this.onParameterChange);

				// Event handler to check if tutorial banner made changes to a model in order to redraw settings
				// If settings open rerender view to update changes
				this.listenTo(Communicator.mediator, "layer:settings:changed", this.onParameterChange);

				this.$(".panel-title").html('<h3 class="panel-title"><i class="fa fa-fw fa-sliders"></i> ' + this.model.get("name") + ' Settings</h3>');

		    	this.$('.close').on("click", _.bind(this.onClose, this));
		    	this.$el.draggable({ 
		    		containment: "#main",
		    		scroll: false,
		    		handle: '.panel-heading'
	    		});
		    	var options = this.model.get("parameters");
		    	var height = this.model.get("height");
		    	var outlines = this.model.get("outlines");
		    	var protocol = this.model.get("views")[0].protocol;
		    	var keys = _.keys(options);
				var option = '';

				var that = this;

				_.each(keys, function(key){
					if(options[key].selected){
						that.selected = key;
				   		option += '<option value="'+ key + '" selected>' + options[key].name + '</option>';
				   	}else{
				   		option += '<option value="'+ key + '">' + options[key].name + '</option>';
				   	}
				});

				this.$("#options").empty();

				if(_.keys(options).length==1){
					this.$("#parameters").find("ul").find(":first-child").first().hide();
				}

				if(options[this.selected].description){
					this.$("#description").text(options[this.selected].description);
				}

				if(options[that.selected].hasOwnProperty("logarithmic")){
					this.addLogOption(options);
				}

				// Add event handler for change in drop down selection
				this.$("#options").change(this.onOptionsChanged.bind(this));

				// Set values for color scale ranges
				this.$("#range_min").val(options[this.selected].range[0]);
				this.$("#range_max").val(options[this.selected].range[1]);

				// Set the step size
				// TODO: How many steps do we want to allow? Is 100 ok?
				var step_size = Math.abs(options[this.selected].range[1]-options[this.selected].range[0])/100;
				this.$("#range_min_slider").attr("step", step_size);
				this.$("#range_max_slider").attr("step", step_size);
				
				// Set the range sliders
				this.$("#range_min_slider").attr("max", options[this.selected].range[1]);
				this.$("#range_min_slider").attr("min", options[this.selected].range[0]);
				this.$("#range_min_slider").attr("value", options[this.selected].range[0]);
				//max_label.innerHTML = max_range;

				this.$("#range_max_slider").attr("max", options[this.selected].range[1]);
				this.$("#range_max_slider").attr("min", options[this.selected].range[0]);
				this.$("#range_max_slider").attr("value", options[this.selected].range[1]);
				//max_label.innerHTML = max_range;

				this.$("#opacitysilder").val(this.model.attributes.opacity*100);
				this.$("#opacitysilder").on("input change", function(){
					var opacity = Number(this.value)/100;
					that.model.set("opacity", opacity);
					Communicator.mediator.trigger('productCollection:updateOpacity', {model:that.model, value:opacity});
				});

				if(options[that.selected]['clamp_min']){
					this.$("#clamp_min").attr('checked','checked');
				}
				if(options[that.selected]['clamp_max']){
					this.$("#clamp_max").attr('checked','checked');
				}

				this.$("#clamp_min").on("input change", function(evt){
					var options = that.model.get("parameters");
					options[that.selected]['clamp_min'] = $("#clamp_min").prop('checked');
					that.model.set("parameters", options);
					Communicator.mediator.trigger("layer:parameters:changed", that.model.get("download").id);
				});

				this.$("#clamp_max").on("input change", function(evt){
					var options = that.model.get("parameters");
					options[that.selected]['clamp_max'] = $("#clamp_max").prop('checked');
					that.model.set("parameters", options);
					Communicator.mediator.trigger("layer:parameters:changed", that.model.get("download").id);
				});





				this.$("#range_min_slider").on("input change", function(){
					var newrange = [parseFloat(this.value), options[that.selected].range[1]];
					options[that.selected].range = newrange;
					Communicator.mediator.trigger("layer:range:changed", that.model.get("download").id, newrange, options[that.selected].colorscale);
					that.updateRange(options);
				});

				this.$("#range_min_slider").on("mouseup", function(){
					var newrange = [parseFloat(this.value), options[that.selected].range[1]];
					options[that.selected].range = newrange;
					that.model.set("parameters", options);
					Communicator.mediator.trigger("layer:parameters:changed", that.model.get("download").id);
				});

				this.$("#range_max_slider").on("input change", function(){
					var newrange = [options[that.selected].range[0], parseFloat(this.value)];
					options[that.selected].range = newrange;
					Communicator.mediator.trigger("layer:range:changed", that.model.get("download").id, newrange, options[that.selected].colorscale);
					that.updateRange(options);
				});

				this.$("#range_max_slider").on("mouseup", function(){
					var newrange = [options[that.selected].range[0], parseFloat(this.value)];
					options[that.selected].range = newrange;
					that.model.set("parameters", options);
					Communicator.mediator.trigger("layer:parameters:changed", that.model.get("download").id);
				});


				// Register necessary key events
				this.registerKeyEvents(this.$("#range_min"));
				this.registerKeyEvents(this.$("#range_max"));


				var colorscale_options = "";
				var selected_colorscale;
				_.each(this.colorscaletypes, function(colorscale){
					if(options[that.selected].colorscale == colorscale){
						selected_colorscale = colorscale;
				   		colorscale_options += '<option value="'+ colorscale + '" selected>' + colorscale + '</option>';
				   	}else{
				   		colorscale_options += '<option value="'+ colorscale + '">' + colorscale + '</option>';
				   	}
				});

				this.$("#style").empty();
				this.$("#style").append(colorscale_options);


				this.$("#style").change(function(evt){
					var selected = $(evt.target).find("option:selected").text();
					selected_colorscale = selected;
					that.$("#gradient").attr("class", selected_colorscale);
					options[that.selected].colorscale = selected;

					that.updateRange(options);

					Communicator.mediator.trigger("layer:parameters:changed", that.model.get("download").id);
				});


				if(!(typeof this.model.get("coefficients_range") === 'undefined')){

					this.$("#coefficients_range").empty();

					this.$("#coefficients_range").append(
					'<li style="margin-top: 5px;">'+
						'<label for="coefficients_range_min" style="width: 120px;">Coefficients range: </label>'+
						'<input id="coefficients_range_min" type="text" style="width:30px;"/>'+
						'<input id="coefficients_range_max" type="text" style="width:30px; margin-left:8px"/>'+
					'</li>'+
					'<p style="font-size:0.85em; margin-left:130px;"> [-1,-1]: No range limitation</p>'
					);

					this.$("#coefficients_range_min").val(this.model.get("coefficients_range") [0]);
					this.$("#coefficients_range_max").val(this.model.get("coefficients_range") [1]);

					// Register necessary key events
					this.registerKeyEvents(this.$("#coefficients_range_min"));
					this.registerKeyEvents(this.$("#coefficients_range_max"));

				}

				if (protocol == "WPS"){
					this.$("#shc").empty();
					this.$("#shc").append(
						'<p>Spherical Harmonics Coefficients</p>'+
						'<div class="myfileupload-buttonbar ">'+
					    	'<label class="btn btn-default shcbutton">'+
					        '<span><i class="fa fa-fw fa-upload"></i> Upload SHC File</span>'+
					        '<input id="upload-selection" type="file" accept=".shc" name="files[]" />'+
					      '</label>'+
					  '</div>'
					);

					this.$("#upload-selection").change(this.onUploadSelectionChanged.bind(this));

					if(this.model.get('shc_name')){
						that.$("#shc").append('<p id="filename" style="font-size:.9em;">Selected File: '+this.model.get('shc_name')+'</p>');
					}

				}

				that.updateRange(options);

				this.createHeightTextbox(this.model.get("height"));
				this.createScaleFactorTextbox(this.model.get('scaleFactor'));

				if(!(typeof this.model.get("timeRange") === 'undefined')){
					var times = this.model.get("timeRange");

					if(times[0] !== null && times[1] !== null){
						if(times[0].getTime()!==0 && times[1].getTime()!==0){
							this.$("#centertime").empty();
							this.$("#centertime").append(
							'<button style="width:100%;" type="button" class="btn btn-default">Show Time Covered by Data Collection</button>'
							);
							var timerange = this.model.get("timeRange");

							this.$("#centertime").click(function(){
								Communicator.mediator.trigger("date:center", timerange);
							});
						}
					}

				}

				if(!(typeof this.model.get("id") === 'undefined')){
					var collId = this.model.get("id");
					if (!collId.startsWith('AMIDA') && !collId.startsWith('AOD_')){
						this.$("#deletecollection").empty();

						this.$("#deletecollection").append(
						'<button style="width:100%;" type="button" class="btn btn-danger">Delete collection</button>'
						);
					}

					this.$("#deletecollection").click(function(){
						var deleteUrl = globals.clientInterfaceHost + 
				    		'/api/v2/dave/collections/'+collId;
				    	$.ajax({
						    url: deleteUrl,
						    type: 'DELETE',
						    success: function(result) {
						    	var options = {
				            		name: that.model.get('name'),
				            		isBaseLayer: false,
				            		visible: false
				            	};
						    	Communicator.mediator.trigger('map:layer:change', options);
						    	that.close();
						        globals.products.fetch();
						    }
						});
					});

				}

		    },

			onClose: function() {
				this.close();
			},

			updateRange: function(options){
				this.model.set("parameters", options);

				if(options[this.selected].hasOwnProperty("logarithmic"))
					this.createScale(options[this.selected].logarithmic);
				else
					this.createScale();
			},

			onParameterChange: function(){
				this.onShow();
			},

			onOptionsChanged: function(){

				var options = this.model.get("parameters");

				delete options[this.selected].selected;
				this.selected = $("#options").find("option:selected").val();

				this.$("#style").empty();
				var colorscale_options = "";
				var selected_colorscale;
				_.each(this.colorscaletypes, function(colorscale){
					if(options[this.selected].colorscale == colorscale){
						selected_colorscale = colorscale;
				   		colorscale_options += '<option value="'+ colorscale + '" selected>' + colorscale + '</option>';
				   	}else{
				   		colorscale_options += '<option value="'+ colorscale + '">' + colorscale + '</option>';
				   	}
				}, this);

				this.$("#style").append(colorscale_options);

				this.$("#range_min").val(options[this.selected].range[0]);
				this.$("#range_max").val(options[this.selected].range[1]);

				if(options[this.selected].hasOwnProperty("logarithmic")){
					this.addLogOption(options);

				}else{
					this.$("#logarithmic").empty();
				}

				options[this.selected].selected = true;

				if(options[this.selected].description){
					this.$("#description").text(options[this.selected].description);
				}

				this.createHeightTextbox(this.model.get("height"));
				this.createScaleFactorTextbox(this.model.get('scaleFactor'));

				this.model.set("parameters", options);
				//that.updateRange(options);

				Communicator.mediator.trigger("layer:parameters:changed", this.model.get("download").id);
			},

			registerKeyEvents: function(el){
				var that = this;
				el.keypress(function(evt) {
					if(evt.keyCode == 13){ //Enter pressed
						evt.preventDefault();
						that.applyChanges();
					}else{
						that.createApplyButton();
					}
				});

				el.keyup(function(evt) {
					if(evt.keyCode == 8){ //Backspace clicked
						that.createApplyButton();
					}
				});

				// Add click event to select text when clicking or tabbing into textfield
				el.click(function () { $(this).select(); });
			},

			createApplyButton: function(){
				var that = this;
				if($("#changesbutton").length == 0){
					$("#applychanges").append('<button type="button" class="btn btn-default" id="changesbutton" style="width: 100%;"> Apply changes </button>');
					$("#changesbutton").click(function(evt){
						that.applyChanges();
					});
				}
			},

			applyChanges: function(){

				var options = this.model.get("parameters");

					//this.$("#coefficients_range_max").val(this.model.get("coefficients_range") [1]);

				var error = false;

				// Check color ranges
				var range_min = parseFloat($("#range_min").val());
				error = error || this.checkValue(range_min,$("#range_min"));

				var range_max = parseFloat($("#range_max").val());
				error = error || this.checkValue(range_max,$("#range_max"));

				
				
				// Set parameters and redraw color scale
				if(!error){
					options[this.selected].range = [range_min, range_max];

					// Set the range for changed values
					this.$("#range_min_slider").attr("max", options[this.selected].range[1]);
					this.$("#range_min_slider").attr("min", options[this.selected].range[0]);
					this.$("#range_min_slider").attr("value", options[this.selected].range[0]);

					// Set the step size
					// TODO: How many steps do we want to allow? Is 120 ok?
					var step_size = Math.abs(options[this.selected].range[1]-options[this.selected].range[0])/120;
					this.$("#range_min_slider").attr("step", step_size);
					this.$("#range_max_slider").attr("step", step_size);

					this.$("#range_max_slider").attr("max", options[this.selected].range[1]);
					this.$("#range_max_slider").attr("min", options[this.selected].range[0]);
					this.$("#range_max_slider").attr("value", options[this.selected].range[1]);


					if(options[this.selected].hasOwnProperty("logarithmic"))
						this.createScale(options[this.selected].logarithmic);
					else
						this.createScale();
				}

				// Check coefficient ranges
				if ($("#coefficients_range_min").length && $("#coefficients_range_max").length){
					var coef_range_min = parseFloat($("#coefficients_range_min").val());
					error = error || this.checkValue(coef_range_min,$("#coefficients_range_min"));

					var coef_range_max = parseFloat($("#coefficients_range_max").val());
					error = error || this.checkValue(coef_range_max,$("#coefficients_range_max"));

					if(!error)
						this.model.set("coefficients_range", [coef_range_min, coef_range_max]);
				}

				// Check for height attribute
				if ($("#heightvalue").length){
					var height = parseFloat($("#heightvalue").val());
					error = error || this.checkValue(height,$("#heightvalue"));

					if (!error)
						this.model.set("height", height);
				}

				// Check for scalefactor parameter
				var scaleFactorChange = false;
				if ($("#scaleFactorValue").length){
					var scaleFactor = parseFloat($("#scaleFactorValue").val());
					if(scaleFactor>1.0){
						scaleFactor = NaN;
					}
					error = error || this.checkValue(scaleFactor,$("#scaleFactorValue"));

					if (!error){
						this.model.set("scaleFactor", scaleFactor);
						scaleFactorChange = true;
					}
				}

				if(!error){
					// Remove button
					$("#applychanges").empty();

					//Apply changes
					this.model.set("parameters", options);
					Communicator.mediator.trigger("layer:parameters:changed", this.model.get("download").id);
					if(scaleFactorChange){
						Communicator.mediator.trigger("layer:scalefactor:changed", this.model.get("download").id);
					}
				}
			},

			checkValue: function(value, textfield){
				if (isNaN(value)){
					textfield.addClass("text_error");
					return true;
				}else{
					textfield.removeClass("text_error");
					return false;
				}
			},

			setModel: function(model){
				this.model = model;
			},

			sameModel: function(model){
				return this.model.get("download").id == model.get("download").id;
			},

			onUploadSelectionChanged: function(evt) {
				var that = this;
	      		var reader = new FileReader();
	      		var filename = evt.target.files[0].name;
				reader.onloadend = function(evt) {
					//console.log(evt.target.result);
					that.model.set('shc', evt.target.result);
					that.model.set('shc_name', filename);
					that.$("#shc").find("#filename").remove();
					that.$("#shc").append('<p id="filename" style="font-size:.9em;">Selected File: '+filename+'</p>');
					Communicator.mediator.trigger("file:shc:loaded", evt.target.result);

					var params = { name: that.model.get("download").id, isBaseLayer: false, visible: false };
					Communicator.mediator.trigger('map:layer:change', params);
					Communicator.mediator.trigger("layer:activate", that.model.get("views")[0].id);


				}

				reader.readAsText(evt.target.files[0]);
	      	},

	      	addLogOption: function(options){
	      		var that = this;
	      		if(options[this.selected].hasOwnProperty("logarithmic")){
					var checked = "";
					if (options[this.selected].logarithmic)
						checked = "checked";

					this.$("#logarithmic").empty();

					this.$("#logarithmic").append(
						'<form style="vertical-align: middle;">'+
						'<label for="outlines" style="width: 100px;">Log. Scale: </label>'+
						'<input type="checkbox" name="logarithmic" value="logarithmic" ' + checked + '></input>'+
						'</form>'
					);

					this.$("#logarithmic input").change(function(evt){
						var options = that.model.get("parameters");
						options[that.selected].logarithmic = !options[that.selected].logarithmic;
						
						that.model.set("parameters", options);
						Communicator.mediator.trigger("layer:parameters:changed", that.model.get("download").id);

						if(options[that.selected].hasOwnProperty("logarithmic"))
							that.createScale(options[that.selected].logarithmic);
						else
							that.createScale();
					});
				}
	      	},

	      	createScale: function(logscale){

	      		var superscript = "⁰¹²³⁴⁵⁶⁷⁸⁹",
    			formatPower = function(d) { 
    				if (d>=0)
    					return (d + "").split("").map(function(c) { return superscript[c]; }).join("");
    				else if (d<0)
    					return "⁻"+(d + "").split("").map(function(c) { return superscript[c]; }).join("");
    			};

	      		$("#setting_colorscale").empty();
	      		var margin = 20;
				var width = $("#setting_colorscale").width();
				var scalewidth =  width - margin *2;

				var range_min = this.model.get("parameters")[this.selected].range[0];
				var range_max = this.model.get("parameters")[this.selected].range[1];
				var uom = this.model.get("parameters")[this.selected].uom;
				var style = this.model.get("parameters")[this.selected].colorscale;

				this.plot.setColorScale(style);

				$("#setting_colorscale").append(
					'<div id="scaleimagecontainer" style="width:'+scalewidth+'px; height:20px; margin-left:'+margin+'px"></div>'
				)

				var image = this.plot.getColorScaleImage();
				image.className = "scaleimage"
				$("#scaleimagecontainer").append(image);



				var svgContainer = d3.select("#setting_colorscale").append("svg")
					.attr("width", width)
					.attr("height", 40);

				var axisScale;
				
				if(logscale){
					axisScale = d3.scale.log();
					if (range_min == 0)
						range_min = 0.001;
				}else{
					axisScale = d3.scale.linear();
				}

				axisScale.domain([range_min, range_max]);
				axisScale.range([0, scalewidth]);

				var xAxis = d3.svg.axis()
					.scale(axisScale)
					.ticks(8, function(d) { 
						return 10 + formatPower(Math.round(Math.log(d) / Math.LN10)); 
					});

				xAxis.tickValues( axisScale.ticks( 3 ).concat( axisScale.domain() ) );
				var expFormat = d3.format('e');
				xAxis.tickFormat(function(v){
					if ((v > 0.01 && v<100) || (v<-0.01 && v>-100) || v===0) {
						return v;
					} else {
						return expFormat(v).toUpperCase();
					}
				});

			    var g = svgContainer.append("g")
			        .attr("class", "x axis")
			        .attr("transform", "translate(" + [margin, 3]+")")
			        .call(xAxis);

				if(uom){
					g.append("text")
						.style("text-anchor", "middle")
						.style("font-size", "1.1em")
						.attr("transform", "translate(" + [scalewidth/2, 35]+")")
						.text(uom);
				}

				svgContainer.selectAll(".tick").select("line")
					.attr("stroke", "black");
	      	},

	      	createHeightTextbox: function(height){
	      		var that = this;
	      		this.$("#height").empty();
	      		if( (height || height==0) && this.selected != "Fieldlines"){
					this.$("#height").append(
						'<form style="vertical-align: middle;">'+
						'<label for="heightvalue" style="width: 70px;">Height: </label>'+
						'<input id="heightvalue" type="text" style="width:30px; margin-left:8px"/>'+
						'</form>'
					);
					this.$("#heightvalue").val(height);
					this.$("#height").append(
						'<p style="font-size:0.85em; margin-left: 70px;">Above ellipsoid (Km)</p>'
					);

					// Register necessary key events
					this.registerKeyEvents(this.$("#heightvalue"));
				}
	      	},

	      	createScaleFactorTextbox: function(scaleFactor){
	      		var that = this;
	      		this.$("#scaleFactor").empty();
	      		if( (scaleFactor || scaleFactor==0)){
					this.$("#scaleFactor").append(
						'<form style="vertical-align: middle;">'+
						'<label for="scaleFactorValue" style="width: 70px;">Data scale: </label>'+
						'<input id="scaleFactorValue" type="text" style="width:30px; margin-left:8px"/>'+
						'</form>'
					);
					this.$("#scaleFactorValue").val(scaleFactor);

					// Register necessary key events
					this.registerKeyEvents(this.$("#scaleFactorValue"));
				}
	      	}

		});

		return {"LayerSettings": LayerSettings};

	});

}).call( this );
