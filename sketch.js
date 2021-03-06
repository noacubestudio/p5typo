'use strict'

let font = "fonta"

// gui
let canvasEl
let writeEl
let numberOffsetEl
let playToggleEl

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
   offsetX: {element: document.getElementById('number-offset'), min:-10, max:10},
   spreadX: {element: document.getElementById('number-spreadX'), min: 0, max: 50},
   spreadY: {element: document.getElementById('number-spreadY'), min: 0, max: 50},
}
let linesArray = ["the quick green","alien jumps over","the lazy dog."]
const validLetters = "abcdefghijklmnopqrstuvwxyzäöüß,.!?-_|‸ "


// setup

const palette = {}
let lerpLength = 6

let effect = "none"
let midlineEffects = ["compress", "spread", "twist", "split", "sway", "teeth", "turn"]
let stripeEffects = ["vstripes", "hstripes"]
let webglEffects = ["spheres"]

let initialDraw = true

const mode = {
   // visual
   svg: false,
   dark: true,
   mono: false,
   xray: false,
   drawFills: true,
   spreadFills: true,
   wave: false,
   // use alt letters?
   altS: false,
   altM: false,
   altNH: true,
   // animation
   auto: false,
}

let strokeScaleFactor = 1
const totalWidth = [0, 0, 0, 0]
const totalHeight = [0, 0, 0, 0]

let values = {
   hueDark: {from: 210, to: undefined, lerp: 0},
   hueLight: {from: 130, to: undefined, lerp: 0},
   rings: {from: 3, to: undefined, lerp: 0},
   size: {from: 9, to: undefined, lerp: 0},
   spacing: {from: 0, to: undefined, lerp: 0},
   offsetX: {from: 0, to: undefined, lerp: 0},
   stretchX: {from: 0, to: undefined, lerp: 0},
   offsetY: {from: 0, to: undefined, lerp: 0},
   stretchY: {from: 0, to: undefined, lerp: 0},
   spreadX: {from: 0, to: undefined, lerp: 0},
   spreadY: {from: 0, to: undefined, lerp: 0},
   weight: {from: 7, to: undefined, lerp: 0},
   ascenders: {from: 2, to: undefined, lerp: 0},
   zoom: {from: 10, to: undefined, lerp: 0},
}
// calculated every frame based on current lerps
let animSize, animRings, animSpacing, animWeight, animAscenders, animZoom
let animOffsetX, animOffsetY, animStretchX, animStretchY, animSpreadY, animSpreadX
let animColorDark, animColorLight

//drawfillcorner graphic layers
let fillCornerLayers = {}


function windowResized() {
   if (!mode.svg) {
      resizeCanvas(windowWidth-300, windowHeight)
   }
}

function setup () {
   loadFromURL()
   createGUI()

   canvasEl = createCanvas(windowWidth-300, windowHeight,(webglEffects.includes(effect))?WEBGL:(mode.svg)?SVG:"")
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

   writeToURL("noReload")
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
      writeToURL()
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
      writeToURL()
      
   })

   // toggles and buttles
   playToggleEl = document.getElementById('button-toggleAuto')
   if (mode.auto) {
      playToggleEl.innerHTML ="<i class=\"material-icons\">pause</i>"
   } else {
      playToggleEl.innerHTML ="<i class=\"material-icons\">play_arrow</i>"
   }
   playToggleEl.addEventListener('click', () => {
      mode.auto = !mode.auto
      if (mode.auto) {
         playToggleEl.innerHTML ="<i class=\"material-icons\">pause</i>"
         lerpLength = 12
      } else {
         playToggleEl.innerHTML ="<i class=\"material-icons\">play_arrow</i>"
         lerpLength = 6
      }
      writeToURL()
      updateInGUI()
   })
   const randomizeButton = document.getElementById('button-randomize')
   randomizeButton.addEventListener('click', () => {
      randomStyle()
      writeToURL()
      updateInGUI()
   })

   const resetStyleButton = document.getElementById('button-resetStyle')
   resetStyleButton.addEventListener('click', () => {
      defaultStyle()
      writeToURL()
      updateInGUI()
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
      writeToURL()
      updateInGUI()
   })

   const darkmodeToggle = document.getElementById('checkbox-darkmode')
   darkmodeToggle.checked = mode.dark
   darkmodeToggle.addEventListener('click', () => {
      mode.dark = darkmodeToggle.checked
      writeToURL()
   })
   const monochromeToggle = document.getElementById('checkbox-monochrome')
   monochromeToggle.checked = mode.mono
   monochromeToggle.addEventListener('click', () => {
      mode.mono = monochromeToggle.checked
      writeToURL()
   })
   const xrayToggle = document.getElementById('checkbox-xray')
   xrayToggle.checked = mode.xray
   xrayToggle.addEventListener('click', () => {
      mode.xray = xrayToggle.checked
      writeToURL()
   })
   const svgToggle = document.getElementById('checkbox-svg')
   svgToggle.checked = mode.svg
   svgToggle.addEventListener('click', () => {
      mode.svg = svgToggle.checked
      writeToURL()
      if (!svgToggle.checked) {
         location.reload()
      }
   })
   const altMToggle = document.getElementById('checkbox-altM')
   altMToggle.checked = mode.altM
   altMToggle.addEventListener('click', () => {
      mode.altM = altMToggle.checked
      writeToURL()
   })
   const altNHToggle = document.getElementById('checkbox-altNH')
   altNHToggle.checked = mode.altNH
   altNHToggle.addEventListener('click', () => {
      mode.altNH = altNHToggle.checked
      writeToURL()
   })
   const altSToggle = document.getElementById('checkbox-altS')
   altSToggle.checked = mode.altS
   altSToggle.addEventListener('click', () => {
      mode.altS = altSToggle.checked
      writeToURL()
   })
   const fillsToggle = document.getElementById('checkbox-fills')
   fillsToggle.checked = mode.drawFills
   fillsToggle.addEventListener('click', () => {
      mode.drawFills = fillsToggle.checked
      writeToURL()
   })
   const spreadFillsToggle = document.getElementById('checkbox-spreadfills')
   spreadFillsToggle.checked = mode.spreadFills
   spreadFillsToggle.addEventListener('click', () => {
      mode.spreadFills = spreadFillsToggle.checked
      writeToURL()
   })

   const clamp = (num, min, max) => Math.min(Math.max(num, min), max)

   for (const [property, numberInput] of Object.entries(numberInputsObj)) {
      numberInput.element.value = values[property].from
      numberInput.element.addEventListener('input', () => {
         if (numberInput.element.value !== "") {
            values[property].to = clamp(numberInput.element.value, numberInput.min, numberInput.max)
            writeToURL()
         }
      })
      numberInput.element.addEventListener("focusout", () => {
         if (numberInput.element.value === "") {
            numberInput.element.value = values[property].from
         }
      })
   }

   numberOffsetEl = document.getElementById('number-offset')
   numberOffsetEl.value = values.offsetX.from
   numberOffsetEl.addEventListener('input', () => {
      if (numberOffsetEl.value !== "") {
         values.offsetX.to = clamp(numberOffsetEl.value, -10, 10)
         writeToURL()
      }
   })
   numberOffsetEl.addEventListener("focusout", () => {
      if (numberOffsetEl.value === "") {
         numberOffsetEl.value = values.offsetX.from
      }
   })
}

function loadFromURL () {
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
   if (params.fills === "false" || params.fills === "0") {
      mode.drawFills = false
      print("Loaded with URL Mode: Transparent overlaps")
   }
   if (params.spreadfill === "false" || params.spreadfill === "0") {
      mode.spreadFills = false
      print("Loaded with URL Mode: No fills for spread axes")
   }
   if (params.invert === "true" || params.invert === "1") {
      mode.dark = false
      print("Loaded with URL Mode: Inverted")
   }
   if (params.mono === "true" || params.mono === "1") {
      mode.mono = true
      print("Loaded with URL Mode: Mono")
   }
   if (params.auto === "true" || params.auto === "1") {
      mode.auto = true
      print("Loaded with URL Mode: Auto")
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
         case "turn":
            effect = "turn"
            print("Loaded with URL Mode: Turn V Effect")
            break;
         case "twist":
            effect = "twist"
            print("Loaded with URL Mode: Twist V Effect")
            break;
         case "split":
            effect = "split"
            print("Loaded with URL Mode: Split V Effect")
            break;
         case "sway":
            effect = "sway"
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
         case "vstripes":
            effect = "vstripes"
            print("Loaded with URL Mode: Stripes V Effect")
            break;
         case "hstripes":
            effect = "hstripes"
            print("Loaded with URL Mode: Stripes H Effect")
            break;
         default:
            print("Could not load effect")
            break;
      }
   }
   if (params.font !== undefined) {
      switch (params.font) {
         case "b":
            font = "fontb"
            print("Loaded font: B")
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

      if (valString.match("[0-9_-]+") && valArray.length === 12) {
         print("Loaded with parameters", valArray)
         values.zoom.from = parseInt(valArray[0])
         values.size.from = parseInt(valArray[1])
         values.rings.from = parseInt(valArray[2])
         values.spacing.from = parseInt(valArray[3])
         values.offsetX.from = parseInt(valArray[4])
         values.offsetY.from = parseInt(valArray[5])
         values.stretchX.from = parseInt(valArray[6])
         values.stretchY.from = parseInt(valArray[7])
         values.spreadX.from = parseInt(valArray[8])
         values.spreadY.from = parseInt(valArray[9])
         values.weight.from = parseInt(valArray[10])
         values.ascenders.from = parseInt(valArray[11])
      } else {
         print("Has to be 12 negative or positive numbers with _ in between")
      }
   }
}

function writeToURL (noReload) {

   let URL = String(window.location.href)
   if (URL.includes("?")) {
      URL = URL.split("?",1)
   }

   const newParams = new URLSearchParams();

   // add all setting parameters if any of them are not default
   if (!mode.auto) {
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
      valueArr.push(""+getValue("spreadX"))
      valueArr.push(""+getValue("spreadY"))
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
   if (mode.auto) {
      newParams.append("auto",true)
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
         case "turn":
            value = "turn"
            break;
         case "spread":
            value = "spread"
            break;
         case "split":
            value = "split"
            break;
         case "sway":
            value = "sway"
            break;
         case "twist":
            value = "twist"
            break;
         case "teeth":
            value = "teeth"
            break;
         case "vstripes":
            value = "vstripes"
            break;
         case "hstripes":
            value = "hstripes"
            break;
         case "spheres":
            value = "spheres"
            break;
      }
      if (value !== "none") {
         newParams.append("effect", value)
      }
   }
   if (font !== "fonta") {
      switch (font) {
         case "fontb":
            newParams.append("font", "b")
            break;
      }
   }
   if (!mode.drawFills) {
      newParams.append("fills",false)
   }
   if (!mode.spreadFills) {
      newParams.append("spreadfill",false)
   }

   if (URLSearchParams.toString(newParams).length > 0) {
      URL += "?" + newParams
   }
   window.history.replaceState("", "", URL)

   if ((mode.svg) && noReload === undefined) {
      location.reload()
   }
}

