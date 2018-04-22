var $ = require("jquery");
var RecordRTC = require('recordrtc');
var socketio = io();

var rtc;
var videoElement = $('#video')[0];

var recordingLength = 5 * 1000;

var uploadURL = 'https://webmshare.com/api/upload';

socketio.on('connect', function() {
    console.log('IO connected');
});

socketio.on('uploaded', function(url) {
    // var href = (location.href.split('/').pop().length ? location.href.replace(location.href.split('/').pop(), '') : location.href);
    // href = href + 'uploads/' + filename;
    console.log('got file ' + url);
});

function startRecording(stream) {
    var options = {
        // recorderType: MediaStreamRecorder,
        mimeType: 'video/webm\;codecs=vp9',
        bitsPerSecond: 256 * 8 * 1024,
        checkForInactiveTracks: true
        // bitsPerSecond: 128000 // if this line is provided, skip above two
    };

    rtc = RecordRTC(stream, options);
    rtc.startRecording();
}

function stopRecording() {    
    rtc.stopRecording(function (url) {
        isRecording = false;
        videoElement.srcObject = null;
        videoElement.src = url;
        videoElement.play();

        rtc.getDataURL(function(dataURL) {
            uploadVideoToServer(dataURL);
        });        

        rtc.clearRecordedData();
    });    
}

function uploadVideoToServer(url) {
    // var fd = new FormData();
    // // fd.append('fname', 'test.wav');
    // fd.append('data', soundBlob);  
    // $.ajax({
    //     type: 'POST',
    //     url: uploadURL,
    //     data: fd,
    //     processData: false,
    //     contentType: false        
    // }).done(function(data) {
    //     console.log(data);
    // })
    var file = {
        video: {
            type: rtc.getBlob().type || 'video/webm',
            dataURL: url
        }
    };

    socketio.emit('message', file);
}

function errorCallback(error) {
    console.log(error);
}

var mediaConstraints = { video: true, audio: true };
var stream;
navigator.mediaDevices.getUserMedia(mediaConstraints).then(function(result) { 
    stream = result; 
    //videoElement.src = window.URL.createObjectURL(result);
    videoElement.srcObject = result;
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
        startRecording(stream);
    }

    setTimeout(stopRecording, recordingLength);    
});