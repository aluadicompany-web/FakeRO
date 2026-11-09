# Continuous motion sources

The 48 original painted strips cover six outfits, two genders, and four motion families. Rows are E, SE, S, SW, W, NW, N, NE; columns are eight consecutive phases. The four `*-guide.png/json` files describe the shared authored anatomy and projected hand/shaft trajectory used to produce the strips.

Magenta identifies the temporary head/neck, red the anatomical right glove, blue the anatomical left glove, cyan the hilt, and green the weapon guide. These technical colors are removed before shipping. Actual isolated glove pixels are recolored to leather and packed separately so fingers occlude the hilt. Source omissions are recorded explicitly as hidden hands; no legacy-pose or nearest-coat registration is used.

The packer splits uneven transparent gutters, uses one normalization scale per strip, measures surviving collar pixels after color removal, and pivots the modular HD head at the nape. Attack phase 7 shares phase 0's guard. The runtime uses forward and reverse traversal of the same hand/arm sequence and reaches phase 4 at the server hit time. Walking uses the stable authored carry axis to prevent guide fragments from making the blade flip.

Reproduce with `npm run art:final-animation`. Requires Pillow, NumPy and SciPy. The old pose atlas packer is retained only as `art:final-animation:legacy`; running it alone replaces the current runtime atlas and requires repacking the continuous clips afterward.

Inspect the actual renderer with `npm run test:final-animation`, then export slow loops/contact sheets with `npm run art:final-previews`. Contact equality is only a registration check: also inspect hands, collar, body proportions and pose order visually.
