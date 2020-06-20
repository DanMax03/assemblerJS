'use strict';

var registers = {'eax': 0, 'ecx': 1, 'edx': 2, 'ebx': 3, 'ebp': 5, 'esi': 6, 'edi': 7};

var registers2 = {'ax': 0, 'cx': 1, 'dx': 2, 'bx': 3, 'bp': 5, 'si': 6, 'di': 7,
			  'al': 0, 'cl': 1, 'dl': 2, 'bl': 3, 'ah': 4, 'ch': 5, 'dh': 6, 'bh': 7};
			  
var bitsize = {'eax': 32, 'ecx': 32, 'edx': 32, 'ebx': 32, 'ebp': 32, 'esi': 32, 'edi': 32,
			   'ax': 16, 'cx': 16, 'dx': 16, 'bx': 16, 'bp': 16, 'si': 16, 'di': 16,
			   'al': 8, 'cl': 8, 'dl': 8, 'bl': 8, 'ah': 8, 'ch': 8, 'dh': 8, 'bh': 8};

var map1 = [
	{reg: /^dec \[(eax|ecx|edx|ebx|ebp|esi|edi)\+([0-9a-fhoq]+)\]$/, num_len: 1, codes: [0xfe, 0x48]}
];

var map_1 = {};

function div(val, by) // в js нету деления нацело. Шок
{
    return (val - val % by) / by;
}

function neg_sB(s)
{
	var s1;
	s1 = '';
	
	for (var i = 0; i < s.length; i++)
		s1 = s1 + (s.charAt(i) == '1' ? '0' : '1');
	
	s = s1;
	s1 = '';
	var p = 1;
	
	for(var i = s.length - 1; i >= 0; i--) {
		var p1 = p * s.charAt(i);
		
		s1 = (+s.charAt(i) && +p || !+s.charAt(i) && !+p ? '0' : '1') + s1;
		
		p = p1;
	}
	
	return s1;
}

function int_to_sB(i, n) // i - число, n - разрядность (8, 16, 32)
{
	if (i < -Math.pow(2, n - 1) || i >= Math.pow(2, n - 1)) 
		return '-';
	
	var s = '';
	var sign = i < 0 ? 1 : 0;
	var i_orig = i;
	
	i = Math.abs(i);
	
	for (var k = 0; k < n - 1; k++){
		
		s = ( i % 2 + '') + s;
		i /= 2; i = i - (i % 1);
		
	}
	
	s = (i_orig == -Math.pow(2, n - 1) ? '1' : '0') + s;
	
	if (sign)
		s = neg_sB(s);
	
	return s;
}


function parse_int(s)
{
	var bases = {'b': 2, 'o': 8, 'q': 8, 'h': 16, 'd': 10};
	
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
	val = val.toString(16); // преобразует число к 16й системе
	
	while(val.length < bytes * 2)
		val = '0' + val;
	
	return val
}

function to_hex(bin_str) // only multiples of 8
{
	var res = '';
	var slice = '';
	var val;
	
	for (var i = 0; i < bin_str.length - 7; i += 8) {

		slice = bin_str.substring(i, i + 8);
		slice = slice * 1;
		
		val = slice % 2;
		
		for (var j = 1; j < 8; j++) {
			slice = div(slice, 10);
			val += (slice % 2) * Math.pow(2, j);
		}
		
		res = res + hex(val) + ' ';
	}
	
	res = res.substring(0, res.length - 1); // cutting last space
	
	return res;
}

