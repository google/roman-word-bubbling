/**
 *
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

var fontName = "'Comic Sans MS'"

document.getElementById("textInput").addEventListener('keyup', function (){
    renderImage();
}, false);
renderImage()

function updateFont() {
  selectedFont = document.getElementById("fontChooser").value
  if (selectedFont === "custom") {
    document.getElementById("fontFile").hidden=false
  } else {
    document.getElementById("fontFile").hidden=true;
    fontName = selectedFont
  }
  renderImage()
}

function updateColor() {
  hexValue = document.getElementById("borderColor").value

  r = parseInt(hexValue.substring(1, 3), 16)
  g = parseInt(hexValue.substring(3, 5), 16)
  b = parseInt(hexValue.substring(5, 7), 16)

  if (r >= g && r >= b) {
    r = 255
  } else if (g >= b) {
    g = 255
  } else {
    b = 255
  }

  if (b <= g && b <= r) {
    b = 0
  } else if (g <= r) {
    g = 0
  } else {
    r = 0
  }

  hexValue = "#"+("0"+r.toString(16)).slice(-2)+("0"+g.toString(16)).slice(-2)+("0"+b.toString(16)).slice(-2)
  document.getElementById("borderColor").value = hexValue
  renderImage()
}
function loadCustomFont() {
  file = document.getElementById("fontFile").files[0]
  console.log(file)
  var reader = new FileReader()
  reader.onload = function(event) {
    var customFont = new FontFace("userFont", event.target.result)
    customFont.load().then(function(loadedFont){
      console.log(loadedFont);
      document.fonts.add(loadedFont)
      fontName = "userFont"
      console.log(document.fonts)
      renderImage()
      console.log("done")
    })
  }
  reader.readAsArrayBuffer(file)
}
function renderImage() {
  let fontSize = parseInt(document.getElementById('fontSize').value, 10);
  // Set gapWidth and outlineThickness as a percentage of the font size
  let gapWidth = fontSize * parseInt(document.getElementById('gapWidth').value, 10) / 100;
  let outlineThickness = fontSize * parseInt(document.getElementById('outlineThickness').value, 10) / 100;
  let padding = fontSize / 4;
  let removeText = document.getElementById('removeText').checked
  let darkMode = document.getElementById('darkMode').checked
  let text = document.getElementById('textInput').value
  var tCtx = document.getElementById('textCanvas').getContext('2d'); //Hidden canvas
  let blurRadius = parseInt(document.getElementById('blurRadius').value, 10);
  let borderColorHex = document.getElementById("borderColor").value

  tCtx.font = fontSize + "px " + fontName
  tCtx.canvas.width = tCtx.measureText(text).width + padding*2;
  tCtx.canvas.height = 1.25*fontSize + 2*padding;
  tCtx.font = fontSize + "px " + fontName
  tCtx.fillStyle = 'white';
  tCtx.fillRect(0, 0, tCtx.canvas.width, tCtx.canvas.height);
  tCtx.fillStyle = 'black';
  tCtx.fillText(text, padding, fontSize + padding/2);
  let img = cv.imread('textCanvas');
  let shape = cv.Mat.zeros(img.cols, img.rows, cv.CV_8UC1);
  cv.cvtColor(img, shape, cv.COLOR_RGBA2GRAY, 0);
  cv.bitwise_not(shape, shape);

  // Make white image for border
  let borderImage = cv.Mat.zeros(img.rows, img.cols, cv.CV_8UC3);
  cv.bitwise_not(borderImage, borderImage);

  // Make non-transparent image for text
  let textImage = cv.Mat.zeros(img.rows, img.cols, cv.CV_8UC3);
  cv.cvtColor(img, textImage, cv.COLOR_RGBA2RGB, 0);

  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();
  let contourImage = cv.Mat.zeros(img.rows, img.cols, cv.CV_8UC3);

  // Find and draw contours
  // RETR_EXTERNAL means it will fill in holes in letters like 'o' and 'a'
  // Draw thickly enough that the outside edge will be the center of the outline
  cv.findContours(shape, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
  let color = null;
  r = parseInt(borderColorHex.substring(1, 3), 16)
  g = parseInt(borderColorHex.substring(3, 5), 16)
  b = parseInt(borderColorHex.substring(5, 7), 16)
  if (darkMode) {
    // Invert the color for dark mode because it will get inverted back later
    // Doing it this way ensures the blurring will use the right background color
    color = new cv.Scalar(255-r, 255-g, 255-b);
  } else {
    color = new cv.Scalar(r, g, b);
  }
  cv.drawContours(contourImage, contours, -1, color, gapWidth + outlineThickness);

  // Flatten contour image into a grayscale image and make it white-on-black also
  cv.cvtColor(contourImage, shape, cv.COLOR_BGR2GRAY);
  cv.threshold(shape, shape, 0, 255, cv.THRESH_BINARY);

  // Find the outside edge of the countour we just drew
  // This will be the center of the outline
  cv.findContours(shape, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  // Add outline to original image
  cv.drawContours(borderImage, contours, -1, color, outlineThickness);

  // Blur the border image to make it look less pixelated
  cv.GaussianBlur(borderImage, borderImage, new cv.Size(blurRadius, blurRadius), 0, 0, cv.BORDER_DEFAULT);

  if(!removeText) {
    // Combine the text and the border
    cv.bitwise_and(borderImage, textImage, borderImage)
  }
  if (darkMode) {
    cv.bitwise_not(borderImage, borderImage);
  }

  cv.imshow('output', borderImage);
  img.delete(); shape.delete(); contours.delete(); hierarchy.delete();
  contourImage.delete(); textImage.delete(); borderImage.delete();
}
