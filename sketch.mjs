'use strict'
import { drawModule } from "./modules/drawModule.mjs"
import { letterKerning } from "./modules/letterKerning.mjs"

export let font = "fontc"

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
   ascenders: {element: document.getElementById('number-asc'), min: 0, max:30},
   stretchX: {element: document.getElementById('number-stretchX'), min:0, max:50},
   stretchY: {element: document.getElementById('number-stretchY'), min:0, max:50},
   offsetX: {element: document.getElementById('number-offset'), min:-10, max:10},
   spreadX: {element: document.getElementById('number-spreadX'), min: 0, max: 50},
   spreadY: {element: document.getElementById('number-spreadY'), min: 0, max: 50},
}
let linesArray = ["the quick green","alien jumps over","the lazy dog."]
const validLetters = "abcdefghijklmnopqrstuvwxyzäöüß,.!?-_|‸ "


// setup

export const palette = {}
let lerpLength = 6

export let effect = "none"
export let midlineEffects = ["compress", "spread", "twist", "split", "sway", "teeth", "turn"]
export let stripeEffects = ["vstripes", "hstripes"]
export let webglEffects = ["spheres"]
export let endCapStyle = "round"

let initialDraw = true

export const mode = {
   // visual
   svg: false,
   dark: true,
   mono: false,
   xray: false,
   drawFills: true,
   spreadFills: true,
   wave: false,
   centeredEffect: false,
   // use alt letters?
   altS: false,
   altM: false,
   altNH: true,
   // animation
   auto: false,
}

export let strokeScaleFactor = 1
const totalWidth = [0, 0, 0, 0]
const totalHeight = [0, 0, 0, 0]

let values = {
   hueDark: {from: 210, to: undefined, lerp: 0},
   hueLight: {from: 130, to: undefined, lerp: 0},
   rings: {from: 2, to: undefined, lerp: 0},
   size: {from: 6, to: undefined, lerp: 0},
   spacing: {from: 0, to: undefined, lerp: 0},
   offsetX: {from: 0, to: undefined, lerp: 0},
   stretchX: {from: 0, to: undefined, lerp: 0},
   offsetY: {from: 0, to: undefined, lerp: 0},
   stretchY: {from: 0, to: undefined, lerp: 0},
   spreadX: {from: 0, to: undefined, lerp: 0},
   spreadY: {from: 0, to: undefined, lerp: 0},
   weight: {from: 6, to: undefined, lerp: 0},
   ascenders: {from: 4, to: undefined, lerp: 0},
   zoom: {from: 10, to: undefined, lerp: 0},
}
// calculated every frame based on current lerps
export let animSize, animRings, animSpacing, animWeight, animAscenders, animZoom
export let animOffsetX, animOffsetY, animStretchX, animStretchY, animSpreadY, animSpreadX
let animColorDark, animColorLight
// calculated from above but also used everywhere
let animExtraY

//drawfillcorner graphic layers
export let fillCornerLayers = {}


window.windowResized = function () {
   if (!mode.svg) {
      resizeCanvas(windowWidth-300, windowHeight)
   }
}

