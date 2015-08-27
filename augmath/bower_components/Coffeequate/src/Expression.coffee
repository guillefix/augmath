define ["parse", "nodes"], (parse, nodes) ->

	# Public interface for nodes.
	# This is the main object that the user will deal with in Coffeequate.
	# It wraps underlying nodes and terminals in a neat interface.
	class Expression

		# Make a new Expression.
		#
		# @param val [String, Expression, BasicNode, Terminal] A string representation of an expression to parse or a node/terminal/expression to convert into an Expression.
		# @return [Expression]
		constructor: (val) ->
			if val instanceof String or typeof val == "string"
				# The string we pass in is just a representation to parse.
				@expr = parse.stringToExpression(val)
				if @expr.simplify?
					@expr = @expr.simplify()
			else if val.copy?
				@expr = val.copy().simplify()
			else
				console.log("Received argument: ", val)
				throw new Error("Unknown argument: `#{val}'.")

		# Convert this Expression to a string.
		#
		# @return [String] A string representation of this Expression.
		toString: ->
			@expr.toString()

		# Convert this Expression to a MathML string.
		#
		# @return [String] A MathML representation of this Expression.
		toMathML: ->
			@expr.toMathML()

		# Convert this Expression to a LaTeX string.
		#
		# @return [String] A LaTeX representation of this Expression.
		toLaTeX: ->
			@expr.toLaTeX()

		# Equate the Expression to 0 and solve for a variable.
		#
		# @param variable [String] The variable to solve for.
		# @param equivalencies [Object] Optional. A map of variable labels to a list of equivalent variable labels.
		# @return [Array<Expression>] An array of Expressions representing the variable for each solution.
		solve: (variable, equivalencies={}) ->
			(new Expression(solution) for solution in @expr.solve(variable, equivalencies))

		# Substitute values into the Expression.
		#
		# @param substitutions [Object] A map of variable labels to their values. Values can be integers, Expressions, Terminals, or BasicNodes.
		# @param equivalencies [Object] Optional. A map of variable labels to a list of equivalent variable labels.
		# @param substituteUncertainties [Boolean] Optional. Whether to substitute values into uncertainties instead of variables (default false).
		# @param evaluateSymbolicConstants [Boolean] Optional. Whether to evaluate symbolic constants (as opposed to leaving them symbolic) (default false).
		# @return [Expression] The Expression with substituted values.
		sub: (substitutions, equivalencies={}, substituteUncertainties=false, evaluateSymbolicConstants=false) ->
			# If there are any Expressions in here, we should remove them.
			newsubs = {}
			for key of substitutions
				if substitutions[key] instanceof Expression
					newsubs[key] = substitutions[key].expr
				else
					newsubs[key] = substitutions[key]

			if substituteUncertainties
				uncertaintySubs = newsubs
				variableSubs = {}
			else
				uncertaintySubs = {}
				variableSubs = newsubs

			subbed = @expr.sub(variableSubs, uncertaintySubs, equivalencies, false, evaluateSymbolicConstants)
			if subbed.simplify?
				subbed = subbed.simplify(equivalencies)
			return new Expression(subbed)

		# Get all variable names in this expression.
		#
		# @example CQ("x*t").getAllVariables(); // Returns ["t", "x"]
		#
		# @return [Array<String>] An array of variable labels.
		getAllVariables: ->
			return @expr.getAllVariables()

		# Map a function over all variables in this expression.
		#
		# @param fun [Function] A function to map over variables.
		# @return [Expression] A copy of this expression with the function mapped over all variables.
		mapOverVariables: (fun) ->
			return @expr.mapOverVariables(fun)

		# Deep-copy this Expression.
		#
		# @return [Expression] A copy of this Expression.
		copy: ->
			new Expression(@expr.copy())

		# Simplify this Expression.
		#
		# @param equivalencies [Object] Optional. A map of variable labels to a list of equivalent variable labels.
		# @return [Expression] A simplified Expression.
		simplify: (equivalencies={}) ->
			if @expr.expandAndSimplify?
				expr = @expr.expandAndSimplify(equivalencies)
			else if @expr.simplify?
				expr = @expr.simplify(equivalencies)
			else
				expr = @expr.copy()
			new Expression(expr)

		# Expand this Expression.
		#
		# @return [Expression] An expanded Expression.
		expand: ->
			if @expr.expand?
				expr = @expr.expand()
			else
				expr = @expr.copy()
			new Expression(expr)

		# Differentiate this expression with respect to a variable.
		#
		# @param variable [String] The label of the variable to differentiate with respect to.
		# @param equivalencies [Object] Optional. A map of variable labels to a list of equivalent variable labels.
		# @return [Expression] A differentiated expression.
		differentiate: (variable, equivalencies={}) ->
			new Expression(@expr.differentiate(variable, equivalencies))

		# Get the uncertainty in this Expression.
		#
		# @return [Expression] An Expression representing the uncertainty in this Expression.
		getUncertainty: ->
			new Expression(@expr.getUncertainty())

		# Convert this expression to a JavaScript function.
		#
		# @param variables... [Array<String>] An array of variables for the function to accept, in order that they should appear in the final function.
		# @param equivalencies [Object] Optional. A map of variable labels to a list of equivalent variable labels. This will be used in the returned function.
		# @return [Function] A function that takes variable values and returns an Expression object.
		toFunction: (variables..., equivalencies) ->
			if typeof equivalencies == "string" or equivalencies instanceof String # We had no equivalencies object after all.
				variables.push(equivalencies)
				equivalencies = {}

			# The function we will return.
			fun = (subs...) =>
				# Zip variables and subs together into an object.
				substitutions = {}
				for variable, index in variables
					if subs[index]?
						substitutions[variable] = subs[index]

				# Substitute these values into this expression and return the result.
				return @sub(substitutions, equivalencies)

			return fun

		approx: -> @expr.approx()

		equals: (other) ->
			return undefined unless other instanceof Expression

			# convert to canonical form
			lhs = @expr.expandAndSimplify()
			rhs = other.expr.expandAndSimplify()

			return lhs.equals(rhs)

	return Expression
