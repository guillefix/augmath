define ->

	# Compare two values, nodes, or terminals to get an order.
	#
	# @param a [BasicNode, Terminal] The first item to compare.
	# @param b [BasicNode, Terminal] The second item to compare.
	# @return [Number] -1 if a < b, 0 if a = b, 1 if a > b.
	return compare = (a, b) ->
		###
		Order:
		-6: Constants, by value
		-5: Symbolic constants, by label
		-4: Variables, by label
		-3: Power nodes, by base
		-2: Multiplication nodes, by first child
		-1: Addition nodes, by first child
		###

		if a.cmp? and b.cmp?
			if a.cmp == b.cmp
				return a.compareSameType(b)
			else
				return (a.cmp-b.cmp)/Math.abs(a.cmp-b.cmp)
		else
			return 0