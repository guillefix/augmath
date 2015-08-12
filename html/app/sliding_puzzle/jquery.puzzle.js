// Here, we are going to define the jQuery puzzle
// plugin that will create the interface for each
// DIV that contains an image.
jQuery.fn.puzzle = function( intUserSize ){
			
	// Make sure that each of the parent elements
	// has a nested IMG tag. We don't want elements
	// that lack the image. Once we get those, then
	// loop over them to initialize functionality.
	return this.filter( ":has( img )" ).each(
		
		function( intI ){
			
			// This is the functionality that will initialize 
			// the container and img for puzzle. This will only
			// be called ONCE the image has been loaded, and once
			// per each instance of the target puzzle.
			function InitPuzzle(){
				var jPiece = null;
				var intRowIndex, intColIndex, intI = 0;
				
				// Get the number of columns and rows.
				intColumns = Math.floor( jImg.width() / intSize );
				intRows = Math.floor( jImg.height() / intSize );
				
				// Get the puzzle width and height based on 
				// the number of pieces (this may require some 
				// cropping of the image).
				intPuzzleWidth = (intColumns * intSize);
				intPuzzleHeight = (intRows * intSize);
				
				// Empty the container element. We don't actually
				// want the image inside of it (or any of the 
				// other elements that might be there).
				jContainer.empty();
			
				// Set the container CSS and dimensions.
				jContainer 
					.css(
						{
							border: "1px solid black",
							overflow: "hidden",
							display: "block"
						}
						)
					.width( intPuzzleWidth )
					.height( intPuzzleHeight )
				;
				
				// Check to see how the container is positioned.
				// If is relative or absolute, we can keep it, 
				// but if it is not those, then we need to set 
				// is to relative explicitly.
				if (
					(jContainer.css( "position" ) != "relative") &&
					(jContainer.css( "position" ) != "absolute")
					){
					
					// The container element is not explicitly 
					// positioned, so position it to be relative.
					jContainer.css( "position", "relative" );
					
				}
				
				
				// Loop over the columns and row to create each 
				// of the pieces. At this point, we are not going to worry
				// about the dimensions of the board - that will happen next.
				for (var intRowIndex = 0 ; intRowIndex < intRows ; intRowIndex++){
				
					// For this row, add a new array.
					arr2DBoard[ intRowIndex ] = [];
				
					for (var intColIndex = 0 ; intColIndex < intColumns ; intColIndex++){
					
						// Create a new Div tag. We are using a DIV tag as
						// opposed to an anchor tag to get around the IE
						// bug that has flickering background images on links
						// when the browser is not caching images.
						jPiece = $( "<div><br /></div>" );
						
						// Set the css properties. Since all of the 
						// pieces have the same background image, they
						// all have to have different offset positions.
						jPiece
							.css( 
								{
									display: "block",
									float: "left",
									cursor: "pointer",
									backgroundImage: "url( '" + jImg.attr( "src" ) + "' )",
									backgroundRepeat: "no-repeat",
									backgroundPosition: (
										(intColIndex * -intSize) + "px " + 
										(intRowIndex * -intSize) + "px"
										),
									position: "absolute",
									top: ((intSize * intRowIndex) + "px"),
									left: ((intSize * intColIndex) + "px")
								}
								)
							.width( intSize )
							.height( intSize )
						;
						
						// Set the HREF so that the click even registers.
						// Then, set up the click handler.
						jPiece
							.attr( "href", "javascript:void( 0 );" )
							.click( PieceClickHandler )
						;
						
						// Add the piece to the 2-D representation of the board.
						arr2DBoard[ intRowIndex ][ intColIndex ] = jPiece;
						
						// Add to DOM.
						jContainer.append( jPiece );
																					
					}
				}
				
				
				// Make the last one opaque and give it a special "rel" 
				// value so that we can easily loacate this one later on.
				arr2DBoard[ intRows - 1 ][ intColumns - 1 ]
					.css( "opacity", 0 )
					.attr( "rel", "empty" )
				;
				
				
				// In order to shuffle the board, we are going to simulate 
				// a certain number of clicks. This is to ensure that any
				// state the board gets into, it is certain that the board
				// can get back into a "winning" state.
				for (intI = 0 ; intI < 100 ; intI++){
					
					// Select the piece that we want to "click".
					// We will do this by randomly selecting a row
					// and a column to click.
					jPiece = arr2DBoard[
						(Math.floor( Math.random() * intRows * intRows ) % intRows)
						][
						(Math.floor( Math.random() * intColumns * intColumns ) % intColumns)
						];
				
					// Simulate the click.
					jPiece.click();
				}
				
				
				// Now that we have initialized, turn on the animation.
				blnShowAnimation = true;
				
				// Return out.
				return( true );
			}
			
			
			// This sets up the click handler for the pieces.
			function PieceClickHandler( objEvent ){
				// Get the jQuery objects for the piece clicked as
				// well as the empty square within the board.
				var jPiece = $( this );
				var jEmpty = jContainer.find( "div[ rel = 'empty' ]" );
				
				// Get the CSS position for the current piece.
				var objPiecePos = { 
					top: parseInt( jPiece.css( "top" ) ),
					left: parseInt( jPiece.css( "left" ) )
					};
					
				// Get the CSS position for the empty piece
				var objEmptyPos = { 
					top: parseInt( jEmpty.css( "top" ) ),
					left: parseInt( jEmpty.css( "left" ) )
					};
			
				var intRowIndex, intColIndex = 0;
				
				
				// Check to see if we are in the middle of an animation.
				// If we are, then just return out since we don't want
				// to update values yet.
				if (blnInAnimation){
					return( false );
				}
				
				
				// Blur the current piece to get rid of the dotted box.
				jPiece.blur();
				
				// Base on the CSS of the current piece and the size of
				// each of the pieces, we can calculate the row and column
				// of the given piece.
				objPiecePos.row = (objPiecePos.top / intSize);
				objPiecePos.col = (objPiecePos.left / intSize);
				
				// Base on the CSS of the empty piece and the size of
				// each of the pieces, we can calculate the row and column
				// of the given piece.
				objEmptyPos.row = (objEmptyPos.top / intSize);
				objEmptyPos.col = (objEmptyPos.left / intSize);
				
				
				// Now that we have the row and column of the target piece
				// as well as the empty piece, we can check to see if anything
				// needs to be moved. Remember, we ONLY need to move pieces
				// if the target piece and the empty piece share a row
				// or a column.
				
				// Check to see if they share the same row.
				if (objPiecePos.row == objEmptyPos.row){
				
					// Check to see which direction we are moving in.
					if (objPiecePos.col > objEmptyPos.col){
				
						// Move left.
						for (intColIndex = objEmptyPos.col ; intColIndex < objPiecePos.col ; intColIndex++){
							arr2DBoard[ objPiecePos.row ][ intColIndex ] = arr2DBoard[ objPiecePos.row ][ intColIndex + 1 ];									
						}
						
						// Put empty in place.
						arr2DBoard[ objPiecePos.row ][ intColIndex ] = jEmpty;
					
					} else {
					
						// Move right.
						for (intColIndex = objEmptyPos.col ; intColIndex > objPiecePos.col ; intColIndex--){
							arr2DBoard[ objPiecePos.row ][ intColIndex ] = arr2DBoard[ objPiecePos.row ][ intColIndex - 1 ];									
						}
						
						// Put empty in place.
						arr2DBoard[ objPiecePos.row ][ intColIndex ] = jEmpty;
					
					}
					
					
					// Update the CSS of the entire row (to make it easy).
					for (intColIndex = 0 ; intColIndex < intColumns ; intColIndex++){
						
						if (blnShowAnimation){
						
							// Flag that an animation is about to being.
							blnInAnimation = true;
						
							// Animate the CSS move.
							arr2DBoard[ objPiecePos.row ][ intColIndex ].animate(
								{
									left:  ((intSize * intColIndex) + "px")
								},
								200,
								function(){
									blnInAnimation = false;
								}
								);
								
						} else {
						
							// Update the CSS for the given piece.
							arr2DBoard[ objPiecePos.row ][ intColIndex ].css(
								"left", 
								((intSize * intColIndex) + "px")
								);
								
						}
						
					}
					
					
				// Check to see if we should move vertically.
				} else if (objPiecePos.col == objEmptyPos.col){
				
					// Check to see which direction we are moving in.
					if (objPiecePos.row > objEmptyPos.row){
				
						// Move up.
						for (intRowIndex = objEmptyPos.row ; intRowIndex < objPiecePos.row ; intRowIndex++){
							arr2DBoard[ intRowIndex ][ objPiecePos.col ] = arr2DBoard[ intRowIndex + 1 ][ objPiecePos.col ];									
						}
						
						// Put empty in place.
						arr2DBoard[ intRowIndex ][ objPiecePos.col ] = jEmpty;
					
					} else {
					
						// Move down.
						for (intRowIndex = objEmptyPos.row ; intRowIndex > objPiecePos.row ; intRowIndex--){
							arr2DBoard[ intRowIndex ][ objPiecePos.col ] = arr2DBoard[ intRowIndex - 1 ][ objPiecePos.col ];									
						}
						
						// Put empty in place.
						arr2DBoard[ intRowIndex ][ objPiecePos.col ] = jEmpty;
					
					}
					
					
					// Update the CSS of the entire column (to make it easy).
					for (intRowIndex = 0 ; intRowIndex < intRows ; intRowIndex++){
						
						if (blnShowAnimation){
						
							// Flag that an animation is about to being.
							blnInAnimation = true;
						
							// Animate the CSS move.
							arr2DBoard[ intRowIndex ][ objPiecePos.col ].animate(
								{
									top: ((intSize * intRowIndex) + "px")
								},
								200,
								function(){
									blnInAnimation = false;
								}
								);
							
						} else {
							
							// Update the CSS for the given piece.
							arr2DBoard[ intRowIndex ][ objPiecePos.col ].css(
								"top", 
								((intSize * intRowIndex) + "px")
								);
						
						}
						
					}
					
				
				}
				
				
				// Return false so nothing happens.
				return( false );
			}
		
		
		
			// ASSERT: At this point, we have defined all the class
			// methods for this plugin instance. Now, we can act on
			// the instance properties and call methods.				
		
		
			// Get a jQUery reference to the container.
			var jContainer = $( this );
			
			// Get a jQuery reference to the first image 
			// - this is the one that we will use to make 
			// the image puzzle.
			var jImg = jContainer.find( "img:first" );
		
			// This is the array that will hold the 2-dimentional 
			// representation of the board.
			var arr2DBoard = [];
		
			// The height and width of the puzzle.
			var intPuzzleWidth = 0;
			var intPuzzleHeight = 0;
		
			// The width / height of each piece. This can be overriden
			// by the user when the initialize the puzzle plug-in.
			var intSize = intUserSize || 100;
			
			// The number of columns that are in the board.
			var intColumns = 0;
			
			// The number of rows that in the board.
			var intRows = 0;
			
			// Flag for wether or not to show animation.
			var blnShowAnimation = false;
			
			// Flag for wether or not an animation is in the midst. We
			// are going to need this to prevent further clicking during
			// and anmiation sequence.
			var blnInAnimation = false;
				
			
			// Check check to make sure that the size value is valid.
			// Since this can be overridden by the user, we want to 
			// make sure that it is not crazy.
			intSize = Math.floor( intSize );
			
			if ((intSize < 40) || (intSize > 200)){
				intSize = 100;
			}
						
			// Check to see if the image has complietely 
			// loaded (for some reason, this does NOT 
			// work with the attr() function). If the 
			// image is complete, call Init right away. 
			// If it has not loaded, then set an onload 
			// handler for initialization.
			if ( jImg[ 0 ].complete ){
				
				// The image has loaded so call Init.
				InitPuzzle();
			
			} else {
			
				// The image has not loaded so set an
				// onload event handler to call Init.
				jImg.load(
					function(){
						InitPuzzle();
					}
					);
			
			}
		}							
		
		);
}