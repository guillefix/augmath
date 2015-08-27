define ["operators/Add", "operators/Mul", "operators/Pow"], (Add, Mul, Pow) ->

	# API for operator nodes of the expression tree.

	return {

		Add: Add

		Mul: Mul

		Pow: Pow

	}