'use strict'

import { drawLetter } from "./modules/drawLetter.mjs"
import { kerningAfter, letterWidth } from "./modules/letterKerning.mjs"

export let font = "lower3x2" // default
export let fonts2x = ["lower2x2", "lower2x3"]
export let fonts3x = ["upper3x2", "lower3x2"]
export let fontsLower = ["lower2x2", "lower2x3", "lower3x2"]

// gui
let canvasEl
let writeEl
let numberOffsetEl
let playToggleEl
const toggles = {}

let focusedEl = "none"
let framesSinceInteract = 0
let wiggleMode = false
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
const validLetters = {
   lower2x2: "abcdefghijklmnopqrstuvwxyzäöüß,.!?-_|‸ ",
   upper3x2: "abcdefghijklmnopqrstuvwxyzäöüß,.!?-_|‸1234567890 ",
   lower3x2: "abcdefghijklmnopqrstuvwxyzäöüß,.!?-_|‸1234567890 ",
   lower2x3: "abcdefghijklmnopqrstuvwxyz‸ "
}


// setup

export const palette = {}
let lerpLength = 6

export let effect = "none"
export let midlineEffects = ["compress", "spread", "twist", "split", "sway", "teeth", "turn"]
export let stripeEffects = ["vstripes", "hstripes"]
export let webglEffects = ["spheres"]
export let defaultRenderer = undefined //use p5 WEBGL or SVG or "" below

export let endCapStyle = "none"
let branchStyle = "round"
export let viewMode = "default"

let initialDraw = true

