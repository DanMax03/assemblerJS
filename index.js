'use strict';

var lines = []; // {address, codes_str, codes_len, cmd_text, edited, err, codes_cmd}
var offset = 0; // Строка программы, показывающаяся в первой строке на экране. Не менять!
var NOP = 0x90; // команда для вставки
var NOP_LINE = {/*address, */codes_str: '90', codes_len: 1, cmd_text: 'nop', edited: false, err: '', codes_cmd: 'nop'};

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

// {address, err, codes, cmd_text} -> {address, codes_str, codes_len, cmd_text, edited, err, codes_cmd}
function asm2line_format(a)
{
	return {address: a.address, codes_str: codes_TO_codes_str(a.codes), codes_len: a.codes.length, cmd_text: a.cmd_text, edited: false, err: '', codes_cmd: a.cmd_text};
}

// {address, codes_str, codes_len, cmd_text} -> {address, codes_str, codes_len, cmd_text, edited, err, cmd_text}
function disasm2line_format(da)
{
	da.codes_cmd = da.cmd_text;
	da.edited = false;
	da.err = '';
	return da;
}

function fill_line(i)
{
	i = 1*i;
	if(i > 0 && lines[i - 1] == undefined){ console.log('Почему-то предыдущей строки не существует'); return; }
	var address = i ? lines[i - 1].address + lines[i - 1].codes_len : address0;
	var res = disasm2line_format(disasm(address));
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
	tr.removeClass('edited error');
	$('td.address', tr).text(hex(lines[i].address, 4));
	$('td.codes', tr).text(lines[i].codes_str);
	$('td.codes', tr).attr('len', lines[i].codes_len);
	$('td.asm input', tr).val(lines[i].cmd_text);
	$('td.err', tr).text(lines[i].err);
	if(lines[i].edited)
		tr.addClass('edited');
	if(lines[i].err)
		tr.addClass('error');
}

function fill_table()
{
	for(var line = 0; line < n_lines; ++line)
		fill_tr(line);
}

function err_show()
{
	var tbody = $('div.err.segment table > tbody');
	tbody.empty();
	for(var i in lines){
		if(lines[i].err)
			tbody.append('<tr><td>' + hex(lines[i].address, 4) + '</td><td>' + lines[i].cmd_text + '</td><td>' + lines[i].err + '</td></tr>');
	}
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
		if(res.err){
			lines[i].cmd_text = cmd_text;
			lines[i].edited = true;
			lines[i].err = res.err;
			tr.addClass('edited error');
		}else{
			exe_update(address, res.codes);
			fill_line(i);
			fill_tr(line);
		}
	}else{
		if(res.err || $('td.codes', tr).text() != codes_str){
			tr.addClass('edited');
			if(res.err)
				tr.addClass('error');
			lines[i].edited = true;
		}else
			tr.removeClass('edited error');
		lines[i].cmd_text = cmd_text;
	}
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
		var res = asm(lines[j].address, lines[j].codes_cmd);
		exe_update(lines[j].address, res.codes);
		lines[j].codes_str = codes_TO_codes_str(res.codes);
		if(lines[j].codes_cmd != res.cmd_text)
			console.log('Текст команды не должен был измениться.');
	}
	// отображаем
	fill_table();
	err_show();
}

function insert_tr(line)
{
	var tr = $('tr[line=' + line + ']');
	var i = line + offset
	var address = lines[i].address;

	exe.splice(address - address0, 0, NOP);
	exe.splice(PAGE, 1); 
	lines.splice(i, 0, disasm2line_format(disasm(address))); // это надо делать здесь, чтобы обойти защиту от изменения длины команды
	// сдвигаем адреса у следующих команд
	for(var j = i + 1; j < lines.length; ++j){
		lines[j].address++;
		// при этом может измениться код команды
		var res = asm(lines[j].address, lines[j].codes_cmd);
		exe_update(lines[j].address, res.codes);
		lines[j].codes_str = codes_TO_codes_str(res.codes);
		if(lines[j].codes_cmd != res.cmd_text)
			console.log('Текст команды не должен был измениться.');
	}
	// отображаем
	fill_table();
	err_show();
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
			fill_line(i);
		}
		address += lines[lines.length - 1].codes_len;
	}
	fill_table();
	err_show();
}

