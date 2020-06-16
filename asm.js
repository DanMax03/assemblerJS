function parse_int(s)
{
	bases = {'b': 2, 'o': 8, 'q': 8, 'h': 16, 'd': 10};
	var base = bases[s[s.length - 1]]; 
	if(base == undefined)
		base = 10;
	else
		s = s.substring(0, s.length - 1);
	
	var res = 0;
	var c
	for(var i in s){
		if('0' <= s[i] && s[i] <= '9')
			c = s.charCodeAt(i) - 48;
		else if('a' <= s[i] && s[i] <= 'f')
			c = s.charCodeAt(i) - 97 + 10;
		else if(s[i] == ' ')
			return 'В записи числа обнаружен пробел.';
		else
			return 'В записи числа обнаружен недопустимый символ.';
		res *= base;
		if(c >= base)
			return 'В записи числа обнаружена недопустимая цифра.';
		res += c
	}
	return res;	
}

function hex(val, bytes = 1)
{
	val = val * 1;
	val = val.toString(16)
	while(val.length < bytes * 2)
		val = '0' + val;
	return val
}

registers = {'eax': 0, 'ecx': 1, 'edx': 2, 'ebx': 3, 'ebp': 5, 'esi': 6, 'edi': 7};

map = {
	'nop': '90',
	'inc al': 'fe c0',
	'inc cl': 'fe c1',
	'inc dl': 'fe c2',
	'inc bl': 'fe c3',
	'inc ah': 'fe c4',
	'inc ch': 'fe c5',
	'inc dh': 'fe c6',
	'inc bh': 'fe c7',
	'inc eax': '40',
	'inc ecx': '41',
	'inc edx': '42',
	'inc ebx': '43',
//	'inc esp': '44',
	'inc ebp': '45',
	'inc esi': '46',
	'inc edi': '47',
	'dec al': 'fe c8',
	'dec cl': 'fe c9',
	'dec dl': 'fe ca',
	'dec bl': 'fe cb',
	'dec ah': 'fe cc',
	'dec ch': 'fe cd',
	'dec dh': 'fe ce',
	'dec bh': 'fe cf',
	'dec eax': '48',
	'dec ecx': '49',
	'dec edx': '4a',
	'dec ebx': '4b',
//	'dec esp': '4c',
	'dec ebp': '4d',
	'dec esi': '4e',
	'dec edi': '4f',
	'dec [eax]': 'fe 08',
	'dec [ecx]': 'fe 09',
	'dec [edx]': 'fe 0a',
	'dec [ebx]': 'fe 0b',
//	'dec [esp]': 'fe 0c',
//	'dec [ebp]': 'fe 0d',
	'dec [esi]': 'fe 0e',
	'dec [edi]': 'fe 0f',
	'neg al': 'f6 d8',
	'neg cl': 'f6 d9',
	'neg dl': 'f6 da',
	'neg bl': 'f6 db',
	'neg ah': 'f6 dc',
	'neg ch': 'f6 dd',
	'neg dh': 'f6 de',
	'neg bh': 'f6 df',
	'neg eax': 'f7 d8',
	'neg ecx': 'f7 d9',
	'neg edx': 'f7 da',
	'neg ebx': 'f7 db',
//	'neg esp': 'f7 dc',
	'neg ebp': 'f7 dd',
	'neg esi': 'f7 de',
	'neg edi': 'f7 df',
}

function codes_str_TO_codes(codes_str)
{
	var codes = codes_str.split(' ');
	for(var i in codes){
		codes[i] = parseInt(codes[i], 16);
	}
	return codes;
}

function codes_TO_codes_str(codes)
{
	var codes_str = [];
	for(var i in codes){
		codes_str.push(hex(codes[i]));
	}
	return codes_str.join(' ');
}

map_1 = {};

(function (){
	for(var asm in map){
		var codes = codes_str_TO_codes(map[asm]);
		map[asm] = {codes: codes, codes_str: map[asm]};
		// выворачиваем наизнанку (map_d = map^(-1))
		var el = map_1;
		for(var i in codes){
			if(el[codes[i]] == undefined)
				if(i == codes.length - 1)
					el[codes[i]] = asm;
				else
					el[codes[i]] = {};
			else
				if(typeof el[codes[i]] == 'string')
					console.log('Ошибка обработки map[' + asm + ']');
			el = el[codes[i]];
		}		
	}
})();

