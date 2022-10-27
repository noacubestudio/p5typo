'use strict';

import { finalValues, font, charInSet, endCapStyle, waveValue, mode } from '../sketch.mjs';


export function kerningAfter(char, nextchar, inner, outer) {
   const weight = (outer - inner) * 0.5 + finalValues.spreadX * 0.5;

   // negative spacing can't go past width of lines
   let spacing = max(finalValues.spacing, -weight);
   const optionalGap = map(inner, 1, 2, 0, 1, true);

   // overlap after letter, overwrites default variable spacing
   // only happens if it connects into next letter
   let overwriteAfter = 0;
   let ligatureAfter = false;
   let minSpaceAfter;
   if (font === "fonta") {
      switch (char) {
         case "s":
            if (!mode.altS) {
               if (!charInSet(nextchar, ["gap", "ul"])) {
                  overwriteAfter = -weight;
                  ligatureAfter = true;
               } else {
                  minSpaceAfter = 1;
               }
            }
            break;
         case "k":
         case "z":
            if (!charInSet(nextchar, ["gap", "dl"])) {
               overwriteAfter = -weight;
               ligatureAfter = true;
            } else {
               minSpaceAfter = 1;
            }
            break;
         case "x":
            if (!(charInSet(nextchar, ["gap", "dl"]) && charInSet(nextchar, ["gap", "ul"]))) {
               overwriteAfter = -weight;
               ligatureAfter = true;
            } else {
               minSpaceAfter = 1;
            }
            break;
         case "t":
         case "l":
            if (!charInSet(nextchar, ["gap", "dl"])) {
               overwriteAfter = -weight;
               ligatureAfter = true;
            } else {
               minSpaceAfter = 1;
            }
            break;
         case "f":
         case "c":
         case "r":
            if (!charInSet(nextchar, ["gap", "ul"])) {
               overwriteAfter = -weight;
               ligatureAfter = true;
            } else {
               minSpaceAfter = 1;
            }
            break;
      }
   } else if (font === "fontb") {
      switch (char) {
         case "t":
            minSpaceAfter = 1;
            break;
         case "c":
            if (!charInSet(nextchar, ["gap", "ul"])) {
               overwriteAfter = -weight;
               ligatureAfter = true;
            } else {
               minSpaceAfter = 1;
            }
            break;
         case "l":
            if (!charInSet(nextchar, ["gap", "dl"])) {
               overwriteAfter = -weight;
               ligatureAfter = true;
            } else {
               minSpaceAfter = 1;
            }
            break;
         case "e":
         case "f":
            minSpaceAfter = 1;
            break;
      }
   } else if (font === "fontc" && !mode.noLigatures) {
      switch (char) {
         case "f":
         case "r":
            if (!charInSet(nextchar, ["gap", "ul"])) {
               overwriteAfter = -weight;
               ligatureAfter = true;
            } else {
               minSpaceAfter = 1;
            }
            break;
      }
   }

   // depending on the next char, adjust the spacing
   // only check if the current char doesn't already make a ligature
   let overwriteBefore = 0;
   let ligatureBefore = false;
   let minSpaceBefore;
   if (ligatureAfter === false) {
      if (font === "fonta") {
         switch (nextchar) {
            case "s":
               if (!mode.altS) {
                  if (!charInSet(char, ["gap", "dr"])) {
                     overwriteBefore = -weight;
                     ligatureBefore = true;
                  } else {
                     if ("e".includes(char)) {
                        ligatureBefore = true;
                        overwriteBefore = optionalGap;
                     } else {
                        minSpaceBefore = optionalGap;
                     }
                  }
               } else {
                  //alt s
                  if (!charInSet(char, ["gap"])) {
                     overwriteBefore = -weight;
                     ligatureBefore = true;
                  }
               }
               break;
            case "x":
               if (!(charInSet(char, ["gap", "ur"]) && charInSet(char, ["gap", "dr"]))) {
                  overwriteBefore = -weight;
                  ligatureBefore = true;
               } else {
                  if ("e".includes(char)) {
                     ligatureBefore = true;
                  } else {
                     minSpaceBefore = 1;
                  }
               }
               break;
            case "z":
            case "j":
               if (!(charInSet(char, ["gap"]))) {
                  overwriteBefore = -weight;
                  ligatureBefore = true;
               }
               break;
         }
      } else if (font === "fontb") {
         switch (nextchar) {
            case "j":
               if (charInSet(char, ["dr"])) {
                  overwriteBefore = 1;
                  ligatureBefore = true;
               }
               minSpaceBefore = 1;
               break;
            case "t":
               minSpaceBefore = 1;
               break;
         }
      } else if (font === "fontc") {
         switch (nextchar) {
            //wip
         }
      }
   }

   // specific letter combination ligatures
   if (font === "fonta") {
      if ("ktlcrfsxz".includes(char) && nextchar === "s") {
         overwriteBefore = -inner - weight - finalValues.stretchX;
         ligatureBefore = true;
      }
      else if ("ktlcrfsx".includes(char) && nextchar === "x") {
         overwriteBefore = -inner - weight - finalValues.stretchX;
         ligatureBefore = true;
      }
      else if ("ktlcrfsxz".includes(char) && nextchar === "j") {
         overwriteBefore = -inner - weight - finalValues.stretchX;
         ligatureBefore = true;
      }
      else if ("sr".includes(char) && nextchar === "z") {
         overwriteBefore = -inner - weight - finalValues.stretchX;
         ligatureBefore = true;
      }
      else if ("ltkcfx".includes(char) && nextchar === "z") {
         overwriteBefore = weight - outer / 2 - finalValues.stretchX / 2;
         ligatureBefore = true;
      }
      else if ("z".includes(char) && nextchar === "z") {
         overwriteBefore = -2 - finalValues.stretchX;
         ligatureBefore = true;
      }
      else if ("z".includes(char) && nextchar === "x") {
         overwriteBefore = weight - outer / 2 - finalValues.stretchX / 2;
         ligatureBefore = true;
      }
   } else if (font === "fontb") {
      if ("lct".includes(char) && "tj".includes(nextchar)) {
         overwriteBefore = -outer + weight * 2 + 1 - finalValues.stretchX;
         ligatureBefore = true;
      }
      if ("ef".includes(char) && "tj".includes(nextchar)) {
         overwriteBefore = -outer + weight * 2 + 2 - finalValues.stretchX;
         ligatureBefore = true;
      }
   }

   // minimum spacing: special cases
   if (font === "fonta") {
      if (finalValues.rings >= 2) {
         if (("i".includes(char) && "bhkltiv".includes(nextchar)) ||
               ("dgi".includes(char) && "i".includes(nextchar))) {
               minSpaceAfter = 1;
         }
      } else if (finalValues.rings < 2) {
         if (("i".includes(char) && "bhkltfivnmrp".includes(nextchar)) ||
               ("dgihnmaqvy".includes(char) && "i".includes(nextchar)) ||
               ("dqay".includes(char) && "bhptf".includes(nextchar)) ||
               ("nm".includes(char) && "nm".includes(nextchar))) {
                  minSpaceAfter = 2 - finalValues.rings; // if there's less than two rings, introduce forced gap
         }
      }
   } else if (font === "fontb") {
      if (finalValues.rings < 2) {
         if (("g".includes(char) && "abcdefghiklmnopqruvw".includes(nextchar))
               || ("i".includes(char) && "abcdefhiklnpruvwxz".includes(nextchar))
               || ("aghijkmnouvwxyz".includes(char) && "i".includes(nextchar))) {
            minSpaceAfter = 2 - finalValues.rings; // if there's less than two rings, introduce forced gap
         }
      }
   } else if (font === "fontc") {
      if (finalValues.rings >= 2 && endCapStyle === "none") {
         if (("i".includes(char) && "bhkltiv".includes(nextchar)) ||
               ("dilj".includes(char) && "i".includes(nextchar))) {
            minSpaceAfter = 1;
         }
      } else if (finalValues.rings < 2) {
         // WIP, maybe some can still be together with just one ring
         minSpaceAfter = 2 - finalValues.rings; // if there's less than two rings, introduce forced gap
      }
   }

   if (".,!?-_:|".includes(char)) minSpaceAfter = 1;
   if (".,!?-_:|".includes(nextchar)) minSpaceBefore = 1;



   // minimum spacing ignored next to gap
   if (nextchar === " ") minSpaceAfter = undefined;
   if (char === " ") minSpaceBefore = undefined;


   // remove overlap spacing if next to space
   // WIP are these actually needed?
   if (charInSet(nextchar, ["gap"])) {
      overwriteBefore = 0;
      ligatureBefore = false;
   }
   if (charInSet(char, ["gap"])) {
      overwriteAfter = 0;
      ligatureAfter = false;
   }

   // if there is no special overlaps, use the global spacing
   if (ligatureAfter === false && ligatureBefore === false) {
      //regular spacing, if above minspacing
      if (minSpaceBefore !== undefined) {
         return max(spacing, minSpaceBefore);
      } else if (minSpaceAfter !== undefined) {
         return max(spacing, minSpaceAfter);
      } else if (!" ‸".includes(char) && !" ‸".includes(nextchar)) {
         return spacing;
      } else if ("‸".includes(nextchar)) {
         return 1;
      } // other punctuation stays at default below
   }
   return overwriteAfter + overwriteBefore;
}

