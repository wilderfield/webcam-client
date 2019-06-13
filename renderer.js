// A flag to know when start or stop the camera
var enabled = false;
var go = false;
// Use require to add webcamjs
var WebCamera = require("webcamjs");

function DeepRect(cfg) {
  this.id = cfg.id;
  this.labels = {};
  this.labelColorIdx = 0;
  this.labelColors = ['red', 'green', 'blue', 'orange', 'purple', 'deeppink', 'cyan', 'yellow', 'brown'];
}
 
DeepRect.prototype.draw = function(x, y, w, h, label) {

  var labelColor = null;

  if (label in this.labels)
    labelColor = this.labels[label];
  else
  {
    labelColor = this.labelColors[this.labelColorIdx];
    this.labelColorIdx = (this.labelColorIdx + 1) % this.labelColors.length;
    this.labels[label] = labelColor;
  }

  var rect = $('<div/>', {
    class: 'deep-rect',
    style: 'position: absolute; '
         + 'top: ' + y + 'px; '
         + 'left: ' + x + 'px; '
         + 'width: ' + (w-x) + 'px; '
         + 'height: ' + (h-y) + 'px; '
         + 'border: 2px solid ' + labelColor + ';'
  });

  var text = $('<div/>', {
    class: 'deep-rect',
    style: 'position: absolute; '
         + 'top: ' + y + 'px; '
         + 'left: ' + x + 'px; '
         + 'font-weight: bold; '
         + 'color: ' + labelColor + '; ',
    html: label
  });

  $(this.id).append(rect);
  $(this.id).append(text);
}

DeepRect.prototype.clear = function() {
  $(".deep-rect").remove();
  this.labelColorIdx = 0;
  this.labels = {};
}


var dr = new DeepRect({
id: "#webcam-wrapper"
});

var request = require("request");

var url = document.getElementById("url");

document.getElementById("start").addEventListener('click',function(){
   if(!enabled){ // Start the camera !
     enabled = true;
     WebCamera.set({
       jpeg_quality: 8,
       width: 512,
       height: 320,
       dest_width: 512,
       dest_height: 320,
       crop_width: 320,
       crop_height: 320
});
     WebCamera.attach('#webcam');
     console.log("The camera has been started");
   }else{ // Disable the camera !
     enabled = false;
     WebCamera.reset();
    console.log("The camera has been disabled");
   }
},false);

/////////////////////////////////

var fs = require('fs'); // Load the File System to execute our common tasks (CRUD)

// return an object with the processed base64image
function processBase64Image(dataString) {
  var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),response = {};

  if (matches.length !== 3) {
    return new Error('Invalid input string');
  }

  response.type = matches[1];
  response.data = Buffer.from(matches[2], 'base64');

  return response;
}

document.getElementById("savefile").addEventListener('click',function(){
  go = true;
},false);

function predict(imageBuffer) {
    request.post(
      {url:url.value,
        //form: {image: imageBuffer.data }},
        form: {image: JSON.stringify(imageBuffer.data),'content-type': "application/json;charset=utf-8" }},
      function optionalCallback(err,httpResponse,body) {
        if (err) {
          console.error("upload failed:", err);
          return;
        }
        else {
          console.log("Upload successful! Server responded with:", body);
          document.getElementById("response").value=body;
          resp = JSON.parse(body);
          dr.clear();
          if (resp.success)
            resp.response.forEach(function(entry) {
              dr.draw(entry[0],entry[1],entry[2],entry[3], "Face");
            });
        }
      });
}

function snapPredict() { 
  if (enabled && go) {
    WebCamera.snap(function(data_uri) {
      // Save the image in a variable
      var imageBuffer = processBase64Image(data_uri);
      predict(imageBuffer);
    });
  }
  else
    console.log("Please enable the camera first to take the snapshot !");
}


setInterval(snapPredict, 125);
