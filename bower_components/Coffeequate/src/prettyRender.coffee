# This file defines a new tree structure for printing out Coffeequate
# expression nodes.
#
# This is motivated by a desire to keep the representation logic separate from
# the display logic. For example, we want x*y**-1 to be represented as the
# string "x/y" and as the LaTeX "\frac{x}{y}". Notice the logic that puts the
# y on the bottom of the fraction. We don't want to have to write that in both
# the toLaTeX and toString method. So we write a toDrawingNode method for all
# of the expression nodes. In this case, the result of toDrawingNode would be:
#
# new Fraction(new Variable("x"), new Variable("y"))
#
# Then we implement a toLaTeX and toString method for all of the DrawingNodes.
#
# This means that supporting a new output format for pretty printing is easy:
# we just need to implement the toWhatever method on the DrawingNode
# subclasses.


# A dictionary of Greek Characters to escape when printing to LaTeX
greekLatexDictionary =
  "α": "\\alpha "
  "A": "A"
  "β": "\\beta "
  "B": "B"
  "χ": "\\chi "
  "Δ": "\\Delta "
  "δ": "\\delta "
  "ε": "\\varepsilon "
  "ϵ": "\\epsilon "
  "E": "E"
  "Η": "\\Eta "
  "γ": "\\gamma "
  "Γ": "\\Gamma "
  "ι": "\\iota "
  "Ι": "I"
  "κ": "\\kappa "
  "ϰ": "\\varkappa "
  "Κ": "K"
  "λ": "\\lambda "
  "Λ": "\\Lambda "
  "μ": "\\mu "
  "Μ": "M"
  "ν": "\\nu "
  "Ν": "N"
  "ω": "\\omega "
  "Ω": "\\Omega "
  "ℴ": "o"
  "O": "O"
  "ϕ": "\\phi "
  "φ": "\\varphi "
  "Φ": "\\Phi "
  "π": "\\pi "
  "Π": "\\Pi "
  "ψ": "\\psi "
  "Ψ": "\\Psi "
  "ρ": "\\rho "
  "Ρ": "P"
  "σ": "\\sigma "
  "ς": "\\varsigma "
  "Σ": "\\Sigma "
  "τ": "\\tau "
  "Τ": "T"
  "θ": "\\theta "
  "Θ": "\\Theta "
  "υ": "\\upsilon "
  "ξ": "\\xi "
  "Ξ": "\\Xi "
  "ζ": "\\zeta "
  "Ζ": "Z"
  "ϖ": "\\varpi "
  "ϱ": "\\varrho "
  "ϑ": "\\vartheta "

