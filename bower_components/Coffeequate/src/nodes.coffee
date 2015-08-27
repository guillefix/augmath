define ->

	# Template for nodes in the expression tree. All non-terminal nodes inherit from this.
	class BasicNode

		# Make a new node.
		#
		# @param label [String] The label of this node.
		# @return [BasicNode] A new BasicNode.
		constructor: (@label) ->

		# Return an array of children.
		#
		# @return [Array<BasicNode>, Array<Terminal>] An array of children of this node.
		getChildren: ->
			return []

		# Get the labels of all variables involved in this node.
		#
		# @return [Array<String>]
		getAllVariables: ->
			return []

		# Convert this node into a drawing node for output.
		#
		# @throw [Error] Not implemented.
		toDrawingNode: ->
			throw new Error("toDrawingNode not implemented for #{self.toString()}")

		# Convert this node into a LaTeX string.
		#
		# @return [String] A LaTeX representation of this node.
		toLaTeX: ->
			return @toDrawingNode().renderLaTeX()

		# Convert this node into a string.
		#
		# @return [String] A string representation of this node.
		toString: ->
			return @toDrawingNode().renderString()

		# Convert this node into a MathML string.
		#
		# @return [String] A MathML representation of this node.
		toMathML: ->
			@toDrawingNode().renderMathML()

		# Check if this node has the same string representation as another.
		#
		# @param other [BasicNode] A node to compare this node to.
		# @return [Boolean] Whether the two nodes have the same string representation.
		stringEqual: (other) ->
			return other.toString() == @toString()
		
		approx: ->
			f = @constructor.approx
			return @getChildren().map((c) -> c.approx()).reduce((a, b) -> f(a, b))

	# A node with any number of children.
	class RoseNode extends BasicNode

		# Make a new RoseNode.
		#
		# @param label [String] The label of this node.
		# @param children [Array<BasicNode>, Array<Terminal>] Optional. Children to add to this node.
		# @return [RoseNode] A new RoseNode.
		constructor: (label, @children=null) ->
			unless @children?
				@children = []

			super(label)

		# Return an array of all children of this node.
		#
		# @return [Array<BasicNode>, Array<Terminal>] An array of all children of this node.
		getChildren: ->
			@children

	# A node with exactly two children, a left and a right child.
	class BinaryNode extends BasicNode

			# Make a new BinaryNode.
			#
			# @param label [String] The label of this node.
			# @param left [BasicNode, Terminal] The left child of this node.
			# @param right [BasicNode, Terminal] The right child of this node.
			# @return [BinaryNode] A new BinaryNode.
			constructor: (@label, left, right) ->
				@children =
					left: left
					right: right

			# Return an array of children.
			#
			# @return [Array<BasicNode>, Array<Terminal>] An array containing both children of this node.
			getChildren: ->
				[@children.left, @children.right]

	return {

		BasicNode: BasicNode

		RoseNode: RoseNode

		BinaryNode: BinaryNode

	}
