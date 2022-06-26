'use strict'

let cnv
let svgMode = false
let webglMode = false
let startOffsetY

let bgColor
let lineColor
let randomizeAuto = false
let lerpLength = 6

let noMenu = false
let darkMode = true
let printMode = false
let debugGridMode = false
let drawFills = true
let alignCenter = false
let strokeGradient = false
let initialDraw = true
let gridType = ""

let sliderModes = [
   "size", "rings", "spacing", "xoffset", "yoffset", "xstretch", "ystretch", "weight", "gradient"
]
let sliderMode = 0
let sliderChange = 0
let waveMode = false

const appScale = 10
let strokeScaleFactor = 1
const totalWidth = [0, 0, 0, 0]
const totalHeight = [0, 0, 0, 0]

let values = {
   colorDark: {from: undefined, to: undefined, lerp: 0},
   colorLight: {from: undefined, to: undefined, lerp: 0},
   rings: {from: 3, to: undefined, lerp: 0},
   size: {from: 9, to: undefined, lerp: 0},
   spacing: {from: 0, to: undefined, lerp: 0},
   offsetX: {from: 0, to: undefined, lerp: 0},
   stretchX: {from: 0, to: undefined, lerp: 0},
   offsetY: {from: 0, to: undefined, lerp: 0},
   stretchY: {from: 0, to: undefined, lerp: 0},
   gradient: {from: 0, to: undefined, lerp: 0},
   weight: {from: 7, to: undefined, lerp: 0},
   ascenders: {from: 0.25, to: undefined, lerp: 0},
}
// calculated every frame based on current lerps
let typeSize
let typeRings
let typeSpacing
let typeOffsetX
let typeOffsetY
let typeStretchX
let typeStretchY
let typeWeight
let typeGradient
let typeAscenders
let themeDark
let themeLight
let typeSpacingY = undefined//5*0.25 +1

let linesArray = ["hamburgefonstiv", "", "", "", ""]
let currentLine = 0
const validLetters = "abcdefghijklmnopqrstuvwxyzäöü,.!?-_ "

// use alt letters?
let altS = false
let altM = false

function windowResized() {
   if (!noMenu) {
      resizeCanvas(windowWidth-10, windowHeight-10)
   }
}

