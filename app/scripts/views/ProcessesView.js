(function() {
  'use strict';

  var root = this;
  root.define([
    'backbone',
    'communicator',
    'globals',
    'hbs!tmpl/Processes',
    'hbs!tmpl/wps_pep_execute',
    'hbs!tmpl/wps_execute_interpolation',
    'underscore',
    'plotty',
    'geotiff',
    'libcoverage'
  ],
  function( Backbone, Communicator, globals, TmplProcesses, Tmpl_wps_pep_execute, Tmpl_wps_pep_execute_interpolation ) {

    var ProcessesView = Backbone.Marionette.ItemView.extend({
      tagName: "div",
      id: "processes",
      className: "panel panel-default",
      template: {
          type: 'handlebars',
          template: TmplProcesses
      },

      modelEvents: {
        /*"reset": "onCoveragesReset"*/
      },

      events: {
        /*"click #btn-select-all-coverages": "onSelectAllCoveragesClicked"*/
      },

      initialize: function(options) {
        this.wps_url = PRODUCT_URL + "/ows?";
        this.p_plot = new plotty.plot($('<canvas/>'), null, 1, 1);
      },

      onShow: function(view){

        this.$('.close').on("click", _.bind(this.onClose, this));
        this.$el.draggable({
          containment: "#content",
          scroll: false,
          handle: '.panel-heading'
        });

        var that = this;
        that.globals = globals;

        this.$el.find(".panel-body").append('<div style="width:100%; font-weight: bold;">Processing tools</div>');
        this.$el.find(".panel-body").append('<button type="button" id="calculateSpatialAverage" class="btn btn-success" style="width:100%;">Calculate Spatial Average</button>');
        this.$el.find(".panel-body").append('<button type="button" id="calculateTemporalAverage" class="btn btn-success" style="width:100%;">Calculate Temporal Average</button>');
        this.$el.find(".panel-body").append('<button type="button" id="bandCombination_subtract" class="btn btn-success" style="width:100%;">Calculate Difference</button>');
        this.$el.find(".panel-body").append('<button type="button" id="bandCombination_add" class="btn btn-success" style="width:100%;">Calculate Sum</button>');
        this.$el.find(".panel-body").append('<div style="width:100%;">Create new Collection<br/>(based on selected collection) by: </div>');
        this.$el.find(".panel-body").append('<button type="button" id="verticalIntegration" class="btn btn-success" style="width:100%;">Vertical Integration</button>');
        this.$el.find(".panel-body").append('<button type="button" id="unitConversion" class="btn btn-success" style="width:100%;">Unit Conversion</button>');
        this.$el.find(".panel-body").append('<button type="button" id="interpolation" class="btn btn-success" style="width:100%;">Interpolation</button>');
        this.$el.find(".panel-body").append('<div style="width:100%; font-weight: bold;">Assessment tools</div>');
        this.$el.find(".panel-body").append('<button type="button" id="stationsCorrelation" class="btn btn-success" style="width:100%;">Assess station correlation</button>');
        this.$el.find(".panel-body").append('<button type="button" id="SpatialCorrelation2d" class="btn btn-success" style="width:100%;">Assess spatial correlation</button>');

        $('#calculateSpatialAverage').click(function(){
          var sels = Communicator.reqres.request('selections:get:all');

          // TODO: Process only for one product what to do with multiple? Server or client?
          if(sels.actProd.length == 1){
            if (sels.geo){

              var current_product;
              globals.products.each(function(product) {
                if(product.get('download').id == sels.actProd[0]){
                  current_product = product;
                }
              });

              var collection_id = current_product.get('process_id');

              var req_data = Tmpl_wps_pep_execute({
                wps_process: 'execute',
                process: 'spatialAverage',
                collection: collection_id,
                left: sels.geo.w,
                right: sels.geo.e,
                top: sels.geo.n,
                bottom: sels.geo.s,
                start_time: Math.round(sels.time.start.getTime()/1000),
                end_time: Math.round(sels.time.end.getTime()/1000)
              });


              $.ajax({
                type: "POST",
                url: that.wps_url,
                //dataType: "xml",
                data: req_data,
                success: function(resp_data) {
                  $("#pickingresults").show();
                  $("#pickingresults").empty();
                  $("#pickingresults").append('<button type="button" id="pickingresultsClose" class="close" style="margin-right:5px; margin-top:5px;"><i class="fa fa-times-circle"></i></button>');
                  $("#pickingresults").append('<div style="margin: 0 auto; width: 80%; margin-top: 10%;" id="prcontainer"></div>');
                  $("#prcontainer").append(resp_data);

                  $('#pickingresultsClose').click(function(){
                    $("#pickingresults").hide();
                    $("#pickingresults").empty();
                  });
                }
              });

            }else{
              $("#error-messages").append(
                '<div class="alert alert-warning alert-danger">'+
                  '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>'+
                  '<strong>Info:</strong> Please make sure an area of interest has been selected with the bounding box tool.' +
                '</div>'
              );
            }
          }else{
            $("#error-messages").append(
              '<div class="alert alert-warning alert-danger">'+
                '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>'+
                '<strong>Info:</strong> Please make sure an appropiate collection has been selected from the Layers menu before executing this process.' +
              '</div>'
            );
          }
        });

        $('#calculateTemporalAverage').click(function(){
          var sels = Communicator.reqres.request('selections:get:all');

          // TODO: Process only for one product what to do with multiple? Server or client?
          if(sels.actProd.length == 1){
            if (sels.geo){

              var current_product;
              globals.products.each(function(product) {
                if(product.get('download').id == sels.actProd[0]){
                  current_product = product;
                }
              });

              var collection_id = current_product.get('process_id');

              var req_data = Tmpl_wps_pep_execute({
                wps_process: 'execute',
                process: 'temporalAverage',
                collection: collection_id,
                left: sels.geo.w,
                right: sels.geo.e,
                top: sels.geo.n,
                bottom: sels.geo.s,
                start_time: Math.round(sels.time.start.getTime()/1000),
                end_time: Math.round(sels.time.end.getTime()/1000)
              });

              $.ajax({
                type: "POST",
                url: that.wps_url,
                dataType:'arraybuffer',
                data: req_data,
                
                success: function(resp_data) {

                  Communicator.mediator.trigger("map:show:result", resp_data);
                }
              });

            }else{
              $("#error-messages").append(
                '<div class="alert alert-warning alert-danger">'+
                  '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>'+
                  '<strong>Info:</strong> Please make sure an area of interest has been selected with the bounding box tool.' +
                '</div>'
              );
            }
          }else{
            $("#error-messages").append(
              '<div class="alert alert-warning alert-danger">'+
                '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>'+
                '<strong>Info:</strong> Please make sure an appropiate collection has been selected from the Layers menu before executing this process.' +
              '</div>'
            );
          }
        });

        $('#bandCombination_subtract').click(function(){
          var sels = Communicator.reqres.request('selections:get:all');

          if(sels.actProd.length == 2){
            if (sels.geo){

              var current_products = [];

              globals.products.each(function(product) {
                if($.inArray(product.get('download').id, sels.actProd)!=-1){
                  current_products.push(product.get('process_id'));
                }
              });

              var collection_id = current_products[0];
              var o_collection_id = current_products[1];

              var req_data = Tmpl_wps_pep_execute({
                wps_process: 'execute',
                process: 'subtract',
                collection: collection_id,
                o_collection: o_collection_id,
                left: sels.geo.w,
                right: sels.geo.e,
                top: sels.geo.n,
                bottom: sels.geo.s,
                start_time: Math.round(sels.time.start.getTime()/1000),
                end_time: Math.round(sels.time.end.getTime()/1000)
              });

              $.ajax({
                type: "POST",
                url: that.wps_url,
                dataType:'arraybuffer',
                data: req_data,
                
                success: function(resp_data) {
                  Communicator.mediator.trigger("map:show:result", resp_data, collection_id, o_collection_id, "-");
                }
              });

            }else{
              $("#error-messages").append(
                '<div class="alert alert-warning alert-danger">'+
                  '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>'+
                  '<strong>Info:</strong> Please make sure an area of interest has been selected with the bounding box tool.' +
                '</div>'
              );
            }
          }else{
            $("#error-messages").append(
              '<div class="alert alert-warning alert-danger">'+
                '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>'+
                '<strong>Info:</strong> Please make sure two appropiate collections have been selected from the Layers menu before executing this process.' +
              '</div>'
            );
          }
        });

        $('#bandCombination_add').click(function(){
          var sels = Communicator.reqres.request('selections:get:all');

          if(sels.actProd.length == 2){
            if (sels.geo){

              var current_products = [];

              globals.products.each(function(product) {
                if($.inArray(product.get('download').id, sels.actProd)!=-1){
                  current_products.push(product.get('process_id'));
                }
              });

              var collection_id = current_products[0];
              var o_collection_id = current_products[1];

              var req_data = Tmpl_wps_pep_execute({
                wps_process: 'execute',
                process: 'add',
                collection: collection_id,
                o_collection: o_collection_id,
                left: sels.geo.w,
                right: sels.geo.e,
                top: sels.geo.n,
                bottom: sels.geo.s,
                start_time: Math.round(sels.time.start.getTime()/1000),
                end_time: Math.round(sels.time.end.getTime()/1000)
              });

              $.ajax({
                type: "POST",
                url: that.wps_url,
                dataType:'arraybuffer',
                data: req_data,
                
                success: function(resp_data) {

                  Communicator.mediator.trigger("map:show:result", resp_data, collection_id, o_collection_id, "+");
                }
              });

            }else{
              $("#error-messages").append(
                '<div class="alert alert-warning alert-danger">'+
                  '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>'+
                  '<strong>Info:</strong> Please make sure an area of interest has been selected with the bounding box tool.' +
                '</div>'
              );
            }
          }else{
            $("#error-messages").append(
              '<div class="alert alert-warning alert-danger">'+
                '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>'+
                '<strong>Info:</strong> Please make sure two appropiate collections have been selected from the Layers menu before executing this process.' +
              '</div>'
            );
          }
        });

        $('#verticalIntegration').click(function(){
          var sels = Communicator.reqres.request('selections:get:all');

          // TODO: Process only for one product
          if(sels.actProd.length == 1){
            if(confirm("Are you sure you want to continue? This process will create an entire new collection based on your inputs.")){

              var current_product;
              globals.products.each(function(product) {
                if(product.get('download').id == sels.actProd[0]){
                  current_product = product;
                }
              });

              var collection_id = current_product.get('process_id');

              var label = prompt("Please enter a label that will be added to the ending of the new collection");
              var name = prompt("Please enter a name for the new collection");
              var value = prompt("Please enter the result unit of measurement of the new collection");

              var req_data = Tmpl_wps_pep_execute({
                wps_process: 'execute_file_system',
                process: 'verticalIntegration',
                collection: collection_id,
                label: label,
                name: name,
                value: value
              });


              $.ajax({
                type: "POST",
                url: that.wps_url,
                //dataType: "xml",
                data: req_data,
                success: function(resp_data) {
                  alert("Collection creation was triggered, the collection will appear the next time the client is opened and processing is finished");
                }
              });
            }

          }else{
            $("#error-messages").append(
              '<div class="alert alert-warning alert-danger">'+
                '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>'+
                '<strong>Info:</strong> Please make sure (only) one appropiate collection has been selected from the Layers menu before executing this process.' +
              '</div>'
            );
          }
        });
        
        $('#unitConversion').click(function(){
          var sels = Communicator.reqres.request('selections:get:all');

          // TODO: Process only for one product
          if(sels.actProd.length == 1){
            if(confirm("Are you sure you want to continue? This process will create an entire new collection based on your inputs.")){

              var current_product;
              globals.products.each(function(product) {
                if(product.get('download').id == sels.actProd[0]){
                  current_product = product;
                }
              });

              var collection_id = current_product.get('process_id');

              var label = prompt("Please enter a label that will be added to the ending of the new collection");
              var name = prompt("Please enter a name for the new collection");
              var value = prompt("Please enter the result unit of measurement of the new collection");

              var gain = prompt("Please enter the gain value you would like to apply (default = 1)");
              var offset = prompt("Please enter the offset value you would like to apply (defualt = 0)");

              var options = {
                wps_process: 'execute_file_system',
                process: 'convert',
                collection: collection_id,
                label: label,
                name: name,
                value: value
              };

              if (gain){
                options['gain'] = gain;
              }

              if(offset){
                options['offset'] = offset;
              }

              var req_data = Tmpl_wps_pep_execute(options);


              $.ajax({
                type: "POST",
                url: that.wps_url,
                //dataType: "xml",
                data: req_data,
                success: function(resp_data) {
                  alert("Collection creation was triggered, the collection will appear the next time the client is opened and processing is finished");
                }
              });
            }

          }else{
            $("#error-messages").append(
              '<div class="alert alert-warning alert-danger">'+
                '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>'+
                '<strong>Info:</strong> Please make sure (only) one appropiate collection has been selected from the Layers menu before executing this process.' +
              '</div>'
            );
          }
        });

        $('#interpolation').click(function(){
          var sels = Communicator.reqres.request('selections:get:all');

          // TODO: Process only for one product
          if(sels.actProd.length == 1){
            if(confirm("Are you sure you want to continue? This process will create an entire new collection.")){

              var current_product;
              globals.products.each(function(product) {
                if(product.get('download').id == sels.actProd[0]){
                  current_product = product;
                }
              });

              var collection_id = current_product.get('process_id');

              var options = {
                wps_process: 'execute_pep_interpolation',
                process: 'convert',
                collection: collection_id
              };

              var req_data = Tmpl_wps_pep_execute_interpolation(options);

              $.ajax({
                type: "POST",
                url: that.wps_url,
                data: req_data,
                success: function(resp_data) {
                  alert("Collection creation was triggered, the collection will appear the next time the client is opened and processing is finished");
                }
              });
            }

          }else{
            $("#error-messages").append(
              '<div class="alert alert-warning alert-danger">'+
                '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>'+
                '<strong>Info:</strong> Please make sure (only) one appropiate collection has been selected from the Layers menu before executing this process.' +
              '</div>'
            );
          }
        });

        // Assessment tools
        $('#stationsCorrelation').click(function(){
          var sels = Communicator.reqres.request('selections:get:all');

          // TODO: Process only for one product
          if(sels.actProd.length == 1){

            if (sels.geo){

              var current_product;
              globals.products.each(function(product) {
                if(product.get('download').id == sels.actProd[0]){
                  current_product = product;
                }
              });

              var collection_id = current_product.get('process_id');

              /*var ground_product = prompt("(Required) Please provide a ground product name (for search in database) to be used in correlation");
              if (!ground_product) {
                $("#error-messages").append(
                '<div class="alert alert-warning alert-danger">'+
                  '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>'+
                  '<strong>Info:</strong> The ground product identifier is a required parameter' +
                '</div>'
              );
                return;
              }*/
              var spatialtolerance = prompt("Please provide a value for spatial tolerance, if none provided the default of 1 (deegree) will be used");
              var temporaltolerance = prompt("Please provide a value for temporal tolerance, if none provided the default of 60 (mins) will be used");

              var options = {
                wps_process: 'execute_assessment',
                process: 'correlation',
                collection: collection_id,
                //ground_product: ground_product,
                left: sels.geo.w,
                right: sels.geo.e,
                top: sels.geo.n,
                bottom: sels.geo.s,
                start_time: Math.round(sels.time.start.getTime()/1000),
                end_time: Math.round(sels.time.end.getTime()/1000)
              };

              if(spatialtolerance){
                options['spatialtolerance'] = spatialtolerance;
              }

              if(temporaltolerance){
                options['temporaltolerance'] = temporaltolerance;
              }

              var req_data = Tmpl_wps_pep_execute(options);

              $.ajax({
                type: "POST",
                url: that.wps_url,
                //dataType: "xml",
                data: req_data,
                success: function(resp_data) {
                  var data = resp_data.replace(/[&\/\,+()\[\]\n']/g, '').split(" ");
                  if(data[0]!=""){
                    var parsed_data = [];

                    for (var i = 0; i < data.length; i+=4) {
                      var obj = {
                        id: '',
                        timestamp: new Date(data[i]),
                        station_value: Number(data[i+1]),
                        raster_value: Number(data[i+2]),
                        difference: Number(data[i+3])
                      };
                      parsed_data.push(obj);
                    }
                    parsed_data = _.sortBy(parsed_data, function(i){return i.timestamp;});

                    $("#pickingresults").show();

                    $("#pickingresults").append('<div id="collections" style="white-space: pre;position: absolute;bottom: 2px; left: 60px;">'+collection_id+'</div>');
                    $("#pickingresults").append('<div id="pickingresultcontainer"></div>');

                    var args = {
                      scatterEl: $('#pickingresultcontainer')[0],
                      selection_x: "timestamp",
                      selection_y: ["difference"],
                      showDropDownSelection: true,
                      renderBlocks: false,
                      lineConnections: true,
                      margin: {top: 45, right: 20, bottom: 30, left: 60}
                    };

                    var sp = new scatterPlot(args, function(){},
                      function (values) {}, 
                      function(){},
                      function(filter){}
                    );

                    sp.loadData({parsedData: parsed_data});
                    

                    $("#pickingresults").append('<button type="button" id="pickingresultsClose" class="close" style="margin-right:5px; margin-top:5px;top: 0px;position: absolute;right: 0px;"><i class="fa fa-times-circle"></i></button>');
                    $('#pickingresultsClose').click(function(){
                      $("#pickingresults").hide();
                      $("#pickingresults").empty();
                    });



                    $("#pickingresults").append(
                      '<a href="javascript:void(0)" id="enlarge" style="position: absolute;top:5px;left:5px">'+
                        '<i style="font-size:1.5em;" class="fa fa-expand fa-rotate-90"></i></a>'
                      );

                    $('#enlarge').click(function (evt) {
                      if ($('#pickingresults').hasClass("big")){
                        $('#pickingresults').width("30%");
                        $('#pickingresults').height("30%");
                        $('#pickingresults').resize();
                        $('#pickingresults').removeClass("big");
                      }else{
                        $('#pickingresults').addClass( "big" )
                        $('#pickingresults').width("50%");
                        $('#pickingresults').height("70%");
                        $('#pickingresults').resize();
                      }
                      
                    });
                  }
                }
              });

            }else{
              $("#error-messages").append(
                '<div class="alert alert-warning alert-danger">'+
                  '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>'+
                  '<strong>Info:</strong> Please make sure an area of interest has been selected with the bounding box tool.' +
                '</div>'
              );
            }

          }else{
            $("#error-messages").append(
              '<div class="alert alert-warning alert-danger">'+
                '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>'+
                '<strong>Info:</strong> Please make sure (only) one appropiate collection has been selected from the Layers menu before executing this process.' +
              '</div>'
            );
          }
        });


        $('#SpatialCorrelation2d').click(function(){
          var sels = Communicator.reqres.request('selections:get:all');

          // TODO: Process only for one product
          if(sels.actProd.length == 2){

            if (sels.geo){

              var current_products = [];

              globals.products.each(function(product) {
                if($.inArray(product.get('download').id, sels.actProd)!=-1){
                  current_products.push(product.get('process_id'));
                }
              });

              var collection_id = current_products[0];
              var o_collection_id = current_products[1];


              var options = {
                wps_process: 'execute_assessment',
                process: 'correlation',
                collection: collection_id,
                o_collection: o_collection_id,
                left: sels.geo.w,
                right: sels.geo.e,
                top: sels.geo.n,
                bottom: sels.geo.s,
                start_time: Math.round(sels.time.start.getTime()/1000),
                end_time: Math.round(sels.time.end.getTime()/1000)
              };

              var req_data = Tmpl_wps_pep_execute(options);

              $.ajax({
                type: "POST",
                url: that.wps_url,
                //dataType: "xml",
                data: req_data,
                success: function(resp_data) {

                  var data = resp_data.replace(/[&\/\,+()\[\]\n']/g, '').split(" ");
                  if(data[0]!=""){
                    var parsed_data = [];

                    for (var i = 0; i < data.length; i+=6) {
                      var obj = {
                        id: '',
                        start_date: new Date(data[i]),
                        end_date: new Date(data[i+1]),
                        average_bias: Number(data[i+2]),
                        rms: Number(data[i+3]),
                        min_diff: Number(data[i+4]),
                        max_diff: Number(data[i+5])
                      };
                      parsed_data.push(obj);
                    }

                    $("#pickingresults").show();

                    $("#pickingresults").append('<div id="collections" style="white-space: pre;position: absolute;bottom: 2px; left: 60px;">'+collection_id+';\n'+o_collection_id+'</div>');
                    $("#pickingresults").append('<div id="pickingresultcontainer"></div>');

                    var args = {
                      scatterEl: $('#pickingresultcontainer')[0],
                      selection_x: "start_date",
                      selection_y: ["average_bias", "rms", "min_diff", "max_diff"],
                      showDropDownSelection: true,
                      renderBlocks: false,
                      lineConnections: true,
                      margin: {top: 45, right: 20, bottom: 30, left: 60}
                    };

                    var sp = new scatterPlot(args, function(){},
                      function (values) {}, 
                      function(){},
                      function(filter){}
                    );

                    sp.loadData({parsedData: parsed_data});
                    

                    $("#pickingresults").append('<button type="button" id="pickingresultsClose" class="close" style="margin-right:5px; margin-top:5px;top: 0px;position: absolute;right: 0px;"><i class="fa fa-times-circle"></i></button>');
                    $('#pickingresultsClose').click(function(){
                      $("#pickingresults").hide();
                      $("#pickingresults").empty();
                    });



                    $("#pickingresults").append(
                      '<a href="javascript:void(0)" id="enlarge" style="position: absolute;top:5px;left:5px">'+
                        '<i style="font-size:1.5em;" class="fa fa-expand fa-rotate-90"></i></a>'
                      );

                    $('#enlarge').click(function (evt) {
                      if ($('#pickingresults').hasClass("big")){
                        $('#pickingresults').width("30%");
                        $('#pickingresults').height("30%");
                        $('#pickingresults').resize();
                        $('#pickingresults').removeClass("big");
                      }else{
                        $('#pickingresults').addClass( "big" )
                        $('#pickingresults').width("50%");
                        $('#pickingresults').height("70%");
                        $('#pickingresults').resize();
                      }
                      
                    });
                  }
                }
              });

            }else{
              $("#error-messages").append(
                '<div class="alert alert-warning alert-danger">'+
                  '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>'+
                  '<strong>Info:</strong> Please make sure an area of interest has been selected with the bounding box tool.' +
                '</div>'
              );
            }

          }else{
            $("#error-messages").append(
              '<div class="alert alert-warning alert-danger">'+
                '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>'+
                '<strong>Info:</strong> Please make sure (exactly) two appropiate collections have been selected from the Layers menu before executing this process.' +
              '</div>'
            );
          }
        });

     

      },

      sendRequest: function(args){

      },

      onClose: function() {
        //Communicator.mediator.trigger("ui:close", "download");
        this.close();
      }

    });
    return {'ProcessesView':ProcessesView};
  });
}).call( this );