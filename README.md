---
permalink: /index.md
---
# QuantizeThemAll
QTA - A free-to-use offline web-based wanna-be function quantizer for procedural generation artist.

*This application was produced while passing subject [Computer art@FIT VUT](https://www.fit.vut.cz/study/course/VIN/.en) and certain elements of application were
designed by the authors of previous implementations of similar tools.*

**Online demo:** https://romop5.github.io/QuantitizeThemAll/index.html

## About
This is a simple playground tool to help artist with findind interesting *composite functions*, that
produce interesting output pictures. Tool provides simple *L-system grammar* for randomly generating function expressions.
In addition, each expression can be *mutated* to produce a variation of currently previewed image.
Many image patterns and variations are already available using *presets*.

*Function quantitization* is a technique in which output color of each pixel is determined by
evaluating given function and taking the pixel's position in UV coordinates as input to such
function. 

In such case, the screen's center has *UV coordinates* (0,0), top-left corner has (-1,1),
top-right (1,1), bottom-right (1,-1), a bottom-left (-1,-1). The output pixel of center of screen
will thus depends on function value at (0,0).

Moreover, after evaluating the function value, a certain mapping has to be applied to convert in
theory whole range of real values, produced by function, to a color.

A common approach is to expect *normalized output of the function* between 0 and 1 and then simply
*linearly interpolate* between two colours.


## Usage

The application is split into two main parts - preview (left) and parameters (right).
The preview image shows an evaluation of the currently written function. 

Parameters consist of function expression, parameters for generating a new function, and pre-made
presets.

### Evaluating a function

## Technical notes
The application is based on **Three.js** (rendering) and **mini.css** (UI).
