define [
	"nodes"
	"terminals"
	"operators"
	"require"
], (nodes, terminals, operators, require) ->

	# Get the uncertainty of a node.
	#
	# @return [BasicNode] The propagated uncertainty of this node.
	nodes.BasicNode.prototype.getUncertainty = ->
		Mul = operators.Mul
		Pow = operators.Pow
		Add = operators.Add
		Uncertainty = terminals.Uncertainty
		Constant = terminals.Constant

		variables = @getAllVariables()
		out = []
		for variable in variables
			stuff = new Mul(new terminals.Uncertainty(variable), @differentiate(variable))
			out.push(new Pow(stuff, 2))

		return new Pow(new Add(out...), new terminals.Constant(1,2)).expandAndSimplify()