define ->

  prettyRender = {}

  # Generic drawing node, parent of all other drawing nodes.
  class prettyRender.DrawingNode

    # Draw the node as a string.
    #
    # @throw [Error] Not implemented.
    toString: ->
      throw new Error("not implemented")

    # Draw the node as a LaTeX string.
    #
    # @throw [Error] Not implemented.
    renderLaTeX: ->
      throw new Error("not implemented")

    # This tells us how strongly bound together the node is.
    # As in, because `x+y*z` is parsed as `x+(y*z)`, `*` binds more closely than `+` does.
    # When we want to express `(x+y)*z`, we put the `x+y` prettyRender.Add node inside a Bracket
    # node, which binds very tightly.
    #
    # @return [Number] Binding strength.
    bindingStrength: ->
      8

    # Wraps the node in brackets if a node has lower precedence than this node.
    #
    # @param child [prettyRender.DrawingNode] The node to (potentially) bracket.
    # @return [prettyRender.DrawingNode] The bracketed child, or the original child.
    bracketIfNeeded: (child) ->
      if child.bindingStrength() <= @bindingStrength()
        return new prettyRender.Bracket(child)
      return child

  # Make a new drawing node from terms.
  #
  # @param terms... [Array<prettyRender.DrawingNode>] An array of terms to make into a drawing node.
  # @return [prettyRender.DrawingNode] A new drawing node from the terms provided.
  prettyRender.DrawingNode.makeWithBrackets = (terms...) ->
    node = new this()
    terms = terms.map((x) ->
        if x.bindingStrength() <= node.bindingStrength()
          return new prettyRender.Bracket(x)
        else
          return x)
    node.terms = terms
    return node

  # Drawing node representing addition.
  class prettyRender.Add extends prettyRender.DrawingNode

    # Make a new prettyRender.Add drawing node.
    #
    # @param terms... [Array<prettyRender.DrawingNode>] Drawing nodes to add together.
    # @return [prettyRender.Add] A new addition drawing node.
    constructor: (@terms...) ->

    # How strongly bound the node is.
    #
    # @return [Number] Binding strength.
    bindingStrength: ->
      4

    # Pretty-print subtraction.
    #
    # @param renderFunction [String] What function to render with.
    # @param plus [String] What plus looks like.
    # @param minus [String] What minus looks like.
    # @return [String] Pretty-printed add node.
    drawPretty: (renderFunction, plus, minus) ->
      out = ""

      if @terms[0] instanceof prettyRender.Negate
        out += minus
        out += @terms[0].contents[renderFunction]()
      else
        out += @terms[0][renderFunction]()

      for term in @terms.slice(1)
        if term instanceof prettyRender.Negate
          out += minus
          out += term.contents[renderFunction]()
        else
          out += plus
          out += term[renderFunction]()

      out

    # Draw the node as a LaTeX string.
    #
    # @return [String] This node drawn as LaTeX.
    renderLaTeX: ->
      return @drawPretty("renderLaTeX", "+", "-")

    # Draw the node as a string.
    #
    # @return [String] This node drawn as a string.
    renderString: ->
      return @drawPretty("renderString", " + ", " - ")

    # Draw the node as a MathML string.
    #
    # @return [String] This node drawn as MathML.
    renderMathML: ->
      return @drawPretty("renderMathML", "<mo>+</mo>", "<mo>-</mo>")

  # Drawing node representing multiplication.
  class prettyRender.Mul extends prettyRender.DrawingNode
    # Make a new multiplication drawing node.
    #
    # @param terms... [Array<prettyRender.DrawingNode>] Drawing nodes to multiply together.
    # @return [prettyRender.Mul] A new multiplication drawing mode.
    constructor: (@terms...) ->

    # How strongly this node is bound.
    #
    # @return [Number] Binding strength.
    bindingStrength: ->
      6

    # Draw the node as a LaTeX string.
    #
    # @return [String] This node drawn as LaTeX.
    renderLaTeX: ->
      return @terms.map((x) -> x.renderLaTeX()).join(" \\cdot ")

    # Draw the node as a string.
    #
    # @return [String] This node drawn as a string.
    renderString: ->
      return @terms.map((x) -> x.renderString()).join("*")

    # Draw this node as a MathML string.
    renderMathML: ->
      return @terms.map((x) -> x.renderMathML()).join("<mo>&middot;</mo>")

  # Drawing node representing exponentiation.
  class prettyRender.Pow extends prettyRender.DrawingNode

    # Make a new exponentiation drawing node.
    #
    # @param left [prettyRender.DrawingNode] The base of the power node.
    # @param right [prettyRender.DrawingNode] The exponent of the power node.
    # @return [prettyRender.Pow] A new exponentiation drawing node.
    constructor: (@left, @right) ->

    # Draw the node as a LaTeX string.
    #
    # @return [String] This node drawn as LaTeX.
    renderLaTeX: ->
      "#{@left.renderLaTeX()}^{#{@right.renderLaTeX()}}"

    # Draw the node as a string.
    #
    # @return [String] This node drawn as a string.
    renderString: ->
      "#{@left.renderString()}**#{@bracketIfNeeded(@right).renderString()}"

    # Draw the node as a MathML string.
    #
    # @return [String] This node drawn as MathML.
    renderMathML: ->
      "<msup>#{@left.renderMathML()}#{@right.renderMathML()}</msup>"

  # Drawing node representing bracketing.
  class prettyRender.Bracket extends prettyRender.DrawingNode

    # Make a new bracket drawing node.
    #
    # @param contents [Array<prettyRender.DrawingNode>] Drawing nodes inside the brackets.
    # @return [prettyRender.Bracket] A new bracket node.
    constructor: (@contents) ->

    # How strongly bound this node is.
    #
    # @return [Number] Binding strength.
    bindingStrength: ->
      9

    # Draw the node as a LaTeX string.
    #
    # @return [String] This node drawn as LaTeX.
    renderLaTeX: ->
      return "\\left(#{@contents.renderLaTeX()}\\right)"

    # Draw the node as a string.
    #
    # @return [String] This node drawn as a string.
    renderString: ->
      return "(#{@contents.renderString()})"

    # Draw the node as a MathML string.
    #
    # @return [String] This node drawn as MathML.
    renderMathML: ->
      return "<mfenced><mrow>#{@contents.renderMathML()}</mrow></mfenced>"

  # Drawing node representing a number.
  class prettyRender.Number extends prettyRender.DrawingNode

    # Make a new number drawing node.
    #
    # @param value [Number] The value of the number.
    # @param classname [String] Optional. The name that should be set as the class for this node if drawn as MathML or similar.
    # @return [prettyRender.Number] A new drawing node representing this number.
    constructor: (@value, @classname="constant") ->

    # How strongly this node is bound.
    #
    # @return [Number] Binding strength.
    bindingStrength: ->
      10

    # Draw the node as a LaTeX string.
    #
    # @return [String] This node drawn as LaTeX.
    renderLaTeX: ->
      return @value+""

    # Draw the node as a string.
    #
    # @return [String] This node drawn as a string.
    renderString: ->
      return @value+""

    # Draw the node as MathML.
    #
    # @return [String] This node drawn as MathML.
    renderMathML: ->
      return "<mn class=\"#{@classname}\">#{@value}</mn>"

  # Drawing node representing a variable.
  class prettyRender.Variable extends prettyRender.DrawingNode

    # Make a new variable drawing node.
    #
    # @param label [String] The label of this variable.
    # @param classname [String] Optional. The name that should be set as the class for this node if drawn as MathML or similar.
    # @return [prettyRender.Variable] A new variable drawing node.
    constructor: (@label, @classname="variable") ->

    # How strongly this node is bound.
    #
    # @return [Number] Binding strength.
    bindingStrength: ->
      10

    # Draw the node as a LaTeX string.
    #
    # @return [String] This node drawn as LaTeX.
    renderLaTeX: ->
      # Check for Greek characters.
      mlabel = ""
      for char in @label
        if char of greekLatexDictionary
          mlabel += greekLatexDictionary[char]
        else
          mlabel += char
      return mlabel

    # Draw the node as a string.
    #
    # @return [String] This node drawn as a string.
    renderString: ->
      return @label

    # Draw the node as MathML.
    #
    # @return [String] This node drawn as MathML.
    renderMathML: ->
      labelArray = @label.split("-")
      label = labelArray[0]

      atCount = 0
      while label[0] == "@"
        atCount += 1
        label = label[1..]

      atStart = "<mover accent=\"true\">"
      atEnd = "<mrow><mo>" + ("." for i in [0...atCount]).join("") + "</mo></mrow></mover>"

      if label.length > 1
        return atStart + '<msub class="' + @classname + '"><mi>' + label[0] + '</mi><mi>' + label[1..] + "</mi></msub>" + atEnd
      else
        return '<mi class="' + @classname + '">' + label + '</mi>'

  # Drawing node representing a fraction.
  class prettyRender.Fraction extends prettyRender.DrawingNode

    # Make a new fraction drawing node.
    #
    # @param top [prettyRender.DrawingNode] The node to be drawn on top of the fraction.
    # @param bottom [prettyRender.DrawingNode] The node to be drawn on the bottom of the fraction.
    # @return [prettyRender.Fraction] A new fraction drawing node.
    constructor: (@top, @bottom) ->

    # How strongly this node is bound.
    #
    # @return [Number] Binding strength.
    bindingStrength: ->
      8

    # Draw the node as a LaTeX string.
    #
    # @return [String] This node drawn as LaTeX.
    renderLaTeX: ->
      return "\\frac{#{@top.renderLaTeX()}}{#{@bottom.renderLaTeX()}}"

    # Draw the node as a string.
    #
    # @return [String] This node drawn as a string.
    renderString: ->
      return "#{@bracketIfNeeded(@top).renderString()}/#{@bracketIfNeeded(@bottom).renderString()}"

    # Draw the node as MathML.
    #
    # @return [String] This node drawn as MathML.
    renderMathML: (x,y) ->
      "<mfrac>
      <mrow>#{@top.renderMathML(x,y)}</mrow>
      <mrow>#{@bottom.renderMathML(x,y)}</mrow>
      </mfrac>"


  # Drawing node representing a surd/root.
  class prettyRender.Surd extends prettyRender.DrawingNode

    # Make a new surd drawing node.
    #
    # @param contents [prettyRender.DrawingNode] The node to draw inside the root.
    # @param power [Number] Optional. The number of this root. For example, 2 for a sqrt and 3 for a cbrt.
    # @return [prettyRender.Surd] The drawing node representing this surd.
    constructor: (@contents, @power = null) ->

    # Draw the node as a LaTeX string.
    #
    # @return [String] This node drawn as LaTeX.
    renderLaTeX: ->
      if @power and @power != 2
        return "\\sqrt[#{@power}]{#{@contents.renderLaTeX()}}"
      else
        return "\\sqrt{#{@contents.renderLaTeX()}}"

    # Draw the node as a string.
    #
    # @return [String] This node drawn as a string.
    renderString: ->
      if @power and @power != 2
        return "#{@bracketIfNeeded(@contents).renderString()} ** (1/#{@power})"
      else
        return "sqrt(#{@contents.renderString()})"

    # Draw the node as MathML.
    #
    # @return [String] This node drawn as MathML.
    renderMathML: (x...) ->
      if @power and @power != 2
        return "<mroot>
                  <mrow>
                    #{@power.renderMathML(x...)}
                  </mrow>
                  <mrow>
                    #{@contents.renderMathML(x...)}
                  </mrow>
                </mroot>"
      else
        return "<msqrt>
                  #{@contents.renderMathML(x...)}
                </msqrt>"

  # Drawing node representing the negation of something.
  class prettyRender.Negate extends prettyRender.DrawingNode

    # Make a new negation drawing node.
    #
    # @param contents [prettyRender.DrawingNode] The node to draw inside the root.
    # @param power [Number] Optional. The number of this root. For example, 2 for a sqrt and 3 for a cbrt.
    # @return [prettyRender.Negate] A negation drawing node.
    constructor: (@contents) ->

    # Draw the node as a LaTeX string.
    #
    # @return [String] This node drawn as LaTeX.
    renderLaTeX: ->
      "-\\left(#{@contents}\\right)"

    # Draw the node as a string.
    #
    # @return [String] This node drawn as a string.
    renderString: ->
      "-(#{@contents.renderString()})"

    # Draw the node as MathML.
    #
    # @return [String] This node drawn as MathML.
    renderMathML: (x...) ->
      "<mrow><mo>-</mo>#{@contents.renderMathML()}</mrow>"


  # Drawing node representing an uncertainty.
  class prettyRender.Uncertainty extends prettyRender.DrawingNode

    # Make a new uncertainty drawing node.
    #
    # @param label [String] The label of the variable this uncertainty represents.
    # @param class [String] Optional. The name that should be set as the class for this node if drawn as MathML or similar.
    # @return [prettyRender.Uncertainty] An uncertainty drawing node.
    constructor: (@label, @class="default") ->

    # How strongly this node is bound.
    #
    # @return [Number] Binding strength.
    bindingStrength: ->
      9

    # Draw the node as a LaTeX string.
    #
    # @return [String] This node drawn as LaTeX.
    renderLaTeX: ->
      return "\\sigma_{#{@label}}"

    # Draw the node as a string.
    #
    # @return [String] This node drawn as a string.
    renderString: ->
      return "σ(#{@label})"

    # Draw the node as MathML.
    #
    # @return [String] This node drawn as MathML.
    renderMathML: (x...)->
      dummy = new Variable(@label)
      return "<msub><mo>&sigma;</mo>#{dummy.renderMathML(x...)}</msub>"


  return prettyRender
