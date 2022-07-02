'use strict'

// gui
let canvasEl
let writeEl
let offsetLabelEl
let numberOffsetEl

let writingFocused = false
let caretTimer = 0
const newLineChar = String.fromCharCode(13, 10)

const numberInputsObj = {
   zoom: {element: document.getElementById('number-scale'), min: 1, max:50},
   weight: {element: document.getElementById('number-weight'), min: 1, max: 9},
   spacing: {element: document.getElementById('number-spacing'), min: -2, max:2},
   size: {element: document.getElementById('number-size'), min: 1, max:50},
   rings: {element: document.getElementById('number-rings'), min: 1, max:30},
   ascenders: {element: document.getElementById('number-asc'), min: 1, max:30},
   stretchX: {element: document.getElementById('number-stretchX'), min:0, max:50},
   stretchY: {element: document.getElementById('number-stretchY'), min:0, max:50},
}
let linesArray = ["the quick brown\nfox jumps over\nthe lazy dog."]
const validLetters = "abcdefghijklmnopqrstuvwxyzäöüß,.!?-_|‸ "


// setup

const palette = {}
let randomizeAuto = false
let lerpLength = 6

let effect = "none"
let midlineEffects = ["compress", "spread", "twist", "split", "lean", "teeth"]
let webglEffects = ["spheres"]

let initialDraw = true
let gridType = ""

const mode = {
   // visual
   svg: false,
   dark: true,
   mono: false,
   xray: false,
   drawFills: true,
   wave: false,
   // use alt letters?
   altS: false,
   altM: false,
   altNH: true,
}

let strokeScaleFactor = 1
const totalWidth = [0, 0, 0, 0]
const totalHeight = [0, 0, 0, 0]

let offsetDirection = "h"
let values = {
   hueDark: {from: undefined, to: undefined, lerp: 0},
   hueLight: {from: undefined, to: undefined, lerp: 0},
   rings: {from: 3, to: undefined, lerp: 0},
   size: {from: 9, to: undefined, lerp: 0},
   spacing: {from: 0, to: undefined, lerp: 0},
   offsetX: {from: 0, to: undefined, lerp: 0},
   stretchX: {from: 0, to: undefined, lerp: 0},
   offsetY: {from: 0, to: undefined, lerp: 0},
   stretchY: {from: 0, to: undefined, lerp: 0},
   weight: {from: 7, to: undefined, lerp: 0},
   ascenders: {from: 2, to: undefined, lerp: 0},
   zoom: {from: 10, to: undefined, lerp: 0},
}
// calculated every frame based on current lerps
let animSize, animRings, animSpacing, animWeight, animAscenders, animZoom
let animOffsetX, animOffsetY, animStretchX, animStretchY
let animColorDark, animColorLight


function windowResized() {
   if (!mode.svg) {
      resizeCanvas(windowWidth-30, windowHeight-200)
   }
}

function setup () {
   loadValuesFromURL()
   createGUI()

   canvasEl = createCanvas(windowWidth-30, windowHeight-200,(webglEffects.includes(effect))?WEBGL:(mode.svg)?SVG:"")
   canvasEl.parent('sketch-holder')
   if (!webglEffects.includes(effect)) {
      strokeCap(ROUND)
      textFont("Courier Mono")
      frameRate(60)
      if (mode.svg) strokeScaleFactor = values.zoom.from
   } else {
      frameRate(60)
      strokeScaleFactor = values.zoom.from
   }
   rectMode(CORNERS)

   values.hueDark.from = 270
   values.hueLight.from = 340

   writeValuesToURL("noReload")
}

function createGUI () {

   createDropDown()

   // create textarea for line input
   writeEl = document.getElementById('textarea-lines')
   writeEl.innerHTML = linesArray.join(newLineChar)

   // textarea events
   writeEl.addEventListener('input', function() {
      //split
      linesArray = writeEl.value.split("\n")
      writeValuesToURL()
   }, false)
   writeEl.addEventListener('focusin', () => {
      writingFocused = true
   })
   writeEl.addEventListener('focusout', () => {
      writingFocused = false

      // remove spaces and newlines at the end from field and actual array
      for (let l = 0; l < linesArray.length; l++) {
         linesArray[l] = linesArray[l].trimEnd();
      }
      linesArray = linesArray.filter(function(e){ return e === 0 || e})
      writeEl.value = linesArray.join("\n")
      writeValuesToURL()
      
   })

   // toggles and buttles
   const randomizeButton = document.getElementById('button-randomize')
   randomizeButton.addEventListener('click', () => {
      randomizeValues()
   })

   const resetStyleButton = document.getElementById('button-resetStyle')
   resetStyleButton.addEventListener('click', () => {
      //reset
      values.rings.to = 3
      values.size.to = 9
      values.spacing.to = 0
      values.offsetX.to = 0
      values.offsetY.to = 0
      values.stretchX.to = 0
      values.stretchY.to = 0
      values.weight.to = 7
      values.ascenders.to = 2
      lerpLength = 6
      writeValuesToURL()
      writeValuesToGUI()
   })
   const randomTextButton = document.getElementById('button-randomText')
   randomTextButton.addEventListener('click', () => {
      const textOptions = [
         "lorem ipsum\ndolor sit amet",
         "the quick brown\nfox jumps over\nthe lazy dog.",
         "Victor jagt zwölf\nBoxkämpfer quer\nüber den großen\nSylter Deich",
         "abcdefghijklm\nnopqrstuvwxy\nzäöüß_-|.,!?",
      ]
      let foundNewText = false
      while (!foundNewText) {
         const randomText = textOptions[Math.floor(Math.random()*textOptions.length)]
         const testLinesArray = randomText.split("\n").filter(function(e){ return e === 0 || e })
         if (testLinesArray[0] !== linesArray[0]) {
            linesArray = [...testLinesArray]
            foundNewText = true
         }
      }
      writeValuesToURL()
      writeValuesToGUI()
   })

   const darkmodeToggle = document.getElementById('checkbox-darkmode')
   darkmodeToggle.checked = mode.dark
   darkmodeToggle.addEventListener('click', () => {
      mode.dark = darkmodeToggle.checked
      writeValuesToURL()
   })
   const monochromeToggle = document.getElementById('checkbox-monochrome')
   monochromeToggle.checked = mode.mono
   monochromeToggle.addEventListener('click', () => {
      mode.mono = monochromeToggle.checked
      writeValuesToURL()
   })
   const xrayToggle = document.getElementById('checkbox-xray')
   xrayToggle.checked = mode.xray
   xrayToggle.addEventListener('click', () => {
      mode.xray = xrayToggle.checked
      writeValuesToURL()
   })
   const svgToggle = document.getElementById('checkbox-svg')
   svgToggle.checked = mode.svg
   svgToggle.addEventListener('click', () => {
      mode.svg = svgToggle.checked
      writeValuesToURL()
      if (!svgToggle.checked) {
         location.reload()
      }
   })
   const altMToggle = document.getElementById('checkbox-altM')
   altMToggle.checked = mode.altM
   altMToggle.addEventListener('click', () => {
      mode.altM = altMToggle.checked
      writeValuesToURL()
   })
   const altNHToggle = document.getElementById('checkbox-altNH')
   altNHToggle.checked = mode.altNH
   altNHToggle.addEventListener('click', () => {
      mode.altNH = altNHToggle.checked
      writeValuesToURL()
   })

   const clamp = (num, min, max) => Math.min(Math.max(num, min), max)

   for (const [property, numberInput] of Object.entries(numberInputsObj)) {
      numberInput.element.value = values[property].from
      numberInput.element.addEventListener('input', () => {
         if (numberInput.element.value !== "") {
            values[property].to = clamp(numberInput.element.value, numberInput.min, numberInput.max)
            writeValuesToURL()
         }
      })
      numberInput.element.addEventListener("focusout", () => {
         if (numberInput.element.value === "") {
            numberInput.element.value = values[property].from
         }
      })
   }

   numberOffsetEl = document.getElementById('number-offset')
   numberOffsetEl.value = values[(offsetDirection === "h") ? "offsetX" : "offsetY"].from
   numberOffsetEl.addEventListener('input', () => {
      if (numberOffsetEl.value !== "") {
         values[(offsetDirection === "h") ? "offsetX" : "offsetY"].to = clamp(numberOffsetEl.value, -10, 10)
         values[(offsetDirection !== "h") ? "offsetX" : "offsetY"].to = 0
         writeValuesToURL()
      }
   })
   numberOffsetEl.addEventListener("focusout", () => {
      if (numberOffsetEl.value === "") {
         numberOffsetEl.value = values[(offsetDirection === "h") ? "offsetX" : "offsetY"].from
      }
   })

   const offsetToggle = document.getElementById('toggle-offsetDirection')
   offsetLabelEl = document.getElementById('label-offset')
   offsetToggle.addEventListener('click', () => {
      if (offsetDirection === "h") {
         if (values.offsetX.from === 0) values.offsetY.to = 1
         offsetDirection = "v"
         offsetLabelEl.innerHTML = "offset&nbsp;&nbsp;v"
      } else {
         if (values.offsetY.from === 0) values.offsetX.to = 1
         offsetDirection = "h"
         offsetLabelEl.innerHTML = "offset&nbsp;&nbsp;h"
      }
      if (values.offsetX.to === undefined) values.offsetX.to = values.offsetY.from
      if (values.offsetY.to === undefined) values.offsetY.to = values.offsetX.from

      writeValuesToURL()
      writeValuesToGUI()
   })
}

function loadValuesFromURL () {
   const params = new Proxy(new URLSearchParams(window.location.search), {
      get: (searchParams, prop) => searchParams.get(prop),
    });
   if (params.svg === "true" || params.svg === "1") {
      mode.svg = true
      print("Loaded with URL Mode: SVG")
   }
   if (params.wave === "true" || params.wave === "1") {
      mode.wave = true
      print("Loaded with URL Mode: Wave")
   }
   if (params.xray === "true" || params.xray === "1") {
      mode.xray = true
      print("Loaded with URL Mode: XRAY")
   }
   if (params.solid === "false" || params.solid === "0") {
      mode.drawFills = false
      print("Loaded with URL Mode: Transparent overlaps")
   }
   if (params.invert === "true" || params.invert === "1") {
      mode.dark = false
      print("Loaded with URL Mode: Inverted")
   }
   if (params.mono === "true" || params.mono === "1") {
      mode.mono = true
      print("Loaded with URL Mode: Mono")
   }
   if (params.effect !== undefined) {
      switch (params.effect) {
         case "gradient":
            effect = "gradient"
            print("Loaded with URL Mode: Gradient Effect")
            break;
         case "weightgradient":
            effect = "weightgradient"
            print("Loaded with URL Mode: Weight Gradient Effect")
            break;
         case "compress":
            effect = "compress"
            print("Loaded with URL Mode: Compress V Effect")
            break;
         case "twist":
            effect = "twist"
            print("Loaded with URL Mode: Twist V Effect")
            break;
         case "split":
            effect = "split"
            print("Loaded with URL Mode: Split V Effect")
            break;
         case "lean":
            effect = "lean"
            print("Loaded with URL Mode: Lean V Effect")
            break;
         case "spread":
            effect = "spread"
            print("Loaded with URL Mode: Spread V Effect")
            break;
         case "teeth":
            effect = "teeth"
            print("Loading with URL Mode: Teeth V Effect")
            break;
         case "spheres":
            effect = "spheres"
            print("Loaded with URL Mode: Webgl 3D Spheres")
            break;
         default:
            print("Could not load effect")
            break;
      }
   }
   if (params.lines !== null && params.lines.length > 0) {
      linesArray = String(params.lines).split("\\")
      print("Loaded with URL Text", linesArray)
   }
   if (params.values !== null && params.values.length > 0) {
      const valString = String(params.values)
      const valArray = valString.split('_')

      if (valString.match("[0-9_-]+") && valArray.length === 10) {
         print("Loaded with parameters", valArray)
         values.zoom.from = parseInt(valArray[0])
         values.size.from = parseInt(valArray[1])
         values.rings.from = parseInt(valArray[2])
         values.spacing.from = parseInt(valArray[3])
         values.offsetX.from = parseInt(valArray[4])
         values.offsetY.from = parseInt(valArray[5])
         values.stretchX.from = parseInt(valArray[6])
         values.stretchY.from = parseInt(valArray[7])
         values.weight.from = parseInt(valArray[8])
         values.ascenders.from = parseInt(valArray[9])
      } else {
         print("Has to be 11 negative or positive numbers with _ in between")
      }
   }
   if (params.grid !== null && params.grid.length > 0) {
      const gridTypeString = String(params.grid)
      if (gridTypeString === "v" || gridTypeString === "vertical") {
         gridType = "vertical"
      } else if (gridTypeString === "h" || gridTypeString === "horizontal") {
         gridType = "horizontal"
      } else if (gridTypeString === "hv" || gridTypeString === "square") {
         gridType = "grid"
      }
   }
}

