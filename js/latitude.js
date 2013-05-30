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


function findGeolocation() {    
    $('#pzpList').empty(); 
    geoServices.serviceArray = [];
    webinos.discovery.findServices(new ServiceType('http://www.w3.org/ns/api-perms/geolocation'), {
        onFound: onServiceFound        
    });        
}

function findPZHs() {
    $('#pzhList').empty();        
    for(var i=0;i<webinos.session.getConnectedDevices().length;i++)
        $('#pzhList').append($('<option>' + webinos.session.getConnectedDevices()[i].id + '</option>'));                
}

function onServiceFound(service){ //TODO: this will never work with 2 pzp with same name connected to 2 different zones
    for(var i=0;i<webinos.session.getConnectedDevices().length;i++){
        if(webinos.session.getConnectedDevices()[i].id==$('#pzhList')[0].selectedOptions[0].label){ //check if the item id in the array is equal to the selected pzh
            if(webinos.session.getConnectedDevices()[i].pzp.lastIndexOf(service.serviceAddress)!==-1){ //check if serviceAddress is in the pzp list of the searched pzh
                $('#pzpList').append($('<option>' + webinos.session.getConnectedDevices()[i].pzp[0] + '</option>'));                                    
                geoServices.serviceArray[service.serviceAddress] = service;
                $('#debug').append('<li style="padding-left:2em">' + service.displayName + " service found @" + service.serviceAddress +'</li>'); 
            }                
        }
    }     
}

    
function bindservice() {
    geoServices.service = geoServices.serviceArray[$('#pzpList option:selected').val()];    
    geoServices.service.bindService({
        onBind: onBinding
   });        
}

function onBinding(service){
    $('#debug').append('<li style="padding-left:2em">' + "Bound to " + service.serviceAddress + ", service: " + service.api + '</li>');
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
    $('#debug').append('<li style="padding-left:2em">' + "Quering all Geolocations!" + '</li>');   
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
            onBinding(service);
            var PositionOptions = {};
            PositionOptions.enableHighAccuracy = true;    
            PositionOptions.maximumAge = 5000;
            PositionOptions.timeout = 1000;            
            $('#debug').append('<li style="padding-left:2em">' + "Quering geolocation with options: " + JSON.stringify(PositionOptions) + '</li>');
            
            if(geoServices.service)
                geoServices.service.getCurrentPosition(addMarker, handle_errors, PositionOptions);              
            else
                $('#debug').append('<li style="padding-left:2em; color:red">' + "Error: not bound, yet" + '</li>');           
        }
    }); 
}


function findSingleLocation() {
    var PositionOptions = {};
    PositionOptions.enableHighAccuracy = true;    
    PositionOptions.maximumAge = 5000;
    PositionOptions.timeout = 1000;
        
    $('#debug').append('<li style="padding-left:2em">' + "Quering geolocation with options: " + JSON.stringify(PositionOptions) + '</li>');
    
    if(geoServices.service)
        geoServices.service.getCurrentPosition(handle_geolocation_query, handle_errors, PositionOptions);
    else
        $('#debug').append('<li style="padding-left:2em; color:red">' + "Error: not bound, yet" + '</li>');   
}


function findZone(){
    if($('#pzhList')[0].selectedOptions[0]){
        $('#debug').append('<li style="padding-left:2em">' + "Quering: " + $('#pzhList')[0].selectedOptions[0].label + '</li>');   
        drawEmptyMap(4);
        webinos.discovery.findServices(new ServiceType('http://www.w3.org/ns/api-perms/geolocation'), {
            onFound: function(service){       
                for(var i=0;i<webinos.session.getConnectedDevices().length;i++){
                    if(webinos.session.getConnectedDevices()[i].id === $('#pzhList')[0].selectedOptions[0].label)
                        if (webinos.session.getConnectedDevices()[i].pzp.lastIndexOf(service.serviceAddress) !==-1 )
                            findPositionOf(service); 
                }                
            }
        });    
    }
    else
        $('#debug').append('<li style="padding-left:2em; color:red">' + "Error: no friend zone selected" + '</li>');   
}


function handle_errors(error) {
    switch(error.code) {
        case error.PERMISSION_DENIED:
            $('#debug').append('<li style="padding-left:2em; color:red">' + "Error: user did not share geolocation data" + '</li>');            
        break;                                            
        case error.POSITION_UNAVAILABLE:
            $('#debug').append('<li style="padding-left:2em; color:red">' + "Error: could not detect current position" + '</li>');
        break;                                               
        case error.TIMEOUT:
            $('#debug').append('<li style="padding-left:2em; color:red">' + "Error: retrieving position timed out" + '</li>');
        break;
        default:
            $('#debug').append('<li style="padding-left:2em; color:red">' + "Error: unknown error code = " + error.code + "; message = " + error.message + '</li>');
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
    $('#debug').append('<li style="padding-left:2em">' + "Locating with HTML5, with options: " + JSON.stringify(PositionOptions) + '</li>');
    webinos.discovery.findServices(new ServiceType('http://www.w3.org/ns/api-perms/geolocation'), {
        onFound: function(service){
            if(service.serviceAddress === webinos.session.getPZPId()){
                geoServices.service = service;
                navigator.geolocation.getCurrentPosition(handle_geolocation_query, handle_errors, PositionOptions); // HTML5 client side geolocation    
            }
        }
    });           
}


$(document).ready(function(){
    $("#btnFindSingleLocation").click(findSingleLocation);
    $("#btnFindGeolocation").click(findPZHs).click(findGeolocation); 
    $("#btnFindAll").click(findAllLocations);
    $("#btnFindMyLocation").click(findMyLocation);
    $("#btnFindZone").click(findZone);
    drawEmptyMap(4);
    webinos.session.addListener('registeredBrowser', findPZHs);
});

