var $ = require("jquery");
var RecordRTC = require('recordrtc');
var socketio = io();
var THREE = require('three');

var rtc;
var videoElement = $('#video')[0];
var canvasElement;

var linkElement = $('#link');

var recordingLength = 5 * 1000;

const UPLOAD = true;

socketio.on('connect', function() {
    console.log('IO connected');
});

socketio.on('uploaded', function(url) {
    // var href = (location.href.split('/').pop().length ? location.href.replace(location.href.split('/').pop(), '') : location.href);
    // href = href + 'uploads/' + filename;
    linkElement.text(url);
    linkElement.toggle();
    // console.log('got file ' + url);
});

function startRecording(stream) {
    // rtc = RecordRTC(stream, {
    //     type: 'video'
    // })


    // // var options = {
    // //     // recorderType: MediaStreamRecorder,
    // //     mimeType: 'video/webm\;codecs=vp9',
    // //     bitsPerSecond: 256 * 8 * 1024,
    // //     checkForInactiveTracks: true
    // // };

    // // rtc = RecordRTC(stream, options);

    // rtc.setRecordingDuration(recordingLength).onRecordingStopped(function(url) {
    //     isRecording = false;
    //     videoElement.srcObject = null;
    //     videoElement.src = url;
    //     videoElement.muted = false;
    //     videoElement.play();

    //     if(UPLOAD) {
    //         rtc.getDataURL(function(dataURL) {
    //             uploadVideoToServer(dataURL);
    //         }); 
    //     } else {
    //         console.log("!!!!!HEY NOT UPLOADING!!!!");
    //     }

    //     rtc.clearRecordedData();        
    // });

    // rtc.startRecording();
}

function recordCanvas() {
    rtc = RecordRTC(finalStream, {
        type: 'video',
        mimeType: 'video/webm\;codecs=vp9',
        checkForInactiveTracks: true,
        bitsPerSecond: 256 * 8 * 1024,
        showMousePointer: false
    });

    rtc.setRecordingDuration(recordingLength).onRecordingStopped(function(url) {
        isRecording = false;
        videoElement.srcObject = null;
        videoElement.src = url;
        videoElement.muted = false;
        videoElement.play();

        if(UPLOAD) {
            rtc.getDataURL(function(dataURL) {
                uploadVideoToServer(dataURL);
            }); 
        } else {
            console.log("!!!!!HEY NOT UPLOADING!!!!");
        }

        rtc.clearRecordedData();        
    });

    rtc.startRecording();    
}


function uploadVideoToServer(url) {
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
var finalStream;
navigator.mediaDevices.getUserMedia(mediaConstraints).then(function(result) { 
    videoElement.srcObject = result;

    finalStream = new MediaStream();
    var canvasStream = renderer.domElement.captureStream();
    result.getAudioTracks().forEach(function(track) {
        finalStream.addTrack(track);
    });
    canvasStream.getVideoTracks().forEach(function(track) {
        finalStream.addTrack(track);
    });      
});

var camera, scene, renderer;
var geometry, material, mesh;
var videoTexture;
var composer;
var mirrorParams, mirrorPass;			

var lastTime = Date.now();

THREE.MirrorShader = {

    vertexShader: [

        "varying vec2 vUv;",

        "void main() {",

            "vUv = uv;",
            "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

        "}"

    ].join( "\n" ),

    fragmentShader: [

        "uniform sampler2D tDiffuse;",
        "uniform int side;",
        
        "varying vec2 vUv;",

        "void main() {",

            "vec2 p = vUv;",
            "if (side == 0){",
                "if (p.x > 0.5) p.x = 1.0 - p.x;",
            "}else if (side == 1){",
                "if (p.x < 0.5) p.x = 1.0 - p.x;",
            "}else if (side == 2){",
                "if (p.y < 0.5) p.y = 1.0 - p.y;",
            "}else if (side == 3){",
                "if (p.y > 0.5) p.y = 1.0 - p.y;",
            "}else if (side == 4){",
                "if (p.y > 0.5) p.y = 1.0 - p.y;",                
                "if (p.x < 0.5) p.x = 1.0 - p.x;",               
            "}else if (side == 5){",
                "if (p.y < 0.5) p.y = 1.0 - p.y;",                
                "if (p.x > 0.5) p.x = 1.0 - p.x;",                      
            "}else if (side == 6){",
                "if (p.y > 0.5) p.y = 1.0 - p.y;",                
                "if (p.x > 0.5) p.x = 1.0 - p.x;",                  
            "}else if (side == 7){",
                "if (p.y < 0.5) p.y = 1.0 - p.y;",                
                "if (p.x < 0.5) p.x = 1.0 - p.x;",                
            "} ",
            "vec4 color = texture2D(tDiffuse, p);",
            
            "gl_FragColor = color;",

        "}"

    ].join( "\n" )

}; 

function init() {
    var W = window.innerWidth, H = window.innerHeight;
    videoElement.muted = true;
    linkElement.toggle();

    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(W / -2, W / 2,  H / 2, H / -2, -100, 100);
    geometry = new THREE.PlaneBufferGeometry( W, H );
    

    texture = new THREE.VideoTexture( videoElement );
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.format = THREE.RGBFormat;

    material = new THREE.ShaderMaterial( {

        uniforms: {

            "tDiffuse": { type: "t", value: texture },
            "side":     { value: 7 }
    
        },
    
        vertexShader: THREE.MirrorShader.vertexShader,
    
        fragmentShader: THREE.MirrorShader.fragmentShader
    
    } );

    setRandomMirror();

    var mesh = new THREE.Mesh( geometry, material );
    scene.add(mesh);

    renderer = new THREE.WebGLRenderer( {} );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( W, H );

    window.addEventListener( 'resize', onWindowResize, false );

    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );    
}

function setRandomMirror() {
    material.uniforms.side.value = THREE.Math.randInt(0, 7);
    // console.log(material.uniforms["side"]);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function draw() {
    requestAnimationFrame( draw );
    renderer.render( scene, camera );    
}

$( document ).ready(function() {
    init();
    draw();
});

var isRecording = false;

$(document).keydown(function(e) {        
    if(e.keyCode !== 13) return;
    
    if(rtc === undefined || rtc.state === 'stopped' || rtc.state === 'inactive') {
        // startRecording(stream);
        recordCanvas();
    } else if(rtc.state === 'recording') {
        rtc.pauseRecording();
    } else if(rtc.state === 'paused') {
        rtc.resumeRecording();
    } else if(rtc.state === 'stopped') {
        init();
    }
});