export function letterWidth(prevchar, char, nextchar, inner, outer, extendOffset) {
   const weight = (outer - inner) * 0.5 + finalValues.spreadX * 0.5;
   const optionalGap = map(inner, 1, 2, 0, 1, true); // WIP why is this here lol
   // widths of letters without overlapping
   let charWidth = outer;
   if (font === "fonta") {
      switch (char) {
         case "m":
         case "w":
            charWidth = weight * 3 + inner * 2;
            break;
         case "x":
            charWidth = weight * 2 + inner * 2 + 1;
            if ((charInSet(prevchar, ["ur"])&&charInSet(prevchar, ["dr"])) || charInSet(prevchar, ["gap"])) {
               charWidth += -weight*1 -1;
            }
            if ((charInSet(nextchar, ["ul"])&&charInSet(nextchar, ["dl"])) || charInSet(nextchar, ["gap"])) {
               charWidth += -weight*1 -1;
            }
            break;
         case "j":
            if (charInSet(prevchar, ["gap"])) {
               charWidth = weight * 1 + inner - 1;
            }
            break;
         case "s":
            if (!mode.altS) {
               charWidth = weight * 3 + inner * 2;
               if (charInSet(nextchar, ["gap", "ul"])) {
                  charWidth += -0.5 * outer + optionalGap -1;
               }
               if (charInSet(prevchar, ["gap", "dr"])) {
                  charWidth += -0.5 * outer;
               }
            } else {
               if (charInSet(prevchar, ["gap"])) {
                  charWidth = weight * 1 + inner - 1;
               }
            }
            break;
         case "z":
            charWidth = outer + 2 + weight + waveValue(outer, 0, 1);
            if (charInSet(prevchar, ["gap"])) {
               charWidth += -weight -1;
            }
            if (charInSet(nextchar, ["gap", "dl"])) {
               charWidth += -weight -1;
            }
            break;
         case "t":
         case "l":
            if (charInSet(nextchar, ["gap", "dl"])) {
               charWidth = outer - weight - 1;
            }
            break;
         case "f":
         case "c":
         case "r":
            if (charInSet(nextchar, ["gap", "ul"])) {
               charWidth = outer - weight - 1;
            }
            break;
         case "k":
            if (charInSet(nextchar, ["gap", "dl"])) {
               charWidth = outer - 1;
            } else {
               charWidth = outer + 1;
            }
            break;
         case " ":
            charWidth = max([2, finalValues.spacing * 2, inner-1]);
            break;
         case "i":
         case ".":
         case ",":
         case "!":
            charWidth = weight;
            break;
         case "‸":
            charWidth = 1;
            if (charInSet(nextchar, ["gap"])) {
               charWidth = 0;
            }
            break;
         case "|":
            charWidth = 0;
            break;
         case "-":
         case "_":
            charWidth = max(1, outer-2)
            break;
      }
   } else if (font === "fontb") {
      switch (char) {
         case "m":
         case "w":
            charWidth = weight * 3 + inner * 2;
            break;
         case "e":
         case "f":
            charWidth = outer - weight - 1;
            break;
         case "c":
            if (charInSet(nextchar, ["gap", "ul"])) {
               charWidth = outer - weight - 1;
            }
            break;
         case "t":
            charWidth = weight + inner * 2 - 2;
            break;
         case "l":
            if (charInSet(nextchar, ["gap", "dl"])) {
               charWidth = outer - weight - 1;
            }
            break;
         case "‸":
            charWidth = 1;
            if (charInSet(nextchar, ["gap"])) {
               charWidth = 0;
            }
            break;
         case "i":
         case "1":
         case ".":
         case ",":
         case "!":
            charWidth = weight;
            break;
         case "j":
            charWidth = weight * 1 + inner - 1;
            break;
         case " ":
            charWidth = max([2, finalValues.spacing * 2, inner-1]);
            break;
         case "|":
            charWidth = 0;
            break;
         case "-":
         case "_":
            charWidth = max(1, outer-2)
            break;
      }
   } else if (font === "fontc") {
      switch (char) {
         case "m":
         case "w":
            charWidth = weight * 3 + inner * 2;
            break;
         case "i":
         case "l":
         case "1":
         case ".":
         case ",":
         case ":":
         case "!":
            charWidth = weight;
            break;
         case "f":
         case "r":
            if (charInSet(nextchar, ["gap", "ul"]) && !mode.noLigatures) {
               charWidth = outer - weight - 1;
            }
            break;
         case "‸":
            charWidth = 1;
            if (charInSet(nextchar, ["gap"])) {
               charWidth = 0;
            }
            break;
         case " ":
            charWidth = max([2, finalValues.spacing * 2, inner-1]);
            break;
         case "|":
            charWidth = 0;
            break;
         case "-":
         case "_":
            charWidth = max(1, outer-2)
            break;
      }
   }

   // stretchWidth
   let stretchWidth = undefined;
   if (font === "fonta") {
      switch (char) {
         case "s":
            if (!mode.altS) {
               if (charInSet(prevchar, ["gap", "dr"])) {
                  stretchWidth = extendOffset;
               } else {
                  stretchWidth = (finalValues.stretchX + finalValues.spreadX);
               }
               if (charInSet(nextchar, ["gap", "ul"])) {
                  stretchWidth += extendOffset;
               } else {
                  stretchWidth += (finalValues.stretchX + finalValues.spreadX);
               }
            }
            break;
         case "m":
         case "w":
         case "x":
         case "z":
            stretchWidth = (finalValues.stretchX) * 2;
            break;
         case "i":
         case ".":
         case ",":
         case "!":
         case " ":
         case "‸": //caret
            stretchWidth = 0;
            break;
         default:
            stretchWidth = finalValues.stretchX + finalValues.spreadX;
      }
   } else if (font === "fontb") {
      switch (char) {
         case "m":
         case "w":
            stretchWidth = finalValues.stretchX*2;
            break;
         case "t":
            stretchWidth = finalValues.stretchX*2;
            break;
         case "i":
         case ".":
         case ",":
         case "!":
         case " ":
         case "‸": //caret
            stretchWidth = 0;
            break;
         default:
            stretchWidth = (finalValues.stretchX + finalValues.spreadX);
      }
   } else if (font === "fontc") {
      switch (char) {
         case "m":
         case "w":
            stretchWidth = finalValues.stretchX*2;
            break;
         case "i":
         case "l":
         case "1":
         case ".":
         case ",":
         case "!":
         case " ":
         case "‸": //caret
            stretchWidth = 0;
            break;
         default:
            stretchWidth = (finalValues.stretchX + finalValues.spreadX);
      }
   }

   return charWidth + stretchWidth;
}
