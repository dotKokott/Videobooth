var $ = require("jquery");
var RecordRTC = require('recordrtc');

var rtc;
var videoElement = $('#video')[0];

function startRecording(stream) {
    var options = {
        mimeType: 'video/webm', // or video/webm\;codecs=h264 or video/webm\;codecs=vp9
        bitsPerSecond: 128000 // if this line is provided, skip above two
    };

    rtc = RecordRTC(stream, options);
    rtc.startRecording();
}

function stopRecording() {
    rtc.stopRecording(function (url) {
        videoElement.src = url;
        videoElement.play();
    });
}

function errorCallback(error) {
    console.log(error);
}

var mediaConstraints = { video: true, audio: true };
var stream;
navigator.mediaDevices.getUserMedia(mediaConstraints).then(function(result) { 
    stream = result; 
    videoElement.src = window.URL.createObjectURL(result);
});

function init() {

}

$( document ).ready(function() {
    init();
});

var isRecording = false;

$(document).keydown(function(e) {
    if(e.keyCode != 13) return;

    if(!isRecording) {
        isRecording = true;
        console.log("START");
        startRecording(stream);
    } else {
        console.log("STOP");
        isRecording = false;
        stopRecording();        
    }

    
});