$('form.get_exe').on('submit', function(key){
	alert('Сохранение exe файла после скачивания может быть заблокировано антивирусной программой или системой безопасности Windows. \n \n Если у вас Windows 10 и срабатыват система безопасности Windows блокирует сохранение, то делаем следующее. \n Ту папку, куда будут сохраняться exe-файлы, нужно исключить из зоны ответственности системы безопасности Windows. \n Для этого нужно добавить исключение в систему Безопасность Windows: \n Добавление исключения в систему Безопасность Windows: \n Перейдите в раздел Пуск > Параметры > Обновление и безопасность > Безопасность Windows > Защита от вирусов и угроз. \n В разделе Параметры защиты от вирусов и угроз выберите Управление настройками, а затем в разделе Исключения выберите Добавление или удаление исключений. ');
	$('input#cs_str').val(exe.join(' '));
	$('input#ds_str').val(data.join(' '));
});

$('a#copy_asm2textarea').on('click', function(key){
	var res = [];
	for(var i in lines)
		res.push(lines[i].cmd_text);
	$('textarea#asm_text').text(res.join('\n'));
	$('textarea#asm_text').val(res.join('\n'));
	return false;
});

$('a#copy_textarea2asm').on('click', function(key){
	var res = $('textarea#asm_text').val().split('\n');
	var asm = [];
	for(var i in res){
		var q = res[i].split(';')[0].trim();
		if(q)
			asm.push(q);
//		else
//			asm.push('nop');
	}
	asmLines(asm);
	return false;
});

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

function ArrowUp(line)
{
	if(line > 0)
		$('tr[line=' + (line - 1) + '] td.asm input').focus();
	else
		scrollDown();
}

function ArrowDown(line)
{
	if(line + 1 < n_lines)
		$('tr[line=' + (line + 1) + '] td.asm input').focus();
	else
		scrollUp();
}

fill_table();
err_show();

function cs_action_handler(action, line){
	switch(action){
		case 'ArrowUp': 
			asmLine({line: line, real: false});
			ArrowUp(line);
			break;
		case 'ArrowDown': 
			asmLine({line: line, real: false});
			ArrowDown(line)
			break;
		case 'Enter': 
			asmLine({line: line, real: true});
			ArrowDown(line)
			err_show();
			break;
/*		case 'PageUp': 
			//asmLine({line: line, real: false});
			scrollPageDown();
			break;
		case 'PageDown': 
			//asmLine({line: line, real: false});
			scrollPageUp();
			break;
*/
		case 'Escape': 
			lines[line + offset] = disasm2line_format(disasm(lines[line + offset].address));
			fill_tr(line);
			err_show();
			break;
		case 'Insert': 
			asmLine({line: line, real: false});
			insert_tr(line);
			break;
		case 'Delete': 
			delete_tr(line);
			break;
		case 'Leave': 
			asmLine({line: line, real: false});
			break;
	}
}

$('td.asm input').on('keydown', function(key){
	// определяем действие
//console.log(key.ctrlKey, key.altKey, key.shiftKey, key.code);
	var action = '';
	if(!key.ctrlKey && !key.altKey && !key.shiftKey) 
		switch(key.code){
			case 'ArrowUp': action = "ArrowUp"; break;
			case 'ArrowDown': action = 'ArrowDown'; break;
//			case 'PageUp': action = 'PageUp'; break;
//			case 'PageDown': action = 'PageDown'; break;
			case 'Enter': action = 'Enter'; break;
			case 'Escape': action = 'Escape'; break;
		}
	if(!key.ctrlKey && key.altKey && !key.shiftKey) 
		switch(String(key.code)){
			case 'Insert': action = 'Insert'; break;
			case 'Delete': action = 'Delete'; break;
		}
	var line = 1*this.closest('tr').getAttribute('line');
	cs_action_handler(action, line);
});

$('td.asm input').on('focusout', function(){
	var line = 1*this.closest('tr').getAttribute('line');
	cs_action_handler('Leave', line);
});

$('tr[line=0] input').focus();

  
$("#commands-buttom").click( function(){
	var a = String(window.innerWidth/2);
	var b = String(window.innerHeight/2);
	window.open("help_editor.html", "Commmands", "top="+b+",left="+a+",width=600,height=300");
});



function show_window_exemples(){
	window.open("basic-asm-etudes.html", "Exemples", "width=600,height=300");
};

function show_window_insructions(){
	window.open("instrDict.html", "Instractions", "width=600,height=300");
};


