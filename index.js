'use strict';

var lines = []; // {address, codes_str, codes_len, cmd_text, edited, err}
var offset = 0; // Строка программы, показывающаяся в первой строке на экране. Не менять!
var NOP = 0x90; // команда для вставки

function max(a, b){ return a > b ? a : b; }
function min(a, b){ return a < b ? a : b; }

function codes_TO_codes_str(codes)
{
	var codes_str = [];
	for(var i in codes){
		codes_str.push(hex(codes[i]));
	}
	return codes_str.join(' ');
}

function fill_line(i)
{
	i = 1*i;
	if(i > 0 && lines[i - 1] == undefined){ console.log('Почему-то предыдущей строки не существует'); return; }
	var address = i ? lines[i - 1].address + lines[i - 1].codes_len : address0;
	var res = disasm(address); // {address, codes_str, codes_len, cmd_text}
	res.edited = false;
	res.err = '';
	if(i == lines.length)
		lines.push(res);
	else if(i < lines.length){
		if(res.codes_len == lines[i].codes_len)
			lines[i] = res;	// нельзя поставить перед условием
		else{
			lines[i] = res;
			lines.splice(i + 1, lines.length);
			fill_table();
		}
	}else
		console.log('Попытка заполнить строку в отрыве от сущестрвующих');
}

function fill_tr(line)
{
	var i = line + offset;
	if(lines[i] == undefined)
		fill_line(i)

	var tr = $('tr[line=' + line + ']');
	tr.removeClass('edited');
	$('td.address', tr).text(hex(lines[i].address, 4));
	$('td.codes', tr).text(lines[i].codes_str);
	$('td.codes', tr).attr('len', lines[i].codes_len);
	$('td.asm input', tr).val(lines[i].cmd_text);
	$('td.err', tr).text(lines[i].err);
	if(lines[i].edited)
		tr.addClass('edited');
}

function fill_table()
{
	for(var line = 0; line < n_lines; ++line)
		fill_tr(line)
}

function exe_update(address, codes)
{
	address -= address0;
	for(var i in codes){
		exe[address] = codes[i];
		address++;
	}
}

function asmLine(arg) // {line, real because of Enter}
{
	var line = arg.line;
	var real = arg.real == undefined ? true : arg.real;
	
	var tr = $('tr[line=' + line + ']');
	var i = line + offset;
	var address = lines[i].address;
	var cmd_text = $('td.asm input', tr).val();

	var res = asm(address, cmd_text); // {address, err, codes, cmd_text}
	var codes_str = codes_TO_codes_str(res.codes);
	if(real){
		if(res.err == ''){
			exe_update(address, res.codes);
			fill_line(i);
			fill_tr(line);
		}else{
			$('td.err', tr).text(res.err);
			tr.addClass('edited');
			lines[i].edited = true;
			lines[i].err = res.err;
		}
	}else{
		if(res.err != '' || $('td.codes', tr).text() != codes_str)
			tr.addClass('edited');
	}
}

// {address, err, codes, cmd_text} -> {address, codes_str, codes_len, cmd_text}
function asm2line_format(a)
{
	return {address: a.address, codes_str: codes_TO_codes_str(a.codes), codes_len: a.codes.length, cmd_text: a.cmd_text, edited: false, err: ''};
}

function delete_tr(line)
{
	var tr = $('tr[line=' + line + ']');
	var i = line + offset
	var address = lines[i].address;
	var len = lines[i].codes_len;
	exe.splice(address - address0, len);
	for(var j = 0; j < len; ++j) exe.push(NOP);
	lines.splice(i, 1);
	// сдвигаем адреса у той команды, что встала на удалённое место и у следующих
	for(var j = i; j < lines.length; ++j){
		lines[j].address -= len;
		// при этом может измениться код команды
		lines[j] = asm2line_format(asm(lines[j].address, lines[j].cmd_text));
	}
	// отображаем
	fill_table();
}




function insert_tr(line)
{
	var tr = $('tr[line=' + line + ']');
	var i = line + offset
	var address = lines[i].address;

	exe.splice(address - address0, 0, NOP);
	exe.splice(PAGE, 1); 
	lines.splice(i, 0, disasm(address)); // это надо делать здесь, чтобы обойти защиту от изменения длины команды
	// сдвигаем адреса у следующих команд
	for(var j = i + 1; j < lines.length; ++j){
		lines[j].address++;
		// при этом может измениться код команды
		lines[j] = asm2line_format(asm(lines[j].address, lines[j].cmd_text));
	}
	// отображаем
	fill_table();
}

