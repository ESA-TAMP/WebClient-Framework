(function() {
    'use strict';

    var root = this;

    root.define([
        'backbone',
        'communicator',
        'hbs!tmpl/ProcessManagement',
        'hbs!tmpl/pmmForm',
        'app',
        'globals',
        'underscore',
        'datetimepicker'
    ],

    function( Backbone, Communicator, ProcessManagementTmpl, pmmFormTmpl, App, globals ) {

        var ProcessManagementLayout = Backbone.Marionette.Layout.extend({

            template: {type: 'handlebars', template: ProcessManagementTmpl},
            regions: {
                processList: '#processList'
            },
            className: 'panel panel-default datamanagement not-selectable',

            onShow: function(view){
                this.$('.close').on('click', _.bind(this.onClose, this));
                this.$el.draggable({
                    handle: '.panel-heading',
                    containment: '#main' ,
                    scroll: false,
                    start: function(event, ui) {
                        $( '.ui-slider' ).detach();
                        $('.fa-adjust').toggleClass('active')
                        $('.fa-adjust').popover('hide');
                    },
                });

                var that = this;
                $('#selectioncontainer').empty();
                var container = $('#selectioncontainer');
                var selNode = $('<select>');
                selNode.attr('id', 'processSelection');
                selNode.attr('name', 'processSelection');
                selNode.append('<option value="pmm" selected="true">PMM</option>');
                //selNode.append('<option value="process2">process2</option>');
                var selLabel = $('<label>Select process</label>');
                selLabel.attr('class', 'processlabel');
                selLabel.attr('for', 'processSelection');
                container.append(selNode);
                container.append(selLabel);
                this.renderProcessOptions('pmm');
                selNode.on('change', function(){
                    var processId = $(this).children('option:selected').val();
                    that.renderProcessOptions(processId);
                });
            },

            renderProcessOptions(processId){
                console.log(processId);
                $('#processcontainer').empty();
                switch(processId){
                case 'pmm':
                    $('#processcontainer').append(pmmFormTmpl({
                        collections: true,
                        resolution: true,
                        projection: true,
                        bbox: true,
                        timerange_start: true,
                        timerange_end: true,
                        prefix: true,
                        timeaggre_start: true,
                        timeaggre_end: true
                    }));
                    break;
                }

                // Add datepicker widget for date fields
                //var date_input=$('input[name="date"]'); //our date input has the name "date"
                //var container=$('.bootstrap-iso form').length>0 ? $('.bootstrap-iso form').parent() : "body";

                $.datetimepicker.setDateFormatter({
                    parseDate: function (date, format) {
                        console.log(format);
                        var d = new Date(date);
                        return d.isValid() ? d.toDate() : false;
                    },
                    
                    formatDate: function (date, format) {
                        if(format === 'ISO8601'){
                            date.setSeconds(0);
                            return getISODateTimeString(date);
                        } else {
                            return date.getUTCHours()+':0'+date.getUTCMinutes();
                        }
                    }
                });


                this.$('.datefield').datetimepicker({
                    format: 'ISO8601'
                });


                var baseprocessingURL = 'https://wps-eo4sdcr.adamplatform.eu/wps/wps?';
                baseprocessingURL+='service=WPS&version=2.0.0&request=execute&Identifier=pmm&storeExecuteResponse=true&status=true&datainputs=';

                'collections=XXXX;resolution=0.1;projection=latlon;bbox=-5.1,31.2,-13.3,39.4;timerange=2010-10-01T00:00:00,2010-10-31T23:59:59;prefix=test_;timeaggre=2018-06-01T00:00:00,2018-06-04T00:00:00,2018-06-08T00:00:00,2018-06-12T00:00:00'


            },

            onClose: function() {
                this.close();
            }

        });

        return ProcessManagementLayout;

    });

}).call( this );
