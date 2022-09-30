'use strict';

import { finalValues, font, charInSet, endCapStyle, waveValue, mode } from '../sketch.mjs';


export function letterKerning(isLastLetter, prevchar, char, nextchar, spacing, inner, outer, extendOffset) {
   const weight = (outer - inner) * 0.5 + finalValues.spreadX * 0.5;

   // negative spacing can't go past width of lines
   spacing = max(spacing, -weight);
   let optionalGap = map(inner, 1, 2, 0, 1, true);

   // spacing is used between letters that don't make a special ligature
   // some letters force a minimum spacing
   // WIP: currently depends of number of rings - if there's only one, more space
   // However, finalValues.rings isn't accurate to real number, also depends on size
   if (font === "fonta") {
      if (finalValues.rings >= 2) {
         if (("i".includes(char) && "bhkltiv".includes(nextchar)) ||
            ("dgi".includes(char) && "i".includes(nextchar))) {
            spacing = max(spacing, 1);
         }
      } else if (finalValues.rings < 2) {
         if (("i".includes(char) && "bhkltfivnmrp".includes(nextchar)) ||
            ("dgihnmaqvy".includes(char) && "i".includes(nextchar)) ||
            ("dqay".includes(char) && "bhptf".includes(nextchar)) ||
            ("nm".includes(char) && "nm".includes(nextchar))) {
            spacing = max(spacing, 2 - finalValues.rings); // if there's less than two rings, introduce forced gap
         }
      }
   } else if (font === "fontb") {
      if (finalValues.rings < 2) {
         if (("g".includes(char) && "abcdefghiklmnopqruvw".includes(nextchar))
            || ("i".includes(char) && "abcdefhiklnpruvwxz".includes(nextchar))
            || ("aghijkmnouvwxyz".includes(char) && "i".includes(nextchar))) {
            spacing = max(spacing, 2 - finalValues.rings); // if there's less than two rings, introduce forced gap
         }
      }
   } else if (font === "fontc") {
      if (finalValues.rings >= 2 && endCapStyle === "rounded") {
         if (("i".includes(char) && "bhkltiv".includes(nextchar)) ||
            ("di".includes(char) && "i".includes(nextchar))) {
            spacing = max(spacing, 1);
         }
      } else if (finalValues.rings < 2) {
         // WIP, maybe some can still be together with just one ring
         spacing = max(spacing, 2 - finalValues.rings); // if there's less than two rings, introduce forced gap
      }
   }

   if ("|".includes(char))
      spacing = max(spacing, 1);
   if ("|".includes(nextchar))
      spacing = max(spacing, 1);

   // widths of letters without overlapping
   let charWidth = outer;
   if (font === "fonta") {
      switch (char) {
         case "m":
         case "w":
            charWidth = weight * 3 + inner * 2;
            break;
         case "x":
            charWidth = weight * 2 + inner * 2;
            if (charInSet(prevchar, ["gap", "ur"]) && charInSet(prevchar, ["gap", "dr"])) {
               charWidth = weight * 1 + inner * 2 - 1;
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
                  charWidth += -0.5 * outer + optionalGap;
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
            charWidth = 2 + outer + waveValue(outer, 0, 1);
            if (charInSet(prevchar, ["gap"])) {
               charWidth -= weight + 1;
            }
            break;
         case " ":
            charWidth = max([2, spacing * 2, inner-1]);
            break;
         case "i":
         case ".":
         case ",":
         case "!":
            charWidth = weight;
            break;
         case "t":
         case "l":
            if (charInSet(nextchar, ["gap", "dl"])) {
               charWidth = outer - weight;
            }
            break;
         case "f":
         case "c":
         case "r":
            if (charInSet(nextchar, ["gap", "ul"])) {
               charWidth = outer - weight;
            }
            break;
         case "?":
            charWidth = ceil(outer * 0.5);
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
               charWidth = outer - weight;
            }
            break;
         case "t":
            charWidth = weight + inner * 2 - 1;
            break;
         case "l":
            if (charInSet(nextchar, ["gap", "dl"])) {
               charWidth = outer - weight;
            }
            break;
         case "‸":
            charWidth = 1;
            if (charInSet(nextchar, ["gap"])) {
               charWidth = 0;
            }
            break;
         case "i":
         case ".":
         case ",":
         case "!":
            charWidth = weight;
            break;
         case "j":
            charWidth = weight * 1 + inner - 1;
            break;
         case " ":
            charWidth = max([2, spacing * 2, inner-1]);
            break;
         case "|":
            charWidth = 0;
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
         case "‸":
            charWidth = 1;
            if (charInSet(nextchar, ["gap"])) {
               charWidth = 0;
            }
            break;
         case " ":
            charWidth = max([2, spacing * 2, inner-1]);
            break;
         case "|":
            charWidth = 0;
            break;
      }
   }

   if (font === "fonta") {
      // 1 less space after letters with cutoff
      if ("ktlcrfsxz-".includes(char)
         && charInSet(nextchar, ["gap"])
         && !"|".includes(nextchar)) {
         charWidth -= 1;
      }
      // 1 less space in front of letters with cutoff
      if ("xs-".includes(nextchar)
         && charInSet(char, ["gap"])
         && !"|".includes(char)) {
         charWidth -= 1;
      }
   } else if (font === "fontb") {
      // 1 less space after letters with cutoff
      if ("cleft-".includes(char)
         && charInSet(nextchar, ["gap"])
         && !"|".includes(nextchar)) {
         charWidth -= 1;
      }
      // 1 less space in front of letters with cutoff
      if ("jt-".includes(nextchar)
         && charInSet(char, ["gap"])
         && !"|".includes(char)) {
         charWidth -= 1;
      }
   }

   let spacingResult = 0;
   if (isLastLetter === false) {
      // overlap after letter, overwrites default variable spacing
      // only happens if it connects into next letter
      let spaceAfter = 0;
      let afterConnect = false;
      let minSpaceAfter;
      if (font === "fonta") {
         switch (char) {
            case "s":
               if (!mode.altS) {
                  if (!charInSet(nextchar, ["gap", "ul"])) {
                     spaceAfter = -weight;
                     afterConnect = true;
                  } else {
                     minSpaceAfter = 0;
                  }
               }
               break;
            case "k":
            case "z":
               if (!charInSet(nextchar, ["gap", "dl"])) {
                  afterConnect = true;
               } else {
                  minSpaceAfter = 0;
               }
               break;
            case "x":
               if (!(charInSet(nextchar, ["gap", "dl"]) && charInSet(nextchar, ["gap", "ul"]))) {
                  afterConnect = true;
               } else {
                  minSpaceAfter = 0;
               }
               break;
            case "t":
            case "l":
               if (!charInSet(nextchar, ["gap", "dl"])) {
                  spaceAfter = -weight;
                  afterConnect = true;
               } else {
                  minSpaceAfter = 0;
               }
               break;
            case "f":
            case "c":
            case "r":
               if (!charInSet(nextchar, ["gap", "ul"])) {
                  spaceAfter = -weight;
                  afterConnect = true;
               } else {
                  minSpaceAfter = 0;
               }
               break;
            case ".":
            case ",":
            case "!":
            case "?":
               if (!charInSet(nextchar, ["gap"])) {
                  minSpaceAfter = 1;
               }
         }
      } else if (font === "fontb") {
         switch (char) {
            case "t":
               minSpaceAfter = 0;
               break;
            case "c":
               if (!charInSet(nextchar, ["gap", "ul"])) {
                  spaceAfter = -weight;
                  afterConnect = true;
               } else {
                  minSpaceAfter = 0;
               }
               break;
            case "l":
               if (!charInSet(nextchar, ["gap", "dl"])) {
                  spaceAfter = -weight;
                  afterConnect = true;
               } else {
                  minSpaceAfter = 0;
               }
               break;
            case "e":
            case "f":
               minSpaceAfter = 1;
               break;
            case ".":
            case ",":
            case "!":
            case "?":
               if (!charInSet(nextchar, ["gap"])) {
                  minSpaceAfter = 1;
               }
         }
      } else if (font === "fontc" && !mode.noLigatures) {
         switch (char) {
            case "f":
            case "r":
               if (!charInSet(nextchar, ["gap"])) {
                  spaceAfter = -weight;
                  afterConnect = true;
               }
               break;
         }
      }

      // depending on the next letter, adjust the spacing
      // only if the current letter doesn't already overlap with it
      let spaceBefore = 0;
      let beforeConnect = false;
      let minSpaceBefore;
      if (afterConnect === false) {
         if (font === "fonta") {
            switch (nextchar) {
               case "s":
                  if (!mode.altS) {
                     if (!charInSet(char, ["gap", "dr"])) {
                        spaceBefore = -weight;
                        beforeConnect = true;
                     } else {
                        if ("e".includes(char)) {
                           beforeConnect = true;
                           spaceBefore = optionalGap;
                        } else {
                           minSpaceBefore = optionalGap;
                        }
                     }
                  } else {
                     //alt s
                     if (!charInSet(char, ["gap"])) {
                        spaceBefore = -weight;
                        beforeConnect = true;
                     }
                  }
                  break;
               case "x":
                  if (!(charInSet(char, ["gap", "ur"]) && charInSet(char, ["gap", "dr"]))) {
                     spaceBefore = -weight;
                     beforeConnect = true;
                  } else {
                     if ("e".includes(char)) {
                        beforeConnect = true;
                     } else {
                        minSpaceBefore = 1;
                     }
                  }
                  break;
               case "z":
               case "j":
                  if (!(charInSet(char, ["gap"]))) {
                     spaceBefore = -weight;
                     beforeConnect = true;
                  }
                  break;
               case ",":
               case ".":
               case "!":
               case "?":
                  minSpaceBefore = 1;
                  break;
            }
         } else if (font === "fontb") {
            switch (nextchar) {
               case "j":
                  if (charInSet(char, ["dr"])) {
                     spaceBefore = 1;
                     beforeConnect = true;
                  }
                  minSpaceBefore = 1;
                  break;
               case "t":
                  minSpaceBefore = 1;
                  break;
               case ",":
               case ".":
               case "!":
               case "?":
                  minSpaceBefore = 1;
                  break;
            }
         }
      }

      //extra special combinations
      if (font === "fonta") {
         if ("ktlcrfsxz".includes(char) && nextchar === "s") {
            spaceBefore = -inner - weight - finalValues.stretchX;
            beforeConnect = true;
         }
         else if ("ktlcrfsx".includes(char) && nextchar === "x") {
            spaceBefore = -inner - weight - finalValues.stretchX;
            beforeConnect = true;
         }
         else if ("ktlcrfsxz".includes(char) && nextchar === "j") {
            spaceBefore = -inner - weight - finalValues.stretchX;
            beforeConnect = true;
         }
         else if ("sr".includes(char) && nextchar === "z") {
            spaceBefore = -inner - weight - finalValues.stretchX;
            beforeConnect = true;
         }
         else if ("ltkcfx".includes(char) && nextchar === "z") {
            //spaceBefore = -inner-weight+outer/2//-waveValue(outer, 0, 1)//-weight-2//-finalValues.stretchX
            spaceBefore = weight - outer / 2 - finalValues.stretchX / 2;
            beforeConnect = true;
            //-i-w+(o/2) //-o+i+2w
            //w-0.5o
         }
         else if ("z".includes(char) && nextchar === "z") {
            spaceBefore = -2 - finalValues.stretchX;
            beforeConnect = true;
         }
         else if ("z".includes(char) && nextchar === "x") {
            spaceBefore = weight - outer / 2 - finalValues.stretchX / 2;
            beforeConnect = true;
         }
      } else if (font === "fontb") {
         if ("lct".includes(char) && "tj".includes(nextchar)) {
            spaceBefore = -outer + weight * 2 + 1 - finalValues.stretchX;
            beforeConnect = true;
         }
         if ("ef".includes(char) && "tj".includes(nextchar)) {
            spaceBefore = -outer + weight * 2 + 2 - finalValues.stretchX;
            beforeConnect = true;
         }
      }

      // remove overlap spacing if next to space
      if (charInSet(nextchar, ["gap"])) {
         spaceBefore = 0;
         beforeConnect = false;
      }
      if (charInSet(char, ["gap"])) {
         spaceAfter = 0;
         afterConnect = false;
      }

      // if there is no special overlaps, use the global spacing
      if (afterConnect === false && beforeConnect === false) {
         //regular spacing, if above minspacing
         if (minSpaceAfter !== undefined || minSpaceBefore !== undefined) {
            if (minSpaceBefore !== undefined) {
               spacingResult = charWidth + max(spacing, minSpaceBefore);
            } else {
               spacingResult = charWidth + max(spacing - 1, minSpaceAfter);
            }
         } else if (!"-_ ‸".includes(char) && !"-_ ‸".includes(nextchar)) {
            spacingResult = charWidth + spacing;
         } else if ("‸".includes(nextchar)) {
            // other punctuation?
            spacingResult = charWidth + 1;
         } else {
            // other punctuation?
            spacingResult = charWidth;
         }
      } else {
         spacingResult = charWidth + spaceAfter + spaceBefore;
      }
   } else {
      // last letter
      spacingResult = charWidth;
   }

   // stretchWidth
   let stretchWidth = 0;
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
            stretchWidth = (finalValues.stretchX + finalValues.spreadX);
      }
   } else if (font === "fontb") {
      switch (char) {
         case "m":
         case "w":
         case "t":
            stretchWidth = (finalValues.stretchX + finalValues.spreadX) * 2;
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
            stretchWidth = (finalValues.stretchX + finalValues.spreadX) * 2;
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

   return spacingResult + stretchWidth;
}