function writeValuesToURL (noReload) {

   let URL = String(window.location.href)
   if (URL.includes("?")) {
      URL = URL.split("?",1)
   }

   const newParams = new URLSearchParams();

   // add all setting parameters if any of them are not default
   if (true) { //WIP needs better condition lol
      function getValue(key) {
         if (values[key].to === undefined) {
            return values[key].from
         } else {
            return values[key].to
         }
      }
      let valueArr = []
      valueArr.push(""+getValue("zoom"))
      valueArr.push(""+getValue("size"))
      valueArr.push(""+getValue("rings"))
      valueArr.push(""+getValue("spacing"))
      valueArr.push(""+getValue("offsetX"))
      valueArr.push(""+getValue("offsetY"))
      valueArr.push(""+getValue("stretchX"))
      valueArr.push(""+getValue("stretchY"))
      valueArr.push(""+getValue("weight"))
      valueArr.push(""+getValue("ascenders"))

      newParams.append("values",valueArr.join("_"))
   }

   if (linesArray[0] !== "hamburgefonstiv" || linesArray.length >= 1) {
      newParams.append("lines", linesArray.join("\\"))
   }

   // add other parameters afterwards
   if (mode.svg) {
      newParams.append("svg",true)
   }
   if (!mode.dark) {
      newParams.append("invert",true)
   }
   if (mode.mono) {
      newParams.append("mono",true)
   }
   if (mode.xray) {
      newParams.append("xray",true)
   }
   if (mode.wave) {
      newParams.append("wave",true)
   }
   if (effect !== undefined) {
      let value = "none"
      switch (effect) {
         case "gradient":
            value = "gradient"
            break;
         case "weightgradient":
            value = "weightgradient"
            break;
         case "compress":
            value = "compress"
            break;
         case "spread":
            value = "spread"
            break;
         case "split":
            value = "split"
            break;
         case "lean":
            value = "lean"
            break;
         case "twist":
            value = "twist"
            break;
         case "teeth":
            value = "teeth"
            break;
         case "spheres":
            value = "spheres"
            break;
      }
      if (value !== "none") {
         newParams.append("effect", value)
      }
   }
   if (!mode.drawFills) {
      newParams.append("solid",false)
   }
   if (gridType !== "") {
      let gridTypeString = ""
      if (gridType === "vertical") gridTypeString = "v"
      else if (gridType === "horizontal") gridTypeString = "h"
      else if (gridType === "grid") gridTypeString = "hv"
      newParams.append("grid",gridTypeString)
   }

   if (URLSearchParams.toString(newParams).length > 0) {
      URL += "?" + newParams
   }
   window.history.replaceState("", "", URL)

   if ((mode.svg) && noReload === undefined) {
      location.reload()
   }
}

function writeValuesToGUI () {
   for (const [property, numberInput] of Object.entries(numberInputsObj)) {
      if (values[property].to !== undefined) {
         numberInput.element.value = values[property].to
      } else {
         numberInput.element.value = values[property].from
      }
   }
   writeEl.value = linesArray.join("\n")

   let potentialOffsetX; let potentialOffsetY
   if (values.offsetX.to !== undefined) {
      potentialOffsetX = values.offsetX.to
   } else {
      potentialOffsetX = values.offsetX.from
   }
   if (values.offsetY.to !== undefined) {
      potentialOffsetY = values.offsetY.to
   } else {
      potentialOffsetY = values.offsetY.from
   }
   if (potentialOffsetX === 0 && potentialOffsetY === 0) {
      //both empty, default to horizontal
      offsetDirection = "h"
      offsetLabelEl.innerHTML = "offset&nbsp;&nbsp;h"
   } else {
      if (potentialOffsetX === 0) {
         numberOffsetEl.value = potentialOffsetY
         offsetDirection = "v"
         offsetLabelEl.innerHTML = "offset&nbsp;&nbsp;v"
      } else {
         numberOffsetEl.value = potentialOffsetX
         offsetDirection = "h"
         offsetLabelEl.innerHTML = "offset&nbsp;&nbsp;h"
      }
   }
}

function keyTyped() {
   // wip
}

function keyPressed() {
   if (keyCode === LEFT_ARROW) {
      caretTimer = 0
   } else if (keyCode === RIGHT_ARROW) {
      caretTimer = 0
   }
}

function randomizeValues () {
   values.size.to = floor(random(4,16))
   values.weight.to = floor(random(2,10))
   values.rings.to = floor(random(1, values.size.to/2 + 1))
   values.spacing.to = floor(random(max(-values.rings.to, -2), 2))
   values.ascenders.to = floor(random(1, values.size.to*0.6))

   values.offsetX.to = 0
   values.offsetY.to = 0
   values.stretchX.to = 0
   values.stretchY.to = 0

   const offsetType = random(["v", "h", "h", "h", "0", "0", "0"])
   if (offsetType === "h") {
      values.offsetX.to = floor(random(-2, 2))
   } else if (offsetType === "v") {
      values.offsetY.to = floor(random(-1, 2))
      //if (values.offsetY.to === 0) offsetDirection = "h" //horizontal is preference
   }

   if (random() >= 0.8) {
      values.stretchX.to = floor(random(0, values.size.to*1.5))
   }
   if (random() >= 0.8) {
      values.stretchY.to = floor(random(0, values.size.to*1.5))
   }

   values.hueDark.to = floor(random(0,360))
   values.hueLight.to = floor(random(0,360))

   writeValuesToURL()
   writeValuesToGUI()
   return
}

function draw () {
   // if a "to" value in the values object is not undefined, get closer to it by increasing that "lerp"
   // when the "lerp" value is at 6, the "to" value has been reached,
   // and can be cleared again, new "from" value set.

   if (randomizeAuto && frameCount%60 === 0) {
      randomizeValues()
   }
   caretTimer++ // like frameCount

   Object.keys(values).forEach(key => {
      const slider = values[key]

      if (slider.to !== undefined) {
         if (slider.lerp >= lerpLength) {
            //destination reached
            slider.from = slider.to
            slider.to = undefined
            slider.lerp = 0
         } else {
            //increment towards destination
            slider.lerp++
            if (mode.svg) {
               slider.lerp = lerpLength
            }
         }
      }
   });

   // calculate in between values for everything
   function lerpValues (slider, col) {
      if (col !== undefined) {
         let saturation; let lightness;
         if (col === "dark") {
            if (mode.dark) {
               saturation = 100
               lightness = 6
            } else {
               saturation = 100
               lightness = 20
            }
         } else if (col === "light") {
            if (mode.dark) {
               saturation = 100
               lightness = 90
            } else {
               saturation = 100
               lightness = 99
            }
         }
         const colorFrom = color('hsl('+slider.from+', '+saturation+'%, '+lightness+'%)')
         const colorTo = color('hsl('+slider.to+', '+saturation+'%, '+lightness+'%)')
         if (slider.to === undefined) { return colorFrom }
         return lerpColor(colorFrom, colorTo, slider.lerp/lerpLength)
      }

      // not a color
      if (slider.to === undefined) {
         return slider.from
      } else {
         return map(slider.lerp,0,lerpLength,slider.from, slider.to)
      }
   }

   animSize = lerpValues(values.size)
   animRings = lerpValues(values.rings)
   animSpacing = lerpValues(values.spacing)
   animOffsetX = lerpValues(values.offsetX)
   animOffsetY = lerpValues(values.offsetY)
   animStretchX = lerpValues(values.stretchX)
   animStretchY = lerpValues(values.stretchY)
   animWeight = lerpValues(values.weight)
   animAscenders = lerpValues(values.ascenders)
   animColorDark = lerpValues(values.hueDark, "dark")
   animColorLight = lerpValues(values.hueLight, "light")
   animZoom = lerpValues(values.zoom)

   const lightColor = (mode.mono || mode.xray) ? color("white") : animColorLight
   const darkColor = (mode.mono || mode.xray) ? color("black") : animColorDark

   if (!mode.dark) {
      // light mode
      palette.bg = lightColor
      palette.fg = darkColor
      palette.xrayBg = color("#D9B4FF")
      palette.xrayBgCorner = color("#BAF174")
      palette.xrayStretch = color("#FFD2ED")
      palette.xrayStretchCorner = color("#F4FF7B")
      palette.xrayFg = color("#4378FF")
      palette.xrayFgCorner = color("#0BCB58")
   } else {
      // dark mode
      palette.bg = darkColor
      palette.fg = lightColor
      palette.xrayBg = color("#6E119A")
      palette.xrayBgCorner = color("#2B5E03")
      palette.xrayStretch = color("#3B0F9A")
      palette.xrayStretchCorner = color("#043F58")
      palette.xrayFg = color("#FF8514")
      palette.xrayFgCorner = color("#98EE2B")
   }

   document.documentElement.style.setProperty('--fg-color', rgbValues(palette.fg))
   document.documentElement.style.setProperty('--bg-color', rgbValues(palette.bg))

   background(palette.bg)
   if (webglEffects.includes(effect)) {
      orbitControl()
      ambientLight(60, 60, 60);
      pointLight(255, 255, 255, 0, 0, 100);
   } 
   strokeWeight(0.3*strokeScaleFactor)

   drawElements()

   if (!mode.svg) {
      loop()
      return;
   }

   // IN SVG MODE

   // resize canvas to fit text better
   const hMargin = 3
   const vMargin = 3
   const newWidth = Math.max(...totalWidth) + hMargin*2
   const newHeight = (linesArray.length) * Math.max(...totalHeight) + vMargin*2
   resizeCanvas(newWidth*values.zoom.from, newHeight*values.zoom.from)

   //first draw only
   if (initialDraw) {
      initialDraw = false
      loop()
   } else {
      noLoop()
   }
}


function drawElements() {
   push()
   if (webglEffects.includes(effect)) translate(-width/2, -height/2)
   scale(animZoom)
   translate(3, 3)

   translate(0, max(animAscenders, 1))

   strokeWeight((animWeight/10)*strokeScaleFactor)
   palette.fg.setAlpha(255)

   push()
   translate(0,0.5*animSize)

   for (let i = 0; i < linesArray.length; i++) {
      drawTextAt(i)
   }
   pop()
   pop()
}

function getInnerSize (size, rings) {
   let innerSize = min(size - (rings-1) * 2, size)

   if (animSize % 2 === 0) {
      return max(2, innerSize)
   }
   return max(1, innerSize)
}

function charInSet (char, sets) {

   let found = false
   sets.forEach((set) => {
      if (found === false) {
         if (set === "ul") {
            //up left sharp
            found = "bhikltuüvwym".includes(char) || (mode.altNH && "n".includes(char)) || !validLetters.includes(char)
         }
         else if (set === "dl") {
            //down left sharp
            found = "hikmnprfv".includes(char) || !validLetters.includes(char)
         }
         else if (set === "ur") {
            //up right sharp
            found = "dijuüvwymg".includes(char) || (mode.altNH && "nh".includes(char)) || !validLetters.includes(char)
         }
         else if (set === "dr") {
            //down right sharp
            found = "aähimnqye".includes(char) || !validLetters.includes(char)
         }
         else if (set === "gap") {
            //separating regular letters
            found = "., :;-_!?‸|".includes(char)
         }
      }
   });
   return found
}


