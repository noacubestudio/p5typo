import { drawModule } from "./drawModule.mjs"
import { mode, charInSet, sortIntoArray, waveValue, fonts2x, fonts3x } from "../sketch.mjs";

export function drawLetter (letter, font) {

   const char = letter.char, nextchar = letter.next, prevchar = letter.previous
   const ascenders = letter.ascenders, descenders = letter.ascenders

   const sizeOuter = letter.sizes[0]
   const sizeInner = letter.sizes[letter.sizes.length - 1]

   // WIP - explain what these consts are and see if more things need to be described like this
   // maybe move into drawModule and use when necessary via letter object boolean properties

   // redefining these, bad... WIP
   const oneoffset = (sizeOuter>3 && sizeInner>1) ? 1 : 0
   const extendOffset = waveValue(sizeOuter, 0, 0.5) + ((letter.stretchX+letter.spreadX)-(letter.stretchX+letter.spreadX)%2)*0.5
   const spreadWeightX = letter.weight + letter.spreadX/2
   const spreadWeightY = letter.weight + letter.spreadY/2

   const capGap = (letter.endCap === "round" && ascenders < 2) ? map(letter.weight, 0, 1, 1, 0, true) : 1
   const centersDistance = letter.weight + sizeInner //keep distance of 1, approaching center of double ytier letters

   const horiRightAdd = (letter.spacing > 0 || charInSet(nextchar, ["gap"])) ? 0 : letter.spacing - capGap //WIP
   const horiLeftAdd  = (letter.spacing > 0 || charInSet(prevchar, ["gap"])) ? 0 : letter.spacing - capGap //WIP

   if (fonts2x.includes(font) && ".,!-_‸| ".includes(char)) {
      // 2 tall lowercase fonts share some punctuation
      // "?#"" could differ per font
      switch(char) {
         case ".":
            drawModule(letter, "vert", 4, 4, 0, 0, {cap: true, from: sizeOuter*0.5 - (letter.weight+0.5), noStretchY: true})
            break;
         case ",":
            drawModule(letter, "vert", 4, 4, 0, 0, {extend: descenders, from:sizeOuter*0.5 - (letter.weight+0.5), noStretchY: true})
            break;
         case "!":
            // wip
            drawModule(letter, "vert", 1, 1, 0, 0, {extend: ascenders})
            drawModule(letter, "vert", 4, 4, 0, 0, {extend: -letter.weight-1.5})
            drawModule(letter, "vert", 4, 4, 0, 0, {cap: true, from: sizeOuter*0.5 - (letter.weight+0.5), noStretchY: true})
            break;
         case "-":
            letter.sizes = [sizeOuter]
            drawModule(letter, "hori", 1, 1, -1, +sizeOuter*0.5, {extend: -1})
            drawModule(letter, "hori", 2, 2, -1, +sizeOuter*0.5, {extend: -1})
            sortIntoArray(letter.spaceSpots, letter.posFromLeft)
            break;
         case "_":
            letter.sizes = [sizeOuter]
            drawModule(letter, "hori", 3, 3, -1, 0, {extend: -1})
            drawModule(letter, "hori", 4, 4, -1, 0, {extend: -1})
            sortIntoArray(letter.spaceSpots, letter.posFromLeft)
            break;
         case " ":
            sortIntoArray(letter.spaceSpots, letter.posFromLeft)
            break;
         case "‸":
            //caret symbol
            letter.opacity = 0.5
            letter.sizes = [sizeOuter]
            drawModule(letter, "vert", 1, 1, 0, 0, {extend: ascenders})
            drawModule(letter, "vert", 4, 4, 0, 0, {extend: descenders})
            break;
         case "|":
            letter.sizes = [sizeOuter]
            drawModule(letter, "vert", 1, 1, 0, 0, {extend: ascenders})
            drawModule(letter, "vert", 4, 4, 0, 0, {extend: descenders})
            break;
      }
   } else if (font === "lower2x2") {
      const isFlipped = (!"cktfe".includes(char))
      // draw chars
      switch(char) {
         case "o":
         case "ö":
         case "d":
         case "b":
         case "p":
         case "q":
            // circle
            if (char !== "b") {
               drawModule(letter, "round", 1, 1, 0, 0, {})
            } else {
               drawModule(letter, "vert", 1, 1, 0, 0, {extend: ascenders})
               drawModule(letter, letter.branchStyle, 1, 1, 0, 0, {type: "branch", at: "end"})
            }
            if (char !== "d") {
               drawModule(letter, "round", 2, 2, 0, 0, {})
            } else {
               drawModule(letter, "vert", 2, 2, 0, 0, {extend: ascenders})
               drawModule(letter, letter.branchStyle, 2, 2, 0, 0, {type: "branch", at: "start"})
            }
            if (char !== "q") {
               drawModule(letter, "round", 3, 3, 0, 0, {})
            } else {
               drawModule(letter, "vert", 3, 3, 0, 0, {extend: descenders})
               drawModule(letter, letter.branchStyle, 3, 3, 0, 0, {type: "branch", at: "end"})
            }
            if (char !== "p") {
               drawModule(letter, "round", 4, 4, 0, 0, {})
            } else {
               drawModule(letter, "vert", 4, 4, 0, 0, {extend: descenders})
               drawModule(letter, letter.branchStyle, 4, 4, 0, 0, {type: "branch", at: "start"})
            }
            if (char === "ö") {
               drawModule(letter, "vert", 1, 1, 0, 0, {extend: ascenders, from: sizeOuter*0.5 + capGap, noStretchY: true})
               drawModule(letter, "vert", 2, 2, 0, 0, {extend: ascenders, from: sizeOuter*0.5 + capGap, noStretchY: true})
            }
            break;
         case "ß":
            drawModule(letter, "round", 2, 2, 0, 0, {})
            drawModule(letter, "round", 3, 3, 0, 0, {})
            drawModule(letter, "round", 4, 4, 0, 0, {type:"linecut", at:"end"})
            drawModule(letter, "vert", 4, 4, 0, 0, {cap: true})
            if (ascenders >= letter.weight+sizeInner-1) {
               const modifiedLetter = {...letter}
               modifiedLetter.sizes = []
               for (let s = 0; s < letter.sizes.length; s++) {
                  modifiedLetter.sizes.push(letter.sizes[s]-1)
               }
               drawModule(letter, "hori", 1, 1, 0, 0, {extend: -letter.weight-1, noStretchY: true})
               drawModule(letter, "vert", 1, 1, 0, 0, {extend: ascenders-sizeOuter*0.5+0.5, noCap: true})
               drawModule(modifiedLetter, "round", 1, 1, 0, -ascenders -0.5, {noStretchY: true})
               drawModule(modifiedLetter, "round", 2, 2, 0, -ascenders -0.5, {noStretchY: true})
               drawModule(modifiedLetter, "round", 3, 2, 0, -letter.weight-sizeInner +0.5, {noStretchY: true})
               drawModule(letter, "vert", 3, 2, -1, -ascenders -0.5, {extend: -sizeOuter*0.5+(ascenders-(letter.weight+sizeInner))+1, noStretch: true, noCap: true})
            } else {
               drawModule(letter, "vert", 1, 1, 0, 0, {extend:ascenders-sizeOuter*0.5, noCap: true})
               drawModule(letter, "hori", 1, 1, 0, 0, {extend: -letter.weight-1, noStretchY: true})
               drawModule(letter, "square", 1, 1, 0, -ascenders, {noStretchY: true,})
               drawModule(letter, "hori", 2, 2, 0, -ascenders, {extend:-1, noStretchY: true})
            }
            break;
         case "g":
            drawModule(letter, "round", 1, 1, 0, 0, {})
            drawModule(letter, "round", 2, 2, 0, 0, {type: "branch", at:"start"})
            if (descenders <= 0) {
               drawModule(letter, "round", 3, 3, 0, 0, {})
               drawModule(letter, "round", 4, 4, 0, 0, {type: "linecut", at: "start"})
               drawModule(letter, "hori", 4, 4, 0, 0, {extend:horiLeftAdd})
            } else {
               if (descenders < letter.weight) {
                  // if only one ring, move line down so there is a gap
                  const extragap = (sizeOuter > sizeInner) ? 0:1
                  const lineOffset = (extragap+letter.weight > descenders) ? -(letter.weight-descenders) : extragap
                  drawModule(letter, "hori", 2, 3, 0, sizeOuter + lineOffset, {noStretchY: true})
                  drawModule(letter, "hori", 1, 4, 0, sizeOuter + lineOffset, {noStretchY: true})
               } else if (sizeOuter*0.5 + 1 <= descenders) {
                  // enough room for a proper g
                  drawModule(letter, "vert", 3, 3, 0, 0, {extend: descenders - sizeOuter*0.5})
                  drawModule(letter, "vert", 4, 4, 0, 0, {extend: descenders - sizeOuter*0.5, from: sizeOuter*0.5+1})
                  drawModule(letter, "round", 3, 3, 0, descenders, {noStretchY: true})
                  drawModule(letter, "round", 4, 4, 0, descenders, {noStretchY: true})
               } else {
                  // square corner g
                  drawModule(letter, "vert", 3, 3, 0, 0, {extend: descenders - sizeOuter*0.5})
                  drawModule(letter, "square", 3, 3, 0, descenders, {noStretchY: true})
                  drawModule(letter, "hori", 4, 4, 0, descenders, {extend: -1, noStretchY: true})
               }
               if (descenders >= letter.weight) drawModule(letter, letter.branchStyle, 3, 3, 0, 0, {type: "branch", at: "end"})
               else drawModule(letter, "round", 3, 3, 0, 0, {})
               drawModule(letter, "round", 4, 4, 0, 0, {})
            }
            break;
         case "c":
            drawModule(letter, "round", 1, 1, 0, 0, {})
            if (!"z".includes(nextchar)) {
               if (charInSet(nextchar, ["ul", "gap"])) {
                  drawModule(letter, "round", 2, 2, 0, 0, {type: "linecut", at:"end", alwaysCut:"true"})
               } else {
                  drawModule(letter, "round", 2, 2, 0, 0, {type: "roundcut", at:"end"})
               }
            }
            if (!"sz".includes(nextchar)) {
               if (charInSet(nextchar, ["dl", "gap"])) {
                  drawModule(letter, "round", 3, 3, 0, 0, {type: "linecut", at:"start", alwaysCut:"true"})
               } else {
                  drawModule(letter, "round", 3, 3, 0, 0, {type: "roundcut", at:"start"})
               }
            }
            drawModule(letter, "round", 4, 4, 0, 0, {})
            break;
         case "e":
            drawModule(letter, "round", 1, 1, 0, 0, {})
            drawModule(letter, "round", 2, 2, 0, 0, {})
            if (((sizeOuter-sizeInner)/2+1)*tan(HALF_PI/4) < sizeInner/2-2){
               drawModule(letter, "diagonal", 3, 3, 0, 0, {type: "linecut", at:"end"})
            } else {
               drawModule(letter, "round", 3, 3, 0, 0, {type: "linecut", at:"end", alwaysCut:"true"})
            }
            drawModule(letter, "round", 4, 4, 0, 0, {})
            // SECOND LAYER
            if ("s".includes(nextchar)) {
               drawModule(letter, "hori", 3, 3, 0, 0, {extend: 1})
            } else if (charInSet(nextchar,["gap"]) || "gz".includes(nextchar)) {
               drawModule(letter, "hori", 3, 3, 0, 0, {})
            } else if (!charInSet(nextchar,["dl", "gap"]) && sizeInner <= 1) {
               drawModule(letter, "hori", 3, 3, 0, 0, {extend: sizeOuter*0.5 + letter.stretchX})
            } else if ("x".includes(nextchar)) {
               drawModule(letter, "hori", 3, 3, 0, 0, {extend: sizeOuter*0.5 + letter.stretchX-letter.weight})
            } else if (!charInSet(nextchar,["dl"])) {
               drawModule(letter, "hori", 3, 3, 0, 0, {extend: -oneoffset+max(letter.spacing, -letter.weight)})
            } else if (letter.spacing < 0) {
               drawModule(letter, "hori", 3, 3, 0, 0, {extend: -oneoffset+max(letter.spacing, -letter.weight)})
            } else if (letter.spacing > 0){
               drawModule(letter, "hori", 3, 3, 0, 0, {})
            } else {
               drawModule(letter, "hori", 3, 3, 0, 0, {extend: -oneoffset})
            }
            break;
         case "a":
         case "ä":
            drawModule(letter, "round", 1, 1, 0, 0, {})
            drawModule(letter, "round", 2, 2, 0, 0, {})
            if (((sizeOuter-sizeInner)/2+1)*tan(HALF_PI/4) < sizeInner/2-2){
               drawModule(letter, "diagonal", 3, 3, 0, 0, {type: "linecut", at:"start"})
            } else {
               drawModule(letter, "round", 3, 3, 0, 0, {type: "linecut", at:"start", alwaysCut:"true"})
            }
            drawModule(letter, "round", 4, 4, 0, 0, {})
            // SECOND LAYER
            drawModule(letter, "vert", 3, 3, 0, 0, {cap: true})
            if (char === "ä") {
               drawModule(letter, "vert", 1, 1, 0, 0, {extend: ascenders, from: sizeOuter*0.5 + capGap, noStretchY: true})
               drawModule(letter, "vert", 2, 2, 0, 0, {extend: ascenders, from: sizeOuter*0.5 + capGap, noStretchY: true})
            }
            break;
         case "n":
            if (mode.altSquare) {
               drawModule(letter, "square", 1, 1, 0, 0, {})
               drawModule(letter, "square", 2, 2, 0, 0, {})
            } else {
               drawModule(letter, "round", 1, 1, 0, 0, {})
               drawModule(letter, "round", 2, 2, 0, 0, {})
            }
            drawModule(letter, "vert", 3, 3, 0, 0, {cap: true})
            drawModule(letter, "vert", 4, 4, 0, 0, {cap: true})
            break;
         case "m":
            drawModule(letter, "vert", 4, 4, 0, 0, {cap: true})
            if (mode.altDia) {
               drawModule(letter, "diagonal", 1, 1, 0, 0, {})
               drawModule(letter, "diagonal", 2, 2, 0, 0, {})
               // SECOND LAYER
               letter.xtier = 1
               drawModule(letter, "diagonal", 1, 1, 0, 0, {})
               drawModule(letter, "diagonal", 2, 2, 0, 0, {})
            } else {
               drawModule(letter, "round", 1, 1, 0, 0, {})
               drawModule(letter, "round", 2, 2, 0, 0, {type: "linecutM", at:"end"})
               // SECOND LAYER
               letter.xtier = 1
               drawModule(letter, "round", 1, 1, 0, 0, {type: "linecutM", at:"start"})
               drawModule(letter, "round", 2, 2, 0, 0, {})
            }
            drawModule(letter, "vert", 4, 4, 0, 0, {cap: true})
            drawModule(letter, "vert", 3, 3, 0, 0, {cap: true})
            break;
         case "s":
            if (!mode.altS) {
               let xOffset = -letter.weight-1 
               //LEFT OVERLAP
               letter.flipped = isFlipped
               if (prevchar === "s") {
                  drawModule(letter, "round", 4, 4, xOffset, 0, {type: "roundcut", at:"end"})
               } else if (prevchar === "r") {
               } else if (!charInSet(prevchar,["gap", "dr"]) && !"fkz".includes(prevchar)) {
                  drawModule(letter, "round", 4, 4, xOffset, 0, {type: "roundcut", at:"end"})
               } else {
                  xOffset = -sizeOuter * 0.5 -1 + extendOffset -letter.stretchX -letter.spreadX + map(sizeInner, 1, 2, 0, 1, true)
               }
               if (charInSet(prevchar,["gap", "dr"])) { 
                  drawModule(letter, "round", 3, 3, xOffset, 0, {type: "extend", at:"end"})
               } else {
                  drawModule(letter, "round", 3, 3, xOffset, 0, {})
               }
               letter.flipped = !isFlipped
               letter.xtier = 1
               if (!charInSet(nextchar,["gap", "ul"]) && !"zxj".includes(nextchar) || nextchar === "s") {
                  drawModule(letter, "round", 1, 1, xOffset, 0, {})
                  drawModule(letter, "round", 2, 2, xOffset, 0, {type: "roundcut", at:"end"})
               } else {
                  drawModule(letter, "round", 1, 1, xOffset, 0, {type: "extend", at:"end"})
               }
            } else {
               // alternative cursive s
               const gapPos = charInSet(prevchar,["gap"]) ? -letter.weight-1:0
               //LEFT OVERLAP
               if (charInSet(prevchar,["dr", "gap"])) {
                  drawModule(letter, "round", 4, 4, gapPos, 0, {type: "linecut", at:"end"})
               } else if (prevchar !== "t") {
                  drawModule(letter, "round", 4, 4, gapPos, 0, {type: "roundcut", at:"end"})
               }
               drawModule(letter, "round", 2, 2, gapPos, 0, {})
               drawModule(letter, "round", 3, 3, gapPos, 0, {})
            }
            break;
         case "x":
            let leftXoffset = -letter.weight-1
            //LEFT OVERLAP
            // top connection
            if (!charInSet(prevchar,["gap"]) && !"xz".includes(prevchar)) {
               if (charInSet(prevchar,["ur"]) || "l".includes(prevchar)) {
                  drawModule(letter, "round", 1, 1, leftXoffset, 0, {type: "linecut", at:"start", alwaysCut:"true"})
               } else if (prevchar !== "t"){
                  drawModule(letter, "round", 1, 1, leftXoffset, 0, {type: "roundcut", at:"start"})
               }
            } else if (charInSet(prevchar, ["gap"])) {
               drawModule(letter, "round", 1, 1, leftXoffset, 0, {type: "linecut", at:"start", alwaysCut:"true"})
            }
            // bottom connection
            letter.flipped = isFlipped
            if (!"zxef".includes(prevchar) && !charInSet(prevchar,["gap"])) {
               if (prevchar === "s" && !mode.altS) {
                  drawModule(letter, "round", 4, 4, leftXoffset, 0, {type: "roundcut", at:"end"})
               } else if (prevchar === "r" || charInSet(prevchar,["dr"])) {
                  drawModule(letter, "round", 4, 4, leftXoffset, 0, {type: "linecut", at:"end"})
               } else {
                  drawModule(letter, "round", 4, 4, leftXoffset, 0, {type: "roundcut", at:"end"})
               }
            } else if (charInSet(prevchar,["gap"])) {
               drawModule(letter, "round", 4, 4, leftXoffset, 0, {type: "linecut", at:"end", alwaysCut:"true"})
            }


            // middle and right side
            letter.flipped = false

            drawModule(letter, "round", 2, 2, leftXoffset, 0, {})
            letter.xtier = 1
            drawModule(letter, "round", 4, 4, leftXoffset, 0, {})
            if (!"xz".includes(nextchar)) {
               if (!charInSet(nextchar,["dl", "gap"])) {
                  drawModule(letter, "round", 3, 4, leftXoffset, 0, {type: "roundcut", at:"start"})
               } else {
                  drawModule(letter, "round", 3, 4, leftXoffset, 0, {type: "linecut", at:"start", alwaysCut:"true"})
               }
            }
            // SECOND LAYER
            letter.flipped = true
            drawModule(letter, "diagonal", 1, 1, leftXoffset, 0, {})
            if (!"xz".includes(nextchar)) {
               if (!charInSet(nextchar,["gap", "ul"])) {
                  drawModule(letter, "round", 2, 2, leftXoffset, 0, {type: "roundcut", at:"end"})
               } else {
                  drawModule(letter, "round", 2, 2, leftXoffset, 0, {type: "linecut", at:"end", alwaysCut:"true"})
               }
            }
            letter.xtier = 0
            drawModule(letter, "diagonal", 3, 3, leftXoffset, 0, {})
            
            break;
         case "u":
         case "ü":
         case "y":
            drawModule(letter, "vert", 1, 1, 0, 0, {cap: true})
            drawModule(letter, "vert", 2, 2, 0, 0, {cap: true})
            if (char === "y") {
               drawModule(letter, "vert", 3, 3, 0, 0, {extend: descenders})
               drawModule(letter, letter.branchStyle, 3, 3, 0, 0, {type: "branch", at: "end"})
            } else {
               drawModule(letter, "round", 3, 3, 0, 0, {})
            }
            drawModule(letter, "round", 4, 4, 0, 0, {})
            if (char === "ü") {
               drawModule(letter, "vert", 1, 1, 0, 0, {extend: ascenders, from: sizeOuter*0.5 + capGap, noStretchY: true})
               drawModule(letter, "vert", 2, 2, 0, 0, {extend: ascenders, from: sizeOuter*0.5 + capGap, noStretchY: true})
            }
            break;
         case "w":
            drawModule(letter, "vert", 1, 1, 0, 0, {cap: true})
            if (mode.altDia) {
               drawModule(letter, "diagonal", 3, 3, 0, 0, {})
               drawModule(letter, "diagonal", 4, 4, 0, 0, {})
               letter.xtier = 1
               drawModule(letter, "diagonal", 3, 3, 0, 0, {})
               drawModule(letter, "diagonal", 4, 4, 0, 0, {})
            } else {
               drawModule(letter, "round", 3, 3, 0, 0, {type: "linecutM", at: "start"})
               drawModule(letter, "round", 4, 4, 0, 0, {})
               letter.xtier = 1
               drawModule(letter, "round", 3, 3, 0, 0, {})
               drawModule(letter, "round", 4, 4, 0, 0, {type: "linecutM", at: "end"})
            }
            drawModule(letter, "vert", 2, 2, 0, 0, {cap: true})
            drawModule(letter, "vert", 1, 1, 0, 0, {cap: true})
            
            break;
         case "r":
            drawModule(letter, "round", 1, 1, 0, 0, {})
            if (!"z".includes(nextchar)) {
               if (charInSet(nextchar,["ul", "gap"])) {
                  drawModule(letter, "round", 2, 2, 0, 0, {type: "linecut", at:"end", alwaysCut:"true"})
               } else {
                  drawModule(letter, "round", 2, 2, 0, 0, {type: "roundcut", at:"end"})
               }
            }
            drawModule(letter, "vert", 4, 4, 0, 0, {cap: true})
            break;
         case "l":
         case "t":
            if (char === "t") {
               drawModule(letter, "vert", 1, 1, 0, 0, {extend: ascenders})
               drawModule(letter, "square", 1, 1, 0, 0, {type: "branch", at:"end"})
               if (!"zx".includes(nextchar)) {
                  if (charInSet(nextchar,["ul", "gap"]) || sizeInner > 2) {
                     drawModule(letter, "hori", 2, 2, 0, 0, {extend: -letter.weight-1 + ((sizeInner<2) ? 1 : 0)})
                  } else {
                     drawModule(letter, "hori", 2, 2, 0, 0, {extend: sizeOuter*0.5-letter.weight})
                  }
               }
            } else {
               drawModule(letter, "vert", 1, 1, 0, 0, {extend: ascenders})
            }
            drawModule(letter, "round", 4, 4, 0, 0, {})
            if (!"z".includes(nextchar)) {
               if (charInSet(nextchar,["dl", "gap"])) {
                  drawModule(letter, "round", 3, 3, 0, 0, {type: "linecut", at:"start", alwaysCut:"true"})
               } else {
                  drawModule(letter, "round", 3, 3, 0, 0, {type: "roundcut", at:"start"})
               }
            }  
            break;
         case "f":
            drawModule(letter, "round", 1, 1, 0, 0, {})
            if (!"z".includes(nextchar)) {
               if (charInSet(nextchar,["ul", "gap"])) {
                  drawModule(letter, "round", 2, 2, 0, 0, {type: "linecut", at:"end", alwaysCut:"true"})
               } else {
                  drawModule(letter, "round", 2, 2, 0, 0, {type: "roundcut", at:"end"})
               }
            }
            drawModule(letter, "vert", 4, 4, 0, 0, {extend: descenders})
            drawModule(letter, "square", 4, 4, 0, 0, {type: "branch", at:"start"})
            // SECOND LAYER
            if (!"sxz".includes(nextchar)) {
               if (charInSet(nextchar,["dl", "gap"]) || sizeInner > 2) {
                  drawModule(letter, "hori", 3, 3, 0, 0, {extend: -letter.weight-1 + ((sizeInner<2) ? 1 : 0)})
               } else {
                  drawModule(letter, "hori", 3, 3, 0, 0, {extend: sizeOuter*0.5-letter.weight})
               }
            }
            break;
         case "k":
            drawModule(letter, "vert", 1, 1, 0, 0, {extend: ascenders})
            drawModule(letter, "vert", 4, 4, 0, 0, {cap: true})
            drawModule(letter, "diagonal", 1, 1, letter.weight+letter.spreadX/2, 0, {})
            drawModule(letter, "diagonal", 4, 4, letter.weight+letter.spreadX/2, 0, {})
            if (!"zx".includes(nextchar)) {
               drawModule(letter, "hori", 2, 2, letter.weight+letter.spreadX/2, 0, {extend: -oneoffset-letter.weight})
            }
            if (!"sxz".includes(nextchar)) {
               if (!(charInSet(nextchar,["dl", "gap"]))) {
                  drawModule(letter, "round", 3, 3, letter.weight+letter.spreadX/2, 0, {type: "roundcut", at:"start"})
               } else {
                  drawModule(letter, "hori", 3, 3, letter.weight+letter.spreadX/2, 0, {extend: -oneoffset-letter.weight})
               }
            }
            break;
         case "h":
            drawModule(letter, "vert", 1, 1, 0, 0, {extend: ascenders})
            // SECOND LAYER
            if (mode.altSquare) {
               drawModule(letter, "square", 1, 1, 0, 0, {type: "branch", at:"end"})
               drawModule(letter, "square", 2, 2, 0, 0, {})
            } else {
               drawModule(letter, letter.branchStyle, 1, 1, 0, 0, {type: "branch", at:"end"})
               drawModule(letter, "round", 2, 2, 0, 0, {})
            }
            drawModule(letter, "vert", 3, 3, 0, 0, {cap: true})
            drawModule(letter, "vert", 4, 4, 0, 0, {cap: true})
            break;
         case "v":
            drawModule(letter, "vert", 1, 1, 0, 0, {cap: true})
            drawModule(letter, "vert", 2, 2, 0, 0, {cap: true})
            if (((sizeOuter-sizeInner)/2+1)*tan(HALF_PI/4) < sizeInner/2-2){
               drawModule(letter, "diagonal", 3, 3, 0, 0, {})
               drawModule(letter, "diagonal", 4, 4, 0, 0, {})
            } else if (mode.altDia) {
               drawModule(letter, "diagonal", 3, 3, 0, 0, {})
               drawModule(letter, "square", 4, 4, 0, 0, {})
            } else {
               drawModule(letter, "round", 3, 3, 0, 0, {})
               drawModule(letter, "square", 4, 4, 0, 0, {})
            }
            break;
         case "?":
            // wip
            drawModule(letter, "round", 1, 1, 0, 0, {})
            drawModule(letter, "round", 2, 2, 0, 0, {})
            drawModule(letter, "round", 3, 3, 0, 0, {})
            drawModule(letter, "round", 4, 4, 0, 0, {type: "linecut", at:"end", alwaysCut: true})
            drawModule(letter, "vert", 4, 4, 0, 0, {cap: true, from: sizeOuter*0.5 - (letter.weight+0.5), noStretchY: true})
            break;
         case "i":
            drawModule(letter, "vert", 1, 1, 0, 0, {extend: ascenders, from: sizeOuter*0.5 + capGap, noStretchY: true})
            drawModule(letter, "vert", 1, 1, 0, 0, {cap: true})
            drawModule(letter, "vert", 4, 4, 0, 0, {cap: true})
            break;
         case "j":
            let leftOffset = -letter.weight-1
            
            // LEFT OVERLAP
            if (prevchar !== undefined) {
               if (!"tkz".includes(prevchar)) {
                  if (charInSet(prevchar,["dr", "gap"]) || "r".includes(prevchar)) {
                     drawModule(letter, "round", 4, 4, leftOffset, 0, {type: "linecut", at:"end", alwaysCut:"true"})
                  } else {
                     drawModule(letter, "round", 4, 4, leftOffset, 0, {type: "roundcut", at:"end"})
                  }
               }
               if (!charInSet(prevchar,["tr"]) && !"ckrsxz".includes(prevchar)) {
                  drawModule(letter, "hori", 1, 1, leftOffset, 0, {extend: -letter.weight-1})
               }
            }
            
            drawModule(letter, "vert", 2, 2, leftOffset, 0, {extend: ascenders, from: sizeOuter*0.5 + capGap, noStretch: true})
            drawModule(letter, "square", 2, 2, leftOffset, 0, {})
            drawModule(letter, "round", 3, 3, leftOffset, 0, {})
            if (prevchar === undefined) {
               drawModule(letter, "hori", 1, 1, leftOffset, 0, {extend: -letter.weight-1})
               drawModule(letter, "round", 4, 4, leftOffset, 0, {type: "linecut", at:"end"})
            }
            break;
         case "z":
            let oddOffset = waveValue(sizeOuter, 0, 0.5)
            let leftZoffset = -letter.weight-1
            const lowerZoffset = letter.weight
            // TOP LEFT OVERLAP
            if (!"czfkxt".includes(prevchar)) {
               if (charInSet(prevchar,["ur", "gap"])) {
                  drawModule(letter, "round", 1, 1, leftZoffset, 0, {type: "linecut", at:"start", alwaysCut:"true"})
               } else {
                  drawModule(letter, "round", 1, 1, leftZoffset, 0, {type: "roundcut", at:"start", alwaysCut:"true"})
               }
            } else {
               drawModule(letter, "hori", 1, 1, leftZoffset, 0, {extend:-(letter.weight+1)})
            }
            drawModule(letter, "hori", 2, 2, leftZoffset, 0, {extend: 1+oddOffset*2})
            letter.flipped = true
            drawModule(letter, "diagonal", 1, 2, sizeOuter*0.5 +1+oddOffset+leftZoffset-letter.spreadX*0.5, 0, {})
            // BOTTOM RIGHT OVERLAP
            drawModule(letter, "diagonal", 3, 3, lowerZoffset+1-sizeOuter*0.5+oddOffset+leftZoffset, 0, {})
            letter.flipped = false
            drawModule(letter, "hori", 4, 3, lowerZoffset+2+oddOffset*2+leftZoffset, 0, {extend: 1+oddOffset*2})
            if (!"zxj".includes(nextchar)) {
               if (charInSet(nextchar,["dl", "gap"])) {
                  drawModule(letter, "round", 3, 4, lowerZoffset+2+letter.stretchX*2+letter.spreadX*2+oddOffset*2+leftZoffset, 0, {type: "linecut", at:"start", alwaysCut:"true"})
               } else {
                  drawModule(letter, "round", 3, 4, lowerZoffset+2+letter.stretchX*2+letter.spreadX*2+oddOffset*2+leftZoffset, 0, {type: "roundcut", at:"start", alwaysCut:"true"})
               }
            }
            break;
         case "#":
            drawModule(letter, "round", 1, 1, 0, 0, {type: "branch", at: "start"})
            drawModule(letter, "round", 2, 2, 0, 0, {type: "branch", at: "end"})
            drawModule(letter, "round", 3, 3, 0, 0, {type: "branch", at: "start"})
            drawModule(letter, "round", 4, 4, 0, 0, {type: "branch", at: "end"})
            break;
         default:
            letter.sizes = [sizeOuter]
            letter.opacity = 0.5
            drawModule(letter, "square", 1, 1, 0, 0, {})
            drawModule(letter, "square", 2, 2, 0, 0, {})
            drawModule(letter, "square", 3, 3, 0, 0, {})
            drawModule(letter, "square", 4, 4, 0, 0, {})
            break;
      }
   } else if (fonts3x.includes(font) && "1234567890".includes(char)) {
      switch (char) {
         case "1":
            letter.ytier = 1
            drawModule(letter, "vert", 1, 1, 0, 0, {cap: true})
            drawModule(letter, "vert", 4, 4, 0, 0, {})
            letter.ytier = 0
            drawModule(letter, "vert", 1, 1, 0, 0, {})
            drawModule(letter, "vert", 4, 4, 0, 0, {cap: true})
            break;
         case "2":
            letter.ytier = 1
            drawModule(letter, "round", 1, 1, 0, 0, {})
            drawModule(letter, "round", 2, 2, 0, 0, {})
            drawModule(letter, "round", 3, 3, 0, 0, {})
            drawModule(letter, "vert", 4, 4, 0, 0, {extend: -spreadWeightY -1})
            letter.ytier = 0
            drawModule(letter, "round", 1, 1, 0, 0, {})
            drawModule(letter, "vert", 2, 2, 0, 0, {extend: -spreadWeightY -1})
            drawModule(letter, "square", 3, 3, 0, 0, {})
            drawModule(letter, "square", 4, 4, 0, 0, {})
            break;
         case "3":
            letter.ytier = 1
            drawModule(letter, "round", 1, 1, 0, 0, {})
            drawModule(letter, "round", 2, 2, 0, 0, {})
            drawModule(letter, "round", 3, 3, 0, 0, {type: "linecutM", at:"end"})
            drawModule(letter, "vert", 4, 4, 0, 0, {extend: -sizeOuter*0.5+(centersDistance-1)*0.5})
            letter.ytier = 0
            drawModule(letter, "vert", 1, 1, 0, 0, {extend: -sizeOuter*0.5+(centersDistance-1)*0.5})
            drawModule(letter, "hori", 1, 1, 0, 0, {extend: -spreadWeightX -1})
            drawModule(letter, "round", 2, 2, 0, 0, {type: "linecutM", at:"start"})
            drawModule(letter, "round", 3, 3, 0, 0, {})
            drawModule(letter, "round", 4, 4, 0, 0, {})
            break;
         case "4":
            letter.ytier = 1
            drawModule(letter, "vert", 1, 1, 0, 0, {cap: true})
            drawModule(letter, "vert", 2, 2, 0, 0, {cap: true})
            drawModule(letter, "vert", 3, 3, 0, 0, {})
            drawModule(letter, "vert", 4, 4, 0, 0, {})
            letter.ytier = 0
            drawModule(letter, "vert", 1, 1, 0, 0, {})
            drawModule(letter, "vert", 2, 2, 0, 0, {})
            drawModule(letter, "vert", 3, 3, 0, 0, {extend: descenders})
            drawModule(letter, "square", 3, 3, 0, 0, {type: "branch", at: "end"})
            drawModule(letter, "square", 4, 4, 0, 0, {})
            break;
         case "5":
            letter.ytier = 1
            drawModule(letter, "square", 1, 1, 0, 0, {})
            drawModule(letter, "square", 2, 2, 0, 0, {})
            drawModule(letter, "vert", 3, 3, 0, 0, {extend: -spreadWeightY -1})
            drawModule(letter, "square", 4, 4, 0, 0, {})
            letter.ytier = 0
            drawModule(letter, "vert", 1, 1, 0, 0, {extend: -spreadWeightY -1})
            drawModule(letter, "round", 2, 2, 0, 0, {})
            drawModule(letter, "round", 3, 3, 0, 0, {})
            drawModule(letter, "round", 4, 4, 0, 0, {})
            break;
         case "6":
            letter.ytier = 1
            drawModule(letter, "round", 1, 1, 0, 0, {})
            drawModule(letter, "round", 2, 2, 0, 0, {})
            drawModule(letter, "vert", 3, 3, 0, 0, {extend: -spreadWeightY -1})
            drawModule(letter, "vert", 4, 4, 0, 0, {broken: true})
            letter.ytier = 0
            drawModule(letter, "square", 1, 1, 0, 0, {type: "branch", at: "end"})
            drawModule(letter, "round", 2, 2, 0, 0, {})
            drawModule(letter, "round", 3, 3, 0, 0, {})
            drawModule(letter, "round", 4, 4, 0, 0, {})
            break;
         case "7":
            letter.ytier = 1
            drawModule(letter, "square", 1, 1, 0, 0, {})
            drawModule(letter, "square", 2, 2, 0, 0, {})
            drawModule(letter, "vert", 3, 3, 0, 0, {})
            drawModule(letter, "vert", 4, 4, 0, 0, {})
            letter.ytier = 0
            drawModule(letter, "vert", 1, 1, 0, 0, {})
            drawModule(letter, "vert", 2, 2, 0, 0, {})
            drawModule(letter, "vert", 3, 3, 0, 0, {extend: ascenders})
            drawModule(letter, "square", 3, 3, 0, 0, {type: "branch", at:"end"})
            drawModule(letter, "vert", 4, 4, 0, 0, {extend: -spreadWeightY -1})
            drawModule(letter, "hori", 4, 4, 0, 0, {cap: true})
            break;
         case "8":
            letter.ytier = 1
            drawModule(letter, "round", 1, 1, 0, 0, {})
            drawModule(letter, "round", 2, 2, 0, 0, {})
            drawModule(letter, "round", 3, 3, 0, 0, {type: "linecutM", at:"end"})
            drawModule(letter, "round", 4, 4, 0, 0, {type: "linecutM", at:"start"})
            letter.ytier = 0
            drawModule(letter, "round", 1, 1, 0, 0, {type: "linecutM", at:"end"})
            drawModule(letter, "round", 2, 2, 0, 0, {type: "linecutM", at:"start"})
            drawModule(letter, "round", 3, 3, 0, 0, {})
            drawModule(letter, "round", 4, 4, 0, 0, {})
            break;
         case "9":
            letter.ytier = 1
            drawModule(letter, "round", 1, 1, 0, 0, {})
            drawModule(letter, "round", 2, 2, 0, 0, {})
            drawModule(letter, "vert", 3, 3, 0, 0, {})
            drawModule(letter, "round", 4, 4, 0, 0, {})
            letter.ytier = 0
            drawModule(letter, "vert", 1, 1, 0, 0, {extend: -spreadWeightY -1})
            drawModule(letter, "square", 2, 2, 0, 0, {type: "branch", at: "start"})
            drawModule(letter, "round", 3, 3, 0, 0, {})
            drawModule(letter, "round", 4, 4, 0, 0, {})
            break;
         case "0":
            letter.ytier = 1
            // letter.flipped = true
            // drawModule(letter, "diagonal", 3, 3, 0, 0, {})
            // letter.flipped = false

            drawModule(letter, "round", 1, 1, 0, 0, {})
            drawModule(letter, "round", 2, 2, 0, 0, {})
            drawModule(letter, "vert", 3, 3, 0, 0, {})
            drawModule(letter, "vert", 4, 4, 0, 0, {})
            letter.ytier = 0
            drawModule(letter, "vert", 1, 1, 0, 0, {})
            drawModule(letter, "vert", 2, 2, 0, 0, {})
            drawModule(letter, "round", 3, 3, 0, 0, {})
            drawModule(letter, "round", 4, 4, 0, 0, {})

            // drawModule(letter, "diagonal", 1, 1, 0, 0, {})

            drawModule(letter, "hori", 1, 1, 0, 0, {extend: -spreadWeightX -1})
            drawModule(letter, "hori", 2, 2, 0, 0, {extend: -spreadWeightX -1})
            break;
      }
   } else if (font === "upper3x2") {
      switch (char) {
         case "a":
         case "ä":
            letter.ytier = 1
            if (mode.altDia) {
               drawModule(letter, "diagonal", 1, 1, 0, 0, {})
               drawModule(letter, "diagonal", 2, 2, 0, 0, {})
            } else {
               drawModule(letter, "round", 1, 1, 0, 0, {})
               drawModule(letter, "round", 2, 2, 0, 0, {})
            }
            drawModule(letter, "vert", 3, 3, 0, 0, {})
            drawModule(letter, "vert", 4, 4, 0, 0, {})
            letter.ytier = 0
            drawModule(letter, "square", 1, 1, 0, 0, {type: "branch", at:"end"})
            drawModule(letter, "square", 2, 2, 0, 0, {type: "branch", at:"start"})
            drawModule(letter, "vert", 3, 3, 0, 0, {cap: true})
            drawModule(letter, "vert", 4, 4, 0, 0, {cap: true})
            break;
         case "p":
            letter.ytier = 1
            drawModule(letter, "square", 1, 1, 0, 0, {})
            drawModule(letter, "round", 2, 2, 0, 0, {})
            drawModule(letter, "round", 3, 3, 0, 0, {})
            drawModule(letter, "vert", 4, 4, 0, 0, {})
            letter.ytier = 0
            letter.flipped = true
            drawModule(letter, "square", 1, 1, 0, 0, {type: "branch", at:"end"})
            letter.flipped = false
            drawModule(letter, "vert", 4, 4, 0, 0, {cap: true})
            break;
         case "b":
         case "r":
            letter.ytier = 1
            drawModule(letter, "square", 1, 1, 0, 0, {})
            drawModule(letter, "round", 2, 2, 0, 0, {})
            drawModule(letter, "round", 3, 3, 0, 0, {type: "linecutM", at:"end"})
            drawModule(letter, "vert", 4, 4, 0, 0, {})
            letter.ytier = 0
            drawModule(letter, "square", 1, 1, 0, 0, {type: "branch", at:"end"})
            drawModule(letter, "round", 2, 2, 0, 0, {type: "linecutM", at:"start"})
            if (char === "b") {
               drawModule(letter, "round", 3, 3, 0, 0, {})
               drawModule(letter, "square", 4, 4, 0, 0, {})
            } else {
               drawModule(letter, "vert", 3, 3, 0, 0, {cap: true})
               drawModule(letter, "vert", 4, 4, 0, 0, {cap: true})
            }
            break;
         case "c":
         case "l":
            letter.ytier = 1
            if (char === "c") {
               drawModule(letter, "round", 1, 1, 0, 0, {})
               if (!"t".includes(nextchar)) {
                  if (charInSet(nextchar, ["ul", "gap"])) {
                     drawModule(letter, "round", 2, 2, 0, 0, {type: "linecut", at:"end", alwaysCut:"true"})
                  } else {
                     drawModule(letter, "round", 2, 2, 0, 0, {type: "roundcut", at:"end"})
                  }
               }
            } else {
               drawModule(letter, "vert", 1, 1, 0, 0, {cap: true})
            }
            drawModule(letter, "vert", 4, 4, 0, 0, {})
            letter.ytier = 0
            drawModule(letter, "vert", 1, 1, 0, 0, {})
            if (charInSet(nextchar, ["dl", "gap"]) || "tj".includes(nextchar)) {
               drawModule(letter, "round", 3, 3, 0, 0, {type: "linecut", at:"start", alwaysCut:"true"})
            } else {
               drawModule(letter, "round", 3, 3, 0, 0, {type: "roundcut", at:"start"})
            }
            drawModule(letter, "round", 4, 4, 0, 0, {})
            break;
         case "d":
            letter.ytier = 1
            drawModule(letter, "square", 1, 1, 0, 0, {})
            drawModule(letter, "round", 2, 2, 0, 0, {})
            drawModule(letter, "vert", 3, 3, 0, 0, {})
            drawModule(letter, "vert", 4, 4, 0, 0, {})
            letter.ytier = 0
            drawModule(letter, "vert", 1, 1, 0, 0, {})
            drawModule(letter, "vert", 2, 2, 0, 0, {})
            drawModule(letter, "round", 3, 3, 0, 0, {})
            drawModule(letter, "square", 4, 4, 0, 0, {})
            break;
         case "e":
         case "f":
            letter.ytier = 1
            drawModule(letter, ((mode.altSquare)?"square":"round"), 1, 1, 0, 0, {})
            drawModule(letter, "hori", 2, 2, 0, 0, {extend: -letter.weight-1})
            drawModule(letter, "vert", 4, 4, 0, 0, {})
            letter.ytier = 0
            drawModule(letter, "square", 1, 1, 0, 0, {type: "branch", at:"end"})
            drawModule(letter, "hori", 2, 2, 0, 0, {extend: -letter.weight-1})
            if (char === "e") {
               if (!"j".includes(nextchar)) {
                  drawModule(letter, "hori", 3, 3, 0, 0, {extend: -letter.weight-1})
               }
               drawModule(letter, ((mode.altSquare)?"square":"round"), 4, 4, 0, 0, {})
            } else if (char === "f"){
               drawModule(letter, "vert", 4, 4, 0, 0, {cap: true})
            }
            break;
         case "g":
            letter.ytier = 1
            drawModule(letter, "round", 1, 1, 0, 0, {})
            if (mode.altSquare) {
               drawModule(letter, "square", 2, 2, 0, 0, {})
            } else {
               drawModule(letter, "round", 2, 2, 0, 0, {})
            }
            drawModule(letter, "vert", 3, 3, 0, 0, {extend: -letter.weight-1})
            drawModule(letter, "vert", 4, 4, 0, 0, {})
            letter.ytier = 0
            drawModule(letter, "hori", 1, 1, 0, 0, {extend: -letter.weight-1})
            drawModule(letter, "vert", 1, 1, 0, 0, {})
            drawModule(letter, "square", 2, 2, 0, 0, {})
            if (mode.altSquare) {
               drawModule(letter, "square", 3, 3, 0, 0, {})
            } else {
               drawModule(letter, "round", 3, 3, 0, 0, {})
            }
            drawModule(letter, "round", 4, 4, 0, 0, {})
            break;
         case "h":
            letter.ytier = 1
            drawModule(letter, "vert", 1, 1, 0, 0, {cap: true})
            drawModule(letter, "vert", 2, 2, 0, 0, {cap: true})
            drawModule(letter, "vert", 3, 3, 0, 0, {})
            drawModule(letter, "vert", 4, 4, 0, 0, {})
            letter.ytier = 0
            drawModule(letter, "square", 1, 1, 0, 0, {type: "branch", at:"end"})
            drawModule(letter, "square", 2, 2, 0, 0, {type: "branch", at:"start"})
            drawModule(letter, "vert", 3, 3, 0, 0, {cap: true})
            drawModule(letter, "vert", 4, 4, 0, 0, {cap: true})
            break;
         case "i":
            letter.ytier = 1
            drawModule(letter, "vert", 1, 1, 0, 0, {cap: true})
            drawModule(letter, "vert", 4, 4, 0, 0, {})
            letter.ytier = 0
            drawModule(letter, "vert", 1, 1, 0, 0, {})
            drawModule(letter, "vert", 4, 4, 0, 0, {cap: true})
            break;
         case "j":
            letter.ytier = 1
            drawModule(letter, "hori", 1, 1, -letter.weight-1, 0, {extend: -letter.weight-1})
            drawModule(letter, "square", 2, 2, -letter.weight-1, 0, {})
            drawModule(letter, "vert", 3, 3, -letter.weight-1, 0, {})
            letter.ytier = 0
            drawModule(letter, "vert", 2, 2, -letter.weight-1, 0, {})
            drawModule(letter, "round", 3, 3, -letter.weight-1, 0, {})
            //wip sometimes round
            if (!"e".includes(prevchar)) {
               if (charInSet(prevchar,["dr", "gap"])) {
                  drawModule(letter, "round", 4, 4, -letter.weight-1, 0, {type: "linecut", at:"end", alwaysCut:true})
               } else {
                  drawModule(letter, "round", 4, 4, -letter.weight-1, 0, {type: "roundcut", at:"end", alwaysCut:true})
               }
            }
            break;
         case "k":
            letter.ytier = 1
            drawModule(letter, "vert", 1, 1, 0, 0, {cap: true})
            drawModule(letter, "vert", 2, 2, 0, 0, {cap: true})
            drawModule(letter, "round", 3, 3, 0, 0, {type: "linecutM", at:"end"})
            drawModule(letter, "vert", 4, 4, 0, 0, {broken: true})
            letter.ytier = 0
            drawModule(letter, "square", 1, 1, 0, 0, {type: "branch", at:"end"})
            drawModule(letter, "round", 2, 2, 0, 0, {type: "linecutM", at:"start"})
            drawModule(letter, "vert", 3, 3, 0, 0, {cap: true})
            drawModule(letter, "vert", 4, 4, 0, 0, {cap: true})
            break;
         case "m":
            letter.ytier = 1
            drawModule(letter, "diagonal", 1, 1, 0, 0, {})
            drawModule(letter, "diagonal", 2, 2, 0, 0, {})
            drawModule(letter, "vert", 4, 4, 0, 0, {})
            // right side
            letter.xtier = 1
            drawModule(letter, "diagonal", 1, 1, 0, 0, {})
            drawModule(letter, "diagonal", 2, 2, 0, 0, {})
            drawModule(letter, "vert", 3, 3, 0, 0, {})
            drawModule(letter, "vert", 4, 4, 0, 0, {})
            letter.ytier = 0
            letter.xtier = 0
            drawModule(letter, "vert", 1, 1, 0, 0, {})
            drawModule(letter, "vert", 4, 4, 0, 0, {cap: true})
            // right side
            letter.xtier = 1
            drawModule(letter, "vert", 1, 1, 0, 0, {})
            drawModule(letter, "vert", 2, 2, 0, 0, {})
            drawModule(letter, "vert", 3, 3, 0, 0, {cap: true})
            drawModule(letter, "vert", 4, 4, 0, 0, {cap: true})
            break;
         case "n":
            letter.ytier = 1
            drawModule(letter, "square", 1, 1, 0, 0, {})
            if (mode.altSquare) {
               drawModule(letter, "square", 2, 2, 0, 0, {})
            } else {
               drawModule(letter, "round", 2, 2, 0, 0, {})
            }
            drawModule(letter, "vert", 3, 3, 0, 0, {})
            drawModule(letter, "vert", 4, 4, 0, 0, {})
            letter.ytier = 0
            drawModule(letter, "vert", 1, 1, 0, 0, {})
            drawModule(letter, "vert", 2, 2, 0, 0, {})
            drawModule(letter, "vert", 3, 3, 0, 0, {cap: true})
            drawModule(letter, "vert", 4, 4, 0, 0, {cap: true})
            break;
         case "o":
         case "ö":
         case "q":
            letter.ytier = 1
            if (char === "q") {
               letter.flipped = true
               drawModule(letter, "diagonal", 4, 4, 0, 0, {})
               letter.flipped = false
            }
            drawModule(letter, "round", 1, 1, 0, 0, {})
            drawModule(letter, "round", 2, 2, 0, 0, {})
            drawModule(letter, "vert", 3, 3, 0, 0, {})
            drawModule(letter, "vert", 4, 4, 0, 0, {})
            letter.ytier = 0
            drawModule(letter, "vert", 1, 1, 0, 0, {})
            drawModule(letter, "vert", 2, 2, 0, 0, {})
            drawModule(letter, "round", 3, 3, 0, 0, {})
            drawModule(letter, "round", 4, 4, 0, 0, {})
            if (char === "q") {
               drawModule(letter, "vert", 3, 3, 0, 0, {cap: true})
               drawModule(letter, "diagonal", 2, 2, 0, 0, {})
            }
            break;
         case "s":
            letter.ytier = 1
            drawModule(letter, "round", 1, 1, 0, 0, {})
            drawModule(letter, "round", 2, 2, 0, 0, {})
            drawModule(letter, "vert", 3, 3, 0, 0, {extend: -letter.weight -1})
            drawModule(letter, "round", 4, 4, 0, 0, {})
            letter.ytier = 0
            letter.flipped = true
            drawModule(letter, "vert", 1, 1, 0, 0, {extend: -letter.weight -1})
            drawModule(letter, "round", 2, 2, 0, 0, {})
            drawModule(letter, "round", 3, 3, 0, 0, {})
            drawModule(letter, "round", 4, 4, 0, 0, {})
            break;
         case "t":
            letter.ytier = 1
            if (!"c".includes(prevchar)) {
               drawModule(letter, "hori", 1, 1, -letter.weight-1, 0, {extend: -letter.weight-1})
            }
            letter.xtier = 1
            drawModule(letter, "hori", 1, 1, -letter.weight-1, 0, {from: -sizeOuter/2+letter.weight+1-letter.stretchX})
            letter.xtier = 0
            drawModule(letter, "square", 2, 2, -letter.weight-1, 0, {type: "branch", at:"end"})
            drawModule(letter, "vert", 3, 3, -letter.weight-1, 0, {})
            letter.ytier = 0
            drawModule(letter, "vert", 2, 2, -letter.weight-1, 0, {})
            drawModule(letter, "vert", 3, 3, -letter.weight-1, 0, {})
            break;
         case "u":
         case "ü":
         case "v":
         case "w":
            letter.ytier = 1
            drawModule(letter, "vert", 1, 1, 0, 0, {cap: true})
            if (char !== "w") {
               drawModule(letter, "vert", 2, 2, 0, 0, {cap: true})
               drawModule(letter, "vert", 3, 3, 0, 0, {})
            }
            drawModule(letter, "vert", 4, 4, 0, 0, {})
            if (char === "w") {
               //right side
               letter.xtier = 1
               drawModule(letter, "vert", 1, 1, 0, 0, {cap: true})
               drawModule(letter, "vert", 2, 2, 0, 0, {cap: true})
               drawModule(letter, "vert", 3, 3, 0, 0, {})
               drawModule(letter, "vert", 4, 4, 0, 0, {})
               letter.xtier = 0
            }
            letter.ytier = 0
            drawModule(letter, "vert", 1, 1, 0, 0, {})
            if (char !== "w") drawModule(letter, "vert", 2, 2, 0, 0, {})
            if ("uü".includes(char)) {
               drawModule(letter, "round", 3, 3, 0, 0, {})
               drawModule(letter, "round", 4, 4, 0, 0, {})
            } else {
               drawModule(letter, "diagonal", 3, 3, 0, 0, {})
               drawModule(letter, "diagonal", 4, 4, 0, 0, {})
            }
            if (char === "w") {
               // right side
               letter.xtier = 1
               drawModule(letter, "vert", 1, 1, 0, 0, {})
               drawModule(letter, "vert", 2, 2, 0, 0, {})
               drawModule(letter, "diagonal", 3, 3, 0, 0, {})
               drawModule(letter, "diagonal", 4, 4, 0, 0, {})
               letter.xtier = 0
            }
            break;
         case "x":
            letter.ytier = 1
            drawModule(letter, "vert", 1, 1, 0, 0, {cap: true})
            drawModule(letter, "vert", 2, 2, 0, 0, {cap: true})
            drawModule(letter, "round", 3, 3, 0, 0, {type: "linecutM", at:"end"})
            drawModule(letter, "round", 4, 4, 0, 0, {type: "linecutM", at:"start"})
            letter.ytier = 0
            drawModule(letter, "round", 1, 1, 0, 0, {type: "linecutM", at:"end"})
            drawModule(letter, "round", 2, 2, 0, 0, {type: "linecutM", at:"start"})
            drawModule(letter, "vert", 3, 3, 0, 0, {cap: true})
            drawModule(letter, "vert", 4, 4, 0, 0, {cap: true})
            break;
         case "y":
            letter.ytier = 0
            drawModule(letter, "vert", 1, 1, 0, 0, {extend: -spreadWeightY -1})
            drawModule(letter, "vert", 2, 2, 0, 0, {})
            drawModule(letter, "round", 3, 3, 0, 0, {})
            drawModule(letter, "round", 4, 4, 0, 0, {})
            letter.ytier = 1
            drawModule(letter, "vert", 1, 1, 0, 0, {cap: true})
            drawModule(letter, "vert", 2, 2, 0, 0, {cap: true})
            drawModule(letter, letter.branchStyle, 3, 3, 0, 0, {type: "branch", at: "end"})
            drawModule(letter, "round", 4, 4, 0, 0, {})
            break;
         case "z":
            letter.ytier = 1
            drawModule(letter, "square", 1, 1, 0, 0, {})
            drawModule(letter, "square", 2, 2, 0, 0, {})
            drawModule(letter, "round", 3, 3, 0, 0, {})
            drawModule(letter, "vert", 4, 4, 0, 0, {extend: -spreadWeightY -1})
            letter.ytier = 0
            letter.flipped = true
            drawModule(letter, "round", 1, 1, 0, 0, {})
            drawModule(letter, "vert", 2, 2, 0, 0, {extend: -spreadWeightY -1})
            drawModule(letter, "square", 3, 3, 0, 0, {})
            drawModule(letter, "square", 4, 4, 0, 0, {})
            break;
         case "ß":
            letter.ytier = 1
            drawModule(letter, "round", 1, 1, 0, 0, {})
            if (mode.altSquare) {drawModule(letter, "square", 2, 2, 0, 0, {})}
            else {drawModule(letter, "round", 2, 2, 0, 0, {})}
            drawModule(letter, "diagonal", 3, 3, 0, 0, {})
            drawModule(letter, "vert", 4, 4, 0, 0, {})
            letter.ytier = 0
            drawModule(letter, "vert", 1, 1, 0, 0, {})
            drawModule(letter, "round", 2, 2, 0, 0, {})
            drawModule(letter, "round", 3, 3, 0, 0, {})
            drawModule(letter, "round", 4, 4, 0, 0, {type: "linecut", at:"end"})
            drawModule(letter, "vert", 4, 4, 0, 0, {cap: true})
            break;
         case "-":
            letter.sizes = [sizeOuter]
            drawModule(letter, "hori", 1, 1, -1, +sizeOuter*0.5, {extend: -1})
            drawModule(letter, "hori", 2, 2, -1, +sizeOuter*0.5, {extend: -1})
            sortIntoArray(letter.spaceSpots, letter.posFromLeft)
            break;
         case "_":
            letter.sizes = [sizeOuter]
            drawModule(letter, "hori", 3, 3, -1, 0, {extend: -1})
            drawModule(letter, "hori", 4, 4, -1, 0, {extend: -1})
            sortIntoArray(letter.spaceSpots, letter.posFromLeft)
            break;
         case "|":
            letter.sizes = [sizeOuter]
            letter.ytier = 1
            drawModule(letter, "vert", 1, 1, 0, 0, {})
            drawModule(letter, "vert", 4, 4, 0, 0, {})
            letter.ytier = 0
            drawModule(letter, "vert", 1, 1, 0, 0, {})
            drawModule(letter, "vert", 4, 4, 0, 0, {})
            break;
         case ".":
            drawModule(letter, "vert", 4, 4, 0, 0, {cap: true, from: sizeOuter*0.5 - (letter.weight+0.5), noStretchY: true})
            break;
         case ",":
            drawModule(letter, "vert", 4, 4, 0, 0, {extend: descenders, from: sizeOuter*0.5 - (letter.weight+0.5), noStretchY: true})
            break;
         case "!":
            // wip
            letter.ytier = 1
            drawModule(letter, "vert", 1, 1, 0, 0, {cap: true})
            drawModule(letter, "vert", 4, 4, 0, 0, {})
            letter.ytier = 0
            drawModule(letter, "vert", 1, 1, 0, 0, {})
            drawModule(letter, "vert", 4, 4, 0, 0, {extend: -letter.weight-1.5})
            drawModule(letter, "vert", 4, 4, 0, 0, {cap: true, from: sizeOuter*0.5 - (letter.weight+0.5), noStretchY: true})
            break;
         case "?":
            // wip
            letter.ytier = 1
            drawModule(letter, "round", 1, 1, 0, 0, {})
            drawModule(letter, "round", 2, 2, 0, 0, {})
            drawModule(letter, "round", 3, 3, 0, 0, {})
            letter.ytier = 0
            drawModule(letter, "round", 1, 1, 0, 0, {})
            drawModule(letter, "vert", 4, 4, 0, 0, {cap: true, from: sizeOuter*0.5 - (letter.weight+0.5), noStretchY: true})
            break;
         case " ":
            sortIntoArray(letter.spaceSpots, letter.posFromLeft)
            break;
         case "‸":
            //caret symbol
            letter.opacity = 0.5
            letter.sizes = [sizeOuter]
            letter.ytier = 1
            drawModule(letter, "vert", 1, 1, 0, 0, {extend: ascenders})
            drawModule(letter, "vert", 4, 4, 0, 0, {extend: descenders})
            letter.ytier = 0
            drawModule(letter, "vert", 1, 1, 0, 0, {extend: ascenders})
            drawModule(letter, "vert", 4, 4, 0, 0, {extend: descenders})
            break;
         default:
            letter.opacity = 0.5
            letter.sizes = [sizeOuter]
            letter.ytier = 1
            drawModule(letter, "square", 1, 1, 0, 0, {})
            drawModule(letter, "square", 2, 2, 0, 0, {})
            drawModule(letter, "vert", 3, 3, 0, 0, {})
            drawModule(letter, "vert", 4, 4, 0, 0, {})
            letter.ytier = 0
            drawModule(letter, "vert", 1, 1, 0, 0, {})
            drawModule(letter, "vert", 2, 2, 0, 0, {})
            drawModule(letter, "square", 3, 3, 0, 0, {})
            drawModule(letter, "square", 4, 4, 0, 0, {})
            break;
      }
   } else if (font === "lower3x2") {
      switch (char) {
         case "a":
         case "ä":
            letter.ytier = 1
            drawModule(letter, "round", 1, 1, 0, 0, {})
            drawModule(letter, "round", 2, 2, 0, 0, {})
            drawModule(letter, "vert", 3, 3, 0, 0, {broken: true})
            drawModule(letter, "vert", 4, 4, 0, 0, {extend: -letter.weight - 1})
            if (char === "ä") {
               drawModule(letter, "vert", 1, 1, 0, 0, {extend: ascenders, from: sizeOuter*0.5 + capGap, noStretchY: true})
               drawModule(letter, "vert", 2, 2, 0, 0, {extend: ascenders, from: sizeOuter*0.5 + capGap, noStretchY: true})
            }
            letter.ytier = 0
            drawModule(letter, "round", 1, 1, 0, 0, {})
            drawModule(letter, "square", 2, 2, 0, 0, {type: "branch", at:"start"})
            drawModule(letter, "round", 3, 3, 0, 0, {})
            drawModule(letter, "round", 4, 4, 0, 0, {})
            break;
         case "b":
         case "d":
         case "o":
         case "ö":
         case "p":
         case "q":
            letter.ytier = 1
            if (char !== "b") drawModule(letter, "round", 1, 1, 0, 0, {})
            else {
               drawModule(letter, "vert", 1, 1, 0, 0, {extend: ascenders})
               drawModule(letter, letter.branchStyle, 1, 1, 0, 0, {type: "branch", at:"end"})
            }
            if (char !== "d") drawModule(letter, "round", 2, 2, 0, 0, {})
            else {
               drawModule(letter, "vert", 2, 2, 0, 0, {extend: ascenders})
               drawModule(letter, letter.branchStyle, 2, 2, 0, 0, {type: "branch", at:"start"})
            }
            drawModule(letter, "vert", 3, 3, 0, 0, {})
            drawModule(letter, "vert", 4, 4, 0, 0, {})
            if (char === "ö") {
               drawModule(letter, "vert", 1, 1, 0, 0, {extend: ascenders, from: sizeOuter*0.5 + capGap, noStretchY: true})
               drawModule(letter, "vert", 2, 2, 0, 0, {extend: ascenders, from: sizeOuter*0.5 + capGap, noStretchY: true})
            }
            letter.ytier = 0
            drawModule(letter, "vert", 1, 1, 0, 0, {})
            drawModule(letter, "vert", 2, 2, 0, 0, {})
            if (char !== "q") drawModule(letter, "round", 3, 3, 0, 0, {})
            else {
               drawModule(letter, "vert", 3, 3, 0, 0, {extend: ascenders})
               drawModule(letter, letter.branchStyle, 3, 3, 0, 0, {type: "branch", at:"end"})
            }
            if (char !== "p") drawModule(letter, "round", 4, 4, 0, 0, {})
            else {
               drawModule(letter, "vert", 4, 4, 0, 0, {extend: ascenders})
               drawModule(letter, letter.branchStyle, 4, 4, 0, 0, {type: "branch", at:"start"})
            }
            break;
         case "c":
            letter.ytier = 1
            drawModule(letter, "round", 1, 1, 0, 0, {})
            drawModule(letter, "round", 2, 2, 0, 0, {})
            drawModule(letter, "vert", 3, 3, 0, 0, {extend: -sizeOuter*0.5+(centersDistance-1)*0.5, extra: true})
            drawModule(letter, "vert", 4, 4, 0, 0, {})
            letter.ytier = 0
            drawModule(letter, "vert", 1, 1, 0, 0, {})
            drawModule(letter, "vert", 2, 2, 0, 0, {extend: -sizeOuter*0.5+(centersDistance-1)*0.5, extra: true})
            drawModule(letter, "round", 3, 3, 0, 0, {})
            drawModule(letter, "round", 4, 4, 0, 0, {})
            break;
         case "e":
            letter.ytier = 1
            drawModule(letter, "round", 1, 1, 0, 0, {})
            drawModule(letter, "round", 2, 2, 0, 0, {})
            drawModule(letter, "round", 3, 3, 0, 0, {})
            drawModule(letter, "vert", 4, 4, 0, 0, {broken: true})
            letter.ytier = 0
            drawModule(letter, "square", 1, 1, 0, 0, {type: "branch", at:"end"})
            drawModule(letter, "vert", 2, 2, 0, 0, {extend: -letter.weight - 1})
            drawModule(letter, "round", 3, 3, 0, 0, {})
            drawModule(letter, "round", 4, 4, 0, 0, {})
            break;
         case "f":
            letter.ytier = 1
            if (mode.noLigatures) {
               drawModule(letter, "round", 1, 1, 0, 0, {})
               drawModule(letter, "square", 2, 2, 0, 0, {})
               drawModule(letter, "vert", 3, 3, 0, 0, {})
               drawModule(letter, "vert", 4, 4, 0, 0, {})
               letter.ytier = 0
               drawModule(letter, "vert", 1, 1, 0, 0, {})
               drawModule(letter, "vert", 2, 2, 0, 0, {})
               drawModule(letter, "vert", 3, 3, 0, 0, {extend: -spreadWeightY -1})
               drawModule(letter, "hori", 3, 3, 0, 0, {cap: true})
               drawModule(letter, "vert", 4, 4, 0, 0, {extend: ascenders})
               drawModule(letter, "square", 4, 4, 0, 0, {type: "branch", at:"start"})
            } else if (ascenders >= sizeOuter*0.5) {
               drawModule(letter, (mode.altSquare)?"square":"round",1, 1, 0, -ascenders, {noStretchY: true})
               drawModule(letter, "hori", 2, 2, 0, -ascenders, {extend: -spreadWeightX -1, noStretchY: true})
               drawModule(letter, "vert", 4, 1, 0, -ascenders, {extend: ascenders-sizeOuter, noStretchY: true})

               drawModule(letter, "square",1, 1, 0, 0, {type: "branch", at:"end"})
               drawModule(letter, "hori", 2, 2, 0, 0, {extend: -spreadWeightX -1})
               drawModule(letter, "vert", 4, 4, 0, 0, {})
               letter.ytier = 0
               drawModule(letter, "vert", 1, 1, 0, 0, {})
               drawModule(letter, "vert", 4, 4, 0, 0, {cap: true})
            } else {
               drawModule(letter, "round", 1, 1, 0, 0, {})
               if (!"j".includes(nextchar)) {
                  if (charInSet(nextchar,["ul", "gap"])) {
                     drawModule(letter, "round", 2, 2, 0, 0, {type: "linecut", at:"end", alwaysCut:"true"})
                  } else {
                     drawModule(letter, "round", 2, 2, 0, 0, {type: "roundcut", at:"end"})
                  }
               }
               drawModule(letter, "vert", 4, 4, 0, 0, {})
               letter.ytier = 0
               drawModule(letter, "square",1, 1, 0, 0, {type: "branch", at:"end"})
               drawModule(letter, "hori", 2, 2, 0, 0, {extend: -spreadWeightX -1})
               drawModule(letter, "vert", 4, 4, 0, 0, {cap: true})
            }
            break;
         case "g":
            if (descenders >= 1) {
               letter.ytier = 1
               drawModule(letter, "round", 1, 1, 0, 0, {})
               drawModule(letter, "round", 2, 2, 0, 0, {})
               drawModule(letter, "vert", 3, 3, 0, 0, {})
               drawModule(letter, "vert", 4, 4, 0, 0, {})
               letter.ytier = 0
               drawModule(letter, "vert", 1, 1, 0, 0, {})
               drawModule(letter, "vert", 2, 2, 0, 0, {})
               drawModule(letter, "round", 4, 4, 0, 0, {})
               //drawModule(letter, "vert", 3, 3, 1, 0, {extend: (descenders >= 2) ? descenders - sizeOuter*0.5 : 1})
               if (descenders < sizeOuter*0.5+1 || ascenders < 2) {
                  if (descenders > sizeOuter*0.5) {
                     drawModule(letter, "vert", 2, 3, 0, descenders, {extend: -sizeOuter*0.5+1})
                     drawModule(letter, "round", 3, 3, 0, descenders, {noStretchY: true})
                  } else {
                     drawModule(letter, "square", 3, 3, 0, descenders, {noStretchY: true})
                  }
                  drawModule(letter, "hori", 4, 4, 0, descenders, {cap: true, noStretchY: true})
               } else {
                  drawModule(letter, "vert", 1, 4, 0, descenders, {extend: descenders-sizeOuter-1})
                  drawModule(letter, "vert", 2, 3, 0, descenders, {extend: -(sizeOuter-descenders-0.5)})
                  drawModule(letter, "round", 3, 3, 0, descenders, {noStretchY: true})
                  drawModule(letter, "round", 4, 4, 0, descenders, {noStretchY: true})
               }
               // branch over
               drawModule(letter, letter.branchStyle, 3, 3, 0, 0, {type: "branch", at:"end"})
            } else {
               letter.ytier = 1
               drawModule(letter, "round", 1, 1, 0, 0, {})
               drawModule(letter, "round", 2, 2, 0, 0, {})
               drawModule(letter, "round", 4, 4, 0, 0, {})
               letter.ytier = 0
               drawModule(letter, "vert", 1, 1, 0, 0, {extend: -letter.weight - 1})
               drawModule(letter, "vert", 2, 2, 0, 0, {})
               drawModule(letter, "round", 3, 3, 0, 0, {})
               drawModule(letter, "round", 4, 4, 0, 0, {})
               letter.ytier = 1
               drawModule(letter, "square", 3, 3, 0, 0, {type: "branch", at:"end"})
            }
            break;
         case "i":
         case "l":
            letter.ytier = 1
            if (char === "i") {
               drawModule(letter, "vert", 1, 1, 0, 0, {extend: ascenders, from: sizeOuter*0.5 + capGap, noStretchY: true})
               drawModule(letter, "vert", 1, 1, 0, 0, {cap: true})
            } else {
               drawModule(letter, "vert", 1, 1, 0, 0, {extend: ascenders})
            }
            drawModule(letter, "vert", 4, 4, 0, 0, {})
            letter.ytier = 0
            drawModule(letter, "vert", 1, 1, 0, 0, {})
            if (char === "l" && "i".includes(nextchar) && !"l".includes(prevchar)) {
               if (charInSet(nextchar,["dl"])) {
                  drawModule(letter, "round", 3, 3, 0, 0, {type: "linecut", at: "start"})
               } else {
                  drawModule(letter, "round", 3, 3, 0, 0, {type: "roundcut", at: "start"})
               }
               drawModule(letter, "round", 4, 4, 0, 0, {})
            } else {
               drawModule(letter, "vert", 4, 4, 0, 0, {cap: true})
            }
            break;
         case "j":
            if (mode.noLigatures) {
               letter.ytier = 1
               drawModule(letter, "hori", 1, 1, 0, 0, {cap: true, extend: horiLeftAdd})
               drawModule(letter, "vert", 1, 1, 0, 0, {extend: -spreadWeightY -1})
               drawModule(letter, "vert", 2, 2, 0, 0, {extend: ascenders, from: sizeOuter*0.5 + capGap, noStretchY: true})
               drawModule(letter, "square", 2, 2, 0, 0, {})
               drawModule(letter, "vert", 3, 3, 0, 0, {})
               drawModule(letter, "vert", 4, 4, 0, 0, {extra: false})
               letter.ytier = 0
               drawModule(letter, "vert", 1, 1, 0, 0, {})
               drawModule(letter, "vert", 2, 2, 0, 0, {})
               drawModule(letter, "round", 3, 3, 0, 0, {})
               drawModule(letter, "round", 4, 4, 0, 0, {})
            } else {
               letter.ytier = 1
               if (!"trf".includes(prevchar)) {
                  drawModule(letter, "hori", 1, 1, -letter.weight-1, 0, {extend: -letter.weight-1})
               }
               drawModule(letter, "square", 2, 2, -letter.weight-1, 0, {})
               drawModule(letter, "vert", 2, 2, -letter.weight-1, 0, {extend: ascenders, from: sizeOuter*0.5 + capGap, noStretchY: true})
               drawModule(letter, "vert", 3, 3, -letter.weight-1, 0, {})
               letter.ytier = 0
               drawModule(letter, "vert", 2, 2, -letter.weight-1, 0, {})
               drawModule(letter, "round", 3, 3, -letter.weight-1, 0, {})
               //wip sometimes round
               if (!"t".includes(prevchar)) {
                  if (charInSet(prevchar,["dr", "gap"])) {
                     drawModule(letter, "round", 4, 4, -letter.weight-1, 0, {type: "linecut", at:"end", alwaysCut:true})
                  } else {
                     drawModule(letter, "round", 4, 4, -letter.weight-1, 0, {type: "roundcut", at:"end", alwaysCut:true})
                  }
               }
            }
            break;
         case "k":
            letter.ytier = 1
            drawModule(letter, "vert", 1, 1, 0, 0, {extend: ascenders})
            drawModule(letter, "vert", 2, 2, 0, 0, {cap: true})
            drawModule(letter, "round", 3, 3, 0, 0, {type: "linecutM", at:"end"})
            drawModule(letter, "vert", 4, 4, 0, 0, {broken: true})
            letter.ytier = 0
            drawModule(letter, "square", 1, 1, 0, 0, {type: "branch", at:"end"})
            drawModule(letter, "round", 2, 2, 0, 0, {type: "linecutM", at:"start"})
            drawModule(letter, "vert", 3, 3, 0, 0, {cap: true})
            drawModule(letter, "vert", 4, 4, 0, 0, {cap: true})
            break;
         case "n":
         case "h":
            letter.ytier = 1
            if (char !== "h") {
               if (mode.altSquare) {
                  drawModule(letter, "square", 1, 1, 0, 0, {})
               } else {
                  drawModule(letter, "round", 1, 1, 0, 0, {})
               }
            } else {
               drawModule(letter, "vert", 1, 1, 0, 0, {extend: ascenders})
               if (mode.altSquare) {
                  drawModule(letter, "square", 1, 1, 0, 0, {type: "branch", at:"end"})
               } else {
                  drawModule(letter, letter.branchStyle, 1, 1, 0, 0, {type: "branch", at:"end"})
               }
            }
            if (mode.altSquare) {
               drawModule(letter, "square", 2, 2, 0, 0, {})
            } else {
               drawModule(letter, "round", 2, 2, 0, 0, {})
            }
            drawModule(letter, "vert", 3, 3, 0, 0, {})
            drawModule(letter, "vert", 4, 4, 0, 0, {})
            letter.ytier = 0
            drawModule(letter, "vert", 1, 1, 0, 0, {})
            drawModule(letter, "vert", 2, 2, 0, 0, {})
            drawModule(letter, "vert", 3, 3, 0, 0, {cap: true})
            drawModule(letter, "vert", 4, 4, 0, 0, {cap: true})
            break;
         case "m":
            letter.ytier = 1
            drawModule(letter, "round", 1, 1, 0, 0, {})
            drawModule(letter, "round", 2, 2, 0, 0, {type: "linecutM", at:"end"})
            drawModule(letter, "vert", 4, 4, 0, 0, {})
            // right side
            letter.xtier = 1
            drawModule(letter, "round", 1, 1, 0, 0, {type: "linecutM", at:"start"})
            drawModule(letter, "round", 2, 2, 0, 0, {})
            drawModule(letter, "vert", 3, 3, 0, 0, {})
            drawModule(letter, "vert", 4, 4, 0, 0, {})
            letter.xtier = 0
            letter.ytier = 0
            drawModule(letter, "vert", 1, 1, 0, 0, {})
            drawModule(letter, "vert", 4, 4, 0, 0, {cap: true})
            // right side
            letter.xtier = 1
            drawModule(letter, "vert", 1, 1, 0, 0, {})
            drawModule(letter, "vert", 2, 2, 0, 0, {})
            drawModule(letter, "vert", 3, 3, 0, 0, {cap: true})
            drawModule(letter, "vert", 4, 4, 0, 0, {cap: true})
            break;
         case "r":
            if (mode.noLigatures) {
               letter.ytier = 1
               drawModule(letter, "round", 1, 1, 0, 0, {})
               drawModule(letter, "round", 2, 2, 0, 0, {})
               drawModule(letter, "round", 3, 3, 0, 0, {})
               drawModule(letter, "vert", 4, 4, 0, 0, {broken: true})
               letter.ytier = 0
               drawModule(letter, "square", 1, 1, 0, 0, {type: "branch", at:"end"})
               drawModule(letter, "round", 2, 2, 0, 0, {})
               drawModule(letter, "vert", 3, 3, 0, 0, {cap: true})
               drawModule(letter, "vert", 4, 4, 0, 0, {cap: true})
            } else {
               letter.ytier = 1
               drawModule(letter, "round", 1, 1, 0, 0, {})
               if (!"j".includes(nextchar)) {
                  if (charInSet(nextchar,["ul", "gap"])) {
                     drawModule(letter, "round", 2, 2, 0, 0, {type: "linecut", at:"end", alwaysCut:"true"})
                  } else {
                     drawModule(letter, "round", 2, 2, 0, 0, {type: "roundcut", at:"end"})
                  }
               }
               drawModule(letter, "vert", 4, 4, 0, 0, {})
               letter.ytier = 0
               drawModule(letter, "vert", 1, 1, 0, 0, {})
               drawModule(letter, "vert", 4, 4, 0, 0, {cap: true})
            }
            
            break;
         case "s":
            letter.ytier = 1
            drawModule(letter, "round", 1, 1, 0, 0, {})
            drawModule(letter, "round", 2, 2, 0, 0, {})
            drawModule(letter, "vert", 3, 3, 0, 0, {extend: -letter.weight -1})
            drawModule(letter, "round", 4, 4, 0, 0, {})
            letter.ytier = 0
            letter.flipped = true
            drawModule(letter, "vert", 1, 1, 0, 0, {extend: -letter.weight -1})
            drawModule(letter, "round", 2, 2, 0, 0, {})
            drawModule(letter, "round", 3, 3, 0, 0, {})
            drawModule(letter, "round", 4, 4, 0, 0, {})
            break;
         case "t":
            letter.ytier = 1
            // the ascender of the t can be shorter than other ascenders because it has a max relative to size and weight
            // but is always at least 1
            const tAscHeight = min(ascenders, max(sizeInner*0.5-1, 1))
            drawModule(letter, "vert", 1, 1, 0, 0, {extend: tAscHeight})
            drawModule(letter, "square", 1, 1, 0, 0, {type: "branch", at:"end"})
            if (!mode.noLigatures || "i".includes(nextchar)) {
               if (!"j".includes(nextchar)) {
                  drawModule(letter, "hori", 2, 2, 0, 0, {cap: true, extend: -spreadWeightX-1})
               }
            } else {
               drawModule(letter, "hori", 2, 2, 0, 0, {cap: true, extend: horiRightAdd})
               drawModule(letter, "vert", 2, 2, 0, 0, {extend: -spreadWeightY -1})
               drawModule(letter, "vert", 3, 3, 0, 0, {extra: false})
            }
            drawModule(letter, "vert", 4, 4, 0, 0, {})
            letter.ytier = 0
            drawModule(letter, "vert", 1, 1, 0, 0, {})
            if (!mode.noLigatures || "i".includes(nextchar)) {
               if (!"j".includes(nextchar)) {
                  if (charInSet(nextchar,["gap", "dl"])) {
                     drawModule(letter, "round", 3, 3, 0, 0, {type: "linecut", at: "start"})
                  } else {
                     drawModule(letter, "round", 3, 3, 0, 0, {type: "roundcut", at: "start"})
                  }
               }
            } else {
               drawModule(letter, "vert", 2, 2, 0, 0, {})
               drawModule(letter, "round", 3, 3, 0, 0, {})
            }
            drawModule(letter, "round", 4, 4, 0, 0, {})
            break;
         case "u":
         case "ü":
         case "v":
            letter.ytier = 1
            drawModule(letter, "vert", 1, 1, 0, 0, {cap: true})
            drawModule(letter, "vert", 2, 2, 0, 0, {cap: true})
            drawModule(letter, "vert", 3, 3, 0, 0, {})
            drawModule(letter, "vert", 4, 4, 0, 0, {})
            if (char === "ü") {
               drawModule(letter, "vert", 1, 1, 0, 0, {extend: ascenders, from: sizeOuter*0.5 + capGap, noStretchY: true})
               drawModule(letter, "vert", 2, 2, 0, 0, {extend: ascenders, from: sizeOuter*0.5 + capGap, noStretchY: true})
            }
            letter.ytier = 0
            drawModule(letter, "vert", 1, 1, 0, 0, {})
            drawModule(letter, "vert", 2, 2, 0, 0, {})
            if (char === "u" || char === "ü") {
               drawModule(letter, "round", 3, 3, 0, 0, {})
               drawModule(letter, "round", 4, 4, 0, 0, {})
            } else if (char === "v") {
               drawModule(letter, "round", 3, 3, 0, 0, {})
               drawModule(letter, "square", 4, 4, 0, 0, {})
            }
            break;
         case "w":
            letter.ytier = 1
            drawModule(letter, "vert", 1, 1, 0, 0, {cap: true})
            drawModule(letter, "vert", 4, 4, 0, 0, {})
            // right side
            letter.xtier = 1
            drawModule(letter, "vert", 1, 1, 0, 0, {cap: true})
            drawModule(letter, "vert", 2, 2, 0, 0, {cap: true})
            drawModule(letter, "vert", 3, 3, 0, 0, {})
            drawModule(letter, "vert", 4, 4, 0, 0, {})
            letter.xtier = 0
            letter.ytier = 0
            drawModule(letter, "vert", 1, 1, 0, 0, {})
            drawModule(letter, "round", 3, 3, 0, 0, {type: "linecutM", at:"start"})
            drawModule(letter, "round", 4, 4, 0, 0, {})
            // right side
            letter.xtier = 1
            drawModule(letter, "vert", 1, 1, 0, 0, {})
            drawModule(letter, "vert", 2, 2, 0, 0, {})
            drawModule(letter, "round", 3, 3, 0, 0, {})
            drawModule(letter, "round", 4, 4, 0, 0, {type: "linecutM", at:"end"})
            break;
         case "x":
            letter.ytier = 1
            drawModule(letter, "vert", 1, 1, 0, 0, {cap: true})
            drawModule(letter, "vert", 2, 2, 0, 0, {cap: true})
            drawModule(letter, "round", 3, 3, 0, 0, {type: "linecutM", at:"end"})
            drawModule(letter, "round", 4, 4, 0, 0, {type: "linecutM", at:"start"})
            letter.ytier = 0
            drawModule(letter, "round", 1, 1, 0, 0, {type: "linecutM", at:"end"})
            drawModule(letter, "round", 2, 2, 0, 0, {type: "linecutM", at:"start"})
            drawModule(letter, "vert", 3, 3, 0, 0, {cap: true})
            drawModule(letter, "vert", 4, 4, 0, 0, {cap: true})
            break;
         case "y":
            letter.ytier = 1
            drawModule(letter, "vert", 1, 1, 0, 0, {cap: true})
            drawModule(letter, "vert", 2, 2, 0, 0, {cap: true})
            if (descenders >= 1) {
               drawModule(letter, "vert", 3, 3, 0, 0, {})
               drawModule(letter, "vert", 4, 4, 0, 0, {})
               letter.ytier = 0
               drawModule(letter, "vert", 1, 1, 0, 0, {})
               drawModule(letter, "vert", 2, 2, 0, 0, {})
               drawModule(letter, "vert", 3, 3, 0, 0, {extend: descenders})
               drawModule(letter, letter.branchStyle, 3, 3, 0, 0, {type: "branch", at:"end"})
               drawModule(letter, "round", 4, 4, 0, 0, {})
            } else {
               letter.ytier = 0
               drawModule(letter, "vert", 1, 1, 0, 0, {extend: -spreadWeightY -1})
               drawModule(letter, "vert", 2, 2, 0, 0, {})
               drawModule(letter, "round", 3, 3, 0, 0, {})
               drawModule(letter, "round", 4, 4, 0, 0, {})
               letter.ytier = 1
               drawModule(letter, letter.branchStyle, 3, 3, 0, 0, {type: "branch", at: "end"})
               drawModule(letter, "round", 4, 4, 0, 0, {})
            }
            break;
         case "z":
            letter.ytier = 1
            drawModule(letter, "square", 1, 1, 0, 0, {})
            drawModule(letter, "square", 2, 2, 0, 0, {})
            drawModule(letter, "round", 3, 3, 0, 0, {})
            drawModule(letter, "vert", 4, 4, 0, 0, {extend: -spreadWeightY -1})
            letter.ytier = 0
            letter.flipped = true
            drawModule(letter, "round", 1, 1, 0, 0, {})
            drawModule(letter, "vert", 2, 2, 0, 0, {extend: -spreadWeightY -1})
            drawModule(letter, "square", 3, 3, 0, 0, {})
            drawModule(letter, "square", 4, 4, 0, 0, {})
            break;
         case "ß":
            letter.ytier = 1
            drawModule(letter, "round", 1, 1, 0, 0, {})
            drawModule(letter, "round", 2, 2, 0, 0, {})
            drawModule(letter, "round", 3, 3, 0, 0, {type: "linecutM", at:"end"})
            drawModule(letter, "vert", 4, 4, 0, 0, {})
            letter.ytier = 0
            drawModule(letter, "vert", 1, 1, 0, 0, {})
            drawModule(letter, "hori", 1, 1, 0, 0, {extend: -spreadWeightX -1})
            drawModule(letter, "round", 2, 2, 0, 0, {type: "linecutM", at:"start"})
            drawModule(letter, "round", 3, 3, 0, 0, {})
            drawModule(letter, "hori", 4, 4, 0, 0, {extend: -spreadWeightX -1})
            drawModule(letter, "vert", 4, 4, 0, 0, {extend: descenders})
            break;
         case "-":
            letter.sizes = [sizeOuter]
            drawModule(letter, "hori", 1, 1, -1, 0, {extend: -1})
            drawModule(letter, "hori", 2, 2, -1, 0, {extend: -1})
            sortIntoArray(letter.spaceSpots, letter.posFromLeft)
            break;
         case "_":
            letter.sizes = [sizeOuter]
            drawModule(letter, "hori", 3, 3, -1, 0, {extend: -1})
            drawModule(letter, "hori", 4, 4, -1, 0, {extend: -1})
            sortIntoArray(letter.spaceSpots, letter.posFromLeft)
            break;
         case "|":
            letter.sizes = [sizeOuter]
            letter.ytier = 1
            drawModule(letter, "vert", 1, 1, 0, 0, {})
            drawModule(letter, "vert", 4, 4, 0, 0, {})
            letter.ytier = 0
            drawModule(letter, "vert", 1, 1, 0, 0, {})
            drawModule(letter, "vert", 4, 4, 0, 0, {})
            break;
         case ".":
            drawModule(letter, "vert", 4, 4, 0, 0, {cap: true, from: sizeOuter*0.5 - (letter.weight+0.5), noStretchY: true})
            break;
         case ",":
            drawModule(letter, "vert", 4, 4, 0, 0, {extend: descenders, from: sizeOuter*0.5 - (letter.weight+0.5), noStretchY: true})
            break;
         case ":":
            letter.ytier = 1
            drawModule(letter, "vert", 1, 1, 0, 0, {cap: true, from: sizeOuter*0.5 - (letter.weight+0.5), noStretchY: true})
            letter.ytier = 0
            drawModule(letter, "vert", 4, 4, 0, 0, {cap: true, from: sizeOuter*0.5 - (letter.weight+0.5), noStretchY: true})
            break;
         case "!":
            // wip
            letter.ytier = 1
            drawModule(letter, "vert", 1, 1, 0, 0, {cap: true})
            drawModule(letter, "vert", 4, 4, 0, 0, {})
            letter.ytier = 0
            drawModule(letter, "vert", 1, 1, 0, 0, {})
            drawModule(letter, "vert", 4, 4, 0, 0, {extend: -letter.weight-1.5})
            drawModule(letter, "vert", 4, 4, 0, 0, {cap: true, from: sizeOuter*0.5 - (letter.weight+0.5), noStretchY: true})
            break;
         case "?":
            // wip
            letter.ytier = 1
            drawModule(letter, "round", 1, 1, 0, 0, {})
            drawModule(letter, "round", 2, 2, 0, 0, {})
            drawModule(letter, "round", 3, 3, 0, 0, {})
            letter.ytier = 0
            drawModule(letter, "round", 1, 1, 0, 0, {})
            drawModule(letter, "vert", 4, 4, 0, 0, {cap: true, from: sizeOuter*0.5 - (letter.weight+0.5), noStretchY: true})
            break;
         case " ":
            sortIntoArray(letter.spaceSpots, letter.posFromLeft)
            break;
         case "‸":
            //caret symbol
            letter.opacity = 0.5
            letter.sizes = [sizeOuter]
            letter.ytier = 1
            drawModule(letter, "vert", 1, 1, 0, 0, {extend: ascenders})
            drawModule(letter, "vert", 4, 4, 0, 0, {extend: descenders})
            letter.ytier = 0
            drawModule(letter, "vert", 1, 1, 0, 0, {extend: ascenders})
            drawModule(letter, "vert", 4, 4, 0, 0, {extend: descenders})
            break;
         case "#":
            //drawModule(letter, "vert", 1, 1, 0, 0, {extend: ascenders})
            //drawModule(letter, "vert", 4, 4, 0, 0, {extend: ascenders})
            drawModule(letter, "round", 1, 1, 0, 0, {type: "branch", at: "start"})
            drawModule(letter, "round", 2, 2, 0, 0, {type: "branch", at: "end"})
            drawModule(letter, "round", 3, 3, 0, 0, {type: "branch", at: "start"})
            drawModule(letter, "round", 4, 4, 0, 0, {type: "branch", at: "end"})
            break;
         default:
            letter.opacity = 0.5
            letter.sizes = [sizeOuter]
            letter.ytier = 1
            drawModule(letter, "square", 1, 1, 0, 0, {})
            drawModule(letter, "square", 2, 2, 0, 0, {})
            drawModule(letter, "vert", 3, 3, 0, 0, {})
            drawModule(letter, "vert", 4, 4, 0, 0, {})
            letter.ytier = 0
            drawModule(letter, "vert", 1, 1, 0, 0, {})
            drawModule(letter, "vert", 2, 2, 0, 0, {})
            drawModule(letter, "square", 3, 3, 0, 0, {})
            drawModule(letter, "square", 4, 4, 0, 0, {})
            break;
      }
   } else if (font === "lower2x3") {
      switch (char) {
         case "a":
         case "ä":
         case "q":
         case "u":
         case "ü":
         case "y":
         case "g":
            letter.xtier = 1
            if (char === "u" || char === "y" || char === "ü") {
               drawModule(letter, "square", 1, 1, 0, 0, {})
            } else {
               drawModule(letter, "hori", 1, 1, 0, 0, {})
            }
            drawModule(letter, "square", 2, 2, 0, 0, {})
            if (char === "g") {
               drawModule(letter, "vert", 3, 3, 0, 0, {extend: descenders - letter.weight})
               drawModule(letter, "square", 3, 3, 0, descenders, {})
               drawModule(letter, "hori", 4, 4, 0, descenders, {cap: true})
            } else if (char === "q" || char === "y") {
               drawModule(letter, "vert", 3, 3, 0, 0, {extend: descenders})
            } else {
               drawModule(letter, "vert", 3, 3, 0, 0, {cap: true})
            }
            letter.xtier = 0
            if (char === "u" || char === "y" || char === "ü") {
               drawModule(letter, "vert", 1, 1, 0, 0, {cap: true})
               drawModule(letter, "round", 3, 3, 0, 0, {})
               drawModule(letter, "round", 4, 4, 0, 0, {})
            } else {
               drawModule(letter, "round", 1, 1, 0, 0, {})
               drawModule(letter, "round", 2, 2, 0, 0, {type: "branch", at: "end"})
               drawModule(letter, "round", 3, 3, 0, 0, {})
               drawModule(letter, "round", 4, 4, 0, 0, {})
            }
            if (char === "ü" || char === "ä") {
               drawModule(letter, "vert", 1, 1, 0, 0, {extend: ascenders, from: sizeOuter*0.5 + capGap, noStretchY: true})
               drawModule(letter, "vert", 2, 2, 0, 0, {extend: ascenders, from: sizeOuter*0.5 + capGap, noStretchY: true})
            }
            break;
         case "c":
            drawModule(letter, "round", 1, 1, 0, 0, {})
            if (!"".includes(nextchar)) {
               if (charInSet(nextchar, ["ul", "gap"])) {
                  drawModule(letter, "round", 2, 2, 0, 0, {type: "linecut", at:"end", alwaysCut:"true"})
               } else {
                  drawModule(letter, "round", 2, 2, 0, 0, {type: "roundcut", at:"end"})
               }
            }
            if (!"".includes(nextchar)) {
               if (charInSet(nextchar, ["dl", "gap"])) {
                  drawModule(letter, "round", 3, 3, 0, 0, {type: "linecut", at:"start", alwaysCut:"true"})
               } else {
                  drawModule(letter, "round", 3, 3, 0, 0, {type: "roundcut", at:"start"})
               }
            }
            drawModule(letter, "round", 4, 4, 0, 0, {})
            break;
         case "d":
            letter.xtier = 1
            drawModule(letter, "vert", 2, 2, 0, 0, {extend: ascenders})
            drawModule(letter, "square", 3, 3, 0, 0, {})
            drawModule(letter, "hori", 4, 4, 0, 0, {})
            letter.xtier = 0
            drawModule(letter, "round", 1, 1, 0, 0, {})
            drawModule(letter, "round", 2, 2, 0, 0, {})
            drawModule(letter, "round", 3, 3, 0, 0, {type: "branch", at: "start"})
            drawModule(letter, "round", 4, 4, 0, 0, {})
            break;
         case "e":
         case "p":
         case "f":
         case "k":
         case "t":
            if (char !== "k" && char !== "t") drawModule(letter, "square", 1, 1, 0, 0, {})
            if (char !== "t") {
               drawModule(letter, "hori", 2, 2, 0, 0, {})
            } else {
               drawModule(letter, "hori", 2, 2, 0, 0, {extend: -spreadWeightX-1})
            }
            if (char === "e") {
               drawModule(letter, "hori", 3, 3, 0, 0, {extend: -spreadWeightX-1})
               drawModule(letter, "square", 4, 4, 0, 0, {})
            } else if (char === "k" || char === "t") {
               drawModule(letter, "vert", 1, 1, 0, 0, {extend: ascenders})
               drawModule(letter, "square", 1, 1, 0, 0, {type: "branch", at: "end"})
               drawModule(letter, "vert", 4, 4, 0, 0, {cap: true})
            } else {
               drawModule(letter, "vert", 4, 4, 0, 0, {extend: descenders})
            }
            if (char !== "t") {
               letter.xtier = 1
               drawModule(letter, "round", 1, 1, 0, 0, {type: "branch", at: "start"})
               if (char === "f" || char === "k") {
                  drawModule(letter, "hori", 2, 2, 0, 0, {extend: -spreadWeightX-1})
                  drawModule(letter, "hori", 3, 3, 0, 0, {extend: -spreadWeightX-1})
               } else {
                  drawModule(letter, "round", 2, 2, 0, 0, {})
                  drawModule(letter, "round", 3, 3, 0, 0, {})
               }
               drawModule(letter, "round", 4, 4, 0, 0, {})
            }
            break;
         case "i":
         case "j":
         case "l":
            if (char === "l") {
               drawModule(letter, "vert", 1, 1, 0, 0, {extend: ascenders})
            } else {
               drawModule(letter, "vert", 1, 1, 0, 0, {extend: ascenders, from: sizeOuter*0.5 + capGap, noStretchY: true})
               drawModule(letter, "vert", 1, 1, 0, 0, {cap: true})
            }
            if (char === "j") {
               drawModule(letter, "vert", 4, 4, 0, 0, {extend: descenders})
            } else {
               drawModule(letter, "vert", 4, 4, 0, 0, {cap: true})
            }
            break;
         case "m":
            drawModule(letter, "round", 1, 1, 0, 0, {})
            drawModule(letter, "round", 2, 2, 0, 0, {})
            drawModule(letter, "vert", 4, 4, 0, 0, {cap: true})
            letter.xtier = 1
            drawModule(letter, "square", 3, 3, 0, 0, {})
            drawModule(letter, "square", 4, 4, 0, 0, {})
            letter.xtier = 2
            drawModule(letter, "round", 1, 1, 0, 0, {})
            drawModule(letter, "round", 2, 2, 0, 0, {})
            drawModule(letter, "vert", 3, 3, 0, 0, {cap: true})
            break;
         case "b":
         case "n":
         case "h":
         case "r":
            if (char === "h" || char === "b") {
               drawModule(letter, "vert", 1, 1, 0, 0, {extend: ascenders})
            } else {
               drawModule(letter, "vert", 1, 1, 0, 0, {cap: true})
            }
            if (char !== "b") {
               drawModule(letter, "square", 3, 3, 0, 0, {})
            } else {
               drawModule(letter, "hori", 3, 3, 0, 0, {})
            }
            drawModule(letter, "square", 4, 4, 0, 0, {})
            letter.xtier = 1
            drawModule(letter, "round", 1, 1, 0, 0, {})
            if (char === "b") {
               drawModule(letter, "round", 2, 2, 0, 0, {})
               drawModule(letter, "round", 3, 3, 0, 0, {})
               drawModule(letter, "round", 4, 4, 0, 0, {type: "branch", at: "end"})
            } else if (char === "r") {
               if (charInSet(nextchar,["gap", "ul"])) {
                  drawModule(letter, "round", 2, 2, 0, 0, {type: "linecut", at: "end"})
               } else {
                  drawModule(letter, "round", 2, 2, 0, 0, {type: "roundcut", at: "end"})
               }
            } else {
               drawModule(letter, "round", 2, 2, 0, 0, {})
               drawModule(letter, "vert", 3, 3, 0, 0, {cap: true})
            }
            break;
         case "o":
         case "ö":
            drawModule(letter, "round", 1, 1, 0, 0, {})
            drawModule(letter, "round", 2, 2, 0, 0, {})
            drawModule(letter, "round", 3, 3, 0, 0, {})
            drawModule(letter, "round", 4, 4, 0, 0, {})
            if (char === "ö") {
               drawModule(letter, "vert", 1, 1, 0, 0, {extend: ascenders, from: sizeOuter*0.5 + capGap, noStretchY: true})
               drawModule(letter, "vert", 2, 2, 0, 0, {extend: ascenders, from: sizeOuter*0.5 + capGap, noStretchY: true})
            }
            break;
         case "v":
            drawModule(letter, "vert", 1, 1, 0, 0, {cap: true})
            drawModule(letter, "vert", 2, 2, 0, 0, {cap: true})
            drawModule(letter, "round", 3, 3, 0, 0, {})
            drawModule(letter, "square", 4, 4, 0, 0, {})
            break;
         case "w":
            drawModule(letter, "vert", 1, 1, 0, 0, {cap: true})
            drawModule(letter, "round", 3, 3, 0, 0, {})
            drawModule(letter, "round", 4, 4, 0, 0, {})
            letter.xtier = 1
            drawModule(letter, "square", 1, 1, 0, 0, {})
            drawModule(letter, "square", 2, 2, 0, 0, {})
            letter.xtier = 2
            drawModule(letter, "vert", 2, 2, 0, 0, {cap: true})
            drawModule(letter, "round", 3, 3, 0, 0, {})
            drawModule(letter, "round", 4, 4, 0, 0, {})
            break;
         case "s":
            drawModule(letter, "vert", 1, 1, 0, 0, {cap: true})
            drawModule(letter, "hori", 1, 1, 0, 0, {extend: min(-spreadWeightX-1, -sizeOuter*0.5+0.5)})
            drawModule(letter, "hori", 3, 3, 0, 0, {extend: sizeInner*0.5, noCap: true})
            drawModule(letter, "square", 4, 4, 0, 0, {})
            letter.xtier = 1
            drawModule(letter, "hori", 1, 1, 0, 0, {extend: sizeInner*0.5, noCap: true})
            drawModule(letter, "square", 2, 2, 0, 0, {})
            drawModule(letter, "vert", 3, 3, 0, 0, {cap: true})
            drawModule(letter, "hori", 3, 3, 0, 0, {extend: min(-spreadWeightX-1, -sizeOuter*0.5+0.5)})
            drawModule(letter, "round", 4, 4, 0, 0, {type: "branch", at: "end"})
            letter.xtier = 0
            drawModule(letter, "round", 2, 2, 0, 0, {type: "branch", at: "end"})
            break;
         case "z":
            drawModule(letter, "square", 1, 1, 0, 0, {})
            drawModule(letter, "hori", 2, 2, 0, 0, {extend: sizeInner*0.5, noCap: true})
            drawModule(letter, "hori", 4, 4, 0, 0, {extend: min(-spreadWeightX-1, -sizeOuter*0.5+0.5)})
            drawModule(letter, "vert", 4, 4, 0, 0, {cap: true})
            letter.xtier = 1
            drawModule(letter, "round", 1, 1, 0, 0, {type: "branch", at: "start"})
            drawModule(letter, "hori", 2, 2, 0, 0, {extend: min(-spreadWeightX-1, -sizeOuter*0.5+0.5)})
            drawModule(letter, "vert", 2, 2, 0, 0, {cap: true})
            drawModule(letter, "square", 3, 3, 0, 0, {})
            drawModule(letter, "hori", 4, 4, 0, 0, {extend: sizeInner*0.5, noCap: true})
            letter.xtier = 0
            drawModule(letter, "round", 3, 3, 0, 0, {type: "branch", at: "start"})
            break;
         case "‸":
            //caret symbol
            letter.opacity = 0.5
            letter.sizes = [sizeOuter]
            drawModule(letter, "vert", 1, 1, 0, 0, {extend: ascenders})
            drawModule(letter, "vert", 4, 4, 0, 0, {extend: descenders})
            break;
         default:
            letter.sizes = [sizeOuter]
            letter.opacity = 0.5
            drawModule(letter, "square", 1, 1, 0, 0, {})
            drawModule(letter, "square", 2, 2, 0, 0, {})
            drawModule(letter, "square", 3, 3, 0, 0, {})
            drawModule(letter, "square", 4, 4, 0, 0, {})
            letter.xtier = 1
            drawModule(letter, "square", 1, 1, 0, 0, {})
            drawModule(letter, "square", 2, 2, 0, 0, {})
            drawModule(letter, "square", 3, 3, 0, 0, {})
            drawModule(letter, "square", 4, 4, 0, 0, {})
            break;
      }
   }
}