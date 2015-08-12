  var player_html = '<object type="application/x-shockwave-flash" data="swf/player_mp3_multi.swf" width="650" height="250">    <param name="movie" value="swf/player_mp3_multi.swf" ><param name="FlashVars" value="playlist=playlist.xhtml?albumId=@ID&amp;width=650&amp;height=250&amp;bgcolor1=7c7c7c&amp;buttonovercolor=000000&amp;showvolume=1&amp;currentmp3color=ffff00&amp;slidercolor1=ffffff&amp;slidercolor2=ffffff&amp;sliderovercolor=ffffff" /></object>';

  var current = 0;

  $(document).ready( function(){
        $( '#flip' ).jcoverflip({
          current: 2,
          beforeCss: function( el, container, offset ){
            return [
              $.jcoverflip.animationElement( el, { left: ( container.width( )/2 - 210 - 110*offset + 20*offset )+'px', bottom: '20px' }, { } ),
              $.jcoverflip.animationElement( el.find( 'img' ), { width: Math.max(10,100-20*offset*offset) + 'px' }, {} )
            ];
          },
          afterCss: function( el, container, offset ){
            return [
              $.jcoverflip.animationElement( el, { left: ( container.width( )/2 + 110 + 110*offset )+'px', bottom: '20px' }, { } ),
              $.jcoverflip.animationElement( el.find( 'img' ), { width: Math.max(10,100-20*offset*offset) + 'px' }, {} )
            ];
          },
          currentCss: function( el, container ){
            return [
              $.jcoverflip.animationElement( el, { left: ( container.width( )/2 - 100 )+'px', bottom: 0 }, { } ),
              $.jcoverflip.animationElement( el.find( 'img' ), { width: '200px' }, { } )
            ];
          },
          change: function(event, ui){
		$('#scrollbar').slider('value', ui.to);
          }
		  
        });
        
        $('#scrollbar').slider({
	   slide: function(event, ui) {
			$('#flip').jcoverflip('current', ui.value );
	   }
        });
		
		if($('#flip' ).jcoverflip('length') > 0) {
			// Init scrollbar
			$('#scrollbar').slider("option", "min", 0);
			$('#scrollbar').slider("option", "max", $('#flip').jcoverflip('length')-1);
			$('#scrollbar').slider('value', Math.round($('#flip' ).jcoverflip('length') / 2)-1);

			// Init the player
			var pos = Math.round($('#flip' ).jcoverflip('length') / 2) - 1;
			$("#flip").jcoverflip("current", pos);
			initPlayer(pos, $("#album_" + pos).attr("albumId"));
			current = pos;
		}
		else {
			$('#scrollbar').slider("option", "min", 0);
			$('#scrollbar').slider("option", "max", 0);
			showNoAlbums();
		}
      });
	  
	  function initPlayer(pos, id) {
		var nHtml = player_html.replace("@ID", id);
		$("#player").html(nHtml);
		current = pos;
	  }

	function showCurrent() {
		$('#flip').jcoverflip('current', current);
  		$('#scrollbar').slider('value', current);
	}

