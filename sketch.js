'use strict'

let cnv
let svgMode = false
let webglMode = false
let startOffsetY

//gui
let writeArea
let writingMode = false
let offsetLabel

let bgColor
let lineColor
let randomizeAuto = false
let lerpLength = 6

let darkMode = true
let monochromeTheme = false
let xrayMode = false
let gradientMode = false
let vCondenseMode = false

let drawFills = true
let strokeGradient = false
let initialDraw = true
let gridType = ""
let waveMode = false

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
let animSize
let animRings
let animSpacing
let animOffsetX
let animOffsetY
let animStretchX
let animStretchY
let animWeight
let animAscenders
let animZoom
let animColorDark
let animColorLight

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
let numberOffset

let linesArray = ["hamburgefonstiv"]
const validLetters = "abcdefghijklmnopqrstuvwxyzäöü,.!?-_ "

// use alt letters?
let altS = false
let altM = false
let altNH = true

// helpful
const newLineChar = String.fromCharCode(13, 10)


function windowResized() {
   resizeCanvas(windowWidth-30, windowHeight-200)
}

function setup () {
   loadValuesFromURL()
   createGUI()

   cnv = createCanvas(windowWidth-30, windowHeight-200,(webglMode)?WEBGL:(svgMode)?SVG:"")
   cnv.parent('sketch-holder')
   if (!webglMode) {
      strokeCap(ROUND)
      textFont("Courier Mono")
      frameRate(60)
      if (svgMode) strokeScaleFactor = values.zoom.from
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

   // create textarea for line input
   writeArea = document.getElementById('textarea-lines')
   writeArea.innerHTML = linesArray.join(newLineChar)

   // textarea events
   writeArea.addEventListener('input', function() {
      //split and filter out "", undefined
      linesArray = writeArea.value.split("\n").filter(function(e){ return e === 0 || e });
      writeValuesToURL()
   }, false)
   writeArea.addEventListener('focusin', () => {
      writingMode = true
   })
   writeArea.addEventListener('focusout', () => {
      writingMode = false
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
         "hamburgefonstiv\nlorem ipsum",
         "lorem ipsum\ndolor sit amet",
         "the quick brown\nfox jumps over\nthe lazy dog.",
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
   darkmodeToggle.checked = darkMode
   darkmodeToggle.addEventListener('click', () => {
      darkMode = darkmodeToggle.checked
      writeValuesToURL()
   })
   const monochromeToggle = document.getElementById('checkbox-monochrome')
   monochromeToggle.checked = monochromeTheme
   monochromeToggle.addEventListener('click', () => {
      monochromeTheme = monochromeToggle.checked
      writeValuesToURL()
   })
   const xrayToggle = document.getElementById('checkbox-xray')
   xrayToggle.checked = xrayMode
   xrayToggle.addEventListener('click', () => {
      xrayMode = xrayToggle.checked
      writeValuesToURL()
   })
   const svgToggle = document.getElementById('checkbox-svg')
   svgToggle.checked = svgMode
   svgToggle.addEventListener('click', () => {
      svgMode = svgToggle.checked
      writeValuesToURL()
      if (!svgToggle.checked) {
         location.reload()
      }
   })
   const webglToggle = document.getElementById('checkbox-webgl')
   webglToggle.checked = webglMode
   webglToggle.addEventListener('click', () => {
      webglMode = webglToggle.checked
      if (!webglMode.checked) {
         noLoop()
      }
      writeValuesToURL()
      if (!webglMode.checked) {
         location.reload()
      }
   })
   const gradientToggle = document.getElementById('checkbox-gradient')
   gradientToggle.checked = gradientMode
   gradientToggle.addEventListener('click', () => {
      gradientMode = gradientToggle.checked
      writeValuesToURL()
   })
   const vCondenseToggle = document.getElementById('checkbox-condense')
   vCondenseToggle.checked = vCondenseMode
   vCondenseToggle.addEventListener('click', () => {
      vCondenseMode = vCondenseToggle.checked
      if (vCondenseMode) {
         //wip
         values.stretchY.to = min(values.size.from * 2, values.stretchY.from)
         writeValuesToGUI()
      }
      writeValuesToURL()
   })
   const altMToggle = document.getElementById('checkbox-altM')
   altMToggle.checked = altM
   altMToggle.addEventListener('click', () => {
      altM = altMToggle.checked
      writeValuesToURL()
   })
   const altNHToggle = document.getElementById('checkbox-altNH')
   altNHToggle.checked = altNH
   altNHToggle.addEventListener('click', () => {
      altNH = altNHToggle.checked
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

   numberOffset = document.getElementById('number-offset')
   numberOffset.value = values[(offsetDirection === "h") ? "offsetX" : "offsetY"].from
   numberOffset.addEventListener('input', () => {
      if (numberOffset.value !== "") {
         values[(offsetDirection === "h") ? "offsetX" : "offsetY"].to = clamp(numberOffset.value, -10, 10)
         values[(offsetDirection !== "h") ? "offsetX" : "offsetY"].to = 0
         writeValuesToURL()
      }
   })
   numberOffset.addEventListener("focusout", () => {
      if (numberOffset.value === "") {
         numberOffset.value = values[(offsetDirection === "h") ? "offsetX" : "offsetY"].from
      }
   })

   const offsetToggle = document.getElementById('toggle-offsetDirection')
   offsetLabel = document.getElementById('label-offset')
   offsetToggle.addEventListener('click', () => {
      if (offsetDirection === "h") {
         if (values.offsetX.from === 0) values.offsetY.to = 1
         offsetDirection = "v"
         offsetLabel.innerHTML = "offset&nbsp;&nbsp;v"
      } else {
         if (values.offsetY.from === 0) values.offsetX.to = 1
         offsetDirection = "h"
         offsetLabel.innerHTML = "offset&nbsp;&nbsp;h"
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
      svgMode = true
      print("Loaded with URL Mode: SVG")
   }
   if (params.webgl === "true" || params.webgl === "1") {
      webglMode = true
      print("Loaded with URL Mode: WEBGL")
   }
   if (params.wave === "true" || params.wave === "1") {
      waveMode = true
      print("Loaded with URL Mode: Wave")
   }
   if (params.xray === "true" || params.xray === "1") {
      xrayMode = true
      print("Loaded with URL Mode: XRAY")
   }
   if (params.solid === "false" || params.solid === "0") {
      drawFills = false
      print("Loaded with URL Mode: Transparent overlaps")
   }
   if (params.invert === "true" || params.invert === "1") {
      darkMode = false
      print("Loaded with URL Mode: Inverted")
   }
   if (params.mono === "true" || params.mono === "1") {
      monochromeTheme = true
      print("Loaded with URL Mode: Mono")
   }
   if (params.gradient === "true" || params.gradient ===  "1") {
      gradientMode = true
      print("Loaded with URL Mode: Gradient Fill")
   }
   if (params.strokegradient === "true" || params.strokegradient === "1") {
      strokeGradient = true
      print("Loaded with URL Mode: Stroke Gradient")
   }
   if (params.condense === "true" || params.condense === "1") {
      vCondenseMode = true
      print("Loaded with URL Mode: Condensed vertical stretch")
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
   if (svgMode) {
      newParams.append("svg",true)
   }
   if (webglMode) {
      newParams.append("webgl",true)
   }
   if (!darkMode) {
      newParams.append("invert",true)
   }
   if (monochromeTheme) {
      newParams.append("mono",true)
   }
   if (xrayMode) {
      newParams.append("xray",true)
   }
   if (waveMode) {
      newParams.append("wave",true)
   }
   if (gradientMode) {
      newParams.append("gradient", true)
   }
   if (vCondenseMode) {
      newParams.append("condense", true)
   }
   if (!drawFills) {
      newParams.append("solid",false)
   }
   if (strokeGradient) {
      newParams.append("strokegradient",true)
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

   if ((svgMode) && noReload === undefined) {
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
   writeArea.value = linesArray.join("\n")

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
      offsetLabel.innerHTML = "offset&nbsp;&nbsp;h"
   } else {
      if (potentialOffsetX === 0) {
         numberOffset.value = potentialOffsetY
         offsetDirection = "v"
         offsetLabel.innerHTML = "offset&nbsp;&nbsp;v"
      } else {
         numberOffset.value = potentialOffsetX
         offsetDirection = "h"
         offsetLabel.innerHTML = "offset&nbsp;&nbsp;h"
      }
   }
}

function keyTyped() {
   // wip
}

function keyPressed() {
   //if (keyCode === LEFT_ARROW) {
   //   writeValuesToURL()
   //   return
   //}
   //else if (keyCode === RIGHT_ARROW) {
   //   writeValuesToURL()
   //   return
   //}
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
            if (svgMode) {
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
            if (darkMode) {
               saturation = 100
               lightness = 6
            } else {
               saturation = 100
               lightness = 20
            }
         } else if (col === "light") {
            if (darkMode) {
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

   const lightColor = (monochromeTheme || xrayMode) ? color("white") : animColorLight
   const darkColor = (monochromeTheme || xrayMode) ? color("black") : animColorDark

   bgColor = lightColor
   lineColor = darkColor

   if (darkMode) {
      bgColor = darkColor
      lineColor = lightColor
   }

   document.documentElement.style.setProperty('--fg-color', rgbValues(lineColor))
   document.documentElement.style.setProperty('--bg-color', rgbValues(bgColor))

   background(bgColor)
   if (webglMode) {
      orbitControl()
      ambientLight(60, 60, 60);
      pointLight(255, 255, 255, 0, 0, 100);
   } 
   strokeWeight(0.3*strokeScaleFactor)

   drawElements()

   if (!svgMode) {
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
   if (webglMode) translate(-width/2, -height/2)
   scale(animZoom)
   translate(3, 3)

   translate(0, max(animAscenders, 1))

   strokeWeight((animWeight/10)*strokeScaleFactor)
   lineColor.setAlpha(255)

   startOffsetY = 0

   if (animOffsetY < 0) {
      startOffsetY -= animOffsetY
   }

   push()
   translate(0,0.5*animSize)

   for (let i = 0; i < linesArray.length; i++) {
      drawStyle(i)
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
            found = "bhikltuüvwym".includes(char) || (altNH && "n".includes(char))
         }
         else if (set === "dl") {
            //down left sharp
            found = "hikmnprfv".includes(char)
         }
         else if (set === "ur") {
            //up right sharp
            found = "dijuüvwymg".includes(char) || (altNH && "nh".includes(char))
         }
         else if (set === "dr") {
            //down right sharp
            found = "aähimnqye".includes(char)
         }
         else if (set === "gap") {
            //separating regular letters
            found = "., :;-_!?‸".includes(char)
         }
      }
   });
   return found
}


function drawStyle (lineNum) {

   // current line text
   let lineText = linesArray[lineNum].toLowerCase()

   // include caret into line so that it can be rendered
   if (writingMode && !xrayMode && !svgMode && (writeArea.selectionStart === writeArea.selectionEnd)) {
      let totalChars = 0
      for (let l = 0; l < linesArray.length; l++) {
         //found current line
         if (l === lineNum) {
            for (let c = 0; c < lineText.length+1; c++) {
               if (frameCount % 40 > 20 && totalChars+c === writeArea.selectionStart) {
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

   let letterOpacity = 1.0
   // if line empty, but visible, put row of darker o's there
   if (lineText.length === 0) {
      lineText = "o".repeat(9)
      if (!xrayMode) {
         letterOpacity = 0.2
      }
   }

   // fadeout in wavemode
   function waveInner (i, inner, size) {
      if (!waveMode) {
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

   // get the vconnection spots 
   let vConnectionSpots = new Array(Math.floor(totalWidth[lineNum])).fill(0);
   //vConnectionSpots[4] = 1
   //vConnectionSpots[totalWidth[lineNum]] = 1


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


   for (let layerPos = 0; layerPos < lineText.length; layerPos++) {

      function drawCornerFill (shape, arcQ, offQ, tx, ty, noStretchX, noStretchY) {
         if (weight === 0 || !drawFills) {
            return
         }

         push()
         translate(tx, ty)
         noFill()
         stroke((xrayMode)? color("#52A"): bgColor)
         strokeCap(SQUARE)
         strokeWeight(weight*strokeScaleFactor)

         const smallest = letterInner
         const size = smallest + weight
         //if (frameCount<2) {
         //   print("drawCornerFill",char,smallest,letterOuter)
         //}

         // base position
         let xpos = topOffset + letterPositionFromLeft + (letterOuter/2)
         let ypos = startOffsetY
         // offset based on quarter and prev vertical offset
         let offx = (offQ === 3 || offQ === 4) ? 1:0
         let offy = (offQ === 2 || offQ === 3) ? 1:0
         xpos += (offx > 0) ? animOffsetX : 0
         ypos += (verticalOffset+offy) % 2==0 ? animOffsetY : 0
         xpos += (offy > 0) ? animStretchX : 0
         ypos += (offx > 0) ? animStretchY : 0

         if (shape === "round") {
            // angles
            let startAngle = PI + (arcQ-1)*HALF_PI
            let endAngle = startAngle + HALF_PI
            arcType(xpos, ypos, size, size, startAngle, endAngle)
         } else if (shape === "square") {
            const dirX = (arcQ === 2 || arcQ === 3) ? 1:-1
            const dirY = (arcQ === 3 || arcQ === 4) ? 1:-1
            beginShape()
            vertex(xpos+dirX*size/2, ypos)
            vertex(xpos+dirX*size/2, ypos+dirY*size/2)
            vertex(xpos, ypos+dirY*size/2)
            endShape()
         } else if (shape === "diagonal") {
            const dirX = (arcQ === 2 || arcQ === 3) ? 1:-1
            const dirY = (arcQ === 3 || arcQ === 4) ? 1:-1
            const step = (size-smallest)/2 + 1
            const stepslope = step*tan(HALF_PI/4)
            beginShape()
            vertex(xpos+dirX*size/2, ypos)
            vertex(xpos+dirX*size/2, ypos+dirY*stepslope)
            vertex(xpos+dirX*stepslope, ypos+dirY*size/2)
            vertex(xpos, ypos+dirY*size/2)
            endShape()
         }

         if (animStretchX > 0 && !noStretchX) {
            stroke((xrayMode)? color("#831"): bgColor)
            const toSideX = (arcQ === 1 || arcQ === 2) ? -1 : 1
            let stretchXPos = xpos
            let stretchYPos = ypos + size*toSideX*0.5
            const dirX = (arcQ === 1 || arcQ === 4) ? 1 : -1

            // the offset can be in between the regular lines vertically if it would staircase nicely
            let offsetShift = 0
            let stairDir = (verticalOffset+offy) % 2===0 ? -1 : 1
            if (Math.abs(animOffsetY) >2 && Math.abs(animOffsetY) <4) {
               offsetShift = (animOffsetY/3)*stairDir
            } else if (Math.abs(animOffsetY) >1 && Math.abs(animOffsetY)<3) {
               offsetShift = (animOffsetY/2)*stairDir
            }

           lineType(stretchXPos, stretchYPos+offsetShift,
               stretchXPos + dirX*0.5*animStretchX, stretchYPos+offsetShift)
         }
         if (animStretchY > 0 && !noStretchY) {
            stroke((xrayMode)? color("#17B"): bgColor)
            const toSideY = (arcQ === 1 || arcQ === 4) ? -1 : 1
            let stretchXPos = xpos + size*toSideY*0.5
            let stretchYPos = ypos
            const dirY = (arcQ === 1 || arcQ === 2) ? 1 : -1

            // the offset can be in between the regular lines horizontally if it would staircase nicely
            let offsetShift = 0
            if (Math.abs(animOffsetX) >2 && Math.abs(animOffsetX) <4) {
               offsetShift = animOffsetX/3*dirY
            } else if (Math.abs(animOffsetX) >1 && Math.abs(animOffsetX)<3) {
               offsetShift = animOffsetX/2*dirY
            }

           lineType(stretchXPos+offsetShift, stretchYPos,
               stretchXPos+offsetShift, stretchYPos + dirY*0.5*animStretchY)
         }
         pop()
      }

      function drawCorner (shape, strokeSizes, arcQ, offQ, tx, ty, cutMode, cutSide, flipped, noSmol, noStretchX, noStretchY) {
         //draw fills
         // only if corner can be drawn at all
         const smallest = strokeSizes[strokeSizes.length-1]
         const biggest = strokeSizes[0]

         if (!webglMode && strokeSizes.length > 1) {
            // || !((smallest <= 2 || letterOuter+2 <= 2)&&noSmol)
            if (cutMode === "" || cutMode === "branch") {
               drawCornerFill(shape,arcQ,offQ,tx,ty,noSmol,noStretchX,noStretchY)
            }
         }

         push()
         translate(tx, ty)
         noFill()

         let innerColor; let outerColor

         // if (true) {
         //    innerColor = color("green")
         //    outerColor = color("lime")
         //    strokeWeight((typeWeight/5)*strokeScaleFactor)
         //    draw()
         // }

         strokeWeight((animWeight/10)*strokeScaleFactor)
         if (xrayMode) {
            strokeWeight(0.2*strokeScaleFactor)
         }
         innerColor = (xrayMode)? color("orange") : lerpColor(lineColor,bgColor,(gradientMode) ? 0.5 : 0)
         outerColor = lineColor
         draw()

         function draw() {
            strokeSizes.forEach((size) => {
               // gradient from inside to outside - color or weight
               strokeStyleForRing(size, smallest, biggest, innerColor, outerColor, flipped, arcQ, offQ)

               const offx = (offQ === 3 || offQ === 4) ? 1:0
               const offy = (offQ === 2 || offQ === 3) ? 1:0
               const basePos = getQuarterPos(offx, offy, letterOuter)
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
                     if ((smallest <= 2 || letterOuter+2 <= 2) && noSmol) {
                        drawCurve = false
                     }
                     if (smallest > 2) {
                        cutDifference = HALF_PI-arcUntilArc(size, letterOuter+2, smallest+weight, HALF_PI)
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
                        xPoint.x = xpos+dirX*(biggest/2 -weight -1)
                        xPoint.y = yPoint.y - (biggest/2 - weight -1) + dirY*stepslope
                       lineType(xpos, yPoint.y, yPoint.x, yPoint.y)
                     } else if (changeAxis === "y") {
                        yPoint.y = ypos+dirY*(biggest/2 -weight -1)
                        yPoint.x = xPoint.x - (biggest/2 - weight -1) + dirX*stepslope
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
               if (animStretchX > 0 && !noStretchX) {
                  // check if not cut off
                  if (cutMode === "" || cutMode === "branch" || (cutMode!== "" && !cutX)) {
                     const toSideX = (arcQ === 1 || arcQ === 2) ? -1 : 1
                     let stretchXPos = xpos
                     let stretchYPos = ypos + size*toSideX*0.5
                     const dirX = (arcQ === 1 || arcQ === 4) ? 1 : -1

                     // the offset can be in between the regular lines vertically if it would staircase nicely
                     let offsetShift = 0
                     let stairDir = (verticalOffset+offy) % 2===0 ? -1 : 1
                     if (Math.abs(animOffsetY) >2 && Math.abs(animOffsetY) <4) {
                        offsetShift = (animOffsetY/3)*stairDir
                     } else if (Math.abs(animOffsetY) >1 && Math.abs(animOffsetY)<3) {
                        offsetShift = (animOffsetY/2)*stairDir
                     }

                    lineType(stretchXPos, stretchYPos+offsetShift,
                        stretchXPos + dirX*0.5*animStretchX, stretchYPos+offsetShift)
                  }
               }
               if (animStretchY > 0 && !noStretchY) {
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
                     if (Math.abs(animOffsetX) >2 && Math.abs(animOffsetX) <4) {
                        offsetShift = animOffsetX/3*dirY
                     } else if (Math.abs(animOffsetX) >1 && Math.abs(animOffsetX)<3) {
                        offsetShift = animOffsetX/2*dirY
                     }

                     if (!vCondenseMode) lineType(stretchXPos+offsetShift, stretchYPos,
                        stretchXPos+offsetShift, stretchYPos + dirY*0.5*animStretchY)

                     // if vertical line goes down, set those connection spots in the array
                     if (dirY === 1 && vCondenseMode) vConnectionSpots[Math.floor(stretchXPos + tx)] = 1
                  }
               }
               const extendamount = ((letterOuter % 2 == 0) ? 0 : 0.5) + (animStretchX-(animStretchX%2))*0.5
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

      function drawLine (strokeSizes, arcQ, offQ, tx, ty, axis, extension, startFrom, flipped) {
         //first, draw the fill
         if (!webglMode && strokeSizes.length > 1) {
            drawLineFill(strokeSizes, arcQ, offQ, tx, ty, axis, extension, startFrom)
         }

         push()
         translate(tx, ty)
         noFill()

         const smallest = strokeSizes[strokeSizes.length-1]
         const biggest = strokeSizes[0]

         let innerColor; let outerColor

         //if (true) {
         //   innerColor = color("green")
         //   outerColor = color("lime")
         //   strokeWeight((typeWeight/5)*strokeScaleFactor)
         //   draw()
         //}

         strokeWeight((animWeight/10)*strokeScaleFactor)
         if (xrayMode) {
            strokeWeight(0.2*strokeScaleFactor)
         }
         innerColor = (xrayMode)? color("lime") : lerpColor(lineColor,bgColor,(gradientMode) ? 0.5 : 0)
         outerColor = lineColor
         draw()

         function draw() {
            strokeSizes.forEach((size) => {
               // gradient from inside to outside - color or weight
               strokeStyleForRing(size, smallest, biggest, innerColor, outerColor, flipped, arcQ, offQ)

               const outerExt = 0

               // base position
               const offx = (offQ === 3 || offQ === 4) ? 1:0
               const offy = (offQ === 2 || offQ === 3) ? 1:0
               const basePos = getQuarterPos(offx, offy, letterOuter)

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
                  y2 += (letterOuter*0.5 + extension + outerExt) * dirY
                  //only draw the non-stretch part if it is long enough to be visible
                  if (dirY*(y2-y1)>=0) {
                    lineType(x1, y1, x2, y2)
                  }
                  if (animStretchY !== 0 && innerPosV === 0) {
                     //stretch
                     // the offset can be in between the regular lines horizontally if it would staircase nicely
                     let offsetShift = 0
                     if (Math.abs(animOffsetX) >2 && Math.abs(animOffsetX) <4) {
                        offsetShift = animOffsetX/3*dirY
                     } else if (Math.abs(animOffsetX) >1 && Math.abs(animOffsetX)<3) {
                        offsetShift = animOffsetX/2*dirY
                     }
                     if (!vCondenseMode) lineType(x1-offsetShift, y1-animStretchY*0.5*dirY, x2-offsetShift, y1)
                     
                     // if vertical line goes down, set those connection spots in the array
                     if (dirY === -1 && vCondenseMode) vConnectionSpots[Math.floor(x1 + tx)] = 1
                  }
               } else if (axis === "h") {
                  const toSideY = (arcQ === 1 || arcQ === 2) ? -1 : 1
                  y1 += size*toSideY*0.5
                  y2 += size*toSideY*0.5
                  const dirX = (arcQ === 1 || arcQ === 4) ? -1 : 1
                  x1 += innerPosH * dirX
                  x2 += (letterOuter*0.5 + extension) * dirX
                  //only draw the non-stretch part if it is long enough to be visible
                  if (dirX*(x2-x1)>=0) {
                     lineType(x1, y1, x2, y2)
                  }
                  if (animStretchX !== 0 && innerPosH === 0) {
                     //stretch
                     // the offset can be in between the regular lines vertically if it would staircase nicely
                     let offsetShift = 0
                     let stairDir = (verticalOffset+offy) % 2===0 ? -1 : 1
                     if (Math.abs(animOffsetY) >2 && Math.abs(animOffsetY) <4) {
                        offsetShift = (animOffsetY/3)*stairDir
                     } else if (Math.abs(animOffsetY) >1 && Math.abs(animOffsetY)<3) {
                        offsetShift = (animOffsetY/2)*stairDir
                     }
                     lineType(x1-animStretchX*0.5*dirX, y1+offsetShift, x1, y2+offsetShift)
                  }
               }
            });
         }

         pop()
      }

      function drawLineFill (strokeSizes, arcQ, offQ, tx, ty, axis, extension, startFrom) {
         if (weight === 0 || !drawFills) {
            return
         }

         push()
         translate(tx, ty)
         noFill()
         stroke((xrayMode)? color("#462"): bgColor)
         strokeWeight(weight*strokeScaleFactor)
         strokeCap(SQUARE)

         //for entire line
         const size = strokeSizes[0]
         const smallest = strokeSizes[strokeSizes.length-1]
         const biggest = strokeSizes[0]

         // to make the rectangles a little shorter at the end (?)
         let strokeWeightReference = (animWeight/10)
         if (xrayMode) {
            strokeWeightReference = 0.2*strokeScaleFactor
         }
         const outerExt = strokeWeightReference*-0.5

         // base position
         const offx = (offQ === 3 || offQ === 4) ? 1:0
         const offy = (offQ === 2 || offQ === 3) ? 1:0
         const basePos = getQuarterPos(offx, offy, size)

         let x1 = basePos.x
         let x2 = basePos.x
         let y1 = basePos.y
         let y2 = basePos.y

         const innerPosV = (startFrom !== undefined) ? startFrom - outerExt: 0
         const innerPosH = (startFrom !== undefined) ? startFrom - outerExt: 0

         if (axis === "v") {
            const toSideX = (arcQ === 1 || arcQ === 4) ? -0.5 : 0.5
            x1 += (smallest+weight)*toSideX
            x2 += (smallest+weight)*toSideX
            const dirY = (arcQ === 1 || arcQ === 2) ? -1 : 1
            y1 += innerPosV * dirY
            y2 += (letterOuter*0.5 + extension + outerExt) * dirY
            //only draw the non-stretch part if it is long enough to be visible
            if (dirY*(y2-y1)>0.1) {
              lineType(x1, y1, x2, y2)
            }
            if (animStretchY !== 0 && innerPosV === 0) {
               //stretch
               // the offset can be in between the regular lines horizontally if it would staircase nicely
               let offsetShift = 0
               if (Math.abs(animOffsetX) >2 && Math.abs(animOffsetX) <4) {
                  offsetShift = animOffsetX/3*dirY
               } else if (Math.abs(animOffsetX) >1 && Math.abs(animOffsetX)<3) {
                  offsetShift = animOffsetX/2*dirY
               }

               stroke((xrayMode)? color("#367"): bgColor)
              lineType(x1-offsetShift, y1-animStretchY*0.5*dirY, x2-offsetShift, y1)
            }
         } else if (axis === "h") {
            const toSideY = (arcQ === 1 || arcQ === 2) ? -0.5 : 0.5
            y1 += (smallest+weight)*toSideY
            y2 += (smallest+weight)*toSideY
            const dirX = (arcQ === 1 || arcQ === 4) ? -1 : 1
            x1 += innerPosH * dirX
            x2 += (letterOuter*0.5 + extension + outerExt) * dirX
            //only draw the non-stretch part if it is long enough to be visible
            if (dirX*(x2-x1)>0.1) {
              lineType(x1, y1, x2, y2)
            }
            if (animStretchX !== 0 && innerPosH === 0) {
               //stretch

               // the offset can be in between the regular lines vertically if it would staircase nicely
               let offsetShift = 0
               let stairDir = (verticalOffset+offy) % 2===0 ? -1 : 1
               if (Math.abs(animOffsetY) >2 && Math.abs(animOffsetY) <4) {
                  offsetShift = (animOffsetY/3)*stairDir
               } else if (Math.abs(animOffsetY) >1 && Math.abs(animOffsetY)<3) {
                  offsetShift = (animOffsetY/2)*stairDir
               }

               stroke((xrayMode)? color("#891"): bgColor)
              lineType(x1-animStretchX*0.5*dirX, y1+offsetShift, x1, y2+offsetShift)
            }
         }
         pop()
      }

      function strokeStyleForRing(size, smallest, biggest, innerColor, outerColor, flipped, arcQ, offQ) {
         //strokeweight
         if (strokeGradient && !xrayMode) {
            strokeWeight((animWeight/10)*strokeScaleFactor*map(size,smallest,biggest,0.3,1))
            if ((arcQ !== offQ) !== (flipped === "flipped")) {
               strokeWeight((animWeight/10)*strokeScaleFactor*map(size,smallest,biggest,1,10.3))
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
         lerpedColor = lerpColor(bgColor, lerpedColor, letterOpacity)
         stroke(lerpedColor)
      }

      function getQuarterPos(offx, offy, biggest) {
         // base position
         let xpos = topOffset + letterPositionFromLeft + (biggest/2)
         let ypos = startOffsetY
         // offset based on quarter and prev vertical offset
         xpos += (offx > 0) ? animOffsetX : 0
         ypos += (verticalOffset+offy) % 2==0 ? animOffsetY : 0
         xpos += (offy > 0) ? animStretchX : 0
         ypos += (offx > 0) ? animStretchY : 0
         return {x: xpos, y:ypos}
      }

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

      //position and offset after going through all letters in the line until this point
      const letterPositionFromLeft = lineWidthUntil(lineText, layerArray.indexOf(layerPos))
      const verticalOffset = offsetUntil(lineText, layerArray.indexOf(layerPos))

      // convenient values
      // per letter
      const ascenders = max(animAscenders+((letterOuter%2===0)?0:0), 1)
      const descenders = max(animAscenders+((letterOuter%2===0)?0:0), 1)
      const weight = (letterOuter-letterInner)*0.5
      const oneoffset = (letterOuter>3 && letterInner>2) ? 1 : 0
      const topOffset = (letterOuter < 0) ? -animOffsetX : 0
      const wideOffset = 0.5*letterOuter + 0.5*letterInner
      const extendOffset = ((letterOuter % 2 == 0) ? 0 : 0.5) + (animStretchX-(animStretchX%2))*0.5

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
               drawCorner("round",ringSizes, 1, 1, 0, 0, "", "")
               drawCorner("round",ringSizes, 2, 2, 0, 0, "", "")
               drawCorner("round",ringSizes, 3, 3, 0, 0, "", "")
               drawCorner("round",ringSizes, 4, 4, 0, 0, "", "")

               // SECOND LAYER
               if (letter === "d") {
                  drawLine(ringSizes, 2, 2, 0, 0, "v", ascenders)
               }
               else if (letter === "b") {
                  drawLine(ringSizes, 1, 1, 0, 0, "v", ascenders)
               }
               else if (letter === "q") {
                  drawLine(ringSizes, 3, 3, 0, 0, "v", descenders)
               } else if (letter === "p") {
                  drawLine(ringSizes, 4, 4, 0, 0, "v", descenders)
               } else if (letter === "ö") {
                  drawLine(ringSizes, 1, 1, 0, 0, "v", ascenders, letterOuter*0.5 + 1)
                  drawLine(ringSizes, 2, 2, 0, 0, "v", ascenders, letterOuter*0.5 + 1)
               }
               break;
            case "g":
               drawCorner("round",ringSizes, 1, 1, 0, 0, "", "")
               drawCorner("round",ringSizes, 2, 2, 0, 0, "linecut", "start")

               if (descenders <= weight + 1) {
                  // if only one ring, move line down so there is a gap
                  const extragap = (letterOuter > letterInner) ? 0:1
                  const lineOffset = (extragap+weight > descenders) ? -(weight-descenders) : extragap

                  drawLine(ringSizes, 2, 3, 0, letterOuter + lineOffset, "h", 0)
                  drawLine(ringSizes, 1, 4, 0, letterOuter + lineOffset, "h", 0)
               } else {
                  drawLine(ringSizes, 3, 3, 0, 0, "v", descenders - letterOuter*0.5)
                  drawCorner("square", ringSizes, 3, 3, 0, descenders-1, "", "")
                  drawLine(ringSizes, 4, 4, 0, descenders-1, "h", -1)
               }

               drawCorner("round",ringSizes, 3, 3, 0, 0, "", "")
               drawCorner("round",ringSizes, 4, 4, 0, 0, "", "")

               drawLine(ringSizes, 2, 2, 0, 0, "h", 0)
               //drawLine(ringSizes, 3, 3, 0, 0, "v", 0)
               break;
            case "c":
               drawCorner("round",ringSizes, 1, 1, 0, 0, "", "")
               if (charInSet(nextLetter, ["ul", "gap"])) {
                  drawCorner("round",ringSizes, 2, 2, 0, 0, "linecut", "end", undefined, true)
               } else {
                  drawCorner("round",ringSizes, 2, 2, 0, 0, "roundcut", "end", undefined, false)
               }
               if (charInSet(nextLetter, ["dl", "gap"])) {
                  drawCorner("round",ringSizes, 3, 3, 0, 0, "linecut", "start", undefined, true)
               } else {
                  drawCorner("round",ringSizes, 3, 3, 0, 0, "roundcut", "start", undefined, false)
               }
               drawCorner("round",ringSizes, 4, 4, 0, 0, "", "")
               break;
            case "e":
               drawCorner("round",ringSizes, 1, 1, 0, 0, "", "")
               drawCorner("round",ringSizes, 2, 2, 0, 0, "", "")
               if (((letterOuter-letterInner)/2+1)*tan(HALF_PI/4) < letterInner/2-2){
                  drawCorner("diagonal",ringSizes, 3, 3, 0, 0, "linecut", "end")
               } else {
                  drawCorner("round",ringSizes, 3, 3, 0, 0, "linecut", "end", undefined, true)
               }
               drawCorner("round",ringSizes, 4, 4, 0, 0, "", "")

               // SECOND LAYER
               if ("s".includes(nextLetter)) {
                  drawLine(ringSizes, 3, 3, 0, 0, "h", 1)
               } else if (charInSet(nextLetter,["gap"]) || "gz".includes(nextLetter)) {
                  drawLine(ringSizes, 3, 3, 0, 0, "h", 0)
               } else if (!charInSet(nextLetter,["dl", "gap"]) && letterInner <= 2) {
                  drawLine(ringSizes, 3, 3, 0, 0, "h", letterOuter*0.5 + animStretchX)
               } else if ("x".includes(nextLetter)) {
                  drawLine(ringSizes, 3, 3, 0, 0, "h", letterOuter*0.5 + animStretchX-weight)
               } else if (!charInSet(nextLetter,["dl"])) {
                  drawLine(ringSizes, 3, 3, 0, 0, "h", -oneoffset+max(animSpacing, -weight))
               } else if (animSpacing < 0) {
                  drawLine(ringSizes, 3, 3, 0, 0, "h", -oneoffset+max(animSpacing, -weight))
               } else if (animSpacing > 0){
                  drawLine(ringSizes, 3, 3, 0, 0, "h", 0)
               } else {
                  drawLine(ringSizes, 3, 3, 0, 0, "h", -oneoffset)
               }
               break;
            case "a":
            case "ä":
               drawCorner("round",ringSizes, 1, 1, 0, 0, "", "")
               drawCorner("round",ringSizes, 2, 2, 0, 0, "", "")
               if (((letterOuter-letterInner)/2+1)*tan(HALF_PI/4) < letterInner/2-2){
                  drawCorner("diagonal",ringSizes, 3, 3, 0, 0, "linecut", "start")
               } else {
                  drawCorner("round",ringSizes, 3, 3, 0, 0, "linecut", "start", undefined, true)
               }
               drawCorner("round",ringSizes, 4, 4, 0, 0, "", "")

               // SECOND LAYER
               drawLine(ringSizes, 3, 3, 0, 0, "v", 0)

               if (letter === "ä") {
                  drawLine(ringSizes, 1, 1, 0, 0, "v", ascenders, letterOuter*0.5 + 1)
                  drawLine(ringSizes, 2, 2, 0, 0, "v", ascenders, letterOuter*0.5 + 1)
               }
               break;
            case "n":
               if (altNH) {
                  drawCorner("square",ringSizes, 1, 1, 0, 0, "", "")
                  drawCorner("square",ringSizes, 2, 2, 0, 0, "", "")
               } else {
                  drawCorner("round",ringSizes, 1, 1, 0, 0, "", "")
                  drawCorner("round",ringSizes, 2, 2, 0, 0, "", "")
               }
               drawLine(ringSizes, 3, 3, 0, 0, "v", 0)
               drawLine(ringSizes, 4, 4, 0, 0, "v", 0)
               break;
            case "m":
               if (altM) {
                  drawCorner("square",ringSizes, 1, 1, 0, 0, "", "")
                  drawCorner("square",ringSizes, 2, 2, 0, 0, "", "")
                  drawLine(ringSizes, 3, 3, 0, 0, "v", 0)
                  drawLine(ringSizes, 4, 4, 0, 0, "v", 0)
                  // SECOND LAYER
                  drawCorner("square",ringSizes, 2, 1, wideOffset + animStretchX*2, 0, "", "", "flipped")
                  drawCorner("square",ringSizes, 1, 2, wideOffset, 0, "branch", "start", "flipped")
                  drawLine(ringSizes, 4, 3, wideOffset, 0, "v", 0, undefined, "flipped")
                  drawLine(ringSizes, 3, 4, wideOffset + animStretchX*2, 0, "v", 0, undefined, "flipped")
               } else {
                  drawCorner("diagonal",ringSizes, 1, 1, 0, 0, "", "")
                  drawCorner("diagonal",ringSizes, 2, 2, 0, 0, "", "")
                  drawLine(ringSizes, 3, 3, 0, 0, "v", 0)
                  drawLine(ringSizes, 4, 4, 0, 0, "v", 0)
                  // SECOND LAYER
                  drawCorner("diagonal",ringSizes, 2, 1, wideOffset + animStretchX*2, 0, "", "", "flipped")
                  drawCorner("diagonal",ringSizes, 1, 2, wideOffset, 0, "", "", "flipped")
                  drawLine(ringSizes, 4, 3, wideOffset, 0, "v", 0, undefined, "flipped")
                  drawLine(ringSizes, 3, 4, wideOffset + animStretchX*2, 0, "v", 0, undefined, "flipped")
               }
              
               break;
            case "s":
               if (!altS) {
                  //LEFT OVERLAP
                  if (prevLetter === "s") {
                     drawCorner("round",ringSizes, 4, 4, 0, 0, "roundcut", "end", isFlipped)
                  } else if (prevLetter === "r") {
                     drawCorner("round",ringSizes, 4, 4, 0, 0, "linecut", "end", isFlipped)
                  } else if (!charInSet(prevLetter,["gap", "dr"]) && !"fk".includes(prevLetter)) {
                     drawCorner("round",ringSizes, 4, 4, 0, 0, "roundcut", "end", isFlipped)
                  }
                  let xOffset = 0
                  //start further left if not connecting left
                  if (charInSet(prevLetter,["gap", "dr"])) {
                     xOffset = -letterOuter*0.5 + extendOffset -animStretchX
                     drawCorner("round",ringSizes, 3, 3, xOffset, 0, "extend", "end", isFlipped)
                  } else {
                     drawCorner("round",ringSizes, 3, 3, xOffset, 0, "", "", isFlipped)
                  }
                  if (!charInSet(nextLetter,["gap", "ul"]) && !"zxj".includes(nextLetter) || nextLetter === "s") {
                     drawCorner("round",ringSizes, 1, 2, wideOffset + xOffset, 0, "", "", isFlipped)
                     drawCorner("round",ringSizes, 2, 1, wideOffset + animStretchX*2 + xOffset, 0, "roundcut", "end", isFlipped)
                  } else {
                     drawCorner("round",ringSizes, 1, 2, wideOffset + xOffset, 0, "extend", "end", isFlipped)
                  }
               } else {
                  // alternative cursive s

                  //LEFT OVERLAP
                  if (charInSet(prevchar,["dr"])) {
                     drawCorner("round",ringSizes, 4, 4, 0, 0, "linecut", "end")
                  } else if (prevLetter !== "t") {
                     drawCorner("round",ringSizes, 4, 4, 0, 0, "roundcut", "end")
                  }

                  drawCorner("round",ringSizes, 2, 2, 0, 0, "", "")
                  drawCorner("round",ringSizes, 3, 3, 0, 0, "", "")
                  if (charInSet(prevLetter,["gap"])) {
                     drawCorner("round",ringSizes, 4, 4, 0, 0, "", "")
                  }
               }
               break;
            case "x":
               push()
               if (charInSet(prevLetter,["gap","ur"]) && charInSet(prevLetter,["gap","dr"])) {
                  translate(-weight-1,0)
               }

               //LEFT OVERLAP
               // top connection
               if (!charInSet(prevLetter,["gap"]) && prevLetter !== "x") {
                  if (charInSet(prevLetter,["ur"]) || "l".includes(prevLetter)) {
                     drawCorner("round",ringSizes, 1, 1, 0, 0, "linecut", "start")
                  } else if (prevLetter !== "t"){
                     drawCorner("round",ringSizes, 1, 1, 0, 0, "roundcut", "start")
                  }
               }
               // bottom connection
               if (!"xef".includes(prevLetter) && !charInSet(prevLetter,["gap"])) {
                  if (prevLetter === "s" && !altS) {
                     drawCorner("round",ringSizes, 4, 4, 0, 0, "roundcut", "end", isFlipped)
                  } else if (prevLetter === "r" || charInSet(prevLetter,["dr"])) {
                     drawCorner("round",ringSizes, 4, 4, 0, 0, "linecut", "end", isFlipped)
                  } else {
                     drawCorner("round",ringSizes, 4, 4, 0, 0, "roundcut", "end", isFlipped)
                  }
               }

               if (charInSet(prevLetter, ["gap"])) {
                  drawCorner("round",ringSizes, 1, 1, 0, 0, "linecut", "start", undefined, true)
               }
               drawCorner("round",ringSizes, 2, 2, 0, 0, "", "")
               drawCorner("round",ringSizes, 4, 3, wideOffset, 0, "", "")

               if (nextLetter !== "x") {
                  if (!charInSet(nextLetter,["dl", "gap"])) {
                     drawCorner("round",ringSizes, 3, 4, wideOffset + animStretchX*2, 0, "roundcut", "start")
                  } else {
                     drawCorner("round",ringSizes, 3, 4, wideOffset + animStretchX*2, 0, "linecut", "start", undefined, true)
                  }
               }

               // SECOND LAYER
               drawCorner("diagonal",ringSizes, 1, 2, wideOffset, 0, "", "", "flipped")
               if (nextLetter !== "x") {
                  if (!charInSet(nextLetter,["gap", "ul"])) {
                     drawCorner("round",ringSizes, 2, 1, wideOffset+ animStretchX*2, 0, "roundcut", "end", "flipped")
                  } else {
                     drawCorner("round",ringSizes, 2, 1, wideOffset+ animStretchX*2, 0, "linecut", "end", "flipped", true)
                  }
               }
               drawCorner("diagonal",ringSizes, 3, 3, 0, 0, "", "", "flipped")
               if (charInSet(prevLetter,["gap"])) {
                  drawCorner("round",ringSizes, 4, 4, 0, 0, "linecut", "end", "flipped", true)
               }
               pop()
               break;
            case "u":
            case "ü":
            case "y":
               drawLine(ringSizes, 1, 1, 0, 0, "v", 0)
               drawLine(ringSizes, 2, 2, 0, 0, "v", 0)
               drawCorner("round",ringSizes, 3, 3, 0, 0, "", "")
               drawCorner("round",ringSizes, 4, 4, 0, 0, "", "")

               // SECOND LAYER
               if (letter === "y") {
                  drawLine(ringSizes, 3, 3, 0, 0, "v", descenders)
               } else if (letter === "ü") {
                  drawLine(ringSizes, 1, 1, 0, 0, "v", ascenders, letterOuter*0.5 + 1)
                  drawLine(ringSizes, 2, 2, 0, 0, "v", ascenders, letterOuter*0.5 + 1)
               }
               break;
            case "w":
               drawLine(ringSizes, 1, 1, 0, 0, "v", 0)
               drawLine(ringSizes, 2, 2, 0, 0, "v", 0)
               drawCorner("diagonal",ringSizes, 3, 3, 0, 0, "", "")
               drawCorner("diagonal",ringSizes, 4, 4, 0, 0, "", "")

               drawLine(ringSizes, 2, 1, wideOffset + animStretchX*2, 0, "v", 0, undefined, "flipped")
               drawLine(ringSizes, 1, 2, wideOffset, 0, "v", 0, undefined, "flipped")
               drawCorner("diagonal",ringSizes, 4, 3, wideOffset, 0, "", "", "flipped")
               drawCorner("diagonal",ringSizes, 3, 4, wideOffset + animStretchX*2, 0, "", "", "flipped")
               break;
            case "r":
               drawCorner("round",ringSizes, 1, 1, 0, 0, "", "")
               if (charInSet(nextLetter,["ul", "gap"])) {
                  drawCorner("round",ringSizes, 2, 2, 0, 0, "linecut", "end", undefined, true)
               } else {
                  drawCorner("round",ringSizes, 2, 2, 0, 0, "roundcut", "end")
               }
               drawLine(ringSizes, 4, 4, 0, 0, "v", 0)
               break;
            case "l":
            case "t":

               if (letter === "t") {
                  drawLine(ringSizes, 1, 1, 0, 0, "v", ascenders)
                  drawCorner("square",ringSizes, 1, 1, 0, 0, "branch", "end")
                  if (!"zx".includes(nextLetter)) {
                     if (charInSet(nextLetter,["ul", "gap"]) || letterInner > 2) {
                        drawLine(ringSizes, 2, 2, 0, 0, "h", -weight-1 + ((letterInner<2) ? 1 : 0))
                     } else {
                        drawLine(ringSizes, 2, 2, 0, 0, "h", letterOuter*0.5-weight)
                     }
                  }
               } else {
                  drawLine(ringSizes, 1, 1, 0, 0, "v", ascenders)
               }

               drawCorner("round",ringSizes, 4, 4, 0, 0, "", "")
               if (charInSet(nextLetter,["dl", "gap"])) {
                  drawCorner("round",ringSizes, 3, 3, 0, 0, "linecut", "start", undefined, true)
               } else {
                  drawCorner("round",ringSizes, 3, 3, 0, 0, "roundcut", "start", undefined, false)
               }
               break;
            case "f":
               drawCorner("round",ringSizes, 1, 1, 0, 0, "", "")
               if (charInSet(nextLetter,["ul", "gap"])) {
                  drawCorner("round",ringSizes, 2, 2, 0, 0, "linecut", "end", undefined, true)
               } else {
                  drawCorner("round",ringSizes, 2, 2, 0, 0, "roundcut", "end", undefined, false)
               }
               drawLine(ringSizes, 4, 4, 0, 0, "v", descenders)
               drawCorner("square", ringSizes, 4, 4, 0, 0, "branch", "start")

               // SECOND LAYER
               if (!"sx".includes(nextLetter)) {
                  if (charInSet(nextLetter,["dl", "gap"]) || letterInner > 2) {
                     drawLine(ringSizes, 3, 3, 0, 0, "h", -weight-1 + ((letterInner<2) ? 1 : 0))
                  } else {
                     drawLine(ringSizes, 3, 3, 0, 0, "h", letterOuter*0.5-weight)
                  }
               }
               break;
            case "k":
               drawLine(ringSizes, 1, 1, 0, 0, "v", ascenders)
               drawLine(ringSizes, 4, 4, 0, 0, "v", 0)
               drawCorner("diagonal",ringSizes, 1, 1, weight, 0, "", "")
               drawCorner("diagonal",ringSizes, 4, 4, weight, 0, "", "")
               if (!"x".includes(nextLetter)) {
                  drawLine(ringSizes, 2, 2, weight, 0, "h", -oneoffset-weight)
               }
               if (!"sx".includes(nextLetter)) {
                  if (!(charInSet(nextLetter,["dl", "gap"]))) {
                     drawCorner("round",ringSizes, 3, 3, weight, 0, "roundcut", "start")
                  } else {
                     drawLine(ringSizes, 3, 3, weight, 0, "h", -oneoffset-weight)
                  }
               }
               break;
            case "h":
               drawLine(ringSizes, 1, 1, 0, 0, "v", ascenders, 0)

               // SECOND LAYER
               if (altNH) {
                  drawCorner("square",ringSizes, 1, 1, 0, 0, "branch", "end")
                  drawCorner("square",ringSizes, 2, 2, 0, 0, "", "")
               } else {
                  drawCorner("round",ringSizes, 1, 1, 0, 0, "", "")
                  drawCorner("round",ringSizes, 2, 2, 0, 0, "", "")
               }
               drawLine(ringSizes, 3, 3, 0, 0, "v", 0)
               drawLine(ringSizes, 4, 4, 0, 0, "v", 0)
               break;
            case "v":
               drawLine(ringSizes, 1, 1, 0, 0, "v", 0)
               drawLine(ringSizes, 2, 2, 0, 0, "v", 0)
               if (((letterOuter-letterInner)/2+1)*tan(HALF_PI/4) < letterInner/2-2){
                  drawCorner("diagonal",ringSizes, 3, 3, 0, 0, "", "")
                  drawCorner("diagonal",ringSizes, 4, 4, 0, 0, "", "")
               } else {
                  drawCorner("diagonal",ringSizes, 3, 3, 0, 0, "", "")
                  drawCorner("square",ringSizes, 4, 4, 0, 0, "", "")
               }
               break;
            case ".":
               drawLine(ringSizes, 4, 4, 0, 0, "v", 0, letterOuter*0.5 - (weight+0.5))
               break;
            case ",":
               drawLine(ringSizes, 4, 4, 0, 0, "v", descenders, letterOuter*0.5 - (weight+0.5))
               break;
            case "!":
               // wip
               drawLine(ringSizes, 1, 1, 0, 0, "v", ascenders,)
               drawLine(ringSizes, 4, 4, 0, 0, "v", -weight-1.5)
               drawLine(ringSizes, 4, 4, 0, 0, "v", 0, letterOuter*0.5 - (weight+0.5))
               break;
            case "?":
               // wip
               drawCorner("round", ringSizes, 1, 1, 0, 0, "", "")
               drawCorner("round", ringSizes, 2, 2, 0, 0, "", "")
               drawCorner("round", ringSizes, 3, 3, 0, 0, "", "")
               drawCorner("round", ringSizes, 4, 4, 0, 0, "linecut", "end")
               drawLine(ringSizes, 4, 4, 0, 0, "v", ascenders, letterOuter*0.5 - (weight+0.5))
               break;
            case "i":
               drawLine(ringSizes, 1, 1, 0, 0, "v", ascenders, letterOuter*0.5 + 1)
               drawLine(ringSizes, 1, 1, 0, 0, "v", 0)
               drawLine(ringSizes, 4, 4, 0, 0, "v", 0)
               break;
            case "j":
               let leftOffset = 0
               if (charInSet(prevLetter,["gap"])) {
                  leftOffset = -weight-1
               }

               // LEFT OVERLAP
               if (prevLetter !== undefined) {
                  if (charInSet(prevLetter,["dr", "gap"]) || "r".includes(prevLetter)) {
                     drawCorner("round",ringSizes, 4, 4, leftOffset, 0, "linecut", "end", undefined, true)
                  } else if (!"tk".includes(prevLetter)) {
                     drawCorner("round",ringSizes, 4, 4, leftOffset, 0, "roundcut", "end")
                  }
                  if (!charInSet(prevLetter,["tr"]) && !"ckrsx".includes(prevLetter)) {
                     drawLine(ringSizes, 1, 1, leftOffset, 0, "h", -weight-1)
                  }
               }
               
               drawLine(ringSizes, 2, 2, leftOffset, 0, "v", ascenders, letterOuter*0.5 + 1)
               drawCorner("square", ringSizes, 2, 2, leftOffset, 0, "", "")
               drawCorner("round", ringSizes, 3, 3, leftOffset, 0, "", "")
               if (prevLetter === undefined) {
                  drawLine(ringSizes, 1, 1, leftOffset, 0, "h", -weight-1)
                  drawCorner("round", ringSizes, 4, 4, leftOffset, 0, "linecut", "end")
               }
               break;
            case "z":
               // LEFT OVERLAP
               if (charInSet(prevLetter,["ur"])) {
                  drawCorner("round",ringSizes, 1, 2, 0, 0, "linecut", "start", "flipped")
               } else if (!charInSet(prevLetter,["gap"])) {
                  drawCorner("round",ringSizes, 1, 2, 0, 0, "roundcut", "start", "flipped")
               } else {
                  //can't be reached, do below instead
                  //drawCorner("round",ringSizes, 1, 1, 0, 0)
               }

               //1st line oben
               if (charInSet(prevLetter, ["gap"])) {
                  drawCorner("round", ringSizes, 1, 1, 0, 0, "", "")
               }

               drawLine(ringSizes, 2, 2, 0, 0, "h", 1)
               drawCorner("diagonal", ringSizes, 1, 2, letterOuter*0.5 + 1, 0, "", "", "flipped")

               if (charInSet(nextLetter,["dl"])) {
                  drawCorner("round",ringSizes, 3, 4, weight+2+animStretchX*2, 0, "linecut", "start")
               } else if (!charInSet(nextLetter,["gap"])) {
                  drawCorner("round",ringSizes, 3, 4, weight+2+animStretchX*2, 0, "roundcut", "start")
               } else {
                  drawCorner("round",ringSizes, 3, 4, weight+2+animStretchX*2, 0, "", "")
               }

               drawCorner("diagonal", ringSizes, 3, 3, weight+1-letterOuter*0.5, 0, "", "", "flipped")
               drawLine(ringSizes, 4, 3, weight+2, 0, "h", 1)
               break;
            case "-":
               drawLine([letterOuter], 1, 1, 0, +letterOuter*0.5, "h", -1)
               drawLine([letterOuter], 2, 2, 0, +letterOuter*0.5, "h", -1)
               break;
            case "_":
               drawLine([letterOuter], 3, 3, 0, 0, "h", -1)
               drawLine([letterOuter], 4, 4, 0, 0, "h", -1)
               break;
            case " ":
               break;
            case "‸":
               //caret symbol
               letterOpacity = 0.5
               drawLine([letterOuter], 1, 1, 1, 0, "v", animAscenders+1, undefined, undefined)
               drawLine([letterOuter], 4, 4, 1, 0, "v", animAscenders+1)
               break;
            default:
               drawCorner("square",[letterOuter], 1, 1, 0, 0, "", "")
               drawCorner("square",[letterOuter], 2, 2, 0, 0, "", "")
               drawCorner("square",[letterOuter], 3, 3, 0, 0, "", "")
               drawCorner("square",[letterOuter], 4, 4, 0, 0, "", "")
               break;
         }
         letterOpacity = 1
      })()
   }

   const height = animSize + Math.abs(animOffsetY) + animStretchY
   const asc = animAscenders

   //(wip)
   startOffsetY += height + asc + 1
   totalHeight[lineNum] = height + asc + 1

   if (xrayMode) {
      drawGrid("debug")
   }

   if (vCondenseMode) {
      drawVConnections()
   }

   function drawGrid (type) {
      push()
      if (webglMode) translate(0,0,-1)
      const height = animSize + Math.abs(animOffsetY) + animStretchY
      const width = totalWidth[lineNum] + Math.abs(animOffsetX)
      const asc = animAscenders

      if (type === "debug") {
         lineColor.setAlpha(40)
         stroke(lineColor)
         strokeWeight(0.2*strokeScaleFactor)
   
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
      } else if (!xrayMode){
         stroke(lineColor)
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
      bgColor.setAlpha(255)
      lineColor.setAlpha(255)
      pop()
   }

   function drawVConnections () {
      push()
         stroke(lineColor)
         noFill()
         strokeWeight((animWeight/10)*1*strokeScaleFactor)
         const i = lineNum * totalHeight[lineNum] - animSize/2
         translate(0,height*0.5+i)
         let vCondensedTotal = 0
         for (let j = 0; j <= totalWidth[lineNum]; j++) {
            if (vConnectionSpots[j] === 1) {
               vCondensedTotal++
            }
         }
         let vCondensedOffset = (totalWidth[lineNum] - vCondensedTotal)*0.5
         let vCondensedCount = vCondensedOffset
         for (let j = 0; j <= totalWidth[lineNum]; j++) {
            if (vConnectionSpots[j] === 1) {
               bezier(j, -animStretchY*0.5, j, -animStretchY*0.25, vCondensedCount, -animStretchY*0.25, vCondensedCount, 0)
               bezier(j + animOffsetX, +animStretchY*0.5, j + animOffsetX, +animStretchY*0.25, vCondensedCount + animOffsetX, +animStretchY*0.25, vCondensedCount + animOffsetX, 0)
               vCondensedCount++
            }
         }
      pop()
   }
   pop()
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
         if (!altS) {
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
         charWidth = 2 + outer
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
            charWidth += -weight
         }
         break;
      case "f":
      case "c":
      case "r":
         if (charInSet(nextchar,["gap", "ul"])) {
            charWidth += -weight
         }
         break;
      case "?":
         charWidth = ceil(outer*0.5)
         break;
      case "‸":
         charWidth = 2
         break;
   }

   // 1 less space after letters with cutoff
   if ("ktlcrfsx-".includes(char) && charInSet(nextchar,["gap"])) {
      charWidth -= 1
   }
   // 1 less space in front of xs-
   if ("xs-".includes(nextchar) && charInSet(char,["gap"])) {
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
            if (!altS) {
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
               if (!altS) {
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
         if (!altS) {
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
         stretchWidth += animStretchX * 2
         break;
      case "i":
      case ".":
      case ",":
      case "!":
      case " ":
         stretchWidth = 0
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
            if (!altS) {
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
   if (webglMode) {
      push()
      //translate(0, 0, random())

      //line(x1, y1, x2, y2)
      push()
      noStroke()
      fill(lineColor)
      specularMaterial(lineColor);
      for (let i = 0; i < 11; i++) {
         push()
         translate(x1+(x2-x1)*0.1*i, y1+(y2-y1)*0.1*i)
         sphere(animWeight/10,6, 6)
         pop()
      }
      //translate((x1+x2)/2, (y1+y2)/2)
      //cylinder(typeWeight/10, abs(x2-x1)+abs(y2-y1), 6, 1, false, false)
      pop()

     // noStroke()
     // fill("white")
     // circle(x1, y1, (typeWeight/10)*1)
     // circle(x2, y2, (typeWeight/10)*1)
     // noFill()
      pop()
      return
   }
   line(x1, y1, x2, y2)
}

function arcType (x, y, w, h, start, stop) {
   if (webglMode) {
      push()
      //translate(0, 0, random())
      
      //arc(x, y, w, h, start, stop,undefined,12)
      noStroke()
      fill(lineColor)
      specularMaterial(lineColor);
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
