/*******************************************************************************
 *  Code contributed to the webinos project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Copyright 2013 Istituto Superiore Mario Boella (IT)
 * Author: Paolo Vergori (ISMB), Michele Morello (ISMB)
 ******************************************************************************/

var geoServices = {};
geoServices.serviceArray = [];
geoServices.service = null;
geoServices.map = null;
geoServices.currentIndex = 0;
geoServices.watchId = null;


function findPZHs() {
    //logWebinos();
    $('#pzhList').empty();
    $('#pzpList').empty();
    for(var i=0;i<webinos.session.getConnectedDevices().length;i++)
        $('#pzhList').append($('<option id="' + webinos.session.getConnectedDevices()[i].id + '">' + webinos.session.getConnectedDevices()[i].id.replace(/[^_]*_/gi, '').replace(/\/[A-Za-z0-9]*$/gi, '') + '</option>'));       
    $('#pzhList').append($('<option id="' + webinos.session.getPZHId() + '">' + webinos.session.getPZPId().replace(/[^_]*_/gi, '').replace(/\/[A-Za-z0-9]*$/gi, '') + '</option>'));
}


function findGeolocationServices() {
    $('#pzpList').empty();
    geoServices.serviceArray = [];
    geoServices.service = 0;
    webinos.discovery.findServices(new ServiceType('http://www.w3.org/ns/api-perms/geolocation'), {
        onFound: function (service){
             if(service.serviceAddress.lastIndexOf($('#pzhList')[0].selectedOptions[0].id)!=-1){
                geoServices.serviceArray[service.serviceAddress]=service;
                $('#pzpList').append($('<option id="' + service.serviceAddress +'">' + service.serviceAddress.replace(/[^]*\//gi, '') + '</option>'));    
             }
        }
    });
}


function bindService() {
//     console.log("***********");
//     console.log($('#pzpList option:selected')[0].id);
//     console.log(geoServices.serviceArray[$('#pzpList option:selected')[0].id]);
//     console.log(geoServices.serviceArray);   
//     console.log("***********");
    try{
        geoServices.service = geoServices.serviceArray[$('#pzpList option:selected')[0].id];
        geoServices.service.bindService({
            onBind: function (service){
                debugLog('<li>' + "Bound to " + service.serviceAddress + ", service: " + service.api + '</li>');
            }
       });
    }catch(e){console.log(e);}
}


function drawEmptyMap(zoom){
    var location = new google.maps.LatLng(52.00, 13.00);
    var map_canvas = document.getElementById('map');
    var map_options = {
        center: new google.maps.LatLng(52.00, 13.00),
        zoom: zoom,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    }
    geoServices.map = new google.maps.Map(map_canvas, map_options);
}

function findAllLocations() {
    debugLog('<li>' + "Quering all Geolocations!" + '</li>');
    drawEmptyMap(2);
    webinos.discovery.findServices(new ServiceType('http://www.w3.org/ns/api-perms/geolocation'), {
        onFound: function(service){findPositionOf(service);}
    });
}


function addMarker(position){
    var location = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
    var marker = new google.maps.Marker({
        position: location,
        map: geoServices.map,
        title: geoServices.service.serviceAddress
    });
}


function findPositionOf(service){
    geoServices.service = service;
    geoServices.service.bindService({
        onBind: function(service){
            debugLog('<li>' + "Bound to " + service.serviceAddress + ", service: " + service.api + '</li>');
            var PositionOptions = {};
            PositionOptions.enableHighAccuracy = true;
            PositionOptions.maximumAge = 5000;
            PositionOptions.timeout = 1000;
            debugLog('<li>' + "Quering geolocation with options: " + JSON.stringify(PositionOptions) + '</li>');

            if(geoServices.service)
                geoServices.service.getCurrentPosition(addMarker, handle_errors, PositionOptions);
            else
                debugLog('<li class="error">' + "Error: not bound, yet" + '</li>');
        }
    });
}


function findSingleLocation() {  
    if($('#pzpList option:selected')[0] === undefined){
        debugLog('<li class="error">' + "Error: not bound, yet" + '</li>');
        return false;
    }
    var PositionOptions = {};
    PositionOptions.enableHighAccuracy = true;
    PositionOptions.maximumAge = 5000;
    PositionOptions.timeout = 1000;

    debugLog('<li>' + "Quering geolocation with options: " + JSON.stringify(PositionOptions) + '</li>');

    if(geoServices.service)
        geoServices.service.getCurrentPosition(handle_geolocation_query, handle_errors, PositionOptions);
    else
        debugLog('<li class="error">' + "Error: not bound, yet" + '</li>');
}


function findZone(){
    if($('#pzhList')[0].selectedOptions[0]){
        debugLog('<li>' + "Quering: " + $('#pzhList')[0].selectedOptions[0].label + '</li>');
        drawEmptyMap(4);
        webinos.discovery.findServices(new ServiceType('http://www.w3.org/ns/api-perms/geolocation'), {
            onFound: function(service){
                if(service.serviceAddress.lastIndexOf($('#pzhList')[0].selectedOptions[0].id)!=-1)
                    findPositionOf(service);
            }
        });
    }
    else
        debugLog('<li class="error">' + "Error: no friend zone selected" + '</li>');
}


function handle_errors(error) {
    switch(error.code) {
        case error.PERMISSION_DENIED:
            debugLog('<li class="error">' + "Error: user did not share geolocation data" + '</li>');
        break;
        case error.POSITION_UNAVAILABLE:
            debugLog('<li class="error">' + "Error: could not detect current position" + '</li>');
        break;
        case error.TIMEOUT:
            debugLog('<li class="error">' + "Error: retrieving position timed out" + '</li>');
        break;
        default:
            debugLog('<li class="error">' + "Error: unknown error code = " + error.code + "; message = " + error.message + '</li>');
        break;
    }
}


function handle_geolocation_query(position) {
    var location = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

    var map_canvas = document.getElementById('map');
    var map_options = {
        center: new google.maps.LatLng(position.coords.latitude, position.coords.longitude),
        zoom: 12,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    }
    var map = new google.maps.Map(map_canvas, map_options);
    var marker = new google.maps.Marker({
        position: location,
        map: map,
        title: geoServices.service.serviceAddress
    });
}


function findMyLocation(){
    var PositionOptions = {};
    PositionOptions.enableHighAccuracy = true;
    PositionOptions.maximumAge = 5000;
    PositionOptions.timeout = 1000;
    debugLog('<li>' + "Locating with HTML5, with options: " + JSON.stringify(PositionOptions) + '</li>');
    webinos.discovery.findServices(new ServiceType('http://www.w3.org/ns/api-perms/geolocation'), {
        onFound: function(service){
            if(service.serviceAddress === webinos.session.getPZPId()){
                geoServices.service = service;
                navigator.geolocation.getCurrentPosition(handle_geolocation_query, handle_errors, PositionOptions); // HTML5 client side geolocation
            }
        }
    });
}


function resizeDebug() {
	if(window.innerWidth > 960) {
		App.debugEl[0].style.maxHeight = window.innerHeight - parseInt(App.body.css('padding-bottom'),10) - App.debugEl[0].offsetTop + 'px';
	}
}

function debugLog(msg) {
	if(!App.debugMaxHeightSet) {
		resizeDebug();
		App.debugMaxHeightSet = true;
	}
	App.debugEl.append(msg);
	App.debugEl.scrollTop(App.debugEl[0].scrollHeight); //scroll to bottom
}


var App = {};
$(document).ready(function(){
    $("#btnFindSingleLocation").click(findSingleLocation);
    $("#btnFindGeolocation").click(findPZHs);
    $("#btnFindAll").click(findAllLocations);
    $("#btnFindMyLocation").click(findMyLocation);
    $("#btnFindZone").click(findZone);
    drawEmptyMap(4);
    webinos.session.addListener('registeredBrowser', findPZHs);

	//for resizeDebug;
    App.debugEl = $('#debug');
	App.body = $(document.body);
});

$(window).resize(function() {
	resizeDebug();
});

function logWebinos(){
    console.log("-------------------------------------");
    console.log('webinos.session.getSessionId()');
    console.log(webinos.session.getSessionId());
    console.log("---");
    console.log('webinos.session.getConnectedPzh()');
    console.log(webinos.session.getConnectedPzh());
    console.log("---");
    console.log('webinos.session.getConnectedPzp()');
    console.log(webinos.session.getConnectedPzp());
    console.log("---");
    console.log('webinos.session.getConnectedDevices()');
    console.log(webinos.session.getConnectedDevices());
    console.log("---");
    console.log('webinos.session.getPZPId()');    
    console.log(webinos.session.getPZPId());    
    console.log("---");
    console.log('webinos.session.getPZHId()');    
    console.log(webinos.session.getPZHId());    
    console.log("---");
    console.log('webinos.session.getFriendlyName()');    
    console.log(webinos.session.getFriendlyName());
    console.log("---");
    console.log('webinos.session.isConnected()');    
    console.log(webinos.session.isConnected());      
    console.log("---");
    console.log('webinos.session.getSessionId()');    
    console.log(webinos.session.getSessionId());
    console.log("---");
    console.log('webinos.session.getWebinosVersion()');    
    console.log(webinos.session.getWebinosVersion());    
    console.log("---");
    console.log('webinos.session.getServiceLocation()');    
    console.log(webinos.session.getServiceLocation());    
    console.log("---");
    console.log('webinos.session');
    console.log(webinos.session);
    console.log("-------------------------------------");
}