function drawTextAt (lineNum) {

   // current line text
   let lineText = linesArray[lineNum].toLowerCase()

   // include caret into line so that it can be rendered
   if (writingFocused && !mode.xray && !mode.svg && (writeEl.selectionStart === writeEl.selectionEnd)) {
      let totalChars = 0
      for (let l = 0; l < linesArray.length; l++) {
         //found current line
         if (l === lineNum) {
            for (let c = 0; c < lineText.length+1; c++) {
               if (caretTimer % 40 < 25 && totalChars+c === writeEl.selectionStart) {
                  //insert caret character at position
                  lineText = lineText.slice(0,c) + "‸" + lineText.slice(c)
                  break;
               }
            }
         } else {
            totalChars += linesArray[l].length + 1
         }
      }
   }

   // fadeout in wavemode
   function waveInner (i, inner, size) {
      if (!mode.wave) {
         return inner
      }
      return min(size, inner + i*2)
   }

   function lineWidthUntil (lineText, charIndex) {
      let total = 0
      //add to total letter per letter until index is reached
      for (let c = 0; c < charIndex; c++) {
         // get characters
         const char = lineText[c]
         const nextchar = (lineText[c+1] !== undefined) ? lineText[c+1] : " "
         const prevchar = (lineText[c-1] !== undefined) ? lineText[c-1] : " "
         // WIP not writing this twice lol
         let letterInner = getInnerSize(animSize, animRings) //+ [2,4,3,-2,0,2,4,5][i % 8]
         let letterOuter = animSize //+ [2,4,3,-2,0,2,4,5][i % 8]
         letterInner = waveInner(c, letterInner, letterOuter)

         const extendOffset = ((letterOuter % 2 == 0) ? 0 : 0.5) + (animStretchX-(animStretchX%2))*0.5
         const isLastLetter = (c === charIndex)
         total += letterKerning(isLastLetter, prevchar, char, nextchar, animSpacing, letterInner, letterOuter, extendOffset)
      }
      return total
   }

   function offsetUntil (lineText, charIndex) {
      let total = 0
      for (let c = 0; c < charIndex; c++) {
         // get characters
         const char = lineText[c]
         const nextchar = (lineText[c+1] !== undefined) ? lineText[c+1] : " "
         const prevchar = (lineText[c-1] !== undefined) ? lineText[c-1] : " "

         total += letterYOffsetCount(prevchar, char, nextchar)
      }
      return total;
   }

   // go through the letters once to get total spacing
   totalWidth[lineNum] = lineWidthUntil(lineText, lineText.length)
   // total height
   totalHeight[lineNum] = animSize + Math.abs(animOffsetY) + animStretchY + animAscenders + 1

   // wip test: always fit on screen?
   //values.zoom.from = (width) / (Math.max(...totalWidth)+7)

   //translate to account for x offset
   push()
   if (animOffsetX < 0) {
      translate(-animOffsetX,0)
   }

   // draw line below everything
   if (gridType !== "") {
      drawGrid(gridType)
   }

   // go through all the letters, but this time to actually draw them
   // go in a weird order so that lower letters go first
   let prevOverlapCharCount = 0
   for (let c = 0; c < lineText.length; c++) {
      const char = lineText[c]
      if ("sjzx".includes(char)) {
         prevOverlapCharCount++
      }
   }

   //fox ... count from 0, give x letter, give pos 2
   let layerArray = []
   let prevOverlapCharUntil = 0
   let regularCharUntil = 0
   for (let c = 0; c < lineText.length; c++) {
      const char = lineText[c]
      if ("sjzx".includes(char)) {
         prevOverlapCharUntil++
         layerArray.push(-prevOverlapCharUntil + prevOverlapCharCount)
      } else {
         layerArray.push(regularCharUntil + prevOverlapCharCount)
         regularCharUntil++
      }
   }


   // make array that will track every vertical connection spot (rounded to grid)
   const lineStyle = {
      midlineSpots: [],
      caretSpots: [],
   }


   for (let layerPos = 0; layerPos < lineText.length; layerPos++) {

      // VALUES -----------------------------------------------------------------------------

      // get characters
      //(WIP)
      const letter = lineText[layerArray.indexOf(layerPos)]
      const nextLetter = (lineText[layerArray.indexOf(layerPos)+1] !== undefined) ? lineText[layerArray.indexOf(layerPos)+1] : " "
      const prevLetter = (lineText[layerArray.indexOf(layerPos)-1] !== undefined) ? lineText[layerArray.indexOf(layerPos)-1] : " "

      // ring sizes for this character
      let letterInner = getInnerSize(animSize, animRings) //+ [2,4,3,-2,0,2,4,5][i % 8]
      let letterOuter = animSize //+ [2,4,3,-2,0,2,4,5][i % 8]

      // change depending on the character index (i) if wave mode is on
      letterInner = waveInner(layerArray.indexOf(layerPos), letterInner, letterOuter)

      // array with all ring sizes for that letter
      let ringSizes = []
      for (let b = letterOuter; b >= letterInner-2; b-=2) {
         // smallest ring is animated
         let size = (b < letterInner) ? letterInner : b
         ringSizes.push(size)
      }

      const ascenders = animAscenders
      const descenders = animAscenders
      const oneoffset = (letterOuter>3 && letterInner>2) ? 1 : 0
      const wideOffset = 0.5*letterOuter + 0.5*letterInner
      const extendOffset = ((letterOuter % 2 === 0) ? 0 : 0.5) + (animStretchX-animStretchX%2)*0.5

      // style per letter, modify during drawing when needed
      const style = {
         //for entire line, but need while drawing
         midlineSpots: lineStyle.midlineSpots,
         caretSpots: lineStyle.caretSpots,
         // position and offset after going through all letters in the line until this point
         posFromLeft: lineWidthUntil(lineText, layerArray.indexOf(layerPos)),
         posFromTop: ((animOffsetY<0) ? -animOffsetY:0) + lineNum*totalHeight[lineNum],
         vOffset: offsetUntil(lineText, layerArray.indexOf(layerPos)),
         // basics
         sizes: ringSizes,
         opacity: 1,
         stroke: animWeight,
         offsetX: animOffsetX,
         offsetY: animOffsetY,
         stretchX: animStretchX,
         stretchY: animStretchY,
         letter: letter,
         // convenient values
         weight: (letterOuter-letterInner)*0.5,
      }

      // DESCRIBING THE FILLED BACKGROUND SHAPES AND LINES OF EACH LETTER

      ;(function drawLetter () {

         const isFlipped = ("cktfe".includes(letter)) ? "" : "flipped"
         // draw chars
         switch(letter) {
            case "o":
            case "ö":
            case "d":
            case "b":
            case "p":
            case "q":
               // circle
               drawCorner(style, "round", 1, 1, 0, 0, "", "")
               drawCorner(style, "round", 2, 2, 0, 0, "", "")
               drawCorner(style, "round", 3, 3, 0, 0, "", "")
               drawCorner(style, "round", 4, 4, 0, 0, "", "")

               // SECOND LAYER
               if (letter === "d") {
                  drawLine(style, 2, 2, 0, 0, "v", ascenders)
               }
               else if (letter === "b") {
                  drawLine(style, 1, 1, 0, 0, "v", ascenders)
               }
               else if (letter === "q") {
                  drawLine(style, 3, 3, 0, 0, "v", descenders)
               } else if (letter === "p") {
                  drawLine(style, 4, 4, 0, 0, "v", descenders)
               } else if (letter === "ö") {
                  drawLine(style, 1, 1, 0, 0, "v", ascenders, letterOuter*0.5 + 1)
                  drawLine(style, 2, 2, 0, 0, "v", ascenders, letterOuter*0.5 + 1)
               }
               break;
            case "ß":
               drawCorner(style, "round", 2, 2, 0, 0, "", "")
               drawCorner(style, "round", 3, 3, 0, 0, "", "")
               drawCorner(style, "round", 4, 4, 0, 0, "linecut", "end")
               drawLine(style, 4, 4, 0, 0, "v", 0)

               if (ascenders >= style.weight+letterInner-1) {
                  const modifiedStyle = {...style}
                  modifiedStyle.sizes = []
                  for (let s = 0; s < style.sizes.length; s++) {
                     modifiedStyle.sizes.push(style.sizes[s]-1)
                  }
                  drawLine(style, 1, 1, 0, 0, "h", -letterOuter*0.5+0.5)
                  drawLine(style, 1, 1, 0, 0, "v", ascenders-letterOuter*0.5+0.5)
                  drawCorner(modifiedStyle, "round", 1, 1, -0.5, -ascenders -0.5, "", "", undefined, false, false, true)
                  drawCorner(modifiedStyle, "round", 2, 2, -0.5, -ascenders -0.5, "", "", undefined, false, false, true)
                  drawCorner(modifiedStyle, "round", 3, 2, -0.5, -style.weight-letterInner +0.5, "", "", undefined, false, false, true)
                  drawLine(style, 3, 2, -1, -ascenders -0.5, "v", -letterOuter*0.5+(ascenders-(style.weight+letterInner))+1, 0, false, true)
               } else {
                  drawLine(style, 1, 1, 0, 0, "v", ascenders-letterOuter*0.5)
                  drawCorner(style, "square", 1, 1, 0, -ascenders, "", "", undefined, false, false, true)
                  drawLine(style, 2, 2, 0, -ascenders, "h", -1)
               }
               break;
            case "g":
               drawCorner(style, "round", 1, 1, 0, 0, "", "")
               drawCorner(style, "round", 2, 2, 0, 0, "linecut", "start")

               if (descenders <= style.weight + 1) {
                  // if only one ring, move line down so there is a gap
                  const extragap = (letterOuter > letterInner) ? 0:1
                  const lineOffset = (extragap+style.weight > descenders) ? -(style.weight-descenders) : extragap

                  drawLine(style, 2, 3, 0, letterOuter + lineOffset, "h", 0)
                  drawLine(style, 1, 4, 0, letterOuter + lineOffset, "h", 0)
               } else if (letterOuter*0.5 + 1 <= descenders) {
                  // enough room for a proper g
                  drawLine(style, 3, 3, 0, 0, "v", descenders - letterOuter*0.5)
                  drawLine(style, 4, 4, 0, 0, "v", descenders - letterOuter*0.5, letterOuter*0.5+1)
                  drawCorner(style, "round", 3, 3, 0, descenders, "", "", undefined, false, false, true)
                  drawCorner(style, "round", 4, 4, 0, descenders, "", "", undefined, false, false, true)
               } else {
                  // square corner g
                  drawLine(style, 3, 3, 0, 0, "v", descenders - letterOuter*0.5)
                  drawCorner(style, "square", 3, 3, 0, descenders-1, "", "", undefined, false, false, true)
                  drawLine(style, 4, 4, 0, descenders-1, "h", -1)
               }

               drawCorner(style, "round", 3, 3, 0, 0, "", "")
               drawCorner(style, "round", 4, 4, 0, 0, "", "")

               drawLine(style, 2, 2, 0, 0, "h", 0)
               //drawLine(style, 3, 3, 0, 0, "v", 0)
               break;
            case "c":
               drawCorner(style, "round", 1, 1, 0, 0, "", "")
               if (charInSet(nextLetter, ["ul", "gap"])) {
                  drawCorner(style, "round", 2, 2, 0, 0, "linecut", "end", undefined, true)
               } else {
                  drawCorner(style, "round", 2, 2, 0, 0, "roundcut", "end", undefined, false)
               }
               if (charInSet(nextLetter, ["dl", "gap"])) {
                  drawCorner(style, "round", 3, 3, 0, 0, "linecut", "start", undefined, true)
               } else {
                  drawCorner(style, "round", 3, 3, 0, 0, "roundcut", "start", undefined, false)
               }
               drawCorner(style, "round", 4, 4, 0, 0, "", "")
               break;
            case "e":
               drawCorner(style, "round", 1, 1, 0, 0, "", "")
               drawCorner(style, "round", 2, 2, 0, 0, "", "")
               if (((letterOuter-letterInner)/2+1)*tan(HALF_PI/4) < letterInner/2-2){
                  drawCorner(style, "diagonal", 3, 3, 0, 0, "linecut", "end")
               } else {
                  drawCorner(style, "round", 3, 3, 0, 0, "linecut", "end", undefined, true)
               }
               drawCorner(style, "round", 4, 4, 0, 0, "", "")

               // SECOND LAYER
               if ("s".includes(nextLetter)) {
                  drawLine(style, 3, 3, 0, 0, "h", 1)
               } else if (charInSet(nextLetter,["gap"]) || "gz".includes(nextLetter)) {
                  drawLine(style, 3, 3, 0, 0, "h", 0)
               } else if (!charInSet(nextLetter,["dl", "gap"]) && letterInner <= 2) {
                  drawLine(style, 3, 3, 0, 0, "h", letterOuter*0.5 + animStretchX)
               } else if ("x".includes(nextLetter)) {
                  drawLine(style, 3, 3, 0, 0, "h", letterOuter*0.5 + animStretchX-style.weight)
               } else if (!charInSet(nextLetter,["dl"])) {
                  drawLine(style, 3, 3, 0, 0, "h", -oneoffset+max(animSpacing, -style.weight))
               } else if (animSpacing < 0) {
                  drawLine(style, 3, 3, 0, 0, "h", -oneoffset+max(animSpacing, -style.weight))
               } else if (animSpacing > 0){
                  drawLine(style, 3, 3, 0, 0, "h", 0)
               } else {
                  drawLine(style, 3, 3, 0, 0, "h", -oneoffset)
               }
               break;
            case "a":
            case "ä":
               drawCorner(style, "round", 1, 1, 0, 0, "", "")
               drawCorner(style, "round", 2, 2, 0, 0, "", "")
               if (((letterOuter-letterInner)/2+1)*tan(HALF_PI/4) < letterInner/2-2){
                  drawCorner(style, "diagonal", 3, 3, 0, 0, "linecut", "start")
               } else {
                  drawCorner(style, "round", 3, 3, 0, 0, "linecut", "start", undefined, true)
               }
               drawCorner(style, "round", 4, 4, 0, 0, "", "")

               // SECOND LAYER
               drawLine(style, 3, 3, 0, 0, "v", 0)

               if (letter === "ä") {
                  drawLine(style, 1, 1, 0, 0, "v", ascenders, letterOuter*0.5 + 1)
                  drawLine(style, 2, 2, 0, 0, "v", ascenders, letterOuter*0.5 + 1)
               }
               break;
            case "n":
               if (mode.altNH) {
                  drawCorner(style, "square", 1, 1, 0, 0, "", "")
                  drawCorner(style, "square", 2, 2, 0, 0, "", "")
               } else {
                  drawCorner(style, "round", 1, 1, 0, 0, "", "")
                  drawCorner(style, "round", 2, 2, 0, 0, "", "")
               }
               drawLine(style, 3, 3, 0, 0, "v", 0)
               drawLine(style, 4, 4, 0, 0, "v", 0)
               break;
            case "m":
               if (mode.altM) {
                  drawCorner(style, "square", 1, 1, 0, 0, "", "")
                  drawCorner(style, "square", 2, 2, 0, 0, "", "")
                  drawLine(style, 3, 3, 0, 0, "v", 0)
                  drawLine(style, 4, 4, 0, 0, "v", 0)
                  // SECOND LAYER
                  drawCorner(style, "square", 2, 1, wideOffset + animStretchX*2, 0, "", "", "flipped")
                  drawCorner(style, "square", 1, 2, wideOffset, 0, "branch", "start", "flipped")
                  drawLine(style, 4, 3, wideOffset, 0, "v", 0, undefined, "flipped")
                  drawLine(style, 3, 4, wideOffset + animStretchX*2, 0, "v", 0, undefined, "flipped")
               } else {
                  drawCorner(style, "diagonal", 1, 1, 0, 0, "", "")
                  drawCorner(style, "diagonal", 2, 2, 0, 0, "", "")
                  drawLine(style, 3, 3, 0, 0, "v", 0)
                  drawLine(style, 4, 4, 0, 0, "v", 0)
                  // SECOND LAYER
                  drawCorner(style, "diagonal", 2, 1, wideOffset + animStretchX*2, 0, "", "", "flipped")
                  drawCorner(style, "diagonal", 1, 2, wideOffset, 0, "", "", "flipped")
                  drawLine(style, 4, 3, wideOffset, 0, "v", 0, undefined, "flipped")
                  drawLine(style, 3, 4, wideOffset + animStretchX*2, 0, "v", 0, undefined, "flipped")
               }
               break;
            case "s":
               if (!mode.altS) {
                  //LEFT OVERLAP
                  if (prevLetter === "s") {
                     drawCorner(style, "round", 4, 4, 0, 0, "roundcut", "end", isFlipped)
                  } else if (prevLetter === "r") {
                     drawCorner(style, "round", 4, 4, 0, 0, "linecut", "end", isFlipped)
                  } else if (!charInSet(prevLetter,["gap", "dr"]) && !"fk".includes(prevLetter)) {
                     drawCorner(style, "round", 4, 4, 0, 0, "roundcut", "end", isFlipped)
                  }
                  let xOffset = 0
                  //start further left if not connecting left
                  if (charInSet(prevLetter,["gap", "dr"])) {
                     xOffset = -letterOuter*0.5 + extendOffset -animStretchX
                     drawCorner(style, "round", 3, 3, xOffset, 0, "extend", "end", isFlipped)
                  } else {
                     drawCorner(style, "round", 3, 3, xOffset, 0, "", "", isFlipped)
                  }
                  if (!charInSet(nextLetter,["gap", "ul"]) && !"zxj".includes(nextLetter) || nextLetter === "s") {
                     drawCorner(style, "round", 1, 2, wideOffset + xOffset, 0, "", "", isFlipped)
                     drawCorner(style, "round", 2, 1, wideOffset + animStretchX*2 + xOffset, 0, "roundcut", "end", isFlipped)
                  } else {
                     drawCorner(style, "round", 1, 2, wideOffset + xOffset, 0, "extend", "end", isFlipped)
                  }
               } else {
                  // alternative cursive s

                  //LEFT OVERLAP
                  if (charInSet(prevchar,["dr"])) {
                     drawCorner(style, "round", 4, 4, 0, 0, "linecut", "end")
                  } else if (prevLetter !== "t") {
                     drawCorner(style, "round", 4, 4, 0, 0, "roundcut", "end")
                  }

                  drawCorner(style, "round", 2, 2, 0, 0, "", "")
                  drawCorner(style, "round", 3, 3, 0, 0, "", "")
                  if (charInSet(prevLetter,["gap"])) {
                     drawCorner(style, "round", 4, 4, 0, 0, "", "")
                  }
               }
               break;
            case "x":
               push()
               if (charInSet(prevLetter,["gap","ur"]) && charInSet(prevLetter,["gap","dr"])) {
                  translate(-style.weight-1,0)
               }

               //LEFT OVERLAP
               // top connection
               if (!charInSet(prevLetter,["gap"]) && prevLetter !== "x") {
                  if (charInSet(prevLetter,["ur"]) || "l".includes(prevLetter)) {
                     drawCorner(style, "round", 1, 1, 0, 0, "linecut", "start")
                  } else if (prevLetter !== "t"){
                     drawCorner(style, "round", 1, 1, 0, 0, "roundcut", "start")
                  }
               }
               // bottom connection
               if (!"xef".includes(prevLetter) && !charInSet(prevLetter,["gap"])) {
                  if (prevLetter === "s" && !mode.altS) {
                     drawCorner(style, "round", 4, 4, 0, 0, "roundcut", "end", isFlipped)
                  } else if (prevLetter === "r" || charInSet(prevLetter,["dr"])) {
                     drawCorner(style, "round", 4, 4, 0, 0, "linecut", "end", isFlipped)
                  } else {
                     drawCorner(style, "round", 4, 4, 0, 0, "roundcut", "end", isFlipped)
                  }
               }

               if (charInSet(prevLetter, ["gap"])) {
                  drawCorner(style, "round", 1, 1, 0, 0, "linecut", "start", undefined, true)
               }
               drawCorner(style, "round", 2, 2, 0, 0, "", "")
               drawCorner(style, "round", 4, 3, wideOffset, 0, "", "")

               if (nextLetter !== "x") {
                  if (!charInSet(nextLetter,["dl", "gap"])) {
                     drawCorner(style, "round", 3, 4, wideOffset + animStretchX*2, 0, "roundcut", "start")
                  } else {
                     drawCorner(style, "round", 3, 4, wideOffset + animStretchX*2, 0, "linecut", "start", undefined, true)
                  }
               }

               // SECOND LAYER
               drawCorner(style, "diagonal", 1, 2, wideOffset, 0, "", "", "flipped")
               if (nextLetter !== "x") {
                  if (!charInSet(nextLetter,["gap", "ul"])) {
                     drawCorner(style, "round", 2, 1, wideOffset+ animStretchX*2, 0, "roundcut", "end", "flipped")
                  } else {
                     drawCorner(style, "round", 2, 1, wideOffset+ animStretchX*2, 0, "linecut", "end", "flipped", true)
                  }
               }
               drawCorner(style, "diagonal", 3, 3, 0, 0, "", "", "flipped")
               if (charInSet(prevLetter,["gap"])) {
                  drawCorner(style, "round", 4, 4, 0, 0, "linecut", "end", "flipped", true)
               }
               pop()
               break;
            case "u":
            case "ü":
            case "y":
               drawLine(style, 1, 1, 0, 0, "v", 0)
               drawLine(style, 2, 2, 0, 0, "v", 0)
               drawCorner(style, "round", 3, 3, 0, 0, "", "")
               drawCorner(style, "round", 4, 4, 0, 0, "", "")

               // SECOND LAYER
               if (letter === "y") {
                  drawLine(style, 3, 3, 0, 0, "v", descenders)
               } else if (letter === "ü") {
                  drawLine(style, 1, 1, 0, 0, "v", ascenders, letterOuter*0.5 + 1)
                  drawLine(style, 2, 2, 0, 0, "v", ascenders, letterOuter*0.5 + 1)
               }
               break;
            case "w":
               drawLine(style, 1, 1, 0, 0, "v", 0)
               drawLine(style, 2, 2, 0, 0, "v", 0)
               drawCorner(style, "diagonal", 3, 3, 0, 0, "", "")
               drawCorner(style, "diagonal", 4, 4, 0, 0, "", "")

               drawLine(style, 2, 1, wideOffset + animStretchX*2, 0, "v", 0, undefined, "flipped")
               drawLine(style, 1, 2, wideOffset, 0, "v", 0, undefined, "flipped")
               drawCorner(style, "diagonal", 4, 3, wideOffset, 0, "", "", "flipped")
               drawCorner(style, "diagonal", 3, 4, wideOffset + animStretchX*2, 0, "", "", "flipped")
               break;
            case "r":
               drawCorner(style, "round", 1, 1, 0, 0, "", "")
               if (charInSet(nextLetter,["ul", "gap"])) {
                  drawCorner(style, "round", 2, 2, 0, 0, "linecut", "end", undefined, true)
               } else {
                  drawCorner(style, "round", 2, 2, 0, 0, "roundcut", "end")
               }
               drawLine(style, 4, 4, 0, 0, "v", 0)
               break;
            case "l":
            case "t":

               if (letter === "t") {
                  drawLine(style, 1, 1, 0, 0, "v", ascenders)
                  drawCorner(style, "square", 1, 1, 0, 0, "branch", "end")
                  if (!"zx".includes(nextLetter)) {
                     if (charInSet(nextLetter,["ul", "gap"]) || letterInner > 2) {
                        drawLine(style, 2, 2, 0, 0, "h", -style.weight-1 + ((letterInner<2) ? 1 : 0))
                     } else {
                        drawLine(style, 2, 2, 0, 0, "h", letterOuter*0.5-style.weight)
                     }
                  }
               } else {
                  drawLine(style, 1, 1, 0, 0, "v", ascenders)
               }

               drawCorner(style, "round", 4, 4, 0, 0, "", "")
               if (charInSet(nextLetter,["dl", "gap"])) {
                  drawCorner(style, "round", 3, 3, 0, 0, "linecut", "start", undefined, true)
               } else {
                  drawCorner(style, "round", 3, 3, 0, 0, "roundcut", "start", undefined, false)
               }
               break;
            case "f":
               drawCorner(style, "round", 1, 1, 0, 0, "", "")
               if (charInSet(nextLetter,["ul", "gap"])) {
                  drawCorner(style, "round", 2, 2, 0, 0, "linecut", "end", undefined, true)
               } else {
                  drawCorner(style, "round", 2, 2, 0, 0, "roundcut", "end", undefined, false)
               }
               drawLine(style, 4, 4, 0, 0, "v", descenders)
               drawCorner(style, "square", 4, 4, 0, 0, "branch", "start")

               // SECOND LAYER
               if (!"sx".includes(nextLetter)) {
                  if (charInSet(nextLetter,["dl", "gap"]) || letterInner > 2) {
                     drawLine(style, 3, 3, 0, 0, "h", -style.weight-1 + ((letterInner<2) ? 1 : 0))
                  } else {
                     drawLine(style, 3, 3, 0, 0, "h", letterOuter*0.5-style.weight)
                  }
               }
               break;
            case "k":
               drawLine(style, 1, 1, 0, 0, "v", ascenders)
               drawLine(style, 4, 4, 0, 0, "v", 0)
               drawCorner(style, "diagonal", 1, 1, style.weight, 0, "", "")
               drawCorner(style, "diagonal", 4, 4, style.weight, 0, "", "")
               if (!"x".includes(nextLetter)) {
                  drawLine(style, 2, 2, style.weight, 0, "h", -oneoffset-style.weight)
               }
               if (!"sx".includes(nextLetter)) {
                  if (!(charInSet(nextLetter,["dl", "gap"]))) {
                     drawCorner(style, "round", 3, 3, style.weight, 0, "roundcut", "start")
                  } else {
                     drawLine(style, 3, 3, style.weight, 0, "h", -oneoffset-style.weight)
                  }
               }
               break;
            case "h":
               drawLine(style, 1, 1, 0, 0, "v", ascenders, 0)

               // SECOND LAYER
               if (mode.altNH) {
                  drawCorner(style, "square", 1, 1, 0, 0, "branch", "end")
                  drawCorner(style, "square", 2, 2, 0, 0, "", "")
               } else {
                  drawCorner(style, "round", 1, 1, 0, 0, "", "")
                  drawCorner(style, "round", 2, 2, 0, 0, "", "")
               }
               drawLine(style, 3, 3, 0, 0, "v", 0)
               drawLine(style, 4, 4, 0, 0, "v", 0)
               break;
            case "v":
               drawLine(style, 1, 1, 0, 0, "v", 0)
               drawLine(style, 2, 2, 0, 0, "v", 0)
               if (((letterOuter-letterInner)/2+1)*tan(HALF_PI/4) < letterInner/2-2){
                  drawCorner(style, "diagonal", 3, 3, 0, 0, "", "")
                  drawCorner(style, "diagonal", 4, 4, 0, 0, "", "")
               } else {
                  drawCorner(style, "diagonal", 3, 3, 0, 0, "", "")
                  drawCorner(style, "square", 4, 4, 0, 0, "", "")
               }
               break;
            case ".":
               drawLine(style, 4, 4, 0, 0, "v", 0, letterOuter*0.5 - (style.weight+0.5))
               break;
            case ",":
               drawLine(style, 4, 4, 0, 0, "v", descenders, letterOuter*0.5 - (style.weight+0.5))
               break;
            case "!":
               // wip
               drawLine(style, 1, 1, 0, 0, "v", ascenders,)
               drawLine(style, 4, 4, 0, 0, "v", -style.weight-1.5)
               drawLine(style, 4, 4, 0, 0, "v", 0, letterOuter*0.5 - (style.weight+0.5))
               break;
            case "?":
               // wip
               drawCorner(style, "round", 1, 1, 0, 0, "", "")
               drawCorner(style, "round", 2, 2, 0, 0, "", "")
               drawCorner(style, "round", 3, 3, 0, 0, "", "")
               drawCorner(style, "round", 4, 4, 0, 0, "linecut", "end")
               drawLine(style, 4, 4, 0, 0, "v", ascenders, letterOuter*0.5 - (style.weight+0.5))
               break;
            case "i":
               drawLine(style, 1, 1, 0, 0, "v", ascenders, letterOuter*0.5 + 1)
               drawLine(style, 1, 1, 0, 0, "v", 0)
               drawLine(style, 4, 4, 0, 0, "v", 0)
               break;
            case "j":
               let leftOffset = 0
               if (charInSet(prevLetter,["gap"])) {
                  leftOffset = -style.weight-1
               }

               // LEFT OVERLAP
               if (prevLetter !== undefined) {
                  if (charInSet(prevLetter,["dr", "gap"]) || "r".includes(prevLetter)) {
                     drawCorner(style, "round", 4, 4, leftOffset, 0, "linecut", "end", undefined, true)
                  } else if (!"tk".includes(prevLetter)) {
                     drawCorner(style, "round", 4, 4, leftOffset, 0, "roundcut", "end")
                  }
                  if (!charInSet(prevLetter,["tr"]) && !"ckrsx".includes(prevLetter)) {
                     drawLine(style, 1, 1, leftOffset, 0, "h", -style.weight-1)
                  }
               }
               
               drawLine(style, 2, 2, leftOffset, 0, "v", ascenders, letterOuter*0.5 + 1)
               drawCorner(style, "square", 2, 2, leftOffset, 0, "", "")
               drawCorner(style, "round", 3, 3, leftOffset, 0, "", "")
               if (prevLetter === undefined) {
                  drawLine(style, 1, 1, leftOffset, 0, "h", -style.weight-1)
                  drawCorner(style, "round", 4, 4, leftOffset, 0, "linecut", "end")
               }
               break;
            case "z":
               let oddOffset = (letterOuter % 2 === 0) ? 0 : 0.5
               // TOP LEFT OVERLAP
               if (charInSet(prevLetter,["ur"])) {
                  drawCorner(style, "round", 1, 1, 0, 0, "linecut", "start")
               } else if (!charInSet(prevLetter,["gap"])) {
                  drawCorner(style, "round", 1, 1, 0, 0, "roundcut", "start")
               } else if (charInSet(prevLetter, ["gap"])) {
                  drawCorner(style, "round", 1, 1, 0, 0, "", "")
               }

               drawLine(style, 2, 2, 0, 0, "h", 1+oddOffset*2)
               drawCorner(style, "diagonal", 1, 2, letterOuter*0.5 +1+oddOffset, 0, "", "", "flipped")

               // BOTTOM RIGHT OVERLAP
               if (charInSet(nextLetter,["dl"])) {
                  drawCorner(style, "round", 3, 4, style.weight+2+animStretchX*2+oddOffset*2, 0, "linecut", "start")
               } else if (!charInSet(nextLetter,["gap"])) {
                  drawCorner(style, "round", 3, 4, style.weight+2+animStretchX*2+oddOffset*2, 0, "roundcut", "start")
               } else {
                  drawCorner(style, "round", 3, 4, style.weight+2+animStretchX*2+oddOffset*2, 0, "", "")
               }

               drawCorner(style, "diagonal", 3, 3, style.weight+1-letterOuter*0.5+oddOffset, 0, "", "", "flipped")
               drawLine(style, 4, 3, style.weight+2+oddOffset*2, 0, "h", 1+oddOffset*2)
               break;
            case "-":
               style.sizes = [letterOuter]
               drawLine(style, 1, 1, 0, +letterOuter*0.5, "h", -1)
               drawLine(style, 2, 2, 0, +letterOuter*0.5, "h", -1)
               break;
            case "_":
               style.sizes = [letterOuter]
               drawLine(style, 3, 3, 0, 0, "h", -1)
               drawLine(style, 4, 4, 0, 0, "h", -1)
               break;
            case " ":
               break;
            case "‸":
               //caret symbol
               style.opacity = 0.5
               style.sizes = [letterOuter]
               drawLine(style, 1, 1, 1, 0, "v", animAscenders)
               drawLine(style, 4, 4, 1, 0, "v", animAscenders)
               break;
            case "|":
               style.sizes = [letterOuter]
               drawLine(style, 1, 1, 0, 0, "v", animAscenders)
               drawLine(style, 4, 4, 0, 0, "v", animAscenders)
               break;
            default:
               style.sizes = [letterOuter]
               drawCorner(style, "square", 1, 1, 0, 0, "", "")
               drawCorner(style, "square", 2, 2, 0, 0, "", "")
               drawCorner(style, "square", 3, 3, 0, 0, "", "")
               drawCorner(style, "square", 4, 4, 0, 0, "", "")
               break;
         }
      })()
   }

   if (mode.xray) {
      drawGrid("debug")
   }

   if (midlineEffects.includes(effect)) {
      drawMidlineEffects()
   }

   function drawGrid (type) {
      push()
      if (webglEffects.includes(effect)) translate(0,0,-1)
      const height = animSize + Math.abs(animOffsetY) + animStretchY
      const width = totalWidth[lineNum] + Math.abs(animOffsetX)
      const asc = animAscenders

      if (type === "debug") {
         palette.fg.setAlpha(50)
         stroke(palette.fg)
         strokeWeight(0.1*strokeScaleFactor)
   
         const i = lineNum * totalHeight[lineNum] - animSize/2
         if (animOffsetX<0) {
            translate(animOffsetX,0)
         }

         //vertical gridlines
         lineType(0, i, width, i)
         lineType(0, i+height, width, i+height)
         lineType(0, i-asc, width, i-asc)
         lineType(0, i+height/2-animOffsetY*0.5, width, i+height/2-animOffsetY*0.5)
         lineType(0, i+height/2+animOffsetY*0.5, width, i+height/2+animOffsetY*0.5)
         lineType(0, i+height+asc, width, i+height+asc)
   
         //horizontal gridlines
         push()
         translate(0,i+height*0.5)
         for (let j = 0; j <= width; j++) {
            lineType(j, -height/2-asc, j, height/2+asc)
         }
         pop()

         // markers for start of each letter
         push()
         translate(0,i+height*0.5)
         noStroke()
         fill((mode.dark) ? "#FFBB00E0" : "#2222FFA0")
         for (let c = 0; c <= lineText.length; c++) {
            const xpos = lineWidthUntil(lineText, c)
            ellipse(xpos, 0, 0.9, 0.9)
         }
         pop()

      } else if (!mode.xray){
         stroke(palette.fg)
         strokeWeight((animWeight/10)*1*strokeScaleFactor)
         const i = lineNum * totalHeight[lineNum] - animSize/2
         push()
         translate(0,i+height*0.5)
         if (animOffsetX<0) {
            translate(animOffsetX,0)
         }
         if (type === "vertical" || type === "grid") {
            for (let j = 0; j <= width; j++) {
              lineType(j, -height/2-asc, j, height/2+asc)
            }
         }
         if (type === "horizontal" || type === "grid") {
            let middleLine = ((animSize + animStretchY + animOffsetY) % 2 === 0) ? 0 : 0.5
            for (let k = middleLine; k <= totalHeight[lineNum]/2; k++) {
              lineType(0, k, width, k)
              lineType(0, -k, width, -k)
            }
         }
         pop()
      }
      palette.bg.setAlpha(255)
      palette.fg.setAlpha(255)
      pop()
   }

   function drawMidlineEffects () {
      push()
         stroke(palette.fg)
         noFill()
         strokeWeight((animWeight/10)*strokeScaleFactor)
         if (mode.xray) {
            strokeWeight(0.2*strokeScaleFactor)
         }
         translate(0, (Math.abs(animOffsetY) + animStretchY)*0.5 + lineNum * totalHeight[lineNum])

         const total = lineStyle.midlineSpots.length-1

         //style and caret
         stroke(lerpColor(palette.bg, palette.fg, 0.5))
         rowLines("bezier", [lineStyle.caretSpots[0], lineStyle.caretSpots[0]+animOffsetX], animStretchY)
         stroke(palette.fg)

         let counter = 0
         let lastPos = undefined

         const leftPos = lineStyle.midlineSpots[0]
         const rightPos = lineStyle.midlineSpots[total]
         lineStyle.midlineSpots.forEach((pos) => {
            if (effect === "spread") {
               const midX = map(counter, 0, total, leftPos, rightPos) + animOffsetX*0.5
               rowLines("bezier", [pos, midX, pos+animOffsetX], animStretchY)
            } else if (effect === "compress") {
               const midX = (rightPos - total + leftPos + animOffsetX)*0.5 + counter
               rowLines("bezier", [pos, midX, pos+animOffsetX], animStretchY)
            } else if (effect === "split") {
               if (counter > 0) {
                  rowLines("bezier", [pos, lastPos+animOffsetX], animStretchY)
                  rowLines("bezier", [lastPos, pos+animOffsetX], animStretchY)
               }
            } else if (effect === "twist") {
               if (counter % 2 ==1) {
                  rowLines("bezier", [pos, lastPos+animOffsetX], animStretchY)
                  rowLines("bezier", [lastPos, pos+animOffsetX], animStretchY)
               } else if (counter === total) {
                  rowLines("bezier", [pos, pos+animOffsetX], animStretchY)
               }
            } else if (effect === "lean") {
               if (counter > 0) {
                  rowLines("bezier", [pos, lastPos+animOffsetX], animStretchY)
               }
            } else if (effect === "teeth") {
               if (counter % 2 ==1) {
                  const x = lastPos + (pos-lastPos)*0.5
                  const w = pos-lastPos
                  arc(x, -animStretchY*0.5,w,w, 0, PI)
               } else {
                  //bottom
                  const x = lastPos + (pos-lastPos)*0.5 +animOffsetX
                  const w = pos-lastPos
                  arc(x, animStretchY*0.5,w,w, PI, TWO_PI)
               }
            }
            lastPos = pos
            counter++
         })
      pop()
   }
   pop()
}

