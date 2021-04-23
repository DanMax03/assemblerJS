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
	var tbody = $('div.error table > tbody');
	tbody.empty(); 
	var iferr = true;
	for(var i in lines){
		if(lines[i].err){
			if (iferr){
				iferr = false;
				tbody.append('<tr><th>Адрес</th><th>Команда</th><th>Ошибка</th></tr>');
				$('div.error').css({'background':'black'});
				$('div.error table').css({'border-right':'0.1rem dashed white'});
				$('div.error table').css({'border-left':'0.1rem dashed white'});
			}
			tbody.append('<tr><td>' + hex(lines[i].address, 4) + '</td><td>' + lines[i].cmd_text + '</td><td>' + lines[i].err + '</td></tr>');
		}
	}
	if (iferr){
		$('div.error').css({'background':'none'});
	}
}

$('textarea#asm_text').focus(function(){
	if($(this).val() == "Asm Text..."){
		$(this).val("");
		$(this).css({
			'font-size': 'large',
			'text-align':'left',
			'padding-top':'1%',
			'font-family': 'monospace',
			'background':'white',
		});
	}
});


$('textarea#asm_text').blur(function() { 
	if($(this).val() == ""){
		$(this).val("Asm Text...");
		$(this).css({
			'background':'none',
			'font-family': " 'Playfair Display', serif",
			'font-weight': 'bold',
		});
	}
	else{
		$(this).css({
			'font-size': 'large',
			'text-align':'left',
			'padding-top':'1%',
			'font-family': 'monospace',
		});
	}
});


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

