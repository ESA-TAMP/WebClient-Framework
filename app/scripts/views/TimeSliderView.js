(function() {
  'use strict';
  var root = this;
  root.define([
    'backbone',
    'communicator',
    'timeslider',
    'globals',
    'underscore',
    'd3'
  ],
  function( Backbone, Communicator, timeslider, globals) {
    var TimeSliderView = Backbone.Marionette.ItemView.extend({
      id: 'timeslider',
      events: {
        'selectionChanged': 'onChangeTime',
        'coverageselected': 'onCoverageSelected',
        'displayChanged': 'onDisplayChanged'
      },
      initialize: function(options){
        this.options = options;
        this.bbox = null;

        TimeSlider.prototype.setTimetick = function (date){

          this.svg.selectAll('.timetick').remove();
          if(date === null){
            return;
          }
          var tick = this.svg.selectAll('.timetick').data([date]);
          var that = this;
          tick.enter().append('rect')
            .attr('class', 'timetick')
            .attr('x', function(a){
              return that.scales.x(a);
            })
            .attr('y', 0 )
            .attr('width', 1 )
            .attr('height', (this.options.height-20))
            .attr('stroke', 'red')
            .attr('stroke-width', 1)
            .attr('fill', '#f00');

            tick.exit().remove();
        }

      },

      render: function(options){

      },
      onShow: function(view) {

        this.listenTo(Communicator.mediator, "map:layer:change", this.changeLayer);
        this.listenTo(Communicator.mediator, "map:position:change", this.updateExtent);
        this.listenTo(Communicator.mediator, "date:selection:change", this.onDateSelectionChange);
        this.listenTo(Communicator.mediator, "date:tick:select", this.onTickSelected);
        this.listenTo(Communicator.mediator, "date:center", this.onDateCenter);
        this.listenTo(Communicator.mediator, "selection:changed", this.onBBoxSelectionChanged);
        

        Communicator.reqres.setHandler('get:time', this.returnTime);

        // Try to get CSRF token, if available set it for necesary ajax requests

        this.csrftoken = false;
        var name = 'csrftoken';
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    this.csrftoken = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }

        var selectionstart, selectionend;

        if(localStorage.getItem('timeSelection')){
            var time = JSON.parse(localStorage.getItem('timeSelection'));
            selectionstart = new Date(time[0]);
            selectionend = new Date(time[1]);
        }else{
            // If time not in localstorage use default of current date
            // minus 12 hours
            selectionstart = new Date();
            selectionstart.setUTCHours(selectionstart.getUTCHours() - (24*14));

            selectionend = new Date(selectionstart.getTime());
            selectionend.setUTCHours(selectionend.getUTCHours() + 1);

        }

        var domainStart, domainEnd;
        if(localStorage.getItem('timeDomain')){
            var domain = JSON.parse(localStorage.getItem('timeDomain'));
            domainStart = new Date(domain[0]);
            domainEnd = new Date(domain[1]);
        }else{
            domainStart = new Date();
            domainStart.setUTCHours(domainStart.getUTCHours() - (24*16));

            domainEnd = new Date();
            domainEnd.setUTCHours(domainEnd.getUTCHours() + (24*3));

        }

        this.activeWPSproducts = [];


        var initopt = {
            domain: {
                start: new Date(this.options.domain.start),
                end: new Date(this.options.domain.end)
            },
            display: {
                start: domainStart,
                end: domainEnd
            },
            brush: {
                start: selectionstart,
                end: selectionend
            },
            debounce: 300,
            ticksize: 8,
            datasets: []
        };

        /*if (this.options.display){
          initopt["display"] = {
            start: new Date(this.options.display.start),
            end: new Date(this.options.display.end)
          };
        }*/

        this.slider = new TimeSlider(this.el, initopt);

        this.slider.setBrushTooltip(true);
        this.slider.setBrushTooltipOffset([
          -30,
          (this.el.parentElement.parentElement.offsetHeight - this.el.parentElement.offsetHeight*2 - 50)
        ]);

        $(this.el).append(
            '<div type="button" class="btn btn-success darkbutton" id="calendarselection"><i class="fa fa-calendar" aria-hidden="true"></i></div>'
        );
         $(this.el).append('<div id="calendarwidgetholder"></div>');

         var that = this;

        // Initialise datepickers
        $.datepicker.setDefaults({
            showOn: 'both',
            dateFormat: 'dd.mm.yy',
            changeYear: true,
            yearRange: '-25:+5',
        });

        var datepickerWidget = this.$('#calendarwidgetholder').datepicker({
            onSelect: function() {
                var date = datepickerWidget.datepicker('getDate');
                var beginTime = new Date(Date.UTC(
                    date.getFullYear(), date.getMonth(), date.getDate(),
                    date.getHours(),date.getMinutes(), date.getSeconds())
                );
                beginTime.setDate(beginTime.getDate() - 1);
                beginTime.setUTCHours(22,0,0,0);

                var endTime = new Date(Date.UTC(
                    date.getFullYear(), date.getMonth(), date.getDate(),
                    date.getHours(),date.getMinutes(), date.getSeconds())
                );
                endTime.setDate(endTime.getDate() + 1);
                endTime.setUTCHours(2,0,0,0);

                that.slider.center(beginTime, endTime);
                $('#calendarwidgetholder').hide();

                var  tos = Communicator.mediator.timeOfInterest;

                var startSelection = new Date(Date.UTC(
                    date.getFullYear(), date.getMonth(), date.getDate(),
                    tos.start.getUTCHours(),tos.start.getMinutes(),
                    tos.start.getSeconds(), tos.start.getMilliseconds()
                ));

                var endSelection = new Date(Date.UTC(
                    date.getFullYear(), date.getMonth(), date.getDate(),
                    tos.end.getUTCHours(),tos.end.getMinutes(),
                    tos.end.getSeconds(), tos.end.getMilliseconds()
                ));

                var diff = (tos.end.getDate() - tos.start.getDate());
                // If more then one day is selected limit end time to end of day
                if (diff>=1){
                  endSelection.setUTCHours(23,59,59,999);
                }
                
                that.slider.select(startSelection, endSelection);

                var domain = that.slider.scales.x.domain();
                Communicator.mediator.trigger(
                    'time:domain:change', 
                    {start: domain[0], end: domain[1]}
                );
            }
        });

        datepickerWidget.datepicker('setDate', selectionstart);
        this.$('#calendarwidgetholder').hide();

        $('#calendarselection').click(function(){
            if($('#calendarwidgetholder').is(':visible') ){
                $('#calendarwidgetholder').hide();
            }else{
                $('#calendarwidgetholder').show();
            }
        });
        $('.timeslider .brush').attr('fill', '#333');

        Communicator.mediator.trigger('time:change', {start:selectionstart, end:selectionend});

        // For viewers that are loaded after the TimeSlider announces its initial timespan there
        // has to be a way to get the timespan for their setup. This is a 'sloppy' way of 
        // accomplishing this:
        Communicator.mediator.timeOfInterest = {
          start: selectionstart,
          end: selectionend
        };
      }, 

      onChangeTime: function(evt){
        Communicator.mediator.trigger('time:change', evt.originalEvent.detail);
        // Update ToI in the global context:
        Communicator.mediator.timeOfInterest = {
          start: evt.originalEvent.detail.start,
          end: evt.originalEvent.detail.end
        };
      },

      onDisplayChanged: function(evt){
          Communicator.mediator.trigger('time:domain:change', evt.originalEvent.detail);
      },

      onDateCenter: function(range){;
        this.slider.center(range[0], range[1]);
      },

      onBBoxSelectionChanged: function(bbox){
        this.bbox = bbox;

        for (var i = 0; i <  this.activeWPSproducts.length; i++) {
          var currId = this.activeWPSproducts[i];
          var product = globals.products.find(function(model) {
            return model.get('download').id === currId;
          });

          // Deactivate and activate all active wps layers in timeslider
          this.changeLayer({
            isBaseLayer: false,
            visible: false,
            name: product.get('name')
          });

          this.changeLayer({
            isBaseLayer: false,
            visible: true,
            name: product.get('name')
          });
        }
      },

      onDateSelectionChange: function(opt) {
        this.slider.select(opt.start, opt.end);
      },

      onTickSelected: function(date){
        this.slider.setTimetick(date);
      },

      fetch: function(start, end, params, callback){
          var request =  this.url + '?service=wps&request=execute&version=1.0.0&identifier=get_indices&DataInputs=index_id='+
              this.id + ';begin_time='+getISODateTimeString(start)+ ';end_time='+getISODateTimeString(end)+'&RawDataOutput=output';

          d3.csv(request)
              .row(function (row) {
                  return [new Date(row.time), Number(row.value), row.id];
              })
              .get(function(error, rows) { 
                  callback(rows);
              });
      },

      fetchKVP: function(start, end, params, callback){
        var currId = this.id;
        var product = globals.products.find(function(model) {
          return model.get('download').id === currId;
        });
        var rows = [[
          product.get('timeRange')[0],
          product.get('timeRange')[1],
          { id: currId }
        ]];
        callback(rows);
      },


      fetchWPS: function(start, end, params, callback){

          var request = 
            this.url+'pycsw/pycsw/csw.py?mode=opensearch'+
            '&service=CSW&version=2.0.2&request=GetRecords&elementsetname=brief'+
            '&typenames=csw:Record&resulttype=results'+
            '&time='+getISODateTimeString(start)+'/'+getISODateTimeString(end)+
            '&q='+this.id+
            '&maxrecords=500'+
            '&outputFormat=application/json';

          if (this.bbox !== null){
            var b = this.bbox;
            request += '&bbox='+b.w+','+b.n+','+b.e+','+b.s;
          }

          var identifier = this.id;

          $.get(request)
            .success(function(resp) {

              var rows = [];
              if(resp.hasOwnProperty('atom:feed') && resp['atom:feed'].hasOwnProperty('atom:entry')){
                var entries = resp['atom:feed']['atom:entry'];
                if(typeof entries !== 'undefined'){
                  if(!Array.isArray(entries)){
                    entries = [entries];
                  }
                  for( var ee=0; ee<entries.length; ee++ ){
                    var bboxCont = entries[ee]['http://www.georss.org/georss:where']['gml:Envelope'];
                    var lowCorn = bboxCont['gml:lowerCorner'].split(' ').map(parseFloat);
                    var upperCorn = bboxCont['gml:upperCorner'].split(' ').map(parseFloat);
                    var id = entries[ee]['atom:title'];
                    var summ = entries[ee]['atom:summary'];
                    var hasEndTime = false;
                    var wcsEndpoint = entries[ee]['atom:source'];
                    if(summ.indexOf('<strong>End</strong>') !== -1){
                      hasEndTime = true;
                    }
                    // Replace all tags of summary with white spaces and then
                    // split by whitespaces, leaving is necessary information
                    var spl = summ.replace(/ *\<[^>]*\> */g, " ").split(/[\s]+/);
                    var start = new Date(spl[7]);
                    var end = start;
                    if(hasEndTime){
                      end = new Date(spl[9]);
                    }
                    var id = spl[2];



                    if(identifier.indexOf('QA_VALUE') !== -1 || id.indexOf('QA_VALUE') === -1){
                      rows.push([
                            start,
                            start, //end,
                            {
                                id: id,
                                bbox: [lowCorn[1], lowCorn[0], upperCorn[1], upperCorn[0]]
                            }
                      ]);
                    }
                  }
                  callback(rows);
                }
              }

            });
      },



      changeLayer: function (options) {
        if (!options.isBaseLayer){
          var product = globals.products.find(function(model) {
            return model.get('name') == options.name;
          });
          if (product){
            if(options.visible && product.get('timeSlider')){
              var attrs;
              switch (product.get("timeSliderProtocol")){
                case "WMS":
                  this.slider.addDataset({
                    id: product.get('view').id,
                    color: product.get('color'),
                    data: new TimeSlider.Plugin.WMS({
                      url: product.get('view').urls[0],
                      eoid: product.get('view').id,
                      dataset: product.get('view').id
                    })
                  });
                  break;
                case "EOWCS":
                  this.slider.addDataset({
                    id: product.get('download').id,
                    color: product.get('color'),
                    data: new TimeSlider.Plugin.EOWCS({
                        url: product.get('download').url,
                        eoid: product.get('download').id,
                        dataset: product.get('download').id
                     })
                  });
                  break;
                case "WPS":
                  attrs = {
                    id: product.get('download').id,
                    url: product.get('provider'),
                    bbox: this.bbox
                  };
                  
                  this.slider.addDataset({
                    id: product.get('download').id,
                    color: product.get('color'),
                    records: null,
                    source: {fetch: this.fetchWPS.bind(attrs)}
                  });
                  this.activeWPSproducts.push(product.get('download').id);
                  // For some reason updateBBox is needed, altough bbox it is initialized already.
                  // Withouth this update the first time activating a layer after the first map move
                  // the bbox doesnt seem to be defined in the timeslider library and the points shown are wrong
                  //this.slider.updateBBox([extent.left, extent.bottom, extent.right, extent.top], product.get('download').id);
                  break;
                case "INDEX":
                  attrs = {
                    id: product.get('download').id,
                    url: product.get('download').url
                  };
                  this.slider.addDataset({
                    id: product.get('download').id,
                    color: product.get('color'),
                    lineplot: true,
                    records: null,
                    source: {fetch: this.fetch.bind(attrs)}
                  });
                  break;
                case "KVP":
                  attrs = {
                    id: product.get('download').id,
                    url: product.get('download').url
                  };
                  this.slider.addDataset({
                    id: product.get('download').id,
                    color: product.get('color'),
                    records: null,
                    source: {fetch: this.fetchKVP.bind(attrs)}
                  });
                  break;
              }
              
            }else{
              this.slider.removeDataset(product.get('download').id);
              if (this.activeWPSproducts.indexOf(product.get('download').id)!=-1)
                this.activeWPSproducts.splice(this.activeWPSproducts.indexOf(product.get('download').id), 1);
              //console.log(this.activeWPSproducts);
            }
          }
        }
      },

      returnTime: function(){
        return Communicator.mediator.timeOfInterest;
      },

      updateExtent: function(extent){
        
        for (var i=0; i<this.activeWPSproducts.length; i++){
          //console.log(this.activeWPSproducts[i]);
          //this.slider.updateBBox([extent.left, extent.bottom, extent.right, extent.top], this.activeWPSproducts[i]);
        }
      },

      onCoverageSelected: function(evt){
        if (evt.originalEvent.detail.bbox){
          var bbox = evt.originalEvent.detail.bbox.replace(/[()]/g,'').split(',').map(parseFloat);
          this.slider.select(evt.originalEvent.detail.start, evt.originalEvent.detail.end);
          Communicator.mediator.trigger("map:set:extent", bbox);
        }
      }

      //

    });
    return {'TimeSliderView':TimeSliderView};
  });
}).call( this );