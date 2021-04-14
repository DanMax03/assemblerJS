function get_ds_bytes()
{
	var ds_bytes = [];
	var n_lines = Math.trunc((DATA_PAGE + 15) / 16); // количество строк
	for(var i = 0; i < n_lines; ++i){
		var len = i == n_lines - 1 ? data.length - i * 16 : 16;	// длина текущей строки
		var s = '';
		for(var j = 0; j < len; ++j){
			s += hex(data[i * 16 + j], 1) + (j == 7 ? '  ' : ' ');
		}
		ds_bytes.push(s.substring(0, s.length - 1));
	}
	return ds_bytes.join('\n');
}	

function get_ds_text() // $ds_text
{
	var ds_text = [];
	var n_lines = Math.trunc((DATA_PAGE + 15) / 16); // количество строк
	for(var i = 0; i < n_lines; ++i){
		var len = i == n_lines - 1 ? data.length - i * 16 : 16;	// длина текущей строки
		var s = '';
		for(var j = 0; j < len; ++j){
			var b = data[i * 16 + j];
			var c = String.fromCharCode(b);
			s += c >= ' ' && c <= '~' ? c : '.';
		}
		ds_text.push(s);
	}
	return ds_text.join('\n');
}

function set_ds_text(s)
{
	s = s.split('\n');
	var res = []
	for(var i in s){
		for(var j = 0; j < s[i].length; j += 16){
			var q = s[i].substring(j, j + 16);
			for(var k = 0; k < 16; ++k){
				if(res.length >= DATA_PAGE) break;
				if(k < q.length){
					if(q[k] == '.')
						res.push(data[res.length]);
					else
						res.push(q.charCodeAt(k));
				}else
					res.push(0);
			}
		}
	}
	while(res.length < DATA_PAGE)
		res.push(0);
	data = res;
}

function set_ds_bytes(s)
{	
	function chr(c){return c.charCodeAt(0);}
	
	function val(c)
	{
		if(c < '0') return 0;
		if(c > 'f') return 0;
		if(c <= '9') return chr(c) - chr('0');
		if(c >= 'a') return chr(c) - chr('a') + 10;
		return 0;
	}
	
	s = s.split('\n');
	var res = []
	for(var i in s){
		for(var j = 0; j < s[i].length; j += 48){
			var q = s[i].substring(j * 16, j * 16 + 48).toLowerCase();
			while(q.length < 48) q += '0';
			for(var k = 0; k < 16; ++k){
				if(res.length >= DATA_PAGE) break;
				var l = k < 8 ? 3 * k : 3 * k + 1;
				res.push(val(q[l]) * 16 + val(q[l + 1]));
			}
			
		}
	}
	data = res;
}

$('textarea#ds_bytes').val(get_ds_bytes());
$('textarea#ds_text').val(get_ds_text());

$('textarea#ds_bytes').on('change', function(){
	set_ds_bytes($(this).val());
	$('textarea#ds_bytes').val(get_ds_bytes());
	$('textarea#ds_text').val(get_ds_text());
});

$('textarea#ds_text').on('change', function(){
	set_ds_text($(this).val());
	$('textarea#ds_bytes').val(get_ds_bytes());
	$('textarea#ds_text').val(get_ds_text());
});