function rowLines (type, xValues, height) {
   let lastPos = undefined
   for (let c = 0; c < xValues.length; c++) {
      const pos = {x: xValues[c], y:-height*0.5 + map(c,0,xValues.length-1,0,height)}
      if (lastPos !== undefined) {
         if (type === "line") {
            lineType(lastPos.x, lastPos.y, pos.x, pos.y)
         } else if (type === "bezier") {
            const h1pos = lastPos.y + (pos.y-lastPos.y)*0.5
            const h2pos = lastPos.y + (pos.y-lastPos.y)*0.5
            bezier(lastPos.x, lastPos.y, lastPos.x, h1pos, pos.x, h2pos, pos.x, pos.y)
         }
      }
      lastPos = pos
   }
}





function letterKerning (isLastLetter, prevchar, char, nextchar, spacing, inner, outer, extendOffset) {
   const weight = (outer-inner)*0.5

   // negative spacing can't go past width of lines
   spacing = max(spacing, -weight)
   let optionalGap = (inner > 1) ? 1 : 0

   // spacing is used between letters that don't make a special ligature
   // some letters force a minimum spacing
   if (animRings > 1) {
      if (("i".includes(char) && "bhkltiv".includes(nextchar)) ||
         ("dgi".includes(char) && "i".includes(nextchar))) {
      spacing = max(spacing, 1)
      }
   } else {
      if (("i".includes(char) && "bhkltfivnmrp".includes(nextchar)) ||
         ("dgihnmaqvy".includes(char) && "i".includes(nextchar)) ||
         ("dqay".includes(char) && "bhptf".includes(nextchar)) ||
         ("nm".includes(char) && "nm".includes(nextchar))) {
      spacing = max(spacing, 1)
      }
   }
   if ("|".includes(char)) spacing = max(spacing, 1)
   if ("|".includes(nextchar)) spacing = max(spacing, 1)

   // widths of letters without overlapping
   let charWidth = outer
   switch(char) {
      case "m":
      case "w":
         charWidth = weight*3 + inner*2
         break;""
      case "x":
         charWidth = weight*2 + inner*2
         if (charInSet(prevchar,["gap","ur"]) && charInSet(prevchar,["gap","dr"])) {
            charWidth = weight*1 + inner*2 -1
         }
         break;
      case "j":
         if (charInSet(prevchar,["gap"])) {
            charWidth = weight*1 + inner -1
         }
         break;
      case "s":
         if (!mode.altS) {
            charWidth = weight*3 + inner*2
            if (charInSet(nextchar,["gap", "ul"])) {
               charWidth += -0.5*outer + optionalGap
            }
            if (charInSet(prevchar,["gap", "dr"])) {
               charWidth += -0.5*outer
            }
         }
         break;
      case "z":
         charWidth = 2 + outer + ((outer % 2 === 0) ? 0 : 1)
         break;
      case " ":
         charWidth = max([2, spacing*2, ceil(inner*0.5)])
         break;
      case "i":
      case ".":
      case ",":
      case "!":
         charWidth = weight
         break;
      case "t":
      case "l":
         if (charInSet(nextchar,["gap", "dl"])) {
            charWidth = outer-weight
         }
         break;
      case "f":
      case "c":
      case "r":
         if (charInSet(nextchar,["gap", "ul"])) {
            charWidth = outer-weight
         }
         break;
      case "?":
         charWidth = ceil(outer*0.5)
         break;
      case "‸":
         charWidth = 2
         break;
      case "|":
         charWidth = 0
         break;
   }

   // 1 less space after letters with cutoff
   if ("ktlcrfsx-".includes(char) && charInSet(nextchar,["gap"]) && !"|".includes(nextchar)) {
      charWidth -= 1
   }
   // 1 less space in front of xs-
   if ("xs-".includes(nextchar) && charInSet(char,["gap"]) && !"|".includes(char)) {
      charWidth -= 1
   }

   let spacingResult = 0
   if (isLastLetter === false) {
      // overlap after letter, overwrites default variable spacing
      // only happens if it connects into next letter
      let spaceAfter = 0
      let afterConnect = false
      let minSpaceAfter
      switch(char) {
         case "s":
            if (!mode.altS) {
               if (!charInSet(nextchar,["gap", "ul"])) {
                  spaceAfter = -weight
                  afterConnect = true
               } else {
                  minSpaceAfter = 0
               }
            }
            break;
         case "k":
         case "z":
            if (!charInSet(nextchar,["gap", "dl"])) {
               afterConnect = true
            } else {
               minSpaceAfter = 0
            }
            break;
         case "x":
            if (!(charInSet(nextchar,["gap", "dl"]) && charInSet(nextchar,["gap", "ul"]))) {
               afterConnect = true
            } else {
               minSpaceAfter = 0
            }
            break;
         case "t":
         case "l":
            if (!charInSet(nextchar,["gap", "dl"])) {
               spaceAfter = -weight
               afterConnect = true
            } else {
               minSpaceAfter = 0
            }
            break;
         case "f":
         case "c":
         case "r":
            if (!charInSet(nextchar,["gap", "ul"])) {
               spaceAfter = -weight
               afterConnect = true
            } else {
               minSpaceAfter = 0
            }
            break;
         case ".":
         case ",":
         case "!":
         case "?":
            if (!charInSet(nextchar,["gap"])) {
               minSpaceAfter = 1
            }
      }

      // depending on the next letter, adjust the spacing
      // only if the current letter doesn't already overlap with it
      let spaceBefore = 0
      let beforeConnect = false
      let minSpaceBefore
      if (afterConnect === false) {
         switch(nextchar) {
            case "s":
               if (!mode.altS) {
                  if (!charInSet(char,["gap", "dr"])) {
                     spaceBefore = -weight
                     beforeConnect = true
                  } else {
                     if ("e".includes(char)) {
                        beforeConnect = true
                        spaceBefore = optionalGap
                     } else {
                        minSpaceBefore = optionalGap
                     }
                  }
               } else {
                  //alt s
                  if (!charInSet(char, ["gap"])) {
                     spaceBefore = -weight
                     beforeConnect = true
                  }
               }
               break;
            case "x":
               if (!(charInSet(char,["gap", "ur"]) && charInSet(char,["gap", "dr"]))) {
                  spaceBefore = -weight
                  beforeConnect = true
               } else {
                  if ("e".includes(char)) {
                     beforeConnect = true
                  } else {
                     minSpaceBefore = 1
                  }
               }
               break;
            case "z":
            case "j":
               if (!(charInSet(char,["gap"]))) {
                  spaceBefore = -weight
                  beforeConnect = true
               }
               break;
            case ",":
            case ".":
            case "!":
            case "?":
               minSpaceBefore = 1
               break;
         }
      }

      //extra special combinations
      if ("ktlcrfsx".includes(char) && nextchar === "s") {
         spaceBefore = -inner-weight-animStretchX
         beforeConnect = true
      }
      if ("ktlcrfsx".includes(char) && nextchar === "x") {
         spaceBefore = -inner-weight-animStretchX
         beforeConnect = true
      }
      if ("ktlcrfsx".includes(char) && nextchar === "j") {
         spaceBefore = -inner-weight-animStretchX
         beforeConnect = true
      }
      if ("s".includes(char) && nextchar === "z") {
         spaceBefore = -inner-weight-animStretchX
         beforeConnect = true
      }

      // remove overlap spacing if next to space
      if (charInSet(nextchar,["gap"])) {
         spaceBefore = 0
         beforeConnect = false
      }
      if (charInSet(char,["gap"])) {
         spaceAfter = 0
         afterConnect = false
      }

      // if there is no special overlaps, use the global spacing
      if (afterConnect === false && beforeConnect === false) {
         //regular spacing, if above minspacing
         if (minSpaceAfter !== undefined || minSpaceBefore !== undefined) {
            if (minSpaceBefore !== undefined) {
               spacingResult = charWidth + max(spacing, minSpaceBefore)
            } else {
               spacingResult = charWidth + max(spacing-1, minSpaceAfter)
            }
         } else if (!"-_ ‸".includes(char) && !"-_ ‸".includes(nextchar)) {
            spacingResult = charWidth + spacing
         } else {
            // other punctuation?
            spacingResult = charWidth
         }
      } else {
         spacingResult = charWidth + spaceAfter + spaceBefore
      }
   } else {
      // last letter
      spacingResult = charWidth
   }

   // stretchWidth
   let stretchWidth = 0
   switch (char) {
      case "s": 
         if (!mode.altS) {
            if (charInSet(prevchar,["gap", "dr"])) {
               stretchWidth = extendOffset
            } else {
               stretchWidth = animStretchX
            }
            if (charInSet(nextchar,["gap", "ul"])) {
               stretchWidth += extendOffset
            } else {
               stretchWidth += animStretchX
            }
         }
         break;
      case "m":
      case "w":
      case "x":
      case "z":
         stretchWidth = animStretchX * 2
         break;
      case "i":
      case ".":
      case ",":
      case "!":
      case " ":
         stretchWidth = 0
         break;
      default:
         stretchWidth = animStretchX
   }

   return spacingResult + stretchWidth
}

