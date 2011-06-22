<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html>
<head>
	<link href="static/style.css" type="text/css" rel="stylesheet" />
    <script src="static/jquery.min.js"></script>
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
	    function register_feed(feedUrl, element, seq, loop) {
           var req = {'action': 'register',
	    				'arguments': {
	    					'url': feedUrl,
	    					'sequence': seq
	    				}
	    			  }
			$.ajax({
	    		data: {'request': JSON.stringify(req)},
	    		dataType: 'json',
	    		success: function(result){
	    			if(result['action'] == "not supported") {
	    				// TODO: show user smth went wrong ...
                        loop();
                        return false;
	    			}
	    			if(result["error"] !== undefined) {
	    				//alert(result["error"]);
                        loop();
                        return false;
	    			}
	    			
	    			var sequence = result['sequence'];
                    element.find("#url").html(feedUrl).end();
                    element.find("#sequence").html(sequence).end();

	    			for(var entry in result['entry']) {
                        entry = result['entry'][result['entry'].length - entry - 1];
	    				var newdiv  = document.createElement('div'),
                            para    = document.createElement('p'),
							title   = document.createTextNode(entry['title']),
							imgNode = new Image();
                        para.appendChild(title);
                        para.setAttribute("class", "tweet_text");
						imgNode.src = entry['img'];
						newdiv.setAttribute('class', 'tweet');
						newdiv.appendChild(imgNode);
						newdiv.appendChild(para);
                        console.log(entry['title']);
                        if(element.find("div.tweet").length != 0) {
                            element.find("div.tweet:first").before(newdiv);
                        }
                        else {
                            element.append(newdiv);
                        }
	    			}
                    element.find("div.tweet").filter(':gt(' + 7 + ')').remove();
                    loop();
	    		}
			});
	    };
	    
		function refresh_feeds(side, loop) {
            var left_url = $("#left #url").html(),
                left_seq = $("#left #sequence").html(),
                right_url = $("#right #url").html(),
                right_seq = $("#right #sequence").html();
                
            if(side == "left" && left_url.length >= 37) {
                register_feed(left_url, $("#left"), left_seq, loop);
            }
            if(side == "right" && right_url.length >= 37) {
                register_feed(right_url, $("#right"), right_seq, loop);
            }
        }

		$(document).ready(function() {
            (function () {
                var interval = undefined;
                $("#left_btn").click(function () {                
                    if($(this).html() == "Remove") {
                        clearTimeout(interval);
                        $("#left .tweet").remove();
                        $(this).html("Submit");
                        $("#left #url").html("No url");
                        $("#left #sequence").html("0");
                        return false;
                    }
                    $("#welcome").hide();
                    var updateTimeout = (function () {
                        var myInterval = interval;
                        return (function () {
                            if (myInterval !== interval)
                                return;
                            myInterval = setTimeout (
                                    function () {
                                        refresh_feeds("left", updateTimeout);
                                    },
                                    3000);
                            interval = myInterval;
                        });
                    })();
                    var feed_keyword = $("#left_input").val();
                    //$("#left #spinner").fadeIn(1500).fadeOut(500);
                    // simple regex to check if user entered a keyword of a full link ...
                    if(feed_keyword.match("http://search.twitter.com/search.atom\.")) {
                        register_feed(feed_keyword, $("#left"), 0, updateTimeout);
                    }
                    else {
                        feed_keyword = "http://search.twitter.com/search.atom?q=%23" + feed_keyword;
                        register_feed(feed_keyword, $("#left"), 0, updateTimeout);
                    }
                    $(this).text("Remove");
                    return false;
                });
            })();
            
            (function () {
                var interval = undefined;
                $("#right_btn").click(function () {
                    if($(this).html() == "Remove") {
                        clearTimeout(interval);
                        $("#right .tweet").remove();
                        $(this).html("Submit");
                        $("#right #url").html("No url");
                        $("#right #sequence").html("0");
                        return false;
                    }
                    $("#welcome").hide();
                    var updateTimeout = (function () {
                        var myInterval = interval;
                        return (function () {
                            if (myInterval !== interval)
                                return;
                            myInterval = setTimeout (
                                    function () {
                                        refresh_feeds("right", updateTimeout);
                                    },
                                    3000);
                            interval = myInterval;
                        });
                    })();
                    var feed_keyword = $("#right_input").val();
                    //$(this).parent().find("#spinner").fadeIn(1000).fadeOut(500);
                    // simple regex to check if user entered a keyword of a full link ...
                    if(feed_keyword.match("http://search.twitter.com/search.atom\.")) {
                        register_feed(feed_keyword, $("#right"), 0, updateTimeout);
                    }
                    else {
                        feed_keyword = "http://search.twitter.com/search.atom?q=%23" + feed_keyword;
                        register_feed(feed_keyword, $("#right"), 0, updateTimeout);
                    }
                    $(this).text("Remove");
                    return false;
                });
            })();
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
                <span id="feedNumber">0</span>
                
				<input id = "left_input" type="text" value="cloud" /> 
				<button id = "left_btn" >Submit</button>
                <div id = "spinner">Query submited</div>

			</div>
			
			<div id="right">
                <span id="url"></span>
                <span id="sequence">0</span>
                <span id="feedNumber">0</span>
                
                <input id = "right_input" type="text" value="cloud" /> 
                <button id = "right_btn" >Submit</button>
                <div id = "spinner"></div>
			</div>
		
		<div style="clear:both;"></div>
		</div>
		
	<div style="clear:both;"></div>
	</div>
<div style="clear:both;"></div>
	

    
  </body>
</html>