function updateInGUI () {
   // number properties
   for (const [property, numberInput] of Object.entries(numberInputsObj)) {
      if (values[property].to !== undefined) {
         numberInput.element.value = values[property].to
      } else {
         numberInput.element.value = values[property].from
      }
   }
   // text field
   writeEl.value = linesArray.join("\n")

   //effect
   // wip...
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

function autoValues () {
   const waitFrames = 60
   const versionsPerEffect = 7
   if (frameCount % waitFrames !== 0) return

   if ((frameCount/waitFrames) % versionsPerEffect === 0) {
      // do effect
      const randomEffect = ["none","none","gradient", "weightgradient", "compress", "turn", "spread", "split", "sway", "twist", "teeth"]
      effect = random(randomEffect)
   } else if ((frameCount/waitFrames) % versionsPerEffect === versionsPerEffect-1) {
      // prepare effect
      randomStyle()
      defaultStyle()
      updateInGUI()
      return
   }

   randomStyle() // wip, add intensity?
   updateInGUI()
}

function defaultStyle () {
   if (!mode.auto) {
      values.size.to = 9
      values.rings.to = 3
      values.weight.to = 7
      values.ascenders.to = 2
      values.offsetX.to = 0
   } else {
      if (values.offsetX.to > 0) values.offsetX.to = 1
      if (values.offsetX.to < 0) values.offsetX.to = -1
   }
   values.offsetY.to = 0
   values.spacing.to = 0
   values.stretchX.to = 0
   values.stretchY.to = 0
   values.spreadX.to = 0
   values.spreadY.to = 0
}

function randomStyle () {

   function randomWander(from, min, max) {
      //wip
   }

   if (mode.auto) {
      values.size.to = values.size.from
   } else {
      values.size.to = floor(random(4,16))
   }
   
   values.weight.to = floor(random(2,10))
   if (effect === "gradient" || effect === "weightgradient") {
      values.rings.to = floor(random(2, values.size.to/2 + 1))
   } else {
      values.rings.to = floor(random(1, values.size.to/2 + 1))
   }
   values.spacing.to = floor(random(max(-values.rings.to, -2), 2))
   values.ascenders.to = floor(random(1, values.size.to*0.6))

   values.offsetX.to = 0
   values.offsetY.to = 0
   values.stretchX.to = 0
   values.stretchY.to = 0

   if (midlineEffects.includes(effect)) {
      if (random() >= 0.5 && effect !== "teeth") {
         values.offsetX.to = floor(random(-values.size.to, values.size.to+1))
      }
   } else {
      if (random() >= 0.5) {
         values.offsetX.to = floor(random(-1, 2))
      }
   }

   if (midlineEffects.includes(effect)) {
      if (effect === "compress" || effect === "turn") {
         values.stretchY.to = floor(random(values.size.to, values.size.to*3))
      } else if (effect === "teeth") {
         values.stretchY.to = floor(random(2, values.size.to-(values.rings.to-1)*2))
      } else {
         values.stretchY.to = floor(random(values.size.to, values.size.to*1.5))
      }
   } else {
      if (random() >= 0.7) {
         values.stretchY.to = floor(random(0, values.size.to*1.5))
      }
   }
   if (random() >= 0.8 && effect !== "teeth") {
      values.stretchX.to = floor(random(0, values.size.to*1.5))
   }

   values.hueDark.to = floor(random(0,361))
   values.hueLight.to = floor(random(0,361))
}

function draw () {
   // if a "to" value in the values object is not undefined, get closer to it by increasing that "lerp"
   // when the "lerp" value is at 6, the "to" value has been reached,
   // and can be cleared again, new "from" value set.

   if (mode.auto) {
      autoValues()
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
   animSpreadX = lerpValues(values.spreadX) * (animRings-1) *2 //WIP, means it always aligns with grid though
   animSpreadY = lerpValues(values.spreadY) * (animRings-1) *2
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
   translate(40, 40)
   scale(animZoom)

   if (font === "fonta") translate(0, animAscenders)

   strokeWeight((animWeight/10)*strokeScaleFactor)
   palette.fg.setAlpha(255)

      push()

      // draw certain effects below everything
      if (stripeEffects.includes(effect)) {
         drawGrid(effect)
      }

      // draw the whole text
      for (let i = 0; i < linesArray.length; i++) {
         drawText(i)
      }
      pop()

      // draw debug grid always on top
      if (mode.xray) {
         drawGrid("xray")
      }
   
      function drawGrid (type) {
         push()
         if (webglEffects.includes(effect)) translate(0,0,-1)
         let fontSize = animSize
         if (font === "fontb") fontSize = animSize*2 - min(animRings, animSize/2) + 1
         const gridHeight = fontSize + Math.abs(animOffsetY) + animStretchY + animSpreadY
         const gridWidth = (width-60)/animZoom
         const asc = (font === "fontb") ? 0 : animAscenders
   
         if (type === "xray") {
            translate(0,0.5*animSize)
            for (let lineNum = 0; lineNum < linesArray.length; lineNum++) {
               palette.fg.setAlpha(50)
               stroke(palette.fg)
               strokeWeight(0.1*strokeScaleFactor)
         
               const i = lineNum * totalHeight[lineNum] - animSize/2
      
               //horizontal gridlines
               lineType(0, i, gridWidth, i)
               lineType(0, i+gridHeight, gridWidth, i+gridHeight)
               if (font === "fonta") {
                  //asc/desc
                  lineType(0, i-asc, gridWidth, i-asc)
                  lineType(0, i+gridHeight+asc, gridWidth, i+gridHeight+asc)
                  //midlines
                  //wip, animoffsetY now unused - maybe still good that it's brighter?
                  //what about staircase effect?
                  lineType(0, i+gridHeight/2-animOffsetY*0.5, gridWidth, i+gridHeight/2-animOffsetY*0.5)
                  lineType(0, i+gridHeight/2+animOffsetY*0.5, gridWidth, i+gridHeight/2+animOffsetY*0.5)   
               } else if (font === "fontb")  {
                  lineType(0, i + animSize +animStretchY, gridWidth, i + animSize+animStretchY)
                  lineType(0, i+gridHeight -animSize -animStretchY, gridWidth, i+gridHeight -animSize -animStretchY)
                  //twice
                  lineType(0, i + animSize +animStretchY, gridWidth, i + animSize+animStretchY)
                  lineType(0, i+gridHeight -animSize -animStretchY, gridWidth, i+gridHeight -animSize -animStretchY)
                  //halfway
                  lineType(0, i + animSize*0.5, gridWidth, i + animSize*0.5)
                  lineType(0, i+gridHeight -animSize*0.5, gridWidth, i+gridHeight -animSize*0.5)
               }

               //vertical gridlines
               push()
               translate(0,i+gridHeight*0.5)
               for (let j = 0; j <= gridWidth; j++) {
                  lineType(j, -gridHeight/2-asc, j, gridHeight/2+asc)
               }
               pop()
      
               // markers for start of each letter
               push()
               translate(0,i+gridHeight*0.5)
               noStroke()
               fill((mode.dark) ? "#FFBB00E0" : "#2222FFA0")
               for (let c = 0; c <= linesArray[lineNum].length; c++) {
                  const xpos = lineWidthUntil(linesArray[lineNum], c)
                  if (animOffsetX === 0) {
                     ellipse(xpos, 0, 0.9, 0.9)
                  } else {
                     push()
                     if (animOffsetX<0) translate(-animOffsetX,0)
                     stroke((mode.dark) ? "#FFBB00A0" : "#2222FF60")
                     strokeWeight(0.9*strokeScaleFactor)
                     noFill()
                     line(xpos, 0, xpos+animOffsetX, 0)
                     //ellipse(xpos, -1, 0.9, 0.9)
                     //ellipse(xpos+animOffsetX, 1, 0.9, 0.9)
                     pop()
                  }
               }
               pop()
            }
         } else {
            stroke(palette.fg)
            if (mode.xray) {
               strokeWeight(0.2*strokeScaleFactor)
            } else {
               strokeWeight((animWeight/10)*1*strokeScaleFactor)
            }
            push()
            translate(0,-asc)
            if (type === "vstripes") {
               const totalGridHeight = (height-80)/animZoom //+ (1)*(linesArray.length-1)
               for (let j = 0; j <= gridWidth; j++) {
                 lineType(j, 0, j, totalGridHeight)
               }
            }
            if (type === "hstripes") {
               const totalGridHeight = (height-80)/animZoom
               for (let k = 0; k <= totalGridHeight; k++) {
                 lineType(0, k, gridWidth, k)
               }
            }
            pop()
         }
         palette.bg.setAlpha(255)
         palette.fg.setAlpha(255)
         pop()
      }
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
         if (font === "fonta") {
            switch (set) {
               case "ul":
                  //up left sharp
                  found ||= "bhikltuüvwym".includes(char)
                  found ||= (mode.altNH && "n".includes(char))
                  found ||= !validLetters.includes(char)
                  break;
               case "dl":
                  //down left sharp
                  found ||= "hikmnprfvw".includes(char)
                  found ||= !validLetters.includes(char)
                  break;
               case "ur":
                  //up right sharp
                  found ||= "dijuüvwymgl".includes(char)
                  found ||= (mode.altNH && "nh".includes(char))
                  found ||= !validLetters.includes(char)
                  break;
               case "dr":
                  //down right sharp
                  found ||= "aähimnqyew".includes(char)
                  found ||= !validLetters.includes(char)
                  break;
               case "gap":
                  //separating regular letters
                  found ||= "., :;-_!?‸|".includes(char)
                  break;
               case "ml":
                  // letters that overlap with previous letter in the middle
                  found ||= "abcdefghiklmnopqrtuvwy".includes(char)
                  break;
            }
         } else if (font === "fontb") {
            switch (set) {
               case "ul":
                  //up left sharp
                  found ||= "abdefhijklmnprtuvwxyz".includes(char)
                  break;
               case "dl":
                  //down left sharp
                  found ||= "abdefhikmnprvwxz".includes(char)
                  break;
               case "ur":
                  //up right sharp
                  found ||= "aefhijkmntuvwxyz".includes(char)
                  break;
               case "dr":
                  //down right sharp
                  found ||= "aefhikmnprvwxz".includes(char)
                  break;
               case "gap":
                  //separating regular letters
                  found ||= "., :;-_!?‸|".includes(char)
                  break;
               case "ml":
                  // letters that overlap with previous letter in the two centers
                  // j s x ...y?
                  found ||= "abcdefghiklmnopqrsuvwyz".includes(char)
                  break;
               case "mr":
                  // letters that overlap with next letter in the two centers
                  // doesn't include P for now... s? x z?
                  found ||= "abdghijkmnoqsuvwyz".includes(char)
                  break;
            }
         }
      }
   });
   return found
}