function letterYOffsetCount (prevchar, char, nextchar) {

   // width for vertical offset
   let offsetSegments = 0
   switch (char) {
      case "m":
      case "w":
      case "x":
         offsetSegments = 2
         break;
      case "s":
         if (char === "s") {
            if (!mode.altS) {
               // stretch spacing depends on if it connects
               if (charInSet(prevchar,["gap", "dr"])) {
                  offsetSegments +=1
               }
               if (charInSet(nextchar,["gap", "ul"])) {
                  offsetSegments +=1
               }
            }
         }
         break;
      case "i":
      case ".":
      case ",":
      case "!":
      case " ":
         offsetSegments = 0
         break;
      case "z":
         offsetSegments = 2
         break;
      default:
         offsetSegments = 1
         break;
   }

   return offsetSegments
}

function arcUntil (circleSize, y, altValue) {
   //if too close
   if (y <= 0) {
      return altValue
   }

   const x = Math.sqrt(circleSize**2 - y**2)
   const theta = (Math.atan2(y, x));
   //const amount = (2*theta)/PI
   return theta
}

function arcUntilArc (sizeCircle, sizeOther, dist, altValue) {
   //if too close
   // if (da <= 2 || db <= 2) {
   //    return altValue
   // }

   const ra = sizeCircle/2
   const rb = sizeOther/2

   const x = (dist**2-rb**2+ra**2) / (2*dist)
   const y = Math.sqrt(ra**2 - x**2)
   const theta = (Math.atan2(x, y));
   //const amount = (2*theta)/PI

   if (theta < 0) {
      return altValue
   }
   return theta
}