function shift_tool__extract_address(cmd)
{
	var cmd = cmd.split(' ');
	if (cmd.length != 2){console.log('Critical error: В этом месте должно быть два элемента.'); return 0;}
	var addr = cmd[1];
	addr = addr.substring(0, addr.length - 1); // убираем букву 'h'
	return parseInt(addr, 16);
}
function shift_tool__nothing_to_do(cmd)
{
	var res = 
		// это не команда перехода
		cmd.indexOf('j') != 0 && cmd.indexOf('call') != 0 && cmd.indexOf('loop') != 0
		||
		// адрес задан абсолютно
		cmd.indexOf('[') >= 0;
	return res;
}
function shift_tool__inc_address_in_cmd_by_text(cmd)
{
	var cmd = cmd.split(' ');
	if (cmd.length != 2){console.log('Critical error: В этом месте должно быть два элемента.'); return 0;}
	var addr = cmd[1];
	addr = addr.substring(0, addr.length - 1); // убираем букву 'h'
	addr = parseInt(addr, 16) + 1;
	cmd[1] = addr.toString(16) + 'h';
	cmd = cmd.join(' ');
	return cmd;
}
function shift_tool__dec_address_in_cmd_by_text(cmd)
{
	var cmd = cmd.split(' ');
	if (cmd.length != 2){console.log('Critical error: В этом месте должно быть два элемента.'); return 0;}
	var addr = cmd[1];
	addr = addr.substring(0, addr.length - 1); // убираем букву 'h'
	addr = parseInt(addr, 16) - 1;
	cmd[1] = addr.toString(16) + 'h';
	cmd = cmd.join(' ');
	return cmd;
}
function shift_tool__new_cmd(j, new_cmd)
{
	// меняем текст команды
	lines[j].cmd_text = lines[j].codes_cmd = new_cmd;
	// меняем код команды
	var res = asm(lines[j].address, lines[j].codes_cmd);
	exe_update(lines[j].address, res.codes);
	lines[j].codes_str = codes_TO_codes_str(res.codes);
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
	for(var j = i; j < lines.length; ++j)
		lines[j].address -= len;

	// для команд переходов с относительным адресом корректируем адреса переходов и/или коды команд
	for(var j = 0; j < i; ++j){
		// если это не команда перехода с относительным адресом, то делать тут нечего
		if (shift_tool__nothing_to_do(lines[j].codes_cmd)) continue;

		var address_to = shift_tool__extract_address(lines[j].codes_cmd);

		// если адрес в другой сегмент, то нечего тут делать
		if (address_to > address0 + CODE_PAGE) continue;

		// если ссылка вела на вставляемую строку или ниже
		if (address_to > address)
			shift_tool__new_cmd(j, shift_tool__dec_address_in_cmd_by_text(lines[j].codes_cmd));
	}
	for(var j = i + 1; j < lines.length; ++j){
		// если это не команда перехода с относительным адресом, то делать тут нечего
		if (shift_tool__nothing_to_do(lines[j].codes_cmd)) continue;

		var address_to = shift_tool__extract_address(lines[j].codes_cmd);

		// если ссылка ведёт на строку выше вставляемой или на следующий сегмент
		if (address_to <= address || address_to > address0 + CODE_PAGE)
			shift_tool__new_cmd(j, lines[j].codes_cmd);
		else
			shift_tool__new_cmd(j, shift_tool__dec_address_in_cmd_by_text(lines[j].codes_cmd));
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
	exe.splice(CODE_PAGE, 1); 
	lines.splice(i, 0, disasm2line_format(disasm(address))); // это надо делать здесь, чтобы обойти защиту от изменения длины команды

	// сдвигаем адреса расположения следующих команд
	for(var j = i + 1; j < lines.length; ++j)
		lines[j].address++;
	
	// lines - {address: 4198411, cmd_text: "call 403100h", codes_cmd: "call 403100h", codes_len: 5, codes_str: "e8 f0 20 00 00", edited: false, err: ""}
	
	// для команд переходов с относительным адресом корректируем адреса переходов и/или коды команд
	for(var j = 0; j < i; ++j){
		// если это не команда перехода с относительным адресом, то делать тут нечего
		if (shift_tool__nothing_to_do(lines[j].codes_cmd)) continue;

		var address_to = shift_tool__extract_address(lines[j].codes_cmd);

		// если адрес в другой сегмент, то нечего тут делать
		if (address_to > address0 + CODE_PAGE) continue;

		// если ссылка вела на вставляемую строку или ниже
		if (address_to >= address)
			shift_tool__new_cmd(j, shift_tool__inc_address_in_cmd_by_text(lines[j].codes_cmd));
	}
	for(var j = i + 1; j < lines.length; ++j){
		// если это не команда перехода с относительным адресом, то делать тут нечего
		if (shift_tool__nothing_to_do(lines[j].codes_cmd)) continue;

		var address_to = shift_tool__extract_address(lines[j].codes_cmd);

		// если ссылка ведёт на строку выше вставляемой или на следующий сегмент
		if (address_to < address || address_to > address0 + CODE_PAGE)
			shift_tool__new_cmd(j, lines[j].codes_cmd);
		else
			shift_tool__new_cmd(j, shift_tool__inc_address_in_cmd_by_text(lines[j].codes_cmd));
	}	

	// отображаем
	fill_table();
	err_show();
}

function scrollPageUp()
{
	if(lines[n_lines + offset] == undefined && lines[lines.length - 1].address + lines[lines.length - 1].codes_len >= address0 + CODE_PAGE) return;
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

/*$('index.php').ready(function(){
	var w = Math.floor($('.segment').innerWidth()/4);
	$('.noframe').css({'width':String(w)});
	$('#ds_bytes').css({'width':String(w*2)});
	$('#ds_text').css({'width':String(w)});
})*/
$('form.get_exe').on('submit', function(key){
	$('input#cs_str').val(exe.join(' '));
	$('input#ds_str').val(data.join(' '));
});

$('a#copy_asm2textarea').on('click', function(key){
	var res = [];
	for(var i in lines)
		res.push(lines[i].cmd_text);
	$("textarea#asm_text").css({
					'font-size': 'large',
					'text-align':'left',
					'padding-top':'1%',
					'font-family': 'monospace',
					'background':'white',
				});
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
	if(lines[n_lines + offset] == undefined && lines[lines.length - 1].address + lines[lines.length - 1].codes_len >= address0 + CODE_PAGE) return;
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

$('#ds_bytes').blur(function(){
	$('.noframe1').css({'border': '1px dashed #ababab', 'border-bottom': 'none', 'border-top': 'none','background': 'none', 'transition' : '1s'})
});

$('#ds_bytes').focus(function(){
	$('.noframe1').css({'border': '1px solid #ababab', 'border-bottom': 'none', 'border-top': 'none', 'background': '#dcdbdb', 'transition' : '1s'})
});

$("#commands-buttom").click( function(){
	var a = String(window.innerWidth/4*3);
	var b = String(window.innerHeight/4*3);
	window.open("help_editor.html", "Commmands", "top="+b+",left="+a+",width=600,height=300");
});



function show_window_exemples(){
	window.open("basic-asm-etudes.html", "Exemples", "width=600,height=300");
}

function show_window_insructions(){
	var b = String(window.innerHeight/4*3);
	window.open("instrDict.html", "Instractions", "top="+b+",width=600,height=300");
}

function show_window_tips(){
	var b = String(window.innerHeight/4*3);
	window.open("tips.html", "Tips", "top="+b+",width=600,height=300");
}

function update_task_link()
{
	var selected_option = $('select#task_id option:selected');
	var mccme_task_id = selected_option.val();
	//var mccme_task_name = selected_option.text();
	
	var a = $('a#mccme_task_link');
	a.attr('href', 'https://informatics.msk.ru/mod/statements/view.php?chapterid=' + mccme_task_id);
	//a.text(mccme_task_name);
}
$(function(){
	var select = $('select#task_id');
	select.val(task_id);
	update_task_link();
});
$('select#task_id').change(function(){
	update_task_link();
});
