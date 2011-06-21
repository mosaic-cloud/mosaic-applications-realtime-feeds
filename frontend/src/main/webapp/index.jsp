<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html>
<head>
	
    <script src="static/jquery.min.js"></script>
    <link href="static/style.css" type="text/css" rel="stylesheet" />
    
    
    
    <script type="text/javascript" >
   
	   
	    $.ajaxSetup({
	    	url: 'feeds'
		});
	     
	    function JSONCall(req) {
	    	alert(JSON.stringify(req));
	    }
	   
	    // 
	    // register feed function ... 
	    // 
	    function register_feed(feedUrl, element) {
            
			var req = {'action': 'register',
	    				'arguments': {
	    					'url': feedUrl,
	    					'sequence': "0"
	    				}
	    			  }
	    			  
			$.ajax({
	    		data: {'request': JSON.stringify(req)},
	    		dataType: 'json',
	    		success: function(result){
	    			
	    			if(result['action'] == "not supported") {
	    				// TODO: show user smth went wrong ...
                        return false;
	    			}
	    			
	    			if(result["error" != "undefined"]) {
	    				alert(result["error"]);
	    			}
	    			
	    			var sequence = result['sequence'];
                    element.find("#url").html(feedUrl).end();
                    element.find("#sequence").html(sequence).end();
                    
                    
	    			for(entry in result['entry']) {
	    				var newdiv  = document.createElement('div'),
                            para    = document.createElement('p'),
							title   = document.createTextNode(result['entry'][entry]['title']),
							imgNode = new Image();
	    				
                        para.appendChild(title);
                        para.setAttribute("class", "tweet_text");
						imgNode.src = result['entry'][entry]['img'];
						//newdiv.setAttribute('class', 'tweet_x');
						newdiv.setAttribute('class', 'tweet');
						
						newdiv.appendChild(imgNode);
						newdiv.appendChild(para);

						
						element.append(newdiv);
						//element.find("div.tweet_x").animate({
						//	opacity: 1
						//}, 3000);
						element.find("div.tweet").filter(':gt(' + 10 + ')').remove();
						//element.find("div.tweet_x").filter(':gt(' + 10 + ')').remove();
						//element.find("div.tweet_x").removeClass("tweet_x").addClass("tweet");
	    			}
	    		}
			});
	    };
	    
	    
        
	    
	    function refresh_feed(element) {
            var req = {'action': 'refresh',
	    				'arguments': {
	    					'url': element.find("#url").html(),
	    					'sequence': element.find("#sequence").html()
	    				}
	    			  }
	    			  
			
            
            $.ajax({
	    		data: {'request': JSON.stringify(req)},
	    		dataType: 'json',
	    		success: function(result){
	    		
	    			if(result['action'] == "not supported") {
	    				console.log("action not supported !!!");
                        return false;
	    			}
	    			var stat = result["error"];
	    			var sequence = result['sequence'];
	    			element.find("#sequence").text(sequence);
	    			
	    			for(entry in result['entry']) {
                       var newdiv  = document.createElement('div'),
                            para    = document.createElement('p'),
							title   = document.createTextNode(result['entry'][entry]['title']),
							imgNode = new Image();
	    				
                        para.appendChild(title);
                        para.setAttribute("class", "tweet_text");
						imgNode.src = result['entry'][entry]['img'];
						//newdiv.setAttribute('class', 'tweet_x');
						newdiv.setAttribute('class', 'tweet');
						
						newdiv.appendChild(imgNode);
						newdiv.appendChild(para);
                       
                       
	    				
						
						if(element.find("div.tweet")) {
							element.find("div.tweet").before(newdiv);
							//element.find("div.tweet_x").animate({
							//	opacity: 1
							//}, 3000);
							//element.find("div.tweet_x").removeClass("tweet_x").addClass("tweet");
						}
						element.append(newdiv);
						//element.find("div.tweet_x").filter(':gt(' + 10 + ')').remove();
						element.find("div.tweet").filter(':gt(' + 10 + ')').remove();
						//element.find("div.tweet_x").animate({
						//		opacity: 1,
						//		height: "+=20pt"
						//	}, 3000);
						//element.find("div.tweet_x").removeClass("tweet_x").addClass("tweet");
	    			}
	    		}
			});
	    };
		
		
		
		function refresh_feeds() {
            var left_url = $("#left #url").html(),
                left_seq = $("#left #sequence").html(),
                right_url = $("#right #url").html(),
                right_seq = $("#right #sequence").html();
            
            
            console.log();
            if(left_url.length >= 37) {
            	refresh_feed($("#left"));
            }
            
            if(right_url.length >= 37) {
                refresh_feed($("#right"));
            }
        }
		
		
		
		$(document).ready(function() {
			
			$("button").click(function() {
				$("#welcome").animate({
					opacity: 0,
					height: "0px"
				}, 500);
				//$("#welcome").hide("slow");
			});
			
			$("#left_btn").click(function () {
                
                if($(this).html() == "Remove") {
                    clearInterval(interval);
                    $("#left .tweet").remove();
                    $(this).html("Submit");
                    $("#left #url").html("No url");
                    $("#left #sequence").html("0");
                    return false;
                }
                
                var interval = setInterval(refresh_feeds, 3000);
                var feed_keyword = $("#left_input").val();
                
                // simple regex to check if user entered a keyword of a full link ...
                if(feed_keyword.match("http://search.twitter.com/search.atom\.")) {
                    register_feed(feed_keyword, $("#left"));
                }
                else {
                    feed_keyword = "http://search.twitter.com/search.atom?q=%23" + feed_keyword;
                    register_feed(feed_keyword, $("#left"));
                }
                $(this).text("Remove");
            });
            
            $("#right_btn").click(function () {
                
                if($(this).html() == "Remove") {
                    clearInterval(interval);
                    $("#right .tweet").remove();
                    $(this).html("Submit");
                    $("#right #url").html("No url");
                    $("#right #sequence").html("0");
                    return false;
                }
                //$("#right_input").attr("disabled", true);
                //$("#right_input").val($("#right_input").val() + " - " + $("#right #feedNumber").html());
                var interval = setInterval(refresh_feeds, 3000);
                var feed_keyword = $("#right_input").val();
                
                // simple regex to check if user entered a keyword of a full link ...
                if(feed_keyword.match("http://search.twitter.com/search.atom\.")) {
                    register_feed(feed_keyword, $("#right"));
                }
                else {
                    feed_keyword = "http://search.twitter.com/search.atom?q=%23" + feed_keyword;
                    register_feed(feed_keyword, $("#right"));
                }
                $(this).text("Remove");
            });
		});
		
	</script>

</head>
<body>

	<div id="wrapper">
		<div id="top">
			<div class="cls"></div>	
			<div id="logo">
				
			</div>
		</div>
		<div id="content">
			<div id="welcome">
                <p>Welcome to mOSAIC web 2.0 demo application :)</p>
                <p>To start off just enter a keyword in the input box below :)</p>
            </div>
            
			<div id="left">
                <span id="url"></span>
                <span id="sequence">0</span>
                
				<input id = "left_input" type="text" value="cloud" /> 
				<button id = "left_btn" >Submit</button>

			</div>
			
			<div id="right">
                <span id="url"></span>
                <span id="sequence">0</span>
                <span id="feedNumber">0</span>
                <input id = "right_input" type="text" value="cloud" /> 
                <button id = "right_btn" >Submit</button>
			</div>
		
		<div style="clear:both;"></div>
		</div>
		
	<div style="clear:both;"></div>
	</div>
<div style="clear:both;"></div>
	

    
  </body>
</html>