function addLeadingChar (input, count) {
   let string = input.toString()
   const addcount = count - string.length

   if (addcount > 0) {
      string = ".".repeat(addcount) + string
   }
   return string
}


function lineType (x1, y1, x2, y2) {
   if (webglEffects.includes(effect)) {
      push()

      noStroke()
      fill(palette.fg)
      specularMaterial(palette.fg);
      for (let i = 0; i < 11; i++) {
         push()
         translate(x1+(x2-x1)*0.1*i, y1+(y2-y1)*0.1*i)
         sphere(animWeight/10,6, 6)
         pop()
      }
      //translate((x1+x2)/2, (y1+y2)/2)
      //cylinder(typeWeight/10, abs(x2-x1)+abs(y2-y1), 6, 1, false, false)
      pop()
      return
   }
   line(x1, y1, x2, y2)
}

function arcType (x, y, w, h, start, stop) {
   if (webglEffects.includes(effect)) {
      push()

      noStroke()
      fill(palette.fg)
      specularMaterial(palette.fg);
      for (let i = 0; i < 11; i++) {
         push()
         const angle = start + (stop-start)*0.1*i
         translate(x, y)
         translate(cos(angle)*(w/2), sin(angle)*(w/2))
         sphere(animWeight/10,6, 6)
         pop()
      }
      
      //endcaps
      //noStroke()
      //fill("white")
//
      //   push()
      //   translate(cos(start)*(w/2), sin(start)*(w/2))
      //   circle(x, y, (typeWeight/10)*1)
      //   pop()
//
      //   push()
      //   translate(cos(stop)*(w/2), sin(stop)*(w/2))
      //   circle(x, y, (typeWeight/10)*1)
      //   pop()
      //pop()
      return
   }
   arc(x, y, w, h, start, stop)
}

function rgbValues (color) {
   return color._getRed() + ", " + color._getGreen() + ", " + color._getBlue()
}

function createDropDown () {
   let x, i, j, l, ll, selElmnt, a, b, c;
   /* Look for any elements with the class "custom-select": */
   x = document.getElementsByClassName("custom-select");
   l = x.length;
   for (i = 0; i < l; i++) {
     selElmnt = x[i].getElementsByTagName("select")[0];
     ll = selElmnt.length;
     /* For each element, create a new DIV that will act as the selected item: */
     a = document.createElement("DIV");
     a.setAttribute("class", "select-selected");
     a.innerHTML = selElmnt.options[selElmnt.selectedIndex].innerHTML;
     x[i].appendChild(a);
     /* For each element, create a new DIV that will contain the option list: */
     b = document.createElement("DIV");
     b.setAttribute("class", "select-items select-hide");
     for (j = 1; j < ll; j++) {
       /* For each option in the original select element,
       create a new DIV that will act as an option item: */
       c = document.createElement("DIV");
       c.innerHTML = selElmnt.options[j].innerHTML;
       c.addEventListener("click", function(e) {
           /* When an item is clicked, update the original select box,
           and the selected item: */
           var y, i, k, s, h, sl, yl;
           s = this.parentNode.parentNode.getElementsByTagName("select")[0];
           sl = s.length;
           h = this.parentNode.previousSibling;
           for (i = 0; i < sl; i++) {
             if (s.options[i].innerHTML == this.innerHTML) {
               s.selectedIndex = i;
               h.innerHTML = this.innerHTML;
               y = this.parentNode.getElementsByClassName("same-as-selected");
               yl = y.length;
               for (k = 0; k < yl; k++) {
                 y[k].removeAttribute("class");
               }
               this.setAttribute("class", "same-as-selected");
               break;
             }
           }
           const selectedOptionText = s.options[s.selectedIndex].text
           dropdownTextToEffect(selectedOptionText)
           h.click();
       });
       b.appendChild(c);
     }
     x[i].appendChild(b);
     a.addEventListener("click", function(e) {
       /* When the select box is clicked, close any other select boxes,
       and open/close the current select box: */
       e.stopPropagation();
       closeAllSelect(this);
       this.nextSibling.classList.toggle("select-hide");
       this.classList.toggle("select-arrow-active");
     });
   }
   
   function closeAllSelect(elmnt) {
      /* A function that will close all select boxes in the document,
      except the current select box: */
      let x, y, i, xl, yl, arrNo = [];
      x = document.getElementsByClassName("select-items");
      y = document.getElementsByClassName("select-selected");
      xl = x.length;
      yl = y.length;
      for (i = 0; i < yl; i++) {
        if (elmnt == y[i]) {
          arrNo.push(i)
        } else {
          y[i].classList.remove("select-arrow-active");
        }
      }
      for (i = 0; i < xl; i++) {
        if (arrNo.indexOf(i)) {
          x[i].classList.add("select-hide");
        }
      }
    }
    
    /* If the user clicks anywhere outside the select box,
    then close all select boxes: */
    document.addEventListener("click", closeAllSelect); 
}

function dropdownTextToEffect (text) {

   //check previous effect
   const wasWebgl = webglEffects.includes(effect)

   switch (text) {
      case "weight gradient":
         effect = "weightgradient"
         break;
      case "color gradient":
         effect = "gradient"
         break;
      case "compress v":
         effect = "compress"
         break;
      case "spread v":
         effect = "spread"
         break;
      case "lean v":
         effect = "lean"
         break;
      case "twist v":
         effect = "twist"
         break;
      case "split v":
         effect = "split"
         break;
      case "teeth v":
         effect = "teeth"
         break;
      case "spheres (test)":
         effect = "spheres"
         break;
      default:
         effect = "none"
   }

   writeValuesToURL()

   //check current effect
   const isWebgl = webglEffects.includes(effect)
   if (wasWebgl && !isWebgl) {
      canvasEl = undefined
      noLoop()
      location.reload()
   }
   if (!wasWebgl && isWebgl) {
      canvasEl = undefined
      noLoop()
      location.reload()
   }
}

