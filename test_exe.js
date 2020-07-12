$('fieldset.test_exe input[type=submit]').on('click', function(key){
	var fieldset = this.closest('fieldset');
	var action = $(fieldset).attr('action');
	var task_id = $('#task_id').val();
	$.post(action, {task_id: task_id, cs: exe, ds: data}, function(result){
		result = JSON.parse(result);
		console.log(result);
		var tbody = $('div.segment.test table > tbody');
		tbody.empty();
		for(var i in result){
			var test = result[i];
			var tr_class = test.status == 'OK' ? '' : 'err';
			// N  input  expected  got  status
			if(test.show)
				tbody.append("<tr class='" + tr_class + "'><td>" + i + '</td><td><pre>' + test.input + '</pre></td><td><pre>' + test.expected + '</pre></td><td><pre>' + test.got + '</pre></td><td>' + test.status + '</td></tr>');
			else
				tbody.append("<tr class='" + tr_class + "'><td>" + i + '</td><td></td><td></td><td></td><td>' + test.status + '</td></tr>');
	}

	});
});

