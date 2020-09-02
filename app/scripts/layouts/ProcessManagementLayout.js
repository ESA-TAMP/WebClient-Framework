(function() {
    'use strict';

    var root = this;

    root.define([
        'backbone',
        'communicator',
        'hbs!tmpl/ProcessManagement',
        'hbs!tmpl/pmmForm',
        'hbs!tmpl/kvp_template',
        'app',
        'globals',
        'underscore',
        'datetimepicker'
    ],

    function( Backbone, Communicator, ProcessManagementTmpl, pmmFormTmpl, kvpTmpl, App, globals ) {

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

            renderProcessOptions: function(processId){
                var options = {
                    prefix: 'myColl'+Math.floor(Math.random()*100),
                    resolution: '0.1'
                };
                
                var activecollections = globals.products.filter(function(item){
                    return item.get('visible') && !item.get('groundMeasurements');
                });
                
                $('#processcontainer').empty();
                switch(processId){
                case 'pmm':
                    if (activecollections.length>0){
                        options.collections = activecollections.map(
                            function(m){return m.get('id');}
                        ).join(',');
                    } else {
                        options.collections = '';
                    }

                    var sels = Communicator.reqres.request('selections:get:all');

                    var sel_time = sels.time;
                    options.timerange_start = getISODateTimeString(sel_time.start)
                        .replace('T', ' ').slice(0,-4);
                    options.timerange_end = getISODateTimeString(sel_time.end)
                        .replace('T', ' ').slice(0,-4);

                    // Get current bbox
                    var bbox = sels.geo;
                    //[top-left.lat, top-left.lon, bottom-right.lat, bottom-right.lon]
                    var bboxstring = '90,-180,-90,180';
                    if(bbox !== null){
                        bboxstring = 
                            bbox.n.toFixed(3)+','+
                            bbox.w.toFixed(3)+','+
                            bbox.s.toFixed(3)+','+
                            bbox.e.toFixed(3);
                    }
                    options.bbox = bboxstring;

                    $('#processcontainer').append(pmmFormTmpl(options));
                    break;
                }

                // Add datepicker widget for date fields
                //var date_input=$('input[name="date"]'); //our date input has the name "date"
                //var container=$('.bootstrap-iso form').length>0 ? $('.bootstrap-iso form').parent() : "body";

                /*$.datetimepicker.setDateFormatter({
                    parseDate: function (date, format) {
                        var d = new Date(date);
                        return date instanceof Date ? d : false;
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
*/

                $('.datefield').datetimepicker({
                    //format: 'ISO8601',
                    format:'Y-m-d H:i',
                    /*onChangeDateTime:function(dp,$input){
                        console.log($input.val());
                        console.log($input);
                    }*/
                });

                var baseprocessingURL = 'https://amida-wcs.adamplatform.eu/wps/wps?';
                baseprocessingURL+='service=WPS&version=2.0.0&request=execute&Identifier=pmm_test&storeExecuteResponse=true&status=true&datainputs=';

                if(typeof USERVARIABLE !== 'undefined'){
                    baseprocessingURL+='user='+USERVARIABLE+';';
                }

                $('#processForm').submit(function(e){
                    e.preventDefault();
                });

                $('#startProcess').click(function(e){
                    var form = document.getElementById('processForm');
                    form.classList.add('was-validated');
                    if (form.checkValidity() === true) {
                        var inputs = {};
                        $('form#processForm :input').each(function(){
                            inputs[$(this).attr('id')] = $(this).val();
                        });
                        var startDate, endDate;
                        // Reformat specific fields
                        if(inputs.hasOwnProperty('timerange_start') && inputs.hasOwnProperty('timerange_end')){
                            startDate = new Date(inputs.timerange_start);
                            endDate = new Date(inputs.timerange_end);
                            var start = getISODateTimeString(startDate).slice(0,-1);
                            var end = getISODateTimeString(endDate).slice(0,-1);
                            inputs.timerange = start+','+end;
                            delete inputs.timerange_start;
                            delete inputs.timerange_end;
                        }
                        // Check if timeaggre is being used
                        if(inputs.hasOwnProperty('timeaggre')){
                            var aggreSel = inputs.timeaggre;
                            var timeaggrelist = '';
                            var currentStep = new Date(startDate);
                            switch (aggreSel) {
                            case 'noaggre':
                                break;
                            case 'weekly':
                                while(endDate.getTime()>currentStep.getTime()){
                                    currentStep = new Date(currentStep);
                                    timeaggrelist += (getISODateTimeString(currentStep).slice(0,-1)+',');
                                    currentStep.setDate(currentStep.getDate() + 7);
                                }
                                timeaggrelist += getISODateTimeString(endDate).slice(0,-1);
                                break;
                            case 'daily':
                                while(endDate.getTime()>currentStep.getTime()){
                                    currentStep = new Date(currentStep);
                                    timeaggrelist += (getISODateTimeString(currentStep).slice(0,-1)+',');
                                    currentStep.setDate(currentStep.getDate() + 1);
                                }
                                timeaggrelist += getISODateTimeString(endDate).slice(0,-1);
                                break;
                            case 'halfdaily':
                                while(endDate.getTime()>currentStep.getTime()){
                                    currentStep = new Date(currentStep);
                                    timeaggrelist += (getISODateTimeString(currentStep).slice(0,-1)+',');
                                    currentStep.setHours(currentStep.getHours() + 12);
                                }
                                timeaggrelist += getISODateTimeString(endDate).slice(0,-1);
                                break;
                            case 'hourly':
                                while(endDate.getTime()>currentStep.getTime()){
                                    currentStep = new Date(currentStep);
                                    timeaggrelist += (getISODateTimeString(currentStep).slice(0,-1)+',');
                                    currentStep.setHours(currentStep.getHours() + 1);
                                }
                                timeaggrelist += getISODateTimeString(endDate).slice(0,-1);
                                break;
                            }
                            // Overwrite timeaggre selection with computed time
                            // ranges list
                            if(timeaggrelist === ''){
                                delete inputs.timeaggre;
                            } else {
                                inputs.timeaggre = timeaggrelist;
                            }
                        }
                        // Check for selected projection
                        inputs.projection = $( '#projection option:selected' ).val();
                        var url = baseprocessingURL + kvpTmpl({values: inputs});
                        $('#startProcess').attr('disabled', true);
                        $.get(url)
                            .done(function(){
                                $('#processForm').append('<label id="requestlabel" for="startProcess" class="getstatuslabel success">Request sent successfully</label>');
                                setTimeout(function(){
                                    $('#requestlabel').remove();
                                    $('#startProcess').attr('disabled', false);
                                }, 10000);
                            })
                            .error(function(){
                                $('#processForm').append('<label id="requestlabel" for="startProcess" class="getstatuslabel failed">Error sending request</label>');
                                setTimeout(function(){
                                    $('#requestlabel').remove();
                                    $('#startProcess').attr('disabled', false);
                                }, 10000);
                            });
                    }
                    
                    //var processRequest = baseprocessingURL;
                    //$.get()
                });


            },

            onClose: function() {
                this.close();
            }

        });

        return ProcessManagementLayout;

    });

}).call( this );