function sortIntoArray(array, insertNumber) {
   //from the end
   for (let a = array.length-1; a >= 0; a--) {

      const existingNumber = roundTo(array[a],1000)
      insertNumber = roundTo(insertNumber,1000)

      if (existingNumber < insertNumber) {
         // insert after a
         array.splice(a+1, 0, insertNumber)
         return true
         
      } else if (existingNumber === insertNumber) {
         // already existed
         return false
      }
   }
   array.splice(0, 0, insertNumber)
   return true
}

function roundTo(a, precision) {
   return Math.round(a*precision)/precision
}


































function drawCornerFill (style, shape, arcQ, offQ, tx, ty, noStretchX, noStretchY) {
   if (style.weight === 0 || !mode.drawFills) {
      return
   }

   push()
   translate(tx, ty)
   noFill()
   stroke((mode.xray)? palette.xrayBgCorner : palette.bg)
   strokeCap(SQUARE)
   strokeWeight(style.weight*strokeScaleFactor)

   //for entire line
   const size = style.sizes[0]
   const smallest = style.sizes[style.sizes.length-1]
   const fillsize = smallest+style.weight

   // base position
   const topOffset = (size < 0) ? -style.offsetX : 0
   let xpos = topOffset + style.posFromLeft + size/2
   let ypos = style.posFromTop
   // offset based on quarter and prev vertical offset
   let offx = (offQ === 3 || offQ === 4) ? 1:0
   let offy = (offQ === 2 || offQ === 3) ? 1:0
   xpos += (offx > 0) ? style.offsetX : 0
   ypos += (style.vOffset+offy) % 2==0 ? style.offsetY : 0
   xpos += (offy > 0) ? style.stretchX : 0
   ypos += (offx > 0) ? style.stretchY : 0

   if (shape === "round") {
      // angles
      let startAngle = PI + (arcQ-1)*HALF_PI
      let endAngle = startAngle + HALF_PI
      arcType(xpos, ypos, fillsize, fillsize, startAngle, endAngle)
   } else if (shape === "square") {
      const dirX = (arcQ === 2 || arcQ === 3) ? 1:-1
      const dirY = (arcQ === 3 || arcQ === 4) ? 1:-1
      beginShape()
      vertex(xpos+dirX*fillsize/2, ypos)
      vertex(xpos+dirX*fillsize/2, ypos+dirY*fillsize/2)
      vertex(xpos, ypos+dirY*fillsize/2)
      endShape()
   } else if (shape === "diagonal") {
      const dirX = (arcQ === 2 || arcQ === 3) ? 1:-1
      const dirY = (arcQ === 3 || arcQ === 4) ? 1:-1
      const step = (fillsize-smallest)/2 + 1
      const stepslope = step*tan(HALF_PI/4)
      beginShape()
      vertex(xpos+dirX*fillsize/2, ypos)
      vertex(xpos+dirX*fillsize/2, ypos+dirY*stepslope)
      vertex(xpos+dirX*stepslope, ypos+dirY*fillsize/2)
      vertex(xpos, ypos+dirY*fillsize/2)
      endShape()
   }

   if (style.stretchX > 0 && !noStretchX) {
      stroke((mode.xray)? palette.xrayStretchCorner : palette.bg)
      const toSideX = (arcQ === 1 || arcQ === 2) ? -1 : 1
      let stretchXPos = xpos
      let stretchYPos = ypos + fillsize*toSideX*0.5
      const dirX = (arcQ === 1 || arcQ === 4) ? 1 : -1

      // the offset can be in between the regular lines vertically if it would staircase nicely
      let offsetShift = 0
      let stairDir = (style.vOffset+offy) % 2===0 ? -1 : 1
      if (Math.abs(style.offsetY) >2 && Math.abs(style.offsetY) <4) {
         offsetShift = (style.offsetY/3)*stairDir
      } else if (Math.abs(style.offsetY) >1 && Math.abs(style.offsetY)<3) {
         offsetShift = (style.offsetY/2)*stairDir
      }

     lineType(stretchXPos, stretchYPos+offsetShift,
         stretchXPos + dirX*0.5*style.stretchX, stretchYPos+offsetShift)
   }
   if (style.stretchY > 0 && !noStretchY) {
      stroke((mode.xray)? palette.xrayStretchCorner : palette.bg)
      const toSideY = (arcQ === 1 || arcQ === 4) ? -1 : 1
      let stretchXPos = xpos + fillsize*toSideY*0.5
      let stretchYPos = ypos
      const dirY = (arcQ === 1 || arcQ === 2) ? 1 : -1

      // the offset can be in between the regular lines horizontally if it would staircase nicely
      let offsetShift = 0
      if (Math.abs(style.offsetX) >2 && Math.abs(style.offsetX) <4) {
         offsetShift = style.offsetX/3*dirY
      } else if (Math.abs(style.offsetX) >1 && Math.abs(style.offsetX)<3) {
         offsetShift = style.offsetX/2*dirY
      }

     lineType(stretchXPos+offsetShift, stretchYPos,
         stretchXPos+offsetShift, stretchYPos + dirY*0.5*style.stretchY)
   }
   pop()
}

function drawCorner (style, shape, arcQ, offQ, tx, ty, cutMode, cutSide, flipped, noSmol, noStretchX, noStretchY) {
   //draw fills
   // only if corner can be drawn at all
   const smallest = style.sizes[style.sizes.length-1]
   const biggest = style.sizes[0]
   const topOffset = (biggest < 0) ? -style.offsetX : 0

   if (!webglEffects.includes(effect) && style.sizes.length > 1) {
      // || !((smallest <= 2 || letterOuter+2 <= 2)&&noSmol)
      if (cutMode === "" || cutMode === "branch") {
         drawCornerFill(style, shape, arcQ, offQ, tx, ty, noStretchX, noStretchY)
      }
   }

   push()
   translate(tx, ty)
   noFill()

   let innerColor; let outerColor

   strokeWeight((style.stroke/10)*strokeScaleFactor)
   if (mode.xray) {
      strokeWeight(0.2*strokeScaleFactor)
   }
   innerColor = (mode.xray)? palette.xrayFgCorner : lerpColor(palette.fg,palette.bg,(effect==="gradient") ? 0.5 : 0)
   outerColor = palette.fg

   function getQuarterPos(offx, offy, biggest) {
      // base position
      let xpos = topOffset + style.posFromLeft + (biggest/2)
      let ypos = style.posFromTop
      // offset based on quarter and prev vertical offset
      xpos += (offx > 0) ? style.offsetX : 0
      ypos += (style.vOffset+offy) % 2==0 ? style.offsetY : 0
      xpos += (offy > 0) ? style.stretchX : 0
      ypos += (offx > 0) ? style.stretchY : 0
      return {x: xpos, y:ypos}
   }

   draw()

   function draw() {
      style.sizes.forEach((size) => {
         // gradient from inside to outside - color or weight
         ringStyle(size, smallest, biggest, innerColor, outerColor, flipped, arcQ, offQ, style.opacity, style.stroke)

         const offx = (offQ === 3 || offQ === 4) ? 1:0
         const offy = (offQ === 2 || offQ === 3) ? 1:0
         const basePos = getQuarterPos(offx, offy, biggest, topOffset)
         let xpos = basePos.x
         let ypos = basePos.y

         if (shape === "round") {
            // angles
            let startAngle = PI + (arcQ-1)*HALF_PI
            let endAngle = startAngle + HALF_PI

            let cutDifference = 0
            let drawCurve = true

            if (cutMode === "linecut") {
               if (smallest-2 <= 0 && noSmol) {
                  drawCurve = false
               }
               cutDifference = HALF_PI-arcUntil(size, smallest-2, HALF_PI)
            }
            else if (cutMode === "roundcut") {
               if ((smallest <= 2 || biggest+2 <= 2) && noSmol) {
                  drawCurve = false
               }
               if (smallest > 2) {
                  cutDifference = HALF_PI-arcUntilArc(size, biggest+2, smallest+style.weight, HALF_PI)
               } else {
                  cutDifference = 0
               }
            }

            if (cutSide === "start") {
               startAngle += cutDifference
            } else if (cutSide === "end") {
               endAngle -= cutDifference
            }

            // random animation idea, maybe try more with this later
            //endAngle = startAngle + (endAngle-startAngle) * Math.abs(((frameCount % 60) /30)-1)

            if (drawCurve) {
               arcType(basePos.x,basePos.y,size,size,startAngle,endAngle)
            } else {
               // draw 0.5 long lines instead
               // wip
            }
         } else if (shape === "square") {
            const dirX = (arcQ === 2 || arcQ === 3) ? 1:-1
            const dirY = (arcQ === 3 || arcQ === 4) ? 1:-1
            if (cutMode === "branch") {
               let branchLength = size
               let revSize = (biggest+smallest)-size
               if (size > (biggest+smallest)/2) branchLength = biggest-(size-smallest)
              lineType(xpos+dirX*size/2, ypos, xpos+dirX*size/2, ypos+dirY*branchLength/2)
              lineType(xpos, ypos+dirY*size/2, xpos+dirX*branchLength/2, ypos+dirY*size/2)
               if ((arcQ % 2 === 1) === (cutSide === "start")) {
                 lineType(xpos+dirX*biggest/2, ypos+dirY*size/2, xpos+dirX*revSize/2, ypos+dirY*size/2)
               } else {
                 lineType(xpos+dirX*size/2, ypos+dirY*biggest/2, xpos+dirX*size/2, ypos+dirY*revSize/2)
               }
            } else {
              lineType(xpos+dirX*size/2, ypos, xpos+dirX*size/2, ypos+dirY*size/2)
              lineType(xpos, ypos+dirY*size/2, xpos+dirX*size/2, ypos+dirY*size/2)
            }
         } else if (shape === "diagonal") {
            const dirX = (arcQ === 2 || arcQ === 3) ? 1:-1
            const dirY = (arcQ === 3 || arcQ === 4) ? 1:-1
            const step = (size-smallest)/2 + 1
            const stepslope = step*tan(HALF_PI/4)
            let xPoint = createVector(xpos+dirX*size/2,ypos+dirY*stepslope)
            let yPoint = createVector(xpos+dirX*stepslope, ypos+dirY*size/2)

            if (cutMode === "linecut" && ((biggest-smallest)/2+1)*tan(HALF_PI/4) < smallest/2-2) {
               let changeAxis = ""
               if (cutSide === "start") {
                  changeAxis = (arcQ === 1 || arcQ === 3) ? "x" : "y"
               } else if (cutSide === "end") {
                  changeAxis = (arcQ === 1 || arcQ === 3) ? "y" : "x"
               }
               if (changeAxis === "x") {
                  xPoint.x = xpos+dirX*(biggest/2 -style.weight -1)
                  xPoint.y = yPoint.y - (biggest/2 - style.weight -1) + dirY*stepslope
                 lineType(xpos, yPoint.y, yPoint.x, yPoint.y)
               } else if (changeAxis === "y") {
                  yPoint.y = ypos+dirY*(biggest/2 -style.weight -1)
                  yPoint.x = xPoint.x - (biggest/2 - style.weight -1) + dirX*stepslope
                 lineType(xPoint.x, ypos, xPoint.x, xPoint.y)
               }
              lineType(xPoint.x, xPoint.y, yPoint.x, yPoint.y)
            } else {
              lineType(xPoint.x, xPoint.y, yPoint.x, yPoint.y)
               if (step > 0) {
                 lineType(xPoint.x, ypos, xPoint.x, xPoint.y)
                 lineType(xpos, yPoint.y, yPoint.x, yPoint.y)
               }
            }
         }

         const cutX = (arcQ % 2 === 0) === (cutSide === "start")
         if (style.stretchX > 0 && !noStretchX) {
            // check if not cut off
            if (cutMode === "" || cutMode === "branch" || (cutMode!== "" && !cutX)) {
               const toSideX = (arcQ === 1 || arcQ === 2) ? -1 : 1
               let stretchXPos = xpos
               let stretchYPos = ypos + size*toSideX*0.5
               const dirX = (arcQ === 1 || arcQ === 4) ? 1 : -1

               // the offset can be in between the regular lines vertically if it would staircase nicely
               let offsetShift = 0
               let stairDir = (style.vOffset+offy) % 2===0 ? -1 : 1
               if (Math.abs(style.offsetY) >2 && Math.abs(style.offsetY) <4) {
                  offsetShift = (style.offsetY/3)*stairDir
               } else if (Math.abs(style.offsetY) >1 && Math.abs(style.offsetY)<3) {
                  offsetShift = (style.offsetY/2)*stairDir
               }

              lineType(stretchXPos, stretchYPos+offsetShift,
                  stretchXPos + dirX*0.5*style.stretchX, stretchYPos+offsetShift)
            }
         }
         if (style.stretchY > 0 && !noStretchY) {
            // check if not cut off
            if (cutMode === "" || cutMode === "branch" || (cutMode!== "" && cutX)) {
               const toSideY = (arcQ === 1 || arcQ === 4) ? -1 : 1
               let stretchXPos = xpos + size*toSideY*0.5
               let stretchYPos = ypos
               const dirY = (arcQ === 1 || arcQ === 2) ? 1 : -1

               //if (curveMode) {
               //   curve(stretchXPos, stretchYPos-dirY*typeStretchY*3,
               //      stretchXPos, stretchYPos,
               //      stretchXPos+typeOffsetX*0.5*dirY, stretchYPos + dirY*0.5*typeStretchY,
               //      stretchXPos+typeOffsetX*0.5*dirY, stretchYPos + dirY*0.5*typeStretchY)
               //}

               // the offset can be in between the regular lines horizontally if it would staircase nicely
               let offsetShift = 0
               if (Math.abs(style.offsetX) >2 && Math.abs(style.offsetX) <4) {
                  offsetShift = style.offsetX/3*dirY
               } else if (Math.abs(style.offsetX) >1 && Math.abs(style.offsetX)<3) {
                  offsetShift = style.offsetX/2*dirY
               }

               if (!midlineEffects.includes(effect)) {
                  lineType(stretchXPos+offsetShift, stretchYPos, stretchXPos+offsetShift, stretchYPos + dirY*0.5*animStretchY)
               }

               // if vertical line goes down, set those connection spots in the array
               if (dirY === 1 && midlineEffects.includes(effect)) {
                  if (style.letter === "‸") {
                     //caret counts separately
                     style.caretSpots[0] = stretchXPos + tx
                  } else {
                     sortIntoArray(style.midlineSpots, stretchXPos + tx)
                  }
               }
            }
         }
         const extendamount = ((biggest % 2 == 0) ? 0 : 0.5) + (style.stretchX-(style.stretchX%2))*0.5
         if (cutMode === "extend" && extendamount > 0) {
            const toSideX = (arcQ === 1 || arcQ === 2) ? -1 : 1
            let extendXPos = xpos
            let extendYPos = ypos + size*toSideX*0.5
            const dirX = (arcQ === 1 || arcQ === 4) ? 1 : -1
           lineType(extendXPos, extendYPos, extendXPos + dirX*extendamount, extendYPos)
         }
      });
   }

   pop()
}

