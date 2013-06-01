$(document).ready(function(){
	$('#wtp-instant-search').typeahead({
		limit: 10,
		prefetch: {
			url: '/json/wtp-petitions.json',
			filter: function(respData) {
				var presuggestions = new Array();
				//console.log(respData);
				$.each(respData, function(key, val){
					var predatum = new Array();
					// console.log(val);
					predatum['value'] = val.value;
					var sigc = val.signatureCount + '';
					var sign = val.signaturesNeeded + '';
					predatum['signatureCount'] = sigc.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
					predatum['signaturesNeeded'] = sign.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
					var now = new Date(1000*val.deadline);
					var curr_date = now.getDate();
					var curr_month = now.getMonth();
					curr_month++;
					var curr_year = now.getFullYear();
					predatum['deadline'] = curr_month + "/" + curr_date + "/" + curr_year;
					predatum['id'] = val.id;
					//console.log(predatum);
					presuggestions.push(predatum);
				})	 
				return presuggestions;				
			}
		},
		remote: {
			url: 'https://api.whitehouse.gov/v1/petitions.jsonp?title=%QUERY',
			dataType: 'jsonp',
			cache: false,
			rateLimitWait: 100,
			filter: function(respData) {
				var suggestions = new Array();
				$.each(respData.results, function(key, val){
					var datum = new Array();
					datum['value'] = val.title;
					datum['signatureCount'] = val.signatureCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");;
					datum['signaturesNeeded'] = val.signaturesNeeded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");;
					var now = new Date(1000*val.deadline);
					var curr_date = now.getDate();
					var curr_month = now.getMonth();
					curr_month++;
					var curr_year = now.getFullYear();
					datum['deadline'] = curr_month + "/" + curr_date + "/" + curr_year;
					datum['id'] = val.id;
					suggestions.push(datum);
				})	 
				return suggestions;
			}
		},
		template: '<p>{{value}}<br><em>{{signatureCount}} signatures &ndash; {{signaturesNeeded}} needed by {{deadline}}</em></p>',
		engine: Hogan
	});

	$('#wtp-instant-search').on('typeahead:selected', function($e, data) {
		$('#wtp-petition-detail').html('Loading...');
		$.ajax({
		  url: 'https://api.whitehouse.gov/v1/petitions/'+data.id+'.jsonp',
		  dataType: 'jsonp',
		  success: function(data) {

		  	if (data.results[0].status!='closed') {
		  		$('#wtp-petition-detail').html("<h3><a href='"+data.results[0].url+"' target='_blank'>"+data.results[0].title+"</a></h3>");
		  	} else {
		  		$('#wtp-petition-detail').html("<h3>"+data.results[0].title+"</h3>");
		  	}
			$('#wtp-petition-detail').append("<p>"+data.results[0].body+"</p>");
			// console.log(data);
			$('#wtp-petition-detail').append("<h4>Signatures</h4><p>");
			var sigc = data.results[0].signatureCount + '';
			var sign = data.results[0].signaturesNeeded + '';
			var sigt = data.results[0].signatureThreshold + '';
			var now = new Date(1000*data.results[0].deadline);
			var curr_date = now.getDate();
			var curr_month = now.getMonth();
			curr_month++;
			var curr_year = now.getFullYear();
			$('#wtp-petition-detail').append( sigc.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' received &mdash; ' + sign.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' needed by ' + curr_month + "/" + curr_date + "/" + curr_year + '<br><em>Threshold: '+sigt.replace(/\B(?=(\d{3})+(?!\d))/g, ",") +'</em>');
			$('#wtp-petition-detail').append("</p>");
			$('#wtp-petition-detail').append("<h4>Issues</h4><ul>");
			$.each(data.results[0].issues, function(key, val) {
				$('#wtp-petition-detail').append("<li>"+val.name+"</li>");
			})
			$('#wtp-petition-detail').append("</ul>");

			$('#wtp-petition-detail').append("<span id='wtp-sentiment'><h4>Finding sentiment...</h4></span>");
			get_sentiment(data.results[0].id);




		  }
		})

	})

	// $('#wtp-instant-search').on('typeahead:opened', function($e, data) {
	// 	$('#wtp-petition-detail').html('');
	// })	

});


function get_sentiment(pid) {

	var showmap = 0;

	$.ajax({
	  url: 'http://wetheentities.herokuapp.com/petitions/'+pid+'.js',
	  dataType: 'jsonp',
	  success: function(data) {

		var html_out = "<h4 class='wtp-"+data.semantria.sentiment_polarity+" wtp-camel'>Overall "+data.semantria.sentiment_polarity+" Sentiment</h4><ul>";

		$.each(data.semantria.themes, function(key, val) {
			html_out += "<li class='wtp-"+val.sentiment_polarity+"'>"+val.title+"</li>";
		});	
		html_out += "</ul>";
		$('#wtp-sentiment').html(html_out);

	    for(var key in data.open_calais) {
	        var value = data.open_calais[key];
	        if(value._typeGroup == 'entities') {
	            var entity = value;
	            if(entity._type == 'Country' || entity._type == 'City') {
	                if(entity.resolutions) {
						showmap = 1;
	                }
	            }
	        }
	    }

	    if (showmap) {
			$('#wtp-petition-detail').prepend('<iframe src="http://heyitsgarrett.com/wethevisualization/?id='+pid+'" frameborder="0" width="50%" height="600" style="float:right;margin-left:20px;"></iframe>')

	    }
		// console.log(data);


	  }
	})



}