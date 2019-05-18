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

var fontName = "'Comic Sans MS'";
// On desktop (or anything with a wide enough screen) use full name for sample
// Text needs 744, (?) menu is 66, drawer is 256, 15 for scrollbar
if (window.innerWidth >= 744 + 256 + 66 + 15) {
  document.getElementById("textInput").value = "Roman Word Bubbling";
}
document.getElementById("textInput").addEventListener(
  "keyup",
  function() {
    renderImage();
  },
  false
);
renderImage();

function initializeSettings() {
  const sliders = document.querySelectorAll(".slider-container");
  for (const slider of sliders) {
    const sliderElement = slider.getElementsByClassName("mdc-slider")[0];
    const sliderManualInput = slider.getElementsByClassName(
      "slider-manual-input"
    )[0];
    sliderManualInput.value = sliderElement.dataset.value;
    const mdcSlider = new mdc.slider.MDCSlider(sliderElement);
    mdcSlider.listen("MDCSlider:input", () => {
      sliderElement.dataset.value = mdcSlider.value;
      sliderManualInput.value = Math.floor(mdcSlider.value);
      renderImage();
    });
    sliderManualInput.addEventListener("change", () => {
      sliderElement.dataset.value = sliderManualInput.value;
      mdcSlider.value = sliderManualInput.value;
      renderImage();
    });
  }

  const colorOptions = document.querySelectorAll(".color");
  for (const colorChoice of colorOptions) {
    colorChoice.addEventListener("click", e => {
      for (const color of colorOptions) {
        color.classList.remove("selected");
      }
      e.target.classList.add("selected");
      renderImage();
    });
  }

  const drawer = document.getElementsByClassName("mdc-drawer")[0];
  const close = drawer.getElementsByClassName("close")[0];
  const edit = document.getElementsByClassName("edit")[0];
  close.addEventListener("click", () => {
    drawer.classList.add("collapsed");
    edit.style.display = "";
  });
  edit.addEventListener("click", () => {
    drawer.classList.remove("collapsed");
    edit.style.display = "none"
  });
}

function updateFont() {
  fileButton = document.getElementById("fontFile");
  selectedFont = document.getElementById("fontChooser").value;
  if (selectedFont === "custom") {
    fileButton.hidden = false;
  } else {
    // Hide the file picker if it isn't already.
    // Also clear it so the onchange event will fire again
    if (fileButton.hidden == false) {
      fileButton.hidden = true;
      fileButton.value = "";
    }
    fontName = selectedFont;
  }
  renderImage();
}

// Returns the colors in an array in ["r", "g", "b"] format
function getColor() {
  const colorNode = document.getElementsByClassName("selected")[0];
  rgbString = colorNode.style.backgroundColor;
  return rgbString
    .substr(4, rgbString.length - 5)
    .replace(" ", "")
    .split(",");
}

function loadCustomFont() {
  file = document.getElementById("fontFile").files[0];
  if (file) {
    var reader = new FileReader();
    reader.onload = function(event) {
      var customFont = new FontFace("userFont", event.target.result);
      customFont.load().then(function(loadedFont) {
        document.fonts.add(loadedFont);
        fontName = "userFont";
        renderImage();
      });
    };
    reader.readAsArrayBuffer(file);
  }
}
function renderImage() {
  let fontSize = parseInt(
    document.getElementById("fontSize").dataset.value,
    10
  );
  // Set gapWidth and outlineThickness as a percentage of the font size
  let gapWidth =
    (fontSize *
      parseInt(document.getElementById("gapWidth").dataset.value, 10)) /
    100;
  let outlineThickness =
    (fontSize *
      parseInt(document.getElementById("outlineThickness").dataset.value, 10)) /
    100;
  let padding = fontSize / 4;
  let removeText = document.getElementById("removeText").checked;
  let darkMode = document.getElementById("darkMode").checked;
  let text = document.getElementById("textInput").value;
  var tCtx = document.getElementById("textCanvas").getContext("2d"); //Hidden canvas
  let blurRadius = 3;

  let borderColorRgb = getColor();

  tCtx.font = fontSize + "px " + fontName;
  tCtx.canvas.width = tCtx.measureText(text).width + padding * 2;
  tCtx.canvas.height = 1.25 * fontSize + 2 * padding;
  tCtx.font = fontSize + "px " + fontName;
  tCtx.fillStyle = "white";
  tCtx.fillRect(0, 0, tCtx.canvas.width, tCtx.canvas.height);
  tCtx.fillStyle = "black";
  tCtx.fillText(text, padding, fontSize + padding / 2);
  let img = cv.imread("textCanvas");
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
  cv.findContours(
    shape,
    contours,
    hierarchy,
    cv.RETR_EXTERNAL,
    cv.CHAIN_APPROX_SIMPLE
  );
  let color = null;
  r = parseInt(borderColorRgb[0], 10);
  g = parseInt(borderColorRgb[1], 10);
  b = parseInt(borderColorRgb[2], 10);

  if (darkMode) {
    document.body.style.backgroundColor = "black";
    // Invert the color for dark mode because it will get inverted back later
    // Doing it this way ensures the blurring will use the right background color
    color = new cv.Scalar(255 - r, 255 - g, 255 - b);
  } else {
    document.body.style.backgroundColor = "transparent";
    color = new cv.Scalar(r, g, b);
  }
  cv.drawContours(
    contourImage,
    contours,
    -1,
    color,
    gapWidth + outlineThickness
  );

  // Flatten contour image into a grayscale image and make it white-on-black also
  cv.cvtColor(contourImage, shape, cv.COLOR_BGR2GRAY);
  cv.threshold(shape, shape, 0, 255, cv.THRESH_BINARY);

  // Find the outside edge of the countour we just drew
  // This will be the center of the outline
  cv.findContours(
    shape,
    contours,
    hierarchy,
    cv.RETR_EXTERNAL,
    cv.CHAIN_APPROX_SIMPLE
  );

  // Add outline to original image
  cv.drawContours(borderImage, contours, -1, color, outlineThickness);

  // Blur the border image to make it look less pixelated
  cv.GaussianBlur(
    borderImage,
    borderImage,
    new cv.Size(blurRadius, blurRadius),
    0,
    0,
    cv.BORDER_DEFAULT
  );

  if (!removeText) {
    // Combine the text and the border
    cv.bitwise_and(borderImage, textImage, borderImage);
  }
  if (darkMode) {
    cv.bitwise_not(borderImage, borderImage);
  }

  cv.imshow("output", borderImage);
  img.delete();
  shape.delete();
  contours.delete();
  hierarchy.delete();
  contourImage.delete();
  textImage.delete();
  borderImage.delete();
}

window.onload = initializeSettings();
document.onload = document.getElementsByClassName("loader")[0].remove();