function drawLine (style, arcQ, offQ, tx, ty, axis, extension, startFrom, flipped, noStretch) {
   //first, draw the fill
   if (!webglEffects.includes(effect) && style.sizes.length > 1) {
      drawLineFill(style, arcQ, offQ, tx, ty, axis, extension, startFrom, noStretch)
   }

   push()
   translate(tx, ty)
   noFill()

   const smallest = style.sizes[style.sizes.length-1]
   const biggest = style.sizes[0]
   const topOffset = (biggest < 0) ? -style.offsetX : 0

   let innerColor; let outerColor

   //if (true) {
   //   innerColor = color("green")
   //   outerColor = color("lime")
   //   strokeWeight((typeWeight/5)*strokeScaleFactor)
   //   draw()
   //}

   function getQuarterPos(offx, offy, biggest) {
      // base position
      let xpos = topOffset + style.posFromLeft + (biggest/2)
      let ypos = style.posFromTop
      // offset based on quarter and prev vertical offset
      xpos += (offx > 0) ? style.offsetX : 0
      ypos += (style.vOffset+offy) % 2==0 ? style.offsetY : 0
      xpos += (offy > 0) ? style.stretchX : 0
      ypos += (offx > 0) ? style.stretchY : 0
      return {x: xpos, y:ypos}
   }

   strokeWeight((style.stroke/10)*strokeScaleFactor)
   if (mode.xray) {
      strokeWeight(0.2*strokeScaleFactor)
   }
   innerColor = (mode.xray)? palette.xrayFg : lerpColor(palette.fg,palette.bg,(effect==="gradient") ? 0.5 : 0)
   outerColor = palette.fg
   draw()

   function draw() {
      style.sizes.forEach((size) => {
         // gradient from inside to outside - color or weight
         ringStyle(size, smallest, biggest, innerColor, outerColor, flipped, arcQ, offQ, style.opacity, style.stroke)

         const outerExt = 0

         // base position
         const offx = (offQ === 3 || offQ === 4) ? 1:0
         const offy = (offQ === 2 || offQ === 3) ? 1:0
         const basePos = getQuarterPos(offx, offy, biggest)

         let x1 = basePos.x
         let x2 = basePos.x
         let y1 = basePos.y
         let y2 = basePos.y

         const innerPosV = (startFrom !== undefined) ? startFrom : 0
         const innerPosH = (startFrom !== undefined) ? startFrom : 0

         if (axis === "v") {
            const toSideX = (arcQ === 1 || arcQ === 4) ? -1 : 1
            x1 += size*toSideX*0.5
            x2 += size*toSideX*0.5
            const dirY = (arcQ === 1 || arcQ === 2) ? -1 : 1
            y1 += innerPosV * dirY
            y2 += (biggest*0.5 + extension + outerExt) * dirY
            //only draw the non-stretch part if it is long enough to be visible
            if (dirY*(y2-y1)>=0) {
              lineType(x1, y1, x2, y2)
            }
            if (style.stretchY !== 0 && innerPosV === 0 && !noStretch) {
               //stretch
               // the offset can be in between the regular lines horizontally if it would staircase nicely
               let offsetShift = 0
               if (Math.abs(style.offsetX) >2 && Math.abs(style.offsetX) <4) {
                  offsetShift = style.offsetX/3*dirY
               } else if (Math.abs(style.offsetX) >1 && Math.abs(style.offsetX)<3) {
                  offsetShift = style.offsetX/2*dirY
               }
               if (!midlineEffects.includes(effect)) {
                  lineType(x1-offsetShift, y1-style.stretchY*0.5*dirY, x2-offsetShift, y1)
               }
               
               // if vertical line goes down, set those connection spots in the array
               if (dirY === -1 && midlineEffects.includes(effect)) {
                  if (style.letter === "‸") {
                     //caret counts separately
                     style.caretSpots[0] = x1 + tx
                  } else {
                     sortIntoArray(style.midlineSpots, x1 + tx)
                  }
               }
            }
         } else if (axis === "h") {
            const toSideY = (arcQ === 1 || arcQ === 2) ? -1 : 1
            y1 += size*toSideY*0.5
            y2 += size*toSideY*0.5
            const dirX = (arcQ === 1 || arcQ === 4) ? -1 : 1
            x1 += innerPosH * dirX
            x2 += (biggest*0.5 + extension) * dirX
            //only draw the non-stretch part if it is long enough to be visible
            if (dirX*(x2-x1)>=0) {
               lineType(x1, y1, x2, y2)
            }
            if (style.stretchX !== 0 && innerPosH === 0  && !noStretch) {
               //stretch
               // the offset can be in between the regular lines vertically if it would staircase nicely
               let offsetShift = 0
               let stairDir = (style.vOffset+offy) % 2===0 ? -1 : 1
               if (Math.abs(style.offsetY) >2 && Math.abs(style.offsetY) <4) {
                  offsetShift = (style.offsetY/3)*stairDir
               } else if (Math.abs(style.offsetY) >1 && Math.abs(style.offsetY)<3) {
                  offsetShift = (style.offsetY/2)*stairDir
               }
               lineType(x1-style.stretchX*0.5*dirX, y1+offsetShift, x1, y2+offsetShift)
            }
         }
      });
   }

   pop()
}

function drawLineFill (style, arcQ, offQ, tx, ty, axis, extension, startFrom) {
   if (style.weight === 0 || !mode.drawFills) {
      return
   }

   push()
   translate(tx, ty)
   noFill()
   stroke((mode.xray)? palette.xrayBg : palette.bg)
   strokeWeight(style.weight*strokeScaleFactor)
   strokeCap(SQUARE)

   //for entire line
   const biggest = style.sizes[0]
   const smallest = style.sizes[style.sizes.length-1]
   const topOffset = (biggest < 0) ? -style.offsetX : 0

   // to make the rectangles a little shorter at the end (?)
   let strokeWeightReference = (style.weight/10)
   if (mode.xray) {
      strokeWeightReference = 0.2*strokeScaleFactor
   }
   const outerExt = strokeWeightReference*-0.5

   function getQuarterPos(offx, offy, biggest) {
      // base position
      let xpos = topOffset + style.posFromLeft + (biggest/2)
      let ypos = style.posFromTop
      // offset based on quarter and prev vertical offset
      xpos += (offx > 0) ? style.offsetX : 0
      ypos += (style.vOffset+offy) % 2==0 ? style.offsetY : 0
      xpos += (offy > 0) ? style.stretchX : 0
      ypos += (offx > 0) ? style.stretchY : 0
      return {x: xpos, y:ypos}
   }

   // base position
   const offx = (offQ === 3 || offQ === 4) ? 1:0
   const offy = (offQ === 2 || offQ === 3) ? 1:0
   const basePos = getQuarterPos(offx, offy, biggest)

   let x1 = basePos.x
   let x2 = basePos.x
   let y1 = basePos.y
   let y2 = basePos.y

   const innerPosV = (startFrom !== undefined) ? startFrom - outerExt: 0
   const innerPosH = (startFrom !== undefined) ? startFrom - outerExt: 0

   if (axis === "v") {
      const toSideX = (arcQ === 1 || arcQ === 4) ? -0.5 : 0.5
      x1 += (smallest+style.weight)*toSideX
      x2 += (smallest+style.weight)*toSideX
      const dirY = (arcQ === 1 || arcQ === 2) ? -1 : 1
      y1 += innerPosV * dirY
      y2 += (biggest*0.5 + extension + outerExt) * dirY
      //only draw the non-stretch part if it is long enough to be visible
      if (dirY*(y2-y1)>0.1) {
        lineType(x1, y1, x2, y2)
      }
      if (style.stretchY !== 0 && innerPosV === 0) {
         //stretch
         // the offset can be in between the regular lines horizontally if it would staircase nicely
         let offsetShift = 0
         if (Math.abs(style.offsetX) >2 && Math.abs(style.offsetX) <4) {
            offsetShift = style.offsetX/3*dirY
         } else if (Math.abs(style.offsetX) >1 && Math.abs(style.offsetX)<3) {
            offsetShift = style.offsetX/2*dirY
         }

         stroke((mode.xray)? palette.xrayStretch : palette.bg)
         lineType(x1-offsetShift, y1-style.stretchY*0.5*dirY, x2-offsetShift, y1)
      }
   } else if (axis === "h") {
      const toSideY = (arcQ === 1 || arcQ === 2) ? -0.5 : 0.5
      y1 += (smallest+style.weight)*toSideY
      y2 += (smallest+style.weight)*toSideY
      const dirX = (arcQ === 1 || arcQ === 4) ? -1 : 1
      x1 += innerPosH * dirX
      x2 += (biggest*0.5 + extension + outerExt) * dirX
      //only draw the non-stretch part if it is long enough to be visible
      if (dirX*(x2-x1)>0.1) {
        lineType(x1, y1, x2, y2)
      }
      if (style.stretchX !== 0 && innerPosH === 0) {
         //stretch

         // the offset can be in between the regular lines vertically if it would staircase nicely
         let offsetShift = 0
         let stairDir = (style.vOffset+offy) % 2===0 ? -1 : 1
         if (Math.abs(style.offsetY) >2 && Math.abs(style.offsetY) <4) {
            offsetShift = (style.offsetY/3)*stairDir
         } else if (Math.abs(style.offsetY) >1 && Math.abs(style.offsetY)<3) {
            offsetShift = (style.offsetY/2)*stairDir
         }

         stroke((mode.xray)? palette.xrayStretch : palette.bg)
         lineType(x1-style.stretchX*0.5*dirX, y1+offsetShift, x1, y2+offsetShift)
      }
   }
   pop()
}

function ringStyle (size, smallest, biggest, innerColor, outerColor, flipped, arcQ, offQ, opacity, strokeWidth) {
   //strokeweight
   if ((effect==="weightgradient") && !mode.xray) {
      strokeWeight((strokeWidth/10)*strokeScaleFactor*map(size,smallest,biggest,0.3,1))
      if ((arcQ !== offQ) !== (flipped === "flipped")) {
         strokeWeight((strokeWidth/10)*strokeScaleFactor*map(size,smallest,biggest,1,0.3))
      }
   }

   //color
   let innerEdgeReference = smallest
   //1-2 rings
   if ((biggest-smallest) <1) {
      innerEdgeReference = biggest-2
   }
   let lerpedColor = lerpColor(innerColor, outerColor, map(size,innerEdgeReference,biggest,0,1))
   if ((arcQ !== offQ) !== (flipped === "flipped")) {
      lerpedColor = lerpColor(innerColor, outerColor, map(size,biggest,innerEdgeReference,0,1))
   }
   lerpedColor = lerpColor(palette.bg, lerpedColor, opacity)
   stroke(lerpedColor)
}