function scrollUp()
{
	if(lines[n_lines + offset] == undefined && lines[lines.length - 1].address + lines[lines.length - 1].codes_len >= address0 + PAGE) return;
	offset++;
	for(var line = 0; line < n_lines; ++line)
		fill_tr(line);
}

function scrollDown()
{
	if(offset == 0) return;
	offset--;
	for(var line = 0; line < n_lines; ++line)
		fill_tr(line);
}

function scrollPageUp()
{
	if(lines[n_lines + offset] == undefined && lines[lines.length - 1].address + lines[lines.length - 1].codes_len >= address0 + PAGE) return;
	offset += scroll_page;
	var line;
	for(line = 0; line < n_lines; ++line)
		fill_tr(line);
	// ищем последнюю заполненную строку
	for(--line; lines[line + offset].codes_len == 0; --line);
	// если выползли лишние строки, убираем их
	if(line != n_lines - 1){
		lines.splice(line + offset + 1, lines.length);
		offset -= n_lines - 1 - line;
		for(line = 0; line < n_lines; ++line)
			fill_tr(line);
	}
}

function scrollPageDown()
{
	if(offset == 0) return;
	offset = max(0, offset - scroll_page);
	for(var line = 0; line < n_lines; ++line)
		fill_tr(line);
}

function asmLines(asm_area)
{
	lines = []; // {address, codes_str, codes_len, cmd_text, edited}
	var address = address0;
	for(var i in asm_area){
		var res = asm(address, asm_area[i]); // {address, err, codes, cmd_text}
		if(res.err){
			fill_line(i);
			lines[i].cmd_text = asm_area[i];
			lines[i].edited = true;
			lines[i].err = res.err;
		}else{
			exe_update(address, res.codes);
			lines.push(asm2line_format(res));
		}
		address += lines[lines.length - 1].codes_len;
	}
	fill_table();
}

$('form.get_exe').on('submit', function(key){
	$('input#codes_str').val(exe.join(' '));
});

$('fieldset.test_exe input[type=submit]').on('click', function(key){
	var fieldset = this.closest('fieldset');
	var action = $(fieldset).attr('action');
	var task_id = $('input#task_id').val();
	$.post(action, {task_id: task_id, codes: exe}, function(result){
		$('textarea#test_result').val(result);
	});
});

$('a#copy_asm2textarea').on('click', function(key){
	var res = [];
	for(var i in lines)
		res.push(lines[i].cmd_text);
	$('textarea#asm_text').text(res.join('\n'));
	return false;
});

$('a#copy_textarea2asm').on('click', function(key){
	var res = $('textarea#asm_text').val().split('\n');
	var asm = [];
	for(var i in res)
		if(res[i].trim())
			asm.push(res[i].trim())
	asmLines(asm);
	return false;
});

fill_table();

$('td.asm input').on('keydown', function(key){
	var line = 1*this.closest('tr').getAttribute('line');
	if(key.code == 'ArrowUp'){
		asmLine({line: line, real: false});
		if(line > 0)
			$('tr[line=' + (line - 1) + '] td.asm input').focus();
		else
			scrollDown();
	}
	else
	if(key.code == 'ArrowDown' || key.code == 'Enter'){
		if(key.code == 'Enter')
			asmLine({line: line, real: true});
		else
			asmLine({line: line, real: false});
		if(line + 1 < n_lines)
			$('tr[line=' + (line + 1) + '] td.asm input').focus();
		else
			scrollUp();
	}
	else
	if(key.code == 'PageUp'){
		scrollPageDown();
	}
	else
	if(key.code == 'PageDown'){
		scrollPageUp();
	}
	else
	if(key.code == 'Escape'){
		fill_tr(line);
	}
	else
	if(key.code == 'Insert'){
		insert_tr(line);
	}
	else
	if(key.code == 'Delete'){
		delete_tr(line);
	}
//	else
//		console.log(key.code);
});

$('tr[line=0] input').focus();
