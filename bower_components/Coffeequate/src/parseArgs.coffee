define ["nodes", "parse", "terminals"], (nodes, parse, terminals) ->

	# Parse arguments for nodes.
	#
	# @param args... [Array<String>, Array<BasicNode>, Array<Terminal>, Array<Number>] An array of arguments to convert into the correct type for node children.
	# @return [Array<BasicNode>, Array<Terminal>] An array of parsed arguments.
	parseArgs = (args...) ->
		# Check arguments are valid children for operators, and convert args
		# which are of the wrong type (but we still recognise).
		# Args should be either Terminals, Nodes, strings (which will be converted
		# into Terminals), or floats (which will be converted into Constants).
		outArgs = []
		for arg in args
			if typeof(arg) == "string" or arg instanceof String
				outArgs.push(parse.stringToTerminal(arg))
			else if typeof(arg) == "number" or arg instanceof Number
				outArgs.push(new terminals.Constant(arg))
			else if arg instanceof terminals.Terminal or arg instanceof nodes.BasicNode or arg.isTerminal?
				outArgs.push(arg)
			else
				throw new Error("Invalid argument #{arg}, (#{typeof(arg)}), (#{arg.toString()})")

		return outArgs

	return parseArgs