'use strict';

//console.log(asm_map);


var reverse_reg3 = {0: 'eax', 1: 'ecx', 2: 'edx', 3: 'ebx', 4: 'esp', 5: 'ebp', 6: 'esi', 7: 'edi'};
var reverse_reg3B = {'000': 'eax', '001': 'ecx', '010': 'edx', '011': 'ebx', '100': 'esp', '101': 'ebp', '110': 'esi', '111': 'edi'};

var reverse_reg2 = {0: 'al', 1: 'cl', 2: 'dl', 3: 'bl', 4: 'ah', 5: 'ch', 6: 'dh', 7: 'bh'};
var reverse_reg2B = {'000': 'al', '001': 'cl', '010': 'dl', '011': 'bl', '100': 'ah', '101': 'ch', '110': 'dh', '111': 'bh'};

var reverse_sreg = {0: 'es', 1: 'cs', 2: 'ss', 3: 'ds'};
var sreg2B = {'es': '00', 'cs': '01', 'ss': '10', 'ds': '11'};
var reverse_sregB = {'000' : 'es', '001': 'cs', '010': 'ss', '011': 'ds', '100': 'fs', '101': 'gs'};



var registers = {'eax': 0, 'ecx': 1, 'edx': 2, 'ebx': 3, 'ebp': 5, 'esi': 6, 'edi': 7,
				 'ax': 0, 'cx': 1, 'dx': 2, 'bx': 3, 'bp': 5, 'si': 6, 'di': 7,
				 'al': 0, 'cl': 1, 'dl': 2, 'bl': 3, 'ah': 4, 'ch': 5, 'dh': 6, 'bh': 7};


var registersB = {'eax': '000', 'ecx': '001', 'edx': '010', 'ebx': '011', 'ebp': '101', 'esi': '110', 'edi': '111',
				  'ax': '000', 'cx': '001', 'dx': '010', 'bx': '011', 'bp': '101', 'si': '110', 'di': '111',
				  'al': '000', 'cl': '001', 'dl': '010', 'bl': '011', 'ah': '100', 'ch': '101', 'dh': '110', 'bh': '111',
				  'es': '000', 'cs': '001', 'ss': '010', 'ds': '011', 'fs': '100', 'gs': '101'};
			  
			  
var bitsize = {'eax': 32, 'ecx': 32, 'edx': 32, 'ebx': 32, 'ebp': 32, 'esi': 32, 'edi': 32,
			   'ax': 16, 'cx': 16, 'dx': 16, 'bx': 16, 'bp': 16, 'si': 16, 'di': 16,
			   'al': 8, 'cl': 8, 'dl': 8, 'bl': 8, 'ah': 8, 'ch': 8, 'dh': 8, 'bh': 8};
			   

var manual_build_instructions = ['bound', 'les', 'lds'];


function div(val, by) // в js нету деления нацело. Шок
{
    return (val - val % by) / by;
}

function neg_sB(s)
{
	var hex_s = false;
	
	if (s.substr(s.length - 1, 1) == 'h') {
		hex_s = true;
		
		s = int_to_sB(parse_int(s));
	}
	
	
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
	
	
	if (hex_s) {
		s1 = to_hex(s1).replace(/\s/g, '');
		s1 += 'h';
	}
	
	return s1;
}

function int_to_sB(i, n) // i - знаковое число, n - разрядность (8, 16, 32)
{
	if (n < 32) {
		var lim = 1 << (n - 1);
		
		if (i < -lim || i >= lim) 
			return 'Out of borders';
	} else {
		var lim = ~(1 << (n - 1));
		
		if (i < -lim - 1 || i > lim)
			return 'Out of borders';
	}
	
	var s = '';
	var sign = i < 0 ? 1 : 0;
	var i_orig = i;
	
	i = Math.abs(i);
	
	for (var k = 0; k < n - 1; k++) {
		
		s = i % 2 + s;
		i = div(i, 2);
		
	}
	
	s = (i_orig == -lim ? '1' : '0') + s;
	
	if (sign)
		s = neg_sB(s);
	
	return s;
}

function uint_to_sB(i, n) // i - беззнаковое число, i - разрядность
{
	var lim = 1 << n;
	
	if (i >= lim || i < 0)
		return 'Out of borders';
	
	var s = '';
	
	for (var k = 0; k < n; k++) {
		
		s = i % 2 + s;
		i = div(i, 2);
		
	}
	
	return s;
}

function parse_int(s)
{
	var bases = {'b': 2, 'o': 8, 'q': 8, 'h': 16, 'd': 10};
	
	var base = bases[s[s.length - 1]]; 
	
	var negative = false;
	
	
	if(base == undefined)
		base = 10;
	else
		s = s.substring(0, s.length - 1);
	
	if (s[0] == '-') {
		negative = true;
		s = s.substring(1);
	} else if (s[0] == '+')
		s = s.substring(1);
	
	
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
	
	return (negative ? -res : res);	
}

function hex_to_sB(hex_s)
{
	var convert_dict = {'0': '0000', '1': '0001', '2': '0010', '3': '0011', '4': '0100', 
						'5': '0101', '6': '0110', '7': '0111', '8': '1000', '9': '1001',
						'a': '1010', 'b': '1011', 'c': '1100', 'd': '1101', 'e': '1110', 'f': '1111'};
	
	var res = '';
	
	for (var d of hex_s) {
		res += convert_dict[d];
	}
	
	return res;
}

/* maybe other day...

function sB_to_hex(bin_s)
{
	var convert_dict = {'0000': '0', '0001': '1', '0010': '2', '0011': '3', '0100': '4',
						'0101': '5', '0110': '6', '0111': '7', '1000': '8', '1001': '9',
						'1010': 'a', '1011': 'b', '1100': 'c', '1101': 'd', '1110': 'e', '1111': 'f'};
	
	var ost = bin_s.length % 4;
	var res = '';
	
	if (ost != 0)
		while (4 - ost > 0) {
			bin_s = '0' + bin_s;
			ost++;
		}
	
	for (var i = 0; i < bin_s.length; i += 4) {
		var d = bin_s.substr(i, 4);
		
		res += convert_dict[d];
	}
	
	return res;
}

function abs_hexB(hex_s)
{
	var sB = hex_to_sB(hex_s);
	
	return sB_to_hex(sB[0] == '1' ? neg_sB(sB) : sB);
}
*/
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

function canonic(s)
{
	if (s.match(/([a-zA-Z0-9]|\+|\-|\*|\:|\.|\[|\]|\s|\,)+/)[0] != s)
		return {err: 'Недопустимый символ в команде'};
	
	s = s.replace(/\[/g, ' [').replace(/\[\s+/g, ' [').replace(/\s+\]/g, ']').replace(/\]\s+/g, ']').replace(/\s+\+/g, '+').replace(/\+\s+/g, '+').replace(/,/g, ', ').replace(/\s+/g, ' ').trim().toLowerCase();
	return s;
}

function cmd_explode(cmd_text)
{
	var space = cmd_text.indexOf(' ');
	
	if(space == -1) // checking non-operand command
		return [cmd_text];
	
	var cmd = [cmd_text.substring(0, space)]
	
	var ops = cmd_text.substring(space + 1).split(', ')
	
	if(ops.length > 2)
		return {err: 'Параметров должно быть не больше двух.'};
	
	return cmd.concat(ops);
}