function drawText (lineNum) {

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
   let fontSize = animSize
   let stretchSize = animStretchY + animSpreadY
   if (font === "fontb") {
      fontSize = animSize*2 - min(animRings, animSize/2)
      //stretchSize *= 2
   }
   totalHeight[lineNum] = fontSize + Math.abs(animOffsetY) + stretchSize + animAscenders + max(1,animSpacing)

   // wip test: always fit on screen?
   //values.zoom.from = (width) / (Math.max(...totalWidth)+7)

   //translate to account for x offset
   push()
   if (animOffsetX < 0 && effect!=="staircase") {
      translate(-animOffsetX,0)
   } else if (animOffsetX > 0 && effect !== "staircase" && font === "fontb") {
      translate(animOffsetX,0)
   }

   //translate to (lower) midline
   translate(0,fontSize-0.5*animSize)
   if (font === "fontb") translate(0, 1 + (animStretchY + animSpreadY)*0.5)

   let connectingUnderPrev = "sjzx"
   if (font === "fontb") connectingUnderPrev = "jt"

   // go through all the letters, but this time to actually draw them
   // go in a weird order so that lower letters go first
   let prevOverlapCharCount = 0
   for (let c = 0; c < lineText.length; c++) {
      const char = lineText[c]
      if (connectingUnderPrev.includes(char)) {
         prevOverlapCharCount++
      }
   }

   //fox ... count from 0, give x letter, give pos 2
   let layerArray = []
   let prevOverlapCharUntil = 0
   let regularCharUntil = 0
   for (let c = 0; c < lineText.length; c++) {
      const char = lineText[c]
      if (connectingUnderPrev.includes(char)) {
         prevOverlapCharUntil++
         layerArray.push(-prevOverlapCharUntil + prevOverlapCharCount)
      } else {
         layerArray.push(regularCharUntil + prevOverlapCharCount)
         regularCharUntil++
      }
   }

   // get steps and spacing for stretch effect here //td
   const SPREADFILLSTEPSX = (() => {
      if (animRings === 1) return 1
      const MINDISTANCETOFILL = animWeight/10
      const SPREADFILLWIDTH = (animSpreadX*0.5) / (animRings-1)
      const SPREADFILLHEIGHT = (animSpreadY*0.5) / (animRings-1)
      const SPREADFILLMAX = Math.max(SPREADFILLWIDTH, SPREADFILLHEIGHT)
      const ROUNDUPBY = 0.01 //so it ALWAYS rounds up if it would be perfect

      return Math.ceil(SPREADFILLMAX/MINDISTANCETOFILL + ROUNDUPBY)

      //WIP: this could theoretically change per letter, but use the max for the entire line to
      //keep things consistent ... for now it uses the global spread and weight params
   })() || 1 //default


   // make array that will track every vertical connection spot (rounded to grid)
   const lineStyle = {
      // array has 1 or 2 arrays inside based on module height of font
      // these in turn contoin an array for every fill step
      midlineSpots: [[...Array(SPREADFILLSTEPSX+1)].map(x => [])],
      caretSpots: [],
      spaceSpots: [],
   }
   if (font === "fontb") lineStyle.midlineSpots = [
      [...Array(SPREADFILLSTEPSX+1)].map(x => []), 
      [...Array(SPREADFILLSTEPSX+1)].map(x => [])
   ]

   fillCornerLayers = {
      linecut: {},
      roundcut: {},
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
      for (let b = letterOuter; b >= letterInner-1; b-=2) {
         // smallest ring is animated
         let size = (b < letterInner) ? letterInner : b
         ringSizes.push(size)
      }

      const ascenders = animAscenders
      const descenders = animAscenders
      const oneoffset = (letterOuter>3 && letterInner>2) ? 1 : 0
      map(letterOuter, 3, 4, 0, 1, true)
      const wideOffset = 0.5*letterOuter + 0.5*letterInner -animSpreadX*0.5
      const extendOffset = waveValue(letterOuter, 0, 0.5) + ((animStretchX+animSpreadX)-(animStretchX+animSpreadX)%2)*0.5

      let calcPosFromTop = lineNum*totalHeight[lineNum]
      if (animOffsetY<0) calcPosFromTop -= animOffsetY
      if (animOffsetX<0 && effect === "staircase") calcPosFromTop -= animOffsetX

      // style per letter, modify during drawing when needed
      const style = {
         //for entire line, but need while drawing
         midlineSpots: lineStyle.midlineSpots,
         caretSpots: lineStyle.caretSpots,
         spaceSpots: lineStyle.spaceSpots,
         // position and offset after going through all letters in the line until this point
         posFromLeft: lineWidthUntil(lineText, layerArray.indexOf(layerPos)),
         posFromTop: calcPosFromTop,
         vOffset: offsetUntil(lineText, layerArray.indexOf(layerPos)),
         // basics
         sizes: ringSizes,
         opacity: 1,
         stroke: animWeight,
         offsetX: (effect==="staircase")? 0 : animOffsetX,
         offsetY: (effect==="staircase")? animOffsetX : animOffsetY,
         stretchX: animStretchX,
         stretchY: animStretchY,
         spreadX: animSpreadX,
         spreadY: animSpreadY,
         spreadFillSteps: SPREADFILLSTEPSX,
         letter: letter,
         nextLetter: nextLetter,
         prevLetter: prevLetter,
         stack: 0, // for letters with more than 1 level
         flipped: false, // for gradients
         // convenient values
         weight: (letterOuter-letterInner)*0.5,
      }

      // DESCRIBING THE FILLED BACKGROUND SHAPES AND LINES OF EACH LETTER

      ;(function drawLetter () {
         if (font === "fonta") {
            const isFlipped = (!"cktfe".includes(letter))
            // draw chars
            switch(letter) {
               case "o":
               case "ö":
               case "d":
               case "b":
               case "p":
               case "q":
                  // circle
                  drawModule(style, "round", 1, 1, 0, 0, {})
                  drawModule(style, "round", 2, 2, 0, 0, {})
                  drawModule(style, "round", 3, 3, 0, 0, {})
                  drawModule(style, "round", 4, 4, 0, 0, {})
   
                  // SECOND LAYER
                  if (letter === "d") {
                     drawModule(style, "vert", 2, 2, 0, 0, {extend: ascenders})
                  }
                  else if (letter === "b") {
                     drawModule(style, "vert", 1, 1, 0, 0, {extend: ascenders})
                  }
                  else if (letter === "q") {
                     drawModule(style, "vert", 3, 3, 0, 0, {extend: descenders})
                  } else if (letter === "p") {
                     drawModule(style, "vert", 4, 4, 0, 0, {extend: descenders})
                  } else if (letter === "ö") {
                     drawModule(style, "vert", 1, 1, 0, 0, {extend: ascenders, from: letterOuter*0.5 + 1, noStretch: true})
                     drawModule(style, "vert", 2, 2, 0, 0, {extend: ascenders, from: letterOuter*0.5 + 1, noStretch: true})
                  }
                  break;
               case "ß":
                  drawModule(style, "round", 2, 2, 0, 0, {})
                  drawModule(style, "round", 3, 3, 0, 0, {})
                  drawModule(style, "round", 4, 4, 0, 0, {type:"linecut", at:"end"})
                  drawModule(style, "vert", 4, 4, 0, 0, {})
   
                  if (ascenders >= style.weight+letterInner-1) {
                     const modifiedStyle = {...style}
                     modifiedStyle.sizes = []
                     for (let s = 0; s < style.sizes.length; s++) {
                        modifiedStyle.sizes.push(style.sizes[s]-1)
                     }
                     drawModule(style, "hori", 1, 1, 0, 0, {extend: -letterOuter*0.5+0.5, noStretchY: true})
                     drawModule(style, "vert", 1, 1, 0, 0, {extend: ascenders-letterOuter*0.5+0.5})
                     drawModule(modifiedStyle, "round", 1, 1, 0, -ascenders -0.5, {noStretchY: true})
                     drawModule(modifiedStyle, "round", 2, 2, 0, -ascenders -0.5, {noStretchY: true})
                     drawModule(modifiedStyle, "round", 3, 2, 0, -style.weight-letterInner +0.5, {noStretchY: true})
                     drawModule(style, "vert", 3, 2, -1, -ascenders -0.5, {extend: -letterOuter*0.5+(ascenders-(style.weight+letterInner))+1, noStretch: true})
                  } else {
                     drawModule(style, "vert", 1, 1, 0, 0, {extend:ascenders-letterOuter*0.5})
                     drawModule(style, "square", 1, 1, 0, -ascenders, {noStretchY: true})
                     drawModule(style, "hori", 2, 2, 0, -ascenders, {extend:-1, noStretchY: true})
                  }
                  break;
               case "g":
                  drawModule(style, "round", 2, 2, 0, 0, {type: "linecut", at:"start", alwaysCut: true})
                  drawModule(style, "round", 1, 1, 0, 0, {})

                  if (descenders <= style.weight) {
                     // if only one ring, move line down so there is a gap
                     const extragap = (letterOuter > letterInner) ? 0:1
                     const lineOffset = (extragap+style.weight > descenders) ? -(style.weight-descenders) : extragap
   
                     drawModule(style, "hori", 2, 3, 0, letterOuter + lineOffset, {noStretchY: true})
                     drawModule(style, "hori", 1, 4, 0, letterOuter + lineOffset, {noStretchY: true})
                  } else if (letterOuter*0.5 + 1 <= descenders) {
                     // enough room for a proper g
                     drawModule(style, "vert", 3, 3, 0, 0, {extend: descenders - letterOuter*0.5})
                     drawModule(style, "vert", 4, 4, 0, 0, {extend: descenders - letterOuter*0.5, from: letterOuter*0.5+1})
                     drawModule(style, "round", 3, 3, 0, descenders, {noStretchY: true})
                     drawModule(style, "round", 4, 4, 0, descenders, {noStretchY: true})
                  } else {
                     // square corner g
                     drawModule(style, "vert", 3, 3, 0, 0, {extend: descenders - letterOuter*0.5})
                     drawModule(style, "square", 3, 3, 0, descenders, {noStretchY: true})
                     drawModule(style, "hori", 4, 4, 0, descenders, {extend: -1, noStretchY: true})
                  }
   
                  drawModule(style, "round", 3, 3, 0, 0, {})
                  drawModule(style, "round", 4, 4, 0, 0, {})
   
                  drawModule(style, "hori", 2, 2, 0, 0, {})
                  break;
               case "c":
                  drawModule(style, "round", 1, 1, 0, 0, {})
                  if (!"z".includes(nextLetter)) {
                     if (charInSet(nextLetter, ["ul", "gap"])) {
                        drawModule(style, "round", 2, 2, 0, 0, {type: "linecut", at:"end", alwaysCut:"true"})
                     } else {
                        drawModule(style, "round", 2, 2, 0, 0, {type: "roundcut", at:"end"})
                     }
                  }
                  if (!"sz".includes(nextLetter)) {
                     if (charInSet(nextLetter, ["dl", "gap"])) {
                        drawModule(style, "round", 3, 3, 0, 0, {type: "linecut", at:"start", alwaysCut:"true"})
                     } else {
                        drawModule(style, "round", 3, 3, 0, 0, {type: "roundcut", at:"start"})
                     }
                  }
                  drawModule(style, "round", 4, 4, 0, 0, {})
                  break;
               case "e":
                  drawModule(style, "round", 1, 1, 0, 0, {})
                  drawModule(style, "round", 2, 2, 0, 0, {})
                  if (((letterOuter-letterInner)/2+1)*tan(HALF_PI/4) < letterInner/2-2){
                     drawModule(style, "diagonal", 3, 3, 0, 0, {type: "linecut", at:"end"})
                  } else {
                     drawModule(style, "round", 3, 3, 0, 0, {type: "linecut", at:"end", alwaysCut:"true"})
                  }
                  drawModule(style, "round", 4, 4, 0, 0, {})
   
                  // SECOND LAYER
                  if ("s".includes(nextLetter)) {
                     drawModule(style, "hori", 3, 3, 0, 0, {extend: 1})
                  } else if (charInSet(nextLetter,["gap"]) || "gz".includes(nextLetter)) {
                     drawModule(style, "hori", 3, 3, 0, 0, {})
                  } else if (!charInSet(nextLetter,["dl", "gap"]) && letterInner <= 2) {
                     drawModule(style, "hori", 3, 3, 0, 0, {extend: letterOuter*0.5 + animStretchX})
                  } else if ("x".includes(nextLetter)) {
                     drawModule(style, "hori", 3, 3, 0, 0, {extend: letterOuter*0.5 + animStretchX-style.weight})
                  } else if (!charInSet(nextLetter,["dl"])) {
                     drawModule(style, "hori", 3, 3, 0, 0, {extend: -oneoffset+max(animSpacing, -style.weight)})
                  } else if (animSpacing < 0) {
                     drawModule(style, "hori", 3, 3, 0, 0, {extend: -oneoffset+max(animSpacing, -style.weight)})
                  } else if (animSpacing > 0){
                     drawModule(style, "hori", 3, 3, 0, 0, {})
                  } else {
                     drawModule(style, "hori", 3, 3, 0, 0, {extend: -oneoffset})
                  }
                  break;
               case "a":
               case "ä":
                  drawModule(style, "round", 1, 1, 0, 0, {})
                  drawModule(style, "round", 2, 2, 0, 0, {})
                  if (((letterOuter-letterInner)/2+1)*tan(HALF_PI/4) < letterInner/2-2){
                     drawModule(style, "diagonal", 3, 3, 0, 0, {type: "linecut", at:"start"})
                  } else {
                     drawModule(style, "round", 3, 3, 0, 0, {type: "linecut", at:"start", alwaysCut:"true"})
                  }
                  drawModule(style, "round", 4, 4, 0, 0, {})
   
                  // SECOND LAYER
                  drawModule(style, "vert", 3, 3, 0, 0, {})
   
                  if (letter === "ä") {
                     drawModule(style, "vert", 1, 1, 0, 0, {extend: ascenders, from: letterOuter*0.5 + 1, noStretch: true})
                     drawModule(style, "vert", 2, 2, 0, 0, {extend: ascenders, from: letterOuter*0.5 + 1, noStretch: true})
                  }
                  break;
               case "n":
                  if (mode.altNH) {
                     drawModule(style, "square", 1, 1, 0, 0, {})
                     drawModule(style, "square", 2, 2, 0, 0, {})
                  } else {
                     drawModule(style, "round", 1, 1, 0, 0, {})
                     drawModule(style, "round", 2, 2, 0, 0, {})
                  }
                  drawModule(style, "vert", 3, 3, 0, 0, {})
                  drawModule(style, "vert", 4, 4, 0, 0, {})
                  break;
               case "m":
                  drawModule(style, "vert", 4, 4, 0, 0, {})
                  if (mode.altM) {
                     drawModule(style, "square", 1, 1, 0, 0, {})
                     drawModule(style, "square", 2, 2, 0, 0, {})
                     // SECOND LAYER
                     style.flipped = true
                     drawModule(style, "square", 2, 1, wideOffset + animStretchX*2 + animSpreadX*2, 0, {})
                     drawModule(style, "square", 1, 2, wideOffset, 0, {type: "branch", at:"start"})
                  } else {
                     drawModule(style, "diagonal", 1, 1, 0, 0, {})
                     drawModule(style, "diagonal", 2, 2, 0, 0, {})
                     // SECOND LAYER
                     style.flipped = true
                     drawModule(style, "diagonal", 2, 1, wideOffset + animStretchX*2 + animSpreadX*2, 0, {})
                     drawModule(style, "diagonal", 1, 2, wideOffset, 0, {})
                  }
                  drawModule(style, "vert", 4, 3, wideOffset, 0, {})
                  drawModule(style, "vert", 3, 4, wideOffset + animStretchX*2 + animSpreadX*2, 0, {})
                  break;
               case "s":
                  if (!mode.altS) {
                     //LEFT OVERLAP
                     style.flipped = isFlipped
                     if (prevLetter === "s") {
                        drawModule(style, "round", 4, 4, 0, 0, {type: "roundcut", at:"end"})
                     } else if (prevLetter === "r") {
                        drawModule(style, "round", 4, 4, 0, 0, {type: "linecut", at:"end"})
                     } else if (!charInSet(prevLetter,["gap", "dr"]) && !"fkz".includes(prevLetter)) {
                        drawModule(style, "round", 4, 4, 0, 0, {type: "roundcut", at:"end"})
                     }
                     let xOffset = 0
                     //start further left if not connecting left
                     if (charInSet(prevLetter,["gap", "dr"])) {
                        xOffset = -letterOuter*0.5 + extendOffset -animStretchX -animSpreadX
                        drawModule(style, "round", 3, 3, xOffset, 0, {type: "extend", at:"end"})
                     } else {
                        drawModule(style, "round", 3, 3, xOffset, 0, {})
                     }
                     if (!charInSet(nextLetter,["gap", "ul"]) && !"zxj".includes(nextLetter) || nextLetter === "s") {
                        drawModule(style, "round", 1, 2, wideOffset + xOffset, 0, {})
                        drawModule(style, "round", 2, 1, wideOffset + animStretchX*2 + xOffset + animSpreadX*2, 0, {type: "roundcut", at:"end"})
                     } else {
                        drawModule(style, "round", 1, 2, wideOffset + xOffset, 0, {type: "extend", at:"end"})
                     }
                  } else {
                     // alternative cursive s
                     const gapPos = charInSet(prevLetter,["gap"]) ? -style.weight-1:0
   
                     //LEFT OVERLAP
                     if (charInSet(prevLetter,["dr", "gap"])) {
                        drawModule(style, "round", 4, 4, gapPos, 0, {type: "linecut", at:"end"})
                     } else if (prevLetter !== "t") {
                        drawModule(style, "round", 4, 4, gapPos, 0, {type: "roundcut", at:"end"})
                     }
   
                     drawModule(style, "round", 2, 2, gapPos, 0, {})
                     drawModule(style, "round", 3, 3, gapPos, 0, {})
                  }
                  break;
               case "x":
                  let leftXoffset = 0
                  if (charInSet(prevLetter,["gap","ur"]) && charInSet(prevLetter,["gap","dr"])) {
                     leftXoffset = -style.weight-1
                  }
   
                  //LEFT OVERLAP
                  // top connection
                  if (!charInSet(prevLetter,["gap"]) && !"xz".includes(prevLetter)) {
                     if (charInSet(prevLetter,["ur"]) || "l".includes(prevLetter)) {
                        drawModule(style, "round", 1, 1, leftXoffset, 0, {type: "linecut", at:"start", alwaysCut:"true"})
                     } else if (prevLetter !== "t"){
                        drawModule(style, "round", 1, 1, leftXoffset, 0, {type: "roundcut", at:"start"})
                     }
                  }
                  // bottom connection
                  style.flipped = isFlipped
                  if (!"zxef".includes(prevLetter) && !charInSet(prevLetter,["gap"])) {
                     if (prevLetter === "s" && !mode.altS) {
                        drawModule(style, "round", 4, 4, leftXoffset, 0, {type: "roundcut", at:"end"})
                     } else if (prevLetter === "r" || charInSet(prevLetter,["dr"])) {
                        drawModule(style, "round", 4, 4, leftXoffset, 0, {type: "linecut", at:"end"})
                     } else {
                        drawModule(style, "round", 4, 4, leftXoffset, 0, {type: "roundcut", at:"end"})
                     }
                  }
                  style.flipped = false
                  if (charInSet(prevLetter, ["gap"])) {
                     drawModule(style, "round", 1, 1, leftXoffset, 0, {type: "linecut", at:"start", alwaysCut:"true"})
                  }
                  drawModule(style, "round", 2, 2, leftXoffset, 0, {})
                  drawModule(style, "round", 4, 3, leftXoffset + wideOffset, 0, {})
   
                  if (!"xz".includes(nextLetter)) {
                     if (!charInSet(nextLetter,["dl", "gap"])) {
                        drawModule(style, "round", 3, 4, leftXoffset + wideOffset + animStretchX*2, 0, {type: "roundcut", at:"start"})
                     } else {
                        drawModule(style, "round", 3, 4, leftXoffset + wideOffset + animStretchX*2, 0, {type: "linecut", at:"start", alwaysCut:"true"})
                     }
                  }
   
                  // SECOND LAYER
                  style.flipped = true
                  drawModule(style, "diagonal", 1, 2, leftXoffset + wideOffset, 0, {})
                  if (!"xz".includes(nextLetter)) {
                     if (!charInSet(nextLetter,["gap", "ul"])) {
                        drawModule(style, "round", 2, 1, leftXoffset + wideOffset+ animStretchX*2, 0, {type: "roundcut", at:"end"})
                     } else {
                        drawModule(style, "round", 2, 1, leftXoffset + wideOffset+ animStretchX*2, 0, {type: "linecut", at:"end", alwaysCut:"true"})
                     }
                  }
                  drawModule(style, "diagonal", 3, 3, leftXoffset, 0, {})
                  if (charInSet(prevLetter,["gap"])) {
                     drawModule(style, "round", 4, 4, leftXoffset, 0, {type: "linecut", at:"end", alwaysCut:"true"})
                  }
                  break;
               case "u":
               case "ü":
               case "y":
                  drawModule(style, "vert", 1, 1, 0, 0, {})
                  drawModule(style, "vert", 2, 2, 0, 0, {})
                  drawModule(style, "round", 3, 3, 0, 0, {})
                  drawModule(style, "round", 4, 4, 0, 0, {})
   
                  // SECOND LAYER
                  if (letter === "y") {
                     drawModule(style, "vert", 3, 3, 0, 0, {extend: descenders})
                  } else if (letter === "ü") {
                     drawModule(style, "vert", 1, 1, 0, 0, {extend: ascenders, from: letterOuter*0.5 + 1, noStretch: true})
                     drawModule(style, "vert", 2, 2, 0, 0, {extend: ascenders, from: letterOuter*0.5 + 1, noStretch: true})
                  }
                  break;
               case "w":
                  drawModule(style, "vert", 1, 1, 0, 0, {})
                  drawModule(style, "diagonal", 3, 3, 0, 0, {})
                  drawModule(style, "diagonal", 4, 4, 0, 0, {})

                  style.flipped = true
                  drawModule(style, "vert", 2, 1, wideOffset + animStretchX*2 +animSpreadX*2, 0, {})
                  drawModule(style, "vert", 1, 2, wideOffset, 0, {})
                  drawModule(style, "diagonal", 4, 3, wideOffset, 0, {})
                  drawModule(style, "diagonal", 3, 4, wideOffset + animStretchX*2 +animSpreadX*2, 0, {})
                  break;
               case "r":
                  drawModule(style, "round", 1, 1, 0, 0, {})
                  if (!"z".includes(nextLetter)) {
                     if (charInSet(nextLetter,["ul", "gap"])) {
                        drawModule(style, "round", 2, 2, 0, 0, {type: "linecut", at:"end", alwaysCut:"true"})
                     } else {
                        drawModule(style, "round", 2, 2, 0, 0, {type: "roundcut", at:"end"})
                     }
                  }
                  drawModule(style, "vert", 4, 4, 0, 0, {})
                  break;
               case "l":
               case "t":
   
                  if (letter === "t") {
                     drawModule(style, "vert", 1, 1, 0, 0, {extend: ascenders})
                     drawModule(style, "square", 1, 1, 0, 0, {type: "branch", at:"end"})
                     if (!"zx".includes(nextLetter)) {
                        if (charInSet(nextLetter,["ul", "gap"]) || letterInner > 2) {
                           drawModule(style, "hori", 2, 2, 0, 0, {extend: -style.weight-1 + ((letterInner<2) ? 1 : 0)})
                        } else {
                           drawModule(style, "hori", 2, 2, 0, 0, {extend: letterOuter*0.5-style.weight})
                        }
                     }
                  } else {
                     drawModule(style, "vert", 1, 1, 0, 0, {extend: ascenders})
                  }
   
                  drawModule(style, "round", 4, 4, 0, 0, {})
                  if (!"z".includes(nextLetter)) {
                     if (charInSet(nextLetter,["dl", "gap"])) {
                        drawModule(style, "round", 3, 3, 0, 0, {type: "linecut", at:"start", alwaysCut:"true"})
                     } else {
                        drawModule(style, "round", 3, 3, 0, 0, {type: "roundcut", at:"start"})
                     }
                  }  
                  break;
               case "f":
                  drawModule(style, "round", 1, 1, 0, 0, {})
                  if (!"z".includes(nextLetter)) {
                     if (charInSet(nextLetter,["ul", "gap"])) {
                        drawModule(style, "round", 2, 2, 0, 0, {type: "linecut", at:"end", alwaysCut:"true"})
                     } else {
                        drawModule(style, "round", 2, 2, 0, 0, {type: "roundcut", at:"end"})
                     }
                  }
                  drawModule(style, "vert", 4, 4, 0, 0, {extend: descenders})
                  drawModule(style, "square", 4, 4, 0, 0, {type: "branch", at:"start"})
   
                  // SECOND LAYER
                  if (!"sxz".includes(nextLetter)) {
                     if (charInSet(nextLetter,["dl", "gap"]) || letterInner > 2) {
                        drawModule(style, "hori", 3, 3, 0, 0, {extend: -style.weight-1 + ((letterInner<2) ? 1 : 0)})
                     } else {
                        drawModule(style, "hori", 3, 3, 0, 0, {extend: letterOuter*0.5-style.weight})
                     }
                  }
                  break;
               case "k":
                  drawModule(style, "vert", 1, 1, 0, 0, {extend: ascenders})
                  drawModule(style, "vert", 4, 4, 0, 0, {})
                  drawModule(style, "diagonal", 1, 1, style.weight+style.spreadX/2, 0, {})
                  drawModule(style, "diagonal", 4, 4, style.weight+style.spreadX/2, 0, {})
                  if (!"zx".includes(nextLetter)) {
                     drawModule(style, "hori", 2, 2, style.weight+style.spreadX/2, 0, {extend: -oneoffset-style.weight})
                  }
                  if (!"sxz".includes(nextLetter)) {
                     if (!(charInSet(nextLetter,["dl", "gap"]))) {
                        drawModule(style, "round", 3, 3, style.weight+style.spreadX/2, 0, {type: "roundcut", at:"start"})
                     } else {
                        drawModule(style, "hori", 3, 3, style.weight+style.spreadX/2, 0, {extend: -oneoffset-style.weight})
                     }
                  }
                  break;
               case "h":
                  drawModule(style, "vert", 1, 1, 0, 0, {extend: ascenders})
   
                  // SECOND LAYER
                  if (mode.altNH) {
                     drawModule(style, "square", 1, 1, 0, 0, {type: "branch", at:"end"})
                     drawModule(style, "square", 2, 2, 0, 0, {})
                  } else {
                     drawModule(style, "round", 1, 1, 0, 0, {})
                     drawModule(style, "round", 2, 2, 0, 0, {})
                  }
                  drawModule(style, "vert", 3, 3, 0, 0, {})
                  drawModule(style, "vert", 4, 4, 0, 0, {})
                  break;
               case "v":
                  drawModule(style, "vert", 1, 1, 0, 0, {})
                  drawModule(style, "vert", 2, 2, 0, 0, {})
                  if (((letterOuter-letterInner)/2+1)*tan(HALF_PI/4) < letterInner/2-2){
                     drawModule(style, "diagonal", 3, 3, 0, 0, {})
                     drawModule(style, "diagonal", 4, 4, 0, 0, {})
                  } else {
                     drawModule(style, "diagonal", 3, 3, 0, 0, {})
                     drawModule(style, "square", 4, 4, 0, 0, {})
                  }
                  break;
               case ".":
                  drawModule(style, "vert", 4, 4, 0, 0, {from: letterOuter*0.5 - (style.weight+0.5), noStretch: true})
                  break;
               case ",":
                  drawModule(style, "vert", 4, 4, 0, 0, {extend: descenders, from:letterOuter*0.5 - (style.weight+0.5), noStretch: true})
                  break;
               case "!":
                  // wip
                  drawModule(style, "vert", 1, 1, 0, 0, {extend: ascenders})
                  drawModule(style, "vert", 4, 4, 0, 0, {extend: -style.weight-1.5})
                  drawModule(style, "vert", 4, 4, 0, 0, {from: letterOuter*0.5 - (style.weight+0.5), noStretch: true})
                  break;
               case "?":
                  // wip
                  drawModule(style, "round", 1, 1, 0, 0, {})
                  drawModule(style, "round", 2, 2, 0, 0, {})
                  drawModule(style, "round", 3, 3, 0, 0, {})
                  drawModule(style, "round", 4, 4, 0, 0, {type: "linecut", at:"end", alwaysCut: true})
                  drawModule(style, "vert", 4, 4, 0, 0, {extend: ascenders, from: letterOuter*0.5 - (style.weight+0.5), noStretch: true})
                  break;
               case "i":
                  drawModule(style, "vert", 1, 1, 0, 0, {extend: ascenders, from: letterOuter*0.5 + 1, noStretch: true})
                  drawModule(style, "vert", 1, 1, 0, 0, {})
                  drawModule(style, "vert", 4, 4, 0, 0, {})
                  break;
               case "j":
                  let leftOffset = 0
                  if (charInSet(prevLetter,["gap"])) {
                     leftOffset = -style.weight-1
                  }
   
                  // LEFT OVERLAP
                  if (prevLetter !== undefined) {
                     if (!"tkz".includes(prevLetter)) {
                        if (charInSet(prevLetter,["dr", "gap"]) || "r".includes(prevLetter)) {
                           drawModule(style, "round", 4, 4, leftOffset, 0, {type: "linecut", at:"end", alwaysCut:"true"})
                        } else {
                           drawModule(style, "round", 4, 4, leftOffset, 0, {type: "roundcut", at:"end"})
                        }
                     }
                     if (!charInSet(prevLetter,["tr"]) && !"ckrsxz".includes(prevLetter)) {
                        drawModule(style, "hori", 1, 1, leftOffset, 0, {extend: -style.weight-1})
                     }
                  }
                  
                  drawModule(style, "vert", 2, 2, leftOffset, 0, {extend: ascenders, from: letterOuter*0.5 + 1, noStretch: true})
                  drawModule(style, "square", 2, 2, leftOffset, 0, {})
                  drawModule(style, "round", 3, 3, leftOffset, 0, {})
                  if (prevLetter === undefined) {
                     drawModule(style, "hori", 1, 1, leftOffset, 0, {extend: -style.weight-1})
                     drawModule(style, "round", 4, 4, leftOffset, 0, {type: "linecut", at:"end"})
                  }
                  break;
               case "z":
                  let oddOffset = waveValue(letterOuter, 0, 0.5)
                  let leftZoffset = 0
                  if (charInSet(prevLetter,["gap"])) {
                     leftZoffset = -style.weight-1
                  } else if ("czfkxt".includes(prevLetter)) {
                     leftZoffset = -style.weight-1
                  }
   
                  // TOP LEFT OVERLAP
                  if (!"czfkxt".includes(prevLetter)) {
                     if (charInSet(prevLetter,["ur", "gap"])) {
                        drawModule(style, "round", 1, 1, leftZoffset, 0, {type: "linecut", at:"start", alwaysCut:"true"})
                     } else {
                        drawModule(style, "round", 1, 1, leftZoffset, 0, {type: "roundcut", at:"start", alwaysCut:"true"})
                     }
                  } else {
                     drawModule(style, "hori", 1, 1, leftZoffset, 0, {extend:-(style.weight+1)})
                  }
   
                  drawModule(style, "hori", 2, 2, leftZoffset, 0, {extend: 1+oddOffset*2})
                  style.flipped = true
                  drawModule(style, "diagonal", 1, 2, letterOuter*0.5 +1+oddOffset+leftZoffset, 0, {})
   
                  // BOTTOM RIGHT OVERLAP
                  drawModule(style, "diagonal", 3, 3, style.weight+1-letterOuter*0.5+oddOffset+leftZoffset, 0, {})
                  style.flipped = false
                  drawModule(style, "hori", 4, 3, style.weight+2+oddOffset*2+leftZoffset, 0, {extend: 1+oddOffset*2})
   
                  if (!"zxj".includes(nextLetter)) {
                     if (charInSet(nextLetter,["dl", "gap"])) {
                        drawModule(style, "round", 3, 4, style.weight+2+animStretchX*2+oddOffset*2+leftZoffset, 0, {type: "linecut", at:"start", alwaysCut:"true"})
                     } else {
                        drawModule(style, "round", 3, 4, style.weight+2+animStretchX*2+oddOffset*2+leftZoffset, 0, {type: "roundcut", at:"start", alwaysCut:"true"})
                     }
                  }
                  break;
               case "-":
                  style.sizes = [letterOuter]
                  drawModule(style, "hori", 1, 1, 0, +letterOuter*0.5, {extend: -1})
                  drawModule(style, "hori", 2, 2, 0, +letterOuter*0.5, {extend: -1})
                  sortIntoArray(style.spaceSpots, style.posFromLeft)
                  break;
               case "_":
                  style.sizes = [letterOuter]
                  drawModule(style, "hori", 3, 3, 0, 0, {extend: -1})
                  drawModule(style, "hori", 4, 4, 0, 0, {extend: -1})
                  sortIntoArray(style.spaceSpots, style.posFromLeft)
                  break;
               case " ":
                  sortIntoArray(style.spaceSpots, style.posFromLeft)
                  break;
               case "‸":
                  //caret symbol
                  style.opacity = 0.5
                  style.sizes = [letterOuter]
                  drawModule(style, "vert", 1, 1, 0, 0, {extend: animAscenders})
                  drawModule(style, "vert", 4, 4, 0, 0, {extend: animAscenders})
                  break;
               case "|":
                  style.sizes = [letterOuter]
                  drawModule(style, "vert", 1, 1, 0, 0, {extend: animAscenders})
                  drawModule(style, "vert", 4, 4, 0, 0, {extend: animAscenders})
                  break;
               case "#":
                  drawModule(style, "square", 1, 1, 0, 0, {type: "branch", at: "end"})
                  drawModule(style, "square", 2, 2, 0, 0, {type: "branch", at: "end"})
                  drawModule(style, "square", 3, 3, 0, 0, {type: "branch", at: "start"})
                  drawModule(style, "square", 4, 4, 0, 0, {type: "branch", at: "start"})
                  break;
               default:
                  style.sizes = [letterOuter]
                  style.opacity = 0.5
                  drawModule(style, "square", 1, 1, 0, 0, {})
                  drawModule(style, "square", 2, 2, 0, 0, {})
                  drawModule(style, "square", 3, 3, 0, 0, {})
                  drawModule(style, "square", 4, 4, 0, 0, {})
                  break;
            }
         } else if (font === "fontb") {
            switch (letter) {
               case "a":
               case "ä":
                  style.stack = 1
                  drawModule(style, "diagonal", 1, 1, 0, 0, {})
                  drawModule(style, "diagonal", 2, 2, 0, 0, {})
                  drawModule(style, "vert", 3, 3, 0, 0, {})
                  drawModule(style, "vert", 4, 4, 0, 0, {})
                  style.stack = 0
                  drawModule(style, "square", 1, 1, 0, 0, {type: "branch", at:"end"})
                  drawModule(style, "square", 2, 2, 0, 0, {type: "branch", at:"start"})
                  drawModule(style, "vert", 3, 3, 0, 0, {})
                  drawModule(style, "vert", 4, 4, 0, 0, {})
                  break;
               case "b":
               case "p":
               case "r":
                  style.stack = 1
                  drawModule(style, "square", 1, 1, 0, 0, {})
                  drawModule(style, "round", 2, 2, 0, 0, {})
                  drawModule(style, "round", 3, 3, 0, 0, {})
                  drawModule(style, "vert", 4, 4, 0, 0, {})
                  style.stack = 0
                  if (letter === "b") {
                     drawModule(style, "square", 1, 1, 0, 0, {type: "branch", at:"end"})
                     drawModule(style, "round", 2, 2, 0, 0, {})
                     drawModule(style, "round", 3, 3, 0, 0, {})
                     drawModule(style, "square", 4, 4, 0, 0, {})
                  } else if (letter === "p") {
                     style.flipped = true
                     drawModule(style, "square", 1, 1, 0, 0, {type: "branch", at:"end"})
                     style.flipped = false
                     drawModule(style, "vert", 4, 4, 0, 0, {})
                  } else {
                     drawModule(style, "square", 1, 1, 0, 0, {type: "branch", at:"end"})
                     drawModule(style, "diagonal", 2, 2, 0, 0, {})
                     drawModule(style, "vert", 3, 3, 0, 0, {})
                     drawModule(style, "vert", 4, 4, 0, 0, {})
                  }
                  break;
               case "c":
               case "l":
                  style.stack = 1
                  if (letter === "c") {
                     drawModule(style, "round", 1, 1, 0, 0, {})
                     if (!"t".includes(nextLetter)) {
                        if (charInSet(nextLetter, ["ul", "gap"])) {
                           drawModule(style, "round", 2, 2, 0, 0, {type: "linecut", at:"end", alwaysCut:"true"})
                        } else {
                           drawModule(style, "round", 2, 2, 0, 0, {type: "roundcut", at:"end"})
                        }
                     }
                  } else {
                     drawModule(style, "vert", 1, 1, 0, 0, {})
                  }
                  drawModule(style, "vert", 4, 4, 0, 0, {})
                  style.stack = 0
                  drawModule(style, "vert", 1, 1, 0, 0, {})
                  if (charInSet(nextLetter, ["dl", "gap"]) || "tj".includes(nextLetter)) {
                     drawModule(style, "round", 3, 3, 0, 0, {type: "linecut", at:"start", alwaysCut:"true"})
                  } else {
                     drawModule(style, "round", 3, 3, 0, 0, {type: "roundcut", at:"start"})
                  }
                  drawModule(style, "round", 4, 4, 0, 0, {})
                  break;
               case "d":
                  style.stack = 1
                  drawModule(style, "square", 1, 1, 0, 0, {})
                  drawModule(style, "round", 2, 2, 0, 0, {})
                  drawModule(style, "vert", 3, 3, 0, 0, {})
                  drawModule(style, "vert", 4, 4, 0, 0, {})
                  style.stack = 0
                  drawModule(style, "vert", 1, 1, 0, 0, {})
                  drawModule(style, "vert", 2, 2, 0, 0, {})
                  drawModule(style, "round", 3, 3, 0, 0, {})
                  drawModule(style, "square", 4, 4, 0, 0, {})
                  break;
               case "e":
               case "f":
                  style.stack = 1
                  drawModule(style, "square", 1, 1, 0, 0, {})
                  drawModule(style, "hori", 2, 2, 0, 0, {extend: -style.weight-1})
                  drawModule(style, "vert", 4, 4, 0, 0, {})
                  style.stack = 0
                  drawModule(style, "square", 1, 1, 0, 0, {type: "branch", at:"end"})
                  drawModule(style, "hori", 2, 2, 0, 0, {extend: -style.weight-1})
                  if (letter === "e") {
                     if (!"j".includes(nextLetter)) {
                        drawModule(style, "hori", 3, 3, 0, 0, {extend: -style.weight-1})
                     }
                     drawModule(style, "square", 4, 4, 0, 0, {})
                  } else if (letter === "f"){
                     drawModule(style, "vert", 4, 4, 0, 0, {})
                  }
                  break;
               case "g":
                  style.stack = 1
                  drawModule(style, "round", 1, 1, 0, 0, {})
                  drawModule(style, "square", 2, 2, 0, 0, {})
                  drawModule(style, "vert", 3, 3, 0, 0, {extend: -style.weight-1})
                  drawModule(style, "vert", 4, 4, 0, 0, {})
                  style.stack = 0
                  drawModule(style, "hori", 1, 1, 0, 0, {extend: -style.weight-1})
                  drawModule(style, "vert", 1, 1, 0, 0, {})
                  drawModule(style, "square", 2, 2, 0, 0, {})
                  drawModule(style, "square", 3, 3, 0, 0, {})
                  drawModule(style, "round", 4, 4, 0, 0, {})
                  break;
               case "h":
                  style.stack = 1
                  drawModule(style, "vert", 1, 1, 0, 0, {})
                  drawModule(style, "vert", 2, 2, 0, 0, {})
                  drawModule(style, "vert", 3, 3, 0, 0, {})
                  drawModule(style, "vert", 4, 4, 0, 0, {})
                  style.stack = 0
                  drawModule(style, "square", 1, 1, 0, 0, {type: "branch", at:"end"})
                  drawModule(style, "square", 2, 2, 0, 0, {type: "branch", at:"start"})
                  drawModule(style, "vert", 3, 3, 0, 0, {})
                  drawModule(style, "vert", 4, 4, 0, 0, {})
                  break;
               case "i":
                  style.stack = 1
                  drawModule(style, "vert", 1, 1, 0, 0, {})
                  drawModule(style, "vert", 4, 4, 0, 0, {})
                  style.stack = 0
                  drawModule(style, "vert", 1, 1, 0, 0, {})
                  drawModule(style, "vert", 4, 4, 0, 0, {})
                  break;
               case "j":
                  style.stack = 1
                  drawModule(style, "hori", 1, 1, -style.weight-1, 0, {extend: -style.weight-1})
                  drawModule(style, "square", 2, 2, -style.weight-1, 0, {})
                  drawModule(style, "vert", 3, 3, -style.weight-1, 0, {})
                  style.stack = 0
                  drawModule(style, "vert", 2, 2, -style.weight-1, 0, {})
                  drawModule(style, "round", 3, 3, -style.weight-1, 0, {})
                  //wip sometimes round
                  if (!"e".includes(prevLetter)) {
                     if (charInSet(prevLetter,["dr", "gap"])) {
                        drawModule(style, "round", 4, 4, -style.weight-1, 0, {type: "linecut", at:"end", alwaysCut:true})
                     } else {
                        drawModule(style, "round", 4, 4, -style.weight-1, 0, {type: "roundcut", at:"end", alwaysCut:true})
                     }
                  }
                  break;
               case "k":
                  style.stack = 1
                  drawModule(style, "vert", 1, 1, 0, 0, {})
                  drawModule(style, "vert", 2, 2, 0, 0, {})
                  drawModule(style, "diagonal", 3, 3, 0, 0, {})
                  drawModule(style, "vert", 4, 4, 0, 0, {})
                  style.stack = 0
                  drawModule(style, "square", 1, 1, 0, 0, {type: "branch", at:"end"})
                  drawModule(style, "diagonal", 2, 2, 0, 0, {})
                  drawModule(style, "vert", 3, 3, 0, 0, {})
                  drawModule(style, "vert", 4, 4, 0, 0, {})
                  break;
               case "m":
                  style.stack = 1
                  drawModule(style, "diagonal", 1, 1, 0, 0, {})
                  drawModule(style, "diagonal", 2, 2, 0, 0, {})
                  drawModule(style, "vert", 4, 4, 0, 0, {})
                  // right side
                  style.flipped = true
                  drawModule(style, "diagonal", 1, 2, wideOffset, 0, {})
                  drawModule(style, "diagonal", 2, 1, wideOffset + animStretchX*2, 0, {})
                  drawModule(style, "vert", 3, 4, wideOffset + animStretchX*2, 0, 0, undefined)
                  drawModule(style, "vert", 4, 3, wideOffset, 0, 0, undefined)
                  style.stack = 0
                  style.flipped = false
                  drawModule(style, "vert", 1, 1, 0, 0, {})
                  drawModule(style, "vert", 4, 4, 0, 0, {})
                  // right side
                  style.flipped = true
                  drawModule(style, "vert", 1, 2, wideOffset, 0, 0, undefined)
                  drawModule(style, "vert", 2, 1, wideOffset + animStretchX*2, 0, 0, undefined)
                  drawModule(style, "vert", 3, 4, wideOffset + animStretchX*2, 0, 0, undefined)
                  drawModule(style, "vert", 4, 3, wideOffset, 0, 0, undefined)
                  break;
               case "n":
                  style.stack = 1
                  drawModule(style, "square", 1, 1, 0, 0, {})
                  drawModule(style, "square", 2, 2, 0, 0, {})
                  drawModule(style, "vert", 3, 3, 0, 0, {})
                  drawModule(style, "vert", 4, 4, 0, 0, {})
                  style.stack = 0
                  drawModule(style, "vert", 1, 1, 0, 0, {})
                  drawModule(style, "vert", 2, 2, 0, 0, {})
                  drawModule(style, "vert", 3, 3, 0, 0, {})
                  drawModule(style, "vert", 4, 4, 0, 0, {})
                  break;
               case "o":
               case "ö":
               case "q":
                  style.stack = 1
                  if (letter === "q") {
                     style.flipped = true
                     drawModule(style, "diagonal", 4, 4, 0, 0, {})
                     style.flipped = false
                  }
                  drawModule(style, "round", 1, 1, 0, 0, {})
                  drawModule(style, "round", 2, 2, 0, 0, {})
                  drawModule(style, "vert", 3, 3, 0, 0, {})
                  drawModule(style, "vert", 4, 4, 0, 0, {})
                  style.stack = 0
                  drawModule(style, "vert", 1, 1, 0, 0, {})
                  drawModule(style, "vert", 2, 2, 0, 0, {})
                  drawModule(style, "round", 3, 3, 0, 0, {})
                  drawModule(style, "round", 4, 4, 0, 0, {})
                  if (letter === "q") {
                     drawModule(style, "vert", 3, 3, 0, 0, {})
                     drawModule(style, "diagonal", 2, 2, 0, 0, {})
                  }
                  break;
               case "s":
                  style.stack = 1
                  drawModule(style, "round", 1, 1, 0, 0, {})
                  drawModule(style, "round", 2, 2, 0, 0, {})
                  drawModule(style, "round", 3, 3, 0, 0, {type: "linecut", at:"end", alwaysCut:"true"})
                  drawModule(style, "round", 4, 4, 0, 0, {})
                  style.stack = 0
                  style.flipped = true
                  drawModule(style, "round", 1, 1, 0, 0, {type: "linecut", at:"end", alwaysCut:"true"})
                  drawModule(style, "round", 2, 2, 0, 0, {})
                  drawModule(style, "round", 3, 3, 0, 0, {})
                  drawModule(style, "round", 4, 4, 0, 0, {})
                  break;
               case "t":
                  style.stack = 1
                  if (!"c".includes(prevLetter)) {
                     drawModule(style, "hori", 1, 1, -style.weight-1, 0, {extend: -style.weight-1})
                  }
                  style.flipped = true
                  drawModule(style, "hori", 1, 2, wideOffset-style.weight-1, 0, {from: -animSize/2+style.weight+1-style.stretchX})
                  style.flipped = false
                  drawModule(style, "square", 2, 2, -style.weight-1, 0, {type: "branch", at:"end"})
                  drawModule(style, "vert", 3, 3, -style.weight-1, 0, {})
                  style.stack = 0
                  drawModule(style, "vert", 2, 2, -style.weight-1, 0, {})
                  drawModule(style, "vert", 3, 3, -style.weight-1, 0, {})
                  break;
               case "u":
               case "ü":
               case "v":
               case "w":
                  style.stack = 1
                  drawModule(style, "vert", 1, 1, 0, 0, {})
                  if (letter !== "w") {
                     drawModule(style, "vert", 2, 2, 0, 0, {})
                     drawModule(style, "vert", 3, 3, 0, 0, {})
                  }
                  drawModule(style, "vert", 4, 4, 0, 0, {})
                  if (letter === "w") {
                     //right side
                     drawModule(style, "vert", 1, 1, wideOffset  + animStretchX, 0, {})
                     drawModule(style, "vert", 2, 2, wideOffset  + animStretchX, 0, {})
                     drawModule(style, "vert", 3, 3, wideOffset  + animStretchX, 0, {})
                     drawModule(style, "vert", 4, 4, wideOffset  + animStretchX, 0, {})
                  }
                  style.stack = 0
                  drawModule(style, "vert", 1, 1, 0, 0, {})
                  if (letter !== "w") drawModule(style, "vert", 2, 2, 0, 0, {})
                  if ("uü".includes(letter)) {
                     drawModule(style, "round", 3, 3, 0, 0, {})
                     drawModule(style, "round", 4, 4, 0, 0, {})
                  } else {
                     drawModule(style, "diagonal", 3, 3, 0, 0, {})
                     drawModule(style, "diagonal", 4, 4, 0, 0, {})
                  }
                  if (letter === "w") {
                     // right side
                     drawModule(style, "vert", 1, 1, wideOffset + animStretchX, 0, {})
                     drawModule(style, "vert", 2, 2, wideOffset + animStretchX, 0, {})
                     drawModule(style, "diagonal", 3, 3, wideOffset + animStretchX, 0, {})
                     drawModule(style, "diagonal", 4, 4, wideOffset + animStretchX, 0, {})
                  }
                  break;
               case "x":
                  style.stack = 1
                  drawModule(style, "vert", 1, 1, 0, 0, {})
                  drawModule(style, "diagonal", 4, 4, 0, 0, {})
                  style.stack = 0
                  drawModule(style, "diagonal", 1, 1, 0, 0, {})
                  drawModule(style, "diagonal", 2, 2, 0, 0, {})
                  drawModule(style, "vert", 3, 3, 0, 0, {})
                  drawModule(style, "vert", 4, 4, 0, 0, {})
                  style.stack = 1
                  style.flipped = true
                  drawModule(style, "diagonal", 3, 3, 0, 0, {})
                  drawModule(style, "vert", 2, 2, 0, 0, {})
                  break;
               case "y":
                  style.stack = 0
                  drawModule(style, "round", 1, 1, 0, 0, {type: "linecut", at:"end", alwaysCut:"true"})
                  drawModule(style, "vert", 2, 2, 0, 0, {})
                  drawModule(style, "round", 3, 3, 0, 0, {})
                  drawModule(style, "round", 4, 4, 0, 0, {})
                  style.stack = 1
                  drawModule(style, "vert", 1, 1, 0, 0, {})
                  drawModule(style, "vert", 2, 2, 0, 0, {})
                  drawModule(style, "vert", 3, 3, 0, 0, {})
                  drawModule(style, "round", 3, 3, 0, 0, {})
                  drawModule(style, "round", 4, 4, 0, 0, {})
                  break;
               case "z":
                  style.stack = 1
                  drawModule(style, "square", 1, 1, 0, 0, {})
                  drawModule(style, "square", 2, 2, 0, 0, {})
                  drawModule(style, "diagonal", 3, 3, 0, 0, {})
                  drawModule(style, "round", 4, 4, 0, 0, {type: "linecut", at:"start", alwaysCut:"true"})
                  style.stack = 0
                  style.flipped = true
                  drawModule(style, "diagonal", 1, 1, 0, 0, {})
                  drawModule(style, "round", 2, 2, 0, 0, {type: "linecut", at:"start", alwaysCut:"true"})
                  drawModule(style, "square", 3, 3, 0, 0, {})
                  drawModule(style, "square", 4, 4, 0, 0, {})
                  break;
               case "ß":
                  style.stack = 1
                  drawModule(style, "round", 1, 1, 0, 0, {})
                  drawModule(style, "square", 2, 2, 0, 0, {})
                  drawModule(style, "diagonal", 3, 3, 0, 0, {})
                  drawModule(style, "vert", 4, 4, 0, 0, {})
                  style.stack = 0
                  drawModule(style, "vert", 1, 1, 0, 0, {})
                  drawModule(style, "round", 2, 2, 0, 0, {})
                  drawModule(style, "round", 3, 3, 0, 0, {})
                  drawModule(style, "round", 4, 4, 0, 0, {type: "linecut", at:"end"})
                  drawModule(style, "vert", 4, 4, 0, 0, {})
                  break;
               case "-":
                  style.sizes = [letterOuter]
                  drawModule(style, "hori", 1, 1, 0, +letterOuter*0.5, {extend: -1})
                  drawModule(style, "hori", 2, 2, 0, +letterOuter*0.5, {extend: -1})
                  sortIntoArray(style.spaceSpots, style.posFromLeft)
                  break;
               case "_":
                  style.sizes = [letterOuter]
                  drawModule(style, "hori", 3, 3, 0, 0, {extend: -1})
                  drawModule(style, "hori", 4, 4, 0, 0, {extend: -1})
                  sortIntoArray(style.spaceSpots, style.posFromLeft)
                  break;
               case "|":
                  style.sizes = [letterOuter]
                  style.stack = 1
                  drawModule(style, "vert", 1, 1, 0, 0, {})
                  drawModule(style, "vert", 4, 4, 0, 0, {})
                  style.stack = 0
                  drawModule(style, "vert", 1, 1, 0, 0, {})
                  drawModule(style, "vert", 4, 4, 0, 0, {})
                  break;
               case ".":
                  drawModule(style, "vert", 4, 4, 0, 0, {from: letterOuter*0.5 - (style.weight+0.5), noStretch: true})
                  break;
               case ",":
                  drawModule(style, "vert", 4, 4, 0, 0, {extend: descenders, from: letterOuter*0.5 - (style.weight+0.5), noStretch: true})
                  break;
               case "!":
                  // wip
                  style.stack = 1
                  drawModule(style, "vert", 1, 1, 0, 0, {})
                  drawModule(style, "vert", 4, 4, 0, 0, {})
                  style.stack = 0
                  drawModule(style, "vert", 1, 1, 0, 0, {})
                  drawModule(style, "vert", 4, 4, 0, 0, {extend: -style.weight-1.5})
                  drawModule(style, "vert", 4, 4, 0, 0, {from: letterOuter*0.5 - (style.weight+0.5), noStretch: true})
                  break;
               case "?":
                  // wip
                  style.stack = 1
                  drawModule(style, "round", 1, 1, 0, 0, {})
                  drawModule(style, "round", 2, 2, 0, 0, {})
                  drawModule(style, "round", 3, 3, 0, 0, {})
                  style.stack = 0
                  drawModule(style, "round", 1, 1, 0, 0, {})
                  drawModule(style, "vert", 4, 4, 0, 0, {from: letterOuter*0.5 - (style.weight+0.5), noStretch: true})
                  break;
               case " ":
                  sortIntoArray(style.spaceSpots, style.posFromLeft)
                  break;
               case "‸":
                  //caret symbol
                  style.opacity = 0.5
                  style.sizes = [letterOuter]
                  style.stack = 1
                  drawModule(style, "vert", 1, 1, 0, 0, {extend: animAscenders})
                  drawModule(style, "vert", 4, 4, 0, 0, {extend: animAscenders})
                  style.stack = 0
                  drawModule(style, "vert", 1, 1, 0, 0, {extend: animAscenders})
                  drawModule(style, "vert", 4, 4, 0, 0, {extend: animAscenders})
                  break;
               default:
                  style.opacity = 0.5
                  style.sizes = [letterOuter]
                  style.stack = 1
                  drawModule(style, "square", 1, 1, 0, 0, {})
                  drawModule(style, "square", 2, 2, 0, 0, {})
                  drawModule(style, "vert", 3, 3, 0, 0, {})
                  drawModule(style, "vert", 4, 4, 0, 0, {})
                  style.stack = 0
                  drawModule(style, "vert", 1, 1, 0, 0, {})
                  drawModule(style, "vert", 2, 2, 0, 0, {})
                  drawModule(style, "square", 3, 3, 0, 0, {})
                  drawModule(style, "square", 4, 4, 0, 0, {})
                  break;
            }
         }
      })()
   }

   if (midlineEffects.includes(effect)) {
      // style - the actual stroke color is changed inside the function
      noFill()
      strokeWeight((animWeight/10)*strokeScaleFactor)
      if (mode.xray) {
         strokeWeight(0.2*strokeScaleFactor)
      }
      // run for each stage
      if (font === "fontb") {
         push()
         translate(0, -animSize+(animRings-1)- animStretchY)
         //drawMidlineEffects(1, lineStyle.midlineSpots, lineStyle.caretSpots, lineStyle.spaceSpots)
         pop()
      }
      drawMidlineEffects(0, lineStyle.midlineSpots, lineStyle.caretSpots, lineStyle.spaceSpots)
   }

   function drawMidlineEffects (layer, midlineSpots, caretSpots, spaceSpots) {
      push()

      stroke(palette.fg)
      const stretchHeight = (font === "fontb") ? animStretchY*0.5 : animStretchY
      if (font === "fontb") {
         const layerDir = (layer > 0) ? 0.75 : 0.25
         translate(0, (Math.abs(animOffsetY) + animStretchY + animSpreadY)*layerDir)
      } else {
         translate(0, (Math.abs(animOffsetY) + animStretchY + animSpreadY)*0.5)
      }
      translate(0, lineNum * totalHeight[lineNum])

      //style and caret
      stroke(lerpColor(palette.bg, palette.fg, 0.5))
      rowLines("bezier", [caretSpots[0], caretSpots[0]+animOffsetX], animStretchY)
      stroke(palette.fg)

      for (let i = 0; i < midlineSpots[layer].length; i++) {

         //strokeWeight((animWeight/10)*strokeScaleFactor)
         //if (Math.floor(frameCount/20) % midlineSpots[layer].length !== i) strokeWeight(0.03)
         const singleSpreadFillSpots = midlineSpots[layer][i]

         const wordSpots = []
         let untilSpaceIndex = 0
         
            singleSpreadFillSpots.forEach((pos) => {
               const spaceSpot = spaceSpots[untilSpaceIndex] - animOffsetX*layer
               if (pos > spaceSpot && untilSpaceIndex < spaceSpots.length) {
                  // check in the next word now
                  untilSpaceIndex++
               }
               // for this word
               if (wordSpots[untilSpaceIndex] === undefined) {
                  wordSpots[untilSpaceIndex] = new Array
               }
               wordSpots[untilSpaceIndex].push(pos)
            })
         
         
         if (frameCount === 1) print("Line:", lineText, "Mid Connection Spots:", wordSpots)
         // show spaces
         //lineStyle.spaceSpots.forEach((pos) => {
         //   lineType(pos,5, pos, 7)
         //})

         wordSpots.forEach((word) => {
            let total = word.length-1
            const leftPos = word[0]
            const rightPos = word[total]
            let counter = 0
            let chainLength = 0
            let chainCount = 0
            let lastPos = undefined
            word.forEach((pos) => {
               if (lastPos !== undefined && lastPos >= pos-1) {
                  chainLength++
               } else {
                  chainLength = 0
                  chainCount++
               }

               if (effect === "spread") {
                  const midX = map(counter, 0, total, leftPos, rightPos) + animOffsetX*0.5
                  rowLines("bezier", [pos, midX, pos+animOffsetX], stretchHeight)
               } else if (effect === "compress") {
                  const midX = (rightPos - total + leftPos + animOffsetX)*0.5 + counter
                  rowLines("bezier", [pos, midX, pos+animOffsetX], stretchHeight)
               } else if (effect === "turn") {
                  //const midX = (counter < total/2) ? leftPos + counter: rightPos - (total-counter)
                  //rowLines("sharpbezier", [pos, midX, pos+animOffsetX], stretchHeight)
                  if (chainLength > 0) {
                     // diagonal
                     if (i %2 === 0) {
                        rowLines("bezier", [pos, lastPos+animOffsetX], stretchHeight)
                     } else {
                        rowLines("bezier", [lastPos, pos+animOffsetX], stretchHeight)
                     }
                     
                     //straight piece
                     if (chainLength === 1) {
                        rowLines("bezier", [lastPos, lastPos+animOffsetX], stretchHeight)
                     }
                  } else {
                     rowLines("bezier", [lastPos, lastPos+animOffsetX], stretchHeight)
                  }
                  if (pos == rightPos) {
                     rowLines("bezier", [pos, pos+animOffsetX], stretchHeight)
                  }
               } else if (effect === "split") {
                  if (counter > 0) {
                     rowLines("bezier", [pos, lastPos+animOffsetX], stretchHeight)
                     rowLines("bezier", [lastPos, pos+animOffsetX], stretchHeight)
                  }
               } else if (effect === "twist") {
                  if (counter % 2 === 1) {
                     rowLines("bezier", [pos, lastPos+animOffsetX], stretchHeight)
                     rowLines("bezier", [lastPos, pos+animOffsetX], stretchHeight)
                  } else if (counter === total) {
                     rowLines("bezier", [pos, pos+animOffsetX], stretchHeight)
                  }
               } else if (effect === "sway") {
                  if (counter > 0) {
                     rowLines("bezier", [pos, lastPos+animOffsetX], stretchHeight)
                  }
               } else if (effect === "teeth") {
                  if (counter % 2 === 1) {
                     const x = lastPos + (pos-lastPos)*0.5
                     const w = pos-lastPos
                     arc(x, -(stretchHeight)*0.5,w,w, 0, PI)
                  } else {
                     //bottom
                     const x = lastPos + (pos-lastPos)*0.5 +animOffsetX
                     const w = pos-lastPos
                     arc(x, (stretchHeight)*0.5,w,w, PI, TWO_PI)
                  }
               }
               lastPos = pos
               counter++
            })
         })
      }
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
         } else if (type === "sharpbezier") {
            const h1pos = (c % 2 == 0) ? lastPos.y : lastPos.y + (pos.y-lastPos.y)*1
            const h2pos = (c % 2 == 1) ? pos.y : lastPos.y + (pos.y-lastPos.y)*0
            bezier(lastPos.x, lastPos.y, lastPos.x, h1pos, pos.x, h2pos, pos.x, pos.y)
         }
      }
      lastPos = pos
   }
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
      //letterInner = waveInner(c, letterInner, letterOuter)

      const extendOffset = ((letterOuter % 2 == 0) ? 0 : 0.5) + ((animStretchX+animSpreadX)-((animStretchX+animSpreadX)%2))*0.5
      const isLastLetter = (c === charIndex)
      total += letterKerning(isLastLetter, prevchar, char, nextchar, animSpacing, letterInner, letterOuter, extendOffset)
   }
   return total
}





