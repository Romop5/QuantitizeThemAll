<div align="center">
    <a href="https://romop5.github.io/QuantitizeThemAll/index.html"><img src="https://raw.githubusercontent.com/Romop5/QuantitizeThemAll/main/docs/logo.png" alt="app overview" height="100px"/></a>
</div

# QuantitizeThemAll

QTA - A free-to-use offline web-based wanna-be function quantitizer for procedural generation artist.

*This application was produced while passing subject [Computer art@FIT VUT](https://www.fit.vut.cz/study/course/VIN/.en) and certain elements of application were
designed by the authors of previous implementations of similar tools.*

**Online demo:** https://romop5.github.io/QuantitizeThemAll/index.html
<div align="center">
    <a href="https://romop5.github.io/QuantitizeThemAll/index.html"><img src="https://raw.githubusercontent.com/Romop5/QuantitizeThemAll/main/docs/app.png?token=AAZFMBIQJFMCQBRFGFJ67C277GPDQ" alt="app overview" /></a>
</div>

## Features
- multiple presets to demonstrate interesting functions and parameters
- easy-to-use function generator with built-in mutator
- offline, GPU-based computation (thanks to Three.js & WebGL)
- intersession preset storage & exporting

## About
This is a simple playground tool to help artist with findind interesting **composite functions**, that
produce interesting output pictures. Tool provides simple **L-system grammar** for randomly generating function expressions.
In addition, each expression can be **mutated** to produce a variation of currently previewed image.
Many image patterns and variations are already available using **presets**.

**Function quantitization** is a technique in which output color of each pixel is determined by
evaluating given function and taking the pixel's position in UV coordinates as input to such
function. 

In such case, the screen's center has **UV coordinates** (0,0), top-left corner has (-1,1),
top-right (1,1), bottom-right (1,-1), a bottom-left (-1,-1). The output pixel of center of screen
will thus depends on function value at (0,0).

<div align="center">
    <a href="https://romop5.github.io/QuantitizeThemAll/index.html"><img src="https://raw.githubusercontent.com/Romop5/QuantitizeThemAll/6dfdaf947239fc2e3e68b66bbae813c27df54deb/docs/screen.svg?token=AAZFMBIFJ7OCWQQYM3657TC76BR7K" alt="screen description" /></a>
</div>

Moreover, after evaluating the function value, a certain mapping has to be applied to convert in
theory whole range of real values, produced by function, to a color.

A common approach is to expect **normalized output of the function** between 0 and 1 and then simply
**linearly interpolate** between two colours.


## Usage
The application is split into two main parts - **preview** (left) and **input parameters** (right).
The preview image shows an evaluation of the currently written function within context of parameters. 

Parameters consist of function expression, parameters for generating a new function, and pre-made
presets.

### Evaluating a function
The function is evaluated whenever the function definition (e.g. sin(x)) is changed in form, or if
coloring or trasformation parameters change.

#### Function definition
The program provides you with **x** and **y** inputs, which serve as normalized UV coordinates (see
image above).

Any valid GLSL built-in function can be used such as **sin, cos, tan, atan, pow, exp, sqrt** and
more - see [GLSL Functions](https://www.shaderific.com/glsl-functions).

#### Choice of transformation
Transformations transforms input UV coordinates. By default, **identity** transformation pass (x,y)
as it is.
**Polar transformation** computes *angle-distance* representation of complex number, specified by
(x,y).
**Circle inversion** transforms each coordinate by inverting it (e.g. newX = 1.0/x). Such
transformation keeps points at unit circle at their original place (identity) and turns lines into
circles.
**Spherical transformation** use exponential function to reparametrize planar UV coordinates.
**Fish eye transformation** use spherical mapping.

While using any of transformations above, **zoom** can be manipulated, which basically multiplies
input UV before transforming them. 

In addition, several of transformations support chaning **focal length**.

### Generating functions
This application provides a simple generator of function expressions. 
**An expression is made either from binary or unary expressions** such as A\*B or A+B etc.
Unary expressions are either unary functions (such as sin(expr) or cos(expr)), input parameters (x
or y), or a random constant.

The generator thus starts with initial expression E, which is **sucessively and parallely expanded**
into expression tree. The number of levels of these expansions is controlled by mininal and maximal
amount of expansions.

The generator allows to parametrize allowed expression functions using check boxes.
In addition, the support of random constants can be changed by **lowering or increasing oscillation
range**.
### Mutating functions
By clicking on mutate button, **all constants in function expression are randomly changed**, leading to
a variation of already shown image.

This allows user to quickly iterate through various variations of parameters without changing the
structure of expression.

## Technical notes
The application written in *Javascript*, based on **Three.js** (rendering) and **mini.css** (UI).
No cookies are used. Presets are stored using [Web storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API).
