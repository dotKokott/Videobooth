var $ = require("jquery");
var RecordRTC = require('recordrtc');
var socketio = io();
var THREE = require('three');
require('jquery-circle-progress');

var rtc;
var videoElement = $('#video')[0];
var canvasElement;

var linkElement = $('#link');

var recordingLength = 5 * 1000;

const UPLOAD = true;

(function (global) { 

    if(typeof (global) === "undefined") {
        throw new Error("window is undefined");
    }

    var _hash = "!";
    var noBackPlease = function () {
        global.location.href += "#";

        // making sure we have the fruit available for juice (^__^)
        global.setTimeout(function () {
            global.location.href += "!";
        }, 50);
    };

    global.onhashchange = function () {
        if (global.location.hash !== _hash) {
            global.location.hash = _hash;
        }
    };

    global.onload = function () {            
        noBackPlease();

        // disables backspace on page except on input fields and textarea..
        document.body.onkeydown = function (e) {
            var elm = e.target.nodeName.toLowerCase();
            if (e.which === 8 && (elm !== 'input' && elm  !== 'textarea')) {
                e.preventDefault();
            }
            // stopping event bubbling up the DOM tree..
            e.stopPropagation();
        };          
    }

})(window);

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

document.addEventListener( 'mousewheel', onDocumentMouseWheel, false );
document.addEventListener( 'mousedown', onDocumentMouseDown, false );

function recordbutton() {
    if(rtc === undefined) {
        // startRecording(stream);        
        recordCanvas();
        // updateProgress();
    } else if(rtc.state === 'recording') {
        rtc.pauseRecording();
    } else if(rtc.state === 'paused') {
        rtc.resumeRecording();
    } else if(rtc.state === 'stopped') {
        rtc.clearRecordedData();   
        location.reload();
    }   
}

function onDocumentMouseDown(event) {
    event.preventDefault();

    switch(event.button) {
        case 0:
            recordbutton();
            break;
        case 2:
            if(rtc) rtc.clearRecordedData();            
            location.reload();
    }

 
}



function onDocumentMouseWheel( event ) {
    if(event.wheelDeltaY > 0) {
        lastMirror();
        console.log('up');
    } else {
        nextMirror();
    }
}

function recordCanvas() {
    rtc = RecordRTC(renderer.domElement, {
        type: 'canvas',
        mimeType: 'video/webm\;codecs=vp9',
        // type: 'video',
        // mimeType: 'video/webm\;codecs=vp9',
        // checkForInactiveTracks: true,
        // // bitsPerSecond: 256 * 8 * 1024,
        showMousePointer: false
    });

    rtc.setRecordingDuration(recordingLength).onRecordingStopped(function(url) {
        $('#circle').hide();

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

    $('#circle').circleProgress({
        value: 0,
        size: 80,
        animation: false,
        thickness: 40,
        fill: {
          gradient: ["red", "orange"]
        }
      });
}

function nextMirror() {
    material.uniforms.side.value++;
    if(material.uniforms.side.value > 7) {
        material.uniforms.side.value = 0;
    }
}

function lastMirror() {
    material.uniforms.side.value--;
    if(material.uniforms.side.value < 0) {
        material.uniforms.side.value = 7;
    }
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
var clock = new THREE.Clock();
var delta = 0;
var recordingTime = 0;
var recordingProgress = 0;


function draw() {
    requestAnimationFrame( draw );
    renderer.render( scene, camera );    

    delta = clock.getDelta();
    if(rtc !== undefined && rtc.state === 'recording') {
        recordingTime += delta;    
        recordingProgress = (1.0 / 5.0) * recordingTime;   
        $('#circle').circleProgress('value', recordingProgress);             
    }
}

$( document ).ready(function() {
    init();
    draw();
});

$(document).keydown(function(e) {        
    if(e.keyCode !== 13) return;


});