function setup () {
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
      debugGridMode = true
      print("Loaded with URL Mode: XRAY")
   }
   if (params.center === "true" || params.center === "1") {
      alignCenter = true
      print("Loaded with URL Mode: Centered")
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
      printMode = true
      print("Loaded with URL Mode: Mono")
   }
   if (params.strokegradient === "true" || params.strokegradient === "1") {
      strokeGradient = true
      print("Loaded with URL Mode: Stroke Gradient")
   }
   if (params.nomenu === "true" || params.nomenu === "1") {
      noMenu = true
      print("Loaded with URL Mode: Menu Hidden")
   }
   if (params.line1 !== null && params.line1.length > 0) {
      if (params.line5 !== null && params.line4 !== null && params.line3 !== null && params.line2 !== null) {
         linesArray = [params.line1, params.line2, params.line3, params.line4, params.line5]
         currentLine = 4
      } else if (params.line4 !== null && params.line3 !== null && params.line2 !== null) {
         linesArray = [params.line1, params.line2, params.line3, params.line4, ""]
         currentLine = 3
      } else if (params.line3 !== null && params.line2 !== null) {
         linesArray = [params.line1, params.line2, params.line3, "", ""]
         currentLine = 2
      } else if (params.line2 !== null) {
         linesArray = [params.line1, params.line2, "", "", ""]
         currentLine = 1
      } else {
         linesArray = [params.line1, "", "", "", ""]
         currentLine = 0
      }
      print("Loaded with URL Text")
   }
   if (params.values !== null && params.values.length > 0) {
      const valString = String(params.values)
      const valArray = valString.split('_')

      if (valString.match("[0-9_-]+") && valArray.length === 9) {
         print("Loaded with parameters", valArray)
         values.size.from = parseInt(valArray[0])
         values.rings.from = parseInt(valArray[1])
         values.spacing.from = parseInt(valArray[2])
         values.offsetX.from = parseInt(valArray[3])
         values.offsetY.from = parseInt(valArray[4])
         values.stretchX.from = parseInt(valArray[5])
         values.stretchY.from = parseInt(valArray[6])
         values.weight.from = parseInt(valArray[7])
         values.gradient.from = parseInt(valArray[8])
      } else {
         print("Has to be 9 negative or positive numbers with _ in between")
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

   cnv = createCanvas(windowWidth-10, windowHeight-10,(webglMode)?WEBGL:(svgMode)?SVG:"")
   if (!webglMode) {
      strokeCap(ROUND)
      textFont("Courier Mono")
      frameRate(60)
      if (svgMode) strokeScaleFactor = appScale
   } else {
      frameRate(60)
      strokeScaleFactor = appScale
   }
   rectMode(CORNERS)
   
   

   values.colorDark.from = color("#16111F")
   values.colorLight.from = color("#C4B6FF")
}

function changeValuesAndURL () {
   // translate left/right arrow use to correct "to" value
   if (sliderChange !== 0) {
      switch (sliderMode) {
         case 0:
            values.size.to = values.size.from + sliderChange
            // smallest possible size is 1
            values.size.to = max(values.size.to, 1)
            break;
         case 1:
            values.rings.to = values.rings.from + sliderChange
            // smallest possible ring count is 1
            values.rings.to = max(values.rings.to, 1)
            break;
         case 2:
            values.spacing.to = values.spacing.from + sliderChange
            // furthest spacing is half the outer size
            values.spacing.to = max(values.spacing.to, Math.ceil(values.size.from*-0.5))
            values.spacing.to = min(values.spacing.to, Math.ceil(values.size.from*0.25))
            break;
         case 3:
            values.offsetX.to = values.offsetX.from + sliderChange
            //furthest offset is spacing + outer size
            values.offsetX.to = max(values.offsetX.to, -(values.size.from+values.spacing.from))
            values.offsetX.to = min(values.offsetX.to, (values.size.from+values.spacing.from))
            break;
         case 4:
            values.offsetY.to = values.offsetY.from + sliderChange
            //furthest vert offset is outer size
            values.offsetY.to = max(values.offsetY.to, -(values.size.from))
            values.offsetY.to = min(values.offsetY.to, (values.size.from))
            break;
         case 5:
            values.stretchX.to = values.stretchX.from + sliderChange
            //stretch is minimum 0
            values.stretchX.to = max(values.stretchX.to, 0)
            break;
         case 6:
            values.stretchY.to = values.stretchY.from + sliderChange
            //stretch is minimum 0
            values.stretchY.to = max(values.stretchY.to, 0)
            break;
         case 7:
            values.weight.to = values.weight.from + sliderChange
            //weight
            values.weight.to = max(values.weight.to, 2)
            values.weight.to = min(values.weight.to, 9)
            break;
         case 8:
            values.gradient.to = values.gradient.from + sliderChange
            //gradient
            values.gradient.to = max(values.gradient.to, 0)
            values.gradient.to = min(values.gradient.to, 9)
            break;
      }
      sliderChange = 0
   }

   // change URL
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
      valueArr.push(getValue("size"))
      valueArr.push(getValue("rings"))
      valueArr.push(getValue("spacing"))
      valueArr.push(getValue("offsetX"))
      valueArr.push(getValue("offsetY"))
      valueArr.push(getValue("stretchX"))
      valueArr.push(getValue("stretchY"))
      valueArr.push(getValue("weight"))
      valueArr.push(getValue("gradient"))

      newParams.append("values",valueArr.join("_"))
   }

   // add word parameter if it isn't the default word or has more lines
   if (linesArray[0] !== "hamburgefonstiv" || currentLine > 0) {
      newParams.append("line1",linesArray[0])
   }
   if (currentLine > 0) {
      newParams.append("line2",linesArray[1])
   }
   if (currentLine > 1) {
      newParams.append("line3",linesArray[2])
   }
   if (currentLine > 2) {
      newParams.append("line4",linesArray[3])
   }
   if (currentLine > 3) {
      newParams.append("line5", linesArray[4])
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
   if (printMode) {
      newParams.append("mono",true)
   }
   if (debugGridMode) {
      newParams.append("xray",true)
   }
   if (waveMode) {
      newParams.append("wave",true)
   }
   if (!drawFills) {
      newParams.append("solid",false)
   }
   if (alignCenter) {
      newParams.append("center",true)
   }
   if (strokeGradient) {
      newParams.append("strokegradient",true)
   }
   if (noMenu) {
      newParams.append("nomenu",true)
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

   if (svgMode) {
      location.reload()
   }
}

function keyTyped() {
   if (key === "2") {
      darkMode = !darkMode
      changeValuesAndURL()
      return
   }
   else if (key === "1") {
      //random
      //randomizeAuto = !randomizeAuto
      //if (randomizeAuto) {
      //   lerpLength = 12
      //} else {
      //   lerpLength = 6
      //}
      randomizeValues()
      return

   }
   else if (key === "3") {
      //toggle print b/w mode
      printMode = !printMode
      changeValuesAndURL()
      return
   }
   else if (key === "4") {
      //toggle debug mode
      debugGridMode = !debugGridMode
      changeValuesAndURL()
      return
   }
   else if (key === "5") {
      waveMode = !waveMode
      changeValuesAndURL()
      return
   }
   else if (key === "6") {
      drawFills = !drawFills
      changeValuesAndURL()
      return
   }
   else if (key === "7") {
      alignCenter = !alignCenter
      changeValuesAndURL()
      return
   }
   else if (key === "8") {
      //reset
      values.rings.to = 3
      values.size.to = 9
      values.spacing.to = 0
      values.offsetX.to = 0
      values.offsetY.to = 0
      values.stretchX.to = 0
      values.stretchY.to = 0
      values.weight.to = 7
      values.gradient.to = 0
      lerpLength = 6
      changeValuesAndURL()
      return
   }
   else if (key === "9") {
      linesArray = ["","","","", ""]
      currentLine = 0
      changeValuesAndURL()
      return
   }

   if (validLetters.includes(key)) {
      linesArray[currentLine] += key;
      changeValuesAndURL()
   }
}

function keyPressed() {
   if (keyCode === BACKSPACE) {
      if (currentLine > 0 && linesArray[currentLine].length === 0) {
         currentLine--
      } else {
         linesArray[currentLine] = linesArray[currentLine].slice(0, -1)
      }
      changeValuesAndURL()
      return
   }

   if (keyCode === RETURN) {
      if (currentLine < linesArray.length-1) {
         currentLine++
      }
      changeValuesAndURL()
      return
   }

   sliderChange = 0
   if (keyCode === LEFT_ARROW) {
      sliderChange = -1
      changeValuesAndURL()
      return
   }
   else if (keyCode === RIGHT_ARROW) {
      sliderChange = 1
      changeValuesAndURL()
      return
   }
   else if (keyCode === DOWN_ARROW) {
      sliderMode += 1
      if (sliderMode >= sliderModes.length) {
         sliderMode = 0
      }
      return
   }
   else if (keyCode === UP_ARROW) {
      sliderMode -= 1
      if (sliderMode < 0) {
         sliderMode = sliderModes.length-1
      }
      return
   }
}

function randomizeValues() {
   values.size.to = floor(random(4,16))
   values.weight.to = floor(random(2,10))
   values.rings.to = floor(random(1, values.size.to/2 + 1))
   values.spacing.to = floor(random(-values.rings.to, 2))

   values.offsetX.to = 0
   values.offsetY.to = 0
   values.stretchX.to = 0
   values.stretchY.to = 0
   values.gradient.to = 0

   const offsetType = random(["v", "h", "h", "h", "0", "0", "0", "vh"])
   if (offsetType === "h") {
      values.offsetX.to = floor((random(-values.rings.to+1, values.rings.to) + random(-values.rings.to+1, values.rings.to))*0.5)
   } else if (offsetType === "v") {
      values.offsetY.to = floor(random(-1, 2))
   } else if (offsetType === "ha") {
      values.offsetX.to = floor(random(-1, 2)) * (values.size.to+values.spacing.to)
   } else if (offsetType === "vh") {
      values.offsetX.to = floor(random(-1, 2))
      values.offsetY.to = floor(random(-1, 2))
   }

   if (random() >= 0.8) {
      values.stretchX.to = floor(random(0, values.size.to*1.5))
   }
   if (random() >= 0.8) {
      values.stretchY.to = floor(random(0, values.size.to*1.5))
   }

   if (random() >= 0.5) {
      values.gradient.to = floor(random(2,9))
   }

   values.colorDark.to = color('hsl('+floor(random(0,360))+', 100%, 06%)')
   values.colorLight.to = color('hsl('+floor(random(0,360))+', 100%, 90%)')
   changeValuesAndURL()
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
   function lerpValues(slider, mode) {
      if (slider.to === undefined) {
         return slider.from
      }
      if (mode === "color") {
         return lerpColor(slider.from, slider.to, slider.lerp/lerpLength)
      }
      return map(slider.lerp,0,lerpLength,slider.from, slider.to)
   }
   typeSize = lerpValues(values.size)
   typeRings = lerpValues(values.rings)
   typeSpacing = lerpValues(values.spacing)
   typeOffsetX = lerpValues(values.offsetX)
   typeOffsetY = lerpValues(values.offsetY)
   typeStretchX = lerpValues(values.stretchX)
   typeStretchY = lerpValues(values.stretchY)
   typeWeight = lerpValues(values.weight)
   typeGradient = lerpValues(values.gradient)
   typeAscenders = lerpValues(values.ascenders)
   themeDark = lerpValues(values.colorDark, "color")
   themeLight = lerpValues(values.colorLight, "color")

   const lightColor = (printMode || debugGridMode) ? color("white") : themeLight
   const darkColor = (printMode || debugGridMode) ? color("black") : themeDark

   bgColor = lightColor
   lineColor = darkColor

   if (darkMode) {
      bgColor = darkColor
      lineColor = lightColor
   }

   background(bgColor)
   if (webglMode) {
      orbitControl()
      ambientLight(60, 60, 60);
      pointLight(255, 255, 255, 0, 0, 100);
   } 
   strokeWeight(0.3*strokeScaleFactor)

   drawElements()

   //first draw only
   if (svgMode && initialDraw) {
      // resize canvas to fit text if in noMenu mode
      if (noMenu) {
         const hMargin = 1
         const vMargin = 1
         const vGap = (typeSpacingY !== undefined) ? typeSpacingY : 0 
         const newWidth = Math.max(...totalWidth) + hMargin*2
         const newHeight = (currentLine+1) * Math.max(...totalHeight) + (currentLine)*vGap + vMargin
         resizeCanvas(newWidth*appScale, newHeight*appScale)
      }
      initialDraw = false
      loop()
   } else if (svgMode) {
      noLoop()
   }
}


function drawElements() {
   push()
   if (webglMode) translate(-width/2, -height/2)
   scale(appScale)
   if (noMenu) translate(1,1)
   else translate(6, 6)

   if (!noMenu && !webglMode) {
      textSize(2)
      noStroke()
      fill(lineColor)
      textFont("IBM Plex Mono")
   
      const col1 = 0
      const col2 = 5
      const col25 = 3
      const col3 = 29
      const col4 = 33
      const col5 = 60
   
      push()
      for (let i = 0; i <= currentLine; i++) {
         if (i === currentLine) {
            text(linesArray[i], col5, 0)
         }
         translate(0,2)
      }
      pop()
   
      push()
      const sliderSpacing = 2
      if (sliderMode === 0) {
         translate(0,0*sliderSpacing)
         text("size", col2, 0)
         textAlign(RIGHT)
         text(Math.round(typeSize), col25, 0)
      }
      else if (sliderMode === 1) {
         translate(0,1*sliderSpacing)
         text("ring count", col2, 0)
         textAlign(RIGHT)
         text(Math.round(typeRings), col25, 0)
      }
      else if (sliderMode === 2) {
         translate(0,2*sliderSpacing)
         text("spacing", col2, 0)
         textAlign(RIGHT)
         text(Math.round(typeSpacing), col25, 0)
      }
      else if (sliderMode === 3) {
         translate(0,3*sliderSpacing)
         text("h-offset", col2, 0)
         textAlign(RIGHT)
         text(Math.round(typeOffsetX), col25, 0)
      }
      else if (sliderMode === 4) {
         translate(0,4*sliderSpacing)
         text("v-offset", col2, 0)
         textAlign(RIGHT)
         text(Math.round(typeOffsetY), col25, 0)
      }
      else if (sliderMode === 5) {
         translate(0,5*sliderSpacing)
         text("h-stretch", col2, 0)
         textAlign(RIGHT)
         text(Math.round(typeStretchX), col25, 0)
      }
      else if (sliderMode === 6) {
         translate(0,6*sliderSpacing)
         text("v-stretch", col2, 0)
         textAlign(RIGHT)
         text(Math.round(typeStretchY), col25, 0)
      }
      else if (sliderMode === 7) {
         translate(0,7*sliderSpacing)
         text("weight", col2, 0)
         textAlign(RIGHT)
         text(Math.round(typeWeight), col25, 0)
      }
      else if (sliderMode === 8) {
         translate(0,8*sliderSpacing)
         text("gradient", col2, 0)
         textAlign(RIGHT)
         text(Math.round(typeGradient), col25, 0)
      }
      pop()
   
      lineColor.setAlpha(100)
      fill(lineColor)
   
      push()
      text("size         " ,col2, 0); translate (0,2.0)
      text("ring count" ,col2, 0); translate (0,2.0)
      text("spacing    " ,col2, 0); translate (0,2.0)
      text("h-offset   " ,col2, 0); translate (0,2.0)
      text("v-offset   " ,col2, 0); translate (0,2.0)
      text("h-stretch " ,col2, 0); translate (0,2.0)
      text("v-stretch " ,col2, 0); translate (0,2.0)
      text("weight      " ,col2, 0); translate (0,2.0)
      text("gradient   " ,col2, 0); translate (0,2.0)
      pop()
   
      push(); textAlign(RIGHT)
      text(addLeadingChar(Math.round(typeSize),3)      , col25, 0); translate(0,2.0)
      text(addLeadingChar(Math.round(typeRings),3)    , col25, 0); translate(0,2.0)
      text(addLeadingChar(Math.round(typeSpacing),3) , col25, 0); translate(0,2.0)
      text(addLeadingChar(Math.round(typeOffsetX),3) , col25, 0); translate(0,2.0)
      text(addLeadingChar(Math.round(typeOffsetY),3) , col25, 0); translate(0,2.0)
      text(addLeadingChar(Math.round(typeStretchX),3), col25, 0); translate(0,2.0)
      text(addLeadingChar(Math.round(typeStretchY),3), col25, 0); translate(0,2.0)
      text(addLeadingChar(Math.round(typeWeight),3)   , col25, 0); translate(0,2.0)
      text(addLeadingChar(Math.round(typeGradient),3), col25, 0); translate(0,2.0)
      pop()
   
      push()
      text("1:" , col3, 0); translate(0,2)
      text("2:" , col3, 0); translate(0,2)
      text("3:" , col3, 0); translate(0,2)
      text("4:" , col3, 0); translate(0,2)
      text("5:" , col3, 0); translate(0,2)
      text("6:" , col3, 0); translate(0,2)
      text("7:" , col3, 0); translate(0,2)
      text("8:" , col3, 0); translate(0,2)
      text("9:" , col3, 0); translate(0,2)
      pop()
   
      push()
      text("randomize    ", col4, 0); translate(0,2)
      text("invert color ", col4, 0); translate(0,2)
      text("monochromatic", col4, 0); translate(0,2)
      text("xray mode    ", col4, 0); translate(0,2)
      text("wave mode (test)", col4, 0); translate(0,2)
      text("overlaps     ", col4, 0); translate(0,2)
      text("alignment    ", col4, 0); translate(0,2)
      text("clear style  ", col4, 0); translate(0,2)
      text("clear text   ", col4, 0); translate(0,2)
      pop()
   
      push()
      for (let i = 0; i < linesArray.length; i++) {
         const line = (linesArray[i].length>0) ? linesArray[i] : ".".repeat(9)
         text((currentLine === i) ? linesArray[i]+"_":line, col5, 0)
         translate(0,2)
      }
   
      translate(0,2)
      text("abcdefghijklmnopqrstuvwxyz-.,!?", col5, 0)
      translate(0,2.5)
      text("SPACE, BACKSPACE, RETURN", col5, 0)
      pop()

      translate(0,22)
   }
   translate(0, max(typeSize*typeAscenders, 1))

   strokeWeight((typeWeight/10)*strokeScaleFactor)
   lineColor.setAlpha(255)

   startOffsetY = 0

   if (typeOffsetY < 0) {
      startOffsetY -= typeOffsetY
   }

   
   push()
   translate(0,0.5*typeSize)
   if (alignCenter && currentLine === 0) {
      translate(0,16)
   }

   for (let i = 0; i <= currentLine; i++) {
      drawStyle(i)
   }
   pop()
   pop()
}

function getInnerSize (size, rings) {
   let innerSize = min(size - (rings-1) * 2, size)

   if (typeSize % 2 === 0) {
      return max(2, innerSize)
   }
   return max(1, innerSize)
}

function isin (char, sets) {

   let found = false
   sets.forEach((set) => {
      if (found === false) {
         if (set === "ul") {
            //up left edge
            found = "bhikltuüvwynm".includes(char)
         }
         else if (set === "dl") {
            //down left edge
            found = "hikmnprfv".includes(char)
         }
         else if (set === "ur") {
            //up right edge
            found = "dijuüvwyhnmg".includes(char)
         }
         else if (set === "dr") {
            //down right edge
            found = "aähimnqye".includes(char)
         }
         else if (set === "gap") {
            //separating regular letters
            found = "., :;-_!?".includes(char)
         }
      }
   });
   return found
}


function drawStyle (lineNum) {

   // don't draw anything for lines of text that have not been written yet
   if (currentLine < lineNum) {
      return
   }

   // current line text
   let lineText = linesArray[lineNum]

   // if line empty, but visible, put row of darker o's there
   const oldLineColor = lineColor
   if (lineText.length === 0 && !printMode) {
      lineText = "o".repeat(9)
      if (!debugGridMode) {
         lineColor = lerpColor(lineColor, bgColor, 0.8)
      }
   }

   // variables that grow until the end of the line
   let charsWidth = 0 //total width
   let verticalOffset = 0 // which side of letters is offset up/down

   // fadeout in wavemode
   function waveInner (i, inner, size) {
      if (!waveMode) {
         return inner
      }
      return min(size, inner + i*2)
   }

   // go through the letters once to get total spacing
   totalWidth[lineNum] = Math.abs(typeOffsetX)
   for (let i = 0; i < lineText.length; i++) {
      // get characters
      const char = lineText[i]
      const nextchar = (lineText[i+1] !== undefined) ? lineText[i+1] : " "
      const prevchar = (lineText[i-1] !== undefined) ? lineText[i-1] : " "
      // WIP not writing this twice lol
      let letterInner = getInnerSize(typeSize, typeRings) //+ [2,4,3,-2,0,2,4,5][i % 8]
      let letterOuter = typeSize //+ [2,4,3,-2,0,2,4,5][i % 8]
      letterInner = waveInner(i, letterInner, letterOuter)

      const extendOffset = ((letterOuter % 2 == 0) ? 0 : 0.5) + (typeStretchX-(typeStretchX%2))*0.5
      totalWidth[lineNum] += addSpacingBetween(prevchar, char, nextchar, typeSpacing, letterInner, letterOuter, extendOffset).width
   }

   //translate to center if toggled
   push()
   if (alignCenter) {
      translate(-6+(width/appScale-totalWidth[lineNum])/2,0)
   }
   if (typeOffsetX < 0) {
      translate(-typeOffsetX,0)
   }

   // grid
   if (gridType !== "") {
      drawGrid(gridType)
   }

   // go through all the letters, but this time to actually draw them

   for (let i = 0; i < lineText.length; i++) {
      // get characters
      const char = lineText[i]
      const nextchar = (lineText[i+1] !== undefined) ? lineText[i+1] : " "
      const prevchar = (lineText[i-1] !== undefined) ? lineText[i-1] : " "

      // ring sizes for this character
      let letterInner = getInnerSize(typeSize, typeRings) //+ [2,4,3,-2,0,2,4,5][i % 8]
      let letterOuter = typeSize //+ [2,4,3,-2,0,2,4,5][i % 8]

      // change depending on the character index (i) if wave mode is on
      letterInner = waveInner(i, letterInner, letterOuter)

      // array with all ring sizes for that letter
      let ringSizes = []
      for (let b = letterOuter; b >= letterInner-2; b-=2) {
         // smallest ring is animated
         let size = (b < letterInner) ? letterInner : b
         ringSizes.push(size)
      }

      // convenient values
      // per letter
      const ascenders = max(Math.floor(letterOuter*typeAscenders)+((letterOuter%2===0)?0:0), 1)
      const descenders = max(Math.floor(letterOuter*typeAscenders)+((letterOuter%2===0)?0:0), 1)
      const weight = (letterOuter-letterInner)*0.5
      const oneoffset = (letterOuter>3 && letterInner>2) ? 1 : 0
      const topOffset = (letterOuter < 0) ? -typeOffsetX : 0
      const wideOffset = 0.5*letterOuter + 0.5*letterInner
      const extendOffset = ((letterOuter % 2 == 0) ? 0 : 0.5) + (typeStretchX-(typeStretchX%2))*0.5

      // determine spacing to the right of character based on both
      const spacingResult = addSpacingBetween(prevchar, char, nextchar, typeSpacing, letterInner, letterOuter, extendOffset)
      const nextSpacing = spacingResult.width


      function drawCornerFill (shape, arcQ, offQ, tx, ty, noStretchX, noStretchY) {
         if (weight === 0 || !drawFills) {
            return
         }

         push()
         translate(tx, ty)
         noFill()
         stroke((debugGridMode)? color("#52A"): bgColor)
         strokeCap(SQUARE)
         strokeWeight(weight*strokeScaleFactor)

         const smallest = letterInner
         const size = smallest + weight
         //if (frameCount<2) {
         //   print("drawCornerFill",char,smallest,letterOuter)
         //}

         // base position
         let xpos = topOffset + charsWidth + (letterOuter/2)
         let ypos = startOffsetY
         // offset based on quarter and prev vertical offset
         let offx = (offQ === 3 || offQ === 4) ? 1:0
         let offy = (offQ === 2 || offQ === 3) ? 1:0
         xpos += (offx > 0) ? typeOffsetX : 0
         ypos += (verticalOffset+offy) % 2==0 ? typeOffsetY : 0
         xpos += (offy > 0) ? typeStretchX : 0
         ypos += (offx > 0) ? typeStretchY : 0

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

         if (typeStretchX > 0 && !noStretchX) {
            stroke((debugGridMode)? color("#831"): bgColor)
            const toSideX = (arcQ === 1 || arcQ === 2) ? -1 : 1
            let stretchXPos = xpos
            let stretchYPos = ypos + size*toSideX*0.5
            const dirX = (arcQ === 1 || arcQ === 4) ? 1 : -1

            // the offset can be in between the regular lines vertically if it would staircase nicely
            let offsetShift = 0
            let stairDir = (verticalOffset+offy) % 2===0 ? -1 : 1
            if (Math.abs(typeOffsetY) >2 && Math.abs(typeOffsetY) <4) {
               offsetShift = (typeOffsetY/3)*stairDir
            } else if (Math.abs(typeOffsetY) >1 && Math.abs(typeOffsetY)<3) {
               offsetShift = (typeOffsetY/2)*stairDir
            }

           lineType(stretchXPos, stretchYPos+offsetShift,
               stretchXPos + dirX*0.5*typeStretchX, stretchYPos+offsetShift)
         }
         if (typeStretchY > 0 && !noStretchY) {
            stroke((debugGridMode)? color("#17B"): bgColor)
            const toSideY = (arcQ === 1 || arcQ === 4) ? -1 : 1
            let stretchXPos = xpos + size*toSideY*0.5
            let stretchYPos = ypos
            const dirY = (arcQ === 1 || arcQ === 2) ? 1 : -1

            // the offset can be in between the regular lines horizontally if it would staircase nicely
            let offsetShift = 0
            if (Math.abs(typeOffsetX) >2 && Math.abs(typeOffsetX) <4) {
               offsetShift = typeOffsetX/3*dirY
            } else if (Math.abs(typeOffsetX) >1 && Math.abs(typeOffsetX)<3) {
               offsetShift = typeOffsetX/2*dirY
            }

           lineType(stretchXPos+offsetShift, stretchYPos,
               stretchXPos+offsetShift, stretchYPos + dirY*0.5*typeStretchY)
         }
         pop()
      }

      function drawCorner (shape, strokeSizes, arcQ, offQ, tx, ty, cutMode, cutSide, flipped, noSmol, noStretchX, noStretchY) {
         //draw fills
         // only if corner can be drawn at all
         const smallest = strokeSizes[strokeSizes.length-1]
         const biggest = strokeSizes[0]
         //drawCornerFill(shape,arcQ,offQ,tx,ty,noSmol,noStretchX,noStretchY)
         if (!webglMode) {
            if (cutMode === "" || cutMode === "branch" || !((smallest <= 2 || letterOuter+2 <= 2)&&noSmol)) {
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

         strokeWeight((typeWeight/10)*strokeScaleFactor)
         if (debugGridMode) {
            strokeWeight(0.2*strokeScaleFactor)
         }
         innerColor = (debugGridMode)? color("orange"): lerpColor(lineColor,bgColor,typeGradient/10)
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
               if (typeStretchX > 0 && !noStretchX) {
                  // check if not cut off
                  if (cutMode === "" || cutMode === "branch" || (cutMode!== "" && !cutX)) {
                     const toSideX = (arcQ === 1 || arcQ === 2) ? -1 : 1
                     let stretchXPos = xpos
                     let stretchYPos = ypos + size*toSideX*0.5
                     const dirX = (arcQ === 1 || arcQ === 4) ? 1 : -1

                     // the offset can be in between the regular lines vertically if it would staircase nicely
                     let offsetShift = 0
                     let stairDir = (verticalOffset+offy) % 2===0 ? -1 : 1
                     if (Math.abs(typeOffsetY) >2 && Math.abs(typeOffsetY) <4) {
                        offsetShift = (typeOffsetY/3)*stairDir
                     } else if (Math.abs(typeOffsetY) >1 && Math.abs(typeOffsetY)<3) {
                        offsetShift = (typeOffsetY/2)*stairDir
                     }

                    lineType(stretchXPos, stretchYPos+offsetShift,
                        stretchXPos + dirX*0.5*typeStretchX, stretchYPos+offsetShift)
                  }
               }
               if (typeStretchY > 0 && !noStretchY) {
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
                     if (Math.abs(typeOffsetX) >2 && Math.abs(typeOffsetX) <4) {
                        offsetShift = typeOffsetX/3*dirY
                     } else if (Math.abs(typeOffsetX) >1 && Math.abs(typeOffsetX)<3) {
                        offsetShift = typeOffsetX/2*dirY
                     }

                    lineType(stretchXPos+offsetShift, stretchYPos,
                        stretchXPos+offsetShift, stretchYPos + dirY*0.5*typeStretchY)
                  }
               }
               const extendamount = ((letterOuter % 2 == 0) ? 0 : 0.5) + (typeStretchX-(typeStretchX%2))*0.5
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

      function drawLine (strokeSizes, arcQ, offQ, tx, ty, axis, extension, startFrom, flipped, maxWeight) {
         //first, draw the fill
         if (!webglMode) {
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

         strokeWeight((typeWeight/10)*strokeScaleFactor)
         if (debugGridMode) {
            strokeWeight(0.2*strokeScaleFactor)
         }
         innerColor = (debugGridMode)? color("lime"): lerpColor(lineColor,bgColor,typeGradient/10)
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
                  if (typeStretchY !== 0 && innerPosV === 0) {
                     //stretch
                     // the offset can be in between the regular lines horizontally if it would staircase nicely
                     let offsetShift = 0
                     if (Math.abs(typeOffsetX) >2 && Math.abs(typeOffsetX) <4) {
                        offsetShift = typeOffsetX/3*dirY
                     } else if (Math.abs(typeOffsetX) >1 && Math.abs(typeOffsetX)<3) {
                        offsetShift = typeOffsetX/2*dirY
                     }
                    lineType(x1-offsetShift, y1-typeStretchY*0.5*dirY, x2-offsetShift, y1)
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
                  if (typeStretchX !== 0 && innerPosH === 0) {
                     //stretch
                     // the offset can be in between the regular lines vertically if it would staircase nicely
                     let offsetShift = 0
                     let stairDir = (verticalOffset+offy) % 2===0 ? -1 : 1
                     if (Math.abs(typeOffsetY) >2 && Math.abs(typeOffsetY) <4) {
                        offsetShift = (typeOffsetY/3)*stairDir
                     } else if (Math.abs(typeOffsetY) >1 && Math.abs(typeOffsetY)<3) {
                        offsetShift = (typeOffsetY/2)*stairDir
                     }
                    lineType(x1-typeStretchX*0.5*dirX, y1+offsetShift, x1, y2+offsetShift)
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
         stroke((debugGridMode)? color("#462"): bgColor)
         strokeWeight(weight*strokeScaleFactor)
         strokeCap(SQUARE)

         const size = strokeSizes[0]
         const smallest = strokeSizes[strokeSizes.length-1]
         const biggest = strokeSizes[0]

         // to make the rectangles a little longer at the end
         let strokeWeightReference = (typeWeight/10)
         if (debugGridMode) {
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
            if (typeStretchY !== 0 && innerPosV === 0) {
               //stretch
               // the offset can be in between the regular lines horizontally if it would staircase nicely
               let offsetShift = 0
               if (Math.abs(typeOffsetX) >2 && Math.abs(typeOffsetX) <4) {
                  offsetShift = typeOffsetX/3*dirY
               } else if (Math.abs(typeOffsetX) >1 && Math.abs(typeOffsetX)<3) {
                  offsetShift = typeOffsetX/2*dirY
               }

               stroke((debugGridMode)? color("#367"): bgColor)
              lineType(x1-offsetShift, y1-typeStretchY*0.5*dirY, x2-offsetShift, y1)
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
            if (typeStretchX !== 0 && innerPosH === 0) {
               //stretch

               // the offset can be in between the regular lines vertically if it would staircase nicely
               let offsetShift = 0
               let stairDir = (verticalOffset+offy) % 2===0 ? -1 : 1
               if (Math.abs(typeOffsetY) >2 && Math.abs(typeOffsetY) <4) {
                  offsetShift = (typeOffsetY/3)*stairDir
               } else if (Math.abs(typeOffsetY) >1 && Math.abs(typeOffsetY)<3) {
                  offsetShift = (typeOffsetY/2)*stairDir
               }

               stroke((debugGridMode)? color("#891"): bgColor)
              lineType(x1-typeStretchX*0.5*dirX, y1+offsetShift, x1, y2+offsetShift)
            }
         }
         pop()
      }

      function strokeStyleForRing(size, smallest, biggest, innerColor, outerColor, flipped, arcQ, offQ) {
         //strokeweight
         if (strokeGradient && !debugGridMode) {
            strokeWeight((typeWeight/10)*strokeScaleFactor*map(size,smallest,biggest,0.3,1))
            if ((arcQ !== offQ) !== (flipped === "flipped")) {
               strokeWeight((typeWeight/10)*strokeScaleFactor*map(size,smallest,biggest,1,10.3))
            }
         }

         //color
         let innerEdgeReference = smallest
         //1-2 rings
         if ((biggest-smallest) <1) {
            innerEdgeReference = biggest-2
         }
         stroke(lerpColor(innerColor, outerColor, map(size,innerEdgeReference,biggest,0,1)))
         if ((arcQ !== offQ) !== (flipped === "flipped")) {
            stroke(lerpColor(innerColor, outerColor, map(size,biggest,innerEdgeReference,0,1)))
         }
      }

      function getQuarterPos(offx, offy, biggest) {
         // base position
         let xpos = topOffset + charsWidth + (biggest/2)
         let ypos = startOffsetY
         // offset based on quarter and prev vertical offset
         xpos += (offx > 0) ? typeOffsetX : 0
         ypos += (verticalOffset+offy) % 2==0 ? typeOffsetY : 0
         xpos += (offy > 0) ? typeStretchX : 0
         ypos += (offx > 0) ? typeStretchY : 0
         return {x: xpos, y:ypos}
      }

      // DESCRIBING THE FILLED BACKGROUND SHAPES AND LINES OF EACH LETTER

      drawLetter()

      function drawLetter () {
         
         // draw start of certain next letters early so that the current letter can overlap it
         //"ktlcrfs"

         const isFlipped = ("cktfe".includes(char)) ? "" : "flipped"
         const nextOffset = addSpacingBetween(char, nextchar, "", typeSpacing, letterInner, letterOuter, extendOffset).offset
         switch(nextchar) {
            case "s":
               if (!altS) {
                  verticalOffset += nextOffset
                  if (char === "s") {
                     drawCorner("round",ringSizes, 4, 4, nextSpacing, 0, "roundcut", "end", isFlipped)
                  } else if (char === "r") {
                     drawCorner("round",ringSizes, 4, 4, nextSpacing, 0, "linecut", "end", isFlipped)
                  } else if (!isin(char,["gap", "dr"]) && !"fk".includes(char)) {
                     drawCorner("round",ringSizes, 4, 4, nextSpacing, 0, "roundcut", "end", isFlipped)
                  }
                  verticalOffset -= nextOffset
               } else {
                  //alt S
                  verticalOffset += nextOffset
                  if (isin(char,["dr"])) {
                     drawCorner("round",ringSizes, 4, 4, nextSpacing, 0, "linecut", "end")
                  } else if (char !== "t") {
                     drawCorner("round",ringSizes, 4, 4, nextSpacing, 0, "roundcut", "end")
                  }
                  verticalOffset -= nextOffset
               }
               break;
            case "x":
               push()
               if (isin(char,["gap","ur"]) && isin(char,["gap","dr"])) {
                  translate(-weight-1,0)
               }
               // top connection
               verticalOffset += nextOffset
               if (!isin(char,["gap"]) && char !== "x") {
                  if (isin(char,["ur"]) || "l".includes(char)) {
                     drawCorner("round",ringSizes, 1, 1, nextSpacing, 0, "linecut", "start")
                  } else if (char !== "t"){
                     drawCorner("round",ringSizes, 1, 1, nextSpacing, 0, "roundcut", "start")
                  }
               }
               // bottom connection
               if (!"xef".includes(char) && !isin(char,["gap"])) {
                  if (char === "s" && !altS) {
                     drawCorner("round",ringSizes, 4, 4, nextSpacing, 0, "roundcut", "end", isFlipped)
                  } else if (char === "r" || isin(char,["dr"])) {
                     drawCorner("round",ringSizes, 4, 4, nextSpacing, 0, "linecut", "end", isFlipped)
                  } else {
                     drawCorner("round",ringSizes, 4, 4, nextSpacing, 0, "roundcut", "end", isFlipped)
                  }
               }
               pop()
               verticalOffset -= nextOffset
               break;
            case "z":
               verticalOffset += nextOffset
               if (isin(char,["ur"])) {
                  drawCorner("round",ringSizes, 1, 2, nextSpacing, 0, "linecut", "start", "flipped")
               } else if (!isin(char,["gap"])) {
                  drawCorner("round",ringSizes, 1, 2, nextSpacing, 0, "roundcut", "start", "flipped")
               } else {
                  //can't be reached, do below instead
                  //drawCorner("round",ringSizes, 1, 1, nextSpacing, 0)
               }
               verticalOffset -= nextOffset
               break;
            case "j":
               verticalOffset += nextOffset
               if (isin(char,["dr"]) || "r".includes(char)) {
                  drawCorner("round",ringSizes, 4, 4, nextSpacing, 0, "linecut", "end")
               } else if (!"tk".includes(char)) {
                  drawCorner("round",ringSizes, 4, 4, nextSpacing, 0, "roundcut", "end")
               }
               if (!isin(char,["tr", "gap"]) && !"ckrsx".includes(char)) {
                  drawLine(ringSizes, 1, 1, nextSpacing, 0, "h", -weight-1)
               }
               verticalOffset -= nextOffset
               break;
         }

         // draw chars
         switch(char) {
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
               if (char === "d") {
                  drawLine(ringSizes, 2, 2, 0, 0, "v", ascenders)
               }
               else if (char === "b") {
                  drawLine(ringSizes, 1, 1, 0, 0, "v", ascenders)
               }
               else if (char === "q") {
                  drawLine(ringSizes, 3, 3, 0, 0, "v", descenders)
               } else if (char === "p") {
                  drawLine(ringSizes, 4, 4, 0, 0, "v", descenders)
               } else if (char === "ö") {
                  drawLine(ringSizes, 1, 1, 0, 0, "v", ascenders, letterOuter*0.5 + 1)
                  drawLine(ringSizes, 2, 2, 0, 0, "v", ascenders, letterOuter*0.5 + 1)
               }
               break;
            case "g":
               drawCorner("round",ringSizes, 1, 1, 0, 0, "", "")
               drawCorner("round",ringSizes, 2, 2, 0, 0, "", "")

               // if only one ring, move line down so there is a gap
               const extragap = (letterOuter > letterInner) ? 0:1

               drawLine(ringSizes, 2, 3, 0, letterOuter + extragap, "h", 0, undefined, false, descenders)
               drawLine(ringSizes, 1, 4, 0, letterOuter + extragap, "h", 0, undefined, false, descenders)

               drawCorner("round",ringSizes, 3, 3, 0, 0, "", "")
               drawCorner("round",ringSizes, 4, 4, 0, 0, "", "")

               drawLine(ringSizes, 2, 2, 0, 0, "h", 0)
               //drawLine(ringSizes, 3, 3, 0, 0, "v", 0)
               break;
            case "c":
               drawCorner("round",ringSizes, 1, 1, 0, 0, "", "")
               if (isin(nextchar, ["ul", "gap"])) {
                  drawCorner("round",ringSizes, 2, 2, 0, 0, "linecut", "end", undefined, true)
               } else {
                  drawCorner("round",ringSizes, 2, 2, 0, 0, "roundcut", "end", undefined, false)
               }
               if (isin(nextchar, ["dl", "gap"])) {
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
               if ("s".includes(nextchar)) {
                  drawLine(ringSizes, 3, 3, 0, 0, "h", 1)
               } else if (isin(nextchar,["gap"]) || "gz".includes(nextchar)) {
                  drawLine(ringSizes, 3, 3, 0, 0, "h", 0)
               } else if (!isin(nextchar,["dl", "gap"]) && letterInner <= 2) {
                  drawLine(ringSizes, 3, 3, 0, 0, "h", letterOuter*0.5 + typeStretchX)
               } else if ("x".includes(nextchar)) {
                  drawLine(ringSizes, 3, 3, 0, 0, "h", letterOuter*0.5 + typeStretchX-weight)
               } else if (!isin(nextchar,["dl"])) {
                  drawLine(ringSizes, 3, 3, 0, 0, "h", -oneoffset+max(typeSpacing, -weight))
               } else if (typeSpacing < 0) {
                  drawLine(ringSizes, 3, 3, 0, 0, "h", -oneoffset+max(typeSpacing, -weight))
               } else if (typeSpacing > 0){
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

               if (char === "ä") {
                  drawLine(ringSizes, 1, 1, 0, 0, "v", ascenders, letterOuter*0.5 + 1)
                  drawLine(ringSizes, 2, 2, 0, 0, "v", ascenders, letterOuter*0.5 + 1)
               }
               break;
            case "n":
               drawCorner("square",ringSizes, 1, 1, 0, 0, "", "")
               drawCorner("square",ringSizes, 2, 2, 0, 0, "", "")
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
                  drawCorner("square",ringSizes, 2, 1, wideOffset + typeStretchX*2, 0, "", "", "flipped")
                  drawCorner("square",ringSizes, 1, 2, wideOffset, 0, "branch", "start", "flipped")
                  drawLine(ringSizes, 4, 3, wideOffset, 0, "v", 0, undefined, "flipped")
                  drawLine(ringSizes, 3, 4, wideOffset + typeStretchX*2, 0, "v", 0, undefined, "flipped")
               } else {
                  drawCorner("diagonal",ringSizes, 1, 1, 0, 0, "", "")
                  drawCorner("diagonal",ringSizes, 2, 2, 0, 0, "", "")
                  drawLine(ringSizes, 3, 3, 0, 0, "v", 0)
                  drawLine(ringSizes, 4, 4, 0, 0, "v", 0)
                  // SECOND LAYER
                  drawCorner("diagonal",ringSizes, 2, 1, wideOffset + typeStretchX*2, 0, "", "", "flipped")
                  drawCorner("diagonal",ringSizes, 1, 2, wideOffset, 0, "", "", "flipped")
                  drawLine(ringSizes, 4, 3, wideOffset, 0, "v", 0, undefined, "flipped")
                  drawLine(ringSizes, 3, 4, wideOffset + typeStretchX*2, 0, "v", 0, undefined, "flipped")
               }
              
               break;
            case "s":
               if (!altS) {
                  push()
                  const isFlipped = ("cktfe".includes(prevchar)) ? "" : "flipped"
                  //start further left if not connecting left
                  if (isin(prevchar,["gap", "dr"])) {
                     translate(-letterOuter*0.5 + extendOffset -typeStretchX,0)
                     drawCorner("round",ringSizes, 3, 3, 0, 0, "extend", "end", isFlipped)
                  } else {
                     drawCorner("round",ringSizes, 3, 3, 0, 0, "", "", isFlipped)
                  }
                  if (!isin(nextchar,["gap", "ul"]) && !"zxj".includes(nextchar) || nextchar === "s") {
                     drawCorner("round",ringSizes, 1, 2, wideOffset, 0, "", "", isFlipped)
                     drawCorner("round",ringSizes, 2, 1, wideOffset + typeStretchX*2, 0, "roundcut", "end", isFlipped)
                  } else {
                     drawCorner("round",ringSizes, 1, 2, wideOffset, 0, "extend", "end", isFlipped)
                  }
                  pop()
               } else {
                  // alternative cursive s
                  drawCorner("round",ringSizes, 2, 2, 0, 0, "", "")
                  drawCorner("round",ringSizes, 3, 3, 0, 0, "", "")
                  if (isin(prevchar,["gap"])) {
                     drawCorner("round",ringSizes, 4, 4, 0, 0, "", "")
                  }
               }
               break;
            case "x":
               push()
               if (isin(prevchar,["gap","ur"]) && isin(prevchar,["gap","dr"])) {
                  translate(-weight-1,0)
               }

               if (isin(prevchar, ["gap"])) {
                  drawCorner("round",ringSizes, 1, 1, 0, 0, "linecut", "start", undefined, true)
               }
               drawCorner("round",ringSizes, 2, 2, 0, 0, "", "")
               drawCorner("round",ringSizes, 4, 3, wideOffset, 0, "", "")

               if (nextchar !== "x") {
                  if (!isin(nextchar,["dl", "gap"])) {
                     drawCorner("round",ringSizes, 3, 4, wideOffset + typeStretchX*2, 0, "roundcut", "start")
                  } else {
                     drawCorner("round",ringSizes, 3, 4, wideOffset + typeStretchX*2, 0, "linecut", "start", undefined, true)
                  }
               }

               // SECOND LAYER
               drawCorner("diagonal",ringSizes, 1, 2, wideOffset, 0, "", "", "flipped")
               if (nextchar !== "x") {
                  if (!isin(nextchar,["gap", "ul"])) {
                     drawCorner("round",ringSizes, 2, 1, wideOffset+ typeStretchX*2, 0, "roundcut", "end", "flipped")
                  } else {
                     drawCorner("round",ringSizes, 2, 1, wideOffset+ typeStretchX*2, 0, "linecut", "end", "flipped", true)
                  }
               }
               drawCorner("diagonal",ringSizes, 3, 3, 0, 0, "", "", "flipped")
               if (isin(prevchar,["gap"])) {
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
               if (char === "y") {
                  drawLine(ringSizes, 3, 3, 0, 0, "v", descenders)
               } else if (char === "ü") {
                  drawLine(ringSizes, 1, 1, 0, 0, "v", ascenders, letterOuter*0.5 + 1)
                  drawLine(ringSizes, 2, 2, 0, 0, "v", ascenders, letterOuter*0.5 + 1)
               }
               break;
            case "w":
               drawLine(ringSizes, 1, 1, 0, 0, "v", 0)
               drawLine(ringSizes, 2, 2, 0, 0, "v", 0)
               drawCorner("diagonal",ringSizes, 3, 3, 0, 0, "", "")
               drawCorner("diagonal",ringSizes, 4, 4, 0, 0, "", "")

               drawLine(ringSizes, 2, 1, wideOffset + typeStretchX*2, 0, "v", 0, undefined, "flipped")
               drawLine(ringSizes, 1, 2, wideOffset, 0, "v", 0, undefined, "flipped")
               drawCorner("diagonal",ringSizes, 4, 3, wideOffset, 0, "", "", "flipped")
               drawCorner("diagonal",ringSizes, 3, 4, wideOffset + typeStretchX*2, 0, "", "", "flipped")
               break;
            case "r":
               drawCorner("round",ringSizes, 1, 1, 0, 0, "", "")
               if (isin(nextchar,["ul", "gap"])) {
                  drawCorner("round",ringSizes, 2, 2, 0, 0, "linecut", "end", undefined, true)
               } else {
                  drawCorner("round",ringSizes, 2, 2, 0, 0, "roundcut", "end")
               }
               drawLine(ringSizes, 4, 4, 0, 0, "v", 0)
               break;
            case "l":
            case "t":

               if (char === "t") {
                  drawLine(ringSizes, 1, 1, 0, 0, "v", ascenders)
                  drawCorner("square",ringSizes, 1, 1, 0, 0, "branch", "end")
                  if (!"zx".includes(nextchar)) {
                     if (isin(nextchar,["ul", "gap"]) || letterInner > 2) {
                        drawLine(ringSizes, 2, 2, 0, 0, "h", -weight-1 + ((letterInner<2) ? 1 : 0))
                     } else {
                        drawLine(ringSizes, 2, 2, 0, 0, "h", letterOuter*0.5-weight)
                     }
                  }
               } else {
                  drawLine(ringSizes, 1, 1, 0, 0, "v", ascenders)
               }

               drawCorner("round",ringSizes, 4, 4, 0, 0, "", "")
               if (isin(nextchar,["dl", "gap"])) {
                  drawCorner("round",ringSizes, 3, 3, 0, 0, "linecut", "start", undefined, true)
               } else {
                  drawCorner("round",ringSizes, 3, 3, 0, 0, "roundcut", "start", undefined, false)
               }
               break;
            case "f":
               drawCorner("round",ringSizes, 1, 1, 0, 0, "", "")
               if (isin(nextchar,["ul", "gap"])) {
                  drawCorner("round",ringSizes, 2, 2, 0, 0, "linecut", "end", undefined, true)
               } else {
                  drawCorner("round",ringSizes, 2, 2, 0, 0, "roundcut", "end", undefined, false)
               }
               drawLine(ringSizes, 4, 4, 0, 0, "v", descenders)
               drawCorner("square", ringSizes, 4, 4, 0, 0, "branch", "start")

               // SECOND LAYER
               if (!"sx".includes(nextchar)) {
                  if (isin(nextchar,["dl", "gap"]) || letterInner > 2) {
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
               if (!"x".includes(nextchar)) {
                  drawLine(ringSizes, 2, 2, weight, 0, "h", -oneoffset-weight)
               }
               if (!"sx".includes(nextchar)) {
                  if (!(isin(nextchar,["dl", "gap"]))) {
                     drawCorner("round",ringSizes, 3, 3, weight, 0, "roundcut", "start")
                  } else {
                     drawLine(ringSizes, 3, 3, weight, 0, "h", -oneoffset-weight)
                  }
               }
               break;
            case "h":
               drawLine(ringSizes, 1, 1, 0, 0, "v", ascenders, 0)

               // SECOND LAYER
               drawCorner("square",ringSizes, 1, 1, 0, 0, "branch", "end")
               drawCorner("square",ringSizes, 2, 2, 0, 0, "", "")
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
               drawLine(ringSizes, 2, 2, 0, 0, "v", ascenders, letterOuter*0.5 + 1)
               drawCorner("square", ringSizes, 2, 2, 0, 0, "", "")
               drawCorner("round", ringSizes, 3, 3, 0, 0, "", "")
               if (isin(prevchar, ["gap"])) {
                  drawLine(ringSizes, 1, 1, 0, 0, "h", 0)
                  drawCorner("round", ringSizes, 4, 4, 0, 0, "", "")
               }
               break;
            case "z":
               push()
               //1st line oben
               if (isin(prevchar, ["gap"])) {
                  drawCorner("round", ringSizes, 1, 1, 0, 0, "", "")
               }

               drawLine(ringSizes, 2, 2, 0, 0, "h", 1)
               drawCorner("diagonal", ringSizes, 1, 2, letterOuter*0.5 + 1, 0, "", "", "flipped")

               translate(weight+1,0)

               if (isin(nextchar,["dl"])) {
                  drawCorner("round",ringSizes, 3, 4, 1, 0, "linecut", "start")
               } else if (!isin(nextchar,["gap"])) {
                  drawCorner("round",ringSizes, 3, 4, 1, 0, "roundcut", "start")
               } else {
                  drawCorner("round",ringSizes, 3, 4, 1, 0, "", "")
               }

               drawCorner("diagonal", ringSizes, 3, 3, -letterOuter*0.5, 0, "", "", "flipped")
               drawLine(ringSizes, 4, 3, 1, 0, "h", 1)
               pop()
               break;
            case "-":
               drawLine([letterOuter], 1, 1, 0, +letterOuter*0.5, "h", -1)
               drawLine([letterOuter], 2, 2, 0, +letterOuter*0.5, "h", -1)
               break;
            case "_":
               drawLine([letterOuter], 3, 3, 0, 0, "h", -1)
               drawLine([letterOuter], 4, 4, 0, 0, "h", -1)
               break;
         }
      }

      verticalOffset += spacingResult.offset
      charsWidth += nextSpacing
   }

   lineColor = oldLineColor

   const height = typeSize + Math.abs(typeOffsetY) + typeStretchY
   const asc = max(Math.floor(typeSize*typeAscenders)+((typeSize%2===0)?0:0), 1)
   const desc = asc

   if (typeSpacingY !== undefined) {
      startOffsetY += height+typeSpacingY
      totalHeight[lineNum] = height +typeSpacingY
   } else {
      startOffsetY += height + asc + desc + 1
      totalHeight[lineNum] = height + asc + desc + 1
   }

   if (debugGridMode) {
      drawGrid("debug")
   }

   function drawGrid (type) {
      push()
      if (webglMode) translate(0,0,-1)
      const height = typeSize + Math.abs(typeOffsetY) + typeStretchY
      const asc = max(Math.floor(typeSize*typeAscenders)+((typeSize%2===0)?0:0), 1)

      if (type === "debug" && !printMode) {
         lineColor.setAlpha(40)
         stroke(lineColor)
         strokeWeight(0.2*strokeScaleFactor)
   
         const i = lineNum * totalHeight[lineNum] - typeSize/2
         if (typeOffsetX<0) {
            translate(typeOffsetX,0)
         }

         //vertical gridlines
        lineType(0, i, totalWidth[lineNum], i)
        lineType(0, i+height, totalWidth[lineNum], i+height)
        lineType(0, i-asc, totalWidth[lineNum], i-asc)
        lineType(0, i+height/2-typeOffsetY*0.5, totalWidth[lineNum], i+height/2-typeOffsetY*0.5)
        lineType(0, i+height/2+typeOffsetY*0.5, totalWidth[lineNum], i+height/2+typeOffsetY*0.5)
        lineType(0, i+height+asc, totalWidth[lineNum], i+height+asc)
   
         //horizontal gridlines
         push()
         translate(0,i+height*0.5)
         for (let j = 0; j <= totalWidth[lineNum]; j++) {
           lineType(j, -height/2-asc, j, height/2+asc)
         }
         pop()
      } else if (!debugGridMode){
         stroke(lineColor)
         strokeWeight((typeWeight/10)*1*strokeScaleFactor)
         const i = lineNum * totalHeight[lineNum] - typeSize/2
         push()
         translate(0,i+height*0.5)
         if (typeOffsetX<0) {
            translate(typeOffsetX,0)
         }
         if (type === "vertical" || type === "grid") {
            for (let j = 0; j <= totalWidth[lineNum]; j++) {
              lineType(j, -height/2-asc, j, height/2+asc)
            }
         }
         if (type === "horizontal" || type === "grid") {
            let middleLine = ((typeSize + typeStretchY + typeOffsetY) % 2 === 0) ? 0 : 0.5
            for (let k = middleLine; k <= totalHeight[lineNum]/2; k++) {
              lineType(0, k, totalWidth[lineNum], k)
              lineType(0, -k, totalWidth[lineNum], -k)
            }
         }
         pop()
      }
      bgColor.setAlpha(255)
      lineColor.setAlpha(255)
      pop()
   }
}






function addSpacingBetween(prevchar, char, nextchar, spacing, inner, outer, extendOffset) {
   const weight = (outer-inner)*0.5

   // negative spacing can't go past width of lines
   spacing = max(spacing, -weight)
   let optionalGap = (inner > 1) ? 1 : 0

   // spacing is used between letters that don't make a special ligature
   // some letters force a minimum spacing
   if (typeRings > 1) {
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
         if (isin(prevchar,["gap","ur"]) && isin(prevchar,["gap","dr"])) {
            charWidth = weight*1 + inner*2 -1
         }
         break;
      case "s":
         if (!altS) {
            charWidth = weight*3 + inner*2
            if (isin(nextchar,["gap", "ul"])) {
               charWidth += -0.5*outer + optionalGap
            }
            if (isin(prevchar,["gap", "dr"])) {
               charWidth += -0.5*outer
            }
         }
         break;
      case "z":
         charWidth = 2 + outer
         break;
      case " ":
         charWidth = ceil(outer*0.5)
         break;
      case "i":
      case ".":
      case ",":
      case "!":
         charWidth = weight
         break;
      case "t":
      case "l":
         if (isin(nextchar,["gap", "dl"])) {
            charWidth += -weight
         }
         break;
      case "f":
      case "c":
      case "r":
         if (isin(nextchar,["gap", "ul"])) {
            charWidth += -weight
         }
         break;
      case "?":
         charWidth = ceil(outer*0.5)
         break;
   }

   // 1 less space after letters with cutoff
   if ("ktlcrfsx-".includes(char) && isin(nextchar,["gap"])) {
      charWidth -= 1
   }
   // 1 less space in front of xsj
   if ("xsj-".includes(nextchar) && isin(char,["gap"])) {
      charWidth -= 1
   }

   // overlap after letter, overwrites default variable spacing
   // only happens if it connects into next letter
   let spaceAfter = 0
   let afterConnect = false
   let minSpaceAfter
   switch(char) {
      case "s":
         if (!altS) {
            if (!isin(nextchar,["gap", "ul"])) {
               spaceAfter = -weight
               afterConnect = true
            } else {
               minSpaceAfter = 0
            }
         }
         break;
      case "k":
      case "z":
         if (!isin(nextchar,["gap", "dl"])) {
            afterConnect = true
         } else {
            minSpaceAfter = 0
         }
         break;
      case "x":
         if (!(isin(nextchar,["gap", "dl"]) && isin(nextchar,["gap", "ul"]))) {
            afterConnect = true
         } else {
            minSpaceAfter = 0
         }
         break;
      case "t":
      case "l":
         if (!isin(nextchar,["gap", "dl"])) {
            spaceAfter = -weight
            afterConnect = true
         } else {
            minSpaceAfter = 0
         }
         break;
      case "f":
      case "c":
      case "r":
         if (!isin(nextchar,["gap", "ul"])) {
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
         if (!isin(nextchar,["gap"])) {
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
               if (!isin(char,["gap", "dr"])) {
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
               if (!isin(char, ["gap"])) {
                  spaceBefore = -weight
                  beforeConnect = true
               }
            }
            break;
         case "x":
            if (!(isin(char,["gap", "ur"]) && isin(char,["gap", "dr"]))) {
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
            if (!isin(char, ["gap"])) {
               spaceBefore = -weight
               beforeConnect = true
            }
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
      spaceBefore = -inner-weight-typeStretchX
      beforeConnect = true
   }
   if ("ktlcrfsx".includes(char) && nextchar === "x") {
      spaceBefore = -inner-weight-typeStretchX
      beforeConnect = true
   }
   if ("ktlcrfsx".includes(char) && nextchar === "j") {
      spaceBefore = -inner-weight-typeStretchX
      beforeConnect = true
   }
   if ("s".includes(char) && nextchar === "z") {
      spaceBefore = -inner-weight-typeStretchX
      beforeConnect = true
   }

   // remove overlap spacing if next to space
   if (isin(nextchar,["gap"])) {
      spaceBefore = 0
      beforeConnect = false
   }
   if (isin(char,["gap"])) {
      spaceAfter = 0
      afterConnect = false
   }



   let spacingResult = 0

   // if there is no special overlaps, use the global spacing
   if (afterConnect === false && beforeConnect === false) {

      //regular spacing, if above minspacing
      if (minSpaceAfter !== undefined || minSpaceBefore !== undefined) {
         if (minSpaceBefore !== undefined) {
            spacingResult = charWidth + max(spacing, minSpaceBefore)
         } else {
            spacingResult = charWidth + max(spacing-1, minSpaceAfter)
         }
      } else if ("-_ ".includes(char)) {
         spacingResult = charWidth
      } else {
         // other punctuation?
         spacingResult = charWidth
         if (!"-_ ".includes(nextchar)) spacingResult += spacing
      }
   } else {
      spacingResult = charWidth + spaceAfter + spaceBefore
   }

   // width for vertical offset
   let offsetSegments = 0
   let stretchWidth = 0
   switch (char) {
      case "m":
      case "w":
      case "s":
      case "x":
         offsetSegments = 2
         if (char === "s") {
            if (!altS) {
               // stretch spacing depends on if it connects
               if (isin(prevchar,["gap", "dr"])) {
                  stretchWidth += extendOffset
               } else {
                  stretchWidth += typeStretchX
                  offsetSegments -=1
               }
               if (isin(nextchar,["gap", "ul"])) {
                  stretchWidth += extendOffset
               } else {
                  stretchWidth += typeStretchX
                  offsetSegments -=1
               }
            }
         } else {
            stretchWidth += typeStretchX * 2
         }
         break;
      case "i":
      case ".":
      case ",":
      case "!":
      case " ":
         offsetSegments = 0
         stretchWidth += typeStretchX * 0
         break;
      case "z":
         offsetSegments = 2
         break;
      default:
         offsetSegments = 1
         stretchWidth += typeStretchX * 1
         break;
   }

   return {
      width: spacingResult + stretchWidth,
      offset: offsetSegments
   }
}

function arcUntil(circleSize, y, altValue) {
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
      fill("white")
      specularMaterial(255);
      for (let i = 0; i < 11; i++) {
         push()
         translate(x1+(x2-x1)*0.1*i, y1+(y2-y1)*0.1*i)
         sphere(typeWeight/10,6, 6)
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
      fill("white")
      specularMaterial(255);
      for (let i = 0; i < 11; i++) {
         push()
         const angle = start + (stop-start)*0.1*i
         translate(x, y)
         translate(cos(angle)*(w/2), sin(angle)*(w/2))
         sphere(typeWeight/10,6, 6)
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