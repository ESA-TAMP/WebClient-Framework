(function() {
  'use strict';

  var root = this;
  root.define([
    'backbone',
    'communicator',
    'globals',
    'hbs!tmpl/Processes',
    'hbs!tmpl/wps_pep_execute',
    'underscore',
    'plotty',
    'geotiff',
    'libcoverage'
  ],
  function( Backbone, Communicator, globals, TmplProcesses, Tmpl_wps_pep_execute ) {

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
        this.wps_url = "http://vtdas-dave.zamg.ac.at/davprc/ows?";
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

        this.$el.find(".panel-body").append('<button type="button" id="calculateSpatialAverage" class="btn btn-success" style="width:100%;">Calculate Spatial Average</button>');
        this.$el.find(".panel-body").append('<button type="button" id="calculateTemporalAverage" class="btn btn-success" style="width:100%;">Calculate Temporal Average</button>');

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
                process: 'spatialAverage',
                collection: collection_id,
                left: sels.geo.w,
                right: sels.geo.e,
                top: sels.geo.n,
                bottom: sels.geo.s,
                start_time: sels.time.start.getTime()/1000,
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
                  /*$("#pickingresults").show();
                  $("#pickingresults").empty();
                  
                  $("#pickingresults").append('<div style="width: 100%; height: 100%; margin:20px;" id="prcontainer"></div>');

                  resp_data = resp_data.slice(2,-1);
                  resp_data = resp_data.replace(/\]/g, "");
                  var resp_array = resp_data.split('[');
                  var height = resp_array.length;
                  var min = 999999999999999999999;
                  var max = -99999999999999999999;
                  for (var i = resp_array.length - 1; i >= 0; i--) {
                    resp_array[i] = resp_array[i].split(/[\ ,\n]+/).map(Number);

                    var t_min = d3.min(resp_array[i]);
                    if (min > t_min){
                      min = t_min;
                    }
                    var t_max = d3.max(resp_array[i]);
                    if (max < t_max){
                      max = t_max;
                    }

                  }

                  var width = resp_array[0].length;

                  if(resp_array[resp_array.length-1].length != width){
                    resp_array[resp_array.length-1].push(0.0);
                  }

                  //var render_data = Float32Array.from(_.flatten(resp_array)); 
                  var render_data = new Float32Array(_.flatten(resp_array));

                  that.p_plot.setData(render_data, width, height);
                  that.p_plot.setDomain([min,max]);
                  that.p_plot.setClamp(true,true);
                  that.p_plot.render();
                  var image = that.p_plot.canvas.toDataURL();
                  //window.open(image,'_blank');

                  var $img = $("<img/>");
                  $img.attr("src", image);
                  $img.attr("style", "width:100%; height:100%; position:absolute;padding-right: 40px;padding-bottom: 40px;");
                  $("#prcontainer").append($img);

                  $("#pickingresults").append('<button type="button" id="pickingresultsClose" class="close" style="position:absolute;right:5px; top:5px;"><i class="fa fa-times-circle"></i></button>');

                  $('#pickingresultsClose').click(function(){
                    $("#pickingresults").hide();
                    $("#pickingresults").empty();
                  });
                  */
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