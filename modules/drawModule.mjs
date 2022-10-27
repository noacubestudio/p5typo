'use strict';
import { font, finalValues, effect, webglEffects, viewMode, mode, palette, strokeScaleFactor, lineType, charInSet, arcType, stripeEffects, 
   fillCornerLayers, midlineEffects, sortIntoArray, defaultRenderer } from "../sketch.mjs";

export function drawModule(style, shape, arcQ, offQ, tx, ty, shapeParams) {

   noFill();
   push();

   // size
   const SIZES = [...style.sizes];

   // testing new effect, WIP
   // if (SIZES.length > 1) {
   //    if (style.ytier === 1 && offQ >= 3 || style.ytier === 0 && offQ <= 2) {
   //       SIZES.forEach((s, i, arr) => {
   //          arr[i] = s -2
   //       })
   //    } else if (style.ytier === 0 && offQ >=3) {
   //       SIZES.forEach((s, i, arr) => {
   //          arr[i] = s -4
   //       })
   //    }
   // }

   // useful numbers
   const INNERSIZE = SIZES[SIZES.length - 1];
   const OUTERSIZE = SIZES[0];
   const spreadXScale = (style.spreadX / 2) / (style.weight + ((mode.spreadFills)?1:0)) / 2;
   const spreadYScale = (style.spreadY / 2) / (style.weight + ((mode.spreadFills)?1:0)) / 2;

   const SPREADX = style.spreadX;
   const SPREADY = style.spreadY;
   const STRETCHX = style.stretchX;
   const STRETCHY = style.stretchY;
   const EXTRAY =  style.extraY; 
   const drawExtra = (shapeParams.extra !== undefined) ? (shapeParams.extra) : (shapeParams.extend === undefined);
   const PLUSX = STRETCHX + SPREADX;
   const PLUSY = STRETCHY + SPREADY + EXTRAY;

   const DRAWCAP = (shapeParams.extend !== undefined || shapeParams.cap === true) && (SIZES.length >= 2);
   const DRAWREVCAP = (shapeParams.from !== undefined) && (SIZES.length >= 2);

   // offset halfs
   const OFFSETBOTTOM = (offQ === 3 || offQ === 4) ? 1 : 0;
   const OFFSETRIGHT  = (offQ === 2 || offQ === 3) ? 1 : 0;


   // modify the module position before drawing
   const basePos = {
      x: style.posFromLeft + tx + (OUTERSIZE / 2),
      y: style.posFromTop + ty
   };
   // x offset based on quarter parameter and tier
   basePos.x += ((style.ytier === 1) ? style.offsetX1 : style.offsetX) * (OFFSETBOTTOM - style.ytier);
   // y offset based on quarter parameter as well as previous vertical offset and side of letter
   basePos.y += style.offsetY * (OFFSETRIGHT  + style.vOffset + style.xtier);
   // offset based on quarter and stretch
   basePos.x += OFFSETRIGHT * PLUSX;
   basePos.y += OFFSETBOTTOM * PLUSY * ((font === "fontb" || font === "fontc") ? 0.5 : 1);
   // modify based on tier (top/right half)
   basePos.y -= style.ytier * (OUTERSIZE - style.weight + PLUSY * 0.5);
   basePos.x += style.xtier * (OUTERSIZE - style.weight + SPREADX * 0.5 + STRETCHX);


   // fun experiment, could turn into toggle:
   //if (shape === "round" && shapeParams.type === undefined) shape = "square"
   //style.stroke *= 1.11
   const mouseDist = dist(mouseX/finalValues.zoom-5, mouseY/finalValues.zoom-10, basePos.x, basePos.y)
   // make thin and rotate a bit the closer to mouse
   //style.stroke = finalValues.weight * map(mouseDist, 20, 0, 1, 0.3, true)
   //rotate(map(mouseDist, 20, 0, 0, 0.08, true))


   ;(function drawModuleBG() {
      if (webglEffects.includes(effect))
         return;
      if (SIZES.length <= 1)
         return;
      if (style.weight <= 0)
         return;
      if (!mode.drawFills)
         return;

      // old corner fill requirements:
      // ! ((smallest <= 2 || letterOuter+2 <= 2) && noSmol)
      let palettePickBg = palette.bg;
      if (viewMode === "xray") {
         if (shape === "vert" || shape === "hori") {
            palettePickBg = palette.xrayBg;
         } else {
            palettePickBg = palette.xrayBgCorner;
         }
      }

      // fill style
      stroke(palettePickBg);
      strokeWeight(style.weight * strokeScaleFactor);
      if (!webglEffects.includes(effect) && defaultRenderer !== WEBGL) {
         strokeCap(SQUARE);
         strokeJoin(MITER);
      }
      

      // draw fill for module once
      drawSinglePathOfModule(INNERSIZE + style.weight, "bg", 0, 0);

      // only keep going if there are more fills to draw, shifted inwards
      if (SPREADY <= 0)
         return;
      if (shapeParams.noStretchY)
         return;
      if (shapeParams.noStretch)
         return;

      if (font === "fonta" || ((OFFSETBOTTOM === 0 && style.ytier === 1) || (OFFSETBOTTOM === 1 && style.ytier === 0))) {
         let outerSpreadY = -(OUTERSIZE - INNERSIZE) * spreadYScale;
         for (let betweenStep = 0; betweenStep > outerSpreadY; betweenStep -= style.weight) {
            drawSinglePathOfModule(INNERSIZE + style.weight, "bg", 0, betweenStep);
         }
         drawSinglePathOfModule(INNERSIZE + style.weight, "bg", 0, outerSpreadY);
      }
   })();

   (function drawModuleFG() {
      // draw the foreground
      if (!webglEffects.includes(effect) && defaultRenderer !== WEBGL) {
         strokeCap(ROUND);
         strokeJoin(ROUND);
      }
      strokeWeight((style.stroke / 10) * strokeScaleFactor);
      if (viewMode === "xray") { strokeWeight(0.2 * strokeScaleFactor); }

      // only draw spread fills in outer
      const useSpreadX = (
         SPREADX > 0 && shapeParams.noStretchX === undefined && shapeParams.noStretch === undefined
      )
      const useSpreadY = (
         (SPREADY > 0 && shapeParams.noStretchY === undefined && shapeParams.noStretch === undefined) &&
         (font === "fonta" || (OFFSETBOTTOM===0&&style.ytier===1) || (OFFSETBOTTOM===1&&style.ytier===0))
      )

      SIZES.forEach((size) => {
         let outerSpreadY = 0;
         let outerSpreadX = 0;

         if (useSpreadY) {
            outerSpreadY = -(OUTERSIZE - size) * spreadYScale;
         }
         if (useSpreadX) {
            outerSpreadX = -(OUTERSIZE - size) * spreadXScale;
         }
         drawSinglePathOfModule(size, "fg", outerSpreadX, outerSpreadY, useSpreadX, useSpreadY);
      });
   })();



   function drawSinglePathOfModule(size, layer, outerSpreadX, outerSpreadY, useSpreadX, useSpreadY) {
      // relevant for any module:

      if (layer === "fg") {
         // style may differ per ring if it's in the foreground
         // gradient from inside to outside - color or weight
         ringStyle(style, shape, size, INNERSIZE, OUTERSIZE);
      }
      // get orientations in both axes
      const sideX = (arcQ === 1 || arcQ === 4) ? -1 : 1;
      const sideY = (arcQ === 1 || arcQ === 2) ? -1 : 1;


      // specific modules:
      if (shape === "vert" || shape === "hori") {

         // determine based on endcap how much shorter the line should be
         let endcapLength = 0; let startcapLength = 0;
         if (style.endCap === "round" && DRAWCAP) {
            endcapLength = map(style.weight, 0, 2, 0, 1, true)
            // if (SIZES.length === 2) {
            //    endcapLength = 0.5;
            // } else {
            //    endcapLength = 1;
            // }
         }
         if (style.endCap === "round" && DRAWREVCAP) {
            startcapLength = map(style.weight, 0, 2, 0, 1, true)
            // if (SIZES.length === 2) {
            //    startcapLength = 0.5;
            // } else {
            //    startcapLength = 1;
            // }
         }

         // first determine without needing to know direction
         const LINE_FROM = shapeParams.from + startcapLength || 0;
         const LINE_EXTEND = shapeParams.extend - endcapLength * 0.99 || -endcapLength;
         const LINE_ADJUST = (() => {
            if (layer === "fg")
               return 0;
            // so it looks nicer on grid backgrounds, etc...
            if (viewMode === "xray")
               return 0.2 * strokeScaleFactor * -0.5;
            return style.weight / 10 * -0.5;
         })();

         const LINE_START = LINE_FROM === 0 ? 0 : LINE_FROM - LINE_ADJUST;
         const LINE_END = OUTERSIZE * 0.5 + LINE_EXTEND + LINE_ADJUST;

         const linePos = {
            x1: basePos.x,
            x2: basePos.x,
            y1: basePos.y,
            y2: basePos.y
         };

         pickLineModule(linePos, 0, 0, 0);

         // fill spread effect
         if (layer === "fg" && mode.spreadFills && (useSpreadX || useSpreadY)) {
            for (let i = 1; i <= style.spreadFillSteps; i++) {
               let fillStep = (i / style.spreadFillSteps) * 2;
               let movedPosX = ((SPREADX > 0 && shape === "vert") ? spreadXScale * fillStep * -sideX : 0);
               let movedPosY = ((SPREADY > 0 && shape === "hori") ? spreadYScale * fillStep * -sideY : 0);
               pickLineModule({
                  x1: basePos.x + movedPosX, x2: basePos.x + movedPosX, 
                  y1: basePos.y + movedPosY, y2: basePos.y + movedPosY
               }, movedPosX, movedPosY, ((SPREADX > 0) ? i : 0));
               if (SPREADX > 0) {
                  pickLineModule({
                     x1: basePos.x + movedPosX, x2: basePos.x + movedPosX, 
                     y1: basePos.y + movedPosY, y2: basePos.y + movedPosY
                  }, movedPosX, movedPosY, i);
               }
            }
         }

         function pickLineModule(linePos, spreadFillStepX, spreadFillStepY, fillIndexX) {
            switch (shape) {
               case "hori":
                  drawHorizontalModule(linePos, spreadFillStepX, spreadFillStepY, fillIndexX);
                  break;
               case "vert":
                  drawVerticalModule(linePos, spreadFillStepX, spreadFillStepY, fillIndexX);
                  break;
            }
         }

         function drawVerticalModule(linePos, spreadFillStepX, spreadFillStepY, fillIndexX) {
            linePos.x1 += sideX * (size * 0.5 + outerSpreadX);
            linePos.x2 += sideX * (size * 0.5 + outerSpreadX);
            linePos.y1 += sideY * (LINE_START + outerSpreadY);
            linePos.y2 += sideY * LINE_END;

            // if centered midlines are active, don't draw the vertical line, instead add to array
            if (midlineEffects.includes(effect) && mode.centeredEffect && (font === "fontb" || font === "fontc")) {

               // relevant possible spots
               if ((style.ytier === 1 && sideY === 1) || (style.ytier === 0 && sideY === -1)) {
                  if (!shapeParams.broken && shapeParams.extend === undefined && shapeParams.from === undefined) {
                     if (style.ytier === 1 && sideY === 1) {
                        if (layer === "fg") includeInCenteredEffect()
                        return
                     } else if (style.ytier === 0 && sideY === -1) {
                        return
                     }
                  } else if (layer === "fg") {
                     sortIntoArray(style.stopSpots, linePos.x1)
                  }
               }
            }

            function includeInCenteredEffect () {
               if (style.char === "‸") {
                  //caret counts separately
                  style.caretSpots[0] = linePos.x1;
               } else {
                  const midlineSpotX = linePos.x1;
                  sortIntoArray(style.centerFxSpots[0][fillIndexX], midlineSpotX);

                  //add the remaining stretch spot on the end while fillIndex is on
                  // for some reason size is never OUTERSIZE then, so this is needed for now
                  //should only add this once, like only if size is smallest
                  if (size === INNERSIZE && fillIndexX !== 0) {
                     sortIntoArray(style.centerFxSpots[0][fillIndexX], linePos.x1+sideX*(OUTERSIZE*0.5));
                  }
               }
            }


            //only draw the non-stretch part if it is long enough to be visible
            if (sideY * (linePos.y2 - linePos.y1) >= 0) {
               lineType(linePos.x1, linePos.y1, linePos.x2, linePos.y2);

               // draw the end cap
               if (layer === "fg" && style.endCap !== "none" && (DRAWCAP || DRAWREVCAP)) {
                  if (DRAWCAP)
                     drawVerticalCaps(style.endCap, linePos.y2, sideY);
                  if (DRAWREVCAP)
                     drawVerticalCaps(style.endCap, linePos.y1, -sideY);
               }
            }
            function drawVerticalCaps(capStyle, endPoint, endDir) {
               if (capStyle === "round") {
                  const capScale = map(style.weight, 0, 2, 0, 1, true)
                  if (size === OUTERSIZE) {
                     bezier(linePos.x1, endPoint, linePos.x1, endPoint + endDir * 0.5 * capScale,
                        linePos.x2 - 0.5 * capScale * sideX, endPoint + endDir * 1 * capScale, linePos.x2 - 1 * capScale * sideX, endPoint + endDir * 1 * capScale);
                  } else if (size === INNERSIZE) {
                     bezier(linePos.x1, endPoint, linePos.x1, endPoint + endDir * 0.5 * capScale,
                        linePos.x2 + 0.5 * capScale * sideX, endPoint + endDir * 1 * capScale, linePos.x2 + 1 * capScale * sideX, endPoint + endDir * 1 * capScale);
                     if (style.weight >= 2) {
                        lineType(linePos.x2 + (OUTERSIZE / 2 - INNERSIZE / 2 - 1 - outerSpreadX) * sideX - spreadFillStepX, endPoint + 1 * endDir,
                           linePos.x2 + 1 * sideX, endPoint + 1 * endDir);
                     }
                  }
               }
            }

            if (PLUSY > 0 && LINE_FROM === 0) {
               if (STRETCHY > 0)
                  drawStretchLines("stretch", sideX, sideY, "vert", spreadFillStepX, spreadFillStepY, fillIndexX);
               if (EXTRAY > 0 && drawExtra && sideY * (linePos.y2 - linePos.y1) >= 0)
                  drawStretchLines("extra", sideX, sideY, "vert", spreadFillStepX, spreadFillStepY, fillIndexX);
               if (SPREADY > 0)
                  drawStretchLines("spread", sideX, sideY, "vert", spreadFillStepX, spreadFillStepY, fillIndexX);
            }

            if (layer === "fg") drawDot(linePos.x1, linePos.y1)
         }

         function drawHorizontalModule(linePos, spreadFillStepX, spreadFillStepY, fillIndexX) {
            linePos.y1 += sideY * (size * 0.5 + outerSpreadY);
            linePos.y2 += sideY * (size * 0.5 + outerSpreadY);
            linePos.x1 += sideX * (LINE_START + outerSpreadX);
            linePos.x2 += sideX * LINE_END;

            //only draw the non-stretch part if it is long enough to be visible
            if (sideX * (linePos.x2 - linePos.x1) >= 0) {
               lineType(linePos.x1, linePos.y1, linePos.x2, linePos.y2);

               // draw the end cap
               if (layer === "fg" && style.endCap !== "none" && DRAWCAP) {
                  drawHorizontalCaps(style.endCap)
               }
            }

            function drawHorizontalCaps (capStyle) {
               if (capStyle === "round") {
                  const capScale = map(style.weight, 0, 2, 0, 1, true)
                  if (size === OUTERSIZE) {
                     //lineType(linePos.x1, linePos.y2 , linePos.x2-1*sideX , linePos.y2 + sideY*1)
                     bezier(linePos.x2, linePos.y1, linePos.x2 + sideX * 0.5 * capScale, linePos.y1,
                        linePos.x2 + sideX * 1 * capScale, linePos.y2 - 0.5 * capScale * sideY, linePos.x2 + sideX * 1 * capScale, linePos.y2 - 1 * capScale * sideY);
                  } else if (size === INNERSIZE) {
                     bezier(linePos.x2, linePos.y2, linePos.x2 + sideX * 0.5 * capScale, linePos.y2,
                        linePos.x2 + sideX * 1 * capScale, linePos.y2 + 0.5 * capScale * sideY, linePos.x2 + sideX * 1 * capScale, linePos.y2 + 1 * capScale * sideY);
                     if (style.weight >= 2) {
                        lineType(linePos.x2 + 1 * sideX, linePos.y2 + (OUTERSIZE / 2 - INNERSIZE / 2 - 1 - outerSpreadY) * sideY - spreadFillStepY,
                           linePos.x2 + 1 * sideX, linePos.y2 + 1 * sideY);
                        //lineType(linePos.x2, linePos.y2+(OUTERSIZE/2-INNERSIZE/2-1)*sideY , linePos.x2 , linePos.y2+1*sideY)
                     }
                  }
               }
            }

            if (PLUSX > 0 && LINE_FROM === 0) {
               if (STRETCHX > 0)
                  drawStretchLines("stretch", sideX, sideY, "hori", spreadFillStepX, spreadFillStepY, 0);
               if (SPREADX > 0)
                  drawStretchLines("spread", sideX, sideY, "hori", spreadFillStepX, spreadFillStepY, 0);
            }

            if (layer === "fg") drawDot(linePos.x1, linePos.y1)
         }

      } else { // CORNER
         // determine based on endcap how much rounded the line should be
         const cornerRoundLength = (style.endCap === "round" && SIZES.length > 1) ? map(style.weight, 0, 1, 0, 1, true) : 0;

         let xpos = basePos.x;
         let ypos = basePos.y;

         const isCutVertical = (shapeParams.at === "end" && arcQ % 2 === 1 || shapeParams.at === "start" && arcQ % 2 === 0);
         const isCutHorizontal = (shapeParams.at === "end" && arcQ % 2 === 0 || shapeParams.at === "start" && arcQ % 2 === 1);

         if (shapeParams.type === "linecut" && font === "fonta") {
            if (isCutVertical) useSpreadY = false; // fix the inside of e
            if (isCutHorizontal) useSpreadX = false; // fix the inside of a

            // move corner inwards vertically if it's cut and facing to middle
            if (isCutVertical && SPREADY > 0) {
               outerSpreadY = 0;
               ypos -= sideY * SPREADY / 2;
            }
            // move corner inwards horizontally if it's cut and facing to middle in font a
            if (isCutHorizontal && SPREADX > 0) {
               outerSpreadX = 0;
               xpos -= sideX * SPREADX / 2;
            }
         }

         pickCornerModule(xpos, ypos, 0, 0, 0);

         // offset effect
         if (layer === "fg" && mode.spreadFills && (useSpreadX || useSpreadY)) {
            for (let i = 1; i <= style.spreadFillSteps; i++) { // dont draw first step again
               let fillStep = (i / style.spreadFillSteps) * 2;
               let fillOffsetX = (SPREADX > 0) ? spreadXScale * fillStep * -sideX : 0;
               let fillOffsetY = (SPREADY > 0) ? spreadYScale * fillStep * -sideY : 0;
               pickCornerModule(xpos + fillOffsetX, ypos + fillOffsetY, fillOffsetX, fillOffsetY, ((SPREADX > 0) ? i : 0));
               if (SPREADX > 0) {
                  pickCornerModule(xpos, ypos, fillOffsetX, fillOffsetY, i);
               }
            }
         }

         function pickCornerModule(xpos, ypos, spreadFillStepX, spreadFillStepY, fillIndexX) {
            switch (shape) {
               case "round":
                  drawRoundModule(xpos, ypos, spreadFillStepX, spreadFillStepY);
                  break;
               case "diagonal":
                  drawDiagonalModule(xpos, ypos, spreadFillStepX, spreadFillStepY);
                  break;
               case "square":
                  drawSquareModule(xpos, ypos, spreadFillStepX, spreadFillStepY);
                  break;
               default:
                  print(shape + " is not a valid shape!");
                  break;
            }
            //drawCornerFillCaps(xpos, ypos, spreadFillStepX, spreadFillStepY) //WIP BROKEN/USELESS?
            if (layer === "fg") drawDot(xpos + sideX * size / 2, ypos)
            if (layer === "fg") drawDot(xpos, ypos + sideY * size / 2)
            drawCornerStretch(xpos, ypos, spreadFillStepX, spreadFillStepY, fillIndexX); // UHHH DOESN"T ACTUALLY MAKE COPIES
         }


         function drawRoundModule(xpos, ypos, spreadFillStepX, spreadFillStepY) {

            // angles
            let startAngle = PI + (arcQ - 1) * HALF_PI;
            let endAngle = startAngle + HALF_PI;

            let drawCurve = true; // gets updated in function
            let cutDifference = shortenAngleBy();


            function shortenAngleBy() {
               let cutDifference = 0;

               function arcUntilLineAt(y) {
                  const altValue = HALF_PI;
                  //if too close
                  if (y <= 0) {
                     return altValue;
                  }
                  const x = Math.sqrt(size ** 2 - y ** 2);
                  const dangerousOverlap = ((size - x) < 0.6);
                  const inNextLetter = (size >= (OUTERSIZE + style.spacing * 2));
                  if (dangerousOverlap && isCutVertical && inNextLetter) {
                     // might have to be removed
                     //but depends on what letter is adjacent
                     if (font === "fonta") {
                        // only really matters for e
                        if (charInSet(style.nextchar, ["ml"]) && OFFSETRIGHT === 1)
                           return 0;
                     } else if (font === "fontb") {
                        // matters for s,z,y
                        if (charInSet(style.nextchar, ["ml"]) && OFFSETRIGHT === 1)
                           return 0;
                        if (charInSet(style.prevchar, ["mr"]) && OFFSETRIGHT === 0)
                           return 0;
                     }
                  }
                  const theta = (Math.atan2(y, x));
                  return { angle: theta, position: x / 2 };
               }
               function arcUntilArc(sizeCircle, sizeOther, dist) {
                  //if too close
                  // if (da <= 2 || db <= 2) {
                  //    return altValue
                  // }
                  const altValue = HALF_PI;
                  const ra = sizeCircle / 2;
                  const rb = sizeOther / 2;

                  const x = (dist ** 2 - rb ** 2 + ra ** 2) / (2 * dist);
                  const y = Math.sqrt(ra ** 2 - x ** 2);
                  const theta = (Math.atan2(x, y));
                  //const amount = (2*theta)/PI
                  if (theta < 0) {
                     return altValue;
                  }
                  return theta;
               }


               if (shapeParams.type === "linecut") {
                  if (INNERSIZE - 2 <= 0 && shapeParams.alwaysCut) {
                     drawCurve = false;
                  }
                  if (layer === "fg") {
                     let overlapWeight = INNERSIZE;
                     // wip - inside e
                     // if (outerSpreadY !== 0 && isCutVertical)
                     //    overlapWeight = INNERSIZE + outerSpreadY + style.stretchY / 2;
                     // wip - inside a
                     // if (outerSpreadX !== 0 && isCutHorizontal)
                     //    overlapWeight = INNERSIZE + outerSpreadX + style.stretchX / 2;

                     cutDifference = HALF_PI - arcUntilLineAt(overlapWeight - 2).angle;

                     //now draw the straight line if spread fill
                     if (mode.spreadFills) {
                        //vertical
                        if (spreadFillStepY === 0 && useSpreadY) {
                           const fHeight = spreadYScale*2;
                           const offsetY = -Math.abs(outerSpreadY) + arcUntilLineAt(overlapWeight - 2).position;
                           const distance = (INNERSIZE / 2 - 1)*sideX;
                           line(xpos + distance, ypos + (offsetY) * sideY, xpos + distance, ypos + (offsetY - fHeight) * sideY);
                        }
                        //horizontal
                        if (spreadFillStepX === 0 && useSpreadX) {
                           const fWidth = spreadXScale*2;
                           const offsetX = -Math.abs(outerSpreadX) + arcUntilLineAt(overlapWeight - 2).position;
                           const distance = (INNERSIZE / 2 - 1)*sideY;
                           line(xpos + (offsetX) * sideX, ypos + distance, xpos + (offsetX - fWidth) * sideX, ypos + distance);
                        }
                     }
                  }
               } else if (shapeParams.type === "branch") {
                  if (layer === "fg") {
                     const mediumSize = (OUTERSIZE+INNERSIZE)/2
                     cutDifference = HALF_PI - arcUntilLineAt(min(size, mediumSize)).angle;
                  }
               } else if (shapeParams.type === "roundcut") {

                  if ((INNERSIZE <= 2 || OUTERSIZE + 2 <= 2) && shapeParams.alwaysCut) {
                     drawCurve = false;
                  }
                  if (layer === "fg" && INNERSIZE > 1) {

                     let heightDistance = Math.abs(outerSpreadY) - spreadFillStepY * sideY;

                     if (heightDistance > arcUntilLineAt(INNERSIZE - 2).position) {
                        // use if far enough inside letter
                        cutDifference = HALF_PI - arcUntilLineAt(INNERSIZE - 2).angle;
                     } else {
                        // use round cut
                        // WIP should use spreadFillStepX here somehow
                        let circleDistance = INNERSIZE + style.weight - (SPREADX / 2 - Math.abs(outerSpreadX) + spreadFillStepX*sideX);

                        // adjust angle to account for this diagonal because of spread...
                        // if the circles are vertically offset, get the proper distance of the diagonal
                        let rotationAngle = atan(heightDistance / circleDistance);
                        circleDistance = Math.sqrt(circleDistance ** 2 + heightDistance ** 2);
                        // get the result
                        cutDifference = HALF_PI - arcUntilArc(size, OUTERSIZE + 2, circleDistance) + rotationAngle;
                     }
                  }
               }
               return cutDifference;
            }


            // pick which end to cut
            if (shapeParams.at === "start") {
               startAngle += cutDifference;
            } else if (shapeParams.at === "end") {
               endAngle -= cutDifference;
            }

            // draw the line (until the cut angle if foreground)
            if (drawCurve) {

               const wipGraphics = false;

               if (layer === "fg" || shapeParams.type === undefined || shapeParams.type === "extend") {

                  // basic curve for lines, shortened if needed
                  arcType(xpos + outerSpreadX * sideX, ypos + outerSpreadY * sideY, size, size, startAngle, endAngle);

               } else if (wipGraphics && layer === "bg" && (mode.svg || viewMode === "xray" || stripeEffects.includes(effect))) {

                  // background segment with cutoff is displayed as an image instead
                  // this only happens in svg mode or while xray view is on
                  // slow, try to optimize...
                  const layerGroup = (shapeParams.type === "linecut") ? fillCornerLayers.linecut : fillCornerLayers.roundcut;
                  if (layerGroup[size] === undefined) {
                     layerGroup[size] = createGraphics((size) * finalValues.zoom, (size) * finalValues.zoom);
                     if (viewMode === "xray")
                        layerGroup[size].background((mode.dark) ? "#FFFFFF20" : "#00000010");
                     layerGroup[size].scale(finalValues.zoom);
                     layerGroup[size].noFill();
                     layerGroup[size].stroke((viewMode === "xray") ? palette.xrayBgCorner : palette.bg);
                     layerGroup[size].strokeCap(SQUARE);
                     layerGroup[size].strokeWeight(style.weight * strokeScaleFactor);
                     arcType(size, size, size, size, HALF_PI * 2, HALF_PI * 3, layerGroup[size]);
                     if (shapeParams.type === "linecut") {
                        for (let x = 0; x < size * finalValues.zoom; x++) {
                           const lineUntil = (size + style.weight) * 0.5 + 1 + (style.stroke / 10) * 0.5;
                           for (let y = 0; y < lineUntil * finalValues.zoom; y++) {
                              layerGroup[size].set(x, y, color("#00000000"));
                           }
                        }
                     } else {
                        layerGroup[size].erase();
                        const gap = 1 - (style.stroke / 10) * 0.5;
                        layerGroup[size].strokeWeight((style.weight + gap * 2) * strokeScaleFactor);
                        layerGroup[size].ellipse(size, 0, size, size);
                     }
                     layerGroup[size].updatePixels();
                  }
                  push();
                  translate(xpos, ypos);
                  if (arcQ === 2) { rotate(HALF_PI); }
                  else if (arcQ === 3) { rotate(HALF_PI * 2); }
                  else if (arcQ === 4) { rotate(HALF_PI * 3); }
                  if (shapeParams.at === 'start') { scale(-1, 1); rotate(HALF_PI); }
                  image(layerGroup[size], -size, -size, size, size);
                  pop();
               }
            }
         }

         function drawSquareModule(xpos, ypos, spreadFillStepX, spreadFillStepY) {

            if (shapeParams.type === "branch" && layer === "fg") {
               let branchAxis = ((arcQ % 2 === 1) === (shapeParams.at === "start")) ? "hori" : "vert";

               // for triangle of lines that branches off
               let branchLengthX = size + outerSpreadX * 2;
               let revSizeX = OUTERSIZE + INNERSIZE - size;
               let branchLengthY = size + outerSpreadY * 2;
               let revSizeY = OUTERSIZE + INNERSIZE - size;

               if ((size) > (OUTERSIZE + INNERSIZE) / 2) {
                  branchLengthX = revSizeX;
                  branchLengthY = revSizeY;
               }

               // side bit, not in branch direction
               const baseX = xpos + sideX * (size / 2 + outerSpreadX);
               const baseY = ypos + sideY * (size / 2 + outerSpreadY);
               if (branchAxis === "vert") {
                  lineType(xpos + outerSpreadX * sideX, baseY, xpos + sideX * branchLengthX / 2, baseY);
               } else {
                  lineType(baseX, ypos + outerSpreadY * sideY, baseX, ypos + sideY * branchLengthY / 2);
               }

               if (branchAxis === "vert") {
                  if (size < (OUTERSIZE + INNERSIZE) / 2) {
                     //from outside
                     if (SPREADY === 0) {
                        lineType(baseX, ypos + OUTERSIZE / 2 * sideY, baseX, ypos + sideY * (OUTERSIZE / 2 + (OUTERSIZE - revSizeY) / -2));
                     }
                     if (Math.abs(outerSpreadY) !== SPREADY / 2) {
                        // change branch length of the ones getting shorter again because of spread
                        branchLengthY = revSizeY/2 - SPREADY/2 + outerSpreadY + SPREADY/2;
                        lineType(baseX, ypos + OUTERSIZE / 2 * sideY, baseX, ypos + sideY * (branchLengthY));
                     }
                     // from inside
                     branchLengthY = OUTERSIZE / 2 + (OUTERSIZE - size) / -2 + outerSpreadY;
                     lineType(baseX, ypos + outerSpreadY * sideY, baseX, ypos + sideY * (branchLengthY));

                  } else {
                     // outer rings
                     lineType(baseX, ypos + outerSpreadY * sideY, baseX, ypos + sideY * (OUTERSIZE / 2));
                  }
               } else if (branchAxis === "hori") {
                  if (size < (OUTERSIZE + INNERSIZE) / 2) {
                     //from outside
                     if (SPREADX === 0) {
                        lineType(xpos + OUTERSIZE / 2 * sideX, baseY, xpos + sideX * (OUTERSIZE / 2 + (OUTERSIZE - revSizeX) / -2), baseY);
                     }
                     if (Math.abs(outerSpreadX) !== SPREADX / 2) {
                        // change branch length of the ones getting shorter again because of spread
                        branchLengthX = revSizeX/2 - SPREADX/2 + outerSpreadX + SPREADX/2;
                        lineType(xpos + OUTERSIZE / 2 * sideX, baseY, xpos + sideX * (branchLengthX), baseY);
                     }
                     // from inside
                     branchLengthX = OUTERSIZE / 2 + (OUTERSIZE - size) / -2 + outerSpreadX;
                     lineType(xpos + outerSpreadX * sideX, baseY, xpos + sideX * (branchLengthX), baseY);
                  } else {
                     // outer rings
                     lineType(xpos + outerSpreadX * sideX, baseY, xpos + sideX * (OUTERSIZE / 2), baseY);
                  }
               }

            } else {

               // regular square corner
               beginShape();
               vertex(xpos + sideX * size / 2 + outerSpreadX * sideX, ypos + outerSpreadY * sideY); // start
               if (cornerRoundLength === 1 && size === OUTERSIZE) {
                  //rounded corner on outer size
                  const xBez1 = xpos + sideX * size / 2 + outerSpreadX * sideX;
                  const yBez1 = ypos + sideY * size / 2 + outerSpreadY * sideY - 1 * sideY;
                  const xBez2 = xpos + sideX * size / 2 + outerSpreadX * sideX - 1 * sideX;
                  const yBez2 = ypos + sideY * size / 2 + outerSpreadY * sideY;
                  vertex(xBez1, yBez1);
                  endShape();
                  bezier(xBez1, yBez1, xBez1, yBez1 + 0.5 * sideY,
                     xBez2 + 0.5 * sideX, yBez2, xBez2, yBez2);
                  beginShape();
                  vertex(xBez2, yBez2);
               } else {
                  vertex(xpos + sideX * size / 2 + outerSpreadX * sideX, ypos + sideY * size / 2 + outerSpreadY * sideY); // middle
               }
               vertex(xpos + outerSpreadX * sideX, ypos + sideY * size / 2 + outerSpreadY * sideY);
               endShape();
            }
         }

         function drawDiagonalModule(xpos, ypos, spreadFillStepX, spreadFillStepY) {

            const step = (size - INNERSIZE) / 2 + 1;
            const stepslope = step * tan(HALF_PI / 4);
            let xPoint = createVector(xpos + sideX * size / 2, ypos + sideY * stepslope);
            let yPoint = createVector(xpos + sideX * stepslope, ypos + sideY * size / 2);

            if (layer === "fg") {
               if (shapeParams.type === "linecut" && ((OUTERSIZE - INNERSIZE) / 2 + 1) * tan(HALF_PI / 4) < INNERSIZE / 2 - 2) {
                  let changeAxis = "";
                  if (shapeParams.at === "start") {
                     changeAxis = (arcQ === 1 || arcQ === 3) ? "x" : "y";
                  } else if (shapeParams.at === "end") {
                     changeAxis = (arcQ === 1 || arcQ === 3) ? "y" : "x";
                  }
                  if (changeAxis === "x") {
                     xPoint.x = xpos + sideX * (OUTERSIZE / 2 - style.weight - 1);
                     xPoint.y = yPoint.y - (OUTERSIZE / 2 - style.weight - 1) + sideY * stepslope;
                     lineType(xpos + outerSpreadX * sideX, yPoint.y + outerSpreadY * sideY, yPoint.x + outerSpreadX * sideX, yPoint.y + outerSpreadY * sideY);
                  } else if (changeAxis === "y") {
                     yPoint.y = ypos + sideY * (OUTERSIZE / 2 - style.weight - 1);
                     yPoint.x = xPoint.x - (OUTERSIZE / 2 - style.weight - 1) + sideX * stepslope;
                     lineType(xPoint.x + outerSpreadX * sideX, ypos + outerSpreadY * sideY, xPoint.x + outerSpreadX * sideX, xPoint.y + outerSpreadY * sideY);
                  }
                  lineType(xPoint.x + outerSpreadX * sideX, xPoint.y + outerSpreadY * sideY, yPoint.x + outerSpreadX * sideX, yPoint.y + outerSpreadY * sideY);
               } else {
                  lineType(xPoint.x + outerSpreadX * sideX, xPoint.y + outerSpreadY * sideY, yPoint.x + outerSpreadX * sideX, yPoint.y + outerSpreadY * sideY);
                  if (step > 0) {
                     lineType(xPoint.x + outerSpreadX * sideX, ypos + outerSpreadY * sideY, xPoint.x + outerSpreadX * sideX, xPoint.y + outerSpreadY * sideY);
                     lineType(xpos + outerSpreadX * sideX, yPoint.y + outerSpreadY * sideY, yPoint.x + outerSpreadX * sideX, yPoint.y + outerSpreadY * sideY);
                  }
               }
            } else {
               beginShape();
               vertex(xpos + sideX * size / 2 + outerSpreadX * sideX, ypos + outerSpreadY * sideY);
               vertex(xpos + sideX * size / 2 + outerSpreadX * sideX, ypos + sideY * stepslope + outerSpreadY * sideY);
               vertex(xpos + sideX * stepslope + outerSpreadX * sideX, ypos + sideY * size / 2 + outerSpreadY * sideY);
               vertex(xpos + outerSpreadX * sideX, ypos + sideY * size / 2 + outerSpreadY * sideY);
               endShape();
            }
         }

         // stretch
         function drawCornerStretch(xpos, ypos, spreadFillStepX, spreadFillStepY, fillIndexX) {

            // cut in direction of stretch?
            function isCutInDir(type, dir) {

               if (type === undefined)
                  return false;
               if (type === "branch")
                  return false;
               //if (type === "extend") return false
               const cutX = (arcQ % 2 === 0) === (shapeParams.at === "start");
               return ((dir === "x") === cutX);
            }

            if (shapeParams.noStretchX === undefined && !isCutInDir(shapeParams.type, "x") && (layer === "fg" || outerSpreadX === 0)) {

               if (font === "fonta" && !(shapeParams.type === "linecut" && isCutHorizontal) || font === "fontb" || font === "fontc") {
                  if (SPREADX > 0)
                     drawStretchLines("spread", sideX, sideY, "hori", spreadFillStepX, spreadFillStepY, 0);
               }
               if (STRETCHX > 0)
                  drawStretchLines("stretch", sideX, sideY, "hori", spreadFillStepX, spreadFillStepY, 0);

            }

            if (shapeParams.noStretchY === undefined && !isCutInDir(shapeParams.type, "y") && (layer === "fg" || outerSpreadY === 0)) {

               // round shapes should get vertical spread effect, unless...
               if (font === "fonta" && !(shapeParams.type === "linecut" && isCutVertical) || font === "fontb" || font === "fontc") {
                  if (SPREADY > 0)
                     drawStretchLines("spread", sideX, sideY, "vert", spreadFillStepX, spreadFillStepY, fillIndexX);
               }
               if (STRETCHY > 0)
                  drawStretchLines("stretch", sideX, sideY, "vert", spreadFillStepX, spreadFillStepY, fillIndexX);
               if (EXTRAY > 0)
                  drawStretchLines("extra", sideX, sideY, "vert", spreadFillStepX, spreadFillStepY, fillIndexX);
            }

            const extendamount = ((OUTERSIZE % 2 == 0) ? 0 : 0.5) + (style.stretchX - (style.stretchX % 2)) * 0.5;
            if (shapeParams.type === "extend" && extendamount > 0) {
               const toSideX = (arcQ === 1 || arcQ === 2) ? -1 : 1;
               let extendXPos = xpos;
               let extendYPos = ypos + (size * 0.5 + outerSpreadY) * toSideX;
               const dirX = (arcQ === 1 || arcQ === 4) ? 1 : -1;
               lineType(extendXPos, extendYPos, extendXPos + dirX * extendamount, extendYPos);
            }
         }

         // other corner shapes...
      }

      function drawStretchLines (stretchMode, sideX, sideY, axis, spreadFillStepX, spreadFillStepY, fillIndexX) {

         if (stretchMode === "extra") {
            if (font === "fontb" || font === "fontc") {
               if (style.ytier === 1 && sideY === -1 || style.ytier === 0 && sideY === 1) {
                  return;
               }
            } 
         } else {
            if ((font === "fontb" || font === "fontc") && axis === "vert") {
               if (style.ytier === 1 && sideY === 1 || style.ytier === 0 && sideY === -1) {
                  return;
               }
            }
         }


         // separate xray color
         if (stretchMode === "stretch" && viewMode === "xray" && layer === "bg") {
            if (shape === "vert" || shape === "hori") {
               stroke(palette.xrayStretch);
            } else {
               stroke(palette.xrayStretchCorner);
            }
         }

         const sPos = {
            x: basePos.x,
            y: basePos.y
         };

         if (axis === "hori") {
            sPos.y += sideY * (size * 0.5 + outerSpreadY + SPREADY / 2) + spreadFillStepY;

            if (stretchMode === "stretch") {
               sPos.x -= sideX * SPREADX / 2;
               sPos.y -= sideY * SPREADY / 2;
               const stretchDifference = -sideX * style.stretchX * 0.5;

               // the offset can be in between the regular lines vertically if it would staircase nicely
               let offsetShift = 0;
               //let stairDir = (style.vOffset + (offQ === 2 || offQ === 3) ? 1 : 0) % 2 === 0 ? -1 : 1;
               if (Math.abs(style.offsetY) > 2 && Math.abs(style.offsetY) < 4) {
                  offsetShift = (style.offsetY / 3) * -sideX;
               } else if (Math.abs(style.offsetY) > 1 && Math.abs(style.offsetY) < 3) {
                  offsetShift = (style.offsetY / 2) * -sideX;
               }

               // draw
               lineType(sPos.x + stretchDifference, sPos.y + offsetShift, sPos.x, sPos.y + offsetShift);

            } else if (stretchMode === "spread") {
               const spreadLengthX = outerSpreadX * -1;
               const maxSpreadLengthX = SPREADX / 2;

               // WIP also account for fill length 
               if (layer === "fg" && (spreadLengthX !== maxSpreadLengthX || mode.spreadFills) || layer === "bg" && spreadLengthX === 0) {
                  sPos.x += sideX * outerSpreadX;
                  sPos.y -= sideY * SPREADY / 2;
                  const spreadDifferenceX = -sideX * (maxSpreadLengthX - spreadLengthX);
                  const fillSpreadDifferenceX = spreadFillStepX;
                  lineType(sPos.x + fillSpreadDifferenceX, sPos.y, sPos.x + spreadDifferenceX, sPos.y);
               }
            }

         } else if (axis === "vert") {
            const outerSPosX = sPos.x + sideX * (OUTERSIZE * 0.5);
            sPos.x += sideX * (size * 0.5 + outerSpreadX + SPREADX / 2) + spreadFillStepX;

            if (stretchMode === "stretch" || stretchMode === "extra") {
               sPos.x -= sideX * SPREADX / 2;
               sPos.y -= sideY * SPREADY / 2;

               let stretchDifference = -sideY * STRETCHY * 0.5;
               if (stretchMode === "extra") {
                  stretchDifference = -sideY * EXTRAY * 0.5;
               }

               if (layer === "fg" || outerSpreadY === 0) { //only draw once
                  // the offset can be in between the regular lines horizontally if it would staircase nicely
                  let offsetShift = 0;
                  let tierOffsetX = (style.ytier === 1) ? style.offsetX1 : style.offsetX
                  if (Math.abs(tierOffsetX) > 2 && Math.abs(tierOffsetX) < 4) {
                     offsetShift = tierOffsetX / 3 * sideY;
                  } else if (Math.abs(tierOffsetX) > 1 && Math.abs(tierOffsetX) < 3) {
                     offsetShift = tierOffsetX / 2 * sideY;
                  }

                  if (!midlineEffects.includes(effect) || stretchMode === "extra") {
                     if (SPREADY > 0 && (font === "fontb" || font === "fontc")) {
                        if ((style.ytier === 1 && sideY === -1) || (style.ytier === 0 && sideY === 1)) {
                           lineType(sPos.x - offsetShift, sPos.y + stretchDifference, sPos.x - offsetShift, sPos.y);
                        }
                     } else {
                        lineType(sPos.x - offsetShift, sPos.y + stretchDifference, sPos.x - offsetShift, sPos.y);
                     }
                  }

                  // if vertical line goes down, set those connection spots in the array
                  if (layer === "fg" && midlineEffects.includes(effect) && stretchMode !== "extra") {
                     // (sideY===-1&&style.ytier===1||sideY===1&&style.ytier===0)
                     // ^ does nothing....already the correct ones

                     if (style.char === "‸") {
                        //caret counts separately
                        style.caretSpots[0] = sPos.x;
                     } else {
                        const midlineSpotX = sPos.x;
                        sortIntoArray(style.stretchFxSpots[style.ytier][fillIndexX], midlineSpotX);

                        //add the remaining stretch spot on the end while fillIndex is on
                        // for some reason size is never OUTERSIZE then, so this is needed for now
                        //should only add this once, like only if size is smallest
                        if (size === INNERSIZE && fillIndexX !== 0) {
                           sortIntoArray(style.stretchFxSpots[style.ytier][fillIndexX], outerSPosX);
                        }

                     }
                  }
               }
            } else if (stretchMode === "spread") {
               const spreadLength = outerSpreadY * -1;
               const maxSpreadLength = SPREADY / 2;

               if (layer === "fg" && (spreadLength !== maxSpreadLength || mode.spreadFills) || layer === "bg" && spreadLength === 0) {
                  sPos.x -= sideX * SPREADX / 2;
                  sPos.y += sideY * outerSpreadY;
                  const spreadDifferenceY = -sideY * (maxSpreadLength - spreadLength);
                  const fillSpreadDifferenceY = spreadFillStepY;
                  lineType(sPos.x, sPos.y + fillSpreadDifferenceY, sPos.x, sPos.y + spreadDifferenceY);
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
   pop();

   function drawDot (x, y) {
      //noStroke()
      //fill(palette.bg)
      //ellipse(x, y, (style.stroke/10)*0.5)
      //noFill()
   }
}

function ringStyle (style, shape, size, smallest, biggest) {
   //const distToCenter = Math.abs(map(size+frameCount*0.1 % biggest, smallest, biggest, -1, 1))
   const distToCenter = Math.abs(map(size, smallest, biggest, -1, 1))
   // weight
   if (viewMode === "xray") {
      strokeWeight(2/10*strokeScaleFactor)
   } else if ((effect==="weightgradient") && biggest-smallest > 2) {
      strokeWeight((style.stroke/10) * strokeScaleFactor * map(distToCenter, 0, 1, 1.0, 0.5))
   } else {
      strokeWeight((style.stroke/10) * strokeScaleFactor)
   }
   // color
   let strokeColor = palette.fg;
   if (viewMode === "xray") {
      const outerColor = palette.fg;
      const innerColor = (shape === "hori" || shape === "vert") ? palette.xrayFg : palette.xrayFgCorner;
      if (smallest !== biggest) strokeColor = lerpColor(innerColor, outerColor, map(size, smallest, biggest, 0, 1));
      else strokeColor = outerColor;
   } else if (effect==="gradient" && biggest-smallest > 2) {
      const outerColor = lerpColor(palette.fg, palette.bg, 0.5);
      const innerColor = lerpColor(palette.fg, palette.bg, 0.0);
      strokeColor = lerpColor(innerColor, outerColor, distToCenter);
   }
   stroke(lerpColor(palette.bg, strokeColor, style.opacity));
}