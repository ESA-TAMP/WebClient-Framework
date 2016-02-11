(function() {
  'use strict';

  var root = this;
  root.define([
    'backbone',
    'communicator',
    'globals',
    'hbs!tmpl/Processes',
    'hbs!tmpl/wcs_calculate_average',
    'hbs!tmpl/wps_pep_spatial_average',
    'hbs!tmpl/wps_pep_temporal_average',
    'underscore',
    'libcoverage'
  ],
  function( Backbone, Communicator, globals, TmplProcesses, TmplWCS_calc_avg,
            Tmpl_wps_pep_spatial_average, Tmpl_wps_pep_temporal_average ) {

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
      },

      onShow: function(view){

        this.$('.close').on("click", _.bind(this.onClose, this));
        this.$el.draggable({
          containment: "#content",
          scroll: false,
          handle: '.panel-heading'
        });

        var that = this;

        this.$el.find(".panel-body").append('<button type="button" id="calculateSpatialAverage" class="btn btn-success" style="width:100%;">Calculate Spatial Average</button>');
        this.$el.find(".panel-body").append('<button type="button" id="calculateTemporalAverage" class="btn btn-success" style="width:100%;">Calculate Temporal Average</button>');

        $('#calculateSpatialAverage').click(function(){
          var sels = Communicator.reqres.request('selections:get:all');
          if(sels.actProd.length>0){
            if (sels.geo){

              var collection_id = 'ALARO_Surface_pressure_surface_4326_0059882';

              var req_data = Tmpl_wps_pep_spatial_average({
                left: sels.geo.left,
                right: sels.geo.right,
                top: sels.geo.top,
                bottom: sels.geo.bottom,
                begin_time: sels.time.start.getTime()/1000,
                //end_time: sels.time.end.getTime()/1000,
                collection_id: collection_id
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
          if(sels.actProd.length>0){
            if (sels.geo){

              var collection_id = 'ALARO_Surface_pressure_surface_4326_0059882';

              var req_data = Tmpl_wps_pep_temporal_average({
                left: sels.geo.left,
                right: sels.geo.right,
                top: sels.geo.top,
                bottom: sels.geo.bottom,
                begin_time: Math.round(sels.time.start.getTime()/1000),
                end_time: Math.round(sels.time.end.getTime()/1000),
                collection_id: collection_id
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

     

      },

      onClose: function() {
        //Communicator.mediator.trigger("ui:close", "download");
        this.close();
      }

    });
    return {'ProcessesView':ProcessesView};
  });
}).call( this );