map1 = [
	{reg: /^dec \[(eax|ecx|edx|ebx|ebp|esi|edi)\+([0-9a-fhoq]+)\]$/, num_len: 1, codes: [0xfe, 0x48]}
];

/*
canonic - привести к каноническому виду: убрать лишние пробелы, оставить один между командой и операндами, и после запятой, отделяющей операнды, остальные убрать, привести к нижнему регистру.
err = '' - нет ошибки

cmd_explode возвращает массив слов - команду и операнды (если они есть)
*/

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function canonic(s)
{
	s = s.replace(/\[/g, ' [').replace(/\[\s+/g, ' [').replace(/\s+\]/g, ']').replace(/\]\s+/g, ']').replace(/\s+\+/g, '+').replace(/\+\s+/g, '+').replace(/,/g, ', ').replace(/\s+/g, ' ').trim().toLowerCase();
	return s;
}



function cmd_explode(cmd_text)
{
	space = cmd_text.indexOf(' ');
	
	if(space == -1) // checking non-operand command
		return {err: '', cmd: [cmd_text]};
	
	cmd = [cmd_text.substring(0, space)]
	
	ops = cmd_text.substring(space + 1).split(', ')
	
	if(ops.length > 2)
		return {err: 'Параметров должно быть не больше двух.'};
	
	return {err: '', cmd: cmd.concat(ops)};
}

function byte_cost(number)
{
	var res = 1;
	var max_num = 127;
	
	while (number % max_num != number) {
		max_num = (max_num + 1) * 256 - 1;
		
		res += 1;
	}
	
	return res;
}

registers2 = {'ax': 0, 'cx': 1, 'dx': 2, 'bx': 3, 'bp': 5, 'si': 6, 'di': 7,
			  'al': 0, 'cl': 1, 'dl': 2, 'bl': 3, 'ah': 4, 'ch': 5, 'dh': 6, 'bh': 7};
			  
bitsize = {'ax': 16, 'cx': 16, 'dx': 16, 'bx': 16, 'bp': 16, 'si': 16, 'di': 16,
			  'al': 8, 'cl': 8, 'dl': 8, 'bl': 8, 'ah': 8, 'ch': 8, 'dh': 8, 'bh': 8};