window.setup = function () {
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
   document.getElementById("defaultOpen").click();

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
   const centerEffectsToggle = document.getElementById('checkbox-centereffects')
   centerEffectsToggle.checked = mode.centeredEffect
   centerEffectsToggle.addEventListener('click', () => {
      mode.centeredEffect = centerEffectsToggle.checked
      writeToURL()
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
   const roundcapsToggle = document.getElementById('checkbox-roundcaps')
   roundcapsToggle.checked = (endCapStyle === "round")
   roundcapsToggle.addEventListener('click', () => {
      endCapStyle = (roundcapsToggle.checked) ? "round" : "none"
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
   if (params.caps === "round") {
      endCapStyle = "round"
      print("Loaded with URL Mode: Round end caps")
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
         case "staircase":
            effect = "staircase"
            print("Loaded with URL Mode: Staircase Effect")
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
         case "c":
            font = "fontc"
            print("Loaded font: C")
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
   if (endCapStyle !== undefined) {
      let value = "none"
      if (endCapStyle === "round") {
         value = "round"
      }
      if (value !== "none") {
         newParams.append("caps", value)
      }
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
         case "staircase":
            value = "staircase"
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
         case "fontc":
            newParams.append("font", "c")
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
      values.size.to = 6
      values.rings.to = 2
      values.weight.to = 6
      values.ascenders.to = 4
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
   values.ascenders.to = floor(random(1, values.size.to*1.0))

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

window.draw = function () {
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

   // calculate the in-between values for everything
   function lerpValues (slider, col) {
      // if it's a color
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
   // if inner size is below 2, add 1 grid size of vertical stretch
   animExtraY = map(getInnerSize(animSize, animRings), 1,2, 1,0, true)

   animSpacing = lerpValues(values.spacing)
   animOffsetX = lerpValues(values.offsetX)
   animOffsetY = lerpValues(values.offsetY)
   animStretchX = lerpValues(values.stretchX)
   animStretchY = lerpValues(values.stretchY)
   animSpreadX = lerpValues(values.spreadX) * (animRings-1) * 2 //WIP, means it always aligns with grid though
   animSpreadY = lerpValues(values.spreadY) * (animRings-1) * 2
   animWeight = lerpValues(values.weight)
   animAscenders = lerpValues(values.ascenders) * 0.5
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

   // font styles with ascenders and descenders start lower so they stay on screen
   if (font === "fonta" || font === "fontc") {
      translate(0, animAscenders)
   }

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
         if (font === "fontb" || font === "fontc") fontSize = animSize*2 - min(animRings, animSize/2) + 1
         const gridHeight = fontSize + Math.abs(animOffsetY) + animStretchY + animSpreadY + animExtraY
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
                  lineType(0, i + animSize +animStretchY*0.5, gridWidth, i + animSize+animStretchY*0.5)
                  lineType(0, i+gridHeight -animSize -animStretchY*0.5, gridWidth, i+gridHeight -animSize -animStretchY*0.5)
                  //twice
                  lineType(0, i + animSize +animStretchY*0.5, gridWidth, i + animSize+animStretchY*0.5)
                  lineType(0, i+gridHeight -animSize -animStretchY*0.5, gridWidth, i+gridHeight -animSize -animStretchY*0.5)
                  //halfway
                  lineType(0, i + animSize*0.5, gridWidth, i + animSize*0.5)
                  lineType(0, i+gridHeight -animSize*0.5, gridWidth, i+gridHeight -animSize*0.5)
               } else if (font === "fontc") {
                  lineType(0, i + animSize +animStretchY*0.5, gridWidth, i + animSize+animStretchY*0.5)
                  lineType(0, i+gridHeight -animSize -animStretchY*0.5, gridWidth, i+gridHeight -animSize -animStretchY*0.5)
                  //twice
                  lineType(0, i + animSize +animStretchY*0.5, gridWidth, i + animSize+animStretchY*0.5)
                  lineType(0, i+gridHeight -animSize -animStretchY*0.5, gridWidth, i+gridHeight -animSize -animStretchY*0.5)
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

export function charInSet (char, sets) {

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

   // draw a single line of input text

   // get the text in all lowercase first
   let lineText = linesArray[lineNum].toLowerCase()

   // insert the caret into line so that it can be rendered
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
   let stretchSize = animStretchY + animSpreadY + animExtraY*0.5
   if (font === "fontb" || font === "fontc") {
      fontSize = animSize*2 - min(animRings, animSize/2)

      //WIP: this would make each stretch side be an integer...
      //stretchSize *= 2
   }
   //staircase height
   //let staircaseHeight = (effect === "staircase") ? Math.abs(animOffsetX) : 0
   //WIP should this be used instead of y?

   totalHeight[lineNum] = fontSize + Math.abs(animOffsetY) + stretchSize + animAscenders + max(1,animSpacing)
   // add a space so that 0 space means they have a single gap
   if (font === "fontb" || font === "fontc") totalHeight[lineNum]++;

   // wip test: always fit on screen?
   //values.zoom.from = (width) / (Math.max(...totalWidth)+7)


   //translate to account for x offset
   push()
   if (animOffsetX < 0 && effect !== "staircase") {
      translate(-animOffsetX,0)
   } else if (animOffsetX > 0 && effect !== "staircase" && (font === "fontb" || font === "fontc")) {
      //go the other way for 3-tiered text
      translate(animOffsetX,0)
   }

   //translate to (lower) midline
   translate(0,fontSize-0.5*animSize)
   if (font === "fontb" || font === "fontc") translate(0, 1 + (animStretchY + animSpreadY)*0.5)


   // go through all the letters, but this time to actually draw them
   // go in a weird order so that lower letters go first
   let connectingUnderPrev = "sjzx"
   if (font === "fontb") connectingUnderPrev = "jt"
   else if (font === "fontc") connectingUnderPrev = ""

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
      stopSpots: [],
      caretSpots: [],
      spaceSpots: [],
   }
   if (font === "fontb" || font === "fontc") lineStyle.midlineSpots = [
      [...Array(SPREADFILLSTEPSX+1)].map(x => []), 
      [...Array(SPREADFILLSTEPSX+1)].map(x => [])
   ]

   fillCornerLayers = {
      linecut: {},
      roundcut: {},
   }


   // now go through each letter of the line, in above determined layer order
   for (let layerPos = 0; layerPos < lineText.length; layerPos++) {

      // VALUES -----------------------------------------------------------------------------

      // get characters
      // pretend there is a space before the first and after the last character
      const letter = lineText[layerArray.indexOf(layerPos)]
      const nextLetter = (lineText[layerArray.indexOf(layerPos)+1] !== undefined) ? lineText[layerArray.indexOf(layerPos)+1] : " "
      const prevLetter = (lineText[layerArray.indexOf(layerPos)-1] !== undefined) ? lineText[layerArray.indexOf(layerPos)-1] : " "

      // ring sizes for this character
      let letterInner = getInnerSize(animSize, animRings) //+ [2,4,3,-2,0,2,4,5][i % 8]
      let letterOuter = animSize //+ [2,4,3,-2,0,2,4,5][i % 8]

      // change depending on the character index (i) if wave mode is on
      letterInner = waveInner(layerArray.indexOf(layerPos), letterInner, letterOuter)

      // make and fill array with all ring sizes for this letter
      let ringSizes = []
      for (let b = letterOuter; b >= letterInner-1; b-=2) {
         // smallest ring is animated
         let size = (b < letterInner) ? letterInner : b
         ringSizes.push(size)
      }

      const ascenders = animAscenders
      const descenders = animAscenders

      let calcPosFromTop = lineNum*totalHeight[lineNum]
      //place lower because of negative offset
      if (animOffsetY<0) calcPosFromTop -= animOffsetY
      if (animOffsetX<0 && effect === "staircase") {
         //first line matters for staircase
         calcPosFromTop -= animOffsetX * offsetUntil(linesArray[0], linesArray[0].length)
      }

      // style per letter, modify during drawing when needed
      const style = {
         //for entire line, but need while drawing
         midlineSpots: lineStyle.midlineSpots,
         caretSpots: lineStyle.caretSpots,
         spaceSpots: lineStyle.spaceSpots,
         stopSpots: lineStyle.stopSpots,
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
         extraY: animExtraY,
         spreadX: animSpreadX,
         spreadY: animSpreadY,
         spreadFillSteps: SPREADFILLSTEPSX,
         endCap: endCapStyle,
         letter: letter,
         nextLetter: nextLetter,
         prevLetter: prevLetter,
         stack: 0, // for letters with more than 1 level
         flipped: false, // for gradients
         // convenient values
         weight: (letterOuter-letterInner)*0.5,
      }

      // WIP - explain what these are and see if more things need to be described like this
      const oneoffset = (letterOuter>3 && letterInner>2) ? 1 : 0
      map(letterOuter, 3, 4, 0, 1, true)
      const wideOffset = 0.5*letterOuter + 0.5*letterInner -animSpreadX*0.5
      const extendOffset = waveValue(letterOuter, 0, 0.5) + ((animStretchX+animSpreadX)-(animStretchX+animSpreadX)%2)*0.5
      const dotgap = (endCapStyle === "round") ? map(style.weight, 0, 1, 1, 0, true) : 1


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
                     drawModule(style, "vert", 1, 1, 0, 0, {extend: ascenders, from: letterOuter*0.5 + dotgap, noStretch: true})
                     drawModule(style, "vert", 2, 2, 0, 0, {extend: ascenders, from: letterOuter*0.5 + dotgap, noStretch: true})
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
                     drawModule(style, "vert", 1, 1, 0, 0, {extend: ascenders, from: letterOuter*0.5 + dotgap, noStretch: true})
                     drawModule(style, "vert", 2, 2, 0, 0, {extend: ascenders, from: letterOuter*0.5 + dotgap, noStretch: true})
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
                     drawModule(style, "vert", 1, 1, 0, 0, {extend: ascenders, from: letterOuter*0.5 + dotgap, noStretch: true})
                     drawModule(style, "vert", 2, 2, 0, 0, {extend: ascenders, from: letterOuter*0.5 + dotgap, noStretch: true})
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
                  drawModule(style, "vert", 1, 1, 0, 0, {extend: ascenders, from: letterOuter*0.5 + dotgap, noStretch: true})
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
                  
                  drawModule(style, "vert", 2, 2, leftOffset, 0, {extend: ascenders, from: letterOuter*0.5 + dotgap, noStretch: true})
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
                  drawModule(style, "vert", 3, 4, wideOffset + animStretchX*2, 0, {})
                  drawModule(style, "vert", 4, 3, wideOffset, 0, {})
                  style.stack = 0
                  style.flipped = false
                  drawModule(style, "vert", 1, 1, 0, 0, {})
                  drawModule(style, "vert", 4, 4, 0, 0, {})
                  // right side
                  style.flipped = true
                  drawModule(style, "vert", 1, 2, wideOffset, 0, {})
                  drawModule(style, "vert", 2, 1, wideOffset + animStretchX*2, 0, {})
                  drawModule(style, "vert", 3, 4, wideOffset + animStretchX*2, 0, {})
                  drawModule(style, "vert", 4, 3, wideOffset, 0, {})
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
         } else if (font === "fontc") {
            switch (letter) {
               case "a":
               case "ä":
                  style.stack = 1
                  drawModule(style, "round", 1, 1, 0, 0, {})
                  drawModule(style, "round", 2, 2, 0, 0, {})
                  drawModule(style, "vert", 3, 3, 0, 0, {broken: true})
                  drawModule(style, "vert", 4, 4, 0, 0, {extend: -style.weight -0.5})

                  if (letter === "ä") {
                     drawModule(style, "vert", 1, 1, 0, 0, {extend: ascenders, from: letterOuter*0.5 + dotgap, noStretch: true})
                     drawModule(style, "vert", 2, 2, 0, 0, {extend: ascenders, from: letterOuter*0.5 + dotgap, noStretch: true})
                  }

                  style.stack = 0
                  drawModule(style, "round", 1, 1, 0, 0, {})
                  drawModule(style, "square", 2, 2, 0, 0, {type: "branch", at:"start"})
                  drawModule(style, "round", 3, 3, 0, 0, {})
                  drawModule(style, "round", 4, 4, 0, 0, {})
                  break;
               case "b":
               case "d":
               case "o":
               case "ö":
               case "p":
               case "q":
                  style.stack = 1
                  if (letter !== "b") drawModule(style, "round", 1, 1, 0, 0, {})
                  else {
                     drawModule(style, "vert", 1, 1, 0, 0, {extend: ascenders})
                     drawModule(style, "square", 1, 1, 0, 0, {type: "branch", at:"end"})
                  }
                  if (letter !== "d") drawModule(style, "round", 2, 2, 0, 0, {})
                  else {
                     drawModule(style, "vert", 2, 2, 0, 0, {extend: ascenders})
                     drawModule(style, "square", 2, 2, 0, 0, {type: "branch", at:"start"})
                  }
                  drawModule(style, "vert", 3, 3, 0, 0, {})
                  drawModule(style, "vert", 4, 4, 0, 0, {})
                  if (letter === "ö") {
                     drawModule(style, "vert", 1, 1, 0, 0, {extend: ascenders, from: letterOuter*0.5 + dotgap, noStretch: true})
                     drawModule(style, "vert", 2, 2, 0, 0, {extend: ascenders, from: letterOuter*0.5 + dotgap, noStretch: true})
                  }

                  style.stack = 0
                  drawModule(style, "vert", 1, 1, 0, 0, {})
                  drawModule(style, "vert", 2, 2, 0, 0, {})
                  if (letter !== "q") drawModule(style, "round", 3, 3, 0, 0, {})
                  else {
                     drawModule(style, "vert", 3, 3, 0, 0, {extend: ascenders})
                     drawModule(style, "square", 3, 3, 0, 0, {type: "branch", at:"end"})
                  }
                  if (letter !== "p") drawModule(style, "round", 4, 4, 0, 0, {})
                  else {
                     drawModule(style, "vert", 4, 4, 0, 0, {extend: ascenders})
                     drawModule(style, "square", 4, 4, 0, 0, {type: "branch", at:"start"})
                  }
                  break;
               case "c":
                  // (- 0.5*letterOuter + 0.5*letterInner - 1) * 0.5
                  const centersDistance = style.weight + letterInner
                  style.stack = 1
                  drawModule(style, "round", 1, 1, 0, 0, {})
                  drawModule(style, "round", 2, 2, 0, 0, {})
                  drawModule(style, "vert", 3, 3, 0, 0, {extend: -letterOuter*0.5+(centersDistance-1)*0.5})
                  drawModule(style, "vert", 4, 4, 0, 0, {})
                  style.stack = 0
                  drawModule(style, "vert", 1, 1, 0, 0, {})
                  drawModule(style, "vert", 2, 2, 0, 0, {extend: -letterOuter*0.5+(centersDistance-1)*0.5})
                  drawModule(style, "round", 3, 3, 0, 0, {})
                  drawModule(style, "round", 4, 4, 0, 0, {})
                  break;
               case "e":
                  style.stack = 1
                  drawModule(style, "round", 1, 1, 0, 0, {})
                  drawModule(style, "round", 2, 2, 0, 0, {})
                  drawModule(style, "round", 3, 3, 0, 0, {})
                  drawModule(style, "vert", 4, 4, 0, 0, {broken: true})
                  style.stack = 0
                  drawModule(style, "square", 1, 1, 0, 0, {type: "branch", at:"end"})
                  drawModule(style, "vert", 2, 2, 0, 0, {extend: -style.weight -0.5})
                  drawModule(style, "round", 3, 3, 0, 0, {})
                  drawModule(style, "round", 4, 4, 0, 0, {})
                  break;
               case "f":
                  style.stack = 1
                  drawModule(style, "round", 1, 1, 0, 0, {})
                  drawModule(style, "round", 2, 2, 0, 0, {})
                  drawModule(style, "vert", 3, 3, 0, 0, {})
                  drawModule(style, "vert", 4, 4, 0, 0, {})
                  style.stack = 0
                  drawModule(style, "vert", 1, 1, 0, 0, {})
                  drawModule(style, "vert", 2, 2, 0, 0, {})
                  drawModule(style, "vert", 3, 3, 0, 0, {extend: -style.weight -1})
                  drawModule(style, "hori", 3, 3, 0, 0, {cap: true})
                  drawModule(style, "vert", 4, 4, 0, 0, {extend: ascenders})
                  drawModule(style, "square", 4, 4, 0, 0, {type: "branch", at:"start"})
                  break;
               case "g":
                  if (descenders >= 1) {
                     style.stack = 1
                     drawModule(style, "round", 1, 1, 0, 0, {})
                     drawModule(style, "round", 2, 2, 0, 0, {})
                     drawModule(style, "vert", 3, 3, 0, 0, {})
                     drawModule(style, "vert", 4, 4, 0, 0, {})
                     style.stack = 0
                     drawModule(style, "vert", 1, 1, 0, 0, {})
                     drawModule(style, "vert", 2, 2, 0, 0, {})
                     drawModule(style, "round", 4, 4, 0, 0, {})

                     //drawModule(style, "vert", 3, 3, 1, 0, {extend: (descenders >= 2) ? descenders - letterOuter*0.5 : 1})

                     if (descenders < letterOuter*0.5+1 || ascenders < 2) {
                        if (descenders > letterOuter*0.5) {
                           drawModule(style, "vert", 2, 2, 0, descenders, {extend: -letterOuter*0.5+1})
                           drawModule(style, "round", 3, 3, 0, descenders, {noStretchY: true})
                        } else {
                           drawModule(style, "square", 3, 3, 0, descenders, {noStretchY: true})
                        }
                        drawModule(style, "hori", 4, 4, 0, descenders, {cap: true, noStretchY: true})
                     } else {
                        drawModule(style, "vert", 1, 1, 0, descenders, {extend: -style.weight -0.5})
                        drawModule(style, "vert", 2, 2, 0, descenders, {extend: -(letterOuter-descenders-0.5)})
                        drawModule(style, "round", 3, 3, 0, descenders, {noStretchY: true})
                        drawModule(style, "round", 4, 4, 0, descenders, {noStretchY: true})
                     }
                     // branch over
                     drawModule(style, "square", 3, 3, 0, 0, {type: "branch", at:"end"})

                  } else {
                     style.stack = 1
                     drawModule(style, "round", 1, 1, 0, 0, {})
                     drawModule(style, "round", 2, 2, 0, 0, {})
                     drawModule(style, "round", 4, 4, 0, 0, {})
                     drawModule(style, "vert", 3, 3, 0, 0, {})
                     style.stack = 0
                     drawModule(style, "vert", 1, 1, 0, 0, {extend: -style.weight -0.5})
                     drawModule(style, "square", 2, 2, 0, 0, {type: "branch", at:"start"})
                     drawModule(style, "round", 3, 3, 0, 0, {})
                     drawModule(style, "round", 4, 4, 0, 0, {})
                  }
                  break;
               case "i":
               case "l":
                  style.stack = 1
                  if (letter === "i") {
                     drawModule(style, "vert", 1, 1, 0, 0, {extend: ascenders, from: letterOuter*0.5 + dotgap, noStretch: true})
                     drawModule(style, "vert", 1, 1, 0, 0, {cap: true})
                  }
                  else {
                     drawModule(style, "vert", 1, 1, 0, 0, {extend: ascenders})
                  }
                  drawModule(style, "vert", 4, 4, 0, 0, {})
                  style.stack = 0
                  drawModule(style, "vert", 1, 1, 0, 0, {})
                  drawModule(style, "vert", 4, 4, 0, 0, {cap: true})
                  break;
               case "j":
                  style.stack = 1
                  drawModule(style, "hori", 1, 1, 0, 0, {cap: true})
                  drawModule(style, "vert", 1, 1, 0, 0, {extend: -style.weight -1})

                  drawModule(style, "vert", 2, 2, 0, 0, {extend: ascenders, from: letterOuter*0.5 + dotgap, noStretch: true})
                  drawModule(style, "square", 2, 2, 0, 0, {})
                  drawModule(style, "vert", 3, 3, 0, 0, {})
                  drawModule(style, "vert", 4, 4, 0, 0, {})
                  
                  style.stack = 0
                  drawModule(style, "vert", 1, 1, 0, 0, {})
                  drawModule(style, "vert", 2, 2, 0, 0, {})
                  drawModule(style, "round", 3, 3, 0, 0, {})
                  drawModule(style, "round", 4, 4, 0, 0, {})
                  break;
               case "k":
                  style.stack = 1
                  drawModule(style, "vert", 1, 1, 0, 0, {extend: ascenders})
                  drawModule(style, "vert", 2, 2, 0, 0, {cap: true})
                  drawModule(style, "round", 3, 3, 0, 0, {})
                  drawModule(style, "vert", 4, 4, 0, 0, {broken: true})
                  style.stack = 0
                  drawModule(style, "square", 1, 1, 0, 0, {type: "branch", at:"end"})
                  drawModule(style, "round", 2, 2, 0, 0, {})
                  drawModule(style, "vert", 3, 3, 0, 0, {cap: true})
                  drawModule(style, "vert", 4, 4, 0, 0, {cap: true})
                  break;
               case "n":
               case "h":
                  style.stack = 1
                  if (letter !== "h") drawModule(style, "round", 1, 1, 0, 0, {})
                  else {
                     drawModule(style, "vert", 1, 1, 0, 0, {extend: ascenders})
                     drawModule(style, "square", 1, 1, 0, 0, {type: "branch", at:"end"})
                  }
                  drawModule(style, "round", 2, 2, 0, 0, {})
                  drawModule(style, "vert", 3, 3, 0, 0, {})
                  drawModule(style, "vert", 4, 4, 0, 0, {})
                  style.stack = 0
                  drawModule(style, "vert", 1, 1, 0, 0, {})
                  drawModule(style, "vert", 2, 2, 0, 0, {})
                  drawModule(style, "vert", 3, 3, 0, 0, {cap: true})
                  drawModule(style, "vert", 4, 4, 0, 0, {cap: true})
                  break;
               case "m":
                  style.stack = 1
                  drawModule(style, "round", 1, 1, 0, 0, {})
                  drawModule(style, "round", 2, 2, 0, 0, {})
                  drawModule(style, "vert", 4, 4, 0, 0, {})
                  // right side
                  style.flipped = true
                  drawModule(style, "round", 1, 2, wideOffset, 0, {})
                  drawModule(style, "round", 2, 1, wideOffset + animStretchX*2, 0, {})
                  drawModule(style, "vert", 3, 4, wideOffset + animStretchX*2, 0, {})
                  drawModule(style, "vert", 4, 3, wideOffset, 0, {})
                  style.flipped = false

                  style.stack = 0
                  drawModule(style, "vert", 1, 1, 0, 0, {})
                  drawModule(style, "vert", 4, 4, 0, 0, {cap: true})
                  // right side
                  style.flipped = true
                  drawModule(style, "vert", 1, 2, wideOffset, 0, {})
                  drawModule(style, "vert", 2, 1, wideOffset + animStretchX*2, 0, {})
                  drawModule(style, "vert", 3, 4, wideOffset + animStretchX*2, 0, {cap: true})
                  drawModule(style, "vert", 4, 3, wideOffset, 0, {cap: true})
                  break;
               case "r":
                  style.stack = 1
                  drawModule(style, "round", 1, 1, 0, 0, {})
                  drawModule(style, "round", 2, 2, 0, 0, {})
                  drawModule(style, "round", 3, 3, 0, 0, {})
                  drawModule(style, "vert", 4, 4, 0, 0, {broken: true})
                  style.stack = 0
                  drawModule(style, "square", 1, 1, 0, 0, {type: "branch", at:"end"})
                  drawModule(style, "round", 2, 2, 0, 0, {})
                  drawModule(style, "vert", 3, 3, 0, 0, {cap: true})
                  drawModule(style, "vert", 4, 4, 0, 0, {cap: true})
                  break;
               case "s":
                  style.stack = 1
                  drawModule(style, "round", 1, 1, 0, 0, {})
                  drawModule(style, "round", 2, 2, 0, 0, {})
                  drawModule(style, "vert", 3, 3, 0, 0, {extend: -style.weight -0.5})
                  drawModule(style, "round", 4, 4, 0, 0, {})
                  style.stack = 0
                  style.flipped = true
                  drawModule(style, "vert", 1, 1, 0, 0, {extend: -style.weight -0.5})
                  drawModule(style, "round", 2, 2, 0, 0, {})
                  drawModule(style, "round", 3, 3, 0, 0, {})
                  drawModule(style, "round", 4, 4, 0, 0, {})
                  break;
               case "t":
                  style.stack = 1
                  drawModule(style, "vert", 1, 1, 0, 0, {extend: ascenders})
                  drawModule(style, "square", 1, 1, 0, 0, {type: "branch", at:"end"})
                  drawModule(style, "hori", 2, 2, 0, 0, {cap: true})
                  drawModule(style, "vert", 2, 2, 0, 0, {extend: -style.weight -1})
                  drawModule(style, "vert", 3, 3, 0, 0, {})
                  drawModule(style, "vert", 4, 4, 0, 0, {})
                  style.stack = 0
                  drawModule(style, "vert", 1, 1, 0, 0, {})
                  drawModule(style, "vert", 2, 2, 0, 0, {})
                  drawModule(style, "round", 3, 3, 0, 0, {})
                  drawModule(style, "round", 4, 4, 0, 0, {})
                  break;
               case "u":
               case "ü":
               case "v":
                  style.stack = 1
                  drawModule(style, "vert", 1, 1, 0, 0, {cap: true})
                  drawModule(style, "vert", 2, 2, 0, 0, {cap: true})
                  drawModule(style, "vert", 3, 3, 0, 0, {})
                  drawModule(style, "vert", 4, 4, 0, 0, {})
                  if (letter === "ü") {
                     drawModule(style, "vert", 1, 1, 0, 0, {extend: ascenders, from: letterOuter*0.5 + dotgap, noStretch: true})
                     drawModule(style, "vert", 2, 2, 0, 0, {extend: ascenders, from: letterOuter*0.5 + dotgap, noStretch: true})
                  }

                  style.stack = 0
                  drawModule(style, "vert", 1, 1, 0, 0, {})
                  drawModule(style, "vert", 2, 2, 0, 0, {})
                  if (letter === "u" || letter === "ü") {
                     drawModule(style, "round", 3, 3, 0, 0, {})
                     drawModule(style, "round", 4, 4, 0, 0, {})
                  } else if (letter === "v") {
                     drawModule(style, "round", 3, 3, 0, 0, {})
                     drawModule(style, "square", 4, 4, 0, 0, {})
                  }
                  break;
               case "w":
                  style.stack = 1
                  drawModule(style, "vert", 1, 1, 0, 0, {cap: true})
                  drawModule(style, "vert", 4, 4, 0, 0, {})
                  // right side
                  style.flipped = true
                  drawModule(style, "vert", 1, 2, wideOffset, 0, {cap: true})
                  drawModule(style, "vert", 2, 1, wideOffset + animStretchX*2, 0, {cap: true})
                  drawModule(style, "vert", 3, 4, wideOffset + animStretchX*2, 0, {})
                  drawModule(style, "vert", 4, 3, wideOffset, 0, {})

                  style.flipped = false

                  style.stack = 0
                  drawModule(style, "vert", 1, 1, 0, 0, {})
                  drawModule(style, "round", 3, 3, 0, 0, {})
                  drawModule(style, "round", 4, 4, 0, 0, {})
                  // right side
                  style.flipped = true
                  drawModule(style, "vert", 1, 2, wideOffset, 0, {})
                  drawModule(style, "vert", 2, 1, wideOffset + animStretchX*2, 0, {})
                  drawModule(style, "round", 3, 4, wideOffset + animStretchX*2, 0, {})
                  drawModule(style, "round", 4, 3, wideOffset, 0, {})
                  break;
               case "x":
                  style.stack = 1
                  drawModule(style, "vert", 1, 1, 0, 0, {cap: true})
                  drawModule(style, "round", 4, 4, 0, 0, {})
                  style.stack = 0
                  drawModule(style, "round", 1, 1, 0, 0, {})
                  drawModule(style, "round", 2, 2, 0, 0, {})
                  drawModule(style, "vert", 3, 3, 0, 0, {cap: true})
                  drawModule(style, "vert", 4, 4, 0, 0, {cap: true})
                  style.stack = 1
                  style.flipped = true
                  drawModule(style, "vert", 2, 2, 0, 0, {cap: true})
                  drawModule(style, "round", 3, 3, 0, 0, {})
                  break;
               case "y":
                  style.stack = 1
                  drawModule(style, "vert", 1, 1, 0, 0, {cap: true})
                  drawModule(style, "vert", 2, 2, 0, 0, {cap: true})

                  if (animAscenders >= 1) {
                     drawModule(style, "vert", 3, 3, 0, 0, {})
                     drawModule(style, "vert", 4, 4, 0, 0, {})
                     style.stack = 0
                     drawModule(style, "vert", 1, 1, 0, 0, {})
                     drawModule(style, "vert", 2, 2, 0, 0, {})
                     drawModule(style, "vert", 3, 3, 0, 0, {extend: ascenders})
                     drawModule(style, "square", 3, 3, 0, 0, {type: "branch", at:"end"})
                     drawModule(style, "round", 4, 4, 0, 0, {})
                  } else {
                     drawModule(style, "round", 3, 3, 0, 0, {})
                     drawModule(style, "round", 4, 4, 0, 0, {})
                     drawModule(style, "vert", 3, 3, 0, 0, {})
                     style.stack = 0
                     drawModule(style, "vert", 1, 1, 0, 0, {extend: -style.weight -0.5})
                     drawModule(style, "vert", 2, 2, 0, 0, {})
                     drawModule(style, "round", 3, 3, 0, 0, {})
                     drawModule(style, "round", 4, 4, 0, 0, {})
                  }
                  break;
               case "z":
                  style.stack = 1
                  drawModule(style, "square", 1, 1, 0, 0, {})
                  drawModule(style, "square", 2, 2, 0, 0, {})
                  drawModule(style, "round", 3, 3, 0, 0, {})
                  drawModule(style, "vert", 4, 4, 0, 0, {extend: -style.weight -0.5})
                  style.stack = 0
                  style.flipped = true
                  drawModule(style, "round", 1, 1, 0, 0, {})
                  drawModule(style, "vert", 2, 2, 0, 0, {extend: -style.weight -0.5})
                  drawModule(style, "square", 3, 3, 0, 0, {})
                  drawModule(style, "square", 4, 4, 0, 0, {})
                  break;
               case "ß":
                  style.stack = 1
                  drawModule(style, "round", 1, 1, 0, 0, {})
                  drawModule(style, "round", 2, 2, 0, 0, {})
                  drawModule(style, "round", 3, 3, 0, 0, {})
                  drawModule(style, "vert", 4, 4, 0, 0, {})
                  style.stack = 0
                  drawModule(style, "vert", 1, 1, 0, 0, {})
                  drawModule(style, "hori", 1, 1, 0, 0, {extend: -style.weight -1})
                  drawModule(style, "round", 2, 2, 0, 0, {})
                  drawModule(style, "round", 3, 3, 0, 0, {})
                  drawModule(style, "hori", 4, 4, 0, 0, {extend: -style.weight -1})
                  drawModule(style, "vert", 4, 4, 0, 0, {extend: descenders})
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
                  drawModule(style, "vert", 4, 4, 0, 0, {cap: true, from: letterOuter*0.5 - (style.weight+0.5), noStretch: true})
                  break;
               case ",":
                  drawModule(style, "vert", 4, 4, 0, 0, {extend: descenders, from: letterOuter*0.5 - (style.weight+0.5), noStretch: true})
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
      if (font === "fontb" || font === "fontc") {
         if (mode.centeredEffect) {
            drawMidlineEffects(0, lineStyle.midlineSpots, lineStyle.caretSpots, lineStyle.spaceSpots, lineStyle.stopSpots)
         } else {
            push()
            translate(0, -animSize+(animRings-1)- animStretchY - animSpreadY)
            drawMidlineEffects(1, lineStyle.midlineSpots, lineStyle.caretSpots, lineStyle.spaceSpots)
            pop()

            push()
            translate(-animOffsetX,0)
            drawMidlineEffects(0, lineStyle.midlineSpots, lineStyle.caretSpots, lineStyle.spaceSpots)
            pop()

         }
         
         //if (frameCount === 1) print("Midlines:", lineStyle.midlineSpots)
      } else {
         drawMidlineEffects(0, lineStyle.midlineSpots, lineStyle.caretSpots, lineStyle.spaceSpots)
      }
      
   }

   function drawMidlineEffects (layer, midlineSpots, caretSpots, spaceSpots, stopSpots) {
      push()

      stroke(palette.fg)

      let stretchHeight = animStretchY
      if (font === "fontb" || font === "fontc") {
         if (mode.centeredEffect) {
            stretchHeight = (animSize - animRings) + 1
         } else {
            stretchHeight = animStretchY*0.5
         }
      }

      if ((font === "fontb" || font === "fontc")) {
         if (mode.centeredEffect) {
            translate(0, -stretchHeight*0.5)
         } else {
            const layerDir = (layer > 0) ? 0.75 : 0.25
            translate(0, (Math.abs(animOffsetY) + animStretchY + animSpreadY)*layerDir)
         }
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
         
         
         if (frameCount === 1) print("Line:", lineText, ", Layer:", layer, ", Mid Connection Spots:", wordSpots)
         if (frameCount === 1  && stopSpots !== undefined) print(stopSpots)
         // show spaces
         //lineStyle.spaceSpots.forEach((pos) => {
         //   lineType(pos,5, pos, 7)
         //})

         wordSpots.forEach((word) => {
            const total = word.length-1
            const leftPos = word[0]
            const rightPos = word[total]
            let counter = 0
            let chainLength = 0
            let chainCount = 0
            let lastPos = undefined

            // WIP: use stoppos here to split centered midline font b/c effects

            word.forEach((pos) => {
               if (lastPos !== undefined && lastPos >= pos-1) {
                  chainLength++
               } else {
                  chainLength = 0
                  chainCount++
               }
               
               const xBend = (mode.centeredEffect) ? 0 : animOffsetX

               if (effect === "spread") {
                  const midX = map(counter, 0, total, leftPos, rightPos) + xBend*0.5
                  rowLines("bezier", [pos, midX, pos+xBend], stretchHeight)
               } else if (effect === "compress") {
                  const midX = (rightPos - total + leftPos + xBend)*0.5 + counter
                  rowLines("bezier", [pos, midX, pos+xBend], stretchHeight)
               } else if (effect === "turn") {
                  //const midX = (counter < total/2) ? leftPos + counter: rightPos - (total-counter)
                  //rowLines("sharpbezier", [pos, midX, pos+xBend], stretchHeight)
                  if (chainLength > 0) {
                     // diagonal
                     if (i %2 === 0) {
                        rowLines("bezier", [pos, lastPos+xBend], stretchHeight)
                     } else {
                        rowLines("bezier", [lastPos, pos+xBend], stretchHeight)
                     }
                     
                     // first straight piece of group
                     if (chainLength === 1) {
                        rowLines("bezier", [lastPos, lastPos+xBend], stretchHeight)
                     }
                  } else {
                     // last straight piece of group
                     rowLines("bezier", [lastPos, lastPos+xBend], stretchHeight)
                  }
                  if (pos == rightPos) {
                     // last straight piece of word
                     rowLines("bezier", [pos, pos+xBend], stretchHeight)
                  }
               } else if (effect === "split") {
                  if (counter > 0) {
                     rowLines("bezier", [pos, lastPos+xBend], stretchHeight)
                     rowLines("bezier", [lastPos, pos+xBend], stretchHeight)
                  }
               } else if (effect === "twist") {
                  if (counter % 2 === 1) {
                     rowLines("bezier", [pos, lastPos+xBend], stretchHeight)
                     rowLines("bezier", [lastPos, pos+xBend], stretchHeight)
                  } else if (counter === total) {
                     rowLines("bezier", [pos, pos+xBend], stretchHeight)
                  }
               } else if (effect === "sway") {
                  if (counter > 0) {
                     rowLines("bezier", [pos, lastPos+xBend], stretchHeight)
                  }
               } else if (effect === "teeth") {
                  if (counter % 2 === 1) {
                     const x = lastPos + (pos-lastPos)*0.5
                     const w = pos-lastPos
                     arc(x, -(stretchHeight)*0.5,w,w, 0, PI)
                  } else {
                     //bottom
                     const x = lastPos + (pos-lastPos)*0.5 +xBend
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





function letterYOffsetCount (prevchar, char, nextchar) {

   // width for vertical offset
   let offsetSegments = 0
   switch (char) {
      case "m":
      case "w":
         offsetSegments = 2
         break;
      case "x":
         if (font === "fonta") offsetSegments = 2
         else offsetSegments = 1
         break;
      case "s":
         if (font === "fonta") {
            if (!mode.altS) {
               // stretch spacing depends on if it connects
               if (charInSet(prevchar,["gap", "dr"])) {
                  offsetSegments +=1
               }
               if (charInSet(nextchar,["gap", "ul"])) {
                  offsetSegments +=1
               }
            }
         } else {
            offsetSegments = 1
         }
         break;
      case "i":
      case ".":
      case ",":
      case "!":
      case " ":
      case "‸":
         offsetSegments = 0
         break;
      case "z":
         if (font === "fonta") offsetSegments = 2
         else offsetSegments = 1
         break;
      default:
         offsetSegments = 1
         break;
   }

   return offsetSegments
}


export function lineType (x1, y1, x2, y2) {
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
   //for (let i = 0.1; i <= 1; i+=0.1) {
   //   const partialX = x1+(x2-x1)*i
   //   const partialY = y1+(y2-y1)*i
   //   stroke("#FFFFFF30")
   //   line(x1, y1, partialX, partialY)
   //}
   line(x1, y1, x2, y2)
}

export function arcType (x, y, w, h, start, stop, layer) {
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
      case "Lowercase 2x2":
         font = "fonta"
         print("Switched to Font A")
         break;
      case "Uppercase 3x2":
         font = "fontb"
         print("Switched to Font B")
         break;
      case "Lowercase 3x2":
         font = "fontc"
         print("Switched to Font C")
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

export function sortIntoArray(array, insertNumber) {

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

export function waveValue(input, low, high) {
   return (-0.5*Math.cos(input*PI)+0.5)*(high-low)+low
}



export function ringStyle (size, smallest, biggest, innerColor, outerColor, isFlipped, arcQ, offQ, opacity, strokeWidth) {
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
