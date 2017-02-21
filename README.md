#AugMath

[![Join the chat at https://gitter.im/guillefix/augmath](https://badges.gitter.im/guillefix/augmath.svg)](https://gitter.im/guillefix/augmath?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Try it live [here](http://augmath.net)

##Vision

See [here](http://guillefix.me/augmath.html). A recent demo can be seen [here](https://www.youtube.com/watch?v=9fwOiLsuXSI&feature=youtu.be)

##Usage
Here's a quick demo of most of the current manipulations:
</br>
<img src="quadratic.gif" width="700" alt="Proof of Quadratic Formula">
</br>(Created using [ScreenToGif](https://screentogif.codeplex.com/))

## Development

MeteorJS is required for development. You can download it [here](https://www.meteor.com/).

Dependencies are included locally :P

<!-- Install bower, the frontend dependency manager, globally with the following command

```bash
npm install -g bower
```

From the project root, use bower to install the front end dependencies

```bash
bower install
``` -->

###File structure

JS scripts and CSS files are found in the `public` folder. The main script is called `augmath.js`, and is found in `public/next/final`. This nested structure is just to control the order in which Meteor loads the files..

The html, and more CSS, is found on the `client` folder.

##TODOs
Here are some things that one can work on:

* Improve algebra manipulations:

 * Refactor split/merge manipulations into split/merge and split all/merge all...
 * Add "cancel" feature
 * Improve "change side" for powers.

* Extend math support:
 * Add logarithms
 * Add trigonometry
 * Add calculus
 * Add vector and matrices

* Backend:
 * Save maths
 * User login
 * share and search maths

* Improve GUI design

* Improve the animations of some manipulations (with jQuery animations, or otherwise), like the fraction splitting or the factor factoring or ditribution.

<!-- * Add validations to manipulations. Many manipulations can break the math if the user hasn't selected the right stuff. Change code so that nothing happens if right stuff isn't selected. -->

<!-- ###More (possibly) challenging stuff: -->

<!-- * Refactor the tree-building function to use the semantic MathML KaTeX uses to build the tree. Probably requires knowing how KaTeX works quite well, as well as knoweledge of MathML. -->

<!-- * Add drag and drop capabilities, so that moving-based manipulations can be done that way. While you are dragging, visual feedback should be offered of the places you can drop it. -->

<!-- * Allow to make selections with keyboard arrow keys (up and down for changing depth) to traverse the tree. -->

##Acknowledgements

AugMath uses [KaTeX](https://khan.github.io/KaTeX/) for math rendering, [Algebrite](http://algebrite.org/), for some algebraic operations and [Math.js](http://mathjs.org/) for some math operations, [MathQuill](http://mathquill.com/) for input, and [KaTeX](https://khan.github.io/KaTeX/) for rendering, and jQuery for animations and stuff.

Here is a [Worflowy list](https://workflowy.com/s/BlNaX36nRR) I made to organize the stuff that goes into AugMath.

<!-- Here is a [Codepen](http://codepen.io/guillefix/full/xGWQPJ/) to test it live. -->

<!-- Some discussion in this [Forum](http://forum.fractalfuture.net/t/augmented-math-and-education/265) -->

##Math Tree
The main object in AugMath is a tree created with [TreeModel](http://jnuno.com/tree-model-js/), which contains all the manipulatives in the equation or expression. This is done through the function parse_poly. This creates a tree by going through the terms in an expression, and going through its factors. Factors that can contain whole expressions within them are then recursively analyzed in the same way. This is accessed through the math_root object.