export const mode = {
   // visual
   svg: false,
   dark: true,
   drawFills: true,
   spreadFills: true,
   wave: false,
   centeredEffect: false,
   centeredOffset: false,
   boundingBoxes: false,
   // use alt letters?
   noLigatures: false,
   altS: false,
   altDia: false,
   altSquare: false,
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
export const finalValues = {
   size: undefined,
   rings: undefined,
   spacing: undefined,
   weight: undefined,
   ascenders: undefined,
   zoom: undefined,
   offsetX: undefined,
   offsetY: undefined,
   stretchX: undefined,
   stretchY: undefined,
   spreadX: undefined,
   spreadY: undefined,
}
// used for debug purposes, doesn't need to be global otherwise
// because everything happens in drawText
let letterInfo = []

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

   defaultRenderer = "";

   canvasEl = createCanvas(windowWidth-300, windowHeight,(webglEffects.includes(effect))?WEBGL:(mode.svg)?SVG:defaultRenderer)
   canvasEl.parent('sketch-holder')
   if (!webglEffects.includes(effect) && defaultRenderer !== WEBGL) {
      strokeCap(ROUND)
      textFont("Courier Mono")
      if (mode.svg) strokeScaleFactor = values.zoom.from
   } else {
      strokeScaleFactor = values.zoom.from
   }
   frameRate(60)
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
      focusedEl = "text"
   })
   writeEl.addEventListener('focusout', () => {
      focusedEl = "none"

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
         "abcdefghijklm\nnopqrstuvwxy\nzäöüß_-|.,:!?\n1234567890",
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

   toggles.darkmodeToggle = document.getElementById('checkbox-darkmode')
   toggles.darkmodeToggle.checked = mode.dark
   toggles.darkmodeToggle.addEventListener('click', () => {
      mode.dark = toggles.darkmodeToggle.checked
      writeToURL()
   })
   toggles.svgToggle = document.getElementById('checkbox-svg')
   toggles.svgToggle.checked = mode.svg
   toggles.svgToggle.addEventListener('click', () => {
      mode.svg = toggles.svgToggle.checked
      writeToURL()
      if (!toggles.svgToggle.checked) {
         location.reload()
      }
   })
   toggles.centerEffectsToggle = document.getElementById('checkbox-centereffects')
   toggles.centerEffectsToggle.checked = mode.centeredEffect
   toggles.centerEffectsToggle.addEventListener('click', () => {
      mode.centeredEffect = toggles.centerEffectsToggle.checked
      writeToURL()
   })
   toggles.altDiaToggle = document.getElementById('checkbox-altDia')
   toggles.altDiaToggle.checked = mode.altDia
   toggles.altDiaToggle.addEventListener('click', () => {
      mode.altDia = toggles.altDiaToggle.checked
      writeToURL()
   })
   toggles.altSquareToggle = document.getElementById('checkbox-altSquare')
   toggles.altSquareToggle.checked = mode.altSquare
   toggles.altSquareToggle.addEventListener('click', () => {
      mode.altSquare = toggles.altSquareToggle.checked
      writeToURL()
   })
   // toggles.altSToggle = document.getElementById('checkbox-altS')
   // toggles.altSToggle.checked = mode.altS
   // toggles.altSToggle.addEventListener('click', () => {
   //    mode.altS = toggles.altSToggle.checked
   //    writeToURL()
   // })
   toggles.roundcapsToggle = document.getElementById('checkbox-roundcaps')
   toggles.roundcapsToggle.checked = (endCapStyle === "round")
   toggles.roundcapsToggle.addEventListener('click', () => {
      endCapStyle = (toggles.roundcapsToggle.checked) ? "round" : "none"
      writeToURL()
   })
   toggles.roundbranchesToggle = document.getElementById('checkbox-roundbranches')
   toggles.roundbranchesToggle.checked = (branchStyle === "round")
   toggles.roundbranchesToggle.addEventListener('click', () => {
      branchStyle = (toggles.roundbranchesToggle.checked) ? "round" : "square"
      writeToURL()
   })
   toggles.spreadFillsToggle = document.getElementById('checkbox-spreadfills')
   toggles.spreadFillsToggle.checked = mode.spreadFills
   toggles.spreadFillsToggle.addEventListener('click', () => {
      mode.spreadFills = toggles.spreadFillsToggle.checked
      writeToURL()
   })

   const clamp = (num, min, max) => Math.min(Math.max(num, min), max)

   for (const [property, numberInput] of Object.entries(numberInputsObj)) {
      numberInput.element.value = values[property].from
      numberInput.element.addEventListener('input', () => {
         if (numberInput.element.value !== "") {
            values[property].to = clamp(numberInput.element.value, numberInput.min, numberInput.max)
            wiggleMode = false
            writeToURL()
         }
      })
      numberInput.element.addEventListener("focusin", () => {
         focusedEl = property
         wiggleMode = true
         framesSinceInteract = 0
      })
      numberInput.element.addEventListener("focusout", () => {
         focusedEl = "none"
         wiggleMode = false
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
   if (params.color !== null && params.color.length > 0) {
      const colArray = String(params.color).split(".")
      values.hueLight.from = parseInt(colArray[0])
      values.hueDark.from = parseInt(colArray[1])
      print("Loaded with URL Colors", colArray)
   }
   if (params.wave === "true" || params.wave === "1") {
      mode.wave = true
      print("Loaded with URL Mode: Wave")
   }
   if (params.centerfx === "true" || params.centerfx === "1") {
      mode.centeredEffect = true
      print("Loaded with URL Mode: Centered Effect")
   }
   if (params.view !== undefined) {
      switch (params.view) {
         case "xray":
            viewMode = "xray"
            print("Loaded with View Mode: X-Ray")
            break;
         case "colorful":
            viewMode = "colorful"
            print("Loaded with View Mode: More colorful")
            break;
         case "mono":
            viewMode = "mono"
            print("Loaded with View Mode: mono")
            break;
         default:
            print("Could not load view mode")
            break;
      }
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
         case "up3x2":
            font = "upper3x2"
            print("Loaded typeface: Uppercase 3x2")
            break;
         case "low2x2":
            font = "lower2x2"
            print("Loaded typeface: Lowercase 2x2")
            break;
         case "low2x3":
            font = "lower2x3"
            print("Loaded with typeface: Lowercase 2x3")
            break;
         default:
            print("Loaded with default typeface")
      }
   }
   if (params.lines !== null && params.lines.length > 0) {
      linesArray = String(params.lines).split("~")
      print("Loaded with URL Text", linesArray)
   }
   if (params.values !== null && params.values.length > 0) {
      const valString = String(params.values)
      const valArray = valString.split(/_|\./)

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
         print("Has to be 12 negative or positive numbers with _ or . in between")
      }
   }
}

function writeToURL (noReload) {

   let URL = String(window.location.href)
   if (URL.includes("?")) {
      URL = URL.split("?",1)
   }

   const newParams = new URLSearchParams();


   // for the main array of animated values
   function getValue(key) {
      if (values[key].to === undefined) {
         return values[key].from
      } else {
         return values[key].to
      }
   }

   // add all setting parameters if any of them are not default
   if (!mode.auto) {

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

      newParams.append("values",valueArr.join("."))
   }

   if (linesArray[0] !== "hamburgefonstiv" || linesArray.length >= 1) {
      newParams.append("lines", linesArray.join("~"))
   }
   if (getValue("hueLight") !== "123" || getValue("hueDark") !== "123") {
      newParams.append("color", getValue("hueLight") + "." + getValue("hueDark"))
   }

   // add other parameters afterwards
   if (mode.svg) {
      newParams.append("svg",true)
   }
   if (!mode.dark) {
      newParams.append("invert",true)
   }
   if (viewMode !== undefined) {
      let value = "default"
      if (viewMode === "mono") {
         value = "mono"
      } else if (viewMode === "xray") {
         value = "xray"
      } else if (viewMode === "colorful") {
         value = "colorful"
      }
      if (value !== "default") {
         newParams.append("view", value)
      }
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
   if (mode.centeredEffect) {
      newParams.append("centerfx",true)
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
   if (font !== "lower3x2") {
      switch (font) {
         case "upper3x2":
            newParams.append("font", "up3x2")
            break;
         case "lower2x2":
            newParams.append("font", "low2x2")
            break;
         case "lower2x3":
            newParams.append("font", "low2x3")
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

window.keyTyped = function () {
   if (focusedEl !== "none") {
      return
   }
   if (key === 'r') {
      randomStyle()
      writeToURL()
      updateInGUI()
   } else if (key === "c") {
      toggles.roundcapsToggle.click()
      toggles.roundcapsToggle.checked = (endCapStyle === "round")
   } else if (key === "b") {
      toggles.roundbranchesToggle.click()
      toggles.roundbranchesToggle.checked = (branchStyle === "round")
   } else if (key === "1") {
      dropdownTextToEffect("default look")
   } else if (key === "2") {
      dropdownTextToEffect("x-ray")
   } else if (key === "3") {
      dropdownTextToEffect("more colorful")
   } else if (key === "4") {
      dropdownTextToEffect("monochrome")
   } else if (key === "x") {
      mode.boundingBoxes = true;
   }
}
window.keyReleased = function () {
   if (key === "x") {
      mode.boundingBoxes = false;
   }
}

window.keyPressed = function () {
   if (keyCode === LEFT_ARROW) {
      framesSinceInteract = 0
   } else if (keyCode === RIGHT_ARROW) {
      framesSinceInteract = 0
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

// function activeWiggle () {
//    if (focusedEl !== "none" && focusedEl !== "text") {
//       values[focusedEl].to
//    }
// }

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
   framesSinceInteract++ // like frameCount, but since last interaction

   if (mode.auto) {
      autoValues()
   }

   // if a "to" value in the values object is not undefined, get closer to it by increasing that "lerp"
   // when the "lerp" value is at 6, the "to" value has been reached,
   // and can be cleared again, new "from" value set.

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
   function switchColors (key, forMenu) {
      function getColorSL () {
         let saturation; let lightness;
         if (key === "hueDark") {
            if (forMenu) {
               saturation = 100
               lightness = 5
            } else if (mode.dark) {
               saturation = 100
               lightness = (viewMode === "colorful") ? 4 : 6
            } else {
               saturation = 100
               lightness = (viewMode === "colorful") ? 35 : 20
            }
         } else if (key === "hueLight") {
            if (forMenu) {
               saturation = 100
               lightness = 90
            } else if (mode.dark) {
               saturation = 100
               lightness = (viewMode === "colorful") ? 76 : 90
            } else {
               saturation = 100
               lightness = (viewMode === "colorful") ? 96 : 99
            }
         }
         return {s: saturation, l: lightness}
      }

      function invertedKey (key) {
         if (key === "hueDark") return "hueLight"
         return "hueDark"
      }

      const components = getColorSL()
      const slider = (mode.dark || forMenu) ? values[key] : values[invertedKey(key)]

      const colorFrom = color('hsl('+slider.from+', '+components.s+'%, '+components.l+'%)')
      const colorTo = color('hsl('+slider.to+', '+components.s+'%, '+components.l+'%)')
      if (slider.to === undefined) { return colorFrom }
      return lerpColor(colorFrom, colorTo, slider.lerp/lerpLength)


   }

   function lerpValues (key) {
      const slider = values[key]

      // not a color
      if (slider.to === undefined) {
         // just return the base value, but add wiggle if active
         let wiggle = 0
         if (focusedEl === key && wiggleMode) {
            const animDuration = framesSinceInteract / 20
            if (animDuration <= 1) {
               wiggle += (animDuration < 0.5) ? easeInOutCubic(animDuration*2) : easeInOutCubic((1-animDuration)*2)
            }
         }
         return slider.from + wiggle
      } else {
         return map(slider.lerp,0,lerpLength,slider.from, slider.to)
      }
   }

   finalValues.size = lerpValues("size")
   finalValues.rings = lerpValues("rings")

   // if there is no room for extra rings, then don't display them
   // if rings would cover more than half the size, cut to nearest integer so that there is a gap of 1 at least in the middle)
   if (finalValues.rings > finalValues.size/2+1) {finalValues.rings = Math.ceil(finalValues.size/2-1) +1}
   // if they only go a bit too far, like <1 into that gap, let it go halfway and then back to show the problem visually
   const ringsWeightMax = (finalValues.size - 1) / 2
   if (finalValues.rings > ringsWeightMax+1) {
      finalValues.rings = ringsWeightMax+1 - (finalValues.rings-ringsWeightMax-1)
   }

   // if inner size is below 2, add 1 grid size of vertical stretch
   animExtraY = 0;
   if (font !== "lower2x3") animExtraY = map(getInnerSize(finalValues.size, finalValues.rings), 1,2, 1,0, true)

   finalValues.spacing = lerpValues("spacing")
   // if less than 2 rings, approach a minimum forced spacing of 1 no matter what - right now just for lowercase 3x
   // something similar happens in the letterKerning function...
   if (font === "lower3x2" && finalValues.rings < 2) finalValues.spacing = max(2-finalValues.rings, finalValues.spacing)
   finalValues.offsetX = lerpValues("offsetX")
   finalValues.offsetY = lerpValues("offsetY")
   finalValues.stretchX = lerpValues("stretchX")
   finalValues.stretchY = lerpValues("stretchY")
   //WIP, means it always aligns with grid though
   const ringCountToSpread = (mode.spreadFills) ? finalValues.rings : finalValues.rings-1
   finalValues.spreadX = lerpValues("spreadX") * (ringCountToSpread) * 2 
   finalValues.spreadY = lerpValues("spreadY") * (ringCountToSpread) * 2
   finalValues.weight = lerpValues("weight")
   finalValues.ascenders = lerpValues("ascenders") * 0.5
   animColorDark = switchColors("hueDark", false)
   animColorLight = switchColors("hueLight", false)
   finalValues.zoom = lerpValues("zoom")

   const lightColor = (viewMode === "mono" || viewMode === "xray") ? color("white") : animColorLight
   const darkColor = (viewMode === "mono" || viewMode === "xray") ? color("black") : animColorDark

   const lightMenuColor = (viewMode === "mono" || viewMode === "xray") ? color("white") : switchColors("hueLight", true)
   const darkMenuColor = (viewMode === "mono" || viewMode === "xray") ? color("black") : switchColors("hueDark", true)

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

   document.documentElement.style.setProperty('--fg-color', rgbValues(lightMenuColor))
   document.documentElement.style.setProperty('--bg-color', rgbValues(darkMenuColor))

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
   if (webglEffects.includes(effect) || defaultRenderer === WEBGL) translate(-width/2, -height/2)
   translate(40, 40)
   scale(finalValues.zoom)

   // font styles with ascenders and descenders start lower so they stay on screen
   if (fontsLower.includes(font)) {
      translate(0, finalValues.ascenders)
   }

   strokeWeight((finalValues.weight/10)*strokeScaleFactor)
   palette.fg.setAlpha(255)

   push()
   // draw certain effects below everything
   if (stripeEffects.includes(effect)) {
      drawGrid(effect)
   }
   // draw the whole text
   for (let i = 0; i < linesArray.length; i++) {
      letterInfo[i] = []
      drawText(i)
   }
   pop()

   // draw debug grid always on top
   if (viewMode === "xray") {
      drawGrid("xray")
   }

   function drawGrid (type) {
      push()
      if (webglEffects.includes(effect)) translate(0,0,-1)
      let fontSize = finalValues.size
      if (fonts3x.includes(font)) fontSize = finalValues.size*2 - min(finalValues.rings, finalValues.size/2) + 1
      const gridHeight = fontSize + Math.abs(finalValues.offsetY) + finalValues.stretchY + finalValues.spreadY + animExtraY
      const gridWidth = (width-60)/finalValues.zoom
      const asc = (!fontsLower.includes(font)) ? 0 : finalValues.ascenders

      if (type === "xray") {
         translate(0,0.5*finalValues.size)
         for (let lineNum = 0; lineNum < linesArray.length; lineNum++) {
            stroke("#00FFFF50")
            strokeWeight(0.2*strokeScaleFactor)
      
            const i = lineNum * totalHeight[lineNum] - finalValues.size/2
   
            // special horizontal gridlines
            lineType(0, i, gridWidth, i)
            lineType(0, i+gridHeight, gridWidth, i+gridHeight)
            if (font === "lower2x2" || font === "lower2x3") {
               //asc/desc
               lineType(0, i-asc, gridWidth, i-asc)
               lineType(0, i+gridHeight+asc, gridWidth, i+gridHeight+asc)
               //midlines
               //wip, finalValues.offsetY now unused - maybe still good that it's brighter?
               //what about staircase effect?
               lineType(0, i+gridHeight/2-finalValues.offsetY*0.5, gridWidth, i+gridHeight/2-finalValues.offsetY*0.5)
               lineType(0, i+gridHeight/2+finalValues.offsetY*0.5, gridWidth, i+gridHeight/2+finalValues.offsetY*0.5)   
            } else if (font === "upper3x2")  {
               lineType(0, i + finalValues.size +finalValues.stretchY*0.5, gridWidth, i + finalValues.size+finalValues.stretchY*0.5)
               lineType(0, i+gridHeight -finalValues.size -finalValues.stretchY*0.5, gridWidth, i+gridHeight -finalValues.size -finalValues.stretchY*0.5)
               //halfway
               lineType(0, i + finalValues.size*0.5, gridWidth, i + finalValues.size*0.5)
               lineType(0, i+gridHeight -finalValues.size*0.5, gridWidth, i+gridHeight -finalValues.size*0.5)
            } else if (font === "lower3x2") {
               lineType(0, i + finalValues.size +finalValues.stretchY*0.5, gridWidth, i + finalValues.size+finalValues.stretchY*0.5)
               lineType(0, i+gridHeight -finalValues.size -finalValues.stretchY*0.5, gridWidth, i+gridHeight -finalValues.size -finalValues.stretchY*0.5)
               //halfway
               lineType(0, i + finalValues.size*0.5, gridWidth, i + finalValues.size*0.5)
               lineType(0, i+gridHeight -finalValues.size*0.5, gridWidth, i+gridHeight -finalValues.size*0.5)
            }
            palette.fg.setAlpha(50)
            strokeWeight(0.1*strokeScaleFactor)
            stroke(palette.fg)

            //horizontal gridlines
            push()
            translate(0,i)
            for (let y = 0; y <= gridHeight; y++) {
               lineType(0, y, gridWidth, y)
            }
            pop()

            //vertical gridlines
            push()
            translate(0,i+gridHeight*0.5)
            for (let x = 0; x <= gridWidth; x++) {
               lineType(x, -gridHeight/2-asc, x, gridHeight/2+asc)
            }
            pop()
   
            // markers for start of each letter
            push()
            translate(0,i+gridHeight+Math.ceil(finalValues.ascenders/2)) //gridHeight*0.5
            if (finalValues.offsetX>0) translate(finalValues.offsetX * ((fonts3x.includes(font))?2:1),0)

            stroke(palette.fg)
            strokeWeight(0.8*strokeScaleFactor)

            const lineText = linesArray[lineNum]
            let widthBefore = 0

            for (let c = 0; c < lineText.length; c++) {

               const letterWidth = getWidths(lineText, c, "width")
               const letterKerning = getWidths(lineText, c, "kerningAfter")

               const xLeftPos = widthBefore
               const xRightPos = widthBefore + letterWidth
               const yPos = (c % 2)
               widthBefore += letterWidth + letterKerning

               line(xLeftPos, yPos, xRightPos, yPos)
            }
            pop()
         }
      } else {
         stroke(palette.fg)
         if (viewMode === "xray") {
            strokeWeight(0.2*strokeScaleFactor)
         } else {
            strokeWeight((finalValues.weight/10)*1*strokeScaleFactor)
         }
         push()
         translate(0,-asc)
         if (type === "vstripes") {
            const totalGridHeight = (height-80)/finalValues.zoom //+ (1)*(linesArray.length-1)
            for (let j = 0; j <= gridWidth; j++) {
               lineType(j, 0, j, totalGridHeight)
            }
         }
         if (type === "hstripes") {
            const totalGridHeight = (height-80)/finalValues.zoom
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

   if (viewMode === "xray") {
      textFont("monospace")
      textSize(12)
      push()

      // final values, not rounded
      let textColumnsFinal = [[], []]
      for (const [key, value] of Object.entries(finalValues)) {
         const el0 = key;
         const el1 = roundTo(value, 100);
         textColumnsFinal[0].push(el0)
         textColumnsFinal[1].push(el1)
      }
      translate(15, height-20)
      fill(palette.fg)
      text(textColumnsFinal[0].join("\n"), 0, - textColumnsFinal[0].length*15)
      fill(palette.xrayFg)
      text(textColumnsFinal[1].join("\n"), 70, - textColumnsFinal[0].length*15)

      // per letter
      let textColumnsLetters = [[], []]
      letterInfo[0].forEach((letter) => {
         textColumnsLetters[0].push(letter[0])
         let properties = []
         for (const [key, value] of Object.entries(letter[1])) {
            properties.push(key + ":" + value)
         }
         textColumnsLetters[1].push(properties.join(" "))
      })
      
      translate(120, 0)
      fill(palette.fg)
      text(textColumnsLetters[0].join("\n"), 0, - textColumnsLetters[0].length*15)
      fill(palette.xrayFg)
      text(textColumnsLetters[1].join("\n"), 12, - textColumnsLetters[0].length*15)
      pop()

      push()
      translate(300, height-100)
      graph(framesSinceInteract, "size", 0, 0, 80, 80); translate(90, 0);
      graph(framesSinceInteract, "rings", 0, 0, 80, 80); translate(90, 0);
      graph(framesSinceInteract, "spacing", 0, 0, 80, 80); translate(90, 0);
      graph(framesSinceInteract, "fps", 0, 0, 80, 80); translate(90, 0);
      pop()
   }
}

const graphs = {}

function graph (time, key, x, y, w, h) {

   const currentVal = (finalValues[key] !== undefined) ? finalValues[key] : findVariable(key)

   function findVariable (key) {
      if (key === "fps") return frameRate();
   }

   if (time < 60) {
      if (graphs[key] === undefined || time === 1) {
         if (currentVal === 0) {
            graphs[key] = {arr:[], min:-2, max:2}
         } else {
            graphs[key] = {arr:[], min:currentVal/2, max:currentVal*2}
         }
         if (key === "fps") graphs[key].min = 0;
      }
   } else {
      graphs[key].arr.shift()
   }

   if (graphs[key] !== undefined) {
      graphs[key].arr.push(currentVal)
      if (currentVal > graphs[key].max) graphs[key].max = currentVal;
      if (currentVal < graphs[key].min) graphs[key].min = currentVal;
   }

   noStroke()
   fill(palette.fg)
   const roundingFactor = (key === "fps") ? 1 : 100
   text(key + " " + roundTo(currentVal, roundingFactor), x, y - 10)

   palette.fg.setAlpha(150)
   fill(palette.fg)
   text(roundTo(graphs[key].max, roundingFactor), x, y+10)
   text(roundTo(graphs[key].min, roundingFactor), x, y+h)

   palette.fg.setAlpha(20)
   fill(palette.fg)
   rect(x, y, w, h)
   

   strokeWeight(1)

   if (time > 60) {
      stroke(palette.fg)
      const linePos = map(60 - time % 60, 0, 60, x, x+w)
      line(linePos, y, linePos, y+h)
   }

   stroke(palette.xrayFg)
   palette.fg.setAlpha(255)
   

   //draw graph
   graphs[key].arr.forEach((value, index) => {
      if (index > 0) {
         const prevValue = graphs[key].arr[index-1]
         line(
            map(index-1, 0, graphs[key].arr.length, x, x+w), 
            map(prevValue, graphs[key].min, graphs[key].max, y+h, y), 
            map(index, 0, graphs[key].arr.length, x, x+w), 
            map(value, graphs[key].min, graphs[key].max, y+h, y)
         )
      }
   })
}

function getInnerSize (size, rings) {
   let innerSize = min(size - (rings-1) * 2, size)

   //if (finalValues.size % 2 === 0) {
   //   return max(2, innerSize)
   //}
   //return max(1, innerSize)

   return innerSize
}

export function charInSet (char, sets) {

   let found = false
   sets.forEach((set) => {
      if (found === false) {
         if (font === "lower2x2") {
            switch (set) {
               case "ul":
                  //up left sharp
                  found ||= "bhikltuüvwy".includes(char)
                  found ||= (mode.altSquare && "n".includes(char))
                  found ||= (mode.altDia && "m".includes(char))
                  found ||= !validLetters[font].includes(char)
                  break;
               case "dl":
                  //down left sharp
                  found ||= "hikmnprfv".includes(char)
                  found ||= (mode.altDia && "w".includes(char))
                  found ||= !validLetters[font].includes(char)
                  break;
               case "ur":
                  //up right sharp
                  found ||= "dijuüvwygl".includes(char)
                  found ||= (mode.altSquare && "nh".includes(char))
                  found ||= (mode.altDia && "m".includes(char))
                  found ||= !validLetters[font].includes(char)
                  break;
               case "dr":
                  //down right sharp
                  found ||= "aähimnqyeg".includes(char)
                  found ||= (mode.altDia && "wv".includes(char))
                  found ||= !validLetters[font].includes(char)
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
         } else if (font === "upper3x2") {
            switch (set) {
               case "ul":
                  //up left sharp
                  found ||= "bdhijklmnprtuvwxyz1457".includes(char)
                  found ||= (mode.altSquare && "ef".includes(char))
                  found ||= (mode.altDia && "a".includes(char))
                  found ||= !validLetters[font].includes(char)
                  break;
               case "dl":
                  //down left sharp
                  found ||= "abdfhijkmnprvwxz1247&".includes(char)
                  found ||= (mode.altSquare && "e".includes(char))
                  found ||= !validLetters[font].includes(char)
                  break;
               case "ur":
                  //up right sharp
                  found ||= "efhijkmtuvwxyz1457".includes(char)
                  found ||= (mode.altSquare && "nßg&".includes(char))
                  found ||= (mode.altDia && "a".includes(char))
                  found ||= !validLetters[font].includes(char)
                  break;
               case "dr":
                  //down right sharp
                  found ||= "aefhikmnpqrvwxz1247".includes(char)
                  found ||= (mode.altSquare && "g".includes(char))
                  found ||= !validLetters[font].includes(char)
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
         } else if (font === "lower3x2") {
            switch (set) {
               case "ul":
                  //up left sharp
                  found ||= "bhijkltuüvwxyz1457".includes(char)
                  found ||= (mode.altSquare && "n".includes(char))
                  found ||= !validLetters[font].includes(char)
                  break;
               case "dl":
                  //down left sharp
                  found ||= "fhiklmnprvxzß1247".includes(char)
                  found ||= (!mode.noLigatures && "j".includes(char))
                  found ||= !validLetters[font].includes(char)
                  break;
               case "ur":
                  //up right sharp
                  found ||= "dfijkltuüvwxyz1457".includes(char)
                  found ||= (mode.altSquare && "nh".includes(char))
                  found ||= !validLetters[font].includes(char)
                  break;
               case "dr":
                  //down right sharp
                  found ||= "fghiklmnqrxyz1247".includes(char)
                  found ||= (!mode.noLigatures && "t".includes(char))
                  found ||= !validLetters[font].includes(char)
                  break;
               case "gap":
                  //separating regular letters
                  found ||= "., :;-_!?‸|".includes(char)
                  break;
            }
         } else if (font === "lower2x3") {
            switch (set) {
               case "ul":
                  //up left sharp
                  found ||= "befhijklnprtuvwysz".includes(char)
                  found ||= !validLetters[font].includes(char)
                  break;
               case "dl":
                  //down left sharp
                  found ||= "befhijklmnprvsz".includes(char)
                  found ||= !validLetters[font].includes(char)
                  break;
               case "ur":
                  //up right sharp
                  found ||= "adgijlqruvwysz".includes(char)
                  found ||= !validLetters[font].includes(char)
                  break;
               case "dr":
                  //down right sharp
                  found ||= "adghijlmnqruwysz".includes(char)
                  found ||= !validLetters[font].includes(char)
                  break;
               case "gap":
                  //separating regular letters
                  found ||= "., :;-_!?‸|".includes(char)
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
   if (focusedEl === "text" && viewMode !== "xray" && !mode.svg && (writeEl.selectionStart === writeEl.selectionEnd)) {
      let totalChars = 0
      for (let l = 0; l < linesArray.length; l++) {
         //found current line
         if (l === lineNum) {
            for (let c = 0; c < lineText.length+1; c++) {
               if (framesSinceInteract % 40 < 25 && totalChars+c === writeEl.selectionStart) {
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
   const lineCharWidths = []
   for (let c = 0; c < lineText.length; c++) {
      const letterWidth = getWidths(lineText, c, "width")
      const letterKerning = (c < lineText.length) ? getWidths(lineText, c, "kerningAfter") : 0
      lineCharWidths.push(letterWidth+letterKerning)
   }

   // used for svg width
   totalWidth[lineNum] = lineCharWidths.reduce((a, b) => a + b, 0)

   // total height
   let fontSize = finalValues.size
   let stretchSize = finalValues.stretchY + finalValues.spreadY + animExtraY*0.5
   if (fonts3x.includes(font)) {
      fontSize = finalValues.size*2 - min(finalValues.rings, finalValues.size/2)

      //WIP: this would make each stretch side be an integer...
      //stretchSize *= 2
   }
   //staircase height
   //let staircaseHeight = (effect === "staircase") ? Math.abs(finalValues.offsetX) : 0
   //WIP should this be used instead of y?

   totalHeight[lineNum] = fontSize + Math.abs(finalValues.offsetY) + stretchSize + finalValues.ascenders + max(1,finalValues.spacing)
   // add a space so that 0 space means they have a single gap
   if (fonts3x.includes(font)) totalHeight[lineNum]++;

   // wip test: always fit on screen?
   //values.zoom.from = (width) / (Math.max(...totalWidth)+7)


   //translate to account for x offset
   push()
   if (finalValues.offsetX < 0 && effect !== "staircase") {
      translate(-finalValues.offsetX,0)
   } else if (finalValues.offsetX > 0 && effect !== "staircase" && (fonts3x.includes(font))) {
      //go the other way for 3-tiered text
      translate(finalValues.offsetX,0)
   }

   //translate to (lower) midline
   translate(0,fontSize-0.5*finalValues.size)
   if (fonts3x.includes(font)) translate(0, 1 + (finalValues.stretchY + finalValues.spreadY)*0.5)


   // go through all the letters, but this time to actually draw them
   // go in a weird order so that lower letters go first
   let connectingUnderPrev = "sjzx"
   if (font === "upper3x2") connectingUnderPrev = "jt"
   else if (font === "lower3x2") connectingUnderPrev = "j"

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
      const MINDISTANCETOFILL = finalValues.weight/10
      const SPREADFILLWIDTH = (finalValues.spreadX*0.5) / (finalValues.rings)
      const SPREADFILLHEIGHT = (finalValues.spreadY*0.5) / (finalValues.rings)
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
      stretchFxSpots: [[...Array(SPREADFILLSTEPSX+1)].map(x => [])],
      centerFxSpots: [[...Array(SPREADFILLSTEPSX+1)].map(x => [])],
      stopSpots: [],
      caretSpots: [],
      spaceSpots: [],
   }
   if (fonts3x.includes(font)) {
      lineStyle.stretchFxSpots = [
         [...Array(SPREADFILLSTEPSX+1)].map(x => []), 
         [...Array(SPREADFILLSTEPSX+1)].map(x => [])
      ]
      lineStyle.centerFxSpots = [
         [...Array(SPREADFILLSTEPSX+1)].map(x => []), 
         [...Array(SPREADFILLSTEPSX+1)].map(x => [])
      ]
   }
   

   fillCornerLayers = {
      linecut: {},
      roundcut: {},
   }


   // now go through each letter of the line, in above determined layer order
   for (let layerPos = 0; layerPos < lineText.length; layerPos++) {

      // VALUES -----------------------------------------------------------------------------

      // ring sizes for this character
      let letterInner = getInnerSize(finalValues.size, finalValues.rings) //+ [2,4,3,-2,0,2,4,5][i % 8]
      let letterOuter = finalValues.size //+ [2,4,3,-2,0,2,4,5][i % 8]

      // change depending on the character index (i) if wave mode is on
      letterInner = waveInner(layerArray.indexOf(layerPos), letterInner, letterOuter)

      // make and fill array with all ring sizes for this letter
      let ringSizes = []
      for (let b = letterOuter; b > letterInner-2; b-=2) {
         // smallest ring is animated
         let size = (b < letterInner) ? letterInner : b
         ringSizes.push(size)
      }

      let calcPosFromTop = lineNum*totalHeight[lineNum]
      //place lower because of negative offset
      if (finalValues.offsetY<0) calcPosFromTop -= finalValues.offsetY
      if (finalValues.offsetX<0 && effect === "staircase") {
         //first line matters for staircase
         calcPosFromTop -= finalValues.offsetX * offsetUntil(linesArray[0], linesArray[0].length)
      }

      // style per letter, modify during drawing when needed
      const letter = {
         // get characters
         // pretend there is a space before the first and after the last character
         char: lineText[layerArray.indexOf(layerPos)],
         next: (lineText[layerArray.indexOf(layerPos)+1] !== undefined) ? lineText[layerArray.indexOf(layerPos)+1] : " ",
         previous: (lineText[layerArray.indexOf(layerPos)-1] !== undefined) ? lineText[layerArray.indexOf(layerPos)-1] : " ",
         //for entire line, but need while drawing
         stretchFxSpots: lineStyle.stretchFxSpots,
         centerFxSpots: lineStyle.centerFxSpots,
         caretSpots: lineStyle.caretSpots,
         spaceSpots: lineStyle.spaceSpots,
         stopSpots: lineStyle.stopSpots,
         // position and offset after going through all letters in the line until this point
         posFromLeft: lineCharWidths.slice(0, layerArray.indexOf(layerPos)).reduce((a, b) => a + b, 0),
         posFromTop: calcPosFromTop,
         vOffset: offsetUntil(lineText, layerArray.indexOf(layerPos)),
         // basics
         sizes: ringSizes,
         opacity: 1,
         // simply copy values - could do some adjustments per letter, though!
         stroke: finalValues.weight,
         spacing: finalValues.spacing,
         ascenders: finalValues.ascenders,
         offsetX: (effect==="staircase")? 0 : finalValues.offsetX,
         offsetX1: (effect==="staircase")? 0 : finalValues.offsetX * ((mode.centeredOffset)? -1 : 1), //top tier in font b/c
         offsetY: (effect==="staircase")? finalValues.offsetX : finalValues.offsetY,
         stretchX: finalValues.stretchX,
         stretchY: finalValues.stretchY,
         extraY: animExtraY,
         spreadX: finalValues.spreadX,
         spreadY: finalValues.spreadY,
         spreadFillSteps: SPREADFILLSTEPSX,
         endCap: endCapStyle,
         branchStyle: branchStyle,
         xtier: 0, // for wider letters - also inverts flipped if on
         ytier: 0, // for letters with more than 1 level
         flipped: false, // for gradients
         // convenient values
         weight: (letterOuter-letterInner)*0.5,
      }

      // DESCRIBING THE FILLED BACKGROUND SHAPES AND LINES OF EACH LETTER
      drawLetter(letter, font)

      // DEBUG
      letterInfo[lineNum].push([letter.char, {
         x: roundTo(letter.posFromLeft, 100), 
         // y: roundTo(letter.posFromTop, 100),
      }])
      if (layerPos === lineText.length-1) {
         letterInfo[lineNum].push([">", {
            s: letter.sizes.map(s => roundTo(s, 100)),
            w: roundTo(letter.weight, 100)
         }])
      }
   }

   if (midlineEffects.includes(effect)) {
      // style - the actual stroke color is changed inside the function
      noFill()
      strokeWeight((finalValues.weight/10)*strokeScaleFactor)
      if (viewMode === "xray") {
         strokeWeight(0.2*strokeScaleFactor)
      }
      // run for each stage
      if (fonts3x.includes(font)) {
         if (mode.centeredEffect) {
            drawMidlineEffects(0, "centered", lineStyle)
         }

         push()
         translate(0, -finalValues.size+(finalValues.rings-1)- finalValues.stretchY - finalValues.spreadY)
         drawMidlineEffects(1, "stretch", lineStyle)
         pop()

         push()
         translate(-finalValues.offsetX,0)
         drawMidlineEffects(0, "stretch", lineStyle)
         pop()

         //if (frameCount === 1) print("Midlines:", lineStyle.stretchFxSpots)
      } else {
         drawMidlineEffects(0, "centered", lineStyle)
      }
      
   }

   function drawMidlineEffects (ytier, positionMode, lineStyle) {
      push()
      stroke(palette.fg)

      // remove stretch fx spots where center fx spots are to prevent overlaps
      if (mode.centeredEffect && positionMode === "stretch" && (fonts3x.includes(font))) {
         for (let i = 0; i < lineStyle.stretchFxSpots[ytier].length; i++) {
            // compare only tier 0 for now, but do for every spread (i)
            const myArray = lineStyle.stretchFxSpots[ytier][i];
            const toRemove = lineStyle.centerFxSpots[0][i];

            lineStyle.stretchFxSpots[ytier][i] = myArray.filter((el) => !toRemove.includes(el));
         }
      }

      const stretchFxSpots = (positionMode === "centered" && (fonts3x.includes(font))) ? lineStyle.centerFxSpots : lineStyle.stretchFxSpots;
      const caretSpots = lineStyle.caretSpots;
      const spaceSpots = lineStyle.spaceSpots;
      const stopSpots = lineStyle.stopSpots;

      let stretchHeight = finalValues.stretchY
      if (fonts3x.includes(font)) {
         if (positionMode === "centered") {
            stretchHeight = (finalValues.size - finalValues.rings) + 1 + finalValues.stretchY
         } else {
            stretchHeight = finalValues.stretchY*0.5
         }
      }

      if (fonts3x.includes(font)) {
         if (positionMode === "centered") {
            translate(0, -stretchHeight*0.5 + finalValues.stretchY*0.5)
         } else {
            const layerDir = (ytier > 0) ? 0.75 : 0.25
            translate(0, (Math.abs(finalValues.offsetY) + finalValues.stretchY + finalValues.spreadY)*layerDir)
         }
      } else {
         translate(0, (Math.abs(finalValues.offsetY) + finalValues.stretchY + finalValues.spreadY)*0.5)
      }
      
      translate(0, lineNum * totalHeight[lineNum])

      //style and caret
      stroke(lerpColor(palette.bg, palette.fg, 0.5))
      rowLines("bezier", [caretSpots[0], caretSpots[0]+finalValues.offsetX], finalValues.stretchY)
      stroke(palette.fg)

      for (let i = 0; i < stretchFxSpots[ytier].length; i++) {

         //strokeWeight((finalValues.weight/10)*strokeScaleFactor)
         //if (Math.floor(frameCount/20) % stretchFxSpots[layer].length !== i) strokeWeight(0.03)
         const singleSpreadFillSpots = stretchFxSpots[ytier][i]

         const wordSpots = []
         let untilSpaceIndex = 0
         
         singleSpreadFillSpots.forEach((pos) => {
            const spaceSpot = spaceSpots[untilSpaceIndex] + finalValues.offsetX*((ytier === 0)?1:-1)
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

         // split words into segments further if positionMode is centered
         //if (positionMode === "centered") {
         //   wordSpots.forEach((word) => {
         //      word = word
         //   })
         //}


         if (frameCount === 1) print("Line:", lineText, ", Layer:", ytier, ", Mid Connection Spots:", wordSpots)
         if (frameCount === 1  && stopSpots !== undefined) print(stopSpots)
         // show spaces
         // lineStyle.spaceSpots.forEach((pos) => {
            // const x = pos + finalValues.offsetX * ((layer === 0) ? 1 : -1)
            // lineType(x,0, x+0.5, -3)
         // })

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
               
               const xBend = (mode.centeredEffect) ? 0 : finalValues.offsetX
               if (mode.centeredEffect && positionMode === "stretch") {
                  // move the top tier with offset also
                  if (ytier === 1) pos = pos + finalValues.offsetX
               }
               const fx = (mode.centeredEffect && positionMode === "stretch" || leftPos === rightPos) ? "none" : effect
               const strength = 1 //sin(frameCount/10) * 0.5 + 0.5

               if (fx === "none") {
                  rowLines("line", [pos, pos+xBend], stretchHeight)
               } else if (fx === "spread") {
                  const spreadX = map(counter, 0, total, leftPos, rightPos) + xBend*0.5
                  const midX = lerp(pos+0.5*xBend, spreadX, strength)
                  rowLines("bezier", [pos, midX, pos+xBend], stretchHeight)
               } else if (fx === "compress") {
                  const compressX = (rightPos - total + leftPos + xBend)*0.5 + counter
                  const midX = lerp(pos+0.5*xBend, compressX, strength)
                  rowLines("bezier", [pos, midX, pos+xBend], stretchHeight)
               } else if (fx === "turn") {
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
               } else if (fx === "split") {
                  if (counter > 0) {
                     rowLines("bezier", [pos, lastPos+xBend], stretchHeight)
                     rowLines("bezier", [lastPos, pos+xBend], stretchHeight)
                  }
               } else if (fx === "twist") {
                  if (counter % 2 === 1) {
                     rowLines("bezier", [pos, lastPos+xBend], stretchHeight)
                     rowLines("bezier", [lastPos, pos+xBend], stretchHeight)
                  } else if (counter === total) {
                     rowLines("bezier", [pos, pos+xBend], stretchHeight)
                  }
               } else if (fx === "sway") {
                  if (counter > 0) {
                     rowLines("bezier", [pos, lastPos+xBend], stretchHeight)
                  }
               } else if (fx === "teeth") {
                  const isTop = (counter % 2 === 1);
                  const x = lastPos + (pos-lastPos)*0.5 + ((isTop)? 0:xBend)
                  const y = stretchHeight*-0.5* ((isTop)? 1:-1)
                  const w = pos-lastPos
                  const h = max(0, (stretchHeight-w-1) / 2)
                  if (isTop) {arc(x, y + h, w, w, 0, PI)} else {arc(x, y - h, w, w, PI, TWO_PI)}
                  if (h > 0) {
                     line(x-w/2, y, x-w/2, y + h * ((isTop)? 1:-1))
                     line(x+w/2, y, x+w/2, y + h * ((isTop)? 1:-1))
                  }
                  if (pos === rightPos) {
                     line(x+w/2, -y, x+w/2, -y + max(0, (stretchHeight-1) / 2) * ((isTop)? -1:1))
                  } else if (lastPos === leftPos) {
                     line(x-w/2, -y, x-w/2, -y + max(0, (stretchHeight-1) / 2) * ((isTop)? -1:1))
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

// function widthBetweenLetters (lineText, startIndex, endIndex) {
//    let total = 0
//    //add to total letter per letter until index is reached
//    for (let c = startIndex; c < endIndex; c++) {
//       total
//    }
//    return total
// }

function getWidths (lineText, position, type) {
   // get characters
   const char = lineText[position]
   const nextchar = (lineText[position+1] !== undefined) ? lineText[position+1] : " "
   const prevchar = (lineText[position-1] !== undefined) ? lineText[position-1] : " "
   // WIP not writing this twice lol
   let letterInner = getInnerSize(finalValues.size, finalValues.rings) //+ [2,4,3,-2,0,2,4,5][i % 8] //letterInner = waveInner(c, letterInner, letterOuter)
   let letterOuter = finalValues.size //+ [2,4,3,-2,0,2,4,5][i % 8] 

   if (type === "kerningAfter") {
      return (lineText[position+1] !== undefined) ? kerningAfter(prevchar, char, nextchar, letterInner, letterOuter) : 0
   } else if (type === "width") {
      const extendOffset = ((letterOuter % 2 == 0) ? 0 : 0.5) + ((finalValues.stretchX+finalValues.spreadX)-((finalValues.stretchX+finalValues.spreadX)%2))*0.5
      return letterWidth(prevchar, char, nextchar, letterInner, letterOuter, extendOffset)
   }
}





function letterYOffsetCount (prevchar, char, nextchar) {

   if (" ‸!.,:;|".includes(char)) return 0;

   // width for vertical offset
   let offsetSegments = 0
   if (font !== "lower2x3") {
      switch (char) {
         case "m":
         case "w":
            offsetSegments = 2
            break;
         case "x":
            if (font === "lower2x2") offsetSegments = 2
            else offsetSegments = 1
            break;
         case "s":
            if (font === "lower2x2") {
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
            offsetSegments = 0
            break;
         case "l":
            if (font === "lower3x2") {
               offsetSegments = 0
            } else {
               offsetSegments = 1
            }
            break;
         case "z":
            if (font === "lower2x2") offsetSegments = 2
            else offsetSegments = 1
            break;
         default:
            offsetSegments = 1
            break;
      }
   } else {
      switch (char) {
         case "o":
         case "ö":
         case "c":
         case "v":
            offsetSegments = 1
            break;
         case "m":
         case "w":
            offsetSegments = 3
            break;
         case "i":
         case "l":
         case "j":
            offsetSegments = 0
            break;
         default:
            offsetSegments = 2
            break;
      }
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
         sphere(finalValues.weight/10,6, 6)
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
   // const distance = dist(x1,y1,x2,y2)
   // drawingContext.setLineDash([0, distance/(Math.floor(distance)-1)]);
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
         sphere(finalValues.weight/10,6, 6)
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
   // const distance = (stop-start)*w*0.5
   // drawingContext.setLineDash([0, distance/(Math.floor(distance)-1)]);
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
      case "default look":
         viewMode = "default"
         break;
      case "monochrome":
         viewMode = "mono"
         break;
      case "more colorful":
         viewMode = "colorful"
         break;
      case "x-ray":
         viewMode = "xray"
         framesSinceInteract = 0
         break;
      case "Lowercase 2x2":
         font = "lower2x2"
         print("Switched to Lowercase 2x2 Typeface")
         break;
      case "Uppercase 3x2":
         font = "upper3x2"
         print("Switched to Uppercase 3x2 Typeface")
         break;
      case "Lowercase 3x2":
         font = "lower3x2"
         print("Switched to Lowercase 3x2 Typeface")
         break;
      case "Lowercase 2x3":
         font = "lower2x3"
         print("Switched to Lowercase 2x3 Typeface")
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
   // const isWebgl = webglEffects.includes(effect)
   // if (wasWebgl && !isWebgl) {
   //    canvasEl = undefined
   //    noLoop()
   //    location.reload()
   // }
   // if (!wasWebgl && isWebgl) {
   //    canvasEl = undefined
   //    noLoop()
   //    location.reload()
   // }
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

function easeInOutCubic (x) {
   return x < 0.5 ? 4 * x * x * x : 1 - pow(-2 * x + 2, 3) / 2;
}
