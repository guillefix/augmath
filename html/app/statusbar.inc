	<script type="text/javascript">

		function updateStatusbar() {

			$.ajax({
			    url: 'statusbar_info.xhtml?' + new Date().getTime(),
			    type: 'GET',
			    dataType: 'text',
			    timeout: 6000,
			    error: function(){
			    },
			    success: function(data){
				$("#statusbarRight").html(data);			
			    },
			    complete: function() {
				setTimeout("updateStatusbar();", 3000);
			    }
			});
/*
$.get("statusbar_info.xhtml", function(data){
  $("#statusbarRight").html(data);
  setTimeout("updateStatusbar();",1000);
});
*/


		}
	</script>


<div id="statusbar">
<div id="statusbarLeft"><a href="start.xhtml" target="content"><span style="font-size: 20px; color: white; text-shadow: 1px 1px 0px #000;
"><b><i>PAW Server</i></b></span></a><br><span style="position: relative; top: -4px; left: +5px;">Android Version <i><span id="pawVersion"></span></i></span></div><div id="statusbarRight"></div>
</div>