function letterKerning (isLastLetter, prevchar, char, nextchar, spacing, inner, outer, extendOffset) {
   const weight = (outer-inner)*0.5 + animSpreadX*0.5

   // negative spacing can't go past width of lines
   spacing = max(spacing, -weight)
   let optionalGap = map(inner, 1, 2, 0, 1, true)

   // spacing is used between letters that don't make a special ligature
   // some letters force a minimum spacing
   if (font === "fonta") {
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
   } else if (font === "fontb") {
      if (animRings <= 1) {
         if (("g".includes(char) && "abcdefghiklmnopqruvw".includes(nextchar))
            || ("i".includes(char) && "abcdefhiklnpruvwxz".includes(nextchar))
            || ("aghijkmnouvwxyz".includes(char) && "i".includes(nextchar))) {
            spacing = max(spacing, 1)
         }
      }
   }

   if ("|".includes(char)) spacing = max(spacing, 1)
   if ("|".includes(nextchar)) spacing = max(spacing, 1)

   // widths of letters without overlapping
   let charWidth = outer
   if (font === "fonta") {
      switch(char) {
         case "m":
         case "w":
            charWidth = weight*3 + inner*2
            break;
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
            } else {
               if (charInSet(prevchar,["gap"])) {
                  charWidth = weight*1 + inner -1
               }
            }
            break;
         case "z":
            charWidth = 2 + outer + waveValue(outer, 0, 1)
            if (charInSet(prevchar,["gap"])) {
               charWidth -= weight+1
            }
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
            charWidth = 1
            if (charInSet(nextchar,["gap"])) {
               charWidth = 0
            }
            break;
         case "|":
            charWidth = 0
            break;
      }
   } else if (font === "fontb") {
      switch(char) {
         case "m":
         case "w":
            charWidth = weight*3 + inner*2
            break;
         case "e":
         case "f":
            charWidth = outer-weight - 1
            break;
         case "c":
            if (charInSet(nextchar,["gap", "ul"])) {
               charWidth = outer-weight
            }
            break;
         case "t":
            charWidth = weight + inner*2 - 1
            break;
         case "l":
            if (charInSet(nextchar,["gap", "dl"])) {
               charWidth = outer-weight
            }
            break;
         case "‸":
            charWidth = 1
            if (charInSet(nextchar,["gap"])) {
               charWidth = 0
            }
            break;
         case "i":
         case ".":
         case ",":
         case "!":
            charWidth = weight
            break;
         case "j":
            charWidth = weight*1 + inner -1
            break;
         case " ":
            charWidth = max([2, spacing*2, ceil(inner*0.5)])
            break;
         case "|":
            charWidth = 0
            break;
      }
   }

   if (font === "fonta") {
      // 1 less space after letters with cutoff
      if ("ktlcrfsxz-".includes(char) 
         && charInSet(nextchar,["gap"]) 
         && !"|".includes(nextchar)) {
         charWidth -= 1
      }
      // 1 less space in front of letters with cutoff
      if ("xs-".includes(nextchar) 
         && charInSet(char,["gap"]) 
         && !"|".includes(char)) {
         charWidth -= 1
      }
   } else if (font === "fontb") {
      // 1 less space after letters with cutoff
      if ("cleft-".includes(char) 
         && charInSet(nextchar,["gap"]) 
         && !"|".includes(nextchar)) {
         charWidth -= 1
      }
      // 1 less space in front of letters with cutoff
      if ("jt-".includes(nextchar) 
         && charInSet(char,["gap"]) 
         && !"|".includes(char)) {
         charWidth -= 1
      }
   }

   let spacingResult = 0
   if (isLastLetter === false) {
      // overlap after letter, overwrites default variable spacing
      // only happens if it connects into next letter
      let spaceAfter = 0
      let afterConnect = false
      let minSpaceAfter
      if (font === "fonta") {
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
      } else if (font === "fontb") {
         switch(char) {
            case "t":
               minSpaceAfter = 0
               break;
            case "c":
               if (!charInSet(nextchar,["gap", "ul"])) {
                  spaceAfter = -weight
                  afterConnect = true
               } else {
                  minSpaceAfter = 0
               }
               break;
            case "l":
               if (!charInSet(nextchar,["gap", "dl"])) {
                  spaceAfter = -weight
                  afterConnect = true
               } else {
                  minSpaceAfter = 0
               }
               break;
            case "e":
            case "f":
               minSpaceAfter = 1
               break;
            case ".":
            case ",":
            case "!":
            case "?":
               if (!charInSet(nextchar,["gap"])) {
                  minSpaceAfter = 1
               }
         }
      }

      // depending on the next letter, adjust the spacing
      // only if the current letter doesn't already overlap with it
      let spaceBefore = 0
      let beforeConnect = false
      let minSpaceBefore
      if (afterConnect === false) {
         if (font === "fonta") {
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
         } else if (font === "fontb") {
            switch(nextchar) {
               case "j":
                  if (charInSet(char,["dr"])) {
                     spaceBefore = 1
                     beforeConnect = true
                  }
                  minSpaceBefore = 1
                  break;
               case "t":
                  minSpaceBefore = 1
                  break;
               case ",":
               case ".":
               case "!":
               case "?":
                  minSpaceBefore = 1
                  break;
            }
         }
      }

      //extra special combinations
      if (font === "fonta") {
         if ("ktlcrfsxz".includes(char) && nextchar === "s") {
            spaceBefore = -inner-weight-animStretchX
            beforeConnect = true
         }
         else if ("ktlcrfsx".includes(char) && nextchar === "x") {
            spaceBefore = -inner-weight-animStretchX
            beforeConnect = true
         }
         else if ("ktlcrfsxz".includes(char) && nextchar === "j") {
            spaceBefore = -inner-weight-animStretchX
            beforeConnect = true
         }
         else if ("sr".includes(char) && nextchar === "z") {
            spaceBefore = -inner-weight-animStretchX
            beforeConnect = true
         }
         else if ("ltkcfx".includes(char) && nextchar === "z") {
            //spaceBefore = -inner-weight+outer/2//-waveValue(outer, 0, 1)//-weight-2//-animStretchX
            spaceBefore = weight -outer/2 - animStretchX/2
            beforeConnect = true
            //-i-w+(o/2) //-o+i+2w
            //w-0.5o
         }
         else if ("z".includes(char) && nextchar === "z") {
            spaceBefore = -2-animStretchX
            beforeConnect = true
         }
         else if ("z".includes(char) && nextchar === "x") {
            spaceBefore = weight -outer/2 - animStretchX/2
            beforeConnect = true
         }
      } else if (font === "fontb") {
         if ("lct".includes(char) && "tj".includes(nextchar)) {
            spaceBefore = -outer+weight*2+1-animStretchX
            beforeConnect = true
         }
         if ("ef".includes(char) && "tj".includes(nextchar)) {
            spaceBefore = -outer+weight*2+2-animStretchX
            beforeConnect = true
         }
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
         } else if ("‸".includes(nextchar)){
            // other punctuation?
            spacingResult = charWidth + 1
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
   if (font === "fonta") {
      switch (char) {
         case "s": 
            if (!mode.altS) {
               if (charInSet(prevchar,["gap", "dr"])) {
                  stretchWidth = extendOffset
               } else {
                  stretchWidth = (animStretchX+animSpreadX)
               }
               if (charInSet(nextchar,["gap", "ul"])) {
                  stretchWidth += extendOffset
               } else {
                  stretchWidth += (animStretchX+animSpreadX)
               }
            }
            break;
         case "m":
         case "w":
         case "x":
         case "z":
            stretchWidth = (animStretchX) * 2
            break;
         case "i":
         case ".":
         case ",":
         case "!":
         case " ":
         case "‸": //caret
            stretchWidth = 0
            break;
         default:
            stretchWidth = (animStretchX+animSpreadX)
      }
   } else if (font === "fontb") {
      switch (char) {
         case "m":
         case "w":
         case "t":
            stretchWidth = (animStretchX+animSpreadX) * 2
            break;
         case "i":
         case ".":
         case ",":
         case "!":
         case " ":
         case "‸": //caret
            stretchWidth = 0
            break;
         default:
            stretchWidth = (animStretchX+animSpreadX)
      }
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
   // WIP
   // for (let i = 0.1; i <= 1; i+=0.1) {
   //    const partialX = x1+(x2-x1)*i
   //    const partialY = y1+(y2-y1)*i
   //    stroke("#FFFFFF30")
   //    line(x1, y1, partialX, partialY)
   // }
   line(x1, y1, x2, y2)
}

function arcType (x, y, w, h, start, stop, layer) {
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
   if (layer !== undefined) {
      layer.arc(x, y, w, h, start, stop);
      return}
   //wip
   // WIP
   // for (let i = 0.1; i <= 1; i+=0.1) {
   //    const partialStop = start+(stop-start)*i
   //    stroke("#FFFFFF30")
   //    arc(x, y, w, h, start, partialStop)
   // }
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

   //if it was staircase, remove offset
   if (effect === "staircase") values.offsetX.from = 0

   switch (text) {
      case "Font A (2x2)":
         font = "fonta"
         print("Switched to Font A")
         break;
      case "Font B (3x2)":
         font = "fontb"
         print("Switched to Font B")
         break;
      case "weight gradient":
         effect = "weightgradient"
         break;
      case "color gradient":
         effect = "gradient"
         if (values.rings.from < 2) values.rings.to = 2 
         break;
      case "vertical stripes bg":
         effect = "vstripes"
         break;
      case "horizontal stripes bg":
         effect = "hstripes"
         break;
      case "stretch compress":
         effect = "compress"
         if (values.stretchY.from < 1) values.stretchY.to = Math.ceil(values.size.from/2)
         break;
      case "stretch turn":
         effect = "turn"
         if (values.stretchY.from < 1) values.stretchY.to = Math.ceil(values.size.from/2)
         break;
      case "stretch spread":
         effect = "spread"
         if (values.stretchY.from < 1) values.stretchY.to = values.size.from
         break;
      case "stretch sway":
         effect = "sway"
         if (values.stretchY.from < 1) values.stretchY.to = Math.ceil(values.size.from/2)
         break;
      case "stretch twist":
         effect = "twist"
         if (values.stretchY.from < 1) values.stretchY.to = Math.ceil(values.size.from/2)
         break;
      case "stretch split":
         effect = "split"
         if (values.stretchY.from < 1) values.stretchY.to = Math.ceil(values.size.from/2)
         break;
      case "stretch teeth":
         effect = "teeth"
         if (values.stretchY.from < 1) values.stretchY.to = Math.ceil(values.size.from/2)
         break;
      case "spheres (test)":
         effect = "spheres"
         break;
      case "staircase":
         effect = "staircase"
         if (values.offsetX.from !== 0) values.offsetX.from = 0
         values.offsetX.to = 1
         break;
      default:
         effect = "none"
   }

   writeToURL()
   updateInGUI()

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

   insertNumber = roundTo(insertNumber,1000)

   //from the end
   for (let a = array.length-1; a >= 0; a--) {
      const existingNumber = roundTo(array[a],1000)

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

function waveValue(input, low, high) {
   return (-0.5*Math.cos(input*PI)+0.5)*(high-low)+low
}



function drawModule (style, shape, arcQ, offQ, tx, ty, shapeParams) {

   noFill()

   // useful numbers
   const INNERSIZE = style.sizes[style.sizes.length-1]
   const OUTERSIZE = style.sizes[0]
   const spreadXScale = (style.spreadX/2) / (style.weight) /2
   const spreadYScale = (style.spreadY/2) / (style.weight) /2

   const SPREADX = style.spreadX
   const SPREADY = style.spreadY
   const STRETCHX = style.stretchX
   const STRETCHY = style.stretchY
   const PLUSX = STRETCHX + SPREADX
   const PLUSY = STRETCHY + SPREADY

   // position
   const basePos = {
      x: style.posFromLeft + tx + (OUTERSIZE/2),
      y: style.posFromTop + ty
   }
   //based on quarter
   const bottomHalf = (offQ === 3 || offQ === 4) ? 1:0
   const rightHalf = (offQ === 2 || offQ === 3) ? 1:0
   // offset based on quarter and previous vertical offset
   basePos.x += bottomHalf * style.offsetX
   basePos.y += (style.vOffset+rightHalf) *style.offsetY //% 2==0 ? style.offsetY : 0
   // offset based on quarter and stretch
   basePos.x += rightHalf * PLUSX
   basePos.y += bottomHalf * PLUSY * ((font === "fontb") ? 0.5 : 1)
   // modify based on stack (top half)
   basePos.y -= style.stack * (OUTERSIZE - style.weight + PLUSY * 0.5)
   // modify based on offset
   if (effect !== "staircase") basePos.x -= style.stack * style.offsetX


   ;(function drawModuleBG() {
      if (webglEffects.includes(effect)) return
      if (style.sizes.length <= 1) return
      if (style.weight <= 0) return
      if (!mode.drawFills) return

      // old corner fill requirements:
      // ! ((smallest <= 2 || letterOuter+2 <= 2) && noSmol)

      let palettePickBg = palette.bg
      if (mode.xray) {
         if (shape === "vert" || shape === "hori") {
            palettePickBg = palette.xrayBg
         } else {
            palettePickBg = palette.xrayBgCorner
         }
      }

      // fill style
      stroke(palettePickBg)
      strokeWeight(style.weight*strokeScaleFactor)
      strokeCap(SQUARE)
      strokeJoin(MITER)

      // draw fill for moduleonce
      drawSinglePathOfModule(INNERSIZE+style.weight, "bg", 0, 0)

      // only keep going if there are more fills to draw, shifted inwards
      if (SPREADY <= 0) return
      if (shapeParams.noStretchY) return
      if (shapeParams.noStretch) return

      if (font === "fonta" || ((bottomHalf===0 && style.stack === 1) || (bottomHalf===1 && style.stack===0))){
         let outerSpreadY = -(OUTERSIZE-INNERSIZE)*spreadYScale
         for (let betweenStep = 0; betweenStep > outerSpreadY; betweenStep-=style.weight) {
            drawSinglePathOfModule(INNERSIZE+style.weight, "bg", 0, betweenStep)
         }
         drawSinglePathOfModule(INNERSIZE+style.weight, "bg", 0, outerSpreadY)
      }
   })()

   // foreground colors
   let INNERCOLOR = lerpColor(palette.fg,palette.bg,(effect==="gradient") ? 0.5 : 0)
   if (mode.xray) {
      if (shape === "hori" || shape === "vert") {
         INNERCOLOR = palette.xrayFg
      } else {
         INNERCOLOR = palette.xrayFgCorner
      }
   }
   const OUTERCOLOR = palette.fg

   ;(function drawModuleFG() {
      // draw the foreground
      strokeCap(ROUND)
      strokeJoin(ROUND)
      strokeWeight((style.stroke/10)*strokeScaleFactor)
      if (mode.xray) {strokeWeight(0.2*strokeScaleFactor)}

      style.sizes.forEach((size) => {
         let outerSpreadY = 0
         let outerSpreadX = 0
         if (SPREADY > 0 && style.weight > 0 && shapeParams.noStretchY === undefined && shapeParams.noStretch === undefined) {
            if (font === "fonta" || ((bottomHalf===0 && style.stack === 1) || (bottomHalf===1 && style.stack===0))){
               outerSpreadY = -(OUTERSIZE-size)*spreadYScale
            }
         }
         if (SPREADX > 0 && style.weight > 0 && shapeParams.noStretchX === undefined && shapeParams.noStretch === undefined) {
            outerSpreadX = -(OUTERSIZE-size)*spreadXScale
         }
         drawSinglePathOfModule(size, "fg", outerSpreadX, outerSpreadY)
      })
   })()



   function drawSinglePathOfModule(size, layer, outerSpreadX, outerSpreadY) {

      // relevant for any module:

      if (layer === "fg") {
         // style may differ per ring if it's in the foreground
         // gradient from inside to outside - color or weight
         ringStyle(size, INNERSIZE, OUTERSIZE, INNERCOLOR, OUTERCOLOR, style.flipped, arcQ, offQ, style.opacity, style.stroke)
      }
      // get orientations in both axes
      const sideX = (arcQ === 1 || arcQ === 4) ? -1 : 1
      const sideY = (arcQ === 1 || arcQ === 2) ? -1 : 1


      // specific modules:

      if (shape === "vert" || shape === "hori") {

         // first determine without needing to know direction
         const LINE_FROM = shapeParams.from || 0
         const LINE_EXTEND = shapeParams.extend || 0
         const LINE_ADJUST = (() => {
            if (layer === "fg") return 0
            // so it looks nicer on grid backgrounds, etc...
            if (mode.xray) return 0.2 * strokeScaleFactor *-0.5
            return style.weight/10 *-0.5
         })()

         const lineStart = LINE_FROM === 0 ? 0 : LINE_FROM - LINE_ADJUST
         const lineEnd = OUTERSIZE*0.5 + LINE_EXTEND + LINE_ADJUST

         const linePos = {
            x1: basePos.x,
            x2: basePos.x,
            y1: basePos.y,
            y2: basePos.y
         }

         pickLineModule(linePos, 0, 0, 0)

         // fill spread effect
         if (layer === "fg" && mode.spreadFills && size !== OUTERSIZE && (outerSpreadY !== 0 || outerSpreadX !== 0) && style.weight >= 1) {
            for (let i = 1; i <= style.spreadFillSteps; i++) {
               let fillStep = (i/style.spreadFillSteps) * 2
               let movedPosX = ((SPREADX > 0 && shape === "vert") ? spreadXScale*fillStep*sideX : 0)
               let movedPosY = ((SPREADY > 0 && shape === "hori") ? spreadYScale*fillStep*sideY : 0)
               pickLineModule({
                  x1: basePos.x + movedPosX, x2: basePos.x + movedPosX, y1: basePos.y + movedPosY, y2: basePos.y + movedPosY
               }, movedPosX, movedPosY, ((SPREADX>0)? i:0))
               if (SPREADX > 0) {
                  pickLineModule({
                     x1: basePos.x + movedPosX, x2: basePos.x + movedPosX, y1: basePos.y + movedPosY, y2: basePos.y + movedPosY
                  }, movedPosX, movedPosY, i)
               }
            }
         }

         function pickLineModule(linePos, spreadFillStepX, spreadFillStepY, fillIndexX) {
            switch (shape) {
               case "hori":
                  drawHorizontalModule(linePos, spreadFillStepX, spreadFillStepY, fillIndexX)
                  break;
               case "vert":
                  drawVerticalModule(linePos, spreadFillStepX, spreadFillStepY, fillIndexX)
                  break;
            }
         }

         function drawVerticalModule(linePos, spreadFillStepX, spreadFillStepY, fillIndexX) {
            linePos.x1 += sideX * (size * 0.5 + outerSpreadX)
            linePos.x2 += sideX * (size * 0.5 + outerSpreadX)
            linePos.y1 += sideY * (lineStart + outerSpreadY)
            linePos.y2 += sideY * lineEnd

            //only draw the non-stretch part if it is long enough to be visible
            if (sideY*(linePos.y2-linePos.y1)>=0) {
               lineType(linePos.x1, linePos.y1 , linePos.x2 , linePos.y2)
            }

            if (PLUSY > 0 && LINE_FROM === 0) {
               if (STRETCHY > 0) drawStretchLines("stretch", sideX, sideY, "vert", spreadFillStepX, spreadFillStepY, fillIndexX)
               if (SPREADY > 0) drawStretchLines("spread", sideX, sideY, "vert", spreadFillStepX, spreadFillStepY, fillIndexX)
            }
         }

         function drawHorizontalModule(linePos, spreadFillStepX, spreadFillStepY, fillIndexX) {
            linePos.y1 += sideY * (size * 0.5 + outerSpreadY)
            linePos.y2 += sideY * (size * 0.5 + outerSpreadY)
            linePos.x1 += sideX * (lineStart + outerSpreadX)
            linePos.x2 += sideX * lineEnd

            //only draw the non-stretch part if it is long enough to be visible
            if (sideX*(linePos.x2-linePos.x1)>=0) {
               lineType(linePos.x1, linePos.y1, linePos.x2, linePos.y2)
            }

            if (PLUSX > 0 && LINE_FROM === 0) {
               if (STRETCHX > 0) drawStretchLines("stretch", sideX, sideY, "hori", spreadFillStepX, spreadFillStepY, 0)
               if (SPREADX > 0) drawStretchLines("spread", sideX, sideY, "hori", spreadFillStepX, spreadFillStepY, 0)
            }
         }

      } else { // CORNER

         let xpos = basePos.x
         let ypos = basePos.y

         const isCutVertical = (shapeParams.at === "end" && arcQ%2===1 || shapeParams.at === "start" && arcQ%2===0)
         const isCutHorizontal = (shapeParams.at === "end" && arcQ%2===0 || shapeParams.at === "start" && arcQ%2===1)

         if (shapeParams.type === "linecut" && font === "fonta") {
            // move corner inwards vertically if it's cut and facing to middle
            if (isCutVertical && SPREADY > 0) {
               outerSpreadY = 0
               ypos -= sideY*SPREADY/2
            }
            // move corner inwards horizontally if it's cut and facing to middle in font a
            if (isCutHorizontal && SPREADX > 0) {
               outerSpreadX = 0
               xpos -= sideX*SPREADX/2
            }
         }

         pickCornerModule(xpos, ypos, 0, 0, 0)

         // offset effect
         if (layer === "fg" && mode.spreadFills && size !== OUTERSIZE && (outerSpreadY !== 0 || outerSpreadX !== 0) && style.weight >= 1) {
            for (let i = 1; i <= style.spreadFillSteps; i++) { // dont draw first step again
               let fillStep = (i/style.spreadFillSteps) * 2
               let fillOffsetX = (SPREADX > 0) ? spreadXScale*fillStep*sideX : 0
               let fillOffsetY = (SPREADY > 0) ? spreadYScale*fillStep*sideY : 0
               pickCornerModule(xpos + fillOffsetX, ypos + fillOffsetY, fillOffsetX, fillOffsetY, ((SPREADX>0)? i:0))
               if (SPREADX > 0) {
                  pickCornerModule(xpos, ypos, fillOffsetX, fillOffsetY, i)
               }
            }
         }

         function pickCornerModule(xpos, ypos, spreadFillStepX, spreadFillStepY, fillIndexX) {
            switch (shape) {
               case "round":
                  drawRoundModule(xpos, ypos, spreadFillStepX, spreadFillStepY)
                  break;
               case "diagonal":
                  drawDiagonalModule(xpos, ypos, spreadFillStepX, spreadFillStepY)
                  break;
               case "square":
                  drawSquareModule(xpos, ypos, spreadFillStepX, spreadFillStepY)
                  break;
               default:
                  print(shape + " is not a valid shape!")
                  break;
            }
            //drawCornerFillCaps(xpos, ypos, spreadFillStepX, spreadFillStepY) //WIP BROKEN/USELESS?
            drawCornerStretch(xpos, ypos, spreadFillStepX, spreadFillStepY, fillIndexX) // UHHH DOESN"T ACTUALLY MAKE COPIES
         }


         function drawRoundModule(xpos, ypos, spreadFillStepX, spreadFillStepY) {

            // angles
            let startAngle = PI + (arcQ-1)*HALF_PI
            let endAngle = startAngle + HALF_PI

            let drawCurve = true // gets updated in function
            let cutDifference = shortenAngleBy()


            function shortenAngleBy() {
               let cutDifference = 0

               function arcUntilLineAt (y) {
                  const altValue = HALF_PI
                  //if too close
                  if (y <= 0) {
                     return altValue
                  }
                  const x = Math.sqrt(size**2 - y**2)
                  const dangerousOverlap = ((size - x) < 0.6)
                  const inNextLetter = (size >= (OUTERSIZE + animSpacing*2))
                  if (dangerousOverlap && isCutVertical && inNextLetter) {
                     // might have to be removed
                     //but depends on what letter is adjacent
                     if (font === "fonta") {
                        // only really matters for e
                        if (charInSet(style.nextLetter, ["ml"]) && rightHalf === 1) return 0
                     } else if (font === "fontb") {
                        // matters for s,z,y
                        if (charInSet(style.nextLetter, ["ml"]) && rightHalf === 1) return 0
                        if (charInSet(style.prevLetter, ["mr"]) && rightHalf === 0) return 0
                     }
                  }
                  const theta = (Math.atan2(y, x));
                  return {angle: theta, position: x/2}
               }
               function arcUntilArc (sizeCircle, sizeOther, dist) {
                  //if too close
                  // if (da <= 2 || db <= 2) {
                  //    return altValue
                  // }
                  
                  const altValue = HALF_PI
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


               if (shapeParams.type === "linecut") {

                  if (INNERSIZE-2 <= 0 && shapeParams.alwaysCut) {
                     drawCurve = false
                  }
                  if (layer === "fg") {
                     let overlapWeight = INNERSIZE
                     // wip - inside e
                     if (outerSpreadY !== 0 && isCutVertical) overlapWeight = INNERSIZE + outerSpreadY + style.stretchY/2
                     // wip - inside a
                     if (outerSpreadX !== 0 && isCutHorizontal) overlapWeight = INNERSIZE + outerSpreadX + style.stretchX/2

                     cutDifference = HALF_PI-arcUntilLineAt(overlapWeight-2).angle

                     //now draw the straight line if spread fill
                     if (mode.spreadFills) {
                        //vertical
                        if (outerSpreadY !== 0 && spreadFillStepY === 0) {
                           const fHeight = (SPREADY*0.5) / style.weight
                           const offsetY = -Math.abs(outerSpreadY) + arcUntilLineAt(overlapWeight-2).position
                           const distance = INNERSIZE/2 - 1
                           line(xpos+distance, ypos+(offsetY)*sideY, xpos+distance, ypos+(offsetY+fHeight)*sideY)
                        }

                        //horizontal
                        if (outerSpreadX !== 0 && spreadFillStepX === 0) {
                           const fWidth = (SPREADX*0.5) / style.weight
                           const offsetX = -Math.abs(outerSpreadX) + arcUntilLineAt(overlapWeight-2).position
                           const distance = INNERSIZE/2 - 1
                           line(xpos+(offsetX)*sideX, ypos+distance, xpos+(offsetX+fWidth)*sideX, ypos+distance)
                        }
                     }
                  }

               } else if (shapeParams.type === "roundcut") {

                  if ((INNERSIZE <= 2 || OUTERSIZE+2 <= 2) && shapeParams.alwaysCut) {
                     drawCurve = false
                  }
                  if (layer === "fg" && INNERSIZE > 2) {

                     let heightDistance = Math.abs(outerSpreadY)-spreadFillStepY*sideY

                     if (heightDistance > arcUntilLineAt(INNERSIZE-2).position) {
                        // use if far enough inside letter
                        cutDifference = HALF_PI-arcUntilLineAt(INNERSIZE-2).angle
                     } else {
                        // use round cut
                        let circleDistance = INNERSIZE+style.weight - (SPREADX/2-Math.abs(outerSpreadX))

                        // adjust angle to account for this diagonal because of spread...
                        // if the circles are vertically offset, get the proper distance of the diagonal
                        let rotationAngle = atan(heightDistance / circleDistance)
                        circleDistance = Math.sqrt(circleDistance**2 + heightDistance**2)
                        // get the result
                        cutDifference = HALF_PI-arcUntilArc(size, OUTERSIZE+2, circleDistance) + rotationAngle
                     }
                  }
               }
               return cutDifference
            }


            // pick which end to cut
            if (shapeParams.at === "start") {
               startAngle += cutDifference
            } else if (shapeParams.at === "end") {
               endAngle -= cutDifference
            }

            // draw the line (until the cut angle if foreground)
            if (drawCurve) {

               if (layer === "fg" || shapeParams.type === undefined || shapeParams.type === "extend") {

                  // basic curve for lines, shortened if needed
                  arcType(xpos + outerSpreadX*sideX, ypos + outerSpreadY*sideY,size,size,startAngle,endAngle)

               } else if (layer === "bg" && (mode.svg || mode.xray || stripeEffects.includes(effect))) {

                  // background segment with cutoff is displayed as an image instead
                  // this only happens in svg mode or while xray view is on
                  // slow, try to optimize...

                  const layerGroup = (shapeParams.type === "linecut") ? fillCornerLayers.linecut : fillCornerLayers.roundcut
                  if (layerGroup[size] === undefined) {
                     layerGroup[size] = createGraphics((size)*animZoom, (size)*animZoom)
                     if (mode.xray) layerGroup[size].background((mode.dark) ? "#FFFFFF20" : "#00000010")
                     layerGroup[size].scale(animZoom)
                     layerGroup[size].noFill()
                     layerGroup[size].stroke((mode.xray) ? palette.xrayBgCorner : palette.bg)
                     layerGroup[size].strokeCap(SQUARE)
                     layerGroup[size].strokeWeight(style.weight*strokeScaleFactor)
                     arcType(size,size,size,size,HALF_PI*2,HALF_PI*3, layerGroup[size])
                     if (shapeParams.type === "linecut") {
                        for (let x = 0; x < size*animZoom; x++) {
                           const lineUntil = (size+style.weight)*0.5+1+(style.stroke/10)*0.5
                           for (let y = 0; y < lineUntil*animZoom; y++) {
                              layerGroup[size].set(x, y, color("#00000000"))
                           }
                        }
                     } else {
                        layerGroup[size].erase()
                        const gap = 1-(style.stroke/10)*0.5
                        layerGroup[size].strokeWeight((style.weight+gap*2)*strokeScaleFactor)
                        layerGroup[size].ellipse(size, 0, size, size)
                     }
                     layerGroup[size].updatePixels()
                  }
                  push()
                  translate(xpos, ypos)
                  if (arcQ === 2) {rotate(HALF_PI)}
                  else if (arcQ === 3) {rotate(HALF_PI*2)}
                  else if (arcQ === 4) {rotate(HALF_PI*3)}
                  if (shapeParams.at === 'start') {scale(-1,1); rotate(HALF_PI)}
                  image(layerGroup[size], -size, -size, size, size);
                  pop()
               }
            }
         }

         function drawSquareModule(xpos, ypos, spreadFillStepX, spreadFillStepY) {

            if (shapeParams.type === "branch" && layer === "fg") {
               let branchAxis = ((arcQ % 2 === 1) === (shapeParams.at === "start")) ? "hori" : "vert"

               // for triangle of lines that branches off
               let branchLengthX = size + outerSpreadX*2
               let revSizeX = OUTERSIZE+INNERSIZE-size
               let branchLengthY = size + outerSpreadY*2
               let revSizeY = OUTERSIZE+INNERSIZE-size

               if ((size) > (OUTERSIZE+INNERSIZE)/2) {
                  branchLengthX = revSizeX
                  branchLengthY = revSizeY
                  // WIP, this is not affected by spread right now...
               }

               // side bit, not in branch direction
               const baseX = xpos+sideX*(size/2+outerSpreadX)
               const baseY = ypos+sideY*(size/2+outerSpreadY)
               if (branchAxis === "vert") {
                  lineType(xpos+outerSpreadX*sideX, baseY, xpos+sideX*branchLengthX/2, baseY)
               } else {
                  lineType(baseX, ypos+outerSpreadY*sideY, baseX, ypos+sideY*branchLengthY/2)
               }
               
               if (branchAxis === "vert") {
                  if (size < (OUTERSIZE+INNERSIZE)/2) {
                     //from outside
                     if (SPREADY === 0) {
                        lineType(baseX, ypos+OUTERSIZE/2*sideY, baseX, ypos+sideY*(OUTERSIZE/2 + (OUTERSIZE-revSizeY)/-2))
                     }
                     if (Math.abs(outerSpreadY) !== SPREADY/2) {
                        branchLengthY =  OUTERSIZE/2 + (OUTERSIZE-revSizeY)/-2 + map(outerSpreadY, 0, -SPREADY/2, -SPREADY/2, 0)
                        lineType(baseX, ypos+OUTERSIZE/2*sideY, baseX, ypos+sideY*(branchLengthY))
                     }
                     // from inside
                     branchLengthY =  OUTERSIZE/2 + (OUTERSIZE-size)/-2 + outerSpreadY
                     lineType(baseX, ypos+outerSpreadY*sideY, baseX, ypos+sideY*(branchLengthY))

                  } else {
                     // outer rings
                     lineType(baseX, ypos+outerSpreadY*sideY, baseX, ypos+sideY*(OUTERSIZE/2))
                  }
               } else if (branchAxis === "hori") {
                  if (size < (OUTERSIZE+INNERSIZE)/2) {
                     //from outside
                     if (SPREADX === 0) {
                        lineType(xpos+OUTERSIZE/2*sideX, baseY, xpos+sideX*(OUTERSIZE/2 + (OUTERSIZE-revSizeX)/-2), baseY)
                     }
                     if (Math.abs(outerSpreadX) !== SPREADX/2) {
                        branchLengthX =  OUTERSIZE/2 + (OUTERSIZE-revSizeX)/-2 + map(outerSpreadX, 0, -SPREADX/2, -SPREADX/2, 0)
                        lineType(xpos+OUTERSIZE/2*sideX, baseY, xpos+sideX*(branchLengthX), baseY)
                     }
                     // from inside
                     branchLengthX =  OUTERSIZE/2 + (OUTERSIZE-size)/-2 + outerSpreadX
                     lineType(xpos+outerSpreadX*sideX, baseY, xpos+sideX*(branchLengthX), baseY)
                  } else {
                     // outer rings
                     lineType(xpos+outerSpreadX*sideX, baseY, xpos+sideX*(OUTERSIZE/2), baseY)
                  }
               }

            } else {

               // regular square corner
               beginShape()
               vertex(xpos+sideX*size/2+outerSpreadX*sideX, ypos+outerSpreadY*sideY)
               vertex(xpos+sideX*size/2+outerSpreadX*sideX, ypos+sideY*size/2+outerSpreadY*sideY)
               vertex(xpos+outerSpreadX*sideX, ypos+sideY*size/2+outerSpreadY*sideY)
               endShape()
            }
         }

         function drawDiagonalModule(xpos, ypos, spreadFillStepX, spreadFillStepY) {

            const step = (size-INNERSIZE)/2 + 1
            const stepslope = step*tan(HALF_PI/4)
            let xPoint = createVector(xpos+sideX*size/2,ypos+sideY*stepslope)
            let yPoint = createVector(xpos+sideX*stepslope, ypos+sideY*size/2)

            if (layer === "fg") {
               if (shapeParams.type === "linecut" && ((OUTERSIZE-INNERSIZE)/2+1)*tan(HALF_PI/4) < INNERSIZE/2-2) {
                  let changeAxis = ""
                  if (shapeParams.at === "start") {
                     changeAxis = (arcQ === 1 || arcQ === 3) ? "x" : "y"
                  } else if (shapeParams.at === "end") {
                     changeAxis = (arcQ === 1 || arcQ === 3) ? "y" : "x"
                  }
                  if (changeAxis === "x") {
                     xPoint.x = xpos+sideX*(OUTERSIZE/2 -style.weight -1)
                     xPoint.y = yPoint.y - (OUTERSIZE/2 - style.weight -1) + sideY*stepslope
                     lineType(xpos+outerSpreadX*sideX, yPoint.y+outerSpreadY*sideY, yPoint.x+outerSpreadX*sideX, yPoint.y+outerSpreadY*sideY)
                  } else if (changeAxis === "y") {
                     yPoint.y = ypos+sideY*(OUTERSIZE/2 -style.weight -1)
                     yPoint.x = xPoint.x - (OUTERSIZE/2 - style.weight -1) + sideX*stepslope
                     lineType(xPoint.x+outerSpreadX*sideX, ypos+outerSpreadY*sideY, xPoint.x+outerSpreadX*sideX, xPoint.y+outerSpreadY*sideY)
                  }
                  lineType(xPoint.x+outerSpreadX*sideX, xPoint.y+outerSpreadY*sideY, yPoint.x+outerSpreadX*sideX, yPoint.y+outerSpreadY*sideY)
               } else {
                  lineType(xPoint.x+outerSpreadX*sideX, xPoint.y+outerSpreadY*sideY, yPoint.x+outerSpreadX*sideX, yPoint.y+outerSpreadY*sideY)
                  if (step > 0) {
                     lineType(xPoint.x+outerSpreadX*sideX, ypos+outerSpreadY*sideY, xPoint.x+outerSpreadX*sideX, xPoint.y+outerSpreadY*sideY)
                     lineType(xpos+outerSpreadX*sideX, yPoint.y+outerSpreadY*sideY, yPoint.x+outerSpreadX*sideX, yPoint.y+outerSpreadY*sideY)
                  }
               }
            } else {
               beginShape()
               vertex(xpos+sideX*size/2+outerSpreadX*sideX, ypos+outerSpreadY*sideY)
               vertex(xpos+sideX*size/2+outerSpreadX*sideX, ypos+sideY*stepslope+outerSpreadY*sideY)
               vertex(xpos+sideX*stepslope+outerSpreadX*sideX, ypos+sideY*size/2+outerSpreadY*sideY)
               vertex(xpos+outerSpreadX*sideX, ypos+sideY*size/2+outerSpreadY*sideY)
               endShape()
            }
         }

         // stretch
         function drawCornerStretch(xpos, ypos, spreadFillStepX, spreadFillStepY, fillIndexX) {

            // cut in direction of stretch?
            function isCutInDir (type, dir) {

               if (type === undefined) return false
               if (type === "branch") return false
               //if (type === "extend") return false

               const cutX = (arcQ % 2 === 0) === (shapeParams.at === "start")
               return ((dir === "x") === cutX)
            }

            if (shapeParams.noStretchX === undefined && !isCutInDir(shapeParams.type, "x") && (layer === "fg" || outerSpreadX===0)) {

               if (font === "fonta" && !(shapeParams.type === "linecut" && isCutHorizontal) || font === "fontb") {
                  if (SPREADX > 0) drawStretchLines("spread", sideX, sideY, "hori", spreadFillStepX, spreadFillStepY, 0)
               }
               if (STRETCHX > 0) drawStretchLines("stretch", sideX, sideY, "hori", spreadFillStepX, spreadFillStepY, 0)

            }

            if (shapeParams.noStretchY === undefined && !isCutInDir(shapeParams.type, "y") && (layer === "fg" || outerSpreadY===0)) {

               // round shapes should get vertical spread effect, unless...
               if (font === "fonta" && !(shapeParams.type === "linecut" && isCutVertical) || font === "fontb") {
                  if (SPREADY > 0) drawStretchLines("spread",sideX, sideY, "vert", spreadFillStepX, spreadFillStepY, fillIndexX)
               }
               if (STRETCHY > 0) drawStretchLines("stretch",sideX, sideY, "vert", spreadFillStepX, spreadFillStepY, fillIndexX)

            }

            const extendamount = ((OUTERSIZE % 2 == 0) ? 0 : 0.5) + (style.stretchX-(style.stretchX%2))*0.5
            if (shapeParams.type === "extend" && extendamount > 0) {
               const toSideX = (arcQ === 1 || arcQ === 2) ? -1 : 1
               let extendXPos = xpos
               let extendYPos = ypos + (size*0.5 + outerSpreadY)*toSideX
               const dirX = (arcQ === 1 || arcQ === 4) ? 1 : -1
               lineType(extendXPos, extendYPos, extendXPos + dirX*extendamount, extendYPos)
            }
         }

         // other corner shapes...
      }

      function drawStretchLines (stretchMode, sideX, sideY, axis, spreadFillStepX, spreadFillStepY, fillIndexX) {

         if (font === "fontb" && axis === "vert") {
            if (style.stack === 1 && sideY === 1 || style.stack === 0 && sideY === -1) return
         }

         // separate xray color
         if (stretchMode === "stretch" && mode.xray && layer=== "bg") {
            if (shape === "vert" || shape === "hori") {
               stroke(palette.xrayStretch)
            } else {
               stroke(palette.xrayStretchCorner)
            }
         }

         const sPos = {
            x: basePos.x,
            y: basePos.y,
         }

         if (axis === "hori") {
            sPos.y += sideY * (size * 0.5 + outerSpreadY + SPREADY/2) + spreadFillStepY

            if (stretchMode === "stretch") {
               sPos.x -= sideX * SPREADX/2
               sPos.y -= sideY * SPREADY/2
               const stretchDifference = -sideX * style.stretchX * 0.5

               // the offset can be in between the regular lines vertically if it would staircase nicely
               let offsetShift = 0
               let stairDir = (style.vOffset+(offQ === 2 || offQ === 3) ? 1:0) % 2===0 ? -1 : 1
               if (Math.abs(style.offsetY) >2 && Math.abs(style.offsetY) <4) {
                  offsetShift = (style.offsetY/3)*stairDir
               } else if (Math.abs(style.offsetY) >1 && Math.abs(style.offsetY)<3) {
                  offsetShift = (style.offsetY/2)*stairDir
               }

               // draw
               lineType(sPos.x+stretchDifference, sPos.y+offsetShift, sPos.x, sPos.y+offsetShift)

            } else if (stretchMode === "spread") {
               const spreadLengthX = outerSpreadX * -1 
               const maxSpreadLengthX = SPREADX / 2 

               // WIP also account for fill length 
               if (layer === "fg" && (spreadLengthX !== maxSpreadLengthX || mode.spreadFills) || layer === "bg" && spreadLengthX===0) {
                  sPos.x += sideX * outerSpreadX
                  sPos.y -= sideY * SPREADY/2
                  const spreadDifferenceX = -sideX * (maxSpreadLengthX - spreadLengthX)
                  const fillSpreadDifferenceX = spreadFillStepX
                  lineType(sPos.x + fillSpreadDifferenceX, sPos.y, sPos.x + spreadDifferenceX, sPos.y)
               }
            }

         } else if (axis === "vert") {
            const outerSPosX = sPos.x + sideX * (OUTERSIZE * 0.5) 
            sPos.x += sideX * (size * 0.5 + outerSpreadX + SPREADX/2) + spreadFillStepX

            if (stretchMode === "stretch") {
               sPos.x -= sideX * SPREADX/2
               sPos.y -= sideY * SPREADY/2
               const stretchDifference = -sideY * STRETCHY * 0.5

               if (layer === "fg" || outerSpreadY===0) { //only draw once

                  // the offset can be in between the regular lines horizontally if it would staircase nicely
                  let offsetShift = 0
                  if (Math.abs(style.offsetX) >2 && Math.abs(style.offsetX) <4) {
                     offsetShift = style.offsetX/3*sideY
                  } else if (Math.abs(style.offsetX) >1 && Math.abs(style.offsetX)<3) {
                     offsetShift = style.offsetX/2*sideY
                  }

                  if (!midlineEffects.includes(effect)) {
                     if (SPREADY > 0 && font === "fontb") {
                        if ((style.stack === 1 && sideY === -1) || (style.stack === 0 && sideY === 1)) {
                           lineType(sPos.x-offsetShift, sPos.y+stretchDifference, sPos.x-offsetShift, sPos.y)
                        }
                     } else {
                        lineType(sPos.x-offsetShift, sPos.y+stretchDifference, sPos.x-offsetShift, sPos.y)
                     }
                  }

                  // if vertical line goes down, set those connection spots in the array
                  if (layer=== "fg" && sideY === -1 && midlineEffects.includes(effect)) {
                     if (style.letter === "‸") {
                        //caret counts separately
                        style.caretSpots[0] = sPos.x
                     } else {
                        const midlineSpotX = sPos.x
                        sortIntoArray(style.midlineSpots[style.stack][fillIndexX], midlineSpotX)

                        //add the remaining stretch spot on the end while fillIndex is on
                        // for some reason size is never OUTERSIZE then, so this is needed for now
                        //should only add this once, like only if size is smallest
                        if (size === INNERSIZE && fillIndexX !== 0) {
                           sortIntoArray(style.midlineSpots[style.stack][fillIndexX], outerSPosX)
                        }
                        
                     }
                  }
               }
            } else if (stretchMode === "spread") {
               const spreadLength = outerSpreadY * -1
               const maxSpreadLength = SPREADY / 2

               if (layer === "fg" && (spreadLength !== maxSpreadLength || mode.spreadFills) || layer === "bg" && spreadLength===0) {
                  sPos.x -= sideX * SPREADX/2
                  sPos.y += sideY * outerSpreadY
                  const spreadDifferenceY = -sideY * (maxSpreadLength - spreadLength)
                  const fillSpreadDifferenceY = spreadFillStepY
                  lineType(sPos.x, sPos.y+fillSpreadDifferenceY, sPos.x, sPos.y+ spreadDifferenceY)
               }
            }
         }
      }

      //doesn't make sense, only need for cut corners lol
      // and at the end of straight lines
     //function drawCornerFillCaps(xpos, ypos, spreadFillStepX, spreadFillStepY) {
     //   const fWidth = (SPREADX*0.5) / style.weight
     //   const fHeight = (SPREADY*0.5) / style.weight
     //   if(spreadFillStepY > 0 || spreadFillStepX > 0) return
     //   if (frameCount === 1) print(xpos, ypos, fWidth, fHeight)
     //}
   }
}


function ringStyle (size, smallest, biggest, innerColor, outerColor, isFlipped, arcQ, offQ, opacity, strokeWidth) {
   //strokeweight
   if ((effect==="weightgradient") && !mode.xray) {
      strokeWeight((strokeWidth/10)*strokeScaleFactor*map(size,smallest,biggest,0.3,1))
      if ((arcQ !== offQ) !== isFlipped) {
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
   if ((arcQ !== offQ) !== isFlipped ) {
      lerpedColor = lerpColor(innerColor, outerColor, map(size,biggest,innerEdgeReference,0,1))
   }
   lerpedColor = lerpColor(palette.bg, lerpedColor, opacity)
   stroke(lerpedColor)
}