function get_operand(opd_text)
{
console.log(opd_text);
	
	if (/^byte/.test(opd_text) || /^dword/.test(opd_text)) { //opd_text.test(/^byte/) || opd_text.test(/^dword/)

console.log("found byte or dword");

		var space = opd_text.indexOf(' ');
		var l_sq = opd_text.indexOf('[');
		var r_sq = opd_text.indexOf(']');
		
		if (space == -1 || l_sq == -1 || r_sq == -1)
			return {type: 'err', value: 'Неверный операнд'};
		
		var siz = opd_text.substring(0, space);
		siz = siz == 'byte' ? 8 : 32;
		
		var addr = opd_text.substring(l_sq + 1, r_sq);
		
		if (addr == '') 
			return {type: 'err', value: 'Неопределенный адрес в памяти'};
		
		
		// works only with reg +- disp now (reg, reg + disp, reg - disp, +-disp)
		var rg = opd_text.match(/^(eax|ecx|edx|ebx|ebp|esi|edi)/);
		
		if (!rg) {
			// displacement == addr
			
			var disp = parse_int(addr);
			
			if (typeof disp == "string")
				return {type: 'err', value: disp};
			
			return {type: 'mem', size: siz, adrr: 'disponly', value: disp};
			
		} else {
			if (addr.length == 3)
				return {type: 'mem', size: siz, adrr: 'reg', value: registers[rg]};
			
			if (/(\+|\-)/.test(addr)) { // if here's + or -
				
				var sgn = addr.match(/(\+|\-)/);
				
				if (addr.indexOf(sgn) != 3) 
					return {type: 'err', value: 'Неверный адрес'}
				
				var disp = addr.substring(sgn + 1);
				
				disp = parse_int(disp); // знак учтен при return
				
				if (typeof disp == "string") 
					return {type: 'err', value: disp}
					
			return {type: 'mem', size: siz, adrr: 'reg+disp${byte_cost(disp)}', value1: registers[rg], value2: (sgn == '+' ? disp : -disp)};
				
			} else {
				return {type: 'err', value: 'Неверный адрес'};
			}
		}
		
	} else { // just reg
		var rg = opd_text.match(/^(eax|ecx|edx|ebx|ebp|esi|edi|ax|cx|dx|bx|bp|si|di|ah|al|ch|cl|dh|dl|bh|bl)$/);
		
		if (!rg)
			return {type: 'err', value: 'Неверный регистр'}; 
		
		
		
		if (rg.length == 2) 
			return {type: 'reg', size: bitsize[rg], value: registers2[rg]}
	
		return {type: 'reg', size: bitsize[rg], value: registers[rg]};
	}
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// {err, codes_str, codes, cmd_text}

/*
Функция asm должна возвращать объект

{address, err, codes, cmd_text}

, где

address - вернуть тот самый адрес, что ей дали;

err - тектом сообщение об ошибке, наличие ошибки будет проверяться if(err);

codes - массив байт - кодов команды процессора;

cmd_text - канонический вид команды, в крайнем случае можно вернуть то, что дали, в идеале должно быть то, чтобы вернул дизассемблер, если бы получил коды команд.
*/
function asm(address, cmd_text) // 
{
	var test = get_operand('byte [eax+11h]');
	
	for (key in test) {
		alert( "Ключ: " + key + " значение: " + test[key] );
	}
	
	cmd_text = canonic(cmd_text); 

	if(map[cmd_text] != undefined) 
		return {address: address, err: '', codes: map[cmd_text].codes, cmd_text: cmd_text};
	
		
	cmd_shapes = cmd_explode(cmd_text);

	if(cmd_shapes.err != '') // если в структуре есть ошибка, или  > 2 аргумента
		return {err: cmd_shapes.err, codes_str: '', codes: [], cmd_text: ''};

	cmd_shapes = cmd_shapes.cmd;
	
	switch (cmd_shapes[0]) 
	{
		case 'nop':
			if (cmd_shapes.length != 1) 
				return {err: "У команды 'nop' нету операндов", codes: []}
				
			return {err: '', codes: [0x90]}
		break;
		
		case 'add':
			if (cmd_shapes.length != 3)
				return {err: "У команды 'add' 2 операнда", codes: []}
			
			op1 = get_operand(cmd_shapes[1]);
			op2 = get_operand(cmd_shapes[2]);
			
			if (op1.type == 'memory' && op2.type == 'memory') {
				return {err: "У команды 'add' не может быть 2 операнда из памяти", codes: []}
			}
			
			
		break;
		
		case 'sub':
		break;
		
		case 'cmp':
		break;
		
		case 'inc':
		break;
		
		case 'dec':
		break;
		
		case 'neg':
		break;
		
		case 'mov':
		break;
		
		case 'call':
		break;
		
		case 'ret':
		break;
	}
	
	return {err: 'Неизвестная команда', codes: [], cmd_text: '' };
}





// {address, cmd_text, codes_str, codes_len}
function disasm(address)
{
	var adr = address - address0
	if(adr >= PAGE) return {address: address, cmd_text: '', codes_str: '', codes_len: 0};

	var el = map_1;
	var a = adr;
	while(typeof el == 'object' && a < exe.length){
		el = el[exe[a]];
		a++;
	}
	if(typeof el == 'string'){
		if(a - adr != map[el].codes.length){
//!!!			console.log('')
			return {address: address, cmd_text: 'db ' + hex(exe[adr]), codes_str: hex(exe[adr]), codes_len: 1};
		}
		return {address: address, cmd_text: el, codes_str: map[el].codes_str, codes_len: map[el].codes.length};
	}else
		return {address: address, cmd_text: 'db ' + hex(exe[adr]) + 'h', codes_str: hex(exe[adr]), codes_len: 1};
}