function byte_cost(number) // для знаковых чисел!!!
{
	var res = 0;
	var pow = 8;
	var border = 0; // [-lim - 1; lim]
	var ans = false;
	
	do {
		res++;
		border = (1 << (pow - 1)) - 1;
		
		if (number >= -border - 1 && number <= border)
			ans = true;
		
		pow *= 2;
		
	} while (!ans && pow < 32)
	
	if (!ans) { // heavy artillery
		border = ~(1 << 31);
		
		if (number >= -border - 1 && number <= border) {
			ans = true;
			res = 4;
		}
	}

	if (ans)
		return res;
	else
		console.log('wtf?');
	
	return 0;
}

function ubyte_cost(number) // для беззнаковых чисел
{
	var res = 0;
	var pow = 8;
	var border = 0; // [0; lim]
	var ans = false;
	
	do {
		res++;
		border = (1 << pow) - 1;
		
		if (number <= border)
			ans = true;
		
		pow *= 2;
		
	} while (!ans && pow < 32)
	
	if (!ans) { // heavy artillery
		border = ~(1 << 31) * 2;
		
		if (number <= border) {
			ans = true;
			res = 4;
		}
	}

	if (ans)
		return res;
	else
		console.log('wtf?');
	
	return 0;
}

function cut_mem_address(mem_text) // '...[mem_text]...'
{
	// /^(eax|ecx|edx|ebx|ebp|esi|edi)/
	mem_text = mem_text.replace(/\s/g, '');
	
	
	if (/^(eax|ecx|edx|ebx|ebp|esi|edi)$/.test(mem_text)) // reg32
		if (mem_text != 'ebp')
			return {adr_type: 'reg',
					mod: '00',
					r_m: registersB[mem_text]};
		else
			return {adr_type: 'reg+disp',
					mod: '01',
					r_m: registersB[mem_text],
					d_c_str: '00'};
	
	if (/^(eax|ecx|edx|ebx|ebp|esi|edi)(\+|\-)([a-h0-9])+$/.test(mem_text)) { // reg32+disp8/32
		
		var disp = mem_text.substring(3);
		var size;
		
		disp = parse_int(disp);
		
		
		if (typeof disp == 'string')
			return {err: disp};
		
		
		size = byte_cost(disp);
		
		
		if (size > 4)
			return {err: "Слишком большое смещение адреса"};
		
		
		size = size > 1 ? 4 : 1;
		
		return {adr_type: 'reg+disp',
				mod: (byte_cost(disp) == 1 ? '01' : '10'),
				r_m: registersB[mem_text.substr(0, 3)],
				d_c_str: to_reverse_hex(int_to_sB(disp, 8 * size))};
				
	}
	
	if (/^(\+|\-|)(\d|\w)+$/.test(mem_text)) { // disponly
		
		var disp;
		var size;
		
		disp = parse_int(mem_text);
		
		
		if (typeof disp == 'string')
			return {err: disp};
		
		
		size = byte_cost(disp);
		
		
		if (size > 4)
			return {err: "Слишком большое смещение адреса"};
		
		
		size = 4;
		
		
		return {adr_type: 'disponly',
				mod: '00',
				r_m: '101',
				d_c_str: to_reverse_hex(int_to_sB(disp, 8 * size))};
				
	}
	
	
	// Here comes SIB byte :)
	var convert_scale = {'1': '00', '2': '01', '4': '10', '8': '11'};
	
	
	if (/^(eax|ecx|edx|ebx|ebp|esi|edi)\+(eax|ecx|edx|ebx|ebp|esi|edi)(\*\d)?$/.test(mem_text)) { // reg32 + reg32*n
		
		var reg1, reg2, n;
		
		reg1 = mem_text.substr(0, 3);
		reg2 = mem_text.substr(4, 3);
		n = mem_text.substr(8, 1);
		
		
		if (convert_scale[n] == undefined) {
			
			if (n.match(/\d/) == null)
				n = '1';
			else
				return {err: "Неверная адресация памяти"};
			
		}
		
		
		if (reg1 == 'ebp')
			return {adr_type: 'disp+reg+reg*n',
					mod: '01',
					r_m: '100',
					sib: to_hex(convert_scale[n] + registersB[reg2] + registersB[reg1]),
					d_c_str: '00'};
			
		
		
		return {adr_type: 'reg+reg*n',
				mod: '00',
				r_m: '100',
				sib: to_hex(convert_scale[n] + registersB[reg2] + registersB[reg1])};
				
	}
	
	if (/^(\+|\-|)[\d\w]+\+(eax|ecx|edx|ebx|ebp|esi|edi)\+(eax|ecx|edx|ebx|ebp|esi|edi)(\*\d)?$/.test(mem_text)) { // disp8/32 + reg32 + reg32*n
		
		var plus;
		var reg1, reg2, n;
		var disp;
		var size;
		
		
		plus = mem_text.indexOf('+', 1);
		
		
		disp = mem_text.substring(0, plus);
		reg1 = mem_text.substr(plus + 1, 3);
		reg2 = mem_text.substr(plus + 5, 3);
		n = mem_text.substring(mem_text.length - 1);
		
		
		if (convert_scale[n] == undefined) {
			
			if (n.match(/\d/) == null)
				n = '1';
			else
				return {err: "Неверная адресация памяти"};
			
		}
		
		
		disp = parse_int(disp);
		
		
		if (typeof disp == 'string')
			return {err: disp};
		
		
		size = byte_cost(disp);
		
		
		if (size > 4)
			return {err: "Размер смещения не соответствует размеру регистра"};
		
		
		size = size > 1 ? 4 : 1;
		
		return {adr_type: 'disp+reg+reg*n',
				mod: size == 1 ? '01' : '10',
				r_m: '100',
				sib: to_hex(convert_scale[n] + registersB[reg2] + registersB[reg1]),
				d_c_str: to_reverse_hex(int_to_sB(disp, 8 * size))};
				
	}
	
	if (/^(\+|\-|)[\d\w]+\+(eax|ecx|edx|ebx|ebp|esi|edi)(\*\d)?$/.test(mem_text)) { // disp + reg32*n
		
		var plus;
		var reg2, n;
		var disp;
		var size;
		
		
		plus = mem_text.indexOf('+', 1);
		
		
		disp = mem_text.substring(0, plus);
		reg2 = mem_text.substr(plus + 1, 3);
		n = mem_text.substring(mem_text.length - 1);
		
		
		if (convert_scale[n] == undefined) {
			
			if (n.match(/\d/) == null)
				n = '1';
			else
				return {err: "Неверная адресация памяти"};
			
		}
		
		
		disp = parse_int(disp);
		
		
		if (typeof disp == 'string')
			return {err: disp};
		
		
		size = byte_cost(disp);
		
		
		if (size > 4)
			return {err: "Размер смещения не соответствует размеру регистра"};
		
		
		size = 4;
		
		return {adr_type: 'disp+reg*n',
				mod: '00',
				r_m: '100',
				sib: convert_scale[n] + registersB[reg2] + '101',
				d_c_str: to_reverse_hex(int_to_sB(disp, 8 * size))};
		
	}
	
	
	return {err: "Неверная адресация памяти"};
}

