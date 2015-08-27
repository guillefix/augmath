define [
	"nodes"
	"terminals"
	"AlgebraError"
	"parseArgs"
	"require"
	"compare"
	"prettyRender"
], (nodes, terminals, AlgebraError, parseArgs, require, compare, prettyRender) ->

	# Get all combinations of a list of items.
	#
	# @param list [Array<Object>] A list of items.
	# @return [Array<Array<Object>>] A list of combinations of items.
	combinations = (list) ->
		if list.length == 1
			return (i for i in list[0])
		else
			results = []
			for i in list[0]
				for ii in combinations(list[1..])
					results.push([i].concat(ii))
			return results

	# Pull out terms that are dependent on a variable and return the rest in an array.
	#
	# @param linearTerms [Array<BasicNode>, Array<Terminal>] A list of terms containing a variable.
	# @param variable [String] The label of the variable to factorise out.
	# @param equivalencies [Object] Optional. A map of variable labels to a list of equivalent variable labels.
	# @return [Array<BasicNode>, Array<Terminal>] A list of terms that have had the variable extracted.
	getLinearFactors = (linearTerms, variable, equivalencies={}) ->
		Mul = require("operators/Mul")
		factors = [] # List of a, b, c... in a x + b x + c x
		for term in linearTerms
			if term instanceof terminals.Variable
				# This must just be the variable in question, so the term out the front is 1.
				factors.push(new terminals.Constant("1"))
			else
				# This must be a multiplication node.
				subfactors = []
				for child in term.children
					unless child.containsVariable(variable, equivalencies)
						subfactors.push(child)
				factor = new Mul(subfactors...)
				factors.push(factor)

		return factors

	# Node in the expression tree representing addition.
	class Add extends nodes.RoseNode

		# Make a new addition node.
		# Arguments passed as children will be parsed as children from whatever type they are.
		#
		# @param args... [Array<Object>] A list of children for this node.
		# @return [Add] A new addition node.
		constructor: (args...) ->
			# Check validity of arguments.
			if args.length < 1
				throw new Error("Add nodes must have at least one child.")

			@cmp = -1

			args = parseArgs(args...)
			super("+", args)

		# Deep-copy this node.
		#
		# @return [Add] A copy of this node.
		copy: ->
			args = ((if i.copy? then i.copy() else i) for i in @children)
			return new Add(args...)

		# Compare this object with another of the same type.
		#
		# @param b [Add] An addition node to compare to.
		# @return [Number] The comparison: 1 if this node is greater than the other, -1 if vice versa, and 0 if they are equal.
		compareSameType: (b) ->
			if @children.length == b.children.length
				lengthComparison = 0
			else if @children.length < b.children.length
				lengthComparison = -1
			else
				lengthComparison = 1

			for child, index in @children
				return 1 unless b.children[index]?
				c = compare(@children[index], b.children[index])
				if c != 0
					return c

			return lengthComparison

		# Map a function over all variables in this node.
		#
		# @param fun [Function] A function to map over variables.
		# @return [Add] A copy of this node with the function mapped over all variables.
		mapOverVariables: (fun) ->
			children = []
			for child in @children
				children.push(child.mapOverVariables(fun))
			return (new Add(children...))

		# Expand this node.
		#
		# @return [Add] This node, expanded.
		expand: ->
			# Addition is associative, so expand (+ (+ a b) c) into (+ a b c).
			children = []
			for child in @children
				if child.expand?
					child = child.expand()
				else if child.copy?
					child = child.copy()
				if child instanceof Add
					# If the child is an addition node, add its children as
					# the children of this node.
					for c in child.children
						children.push(c)
				else
					children.push(child)

			add = new Add(children...)
			add.sort()

			return add

		# Sort this node in-place.
		sort: ->
			for child in @children
				child.sort?()
			@children.sort(compare)

		# Check equality between this and another object.
		#
		# @param b [Object] An object to check equality with.
		# @param equivalencies [Object] Optional. A map of variable labels to a list of equivalent variable labels.
		# @return [Boolean] Whether the objects are equal.
		equals: (b, equivalencies={}) ->
			unless b instanceof Add
				return false
			unless b.children.length == @children.length
				return false
			for child, index in @children
				if child.equals?
					unless child.equals(b.children[index], equivalencies)
						return false
				else
					unless child == b.children[index]
						return false
			return true

		# Simplify this node.
		#
		# @param equivalencies [Object] Optional. A map of variable labels to a list of equivalent variable labels.
		# @return [BasicNode, Terminal] This node, simplified.
		simplify: (equivalencies={}) ->
			Mul = require("operators/Mul")

			terms = []
			for child in @children
				if child.simplify?
					child = child.simplify(equivalencies)
				else if child.copy?
					child = child.copy()

				terms.push(child)

			# Collect like terms into multiplication.
			liketerms = []
			constantterm = null
			i = 0
			while i < terms.length
				term = terms[i]
				if term instanceof Add
					terms.splice(i, 1)[0]
					# Pull the children into this node (this flattens the addition tree).
					for c in term.children
						terms.push(c)
					i -= 1 # Rewind the loop slightly.
				else if term instanceof terminals.Constant
					if constantterm?
						constantterm = constantterm.add(term)
					else
						constantterm = term.copy()
				else if term instanceof Mul # Might need to expand Mul nodes.
					constanttermmul = null
					variabletermmul = null
					for child in term.children
						if child instanceof terminals.Constant
							if constanttermmul?
								constanttermmul = constanttermmul.multiply(child)
							else
								constanttermmul = child.copy()
						else
							if variabletermmul?
								variabletermmul.children.push(child)
							else
								variabletermmul = new Mul(child)

					if variabletermmul.children.length == 1
						variabletermmul = variabletermmul.children[0]

					if constanttermmul? and (not variabletermmul?)
						if constantterm?
							constantterm = constantterm.add(constanttermmul)
						else
							constantterm = constanttermmul.copy()
					else
						unless constanttermmul?
							constanttermmul = new terminals.Constant("1")

						# Find the var in liketerms.
						# If we find it, add the constant to the total.
						# If we can't find it, add [var, const] to liketerms.
						found = false
						for liketerm, index in liketerms
							if liketerm[0].equals?
								if liketerm[0].equals(variabletermmul, equivalencies)
									liketerms[index][1] = new Add(liketerm[1], constanttermmul)
									liketerms[index][1] = liketerms[index][1].simplify(equivalencies)
									found = true
							else if liketerm[0] == variabletermmul
								liketerms[index][1] = new Add(liketerm[1], constanttermmul)
								liketerms[index][1] = liketerms[index][1].simplify(equivalencies)
								found = true
						unless found
							liketerms.push([variabletermmul, constanttermmul])

				else
					# A unique term. Do we have a copy of it already?
					found = false
					for liketerm, index in liketerms
						if liketerm[0].equals?
							if liketerm[0].equals(term, equivalencies)
								liketerms[index][1] = new Add(liketerm[1], new terminals.Constant("1"))
								liketerms[index][1] = liketerms[index][1].simplify(equivalencies)
								found = true
						else if liketerm[0] == term
							liketerms[index][1] = new Add(liketerm[1], new terminals.Constant("1"))
							liketerms[index][1] = liketerms[index][1].simplify(equivalencies)
							found = true
					unless found
						liketerms.push([term, new terminals.Constant("1")])

				i += 1

			newAdd = null
			for liketerm in liketerms
				if liketerm[0].children? and liketerm[0].children.length == 1
					liketerm[0] = liketerm[0].children[0]
				if liketerm[1].evaluate?() != 1
					newMul = new Mul(liketerm[0], liketerm[1])
					newMul = newMul.simplify(equivalencies)
				else
					newMul = liketerm[0]
				if newAdd?
					newAdd.children.push(newMul)
				else
					newAdd = new Add(newMul)

			unless newAdd?
				return constantterm

			if constantterm? and constantterm.evaluate() != 0
				newAdd.children.push(constantterm)

			newAdd.sort()

			return newAdd unless newAdd.children.length == 1
			return newAdd.children[0]

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
			Pow = require("operators/Pow")

			expr = @expandAndSimplify(equivalencies).expandAndSimplify(equivalencies)

			unless expr instanceof Add
				unless expr.containsVariable(variable, equivalencies)
					throw new AlgebraError(expr.toString(), variable, "(variable not found)") # The simplified input doesn't contain the variable.
				return expr.solve(variable, equivalencies)

			# Separate children into terms containing variable and terms not containing variable.
			dependentTerms = []
			independentTerms = []
			for term in expr.children
				if term.containsVariable(variable, equivalencies)
					dependentTerms.push(term.copy())
				else
					independentTerms.push(term.copy())

			# If there are no dependent terms, we can't solve this for the given variable.
			if dependentTerms.length == 0
				throw new AlgebraError(expr.toString(), variable, "(variable not found)")

			# Now split up the dependent terms into terms of the following forms:
			# 	a x
			#	a x**n
			# 	a f(x)
			# 	a f(x)g(x)
			linearTerms = [] # a x
			powerTerms = [] # a x**n
			nonPolynomialTerms = [] # a f(x)

			for term in dependentTerms
				# The term could be a variable, in which case it is the variable we want and we can put it in linearTerms.
				if term instanceof terminals.Variable
					linearTerms.push(term)

				# The term could be the product of some things that are not the variable and the variable itself.
				else if term instanceof Mul and term.isLinear(variable, equivalencies)
					linearTerms.push(term)

				# The term could be a power term, in which case we want to put it in powerTerms.
				else if term instanceof Pow and term.containsVariable(variable, equivalencies) and not term.children.right.containsVariable(variable, equivalencies)
					powerTerms.push(term)
					# Note that if it's of the form x**f(x) then it doesn't go in powerTerms - that's a non-polynomial term.

				# The term could be a power term with a coefficient, in which case it should go in powerTerms.
				else if term instanceof Mul and term.isPolynomial(variable, equivalencies)
					powerTerms.push(term)

				# The term must be a non-polynomial term.
				else
					nonPolynomialTerms.push(term)


			# If we have non-polynomial terms, we can't solve this at the moment.
			# Later, if we add more functions, we should check if those functions have a known inverse. If that's the case, we can solve!
			if nonPolynomialTerms.length > 0
				throw new AlgebraError(expr.toString(), variable, "(can't solve non-polynomial equations yet)")

			# If we have no power terms, then we have a linear equation 0 = a x + z. The solution is then -z/a.
			if powerTerms.length == 0 # We don't have to check linear terms because we have to have SOME terms or we can't solve this at all (and would have already rejected it).
				negativeIndependents = new Mul("-1", new Add(independentTerms...)) # -z
				# We need to find the divisor - we need to factorise!
				factors = getLinearFactors(linearTerms, variable, equivalencies)
				
				# Now we add all of those factors together and reciprocate it.
				reciprocal = new Pow(new Add(factors...), "-1") # 1/a
				# Multiply the reciprocal by the negative independents to get the final solution.
				solution = new Mul(negativeIndependents, reciprocal)
				return [solution.expandAndSimplify(equivalencies)]

			# If we have power terms, we can only solve the equation if these are all the same kind of power.
			# Later, we can detect cubics and quartics and solve them, but the formulae for those are very complicated.
			# So we'll stick with quadratics for now.
			seenPower = null
			powerFactors = []
			# Loop through the powers and figure out what the power is.
			# While we're here, store the non-power factors.
			for term in powerTerms
				if term instanceof Pow
					unless seenPower?
						seenPower = term.children.right
						powerFactors.push(new terminals.Constant("1"))
					else
						# Have we seen this power?
						if seenPower.equals(term.children.right, equivalencies)
							# We know the base of this power is our variable, so the factor here is 1.
							powerFactors.push(new terminals.Constant("1"))
						else
							# Can't solve yet!
							throw new AlgebraError(expr.toString(), variable, "(can't solve polynomials of degree > 2 yet)")
				else
					# Must be a Mul.
					# One child should be a Pow which contains the variable, so let's find that and add everything else to powerFactors.
					mulFactors = []
					for child in term.children
						if child instanceof Pow and child.containsVariable(variable, equivalencies)
							unless seenPower?
								seenPower = child.children.right
								mulFactors.push(new terminals.Constant("1"))
							else
								if seenPower.equals(child.children.right, equivalencies)
									mulFactors.push(new terminals.Constant("1"))
								else
									throw new AlgebraError(expr.toString(), variable, "(can't solve polynomials of degree > 2 yet)")
						else
							mulFactors.push(child)
					powerFactors.push(new Mul(mulFactors...))

			# If we got this far, we can almost solve this.
			# If we have linear terms and powers that aren't 2, we can't solve (yet).
			if linearTerms.length > 0 and seenPower.evaluate() != 2
				throw new AlgebraError(expr.toString(), variable, "(can't solve polynomials of degree > 2 yet)")

			# We can solve it!
			if linearTerms.length > 0
				# Quadratic! :D
				# a x**2 + b x + c = 0
				# (-b +- sqrt(b**2 - 4 a c))/(2a)
				a = new Add(powerFactors...)
				b = new Add(getLinearFactors(linearTerms, variable, equivalencies)...)
				c = if independentTerms.length then new Add(independentTerms...) else new terminals.Constant("0")
				discriminant = new Pow(new Add(new Pow(b.copy(), "2"), new Mul("-4", a.copy(), c)), new Pow("2", "-1"))
				discriminantSide = new Mul(discriminant, new Pow(new Mul("2", a), "-1"))
				leftSide = new Mul("-1", b, new Pow(new Mul("2", a), "-1"))
				return [(new Add(leftSide.copy(), discriminantSide.copy())).expandAndSimplify(), (new Add(leftSide, new Mul("-1", discriminantSide))).expandAndSimplify()]
			else
				# This is easy to solve now. We have 0 = z + a * x**n, so the solution is (-z/a)**(1/n) = (-z/a)**(n**(-1)).
				if independentTerms.length # Do we have some terms on the other side?
					negativeIndependents = new Mul("-1", new Add(independentTerms...)) # -z
				else
					negativeIndependents = new terminals.Constant("0")

				reciprocal = if powerFactors.length then new Pow(new Add(powerFactors...), "-1") else new terminals.Constant("1") # 1/a
				product = new Mul(negativeIndependents, reciprocal) # -z/a
				root = new Pow(seenPower, "-1") # 1/n
				solution = new Pow(product, root) # (-z/a)**(1/n)

				# The only catch is if the power is even, in which case we get two solutions.
				if seenPower.evaluate?(equivalencies) and seenPower.evaluate(equivalencies)%2 == 0
					return [solution.expandAndSimplify(equivalencies), (new Mul("-1", solution)).expandAndSimplify(equivalencies)]
				else
					return [solution.expandAndSimplify(equivalencies)]

			throw new AlgebraError(expr.toString(), variable, " (reached end with no solution)")

		# Get all variable labels used in children of this node.
		#
		# @return [Array<String>] A list of all labels of variables in children of this node.
		getAllVariables: ->
			variables = {}
			for child in @children
				if child instanceof terminals.Variable
					variables[child.label] = true
				else if child.getAllVariables?
					childVariables = child.getAllVariables()
					for variable in childVariables
						variables[variable] = true

			outVariables = []
			for variable of variables
				outVariables.push(variable)

			return outVariables

		# Replace variable labels.
		#
		# @param replacements [Object] A map of variable labels to their replacement labels.
		# @return [Add] This node with variable labels replaced.
		replaceVariables: (replacements) ->
			children = []
			for child, index in @children
				if child instanceof terminals.Variable and child.label of replacements
					children.push(child.copy())
					children[index].label = replacements[child.label]
				else if child.replaceVariables?
					children.push(child.replaceVariables(replacements))
				else
					children.push(child.copy())

			return new Add(children...)

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
				unless substitutions[variable].copy? # All nodes and terminals should implement this.
					substitutions[variable] = new terminals.Constant(substitutions[variable])

			children = []
			for child in @children
				if child instanceof terminals.Variable
					variableEquivalencies = if child.label of equivalencies then equivalencies[child.label] else [child.label]
					subbed = false
					for equiv in variableEquivalencies
						if equiv of substitutions
							children.push(substitutions[equiv].copy())
							subbed = true
							break
					unless subbed
						children.push(child.copy())
				else if child.sub?
					children.push(child.sub(substitutions, uncertaintySubstitutions, equivalencies, assumeZeroUncertainty, evaluateSymbolicConstants))
				else
					children.push(child.copy())

			newAdd = new Add(children...)
			newAdd = newAdd.expandAndSimplify(equivalencies)
			return newAdd

		# Convert this node into a drawing node.
		#
		# @return [DrawingNode] A drawing node representing this node.
		toDrawingNode: ->
			AddNode = prettyRender.Add
			return AddNode.makeWithBrackets(@children.map((term) -> term.toDrawingNode())...)

		# Differentiate this node with respect to a variable.
		#
		# @param variable [String] The label of the variable to differentiate with respect to.
		# @param equivalencies [Object] Optional. A map of variable labels to a list of equivalent variable labels.
		# @return [BasicNode, Terminal] This node differentiated with respect to the given variable.
		differentiate: (variable, equivalencies={}) ->
			newChildren = @children.map (x) -> x.differentiate(variable, equivalencies)

			derivative = new Add(newChildren...)

			return derivative.expandAndSimplify(equivalencies)

		# Check if this node contains a given variable.
		#
		# @param variable [String] The label of the variable to differentiate with respect to.
		# @param equivalencies [Object] Optional. A map of variable labels to a list of equivalent variable labels.
		# @return [Boolean] Whether or not this node contains the given variable.
		containsVariable: (variable, equivalencies={}) ->
			for child in @children
				if child.containsVariable(variable, equivalencies)
					return true
			return false
		
		@approx: (a, b) -> a + b

	return Add
