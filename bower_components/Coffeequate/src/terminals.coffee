define ["parse", "nodes", "prettyRender", "constants"], (parse, nodes, prettyRender, constants) ->

	# Terminals for the equation tree.

	# Base class for terminals.
	class Terminal extends nodes.BasicNode

		# Deep-copy this node.
		#
		# @throw [Error] Not implemented.
		copy: ->
			throw new Error("Not implemented.")

		# Check if this node contains a given variable.
		#
		# @param variable [String] The label of the variable to differentiate with respect to.
		# @param equivalencies [Object] Optional. A map of variable labels to a list of equivalent variable labels.
		# @return [Boolean] Whether or not this node contains the given variable.
		containsVariable: (variable, equivalencies={}) ->
			false # We will override this only for variable nodes.
		
		approx: -> @evaluate()

	# A constant in the equation tree, e.g. 0.5 or 1/2.
	# Can be represented as a rational (1/2) or a float (0.5).
	# If a constant is produced by negative exponentiation
	# it becomes a rational; if it is entered as an integer then it
	# is a rational; if it is entered as a float, then it remains
	# a float.
	# Rational `*` Rational -> Rational
	# Rational `*` Float -> Float
	# Float `*` Float -> Float
	class Constant extends Terminal

		# Make a new constant.
		#
		# @param numerator [String, Number] The numerator of the rational. If the number is a float, this is just the whole value.
		# @param denominator [String, Number] The denominator of the rational.
		# @param mode [String] Optional. Can be "rational" or "float" (default "rational").
		constructor: (@numerator, @denominator=1, @mode="rational") ->
			@cmp = -6

			if (typeof @numerator == "number" or @numerator instanceof Number) and @numerator % 1 != 0
				@mode = "float"

			switch @mode
				when "rational"
					@numerator = parseInt(@numerator)
					@denominator = parseInt(@denominator)
					@simplifyInPlace()
				when "float"
					@numerator = parseFloat(@numerator)
					@denominator = parseFloat(@denominator)
					@numerator /= @denominator
					@denominator = 1
				else
					throw new Error("Unknown constant mode: #{@mode}.")

		# Evaluate the constant.
		#
		# @return [Number] A float representation of this constant.
		evaluate: ->
			@numerator/@denominator

		# Deep-copy this constant.
		#
		# @return [Constant] A copy of this Constant
		copy: ->
			return new Constant(@numerator, @denominator, @mode)

		# Compare this constant with another constant.
		#
		# @param b [Constant] The constant to compare with.
		# @return [Number] An integer based on the comparison result. 1 if this is greater, -1 if vice versa, and 0 if equal.
		compareSameType: (b) ->
			if @evaluate() < b.evaluate()
				return -1
			else if @evaluate() == b.evaluate()
				return 0
			else
				return 1

		# Multiply by another constant.
		#
		# @param b [Constant] The constant to multiply by.
		# return [Constant] The multiple of the two constants.
		mul: (b) ->
			if @mode == b.mode
				newMode = @mode
			else
				newMode = "float"

			return new Constant(@numerator * b.numerator, @denominator * b.denominator, newMode)

		# Add another constant to this one.
		#
		# @param b [Constant] The constant to add.
		# @return [Constant] The sum of the two constants.
		add: (b) ->
			if @mode == b.mode
				newMode = @mode
			else
				newMode = "float"

			return new Constant(b.denominator * @numerator + @denominator * b.numerator, @denominator * b.denominator, newMode)

		# Raise this constant to the power of another.
		#
		# @param b [Constant] The exponent.
		# @return [Constant, Pow] A constant of this to the given exponent, or a power node if this is non-simplifiable.
		pow: (b) ->
			if @mode == "rational"
				if b.mode == "rational"
					flip = false # Whether to invert the fraction (for negative powers).
					# Sort out the power so there's no negative numbers in it.
					if b.numerator < 0 and b.denominator < 0
						b = new Constant(-b.numerator, -b.denominator)
					else if b.numerator > 0 and b.denominator < 0
						flip = true
						b = new Constant(b.numerator, -b.denominator)
					else if b.numerator < 0 and b.denominator > 0
						flip = true
						b = new Constant(-b.numerator, b.denominator)

					# No matter what, we're going to be raising everything to a power.
					num = Math.pow(@numerator, b.numerator)
					den = Math.pow(@denominator, b.numerator)

					if flip
						con = new Constant(den, num, "rational")
					else
						con = new Constant(num, den, "rational")

					# Depending on whether or not the exponent is an integer, we might also need to root this.
					if b.denominator == 1
						# Integer. Just put the numerator and denominator of this constant to this power.
						return con
					else
						# Fraction. Put everything to the power and then root the whole thing using another pow.
						# This is a bit weird if you think about it - the pow method is actually returning a Pow -
						# but you can think about this as an "irreducible" power.
						operators = require("operators")
						return new operators.Pow(con, new Constant(1, b.denominator, "rational"))

				else
					# We're returning a float here, so this is very easy!
					return new Constant(Math.pow(@evaluate(), b.evaluate()), 1, "float")
			else
				# Also returning a float.
				return new Constant(Math.pow(@evaluate(), b.evaluate()), 1, "float")

		# Test the equality between this constant and another object.
		# @param b [Object] The object to check.
		# @return [Boolean] Whether or not the two objects are equal.
		equals: (b) ->
			unless b instanceof Constant
				return false
			return @evaluate() == b.evaluate()

		# Alias of copy. Included for API parity.
		#
		# @return [Constant] A copy of this constant.
		replaceVariables: ->
			@copy() # Does nothing - this is a constant.

		# Get all variables in this terminal. Included for API parity.
		#
		# @return [Array<Object>] Returns `[]`.
		getAllVariables: ->
			[]

		# Alias of copy. Included for API parity.
		sub: ->
			@copy()

		# Simplify this fraction in-place using Euclid's method.
		simplifyInPlace: ->
			# Get the greatest common divisor.
			a = @numerator
			b = @denominator
			until b == 0
				[a, b] = [b, Math.round(a % b * 10) / 10] # Floating point errors.
			gcd = a

			# Divide out.
			@numerator /= gcd
			@numerator = Math.round(@numerator*10)/10 # Floating point errors.
			@denominator /= gcd
			@denominator = Math.round(@denominator*10)/10

		# Simplify this constant.
		#
		# @return [Constant] A simplified version of this constant.
		simplify: ->
			constant = @copy()
			if @mode == "rational"
				constant.simplifyInPlace()
			return constant

		# Expand this constant. Included for API parity.
		# @return [Constant] A copy of this constant.
		expand: ->
			@copy()

		# Expand and simplify. Included for API parity.
		# @return [Constant] Simplified constant.
		expandAndSimplify: ->
			@simplify()

		# Get uncertainty of this constant.
		#
		# @return [Constant] 0, as there is no uncertainty in a constant.
		getUncertainty: ->
			new Constant(0)

		# Map a function over all variables in this node. Does nothing, included for API parity.
		#
		# @param fun [Function] A function to map over variables.
		# @return [Constant] A copy of this node with the function mapped over all variables.
		mapOverVariables: (fun) ->
			return @copy()

		# Create a drawing node representing this constant
		#
		# @return [DrawingNode] A drawing node representing this constant.
		toDrawingNode: ->
			NumberNode = prettyRender.Number
			FractionNode = prettyRender.Fraction
			NegateNode = prettyRender.Negate

			if @numerator > 0
				if @denominator == 1
					return new NumberNode(@numerator)
				return new FractionNode(new NumberNode(@numerator), new NumberNode(@denominator))
			else
				if @denominator == 1
					return new NegateNode(new NumberNode(-@numerator))
				return new NegateNode(
										new FractionNode(
												new NumberNode(@numerator),
												new NumberNode(@denominator)))


		# Differentiate this constant.
		#
		# return [Constant] 0, because constants are constant.
		differentiate: (variable) ->
			return new Constant(0)


	# Represents symbolic constants in the equation tree, such as π.
	class SymbolicConstant extends Terminal

		# Make a new symbolic constant.
		#
		# @param label [String] The label of this constant (such as π).
		# @param value [Number] Optional. Value of the symbolic constant (default is null).
		# @param units [BasicNode, Terminal] Optional. Units of the constant (default is null).
		constructor: (@label, @value=null, @units=null) ->
			@cmp = -5

		# Deep-copy the symbolic constant.
		#
		# @return [SymbolicConstant] A new copy of the Symbolic Constant.
		copy: ->
			return new SymbolicConstant(@label, @value, @units)

		# Compare this symbolic constant with another symbolic constant.
		# Note that this compares labels, not values - this is a lexiographic sort.
		#
		# @param b [SymbolicConstant] The constant to compare with.
		# @return [Number] 1 if this constant is greater, -1 if vice-versa, and 0 if equal.
		compareSameType: (b) ->
			if @label < b.label
				return -1
			else if @label == b.label
				return 0
			else
				return 1

		# Evaluate the symbolic constant.
		#
		# @return [Number] The value of the symbolic constant, if it has one, or the value in the lookup table. Null otherwise.
		evaluate: ->
			if @value?
				return @value
			if @label of constants
				return constants[@label]
			return null

		# Check equality of this and another object.
		#
		# @param b [Object] The object to compare with.
		# @return [Boolean] Whether the objects are equal.
		equals: (b) ->
			unless b instanceof SymbolicConstant
				return false
			return @label == b.label and @value == b.value

		# Replace variables - does nothing. Included for API parity.
		#
		# @return [SymbolicConstant] A copy of this constant.
		replaceVariables: ->
			@copy() # Does nothing - this is a constant.

		# Get all variables in this node. Included for API parity.
		#
		# @return [Array<Object>] []
		getAllVariables: ->
			[]

		# Substitute values - side effect of evaluation if evaluateSymbolicConstants is true.
		#
		# @param substitutions [Object] Substitutions map. Irrelevant, included for API parity.
		# @param uncertaintySubstitutions [Object] Uncertainty substitutions map. Irrelevant.
		# @param equivalencies [Object] Optional. Equivalencies map. Irrelevant.
		# @param assumeZeroUncertainty [Boolean] Optional. Whether to assume unknown uncertainties are zero. Irrelevant.
		# @param evaluateSymbolicConstants [Boolean] Optional. Whether to evaluate this constant (default is false).
		# @return [SymbolicConstant, Constant] A copy of this constant if not evaluating symbolic constants, or an evaluated constant otherwise.
		sub: (substitutions, uncertaintySubstitutions, equivalencies=null, assumeZeroUncertainty=false, evaluateSymbolicConstants=false) ->
			unless evaluateSymbolicConstants
				return @copy()
			if @value?
				return new Constant(@value, 1, "float")
			if @label of constants
				return new Constant(constants[@label], 1, "float")
			return @copy()

		# Simplify this constant.
		#
		# @return [SymbolicConstant] A copy of the constant.
		simplify: ->
			@copy()

		# Expand this constant.
		#
		# @return [SymbolicConstant] A copy of the constant.
		expand: ->
			@copy()

		# Expand and simplify this constant.
		#
		# @return [SymbolicConstant] A copy of the constant.
		expandAndSimplify: ->
			@copy()

		# Get uncertainty of this constant.
		#
		# @return [Constant] 0, as we assume no uncertainty in a symbolic constant.
		getUncertainty: ->
			new Constant(0)

		# Map a function over all variables in this node. Does nothing, included for API parity.
		#
		# @param fun [Function] A function to map over variables.
		# @return [SymbolicConstant] A copy of this node with the function mapped over all variables.
		mapOverVariables: (fun) ->
			return @copy()

		# Make a drawing node representing this constant.
		#
		# @return [DrawingNode] Renderable drawing node representing this constant.
		toDrawingNode: ->
			VariableNode = prettyRender.Variable
			return new VariableNode(@label, "constant symbolic-constant")

		# Differentiate this constant.
		#
		# @param variable [String] Variable to differentiate with respect to.
		# @return [Constant] 0, as constants are constant.
		differentiate: (variable) ->
			return new Constant(0)

	# Represents variables in the equation tree.
	class Variable extends Terminal

		# Make a new Variable.
		#
		# @param label [String] The label of this variable.
		# @param units [BasicNode, Terminal] Optional. Units of this variable (default is null).
		constructor: (@label, @units=null) ->
			@cmp = -4

		# Deep-copy this Variable.
		#
		# @return [Variable] A copy of this Variable.
		copy: ->
			return new Variable(@label, @units)

		# Compare this Variable with another Variable.
		#
		# @param b [Variable] The variable to compare with.
		# @return [Number] 1 if this is greater, 0 if equal, and -1 if this is lesser.
		compareSameType: (b) ->
			if @label < b.label
				return -1
			else if @label == b.label
				return 0
			else
				return 1

		# Check equality of this Variable and another object.
		#
		# @param b [Object] The other object to compare with.
		# @param equivalencies [Object] Optional. A map of variable labels to a list of equivalent variable labels.
		# @return [Boolean] Whether the objects are equal.
		equals: (b, equivalencies={}) ->
			# Check equality between this and some other object.
			unless b instanceof Variable
				return false

			if b.label of equivalencies
				return @label in equivalencies[b.label]
			else
				return b.label == @label

		# Replace variable labels.
		#
		# @param replacements [Object] A map of variable labels to replacement labels.
		# @return [Variable] This variable, possibly with its name replaced.
		replaceVariables: (replacements) ->
			copy = @copy()
			if @label of replacements
				copy.label = replacements[@label]
			return copy

		# Get a list of children variable labels.
		#
		# @return [Array<String>] An array containing just this label.
		getAllVariables: ->
			[@label]

		# Substitute values into the Variable.
		#
		# @param substitutions [Object] A map of variable labels to their values.
		# @param uncertaintySubstitutions [Object] A map of uncertainty labels to their values.
		# @param equivalencies [Object] Optional. A map of variable labels to a list of equivalent variable labels.
		# @return [Variable, Constant] This variable, possibly substituted.
		sub: (substitutions, uncertaintySubstitutions, equivalencies={}) ->
			if @label of equivalencies
				equivs = equivalencies[@label]
			else
				equivs = [@label]

			for label in equivs
				if label of substitutions
					substitute = substitutions[label]
					if substitute.copy?
						return substitute.copy()
					else
						if (substitute % 1 == 0)
							return new Constant(substitute)
						else
							return new Constant(substitute, 1, "float")
			return @copy()

		# Get uncertainty of this Variable.
		#
		# @return [Uncertainty] Symbolic uncertainty of this Variable.
		getUncertainty: ->
			new Uncertainty(@label)

		# Map a function over all variables in this node.
		#
		# @param fun [Function] A function to map over variables.
		# @return [Variable] A copy of this node with the function mapped over all variables.
		mapOverVariables: (fun) ->
			return fun(@copy())

		# Simplify the Variable.
		#
		# @return [Variable] Copy of the Variable.
		simplify: ->
			@copy()

		# Expand the Variable.
		#
		# @return [Variable] Copy of the Variable.
		expand: ->
			@copy()

		# Expand and simplify the Variable.
		#
		# @return [Variable] Copy of the Variable.
		expandAndSimplify: ->
			@copy()

		# Make a drawing node representing this Variable.
		#
		# @return [DrawingNode] Drawing node representing this variable.
		toDrawingNode: ->
			VariableNode = prettyRender.Variable
			return new VariableNode(@label)

		# Differentiate the variable.
		#
		# @param variable [String] The label of the variable to differentiate with respect to.
		# @param equivalencies [Object] Optional. A map of variable labels to a list of equivalent variable labels.
		# @return [Constant] The differentiated variable.
		differentiate: (variable, equivalencies={}) ->
			if variable of equivalencies
				if @label in equivalencies[variable]
					return new Constant(1)
			if variable == @label
				return new Constant(1)
			return new Constant(0)

		# Evaluate this Variable.
		#
		# @return [Object] null, because this doesn't have a value.
		evaluate: ->
			null

		# Check if this node contains a given variable.
		#
		# @param variable [String] The label of the variable to differentiate with respect to.
		# @param equivalencies [Object] Optional. A map of variable labels to a list of equivalent variable labels.
		# @return [Boolean] Whether or not this node contains the given variable.
		containsVariable: (variable, equivalencies={}) ->
			if variable of equivalencies
				return @label in equivalencies[variable]
			return variable == @label

	# Represents an uncertainty.
	class Uncertainty extends Terminal

		# Make an Uncertainty.
		#
		# @param label [String] Label of the variable this Uncertainty is for.
		constructor: (@label) ->
			@cmp = -4.5

		# Deep-copy the Uncertainty.
		#
		# @return [Uncertainty] A copy of the Uncertainty.
		copy: ->
			return new Uncertainty(@label)

		# Compares this Uncertainty with another Uncertainty.
		#
		# @param b [Uncertainty] Uncertainty to compare with.
		# @return [Number] 1 if this is greater, 0 if equal, -1 if this is lesser.
		compareSameType: (b) ->
			if @label < b.label
				return -1
			else if @label == b.label
				return 0
			else
				return 1

		# Check equality of this and another object.
		#
		# @param b [Object] Object to compare with.
		# @param equivalencies [Object] Optional. A map of variable labels to a list of equivalent variable labels.
		# @return [Boolean] Whether the objects are equal.
		equals: (b, equivalencies=null) ->
			# Check equality between this and some other object.
			unless b instanceof Uncertainty
				return false

			if b.label of equivalencies
				return @label in equivalencies[b.label]
			else
				return b.label == @label

		# Replace variable labels.
		#
		# @param replacements [Object] Map of variable labels to new labels.
		# @return [Uncertainty] This node with its label possibly replaced.
		replaceVariables: (replacements) ->
			copy = @copy()
			if @label of replacements
				copy.label = replacements[@label]
			return copy

		# Get variable labels.
		#
		# @return [Array<String>] An array containing just this label.
		getAllVariables: ->
			[@label]

		# Substitute values.
		#
		# @param substitutions [Object] Substitutions map. Irrelevant; included for API parity.
		# @param uncertaintySubstitutions [Object] Map of uncertainty labels to uncertainty values.
		# @param equivalencies [Object] Optional. A map of variable labels to a list of equivalent variable labels.
		# @param assumeZero [Boolean] Whether to assume this uncertainty is zero if its value is not defined.
		sub: (substitutions, uncertaintySubstitutions, equivalencies=null, assumeZero=false) ->
			if @label of equivalencies
				for label in equivalencies[@label]
					if label of uncertaintySubstitutions and uncertaintySubstitutions[label]?
						substitute = uncertaintySubstitutions[label]
						if substitute.copy?
							return substitute.copy()
						else
							return new Constant(substitute)
				return if not assumeZero then @copy() else new Constant("0")
			else
				if @label of uncertaintySubstitutions and uncertaintySubstitutions[@label]?
					substitute = uncertaintySubstitutions[@label]
					if substitute.copy?
						return substitute.copy()
					else
						return new Constant(substitute)
				else
					return if not assumeZero then @copy() else new Constant("0")

		# Get uncertainty.
		#
		# @throw [Error] Not implemented for uncertainties.
		getUncertainty: ->
			throw new Error("Can't take uncertainty of an uncertainty")

		# Map a function over all variables in this node. Does nothing, included for API parity.
		#
		# @param fun [Function] A function to map over variables.
		# @return [Uncertainty] A copy of this node with the function mapped over all variables.
		mapOverVariables: (fun) ->
			return @copy()

		# Simplify this node.
		#
		# @return [Uncertainty] A copy of this uncertainty.
		simplify: ->
			@copy()

		# Expand this node.
		#
		# @return [Uncertainty] A copy of this uncertainty.
		expand: ->
			@copy()

		# Expand and then simplify this node.
		#
		# @return [Uncertainty] A copy of this uncertainty.
		expandAndSimplify: ->
			@copy()

		# Make a new drawing node representing this uncertainty.
		#
		# @return [DrawingNode] A drawing node representing this uncertainty.
		toDrawingNode: ->
			UncertaintyNode = prettyRender.Uncertainty
			return new UncertaintyNode(@label)

		# Differentiate.
		# Don't differentiate uncertainties. It won't work.
		#
		# @throw [Error] Not implemented for uncertainties.
		differentiate: (variable) ->
			throw new Error("Can't differentiate uncertainties!")

	return {

		Terminal: Terminal

		Variable: Variable

		Constant: Constant

		SymbolicConstant: SymbolicConstant

		Uncertainty: Uncertainty

	}