function cut_temp_op(op_str) // 'op\d=operand'
{
	var type;
	var size;
	
	op_str = op_str.substring(4);
	
	type = op_str.match(/[a-z]+/g);
	
	
	if (type == null && op_str.match(/\d+/) == op_str)
		
		return {type: [op_str]};
	
	else if (type == null)
		
		return {err: "С шаблоном что-то не так"};
	
	else if (type[0] != 'ptr') {
		
		var gpr = ['eax', 'ecx', 'edx', 'ebx', 'esp', 'ebp', 'esi', 'edi',
				   'ax', 'cx', 'dx', 'bx', 'sp', 'bp', 'si', 'di',
				   'al', 'cl', 'dl', 'bl', 'ah', 'ch', 'dh', 'bh'];
		var sgr = ['es', 'cs', 'ss', 'ds', 'fs', 'gs'];
		
		
		if (gpr.indexOf(type[0]) != -1) {
			
			type = [type[0]];
			size = [bitsize[type[0]]];
			
		} else if (sgr.indexOf(type[0]) != -1) {
			
			type = [type[0]];
			size = [16];
			
		} else {
			
			if (type[0] != 'sreg') {
				
				size = op_str.match(/\d+/g);
				
				size = size == null ? ['depends on other'] : size.map(item => parse_int(item));
				
			} else 
				
				size = [16];
			
		}
		
	} else {
		
		var bsize, dsize;
		
		bsize = op_str.match(/\d+\:/)[0];
		bsize = parse_int(bsize.substring(0, bsize.length - 1));
		
		dsize = op_str.match(/\:\d+(\/\d+)*/)[0].substring(1).split('/');
		dsize = dsize.map(item => parse_int(item));
		
		return {type: type,
				bsize: bsize,
				dsize: dsize};
		
	}
	
	return {type: type,
			size: size};
}

