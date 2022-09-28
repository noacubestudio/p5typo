import { drawModule } from "./drawModule.mjs"
import { mode, finalValues, charInSet, sortIntoArray, waveValue } from "../sketch.mjs";

export function drawLetter (letter, font, style) {

   // WIP - explain what these consts are and see if more things need to be described like this
   // maybe move into drawModule and use when necessary via style object boolean properties

   // redefining these, bad... WIP
   const letterOuter = style.sizes[0]
   const letterInner = style.sizes[style.sizes.length]

   const oneoffset = (letterOuter>3 && letterInner>2) ? 1 : 0
   const wideOffset = 0.5*letterOuter + 0.5*letterInner - finalValues.spreadX*0.5
   const extendOffset = waveValue(letterOuter, 0, 0.5) + ((finalValues.stretchX+finalValues.spreadX)-(finalValues.stretchX+finalValues.spreadX)%2)*0.5
   const dotgap = (style.endCap === "round") ? map(style.weight, 0, 1, 1, 0, true) : 1

   const ascenders = finalValues.ascenders
   const descenders = finalValues.ascenders

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
               drawModule(style, "hori", 3, 3, 0, 0, {extend: letterOuter*0.5 + finalValues.stretchX})
            } else if ("x".includes(nextLetter)) {
               drawModule(style, "hori", 3, 3, 0, 0, {extend: letterOuter*0.5 + finalValues.stretchX-style.weight})
            } else if (!charInSet(nextLetter,["dl"])) {
               drawModule(style, "hori", 3, 3, 0, 0, {extend: -oneoffset+max(finalValues.spacing, -style.weight)})
            } else if (finalValues.spacing < 0) {
               drawModule(style, "hori", 3, 3, 0, 0, {extend: -oneoffset+max(finalValues.spacing, -style.weight)})
            } else if (finalValues.spacing > 0){
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
               drawModule(style, "square", 2, 1, wideOffset + finalValues.stretchX*2 + finalValues.spreadX*2, 0, {})
               drawModule(style, "square", 1, 2, wideOffset, 0, {type: "branch", at:"start"})
            } else {
               drawModule(style, "diagonal", 1, 1, 0, 0, {})
               drawModule(style, "diagonal", 2, 2, 0, 0, {})
               // SECOND LAYER
               style.flipped = true
               drawModule(style, "diagonal", 2, 1, wideOffset + finalValues.stretchX*2 + finalValues.spreadX*2, 0, {})
               drawModule(style, "diagonal", 1, 2, wideOffset, 0, {})
            }
            drawModule(style, "vert", 4, 3, wideOffset, 0, {})
            drawModule(style, "vert", 3, 4, wideOffset + finalValues.stretchX*2 + finalValues.spreadX*2, 0, {})
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
                  xOffset = -letterOuter*0.5 + extendOffset -finalValues.stretchX -finalValues.spreadX
                  drawModule(style, "round", 3, 3, xOffset, 0, {type: "extend", at:"end"})
               } else {
                  drawModule(style, "round", 3, 3, xOffset, 0, {})
               }
               if (!charInSet(nextLetter,["gap", "ul"]) && !"zxj".includes(nextLetter) || nextLetter === "s") {
                  drawModule(style, "round", 1, 2, wideOffset + xOffset, 0, {})
                  drawModule(style, "round", 2, 1, wideOffset + finalValues.stretchX*2 + xOffset + finalValues.spreadX*2, 0, {type: "roundcut", at:"end"})
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
                  drawModule(style, "round", 3, 4, leftXoffset + wideOffset + finalValues.stretchX*2, 0, {type: "roundcut", at:"start"})
               } else {
                  drawModule(style, "round", 3, 4, leftXoffset + wideOffset + finalValues.stretchX*2, 0, {type: "linecut", at:"start", alwaysCut:"true"})
               }
            }
            // SECOND LAYER
            style.flipped = true
            drawModule(style, "diagonal", 1, 2, leftXoffset + wideOffset, 0, {})
            if (!"xz".includes(nextLetter)) {
               if (!charInSet(nextLetter,["gap", "ul"])) {
                  drawModule(style, "round", 2, 1, leftXoffset + wideOffset+ finalValues.stretchX*2, 0, {type: "roundcut", at:"end"})
               } else {
                  drawModule(style, "round", 2, 1, leftXoffset + wideOffset+ finalValues.stretchX*2, 0, {type: "linecut", at:"end", alwaysCut:"true"})
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
            drawModule(style, "vert", 2, 1, wideOffset + finalValues.stretchX*2 +finalValues.spreadX*2, 0, {})
            drawModule(style, "vert", 1, 2, wideOffset, 0, {})
            drawModule(style, "diagonal", 4, 3, wideOffset, 0, {})
            drawModule(style, "diagonal", 3, 4, wideOffset + finalValues.stretchX*2 +finalValues.spreadX*2, 0, {})
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
                  drawModule(style, "round", 3, 4, style.weight+2+finalValues.stretchX*2+oddOffset*2+leftZoffset, 0, {type: "linecut", at:"start", alwaysCut:"true"})
               } else {
                  drawModule(style, "round", 3, 4, style.weight+2+finalValues.stretchX*2+oddOffset*2+leftZoffset, 0, {type: "roundcut", at:"start", alwaysCut:"true"})
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
            drawModule(style, "vert", 1, 1, 0, 0, {extend: finalValues.ascenders})
            drawModule(style, "vert", 4, 4, 0, 0, {extend: finalValues.ascenders})
            break;
         case "|":
            style.sizes = [letterOuter]
            drawModule(style, "vert", 1, 1, 0, 0, {extend: finalValues.ascenders})
            drawModule(style, "vert", 4, 4, 0, 0, {extend: finalValues.ascenders})
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
            drawModule(style, "diagonal", 2, 1, wideOffset + finalValues.stretchX*2, 0, {})
            drawModule(style, "vert", 3, 4, wideOffset + finalValues.stretchX*2, 0, {})
            drawModule(style, "vert", 4, 3, wideOffset, 0, {})
            style.stack = 0
            style.flipped = false
            drawModule(style, "vert", 1, 1, 0, 0, {})
            drawModule(style, "vert", 4, 4, 0, 0, {})
            // right side
            style.flipped = true
            drawModule(style, "vert", 1, 2, wideOffset, 0, {})
            drawModule(style, "vert", 2, 1, wideOffset + finalValues.stretchX*2, 0, {})
            drawModule(style, "vert", 3, 4, wideOffset + finalValues.stretchX*2, 0, {})
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
            drawModule(style, "hori", 1, 2, wideOffset-style.weight-1, 0, {from: -finalValues.size/2+style.weight+1-style.stretchX})
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
               drawModule(style, "vert", 1, 1, wideOffset  + finalValues.stretchX, 0, {})
               drawModule(style, "vert", 2, 2, wideOffset  + finalValues.stretchX, 0, {})
               drawModule(style, "vert", 3, 3, wideOffset  + finalValues.stretchX, 0, {})
               drawModule(style, "vert", 4, 4, wideOffset  + finalValues.stretchX, 0, {})
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
               drawModule(style, "vert", 1, 1, wideOffset + finalValues.stretchX, 0, {})
               drawModule(style, "vert", 2, 2, wideOffset + finalValues.stretchX, 0, {})
               drawModule(style, "diagonal", 3, 3, wideOffset + finalValues.stretchX, 0, {})
               drawModule(style, "diagonal", 4, 4, wideOffset + finalValues.stretchX, 0, {})
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
            drawModule(style, "vert", 1, 1, 0, 0, {extend: finalValues.ascenders})
            drawModule(style, "vert", 4, 4, 0, 0, {extend: finalValues.ascenders})
            style.stack = 0
            drawModule(style, "vert", 1, 1, 0, 0, {extend: finalValues.ascenders})
            drawModule(style, "vert", 4, 4, 0, 0, {extend: finalValues.ascenders})
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
            drawModule(style, "round", 2, 1, wideOffset + finalValues.stretchX*2, 0, {})
            drawModule(style, "vert", 3, 4, wideOffset + finalValues.stretchX*2, 0, {})
            drawModule(style, "vert", 4, 3, wideOffset, 0, {})
            style.flipped = false
            style.stack = 0
            drawModule(style, "vert", 1, 1, 0, 0, {})
            drawModule(style, "vert", 4, 4, 0, 0, {cap: true})
            // right side
            style.flipped = true
            drawModule(style, "vert", 1, 2, wideOffset, 0, {})
            drawModule(style, "vert", 2, 1, wideOffset + finalValues.stretchX*2, 0, {})
            drawModule(style, "vert", 3, 4, wideOffset + finalValues.stretchX*2, 0, {cap: true})
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
            drawModule(style, "vert", 2, 1, wideOffset + finalValues.stretchX*2, 0, {cap: true})
            drawModule(style, "vert", 3, 4, wideOffset + finalValues.stretchX*2, 0, {})
            drawModule(style, "vert", 4, 3, wideOffset, 0, {})
            style.flipped = false
            style.stack = 0
            drawModule(style, "vert", 1, 1, 0, 0, {})
            drawModule(style, "round", 3, 3, 0, 0, {})
            drawModule(style, "round", 4, 4, 0, 0, {})
            // right side
            style.flipped = true
            drawModule(style, "vert", 1, 2, wideOffset, 0, {})
            drawModule(style, "vert", 2, 1, wideOffset + finalValues.stretchX*2, 0, {})
            drawModule(style, "round", 3, 4, wideOffset + finalValues.stretchX*2, 0, {})
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
            if (finalValues.ascenders >= 1) {
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
            drawModule(style, "vert", 1, 1, 0, 0, {extend: finalValues.ascenders})
            drawModule(style, "vert", 4, 4, 0, 0, {extend: finalValues.ascenders})
            style.stack = 0
            drawModule(style, "vert", 1, 1, 0, 0, {extend: finalValues.ascenders})
            drawModule(style, "vert", 4, 4, 0, 0, {extend: finalValues.ascenders})
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
}