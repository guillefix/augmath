define [
	"nodes"
	"terminals"
	"AlgebraError"
	"parseArgs"
	"require"
	"compare"
	"prettyRender"
], (nodes, terminals, AlgebraError, parseArgs, require, compare, prettyRender) ->

	# Node in the expression tree representing exponentiation.
	class Pow extends nodes.BinaryNode
		# Represent powers.

		# Make a new power node.
		# Arguments passed as children will be parsed as children from whatever type they are.
		#
		# @param base [Object] The base of this power.
		# @param power [Object] The exponent of this power.
		# @return [Pow] A new power node.
		constructor: (base, power, args...) ->
			unless base? and power?
				throw new Error("Pow nodes must have two children.")
			if args.length > 0
				throw new Error("Pow nodes must have two children.")

			@cmp = -3

			[base, power] = parseArgs(base, power)
			super("**", base, power)

		# Deep-copy this node.
		#
		# @return [Pow] A copy of this node.
		copy: ->
			return new Pow(
				(if @children.left.copy? then @children.left.copy() else @children.left),
				(if @children.right.copy? then @children.right.copy() else @children.right)
			)

		# Sort this node in-place.
		sort: ->
			@children.left.sort?()
			@children.right.sort?()

		# Check equality between this and another object.
		#
		# @param b [Object] An object to check equality with.
		# @param equivalencies [Object] Optional. A map of variable labels to a list of equivalent variable labels.
		# @return [Boolean] Whether the objects are equal.
		equals: (b, equivalencies={}) ->
			# Check equality between this and another object.
			unless b instanceof Pow
				return false

			if @children.left.equals?
				unless @children.left.equals(b.children.left, equivalencies)
					return false
			else
				unless @children.left == b.children.left
					return false

			if @children.right.equals?
				unless @children.right.equals(b.children.right, equivalencies)
					return false
			else
				unless @children.right == b.children.right
					return false

			return true

		# Compare this object with another of the same type.
		#
		# @param b [Pow] A power node to compare to.
		# @return [Number] The comparison: 1 if this node is greater than the other, -1 if vice versa, and 0 if they are equal.
		compareSameType: (b) ->
			# Compare this object with another of the same type.
			c = compare(@children.left, b.children.left)
			if c != 0
				return c
			else
				return compare(@children.right, b.children.right)

		# Map a function over all variables in this node.
		#
		# @param fun [Function] A function to map over variables.
		# @return [Pow] A copy of this node with the function mapped over all variables.
		mapOverVariables: (fun) ->
			left = @children.left.mapOverVariables(fun)
			right = @children.right.mapOverVariables(fun)
			return (new Pow(left, right))

		# Expand this node.
		#
		# @return [BasicNode, Terminal] This node, expanded.
		expand: ->
			Mul = require("operators/Mul")
			Add = require("operators/Add")

			# Expand all the children.
			if @children.left.expand?
				left = @children.left.expand()
			else if @children.left.copy?
				left = @children.left.copy()
			else
				left = @children.left

			if @children.right.expand?
				right = @children.right.expand()
			else if @children.right.copy?
				right = @children.right.copy()
			else
				right = @children.right

			if left.children?
				if left instanceof Pow
					# (a ** b) ** c -> (a ** (b * c))
					left.children.right = new Mul(left.children.right, right)
					left.expand()
				else if left instanceof Mul
					# Put all the things on the left to the power of the right.
					for child, index in left.children
						newPow = new Pow(child, right)
						newPow = newPow.expand()
						left.children[index] = newPow # This is so I don't have to worry about what
													  # type the child is! :D
				else if left instanceof Add
					# Convert this into a multiplication of addition nodes, if the power is an integer.
					# Otherwise, leave it.
					if right instanceof terminals.Constant and right.evaluate() % 1 == 0 and right.evaluate() > 0
						# Expand!
						children = []
						for i in [1..right.evaluate()]
							children.push(left)
						newMul = new Mul(children...)
						newMul = newMul.expand()
						left = newMul
					else # FIXME: Should expand denominators too!
						left = new Pow(left, right)

				return left
			else
				# Can't expand any more!
				return new Pow(left, right)

		# Simplify this node.
		#
		# @param equivalencies [Object] Optional. A map of variable labels to a list of equivalent variable labels.
		# @return [BasicNode, Terminal] This node, simplified.
		simplify: (equivalencies={}) ->
			Mul = require("operators/Mul")

			# Simplify all the children.
			if @children.left.simplify?
				left = @children.left.simplify(equivalencies)
			else if @children.left.copy?
				left = @children.left.copy()
			else
				left = @children.left

			if @children.right.simplify?
				right = @children.right.simplify(equivalencies)
			else if @children.right.copy?
				right = @children.right.copy()
			else
				right = @children.right

			if right.evaluate?() == 1
				return left
			else if left.evaluate?() == 1 or left.evaluate?() == 0
				return left
			else if right.evaluate?() == 0
				return new terminals.Constant("1")
			else
				if right instanceof terminals.Constant and left instanceof terminals.Constant
					return left.pow(right)
				else if left instanceof Pow
					power = new Mul(left.children.right, right)
					newPow = new Pow(left.children.left, power)
					newPow = newPow.simplify(equivalencies)
					return newPow
				else
					return new Pow(left, right)

		# Expand and then simplify this node.
		#
		# @param equivalencies [Object] Optional. A map of variable labels to a list of equivalent variable labels.
		# @return [BasicNode, Terminal] This node, expanded and simplified.
		expandAndSimplify: (equivalencies={}) ->
			expr = @expand()
			if expr.simplify?
				return expr.simplify(equivalencies)
			return expr

		# Solve this node for a variable.
		#
		# @param variable [String] The label of the variable to solve for.
		# @param equivalencies [Object] Optional. A map of variable labels to a list of equivalent variable labels.
		# @return [Array<BasicNode>, Array<Terminal>] The solutions for the given variable.
		# @throw [AlgebraError] If the node cannot be solved.
		solve: (variable, equivalencies={}) ->
			Mul = require("operators/Mul")

			# variable: The label of the variable to solve for. Return an array of solutions.

			expr = @expandAndSimplify(equivalencies)

			if expr instanceof terminals.Terminal
				if expr instanceof terminals.Variable and (expr.label == variable or (expr.label of equivalencies and variable in equivalencies[expr.label]))
					return [new terminals.Constant("0")]
				else
					throw new AlgebraError(expr.toString(), variable)

			if expr instanceof Pow
				if expr.children.left instanceof terminals.Variable
					return [new terminals.Constant("0")] if (expr.children.left.label == variable or (expr.children.left.label of equivalencies and variable in equivalencies[expr.children.left.label])) # 0 = v; v = 0
					throw new AlgebraError(expr.toString(), variable)
				else if expr.children.left instanceof terminals.Terminal
					throw new AlgebraError(expr.toString(), variable)
				else
					try
						solutions = expr.children.left.solve(variable, equivalencies) # Root the 0 on the other side of the equation.
					catch error
						throw error # Acknowledging that this solving could fail and we do want it to.

					# This will lose some solutions, if we have something like x ** x, but we can't solve
					# a ** x anyway with this program, so losing a solution to x ** x doesn't bother me.
					if expr.children.right.evaluate? and expr.children.right.evaluate() % 2 == 0 # % 2 checks for two real solutions.
						returnables = []
						for solution in solutions
							negative = (new Mul(-1, solution)).simplify(equivalencies)
							if negative.equals?
								unless negative.equals(solution)
									returnables.push(negative)
								returnables.push(solution)
							else
								unless negative == solution
									returnables.push(negative)
								returnables.push(solution)
						return returnables
					else
						return solutions
			else
				return expr.solve(variable, equivalencies)

		# Substitute values into variables.
		#
		# @param substitutions [Object] A map of variable labels to their values. Values can be any node, terminal, or something interpretable as a terminal.
		# @param uncertaintySubstitutions [Object] A map of variable labels to the values of their uncertainties.
		# @param equivalencies [Object] Optional. A map of variable labels to a list of equivalent variable labels.
		# @param assumeZeroUncertainty [Boolean] Optional. Whether to assume uncertainties are zero if unknown (default false).
		# @param evaluateSymbolicConstants [Boolean] Optional. Whether to evaluate symbolic constants (default false).
		# @return [BasicNode, Terminal] This node with all substitutions substituted.
		sub: (substitutions, uncertaintySubstitutions, equivalencies={}, assumeZeroUncertainty=false, evaluateSymbolicConstants=false) ->
			# substitutions: {variable: value}
			# variable is a label, value is any object - if it is a node,
			# it will be substituted in; otherwise it is interpreted as a
			# constant (and any exceptions that might cause will be thrown).

			# Interpret substitutions.
			for variable of substitutions
				unless substitutions[variable].copy?
					if substitutions[variable] % 1 == 0
						substitutions[variable] = new terminals.Constant(substitutions[variable])
					else
						substitutions[variable] = new terminals.Constant(substitutions[variable], 1, "float")

			left = null
			right = null
			if @children.left instanceof terminals.Variable
				variableEquivalencies = if @children.left.label of equivalencies then equivalencies[@children.left.label] else [@children.left.label]
				for equiv in variableEquivalencies
					if equiv of substitutions
						left = substitutions[equiv].copy()
						break
				unless left?
					left = @children.left.copy()
			else if @children.left.sub?
				left = @children.left.sub(substitutions, uncertaintySubstitutions, equivalencies, assumeZeroUncertainty, evaluateSymbolicConstants)
			else
				left = @children.left.copy()

			if @children.right instanceof terminals.Variable
				variableEquivalencies = if @children.right.label of equivalencies then equivalencies[@children.right.label] else [@children.right.label]
				subbed = false
				for equiv in variableEquivalencies
					if equiv of substitutions
						right = substitutions[equiv].copy()
						subbed = true
						break
				unless subbed
					right = @children.right.copy()
			else if @children.right.sub?
				right = @children.right.sub(substitutions, uncertaintySubstitutions, equivalencies, assumeZeroUncertainty, evaluateSymbolicConstants)
			else
				right = @children.right.copy()

			newPow = new Pow(left, right)
			newPow = newPow.expandAndSimplify(equivalencies)
			return newPow

		# Get all variable labels used in children of this node.
		#
		# @return [Array<String>] A list of all labels of variables in children of this node.
		getAllVariables: ->
			variables = {}

			if @children.left instanceof terminals.Variable
				variables[@children.left.label] = true
			else if @children.left.getAllVariables?
				leftVariables = @children.left.getAllVariables()
				for variable in leftVariables
					variables[variable] = true
			if @children.right instanceof terminals.Variable
				variables[@children.right.label] = true
			else if @children.right.getAllVariables?
				rightVariables = @children.right.getAllVariables()
				for variable in rightVariables
					variables[variable] = true

			outVariables = []
			for variable of variables
				outVariables.push(variable)

			return outVariables

		# Replace variable labels.
		#
		# @param replacements [Object] A map of variable labels to their replacement labels.
		# @return [Pow] This node with variable labels replaced.
		replaceVariables: (replacements) ->
			# {variableLabel: replacementLabel}
			left = @children.left.copy()
			right = @children.right.copy()

			if left instanceof terminals.Variable and left.label of replacements
				left.label = replacements[left.label]
			else if left.replaceVariables?
				left = left.replaceVariables(replacements)
			if right instanceof terminals.Variable and right.label of replacements
				right.label = replacements[right.label]
			else if right.replaceVariables?
				right = right.replaceVariables(replacements)

			return new Pow(left, right)

		# Convert this node into a drawing node.
		#
		# @return [DrawingNode] A drawing node representing this node.
		toDrawingNode: ->
			SurdNode = prettyRender?.Surd
			PowNode = prettyRender.Pow
			FractionNode = prettyRender.Fraction
			NumberNode = prettyRender.Number

			if @children.right instanceof terminals.Constant
				if @children.right.numerator == 1
					if @children.right.denominator == 1
						return @children.left.toDrawingNode()
					if @children.right.denominator > 0
						return new SurdNode(@children.left.toDrawingNode(), @children.right.denominator)
					else
						return new FractionNode(new NumberNode(1),
								new SurdNode(@children.left.toDrawingNode(), -@children.right.denominator))

			return new PowNode(PowNode::bracketIfNeeded(@children.left.toDrawingNode()),
																			@children.right.toDrawingNode())

		# Differentiate this node with respect to a variable.
		#
		# @param variable [String] The label of the variable to differentiate with respect to.
		# @param equivalencies [Object] Optional. A map of variable labels to a list of equivalent variable labels.
		differentiate: (variable, equivalencies={}) ->
			Add = require("operators/Add")
			Mul = require("operators/Mul")
			Constant = require("terminals").Constant
			if variable in @children.right.getAllVariables
				throw new Error("I can't differentiate with a variable on the top of a power")
			if @children.right.evaluate?() == 0
				return new Constant(0)
			return new Mul(new Pow(@children.left, new Add(@children.right, new Constant(-1))),
										 @children.left.differentiate(variable, equivalencies),
										 @children.right).expandAndSimplify(equivalencies)

		# Check if this node contains a given variable.
		#
		# @param variable [String] The label of the variable to differentiate with respect to.
		# @param equivalencies [Object] Optional. A map of variable labels to a list of equivalent variable labels.
		# @return [Boolean] Whether or not this node contains the given variable.
		containsVariable: (variable, equivalencies={}) ->
			return @children.left.containsVariable(variable, equivalencies) or @children.right.containsVariable(variable, equivalencies)
		
		@approx: (a, b) -> Math.pow(a, b)