function get_operand(opd_text) // mem, reg, ptr, moffs, rel
{
	if (opd_text.indexOf(':') != -1) { // ptr
	
		if (opd_text.indexOf('+') != -1 || opd_text.indexOf('-') != -1)
			return {err: "Неверная адресация"};
	
	
		var disp, base;
		var dsize, bsize;
		var del = opd_text.indexOf(':');
		
		base = opd_text.substring(del);
		disp = opd_text.substring(del + 1);
		
		base = parse_int(base);
		disp = parse_int(disp);
		
		
		if (typeof base == 'string')
			return {err: disp};
		
		if (typeof disp == 'string')
			return {err: disp};
		
		
		bsize = ubyte_cost(base);
		disp = ubyte_cost(disp);
		
		
		if (bsize > 2)
			return {err: "Неверная адресация"};
		
		if (dsize > 2)
			return {err: "Неверная адресация"};
		
		
		return {type: ['ptr'],
				b_size: 16,
				d_size: 32,
				data: to_reverse_hex(int_to_sB(base, 16) + int_to_sB(disp, 32))};
				
	}
	
	
	if (/^byte/.test(opd_text) || /^dword/.test(opd_text) || /^\[/.test(opd_text)) { // just m

		var space = opd_text.indexOf(' ');
		var l_sq = opd_text.indexOf('[');
		var r_sq = opd_text.indexOf(']');
		var size;
		
		
		if (l_sq == -1 || r_sq == -1 || (space == -1 && opd_text[0] != '['))
			return {err: 'Неверный операнд'};
		
		
		if (opd_text[0] != '[') {
			size = opd_text.substring(0, space);
			size = size == 'byte' ? 8 : 32;
		} else {
			size = 'depends on other';
		}
		
		
		var addr = opd_text.substring(l_sq + 1, r_sq);
		
		
		if (addr == '') 
			return {err: 'Неопределенный адрес в памяти'};
		
		
		var mem_adr = cut_mem_address(addr);
		
		
		if (mem_adr.err != undefined)
			return {err: mem_adr.err};
		
		
		var type = ['m'];
		
		if (mem_adr.type == 'disponly')
			type.push('moffs');
		
		return Object.assign({type: type, size: size}, mem_adr);
		
	} else { // reg or imm
	
		if (opd_text.match(/(\[|\]|\s)/))
			return {err: 'Неверный операнд'};
	
	
		var rg = opd_text.match(/^(eax|ecx|edx|ebx|ebp|esi|edi|ax|cx|dx|bx|bp|si|di|ah|al|ch|cl|dh|dl|bh|bl|es|cs|ss|ds|fs|gs)$/);
		
		if (!rg) { // just imm
		
			var sgn = opd_text.match(/^(\+|\-)/);
			
			var imm = parse_int(opd_text);
			
			
			if (typeof imm == "string") 
				return {err: imm};
			
			
			var size = 8 * byte_cost(imm);
			size = size == 8 ? [8, 32] : [size];
			
			
			return {type: ['imm', 'rel', imm.toString()], 
					size: size, 
					value: imm};
			
		} else { // just reg
		
			rg = rg[0]; // make rg just string
			
			if (/^(es|cs|ss|ds|fs|gs)$/.test(rg))
				return {type: [rg, 'sreg'],
						size: 16,
						mod: '11',
						r_m: registersB[rg]};

			return {type: [rg, 'r'], 
					size: bitsize[rg], 
					mod: '11', 
					r_m: registersB[rg]};
			
		}
		
	}
}

function get_template(instr, address, instr_ops)
{
	var templates = asm_map[instr]; //.sort(cmpTemp); // code true_op_count op_start reg_value? op1? op2? op3? temp
	var copy_str;
	
	var key1;
	var found_suit_temp;
	
	var space;
	var str_ops;
	var temp_op;
	var visible_ops_count, ops_pos;
	var copy_ops;
	
	
	if (templates == undefined)
		return {err: "Неизвестная команда"};
	
	
	for (var i = 0; i < templates.length; i++) { // сопоставление шаблона
		
		str_ops = templates[i].match(/op\d=([a-z0-9]|\:|\/|\&)+/g);
		copy_str = templates[i];
		
		
		copy_ops = [];
		for (var el of instr_ops)
			copy_ops.push(Object.assign({}, el));
		
		
		space = copy_str.indexOf(' ');
		copy_str = copy_str.substring(space + 1);
		
		space = copy_str.indexOf(' ');
		visible_ops_count = parse_int(copy_str[0]);
		copy_str = copy_str.substring(space + 1);
		ops_pos = parse_int(copy_str[0]);
		
		
		if (visible_ops_count == instr_ops.length) {
			
			key1 = true; // key1 = true => полное совпадение команд
			
			for (var j = 0; j < visible_ops_count && key1; j++) { // проход по операндам команд
				
				temp_op = cut_temp_op(str_ops[j + ops_pos]);
				found_suit_temp = false;
				
				
				for (var k = 0; k < temp_op.type.length && !found_suit_temp; k++) // проход по возможным типам шаблона операнда
					if (instr_ops[j].type.indexOf(temp_op.type[k]) != -1) {
						
						if (temp_op.type[k] == 'rel') {
							
							copy_ops[j].value -= address + 1;
							copy_ops[j].size = 8 * byte_cost(copy_ops[j].value);
							copy_ops[j].size = copy_ops[j].size <= 16 ? [copy_ops[j].size, 32] : [copy_ops[j].size];
							
						}
						
						
						if (temp_op.bsize == undefined && 
							(temp_op.size.indexOf(instr_ops[j].size) != -1 || 
							 (temp_op.type[k] == 'm' || temp_op.type[k] == 'moffs') && instr_ops[j].size == 'depends on other') ||
							 temp_op.type[k] == 'imm' && instr_ops[j].size.indexOf(temp_op.size[temp_op.size.length - 1]) != -1 ||
							 temp_op.type[k] == 'rel' && copy_ops[j].size.indexOf(temp_op.size[temp_op.size.length - 1]) != -1) {
							
							copy_ops[j].type = temp_op.type[k];
							
							
							if (instr_ops[j].size == 16 && temp_op.size.indexOf(32) != -1)
								
								copy_ops[j].size = 32;
								
							else if (temp_op.type[k] == 'imm' || temp_op.type[k] == 'rel' || instr_ops[j].size == 'depends on other') {
							
								copy_ops[j].size = temp_op.size[temp_op.size.length - 1];
								
							}
							
							
							found_suit_temp = true;
							
						} else if (temp_op.bsize != undefined) // 16:16/32
							
							found_suit_temp = true;
						
					}
				
								
				if (!found_suit_temp)
					key1 = false;
				
			}
			
			if (key1) {
				return {temp: templates[i], ops: copy_ops};
			}
			
		}
		
	}
	
	/*
	for (var el of instr_ops) // I want goto(
		if (el.type[0] == 'imm' && el.size == 8) {
		
			el.size = 32;
			var ans = get_template(instr, address, instr_ops);
			
			if (ans.err != undefined)
				return {err: ans.err};
			else
				return ans;
			
		}
	*/
	
	
	return {err: "Неизвестная команда"};
}

function asm_cut_str(str) // from 'code true_op_count op_start reg_value? op1? op2? op3? temp' outputs {code, reg_value, temp}
{
	var code;
	var ptr;
	var convert_reg = {'0': '000', '1': '001', '2': '010', '3': '011', '4': '100', '5': '101', '6': '110', '7': '111'};
	var reg_value = null;
	
	ptr = str.indexOf(' ');
	code = str.substring(0, ptr);
	
	ptr = str.indexOf('reg_value='); // 'reg_value='.length = 10
	
	if (ptr != -1) {
		
		reg_value = str.substr(ptr + 10, 1);
		
		if (reg_value != 'r')
			reg_value = convert_reg[reg_value];
		
	}
	
	ptr = str.indexOf('-'); // Если где-то не произошла магия, то всегда любой шаблон начинается с -
	str = str.substring(ptr);
	
	return {code: code, 
			reg_value: reg_value, 
			temp: str.split(' ')};
}

function get_code_bit(temp0, code, bit)
{
	var bit_pos = temp0.indexOf(bit);
	
	code = hex_to_sB(code);
	
	if (bit_pos == -1)
		return '-';
	else
		return code[bit_pos];
}

function make_mrm(op, reg_value)
{
	return to_hex(op.mod + reg_value + op.r_m) + (op.sib != undefined ? ' ' + op.sib : '') + (op.d_c_str != undefined ? ' ' + op.d_c_str : '');
}

//console.log(asm_map);
// {err, codes_str, codes, cmd_text}
function asm(address, cmd_text)
{
	// дополнительная функция для укорочения кода.
	var make_ans = function(param) // typeof param == string <=> param === err
	{
		if (typeof param == 'string')
			return {address: address,
					err: param,
					codes: [],
					cmd_text: cmd_text};
		else
			return {address: address,
					err: '',
					codes: param,
					cmd_text: cmd_text};
	};
	
	
	cmd_text = canonic(cmd_text); 
	
	
	if (cmd_text.err != undefined) 
		return make_ans(cmd_text.err);
		
		
	var cmd_shapes = cmd_explode(cmd_text);
	
	
	if(cmd_shapes.err != undefined) // если в структуре есть ошибка, или  > 2 аргумента
		return make_ans(cmd_shapes.err);


	// cmd_shapes = ['<instruction>', <operands>]
	
	
	var ops = [];
	for (var i = 1; i < cmd_shapes.length; i++) {
		ops.push(get_operand(cmd_shapes[i]));
		
		if (ops[i - 1].err != undefined) 
			return make_ans(ops[i - 1].err);
	}
	
	
	if (manual_build_instructions.indexOf(cmd_shapes[0]) == -1) {
		
		var cmd_template = get_template(cmd_shapes[0], address, ops); // finds template and fully determines operands
		
		if (cmd_template.err != undefined)
			return make_ans(cmd_template.err);
		
		ops = cmd_template.ops;
		cmd_template = cmd_template.temp;
		
		var cmd_obj = asm_cut_str(cmd_template);
		
		var used_ops = [];
		
		
		if (cmd_obj.temp.length >= 2) {
		
			if (cmd_obj.temp[1] == 'mrm' || cmd_obj.temp[1] == 'nnn') {
				
				var direction_bit = get_code_bit(cmd_obj.temp[0], cmd_obj.code, 'd');
				direction_bit = direction_bit == '-' ? '1' : direction_bit;
				
				if (direction_bit == '1' && ops.length >= 2 && (ops[0].type != 'm' && ops[0].type != 'moffs')) {
					
					var buf = ops[0];
					ops[0] = ops[1];
					ops[1] = buf;
					
				} // now first op is R/M operand
				
				
				if (cmd_obj.reg_value == 'r')
					cmd_obj.reg_value = ops[1].r_m;
				
				
				cmd_obj.code += ' ' + make_mrm(ops[0], cmd_obj.reg_value);
				
			} else if (cmd_obj.temp[1][0] == 'd') { // means data
				
				for (var i = 0; i < ops.length; i++)
					if (ops[i].type == 'imm') {
						
						cmd_obj.code += ' ' + to_reverse_hex(int_to_sB(ops[i].value, ops[i].size));
						
						used_ops.push(i);
						
						break;
						
					}
					
				
			} else if (cmd_obj.temp[1][0] == 'a'){ // addr
				
				for (var i = 0; i < ops.length; i++)
					if (ops[i].type == 'rel') { // all instr with 'rel' op has 1 + rel_size / 8 bytes;
						
						if (byte_cost(ops[i].value - ops[i].size - 1) > ops[i].size)
							return make_ans("Слишком далёкий переход в команде.");
						
						cmd_obj.code += ' ' + to_reverse_hex(int_to_sB(ops[i].value - ops[i].size / 8, ops[i].size));
						
						break;
					} else if (ops[i].type == 'ptr') {
						
						cmd_obj.code += ' ' + ops[i].data;
						
					} else {
						return make_ans("Это что за покемон?");
					}
				
			} else
				
				cmd_obj.code += ' ' + to_hex(cmd_obj.temp[1]);
		
		}
		
		if (cmd_obj.temp.length == 3) {
		
			// always data
			for (var i = 0; i < ops.length; i++)
				if (ops[i].type == 'imm' && used_ops.indexOf(i) == -1) {
					cmd_obj.code += ' ' + to_reverse_hex(int_to_sB(ops[i].value, ops[i].size));
					
					break;
				}
		
		}
		
		
		return make_ans(codes_str_TO_codes(cmd_obj.code));
	}
	
	return {err: 'Неизвестная команда', codes: []};
}




function read_rev_data(adr, disp, len, sep)
{
	var res = '';
	
	for (var i = adr + disp; i < adr + disp + len; i++) {
		res = hex(exe[i]) + sep + res;
	}
	
	res = res.substring(0, res.length - sep.length);
	
	return res;
};

function read_data(adr, disp, len, sep)
{
	var res = '';
	
	for (var i = adr + disp; i < adr + disp + len; i++) {
		res = res + sep + hex(exe[i]);
	}
	
	res = res.substring(sep.length);
	
	return res;
};


/*
	returns object:
	type:
		'err' - error
			value
			
		'reg' - register
			value: 'register_str'
			size: register_size
		
		'r' - undefined register, depends on command
			size: []
			
		'r/m' - undefined r/m operand, could be reg or memory, depends on command
			size: []
			
		'rel' == 'imm' - immediate operand, constant, depends on command
			size: []
			
		'ptr' - full address
			base_size: 16
			disp_size: 32
		'c' - constant
			value: 'string'
*/
function cut_op(op_str)
{
	var type = op_str.match(/^[a-z]+/i);
	
	
	if (type == null)
		return {type: 'err', value: 'Что-то пошло не так с ' + op_str};
	
	
	type = type[0];
	
	var size;
	
	
	if (type == op_str) {
		size = bitsize[op_str];
	
		return {type: 'reg', value: op_str, size: size};
	}
	
	
	switch (type)
	{
		case 'r':
		
			if (op_str[1] == '/') { // op_str = 'r/m8/16/32' or anything like this
				size = op_str.substring(3).split('/').map(item => parse_int(item));
				
				if (size.length > 1)  // deleting 16 bit
					size = size[1];
				else
					size = size[0];
				
				return {type: 'r/m', size: size};
			}
			
			size = op_str.substring(1).split('/').map(item => parse_int(item));
			
			if (size.length > 1)  // deleting 16 bit
				size = size[1];
			else
				size = size[0];
			
			return {type: 'r', size: size};
			
		break;
		
		case 'm':
			return {type: 'm', size: 32};
		break;
		
		case 'rel':
		case 'imm':
		
			size = op_str.substring(3).split('/').map(item => parse_int(item));
			
			if (size.length > 1)  // deleting 16 bit
				size = size[1];
			else
				size = size[0];
			
			return {type: type, size: size};
			
		break;
		
		case 'moffs':
			
			size = op_str.substring(5).split('/').map(item => parse_int(item));
			
			if (size.length > 1)  // deleting 16 bit
				size = size[1];
			else
				size = size[0];
			
			return {type: 'moffs', size: size}; // moffs
			
		break;
		
		case 'sreg':
		
			return {type: 'sreg'};	
		
		break;
		
		case 'ptr':
		
			return {type: 'ptr', base_size: 16, disp_size: 32};
			
		break;
	}
	
	if (op_str.match(/^\d+$/)[0] == op_str)
		return {type: 'c', value: op_str};
	
	return {type: 'err', value: 'Что-то пошло не так с ' + op_str};
}


function get_mrm_op(adr, op) // return {value, add_codes, add_str}
{
	var mrm = uint_to_sB(exe[adr + 1], 8);
				
	var mod = mrm.substr(0, 2);
	var r_m = mrm.substr(5, 3); // r_m1 != '100' outside of the function
	
	
	switch (mod)
	{
		case '00':
			
			if (r_m != '101')
				return {value: (op.size == 8 ? 'byte' : 'dword') + ' [' + reverse_reg3B[r_m] + ']', add_codes: 0, add_str: ''};
			else { // 32-bit Displacement mode
				var disp_value = read_rev_data(adr, 2, 4, '') + 'h';
				disp_value = (disp_value[0] == '1' ? ('-' + neg_sB(disp_value.substring(1))) : disp_value);
				
				return {value: (op.size == 8 ? 'byte' : 'dword') + ' [' + disp_value + ']', add_codes: 4, add_str: read_data(adr, 2, 4, ' ')};
			}
			
		break;
		
		case '01':
		case '10':
			
			var disp_size = (mod == '01' ? 1 : 4);
			var disp_value = read_rev_data(adr, 2, disp_size, '') + 'h';
			disp_value = (disp_value[0] == '1' ? ('-' + neg_sB(disp_value.substring(1))) : '+' + disp_value);
		
			return {value: (op.size == 8 ? 'byte' : 'dword') + ' [' + reverse_reg3B[r_m] + disp_value + ']', add_codes: disp_size, add_str: read_data(adr, 2, disp_size, ' ')};
			
		break;
		
		case '11':
		
			if (op.type == 'sreg')
				return {value: reverse_sregB[r_m], add_codes: 0, add_str: ''};
			else if (op.size == 8)
				return {value: reverse_reg2B[r_m], add_codes: 0, add_str: ''};
			else
				return {value: reverse_reg3B[r_m], add_codes: 0, add_str: ''};
			
		break;
	}
}	


/*
	Возвращает объект, содержащий следующие параметры:
	cmd - непосредственно имя инструкции (add, mov)
	
	c_str - начальная двоичная байтовая строка, содержит только изначальный байт команды,
			который в последствие должен быть дополнен до полной команды
			
	c_len = 1 - число байт в команде, раз изначально c_str - 1 байт, то и значение c_len очевидно
	
	temp - шаблон команды. Задаёт все её возможные виды, с учётом первого байта
!!!	Максимальная длина шаблона команды - 3 слова !!!

	true_op_count - число видимых операндов
	op_start - номер операнда, с которого надо начинать смотреть
	
*p*	reg_value - значение REG байта MRM
	
*p*	op1 - first operand of the instruction

*p*	op2 - second operand of the instruction

*p*	op3 - third operand of the instruction

	*p* means it may not be (if it isn't, then variable has value null
*/

function disasm_cut_str(str, adr) // str == 'cmd true_op_count op_start reg_value? op1? op2? op3? temp'
{
	var c_len = 1;
	var op_count = 0;
	var temp;
	var true_op_count = 0;
	var op_ptr = 0;
	var reg_value = null;
	var op1 = null;
	var op2 = null;
	var op3 = null;
	var c_str;
	var cmd;
	
	
	var space = 0;
	
	
	c_str = hex(exe[adr]); // exe[adr] - command opcode
	
	space = str.indexOf(' ');
	cmd = str.substring(0, space);
	
	
	str = str.substring(space + 1); // now it's 'true_op_count op_start reg_value? op1? op2? op3? temp'
	
	true_op_count = parse_int(str[0]);
	op_count = true_op_count;
	
	space = str.indexOf(' ');
	str = str.substring(space + 1); // now it's 'op_start reg_value? op1? op2? op3? temp'
	
	op_ptr = parse_int(str[0]);
	
	space = str.indexOf(' ');
	str = str.substring(space + 1); // now it's 'reg_value? op1? op2? op3? temp'
	
	
	if (str.indexOf('reg_value=') != -1) {
		var p = str.indexOf('reg_value='); // 'reg_value='.length == 10
		
		reg_value = str.substr(p + 10, 1);
		
		if (reg_value != 'r')
			reg_value = parse_int(reg_value);
		
		space = str.indexOf(' ');
		str = str.substring(space + 1);
	}
	
	// now it's 'op1? op2? op3? temp'
	
	for (var i = 0; i < 3; i++) {
		
		var p = str.match(/op\d=/);
		
		if (p != null) {
			
			if (true_op_count > 0 && i == op_ptr) {
				var copy_str = str.substring(p.index + 4);
				
				space = copy_str.indexOf(' ');
				
				if (op1 == null)
					op1 = copy_str.substring(0, space);
				else if (op2 == null)
					op2 = copy_str.substring(0, space);
				else if (op3 == null)
					op3 = copy_str.substring(0, space);
				
				true_op_count--;
				op_ptr++;
			}
			
			space = str.indexOf(' ');
			str = str.substring(space + 1);
			
		}
		
	}
	
	
	// now str is 'temp'
	
	
	if (op1 != null)
		op1 = cut_op(op1);
	
	if (op2 != null)
		op2 = cut_op(op2);
	
	if (op3 != null)
		op3 = cut_op(op3);
	
	temp = str.split(' ');
	
	return {cmd: cmd, 
			c_str: c_str, 
			c_len: 1, 
			temp: temp,
			reg_value: reg_value,
			op_count: op_count,
			op1: op1, 
			op2: op2,
			op3: op3};
}


function disasm(address)
{
	var make_ans = function(cmd_obj)
	{
		return {address: address, cmd_text: cmd_obj.cmd, codes_str: cmd_obj.c_str, codes_len: cmd_obj.c_len};
	};
	
	
	var make_byte_ans = function()
	{
		return {address: address, cmd_text: 'db ' + hex(exe[adr]) + 'h', codes_str: hex(exe[adr]), codes_len: 1}
	};
	
	
	var adr = address - address0; // address0 - первый адрес в блоке кода
	
	if (adr >= PAGE) 
		return {address: address, cmd_text: '', codes_str: '', codes_len: 0};
	
	
//console.log(hex(exe[adr]));
	var str = disasm_map[hex(exe[adr])];
	
	if (!str)
		return make_byte_ans();
	
	
	var cmd_obj;
	
	if (str.length == 1) { // initializing cmd_obj
		cmd_obj = disasm_cut_str(str[0], adr);
	} else {
		var mrm = uint_to_sB(exe[adr + 1], 8);
		
		var true_reg_value = 'reg_value=' + parse_int(mrm.substr(2, 3) + 'b');
		
		for (var s of str) {
			if (s.indexOf(true_reg_value) != -1) {
				cmd_obj = disasm_cut_str(s, adr);
				break;
			}
		}
	}
	
	if (cmd_obj == undefined)
		return make_byte_ans();
	
		
	if (cmd_obj.temp.length == 1) {
		
		var chk = cmd_obj.temp[0].substring(5);
		
		
		if (chk == 'reg') { // there's no ----wreg
			cmd_obj.cmd += ' ' + cmd_obj.op1.value + (cmd_obj.op2 != null && cmd_obj.op2.type == 'reg' ? (', ' + cmd_obj.op2.value) : '');
			
			return make_ans(cmd_obj);
		}
		
		
		chk = cmd_obj.temp[0].substr(3, 2);
		
		
		if (chk == 'sr') {
			cmd_obj.cmd += ' ' + cmd_obj.op1.value;
			
			return make_ans(cmd_obj);
		}
		
		return make_ans(cmd_obj);
		
	}
	
	
	switch (cmd_obj.op_count)
	{
		case 1:
		
			if (cmd_obj.reg_value == null) { // only instructions with temp.length == 2, where 2nd is data or addr
					
				l_br = cmd_obj.temp[1].indexOf('(');
				
				var temp1_size = parse_int(cmd_obj.temp[1].substr(l_br + 1, 1));
				
				var temp1_value;
				
				if (cmd_obj.temp[1][l_br - 1] == 'a') { // data
					
					temp1_value = read_rev_data(adr, 1, temp1_size, '') + 'h';
					temp1_value = (temp1_value[0] == '1' ? ('-' + neg_sB(temp1_value.substring(1))) : temp1_value)
					
				} else { // addr
					temp1_value = read_rev_data(adr, 1, temp1_size, '') + 'h';
				}
				
				cmd_obj.c_len += temp1_size;
				
				
				if (cmd_obj.op1.type == 'rel') { // coms with address offset, like call, jmp and other
					temp1_value = (parse_int(temp1_value) + cmd_obj.c_len + address).toString(16) + 'h';
					
					cmd_obj.cmd += ' ' + temp1_value; 
				} else 
					cmd_obj.cmd += ' ' + (cmd_obj.op1.type != 'ptr' ? temp1_value : temp1_value.substr(0, 4) + ':' + temp1_value.substring(4));
				
				
				cmd_obj.c_str += ' ' + read_data(adr, 1, temp1_size, ' ');
				
				return make_ans(cmd_obj);
				
			} else {
				
				var mrm = uint_to_sB(exe[adr + 1], 8);
				
				var r_m = mrm.substr(5, 3);
				
				cmd_obj.c_len = 2;
				cmd_obj.c_str += ' ' + hex(exe[adr + 1]);
				
				if (r_m != '100') {
					
					cmd_obj.op1 = get_mrm_op(adr, cmd_obj.op1);
					
					if (cmd_obj.cmd == 'call' || cmd_obj.cmd == 'pop')
						cmd_obj.op1.value = cmd_obj.op1.value.substring(cmd_obj.op1.value.indexOf(' ') + 1);
					
					cmd_obj.c_len += cmd_obj.op1.add_codes;
					cmd_obj.c_str += (cmd_obj.op1.add_str != '' ? (' ' + cmd_obj.op1.add_str) : '');
					cmd_obj.cmd += ' ' + cmd_obj.op1.value;
					
					return make_ans(cmd_obj);
				
				} else {
					
					console.log("Disasm doesn't work with SIB byte");
					return make_byte_ans();
					
				}
			}
			
		break;
		
		case 2:
			
			if (cmd_obj.reg_value == null) { // temp.length == 2
				
				if (cmd_obj.temp[1] == '00001010') { // catching aam or aad
				
					cmd_obj.c_str += ' 0a';
					cmd_obj.c_len += 1;
					
					return make_ans(cmd_obj);
					
				}
				
				
				var l_br = cmd_obj.temp[1].indexOf('(');
				var temp1_size = parse_int(cmd_obj.temp[1].substr(l_br + 1, 1));
				var temp1_value = read_rev_data(adr, 1, temp1_size, '') + 'h';
				
				
				cmd_obj.c_len += temp1_size;
				cmd_obj.c_str += ' ' + read_data(adr, 1, temp1_size, ' ');
				
				
				if (cmd_obj.cmd.indexOf('loop') != -1 || 
				    cmd_obj.cmd == 'jecxz') { // catching loops, jecxz
				
					temp1_value = (temp1_value[0] == '1' ? ('-' + neg_sB(temp1_value.substring(1))) : temp1_value);
					cmd_obj.cmd += ' ' + (parse_int(temp1_value) + address + cmd_obj.c_len).toString(16) + 'h';
					
					return make_ans(cmd_obj);
					
				}
				
				
				if (cmd_obj.temp[1][l_br - 1] == 'a') {
					
					temp1_value = (temp1_value[0] == '1' ? ('-' + neg_sB(temp1_value.substring(1))) : temp1_value);
					
				}
				
				
				// other instructions has 2 visible operands
				if (cmd_obj.op1.type == 'reg') {
					
					cmd_obj.cmd += ' ' + cmd_obj.op1.value + ', ' + (cmd_obj.op2.type == 'moffs' ? ('[' + temp1_value + ']') : temp1_value);
					
				} else {
					
					if (cmd_obj.cmd != 'int')
						cmd_obj.cmd += ' ' + (cmd_obj.op1.type == 'moffs' ? ('[' + temp1_value + ']') : temp1_value) + ', ' + cmd_obj.op2.value;
					else
						cmd_obj.cmd += ' ' + temp1_value;
				}
				
				return make_ans(cmd_obj);
				
			} else {
				
				var mrm = uint_to_sB(exe[adr + 1], 8);
				var r_m = mrm.substr(5, 3);				
				
				cmd_obj.c_len = 2;
				cmd_obj.c_str += ' ' + hex(exe[adr + 1]);
				
				
				if (cmd_obj.reg_value == 'r') {
					
					var reg = mrm.substr(2, 3);
					
					var direction_bit = cmd_obj.temp[0].indexOf('d');
					direction_bit = (direction_bit == -1 ? '1' : uint_to_sB(exe[adr], 8).substr(direction_bit, 1));
					
					if (direction_bit == '1') { // op1 == REG, op2 == R/M
						var buf = cmd_obj.op1;
						cmd_obj.op1 = cmd_obj.op2;
						cmd_obj.op2 = buf;
					}
					
					// op1 == R/M, op2 == REG
						
					if (cmd_obj.op2.type == 'sreg')
						cmd_obj.op2.value = reverse_sregB[reg];
					else if (cmd_obj.op2.size == 8)
						cmd_obj.op2.value = reverse_reg2B[reg];
					else
						cmd_obj.op2.value = reverse_reg3B[reg];
					
					
					if (r_m != '101') {
						
						cmd_obj.op1 = get_mrm_op(adr, cmd_obj.op1);
						
						cmd_obj.c_len += cmd_obj.op1.add_codes;
						cmd_obj.c_str += (cmd_obj.op1.add_str != '' ? (' ' + cmd_obj.op1.add_str) : '');
						cmd_obj.cmd += ' ' + (direction_bit == '1' ? cmd_obj.op2.value : cmd_obj.op1.value) + ', ' + (direction_bit == '1' ? cmd_obj.op1.value : cmd_obj.op2.value);
						
						return make_ans(cmd_obj);
					
					} else {
						
						console.log("Disasm doesn't work with SIB byte");
						return make_byte_ans();
						
					}
					
				} else {
				
					if (cmd_obj.temp.length == 2) { // 2nd op is already defined
						
						if (r_m != '101') {
						
							cmd_obj.op1 = get_mrm_op(adr, cmd_obj.op1);
							
							cmd_obj.c_len += cmd_obj.op1.add_codes;
							cmd_obj.c_str += (cmd_obj.op1.add_str != '' ? (' ' + cmd_obj.op1.add_str) : '');
							cmd_obj.cmd += ' ' + cmd_obj.op1.value + ', ' + cmd_obj.op2.value;
							
							return make_ans(cmd_obj);
						
						} else {

							console.log("Disasm doesn't work with SIB byte");
							return make_byte_ans();
						
						}
						
					} else { // length == 3
						
						if (r_m != '101') {
						
							cmd_obj.op1 = get_mrm_op(adr, cmd_obj.op1);
							
							cmd_obj.c_len += cmd_obj.op1.add_codes;
							cmd_obj.c_str += (cmd_obj.op1.add_str != '' ? (' ' + cmd_obj.op1.add_str) : '');
							
							
							var l_br = cmd_obj.temp[2].indexOf('(');
							var temp2_size = parse_int(cmd_obj.temp[2].substr(l_br + 1, 1));
							
							
							cmd_obj.op2.value = read_rev_data(adr, cmd_obj.c_len, temp2_size, '') + 'h';
							
							cmd_obj.c_str += ' ' + read_data(adr, cmd_obj.c_len, temp2_size, ' ');
							cmd_obj.c_len += temp2_size;
							cmd_obj.cmd += ' ' + cmd_obj.op1.value + ', ' + cmd_obj.op2.value;
							
							return make_ans(cmd_obj);
						
						} else {

							console.log("Disasm doesn't work with SIB byte");
							return make_byte_ans();
						
						}
						
					}
				
				}
				
			}
			
		break;
		
		case 3:
			
			switch (cmd_obj.cmd)
			{
				case 'div':
				case 'idiv':
					
					var mrm = uint_to_sB(exe[adr + 1], 8);
					var r_m = mrm.substr(5, 3);				
					
					cmd_obj.c_len = 2;
					cmd_obj.c_str += ' ' + hex(exe[adr + 1]);
					
					if (r_m != '101') {
						
						if (cmd_obj.op3.type == 'reg') // f6
							
							cmd_obj.op1 = get_mrm_op(adr, {type: 'r/m', size: 8});
							
						else
							
							cmd_obj.op1 = get_mrm_op(adr, cmd_obj.op3);
						
						cmd_obj.c_len += cmd_obj.op1.add_codes;
						cmd_obj.c_str += (cmd_obj.op1.add_str != '' ? (' ' + cmd_obj.op1.add_str) : '');
						cmd_obj.cmd += ' ' + cmd_obj.op1.value;
						
						return make_ans(cmd_obj);
						
					} else {
						
						console.log("disasm doesn't work with SIB byte");
						return make_byte_ans();
						
					}
				
				break;
				
				case 'mul':
				case 'imul':
				
					var mrm = uint_to_sB(exe[adr + 1], 8);
					var r_m = mrm.substr(5, 3);				
					
					cmd_obj.c_len = 2;
					cmd_obj.c_str += ' ' + hex(exe[adr + 1]);
					
					if (r_m != '101') {
							
						cmd_obj.op3 = get_mrm_op(adr, cmd_obj.op3);
						
						cmd_obj.c_len += cmd_obj.op3.add_codes;
						cmd_obj.c_str += (cmd_obj.op3.add_str != '' ? (' ' + cmd_obj.op3.add_str) : '');
						cmd_obj.cmd += ' ' + cmd_obj.op3.value;
						
						return make_ans(cmd_obj);
						
					} else {
						
						console.log("disasm doesn't work with SIB byte");
						return make_byte_ans();
						
					}
				
				break;
				
				case 'bound':
				
					var mrm = uint_to_sB(exe[adr + 1], 8);
					var r_m = mrm.substr(5, 3);
					var reg = mrm.substr(2, 3);
					
					cmd_obj.c_len = 2;
					cmd_obj.c_str += ' ' + hex(exe[adr + 1]);
				
					if (r_m != '101') {
						
						cmd_obj.op1.value = reverse_reg3B[reg];
							
						cmd_obj.op2 = get_mrm_op(adr, cmd_obj.op2);
						
						cmd_obj.c_len += cmd_obj.op2.add_codes;
						cmd_obj.c_str += (cmd_obj.op2.add_str != '' ? (' ' + cmd_obj.op2.add_str) : '');
						cmd_obj.cmd += ' ' + cmd_obj.op1.value + ' ' + cmd_obj.op2.value;
						
						return make_ans(cmd_obj);
						
					} else {
						
						console.log("disasm doesn't work with SIB byte");
						return make_byte_ans();
						
					}
				
				break;
				
				case 'enter':
				
					var temp1_size = 2;
					var temp2_size = 1;
					
					var temp1_value = read_rev_data(adr, 1, temp1_size, '');
					var temp2_value = read_rev_data(adr, 1 + temp1_size, temp2_size, '');
					
					cmd_obj.c_len += temp1_size + temp2_size;
					cmd_obj.c_str += ' ' + read_data(adr, 1, temp1_size, ' ') + ' ' + read_data(adr, 1 + temp1_size, temp2_size, ' ');
					cmd_obj.cmd += ' ' + temp1_value + 'h, ' + temp2_value + 'h';
					
					return make_ans(cmd_obj);
				
				break;
				
				default:
				
					console.log("Coming soon, maybe");
					console.log(cmd_obj);
					return make_byte_ans();
				
				break;
			}
			
		break;
	}
	
	
	return make_byte_ans();
}; 


// ТЕСТИРОВАНИЕ 
var tests = [
	{asm: 'inc al', codes_str: 'fe c0'},
	{asm: 'inc cl', codes_str: 'fe c1'},
	{asm: 'inc dl', codes_str: 'fe c2'},
	{asm: 'inc bl', codes_str: 'fe c3'},
	{asm: 'inc ah', codes_str: 'fe c4'},
	{asm: 'inc ch', codes_str: 'fe c5'},
	{asm: 'inc dh', codes_str: 'fe c6'},
	{asm: 'inc bh', codes_str: 'fe c7'},
	{asm: 'inc eax', codes_str: '40'},
	{asm: 'inc ecx', codes_str: '41'},
	{asm: 'inc edx', codes_str: '42'},
	{asm: 'inc ebx', codes_str: '43'},
	{asm: 'inc byte [eax]', codes_str: 'fe 00'},
	{asm: 'inc dword [ebp + 100]', codes_str: 'ff 45 64'},
	{asm: 'inc dword [ebp + 555h]', codes_str: 'ff 85 55 05 00 00'},
	{asm: 'inc ebp', codes_str: '45'},
	{asm: 'add al, [ebp-3]', codes_str: '02 45 fd'},
	{asm: 'add edi, [ebp-3]', codes_str: '03 7d fd'},
	{asm: 'add eax, [ebp+edx]', codes_str: '03 44 15 00'},
	{asm: 'add [ebp+edx], eax', codes_str: '01 44 15 00'},
	
	{asm: 'add al, [ebp-129]', codes_str: '02 85 7f ff ff ff'},
	{asm: 'add al, [ebp+128]', codes_str: '02 85 80 00 00 00'},
	{asm: 'add al, [ebp-1129]', codes_str: '02 85 97 fb ff ff'},
	{asm: 'add al, [ebp+1128]', codes_str: '02 85 68 04 00 00'},
	
	{asm: 'inc byte [ebp-129]', codes_str: 'fe 85 7f ff ff ff'},
	{asm: 'inc dword [ebp+128]', codes_str: 'ff 85 80 00 00 00'},
	{asm: 'inc byte [ebp-1129]', codes_str: 'fe 85 97 fb ff ff'},
	{asm: 'inc dword [ebp+1128]', codes_str: 'ff 85 68 04 00 00'},
	
	{asm: 'dec byte [edi-129]', codes_str: 'fe 8f 7f ff ff ff'},
	{asm: 'dec dword [esi+128]', codes_str: 'ff 8e 80 00 00 00'},
	{asm: 'dec byte [ecx-1129]', codes_str: 'fe 89 97 fb ff ff'},
	{asm: 'dec dword [edx+1128]', codes_str: 'ff 8a 68 04 00 00'},
	
	{asm: 'neg ah', codes_str: 'f6 dc'},
	{asm: 'neg cl', codes_str: 'f6 d9'},
	{asm: 'neg ebx', codes_str: 'f7 db'},
	{asm: 'neg esi', codes_str: 'f7 de'},
	{asm: 'neg 7;', codes_str: 'Не должно компилироваться'},
	{asm: 'neg byte [7]', codes_str: 'f6 1d 07 00 00 00'},
	{asm: 'neg dword [7]', codes_str: 'f7 1d 07 00 00 00'},
	{asm: 'neg byte [-3]', codes_str: 'f6 1d fd ff ff ff'},
	{asm: 'neg dword [-3]', codes_str: 'f7 1d fd ff ff ff'},
	{asm: 'nop', codes_str: '90'},
	{asm: 'neg byte [eax]', codes_str: 'f6 18'},
	{asm: 'neg byte[esi]', codes_str: 'f6 1e'},
	{asm: 'neg byte[eax+2]', codes_str: 'f6 58 02'},
	{asm: 'neg byte[esi+2]', codes_str: 'f6 5e 02'},
	{asm: 'neg byte[eax-3]', codes_str: 'f6 58 fd'},
	{asm: 'neg byte[esi-3]', codes_str: 'f6 5e fd'},
	{asm: 'neg byte[ebx+255]', codes_str: 'f6 9b ff 00 00 00'},
	{asm: 'neg byte[edi+255]', codes_str: 'f6 9f ff 00 00 00'},
	{asm: 'neg byte[ecx-254]', codes_str: 'f6 99 02 ff ff ff'},
	{asm: 'neg byte[edi-254]', codes_str: 'f6 9f 02 ff ff ff'},
	{asm: 'neg byte[edx+1255]', codes_str: 'f6 9a e7 04 00 00'},
	{asm: 'neg byte[edi+1255]', codes_str: 'f6 9f e7 04 00 00'},
	{asm: 'neg byte[ebp-1254]', codes_str: 'f6 9d 1a fb ff ff'},
	{asm: 'neg byte[esi-1254]', codes_str: 'f6 9e 1a fb ff ff'},
	{asm: 'neg byte[eax+ebp]', codes_str: 'f6 1c 28'},
	{asm: 'neg byte[esi+edx]', codes_str: 'f6 1c 16'},
	{asm: 'neg [esi-edx];', codes_str: 'Не должно компилироваться'},
	{asm: 'neg byte[esi+ecx]', codes_str: 'f6 1c 0e'},
	{asm: 'nop', codes_str: '90'},
	{asm: 'neg dword [eax]', codes_str: 'f7 18'},
	{asm: 'neg dword [esi]', codes_str: 'f7 1e'},
	{asm: 'neg dword [eax+2]', codes_str: 'f7 58 02'},
	{asm: 'neg dword [esi+2]', codes_str: 'f7 5e 02'},
	{asm: 'neg dword [eax-3]', codes_str: 'f7 58 fd'},
	{asm: 'neg dword [esi-3]', codes_str: 'f7 5e fd'},
	{asm: 'neg dword [ebx+255]', codes_str: 'f7 9b ff 00 00 00'},
	{asm: 'neg dword [edi+255]', codes_str: 'f7 9f ff 00 00 00'},
	{asm: 'neg dword [ecx-254]', codes_str: 'f7 99 02 ff ff ff'},
	{asm: 'neg dword [edi-254]', codes_str: 'f7 9f 02 ff ff ff'},
	{asm: 'neg dword [edx+1255]', codes_str: 'f7 9a e7 04 00 00'},
	{asm: 'neg dword [edi+1255]', codes_str: 'f7 9f e7 04 00 00'},
	{asm: 'neg dword [ebp-1254]', codes_str: 'f7 9d 1a fb ff ff'},
	{asm: 'neg dword [esi-1254]', codes_str: 'f7 9e 1a fb ff ff'},
	{asm: 'neg dword [eax+ebp]', codes_str: 'f7 1c 28'},
	{asm: 'neg dword [esi+edx]', codes_str: 'f7 1c 16'},
	{asm: 'neg dword [esi-edx];', codes_str: 'Не должно компилироваться'},
	{asm: 'neg dword [esi+ecx]', codes_str: 'f7 1c 0e'},
	
	{asm: 'mov al, [eax + 1h]', codes_str: '8a 40 01'},
	{asm: 'mov [eax + 1h], al', codes_str: '88 40 01'},
	{asm: 'mov al, 1', codes_str: 'b0 01'},
	{asm: 'mov ah, -30', codes_str: 'b4 e2'},
	{asm: 'mov eax, 1157h', codes_str: 'b8 57 11 00 00'},
	{asm: 'mov eax, [eax]', codes_str: '8b 00'},
	{asm: 'mov ecx, [ebp]', codes_str: '8b 4d 00'},
	{asm: 'mov [ebx + abcdh], 44fedch', codes_str: 'c7 83 cd ab 00 00 dc fe 44 00'},
	{asm: 'mov eax, ecx', codes_str: '89 c8'},
	{asm: 'mov [ecx], 10', codes_str: 'c6 01 0a'},
	
	{asm: 'call byte [eax + 1]', codes_str: 'Не должно компилироваться'}, 
	{asm: 'call 1', codes_str: 'e8 fd ff ff ff'},
	{asm: 'call -1', codes_str: 'e8 fb ff ff ff'},
	{asm: 'call 8FFAh', codes_str: 'e8 f6 8f 00 00'},
	{asm: 'ret', codes_str: 'c3'},
	{asm: 'ret 0', codes_str: 'c2 00 00'},
	{asm: 'ret 1', codes_str: 'c2 01 00'},
	{asm: 'ret 2', codes_str: 'c2 02 00'},
];
/*
for (var i in tests){
	var a = asm(0, tests[i].asm);
	console.log(tests[i].asm, 'expected:', tests[i].codes_str, 'got:', codes_TO_codes_str(a.codes), 'result:', tests[i].codes_str == codes_TO_codes_str(a.codes));
}
*/                    