function to_reverse_hex(bin_str) // only multiples of 8
{
	var res = '';
	var slice = '';
	var val;
	
	for (var i = bin_str.length - 8; i >= 0; i -= 8) {

		slice = bin_str.substring(i, i + 8);
		slice = slice * 1;
		
		val = slice % 2;
		
		for (var j = 1; j < 8; j++) {
			slice = div(slice, 10);
			val += (slice % 2) * Math.pow(2, j);
		}
		
		res = res + hex(val) + ' ';
	}
	
	res = res.substring(0, res.length - 1); // cutting last space
	
	return res;
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

(function (){
	for(var asm in map){
		var codes = codes_str_TO_codes(map[asm]);
		map[asm] = {codes: codes, codes_str: map[asm]};
		// выворачиваем наизнанку (map_d = map^(-1))
		var el = map_1;
		
		for (var i in codes) {
			if (el[codes[i]] == undefined)
				if (i == codes.length - 1)
					el[codes[i]] = asm;
				else
					el[codes[i]] = {};
			else
				if (typeof el[codes[i]] == 'string')
					console.log('Ошибка обработки map[' + asm + ']');
				
			el = el[codes[i]];
		}		
	}
})();

/*
canonic - привести к каноническому виду: убрать лишние пробелы, оставить один между командой и операндами, и после запятой, отделяющей операнды, остальные убрать, привести к нижнему регистру.
err = '' - нет ошибки

cmd_explode возвращает массив слов - команду и операнды (если они есть)
*/


// MAP GENERATOR

/*for (var reg in registers) {
	for (var reg2 in registers) {
		if (reg != reg2) {
			var cd = asm(40100, 'add ' + reg + ', ' + reg2).codes;
			//console.log(cd);
			console.log("'add " + reg + ', ' + reg2 + "' : '" + codes_TO_codes_str(cd) + "',");
		}
	}
}*/

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function canonic(s)
{
	s = s.replace(/\[/g, ' [').replace(/\[\s+/g, ' [').replace(/\s+\]/g, ']').replace(/\]\s+/g, ']').replace(/\s+\+/g, '+').replace(/\+\s+/g, '+').replace(/,/g, ', ').replace(/\s+/g, ' ').trim().toLowerCase();
	return s;
}

function cmd_explode(cmd_text)
{
	var space = cmd_text.indexOf(' ');
	
	if(space == -1) // checking non-operand command
		return {err: '', cmd: [cmd_text]};
	
	var cmd = [cmd_text.substring(0, space)]
	
	var ops = cmd_text.substring(space + 1).split(', ')
	
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


function get_operand(opd_text) // reg, mem or imm
{
	
	if (/^byte/.test(opd_text) || /^dword/.test(opd_text) || /^\[/.test(opd_text)) { // just mem

		var space = opd_text.indexOf(' ');
		var l_sq = opd_text.indexOf('[');
		var r_sq = opd_text.indexOf(']');
		
		
		if (l_sq == -1 || r_sq == -1 || (space == -1 && opd_text[0] != '['))
			return {type: 'err', value: 'Неверный операнд'};
		
		
		if (opd_text[0] != '[') {
			var siz = opd_text.substring(0, space);
			siz = siz == 'byte' ? 8 : 32;
		} else {
			siz = 'depends on other';
		}
		
		
		var addr = opd_text.substring(l_sq + 1, r_sq);
		
		if (addr == '') 
			return {type: 'err', value: 'Неопределенный адрес в памяти'};
		
		addr = addr.replace(/\s/g, '');

		
		// works only with reg +- disp now (reg, reg + disp, reg - disp, +-disp)
		var rg = addr.match(/^(eax|ecx|edx|ebx|ebp|esi|edi)/);
		
		if (!rg) {
			// displacement == addr
			
			var sgn = addr.match(/(\+|\-)/);
				
			if (sgn) {
				if (sgn.length != 2 || sgn.index != 0) 
					return {type: 'err', value: 'Неверный адрес'};
				
				addr = addr.substring(1);
				sgn = sgn[0];
			}
			
			var disp = parse_int(addr);
			
			if (typeof disp == "string")
				return {type: 'err', value: disp};
			
			if (sgn)
				return {type: 'mem', size: 32, adrr: 'disponly', value: (sgn == '+' ? disp : -disp)};
			else
				return {type: 'mem', size: 32, adrr: 'disponly', value: disp};
			
		} else {
			rg = rg[0]; // make rg just string
			
			if (addr.length == 3)
				return {type: 'mem', size: siz, adrr: 'reg', value: registers[rg]};
			
			if (/(\+|\-)/.test(addr)) { // if here's + or -
				
				var sgn = addr.match(/(\+|\-)/);
				
				if (sgn.length != 2 || sgn.index != 3) 
					return {type: 'err', value: 'Неверный адрес'};
				
				var disp = addr.substring(4);
				
				
				disp = parse_int(disp); // знак учтен при return
				
				if (typeof disp == "string") 
					return {type: 'err', value: disp}
				
					
			return {type: 'mem', size: siz, adrr: 'reg+disp', disp_size: (disp < 128 ? 8 : 32), value1: registers[rg], value2: (sgn[0] == '+' ? disp : -disp)};
				
			} else {
				return {type: 'err', value: 'Неверный адрес'};
			}
		}
		
	} else { // reg or imm
		if (opd_text.match(/( \[ | \] | \s)/))
			return {type: 'err', value: 'Неверный операнд'};
	
	
		var rg = opd_text.match(/^(eax|ecx|edx|ebx|ebp|esi|edi|ax|cx|dx|bx|bp|si|di|ah|al|ch|cl|dh|dl|bh|bl)$/);
		
		if (!rg) { // just imm
			var sgn = opd_text.match(/^(\+|\-)/);
			
			
			if (sgn) {
				sgn = sgn[0];
				
				opd_text = opd_text.substring(1); // число без учета знака
			}
			
			var imm = parse_int(opd_text);
			
			if (typeof imm == "string") 
				return {type: 'err', value: imm};
			
			if (!sgn)
				return {type: 'imm', size: 8 * byte_cost(imm), value: imm};
			else
				return {type: 'imm', size: 8 * byte_cost(imm), value: (sgn == '+' ? imm : -imm)};
			
		} else { // just reg
		
			rg = rg[0]; // make rg just string

			if (rg.length == 2) 
				return {type: 'reg', size: bitsize[rg], value: registers2[rg]}


			return {type: 'reg', size: bitsize[rg], value: registers[rg]};
		}
	}
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// {err, codes_str, codes, cmd_text}

/*
Функция asm должна возвращать объект

{address, err, codes, cmd_text}

, где

address - вернуть тот самый адрес, что ей дали;

err - текстом сообщение об ошибке, наличие ошибки будет проверяться if(err);

codes - массив байт - кодов команды процессора;

cmd_text - канонический вид команды, в крайнем случае можно вернуть то, что дали, в идеале должно быть то, чтобы вернул дизассемблер, если бы получил коды команд.
*/
function asm(address, cmd_text) // 
{
	
	cmd_text = canonic(cmd_text); 


	if(map[cmd_text] != undefined) 
		return {address: address, 
				err: '',
				codes: map[cmd_text].codes, 
				cmd_text: cmd_text};
	
		
	var cmd_shapes = cmd_explode(cmd_text);
	
	
	if(cmd_shapes.err != '') // если в структуре есть ошибка, или  > 2 аргумента
		return {err: cmd_shapes.err, codes_str: '', codes: [], cmd_text: ''};

	cmd_shapes = cmd_shapes.cmd; // убирает err, теперь cmd_shapes = ['<command>', <operands>]
	
	switch (cmd_shapes[0]) 
	{
		case 'nop': //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
			if (cmd_shapes.length != 1) 
				return {err: "У команды 'nop' нету операндов", codes: []};
				
			return {address: address, 
					err: '', 
					codes: [0x90], 
					cmd_text: cmd_text};
		break;      //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		
		case 'db':	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
			if (cmd_shapes.length > 2)
				return {err: "У команды 'db' лишь один операнд", codes: []};
			
			var op = get_operand(cmd_shapes[1]);
			
			console.log(op);
			
			if (op.type == 'err')
				return {err: op.value, codes: []};
			else if (op.type == 'imm')
				if (op.value > 255) // op.size - сколько байт надо, для ЗНАКОВОЙ записи
					return {err: "Операнд 'db' может быть размером только 1 байт", codes: []};
				else
					return {address: address,
							err: '',
							codes: [codes_str_TO_codes(hex(op.value))],
							cmd_text: cmd_text};
			else 
				return {err: "Операндом 'db' может быть только константа", codes: []};
		break;		//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		
		case 'add':	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		/*
			al imm = 04
			ax, eax imm = 05
		*/
		
			if (cmd_shapes.length != 3)
				return {err: "У команды 'add' 2 операнда", codes: []};
			
			var op1 = get_operand(cmd_shapes[1]);
			var op2 = get_operand(cmd_shapes[2]);
			
			
			if (op1.type == 'err')
				return {err: op1.value, codes: []};
			
			if (op2.type == 'err')
				return {err: op2.value, codes: []};
			
//console.log(op1);
//console.log(op2);
			
			
			var native_codeB = '000000';
			
			
			switch (op1.type) 
			{
				case 'imm':
					return {err: "У команды 'add' не может быть 1м операндом константа", codes: [], cmd_text: cmd_text};
				break;
				
				case 'reg':
					if (op2.type != 'imm' && typeof op2.size != 'string' && op1.size != op2.size)
						return {err: "Размеры операндов не равны", codes: [], cmd_text: cmd_text};
					
					
					native_codeB += '0' + (op1.size == 8 ? '0' : '1'); // just 0 - fiction d bit, it'll be changed in next code
				
				
					if (op1.value == 0 && (op1.size == 8 || op1.size == 16 || op1.size == 32) && op2.type == 'imm') {
						native_codeB = '0000010';
						
						native_codeB += (op1.size == 8 ? '0' : '1');
						
						return {address: address, 
								err: '', 
								codes: codes_str_TO_codes(to_hex(native_codeB) + ' ' + to_reverse_hex(int_to_sB(op2.value, op1.size))),
								cmd_text: cmd_text};
					}
					
					
					switch (op2.type)
					{
						case 'reg':
//console.log(to_hex(native_codeB + '11' + int_to_sB(op2.value, 4).substring(1) + int_to_sB(op1.value, 4).substring(1)));

							return {address: address, 
									err: '', 
									codes: codes_str_TO_codes(to_hex(native_codeB + '11' + int_to_sB(op2.value, 4).substring(1) + int_to_sB(op1.value, 4).substring(1))),
									cmd_text: cmd_text};
						break;
						
						case 'mem': 
							native_codeB = native_codeB.substring(0, 6) + '1' + native_codeB.substring(7); //native_codeB[6] = '1'; - changing direction bit


							switch (op2.adrr) {
								case 'reg': // [reg]  in R/M
								
									if (op2.value != 5)
										return {address: address, 
												err: '', 
												codes: codes_str_TO_codes(to_hex(native_codeB + '00' + int_to_sB(op1.value, 4).substring(1) + int_to_sB(op2.value, 4).substring(1))),
												cmd_text: cmd_text};
									
									return {address: address, 
											err: '', 
											codes: codes_str_TO_codes(to_hex(native_codeB + '01' + int_to_sB(op1.value, 4).substring(1) + int_to_sB(op2.value, 4).substring(1) + '00000000')),
											cmd_text: cmd_text};
								break;
								
								case 'disponly':
								
									return {address: address, 
											err: '', 
											codes: codes_str_TO_codes(to_hex(native_codeB + '00' + int_to_sB(op1.value, 4).substring(1) + '101') + ' ' + to_reverse_hex(int_to_sB(op2.value, 32))),
											cmd_text: cmd_text};
								break;
								
								case 'reg+disp':
								
									return {address: address,
											err: '',
											codes: codes_str_TO_codes(to_hex(native_codeB + (op2.disp_size == 8 ? '01' : '10') + int_to_sB(op1.value, 4).substring(1) + int_to_sB(op2.value1, 4).substring(1)) + ' ' + to_reverse_hex(int_to_sB(op2.value2, op2.disp_size))),
											cmd_text: cmd_text};
								break;
							}
						break;
						
						case 'imm': // REG == 000, opcode = 100000sw, s == 0 => size as 1st oper, else - size 8 bit. w == 0 - opers are 1 byte
							if (op1.size < op2.size)
								return {err: "Число больше размера ячейки", codes: [], cmd_text: cmd_text};
							
							native_codeB = '100000';
							
							
							if (op1.size > op2.size && op2.size == 8)
								native_codeB += '1';
							else 
								native_codeB += '0';
							
							native_codeB += (op1.size == 8 ? '0' : '1');

							return {address: address,
									err: '',
									codes: codes_str_TO_codes(to_hex(native_codeB + '11000' + int_to_sB(op1.value, 4).substring(1)) + ' ' + to_reverse_hex(int_to_sB(op2.value, (op1.size > op2.size && op2.size == 8 ? 8 : op1.size)))),
									cmd_text: cmd_text};
							
						break;
					}
				break;
				
				case 'mem':
				
					switch (op2.type)
					{
						case 'mem':
							return {err: "У команды 'add' не может быть 2 операнда из памяти", codes: [], cmd_text: cmd_text};
						break;
						
						case 'reg':
							if (typeof op1.size != 'string' && op1.size != op2.size)
								return {err: "Размеры операндов не равны", codes: [], cmd_text: cmd_text};
							
							if (typeof op1.size == 'string')
								op1.size = op2.size;
								
							native_codeB += '0' + (op1.size == 8 ? '0' : '1');
							
							switch (op1.adrr)
							{
								case 'reg':
								
									if (op1.value != 5)
										return {address: address, 
												err: '', 
												codes: codes_str_TO_codes(to_hex(native_codeB + '00' + int_to_sB(op2.value, 4).substring(1) + int_to_sB(op1.value, 4).substring(1))),
												cmd_text: cmd_text};
//console.log(to_hex(native_codeB + '01' + int_to_sB(op2.value, 4).substring(1) + int_to_sB(op1.value, 4).substring(1) + '00000000'));									
									return {address: address, 
											err: '', 
											codes: codes_str_TO_codes(to_hex(native_codeB + '01' + int_to_sB(op2.value, 4).substring(1) + int_to_sB(op1.value, 4).substring(1) + '00000000')),
											cmd_text: cmd_text};
								break;
								
								case 'disponly':
//console.log(to_hex(native_codeB + '00' + int_to_sB(op2.value, 4).substring(1) + '101') + ' ' + to_reverse_hex(int_to_sB(op1.value, 32)));									
									return {address: address, 
											err: '', 
											codes: codes_str_TO_codes(to_hex(native_codeB + '00' + int_to_sB(op2.value, 4).substring(1) + '101') + ' ' + to_reverse_hex(int_to_sB(op1.value, 32))),
											cmd_text: cmd_text};
								break;
								
								case 'reg+disp':
//console.log(to_hex(native_codeB + (op1.disp_size == 8 ? '01' : '10') + int_to_sB(op2.value, 4).substring(1) + int_to_sB(op1.value1, 4).substring(1)) + ' ' + to_reverse_hex(int_to_sB(op1.value2, (op1.disp_size == 8 ? 8 : 32))));
									return {address: address,
											err: '',
											codes: codes_str_TO_codes(to_hex(native_codeB + (op1.disp_size == 8 ? '01' : '10') + int_to_sB(op2.value, 4).substring(1) + int_to_sB(op1.value1, 4).substring(1)) + ' ' + to_reverse_hex(int_to_sB(op1.value2, op1.disp_size == 8))),
											cmd_text: cmd_text};
								break;
							}
						break;
						case 'imm': // REG == 000, opcode = 100000sw, s == 0 => size as 1st oper, else - size 8 bit. w == 0 - opers are 1 byte
						
							native_codeB = '100000';
						
							if (typeof op1.size == 'string') {
								if (op2.size == 16) 
									op1.size = 32;
								else
									op1.size = op2.size;
								
								native_codeB += '0';
							} else {
								if (op1.size < op2.size)
									return {err: "Размеры операндов не равны", codes: [], cmd_text: cmd_text};
								
								if (op1.size > op2.size && op2.size == 8)
									native_codeB += '1';
								else 
									native_codeB += '0';
							}
							
							native_codeB += (op1.size == 8 ? '0' : '1');
							
							switch (op1.adrr)
							{
								case 'reg':
									if (op1.value != 5) {
//console.log(to_hex(native_codeB + '00000' + int_to_sB(op1.value, 4).substring(1)) + ' ' + to_reverse_hex(int_to_sB(op2.value, (op2.size == 8 ? 8 : 32))));
										
										return {address: address, 
												err: '', 
												codes: codes_str_TO_codes(to_hex(native_codeB + '00000' + int_to_sB(op1.value, 4).substring(1)) + ' ' + to_reverse_hex(int_to_sB(op2.value, (op2.size == 8 ? 8 : 32)))),
												cmd_text: cmd_text};
									}
//console.log(to_hex(native_codeB + '010000101' + '00000000') + ' ' + to_reverse_hex(int_to_sB(op2.value, (op2.size == 8 ? 8 : 32))));
									return {address: address, 
											err: '', 
											codes: codes_str_TO_codes(to_hex(native_codeB + '010000101' + '00000000') + ' ' + to_reverse_hex(int_to_sB(op2.value, (op2.size == 8 ? 8 : 32)))),
											cmd_text: cmd_text};
								break;
								
								case 'disponly':
//console.log(to_hex(native_codeB + '00000101') + ' ' + to_reverse_hex(int_to_sB(op2.size == 8 ? 8 : 32)));									
									return {address: address, 
											err: '', 
											codes: codes_str_TO_codes(to_hex(native_codeB + '00000101') + ' ' + to_reverse_hex(int_to_sB(op2.size == 8 ? 8 : 32))),
											cmd_text: cmd_text};
								break;
								
								case 'reg+disp':
								
//console.log(to_hex(native_codeB + (op1.disp_size == 8 ? '01' : '10') + '000' + int_to_sB(op1.value1, 4).substring(1)) + ' ' + to_reverse_hex(int_to_sB(op1.value2, (op1.disp_size == 8 ? 8 : 32))) + ' ' + to_reverse_hex(int_to_sB(op2.value, (op2.size == 8 ? 8 : 32))));
								
									return {address: address, 
											err: '', 
											codes: codes_str_TO_codes(to_hex(native_codeB + (op1.disp_size == 8 ? '01' : '10') + '000' + int_to_sB(op1.value1, 4).substring(1)) + ' ' + to_reverse_hex(int_to_sB(op1.value2, op1.disp_size)) + ' ' + to_reverse_hex(int_to_sB(op2.value, (op2.size == 8 ? 8 : 32)))),
											cmd_text: cmd_text};
								break;
							}
							
						break;
					}
				break;
			}
			
		break;		//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		
		case 'sub':
		break;
		
		case 'cmp':
		break;
		
		case 'inc' || 'dec':
			if (cmd_shapes.length > 2)
				return {err: "У команды '" + cmd_shapes[0] + "'лишь один операнд", codes: []};
			
			var op = get_operand(cmd_shapes[1]);
			
			if (op.type == 'err')
				return {err: op.value, codes: []};
			else if (op.type == 'imm')
				return {err: "Операндом '" + cmd_shapes[0] + "' не может быть константа", codes: []};
				
			
			var native_codeB = '0100';
			
			if (cmd_shapes[0] == 'inc')
				native_codeB += '0';
			else
				native_codeB += '1';
			
			if (op.type == 'reg') {
				if (op.size == 8)
					return {address: address, 
							err: '', 
							codes: codes_str_TO_codes(to_hex('11111110' + '11000' + int_to_sB(op.value, 4).substring(1))),
							cmd_text: cmd_text};
				else
					return {address: address, 
							err: '', 
							codes: codes_str_TO_codes(to_hex(native_codeB + int_to_sB(op.value, 4).substring(1))),
							cmd_text: cmd_text};
			} else {
				if (typeof op.size == 'string')
					return {err: "У операнда неопределенный размер", codes: []};
				
				if (op.size == 8)
					native_codeB = '11111110';
				else
					native_codeB = '11111111';
				
				switch (op.adrr) 
				{
					case 'reg':
						return {address: address, 
								err: '', 
								codes: codes_str_TO_codes(to_hex(native_codeB + '00000' + int_to_sB(op.value, 4).substring(1))),
								cmd_text: cmd_text};
					break;
					
					case 'disponly':
						return {address: address, 
								err: '', 
								codes: codes_str_TO_codes(to_hex(native_codeB + '00000101') + ' ' + to_reverse_hex(int_to_sB(op.value, 32))),
								cmd_text: cmd_text};
					break;
					
					case 'reg+disp':
						return {address: address, 
								err: '', 
								codes: codes_str_TO_codes(to_hex(native_codeB + (op.disp_size == 8 ? '01' : '10') + '000' + int_to_sB(op.value1, 4).substring(1)) + ' ' + to_reverse_hex(int_to_sB(op.value2, op.disp_size))),
								cmd_text: cmd_text};
					break;
				}
			}
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
	
	return {err: 'Неизвестная команда', codes: []};
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


// ТЕСТИРОВАНИЕ 
/*var tests = [
	{asm: 'add al, 7', codes_str: '04 07'},
	{asm: 'add edi, 7', codes_str: '83 c7 07'},
	{asm: 'add al, ch', codes_str: '00 e8'},
	{asm: 'add edi, ecx', codes_str: '01 cf'},
	{asm: 'add [ebp], ch', codes_str: '00 6d 00'},
	{asm: 'add [ebp], ecx', codes_str: '01 4d 00'},
	{asm: 'add [edi+8], ch', codes_str: '00 6f 08'},
	{asm: 'add [edi+8], ecx', codes_str: '01 4f 08'},
	{asm: 'add al, [ebp]', codes_str: '02 45 00'},
	{asm: 'add edi, [ebp]', codes_str: '03 7d 00'},
	{asm: 'add al, [ebp + 8]', codes_str: '02 45 08'},
	{asm: 'add edi, [ebp + 8]', codes_str: '03 7d 08'},
	{asm: 'add al, -3', codes_str: '04 fd'},
	{asm: 'add edi, -3', codes_str: '83 c7 fd'},
	{asm: 'add [edi-3], ch', codes_str: '00 6f fd'},
	{asm: 'add [edi-3], ecx', codes_str: '01 4f fd'},
	{asm: 'add al, [ebp-3]', codes_str: '02 45 fd'},
	{asm: 'add edi, [ebp-3]', codes_str: '03 7d fd'},
	{asm: 'add eax, [ebp+edx]', codes_str: '03 44 15 00'},
	{asm: 'add [ebp+edx], eax', codes_str: '01 44 15 00'}
];
	
for (var i in tests){
	var a = asm(0, tests[i].asm);
	console.log(tests[i].asm, 'expected:', tests[i].codes_str, 'got:', codes_TO_codes_str(a.codes), 'result:', tests[i].codes_str == codes_TO_codes_str(a.codes));
}*/

